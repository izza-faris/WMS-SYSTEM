package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.StockTransferRequest;
import com.wms.entity.StockTransfer;
import com.wms.entity.StockTransferItem;
import com.wms.service.StockTransferService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transfers")
public class StockTransferController {

    private final StockTransferService stockTransferService;

    public StockTransferController(StockTransferService stockTransferService) {
        this.stockTransferService = stockTransferService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockTransfer>>> getTransfers(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(stockTransferService.getTransfers(pageable)));
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<StockTransferItem>>> getTransferItems(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(stockTransferService.getTransferItems(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<StockTransfer>> createTransfer(@Valid @RequestBody StockTransferRequest request) {
        StockTransfer transfer = stockTransferService.createTransferRequest(request);
        return ResponseEntity.ok(ApiResponse.ok("Transfer request created successfully", transfer));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<StockTransfer>> approveTransfer(@PathVariable Long id) {
        StockTransfer transfer = stockTransferService.approveTransfer(id);
        return ResponseEntity.ok(ApiResponse.ok("Transfer approved", transfer));
    }

    @PutMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<StockTransfer>> dispatchTransfer(@PathVariable Long id) {
        StockTransfer transfer = stockTransferService.dispatchTransfer(id);
        return ResponseEntity.ok(ApiResponse.ok("Transfer dispatched", transfer));
    }

    @PutMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<StockTransfer>> receiveTransfer(@PathVariable Long id) {
        StockTransfer transfer = stockTransferService.receiveTransfer(id);
        return ResponseEntity.ok(ApiResponse.ok("Transfer received and inventory updated", transfer));
    }
}
