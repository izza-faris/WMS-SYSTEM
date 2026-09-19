import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Product, Warehouse, StockTransaction } from '../../models/wms.models';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stock-movement-page animate__animated animate__fadeIn">
      <!-- Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Stock In & Stock Out Operations</h2>
          <p class="text-secondary small mb-0">Record inbound goods receipt & outbound dispatch with instant balance tracking</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button (click)="activeTab = 'IN'" [class.btn-success]="activeTab === 'IN'" [class.btn-glass]="activeTab !== 'IN'" class="btn btn-sm px-3 fw-semibold">
            <i class="bi bi-box-arrow-in-down me-1"></i> Stock In
          </button>
          <button (click)="activeTab = 'OUT'" [class.btn-primary]="activeTab === 'OUT'" [class.btn-glass]="activeTab !== 'OUT'" class="btn btn-sm px-3 fw-semibold">
            <i class="bi bi-box-arrow-up-right me-1"></i> Stock Out
          </button>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <!-- Action Form (Stock In or Stock Out) -->
        <div class="col-lg-5">
          <div class="glass-panel p-4">
            <h5 class="fw-bold text-light mb-3 d-flex align-items-center justify-content-between">
              <span *ngIf="activeTab === 'IN'" class="text-success"><i class="bi bi-box-arrow-in-down me-2"></i>Stock In Operation</span>
              <span *ngIf="activeTab === 'OUT'" class="text-primary"><i class="bi bi-box-arrow-up-right me-2"></i>Stock Out Operation</span>
              <span class="badge" [ngClass]="activeTab === 'IN' ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-25' : 'bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25'">
                {{ activeTab === 'IN' ? 'Inbound' : 'Outbound' }}
              </span>
            </h5>

            <!-- Stock IN Form (No Time / No Date fields) -->
            <form *ngIf="activeTab === 'IN'" (ngSubmit)="submitStockIn()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Product Name, SKU, or Barcode *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-box-seam"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.productSearch" name="productSearch" list="stockInProdList" placeholder="Type Product (e.g. Rice, Wool band)" (input)="onProductSearchChange()" required>
                </div>
                <datalist id="stockInProdList">
                  <option *ngFor="let p of products()" [value]="p.name">{{ p.name }} (SKU: {{ p.sku }}) — Current: {{ p.currentStock }} {{ p.unit || 'PCS' }}</option>
                </datalist>
                <small class="text-muted text-xs mt-1 d-block">Select or type product name</small>
              </div>

              <!-- Live Balance Calculation Card for Stock In -->
              <div *ngIf="getSelectedInProduct() as inProd" class="p-3 bg-dark bg-opacity-60 rounded border border-success border-opacity-30 mb-3 animate__animated animate__fadeIn">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="text-secondary small">Current Stock:</span>
                  <span class="text-light fw-bold">{{ inProd.currentStock | number }} {{ inProd.unit || 'PCS' }}</span>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-success small">+ Adding In:</span>
                  <span class="text-success fw-bold">+{{ (stockInForm.quantity || 0) | number }} {{ inProd.unit || 'PCS' }}</span>
                </div>
                <div class="pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                  <span class="text-light small fw-semibold">New Balance:</span>
                  <span class="badge bg-success fs-6 fw-bold px-2.5 py-1">
                    {{ (inProd.currentStock + (stockInForm.quantity || 0)) | number }} {{ inProd.unit || 'PCS' }}
                  </span>
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-7">
                  <label class="form-label text-secondary small fw-semibold">Quantity to Add *</label>
                  <div class="input-group">
                    <input type="number" class="form-control" [(ngModel)]="stockInForm.quantity" name="quantity" min="1" required>
                    <span class="input-group-text bg-dark border-secondary text-secondary fw-semibold">
                      {{ getSelectedInProduct()?.unit || 'Units' }}
                    </span>
                  </div>
                </div>
                <div class="col-5">
                  <label class="form-label text-secondary small fw-semibold">Batch / Lot #</label>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.batchNumber" name="batchNumber" placeholder="Optional">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Destination Warehouse <span class="text-muted fw-normal">(Optional)</span></label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-building"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockInForm.warehouseSearch" name="warehouseSearch" list="stockInWhList" placeholder="Main Warehouse (or leave blank)">
                </div>
                <datalist id="stockInWhList">
                  <option *ngFor="let w of warehouses()" [value]="w.name">{{ w.name }}</option>
                </datalist>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small">Reference / Bill / GRN # <span class="text-muted fw-normal">(Optional)</span></label>
                <input type="text" class="form-control" [(ngModel)]="stockInForm.referenceNumber" name="referenceNumber" placeholder="e.g. GRN-001, Bill-104">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small">Notes <span class="text-muted fw-normal">(Optional)</span></label>
                <input type="text" class="form-control" [(ngModel)]="stockInForm.notes" name="notes" placeholder="e.g. Purchase delivery, fresh stock">
              </div>

              <button type="submit" class="btn btn-success w-100 py-2.5 fw-semibold shadow-sm">
                <i class="bi bi-check2-circle me-1"></i> Confirm Stock In
              </button>
            </form>

            <!-- Stock OUT Form (No Time / No Date fields) -->
            <form *ngIf="activeTab === 'OUT'" (ngSubmit)="submitStockOut()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Product Name, SKU, or Barcode *</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-box-seam"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockOutForm.productSearch" name="productSearchOut" list="stockOutProdList" placeholder="Type Product (e.g. Rice, Wool band)" (input)="onProductSearchChange()" required>
                </div>
                <datalist id="stockOutProdList">
                  <option *ngFor="let p of products()" [value]="p.name">{{ p.name }} (SKU: {{ p.sku }}) — Current: {{ p.currentStock }} {{ p.unit || 'PCS' }}</option>
                </datalist>
                <small class="text-muted text-xs mt-1 d-block">Select product to dispatch</small>
              </div>

              <!-- Live Balance Calculation Card for Stock Out -->
              <div *ngIf="getSelectedOutProduct() as outProd" class="p-3 bg-dark bg-opacity-60 rounded border border-primary border-opacity-30 mb-3 animate__animated animate__fadeIn">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="text-secondary small">Available Stock:</span>
                  <span class="text-light fw-bold">{{ outProd.currentStock | number }} {{ outProd.unit || 'PCS' }}</span>
                </div>
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="text-danger small">- Dispatching Out:</span>
                  <span class="text-danger fw-bold">-{{ (stockOutForm.quantity || 0) | number }} {{ outProd.unit || 'PCS' }}</span>
                </div>
                <div class="pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                  <span class="text-light small fw-semibold">Remaining Balance:</span>
                  <span class="badge fs-6 fw-bold px-2.5 py-1" [ngClass]="(outProd.currentStock - (stockOutForm.quantity || 0)) < 0 ? 'bg-danger' : 'bg-primary'">
                    {{ (outProd.currentStock - (stockOutForm.quantity || 0)) | number }} {{ outProd.unit || 'PCS' }}
                  </span>
                </div>
                <div *ngIf="(stockOutForm.quantity || 0) > outProd.currentStock" class="alert alert-danger py-1 px-2 mt-2 mb-0 text-xs">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Warning: Dispatch exceeds currently recorded stock!
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Dispatch Quantity *</label>
                <div class="input-group">
                  <input type="number" class="form-control" [(ngModel)]="stockOutForm.quantity" name="quantity" min="1" required>
                  <span class="input-group-text bg-dark border-secondary text-secondary fw-semibold">
                    {{ getSelectedOutProduct()?.unit || 'Units' }}
                  </span>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Source Warehouse <span class="text-muted fw-normal">(Optional)</span></label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-building"></i></span>
                  <input type="text" class="form-control" [(ngModel)]="stockOutForm.warehouseSearch" name="warehouseSearchOut" list="stockOutWhList" placeholder="Main Warehouse (or leave blank)">
                </div>
                <datalist id="stockOutWhList">
                  <option *ngFor="let w of warehouses()" [value]="w.name">{{ w.name }}</option>
                </datalist>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small">Reference / DO / Invoice # <span class="text-muted fw-normal">(Optional)</span></label>
                <input type="text" class="form-control" [(ngModel)]="stockOutForm.referenceNumber" name="referenceNumber" placeholder="e.g. DO-2026-089, Inv-55">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small">Notes <span class="text-muted fw-normal">(Optional)</span></label>
                <input type="text" class="form-control" [(ngModel)]="stockOutForm.notes" name="notes" placeholder="e.g. Sold to customer, shipment dispatch">
              </div>

              <button type="submit" class="btn btn-glow-primary w-100 py-2.5 fw-semibold shadow-sm">
                <i class="bi bi-send-check me-1"></i> Confirm Dispatch Out
              </button>
            </form>
          </div>
        </div>

        <!-- Recent Stock Transactions Ledger (Notebook Style: Type [Stock in | Stock out] | Product | Quantity | Balance | Action) -->
        <div class="col-lg-7">
          <div class="glass-panel p-4 h-100">
            <!-- Header & Filter Toolbar -->
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h5 class="fw-bold text-light mb-0">
                  <i class="bi bi-journal-text text-primary me-2"></i>Stock Movements Ledger
                </h5>
                <small class="text-secondary text-xs">Direct notebook ledger format without time system</small>
              </div>

              <div class="d-flex align-items-center gap-2">
                <!-- Filter Pills: All | Stock In | Stock Out -->
                <div class="btn-group btn-group-sm bg-dark p-0.5 rounded-2 border border-secondary border-opacity-25">
                  <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                          [class.btn-primary]="filterType === 'ALL'"
                          [class.text-secondary]="filterType !== 'ALL'"
                          (click)="filterType = 'ALL'">
                    All ({{ transactions().length }})
                  </button>
                  <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                          [class.btn-success]="filterType === 'IN'"
                          [class.text-secondary]="filterType !== 'IN'"
                          (click)="filterType = 'IN'">
                    Stock in ({{ getStockInCount() }})
                  </button>
                  <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                          [class.btn-danger]="filterType === 'OUT'"
                          [class.text-secondary]="filterType !== 'OUT'"
                          (click)="filterType = 'OUT'">
                    Stock out ({{ getStockOutCount() }})
                  </button>
                </div>

                <button *ngIf="transactions().length > 0" (click)="clearAllTransactions()" class="btn btn-outline-danger btn-sm px-2 py-1" title="Clear all stock movement records">
                  <i class="bi bi-trash3 me-1"></i>Clear All
                </button>
              </div>
            </div>

            <!-- Notebook-Style Table -->
            <div class="table-responsive rounded border border-white border-opacity-10">
              <table class="table table-custom mb-0 align-middle">
                <thead>
                  <!-- Main Header: Type (spans Stock in and Stock out) | Product | Quantity | Balance | Action -->
                  <tr class="border-bottom border-white border-opacity-10">
                    <th colspan="2" class="text-center py-2 text-uppercase tracking-wider text-light fw-bold" style="background: rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.1);">
                      Type
                    </th>
                    <th rowspan="2" class="align-middle py-3 border-end border-white border-opacity-10">
                      Product
                    </th>
                    <th rowspan="2" class="align-middle py-3 border-end border-white border-opacity-10">
                      Quantity
                    </th>
                    <th rowspan="2" class="align-middle py-3 border-end border-white border-opacity-10">
                      Balance
                    </th>
                    <th rowspan="2" class="text-end align-middle py-3">
                      Action
                    </th>
                  </tr>
                  <!-- Sub Header for Type: Stock in | Stock out -->
                  <tr class="border-bottom border-white border-opacity-10">
                    <th class="text-center py-1 text-success border-end border-white border-opacity-10" style="font-size: 0.78rem; font-weight: 700; min-width: 85px; background: rgba(16, 185, 129, 0.08);">
                      Stock in
                    </th>
                    <th class="text-center py-1 text-danger border-end border-white border-opacity-10" style="font-size: 0.78rem; font-weight: 700; min-width: 85px; background: rgba(239, 68, 68, 0.08);">
                      Stock out
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="filteredTransactions.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                      <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                      No stock movement records found.
                    </td>
                  </tr>

                  <tr *ngFor="let tx of filteredTransactions" class="animate__animated animate__fadeIn hover-row">
                    <!-- Column: Stock in indicator -->
                    <td class="text-center py-3 border-end border-white border-opacity-10" style="background: rgba(16, 185, 129, 0.02);">
                      <span *ngIf="isStockIn(tx)" class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-30 px-2 py-1 fw-bold">
                        <i class="bi bi-arrow-down-left me-1"></i>In
                      </span>
                      <span *ngIf="!isStockIn(tx)" class="text-secondary opacity-25 fw-bold">—</span>
                    </td>

                    <!-- Column: Stock out indicator -->
                    <td class="text-center py-3 border-end border-white border-opacity-10" style="background: rgba(239, 68, 68, 0.02);">
                      <span *ngIf="isStockOut(tx)" class="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-30 px-2 py-1 fw-bold">
                        <i class="bi bi-arrow-up-right me-1"></i>Out
                      </span>
                      <span *ngIf="!isStockOut(tx)" class="text-secondary opacity-25 fw-bold">—</span>
                    </td>

                    <!-- Column: Product -->
                    <td class="py-3 border-end border-white border-opacity-10">
                      <div class="text-light fw-bold small">{{ getProductName(tx.productId) }}</div>
                      <div class="d-flex align-items-center gap-1 mt-0.5">
                        <span *ngIf="getProductSku(tx.productId)" class="badge bg-dark text-secondary border border-secondary border-opacity-25 text-xs py-0.5 px-1.5">
                          {{ getProductSku(tx.productId) }}
                        </span>
                        <span *ngIf="tx.referenceNumber" class="text-muted text-xs">
                          Ref: {{ tx.referenceNumber }}
                        </span>
                      </div>
                    </td>

                    <!-- Column: Quantity -->
                    <td class="py-3 border-end border-white border-opacity-10">
                      <span [ngClass]="isStockIn(tx) ? 'text-success fw-bold' : (isStockOut(tx) ? 'text-danger fw-bold' : 'text-light fw-bold')">
                        {{ isStockIn(tx) ? '+' : (isStockOut(tx) ? '-' : '') }}{{ tx.quantity | number }}
                        <small class="text-secondary fw-normal ms-1">{{ getProductUnit(tx.productId) }}</small>
                      </span>
                    </td>

                    <!-- Column: Balance -->
                    <td class="py-3 border-end border-white border-opacity-10">
                      <div class="text-light fw-bold">
                        {{ tx.newQuantity | number }}
                        <small class="text-secondary fw-normal ms-1">{{ getProductUnit(tx.productId) }}</small>
                      </div>
                      <small class="text-muted text-xs d-block">was {{ tx.previousQuantity | number }}</small>
                    </td>

                    <!-- Column: Action -->
                    <td class="text-end py-3">
                      <button (click)="deleteTransaction(tx)" class="btn btn-outline-danger btn-sm p-1 px-2 rounded-2" title="Delete Movement Record">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="transactions().length > 0" class="d-flex align-items-center justify-content-between mt-3 text-secondary text-xs">
              <span>Showing {{ filteredTransactions.length }} of {{ transactions().length }} movements</span>
              <span class="text-muted">Direct Ledger Mode &bull; Timestamps omitted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .tracking-wider {
      letter-spacing: 0.06em;
    }
  `]
})
export class StockMovementComponent implements OnInit {
  activeTab: 'IN' | 'OUT' = 'IN';
  filterType: 'ALL' | 'IN' | 'OUT' = 'ALL';

  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  transactions = signal<StockTransaction[]>([]);

  stockInForm: any = {
    productId: null,
    warehouseId: null,
    productSearch: '',
    warehouseSearch: 'Main Warehouse',
    quantity: 10,
    batchNumber: '',
    referenceNumber: '',
    notes: ''
  };

  stockOutForm: any = {
    productId: null,
    warehouseId: null,
    productSearch: '',
    warehouseSearch: 'Main Warehouse',
    quantity: 5,
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

  get filteredTransactions(): StockTransaction[] {
    const list = this.transactions();
    if (this.filterType === 'IN') {
      return list.filter(tx => this.isStockIn(tx));
    }
    if (this.filterType === 'OUT') {
      return list.filter(tx => this.isStockOut(tx));
    }
    return list;
  }

  isStockIn(tx: StockTransaction): boolean {
    return tx.transactionType === 'STOCK_IN' || tx.transactionType === 'TRANSFER_IN' || tx.transactionType === 'ADJUSTMENT_ADD';
  }

  isStockOut(tx: StockTransaction): boolean {
    return tx.transactionType === 'STOCK_OUT' || tx.transactionType === 'TRANSFER_OUT' || tx.transactionType === 'ADJUSTMENT_SUB';
  }

  getStockInCount(): number {
    return this.transactions().filter(tx => this.isStockIn(tx)).length;
  }

  getStockOutCount(): number {
    return this.transactions().filter(tx => this.isStockOut(tx)).length;
  }

  getProductName(productId: number): string {
    const p = this.products().find(item => item.id === productId);
    return p ? p.name : ('Product #' + productId);
  }

  getProductSku(productId: number): string {
    const p = this.products().find(item => item.id === productId);
    return p?.sku || '';
  }

  getProductUnit(productId: number): string {
    const p = this.products().find(item => item.id === productId);
    return p?.unit || 'PCS';
  }

  getSelectedInProduct(): Product | null {
    return this.resolveProduct(this.stockInForm.productSearch);
  }

  getSelectedOutProduct(): Product | null {
    return this.resolveProduct(this.stockOutForm.productSearch);
  }

  onProductSearchChange() {
    // Dynamic reactivity handled by getSelectedInProduct and getSelectedOutProduct
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

  deleteTransaction(tx: StockTransaction): void {
    const name = this.getProductName(tx.productId);
    const unit = this.getProductUnit(tx.productId);
    if (!confirm(`Are you sure you want to delete this ${tx.transactionType} record (${tx.quantity} ${unit} for "${name}")? Inventory balance will be adjusted accordingly.`)) {
      return;
    }
    this.wmsApi.deleteStockTransaction(tx.id).subscribe({
      next: () => {
        this.loadTransactions();
        // Refresh product current stock
        this.wmsApi.getAllProductsList().subscribe(res => {
          if (res.success && res.data) this.products.set(res.data);
        });
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
          const unit = product.unit || 'PCS';
          alert(`Stock In recorded successfully! Added +${this.stockInForm.quantity} ${unit} to "${product.name}".`);
          this.loadTransactions();
          this.wmsApi.getAllProductsList().subscribe(res => {
            if (res.success && res.data) this.products.set(res.data);
          });
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
    whName = whName || (this.warehouses()[0]?.name || 'Main Warehouse');
    this.stockOutForm.warehouseSearch = whName;

    const existingWh = this.warehouses().find(w => w.name.toLowerCase() === whName.toLowerCase());
    this.stockOutForm.warehouseId = existingWh ? existingWh.id : (this.warehouses()[0]?.id || 1);

    this.wmsApi.stockOut(this.stockOutForm).subscribe({
      next: () => {
        const unit = product.unit || 'PCS';
        alert(`Stock Out completed successfully! Dispatched -${this.stockOutForm.quantity} ${unit} of "${product.name}".`);
        this.loadTransactions();
        this.wmsApi.getAllProductsList().subscribe(res => {
          if (res.success && res.data) this.products.set(res.data);
        });
      },
      error: (err) => alert(err.error?.message || 'Failed to dispatch Stock Out')
    });
  }
}
