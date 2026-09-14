package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.InventoryBalanceDto;
import com.wms.dto.StockInRequest;
import com.wms.dto.StockOutRequest;
import com.wms.entity.StockTransaction;
import com.wms.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stock")
public class StockMovementController {

    private final InventoryService inventoryService;

    public StockMovementController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/in")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<InventoryBalanceDto>> stockIn(@Valid @RequestBody StockInRequest request) {
        InventoryBalanceDto balance = inventoryService.stockIn(request);
        return ResponseEntity.ok(ApiResponse.ok("Stock In completed successfully", balance));
    }

    @PostMapping("/out")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<InventoryBalanceDto>> stockOut(@Valid @RequestBody StockOutRequest request) {
        InventoryBalanceDto balance = inventoryService.stockOut(request);
        return ResponseEntity.ok(ApiResponse.ok("Stock Out completed successfully", balance));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<StockTransaction>>> getTransactions(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockTransactions(pageable)));
    }

    @DeleteMapping("/transactions/{id}")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        inventoryService.deleteStockTransaction(id);
        return ResponseEntity.ok(ApiResponse.ok("Stock movement transaction deleted successfully", null));
    }

    @DeleteMapping("/transactions/all")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> clearAllTransactions() {
        inventoryService.clearAllStockTransactions();
        return ResponseEntity.ok(ApiResponse.ok("All stock transactions cleared successfully", null));
    }
}
