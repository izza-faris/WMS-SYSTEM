package com.wms.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.wms.dto.InventoryBalanceDto;
import com.wms.entity.Product;
import com.wms.entity.StockTransaction;
import com.wms.exception.BusinessRuleException;
import com.wms.repository.ProductRepository;
import com.wms.repository.StockTransactionRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final InventoryService inventoryService;
    private final ProductRepository productRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final TenantSecurityService tenantSecurityService;

    public ReportService(InventoryService inventoryService, ProductRepository productRepository,
                         StockTransactionRepository stockTransactionRepository, TenantSecurityService tenantSecurityService) {
        this.inventoryService = inventoryService;
        this.productRepository = productRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    public byte[] generateInventoryPdf() {
        List<InventoryBalanceDto> items = inventoryService.getInventoryBalances(null, null);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(15, 23, 42));
            Paragraph title = new Paragraph("Warehouse Inventory Balance Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subtitle = new Paragraph("Generated on: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY));
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Table
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 3.5f, 2f, 2.5f, 2f, 2f, 2f});

            // Table Headers
            String[] headers = {"Product ID", "Product Name", "SKU", "Warehouse", "Location Bin", "Batch", "Quantity"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                cell.setBackgroundColor(new Color(30, 41, 59));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Table Rows
            for (InventoryBalanceDto item : items) {
                table.addCell(new Phrase(String.valueOf(item.getProductId()), FontFactory.getFont(FontFactory.HELVETICA, 9)));
                table.addCell(new Phrase(item.getProductName() != null ? item.getProductName() : "", FontFactory.getFont(FontFactory.HELVETICA, 9)));
                table.addCell(new Phrase(item.getSku() != null ? item.getSku() : "", FontFactory.getFont(FontFactory.HELVETICA, 9)));
                table.addCell(new Phrase(item.getWarehouseName() != null ? item.getWarehouseName() : "", FontFactory.getFont(FontFactory.HELVETICA, 9)));
                table.addCell(new Phrase(item.getBinCode() != null ? item.getBinCode() : "Unassigned", FontFactory.getFont(FontFactory.HELVETICA, 9)));
                table.addCell(new Phrase(item.getBatchNumber() != null ? item.getBatchNumber() : "-", FontFactory.getFont(FontFactory.HELVETICA, 9)));
                
                PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
                qtyCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(qtyCell);
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to generate Inventory PDF: " + e.getMessage());
        }
    }

    public byte[] generateStockMovementExcel() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<StockTransaction> transactions = stockTransactionRepository.findByClientId(clientId, PageRequest.of(0, 1000)).getContent();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Stock Movements");

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Tx ID", "Date", "Type", "Product ID", "Warehouse ID", "Quantity", "Prev Balance", "New Balance", "Reference", "Notes"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            int rowIdx = 1;
            for (StockTransaction st : transactions) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(st.getId());
                row.createCell(1).setCellValue(st.getCreatedAt().format(dtf));
                row.createCell(2).setCellValue(st.getTransactionType().name());
                row.createCell(3).setCellValue(st.getProductId());
                row.createCell(4).setCellValue(st.getWarehouseId());
                row.createCell(5).setCellValue(st.getQuantity());
                row.createCell(6).setCellValue(st.getPreviousQuantity());
                row.createCell(7).setCellValue(st.getNewQuantity());
                row.createCell(8).setCellValue(st.getReferenceNumber() != null ? st.getReferenceNumber() : "");
                row.createCell(9).setCellValue(st.getNotes() != null ? st.getNotes() : "");
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to generate Movements Excel: " + e.getMessage());
        }
    }
}
