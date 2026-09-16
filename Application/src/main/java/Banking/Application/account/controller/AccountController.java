package Banking.Application.account.controller;

import Banking.Application.account.dto.AccountRequest;
import Banking.Application.account.dto.AccountResponse;
import Banking.Application.account.dto.AccountUpdateRequest;
import Banking.Application.account.service.AccountService;
import Banking.Application.common.dto.ApiResponse;
import Banking.Application.common.dto.Pagination;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ApiResponse<AccountResponse> createAccount(@Valid @RequestBody AccountRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return ApiResponse.success("Account created successfully", response);
    }

    @GetMapping("/pending")
    public ApiResponse<List<AccountResponse>> getPendingAccounts(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AccountResponse> pendingPage = accountService.getPendingAccounts(branchId, page, size);
        return ApiResponse.success("Pending accounts fetched successfully", pendingPage);
    }

    @GetMapping
    public ApiResponse<List<AccountResponse>> getAccounts(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AccountResponse> accountPage = accountService.getAccounts(userId, page, size);
        return ApiResponse.success("Accounts fetched successfully", accountPage);
    }

    @GetMapping("/{id}")
    public ApiResponse<AccountResponse> getAccountById(@PathVariable Long id) {
        AccountResponse response = accountService.getAccountById(id);
        return ApiResponse.success("Account fetched successfully", response);
    }

    @PutMapping("/{id}")
    public ApiResponse<AccountResponse> updateAccount(@PathVariable Long id, @RequestBody AccountUpdateRequest request) {
        AccountResponse response = accountService.updateAccount(id, request);
        return ApiResponse.success("Account updated successfully", response);
    }

    @PatchMapping("/{id}")
    public ApiResponse<AccountResponse> patchAccount(@PathVariable Long id, @RequestBody Banking.Application.account.dto.AccountPatchRequest request) {
        AccountResponse response = accountService.patchAccount(id, request);
        return ApiResponse.success("Account patched successfully", response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ApiResponse.success("Account deleted successfully");
    }
}
