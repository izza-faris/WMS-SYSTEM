package com.wms.dto;

import java.util.ArrayList;
import java.util.List;

public class PriceOrderPreviewDto {
    private String shopName = "Wholesale Shop Customer";
    private String shopBarcode;
    private String shopPhone;
    private String orderDate;
    private String notes;
    private Integer totalItems = 0;
    private Integer totalQuantity = 0;
    private Double estimatedTotal = 0.0;
    private String fileName;
    private List<PriceOrderItemPreviewDto> items = new ArrayList<>();

    public PriceOrderPreviewDto() {}

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getShopBarcode() { return shopBarcode; }
    public void setShopBarcode(String shopBarcode) { this.shopBarcode = shopBarcode; }

    public String getShopPhone() { return shopPhone; }
    public void setShopPhone(String shopPhone) { this.shopPhone = shopPhone; }

    public String getOrderDate() { return orderDate; }
    public void setOrderDate(String orderDate) { this.orderDate = orderDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getTotalItems() { return totalItems; }
    public void setTotalItems(Integer totalItems) { this.totalItems = totalItems; }

    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

    public Double getEstimatedTotal() { return estimatedTotal; }
    public void setEstimatedTotal(Double estimatedTotal) { this.estimatedTotal = estimatedTotal; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public List<PriceOrderItemPreviewDto> getItems() { return items; }
    public void setItems(List<PriceOrderItemPreviewDto> items) { this.items = items; }
}
