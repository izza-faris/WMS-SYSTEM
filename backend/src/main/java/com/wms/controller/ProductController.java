package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.ProductDto;
import com.wms.service.ProductService;
import com.wms.service.QrBarcodeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final QrBarcodeService qrBarcodeService;

    public ProductController(ProductService productService, QrBarcodeService qrBarcodeService) {
        this.productService = productService;
        this.qrBarcodeService = qrBarcodeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getProducts(
            @RequestParam(required = false) String query,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProducts(query, pageable)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getAllProductsList() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getAllProductsList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @GetMapping("/scan/{code}")
    public ResponseEntity<ApiResponse<ProductDto>> scanProduct(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.ok(productService.scanProduct(code)));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody ProductDto dto) {
        ProductDto created = productService.createProduct(dto);
        return ResponseEntity.ok(ApiResponse.ok("Product created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDto dto) {
        ProductDto updated = productService.updateProduct(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", updated));
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<String>> importProducts(@RequestParam("file") MultipartFile file) {
        int count = productService.importProductsExcel(file);
        return ResponseEntity.ok(ApiResponse.ok("Successfully imported " + count + " products.", null));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProducts() {
        byte[] excelBytes = productService.exportProductsExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelBytes);
    }

    @GetMapping("/{id}/qr-image")
    public ResponseEntity<ApiResponse<String>> getProductQrImage(@PathVariable Long id) {
        ProductDto product = productService.getProductById(id);
        String base64 = qrBarcodeService.generateQrCodeBase64(product.getQrCode(), 250, 250);
        return ResponseEntity.ok(ApiResponse.ok(base64));
    }

    @GetMapping("/{id}/barcode-image")
    public ResponseEntity<ApiResponse<String>> getProductBarcodeImage(@PathVariable Long id) {
        ProductDto product = productService.getProductById(id);
        String code = product.getBarcode() != null && !product.getBarcode().isEmpty() ? product.getBarcode() : product.getSku();
        String base64 = qrBarcodeService.generateBarcodeBase64(code, 300, 100);
        return ResponseEntity.ok(ApiResponse.ok(base64));
    }
}
