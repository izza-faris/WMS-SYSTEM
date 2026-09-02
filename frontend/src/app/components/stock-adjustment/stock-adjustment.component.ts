import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Product, Warehouse, StockAdjustment } from '../../models/wms.models';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stock-adjustment-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Physical Stock Counting & Adjustments</h2>
          <p class="text-secondary small mb-0">Record physical count discrepancies and submit for managerial approval</p>
        </div>
        <button (click)="openRequestModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
          <i class="bi bi-clipboard-plus"></i>
          <span>Report Discrepancy</span>
        </button>
      </div>

      <!-- Discrepancy Queue -->
      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Adjustment #</th>
                <th>Warehouse / Product</th>
                <th>System Qty</th>
                <th>Physical Count</th>
                <th>Difference</th>
                <th>Status</th>
                <th class="text-end">Approval Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="adjustments().length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-clipboard-check fs-2 d-block mb-2"></i>
                  No stock adjustments pending or recorded.
                </td>
              </tr>
              <tr *ngFor="let a of adjustments()" class="animate__animated animate__fadeIn">
                <td class="fw-bold text-light font-monospace">{{ a.adjustmentNumber }}</td>
                <td>
                  <div class="text-light small fw-bold">Product #{{ a.productId }}</div>
                  <small class="text-muted">Warehouse #{{ a.warehouseId }} &bull; {{ a.reason }}</small>
                </td>
                <td>{{ a.systemQuantity }}</td>
                <td class="fw-bold text-light">{{ a.physicalQuantity }}</td>
                <td>
                  <span class="badge" [ngClass]="a.discrepancyQuantity < 0 ? 'badge-glow-danger' : 'badge-glow-success'">
                    {{ a.discrepancyQuantity > 0 ? '+' : '' }}{{ a.discrepancyQuantity }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-warning': a.status === 'PENDING',
                    'bg-success': a.status === 'APPROVED',
                    'bg-danger': a.status === 'REJECTED'
                  }">{{ a.status }}</span>
                </td>
                <td class="text-end">
                  <div *ngIf="a.status === 'PENDING'" class="btn-group btn-group-sm">
                    <button (click)="review(a.id, true)" class="btn btn-success btn-sm"><i class="bi bi-check-lg"></i> Approve</button>
                    <button (click)="review(a.id, false)" class="btn btn-danger btn-sm"><i class="bi bi-x-lg"></i> Reject</button>
                  </div>
                  <span *ngIf="a.status !== 'PENDING'" class="text-muted text-xs">Reviewed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Report Discrepancy Modal -->
      <div *ngIf="showModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Report Physical Count Discrepancy</h5>
              <button (click)="showModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="submitAdjustment()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Warehouse *</label>
                <select class="form-select" [(ngModel)]="newAdj.warehouseId" name="wh" required>
                  <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Product *</label>
                <select class="form-select" [(ngModel)]="newAdj.productId" name="prod" required>
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Physical Counted Quantity *</label>
                <input type="number" class="form-control" [(ngModel)]="newAdj.physicalQuantity" name="physQty" min="0" required placeholder="Actual stock found">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small fw-semibold">Reason for Discrepancy *</label>
                <input type="text" class="form-control" [(ngModel)]="newAdj.reason" name="reason" required placeholder="Damaged packaging, cycle count discrepancy, etc.">
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" class="btn btn-glow-primary">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockAdjustmentComponent implements OnInit {
  adjustments = signal<StockAdjustment[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);
  showModal = false;

  newAdj: any = { warehouseId: null, productId: null, physicalQuantity: 0, reason: '' };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadAdjustments();
    this.wmsApi.getWarehouses().subscribe(res => {
      if (res.success && res.data.length > 0) {
        this.warehouses.set(res.data);
        this.newAdj.warehouseId = res.data[0].id;
      }
    });

    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success && res.data.length > 0) {
        this.products.set(res.data);
        this.newAdj.productId = res.data[0].id;
      }
    });
  }

  loadAdjustments() {
    this.wmsApi.getAdjustments().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) this.adjustments.set(res.data.content);
      }
    });
  }

  openRequestModal() {
    this.showModal = true;
  }

  submitAdjustment() {
    this.wmsApi.requestAdjustment(this.newAdj).subscribe({
      next: () => {
        this.showModal = false;
        this.loadAdjustments();
      },
      error: (err) => alert(err.error?.message || 'Failed to submit adjustment')
    });
  }

  review(id: number, approve: boolean) {
    const notes = prompt('Enter review notes / remarks:');
    this.wmsApi.reviewAdjustment(id, approve, notes || '').subscribe({
      next: () => this.loadAdjustments(),
      error: (err) => alert(err.error?.message || 'Failed to process review')
    });
  }
}
