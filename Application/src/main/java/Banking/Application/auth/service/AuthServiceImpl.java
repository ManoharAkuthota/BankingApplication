package Banking.Application.auth.service;

import Banking.Application.auth.dto.LoginRequest;
import Banking.Application.auth.dto.LoginResponse;
import Banking.Application.auth.dto.RegisterRequest;
import Banking.Application.auth.dto.UserUpdateRequest;
import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.branch.entity.Branch;
import Banking.Application.branch.repository.BranchRepository;
import Banking.Application.common.security.JwtService;
import Banking.Application.common.security.PasswordUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import Banking.Application.audit.service.AuditLogService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BranchRepository branchRepository;
    private final AuditLogService auditLogService;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public String register(RegisterRequest request) {

        String targetRole = request.getRole() != null ? request.getRole().toUpperCase() : "CUSTOMER";

        if (!targetRole.equals("ADMIN") && !targetRole.equals("MANAGER") && !targetRole.equals("EMPLOYEE") && !targetRole.equals("CUSTOMER")) {
            throw new RuntimeException("Invalid role specified: " + targetRole);
        }

        // Extract authenticated caller details
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Creator profile not found in database"));

        String creatorRole = creator.getRole().toUpperCase();

        // Enforce hierarchical registration rules:
        // - ADMIN can register: MANAGER, EMPLOYEE, CUSTOMER.
        // - MANAGER can register: EMPLOYEE, CUSTOMER.
        // - EMPLOYEE can register: CUSTOMER.
        // - CUSTOMER cannot register anyone.
        boolean isAllowed = false;
        if (creatorRole.equals("ADMIN")) {
            isAllowed = targetRole.equals("MANAGER") || targetRole.equals("EMPLOYEE") || targetRole.equals("CUSTOMER");
        } else if (creatorRole.equals("MANAGER")) {
            isAllowed = targetRole.equals("EMPLOYEE") || targetRole.equals("CUSTOMER");
        } else if (creatorRole.equals("EMPLOYEE")) {
            isAllowed = targetRole.equals("CUSTOMER");
        }

        if (!isAllowed) {
            throw new RuntimeException("Access denied: Role " + creatorRole + " is not authorized to register a user with role " + targetRole);
        }

        // Resolve branch:
        // - Admin can specify a branch ID.
        // - Managers and Employees inherit their branch to the new user.
        Branch branch = null;
        if (creatorRole.equals("ADMIN")) {
            if (request.getBranchId() != null) {
                branch = branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new RuntimeException("Branch not found with id: " + request.getBranchId()));
            }
        } else {
            branch = creator.getBranch();
            if (branch == null) {
                throw new RuntimeException("Access denied: Creator does not belong to any branch.");
            }
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return "Username already exists";
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists";
        }

        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            return "Phone number already registered";
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .alternativePhoneNumber(request.getAlternativePhoneNumber())
                .role(targetRole)
                .status("ACTIVE")
                .branch(branch)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        auditLogService.log(
                "USER_REGISTRATION",
                "User " + user.getUsername(),
                null,
                "Role: " + user.getRole() + ", Branch: " + (branch != null ? branch.getName() : "None"),
                branch
        );

        return "User Registered Successfully";
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        return login(request, null);
    }

    @Override
    public LoginResponse login(LoginRequest request, String requiredRole) {

        // Support login by username or email
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new RuntimeException("Invalid Username or Email"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid Password");
        }

        if (requiredRole != null && !user.getRole().equalsIgnoreCase(requiredRole)) {
            throw new RuntimeException("Access Denied: Invalid role for this login portal");
        }

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );

        // Include email, phone numbers, and role in JWT token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("email", user.getEmail());
        extraClaims.put("phoneNumber", user.getPhoneNumber());
        extraClaims.put("alternativePhoneNumber", user.getAlternativePhoneNumber());
        extraClaims.put("role", user.getRole());
        extraClaims.put("userId", user.getId());
        extraClaims.put("branchId", user.getBranch() != null ? user.getBranch().getId() : null);
        extraClaims.put("branchName", user.getBranch() != null ? user.getBranch().getName() : null);

        String token = jwtService.generateToken(extraClaims, userDetails);

        return new LoginResponse(token);
    }

    @Override
    public User getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        // Extract authenticated caller details
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Caller profile not found"));

        // If not ADMIN, caller must belong to same branch as the requested user (unless requested user is the caller themselves)
        if (!caller.getRole().toUpperCase().equals("ADMIN") && !caller.getId().equals(user.getId())) {
            if (caller.getBranch() == null || user.getBranch() == null ||
                !caller.getBranch().getId().equals(user.getBranch().getId())) {
                throw new RuntimeException("Access denied: You can only view users in your own branch.");
            }
        }

        // Detach to prevent Hibernate from writing decrypted password back to DB
        entityManager.detach(user);
        user.setPassword(PasswordUtil.decrypt(user.getPassword()));
        return user;
    }

    @Override
    public Page<User> getAllUsers(String role, Long branchId, int page, int size) {
        // Extract authenticated caller details
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Caller profile not found"));

        Long targetBranchId = branchId;
        if (!caller.getRole().toUpperCase().equals("ADMIN")) {
            if (caller.getBranch() == null) {
                throw new RuntimeException("Access denied: You do not belong to any branch.");
            }
            targetBranchId = caller.getBranch().getId();
        }

        Page<User> userPage;
        if (role != null && !role.trim().isEmpty()) {
            if (targetBranchId != null) {
                userPage = userRepository.findByRoleAndBranchId(role.toUpperCase(), targetBranchId, PageRequest.of(page, size));
            } else {
                userPage = userRepository.findByRole(role.toUpperCase(), PageRequest.of(page, size));
            }
        } else {
            if (targetBranchId != null) {
                userPage = userRepository.findByBranchId(targetBranchId, PageRequest.of(page, size));
            } else {
                userPage = userRepository.findAll(PageRequest.of(page, size));
            }
        }
        userPage.forEach(user -> {
            entityManager.detach(user);
            user.setPassword(PasswordUtil.decrypt(user.getPassword()));
        });
        return userPage;
    }

    @Override
    @Transactional
    public User updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        String oldRole = user.getRole();
        Branch oldBranch = user.getBranch();

        // Enforce Admin-only branch transfer
        if (request.getBranchId() != null) {
            String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            User caller = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Caller profile not found"));
            if (caller.getRole().toUpperCase().equals("ADMIN")) {
                Branch newBranch = branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new RuntimeException("Branch not found with id: " + request.getBranchId()));
                user.setBranch(newBranch);
            } else {
                Long currentBranchId = user.getBranch() != null ? user.getBranch().getId() : null;
                if (!request.getBranchId().equals(currentBranchId)) {
                    throw new RuntimeException("Access denied: Only Admins can transfer users to a different branch.");
                }
            }
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAlternativePhoneNumber(request.getAlternativePhoneNumber());

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);

        // Audit check
        if (request.getBranchId() != null && (oldBranch == null || !request.getBranchId().equals(oldBranch.getId()))) {
            auditLogService.log(
                    "BRANCH_TRANSFER",
                    "User " + updatedUser.getUsername(),
                    oldBranch != null ? oldBranch.getName() : "None",
                    updatedUser.getBranch() != null ? updatedUser.getBranch().getName() : "None",
                    updatedUser.getBranch()
            );
        }
        if (request.getRole() != null && !request.getRole().equalsIgnoreCase(oldRole)) {
            auditLogService.log(
                    "ROLE_CHANGE",
                    "User " + updatedUser.getUsername(),
                    oldRole,
                    updatedUser.getRole(),
                    updatedUser.getBranch()
            );
        }

        // Detach to prevent Hibernate from writing decrypted password back to DB
        entityManager.detach(updatedUser);
        updatedUser.setPassword(PasswordUtil.decrypt(updatedUser.getPassword()));
        return updatedUser;
    }

    @Override
    @Transactional
    public User patchUser(Long id, Banking.Application.auth.dto.UserPatchRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        String oldRole = user.getRole();
        Branch oldBranch = user.getBranch();

        // Enforce Admin-only branch transfer
        if (request.getBranchId() != null) {
            String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            User caller = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Caller profile not found"));
            if (caller.getRole().toUpperCase().equals("ADMIN")) {
                Branch newBranch = branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new RuntimeException("Branch not found with id: " + request.getBranchId()));
                user.setBranch(newBranch);
            } else {
                Long currentBranchId = user.getBranch() != null ? user.getBranch().getId() : null;
                if (!request.getBranchId().equals(currentBranchId)) {
                    throw new RuntimeException("Access denied: Only Admins can transfer users to a different branch.");
                }
            }
        }

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAlternativePhoneNumber() != null && !request.getAlternativePhoneNumber().trim().isEmpty()) {
            user.setAlternativePhoneNumber(request.getAlternativePhoneNumber());
        }
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            user.setRole(request.getRole());
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            user.setStatus(request.getStatus());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);

        // Audit check
        if (request.getBranchId() != null && (oldBranch == null || !request.getBranchId().equals(oldBranch.getId()))) {
            auditLogService.log(
                    "BRANCH_TRANSFER",
                    "User " + updatedUser.getUsername(),
                    oldBranch != null ? oldBranch.getName() : "None",
                    updatedUser.getBranch() != null ? updatedUser.getBranch().getName() : "None",
                    updatedUser.getBranch()
            );
        }
        if (request.getRole() != null && !request.getRole().equalsIgnoreCase(oldRole)) {
            auditLogService.log(
                    "ROLE_CHANGE",
                    "User " + updatedUser.getUsername(),
                    oldRole,
                    updatedUser.getRole(),
                    updatedUser.getBranch()
            );
        }

        // Detach to prevent Hibernate from writing decrypted password back to DB
        entityManager.detach(updatedUser);
        updatedUser.setPassword(PasswordUtil.decrypt(updatedUser.getPassword()));
        return updatedUser;
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<Banking.Application.auth.dto.UserSummaryDto> getUserDropdown(String role) {
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        User loggedInUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Logged-in user not found"));

        java.util.List<User> users;
        boolean hasBranch = loggedInUser.getBranch() != null && !loggedInUser.getRole().toUpperCase().equals("ADMIN");

        if (role != null && !role.trim().isEmpty()) {
            if (hasBranch) {
                users = userRepository.findByRoleAndStatusAndBranchId(role.toUpperCase(), "ACTIVE", loggedInUser.getBranch().getId());
            } else {
                users = userRepository.findByRoleAndStatus(role.toUpperCase(), "ACTIVE");
            }
        } else {
            if (hasBranch) {
                users = userRepository.findByStatusAndBranchId("ACTIVE", loggedInUser.getBranch().getId());
            } else {
                users = userRepository.findByStatus("ACTIVE");
            }
        }
        return users.stream()
                .map(user -> Banking.Application.auth.dto.UserSummaryDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .phoneNumber(user.getPhoneNumber())
                        .branchName(user.getBranch() != null ? user.getBranch().getName() : null)
                        .branchCode(user.getBranch() != null ? user.getBranch().getBranchCode() : null)
                        .ifscCode(user.getBranch() != null ? user.getBranch().getIfscCode() : null)
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }
}