import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { AuthService } from '../../services/auth.service';
import { Product, Warehouse, Category, SaleInvoice, SaleInvoiceItem, CheckoutRequest, PriceOrderPreview } from '../../models/wms.models';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  barcode?: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="billing-page animate__animated animate__fadeIn">
      <!-- Top Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 no-print">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h2 class="fw-bold text-light mb-0">
              <i class="bi bi-receipt-cutoff text-success me-2"></i>POS & Wholesale Billing Counter
            </h2>
            <span class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-2.5 py-1">
              Shop-Wise Custom Pricing
            </span>
          </div>
          <p class="text-secondary small mb-0 mt-1">
            Fast multi-item checkout, shop-specific custom rates, Price Order Excel upload & automated stock-out
          </p>
        </div>

        <div class="d-flex align-items-center flex-wrap gap-2">
          <!-- View Toggle: POS Counter | Invoices History -->
          <div class="btn-group btn-group-sm bg-dark p-0.5 rounded-2 border border-secondary border-opacity-25">
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-success]="activeTab === 'POS'"
                    [class.text-secondary]="activeTab !== 'POS'"
                    (click)="activeTab = 'POS'">
              <i class="bi bi-cart3 me-1"></i> POS Counter
            </button>
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-primary]="activeTab === 'HISTORY'"
                    [class.text-secondary]="activeTab !== 'HISTORY'"
                    (click)="switchToHistory()">
              <i class="bi bi-clock-history me-1"></i> Invoices History ({{ invoices().length }})
            </button>
          </div>

          <!-- Wholesale Price Order Excel Upload Button -->
          <button (click)="openPriceOrderModal()" class="btn btn-outline-warning btn-sm px-3 fw-bold shadow-sm">
            <i class="bi bi-file-earmark-excel me-1"></i> Upload Shop Price Order
          </button>

          <!-- Download Excel Template Link -->
          <a [href]="templateUrl" class="btn btn-outline-secondary btn-sm px-2.5" title="Download sample Excel template for wholesale shops" download>
            <i class="bi bi-download me-1"></i> Template
          </a>

          <!-- Warehouse Selector -->
          <div *ngIf="warehouses().length > 1" class="d-flex align-items-center gap-1 bg-dark px-2 py-1 rounded border border-secondary border-opacity-25">
            <small class="text-secondary">Warehouse:</small>
            <select class="form-select form-select-sm bg-dark text-light border-0 py-0 ps-1 pe-4"
                    [(ngModel)]="selectedWarehouseId" (change)="onWarehouseChange()">
              <option *ngFor="let wh of warehouses()" [value]="wh.id">{{ wh.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- VIEW 1: POS BILLING WORKSPACE                                 -->
      <!-- ============================================================= -->
      <div *ngIf="activeTab === 'POS'" class="row g-3 no-print">
        <!-- LEFT COLUMN: Product Catalog & Quick Search (7 cols) -->
        <div class="col-lg-7">
          <div class="glass-panel p-3 h-100 d-flex flex-column">
            <!-- Search & Filter Controls -->
            <div class="row g-2 mb-3 align-items-center">
              <div class="col-md-7">
                <div class="input-group input-group-sm">
                  <span class="input-group-text bg-dark border-secondary text-secondary">
                    <i class="bi bi-search"></i>
                  </span>
                  <input type="text" class="form-control"
                         [(ngModel)]="productSearch"
                         (keydown.enter)="onProductSearchEnter()"
                         placeholder="Search product name, SKU, or barcode...">
                  <button *ngIf="productSearch" class="btn btn-outline-secondary" (click)="productSearch = ''">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              <div class="col-md-5">
                <select class="form-select form-select-sm bg-dark text-light border-secondary" [(ngModel)]="selectedCategory">
                  <option value="ALL">All Categories</option>
                  <option *ngFor="let cat of categories()" [value]="cat.name">{{ cat.name }}</option>
                </select>
              </div>
            </div>

            <!-- Products List / Grid -->
            <div class="flex-grow-1 overflow-y-auto pe-1" style="max-height: 680px;">
              <div *ngIf="filteredProducts.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                No matching products found.
              </div>

              <div class="row g-2">
                <div *ngFor="let prod of filteredProducts" class="col-md-6 col-xl-4">
                  <div class="product-card p-2.5 rounded-3 h-100 d-flex flex-column justify-content-between"
                       [class.border-danger]="prod.currentStock <= 0"
                       [class.border-secondary]="prod.currentStock > 0"
                       (click)="addToCart(prod)">
                    <div>
                      <div class="d-flex align-items-start justify-content-between gap-1 mb-1">
                        <span class="badge bg-dark text-secondary border border-secondary border-opacity-25 text-xs">
                          {{ prod.sku || 'SKU-N/A' }}
                        </span>
                        <span class="badge text-xs"
                              [ngClass]="prod.currentStock > 0 ? 'bg-success bg-opacity-20 text-success border border-success border-opacity-30' : 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30'">
                          Stock: {{ prod.currentStock }} {{ prod.unit || 'PCS' }}
                        </span>
                      </div>
                      <div class="fw-bold text-light text-truncate" [title]="prod.name">
                        {{ prod.name }}
                      </div>
                      <small class="text-muted d-block text-xs text-truncate">
                        {{ prod.categoryName || 'General Item' }}
                      </small>
                    </div>

                    <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-10">
                      <div class="fw-extrabold text-warning fs-6">
                        {{ getCurrency(prod) }} {{ (prod.price || 0) | number:'1.2-2' }}
                      </div>
                      <button class="btn btn-sm btn-outline-success py-0.5 px-2 rounded-2 text-xs fw-semibold"
                              (click)="$event.stopPropagation(); addToCart(prod)">
                        <span *ngIf="getCartItemQty(prod.id) as qty" class="badge bg-success text-white me-1">{{ qty }}</span>
                        <i class="bi bi-plus-lg"></i> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Live Bill Cart & Checkout (5 cols) -->
        <div class="col-lg-5">
          <div class="glass-panel p-3 h-100 d-flex flex-column">
            <!-- Customer / Shop Info Header -->
            <div class="p-2.5 rounded-2 bg-dark bg-opacity-60 border border-secondary border-opacity-20 mb-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-light small">
                  <i class="bi bi-shop text-info me-1"></i>Shop / Customer Details
                </span>
                <div class="form-check form-check-inline form-switch mb-0">
                  <input class="form-check-input" type="checkbox" id="walkInCheck" [(ngModel)]="isWalkIn" (change)="onWalkInToggle()">
                  <label class="form-check-label text-secondary text-xs" for="walkInCheck">Walk-in</label>
                </div>
              </div>

              <div class="row g-2">
                <div class="col-7">
                  <label class="text-secondary text-xs d-block mb-0.5">Shop / Customer Name *</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerName" placeholder="e.g. Shop A / FB Mart" [disabled]="isWalkIn">
                </div>
                <div class="col-5">
                  <label class="text-secondary text-xs d-block mb-0.5">Mobile # (Opt)</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerPhone" placeholder="Mobile #" [disabled]="isWalkIn">
                </div>
              </div>
            </div>

            <!-- Cart Table Items -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div>
                <span class="fw-bold text-light small">
                  <i class="bi bi-bag-check text-success me-1"></i>Bill Items ({{ cart.length }})
                </span>
                <small class="text-warning text-xs ms-1.5">&bull; Rates editable</small>
              </div>
              <button *ngIf="cart.length > 0" (click)="clearCart()" class="btn btn-link btn-xs text-danger text-decoration-none p-0">
                <i class="bi bi-trash3 me-0.5"></i>Clear Cart
              </button>
            </div>

            <div class="cart-scroll flex-grow-1 overflow-y-auto mb-3 pe-1" style="max-height: 380px; min-height: 200px;">
              <div *ngIf="cart.length === 0" class="text-center py-4 text-muted border border-dashed border-secondary border-opacity-25 rounded-2">
                <i class="bi bi-cart-x fs-2 d-block mb-1 text-secondary opacity-50"></i>
                <span class="small">Cart is empty. Click any product from the catalog to add.</span>
              </div>

              <!-- Cart Row with Live Editable Price per Shop -->
              <div *ngFor="let item of cart; let i = index" class="cart-item-row p-2.5 mb-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 shadow-sm">
                <!-- Top Line: Item Name, Stock Info, Barcode Input & Delete Icon -->
                <div class="d-flex align-items-start justify-content-between mb-1.5">
                  <div class="flex-grow-1 overflow-hidden me-2">
                    <div class="fw-bold text-light small text-truncate" [title]="item.product.name">
                      {{ item.product.name }}
                    </div>
                    <div class="text-muted text-xs d-flex align-items-center gap-2 mt-1 flex-wrap">
                      <span *ngIf="item.product.barcode" class="badge bg-dark border border-secondary border-opacity-30 text-xs py-0 px-1 text-secondary" title="Catalog Barcode">
                        <i class="bi bi-upc me-0.5"></i>{{ item.product.barcode }}
                      </span>
                      <span>Stock: {{ item.product.currentStock }} {{ item.product.unit || 'PCS' }}</span>

                      <!-- Barcode Input Box (Side-by-side with stock as marked in green) -->
                      <div class="d-inline-flex align-items-center gap-1 ms-1">
                        <span class="text-warning" style="font-size: 0.7rem;"><i class="bi bi-upc"></i></span>
                        <input type="text"
                               class="form-control form-control-sm bg-dark text-warning border-secondary p-0 px-1.5 font-monospace fw-bold"
                               style="width: 105px; height: 23px; font-size: 0.74rem;"
                               [(ngModel)]="item.barcode"
                               placeholder="Barcode..."
                               title="Type or scan barcode for this item">
                      </div>

                      <span *ngIf="item.quantity > item.product.currentStock" class="text-danger fw-bold">
                        (! Low Stock)
                      </span>
                    </div>
                  </div>

                  <button class="btn btn-link btn-xs text-danger text-decoration-none p-1" (click)="removeFromCart(i)" title="Remove item from bill">
                    <i class="bi bi-x-circle fs-5"></i>
                  </button>
                </div>

                <!-- Bottom Line: Rate, Quantity Controls, and Line Total (Side-by-Side without cramping) -->
                <div class="d-flex align-items-center justify-content-between pt-1.5 border-top border-secondary border-opacity-15 gap-2">
                  <!-- Rate Field -->
                  <div class="d-flex align-items-center gap-1">
                    <span class="text-secondary text-xs">Rate:</span>
                    <input type="number" class="form-control form-control-sm text-end p-0 px-1 border-secondary bg-dark text-warning fw-bold"
                           style="width: 74px; height: 26px; font-size: 0.82rem;"
                           [(ngModel)]="item.unitPrice"
                           (ngModelChange)="onPriceChange(item)"
                           min="0" step="0.5"
                           title="Wholesale price for this shop">
                  </div>

                  <!-- Qty Controls -->
                  <div class="d-flex align-items-center gap-1">
                    <span class="text-secondary text-xs">Qty:</span>
                    <div class="d-flex align-items-center">
                      <button class="btn btn-outline-secondary btn-xs p-0 px-1.5" style="height: 26px;" (click)="decreaseQty(item)">-</button>
                      <input type="number" class="form-control form-control-sm text-center p-0 border-secondary bg-dark text-light fw-bold"
                             style="width: 36px; height: 26px; font-size: 0.82rem;"
                             [(ngModel)]="item.quantity"
                             (ngModelChange)="onQtyChange(item)" min="1">
                      <button class="btn btn-outline-secondary btn-xs p-0 px-1.5" style="height: 26px;" (click)="increaseQty(item)">+</button>
                    </div>
                  </div>

                  <!-- Line Total -->
                  <div class="text-end">
                    <span class="text-secondary text-xs d-none d-sm-inline">Total: </span>
                    <strong class="text-success small">
                      {{ defaultCurrency }} {{ item.totalPrice | number:'1.2-2' }}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Financial Summary & Checkout -->
            <div class="p-3 rounded-2 bg-dark bg-opacity-70 border border-secondary border-opacity-30 mt-auto">
              <div class="d-flex justify-content-between small text-secondary mb-1">
                <span>Subtotal ({{ cartTotalQuantity }} items):</span>
                <span class="text-light fw-bold">{{ defaultCurrency }} {{ cartSubtotal | number:'1.2-2' }}</span>
              </div>

              <!-- Discount & Tax row -->
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark border-secondary text-secondary text-xs">Disc (-)</span>
                    <input type="number" class="form-control bg-dark text-light border-secondary" [(ngModel)]="discountAmount" min="0" placeholder="0">
                  </div>
                </div>
                <div class="col-6">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark border-secondary text-secondary text-xs">Tax (+)</span>
                    <input type="number" class="form-control bg-dark text-light border-secondary" [(ngModel)]="taxAmount" min="0" placeholder="0">
                  </div>
                </div>
              </div>

              <!-- Grand Total Display -->
              <div class="p-2.5 rounded-2 bg-success bg-opacity-10 border border-success border-opacity-30 d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span class="text-uppercase text-secondary fw-bold text-xs d-block">Grand Total</span>
                  <small class="text-muted text-xs">Auto deducts from inventory</small>
                </div>
                <div class="fs-3 fw-extrabold text-success">
                  {{ defaultCurrency }} {{ cartGrandTotal | number:'1.2-2' }}
                </div>
              </div>

              <!-- Payment Method Selector -->
              <div class="mb-2">
                <label class="form-label text-secondary text-xs mb-1 fw-semibold">Payment Mode:</label>
                <div class="btn-group btn-group-sm w-100">
                  <button type="button" class="btn btn-xs fw-semibold"
                          [class.btn-primary]="paymentMethod === 'CASH'"
                          [class.btn-outline-secondary]="paymentMethod !== 'CASH'"
                          (click)="paymentMethod = 'CASH'">Cash</button>
                  <button type="button" class="btn btn-xs fw-semibold"
                          [class.btn-primary]="paymentMethod === 'CARD'"
                          [class.btn-outline-secondary]="paymentMethod !== 'CARD'"
                          (click)="paymentMethod = 'CARD'">Card</button>
                  <button type="button" class="btn btn-xs fw-semibold"
                          [class.btn-primary]="paymentMethod === 'UPI'"
                          [class.btn-outline-secondary]="paymentMethod !== 'UPI'"
                          (click)="paymentMethod = 'UPI'">Online/UPI</button>
                  <button type="button" class="btn btn-xs fw-semibold"
                          [class.btn-primary]="paymentMethod === 'CREDIT'"
                          [class.btn-outline-secondary]="paymentMethod !== 'CREDIT'"
                          (click)="paymentMethod = 'CREDIT'">Credit</button>
                </div>
              </div>

              <!-- Tender Cash & Change -->
              <div *ngIf="paymentMethod === 'CASH'" class="row g-2 mb-2 align-items-center">
                <div class="col-7">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark border-secondary text-secondary text-xs">Paid</span>
                    <input type="number" class="form-control bg-dark text-light border-secondary"
                           [(ngModel)]="paidAmount" placeholder="{{ cartGrandTotal }}" min="0">
                  </div>
                </div>
                <div class="col-5 text-end small">
                  <span class="text-secondary text-xs d-block">Change to Return:</span>
                  <strong class="text-warning fs-6">
                    {{ defaultCurrency }} {{ calculateChange() | number:'1.2-2' }}
                  </strong>
                </div>
              </div>

              <!-- Primary Submit Button -->
              <button (click)="submitCheckout()"
                      [disabled]="cart.length === 0 || isSubmitting"
                      class="btn btn-success btn-lg w-100 fw-bold shadow py-2.5 mt-1 d-flex align-items-center justify-content-center gap-2">
                <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm"></span>
                <i *ngIf="!isSubmitting" class="bi bi-printer-fill fs-5"></i>
                <span>Complete Sale & Print Bill (F9)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- VIEW 2: INVOICES HISTORY & RE-PRINT LOG                       -->
      <!-- ============================================================= -->
      <div *ngIf="activeTab === 'HISTORY'" class="animate__animated animate__fadeIn no-print">
        <div class="glass-panel p-4">
          <!-- Search Toolbar -->
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 450px;">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" [(ngModel)]="historySearch"
                       (keydown.enter)="loadInvoices()"
                       placeholder="Search invoice #, customer name, or phone...">
                <button class="btn btn-outline-secondary" (click)="loadInvoices()"><i class="bi bi-arrow-repeat"></i></button>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <span class="text-secondary small">Total Invoices: <strong>{{ invoices().length }}</strong></span>
              <button (click)="activeTab = 'POS'" class="btn btn-sm btn-success fw-semibold">
                <i class="bi bi-plus-lg me-1"></i> New Sale
              </button>
            </div>
          </div>

          <!-- Invoices Table -->
          <div class="table-responsive rounded border border-secondary border-opacity-25">
            <table class="table table-custom mb-0 align-middle">
              <thead>
                <tr>
                  <th class="py-3">Invoice #</th>
                  <th class="py-3">Date & Time</th>
                  <th class="py-3">Shop / Customer</th>
                  <th class="py-3 text-center">Items</th>
                  <th class="py-3">Payment</th>
                  <th class="py-3 text-end">Grand Total</th>
                  <th class="py-3 text-center">Status</th>
                  <th class="py-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="invoices().length === 0">
                  <td colspan="8" class="text-center py-5 text-muted">
                    <i class="bi bi-receipt fs-2 d-block mb-2 text-secondary"></i>
                    No sales invoices recorded yet.
                  </td>
                </tr>

                <tr *ngFor="let inv of invoices()" class="hover-row">
                  <td class="py-3 fw-bold text-success">
                    <span class="badge bg-dark border border-success border-opacity-30 text-success px-2 py-1">
                      {{ inv.invoiceNumber }}
                    </span>
                  </td>
                  <td class="py-3 text-secondary small">
                    {{ inv.createdAt | date:'medium' }}
                  </td>
                  <td class="py-3">
                    <div class="text-light fw-semibold small">{{ inv.customerName }}</div>
                    <div *ngIf="inv.customerPhone" class="text-muted text-xs">{{ inv.customerPhone }}</div>
                  </td>
                  <td class="py-3 text-center">
                    <span class="badge bg-secondary bg-opacity-20 text-light border border-secondary border-opacity-25">
                      {{ inv.itemCount }} items ({{ inv.totalQuantity }} units)
                    </span>
                  </td>
                  <td class="py-3">
                    <span class="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 text-xs">
                      {{ inv.paymentMethod }}
                    </span>
                  </td>
                  <td class="py-3 text-end fw-extrabold text-warning fs-6">
                    {{ defaultCurrency }} {{ inv.grandTotal | number:'1.2-2' }}
                  </td>
                  <td class="py-3 text-center">
                    <span class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30">
                      {{ inv.status }}
                    </span>
                  </td>
                  <td class="py-3 text-end">
                    <button (click)="openBillModal(inv)" class="btn btn-outline-info btn-sm px-2.5 py-1 fw-semibold" title="View & Re-print Bill">
                      <i class="bi bi-printer me-1"></i> Print / View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- MODAL: UPLOAD SHOP PRICE ORDER (EXCEL)                        -->
      <!-- ============================================================= -->
      <div *ngIf="showPoModal" class="modal-backdrop-custom animate__animated animate__fadeIn">
        <div class="modal-dialog-custom glass-panel p-4 animate__animated animate__zoomIn" style="max-width: 780px;">
          <!-- Modal Header -->
          <div class="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 mb-3">
            <h5 class="fw-bold text-warning mb-0">
              <i class="bi bi-file-earmark-excel me-2"></i>Upload Shop Price Order (Excel)
            </h5>
            <button class="btn btn-sm text-secondary" (click)="closePriceOrderModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <!-- Step 1: Upload Dropzone if no preview yet -->
          <div *ngIf="!poPreview" class="text-center py-4">
            <div class="p-4 border border-dashed border-secondary border-opacity-40 rounded-3 bg-dark bg-opacity-40 mb-3">
              <i class="bi bi-cloud-arrow-up text-warning display-4 d-block mb-2"></i>
              <h6 class="fw-bold text-light mb-1">Select or Drag & Drop Shop Price Order Excel</h6>
              <p class="text-secondary small mb-3">Supports .xlsx, .xls, and .csv files with custom agreed shop rates</p>

              <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls, .csv" class="d-none">
              <button (click)="fileInput.click()" [disabled]="isUploadingPo" class="btn btn-warning px-4 fw-bold shadow-sm">
                <span *ngIf="isUploadingPo" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!isUploadingPo" class="bi bi-folder2-open me-1"></i> Browse Excel File
              </button>
            </div>

            <div class="d-flex align-items-center justify-content-between text-secondary text-xs px-2">
              <span>Need the standard layout?</span>
              <a [href]="templateUrl" class="text-warning text-decoration-none fw-semibold" download>
                <i class="bi bi-download me-1"></i>Download Sample Shop Excel Template
              </a>
            </div>
          </div>

          <!-- Step 2: Parsed Preview Table -->
          <div *ngIf="poPreview" class="animate__animated animate__fadeIn">
            <!-- Shop Info Header -->
            <div class="p-3 rounded-2 bg-dark bg-opacity-70 border border-secondary border-opacity-30 mb-3">
              <div class="row g-2 align-items-center">
                <div class="col-md-5">
                  <label class="form-label text-secondary text-xs mb-0.5 fw-semibold">Shop / Customer Name:</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary" [(ngModel)]="poPreview.shopName">
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary text-xs mb-0.5">Mobile #:</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary" [(ngModel)]="poPreview.shopPhone" placeholder="Optional">
                </div>
                <div class="col-md-4 text-md-end">
                  <small class="text-secondary d-block">Estimated Total:</small>
                  <strong class="text-success fs-5">{{ defaultCurrency }} {{ poPreview.estimatedTotal | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>

            <!-- Items Preview Table -->
            <div class="table-responsive rounded border border-secondary border-opacity-25 mb-3" style="max-height: 300px;">
              <table class="table table-custom table-sm mb-0 align-middle">
                <thead>
                  <tr class="header-row">
                    <th>#</th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th class="text-center">Qty</th>
                    <th class="text-end">Agreed Price</th>
                    <th class="text-end">Total</th>
                    <th class="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of poPreview.items; let idx = index">
                    <td class="text-muted">{{ idx + 1 }}</td>
                    <td class="fw-bold text-light">
                      {{ item.productName }}
                      <span *ngIf="!item.matched" class="badge bg-warning text-dark text-xs ms-1">Not in Catalog</span>
                    </td>
                    <td class="text-secondary small">{{ item.sku || '—' }}</td>
                    <td class="text-center fw-bold text-light">{{ item.quantity }} <small>{{ item.unit || 'PCS' }}</small></td>
                    <td class="text-end fw-bold text-warning">{{ defaultCurrency }} {{ item.customPrice | number:'1.2-2' }}</td>
                    <td class="text-end fw-bold text-light">{{ defaultCurrency }} {{ item.lineTotal | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <span *ngIf="item.matched" class="badge text-xs"
                            [ngClass]="item.isStockSufficient ? 'bg-success bg-opacity-20 text-success' : 'bg-danger bg-opacity-20 text-danger'">
                        {{ item.availableStock }} {{ item.unit }}
                      </span>
                      <span *ngIf="!item.matched" class="badge bg-secondary text-xs">Unknown</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25">
              <button class="btn btn-outline-secondary btn-sm" (click)="poPreview = null">
                <i class="bi bi-arrow-left me-1"></i> Choose Another File
              </button>

              <div class="d-flex gap-2">
                <button class="btn btn-primary btn-sm px-3 fw-semibold" (click)="loadPoIntoCart()">
                  <i class="bi bi-cart-plus me-1"></i> Load into Bill Cart
                </button>
                <button class="btn btn-success btn-sm px-3 fw-bold shadow" (click)="directCheckoutFromPo()">
                  <i class="bi bi-check2-circle me-1"></i> Direct Complete & Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- MODAL: PRINTABLE BILL / INVOICE PREVIEW (A4 & THERMAL)        -->
      <!-- ============================================================= -->
      <div *ngIf="showBillModal && currentBill" class="modal-backdrop-custom animate__animated animate__fadeIn">
        <div class="modal-dialog-bill glass-panel p-4 animate__animated animate__zoomIn">
          <!-- Modal Top Toolbar (Non-printable) -->
          <div class="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 mb-3 no-print">
            <div class="d-flex align-items-center gap-2">
              <h5 class="fw-bold text-light mb-0">
                <i class="bi bi-receipt text-success me-2"></i>Sales Invoice / Bill
              </h5>
              <!-- Format Switcher -->
              <div class="btn-group btn-group-sm bg-dark p-0.5 rounded border border-secondary border-opacity-30">
                <button type="button" class="btn btn-xs"
                        [class.btn-primary]="billFormat === 'THERMAL'"
                        [class.text-secondary]="billFormat !== 'THERMAL'"
                        (click)="billFormat = 'THERMAL'">
                  <i class="bi bi-ticket-detailed me-1"></i>Thermal (80mm)
                </button>
                <button type="button" class="btn btn-xs"
                        [class.btn-primary]="billFormat === 'A4'"
                        [class.text-secondary]="billFormat !== 'A4'"
                        (click)="billFormat = 'A4'">
                  <i class="bi bi-file-earmark-text me-1"></i>Standard A4
                </button>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-success btn-sm px-3 fw-bold shadow-sm" (click)="printCurrentBill()">
                <i class="bi bi-printer-fill me-1"></i> Print Bill
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="closeBillModal()"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>

          <!-- Printable Area Wrapper -->
          <div class="bill-scroll-container">
            <div id="printable-receipt" [ngClass]="billFormat === 'THERMAL' ? 'thermal-receipt-layout' : 'a4-invoice-layout'">
              <!-- Brand / Company Header -->
              <div class="text-center pb-3 border-bottom border-dark border-opacity-20 mb-3 receipt-header">
                <h3 class="fw-extrabold text-uppercase tracking-wider mb-1 bill-brand-title">
                  {{ currentUser()?.companyName || 'AeroWMS Store' }}
                </h3>
                <p class="bill-brand-subtitle mb-0">
                  Wholesale & Retail Warehouse Distribution
                </p>
                <div class="text-xs bill-meta-text">
                  Phone: {{ currentUser()?.phone || '+91 98765 43210' }} &bull; Email: {{ currentUser()?.email || 'store@aerowms.com' }}
                </div>
              </div>

              <!-- Bill Metadata (2-col) -->
              <div class="d-flex justify-content-between align-items-start small mb-3 pb-2 border-bottom border-dark border-opacity-10 bill-meta-section">
                <div>
                  <div><strong>Bill No:</strong> <span class="font-monospace text-success fw-bold">{{ currentBill.invoiceNumber }}</span></div>
                  <div><strong>Date:</strong> {{ currentBill.createdAt | date:'dd-MMM-yyyy, hh:mm a' }}</div>
                  <div><strong>Cashier:</strong> {{ currentUser()?.fullName || 'Cashier 01' }}</div>
                </div>
                <div class="text-end">
                  <div><strong>Shop / Customer:</strong> <span class="fw-bold">{{ currentBill.customerName }}</span></div>
                  <div *ngIf="currentBill.customerPhone"><strong>Mobile:</strong> {{ currentBill.customerPhone }}</div>
                  <div><strong>Payment:</strong> <span class="badge bg-secondary text-uppercase">{{ currentBill.paymentMethod }}</span></div>
                </div>
              </div>

              <!-- Items Table -->
              <table class="table bill-table mb-3">
                <thead>
                  <tr class="bill-table-head">
                    <th style="width: 8%;">#</th>
                    <th style="width: 48%;">Item</th>
                    <th class="text-center" style="width: 14%;">Qty</th>
                    <th class="text-end" style="width: 15%;">Rate</th>
                    <th class="text-end" style="width: 15%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of currentBill.items; let idx = index">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div class="fw-bold bill-item-name">{{ item.productName }}</div>
                      <div class="d-flex align-items-center gap-2 text-muted text-xs mt-0.5">
                        <small *ngIf="item.sku">SKU: {{ item.sku }}</small>
                        <small *ngIf="item.barcode" class="font-monospace fw-bold text-dark border border-dark border-opacity-25 px-1 rounded bg-light">
                          <i class="bi bi-upc me-0.5"></i>Barcode: {{ item.barcode }}
                        </small>
                      </div>
                    </td>
                    <td class="text-center fw-bold">{{ item.quantity }} <small>{{ item.unit || 'PCS' }}</small></td>
                    <td class="text-end">{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td class="text-end fw-bold">{{ item.totalPrice | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <div class="bill-totals-section pt-2 border-top border-dark border-opacity-20 mb-3">
                <div class="d-flex justify-content-between small mb-1">
                  <span>Subtotal ({{ currentBill.totalQuantity }} items):</span>
                  <span>{{ defaultCurrency }} {{ currentBill.subtotal | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="currentBill.discountAmount > 0" class="d-flex justify-content-between small mb-1 text-danger">
                  <span>Discount:</span>
                  <span>- {{ defaultCurrency }} {{ currentBill.discountAmount | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="currentBill.taxAmount > 0" class="d-flex justify-content-between small mb-1">
                  <span>Tax / GST:</span>
                  <span>+ {{ defaultCurrency }} {{ currentBill.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between fs-5 fw-extrabold pt-2 border-top border-dark border-opacity-30 bill-grand-total">
                  <span>GRAND TOTAL:</span>
                  <span>{{ defaultCurrency }} {{ currentBill.grandTotal | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between small pt-1 border-top border-dark border-opacity-10 mt-1">
                  <span>Paid Amount:</span>
                  <span>{{ defaultCurrency }} {{ (currentBill.paidAmount || currentBill.grandTotal) | number:'1.2-2' }}</span>
                </div>
                <div *ngIf="currentBill.changeAmount > 0" class="d-flex justify-content-between small fw-bold">
                  <span>Change Returned:</span>
                  <span>{{ defaultCurrency }} {{ currentBill.changeAmount | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Footer Barcode & Greetings -->
              <div class="text-center pt-3 border-top border-dark border-opacity-20 bill-footer">
                <div class="font-monospace text-xs tracking-wider mb-1" style="letter-spacing: 0.15em;">
                  *{{ currentBill.invoiceNumber }}*
                </div>
                <div class="fw-bold text-xs mb-1">THANK YOU FOR YOUR BUSINESS!</div>
                <small class="text-muted text-xs d-block">Goods once sold can be exchanged within 7 days with this receipt.</small>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons (Non-printable) -->
          <div class="d-flex align-items-center justify-content-between pt-3 border-top border-secondary border-opacity-25 mt-3 no-print">
            <button type="button" class="btn btn-outline-secondary" (click)="closeBillModal()">
              Close
            </button>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-primary px-3" (click)="startNewSaleFromModal()">
                <i class="bi bi-plus-circle me-1"></i> New Sale
              </button>
              <button type="button" class="btn btn-success px-4 fw-bold shadow" (click)="printCurrentBill()">
                <i class="bi bi-printer-fill me-1"></i> Print Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.12);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }
    .product-card:hover {
      background: rgba(31, 41, 55, 0.9);
      border-color: #10b981;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.15);
    }
    .hover-row:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
    }
    .text-xs {
      font-size: 0.75rem;
    }
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-dialog-custom {
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: #111827;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .modal-dialog-bill {
      width: 100%;
      max-width: 650px;
      max-height: 95vh;
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: #111827;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .bill-scroll-container {
      overflow-y: auto;
      flex-grow: 1;
      background: #ffffff;
      border-radius: 8px;
      padding: 1.5rem;
      color: #1f2937;
    }
    /* Thermal 80mm format styling */
    .thermal-receipt-layout {
      max-width: 320px;
      margin: 0 auto;
      font-family: 'Courier New', Courier, monospace;
      color: #111827;
    }
    .thermal-receipt-layout .bill-brand-title {
      font-size: 1.25rem;
    }
    .thermal-receipt-layout .bill-table th, 
    .thermal-receipt-layout .bill-table td {
      padding: 0.25rem 0.15rem;
      font-size: 0.8rem;
    }
    /* A4 format styling */
    .a4-invoice-layout {
      width: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      color: #111827;
    }
    .a4-invoice-layout .bill-brand-title {
      font-size: 1.6rem;
      color: #111827;
    }
    .a4-invoice-layout .bill-table th {
      background: #f3f4f6;
      border-bottom: 2px solid #d1d5db;
      font-weight: 700;
      font-size: 0.85rem;
      color: #374151;
    }
    .a4-invoice-layout .bill-table td {
      padding: 0.5rem;
      font-size: 0.88rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .bill-table {
      width: 100%;
      border-collapse: collapse;
    }

    /* Print Specific Media Styles */
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printable-receipt, #printable-receipt * {
        visibility: visible !important;
      }
      #printable-receipt {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 8mm !important;
        box-shadow: none !important;
        border: none !important;
        z-index: 999999 !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class BillingComponent implements OnInit {
  activeTab: 'POS' | 'HISTORY' = 'POS';
  billFormat: 'THERMAL' | 'A4' = 'THERMAL';

  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  categories = signal<Category[]>([]);
  invoices = signal<SaleInvoice[]>([]);

  selectedWarehouseId: number | null = null;
  productSearch = '';
  selectedCategory = 'ALL';
  historySearch = '';

  defaultCurrency = '₹';
  templateUrl = '';

  // Cart & Customer Form State
  cart: CartItem[] = [];
  isWalkIn = false;
  customerName = 'Shop A';
  customerPhone = '';
  paymentMethod = 'CASH';
  discountAmount: number = 0;
  taxAmount: number = 0;
  paidAmount: number | null = null;

  isSubmitting = false;

  // Bill Modal State
  showBillModal = false;
  currentBill: SaleInvoice | null = null;

  // Price Order Upload State
  showPoModal = false;
  isUploadingPo = false;
  poPreview: PriceOrderPreview | null = null;

  constructor(
    private wmsApi: WmsApiService,
    private authService: AuthService
  ) {}

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    this.templateUrl = this.wmsApi.getPriceOrderTemplateUrl();
    this.loadProducts();
    this.loadCategories();
    this.wmsApi.ensureDefaultWarehouse().subscribe(wh => {
      if (wh) {
        this.selectedWarehouseId = wh.id;
        this.warehouses.set([wh]);
      }
      this.wmsApi.getWarehouses().subscribe(res => {
        if (res.success && res.data && res.data.length > 0) {
          this.warehouses.set(res.data);
          if (!this.selectedWarehouseId) this.selectedWarehouseId = res.data[0].id;
        }
      });
    });

    this.loadInvoices();

    // Keydown listener for F9 shortcut (Instant Complete & Print)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'F9' && this.activeTab === 'POS' && this.cart.length > 0 && !this.isSubmitting) {
        e.preventDefault();
        this.submitCheckout();
      }
    });
  }

  loadProducts(): void {
    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success && res.data) {
        this.products.set(res.data);
        if (res.data.length > 0 && res.data[0].currency) {
          this.defaultCurrency = res.data[0].currency;
        }
      }
    });
  }

  loadCategories(): void {
    this.wmsApi.getCategories().subscribe(res => {
      if (res.success && res.data) {
        this.categories.set(res.data);
      }
    });
  }

  loadInvoices(): void {
    this.wmsApi.getSaleInvoices(0, 50, this.historySearch).subscribe(res => {
      if (res.success && res.data?.content) {
        this.invoices.set(res.data.content);
      }
    });
  }

  switchToHistory(): void {
    this.activeTab = 'HISTORY';
    this.loadInvoices();
  }

  onWarehouseChange(): void {
    this.loadProducts();
  }

  // --- Filtering ---

  get filteredProducts(): Product[] {
    let list = this.products();
    if (this.selectedCategory !== 'ALL') {
      list = list.filter(p => p.categoryName === this.selectedCategory);
    }
    if (this.productSearch && this.productSearch.trim()) {
      const q = this.productSearch.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  onProductSearchEnter(): void {
    const matches = this.filteredProducts;
    if (matches.length === 1) {
      this.addToCart(matches[0]);
      this.productSearch = '';
    }
  }

  getCurrency(p?: Product): string {
    return p?.currency || this.defaultCurrency || '₹';
  }

  getCartItemQty(productId: number): number {
    const item = this.cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  }

  // --- Cart Operations ---

  addToCart(product: Product, customPrice?: number, qty: number = 1): void {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += qty;
      if (customPrice !== undefined && customPrice !== null) {
        existing.unitPrice = customPrice;
      }
      existing.totalPrice = existing.quantity * existing.unitPrice;
    } else {
      const price = customPrice !== undefined && customPrice !== null ? customPrice : (product.price || 0);
      this.cart.push({
        product,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price,
        barcode: product.barcode || ''
      });
    }
  }

  onPriceChange(item: CartItem): void {
    if (item.unitPrice === null || item.unitPrice === undefined || item.unitPrice < 0) {
      item.unitPrice = 0;
    }
    item.totalPrice = item.quantity * item.unitPrice;
  }

  increaseQty(item: CartItem): void {
    item.quantity += 1;
    item.totalPrice = item.quantity * item.unitPrice;
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity -= 1;
      item.totalPrice = item.quantity * item.unitPrice;
    } else {
      const idx = this.cart.indexOf(item);
      if (idx !== -1) this.cart.splice(idx, 1);
    }
  }

  onQtyChange(item: CartItem): void {
    if (!item.quantity || item.quantity < 1) item.quantity = 1;
    item.totalPrice = item.quantity * item.unitPrice;
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  clearCart(): void {
    this.cart = [];
    this.discountAmount = 0;
    this.taxAmount = 0;
    this.paidAmount = null;
  }

  onWalkInToggle(): void {
    if (this.isWalkIn) {
      this.customerName = 'Walk-in Customer';
      this.customerPhone = '';
    } else {
      this.customerName = '';
      this.customerPhone = '';
    }
  }

  // --- Calculations ---

  get cartTotalQuantity(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get cartGrandTotal(): number {
    const disc = this.discountAmount || 0;
    const tax = this.taxAmount || 0;
    return Math.max(0, this.cartSubtotal - disc + tax);
  }

  calculateChange(): number {
    const paid = this.paidAmount !== null && this.paidAmount !== undefined ? this.paidAmount : this.cartGrandTotal;
    return Math.max(0, paid - this.cartGrandTotal);
  }

  // --- Checkout & Auto Stock-Out ---

  submitCheckout(): void {
    if (this.cart.length === 0) {
      alert('Your cart is empty! Please add products or upload a Price Order before checking out.');
      return;
    }

    if (!this.customerName || !this.customerName.trim()) {
      alert('Please enter shop / customer name.');
      return;
    }

    const payload: CheckoutRequest = {
      warehouseId: this.selectedWarehouseId || undefined,
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone ? this.customerPhone.trim() : undefined,
      paymentMethod: this.paymentMethod,
      discountAmount: this.discountAmount || 0,
      taxAmount: this.taxAmount || 0,
      paidAmount: this.paidAmount || this.cartGrandTotal,
      items: this.cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        barcode: item.barcode ? item.barcode.trim() : undefined
      }))
    };

    this.isSubmitting = true;
    this.wmsApi.checkoutSale(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.currentBill = res.data;
          this.showBillModal = true;
          this.clearCart();
          this.loadProducts();
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.message || 'Failed to complete sale checkout. Please check available stock levels.');
      }
    });
  }

  // --- Price Order Modal & Upload Actions ---

  openPriceOrderModal(): void {
    this.poPreview = null;
    this.showPoModal = true;
  }

  closePriceOrderModal(): void {
    this.showPoModal = false;
    this.poPreview = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploadingPo = true;
    this.wmsApi.uploadPriceOrderExcel(file).subscribe({
      next: (res) => {
        this.isUploadingPo = false;
        if (res.success && res.data) {
          this.poPreview = res.data;
        }
      },
      error: (err) => {
        this.isUploadingPo = false;
        alert(err.error?.message || 'Failed to parse Price Order Excel file. Please ensure columns match standard format.');
      }
    });
  }

  loadPoIntoCart(): void {
    if (!this.poPreview || !this.poPreview.items.length) return;

    if (this.poPreview.shopName) {
      this.customerName = this.poPreview.shopName;
      this.isWalkIn = false;
    }
    if (this.poPreview.shopPhone) {
      this.customerPhone = this.poPreview.shopPhone;
    }

    // Add each matched item into cart with its custom price
    for (const poItem of this.poPreview.items) {
      let product = this.products().find(p => p.id === poItem.productId);
      if (!product && poItem.sku) {
        product = this.products().find(p => p.sku && p.sku.toLowerCase() === poItem.sku?.toLowerCase());
      }
      if (!product) {
        product = this.products().find(p => p.name.toLowerCase() === poItem.productName.toLowerCase());
      }

      if (product) {
        this.addToCart(product, poItem.customPrice, poItem.quantity);
      }
    }

    this.closePriceOrderModal();
    alert(`Loaded ${this.poPreview.items.length} items from "${this.customerName}" Price Order into cart! You can review or adjust prices and quantities.`);
  }

  directCheckoutFromPo(): void {
    if (!this.poPreview || !this.poPreview.items.length) return;

    // Check if all items matched
    const unmatched = this.poPreview.items.filter(i => !i.matched);
    if (unmatched.length > 0) {
      alert(`Warning: ${unmatched.length} item(s) from the Price Order do not match any product in your store catalog. Please load into cart first to review.`);
      return;
    }

    const payload: CheckoutRequest = {
      warehouseId: this.selectedWarehouseId || undefined,
      customerName: this.poPreview.shopName || 'Wholesale Shop',
      customerPhone: this.poPreview.shopPhone || undefined,
      paymentMethod: this.paymentMethod,
      discountAmount: 0,
      taxAmount: 0,
      paidAmount: this.poPreview.estimatedTotal,
      items: this.poPreview.items.map(i => ({
        productId: i.productId!,
        quantity: i.quantity,
        unitPrice: i.customPrice
      }))
    };

    this.isSubmitting = true;
    this.wmsApi.checkoutSale(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.closePriceOrderModal();
        if (res.success && res.data) {
          this.currentBill = res.data;
          this.showBillModal = true;
          this.clearCart();
          this.loadProducts();
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.message || 'Failed to complete direct checkout from Price Order.');
      }
    });
  }

  // --- Bill Modal & Printing ---

  openBillModal(invoice: SaleInvoice): void {
    this.currentBill = invoice;
    this.showBillModal = true;
  }

  closeBillModal(): void {
    this.showBillModal = false;
  }

  startNewSaleFromModal(): void {
    this.showBillModal = false;
    this.activeTab = 'POS';
    this.clearCart();
  }

  printCurrentBill(): void {
    window.print();
  }
}
