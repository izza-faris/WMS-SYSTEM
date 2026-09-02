import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Product, Warehouse, StockTransaction, FefoBatchRecommendation } from '../../models/wms.models';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stock-movement-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Stock In & Stock Out Operations</h2>
          <p class="text-secondary small mb-0">Record inbound inventory receipt & outbound dispatch with FEFO batching</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button (click)="activeTab = 'IN'" [class.btn-success]="activeTab === 'IN'" [class.btn-glass]="activeTab !== 'IN'" class="btn btn-sm px-3">
            <i class="bi bi-box-arrow-in-down me-1"></i> Stock In
          </button>
          <button (click)="activeTab = 'OUT'" [class.btn-primary]="activeTab === 'OUT'" [class.btn-glass]="activeTab !== 'OUT'" class="btn btn-sm px-3">
            <i class="bi bi-box-arrow-up-right me-1"></i> Stock Out
          </button>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <!-- Action Form (Stock In or Stock Out) -->
        <div class="col-lg-5">
          <div class="glass-panel p-4">
            <h5 class="fw-bold text-light mb-3">
              <span *ngIf="activeTab === 'IN'" class="text-success"><i class="bi bi-box-arrow-in-down me-2"></i>Receive Inbound Stock</span>
              <span *ngIf="activeTab === 'OUT'" class="text-primary"><i class="bi bi-box-arrow-up-right me-2"></i>Dispatch Outbound Stock</span>
            </h5>

            <!-- Stock IN Form -->
            <form *ngIf="activeTab === 'IN'" (ngSubmit)="submitStockIn()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Select Product *</label>
                <select class="form-select" [(ngModel)]="stockInForm.productId" name="productId" required>
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} (SKU: {{ p.sku }})</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Destination Warehouse *</label>
                <select class="form-select" [(ngModel)]="stockInForm.warehouseId" name="warehouseId" required>
                  <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label text-secondary small fw-semibold">Quantity *</label>
                  <input type="number" class="form-control" [(ngModel)]="stockInForm.quantity" name="quantity" min="1" required>
                </div>
                <div class="col-6">
                  <label class="form-label text-secondary small fw-semibold">Batch Number</label>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.batchNumber" name="batchNumber" placeholder="BATCH-001">
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label text-secondary small">Mfg Date</label>
                  <input type="date" class="form-control" [(ngModel)]="stockInForm.mfgDate" name="mfgDate">
                </div>
                <div class="col-6">
                  <label class="form-label text-secondary small">Expiry Date</label>
                  <input type="date" class="form-control" [(ngModel)]="stockInForm.expiryDate" name="expiryDate">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small">Reference / GRN #</label>
                <input type="text" class="form-control" [(ngModel)]="stockInForm.referenceNumber" name="referenceNumber" placeholder="GRN-2026-001">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small">Notes</label>
                <input type="text" class="form-control" [(ngModel)]="stockInForm.notes" name="notes" placeholder="Supplier shipment notes">
              </div>

              <button type="submit" class="btn btn-success w-100 py-2 fw-semibold">
                <i class="bi bi-check2-circle me-1"></i> Confirm Stock In
              </button>
            </form>

            <!-- Stock OUT Form -->
            <form *ngIf="activeTab === 'OUT'" (ngSubmit)="submitStockOut()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Select Product *</label>
                <select class="form-select" [(ngModel)]="stockOutForm.productId" name="productId" (change)="onProductChangeForOut()" required>
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} (SKU: {{ p.sku }})</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Source Warehouse *</label>
                <select class="form-select" [(ngModel)]="stockOutForm.warehouseId" name="warehouseId" (change)="onProductChangeForOut()" required>
                  <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>

              <!-- FEFO Batch Recommendation Preview -->
              <div *ngIf="fefoRecommendations().length > 0" class="p-3 bg-dark bg-opacity-75 rounded border border-warning border-opacity-30 mb-3">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <small class="text-warning fw-bold"><i class="bi bi-clock-history me-1"></i>FEFO Earliest Expiry Recommendation</small>
                  <span class="badge bg-warning text-dark text-xs">First Out</span>
                </div>
                <div class="text-light small">
                  Batch: <strong>{{ fefoRecommendations()[0].batchNumber }}</strong> 
                  (Expires: {{ fefoRecommendations()[0].expiryDate | date:'mediumDate' }})
                </div>
                <div class="text-secondary text-xs">Available in Batch: {{ fefoRecommendations()[0].availableQuantity }} units</div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Dispatch Quantity *</label>
                <input type="number" class="form-control" [(ngModel)]="stockOutForm.quantity" name="quantity" min="1" required>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small">Reference / DO #</label>
                <input type="text" class="form-control" [(ngModel)]="stockOutForm.referenceNumber" name="referenceNumber" placeholder="DO-2026-089">
              </div>

              <button type="submit" class="btn btn-glow-primary w-100 py-2 fw-semibold">
                <i class="bi bi-send-check me-1"></i> Confirm Dispatch Out
              </button>
            </form>
          </div>
        </div>

        <!-- Recent Stock Transactions Ledger -->
        <div class="col-lg-7">
          <div class="glass-panel p-4 h-100">
            <h5 class="fw-bold text-light mb-3"><i class="bi bi-journal-text text-primary me-2"></i>Stock Movements Ledger</h5>

            <div class="table-responsive">
              <table class="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product / Ref</th>
                    <th>Quantity</th>
                    <th>Balance</th>
                    <th class="text-end">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions()" class="animate__animated animate__fadeIn">
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': tx.transactionType === 'STOCK_IN' || tx.transactionType === 'TRANSFER_IN' || tx.transactionType === 'ADJUSTMENT_ADD',
                        'bg-danger': tx.transactionType === 'STOCK_OUT' || tx.transactionType === 'TRANSFER_OUT' || tx.transactionType === 'ADJUSTMENT_SUB'
                      }">{{ tx.transactionType }}</span>
                    </td>
                    <td>
                      <div class="text-light small fw-bold">Product #{{ tx.productId }}</div>
                      <small class="text-muted text-xs">{{ tx.referenceNumber || 'Direct' }}</small>
                    </td>
                    <td class="fw-bold">{{ tx.quantity }}</td>
                    <td class="text-secondary small">{{ tx.previousQuantity }} -> {{ tx.newQuantity }}</td>
                    <td class="text-muted text-xs text-end">{{ tx.createdAt | date:'shortTime' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockMovementComponent implements OnInit {
  activeTab: 'IN' | 'OUT' = 'IN';
  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  transactions = signal<StockTransaction[]>([]);
  fefoRecommendations = signal<FefoBatchRecommendation[]>([]);

  stockInForm: any = {
    productId: null,
    warehouseId: null,
    quantity: 10,
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    referenceNumber: '',
    notes: ''
  };

  stockOutForm: any = {
    productId: null,
    warehouseId: null,
    quantity: 5,
    batchId: null,
    referenceNumber: '',
    notes: ''
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success) {
        this.products.set(res.data);
        if (res.data.length > 0) {
          this.stockInForm.productId = res.data[0].id;
          this.stockOutForm.productId = res.data[0].id;
        }
      }
    });

    this.wmsApi.getWarehouses().subscribe(res => {
      if (res.success) {
        this.warehouses.set(res.data);
        if (res.data.length > 0) {
          this.stockInForm.warehouseId = res.data[0].id;
          this.stockOutForm.warehouseId = res.data[0].id;
        }
      }
    });

    this.loadTransactions();
  }

  loadTransactions() {
    this.wmsApi.getStockTransactions().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) this.transactions.set(res.data.content);
      }
    });
  }

  onProductChangeForOut() {
    if (this.stockOutForm.productId) {
      this.wmsApi.getFefoRecommendations(this.stockOutForm.productId, this.stockOutForm.warehouseId).subscribe({
        next: (res) => {
          if (res.success) this.fefoRecommendations.set(res.data);
        }
      });
    }
  }

  submitStockIn() {
    this.wmsApi.stockIn(this.stockInForm).subscribe({
      next: () => {
        alert('Stock In recorded successfully!');
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to record Stock In')
    });
  }

  submitStockOut() {
    this.wmsApi.stockOut(this.stockOutForm).subscribe({
      next: () => {
        alert('Stock Out completed successfully!');
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to dispatch Stock Out')
    });
  }
}
