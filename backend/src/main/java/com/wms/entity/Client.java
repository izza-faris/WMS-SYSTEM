package com.wms.entity;

import com.wms.entity.enums.ClientStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "clients")
public class Client {

    @Id
    private Long id;

    private String companyName;

    private String companyCode;

    private String email;

    private String phone;

    private String address;

    private ClientStatus status = ClientStatus.PENDING;

    private Boolean allowNegativeStock = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Client() {}

    public Client(String companyName, String companyCode, String email, String phone, String address) {
        this.companyName = companyName;
        this.companyCode = companyCode;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.status = ClientStatus.PENDING;
        this.allowNegativeStock = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public ClientStatus getStatus() { return status; }
    public void setStatus(ClientStatus status) { this.status = status; }

    public Boolean getAllowNegativeStock() { return allowNegativeStock; }
    public void setAllowNegativeStock(Boolean allowNegativeStock) { this.allowNegativeStock = allowNegativeStock; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
