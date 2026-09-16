package Banking.Application.transaction.service;

import Banking.Application.account.entity.Account;
import Banking.Application.account.repository.AccountRepository;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.common.exception.ResourceNotFoundException;
import Banking.Application.transaction.dto.DepositRequest;
import Banking.Application.transaction.dto.TransactionResponse;
import Banking.Application.transaction.dto.TransferRequest;
import Banking.Application.transaction.dto.WithdrawalRequest;
import Banking.Application.transaction.entity.Transaction;
import Banking.Application.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import Banking.Application.audit.service.AuditLogService;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    private User getLoggedInUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));
    }

    private boolean isStaff(User user) {
        if (user == null || user.getRole() == null) return false;
        String role = user.getRole().toUpperCase();
        return role.equals("ADMIN") || role.equals("MANAGER") || role.equals("EMPLOYEE");
    }

    private String generateTransactionNumber() {
        String txnNum;
        do {
            long num = (long) (Math.random() * 900_000_000_000L) + 100_000_000_000L;
            txnNum = "TXN" + num;
        } while (transactionRepository.findByTransactionNumber(txnNum).isPresent());
        return txnNum;
    }

    private TransactionResponse mapToResponse(Transaction txn) {
        return TransactionResponse.builder()
                .id(txn.getId())
                .transactionNumber(txn.getTransactionNumber())
                .amount(txn.getAmount())
                .transactionType(txn.getTransactionType())
                .status(txn.getStatus())
                .description(txn.getDescription())
                .timestamp(txn.getTimestamp())
                .sourceAccountNumber(txn.getSourceAccount() != null ? txn.getSourceAccount().getAccountNumber() : null)
                .targetAccountNumber(txn.getTargetAccount() != null ? txn.getTargetAccount().getAccountNumber() : null)
                .build();
    }

    @Override
    @Transactional
    public TransactionResponse deposit(DepositRequest request) {
        User loggedInUser = getLoggedInUser();

        // Only bank staff can process deposits
        if (!isStaff(loggedInUser)) {
            throw new RuntimeException("Access denied: Only bank staff can process cash deposits.");
        }

        Account target = accountRepository.findByAccountNumber(request.getTargetAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Target account not found"));

        if (!target.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("Target account is not active");
        }

        // Branch check for staff (except Admin)
        if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
            if (loggedInUser.getBranch() == null || target.getUser().getBranch() == null ||
                !loggedInUser.getBranch().getId().equals(target.getUser().getBranch().getId())) {
                throw new RuntimeException("Access denied: Target account belongs to a different branch.");
            }
        }

        // Apply deposit
        target.setBalance(target.getBalance().add(request.getAmount()));
        accountRepository.save(target);

        Transaction txn = Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .amount(request.getAmount())
                .transactionType("DEPOSIT")
                .status("SUCCESS")
                .description(request.getDescription())
                .timestamp(LocalDateTime.now())
                .targetAccount(target)
                .build();

        Transaction saved = transactionRepository.save(txn);

        if (request.getAmount().compareTo(new java.math.BigDecimal("10000")) >= 0) {
            auditLogService.log(
                    "HIGH_VALUE_TRANSACTION",
                    "Deposit of " + request.getAmount() + " to account " + target.getAccountNumber(),
                    null,
                    "Txn: " + saved.getTransactionNumber() + ", Description: " + request.getDescription(),
                    target.getUser().getBranch()
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransactionResponse withdraw(WithdrawalRequest request) {
        User loggedInUser = getLoggedInUser();

        Account source = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));

        if (!source.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("Source account is not active");
        }

        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in account");
        }

        // Authorization checks
        if (loggedInUser.getRole().toUpperCase().equals("CUSTOMER")) {
            if (!source.getUser().getId().equals(loggedInUser.getId())) {
                throw new RuntimeException("Access denied: You can only withdraw from your own accounts.");
            }
        } else {
            // Staff branch check (except Admin)
            if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
                if (loggedInUser.getBranch() == null || source.getUser().getBranch() == null ||
                    !loggedInUser.getBranch().getId().equals(source.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: Account belongs to a different branch.");
                }
            }
        }

        // Apply withdrawal
        source.setBalance(source.getBalance().subtract(request.getAmount()));
        accountRepository.save(source);

        Transaction txn = Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .amount(request.getAmount())
                .transactionType("WITHDRAWAL")
                .status("SUCCESS")
                .description(request.getDescription())
                .timestamp(LocalDateTime.now())
                .sourceAccount(source)
                .build();

        Transaction saved = transactionRepository.save(txn);

        if (request.getAmount().compareTo(new java.math.BigDecimal("10000")) >= 0) {
            auditLogService.log(
                    "HIGH_VALUE_TRANSACTION",
                    "Withdrawal of " + request.getAmount() + " from account " + source.getAccountNumber(),
                    null,
                    "Txn: " + saved.getTransactionNumber() + ", Description: " + request.getDescription(),
                    source.getUser().getBranch()
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public TransactionResponse transfer(TransferRequest request) {
        User loggedInUser = getLoggedInUser();

        Account source = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));

        Account target = accountRepository.findByAccountNumber(request.getTargetAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Target account not found"));

        if (!source.getStatus().equals("ACTIVE") || !target.getStatus().equals("ACTIVE")) {
            throw new RuntimeException("Both source and target accounts must be active");
        }

        if (source.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in source account");
        }

        // Authorization checks
        if (loggedInUser.getRole().toUpperCase().equals("CUSTOMER")) {
            if (!source.getUser().getId().equals(loggedInUser.getId())) {
                throw new RuntimeException("Access denied: You can only transfer from your own accounts.");
            }
        } else {
            // Staff branch check (except Admin)
            if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
                if (loggedInUser.getBranch() == null || source.getUser().getBranch() == null ||
                    !loggedInUser.getBranch().getId().equals(source.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: Source account belongs to a different branch.");
                }
            }
        }

        // Apply transfer
        source.setBalance(source.getBalance().subtract(request.getAmount()));
        target.setBalance(target.getBalance().add(request.getAmount()));
        accountRepository.save(source);
        accountRepository.save(target);

        Transaction txn = Transaction.builder()
                .transactionNumber(generateTransactionNumber())
                .amount(request.getAmount())
                .transactionType("TRANSFER")
                .status("SUCCESS")
                .description(request.getDescription())
                .timestamp(LocalDateTime.now())
                .sourceAccount(source)
                .targetAccount(target)
                .build();

        Transaction saved = transactionRepository.save(txn);

        if (request.getAmount().compareTo(new java.math.BigDecimal("10000")) >= 0) {
            auditLogService.log(
                    "HIGH_VALUE_TRANSACTION",
                    "Transfer of " + request.getAmount() + " from account " + source.getAccountNumber() + " to account " + target.getAccountNumber(),
                    null,
                    "Txn: " + saved.getTransactionNumber() + ", Description: " + request.getDescription(),
                    source.getUser().getBranch()
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactionHistory(String accountNumber, int page, int size) {
        User loggedInUser = getLoggedInUser();
        Page<Transaction> txns;

        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp");

        if (accountNumber != null && !accountNumber.trim().isEmpty()) {
            Account account = accountRepository.findByAccountNumber(accountNumber)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

            // Verify permissions
            if (loggedInUser.getRole().toUpperCase().equals("CUSTOMER")) {
                if (!account.getUser().getId().equals(loggedInUser.getId())) {
                    throw new RuntimeException("Access denied to view history for this account.");
                }
            } else if (!loggedInUser.getRole().toUpperCase().equals("ADMIN")) {
                if (loggedInUser.getBranch() == null || account.getUser().getBranch() == null ||
                    !loggedInUser.getBranch().getId().equals(account.getUser().getBranch().getId())) {
                    throw new RuntimeException("Access denied: Account belongs to a different branch.");
                }
            }

            txns = transactionRepository.findBySourceAccountNumberOrTargetAccountNumber(accountNumber, accountNumber, PageRequest.of(page, size, sort));
        } else {
            // Omitted accountNumber: return summary history based on role
            String role = loggedInUser.getRole().toUpperCase();
            if (role.equals("ADMIN")) {
                txns = transactionRepository.findAll(PageRequest.of(page, size, sort));
            } else if (role.equals("CUSTOMER")) {
                txns = transactionRepository.findByUserId(loggedInUser.getId(), PageRequest.of(page, size, sort));
            } else {
                // MANAGER or EMPLOYEE
                if (loggedInUser.getBranch() == null) {
                    throw new RuntimeException("Access denied: You do not belong to any branch.");
                }
                txns = transactionRepository.findByBranchId(loggedInUser.getBranch().getId(), PageRequest.of(page, size, sort));
            }
        }

        return txns.map(this::mapToResponse);
    }
}
