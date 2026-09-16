package Banking.Application.account.repository;

import Banking.Application.account.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    Page<Account> findByUserId(Long userId, Pageable pageable);

    boolean existsByAccountNumber(String accountNumber);

    Page<Account> findByStatus(String status, Pageable pageable);

    Page<Account> findByStatusAndUserBranchId(String status, Long branchId, Pageable pageable);

    long countByStatus(String status);

    long countByStatusAndUserBranchId(String status, Long branchId);

    long countByStatusAndUserId(String status, Long userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.status = :status")
    java.math.BigDecimal sumBalanceByStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.status = :status AND a.user.branch.id = :branchId")
    java.math.BigDecimal sumBalanceByStatusAndBranchId(@Param("status") String status, @Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.status = :status AND a.user.id = :userId")
    java.math.BigDecimal sumBalanceByStatusAndUserId(@Param("status") String status, @Param("userId") Long userId);
}
