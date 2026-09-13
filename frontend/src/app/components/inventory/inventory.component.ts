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
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-building"></i></span>
              <input type="text" class="form-control" [(ngModel)]="warehouseSearch" (input)="onWarehouseSearchChange()" list="invWhList" placeholder="Type Warehouse Name (or All)">
            </div>
            <datalist id="invWhList">
              <option value="All Warehouses"></option>
              <option *ngFor="let wh of warehouses()" [value]="wh.name">{{ wh.name }}</option>
            </datalist>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" [(ngModel)]="textFilter" (input)="applyFilter()" placeholder="Search item, SKU, or batch...">
            </div>
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
  rawInventoryList = signal<InventoryBalance[]>([]);
  inventoryList = signal<InventoryBalance[]>([]);
  warehouses = signal<Warehouse[]>([]);
  warehouseSearch: string = '';
  textFilter: string = '';

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.ensureDefaultWarehouse().subscribe(wh => {
      if (wh) {
        this.warehouses.set([wh]);
      }
      this.wmsApi.getWarehouses().subscribe(res => {
        if (res.success && res.data && res.data.length > 0) {
          this.warehouses.set(res.data);
        }
      });
    });
    this.loadInventory();
  }

  loadInventory(warehouseId?: number) {
    this.wmsApi.getInventory(warehouseId).subscribe({
      next: (res) => {
        if (res.success) {
          this.rawInventoryList.set(res.data);
          this.applyFilter();
        }
      }
    });
  }

  onWarehouseSearchChange() {
    const term = (this.warehouseSearch || '').trim().toLowerCase();
    if (!term || term === 'all' || term === 'all warehouses') {
      this.loadInventory();
    } else {
      const match = this.warehouses().find(w => w.name.toLowerCase().includes(term));
      if (match) {
        this.loadInventory(match.id);
      } else {
        this.loadInventory();
      }
    }
  }

  applyFilter() {
    const q = (this.textFilter || '').trim().toLowerCase();
    if (!q) {
      this.inventoryList.set(this.rawInventoryList());
      return;
    }
    const filtered = this.rawInventoryList().filter(item => 
      (item.productName && item.productName.toLowerCase().includes(q)) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(q)) ||
      (item.warehouseName && item.warehouseName.toLowerCase().includes(q))
    );
    this.inventoryList.set(filtered);
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
