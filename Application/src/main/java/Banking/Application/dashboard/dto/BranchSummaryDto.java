package Banking.Application.dashboard.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchSummaryDto {
    private Long branchId;
    private String branchName;
    private String branchCode;
    private long activeUsersCount;
    private long activeAccountsCount;
    private BigDecimal totalBalance;
    private BigDecimal totalDepositVolume;
}
