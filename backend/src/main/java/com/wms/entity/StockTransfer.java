package com.wms.entity;

import com.wms.entity.enums.TransferStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "stock_transfers")
public class StockTransfer {

    @Id
    private Long id;

    private Long clientId;

    private String transferNumber;

    private Long sourceWarehouseId;

    private Long destWarehouseId;

    private TransferStatus status = TransferStatus.PENDING;

    private Long createdBy;

    private Long approvedBy;

    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    public StockTransfer() {}

    public StockTransfer(Long clientId, String transferNumber, Long sourceWarehouseId, Long destWarehouseId, Long createdBy, String notes) {
        this.clientId = clientId;
        this.transferNumber = transferNumber;
        this.sourceWarehouseId = sourceWarehouseId;
        this.destWarehouseId = destWarehouseId;
        this.createdBy = createdBy;
        this.notes = notes;
        this.status = TransferStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getTransferNumber() { return transferNumber; }
    public void setTransferNumber(String transferNumber) { this.transferNumber = transferNumber; }

    public Long getSourceWarehouseId() { return sourceWarehouseId; }
    public void setSourceWarehouseId(Long sourceWarehouseId) { this.sourceWarehouseId = sourceWarehouseId; }

    public Long getDestWarehouseId() { return destWarehouseId; }
    public void setDestWarehouseId(Long destWarehouseId) { this.destWarehouseId = destWarehouseId; }

    public TransferStatus getStatus() { return status; }
    public void setStatus(TransferStatus status) { this.status = status; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Long getApprovedBy() { return approvedBy; }
    public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
