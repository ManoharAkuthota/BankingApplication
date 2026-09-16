package Banking.Application.branch.service;

import Banking.Application.auth.entity.User;
import Banking.Application.auth.repository.UserRepository;
import Banking.Application.branch.dto.BranchRequest;
import Banking.Application.branch.entity.Branch;
import Banking.Application.branch.repository.BranchRepository;
import Banking.Application.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    private User getLoggedInUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));
    }

    @Override
    @Transactional
    public Branch createBranch(BranchRequest request) {
        User loggedInUser = getLoggedInUser();
        String role = loggedInUser.getRole().toUpperCase();

        // Only ADMIN is allowed to create branches
        if (!role.equals("ADMIN")) {
            throw new RuntimeException("Access denied: Only Admins can create new branches.");
        }

        // Validate duplicates
        if (branchRepository.findByBranchCode(request.getBranchCode()).isPresent()) {
            throw new RuntimeException("Branch code already exists");
        }

        Branch branch = Branch.builder()
                .name(request.getName())
                .branchCode(request.getBranchCode())
                .ifscCode(request.getIfscCode())
                .address(request.getAddress())
                .build();

        return branchRepository.save(branch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Branch> getAllBranches() {
        User loggedInUser = getLoggedInUser();
        String role = loggedInUser.getRole().toUpperCase();

        if (role.equals("ADMIN")) {
            return branchRepository.findAll();
        } else if (role.equals("MANAGER") || role.equals("EMPLOYEE")) {
            Branch userBranch = loggedInUser.getBranch();
            if (userBranch == null) {
                throw new RuntimeException("Access denied: You do not belong to any branch.");
            }
            return Collections.singletonList(userBranch);
        } else {
            throw new RuntimeException("Access denied to branches list.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Branch getBranchById(Long id) {
        User loggedInUser = getLoggedInUser();
        String role = loggedInUser.getRole().toUpperCase();

        if (role.equals("ADMIN")) {
            return branchRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
        } else if (role.equals("MANAGER") || role.equals("EMPLOYEE")) {
            Branch userBranch = loggedInUser.getBranch();
            if (userBranch == null || !userBranch.getId().equals(id)) {
                throw new RuntimeException("Access denied to view details for this branch.");
            }
            return userBranch;
        } else {
            throw new RuntimeException("Access denied to branch details.");
        }
    }
}
