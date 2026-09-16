package Banking.Application.audit.controller;

import Banking.Application.audit.dto.AuditLogResponse;
import Banking.Application.audit.service.AuditLogService;
import Banking.Application.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<List<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String actionBy,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AuditLogResponse> logsPage = auditLogService.getAuditLogs(action, branchId, actionBy, role, page, size);
        return ApiResponse.success("Audit logs fetched successfully", logsPage);
    }
}
