package com.wms.dto;

import jakarta.validation.constraints.NotBlank;

public class BranchDto {
    private Long id;
    private Long clientId;

    @NotBlank(message = "Branch name is required")
    private String branchName;

    @NotBlank(message = "Branch code is required")
    private String branchCode;

    private String address;
    private String phone;
    private Boolean isActive = true;

    public BranchDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
