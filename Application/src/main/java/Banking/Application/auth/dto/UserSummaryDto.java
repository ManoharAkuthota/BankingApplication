package Banking.Application.auth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {

    private Long id;
    private String username;
    private String email;
    private String phoneNumber;
    private String branchName;
    private String branchCode;
    private String ifscCode;
}
