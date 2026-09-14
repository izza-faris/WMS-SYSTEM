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
                <label class="form-label text-secondary small fw-semibold">Product Name, SKU, or Barcode *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-box-seam"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.productSearch" name="productSearch" list="stockInProdList" placeholder="Type Product (e.g. Shoe kingdom, Rice)" required>
                </div>
                <datalist id="stockInProdList">
                  <option *ngFor="let p of products()" [value]="p.name">{{ p.name }} (SKU: {{ p.sku }})</option>
                </datalist>
                <small class="text-muted text-xs mt-1 d-block">Type to search or enter directly</small>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Destination Warehouse *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-building"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.warehouseSearch" name="warehouseSearch" list="stockInWhList" placeholder="Type Warehouse (e.g. Main Warehouse)" required>
                </div>
                <datalist id="stockInWhList">
                  <option *ngFor="let w of warehouses()" [value]="w.name">{{ w.name }}</option>
                </datalist>
                <small class="text-muted text-xs mt-1 d-block">Type warehouse name (creates automatically if new)</small>
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
                <label class="form-label text-secondary small fw-semibold">Product Name, SKU, or Barcode *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-box-seam"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockOutForm.productSearch" name="productSearchOut" list="stockOutProdList" placeholder="Type Product (e.g. Shoe kingdom)" (input)="onProductChangeForOut()" required>
                </div>
                <datalist id="stockOutProdList">
                  <option *ngFor="let p of products()" [value]="p.name">{{ p.name }} (SKU: {{ p.sku }})</option>
                </datalist>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Source Warehouse *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-building"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockOutForm.warehouseSearch" name="warehouseSearchOut" list="stockOutWhList" placeholder="Type Warehouse (e.g. Main Warehouse)" (input)="onProductChangeForOut()" required>
                </div>
                <datalist id="stockOutWhList">
                  <option *ngFor="let w of warehouses()" [value]="w.name">{{ w.name }}</option>
                </datalist>
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
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="fw-bold text-light mb-0"><i class="bi bi-journal-text text-primary me-2"></i>Stock Movements Ledger</h5>
              <button *ngIf="transactions().length > 0" (click)="clearAllTransactions()" class="btn btn-outline-danger btn-sm px-2 py-1" title="Clear all stock movement records">
                <i class="bi bi-trash3 me-1"></i>Clear All
              </button>
            </div>

            <div class="table-responsive">
              <table class="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product / Ref</th>
                    <th>Quantity</th>
                    <th>Balance</th>
                    <th>Time</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="transactions().length === 0">
                    <td colspan="6" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-3 d-block mb-1"></i>
                      No stock movements recorded yet.
                    </td>
                  </tr>
                  <tr *ngFor="let tx of transactions()" class="animate__animated animate__fadeIn">
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': tx.transactionType === 'STOCK_IN' || tx.transactionType === 'TRANSFER_IN' || tx.transactionType === 'ADJUSTMENT_ADD',
                        'bg-danger': tx.transactionType === 'STOCK_OUT' || tx.transactionType === 'TRANSFER_OUT' || tx.transactionType === 'ADJUSTMENT_SUB'
                      }">{{ tx.transactionType }}</span>
                    </td>
                    <td>
                      <div class="text-light small fw-bold">{{ getProductName(tx.productId) }}</div>
                      <small class="text-muted text-xs">{{ getProductSku(tx.productId) ? (getProductSku(tx.productId) + ' • ') : '' }}{{ tx.referenceNumber || 'Direct' }}</small>
                    </td>
                    <td class="fw-bold">{{ tx.quantity }}</td>
                    <td class="text-secondary small">{{ tx.previousQuantity }} -> {{ tx.newQuantity }}</td>
                    <td class="text-muted text-xs">{{ tx.createdAt | date:'shortTime' }}</td>
                    <td class="text-end">
                      <button (click)="deleteTransaction(tx)" class="btn btn-outline-danger btn-sm p-1 px-2" title="Delete Movement Record">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
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
    productSearch: '',
    warehouseSearch: '',
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
    productSearch: '',
    warehouseSearch: '',
    quantity: 5,
    batchId: null,
    referenceNumber: '',
    notes: ''
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success && res.data) {
        this.products.set(res.data);
        if (res.data.length > 0) {
          this.stockInForm.productId = res.data[0].id;
          this.stockInForm.productSearch = res.data[0].name;
          this.stockOutForm.productId = res.data[0].id;
          this.stockOutForm.productSearch = res.data[0].name;
        }
      }
    });

    this.wmsApi.ensureDefaultWarehouse().subscribe(wh => {
      if (wh) {
        this.warehouses.set([wh]);
        this.stockInForm.warehouseId = wh.id;
        this.stockInForm.warehouseSearch = wh.name;
        this.stockOutForm.warehouseId = wh.id;
        this.stockOutForm.warehouseSearch = wh.name;
      }
      this.wmsApi.getWarehouses().subscribe(wRes => {
        if (wRes.success && wRes.data && wRes.data.length > 0) {
          this.warehouses.set(wRes.data);
        }
      });
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

  getProductName(productId: number): string {
    const p = this.products().find(item => item.id === productId);
    return p ? p.name : ('Product #' + productId);
  }

  getProductSku(productId: number): string {
    const p = this.products().find(item => item.id === productId);
    return p?.sku || '';
  }

  deleteTransaction(tx: StockTransaction): void {
    const name = this.getProductName(tx.productId);
    if (!confirm(`Are you sure you want to delete this ${tx.transactionType} record (${tx.quantity} units for "${name}")? Inventory balance will be adjusted accordingly.`)) {
      return;
    }
    this.wmsApi.deleteStockTransaction(tx.id).subscribe({
      next: () => {
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to delete stock movement record')
    });
  }

  clearAllTransactions(): void {
    if (!confirm('Are you sure you want to clear ALL stock movement records? This action cannot be undone.')) {
      return;
    }
    this.wmsApi.clearAllStockTransactions().subscribe({
      next: () => {
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to clear stock movements')
    });
  }

  resolveProduct(search: string): Product | null {
    if (!search || !search.trim()) return null;
    const term = search.trim().toLowerCase();
    return this.products().find(p => 
      p.name.toLowerCase() === term || 
      p.sku.toLowerCase() === term || 
      (p.barcode && p.barcode.toLowerCase() === term) ||
      p.name.toLowerCase().includes(term)
    ) || (this.products().length === 1 ? this.products()[0] : null);
  }

  onProductChangeForOut() {
    const product = this.resolveProduct(this.stockOutForm.productSearch);
    if (product) {
      this.stockOutForm.productId = product.id;
      const termWh = (this.stockOutForm.warehouseSearch || '').trim().toLowerCase();
      const wh = this.warehouses().find(w => w.name.toLowerCase() === termWh);
      const whId = (wh && termWh !== '-') ? wh.id : null;

      this.wmsApi.getFefoRecommendations(product.id, whId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.fefoRecommendations.set(res.data);
            if (res.data.length > 0) {
              const rec = res.data[0];
              this.stockOutForm.batchId = rec.batchId;
              // If warehouse is empty, '-', or invalid, auto-fill with the warehouse that actually has this batch
              if (!this.stockOutForm.warehouseSearch || this.stockOutForm.warehouseSearch === '-' || !wh) {
                const actualWh = this.warehouses().find(w => w.id === rec.warehouseId);
                if (actualWh) {
                  this.stockOutForm.warehouseSearch = actualWh.name;
                  this.stockOutForm.warehouseId = actualWh.id;
                }
              }
            }
          }
        }
      });
    }
  }

  submitStockIn() {
    const product = this.resolveProduct(this.stockInForm.productSearch);
    if (!product) {
      alert('Product not found. Please type an existing product name, SKU, or create it first under Products.');
      return;
    }
    this.stockInForm.productId = product.id;

    let whName = (this.stockInForm.warehouseSearch || 'Main Warehouse').trim();
    if (whName === '-') whName = 'Main Warehouse';
    const existingWh = this.warehouses().find(w => w.name.toLowerCase() === whName.toLowerCase());

    const executeStockIn = (whId: number) => {
      this.stockInForm.warehouseId = whId;
      this.wmsApi.stockIn(this.stockInForm).subscribe({
        next: () => {
          alert('Stock In recorded successfully for ' + product.name + '!');
          this.loadTransactions();
        },
        error: (err) => alert(err.error?.message || 'Failed to record Stock In')
      });
    };

    if (existingWh) {
      executeStockIn(existingWh.id);
    } else {
      this.wmsApi.ensureDefaultWarehouse(whName).subscribe({
        next: (newWh) => {
          if (newWh) {
            this.warehouses.update(list => [...list, newWh]);
            executeStockIn(newWh.id);
          } else {
            executeStockIn(this.warehouses()[0]?.id || 1);
          }
        },
        error: () => executeStockIn(this.warehouses()[0]?.id || 1)
      });
    }
  }

  submitStockOut() {
    const product = this.resolveProduct(this.stockOutForm.productSearch);
    if (!product) {
      alert('Product not found. Please type an existing product name or SKU.');
      return;
    }
    this.stockOutForm.productId = product.id;

    let whName = (this.stockOutForm.warehouseSearch || '').trim();
    if (whName === '-') whName = '';

    // If recommendation exists, bind the recommended batchId and warehouse
    if (this.fefoRecommendations().length > 0) {
      const rec = this.fefoRecommendations()[0];
      if (!this.stockOutForm.batchId) {
        this.stockOutForm.batchId = rec.batchId;
      }
      if (!whName && rec.warehouseId) {
        const recWh = this.warehouses().find(w => w.id === rec.warehouseId);
        if (recWh) whName = recWh.name;
      }
    }

    whName = whName || (this.warehouses()[0]?.name || 'Main Warehouse');
    this.stockOutForm.warehouseSearch = whName;

    const existingWh = this.warehouses().find(w => w.name.toLowerCase() === whName.toLowerCase());
    this.stockOutForm.warehouseId = existingWh ? existingWh.id : (this.warehouses()[0]?.id || 1);

    this.wmsApi.stockOut(this.stockOutForm).subscribe({
      next: () => {
        alert('Stock Out completed successfully for ' + product.name + '!');
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to dispatch Stock Out')
    });
  }
}
