import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WmsApiService } from '../../services/wms-api.service';
import { AuthService } from '../../services/auth.service';
import { Product, Warehouse, Category, SaleInvoice, SaleInvoiceItem, CheckoutRequest, PriceOrderPreview, CustomerProfile } from '../../models/wms.models';

interface CartItem {
  product: Product;
  quantity?: number | null;
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

          <!-- Instant Auto-Convert Button (One-click Image / PDF / Excel to Bill) -->
          <input type="file" #quickAutoConvertInput (change)="onAutoConvertFileSelected($event)" accept="image/*,.pdf,.xlsx,.xls,.csv" class="d-none">
          <button (click)="quickAutoConvertInput.click()" class="btn btn-warning btn-sm px-3 fw-bold shadow-sm d-flex align-items-center gap-1.5" title="Upload customer PO (Image, PDF, or Excel) to automatically convert directly into a bill">
            <i class="bi bi-magic fs-6 text-dark"></i>
            <span>⚡ Auto-Convert PO to Bill</span>
            <span class="badge bg-dark text-warning text-xs px-1.5 py-0.5 ms-1">Photo / PDF</span>
          </button>

          <!-- Wholesale Price Order & PO Upload Button (Camera / Image / PDF / Excel) -->
          <button (click)="openPriceOrderModal()" class="btn btn-outline-warning btn-sm px-2.5 fw-semibold shadow-sm d-flex align-items-center gap-1.5" title="Take photo or review purchase order side-by-side">
            <i class="bi bi-camera-fill text-warning"></i>
            <i class="bi bi-file-earmark-pdf-fill text-danger"></i>
            <span>Scan PO</span>
          </button>

          <!-- Download Excel Template Link -->
          <a [href]="templateUrl" class="btn btn-outline-secondary btn-sm px-2.5 d-none d-md-inline-flex align-items-center" title="Download sample Excel template for wholesale shops" download>
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
            <!-- Toast notification when auto-converted -->
            <div *ngIf="autoConvertToast" class="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between p-2.5 mb-2.5 border border-success border-opacity-40 bg-success bg-opacity-20 text-success rounded-3 shadow-sm animate__animated animate__fadeInDown">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill fs-5 text-success"></i>
                <div class="text-xs">
                  <strong class="d-block text-white">{{ autoConvertToast }}</strong>
                  <span class="text-light opacity-75">All items, quantities & wholesale rates auto-loaded. Ready to print or checkout!</span>
                </div>
              </div>
              <button type="button" class="btn btn-sm text-secondary p-0 ms-2" (click)="autoConvertToast = null"><i class="bi bi-x-lg text-light"></i></button>
            </div>

            <!-- Customer / Shop Info Header -->
            <!-- Customer / Shop Info Header with Direct Dropdown Selection -->
            <div class="p-2.5 rounded-2 bg-dark bg-opacity-60 border border-secondary border-opacity-20 mb-3">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="fw-bold text-light small">
                  <i class="bi bi-shop text-info me-1"></i>Select Customer / Shop PO:
                </span>
                <div class="d-flex align-items-center gap-1.5">
                  <button type="button" (click)="quickAutoConvertInput.click()" class="btn btn-xs btn-outline-warning py-0.5 px-2 fw-bold" title="Upload customer PO Image or PDF to auto convert directly into bill">
                    <i class="bi bi-magic me-1"></i>Auto-Convert PO
                  </button>
                  <span *ngIf="selectedCustomerProfile && selectedCustomerOption !== '__WALK_IN__' && selectedCustomerOption !== '__NEW__'" 
                        class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 text-xs">
                    <i class="bi bi-check2-circle me-1"></i>PO Loaded ({{ cart.length }} items)
                  </span>
                </div>
              </div>

              <!-- 📋 Customer Dropdown Option as requested -->
              <div class="mb-2">
                <select class="form-select form-select-sm bg-dark text-warning border-warning border-opacity-50 fw-bold font-monospace"
                        [(ngModel)]="selectedCustomerOption"
                        (change)="onCustomerDropdownChange()">
                  <option value="__WALK_IN__">🚶 Walk-in Customer (Standard Retail)</option>
                  <optgroup label="🏪 Saved Shops & Custom PO Rates" *ngIf="customerProfiles.length > 0">
                    <option *ngFor="let prof of customerProfiles" [value]="prof.customerName">
                      🏪 {{ prof.customerName }} ({{ prof.items?.length || 0 }} items &bull; Agreed PO)
                    </option>
                  </optgroup>
                  <option value="__NEW__">➕ + Add New Customer / Shop...</option>
                </select>
              </div>

              <!-- Customer Name & Phone Fields (Shown for New Customer or editing customer details) -->
              <div class="row g-2" *ngIf="selectedCustomerOption !== '__WALK_IN__'">
                <div class="col-7">
                  <label class="text-secondary text-xs d-block mb-0.5">Shop / Customer Name *</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerName"
                         placeholder="e.g. Fashion Bug / Shop A">
                </div>
                <div class="col-5">
                  <label class="text-secondary text-xs d-block mb-0.5">Mobile # (Opt)</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerPhone" placeholder="Mobile #">
                </div>
              </div>
            </div>

            <!-- Cart Table Items Header -->
            <div class="d-flex align-items-center justify-content-between mb-2 gap-2 flex-wrap">
              <div class="d-flex align-items-center flex-wrap gap-1">
                <span class="fw-bold text-light small">
                  <i class="bi bi-bag-check text-success me-1"></i>Bill Items ({{ cart.length }})
                </span>
                <span *ngIf="cartActiveItemCount > 0" class="badge bg-success bg-opacity-25 text-success text-xs">
                  {{ cartActiveItemCount }} active
                </span>
                <small class="text-warning text-xs ms-1">&bull; Rates editable</small>
              </div>

              <!-- Right: Currency Selector Dropdown & Clear Cart Button -->
              <div class="d-flex align-items-center gap-2">
                <div class="d-inline-flex align-items-center" title="Select Currency / Country Payment">
                  <select class="form-select form-select-sm currency-select font-monospace fw-bold py-0 ps-2 pe-4"
                          style="min-width: 76px; height: 26px; font-size: 0.82rem; cursor: pointer; border-radius: 6px;"
                          [(ngModel)]="defaultCurrency"
                          (ngModelChange)="onCurrencyChange($event)">
                    <option *ngFor="let c of availableCurrencies" [value]="c">
                      {{ c }}
                    </option>
                  </select>
                </div>

                <button *ngIf="cart.length > 0" (click)="clearCart()" class="btn btn-link btn-xs text-danger text-decoration-none p-0 d-inline-flex align-items-center" title="Clear all items from bill">
                  <i class="bi bi-trash3 me-0.5"></i>Clear Cart
                </button>
              </div>
            </div>

            <div class="cart-scroll flex-grow-1 overflow-y-auto mb-3 pe-1" style="max-height: 380px; min-height: 200px;">
              <div *ngIf="cart.length === 0" class="text-center py-4 text-muted border border-dashed border-secondary border-opacity-25 rounded-2">
                <i class="bi bi-cart-x fs-2 d-block mb-1 text-secondary opacity-50"></i>
                <span class="small">Cart is empty. Click any product from the catalog to add.</span>
              </div>

              <!-- Cart Row with Live Editable Price per Shop -->
              <div *ngFor="let item of cart; let i = index" class="cart-item-row p-2.5 mb-2 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 shadow-sm"
                   [class.border-success]="item.quantity && item.quantity > 0">
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

                      <span *ngIf="item.quantity && item.quantity > item.product.currentStock" class="text-danger fw-bold text-xs">
                        (! Low Stock)
                      </span>
                      <span *ngIf="!item.quantity || item.quantity <= 0" class="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-30 text-xs py-0 px-1">
                        Type Qty
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
                             style="width: 52px; height: 26px; font-size: 0.85rem;"
                             [(ngModel)]="item.quantity"
                             (ngModelChange)="onQtyChange(item)"
                             placeholder="Qty"
                             title="Type pieces/quantity to bill">
                      <button class="btn btn-outline-secondary btn-xs p-0 px-1.5" style="height: 26px;" (click)="increaseQty(item)">+</button>
                    </div>
                  </div>

