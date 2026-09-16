package Banking.Application.audit.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private String action;
    private String actionBy;
    private String actionTarget;
    private String oldValue;
    private String newValue;
    private LocalDateTime timestamp;
    private Long branchId;
    private String branchName;
}
