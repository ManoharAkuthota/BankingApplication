package Banking.Application.transaction.controller;

import Banking.Application.common.dto.ApiResponse;
import Banking.Application.transaction.dto.DepositRequest;
import Banking.Application.transaction.dto.TransactionResponse;
import Banking.Application.transaction.dto.TransferRequest;
import Banking.Application.transaction.dto.WithdrawalRequest;
import Banking.Application.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/deposit")
    public ApiResponse<TransactionResponse> deposit(@Valid @RequestBody DepositRequest request) {
        TransactionResponse response = transactionService.deposit(request);
        return ApiResponse.success("Cash deposited successfully", response);
    }

    @PostMapping("/withdraw")
    public ApiResponse<TransactionResponse> withdraw(@Valid @RequestBody WithdrawalRequest request) {
        TransactionResponse response = transactionService.withdraw(request);
        return ApiResponse.success("Cash withdrawn successfully", response);
    }

    @PostMapping("/transfer")
    public ApiResponse<TransactionResponse> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse response = transactionService.transfer(request);
        return ApiResponse.success("Funds transferred successfully", response);
    }

    @GetMapping("/history")
    public ApiResponse<List<TransactionResponse>> getTransactionHistory(
            @RequestParam(required = false) String accountNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TransactionResponse> historyPage = transactionService.getTransactionHistory(accountNumber, page, size);
        return ApiResponse.success("Transaction history fetched successfully", historyPage);
    }
}