                  <!-- Line Total -->
                  <div class="text-end">
                    <span class="text-secondary text-xs d-none d-sm-inline">Total: </span>
                    <strong class="small" [ngClass]="(item.quantity && item.quantity > 0) ? 'text-success fw-bold' : 'text-secondary'">
                      <span *ngIf="item.quantity && item.quantity > 0">{{ defaultCurrency }} {{ item.totalPrice | number:'1.2-2' }}</span>
                      <span *ngIf="!item.quantity || item.quantity <= 0">—</span>
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Financial Summary & Checkout -->
            <div class="p-3 rounded-2 bg-dark bg-opacity-70 border border-secondary border-opacity-30 mt-auto">
              <div class="d-flex justify-content-between small text-secondary mb-1">
                <span>Subtotal ({{ cartTotalQuantity }} pcs &bull; {{ cartActiveItemCount }} items):</span>
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
      <!-- ============================================================= -->
      <!-- MODAL: SCAN / UPLOAD CUSTOMER PURCHASE ORDER (CAMERA/IMG/PDF/XLS) -->
      <!-- ============================================================= -->
      <div *ngIf="showPoModal" class="modal-backdrop-custom animate__animated animate__fadeIn">
        <div class="modal-dialog-custom glass-panel p-3 p-md-4 animate__animated animate__zoomIn" style="max-width: 1050px; width: 95%; max-height: 92vh; overflow-y: auto;">
          <!-- Modal Header -->
          <div class="d-flex align-items-center justify-content-between pb-2.5 border-bottom border-secondary border-opacity-25 mb-3">
            <div>
              <h5 class="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-camera-fill text-warning fs-5"></i>
                <span>Scan or Upload Customer Purchase Order</span>
              </h5>
              <div class="text-secondary small mt-0.5">Mobile Camera Snap &bull; WhatsApp Photos &bull; PDF Documents &bull; Excel Sheets</div>
            </div>
            <button class="btn btn-sm text-secondary" (click)="closePriceOrderModal()"><i class="bi bi-x-lg fs-5"></i></button>
          </div>

          <!-- Step 1: Upload / Camera Options if no preview yet -->
          <div *ngIf="!poPreview" class="py-2">
            <div class="row g-3 my-1">
              <!-- Option 1: Mobile Camera Snap -->
              <div class="col-12 col-md-4">
                <input type="file" #cameraInput (change)="onFileSelected($event)" accept="image/*" capture="environment" class="d-none">
                <div class="h-100 p-3.5 rounded-3 bg-dark bg-opacity-70 border border-warning border-opacity-40 text-center cursor-pointer hover-lift d-flex flex-column justify-content-between" (click)="cameraInput.click()">
                  <div>
                    <div class="rounded-circle bg-warning bg-opacity-15 d-inline-flex p-3 mb-2 text-warning">
                      <i class="bi bi-camera-fill fs-2"></i>
                    </div>
                    <h6 class="fw-bold text-warning mb-1">Take Photo with Camera</h6>
                    <p class="text-secondary text-xs mb-0">Use mobile phone back camera to snap paper PO bill or handwritten list</p>
                  </div>
                  <button class="btn btn-warning btn-sm w-100 fw-bold mt-3 shadow-sm">
                    <i class="bi bi-camera me-1"></i>Snap Photo
                  </button>
                </div>
              </div>

              <!-- Option 2: Gallery Image / Screenshot -->
              <div class="col-12 col-md-4">
                <input type="file" #imageInput (change)="onFileSelected($event)" accept="image/*" class="d-none">
                <div class="h-100 p-3.5 rounded-3 bg-dark bg-opacity-70 border border-info border-opacity-40 text-center cursor-pointer hover-lift d-flex flex-column justify-content-between" (click)="imageInput.click()">
                  <div>
                    <div class="rounded-circle bg-info bg-opacity-15 d-inline-flex p-3 mb-2 text-info">
                      <i class="bi bi-image fs-2"></i>
                    </div>
                    <h6 class="fw-bold text-info mb-1">Upload Photo / Screenshot</h6>
                    <p class="text-secondary text-xs mb-0">Select JPG, PNG, WebP order images from phone gallery or WhatsApp</p>
                  </div>
                  <button class="btn btn-outline-info btn-sm w-100 fw-bold mt-3">
                    <i class="bi bi-folder2-open me-1"></i>Choose Image
                  </button>
                </div>
              </div>

              <!-- Option 3: PDF / Excel Document -->
              <div class="col-12 col-md-4">
                <input type="file" #docInput (change)="onFileSelected($event)" accept=".pdf,.xlsx,.xls,.csv" class="d-none">
                <div class="h-100 p-3.5 rounded-3 bg-dark bg-opacity-70 border border-success border-opacity-40 text-center cursor-pointer hover-lift d-flex flex-column justify-content-between" (click)="docInput.click()">
                  <div>
                    <div class="rounded-circle bg-success bg-opacity-15 d-inline-flex p-3 mb-2 text-success">
                      <i class="bi bi-file-earmark-pdf-fill fs-2"></i>
                    </div>
                    <h6 class="fw-bold text-success mb-1">Upload PDF or Excel</h6>
                    <p class="text-secondary text-xs mb-0">Upload invoice PDF or wholesale Excel order spreadsheet</p>
                  </div>
                  <button class="btn btn-outline-success btn-sm w-100 fw-bold mt-3">
                    <i class="bi bi-file-earmark-arrow-up me-1"></i>Choose Document
                  </button>
                </div>
              </div>
            </div>

            <!-- OCR / Uploading Progress indicator -->
            <div *ngIf="isOcrProcessing || isUploadingPo" class="p-3 my-3 rounded-2 bg-dark bg-opacity-80 border border-warning border-opacity-35 text-center animate__animated animate__fadeIn">
              <div class="d-flex align-items-center justify-content-between small text-warning mb-1.5 font-monospace">
                <span><span class="spinner-border spinner-border-sm me-2"></span>{{ ocrProgressMessage || 'Reading document & extracting items...' }}</span>
                <span class="fw-bold">{{ ocrProgressPercent }}%</span>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" [style.width.%]="ocrProgressPercent || 50"></div>
              </div>
              <small class="text-secondary text-xs mt-1.5 d-block">AI scanning customer name, items, quantities and agreed wholesale rates...</small>
            </div>

            <div class="d-flex align-items-center justify-content-between text-secondary text-xs px-2 mt-3 pt-2 border-top border-secondary border-opacity-20">
              <span>Have an Excel template?</span>
              <a [href]="templateUrl" class="text-warning text-decoration-none fw-semibold" download>
                <i class="bi bi-download me-1"></i>Download Sample Shop Excel Template
              </a>
            </div>
          </div>

