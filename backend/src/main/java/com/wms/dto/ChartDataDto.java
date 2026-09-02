package com.wms.dto;

import java.util.ArrayList;
import java.util.List;

public class ChartDataDto {
    private List<String> labels = new ArrayList<>();
    private List<Long> stockInSeries = new ArrayList<>();
    private List<Long> stockOutSeries = new ArrayList<>();
    private List<WarehouseStockPoint> warehouseDistribution = new ArrayList<>();

    public static class WarehouseStockPoint {
        private String warehouseName;
        private long totalQuantity;

        public WarehouseStockPoint() {}

        public WarehouseStockPoint(String warehouseName, long totalQuantity) {
            this.warehouseName = warehouseName;
            this.totalQuantity = totalQuantity;
        }

        public String getWarehouseName() { return warehouseName; }
        public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }

        public long getTotalQuantity() { return totalQuantity; }
        public void setTotalQuantity(long totalQuantity) { this.totalQuantity = totalQuantity; }
    }

    public ChartDataDto() {}

    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }

    public List<Long> getStockInSeries() { return stockInSeries; }
    public void setStockInSeries(List<Long> stockInSeries) { this.stockInSeries = stockInSeries; }

    public List<Long> getStockOutSeries() { return stockOutSeries; }
    public void setStockOutSeries(List<Long> stockOutSeries) { this.stockOutSeries = stockOutSeries; }

    public List<WarehouseStockPoint> getWarehouseDistribution() { return warehouseDistribution; }
    public void setWarehouseDistribution(List<WarehouseStockPoint> warehouseDistribution) { this.warehouseDistribution = warehouseDistribution; }
}
