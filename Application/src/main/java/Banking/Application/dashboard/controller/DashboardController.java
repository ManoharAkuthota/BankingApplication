package Banking.Application.dashboard.controller;

import Banking.Application.common.dto.ApiResponse;
import Banking.Application.dashboard.dto.DashboardSummaryResponse;
import Banking.Application.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> getDashboardSummary(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long userId
    ) {
        DashboardSummaryResponse summary = dashboardService.getDashboardSummary(role, branchId, userId);
        return ApiResponse.success("Dashboard summary fetched successfully", summary);
    }
}
