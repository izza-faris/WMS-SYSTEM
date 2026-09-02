package com.wms.controller;

import com.wms.dto.ApiResponse;
import com.wms.dto.ChartDataDto;
import com.wms.dto.DashboardMetricsDto;
import com.wms.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<DashboardMetricsDto>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getTenantMetrics()));
    }

    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<ChartDataDto>> getCharts() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getChartData()));
    }
}
