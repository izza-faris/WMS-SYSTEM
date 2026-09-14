package com.wms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"clientId", "sku"})
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    private Long categoryId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @Column(length = 100)
    private String qrCode;

    @Column(length = 100)
    private String brand;

    @Column(nullable = false, length = 30)
    private String unit = "PCS";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer reorderLevel = 10;

    @Column(nullable = false)
    private Integer minStockLevel = 5;

    @Column(nullable = false)
    private Integer maxStockLevel = 1000;

    @Column(nullable = false)
    private Boolean expiryTrackingEnabled = false;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(precision = 12, scale = 2)
    private Double price = 0.0;

    @Column(length = 20)
    private String currency = "$";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Product() {}

    public Product(Long clientId, Long categoryId, String name, String sku, String barcode, String qrCode,
                   String brand, String unit, String description, Integer reorderLevel,
                   Integer minStockLevel, Integer maxStockLevel, Boolean expiryTrackingEnabled) {
        this.clientId = clientId;
        this.categoryId = categoryId;
        this.name = name;
        this.sku = sku;
        this.barcode = barcode;
        this.qrCode = qrCode;
        this.brand = brand;
        this.unit = unit != null ? unit : "PCS";
        this.description = description;
        this.reorderLevel = reorderLevel != null ? reorderLevel : 10;
        this.minStockLevel = minStockLevel != null ? minStockLevel : 5;
        this.maxStockLevel = maxStockLevel != null ? maxStockLevel : 1000;
        this.expiryTrackingEnabled = expiryTrackingEnabled != null ? expiryTrackingEnabled : false;
        this.isActive = true;
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

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public Integer getMinStockLevel() { return minStockLevel; }
    public void setMinStockLevel(Integer minStockLevel) { this.minStockLevel = minStockLevel; }

    public Integer getMaxStockLevel() { return maxStockLevel; }
    public void setMaxStockLevel(Integer maxStockLevel) { this.maxStockLevel = maxStockLevel; }

    public Boolean getExpiryTrackingEnabled() { return expiryTrackingEnabled; }
    public void setExpiryTrackingEnabled(Boolean expiryTrackingEnabled) { this.expiryTrackingEnabled = expiryTrackingEnabled; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price != null ? price : 0.0; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency != null && !currency.trim().isEmpty() ? currency : "$"; }
}
