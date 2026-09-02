package com.wms;

import com.wms.dto.AuthRequest;
import com.wms.dto.AuthResponse;
import com.wms.dto.ProductDto;
import com.wms.dto.StockInRequest;
import com.wms.dto.StockOutRequest;
import com.wms.dto.InventoryBalanceDto;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.exception.TenantAccessDeniedException;
import com.wms.service.AuthService;
import com.wms.service.InventoryService;
import com.wms.service.ProductService;
import com.wms.service.TenantSecurityService;
import com.wms.config.TenantContext;
import com.wms.entity.enums.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TenantSecurityAndIsolationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private TenantSecurityService tenantSecurityService;

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Test 1: Authentication & JWT Login for Client A and Client B")
    void testLoginFlow() {
        // Login as Client Admin A (Apex Retailers Ltd)
        AuthResponse loginA = authService.login(new AuthRequest("admin@apexretailers.com", "Apex@123"));
        assertNotNull(loginA.getToken());
        assertEquals("admin@apexretailers.com", loginA.getEmail());
        assertEquals(Role.CLIENT_ADMIN, loginA.getRole());
        assertEquals("Apex Retailers Ltd", loginA.getCompanyName());

        // Login as Client Admin B (Zenith Logistics)
        AuthResponse loginB = authService.login(new AuthRequest("admin@zenithlogistics.com", "Zenith@123"));
        assertNotNull(loginB.getToken());
        assertEquals("Zenith Logistics Global", loginB.getCompanyName());
    }

    @Test
    @DisplayName("Test 2: STRICT MULTI-TENANT ISOLATION - Client A cannot access Client B's product")
    void testCrossTenantProductAccessBlocked() {
        // Authenticate as Client A (clientId: 1)
        TenantContext.set(new TenantContext.TenantInfo(2L, 1L, null, Role.CLIENT_ADMIN, "admin@apexretailers.com"));

        // Get Client A's product list
        List<ProductDto> productsA = productService.getAllProductsList();
        assertFalse(productsA.isEmpty());
        for (ProductDto p : productsA) {
            assertEquals(1L, p.getClientId(), "All returned products must belong exclusively to Client A");
        }

        // Authenticate as Client B (clientId: 2)
        TenantContext.set(new TenantContext.TenantInfo(5L, 2L, null, Role.CLIENT_ADMIN, "admin@zenithlogistics.com"));
        List<ProductDto> productsB = productService.getAllProductsList();
        assertFalse(productsB.isEmpty());
        for (ProductDto p : productsB) {
            assertEquals(2L, p.getClientId(), "All returned products must belong exclusively to Client B");
        }
        Long clientBProductId = productsB.get(0).getId();

        // Switch back to Client A and attempt to access Client B's Product ID
        TenantContext.set(new TenantContext.TenantInfo(2L, 1L, null, Role.CLIENT_ADMIN, "admin@apexretailers.com"));
        assertThrows(ResourceNotFoundException.class, () -> {
            productService.getProductById(clientBProductId);
        }, "Client A must receive ResourceNotFoundException when querying Client B's private Product ID");
    }

    @Test
    @DisplayName("Test 3: FEFO Engine & Inventory Stock Movement Flow")
    void testInventoryStockInAndOut() {
        // Authenticate as Client A
        TenantContext.set(new TenantContext.TenantInfo(2L, 1L, null, Role.CLIENT_ADMIN, "admin@apexretailers.com"));

        List<ProductDto> products = productService.getAllProductsList();
        ProductDto rice = products.stream().filter(p -> p.getSku().equals("RICE-BAS-001")).findFirst().orElseThrow();

        // Stock In 50 units
        StockInRequest inReq = new StockInRequest();
        inReq.setProductId(rice.getId());
        inReq.setWarehouseId(1L); // Colombo Main Warehouse
        inReq.setQuantity(50);
        inReq.setBatchNumber("BATCH-TEST-2026");
        inReq.setReferenceNumber("TEST-IN-01");
        inReq.setNotes("Automated test stock in");

        InventoryBalanceDto inResult = inventoryService.stockIn(inReq);
        assertNotNull(inResult);
        assertTrue(inResult.getQuantity() >= 50);

        // Stock Out 20 units
        StockOutRequest outReq = new StockOutRequest();
        outReq.setProductId(rice.getId());
        outReq.setWarehouseId(1L);
        outReq.setQuantity(20);
        outReq.setBatchId(inResult.getBatchId());
        outReq.setReferenceNumber("TEST-OUT-01");

        InventoryBalanceDto outResult = inventoryService.stockOut(outReq);
        assertNotNull(outResult);
        assertEquals(inResult.getQuantity() - 20, outResult.getQuantity());
    }

    @Test
    @DisplayName("Test 4: Negative Stock Protection Guard")
    void testNegativeStockBlocked() {
        // Authenticate as Client A
        TenantContext.set(new TenantContext.TenantInfo(2L, 1L, null, Role.CLIENT_ADMIN, "admin@apexretailers.com"));

        List<ProductDto> products = productService.getAllProductsList();
        ProductDto scanner = products.stream().filter(p -> p.getSku().equals("ELEC-SCN-004")).findFirst().orElseThrow();

        // Attempt Stock Out for 99999 units (exceeding balance)
        StockOutRequest outReq = new StockOutRequest();
        outReq.setProductId(scanner.getId());
        outReq.setWarehouseId(1L);
        outReq.setQuantity(99999);

        assertThrows(BusinessRuleException.class, () -> {
            inventoryService.stockOut(outReq);
        }, "Excessive stock out must be blocked when negative stock is disabled");
    }
}
