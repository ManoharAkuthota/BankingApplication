package Banking.Application.auth.service;

import Banking.Application.auth.dto.LoginRequest;
import Banking.Application.auth.dto.LoginResponse;
import Banking.Application.auth.dto.RegisterRequest;
import Banking.Application.auth.entity.User;

import Banking.Application.auth.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;

public interface AuthService {

    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    LoginResponse login(LoginRequest request, String requiredRole);

    User getUser(Long id);

    Page<User> getAllUsers(String role, Long branchId, int page, int size);

    User updateUser(Long id, UserUpdateRequest request);

    User patchUser(Long id, Banking.Application.auth.dto.UserPatchRequest request);

    java.util.List<Banking.Application.auth.dto.UserSummaryDto> getUserDropdown(String role);
}