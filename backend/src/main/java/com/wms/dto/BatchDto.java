package com.wms.dto;

import java.time.LocalDate;

public class BatchDto {
    private Long id;
    private Long productId;
    private String productName;
    private String batchNumber;
    private LocalDate mfgDate;
    private LocalDate expiryDate;
    private Integer initialQuantity;
    private Integer remainingQuantity;
    private boolean expired;
    private boolean expiringSoon;

    public BatchDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getMfgDate() { return mfgDate; }
    public void setMfgDate(LocalDate mfgDate) { this.mfgDate = mfgDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public Integer getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(Integer remainingQuantity) { this.remainingQuantity = remainingQuantity; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public boolean isExpiringSoon() { return expiringSoon; }
    public void setExpiringSoon(boolean expiringSoon) { this.expiringSoon = expiringSoon; }
}
