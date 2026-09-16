package Banking.Application.transaction.service;

import Banking.Application.transaction.dto.DepositRequest;
import Banking.Application.transaction.dto.TransactionResponse;
import Banking.Application.transaction.dto.TransferRequest;
import Banking.Application.transaction.dto.WithdrawalRequest;
import org.springframework.data.domain.Page;

public interface TransactionService {
    TransactionResponse deposit(DepositRequest request);
    TransactionResponse withdraw(WithdrawalRequest request);
    TransactionResponse transfer(TransferRequest request);
    Page<TransactionResponse> getTransactionHistory(String accountNumber, int page, int size);
}
