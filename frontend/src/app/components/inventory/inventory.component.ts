import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { InventoryBalance, Warehouse } from '../../models/wms.models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="inventory-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Inventory Balances & FEFO Heatmap</h2>
          <p class="text-secondary small mb-0">Real-time balances across warehouses, bins, and expiration batches</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <a routerLink="/app/stock-movement" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-arrow-left-right"></i>
            <span>Stock In / Out</span>
          </a>
        </div>
      </div>

      <!-- Facility Filter -->
      <div class="glass-panel p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-6">
            <select class="form-select" [(ngModel)]="selectedWarehouse" (change)="loadInventory()">
              <option [ngValue]="null">All Warehouses</option>
              <option *ngFor="let wh of warehouses()" [ngValue]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th>Storage Bin (QR)</th>
                <th>Batch Number</th>
                <th>Expiry Date (FEFO)</th>
                <th class="text-end">Available Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="inventoryList().length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-box2 fs-2 d-block mb-2"></i>
                  No inventory balances found.
                </td>
              </tr>
              <tr *ngFor="let item of inventoryList()" class="animate__animated animate__fadeIn">
                <td class="fw-bold text-light">{{ item.productName }}</td>
                <td><span class="badge bg-dark border border-secondary text-primary font-monospace">{{ item.sku }}</span></td>
                <td class="text-secondary small">{{ item.warehouseName }}</td>
                <td>
                  <span *ngIf="item.binCode" class="badge bg-dark border border-secondary text-warning">
                    <i class="bi bi-qr-code me-1"></i>{{ item.binCode }}
                  </span>
                  <span *ngIf="!item.binCode" class="text-muted text-xs">Unassigned</span>
                </td>
                <td>
                  <span *ngIf="item.batchNumber" class="text-light small font-monospace">{{ item.batchNumber }}</span>
                  <span *ngIf="!item.batchNumber" class="text-muted text-xs">-</span>
                </td>
                <td>
                  <span *ngIf="item.expiryDate" class="badge" [ngClass]="getExpiryBadge(item.expiryDate)">
                    <i class="bi bi-calendar-event me-1"></i>{{ item.expiryDate | date:'mediumDate' }}
                  </span>
                  <span *ngIf="!item.expiryDate" class="text-muted text-xs">N/A</span>
                </td>
                <td class="text-end">
                  <span class="fs-5 fw-bold text-light">{{ item.availableQuantity }}</span>
                  <span class="text-muted text-xs ms-1">units</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  inventoryList = signal<InventoryBalance[]>([]);
  warehouses = signal<Warehouse[]>([]);
  selectedWarehouse: number | null = null;

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.getWarehouses().subscribe(res => { if (res.success) this.warehouses.set(res.data); });
    this.loadInventory();
  }

  loadInventory() {
    this.wmsApi.getInventory(this.selectedWarehouse || undefined).subscribe({
      next: (res) => {
        if (res.success) this.inventoryList.set(res.data);
      }
    });
  }

  getExpiryBadge(expiryDateStr: string): string {
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return 'badge-glow-danger'; // Expired
    if (diffDays <= 30) return 'badge-glow-warning'; // Expiring soon
    return 'badge-glow-success';
  }
}
