package com.wms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class StockInRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    private Long binId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Optional Batch Information for batch/expiry tracking
    private String batchNumber;
    private LocalDate mfgDate;
    private LocalDate expiryDate;

    private String referenceNumber;
    private String notes;

    public StockInRequest() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getMfgDate() { return mfgDate; }
    public void setMfgDate(LocalDate mfgDate) { this.mfgDate = mfgDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
