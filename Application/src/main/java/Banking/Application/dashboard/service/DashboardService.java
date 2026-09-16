package Banking.Application.dashboard.service;

import Banking.Application.dashboard.dto.DashboardSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getDashboardSummary(String role, Long branchId, Long userId);
}
