package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sale_invoice_items")
public class SaleInvoiceItem {

    @Id
    private Long id;

    private Long invoiceId;

    private Long productId;

    private String productName;

    private String sku;

    private String unit = "PCS";

    private Integer quantity;

    private Double unitPrice = 0.0;

    private Double totalPrice = 0.0;

    private String barcode;

    public SaleInvoiceItem() {}

    public SaleInvoiceItem(Long invoiceId, Long productId, String productName, String sku, String unit, Integer quantity, Double unitPrice, Double totalPrice) {
        this.invoiceId = invoiceId;
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.unit = unit;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }

    public SaleInvoiceItem(Long invoiceId, Long productId, String productName, String sku, String unit, Integer quantity, Double unitPrice, Double totalPrice, String barcode) {
        this.invoiceId = invoiceId;
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.unit = unit;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.barcode = barcode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInvoiceId() { return invoiceId; }
    public void setInvoiceId(Long invoiceId) { this.invoiceId = invoiceId; }

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

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
}
