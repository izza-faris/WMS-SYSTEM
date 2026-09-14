package com.wms.service;

import com.wms.dto.*;
import com.wms.entity.*;
import com.wms.entity.enums.NotificationType;
import com.wms.entity.enums.TransactionType;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final WarehouseRepository warehouseRepository;
    private final BinRepository binRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final ClientRepository clientRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository,
                            ProductBatchRepository productBatchRepository, WarehouseRepository warehouseRepository,
                            BinRepository binRepository, StockTransactionRepository stockTransactionRepository,
                            ClientRepository clientRepository, TenantSecurityService tenantSecurityService,
                            AuditLogService auditLogService, NotificationService notificationService) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.productBatchRepository = productBatchRepository;
        this.warehouseRepository = warehouseRepository;
        this.binRepository = binRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.clientRepository = clientRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public List<InventoryBalanceDto> getInventoryBalances(Long warehouseId, Long productId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<Inventory> list;

        if (warehouseId != null && productId != null) {
            list = inventoryRepository.findByClientIdAndWarehouseId(clientId, warehouseId).stream()
                    .filter(i -> i.getProductId().equals(productId))
                    .collect(Collectors.toList());
        } else if (warehouseId != null) {
            list = inventoryRepository.findByClientIdAndWarehouseId(clientId, warehouseId);
        } else if (productId != null) {
            list = inventoryRepository.findByClientIdAndProductId(clientId, productId);
        } else {
            list = inventoryRepository.findByClientId(clientId);
        }

        return list.stream().map(this::convertInventoryToDto).collect(Collectors.toList());
    }

    public List<FefoBatchRecommendationDto> getFefoRecommendations(Long productId, Long warehouseId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<ProductBatch> batches = productBatchRepository.findBatchesFefoOrder(clientId, productId);
        List<FefoBatchRecommendationDto> recommendations = new ArrayList<>();

        for (ProductBatch b : batches) {
            List<Inventory> invList = inventoryRepository.findByClientIdAndProductId(clientId, productId).stream()
                    .filter(i -> b.getId().equals(i.getBatchId()) && (warehouseId == null || warehouseId.equals(i.getWarehouseId())))
                    .filter(i -> i.getQuantity() > 0)
                    .collect(Collectors.toList());

            for (Inventory inv : invList) {
                String binCode = inv.getBinId() != null
                        ? binRepository.findById(inv.getBinId()).map(Bin::getCode).orElse(null)
                        : null;

                recommendations.add(new FefoBatchRecommendationDto(
                        b.getId(), b.getBatchNumber(), b.getExpiryDate(),
                        inv.getQuantity(), inv.getQuantity(), inv.getWarehouseId(), inv.getBinId(), binCode
                ));
            }
        }
        return recommendations;
    }

    @Transactional
    public InventoryBalanceDto stockIn(StockInRequest request) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        Long warehouseId = request.getWarehouseId();
        Warehouse wh = null;
        if (warehouseId != null) {
            wh = warehouseRepository.findByIdAndClientId(warehouseId, clientId).orElse(null);
        }
        if (wh == null) {
            List<Warehouse> clientWhs = warehouseRepository.findByClientId(clientId);
            if (!clientWhs.isEmpty()) {
                wh = clientWhs.get(0);
            } else {
                throw new ResourceNotFoundException("No warehouse found for this account. Please create a warehouse first.");
            }
        }
        request.setWarehouseId(wh.getId());
        tenantSecurityService.validateBranchAccess(wh.getBranchId());

        Product product = productRepository.findByIdAndClientId(request.getProductId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        Long batchId = null;
        if (request.getBatchNumber() != null && !request.getBatchNumber().trim().isEmpty()) {
            ProductBatch batch = productBatchRepository.findByClientIdAndProductIdAndBatchNumber(clientId, product.getId(), request.getBatchNumber().trim())
                    .orElseGet(() -> {
                        ProductBatch newBatch = new ProductBatch(clientId, product.getId(), request.getBatchNumber().trim(),
                                request.getMfgDate(), request.getExpiryDate(), request.getQuantity());
                        return productBatchRepository.save(newBatch);
                    });
            batchId = batch.getId();
        }

        final Long finalBatchId = batchId;
        // Fetch or create Inventory balance record
        Inventory inventory = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                clientId, request.getWarehouseId(), request.getBinId(), product.getId(), finalBatchId
        ).orElseGet(() -> new Inventory(clientId, request.getWarehouseId(), request.getBinId(), product.getId(), finalBatchId, 0));

        int prevQty = inventory.getQuantity();
        int newQty = prevQty + request.getQuantity();
        inventory.setQuantity(newQty);
        inventory = inventoryRepository.save(inventory);

        // Record stock transaction
        StockTransaction tx = new StockTransaction(
                clientId, request.getWarehouseId(), request.getBinId(), product.getId(), batchId,
                userId, TransactionType.STOCK_IN, request.getQuantity(), prevQty, newQty,
                request.getReferenceNumber(), request.getNotes()
        );
        stockTransactionRepository.save(tx);

        auditLogService.logClientAction(clientId, "STOCK_IN", "Inventory", inventory.getId(),
                "Stock In: +" + request.getQuantity() + " " + product.getName() + " into " + wh.getName());

        return convertInventoryToDto(inventory);
    }

    @Transactional
    public InventoryBalanceDto stockOut(StockOutRequest request) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        Long warehouseId = request.getWarehouseId();
        Warehouse wh = null;
        if (warehouseId != null) {
            wh = warehouseRepository.findByIdAndClientId(warehouseId, clientId).orElse(null);
        }
        if (wh == null) {
            // Check if product exists in any warehouse with quantity > 0
            List<Inventory> stockLocations = inventoryRepository.findByClientIdAndProductId(clientId, request.getProductId()).stream()
                    .filter(i -> i.getQuantity() > 0)
                    .collect(Collectors.toList());
            if (!stockLocations.isEmpty()) {
                wh = warehouseRepository.findById(stockLocations.get(0).getWarehouseId()).orElse(null);
            }
            if (wh == null) {
                List<Warehouse> clientWhs = warehouseRepository.findByClientId(clientId);
                if (!clientWhs.isEmpty()) {
                    wh = clientWhs.get(0);
                } else {
                    throw new ResourceNotFoundException("No warehouse found for this account.");
                }
            }
        }
        request.setWarehouseId(wh.getId());
        tenantSecurityService.validateBranchAccess(wh.getBranchId());

        Product product = productRepository.findByIdAndClientId(request.getProductId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found."));

        Client client = clientRepository.findById(clientId).orElseThrow();

        // If batch not specified, try to resolve via FEFO recommendations
        Long batchId = request.getBatchId();
        if (batchId == null) {
            List<FefoBatchRecommendationDto> fefo = getFefoRecommendations(product.getId(), request.getWarehouseId());
            if (!fefo.isEmpty()) {
                batchId = fefo.get(0).getBatchId();
            }
        }

        Inventory inventory = null;
        if (batchId != null) {
            inventory = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, request.getWarehouseId(), request.getBinId(), product.getId(), batchId
            ).orElse(null);
        }

        if (inventory == null) {
            // Check if there is inventory with null batchId
            inventory = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, request.getWarehouseId(), request.getBinId(), product.getId(), null
            ).orElse(null);
        }

        if (inventory == null) {
            // Check any available inventory for this product at the specified warehouse
            List<Inventory> warehouseInv = inventoryRepository.findByClientIdAndWarehouseId(clientId, request.getWarehouseId()).stream()
                    .filter(i -> i.getProductId().equals(product.getId()) && i.getQuantity() > 0)
                    .sorted((a, b) -> Integer.compare(b.getQuantity(), a.getQuantity()))
                    .collect(Collectors.toList());
            if (!warehouseInv.isEmpty()) {
                inventory = warehouseInv.get(0);
                batchId = inventory.getBatchId();
            }
        }

        if (inventory == null) {
            // Check if product exists in ANY warehouse for this client to give clear error
            List<Inventory> anyInv = inventoryRepository.findByClientIdAndProductId(clientId, product.getId()).stream()
                    .filter(i -> i.getQuantity() > 0)
                    .collect(Collectors.toList());
            if (!anyInv.isEmpty()) {
                Warehouse actualWh = warehouseRepository.findById(anyInv.get(0).getWarehouseId()).orElse(null);
                String actualWhName = actualWh != null ? actualWh.getName() : "another warehouse";
                throw new BusinessRuleException("No inventory found at '" + wh.getName() + "'. Available stock (" + 
                        anyInv.get(0).getQuantity() + " units) is located in warehouse: '" + actualWhName + "'. Please select '" + actualWhName + "'.");
            }
            throw new BusinessRuleException("No inventory found for '" + product.getName() + "' at the selected warehouse/location.");
        }

        int prevQty = inventory.getQuantity();
        if (prevQty < request.getQuantity() && !client.getAllowNegativeStock()) {
            throw new BusinessRuleException("Insufficient stock! Available: " + prevQty + ", Requested: " + request.getQuantity());
        }

        int newQty = prevQty - request.getQuantity();
        inventory.setQuantity(newQty);
        inventory = inventoryRepository.save(inventory);

        // Record stock transaction
        StockTransaction tx = new StockTransaction(
                clientId, request.getWarehouseId(), request.getBinId(), product.getId(), batchId,
                userId, TransactionType.STOCK_OUT, request.getQuantity(), prevQty, newQty,
                request.getReferenceNumber(), request.getNotes()
        );
        stockTransactionRepository.save(tx);

        auditLogService.logClientAction(clientId, "STOCK_OUT", "Inventory", inventory.getId(),
                "Stock Out: -" + request.getQuantity() + " " + product.getName() + " from " + wh.getName());

        // Check if total client stock <= reorder level
        Integer totalStock = inventoryRepository.getTotalStockForProduct(clientId, product.getId());
        if (totalStock != null && totalStock <= product.getReorderLevel()) {
            notificationService.createTenantNotification(clientId,
                    "Low Stock Alert: " + product.getName(),
                    "Stock level for " + product.getName() + " (SKU: " + product.getSku() + ") is now " + totalStock + ", below reorder level " + product.getReorderLevel(),
                    NotificationType.LOW_STOCK,
                    "/app/inventory");
        }

        return convertInventoryToDto(inventory);
    }

    public Page<StockTransaction> getStockTransactions(Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return stockTransactionRepository.findByClientId(clientId, pageable);
    }

    @Transactional
    public void deleteStockTransaction(Long transactionId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        StockTransaction tx = stockTransactionRepository.findById(transactionId)
                .filter(t -> t.getClientId().equals(clientId))
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + transactionId));

        // Revert stock balance in Inventory if applicable
        Inventory inv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                clientId, tx.getWarehouseId(), tx.getBinId(), tx.getProductId(), tx.getBatchId()
        ).orElse(null);

        if (inv != null) {
            if (tx.getTransactionType() == TransactionType.STOCK_IN || tx.getTransactionType() == TransactionType.ADJUSTMENT_ADD) {
                int newQty = Math.max(0, inv.getQuantity() - tx.getQuantity());
                inv.setQuantity(newQty);
                inventoryRepository.save(inv);
            } else if (tx.getTransactionType() == TransactionType.STOCK_OUT || tx.getTransactionType() == TransactionType.ADJUSTMENT_SUB) {
                inv.setQuantity(inv.getQuantity() + tx.getQuantity());
                inventoryRepository.save(inv);
            }
        }

        stockTransactionRepository.delete(tx);
        auditLogService.logClientAction(clientId, "STOCK_TRANSACTION_DELETED", "StockTransaction", transactionId,
                "Deleted stock movement #" + transactionId + " (" + tx.getTransactionType() + " qty: " + tx.getQuantity() + ")");
    }

    @Transactional
    public void clearAllStockTransactions() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        stockTransactionRepository.deleteByClientId(clientId);
        auditLogService.logClientAction(clientId, "STOCK_TRANSACTIONS_CLEARED", "StockTransaction", null,
                "Cleared all stock movement transactions for tenant.");
    }

    private InventoryBalanceDto convertInventoryToDto(Inventory inv) {
        InventoryBalanceDto dto = new InventoryBalanceDto();
        dto.setId(inv.getId());
        dto.setProductId(inv.getProductId());
        dto.setWarehouseId(inv.getWarehouseId());
        dto.setBinId(inv.getBinId());
        dto.setBatchId(inv.getBatchId());
        dto.setQuantity(inv.getQuantity());
        dto.setReservedQuantity(inv.getReservedQuantity());
        dto.setAvailableQuantity(inv.getQuantity() - inv.getReservedQuantity());
        dto.setUpdatedAt(inv.getUpdatedAt());

        productRepository.findById(inv.getProductId()).ifPresent(p -> {
            dto.setProductName(p.getName());
            dto.setSku(p.getSku());
            dto.setBarcode(p.getBarcode());
        });

        warehouseRepository.findById(inv.getWarehouseId()).ifPresent(w -> dto.setWarehouseName(w.getName()));

        if (inv.getBinId() != null) {
            binRepository.findById(inv.getBinId()).ifPresent(b -> {
                dto.setBinCode(b.getCode());
                dto.setBinQrCode(b.getQrCode());
            });
        }

        if (inv.getBatchId() != null) {
            productBatchRepository.findById(inv.getBatchId()).ifPresent(b -> {
                dto.setBatchNumber(b.getBatchNumber());
                dto.setExpiryDate(b.getExpiryDate());
            });
        }

        return dto;
    }
}
