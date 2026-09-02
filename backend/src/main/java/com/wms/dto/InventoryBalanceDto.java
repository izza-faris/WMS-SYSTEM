package com.wms.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class InventoryBalanceDto {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String barcode;
    private Long warehouseId;
    private String warehouseName;
    private Long binId;
    private String binCode;
    private String binQrCode;
    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private LocalDateTime updatedAt;

    public InventoryBalanceDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public String getBinCode() { return binCode; }
    public void setBinCode(String binCode) { this.binCode = binCode; }

    public String getBinQrCode() { return binQrCode; }
    public void setBinQrCode(String binQrCode) { this.binQrCode = binQrCode; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(Integer reservedQuantity) { this.reservedQuantity = reservedQuantity; }

    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
