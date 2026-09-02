package com.wms.controller;

import com.wms.dto.*;
import com.wms.service.QrBarcodeService;
import com.wms.service.WarehouseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final QrBarcodeService qrBarcodeService;

    public WarehouseController(WarehouseService warehouseService, QrBarcodeService qrBarcodeService) {
        this.warehouseService = warehouseService;
        this.qrBarcodeService = qrBarcodeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> getAllWarehouses(
            @RequestParam(required = false) Long branchId) {
        if (branchId != null) {
            return ResponseEntity.ok(ApiResponse.ok(warehouseService.getWarehousesByBranch(branchId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getAllWarehouses()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseDto>> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getWarehouseById(id)));
    }

    @GetMapping("/{id}/tree")
    public ResponseEntity<ApiResponse<WarehouseTreeDto>> getWarehouseHierarchy(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getWarehouseHierarchyTree(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseDto>> createWarehouse(@Valid @RequestBody WarehouseDto dto) {
        WarehouseDto created = warehouseService.createWarehouse(dto);
        return ResponseEntity.ok(ApiResponse.ok("Warehouse created successfully", created));
    }

    @PostMapping("/{id}/zones")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<ZoneDto>> addZone(@PathVariable Long id, @Valid @RequestBody ZoneDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.addZone(id, dto)));
    }

    @PostMapping("/zones/{zoneId}/racks")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<RackDto>> addRack(@PathVariable Long zoneId, @Valid @RequestBody RackDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.addRack(zoneId, dto)));
    }

    @PostMapping("/racks/{rackId}/shelves")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<ShelfDto>> addShelf(@PathVariable Long rackId, @Valid @RequestBody ShelfDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.addShelf(rackId, dto)));
    }

    @PostMapping("/shelves/{shelfId}/bins")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<BinDto>> addBin(@PathVariable Long shelfId, @Valid @RequestBody BinDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.addBin(shelfId, dto)));
    }

    @GetMapping("/bins/qr/{qrCode}")
    public ResponseEntity<ApiResponse<BinDto>> getBinByQr(@PathVariable String qrCode) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.findBinByQrCode(qrCode)));
    }

    @GetMapping("/bins/{id}/qr-image")
    public ResponseEntity<ApiResponse<String>> getBinQrImage(@PathVariable Long id) {
        // Find bin QR string
        WarehouseTreeDto.class.getName(); // Reference
        return ResponseEntity.ok(ApiResponse.ok(qrBarcodeService.generateQrCodeBase64("BIN-" + id, 250, 250)));
    }
}
