package Banking.Application.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password; // Optional update (if blank, keep existing)

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Alternative phone number is required")
    private String alternativePhoneNumber;

    private String role;
    private String status;
    private Long branchId;
}
