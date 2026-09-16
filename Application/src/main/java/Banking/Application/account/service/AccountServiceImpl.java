package Banking.Application.account.service;

import Banking.Application.account.dto.AccountRequest;
import Banking.Application.account.dto.AccountResponse;
import Banking.Application.account.dto.AccountUpdateRequest;
import Banking.Application.account.entity.Account;
import Banking.Application.account.repository.AccountRepository;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.common.exception.ResourceNotFoundException;
import Banking.Application.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    private User getLoggedInUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            // Generate a 12-digit random account number
            long number = (long) (Math.random() * 9_000_000_000_00L) + 1_000_000_000_00L;
            accountNumber = String.valueOf(number);
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }

    private AccountResponse mapToResponse(Account account) {
        Banking.Application.auth.dto.UserSummaryDto userSummary = Banking.Application.auth.dto.UserSummaryDto.builder()
                .id(account.getUser().getId())
                .username(account.getUser().getUsername())
                .email(account.getUser().getEmail())
                .phoneNumber(account.getUser().getPhoneNumber())
                .branchName(account.getUser().getBranch() != null ? account.getUser().getBranch().getName() : null)
                .branchCode(account.getUser().getBranch() != null ? account.getUser().getBranch().getBranchCode() : null)
                .ifscCode(account.getUser().getBranch() != null ? account.getUser().getBranch().getIfscCode() : null)
                .build();

        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .user(userSummary)
                .build();
    }

    private boolean isStaff(User user) {
        if (user == null || user.getRole() == null) return false;
        String role = user.getRole().toUpperCase();
        return role.equals("ADMIN") || role.equals("MANAGER") || role.equals("EMPLOYEE");
    }

    @Override
    @Transactional
    public AccountResponse createAccount(AccountRequest request) {
        User loggedInUser = getLoggedInUser();

        // Only staff roles are allowed to create/register bank accounts
        if (!isStaff(loggedInUser)) {
            throw new RuntimeException("Access denied: Customers cannot open bank accounts.");
        }

        if (request.getUserId() == null) {
            throw new RuntimeException("User ID is required to link the account to the customer");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        // Enforce branch compatibility check for non-admins
        if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
            if (loggedInUser.getBranch() == null || user.getBranch() == null ||
                !loggedInUser.getBranch().getId().equals(user.getBranch().getId())) {
                throw new RuntimeException("Access denied: You can only open accounts for customers in your own branch.");
            }
        }

        // Set status based on creator role
        String initialStatus = "ACTIVE";
        if (loggedInUser.getRole().toUpperCase().equals("EMPLOYEE")) {
            initialStatus = "PENDING_APPROVAL";
        }

        Account account = Account.builder()
                .accountNumber(generateUniqueAccountNumber())
                .accountType(request.getAccountType())
                .balance(request.getInitialBalance())
                .status(initialStatus)
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();
        Account saved = accountRepository.save(account);

        auditLogService.log(
                "ACCOUNT_CREATION",
                "Account " + saved.getAccountNumber(),
                null,
                "Type: " + saved.getAccountType() + ", Initial Balance: " + saved.getBalance() + ", Status: " + saved.getStatus(),
                saved.getUser().getBranch()
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getAccounts(Long userId, int page, int size) {
        User loggedInUser = getLoggedInUser();
        String role = loggedInUser.getRole().toUpperCase();

        if (userId != null) {
            // A specific user's accounts are requested
            // Allow if viewing own, or if the caller is staff
            if (!loggedInUser.getId().equals(userId)) {
                if (!isStaff(loggedInUser)) {
                    throw new RuntimeException("Access denied to view accounts for this user");
                }
                // Branch check for staff (except ADMIN)
                if (!role.equals("ADMIN")) {
                    User targetUser = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    if (loggedInUser.getBranch() == null || targetUser.getBranch() == null ||
                        !loggedInUser.getBranch().getId().equals(targetUser.getBranch().getId())) {
                        throw new RuntimeException("Access denied: You can only view accounts of users in your own branch.");
                    }
                }
            }
            Page<Account> accounts = accountRepository.findByUserId(userId, PageRequest.of(page, size));
            return accounts.map(this::mapToResponse);
        } else {
            // General query (userId is null)
            if (role.equals("CUSTOMER")) {
                // Customers see only their own accounts
                Page<Account> accounts = accountRepository.findByUserId(loggedInUser.getId(), PageRequest.of(page, size));
                return accounts.map(this::mapToResponse);
            } else if (role.equals("ADMIN")) {
                // Admins see all active accounts globally
                Page<Account> accounts = accountRepository.findByStatus("ACTIVE", PageRequest.of(page, size));
                return accounts.map(this::mapToResponse);
            } else {
                // Managers and Employees see active accounts for their branch
                if (loggedInUser.getBranch() == null) {
                    throw new RuntimeException("Access denied: You do not belong to any branch.");
                }
                Page<Account> accounts = accountRepository.findByStatusAndUserBranchId(
                        "ACTIVE",
                        loggedInUser.getBranch().getId(),
                        PageRequest.of(page, size)
                );
                return accounts.map(this::mapToResponse);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long id) {
        User user = getLoggedInUser();
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        // Enforce owner check or staff check
        if (!account.getUser().getId().equals(user.getId())) {
            if (!isStaff(user)) {
                throw new RuntimeException("Access denied to this account");
            }
            // Branch check for staff (except ADMIN)
            if (!user.getRole().toUpperCase().equals("ADMIN")) {
                if (user.getBranch() == null || account.getUser().getBranch() == null ||
                    !user.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: You can only view accounts in your own branch.");
                }
            }
        }

        return mapToResponse(account);
    }

    @Override
    @Transactional
    public AccountResponse updateAccount(Long id, AccountUpdateRequest request) {
        User user = getLoggedInUser();
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        String oldStatus = account.getStatus();

        // Enforce owner check or staff check
        if (!account.getUser().getId().equals(user.getId())) {
            if (!isStaff(user)) {
                throw new RuntimeException("Access denied to update this account");
            }
            // Branch check for staff (except ADMIN)
            if (!user.getRole().toUpperCase().equals("ADMIN")) {
                if (user.getBranch() == null || account.getUser().getBranch() == null ||
                    !user.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: You can only modify accounts in your own branch.");
                }
            }
        }

        account.setAccountType(request.getAccountType());
        account.setBalance(request.getBalance());
        account.setStatus(request.getStatus());

        Account updated = accountRepository.save(account);

        if (request.getStatus() != null && !request.getStatus().equalsIgnoreCase(oldStatus)) {
            auditLogService.log(
                    "ACCOUNT_STATUS_CHANGE",
                    "Account " + updated.getAccountNumber(),
                    oldStatus,
                    updated.getStatus(),
                    updated.getUser().getBranch()
            );
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public AccountResponse patchAccount(Long id, Banking.Application.account.dto.AccountPatchRequest request) {
        User user = getLoggedInUser();
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        String oldStatus = account.getStatus();

        // Enforce owner check or staff check
        if (!account.getUser().getId().equals(user.getId())) {
            if (!isStaff(user)) {
                throw new RuntimeException("Access denied to update this account");
            }
            // Branch check for staff (except ADMIN)
            if (!user.getRole().toUpperCase().equals("ADMIN")) {
                if (user.getBranch() == null || account.getUser().getBranch() == null ||
                    !user.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: You can only modify accounts in your own branch.");
                }
            }
        }

        if (request.getAccountType() != null) {
            account.setAccountType(request.getAccountType());
        }
        if (request.getBalance() != null) {
            account.setBalance(request.getBalance());
        }
        if (request.getStatus() != null) {
            String newStatus = request.getStatus().toUpperCase();
            if (newStatus.equals("ACTIVE") || newStatus.equals("REJECTED")) {
                if (!account.getStatus().equals("PENDING_APPROVAL")) {
                    throw new RuntimeException("Account is not in PENDING_APPROVAL status");
                }
                // Verify caller is MANAGER of the customer's branch or ADMIN
                boolean isAuthorized = false;
                if (user.getRole().toUpperCase().equals("ADMIN")) {
                    isAuthorized = true;
                } else if (user.getRole().toUpperCase().equals("MANAGER")) {
                    if (user.getBranch() != null && account.getUser().getBranch() != null &&
                        user.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                        isAuthorized = true;
                    }
                }
                if (!isAuthorized) {
                    throw new RuntimeException("Access denied: Only the branch manager or admin can approve/reject this account.");
                }
            }
            account.setStatus(newStatus);
        }

        Account updated = accountRepository.save(account);

        if (request.getStatus() != null && !request.getStatus().equalsIgnoreCase(oldStatus)) {
            auditLogService.log(
                    "ACCOUNT_STATUS_CHANGE",
                    "Account " + updated.getAccountNumber(),
                    oldStatus,
                    updated.getStatus(),
                    updated.getUser().getBranch()
            );
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getPendingAccounts(Long branchId, int page, int size) {
        User loggedInUser = getLoggedInUser();

        // Only ADMIN or MANAGER can view pending accounts
        if (!loggedInUser.getRole().toUpperCase().equals("ADMIN") && !loggedInUser.getRole().toUpperCase().equals("MANAGER")) {
            throw new RuntimeException("Access denied: Only managers and admins can view pending accounts.");
        }

        Long targetBranchId = branchId;
        if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
            if (loggedInUser.getBranch() == null) {
                throw new RuntimeException("Access denied: Manager does not belong to any branch.");
            }
            targetBranchId = loggedInUser.getBranch().getId();
        }

        Page<Account> accounts;
        if (targetBranchId != null) {
            accounts = accountRepository.findByStatusAndUserBranchId("PENDING_APPROVAL", targetBranchId, PageRequest.of(page, size));
        } else {
            accounts = accountRepository.findByStatus("PENDING_APPROVAL", PageRequest.of(page, size));
        }

        return accounts.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteAccount(Long id) {
        User user = getLoggedInUser();
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        // Enforce owner check or staff check
        if (!account.getUser().getId().equals(user.getId())) {
            if (!isStaff(user)) {
                throw new RuntimeException("Access denied to delete this account");
            }
            // Branch check for staff (except ADMIN)
            if (!user.getRole().toUpperCase().equals("ADMIN")) {
                if (user.getBranch() == null || account.getUser().getBranch() == null ||
                    !user.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: You can only delete accounts in your own branch.");
                }
            }
        }

        auditLogService.log(
                "ACCOUNT_DELETION",
                "Account " + account.getAccountNumber(),
                "Type: " + account.getAccountType() + ", Balance: " + account.getBalance() + ", Status: " + account.getStatus(),
                "Deleted",
                account.getUser().getBranch()
        );

        accountRepository.delete(account);
    }
}
