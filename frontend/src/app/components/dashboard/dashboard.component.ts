import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { DashboardMetrics, ChartData } from '../../models/wms.models';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page animate__animated animate__fadeIn">
      <!-- Header Banner -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Executive Dashboard</h2>
          <p class="text-secondary small mb-0">Live multi-warehouse inventory status & operation telemetry</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <a routerLink="/app/stock-movement" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-plus-circle-fill"></i>
            <span>Stock In / Out</span>
          </a>
          <a routerLink="/app/scanner" class="btn btn-glass btn-sm text-warning d-flex align-items-center gap-2">
            <i class="bi bi-camera-fill"></i>
            <span>Scanner</span>
          </a>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="glass-panel p-3 h-100 position-relative overflow-hidden">
            <div class="text-secondary small fw-semibold mb-1">Total Products</div>
            <div class="kpi-number text-light">{{ metrics?.totalProducts || 0 }}</div>
            <div class="small text-muted mt-2 d-flex align-items-center gap-1">
              <i class="bi bi-box text-primary"></i> Catalog SKUs
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="glass-panel p-3 h-100 position-relative overflow-hidden">
            <div class="text-secondary small fw-semibold mb-1">Total Stock Units</div>
            <div class="kpi-number text-gradient-primary">{{ metrics?.totalInventoryQuantity || 0 }}</div>
            <div class="small text-muted mt-2 d-flex align-items-center gap-1">
              <i class="bi bi-stack text-info"></i> Across all facilities
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="glass-panel p-3 h-100 position-relative overflow-hidden">
            <div class="text-secondary small fw-semibold mb-1">Low Stock Alerts</div>
            <div class="kpi-number text-warning">{{ metrics?.lowStockCount || 0 }}</div>
            <div class="small text-warning mt-2 d-flex align-items-center gap-1">
              <i class="bi bi-exclamation-triangle"></i> Reorder required
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="glass-panel p-3 h-100 position-relative overflow-hidden">
            <div class="text-secondary small fw-semibold mb-1">Expiring Soon (FEFO)</div>
            <div class="kpi-number text-danger">{{ metrics?.expiringSoonCount || 0 }}</div>
            <div class="small text-danger mt-2 d-flex align-items-center gap-1">
              <i class="bi bi-clock-history"></i> Next 30 days
            </div>
          </div>
        </div>
      </div>

      <!-- Live Charts Row -->
      <div class="row g-4 mb-4">
        <!-- Stock Movements Chart -->
        <div class="col-lg-8">
          <div class="glass-panel p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 class="fw-bold text-light mb-0">Stock In vs Stock Out Movements</h5>
                <small class="text-secondary">Last 7 days inbound & outbound transaction volume</small>
              </div>
              <span class="badge bg-primary bg-opacity-25 text-primary">Live Trend</span>
            </div>
            <div style="height: 280px; position: relative;">
              <canvas #movementChartCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Warehouse Distribution -->
        <div class="col-lg-4">
          <div class="glass-panel p-4 h-100">
            <h5 class="fw-bold text-light mb-1">Facility Distribution</h5>
            <small class="text-secondary mb-3 d-block">Stock quantity per warehouse</small>
            
            <div class="d-flex flex-column gap-3 mt-4">
              <div *ngFor="let wh of chartData?.warehouseDistribution" class="p-3 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="text-light fw-bold small">{{ wh.warehouseName }}</span>
                  <span class="badge badge-glow-primary">{{ wh.totalQuantity }} units</span>
                </div>
                <div class="progress" style="height: 6px; background-color: rgba(255,255,255,0.05);">
                  <div class="progress-bar bg-primary" [style.width.%]="wh.totalQuantity > 0 ? (wh.totalQuantity / (metrics?.totalInventoryQuantity || 1) * 100) : 0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Activity Stream & Operational Workflows -->
      <div class="row g-4">
        <!-- Pending Action Center -->
        <div class="col-lg-6">
          <div class="glass-panel p-4 h-100">
            <h5 class="fw-bold text-light mb-3"><i class="bi bi-check2-circle text-primary me-2"></i>Action Required</h5>
            <div class="row g-2">
              <div class="col-6">
                <a routerLink="/app/adjustments" class="text-decoration-none">
                  <div class="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-15 glass-card-interactive">
                    <div class="text-warning fs-4 fw-bold">{{ metrics?.pendingAdjustmentsCount || 0 }}</div>
                    <div class="text-light small fw-semibold">Discrepancy Reviews</div>
                    <small class="text-muted">Stock counting reviews</small>
                  </div>
                </a>
              </div>
              <div class="col-6">
                <a routerLink="/app/transfers" class="text-decoration-none">
                  <div class="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-15 glass-card-interactive">
                    <div class="text-info fs-4 fw-bold">{{ metrics?.pendingTransfersCount || 0 }}</div>
                    <div class="text-light small fw-semibold">Pending Transfers</div>
                    <small class="text-muted">Inter-facility transfers</small>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Audit Stream -->
        <div class="col-lg-6">
          <div class="glass-panel p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="fw-bold text-light mb-0"><i class="bi bi-activity text-success me-2"></i>Recent Activity Stream</h5>
              <a routerLink="/app/audit-logs" class="text-primary text-decoration-none small">View all</a>
            </div>
            
            <div class="overflow-y-auto" style="max-height: 200px;">
              <div *ngFor="let act of metrics?.recentActivities" class="d-flex align-items-start gap-3 py-2 border-bottom border-secondary border-opacity-10">
                <div class="badge bg-primary bg-opacity-20 text-primary py-1 px-2 text-xs">{{ act.action }}</div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="text-light small text-truncate">{{ act.description }}</div>
                </div>
                <small class="text-muted text-xs text-nowrap">{{ act.timestamp }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('movementChartCanvas') movementChartCanvas!: ElementRef<HTMLCanvasElement>;

  metrics: DashboardMetrics | null = null;
  chartData: ChartData | null = null;
  chartInstance: Chart | null = null;

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.getDashboardMetrics().subscribe({
      next: (res) => {
        if (res.success) this.metrics = res.data;
      }
    });

    this.wmsApi.getDashboardCharts().subscribe({
      next: (res) => {
        if (res.success) {
          this.chartData = res.data;
          this.initChart();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.chartData) {
      this.initChart();
    }
  }

  private initChart(): void {
    if (!this.movementChartCanvas || !this.chartData) return;
    if (this.chartInstance) this.chartInstance.destroy();

    const ctx = this.movementChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.chartData.labels,
        datasets: [
          {
            label: 'Stock In',
            data: this.chartData.stockInSeries,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          },
          {
            label: 'Stock Out',
            data: this.chartData.stockOutSeries,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
            beginAtZero: true
          }
        }
      }
    });
  }
}
