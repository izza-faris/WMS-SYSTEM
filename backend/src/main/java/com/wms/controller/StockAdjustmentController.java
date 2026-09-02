package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.StockAdjustmentRequest;
import com.wms.entity.StockAdjustment;
import com.wms.service.StockAdjustmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/adjustments")
public class StockAdjustmentController {

    private final StockAdjustmentService stockAdjustmentService;

    public StockAdjustmentController(StockAdjustmentService stockAdjustmentService) {
        this.stockAdjustmentService = stockAdjustmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<StockAdjustment>>> getAdjustments(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(stockAdjustmentService.getAdjustments(pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<StockAdjustment>> requestAdjustment(@Valid @RequestBody StockAdjustmentRequest request) {
        StockAdjustment adj = stockAdjustmentService.requestAdjustment(request);
        return ResponseEntity.ok(ApiResponse.ok("Stock adjustment request created", adj));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<StockAdjustment>> reviewAdjustment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        boolean approve = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("approve", "false")));
        String notes = (String) payload.getOrDefault("reviewNotes", "");
        StockAdjustment adj = stockAdjustmentService.reviewAdjustment(id, approve, notes);
        return ResponseEntity.ok(ApiResponse.ok("Adjustment review processed", adj));
    }
}
