package com.wms.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardMetricsDto {
    private long totalProducts;
    private long totalInventoryQuantity;
    private long totalWarehouses;
    private long totalBranches;
    private long lowStockCount;
    private long outOfStockCount;
    private long expiringSoonCount;
    private long pendingAdjustmentsCount;
    private long pendingTransfersCount;
    private List<RecentActivityDto> recentActivities = new ArrayList<>();

    public static class RecentActivityDto {
        private String action;
        private String description;
        private String timestamp;

        public RecentActivityDto() {}

        public RecentActivityDto(String action, String description, String timestamp) {
            this.action = action;
            this.description = description;
            this.timestamp = timestamp;
        }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    public DashboardMetricsDto() {}

    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }

    public long getTotalInventoryQuantity() { return totalInventoryQuantity; }
    public void setTotalInventoryQuantity(long totalInventoryQuantity) { this.totalInventoryQuantity = totalInventoryQuantity; }

    public long getTotalWarehouses() { return totalWarehouses; }
    public void setTotalWarehouses(long totalWarehouses) { this.totalWarehouses = totalWarehouses; }

    public long getTotalBranches() { return totalBranches; }
    public void setTotalBranches(long totalBranches) { this.totalBranches = totalBranches; }

    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }

    public long getOutOfStockCount() { return outOfStockCount; }
    public void setOutOfStockCount(long outOfStockCount) { this.outOfStockCount = outOfStockCount; }

    public long getExpiringSoonCount() { return expiringSoonCount; }
    public void setExpiringSoonCount(long expiringSoonCount) { this.expiringSoonCount = expiringSoonCount; }

    public long getPendingAdjustmentsCount() { return pendingAdjustmentsCount; }
    public void setPendingAdjustmentsCount(long pendingAdjustmentsCount) { this.pendingAdjustmentsCount = pendingAdjustmentsCount; }

    public long getPendingTransfersCount() { return pendingTransfersCount; }
    public void setPendingTransfersCount(long pendingTransfersCount) { this.pendingTransfersCount = pendingTransfersCount; }

    public List<RecentActivityDto> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<RecentActivityDto> recentActivities) { this.recentActivities = recentActivities; }
}
