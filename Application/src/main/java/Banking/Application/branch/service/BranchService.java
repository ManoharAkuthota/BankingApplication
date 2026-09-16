package Banking.Application.branch.service;

import Banking.Application.branch.dto.BranchRequest;
import Banking.Application.branch.entity.Branch;

import java.util.List;

public interface BranchService {
    Branch createBranch(BranchRequest request);
    List<Branch> getAllBranches();
    Branch getBranchById(Long id);
}
