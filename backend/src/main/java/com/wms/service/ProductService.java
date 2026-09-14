package com.wms.service;

import com.wms.dto.CategoryDto;
import com.wms.dto.ProductDto;
import com.wms.entity.Category;
import com.wms.entity.Inventory;
import com.wms.entity.Product;
import com.wms.entity.ProductBatch;
import com.wms.entity.StockTransaction;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.CategoryRepository;
import com.wms.repository.InventoryRepository;
import com.wms.repository.ProductBatchRepository;
import com.wms.repository.ProductRepository;
import com.wms.repository.StockTransactionRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductBatchRepository productBatchRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;
    private final QrBarcodeService qrBarcodeService;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository,
                          InventoryRepository inventoryRepository, ProductBatchRepository productBatchRepository,
                          StockTransactionRepository stockTransactionRepository, TenantSecurityService tenantSecurityService,
                          AuditLogService auditLogService, QrBarcodeService qrBarcodeService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.productBatchRepository = productBatchRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.qrBarcodeService = qrBarcodeService;
    }

    // Categories
    public List<CategoryDto> getCategories() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return categoryRepository.findByClientId(clientId).stream().map(c -> {
            CategoryDto dto = new CategoryDto();
            dto.setId(c.getId());
            dto.setClientId(c.getClientId());
            dto.setName(c.getName());
            dto.setDescription(c.getDescription());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(CategoryDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        if (categoryRepository.existsByClientIdAndName(clientId, dto.getName())) {
            throw new BusinessRuleException("Category '" + dto.getName() + "' already exists.");
        }
        Category category = new Category(clientId, dto.getName(), dto.getDescription());
        category = categoryRepository.save(category);
        dto.setId(category.getId());
        dto.setClientId(clientId);
        return dto;
    }

    // Products
    public Page<ProductDto> getProducts(String query, Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Page<Product> productsPage;
        if (query != null && !query.trim().isEmpty()) {
            productsPage = productRepository.searchProducts(clientId, query.trim(), pageable);
        } else {
            productsPage = productRepository.findByClientId(clientId, pageable);
        }

        return productsPage.map(this::convertProductToDto);
    }

    public List<ProductDto> getAllProductsList() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return productRepository.findByClientId(clientId).stream()
                .map(this::convertProductToDto)
                .collect(Collectors.toList());
    }

    public ProductDto getProductById(Long id) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Product product = productRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return convertProductToDto(product);
    }

    public ProductDto scanProduct(String code) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        // Lookup by Barcode, QR code, or SKU
        Product product = productRepository.findByClientIdAndBarcode(clientId, code)
                .or(() -> productRepository.findByClientIdAndQrCode(clientId, code))
                .or(() -> productRepository.findByClientIdAndSku(clientId, code))
                .orElseThrow(() -> new ResourceNotFoundException("No product found matching Barcode / QR: " + code));

        return convertProductToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();

        if (productRepository.existsByClientIdAndSku(clientId, dto.getSku())) {
            throw new BusinessRuleException("SKU '" + dto.getSku() + "' already exists for your business.");
        }

        if (dto.getBarcode() != null && !dto.getBarcode().trim().isEmpty() &&
                productRepository.existsByClientIdAndBarcode(clientId, dto.getBarcode())) {
            throw new BusinessRuleException("Barcode '" + dto.getBarcode() + "' already assigned to another product.");
        }

        // Auto-generate internal QR code if not provided
        String qr = (dto.getQrCode() != null && !dto.getQrCode().trim().isEmpty())
                ? dto.getQrCode()
                : "PROD-" + clientId + "-" + dto.getSku();

        Product product = new Product(
                clientId, dto.getCategoryId(), dto.getName(), dto.getSku(),
                dto.getBarcode(), qr, dto.getBrand(), dto.getUnit(),
                dto.getDescription(), dto.getReorderLevel(), dto.getMinStockLevel(),
                dto.getMaxStockLevel(), dto.getExpiryTrackingEnabled()
        );

        product = productRepository.save(product);
        auditLogService.logClientAction(clientId, "PRODUCT_CREATED", "Product", product.getId(),
                "Created product: " + product.getName() + " (SKU: " + product.getSku() + ")");

        return convertProductToDto(product);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Product product = productRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setName(dto.getName());
        product.setCategoryId(dto.getCategoryId());
        product.setBrand(dto.getBrand());
        product.setUnit(dto.getUnit());
        product.setDescription(dto.getDescription());
        product.setReorderLevel(dto.getReorderLevel());
        product.setMinStockLevel(dto.getMinStockLevel());
        product.setMaxStockLevel(dto.getMaxStockLevel());
        product.setExpiryTrackingEnabled(dto.getExpiryTrackingEnabled());
        if (dto.getIsActive() != null) {
            product.setIsActive(dto.getIsActive());
        }

        product = productRepository.save(product);
        auditLogService.logClientAction(clientId, "PRODUCT_UPDATED", "Product", product.getId(),
                "Updated product: " + product.getName());

        return convertProductToDto(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Product product = productRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        // Cascade delete related entities for this tenant and product
        List<Inventory> inventories = inventoryRepository.findByClientIdAndProductId(clientId, id);
        if (!inventories.isEmpty()) {
            inventoryRepository.deleteAll(inventories);
        }

        List<ProductBatch> batches = productBatchRepository.findByClientIdAndProductId(clientId, id);
        if (!batches.isEmpty()) {
            productBatchRepository.deleteAll(batches);
        }

        List<StockTransaction> transactions = stockTransactionRepository.findByClientIdAndProductId(clientId, id);
        if (!transactions.isEmpty()) {
            stockTransactionRepository.deleteAll(transactions);
        }

        productRepository.delete(product);

        auditLogService.logClientAction(clientId, "PRODUCT_DELETED", "Product", id,
                "Deleted product: " + product.getName() + " (SKU: " + product.getSku() + ")");
    }

    @Transactional
    public int importProductsExcel(MultipartFile file) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        int importedCount = 0;
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String name = getCellValueAsString(row.getCell(0));
                String sku = getCellValueAsString(row.getCell(1));
                String barcode = getCellValueAsString(row.getCell(2));
                String brand = getCellValueAsString(row.getCell(3));
                String unit = getCellValueAsString(row.getCell(4));

                if (name.isEmpty() || sku.isEmpty()) continue;
                if (productRepository.existsByClientIdAndSku(clientId, sku)) continue;

                Product p = new Product(clientId, null, name, sku, barcode, "PROD-" + clientId + "-" + sku,
                        brand, unit.isEmpty() ? "PCS" : unit, "", 10, 5, 1000, false);
                productRepository.save(p);
                importedCount++;
            }
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to parse Excel file: " + e.getMessage());
        }
        return importedCount;
    }

    public byte[] exportProductsExcel() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<Product> products = productRepository.findByClientId(clientId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Products");

            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Name", "SKU", "Barcode", "Brand", "Unit", "Reorder Level", "Total Stock"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getId());
                row.createCell(1).setCellValue(p.getName());
                row.createCell(2).setCellValue(p.getSku());
                row.createCell(3).setCellValue(p.getBarcode() != null ? p.getBarcode() : "");
                row.createCell(4).setCellValue(p.getBrand() != null ? p.getBrand() : "");
                row.createCell(5).setCellValue(p.getUnit());
                row.createCell(6).setCellValue(p.getReorderLevel());

                Integer stock = inventoryRepository.getTotalStockForProduct(clientId, p.getId());
                row.createCell(7).setCellValue(stock != null ? stock : 0);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to export Excel: " + e.getMessage());
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return "";
    }

    private ProductDto convertProductToDto(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setClientId(p.getClientId());
        dto.setCategoryId(p.getCategoryId());
        dto.setName(p.getName());
        dto.setSku(p.getSku());
        dto.setBarcode(p.getBarcode());
        dto.setQrCode(p.getQrCode());
        dto.setBrand(p.getBrand());
        dto.setUnit(p.getUnit());
        dto.setDescription(p.getDescription());
        dto.setReorderLevel(p.getReorderLevel());
        dto.setMinStockLevel(p.getMinStockLevel());
        dto.setMaxStockLevel(p.getMaxStockLevel());
        dto.setExpiryTrackingEnabled(p.getExpiryTrackingEnabled());
        dto.setIsActive(p.getIsActive());
        dto.setCreatedAt(p.getCreatedAt());

        if (p.getCategoryId() != null) {
            categoryRepository.findById(p.getCategoryId()).ifPresent(c -> dto.setCategoryName(c.getName()));
        }

        Integer stock = inventoryRepository.getTotalStockForProduct(p.getClientId(), p.getId());
        dto.setCurrentStock(stock != null ? stock : 0);

        return dto;
    }
}
