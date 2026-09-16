package Banking.Application.audit.repository;

import Banking.Application.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a LEFT JOIN User u ON a.actionBy = u.username WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:branchId IS NULL OR (a.branch IS NOT NULL AND a.branch.id = :branchId)) AND " +
           "(:actionBy IS NULL OR LOWER(a.actionBy) = LOWER(:actionBy)) AND " +
           "(:role IS NULL OR (u IS NOT NULL AND u.role = :role))")
    Page<AuditLog> findByFilters(
            @Param("action") String action,
            @Param("branchId") Long branchId,
            @Param("actionBy") String actionBy,
            @Param("role") String role,
            Pageable pageable
    );
}
