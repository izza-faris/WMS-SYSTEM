package com.wms.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class StockTransferRequest {

    @NotNull(message = "Source warehouse is required")
    private Long sourceWarehouseId;

    @NotNull(message = "Destination warehouse is required")
    private Long destWarehouseId;

    private String notes;

    @NotEmpty(message = "Transfer items are required")
    private List<Item> items;

    public static class Item {
        @NotNull(message = "Product ID is required")
        private Long productId;

        private Long batchId;
        private Long sourceBinId;
        private Long destBinId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        public Item() {}

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
    }

    public StockTransferRequest() {}

    public Long getSourceWarehouseId() { return sourceWarehouseId; }
    public void setSourceWarehouseId(Long sourceWarehouseId) { this.sourceWarehouseId = sourceWarehouseId; }

    public Long getDestWarehouseId() { return destWarehouseId; }
    public void setDestWarehouseId(Long destWarehouseId) { this.destWarehouseId = destWarehouseId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }
}
