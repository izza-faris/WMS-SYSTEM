package com.wms.service;

import com.wms.dto.StockTransferRequest;
import com.wms.entity.*;
import com.wms.entity.enums.NotificationType;
import com.wms.entity.enums.TransactionType;
import com.wms.entity.enums.TransferStatus;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class StockTransferService {

    private final StockTransferRepository transferRepository;
    private final StockTransferItemRepository transferItemRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public StockTransferService(StockTransferRepository transferRepository, StockTransferItemRepository transferItemRepository,
                                WarehouseRepository warehouseRepository, InventoryRepository inventoryRepository,
                                StockTransactionRepository stockTransactionRepository, TenantSecurityService tenantSecurityService,
                                AuditLogService auditLogService, NotificationService notificationService) {
        this.transferRepository = transferRepository;
        this.transferItemRepository = transferItemRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public Page<StockTransfer> getTransfers(Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return transferRepository.findByClientId(clientId, pageable);
    }

    public List<StockTransferItem> getTransferItems(Long transferId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        StockTransfer transfer = transferRepository.findByIdAndClientId(transferId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));
        return transferItemRepository.findByTransferId(transfer.getId());
    }

    @Transactional
    public StockTransfer createTransferRequest(StockTransferRequest request) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        if (request.getSourceWarehouseId().equals(request.getDestWarehouseId())) {
            throw new BusinessRuleException("Source and Destination warehouses cannot be the same.");
        }

        // Validate both warehouses belong to the authenticated client (strict tenant isolation!)
        Warehouse srcWh = warehouseRepository.findByIdAndClientId(request.getSourceWarehouseId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse does not belong to your business."));
        Warehouse destWh = warehouseRepository.findByIdAndClientId(request.getDestWarehouseId(), clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse does not belong to your business."));

        tenantSecurityService.validateBranchAccess(srcWh.getBranchId());

        String transferNo = "TRF-" + System.currentTimeMillis() % 1000000;
        StockTransfer transfer = new StockTransfer(clientId, transferNo, srcWh.getId(), destWh.getId(), userId, request.getNotes());
        transfer = transferRepository.save(transfer);

        for (StockTransferRequest.Item item : request.getItems()) {
            // Reserve or verify stock in source warehouse
            Inventory srcInv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, srcWh.getId(), item.getSourceBinId(), item.getProductId(), item.getBatchId()
            ).orElseThrow(() -> new BusinessRuleException("Item not found in source warehouse location."));

            if (srcInv.getQuantity() < item.getQuantity()) {
                throw new BusinessRuleException("Insufficient source inventory for product ID: " + item.getProductId());
            }

            // Reserve quantity
            srcInv.setReservedQuantity(srcInv.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(srcInv);

            StockTransferItem transferItem = new StockTransferItem(
                    transfer.getId(), item.getProductId(), item.getBatchId(),
                    item.getSourceBinId(), item.getDestBinId(), item.getQuantity()
            );
            transferItemRepository.save(transferItem);
        }

        auditLogService.logClientAction(clientId, "TRANSFER_REQUESTED", "StockTransfer", transfer.getId(),
                "Created transfer request #" + transfer.getTransferNumber() + " from " + srcWh.getName() + " to " + destWh.getName());

        notificationService.createTenantNotification(clientId,
                "Transfer Request Pending",
                "New transfer request #" + transfer.getTransferNumber() + " requires review.",
                NotificationType.TRANSFER_REQUEST,
                "/app/transfers");

        return transfer;
    }

    @Transactional
    public StockTransfer approveTransfer(Long transferId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        StockTransfer transfer = transferRepository.findByIdAndClientId(transferId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new BusinessRuleException("Transfer is not in PENDING status.");
        }

        transfer.setStatus(TransferStatus.APPROVED);
        transfer.setApprovedBy(userId);
        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer dispatchTransfer(Long transferId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        StockTransfer transfer = transferRepository.findByIdAndClientId(transferId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));

        if (transfer.getStatus() != TransferStatus.APPROVED && transfer.getStatus() != TransferStatus.PENDING) {
            throw new BusinessRuleException("Transfer cannot be dispatched in current state.");
        }

        List<StockTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        for (StockTransferItem item : items) {
            Inventory srcInv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, transfer.getSourceWarehouseId(), item.getSourceBinId(), item.getProductId(), item.getBatchId()
            ).orElseThrow();

            int prevQty = srcInv.getQuantity();
            int newQty = prevQty - item.getQuantity();
            srcInv.setQuantity(newQty);
            srcInv.setReservedQuantity(Math.max(0, srcInv.getReservedQuantity() - item.getQuantity()));
            inventoryRepository.save(srcInv);

            // Record transaction
            StockTransaction tx = new StockTransaction(
                    clientId, transfer.getSourceWarehouseId(), item.getSourceBinId(), item.getProductId(), item.getBatchId(),
                    userId, TransactionType.TRANSFER_OUT, item.getQuantity(), prevQty, newQty,
                    transfer.getTransferNumber(), "Dispatched via transfer #" + transfer.getTransferNumber()
            );
            stockTransactionRepository.save(tx);
        }

        transfer.setStatus(TransferStatus.DISPATCHED);
        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer receiveTransfer(Long transferId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Long userId = tenantSecurityService.getCurrentUserId();

        StockTransfer transfer = transferRepository.findByIdAndClientId(transferId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));

        if (transfer.getStatus() != TransferStatus.DISPATCHED) {
            throw new BusinessRuleException("Transfer must be DISPATCHED before receiving.");
        }

        final Long destWhId = transfer.getDestWarehouseId();
        List<StockTransferItem> items = transferItemRepository.findByTransferId(transfer.getId());
        for (StockTransferItem item : items) {
            final Long destBinId = item.getDestBinId();
            final Long prodId = item.getProductId();
            final Long batchId = item.getBatchId();

            Inventory destInv = inventoryRepository.findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
                    clientId, destWhId, destBinId, prodId, batchId
            ).orElseGet(() -> new Inventory(clientId, destWhId, destBinId, prodId, batchId, 0));

            int prevQty = destInv.getQuantity();
            int newQty = prevQty + item.getQuantity();
            destInv.setQuantity(newQty);
            inventoryRepository.save(destInv);

            item.setReceivedQuantity(item.getQuantity());
            transferItemRepository.save(item);

            // Record transaction
            StockTransaction tx = new StockTransaction(
                    clientId, transfer.getDestWarehouseId(), item.getDestBinId(), item.getProductId(), item.getBatchId(),
                    userId, TransactionType.TRANSFER_IN, item.getQuantity(), prevQty, newQty,
                    transfer.getTransferNumber(), "Received from transfer #" + transfer.getTransferNumber()
            );
            stockTransactionRepository.save(tx);
        }

        transfer.setStatus(TransferStatus.COMPLETED);
        transfer = transferRepository.save(transfer);

        auditLogService.logClientAction(clientId, "TRANSFER_COMPLETED", "StockTransfer", transfer.getId(),
                "Completed transfer #" + transfer.getTransferNumber());

        return transfer;
    }
}
