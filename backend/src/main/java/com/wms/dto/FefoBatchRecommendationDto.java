package com.wms.dto;

import java.time.LocalDate;

public class FefoBatchRecommendationDto {
    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer availableQuantity;
    private Integer suggestedPickQuantity;
    private Long warehouseId;
    private Long binId;
    private String binCode;

    public FefoBatchRecommendationDto() {}

    public FefoBatchRecommendationDto(Long batchId, String batchNumber, LocalDate expiryDate, Integer availableQuantity, Integer suggestedPickQuantity, Long warehouseId, Long binId, String binCode) {
        this.batchId = batchId;
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
        this.availableQuantity = availableQuantity;
        this.suggestedPickQuantity = suggestedPickQuantity;
        this.warehouseId = warehouseId;
        this.binId = binId;
        this.binCode = binCode;
    }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

    public Integer getSuggestedPickQuantity() { return suggestedPickQuantity; }
    public void setSuggestedPickQuantity(Integer suggestedPickQuantity) { this.suggestedPickQuantity = suggestedPickQuantity; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public String getBinCode() { return binCode; }
    public void setBinCode(String binCode) { this.binCode = binCode; }
}
