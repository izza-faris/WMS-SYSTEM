package com.wms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_transfer_items")
public class StockTransferItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long transferId;

    @Column(nullable = false)
    private Long productId;

    private Long batchId;

    private Long sourceBinId;

    private Long destBinId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer receivedQuantity = 0;

    public StockTransferItem() {}

    public StockTransferItem(Long transferId, Long productId, Long batchId, Long sourceBinId, Long destBinId, Integer quantity) {
        this.transferId = transferId;
        this.productId = productId;
        this.batchId = batchId;
        this.sourceBinId = sourceBinId;
        this.destBinId = destBinId;
        this.quantity = quantity;
        this.receivedQuantity = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTransferId() { return transferId; }
    public void setTransferId(Long transferId) { this.transferId = transferId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public Long getSourceBinId() { return sourceBinId; }
    public void setSourceBinId(Long sourceBinId) { this.sourceBinId = sourceBinId; }

    public Long getDestBinId() { return destBinId; }
    public void setDestBinId(Long destBinId) { this.destBinId = destBinId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getReceivedQuantity() { return receivedQuantity; }
    public void setReceivedQuantity(Integer receivedQuantity) { this.receivedQuantity = receivedQuantity; }
}
