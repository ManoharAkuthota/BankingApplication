package Banking.Application.branch.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchRequest {

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "Branch code is required")
    private String branchCode;

    @NotBlank(message = "IFSC code is required")
    private String ifscCode;

    private String address;
}
