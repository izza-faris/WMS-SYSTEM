package com.wms.dto;

import com.wms.entity.enums.Role;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private Long clientId;
    private Long branchId;
    private String fullName;
    private String email;
    private Role role;
    private String companyName;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, Long clientId, Long branchId, String fullName, String email, Role role, String companyName) {
        this.token = token;
        this.tokenType = "Bearer";
        this.userId = userId;
        this.clientId = clientId;
        this.branchId = branchId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.companyName = companyName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
}
