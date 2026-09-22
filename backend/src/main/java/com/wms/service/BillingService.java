package com.wms.service;

import com.wms.dto.*;
import com.wms.entity.Product;
import com.wms.entity.SaleInvoice;
import com.wms.entity.SaleInvoiceItem;
import com.wms.entity.Warehouse;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.ProductRepository;
import com.wms.repository.SaleInvoiceItemRepository;
import com.wms.repository.SaleInvoiceRepository;
import com.wms.repository.WarehouseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillingService {

    private final SaleInvoiceRepository saleInvoiceRepository;
    private final SaleInvoiceItemRepository saleInvoiceItemRepository;
    private final InventoryService inventoryService;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;

    public BillingService(SaleInvoiceRepository saleInvoiceRepository,
                          SaleInvoiceItemRepository saleInvoiceItemRepository,
                          InventoryService inventoryService,
                          ProductRepository productRepository,
                          WarehouseRepository warehouseRepository,
                          TenantSecurityService tenantSecurityService,
                          AuditLogService auditLogService) {
        this.saleInvoiceRepository = saleInvoiceRepository;
        this.saleInvoiceItemRepository = saleInvoiceItemRepository;
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public SaleInvoiceDto checkout(CheckoutRequest request) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessRuleException("Cannot complete checkout: Cart is empty.");
        }

        // Determine warehouse
        Long warehouseId = request.getWarehouseId();
        if (warehouseId == null) {
            List<Warehouse> clientWhs = warehouseRepository.findByClientId(clientId);
            if (!clientWhs.isEmpty()) {
                warehouseId = clientWhs.get(0).getId();
            } else {
                throw new ResourceNotFoundException("No warehouse found for this account.");
            }
        }

        // Generate Invoice Number
        long count = saleInvoiceRepository.countByClientId(clientId) + 1;
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
        String invoiceNumber = String.format("INV-%s-%04d", datePart, count);

        String customerName = (request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty())
                ? request.getCustomerName().trim()
                : "Walk-in Customer";

        double subtotal = 0.0;
        int totalQty = 0;

        // Create Invoice Entity
        SaleInvoice invoice = new SaleInvoice();
        invoice.setClientId(clientId);
        invoice.setWarehouseId(warehouseId);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setCustomerName(customerName);
        invoice.setCustomerPhone(request.getCustomerPhone());
        invoice.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH");
        invoice.setNotes(request.getNotes());
        invoice.setCreatedById(userId);
        invoice.setStatus("COMPLETED");

        invoice = saleInvoiceRepository.save(invoice);

        List<SaleInvoiceItem> savedItems = new ArrayList<>();

        // Process line items & auto-deduct stock
        for (CheckoutItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndClientId(itemReq.getProductId(), clientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            double unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : (product.getPrice() != null ? product.getPrice() : 0.0);
            double lineTotal = unitPrice * itemReq.getQuantity();

            subtotal += lineTotal;
            totalQty += itemReq.getQuantity();

            // Auto-deduct from inventory via InventoryService
            StockOutRequest stockOutReq = new StockOutRequest();
            stockOutReq.setProductId(product.getId());
            stockOutReq.setWarehouseId(warehouseId);
            stockOutReq.setQuantity(itemReq.getQuantity());
            stockOutReq.setReferenceNumber(invoiceNumber);
            stockOutReq.setNotes("POS Sale to " + customerName + " [" + invoiceNumber + "]");

            inventoryService.stockOut(stockOutReq);

            // Record invoice item
            SaleInvoiceItem invoiceItem = new SaleInvoiceItem(
                    invoice.getId(),
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    product.getUnit() != null ? product.getUnit() : "PCS",
                    itemReq.getQuantity(),
                    unitPrice,
                    lineTotal
            );
            savedItems.add(saleInvoiceItemRepository.save(invoiceItem));
        }

        double discount = request.getDiscountAmount() != null ? Math.max(0.0, request.getDiscountAmount()) : 0.0;
        double tax = request.getTaxAmount() != null ? Math.max(0.0, request.getTaxAmount()) : 0.0;
        double grandTotal = Math.max(0.0, subtotal - discount + tax);

        double paid = request.getPaidAmount() != null && request.getPaidAmount() > 0 ? request.getPaidAmount() : grandTotal;
        double change = Math.max(0.0, paid - grandTotal);

        invoice.setItemCount(savedItems.size());
        invoice.setTotalQuantity(totalQty);
        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(discount);
        invoice.setTaxAmount(tax);
        invoice.setGrandTotal(grandTotal);
        invoice.setPaidAmount(paid);
        invoice.setChangeAmount(change);

        invoice = saleInvoiceRepository.save(invoice);

        auditLogService.logClientAction(clientId, "SALE_INVOICE", "Billing", invoice.getId(),
                "POS Sale completed: " + invoiceNumber + " | Customer: " + customerName + " | Total: " + grandTotal);

        return convertToDto(invoice, savedItems);
    }

    public Page<SaleInvoiceDto> getInvoices(String query, Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Page<SaleInvoice> page;
        if (query != null && !query.trim().isEmpty()) {
            page = saleInvoiceRepository.searchInvoices(clientId, query.trim(), pageable);
        } else {
            page = saleInvoiceRepository.findByClientIdOrderByCreatedAtDesc(clientId, pageable);
        }

        return page.map(inv -> {
            List<SaleInvoiceItem> items = saleInvoiceItemRepository.findByInvoiceId(inv.getId());
            return convertToDto(inv, items);
        });
    }

    public SaleInvoiceDto getInvoiceById(Long id) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        SaleInvoice invoice = saleInvoiceRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));

        List<SaleInvoiceItem> items = saleInvoiceItemRepository.findByInvoiceId(invoice.getId());
        return convertToDto(invoice, items);
    }

    private SaleInvoiceDto convertToDto(SaleInvoice inv, List<SaleInvoiceItem> items) {
        SaleInvoiceDto dto = new SaleInvoiceDto();
        dto.setId(inv.getId());
        dto.setClientId(inv.getClientId());
        dto.setWarehouseId(inv.getWarehouseId());
        dto.setInvoiceNumber(inv.getInvoiceNumber());
        dto.setCustomerName(inv.getCustomerName());
        dto.setCustomerPhone(inv.getCustomerPhone());
        dto.setPaymentMethod(inv.getPaymentMethod());
        dto.setItemCount(inv.getItemCount());
        dto.setTotalQuantity(inv.getTotalQuantity());
        dto.setSubtotal(inv.getSubtotal());
        dto.setDiscountAmount(inv.getDiscountAmount());
        dto.setTaxAmount(inv.getTaxAmount());
        dto.setGrandTotal(inv.getGrandTotal());
        dto.setPaidAmount(inv.getPaidAmount());
        dto.setChangeAmount(inv.getChangeAmount());
        dto.setStatus(inv.getStatus());
        dto.setNotes(inv.getNotes());
        dto.setCreatedById(inv.getCreatedById());
        dto.setCreatedAt(inv.getCreatedAt());

        if (items != null) {
            dto.setItems(items.stream().map(i -> {
                SaleInvoiceItemDto itemDto = new SaleInvoiceItemDto();
                itemDto.setId(i.getId());
                itemDto.setProductId(i.getProductId());
                itemDto.setProductName(i.getProductName());
                itemDto.setSku(i.getSku());
                itemDto.setUnit(i.getUnit());
                itemDto.setQuantity(i.getQuantity());
                itemDto.setUnitPrice(i.getUnitPrice());
                itemDto.setTotalPrice(i.getTotalPrice());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
