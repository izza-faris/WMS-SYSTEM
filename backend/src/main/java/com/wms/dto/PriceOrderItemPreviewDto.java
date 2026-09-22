package com.wms.dto;

public class PriceOrderItemPreviewDto {
    private Long productId;
    private String productName;
    private String sku;
    private String unit;
    private Integer quantity;
    private Double customPrice;
    private Double lineTotal;
    private Integer availableStock;
    private Boolean isStockSufficient;
    private Boolean matched;

    public PriceOrderItemPreviewDto() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getCustomPrice() { return customPrice; }
    public void setCustomPrice(Double customPrice) { this.customPrice = customPrice; }

    public Double getLineTotal() { return lineTotal; }
    public void setLineTotal(Double lineTotal) { this.lineTotal = lineTotal; }

    public Integer getAvailableStock() { return availableStock; }
    public void setAvailableStock(Integer availableStock) { this.availableStock = availableStock; }

    public Boolean getIsStockSufficient() { return isStockSufficient; }
    public void setIsStockSufficient(Boolean isStockSufficient) { this.isStockSufficient = isStockSufficient; }

    public Boolean getMatched() { return matched; }
    public void setMatched(Boolean matched) { this.matched = matched; }
}
