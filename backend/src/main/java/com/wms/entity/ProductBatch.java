package com.wms.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_batches", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"clientId", "productId", "batchNumber"})
})
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false, length = 100)
    private String batchNumber;

    private LocalDate mfgDate;

    private LocalDate expiryDate;

    @Column(nullable = false)
    private Integer initialQuantity;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ProductBatch() {}

    public ProductBatch(Long clientId, Long productId, String batchNumber, LocalDate mfgDate, LocalDate expiryDate, Integer initialQuantity) {
        this.clientId = clientId;
        this.productId = productId;
        this.batchNumber = batchNumber;
        this.mfgDate = mfgDate;
        this.expiryDate = expiryDate;
        this.initialQuantity = initialQuantity;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getMfgDate() { return mfgDate; }
    public void setMfgDate(LocalDate mfgDate) { this.mfgDate = mfgDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
