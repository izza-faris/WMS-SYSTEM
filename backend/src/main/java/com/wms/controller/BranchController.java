package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.BranchDto;
import com.wms.service.BranchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchDto>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getAllBranches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchDto>> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<BranchDto>> createBranch(@Valid @RequestBody BranchDto dto) {
        BranchDto created = branchService.createBranch(dto);
        return ResponseEntity.ok(ApiResponse.ok("Branch created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<BranchDto>> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchDto dto) {
        BranchDto updated = branchService.updateBranch(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Branch updated successfully", updated));
    }
}
