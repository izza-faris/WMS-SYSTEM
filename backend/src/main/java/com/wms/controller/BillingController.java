package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.CheckoutRequest;
import com.wms.dto.SaleInvoiceDto;
import com.wms.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<SaleInvoiceDto>> checkout(@Valid @RequestBody CheckoutRequest request) {
        SaleInvoiceDto invoice = billingService.checkout(request);
        return ResponseEntity.ok(ApiResponse.ok("Sale completed and bill generated successfully", invoice));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<Page<SaleInvoiceDto>>> getInvoices(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(billingService.getInvoices(query, pageable)));
    }

    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('CLIENT_ADMIN', 'BRANCH_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<ApiResponse<SaleInvoiceDto>> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(billingService.getInvoiceById(id)));
    }
}
