package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "inventory")
public class Inventory {

    @Id
    private Long id;

    private Long clientId;

    private Long warehouseId;

    private Long binId;

    private Long productId;

    private Long batchId;

    private Integer quantity = 0;

    private Integer reservedQuantity = 0;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public Inventory() {}

    public Inventory(Long clientId, Long warehouseId, Long binId, Long productId, Long batchId, Integer quantity) {
        this.clientId = clientId;
        this.warehouseId = warehouseId;
        this.binId = binId;
        this.productId = productId;
        this.batchId = batchId;
        this.quantity = quantity != null ? quantity : 0;
        this.reservedQuantity = 0;
        this.updatedAt = LocalDateTime.now();
    }

    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(Integer reservedQuantity) { this.reservedQuantity = reservedQuantity; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
