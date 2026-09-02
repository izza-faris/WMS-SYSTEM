package com.wms.service;

import com.wms.dto.ChartDataDto;
import com.wms.dto.DashboardMetricsDto;
import com.wms.entity.*;
import com.wms.entity.enums.AdjustmentStatus;
import com.wms.entity.enums.TransactionType;
import com.wms.entity.enums.TransferStatus;
import com.wms.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final BranchRepository branchRepository;
    private final StockAdjustmentRepository adjustmentRepository;
    private final StockTransferRepository transferRepository;
    private final ProductBatchRepository productBatchRepository;
    private final AuditLogRepository auditLogRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final TenantSecurityService tenantSecurityService;

    public DashboardService(ProductRepository productRepository, InventoryRepository inventoryRepository,
                            WarehouseRepository warehouseRepository, BranchRepository branchRepository,
                            StockAdjustmentRepository adjustmentRepository, StockTransferRepository transferRepository,
                            ProductBatchRepository productBatchRepository, AuditLogRepository auditLogRepository,
                            StockTransactionRepository stockTransactionRepository, TenantSecurityService tenantSecurityService) {
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.warehouseRepository = warehouseRepository;
        this.branchRepository = branchRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.transferRepository = transferRepository;
        this.productBatchRepository = productBatchRepository;
        this.auditLogRepository = auditLogRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    public DashboardMetricsDto getTenantMetrics() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        DashboardMetricsDto dto = new DashboardMetricsDto();

        dto.setTotalProducts(productRepository.countByClientId(clientId));
        Long totalStock = inventoryRepository.getTotalStockQuantityForClient(clientId);
        dto.setTotalInventoryQuantity(totalStock != null ? totalStock : 0);
        dto.setTotalWarehouses(warehouseRepository.countByClientId(clientId));
        dto.setTotalBranches(branchRepository.countByClientId(clientId));

        // Low stock & Out of stock calculation
        List<Product> products = productRepository.findByClientId(clientId);
        long lowStock = 0;
        long outOfStock = 0;
        for (Product p : products) {
            Integer stock = inventoryRepository.getTotalStockForProduct(clientId, p.getId());
            int current = (stock != null) ? stock : 0;
            if (current == 0) {
                outOfStock++;
            } else if (current <= p.getReorderLevel()) {
                lowStock++;
            }
        }
        dto.setLowStockCount(lowStock);
        dto.setOutOfStockCount(outOfStock);

        // Expiring soon count (within next 30 days)
        LocalDate today = LocalDate.now();
        LocalDate in30Days = today.plusDays(30);
        List<ProductBatch> expiringBatches = productBatchRepository.findExpiringSoonBatches(clientId, today, in30Days);
        dto.setExpiringSoonCount(expiringBatches.size());

        // Pending adjustments and transfers
        dto.setPendingAdjustmentsCount(adjustmentRepository.countByClientIdAndStatus(clientId, AdjustmentStatus.PENDING));
        dto.setPendingTransfersCount(transferRepository.countByClientIdAndStatus(clientId, TransferStatus.PENDING));

        // Recent activity stream from audit log
        List<AuditLog> recentLogs = auditLogRepository.findTop20ByClientIdOrderByCreatedAtDesc(clientId);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
        List<DashboardMetricsDto.RecentActivityDto> activities = recentLogs.stream()
                .map(l -> new DashboardMetricsDto.RecentActivityDto(l.getAction(), l.getDescription(), l.getCreatedAt().format(dtf)))
                .collect(Collectors.toList());
        dto.setRecentActivities(activities);

        return dto;
    }

    public ChartDataDto getChartData() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        ChartDataDto chart = new ChartDataDto();

        // 7-day movement timeline
        DateTimeFormatter df = DateTimeFormatter.ofPattern("MM/dd");
        LocalDate now = LocalDate.now();
        List<String> labels = new ArrayList<>();
        List<Long> stockIn = new ArrayList<>();
        List<Long> stockOut = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            labels.add(date.format(df));
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            Long inQty = stockTransactionRepository.getTotalQuantityByTypeSince(clientId, TransactionType.STOCK_IN, dayStart);
            Long outQty = stockTransactionRepository.getTotalQuantityByTypeSince(clientId, TransactionType.STOCK_OUT, dayStart);

            stockIn.add(inQty != null ? inQty : 0L);
            stockOut.add(outQty != null ? outQty : 0L);
        }

        chart.setLabels(labels);
        chart.setStockInSeries(stockIn);
        chart.setStockOutSeries(stockOut);

        // Warehouse distribution
        List<Warehouse> warehouses = warehouseRepository.findByClientId(clientId);
        List<ChartDataDto.WarehouseStockPoint> distribution = new ArrayList<>();
        for (Warehouse wh : warehouses) {
            List<Inventory> invs = inventoryRepository.findByClientIdAndWarehouseId(clientId, wh.getId());
            long sum = invs.stream().mapToLong(Inventory::getQuantity).sum();
            distribution.add(new ChartDataDto.WarehouseStockPoint(wh.getName(), sum));
        }
        chart.setWarehouseDistribution(distribution);

        return chart;
    }
}
