package com.wms.controller;

import com.wms.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/inventory/pdf")
    public ResponseEntity<byte[]> downloadInventoryPdf() {
        byte[] pdf = reportService.generateInventoryPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory_report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/movements/excel")
    public ResponseEntity<byte[]> downloadMovementsExcel() {
        byte[] excel = reportService.generateStockMovementExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock_movements.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excel);
    }
}
