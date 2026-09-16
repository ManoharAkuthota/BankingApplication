package Banking.Application.account.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountPatchRequest {

    private String accountType;
    private BigDecimal balance;
    private String status;
}
