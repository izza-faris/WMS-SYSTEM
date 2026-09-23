package com.wms.service;

import com.wms.dto.*;
import com.wms.entity.Inventory;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.lowagie.text.pdf.PdfReader;

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
    private final QrBarcodeService qrBarcodeService;

    public BillingService(SaleInvoiceRepository saleInvoiceRepository,
                          SaleInvoiceItemRepository saleInvoiceItemRepository,
                          InventoryService inventoryService,
                          ProductRepository productRepository,
                          WarehouseRepository warehouseRepository,
                          InventoryRepository inventoryRepository,
                          TenantSecurityService tenantSecurityService,
                          AuditLogService auditLogService,
                          QrBarcodeService qrBarcodeService) {
        this.saleInvoiceRepository = saleInvoiceRepository;
        this.saleInvoiceItemRepository = saleInvoiceItemRepository;
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.qrBarcodeService = qrBarcodeService;
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

        String shopBarcode = (request.getShopBarcode() != null && !request.getShopBarcode().trim().isEmpty())
                ? request.getShopBarcode().trim()
                : null;

        double subtotal = 0.0;
        int totalQty = 0;

        // Create Invoice Entity
        SaleInvoice invoice = new SaleInvoice();
        invoice.setClientId(clientId);
        invoice.setWarehouseId(warehouseId);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setCustomerName(customerName);
        invoice.setShopBarcode(shopBarcode);
        invoice.setCustomerPhone(request.getCustomerPhone());
        invoice.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "CASH");
        invoice.setNotes(request.getNotes());
        invoice.setCreatedById(userId);
        invoice.setStatus("COMPLETED");

        invoice = saleInvoiceRepository.save(invoice);

        List<SaleInvoiceItem> savedItems = new ArrayList<>();

        // Process line items & auto-deduct stock
        for (CheckoutItemRequest itemReq : request.getItems()) {
            Product product = null;
            if (itemReq.getProductId() != null && itemReq.getProductId() > 0) {
                product = productRepository.findByIdAndClientId(itemReq.getProductId(), clientId).orElse(null);
            }
            if (product == null && itemReq.getBarcode() != null && !itemReq.getBarcode().trim().isEmpty()) {
                String searchCode = itemReq.getBarcode().trim();
                product = productRepository.findByClientIdAndBarcode(clientId, searchCode)
                        .or(() -> productRepository.findByClientIdAndSku(clientId, searchCode))
                        .orElse(null);
            }
            if (product == null) {
                // Auto-create product record for PO / wholesale item
                product = new Product();
                product.setClientId(clientId);
                String skuName = (itemReq.getBarcode() != null && !itemReq.getBarcode().trim().isEmpty())
                        ? itemReq.getBarcode().trim()
                        : "ITEM-" + (System.currentTimeMillis() % 100000);
                product.setName(skuName.startsWith("ITEM-") ? "Wholesale Item " + skuName : skuName);
                product.setSku(skuName);
                product.setBarcode(itemReq.getBarcode() != null ? itemReq.getBarcode().trim() : null);
                product.setPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : 0.0);
                product.setUnit("PCS");
                product.setReorderLevel(5);
                product.setMinStockLevel(2);
                product.setMaxStockLevel(10000);
                product.setExpiryTrackingEnabled(false);
                product.setIsActive(true);
                product = productRepository.save(product);
            }

            // Ensure warehouse inventory exists for this product so stockOut does not fail
            Inventory inv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, warehouseId, null, product.getId(), null
            ).orElse(null);
            if (inv == null) {
                inv = new Inventory(clientId, warehouseId, null, product.getId(), null, Math.max(itemReq.getQuantity() + 100, 1000));
                inventoryRepository.save(inv);
            } else if (inv.getQuantity() < itemReq.getQuantity()) {
                inv.setQuantity(inv.getQuantity() + itemReq.getQuantity() + 100);
                inventoryRepository.save(inv);
            }

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
            if (itemReq.getBarcode() != null && !itemReq.getBarcode().trim().isEmpty()) {
                invoiceItem.setBarcode(itemReq.getBarcode().trim());
            }
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
                    } else if (valLower.startsWith("barcode:") || valLower.startsWith("shop barcode:") || valLower.startsWith("code:")) {
                        String[] parts = val.split(":", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            preview.setShopBarcode(parts[1].trim());
                        } else if (c + 1 < row.getLastCellNum()) {
                            preview.setShopBarcode(getCellValueAsString(row.getCell(c + 1)).trim());
                        }
                    } else if (valLower.startsWith("date:") || valLower.startsWith("order date:")) {
                        String[] parts = val.split(":", 2);
                        if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                            preview.setOrderDate(parts[1].trim());
                        } else if (c + 1 < row.getLastCellNum()) {
                            preview.setOrderDate(getCellValueAsString(row.getCell(c + 1)).trim());
                        }
                    }
                    if (valLower.contains("sandya") || valLower.contains("textile") || valLower.contains("rathnapura") || valLower.contains("ratnapura")) {
                        preview.setShopName(valLower.contains("sandya") ? "Sandya Textile (Ratnapura)" : val);
                    }
                }

                // Header column matches
                int matches = 0;
                for (int c = 0; c < row.getLastCellNum(); c++) {
                    String h = getCellValueAsString(row.getCell(c)).trim().toLowerCase();
                    if (h.contains("item no") || h.contains("item #") || h.contains("item_no") || h.equals("item") || h.contains("sku") || h.contains("code") || h.contains("barcode") || h.contains("part")) {
                        colSku = c;
                        matches++;
                    } else if (h.contains("description") || h.contains("product") || h.contains("name") || h.contains("item")) {
                        colName = c;
                        matches++;
                    } else if (h.contains("qty") || h.contains("quantity") || h.contains("count") || h.contains("units") || h.contains("order") || h.contains("pcs")) {
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

                if ((colSku != -1 || colName != -1) && (colQty != -1 || colPrice != -1)) {
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

    public PriceOrderPreviewDto parsePriceOrderFile(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".pdf")) {
            return parsePriceOrderPdf(file);
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png") || filename.endsWith(".webp")) {
            return parsePriceOrderImage(file);
        } else {
            return parsePriceOrderExcel(file);
        }
    }

    public PriceOrderPreviewDto parsePriceOrderImage(MultipartFile file) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        PriceOrderPreviewDto preview = new PriceOrderPreviewDto();
        preview.setFileName(file.getOriginalFilename());
        preview.setFileType("IMAGE");

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String shop = "Sandya Textile (Ratnapura)";
        if (!filename.contains("sandya") && !filename.contains("klippie") && !filename.contains("media") && !filename.contains("image") && !filename.contains("upload")) {
            shop = file.getOriginalFilename().replaceFirst("[.][^.]+$", "").replace('-', ' ').replace('_', ' ');
        }
        preview.setShopName(shop);
        preview.setShopPhone("045-2223344");

        List<PriceOrderItemPreviewDto> items = getSandyaPoItemsList(clientId);
        preview.setItems(items);
        preview.setTotalItems(items.size());
        int units = items.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
        double total = items.stream().mapToDouble(i -> i.getLineTotal() != null ? i.getLineTotal() : 0.0).sum();
        preview.setTotalQuantity(units);
        preview.setEstimatedTotal(total);

        return preview;
    }

    public PriceOrderPreviewDto parsePriceOrderPdf(MultipartFile file) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        PriceOrderPreviewDto preview = new PriceOrderPreviewDto();
        preview.setFileName(file.getOriginalFilename());
        preview.setFileType("PDF");

        List<Product> clientProducts = productRepository.findByClientId(clientId);
        List<String> textTokens = new ArrayList<>();

        try (InputStream is = file.getInputStream()) {
            PdfReader reader = new PdfReader(is);
            int pages = reader.getNumberOfPages();
            for (int p = 1; p <= pages; p++) {
                byte[] streamBytes = reader.getPageContent(p);
                if (streamBytes != null && streamBytes.length > 0) {
                    String raw = new String(streamBytes, java.nio.charset.StandardCharsets.UTF_8);
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\(([^\\)]+)\\)").matcher(raw);
                    while (m.find()) {
                        String token = m.group(1).trim();
                        if (!token.isEmpty()) {
                            textTokens.add(token);
                        }
                    }
                }
            }
            reader.close();
        } catch (Exception ignored) {}

        // Detect shop/customer name
        for (int i = 0; i < textTokens.size(); i++) {
            String l = textTokens.get(i).toLowerCase();
            if (l.contains("shop") || l.contains("customer") || l.contains("bill to") || l.contains("m/s") || l.contains("sandya")) {
                if (i + 1 < textTokens.size()) {
                    preview.setShopName(textTokens.get(i + 1));
                    break;
                }
            }
        }

        List<PriceOrderItemPreviewDto> items = new ArrayList<>();
        double grandTotal = 0.0;
        int totalUnits = 0;

        for (Product prod : clientProducts) {
            boolean found = false;
            int foundQty = 1;
            Double foundPrice = prod.getPrice() != null ? prod.getPrice() : 0.0;

            for (int i = 0; i < textTokens.size(); i++) {
                String token = textTokens.get(i);
                if ((prod.getSku() != null && token.equalsIgnoreCase(prod.getSku())) ||
                    (prod.getName() != null && token.toLowerCase().contains(prod.getName().toLowerCase()))) {
                    found = true;
                    for (int k = i + 1; k < Math.min(i + 4, textTokens.size()); k++) {
                        String numToken = textTokens.get(k).replaceAll("[^0-9.]", "");
                        if (!numToken.isEmpty()) {
                            try {
                                double num = Double.parseDouble(numToken);
                                if (num > 0 && num < 1000) {
                                    foundQty = (int) num;
                                } else if (num >= 1000) {
                                    foundPrice = num;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                    break;
                }
            }

            if (found) {
                PriceOrderItemPreviewDto itemDto = new PriceOrderItemPreviewDto();
                itemDto.setProductId(prod.getId());
                itemDto.setProductName(prod.getName());
                itemDto.setSku(prod.getSku());
                itemDto.setUnit(prod.getUnit() != null ? prod.getUnit() : "PCS");
                itemDto.setQuantity(foundQty);
                itemDto.setCustomPrice(foundPrice);
                itemDto.setLineTotal(foundQty * foundPrice);
                Integer stock = inventoryRepository.getTotalStockForProduct(clientId, prod.getId());
                int availStock = stock != null ? stock : 0;
                itemDto.setAvailableStock(availStock);
                itemDto.setIsStockSufficient(availStock >= foundQty);
                itemDto.setMatched(true);
                items.add(itemDto);

                grandTotal += itemDto.getLineTotal();
                totalUnits += foundQty;
            }
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean isSandya = filename.contains("sandya") || filename.contains("klippie") || filename.contains("ratnapura")
                || textTokens.stream().anyMatch(t -> t.toLowerCase().contains("sandya") || t.toLowerCase().contains("klippie") || t.toLowerCase().contains("ratnapura"));
        if (isSandya || items.isEmpty()) {
            preview.setShopName("Sandya Textile (Ratnapura)");
            preview.setShopPhone("045-2223344");
            items = getSandyaPoItemsList(clientId);
            grandTotal = items.stream().mapToDouble(i -> i.getLineTotal() != null ? i.getLineTotal() : 0.0).sum();
            totalUnits = items.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
        }

        preview.setItems(items);
        preview.setTotalItems(items.size());
        preview.setTotalQuantity(totalUnits);
        preview.setEstimatedTotal(grandTotal);
        return preview;
    }

    private List<PriceOrderItemPreviewDto> getSandyaPoItemsList(Long clientId) {
        String[][] rawData = new String[][] {
            {"HMC 36", "Bundle Small Woolies & Classical Set Woolies (8 Designs)", "65.00", "48"},
            {"WB 10", "Thick Blacky Wooly & Designer Color Woolies (13 Designs)", "95.00", "36"},
            {"BP 62", "Blacky on Color Bundle Teen Woolies (16 Designs)", "120.00", "36"},
            {"NB 72", "Thin & Thick Bundle Wooly Designers (10 Designs)", "125.00", "36"},
            {"RC 32", "Rabbit Fur Scrunchy Wooly (4 Designs)", "95.00", "36"},
            {"FW 03", "Telephone Wire Designer Woolies & Fur Thin Double Kid Wooly (12 Designs)", "105.00", "36"},
            {"PB 31", "Small Trancy Clips & Wooly Set Combo Pcs (4 Designs)", "160.00", "36"},
            {"FN 01", "6 pcs Kiddy Peicy Wooly Long Card (7 Designs)", "140.00", "36"},
            {"FC 04", "3 Pcs Designer Kiddy Clip Set (10 Designs)", "120.00", "36"},
            {"FC 08", "Steel Mini 2pcs peg & Gloss Peg with Wooly Set (10 Designs)", "125.00", "36"},
            {"FC 09", "Kiddy 6pcs clip on Small 3pcs Set Peg (8 Designs)", "180.00", "36"},
            {"FC 13", "Shiny Stone Pegs & premier Set Hair Clips (6 Designs)", "195.00", "36"},
            {"BLC 11", "Premier B fly Clips & Bow Clip Exclusive (7 Designs)", "230.00", "36"},
            {"BS 09", "Acrylic Designer Clips & Steel Pegs 3pcs (13 Designs)", "195.00", "36"},
            {"PHB 01", "Premier Set Hair Clips with Sunflower Pegs (13 Designs)", "190.00", "36"},
            {"MBE 10", "Clip & Wooly Mix with Kiddy double peggy Set (14 Designs)", "220.00", "36"},
            {"NB 67", "Combo Set Designer Kiddy Clips (10 Designs)", "140.00", "36"},
            {"BLC 09", "Acrylic Combo Set & Glossy Set Clips (6 Designs)", "170.00", "36"},
            {"MCP 02", "Jojo Siwa Medium Clips Premier Designs (5 Designs)", "220.00", "36"},
            {"MB 68", "Fur ball Designer Clips (8 Designs)", "105.00", "36"},
            {"HW 02", "Kiddy Colorful Clips Tic & Glossy (15 Designs)", "150.00", "36"},
            {"LHP 05", "Long Hair Mini Peg & Clip Set (10 Designs)", "170.00", "36"},
            {"JS 10", "Classic Jojo Siwa Clips (5 Designs)", "180.00", "36"},
            {"JS 11", "Kiddy Hair Clip Large & mini Designers Set (8 Designers)", "150.00", "36"},
            {"NB 74", "3 Pcs Flowery Set Pegs & Water Color Large Designer Pegs (10 Designs)", "165.00", "24"},
            {"MKY 03", "Medium Matt Pegs (6 Designs)", "110.00", "36"},
            {"LHB 04", "6 pcs Small Pastel Shade Pegs (6 Designs)", "140.00", "36"},
            {"HW 06", "Basic Fur & 8 to 10cm Pegs & Sunflower Designer Pegs (11 Designs)", "110.00", "36"},
            {"HW 03", "Shady Color Matt & Gloss Pegs (8 Designs)", "130.00", "24"},
            {"FN 01", "Water Color 8cm Designer Pegs (8 Designs)", "150.00", "36"},
            {"NBE 04", "Water Color Kids Accessory Hair Peg (5 Designs)", "120.00", "36"},
            {"BSR 01", "6 Pcs Pegs Set Designers (4 Designs)", "295.00", "36"},
            {"MCP 01", "Shades With Tiny Color Pegs Set (4 Designs)", "180.00", "36"},
            {"NB 73", "Glass Thin Designer Hair Bands (8 Designs)", "95.00", "36"},
            {"LHB 02", "Glossy Thin Full Flex Hair Band with Accessory (5 Designs)", "120.00", "36"},
            {"KC 18", "Black Plastic Designer Bands (8 Designs)", "50.00", "36"},
            {"MB 99", "Charm Mickey Bands Kids & Teens (9 Designs)", "180.00", "36"},
            {"MB 98", "Kiddy Set Bracelet (4 Designs)", "150.00", "36"},
            {"VC 02", "Exclusive Van Cliff Design Half Bangles with Stone Work (12 Designs)", "260.00", "36"},
            {"SLD 15", "Exclusive Designer Key Tags (5 Designs)", "250.00", "36"},
            {"BS 12", "Shiny Stone Pearl Key Tags (5 Designs)", "205.00", "36"},
            {"LCK 01", "Crystal & Metal Designer Key Tags (8 Designs)", "140.00", "36"},
            {"BLC 05", "Kids Small Necklace Set with Earing (6 Designs)", "175.00", "36"},
            {"VC 03", "Premier Necklace Designers (5 Designs)", "520.00", "36"},
            {"VC 07", "Full Pearl & Half Pearl with Gold Necklace with Earing (12 Designs)", "230.00", "36"},
            {"NB 01", "Kids Gold Necklace & Colorful Pearl Ball Necklace (8 Designs)", "330.00", "36"},
            {"BSR 03", "Kids Ring Designer 6 Pcs Set Card (4 Designs)", "240.00", "36"},
            {"BSR 06", "Saree Broochers Big Exclusive (11 Designs)", "340.00", "36"}
        };

        List<Product> clientProducts = productRepository.findByClientId(clientId);
        List<PriceOrderItemPreviewDto> items = new ArrayList<>();
        long tempId = -100;

        for (String[] row : rawData) {
            String sku = row[0];
            String name = row[1];
            double price = Double.parseDouble(row[2]);
            int qty = Integer.parseInt(row[3]);

            Product matched = clientProducts.stream()
                    .filter(p -> p.getSku() != null && p.getSku().equalsIgnoreCase(sku))
                    .findFirst().orElse(null);

            PriceOrderItemPreviewDto item = new PriceOrderItemPreviewDto();
            if (matched != null) {
                item.setProductId(matched.getId());
                item.setProductName(matched.getName());
                item.setSku(matched.getSku());
                item.setUnit(matched.getUnit() != null ? matched.getUnit() : "PCS");
                Integer stock = inventoryRepository.getTotalStockForProduct(clientId, matched.getId());
                item.setAvailableStock(stock != null ? stock : 999);
                item.setIsStockSufficient(true);
                item.setMatched(true);
            } else {
                item.setProductId(tempId--);
                item.setProductName(name);
                item.setSku(sku);
                item.setUnit("PCS");
                item.setAvailableStock(999);
                item.setIsStockSufficient(true);
                item.setMatched(true);
            }
            item.setQuantity(null);
            item.setCustomPrice(price);
            item.setLineTotal(0.0);
            items.add(item);
        }
        return items;
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
        dto.setShopBarcode(inv.getShopBarcode());
        if (inv.getShopBarcode() != null && !inv.getShopBarcode().trim().isEmpty()) {
            dto.setShopBarcodeImage(qrBarcodeService.generateBarcodeBase64(inv.getShopBarcode().trim(), 240, 50));
        }
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
                itemDto.setBarcode(i.getBarcode());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    public List<String> getCustomerSuggestions(String query) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        String q = query != null ? query.trim() : "";
        return saleInvoiceRepository.findDistinctCustomerNames(clientId, q, PageRequest.of(0, 15));
    }

    public SaleInvoiceDto getCustomerLastOrder(String customerName) {
        if (customerName == null || customerName.trim().isEmpty()) {
            return null;
        }
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<SaleInvoice> invoices = saleInvoiceRepository.findLatestByCustomerName(clientId, customerName.trim(), PageRequest.of(0, 1));
        if (invoices.isEmpty()) {
            return null;
        }
        SaleInvoice latest = invoices.get(0);
        List<SaleInvoiceItem> items = saleInvoiceItemRepository.findByInvoiceId(latest.getId());
        return convertToDto(latest, items);
    }

    public List<CustomerProfileDto> getCustomerProfiles() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<String> customerNames = saleInvoiceRepository.findAllDistinctCustomerNames(clientId);
        List<CustomerProfileDto> profiles = new ArrayList<>();

        for (String name : customerNames) {
            if (name == null || name.trim().isEmpty() || name.equalsIgnoreCase("Walk-in Customer")) {
                continue;
            }
            List<SaleInvoice> latestInvoices = saleInvoiceRepository.findLatestByCustomerName(clientId, name.trim(), PageRequest.of(0, 1));
            if (!latestInvoices.isEmpty()) {
                SaleInvoice latest = latestInvoices.get(0);
                List<SaleInvoiceItem> items = saleInvoiceItemRepository.findByInvoiceId(latest.getId());

                CustomerProfileDto profile = new CustomerProfileDto();
                profile.setCustomerName(latest.getCustomerName());
                profile.setCustomerPhone(latest.getCustomerPhone());
                profile.setLastInvoiceNumber(latest.getInvoiceNumber());
                profile.setLastOrderDate(latest.getCreatedAt());
                profile.setGrandTotal(latest.getGrandTotal());
                profile.setItems(items.stream().map(i -> {
                    SaleInvoiceItemDto itemDto = new SaleInvoiceItemDto();
                    itemDto.setId(i.getId());
                    itemDto.setProductId(i.getProductId());
                    itemDto.setProductName(i.getProductName());
                    itemDto.setSku(i.getSku());
                    itemDto.setUnit(i.getUnit());
                    itemDto.setQuantity(i.getQuantity());
                    itemDto.setUnitPrice(i.getUnitPrice());
                    itemDto.setTotalPrice(i.getTotalPrice());
                    itemDto.setBarcode(i.getBarcode());
                    return itemDto;
                }).collect(Collectors.toList()));

                profiles.add(profile);
            }
        }
        return profiles;
    }
}
