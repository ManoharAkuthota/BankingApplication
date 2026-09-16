package Banking.Application.branch.controller;

import Banking.Application.branch.dto.BranchRequest;
import Banking.Application.branch.entity.Branch;
import Banking.Application.branch.service.BranchService;
import Banking.Application.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @PostMapping
    public ApiResponse<Branch> createBranch(@Valid @RequestBody BranchRequest request) {
        Branch branch = branchService.createBranch(request);
        return ApiResponse.success("Branch created successfully", branch);
    }

    @GetMapping
    public ApiResponse<List<Branch>> getAllBranches() {
        List<Branch> branches = branchService.getAllBranches();
        return ApiResponse.success("Branches fetched successfully", branches);
    }

    @GetMapping("/{id}")
    public ApiResponse<Branch> getBranchById(@PathVariable Long id) {
        Branch branch = branchService.getBranchById(id);
        return ApiResponse.success("Branch details fetched successfully", branch);
    }
}
