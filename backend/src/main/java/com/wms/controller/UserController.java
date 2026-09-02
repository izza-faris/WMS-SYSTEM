package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.UserCreateDto;
import com.wms.dto.UserProfileDto;
import com.wms.entity.User;
import com.wms.exception.BusinessRuleException;
import com.wms.repository.BranchRepository;
import com.wms.repository.ClientRepository;
import com.wms.repository.UserRepository;
import com.wms.service.AuditLogService;
import com.wms.service.TenantSecurityService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;

    public UserController(UserRepository userRepository, ClientRepository clientRepository,
                          BranchRepository branchRepository, PasswordEncoder passwordEncoder,
                          TenantSecurityService tenantSecurityService, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getTenantUsers() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<UserProfileDto> users = userRepository.findByClientId(clientId).stream().map(u -> {
            UserProfileDto dto = new UserProfileDto();
            dto.setId(u.getId());
            dto.setClientId(u.getClientId());
            dto.setBranchId(u.getBranchId());
            dto.setFullName(u.getFullName());
            dto.setEmail(u.getEmail());
            dto.setRole(u.getRole());
            dto.setPhone(u.getPhone());
            if (u.getBranchId() != null) {
                branchRepository.findById(u.getBranchId()).ifPresent(b -> dto.setBranchName(b.getBranchName()));
            }
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileDto>> createUser(@Valid @RequestBody UserCreateDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BusinessRuleException("User with email '" + dto.getEmail() + "' already exists.");
        }

        if (dto.getBranchId() != null) {
            branchRepository.findByIdAndClientId(dto.getBranchId(), clientId)
                    .orElseThrow(() -> new BusinessRuleException("Specified branch does not belong to your business."));
        }

        User user = new User(
                clientId, dto.getBranchId(), dto.getFullName(), dto.getEmail(),
                passwordEncoder.encode(dto.getPassword()), dto.getRole(), dto.getPhone()
        );
        user = userRepository.save(user);

        auditLogService.logClientAction(clientId, "USER_CREATED", "User", user.getId(),
                "Created user " + user.getFullName() + " with role " + user.getRole());

        UserProfileDto response = new UserProfileDto();
        response.setId(user.getId());
        response.setClientId(user.getClientId());
        response.setBranchId(user.getBranchId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setPhone(user.getPhone());

        return ResponseEntity.ok(ApiResponse.ok("User created successfully", response));
    }
}
