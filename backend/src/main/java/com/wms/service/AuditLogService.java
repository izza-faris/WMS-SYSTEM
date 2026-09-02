package com.wms.service;

import com.wms.config.TenantContext;
import com.wms.entity.AuditLog;
import com.wms.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final TenantSecurityService tenantSecurityService;

    public AuditLogService(AuditLogRepository auditLogRepository, TenantSecurityService tenantSecurityService) {
        this.auditLogRepository = auditLogRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Transactional
    public void logClientAction(Long clientId, String action, String entityType, Long entityId, String description) {
        Long userId = TenantContext.getCurrentUserId();
        Long branchId = TenantContext.getCurrentBranchId();
        AuditLog log = new AuditLog(clientId, userId, branchId, action, entityType, entityId, description, "127.0.0.1");
        auditLogRepository.save(log);
    }

    @Transactional
    public void logPlatformAction(String action, String entityType, Long entityId, String description) {
        Long userId = TenantContext.getCurrentUserId();
        AuditLog log = new AuditLog(null, userId, null, action, entityType, entityId, description, "127.0.0.1");
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getTenantAuditLogs(Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return auditLogRepository.findByClientIdOrderByCreatedAtDesc(clientId, pageable);
    }

    public Page<AuditLog> getPlatformAuditLogs(Pageable pageable) {
        return auditLogRepository.findByClientIdIsNullOrderByCreatedAtDesc(pageable);
    }
}
