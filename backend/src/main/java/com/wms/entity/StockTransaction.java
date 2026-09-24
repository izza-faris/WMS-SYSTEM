package com.wms.entity;

import com.wms.entity.enums.TransactionType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "stock_transactions")
public class StockTransaction {

    @Id
    private Long id;

    private Long clientId;

    private Long warehouseId;

    private Long binId;

    private Long productId;

    private Long batchId;

    private Long userId;

    private TransactionType transactionType;

    private Integer quantity;

    private Integer previousQuantity;

    private Integer newQuantity;

    private String referenceNumber;

    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    public StockTransaction() {}

    public StockTransaction(Long clientId, Long warehouseId, Long binId, Long productId, Long batchId,
                            Long userId, TransactionType transactionType, Integer quantity,
                            Integer previousQuantity, Integer newQuantity, String referenceNumber, String notes) {
        this.clientId = clientId;
        this.warehouseId = warehouseId;
        this.binId = binId;
        this.productId = productId;
        this.batchId = batchId;
        this.userId = userId;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.referenceNumber = referenceNumber;
        this.notes = notes;
        this.createdAt = LocalDateTime.now();
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

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(Integer previousQuantity) { this.previousQuantity = previousQuantity; }

    public Integer getNewQuantity() { return newQuantity; }
    public void setNewQuantity(Integer newQuantity) { this.newQuantity = newQuantity; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
