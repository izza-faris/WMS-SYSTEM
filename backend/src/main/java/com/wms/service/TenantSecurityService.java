package com.wms.service;

import com.wms.config.TenantContext;
import com.wms.entity.enums.Role;
import com.wms.exception.TenantAccessDeniedException;
import com.wms.exception.UnauthorizedException;
import org.springframework.stereotype.Service;

@Service
public class TenantSecurityService {

    /**
     * Retrieves the current authenticated tenant (client) ID.
     * Throws TenantAccessDeniedException if unauthenticated or tenant context is missing.
     */
    public Long requireCurrentClientId() {
        Long clientId = TenantContext.getCurrentClientId();
        if (clientId == null) {
            Role role = TenantContext.getCurrentRole();
            if (role == Role.PLATFORM_ADMIN) {
                throw new TenantAccessDeniedException("Platform Admin does not belong to a specific tenant workspace.");
            }
            throw new UnauthorizedException("Unauthenticated request: Tenant context missing.");
        }
        return clientId;
    }

    /**
     * Validates that an entity's owner client ID matches the authenticated user's client ID.
     */
    public void validateTenantOwnership(Long entityClientId, String entityName) {
        Long currentClientId = requireCurrentClientId();
        if (!currentClientId.equals(entityClientId)) {
            throw new TenantAccessDeniedException("Access denied: You do not have permission to access this " + entityName + ".");
        }
    }

    /**
     * Validates branch access. If the user is a Branch Manager or Warehouse Staff,
     * they can only access their assigned branch. Client Admin can access all branches of their client.
     */
    public void validateBranchAccess(Long branchId) {
        Role role = TenantContext.getCurrentRole();
        if (role == Role.CLIENT_ADMIN) {
            return; // Client Admin has tenant-wide access
        }

        Long userBranchId = TenantContext.getCurrentBranchId();
        if (userBranchId != null && !userBranchId.equals(branchId)) {
            throw new TenantAccessDeniedException("Access denied: You are not authorized to access branch ID " + branchId + ".");
        }
    }

    public Long getCurrentUserId() {
        Long userId = TenantContext.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("Unauthenticated request: User ID missing.");
        }
        return userId;
    }
}
