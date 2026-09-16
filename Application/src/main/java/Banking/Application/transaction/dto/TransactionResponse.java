package Banking.Application.transaction.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long id;
    private String transactionNumber;
    private BigDecimal amount;
    private String transactionType;
    private String status;
    private String description;
    private LocalDateTime timestamp;
    private String sourceAccountNumber;
    private String targetAccountNumber;
}
