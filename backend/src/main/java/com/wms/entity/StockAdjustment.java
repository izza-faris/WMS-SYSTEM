package com.wms.entity;

import com.wms.entity.enums.AdjustmentStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "stock_adjustments")
public class StockAdjustment {

    @Id
    private Long id;

    private Long clientId;

    private String adjustmentNumber;

    private Long warehouseId;

    private Long binId;

    private Long productId;

    private Long batchId;

    private Integer systemQuantity;

    private Integer physicalQuantity;

    private Integer discrepancyQuantity;

    private String reason;

    private AdjustmentStatus status = AdjustmentStatus.PENDING;

    private Long requestedBy;

    private Long reviewedBy;

    private String reviewNotes;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;

    public StockAdjustment() {}

    public StockAdjustment(Long clientId, String adjustmentNumber, Long warehouseId, Long binId,
                           Long productId, Long batchId, Integer systemQuantity, Integer physicalQuantity,
                           String reason, Long requestedBy) {
        this.clientId = clientId;
        this.adjustmentNumber = adjustmentNumber;
        this.warehouseId = warehouseId;
        this.binId = binId;
        this.productId = productId;
        this.batchId = batchId;
        this.systemQuantity = systemQuantity;
        this.physicalQuantity = physicalQuantity;
        this.discrepancyQuantity = physicalQuantity - systemQuantity;
        this.reason = reason;
        this.requestedBy = requestedBy;
        this.status = AdjustmentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getAdjustmentNumber() { return adjustmentNumber; }
    public void setAdjustmentNumber(String adjustmentNumber) { this.adjustmentNumber = adjustmentNumber; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public Integer getSystemQuantity() { return systemQuantity; }
    public void setSystemQuantity(Integer systemQuantity) { this.systemQuantity = systemQuantity; }

    public Integer getPhysicalQuantity() { return physicalQuantity; }
    public void setPhysicalQuantity(Integer physicalQuantity) { this.physicalQuantity = physicalQuantity; }

    public Integer getDiscrepancyQuantity() { return discrepancyQuantity; }
    public void setDiscrepancyQuantity(Integer discrepancyQuantity) { this.discrepancyQuantity = discrepancyQuantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public AdjustmentStatus getStatus() { return status; }
    public void setStatus(AdjustmentStatus status) { this.status = status; }

    public Long getRequestedBy() { return requestedBy; }
    public void setRequestedBy(Long requestedBy) { this.requestedBy = requestedBy; }

    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
