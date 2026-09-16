package Banking.Application.audit.entity;

import Banking.Application.branch.entity.Branch;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // USER_REGISTRATION, ROLE_CHANGE, BRANCH_TRANSFER, ACCOUNT_CREATION, ACCOUNT_STATUS_CHANGE, ACCOUNT_DELETION, HIGH_VALUE_TRANSACTION

    @Column(name = "action_by", nullable = false)
    private String actionBy; // username

    @Column(name = "action_target", nullable = false)
    private String actionTarget; // target identifier (username, account number, etc.)

    @Column(name = "old_value", length = 1000)
    private String oldValue;

    @Column(name = "new_value", length = 1000)
    private String newValue;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch; // associated branch for isolation
}
