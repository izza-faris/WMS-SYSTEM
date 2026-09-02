package com.wms.entity;

import com.wms.entity.enums.ClientStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, unique = true, length = 50)
    private String companyCode;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClientStatus status = ClientStatus.PENDING;

    @Column(nullable = false)
    private Boolean allowNegativeStock = false;

    @Column(nullable = false, updatable = false)
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

    @PreUpdate
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
