import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Product, Warehouse, StockTransfer } from '../../models/wms.models';

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stock-transfers-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Inter-Facility Stock Transfers</h2>
          <p class="text-secondary small mb-0">Secure stock reallocation between client-owned warehouses</p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
          <i class="bi bi-plus-lg"></i>
          <span>New Transfer Request</span>
        </button>
      </div>

      <!-- Transfers List -->
      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Source -> Destination</th>
                <th>Status</th>
                <th>Created Date</th>
                <th class="text-end">Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="transfers().length === 0">
                <td colspan="5" class="text-center py-5 text-muted">
                  <i class="bi bi-truck fs-2 d-block mb-2"></i>
                  No inter-warehouse transfers recorded.
                </td>
              </tr>
              <tr *ngFor="let t of transfers()" class="animate__animated animate__fadeIn">
                <td class="fw-bold text-primary font-monospace">{{ t.transferNumber }}</td>
                <td>
                  <div class="text-light small fw-semibold">Warehouse #{{ t.sourceWarehouseId }} -> Warehouse #{{ t.destWarehouseId }}</div>
                  <small class="text-muted">{{ t.notes || 'Standard Rebalancing' }}</small>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-warning': t.status === 'PENDING',
                    'bg-info text-dark': t.status === 'APPROVED',
                    'bg-primary': t.status === 'DISPATCHED',
                    'bg-success': t.status === 'COMPLETED',
                    'bg-danger': t.status === 'CANCELLED'
                  }">{{ t.status }}</span>
                </td>
                <td class="text-muted small">{{ t.createdAt | date:'mediumDate' }}</td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button *ngIf="t.status === 'PENDING'" (click)="approveTransfer(t.id)" class="btn btn-info btn-sm">Approve</button>
                    <button *ngIf="t.status === 'APPROVED'" (click)="dispatchTransfer(t.id)" class="btn btn-primary btn-sm">Dispatch</button>
                    <button *ngIf="t.status === 'DISPATCHED'" (click)="receiveTransfer(t.id)" class="btn btn-success btn-sm">Receive</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Transfer Modal -->
      <div *ngIf="showModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Create Stock Transfer Request</h5>
              <button (click)="showModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="saveTransfer()">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Source Warehouse *</label>
                  <select class="form-select" [(ngModel)]="newTransfer.sourceWarehouseId" name="srcWh" required>
                    <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Destination Warehouse *</label>
                  <select class="form-select" [(ngModel)]="newTransfer.destWarehouseId" name="destWh" required>
                    <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-8">
                  <label class="form-label text-secondary small fw-semibold">Product *</label>
                  <select class="form-select" [(ngModel)]="newTransfer.productId" name="productId" required>
                    <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Transfer Quantity *</label>
                  <input type="number" class="form-control" [(ngModel)]="newTransfer.quantity" name="quantity" min="1" required>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small">Transfer Notes</label>
                <input type="text" class="form-control" [(ngModel)]="newTransfer.notes" name="notes" placeholder="Reason for inventory relocation">
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" class="btn btn-glow-primary">Submit Transfer Request</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockTransferComponent implements OnInit {
  transfers = signal<StockTransfer[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products = signal<Product[]>([]);
  showModal = false;

  newTransfer: any = {
    sourceWarehouseId: null,
    destWarehouseId: null,
    productId: null,
    quantity: 10,
    notes: ''
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadTransfers();
    this.wmsApi.getWarehouses().subscribe(res => {
      if (res.success) {
        this.warehouses.set(res.data);
        if (res.data.length >= 2) {
          this.newTransfer.sourceWarehouseId = res.data[0].id;
          this.newTransfer.destWarehouseId = res.data[1].id;
        }
      }
    });

    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success) {
        this.products.set(res.data);
        if (res.data.length > 0) this.newTransfer.productId = res.data[0].id;
      }
    });
  }

  loadTransfers() {
    this.wmsApi.getTransfers().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) this.transfers.set(res.data.content);
      }
    });
  }

  openCreateModal() {
    this.showModal = true;
  }

  saveTransfer() {
    const payload = {
      sourceWarehouseId: this.newTransfer.sourceWarehouseId,
      destWarehouseId: this.newTransfer.destWarehouseId,
      notes: this.newTransfer.notes,
      items: [{
        productId: this.newTransfer.productId,
        quantity: this.newTransfer.quantity
      }]
    };

    this.wmsApi.createTransfer(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.loadTransfers();
      },
      error: (err) => alert(err.error?.message || 'Failed to create transfer request')
    });
  }

  approveTransfer(id: number) {
    this.wmsApi.approveTransfer(id).subscribe({ next: () => this.loadTransfers() });
  }

  dispatchTransfer(id: number) {
    this.wmsApi.dispatchTransfer(id).subscribe({ next: () => this.loadTransfers() });
  }

  receiveTransfer(id: number) {
    this.wmsApi.receiveTransfer(id).subscribe({ next: () => this.loadTransfers() });
  }
}
