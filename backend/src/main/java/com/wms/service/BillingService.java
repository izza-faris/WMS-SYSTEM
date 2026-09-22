package com.wms.service;

import com.wms.dto.*;
import com.wms.entity.Product;
import com.wms.entity.SaleInvoice;
import com.wms.entity.SaleInvoiceItem;
import com.wms.entity.Warehouse;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
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
    private final InventoryRepository inventoryRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;

    public BillingService(SaleInvoiceRepository saleInvoiceRepository,
                          SaleInvoiceItemRepository saleInvoiceItemRepository,
                          InventoryService inventoryService,
                          ProductRepository productRepository,
                          WarehouseRepository warehouseRepository,
                          InventoryRepository inventoryRepository,
                          TenantSecurityService tenantSecurityService,
                          AuditLogService auditLogService) {
        this.saleInvoiceRepository = saleInvoiceRepository;
        this.saleInvoiceItemRepository = saleInvoiceItemRepository;
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
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

    public PriceOrderPreviewDto parsePriceOrderExcel(MultipartFile file) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        PriceOrderPreviewDto preview = new PriceOrderPreviewDto();
        preview.setFileName(file.getOriginalFilename());

        List<Product> clientProducts = productRepository.findByClientId(clientId);

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            int headerRowIndex = -1;
            int colName = -1, colSku = -1, colQty = -1, colPrice = -1, colUnit = -1;

            // Search header row and metadata in rows 0..15
            for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 15); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                for (int c = 0; c < row.getLastCellNum(); c++) {
                    String val = getCellValueAsString(row.getCell(c)).trim();
                    String valLower = val.toLowerCase();

                    if (valLower.startsWith("shop name:") || valLower.startsWith("customer:") || valLower.startsWith("store:")) {
                        String[] parts = val.split(":", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            preview.setShopName(parts[1].trim());
                        } else if (c + 1 < row.getLastCellNum()) {
                            preview.setShopName(getCellValueAsString(row.getCell(c + 1)).trim());
                        }
                    } else if (valLower.startsWith("phone:") || valLower.startsWith("mobile:") || valLower.startsWith("contact:")) {
                        String[] parts = val.split(":", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            preview.setShopPhone(parts[1].trim());
                        } else if (c + 1 < row.getLastCellNum()) {
                            preview.setShopPhone(getCellValueAsString(row.getCell(c + 1)).trim());
                        }
                    } else if (valLower.startsWith("date:") || valLower.startsWith("order date:")) {
                        String[] parts = val.split(":", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            preview.setOrderDate(parts[1].trim());
                        } else if (c + 1 < row.getLastCellNum()) {
                            preview.setOrderDate(getCellValueAsString(row.getCell(c + 1)).trim());
                        }
                    }
                }

                // Header column matches
                int matches = 0;
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    String h = getCellValueAsString(row.getCell(c)).trim().toLowerCase();
                    if (h.contains("item") || h.contains("product") || h.contains("description") || h.contains("name")) {
                        colName = c;
                        matches++;
                    } else if (h.contains("sku") || h.contains("code") || h.contains("barcode") || h.contains("part")) {
                        colSku = c;
                        matches++;
                    } else if (h.contains("qty") || h.contains("quantity") || h.contains("count") || h.contains("units")) {
                        colQty = c;
                        matches++;
                    } else if (h.contains("price") || h.contains("rate") || h.contains("cost") || h.contains("agreed")) {
                        colPrice = c;
                        matches++;
                    } else if (h.contains("unit") || h.contains("uom")) {
                        colUnit = c;
                        matches++;
                    }
                }

                if (colName != -1 && (colQty != -1 || colPrice != -1)) {
                    headerRowIndex = r;
                    break;
                }
            }

            if (headerRowIndex == -1) {
                colName = 0;
                colSku = 1;
                colQty = 2;
                colPrice = 3;
                headerRowIndex = 0;
            }

            List<PriceOrderItemPreviewDto> items = new ArrayList<>();
            double grandTotal = 0.0;
            int totalUnits = 0;

            for (int r = headerRowIndex + 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String name = colName != -1 ? getCellValueAsString(row.getCell(colName)).trim() : "";
                String sku = colSku != -1 ? getCellValueAsString(row.getCell(colSku)).trim() : "";

                if (name.isEmpty() && sku.isEmpty()) continue;
                if (name.toLowerCase().startsWith("total") || name.toLowerCase().startsWith("subtotal")) continue;

                int qty = 1;
                if (colQty != -1) {
                    try {
                        double dQty = getCellValueAsNumeric(row.getCell(colQty));
                        if (dQty > 0) qty = (int) Math.round(dQty);
                    } catch (Exception ignored) {}
                }

                Double customPrice = null;
                if (colPrice != -1) {
                    try {
                        double dPrice = getCellValueAsNumeric(row.getCell(colPrice));
                        if (dPrice >= 0) customPrice = dPrice;
                    } catch (Exception ignored) {}
                }

                Product matchedProduct = null;
                if (!sku.isEmpty()) {
                    matchedProduct = clientProducts.stream()
                            .filter(p -> p.getSku() != null && p.getSku().equalsIgnoreCase(sku))
                            .findFirst().orElse(null);
                }
                if (matchedProduct == null && !name.isEmpty()) {
                    matchedProduct = clientProducts.stream()
                            .filter(p -> p.getName() != null && p.getName().equalsIgnoreCase(name))
                            .findFirst().orElse(null);
                    if (matchedProduct == null) {
                        matchedProduct = clientProducts.stream()
                                .filter(p -> p.getName() != null && p.getName().toLowerCase().contains(name.toLowerCase()))
                                .findFirst().orElse(null);
                    }
                }

                PriceOrderItemPreviewDto itemDto = new PriceOrderItemPreviewDto();
                if (matchedProduct != null) {
                    itemDto.setProductId(matchedProduct.getId());
                    itemDto.setProductName(matchedProduct.getName());
                    itemDto.setSku(matchedProduct.getSku());
                    itemDto.setUnit(matchedProduct.getUnit() != null ? matchedProduct.getUnit() : "PCS");
                    itemDto.setMatched(true);
                    if (customPrice == null) {
                        customPrice = matchedProduct.getPrice() != null ? matchedProduct.getPrice() : 0.0;
                    }
                    Integer stock = inventoryRepository.getTotalStockForProduct(clientId, matchedProduct.getId());
                    int availStock = stock != null ? stock : 0;
                    itemDto.setAvailableStock(availStock);
                    itemDto.setIsStockSufficient(availStock >= qty);
                } else {
                    itemDto.setProductName(!name.isEmpty() ? name : sku);
                    itemDto.setSku(sku);
                    itemDto.setUnit("PCS");
                    itemDto.setMatched(false);
                    itemDto.setAvailableStock(0);
                    itemDto.setIsStockSufficient(false);
                    if (customPrice == null) customPrice = 0.0;
                }

                itemDto.setQuantity(qty);
                itemDto.setCustomPrice(customPrice);
                double lineTotal = qty * customPrice;
                itemDto.setLineTotal(lineTotal);

                grandTotal += lineTotal;
                totalUnits += qty;
                items.add(itemDto);
            }

            preview.setItems(items);
            preview.setTotalItems(items.size());
            preview.setTotalQuantity(totalUnits);
            preview.setEstimatedTotal(grandTotal);

        } catch (Exception e) {
            throw new BusinessRuleException("Failed to read Price Order Excel sheet: " + e.getMessage());
        }

        return preview;
    }

    public byte[] generatePriceOrderTemplate() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<Product> products = productRepository.findByClientId(clientId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Price Order");

            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);

            CellStyle metaLabelStyle = workbook.createCellStyle();
            metaLabelStyle.setFont(boldFont);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(boldFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            // Title & Description
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("WHOLESALE SHOP PRICE ORDER");
            titleCell.setCellStyle(titleStyle);

            Row instRow = sheet.createRow(1);
            instRow.createCell(0).setCellValue("Enter the shop name, ordered quantities, and custom wholesale agreed prices below. Upload directly into WMS for automated billing.");

            // Metadata fields
            Row shopRow = sheet.createRow(3);
            Cell shopLbl = shopRow.createCell(0);
            shopLbl.setCellValue("Shop Name:");
            shopLbl.setCellStyle(metaLabelStyle);
            shopRow.createCell(1).setCellValue("New Star Supermarket");

            Cell phoneLbl = shopRow.createCell(2);
            phoneLbl.setCellValue("Mobile #:");
            phoneLbl.setCellStyle(metaLabelStyle);
            shopRow.createCell(3).setCellValue("+91 98765 43210");

            Row dateRow = sheet.createRow(4);
            Cell dateLbl = dateRow.createCell(0);
            dateLbl.setCellValue("Order Date:");
            dateLbl.setCellStyle(metaLabelStyle);
            dateRow.createCell(1).setCellValue(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

            // Table Headers
            Row headerRow = sheet.createRow(6);
            String[] headers = {"Item / Product Name", "SKU / Code", "Quantity", "Agreed Price (Rate)"};
            for (int i = 0; i < headers.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 7;
            if (!products.isEmpty()) {
                int limit = Math.min(5, products.size());
                for (int i = 0; i < limit; i++) {
                    Product p = products.get(i);
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(p.getName());
                    row.createCell(1).setCellValue(p.getSku() != null ? p.getSku() : "");
                    row.createCell(2).setCellValue(10);
                    row.createCell(3).setCellValue(p.getPrice() != null ? p.getPrice() : 100.0);
                }
            } else {
                Row row1 = sheet.createRow(rowIdx++);
                row1.createCell(0).setCellValue("Basmati Rice 5kg");
                row1.createCell(1).setCellValue("RICE-5KG");
                row1.createCell(2).setCellValue(20);
                row1.createCell(3).setCellValue(350.0);

                Row row2 = sheet.createRow(rowIdx++);
                row2.createCell(0).setCellValue("Sunflower Cooking Oil 1L");
                row2.createCell(1).setCellValue("OIL-1L");
                row2.createCell(2).setCellValue(15);
                row2.createCell(3).setCellValue(130.0);
            }

            for (int i = 0; i < 4; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i), 5200));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to generate Price Order Excel template: " + e.getMessage());
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                }
                double d = cell.getNumericCellValue();
                if (d == (long) d) yield String.valueOf((long) d);
                yield String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.getStringCellValue();
                }
            }
            default -> "";
        };
    }

    private double getCellValueAsNumeric(Cell cell) {
        if (cell == null) return 0.0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Double.parseDouble(cell.getStringCellValue().trim().replaceAll("[^0-9.]", ""));
                } catch (Exception e) {
                    yield 0.0;
                }
            }
            case FORMULA -> cell.getNumericCellValue();
            default -> 0.0;
        };
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
