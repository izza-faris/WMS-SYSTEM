package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "product_batches")
public class ProductBatch {

    @Id
    private Long id;

    private Long clientId;

    private Long productId;

    private String batchNumber;

    private LocalDate mfgDate;

    private LocalDate expiryDate;

    private Integer initialQuantity;

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
