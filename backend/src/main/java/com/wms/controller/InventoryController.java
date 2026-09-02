package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.FefoBatchRecommendationDto;
import com.wms.dto.InventoryBalanceDto;
import com.wms.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryBalanceDto>>> getInventoryBalances(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getInventoryBalances(warehouseId, productId)));
    }

    @GetMapping("/fefo/{productId}")
    public ResponseEntity<ApiResponse<List<FefoBatchRecommendationDto>>> getFefoRecommendations(
            @PathVariable Long productId,
            @RequestParam(required = false) Long warehouseId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getFefoRecommendations(productId, warehouseId)));
    }
}
