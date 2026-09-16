package Banking.Application.auth.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UserPatchRequest {

    private String username;

    @Email(message = "Invalid email format")
    private String email;

    private String password;
    private String phoneNumber;
    private String alternativePhoneNumber;
    private String role;
    private String status;
    private Long branchId;
}
