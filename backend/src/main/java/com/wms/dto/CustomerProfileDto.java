package com.wms.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CustomerProfileDto {
    private String customerName;
    private String customerPhone;
    private String lastInvoiceNumber;
    private LocalDateTime lastOrderDate;
    private Double grandTotal = 0.0;
    private List<SaleInvoiceItemDto> items = new ArrayList<>();

    public CustomerProfileDto() {}

    public CustomerProfileDto(String customerName, String customerPhone, String lastInvoiceNumber, LocalDateTime lastOrderDate, Double grandTotal, List<SaleInvoiceItemDto> items) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.lastInvoiceNumber = lastInvoiceNumber;
        this.lastOrderDate = lastOrderDate;
        this.grandTotal = grandTotal;
        this.items = items != null ? items : new ArrayList<>();
    }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getLastInvoiceNumber() { return lastInvoiceNumber; }
    public void setLastInvoiceNumber(String lastInvoiceNumber) { this.lastInvoiceNumber = lastInvoiceNumber; }

    public LocalDateTime getLastOrderDate() { return lastOrderDate; }
    public void setLastOrderDate(LocalDateTime lastOrderDate) { this.lastOrderDate = lastOrderDate; }

    public Double getGrandTotal() { return grandTotal; }
    public void setGrandTotal(Double grandTotal) { this.grandTotal = grandTotal; }

    public List<SaleInvoiceItemDto> getItems() { return items; }
    public void setItems(List<SaleInvoiceItemDto> items) { this.items = items; }
}
