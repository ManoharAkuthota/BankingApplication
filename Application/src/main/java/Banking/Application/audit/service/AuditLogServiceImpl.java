package Banking.Application.audit.service;

import Banking.Application.audit.dto.AuditLogResponse;
import Banking.Application.audit.entity.AuditLog;
import Banking.Application.audit.repository.AuditLogRepository;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.branch.entity.Branch;
import Banking.Application.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    private User getLoggedInUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .actionBy(log.getActionBy())
                .actionTarget(log.getActionTarget())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .timestamp(log.getTimestamp())
                .branchId(log.getBranch() != null ? log.getBranch().getId() : null)
                .branchName(log.getBranch() != null ? log.getBranch().getName() : null)
                .build();
    }

    @Override
    @Transactional
    public void log(String action, String actionTarget, String oldValue, String newValue, Branch branch) {
        String actionBy = "SYSTEM";
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
            SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
            String name = SecurityContextHolder.getContext().getAuthentication().getName();
            if (name != null && !name.equals("anonymousUser")) {
                actionBy = name;
            }
        }

        AuditLog log = AuditLog.builder()
                .action(action)
                .actionBy(actionBy)
                .actionTarget(actionTarget)
                .oldValue(oldValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .branch(branch)
                .build();

        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String action, Long branchId, String actionBy, String roleParam, int page, int size) {
        User loggedInUser = getLoggedInUser();
        String role = loggedInUser.getRole().toUpperCase();

        Long targetBranchId = branchId;

        if (role.equals("ADMIN")) {
            // ADMIN has full access and can use branchId filter as requested
        } else if (role.equals("MANAGER") || role.equals("EMPLOYEE")) {
            // MANAGER and EMPLOYEE are restricted to their own branch
            Branch userBranch = loggedInUser.getBranch();
            if (userBranch == null) {
                throw new RuntimeException("Access denied: You do not belong to any branch.");
            }
            targetBranchId = userBranch.getId();
        } else {
            throw new RuntimeException("Access denied: You are not authorized to view audit logs.");
        }

        // Clean parameters if empty strings are passed
        String targetAction = (action != null && !action.trim().isEmpty()) ? action.toUpperCase() : null;
        String targetActionBy = (actionBy != null && !actionBy.trim().isEmpty()) ? actionBy.trim() : null;
        String targetRole = (roleParam != null && !roleParam.trim().isEmpty()) ? roleParam.toUpperCase() : null;

        Page<AuditLog> logs = auditLogRepository.findByFilters(
                targetAction,
                targetBranchId,
                targetActionBy,
                targetRole,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"))
        );

        return logs.map(this::mapToResponse);
    }
}
