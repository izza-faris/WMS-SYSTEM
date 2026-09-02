package com.wms.service;

import com.wms.dto.BranchDto;
import com.wms.entity.Branch;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.BranchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;

    public BranchService(BranchRepository branchRepository, TenantSecurityService tenantSecurityService, AuditLogService auditLogService) {
        this.branchRepository = branchRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
    }

    public List<BranchDto> getAllBranches() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return branchRepository.findByClientId(clientId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public BranchDto getBranchById(Long id) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Branch branch = branchRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));
        tenantSecurityService.validateBranchAccess(branch.getId());
        return convertToDto(branch);
    }

    @Transactional
    public BranchDto createBranch(BranchDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();

        if (branchRepository.existsByClientIdAndBranchCode(clientId, dto.getBranchCode())) {
            throw new BusinessRuleException("Branch code '" + dto.getBranchCode() + "' already exists for your business.");
        }

        Branch branch = new Branch(clientId, dto.getBranchName(), dto.getBranchCode(), dto.getAddress(), dto.getPhone());
        branch = branchRepository.save(branch);

        auditLogService.logClientAction(clientId, "BRANCH_CREATED", "Branch", branch.getId(),
                "Created branch: " + branch.getBranchName() + " (" + branch.getBranchCode() + ")");

        return convertToDto(branch);
    }

    @Transactional
    public BranchDto updateBranch(Long id, BranchDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Branch branch = branchRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));

        branch.setBranchName(dto.getBranchName());
        branch.setAddress(dto.getAddress());
        branch.setPhone(dto.getPhone());
        if (dto.getIsActive() != null) {
            branch.setIsActive(dto.getIsActive());
        }

        branch = branchRepository.save(branch);
        auditLogService.logClientAction(clientId, "BRANCH_UPDATED", "Branch", branch.getId(),
                "Updated branch: " + branch.getBranchName());

        return convertToDto(branch);
    }

    private BranchDto convertToDto(Branch branch) {
        BranchDto dto = new BranchDto();
        dto.setId(branch.getId());
        dto.setClientId(branch.getClientId());
        dto.setBranchName(branch.getBranchName());
        dto.setBranchCode(branch.getBranchCode());
        dto.setAddress(branch.getAddress());
        dto.setPhone(branch.getPhone());
        dto.setIsActive(branch.getIsActive());
        return dto;
    }
}
