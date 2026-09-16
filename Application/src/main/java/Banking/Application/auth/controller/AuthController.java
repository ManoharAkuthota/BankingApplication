package Banking.Application.auth.controller;

import Banking.Application.auth.dto.LoginRequest;
import Banking.Application.auth.dto.LoginResponse;
import Banking.Application.auth.dto.RegisterRequest;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.service.AuthService;
import Banking.Application.common.dto.ApiResponse;
import Banking.Application.common.dto.Pagination;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest request) {
        String result = authService.register(request);
        if (result.equals("Username already exists")) {
            return ApiResponse.error(400, result);
        }
        return ApiResponse.success(result);
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success("Login Successful", response);
    }

    @PostMapping("/login/admin")
    public ApiResponse<LoginResponse> loginAdmin(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request, "ADMIN");
        return ApiResponse.success("Admin Login Successful", response);
    }

    @PostMapping("/login/manager")
    public ApiResponse<LoginResponse> loginManager(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request, "MANAGER");
        return ApiResponse.success("Manager Login Successful", response);
    }

    @PostMapping("/login/employee")
    public ApiResponse<LoginResponse> loginEmployee(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request, "EMPLOYEE");
        return ApiResponse.success("Employee Login Successful", response);
    }

    @PostMapping("/login/customer")
    public ApiResponse<LoginResponse> loginCustomer(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request, "CUSTOMER");
        return ApiResponse.success("Customer Login Successful", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        User user = authService.getUser(id);
        return ApiResponse.success("User fetched successfully", user);
    }

    @GetMapping
    public ApiResponse<List<User>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> userPage = authService.getAllUsers(role, branchId, page, size);
        return ApiResponse.success("Users fetched successfully", userPage);
    }

    @PutMapping("/{id}")
    public ApiResponse<User> updateUser(@PathVariable Long id, @Valid @RequestBody Banking.Application.auth.dto.UserUpdateRequest request) {
        User user = authService.updateUser(id, request);
        return ApiResponse.success("User updated successfully", user);
    }

    @PatchMapping("/{id}")
    public ApiResponse<User> patchUser(@PathVariable Long id, @Valid @RequestBody Banking.Application.auth.dto.UserPatchRequest request) {
        User user = authService.patchUser(id, request);
        return ApiResponse.success("User patched successfully", user);
    }

    @GetMapping("/dropdown")
    public ApiResponse<List<Banking.Application.auth.dto.UserSummaryDto>> getUserDropdown(
            @RequestParam(required = false) String role) {
        List<Banking.Application.auth.dto.UserSummaryDto> dropdownList = authService.getUserDropdown(role);
        return ApiResponse.success("User dropdown list fetched successfully", dropdownList);
    }
}