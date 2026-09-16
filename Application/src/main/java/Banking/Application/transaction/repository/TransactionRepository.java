package Banking.Application.transaction.repository;

import Banking.Application.transaction.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionNumber(String transactionNumber);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.sourceAccount IS NOT NULL AND t.sourceAccount.accountNumber = :sourceAccountNumber) OR " +
           "(t.targetAccount IS NOT NULL AND t.targetAccount.accountNumber = :targetAccountNumber)")
    Page<Transaction> findBySourceAccountNumberOrTargetAccountNumber(@Param("sourceAccountNumber") String sourceAccountNumber, @Param("targetAccountNumber") String targetAccountNumber, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.sourceAccount IS NOT NULL AND t.sourceAccount.user.branch.id = :branchId) OR " +
           "(t.targetAccount IS NOT NULL AND t.targetAccount.user.branch.id = :branchId)")
    Page<Transaction> findByBranchId(@Param("branchId") Long branchId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.sourceAccount IS NOT NULL AND t.sourceAccount.user.id = :userId) OR " +
           "(t.targetAccount IS NOT NULL AND t.targetAccount.user.id = :userId)")
    Page<Transaction> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'DEPOSIT' AND t.status = 'SUCCESS'")
    java.math.BigDecimal sumDepositVolumeGlobal();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'DEPOSIT' AND t.status = 'SUCCESS' AND t.targetAccount.user.branch.id = :branchId")
    java.math.BigDecimal sumDepositVolumeByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'DEPOSIT' AND t.status = 'SUCCESS' AND t.targetAccount.user.id = :userId")
    java.math.BigDecimal sumDepositVolumeByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'WITHDRAWAL' AND t.status = 'SUCCESS'")
    java.math.BigDecimal sumWithdrawalVolumeGlobal();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'WITHDRAWAL' AND t.status = 'SUCCESS' AND t.sourceAccount.user.branch.id = :branchId")
    java.math.BigDecimal sumWithdrawalVolumeByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'WITHDRAWAL' AND t.status = 'SUCCESS' AND t.sourceAccount.user.id = :userId")
    java.math.BigDecimal sumWithdrawalVolumeByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'TRANSFER' AND t.status = 'SUCCESS'")
    java.math.BigDecimal sumTransferVolumeGlobal();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'TRANSFER' AND t.status = 'SUCCESS' AND (t.sourceAccount.user.branch.id = :branchId OR t.targetAccount.user.branch.id = :branchId)")
    java.math.BigDecimal sumTransferVolumeByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'TRANSFER' AND t.status = 'SUCCESS' AND (t.sourceAccount.user.id = :userId OR t.targetAccount.user.id = :userId)")
    java.math.BigDecimal sumTransferVolumeByUserId(@Param("userId") Long userId);
}
