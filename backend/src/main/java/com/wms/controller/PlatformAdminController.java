package com.wms.controller;

import com.wms.dto.AdminCredentialsUpdateRequest;
import com.wms.dto.ApiResponse;
import com.wms.dto.ClientStatusUpdateRequest;
import com.wms.dto.PlatformStatsDto;
import com.wms.dto.UserProfileDto;
import com.wms.entity.AuditLog;
import com.wms.entity.Client;
import com.wms.entity.User;
import com.wms.entity.enums.ClientStatus;
import com.wms.service.AuditLogService;
import com.wms.service.PlatformAdminService;
import com.wms.service.TenantSecurityService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/platform")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;
    private final AuditLogService auditLogService;
    private final TenantSecurityService tenantSecurityService;

    public PlatformAdminController(PlatformAdminService platformAdminService, AuditLogService auditLogService, TenantSecurityService tenantSecurityService) {
        this.platformAdminService = platformAdminService;
        this.auditLogService = auditLogService;
        this.tenantSecurityService = tenantSecurityService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PlatformStatsDto>> getPlatformStats() {
        return ResponseEntity.ok(ApiResponse.ok(platformAdminService.getPlatformStats()));
    }

    @GetMapping("/clients")
    public ResponseEntity<ApiResponse<Page<Client>>> getAllClients(
            @RequestParam(required = false) ClientStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(platformAdminService.getAllClients(status, pageable)));
    }

    @GetMapping("/clients/{id}")
    public ResponseEntity<ApiResponse<Client>> getClientDetails(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(platformAdminService.getClientDetails(id)));
    }

    @PutMapping("/clients/{id}/status")
    public ResponseEntity<ApiResponse<Client>> updateClientStatus(
            @PathVariable Long id,
            @Valid @RequestBody ClientStatusUpdateRequest request) {
        Client updated = platformAdminService.updateClientStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Client status updated successfully", updated));
    }

    @DeleteMapping("/clients/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClient(@PathVariable Long id) {
        platformAdminService.deleteClient(id);
        return ResponseEntity.ok(ApiResponse.ok("Client deleted successfully", null));
    }

    @DeleteMapping("/clients/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllClients() {
        platformAdminService.deleteAllClients();
        return ResponseEntity.ok(ApiResponse.ok("All client companies deleted successfully", null));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getPlatformAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getPlatformAuditLogs(pageable)));
    }

    @PutMapping("/credentials")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateCredentials(
            @RequestBody AdminCredentialsUpdateRequest request) {
        Long adminId = tenantSecurityService.getCurrentUserId();
        User updated = platformAdminService.updateAdminCredentials(
                adminId, request.getEmail(), request.getCurrentPassword(), request.getNewPassword()
        );

        UserProfileDto dto = new UserProfileDto();
        dto.setId(updated.getId());
        dto.setEmail(updated.getEmail());
        dto.setFullName(updated.getFullName());
        dto.setRole(updated.getRole());
        dto.setPhone(updated.getPhone());
        return ResponseEntity.ok(ApiResponse.ok("Platform Administrator credentials updated successfully", dto));
    }
}
