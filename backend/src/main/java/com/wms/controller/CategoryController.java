package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.CategoryDto;
import com.wms.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final ProductService productService;

    public CategoryController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getCategories()));
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT_ADMIN')")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CategoryDto dto) {
        CategoryDto created = productService.createCategory(dto);
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", created));
    }
}
