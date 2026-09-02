package com.wms.config;

import com.wms.entity.enums.Role;

public class TenantContext {

    public static class TenantInfo {
        private Long userId;
        private Long clientId;
        private Long branchId;
        private Role role;
        private String email;

        public TenantInfo(Long userId, Long clientId, Long branchId, Role role, String email) {
            this.userId = userId;
            this.clientId = clientId;
            this.branchId = branchId;
            this.role = role;
            this.email = email;
        }

        public Long getUserId() { return userId; }
        public Long getClientId() { return clientId; }
        public Long getBranchId() { return branchId; }
        public Role getRole() { return role; }
        public String getEmail() { return email; }
    }

    private static final ThreadLocal<TenantInfo> currentTenant = new ThreadLocal<>();

    public static void set(TenantInfo info) {
        currentTenant.set(info);
    }

    public static TenantInfo get() {
        return currentTenant.get();
    }

    public static Long getCurrentClientId() {
        TenantInfo info = currentTenant.get();
        return info != null ? info.getClientId() : null;
    }

    public static Long getCurrentUserId() {
        TenantInfo info = currentTenant.get();
        return info != null ? info.getUserId() : null;
    }

    public static Long getCurrentBranchId() {
        TenantInfo info = currentTenant.get();
        return info != null ? info.getBranchId() : null;
    }

    public static Role getCurrentRole() {
        TenantInfo info = currentTenant.get();
        return info != null ? info.getRole() : null;
    }

    public static void clear() {
        currentTenant.remove();
    }
}
