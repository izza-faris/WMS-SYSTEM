package com.wms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterClientRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Company code is required")
    private String companyCode;

    @NotBlank(message = "Company email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String address;

    @NotBlank(message = "Admin full name is required")
    private String adminName;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    public RegisterClientRequest() {}

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCompanyCode() { return companyCode; }
    public void setCompanyCode(String companyCode) { this.companyCode = companyCode; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
