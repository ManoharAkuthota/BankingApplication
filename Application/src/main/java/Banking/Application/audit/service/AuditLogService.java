package Banking.Application.audit.service;

import Banking.Application.audit.dto.AuditLogResponse;
import Banking.Application.branch.entity.Branch;
import org.springframework.data.domain.Page;

public interface AuditLogService {

    void log(String action, String actionTarget, String oldValue, String newValue, Branch branch);

    Page<AuditLogResponse> getAuditLogs(String action, Long branchId, String actionBy, String role, int page, int size);
}
