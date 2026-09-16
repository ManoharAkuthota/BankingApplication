package Banking.Application.account.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountUpdateRequest {

    private String accountType;
    private BigDecimal balance;
    private String status;
}
