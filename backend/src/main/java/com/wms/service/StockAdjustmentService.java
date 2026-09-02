package com.wms.service;

import com.wms.dto.StockAdjustmentRequest;
import com.wms.entity.*;
import com.wms.entity.enums.AdjustmentStatus;
import com.wms.entity.enums.NotificationType;
import com.wms.entity.enums.TransactionType;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StockAdjustmentService {

    private final StockAdjustmentRepository adjustmentRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public StockAdjustmentService(StockAdjustmentRepository adjustmentRepository, InventoryRepository inventoryRepository,
                                  ProductRepository productRepository, WarehouseRepository warehouseRepository,
                                  StockTransactionRepository stockTransactionRepository, TenantSecurityService tenantSecurityService,
                                  AuditLogService auditLogService, NotificationService notificationService) {
        this.adjustmentRepository = adjustmentRepository;
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public Page<StockAdjustment> getAdjustments(Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return adjustmentRepository.findByClientId(clientId, pageable);
    }

    @Transactional
    public StockAdjustment requestAdjustment(StockAdjustmentRequest request) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        Warehouse wh = warehouseRepository.findByIdAndClientId(request.getWarehouseId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product prod = productRepository.findByIdAndClientId(request.getProductId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Inventory inv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                clientId, request.getWarehouseId(), request.getBinId(), request.getProductId(), request.getBatchId()
        ).orElseGet(() -> new Inventory(clientId, request.getWarehouseId(), request.getBinId(), request.getProductId(), request.getBatchId(), 0));

        int systemQty = inv.getQuantity();
        String adjNo = "ADJ-" + System.currentTimeMillis() % 1000000;

        StockAdjustment adjustment = new StockAdjustment(
                clientId, adjNo, request.getWarehouseId(), request.getBinId(),
                request.getProductId(), request.getBatchId(), systemQty, request.getPhysicalQuantity(),
                request.getReason(), userId
        );

        adjustment = adjustmentRepository.save(adjustment);

        auditLogService.logClientAction(clientId, "ADJUSTMENT_REQUESTED", "StockAdjustment", adjustment.getId(),
                "Adjustment request #" + adjustment.getAdjustmentNumber() + " for " + prod.getName() + " (Diff: " + adjustment.getDiscrepancyQuantity() + ")");

        notificationService.createTenantNotification(clientId,
                "Stock Discrepancy Adjustment Required",
                "Adjustment #" + adjustment.getAdjustmentNumber() + " submitted: Difference of " + adjustment.getDiscrepancyQuantity() + " units for " + prod.getName(),
                NotificationType.ADJUSTMENT_REQUEST,
                "/app/stock/adjustments");

        return adjustment;
    }

    @Transactional
    public StockAdjustment reviewAdjustment(Long adjustmentId, boolean approve, String reviewNotes) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        StockAdjustment adjustment = adjustmentRepository.findByIdAndClientId(adjustmentId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjustment not found with ID: " + adjustmentId));

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new BusinessRuleException("Adjustment is already " + adjustment.getStatus());
        }

        adjustment.setReviewedBy(userId);
        adjustment.setReviewNotes(reviewNotes);
        adjustment.setReviewedAt(LocalDateTime.now());

        if (approve) {
            adjustment.setStatus(AdjustmentStatus.APPROVED);

            final Long adjWhId = adjustment.getWarehouseId();
            final Long adjBinId = adjustment.getBinId();
            final Long adjProdId = adjustment.getProductId();
            final Long adjBatchId = adjustment.getBatchId();

            // Reconcile Inventory
            Inventory inv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, adjWhId, adjBinId, adjProdId, adjBatchId
            ).orElseGet(() -> new Inventory(clientId, adjWhId, adjBinId, adjProdId, adjBatchId, 0));

            int prevQty = inv.getQuantity();
            int newQty = adjustment.getPhysicalQuantity();
            int diff = adjustment.getDiscrepancyQuantity();
            inv.setQuantity(newQty);
            inventoryRepository.save(inv);

            TransactionType txType = diff >= 0 ? TransactionType.ADJUSTMENT_ADD : TransactionType.ADJUSTMENT_SUB;
            StockTransaction tx = new StockTransaction(
                    clientId, adjustment.getWarehouseId(), adjustment.getBinId(), adjustment.getProductId(), adjustment.getBatchId(),
                    userId, txType, Math.abs(diff), prevQty, newQty,
                    adjustment.getAdjustmentNumber(), "Physical Stock Reconciled: " + adjustment.getReason()
            );
            stockTransactionRepository.save(tx);

            auditLogService.logClientAction(clientId, "ADJUSTMENT_APPROVED", "StockAdjustment", adjustment.getId(),
                    "Approved adjustment #" + adjustment.getAdjustmentNumber() + ". Inventory reconciled to " + newQty);
        } else {
            adjustment.setStatus(AdjustmentStatus.REJECTED);
            auditLogService.logClientAction(clientId, "ADJUSTMENT_REJECTED", "StockAdjustment", adjustment.getId(),
                    "Rejected adjustment #" + adjustment.getAdjustmentNumber() + ". Notes: " + reviewNotes);
        }

        return adjustmentRepository.save(adjustment);
    }
}
