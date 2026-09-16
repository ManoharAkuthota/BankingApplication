package Banking.Application.dashboard.service;

import Banking.Application.account.repository.AccountRepository;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.branch.entity.Branch;
import Banking.Application.branch.repository.BranchRepository;
import Banking.Application.common.exception.ResourceNotFoundException;
import Banking.Application.dashboard.dto.BranchSummaryDto;
import Banking.Application.dashboard.dto.DashboardSummaryResponse;
import Banking.Application.transaction.dto.TransactionResponse;
import Banking.Application.transaction.entity.Transaction;
import Banking.Application.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BranchRepository branchRepository;

    private User getLoggedInUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));
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
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(String roleParam, Long branchIdParam, Long userIdParam) {
        User loggedInUser = getLoggedInUser();
        String actualRole = loggedInUser.getRole().toUpperCase();

        // Determine effective query context (Only Admin can override params)
        String role = actualRole;
        Long branchId = null;
        Long userId = null;

        if (actualRole.equals("ADMIN")) {
            if (roleParam != null && !roleParam.trim().isEmpty()) {
                role = roleParam.toUpperCase();
            }
            branchId = branchIdParam;
            userId = userIdParam;
        } else {
            if (actualRole.equals("MANAGER") || actualRole.equals("EMPLOYEE")) {
                if (loggedInUser.getBranch() != null) {
                    branchId = loggedInUser.getBranch().getId();
                }
            } else if (actualRole.equals("CUSTOMER")) {
                userId = loggedInUser.getId();
            }
        }

        DashboardSummaryResponse.DashboardSummaryResponseBuilder builder = DashboardSummaryResponse.builder()
                .role(role);

        if (role.equals("ADMIN")) {
            // Global statistics
            builder.activeUsersCount(userRepository.countByStatus("ACTIVE"));
            builder.activeAccountsCount(accountRepository.countByStatus("ACTIVE"));
            builder.totalBalance(accountRepository.sumBalanceByStatus("ACTIVE"));
            builder.totalDepositVolume(transactionRepository.sumDepositVolumeGlobal());
            builder.totalWithdrawalVolume(transactionRepository.sumWithdrawalVolumeGlobal());
            builder.totalTransferVolume(transactionRepository.sumTransferVolumeGlobal());

            // Recent global transactions (top 5)
            List<TransactionResponse> recent = transactionRepository.findAll(
                    PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "timestamp"))
            ).stream().map(this::mapToResponse).collect(Collectors.toList());
            builder.recentTransactions(recent);

            // Branch summaries
            List<Branch> branches = branchRepository.findAll();
            List<BranchSummaryDto> branchSummaryDtos = branches.stream().map(branch -> {
                BigDecimal totalDepositVolume = transactionRepository.sumDepositVolumeByBranchId(branch.getId());
                BigDecimal totalBalance = accountRepository.sumBalanceByStatusAndBranchId("ACTIVE", branch.getId());
                long activeUsers = userRepository.countByStatusAndBranchId("ACTIVE", branch.getId());
                long activeAccounts = accountRepository.countByStatusAndUserBranchId("ACTIVE", branch.getId());

                return BranchSummaryDto.builder()
                        .branchId(branch.getId())
                        .branchName(branch.getName())
                        .branchCode(branch.getBranchCode())
                        .activeUsersCount(activeUsers)
                        .activeAccountsCount(activeAccounts)
                        .totalBalance(totalBalance)
                        .totalDepositVolume(totalDepositVolume)
                        .build();
            }).collect(Collectors.toList());

            builder.branchSummaries(branchSummaryDtos);

        } else if (role.equals("MANAGER") || role.equals("EMPLOYEE")) {
            Branch targetBranch = null;
            if (branchId != null) {
                targetBranch = branchRepository.findById(branchId).orElse(null);
            } else if (loggedInUser.getBranch() != null) {
                targetBranch = loggedInUser.getBranch();
            }

            // Fallback for Admin switching to Manager/Employee view without branch selected
            if (targetBranch == null && actualRole.equals("ADMIN")) {
                List<Branch> branches = branchRepository.findAll();
                if (!branches.isEmpty()) {
                    targetBranch = branches.get(0);
                }
            }

            if (targetBranch == null) {
                throw new RuntimeException("Access denied: You do not belong to any branch.");
            }

            builder.branchName(targetBranch.getName());
            builder.branchCode(targetBranch.getBranchCode());

            // Branch isolated statistics
            builder.activeUsersCount(userRepository.countByStatusAndBranchId("ACTIVE", targetBranch.getId()));
            builder.activeAccountsCount(accountRepository.countByStatusAndUserBranchId("ACTIVE", targetBranch.getId()));
            builder.totalBalance(accountRepository.sumBalanceByStatusAndBranchId("ACTIVE", targetBranch.getId()));
            builder.totalDepositVolume(transactionRepository.sumDepositVolumeByBranchId(targetBranch.getId()));
            builder.totalWithdrawalVolume(transactionRepository.sumWithdrawalVolumeByBranchId(targetBranch.getId()));
            builder.totalTransferVolume(transactionRepository.sumTransferVolumeByBranchId(targetBranch.getId()));

            // Recent branch transactions (top 5)
            List<TransactionResponse> recent = transactionRepository.findByBranchId(
                    targetBranch.getId(),
                    PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "timestamp"))
            ).stream().map(this::mapToResponse).collect(Collectors.toList());
            builder.recentTransactions(recent);

        } else if (role.equals("CUSTOMER")) {
            User targetCustomer = null;
            if (userId != null) {
                targetCustomer = userRepository.findById(userId).orElse(null);
            } else {
                targetCustomer = loggedInUser;
            }

            // Fallback for Admin switching to Customer view without customer selected
            if (targetCustomer == null && actualRole.equals("ADMIN")) {
                List<User> customers = userRepository.findByRoleAndStatus("CUSTOMER", "ACTIVE");
                if (!customers.isEmpty()) {
                    targetCustomer = customers.get(0);
                }
            }

            if (targetCustomer == null) {
                throw new RuntimeException("Access denied: Customer user not found.");
            }

            // Customer personal statistics
            builder.activeAccountsCount(accountRepository.countByStatusAndUserId("ACTIVE", targetCustomer.getId()));
            builder.totalBalance(accountRepository.sumBalanceByStatusAndUserId("ACTIVE", targetCustomer.getId()));
            builder.totalDepositVolume(transactionRepository.sumDepositVolumeByUserId(targetCustomer.getId()));
            builder.totalWithdrawalVolume(transactionRepository.sumWithdrawalVolumeByUserId(targetCustomer.getId()));
            builder.totalTransferVolume(transactionRepository.sumTransferVolumeByUserId(targetCustomer.getId()));

            // Recent customer transactions (top 5)
            List<TransactionResponse> recent = transactionRepository.findByUserId(
                    targetCustomer.getId(),
                    PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "timestamp"))
            ).stream().map(this::mapToResponse).collect(Collectors.toList());
            builder.recentTransactions(recent);
        } else {
            throw new RuntimeException("Access denied: Invalid user role.");
        }

        return builder.build();
    }
}
