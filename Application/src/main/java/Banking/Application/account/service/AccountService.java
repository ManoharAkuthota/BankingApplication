package Banking.Application.account.service;

import Banking.Application.account.dto.AccountRequest;
import Banking.Application.account.dto.AccountResponse;
import Banking.Application.account.dto.AccountUpdateRequest;
import org.springframework.data.domain.Page;

public interface AccountService {

    AccountResponse createAccount(AccountRequest request);

    Page<AccountResponse> getAccounts(Long userId, int page, int size);

    AccountResponse getAccountById(Long id);

    AccountResponse updateAccount(Long id, AccountUpdateRequest request);

    AccountResponse patchAccount(Long id, Banking.Application.account.dto.AccountPatchRequest request);

    Page<AccountResponse> getPendingAccounts(Long branchId, int page, int size);

    void deleteAccount(Long id);
}