          <!-- Step 2: Parsed Preview Split Screen -->
          <div *ngIf="poPreview" class="animate__animated animate__fadeIn">
            <!-- Shop Info Header Bar -->
            <div class="p-2.5 rounded-2 bg-dark bg-opacity-70 border border-secondary border-opacity-30 mb-3">
              <div class="row g-2 align-items-center">
                <div class="col-12 col-md-5">
                  <label class="form-label text-secondary text-xs mb-0.5 fw-semibold">Shop / Customer Name:</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary fw-bold" [(ngModel)]="poPreview.shopName" placeholder="e.g. Fashion Bug / Shop A">
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label text-secondary text-xs mb-0.5">Mobile # (Opt):</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary" [(ngModel)]="poPreview.shopPhone" placeholder="Mobile #">
                </div>
                <div class="col-6 col-md-4 text-md-end">
                  <span class="badge text-xs px-2 py-1 me-2" [ngClass]="poFileType === 'IMAGE' ? 'bg-info bg-opacity-20 text-info border border-info border-opacity-30' : (poFileType === 'PDF' ? 'bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30' : 'bg-success bg-opacity-20 text-success border border-success border-opacity-30')">
                    <i class="bi" [ngClass]="poFileType === 'IMAGE' ? 'bi-camera' : (poFileType === 'PDF' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-excel')"></i>
                    {{ poFileType }} {{ poFileType === 'IMAGE' ? 'Scan' : 'Order' }}
                  </span>
                  <div class="d-inline-block text-start">
                    <small class="text-secondary d-block text-xs">Estimated Total:</small>
                    <strong class="text-success fs-6 font-monospace">{{ defaultCurrency }} {{ poPreview.estimatedTotal | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Body: Document Visual Viewer on Left (col-lg-5) & Extracted Items on Right (col-lg-7) -->
            <div class="row g-3">
              <!-- Visual Document Pane -->
              <div class="col-12 col-lg-5" *ngIf="poImagePreviewUrl || poFileType === 'IMAGE' || poFileType === 'PDF'">
                <div class="p-2.5 rounded-2 bg-dark bg-opacity-60 border border-secondary border-opacity-30 h-100 d-flex flex-column">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="text-secondary text-xs fw-semibold">
                      <i class="bi bi-file-earmark-image text-info me-1"></i>Original Customer Document
                    </span>
                    <button *ngIf="poImagePreviewUrl && poFileType === 'IMAGE'" class="btn btn-xs btn-outline-info px-2 py-0.5" (click)="zoomImageModal = true" title="Zoom full screen">
                      <i class="bi bi-arrows-fullscreen me-1"></i>Enlarge
                    </button>
                  </div>

                  <div class="flex-grow-1 text-center bg-black bg-opacity-50 rounded d-flex align-items-center justify-content-center p-1.5 overflow-hidden border border-secondary border-opacity-20" style="max-height: 400px; min-height: 220px;">
                    <img *ngIf="poFileType === 'IMAGE' && poImagePreviewUrl" [src]="poImagePreviewUrl" class="img-fluid rounded" style="max-height: 380px; object-fit: contain; cursor: zoom-in;" (click)="zoomImageModal = true" title="Click to enlarge image">
                    <iframe *ngIf="poFileType === 'PDF' && poSafePdfUrl" [src]="poSafePdfUrl" width="100%" height="380px" class="border-0 rounded"></iframe>
                    <div *ngIf="poFileType === 'EXCEL'" class="py-4 text-center text-success">
                      <i class="bi bi-file-earmark-excel fs-1 d-block mb-1"></i>
                      <span class="small font-monospace">{{ poPreview.fileName || 'Spreadsheet uploaded' }}</span>
                    </div>
                  </div>
                  <small class="text-secondary text-xs text-center mt-1.5 opacity-75">
                    Tap photo to zoom &bull; Check agreed rates with original document
                  </small>
                </div>
              </div>

              <!-- Extracted Items Table Pane -->
              <div [ngClass]="(poImagePreviewUrl || poFileType === 'IMAGE' || poFileType === 'PDF') ? 'col-12 col-lg-7' : 'col-12'">
                <!-- Items Table -->
                <div class="table-responsive rounded border border-secondary border-opacity-25 mb-2.5" style="max-height: 290px;">
                  <table class="table table-custom table-sm mb-0 align-middle">
                    <thead>
                      <tr class="header-row">
                        <th style="width: 28px;">#</th>
                        <th>Product Name / SKU</th>
                        <th class="text-center" style="width: 90px;">Qty</th>
                        <th class="text-end" style="width: 100px;">Rate</th>
                        <th class="text-end" style="width: 100px;">Total</th>
                        <th class="text-center" style="width: 32px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngIf="!poPreview.items || poPreview.items.length === 0">
                        <td colspan="6" class="text-center py-4 text-muted small">
                          No items recognized yet. Select a product below or adjust photo.
                        </td>
                      </tr>
                      <tr *ngFor="let item of poPreview.items; let idx = index">
                        <td class="text-muted text-xs">{{ idx + 1 }}</td>
                        <td>
                          <!-- If matched product -->
                          <div *ngIf="item.matched">
                            <span class="fw-bold text-light text-sm d-block">{{ item.productName }}</span>
                            <small class="text-secondary font-monospace text-xs">{{ item.sku || 'SKU' }} &bull; Stock: {{ item.availableStock }} {{ item.unit }}</small>
                          </div>
                          <!-- If not matched, allow quick match to catalog -->
                          <div *ngIf="!item.matched">
                            <span class="text-warning fw-semibold text-xs d-block mb-1">{{ item.productName }}</span>
                            <select class="form-select form-select-xs bg-dark text-warning border-warning border-opacity-50 py-0"
                                    (change)="onPoProductSelect(item, $any($event.target).value)">
                              <option value="">⚠️ Match to Store Product...</option>
                              <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku || '—' }})</option>
                            </select>
                          </div>
                        </td>
                        <!-- Editable Qty -->
                        <td class="text-center">
                          <input type="number" class="form-control form-control-sm text-center bg-dark text-light border-secondary p-0 font-monospace fw-bold"
                                 style="width: 65px; height: 26px; font-size: 0.8rem; margin: auto;"
                                 [(ngModel)]="item.quantity"
                                 (ngModelChange)="onPoItemQtyChange(item)"
                                 placeholder="Qty"
                                 title="Type pieces/quantity">
                        </td>
                        <!-- Editable Rate -->
                        <td class="text-end">
                          <input type="number" class="form-control form-control-sm text-end bg-dark text-warning border-secondary p-0 px-1 font-monospace fw-bold"
                                 style="width: 85px; height: 26px; font-size: 0.8rem; margin-left: auto;"
                                 [(ngModel)]="item.customPrice"
                                 (ngModelChange)="onPoItemPriceChange(item)" min="0" step="0.5">
                        </td>
                        <!-- Line Total -->
                        <td class="text-end fw-bold font-monospace text-xs" [ngClass]="(item.quantity && item.quantity > 0) ? 'text-light' : 'text-secondary'">
                          <span *ngIf="item.quantity && item.quantity > 0">{{ defaultCurrency }} {{ item.lineTotal | number:'1.2-2' }}</span>
                          <span *ngIf="!item.quantity || item.quantity <= 0">—</span>
                        </td>
                        <!-- Remove button -->
                        <td class="text-center">
                          <button class="btn btn-link btn-xs text-danger p-0" (click)="removePoItem(idx)" title="Remove item">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Quick Add Product from Catalog -->
                <div class="p-1.5 mb-3 rounded bg-dark bg-opacity-60 border border-secondary border-opacity-25 d-flex gap-1.5 align-items-center">
                  <select class="form-select form-select-sm bg-dark text-light border-secondary text-xs" [(ngModel)]="poSearchProductToAdd">
                    <option [ngValue]="null">+ Add another product from store catalog...</option>
                    <option *ngFor="let p of products()" [value]="p.id">
                      {{ p.name }} ({{ p.sku || 'No SKU' }}) - Stock: {{ p.currentStock }} - Rate: {{ defaultCurrency }} {{ p.price }}
                    </option>
                  </select>
                  <button class="btn btn-warning btn-sm text-xs fw-bold flex-shrink-0 px-2.5" [disabled]="!poSearchProductToAdd" (click)="addPoItemFromCatalog()">
                    <i class="bi bi-plus-lg me-0.5"></i>Add
                  </button>
                </div>

                <!-- Summary Badges -->
                <div class="d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-20 mb-3 text-xs">
                  <span class="text-secondary">Items: <strong class="text-light">{{ poPreview.totalItems || poPreview.items.length }}</strong></span>
                  <span class="text-secondary">Units: <strong class="text-light">{{ poPreview.totalQuantity }}</strong></span>
                  <span class="text-secondary">Estimated Total: <strong class="text-success fs-6 font-monospace">{{ defaultCurrency }} {{ poPreview.estimatedTotal | number:'1.2-2' }}</strong></span>
                </div>

                <!-- Action Buttons -->
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top border-secondary border-opacity-25">
                  <button class="btn btn-outline-secondary btn-sm" (click)="poPreview = null; poImagePreviewUrl = null;">
                    <i class="bi bi-arrow-left me-1"></i> Choose Another File
                  </button>

                  <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm px-3 fw-semibold shadow-sm" [disabled]="!poPreview.items || poPreview.items.length === 0" (click)="loadPoIntoCart()">
                      <i class="bi bi-cart-plus me-1"></i> Load into Bill Cart
                    </button>
                    <button class="btn btn-success btn-sm px-3 fw-bold shadow" [disabled]="!poPreview.items || poPreview.items.length === 0" (click)="directCheckoutFromPo()">
                      <i class="bi bi-check2-circle me-1"></i> Direct Complete & Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- MODAL: FULLSCREEN PHOTO ZOOM                                  -->
      <!-- ============================================================= -->
      <div *ngIf="zoomImageModal && poImagePreviewUrl" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn" (click)="zoomImageModal = false" style="z-index: 1060; background: rgba(0,0,0,0.85);">
        <div class="position-relative bg-dark p-2 rounded-3 border border-secondary shadow-lg text-center" style="max-width: 96vw; max-height: 96vh; overflow: auto;" (click)="$event.stopPropagation()">
          <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 shadow" (click)="zoomImageModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
          <img [src]="poImagePreviewUrl" class="img-fluid rounded" style="max-height: 88vh; object-fit: contain;">
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
    .currency-select {
      background-color: #111827 !important;
      color: #38bdf8 !important;
      border: 1px solid rgba(56, 189, 248, 0.45) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .currency-select:focus {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25) !important;
    }
    .currency-select option {
      background-color: #1f2937 !important;
      color: #f9fafb !important;
      padding: 6px 10px;
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

  defaultCurrency = 'Rs.';
  availableCurrencies: string[] = [
    'Rs.',
    '$',
    '₹',
    '€',
    '£',
    'AED',
    'SAR',
    'QAR',
    'KWD',
    'BHD',
    'OMR',
    'RM',
    'S$',
    'C$',
    'A$'
  ];
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

  // Customer PO & Price Memory State
  customerProfiles: CustomerProfile[] = [];
  selectedCustomerOption: string = '__WALK_IN__';
  selectedCustomerProfile: CustomerProfile | null = null;
  customerPriceMap: { [productId: number]: number } = {};

  isSubmitting = false;

  // Bill Modal State
  showBillModal = false;
  currentBill: SaleInvoice | null = null;

  // Price Order Upload & Scanner State
  showPoModal = false;
  isUploadingPo = false;
  poPreview: PriceOrderPreview | null = null;
  poImagePreviewUrl: string | null = null;
  poSafePdfUrl: SafeResourceUrl | null = null;
  poFileType: 'IMAGE' | 'PDF' | 'EXCEL' = 'IMAGE';
  ocrProgressMessage = '';
  ocrProgressPercent = 0;
  isOcrProcessing = false;
  zoomImageModal = false;
  poSearchProductToAdd: number | null = null;
  autoConvertToast: string | null = null;

  constructor(
    private wmsApi: WmsApiService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
    const savedCurrency = localStorage.getItem('wms_billing_currency');
    if (savedCurrency) {
      this.defaultCurrency = savedCurrency;
    }
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
    this.loadCustomerProfiles();

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
        const savedCurrency = localStorage.getItem('wms_billing_currency');
        if (savedCurrency) {
          this.defaultCurrency = savedCurrency;
        } else if (res.data.length > 0 && res.data[0].currency) {
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
    return this.defaultCurrency;
  }

  onCurrencyChange(newCurrency: string): void {
    this.defaultCurrency = newCurrency;
    try {
      localStorage.setItem('wms_billing_currency', newCurrency);
    } catch (e) {
      console.warn('Could not save currency to localStorage', e);
    }
  }

  getCartItemQty(productId: number): number {
    const item = this.cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  }

  // --- Cart Operations ---

  addToCart(product: Product, customPrice?: number, qty: number | null = 1): void {
    // If no explicit price provided, check customer price memory (last agreed price for this customer)
    if ((customPrice === undefined || customPrice === null) && this.customerPriceMap[product.id] !== undefined) {
      customPrice = this.customerPriceMap[product.id];
    }

    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      if (qty !== null && qty !== undefined && Number(qty) > 0) {
        existing.quantity = (existing.quantity || 0) + Number(qty);
      }
      if (customPrice !== undefined && customPrice !== null) {
        existing.unitPrice = customPrice;
      }
      existing.totalPrice = (existing.quantity || 0) * existing.unitPrice;
    } else {
      const price = customPrice !== undefined && customPrice !== null ? customPrice : (product.price || 0);
      this.cart.push({
        product,
        quantity: qty,
        unitPrice: price,
        totalPrice: (qty || 0) * price,
        barcode: product.barcode || ''
      });
    }
  }

  onPriceChange(item: CartItem): void {
    if (item.unitPrice === null || item.unitPrice === undefined || item.unitPrice < 0) {
      item.unitPrice = 0;
    }
    item.totalPrice = (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) * item.unitPrice : 0;
    if (item.product && item.product.id) {
      this.customerPriceMap[item.product.id] = item.unitPrice;
    }
  }

  increaseQty(item: CartItem): void {
    const current = (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 0;
    item.quantity = current + 1;
    item.totalPrice = item.quantity * item.unitPrice;
  }

  decreaseQty(item: CartItem): void {
    const current = (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 0;
    if (current > 1) {
      item.quantity = current - 1;
      item.totalPrice = item.quantity * item.unitPrice;
    } else {
      item.quantity = null;
      item.totalPrice = 0;
    }
  }

  onQtyChange(item: CartItem): void {
    if (item.quantity === null || item.quantity === undefined || (item.quantity as any) === '') {
      item.quantity = null;
      item.totalPrice = 0;
      return;
    }
    const val = Number(item.quantity);
    if (isNaN(val) || val <= 0) {
      item.quantity = null;
      item.totalPrice = 0;
    } else {
      item.quantity = val;
      item.totalPrice = val * item.unitPrice;
    }
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

  getSandyaPoItems(): any[] {
    return [
      { productId: -101, sku: 'HMC 36', productName: 'Bundle Small Woolies & Classical Set Woolies (8 Designs)', quantity: null, unitPrice: 65.00, totalPrice: 0.0, barcode: 'HMC 36', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -102, sku: 'WB 10', productName: 'Thick Blacky Wooly & Designer Color Woolies (13 Designs)', quantity: null, unitPrice: 95.00, totalPrice: 0.0, barcode: 'WB 10', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -103, sku: 'BP 62', productName: 'Blacky on Color Bundle Teen Woolies (16 Designs)', quantity: null, unitPrice: 120.00, totalPrice: 0.0, barcode: 'BP 62', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -104, sku: 'NB 72', productName: 'Thin & Thick Bundle Wooly Designers (10 Designs)', quantity: null, unitPrice: 125.00, totalPrice: 0.0, barcode: 'NB 72', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -105, sku: 'RC 32', productName: 'Rabbit Fur Scrunchy Wooly (4 Designs)', quantity: null, unitPrice: 95.00, totalPrice: 0.0, barcode: 'RC 32', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -106, sku: 'FW 03', productName: 'Telephone Wire Designer Woolies & Fur Thin Double Kid Wooly (12 Designs)', quantity: null, unitPrice: 105.00, totalPrice: 0.0, barcode: 'FW 03', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -107, sku: 'PB 31', productName: 'Small Trancy Clips & Wooly Set Combo Pcs (4 Designs)', quantity: null, unitPrice: 160.00, totalPrice: 0.0, barcode: 'PB 31', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -108, sku: 'FN 01', productName: '6 pcs Kiddy Fancy Wooly Long Card (7 Designs)', quantity: null, unitPrice: 140.00, totalPrice: 0.0, barcode: 'FN 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -109, sku: 'FC 04', productName: '3 Pcs Designer Kiddy Clip Set (10 Designs)', quantity: null, unitPrice: 120.00, totalPrice: 0.0, barcode: 'FC 04', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -110, sku: 'FC 08', productName: 'Steel Mini 2pcs peg & Glass Peg with Wooly Set (10 Designs)', quantity: null, unitPrice: 125.00, totalPrice: 0.0, barcode: 'FC 08', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -111, sku: 'FC 09', productName: 'Kiddy 6pcs clip on Small 3pcs Set Peg (8 Designs)', quantity: null, unitPrice: 180.00, totalPrice: 0.0, barcode: 'FC 09', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -112, sku: 'FC 13', productName: 'Shiny Stone Pegs & premier Set Hair Clips (6 Designs)', quantity: null, unitPrice: 195.00, totalPrice: 0.0, barcode: 'FC 13', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -113, sku: 'BLC 11', productName: 'Premier B\'Fly Clips & Bow Clip Exclusive (7 Designs)', quantity: null, unitPrice: 230.00, totalPrice: 0.0, barcode: 'BLC 11', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -114, sku: 'BS 09', productName: 'Acrylic Designer Clips & Steel Pegs 3pcs (13 Designs)', quantity: null, unitPrice: 195.00, totalPrice: 0.0, barcode: 'BS 09', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -115, sku: 'PHB 01', productName: 'Premier Set Hair Clips with Sunflower Pegs (13 Designs)', quantity: null, unitPrice: 190.00, totalPrice: 0.0, barcode: 'PHB 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -116, sku: 'MBE 10', productName: 'Clip & Wooly Mix with Kiddy double peggy Set (14 Designs)', quantity: null, unitPrice: 220.00, totalPrice: 0.0, barcode: 'MBE 10', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -117, sku: 'NB 67', productName: 'Combo Set Designer Kiddy Clips (10 Designs)', quantity: null, unitPrice: 140.00, totalPrice: 0.0, barcode: 'NB 67', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -118, sku: 'BLC 09', productName: 'Acrylic Combo Set & Glossy Set Clips (6 Designs)', quantity: null, unitPrice: 170.00, totalPrice: 0.0, barcode: 'BLC 09', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -119, sku: 'MCF 02', productName: 'Jojo Siwa Medium Clips Premier Designs (5 Designs)', quantity: null, unitPrice: 220.00, totalPrice: 0.0, barcode: 'MCF 02', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -120, sku: 'MB 68', productName: 'Fur ball Designer Clips (8 Designs)', quantity: null, unitPrice: 105.00, totalPrice: 0.0, barcode: 'MB 68', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -121, sku: 'HW 02', productName: 'Kiddy Colorful Clips Tic & Glossy (15 Designs)', quantity: null, unitPrice: 150.00, totalPrice: 0.0, barcode: 'HW 02', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -122, sku: 'LHP 05', productName: 'Long Hair Mini Peg & Clip Set (10 Designs)', quantity: null, unitPrice: 170.00, totalPrice: 0.0, barcode: 'LHP 05', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -123, sku: 'JS 10', productName: 'Classic Jojo Siwa Clips (5 Designs)', quantity: null, unitPrice: 180.00, totalPrice: 0.0, barcode: 'JS 10', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -124, sku: 'JS 11', productName: 'Kiddy Hair Clip Large & mini Designers Set (8 Designers)', quantity: null, unitPrice: 150.00, totalPrice: 0.0, barcode: 'JS 11', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -125, sku: 'NB 74', productName: '3 Pcs Flowery Set Pegs & Water Color Large Designer Pegs (10 Designs)', quantity: null, unitPrice: 165.00, totalPrice: 0.0, barcode: 'NB 74', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -126, sku: 'MKY 03', productName: 'Medium Matt Pegs (6 Designs)', quantity: null, unitPrice: 110.00, totalPrice: 0.0, barcode: 'MKY 03', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -127, sku: 'LHB 04', productName: '6 pcs Small Pastel Shade Pegs (6 Designs)', quantity: null, unitPrice: 140.00, totalPrice: 0.0, barcode: 'LHB 04', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -128, sku: 'HW 06', productName: 'Basic Fur & 8 to 10cm Pegs & Sunflower Designer Pegs (11 Designs)', quantity: null, unitPrice: 110.00, totalPrice: 0.0, barcode: 'HW 06', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -129, sku: 'HW 03', productName: 'Shady Color Matt & Gloss Pegs (8 Designs)', quantity: null, unitPrice: 130.00, totalPrice: 0.0, barcode: 'HW 03', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -130, sku: 'FN 01', productName: 'Water Color 8cm Designer Pegs (8 Designs)', quantity: null, unitPrice: 150.00, totalPrice: 0.0, barcode: 'FN 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -131, sku: 'NBE 04', productName: 'Water Color Kids Accessory Hair Peg (5 Designs)', quantity: null, unitPrice: 120.00, totalPrice: 0.0, barcode: 'NBE 04', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -132, sku: 'BSR 01', productName: '6 Pcs Pegs Set Designers (4 Designs)', quantity: null, unitPrice: 295.00, totalPrice: 0.0, barcode: 'BSR 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -133, sku: 'MCP 01', productName: 'Shades With Tiny Color Pegs Set (4 Designs)', quantity: null, unitPrice: 180.00, totalPrice: 0.0, barcode: 'MCP 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -134, sku: 'NB 73', productName: 'Glass Thin Designer Hair Bands (8 Designs)', quantity: null, unitPrice: 95.00, totalPrice: 0.0, barcode: 'NB 73', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -135, sku: 'LHB 02', productName: 'Glossy Thin Full Flex Hair Band with Accessory (5 Designs)', quantity: null, unitPrice: 120.00, totalPrice: 0.0, barcode: 'LHB 02', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -136, sku: 'KC 18', productName: 'Black Plastic Designer Bands (8 Designs)', quantity: null, unitPrice: 50.00, totalPrice: 0.0, barcode: 'KC 18', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -137, sku: 'MB 99', productName: 'Charm Mickey Bands Kids & Teens (9 Designs)', quantity: null, unitPrice: 180.00, totalPrice: 0.0, barcode: 'MB 99', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -138, sku: 'MB 98', productName: 'Kiddy Set Bracelet (4 Designs)', quantity: null, unitPrice: 150.00, totalPrice: 0.0, barcode: 'MB 98', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -139, sku: 'VC 02', productName: 'Exclusive Van Cliff Design Half Bangles with Stone Work (12 Designs)', quantity: null, unitPrice: 260.00, totalPrice: 0.0, barcode: 'VC 02', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -140, sku: 'SLD 15', productName: 'Exclusive Designer Key Tags (5 Designs)', quantity: null, unitPrice: 250.00, totalPrice: 0.0, barcode: 'SLD 15', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -141, sku: 'BS 12', productName: 'Shiny Stone Pearl Key Tags (5 Designs)', quantity: null, unitPrice: 205.00, totalPrice: 0.0, barcode: 'BS 12', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -142, sku: 'LCK 01', productName: 'Crystal & Metal Designer Key Tags (8 Designs)', quantity: null, unitPrice: 140.00, totalPrice: 0.0, barcode: 'LCK 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -143, sku: 'BLC 05', productName: 'Kids Small Necklace Set with Earing (6 Designs)', quantity: null, unitPrice: 175.00, totalPrice: 0.0, barcode: 'BLC 05', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -144, sku: 'VC 03', productName: 'Premier Necklace Designers (5 Designs)', quantity: null, unitPrice: 520.00, totalPrice: 0.0, barcode: 'VC 03', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -145, sku: 'VC 07', productName: 'Full Pearl & Half Pearl with Gold Necklace with Earing (12 Designs)', quantity: null, unitPrice: 230.00, totalPrice: 0.0, barcode: 'VC 07', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -146, sku: 'NB 01', productName: 'Kids Gold Necklace & Colorful Pearl Ball Necklace (8 Designs)', quantity: null, unitPrice: 330.00, totalPrice: 0.0, barcode: 'NB 01', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -147, sku: 'BSR 03', productName: 'Kids Ring Designer 6 Pcs Set Card (4 Designs)', quantity: null, unitPrice: 240.00, totalPrice: 0.0, barcode: 'BSR 03', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true },
      { productId: -148, sku: 'BSR 06', productName: 'Saree Broochers Big Exclusive (11 Designs)', quantity: null, unitPrice: 340.00, totalPrice: 0.0, barcode: 'BSR 06', unit: 'PCS', matched: true, availableStock: 999, isStockSufficient: true }
    ];
  }

  private getLocalProfiles(): CustomerProfile[] {
    const sandyaItems = this.getSandyaPoItems();
    const sandyaTotal = sandyaItems.reduce((acc, itm) => acc + (itm.totalPrice || 0), 0);

    const sandyaProfile: CustomerProfile = {
      customerName: 'Sandya Textile (Ratnapura)',
      customerPhone: '045-2223344',
      lastInvoiceNumber: 'PO-KLIPPIE-SANDYA',
      lastOrderDate: new Date().toISOString(),
      grandTotal: sandyaTotal,
      items: sandyaItems
    };

    try {
      const data = localStorage.getItem('wms_saved_customer_pos');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sandyaIdx = parsed.findIndex(p => p.customerName.toLowerCase().includes('sandya'));
          if (sandyaIdx >= 0) {
            parsed[sandyaIdx] = sandyaProfile;
          } else {
            parsed.unshift(sandyaProfile);
          }
          localStorage.setItem('wms_saved_customer_pos', JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read local customer profiles', e);
    }

    const presets: CustomerProfile[] = [
      sandyaProfile,
      {
        customerName: 'Fashion Bug',
        customerPhone: '077-1234567',
        lastInvoiceNumber: 'PO-FB-001',
        lastOrderDate: new Date().toISOString(),
        grandTotal: 15000,
        items: []
      }
    ];
    return presets;
  }

  private saveCustomerProfileLocally(
    name: string,
    phone: string,
    invoiceNumber?: string,
    grandTotal?: number,
    customItems?: any[]
  ): void {
    if (!name || name.trim() === 'Walk-in Customer' || this.isWalkIn) return;
    try {
      const list = this.getLocalProfiles();
      const cleanName = name.trim();
      const existingIdx = list.findIndex(p => p.customerName.toLowerCase() === cleanName.toLowerCase());
      const newItems: any[] = customItems && customItems.length > 0
        ? customItems
        : this.cart.map(c => ({
            productId: c.product.id,
            productName: c.product.name,
            sku: c.product.sku,
            barcode: c.barcode || c.product.barcode || '',
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            totalPrice: c.totalPrice
          }));

      const profile: CustomerProfile = {
        customerName: cleanName,
        customerPhone: phone || '',
        lastInvoiceNumber: invoiceNumber || 'INV-' + Date.now().toString().slice(-4),
        lastOrderDate: new Date().toISOString(),
        grandTotal: grandTotal || this.cartGrandTotal,
        items: newItems
      };

      if (existingIdx >= 0) {
        list[existingIdx] = profile;
      } else {
        list.push(profile);
      }
      localStorage.setItem('wms_saved_customer_pos', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save customer profile locally', e);
    }
  }

  loadCustomerProfiles(): void {
    const localProfiles = this.getLocalProfiles();
    this.wmsApi.getCustomerProfiles().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          const map = new Map<string, CustomerProfile>();
          localProfiles.forEach(p => map.set(p.customerName.toLowerCase(), p));
          res.data.forEach(p => map.set(p.customerName.toLowerCase(), p));
          this.customerProfiles = Array.from(map.values());
        } else {
          this.customerProfiles = localProfiles;
        }

        if (this.selectedCustomerOption !== '__WALK_IN__' && this.selectedCustomerOption !== '__NEW__') {
          const match = this.customerProfiles.find(p => p.customerName.toLowerCase() === this.selectedCustomerOption.toLowerCase());
          if (match) {
            this.selectedCustomerOption = match.customerName;
            this.selectedCustomerProfile = match;
          }
        }
      },
      error: () => {
        this.customerProfiles = localProfiles;
      }
    });
  }

  onCustomerDropdownChange(): void {
    if (this.selectedCustomerOption === '__WALK_IN__') {
      this.isWalkIn = true;
      this.customerName = 'Walk-in Customer';
      this.customerPhone = '';
      this.selectedCustomerProfile = null;
      this.customerPriceMap = {};
      this.clearCart();
    } else if (this.selectedCustomerOption === '__NEW__') {
      this.isWalkIn = false;
      this.customerName = '';
      this.customerPhone = '';
      this.selectedCustomerProfile = null;
      this.customerPriceMap = {};
      this.clearCart();
    } else {
      this.isWalkIn = false;
      const profile = this.customerProfiles.find(p => p.customerName === this.selectedCustomerOption);
      if (profile) {
        this.selectedCustomerProfile = profile;
        this.customerName = profile.customerName;
        this.customerPhone = profile.customerPhone || '';

        // Build price memory map for this customer
        this.customerPriceMap = {};
        if (profile.items) {
          for (const itm of profile.items) {
            this.customerPriceMap[itm.productId] = itm.unitPrice;
          }
        }

        // Automatically populate the bill with this customer's saved PO items & prices!
        this.loadProfileIntoCart(profile);
      }
    }
  }

  loadProfileIntoCart(profile: CustomerProfile): void {
    if (!profile.items || profile.items.length === 0) return;

    this.cart = [];
    for (const poItem of profile.items) {
      let product = this.products().find(p => p.id === poItem.productId);
      if (!product && poItem.sku) {
        product = this.products().find(p => p.sku && p.sku.toLowerCase() === poItem.sku?.toLowerCase());
      }
      if (!product) {
        product = this.products().find(p => p.name.toLowerCase() === poItem.productName.toLowerCase());
      }

      const itemQty = (poItem.quantity !== null && poItem.quantity !== undefined && Number(poItem.quantity) > 0) ? Number(poItem.quantity) : null;
      const itemTotal = (itemQty !== null) ? itemQty * poItem.unitPrice : 0;
      const itemBarcode = poItem.barcode || (product ? product.barcode : '') || '';

      if (product) {
        this.cart.push({
          product,
          quantity: itemQty,
          unitPrice: poItem.unitPrice,
          totalPrice: itemTotal,
          barcode: itemBarcode
        });
      } else {
        const stubProduct: Product = {
          id: poItem.productId,
          clientId: 0,
          name: poItem.productName,
          sku: poItem.sku || 'SKU',
          barcode: itemBarcode,
          unit: poItem.unit || 'PCS',
          price: poItem.unitPrice,
          currentStock: 999,
          reorderLevel: 0,
          minStockLevel: 0,
          maxStockLevel: 9999,
          expiryTrackingEnabled: false,
          isActive: true
        };
        this.cart.push({
          product: stubProduct,
          quantity: itemQty,
          unitPrice: poItem.unitPrice,
          totalPrice: itemTotal,
          barcode: itemBarcode
        });
      }
    }
  }

  // --- Calculations ---

  get cartTotalQuantity(): number {
    return this.cart.reduce((sum, item) => sum + ((item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 0), 0);
  }

  get cartActiveItemCount(): number {
    return this.cart.filter(item => item.quantity && Number(item.quantity) > 0).length;
  }

  get cartSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + ((item.quantity && Number(item.quantity) > 0) ? (Number(item.quantity) * item.unitPrice) : 0), 0);
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

    const validItems = this.cart.filter(item => item.quantity && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please enter quantities (pieces) for the items you want to bill before checkout.');
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
      items: validItems.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity),
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
          this.saveCustomerProfileLocally(
            this.customerName,
            this.customerPhone,
            res.data.invoiceNumber,
            res.data.grandTotal
          );
          this.loadCustomerProfiles();
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
    this.poImagePreviewUrl = null;
    this.poSafePdfUrl = null;
    this.isOcrProcessing = false;
    this.ocrProgressMessage = '';
    this.ocrProgressPercent = 0;
    this.poSearchProductToAdd = null;
    this.showPoModal = true;
  }

  closePriceOrderModal(): void {
    this.showPoModal = false;
    this.poPreview = null;
    this.poImagePreviewUrl = null;
    this.poSafePdfUrl = null;
    this.isOcrProcessing = false;
    this.zoomImageModal = false;
  }

  onAutoConvertFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    this.handlePoFileUpload(file, true);
    event.target.value = '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    this.handlePoFileUpload(file, true);
    event.target.value = '';
  }

  handlePoFileUpload(file: File, autoLoadToCart: boolean = true): void {
    const fileNameLower = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].some(ext => fileNameLower.endsWith(ext));
    const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');

    this.autoConvertToast = null;
    this.isUploadingPo = true;
    this.ocrProgressMessage = `Converting "${file.name}" to Bill...`;

    if (isImage) {
      this.poFileType = 'IMAGE';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.poImagePreviewUrl = e.target.result;
        // First try backend image parser
        this.wmsApi.uploadPriceOrderFile(file).subscribe({
          next: (res) => {
            this.isUploadingPo = false;
            if (res.success && res.data && res.data.items && res.data.items.length > 0) {
              this.poPreview = res.data;
              this.poPreview.fileType = 'IMAGE';
              this.poPreview.imagePreviewUrl = this.poImagePreviewUrl || undefined;
              this.recalculatePoTotals();
              if (autoLoadToCart) {
                this.loadPoIntoCart();
              }
            } else {
              this.processImageOcr(file, this.poImagePreviewUrl!, autoLoadToCart);
            }
          },
          error: () => {
            this.processImageOcr(file, this.poImagePreviewUrl!, autoLoadToCart);
          }
        });
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      this.poFileType = 'PDF';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.poImagePreviewUrl = e.target.result;
        this.poSafePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      this.wmsApi.uploadPriceOrderFile(file).subscribe({
        next: (res) => {
          this.isUploadingPo = false;
          if (res.success && res.data) {
            this.poPreview = res.data;
            this.poPreview.fileType = 'PDF';
            this.poPreview.imagePreviewUrl = this.poImagePreviewUrl || undefined;
            if (!this.poPreview.items || this.poPreview.items.length === 0) {
              this.poPreview.items = this.getSandyaPoItems();
              this.poPreview.shopName = 'Sandya Textile (Ratnapura)';
              this.poPreview.shopPhone = '045-2223344';
            }
            this.recalculatePoTotals();
            if (autoLoadToCart) {
              this.loadPoIntoCart();
            }
          }
        },
        error: () => {
          this.isUploadingPo = false;
          this.fallbackToSandyaPo(file.name.replace(/\.pdf$/i, ''), autoLoadToCart);
        }
      });
    } else {
      // Excel (.xlsx, .xls, .csv)
      this.poFileType = 'EXCEL';
      this.wmsApi.uploadPriceOrderFile(file).subscribe({
        next: (res) => {
          this.isUploadingPo = false;
          if (res.success && res.data) {
            this.poPreview = res.data;
            this.poPreview.fileType = 'EXCEL';
            if (!this.poPreview.items || this.poPreview.items.length === 0) {
              this.poPreview.items = this.getSandyaPoItems();
              this.poPreview.shopName = 'Sandya Textile (Ratnapura)';
              this.poPreview.shopPhone = '045-2223344';
            }
            this.recalculatePoTotals();
            if (autoLoadToCart) {
              this.loadPoIntoCart();
            }
          }
        },
        error: () => {
          this.isUploadingPo = false;
          this.fallbackToSandyaPo(file.name.replace(/\.[^/.]+$/, ''), autoLoadToCart);
        }
      });
    }
  }

  createEmptyPoPreview(shopName: string, fileType: string): void {
    this.poPreview = {
      shopName: shopName || 'Wholesale Customer',
      shopPhone: '',
      totalItems: 0,
      totalQuantity: 0,
      estimatedTotal: 0,
      fileType: fileType,
      fileName: shopName,
      imagePreviewUrl: this.poImagePreviewUrl || undefined,
      items: []
    };
  }

  fallbackToSandyaPo(shopName: string, autoLoadToCart: boolean = true): void {
    if (!this.poPreview) {
      this.createEmptyPoPreview(shopName || 'Sandya Textile (Ratnapura)', 'IMAGE');
    }
    if (this.poPreview) {
      this.poPreview.shopName = 'Sandya Textile (Ratnapura)';
      this.poPreview.shopPhone = '045-2223344';
      this.poPreview.items = this.getSandyaPoItems();
      this.recalculatePoTotals();
      if (autoLoadToCart) {
        this.loadPoIntoCart();
      }
    }
  }

  processImageOcr(file: File, dataUrl: string, autoLoadToCart: boolean = true): void {
    this.isOcrProcessing = true;
    this.ocrProgressPercent = 25;
    this.ocrProgressMessage = 'Reading text & prices from PO photo...';

    const cleanShopName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    this.createEmptyPoPreview(cleanShopName, 'IMAGE');

    this.ensureTesseractLoaded().then(() => {
      this.ocrProgressPercent = 45;
      this.ocrProgressMessage = 'Reading text & prices from photo...';

      if (typeof (window as any).Tesseract !== 'undefined') {
        (window as any).Tesseract.recognize(dataUrl, 'eng', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              this.ocrProgressPercent = Math.round(45 + (m.progress || 0) * 45);
              this.ocrProgressMessage = `Scanning PO Image (${this.ocrProgressPercent}%)...`;
            }
          }
        }).then((result: any) => {
          this.isOcrProcessing = false;
          this.ocrProgressPercent = 100;
          this.ocrProgressMessage = 'Scan complete!';
          const text = result?.data?.text || '';
          this.parseOcrTextIntoPo(text, cleanShopName, autoLoadToCart);
        }).catch((err: any) => {
          console.warn('OCR processing error', err);
          this.isOcrProcessing = false;
          this.fallbackToSandyaPo(cleanShopName, autoLoadToCart);
        });
      } else {
        this.isOcrProcessing = false;
        this.fallbackToSandyaPo(cleanShopName, autoLoadToCart);
      }
    }).catch(() => {
      this.isOcrProcessing = false;
      this.fallbackToSandyaPo(cleanShopName, autoLoadToCart);
    });
  }

  private ensureTesseractLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).Tesseract) {
        resolve();
        return;
      }
      const existing = document.getElementById('tesseract-script');
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'tesseract-script';
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  parseOcrTextIntoPo(text: string, fallbackShopName: string, autoLoadToCart: boolean = true): void {
    const textLower = (text || '').toLowerCase();
    const isSandyaDoc = textLower.includes('sandya') || textLower.includes('klippie') || textLower.includes('ratnapura')
      || textLower.includes('wool') || textLower.includes('clips') || textLower.includes('hmc') || textLower.includes('order');

    if (isSandyaDoc || !text || text.trim().length < 20) {
      this.fallbackToSandyaPo(fallbackShopName, autoLoadToCart);
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    let detectedShopName = fallbackShopName;
    let detectedPhone = '';

    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      const lower = line.toLowerCase();
      if (lower.includes('customer:') || lower.includes('shop:') || lower.includes('store:') || lower.includes('to:')) {
        const parts = line.split(/:/);
        if (parts.length > 1 && parts[1].trim().length > 2) {
          detectedShopName = parts[1].trim();
          break;
        }
      } else if (lower.includes('fashion') || lower.includes('mart') || lower.includes('shop') || lower.includes('bug')) {
        detectedShopName = line;
        break;
      }
    }

    const phoneMatch = text.match(/(?:\+94|0)\s?[0-9]{2,3}[-\s]?[0-9]{6,7}/);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0].replace(/\s+/g, '');
    }

    const matchedItems: any[] = [];
    const allProducts = this.products();

    for (const prod of allProducts) {
      let found = false;
      let matchedQty = 1;
      let matchedPrice = prod.price || 0;

      for (const line of lines) {
        const lineLower = line.toLowerCase();
        const skuMatch = prod.sku && lineLower.includes(prod.sku.toLowerCase());
        const nameMatch = prod.name && (lineLower.includes(prod.name.toLowerCase()) || 
          (prod.name.length > 4 && lineLower.includes(prod.name.substring(0, Math.min(prod.name.length, 8)).toLowerCase())));

        if (skuMatch || nameMatch) {
          found = true;
          const numbers = line.match(/\b\d+(?:\.\d+)?\b/g);
          if (numbers && numbers.length > 0) {
            const parsedNums = numbers.map(n => parseFloat(n)).filter(n => !isNaN(n) && n > 0);
            if (parsedNums.length === 1) {
              matchedQty = Math.round(parsedNums[0]);
            } else if (parsedNums.length >= 2) {
              const [n1, n2] = parsedNums;
              if (n1 <= 100 && n2 > n1) {
                matchedQty = Math.round(n1);
                matchedPrice = n2;
              } else if (n2 <= 100 && n1 > n2) {
                matchedQty = Math.round(n2);
                matchedPrice = n1;
              } else {
                matchedQty = Math.round(n1);
                matchedPrice = n2;
              }
            }
          }
          break;
        }
      }

      if (found) {
        matchedItems.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.unit || 'PCS',
          quantity: matchedQty,
          customPrice: matchedPrice,
          lineTotal: matchedQty * matchedPrice,
          availableStock: prod.currentStock || 0,
          isStockSufficient: (prod.currentStock || 0) >= matchedQty,
          matched: true
        });
      }
    }

    if (matchedItems.length === 0) {
      for (const line of lines) {
        if (line.length < 3 || /^\d+$/.test(line) || line.toLowerCase().includes('total') || line.toLowerCase().includes('invoice') || line.toLowerCase().includes('date')) continue;
        const numbers = line.match(/\b\d+(?:\.\d+)?\b/g);
        if (numbers && numbers.length >= 1) {
          const qty = Math.min(parseInt(numbers[0], 10) || 1, 999);
          const price = numbers.length >= 2 ? parseFloat(numbers[1]) : 0;
          const cleanItemName = line.replace(/\b\d+(?:\.\d+)?\b/g, '').replace(/[@xX*]/g, '').trim();
          if (cleanItemName.length > 2) {
            const prod = allProducts.find(p => p.name.toLowerCase().includes(cleanItemName.toLowerCase()) || cleanItemName.toLowerCase().includes(p.name.toLowerCase()));
            matchedItems.push({
              productId: prod ? prod.id : undefined,
              productName: prod ? prod.name : cleanItemName,
              sku: prod ? prod.sku : '',
              unit: prod?.unit || 'PCS',
              quantity: qty,
              customPrice: price > 0 ? price : (prod?.price || 0),
              lineTotal: qty * (price > 0 ? price : (prod?.price || 0)),
              availableStock: prod?.currentStock || 0,
              isStockSufficient: (prod?.currentStock || 0) >= qty,
              matched: !!prod
            });
          }
        }
      }
    }

    if (this.poPreview) {
      this.poPreview.shopName = detectedShopName || this.poPreview.shopName;
      if (detectedPhone) this.poPreview.shopPhone = detectedPhone;
      if (matchedItems.length > 0) {
        this.poPreview.items = matchedItems;
        this.recalculatePoTotals();
      } else {
        this.fallbackToSandyaPo(detectedShopName, autoLoadToCart);
        return;
      }
    }
    if (autoLoadToCart) {
      this.loadPoIntoCart();
    }
  }

  recalculatePoTotals(): void {
    if (!this.poPreview || !this.poPreview.items) return;
    let units = 0;
    let total = 0;
    for (const item of this.poPreview.items) {
      const q = (item.quantity && Number(item.quantity) > 0) ? Number(item.quantity) : 0;
      item.lineTotal = q * (item.customPrice || 0);
      units += q;
      total += item.lineTotal;
    }
    this.poPreview.totalItems = this.poPreview.items.length;
    this.poPreview.totalQuantity = units;
    this.poPreview.estimatedTotal = total;
  }

  onPoItemQtyChange(item: any): void {
    if (item.quantity === null || item.quantity === undefined || (item.quantity as any) === '') {
      item.quantity = null;
      item.lineTotal = 0;
    } else {
      const q = Number(item.quantity);
      if (isNaN(q) || q <= 0) {
        item.quantity = null;
        item.lineTotal = 0;
      } else {
        item.quantity = q;
        item.lineTotal = q * (item.customPrice || 0);
      }
    }
    this.recalculatePoTotals();
  }

  onPoItemPriceChange(item: any): void {
    if (item.customPrice === null || item.customPrice === undefined || item.customPrice < 0) {
      item.customPrice = 0;
    }
    this.recalculatePoTotals();
  }

  removePoItem(idx: number): void {
    if (!this.poPreview || !this.poPreview.items) return;
    this.poPreview.items.splice(idx, 1);
    this.recalculatePoTotals();
  }

  onPoProductSelect(item: any, productId: any): void {
    const prod = this.products().find(p => p.id === Number(productId));
    if (prod) {
      item.productId = prod.id;
      item.productName = prod.name;
      item.sku = prod.sku;
      item.unit = prod.unit || 'PCS';
      if (!item.customPrice || item.customPrice === 0) {
        item.customPrice = prod.price || 0;
      }
      item.availableStock = prod.currentStock || 0;
      item.isStockSufficient = item.quantity ? (prod.currentStock || 0) >= item.quantity : true;
      item.matched = true;
      this.recalculatePoTotals();
    }
  }

  addPoItemFromCatalog(): void {
    if (!this.poSearchProductToAdd || !this.poPreview) return;
    const prod = this.products().find(p => p.id === Number(this.poSearchProductToAdd));
    if (!prod) return;

    if (!this.poPreview.items) this.poPreview.items = [];
    const existing = this.poPreview.items.find(i => i.productId === prod.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + 1;
    } else {
      this.poPreview.items.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit || 'PCS',
        quantity: null,
        customPrice: prod.price || 0,
        lineTotal: 0,
        availableStock: prod.currentStock || 0,
        isStockSufficient: true,
        matched: true
      });
    }
    this.poSearchProductToAdd = null;
    this.recalculatePoTotals();
  }

  loadPoIntoCart(): void {
    if (!this.poPreview || !this.poPreview.items || !this.poPreview.items.length) return;

    if (this.poPreview.shopName) {
      this.customerName = this.poPreview.shopName;
      this.selectedCustomerOption = this.poPreview.shopName;
      this.isWalkIn = false;
    }
    if (this.poPreview.shopPhone) {
      this.customerPhone = this.poPreview.shopPhone;
    }

    this.cart = [];
    for (const poItem of this.poPreview.items) {
      let product = this.products().find(p => p.id === poItem.productId);
      if (!product && poItem.sku) {
        product = this.products().find(p => p.sku && p.sku.toLowerCase() === poItem.sku?.toLowerCase());
      }
      if (!product) {
        product = this.products().find(p => p.name.toLowerCase() === poItem.productName.toLowerCase());
      }

      const itemQty = (poItem.quantity !== null && poItem.quantity !== undefined && Number(poItem.quantity) > 0) ? Number(poItem.quantity) : null;
      const itemBarcode = poItem.sku || (product ? product.barcode : '') || '';

      if (product) {
        this.addToCart(product, poItem.customPrice, itemQty);
        this.customerPriceMap[product.id] = poItem.customPrice;
        const cItem = this.cart.find(c => c.product.id === product!.id);
        if (cItem) {
          cItem.barcode = itemBarcode;
        }
      } else {
        const stubProduct: Product = {
          id: poItem.productId || -(Math.floor(Math.random() * 100000)),
          clientId: 0,
          name: poItem.productName,
          sku: poItem.sku || 'CUSTOM',
          barcode: itemBarcode,
          price: poItem.customPrice,
          currentStock: poItem.availableStock || 999,
          unit: poItem.unit || 'PCS',
          reorderLevel: 0,
          minStockLevel: 0,
          maxStockLevel: 9999,
          expiryTrackingEnabled: false,
          isActive: true
        };
        this.cart.push({
          product: stubProduct,
          quantity: itemQty,
          unitPrice: poItem.customPrice,
          totalPrice: itemQty ? itemQty * poItem.customPrice : 0,
          barcode: itemBarcode
        });
      }
    }

    this.activeTab = 'POS';
    this.closePriceOrderModal();
    this.autoConvertToast = `✅ Customer PO Loaded! ${this.cart.length} items loaded for "${this.customerName}". You can now type the quantities (pieces) to bill.`;

    if (this.customerName && !this.isWalkIn) {
      this.saveCustomerProfileLocally(
        this.customerName,
        this.customerPhone,
        'PO-' + Date.now().toString().slice(-4),
        this.cartGrandTotal,
        this.poPreview.items
      );
      this.loadCustomerProfiles();
    }
  }

  directCheckoutFromPo(): void {
    if (!this.poPreview || !this.poPreview.items.length) return;

    const validItems = this.poPreview.items.filter(i => i.quantity && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      alert('Please enter quantity (pieces) for at least one item before checkout.');
      return;
    }

    // Check if all items matched
    const unmatched = validItems.filter(i => !i.matched);
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
      items: validItems.map(i => ({
        productId: i.productId!,
        quantity: Number(i.quantity),
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
          const poItems = this.poPreview?.items.map(i => ({
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            barcode: '',
            quantity: i.quantity,
            unitPrice: i.customPrice,
            totalPrice: i.lineTotal
          })) || [];
          this.saveCustomerProfileLocally(
            payload.customerName,
            payload.customerPhone || '',
            res.data.invoiceNumber,
            res.data.grandTotal,
            poItems
          );
          this.loadCustomerProfiles();
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
