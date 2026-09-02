package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.entity.AuditLog;
import com.wms.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getTenantAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getTenantAuditLogs(pageable)));
    }
}
