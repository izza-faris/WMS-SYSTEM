package com.wms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StockAdjustmentRequest {

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    private Long binId;

    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long batchId;

    @NotNull(message = "Physical counted quantity is required")
    @Min(value = 0, message = "Physical quantity cannot be negative")
    private Integer physicalQuantity;

    @NotBlank(message = "Reason for adjustment is required")
    private String reason;

    public StockAdjustmentRequest() {}

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public Integer getPhysicalQuantity() { return physicalQuantity; }
    public void setPhysicalQuantity(Integer physicalQuantity) { this.physicalQuantity = physicalQuantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
