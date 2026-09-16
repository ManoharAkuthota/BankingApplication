package Banking.Application.auth.repository;

import Banking.Application.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    org.springframework.data.domain.Page<User> findByRole(String role, org.springframework.data.domain.Pageable pageable);

    java.util.List<User> findByRole(String role);

    java.util.List<User> findByRoleAndStatus(String role, String status);

    java.util.List<User> findByStatus(String status);

    org.springframework.data.domain.Page<User> findByRoleAndBranchId(String role, Long branchId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByBranchId(Long branchId, org.springframework.data.domain.Pageable pageable);

    java.util.List<User> findByRoleAndStatusAndBranchId(String role, String status, Long branchId);

    java.util.List<User> findByStatusAndBranchId(String status, Long branchId);

    long countByStatus(String status);

    long countByStatusAndBranchId(String status, Long branchId);
}


