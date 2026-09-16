package Banking.Application.dashboard.dto;

import Banking.Application.transaction.dto.TransactionResponse;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private String role;
    private String branchName;
    private String branchCode;
    
    private Long activeUsersCount;
    private Long activeAccountsCount;
    private BigDecimal totalBalance;
    
    private BigDecimal totalDepositVolume;
    private BigDecimal totalWithdrawalVolume;
    private BigDecimal totalTransferVolume;
    
    private List<TransactionResponse> recentTransactions;
    private List<BranchSummaryDto> branchSummaries;
}
