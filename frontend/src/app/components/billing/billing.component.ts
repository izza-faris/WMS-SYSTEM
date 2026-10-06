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
          <!-- View Toggle: POS Counter | Customer POs | Invoices History -->
          <div class="btn-group btn-group-sm bg-dark p-0.5 rounded-2 border border-secondary border-opacity-25">
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-success]="activeTab === 'POS'"
                    [class.text-secondary]="activeTab !== 'POS'"
                    (click)="activeTab = 'POS'">
              <i class="bi bi-cart3 me-1"></i> POS Counter
            </button>
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-warning]="activeTab === 'CUSTOMER_POS'"
                    [class.text-secondary]="activeTab !== 'CUSTOMER_POS'"
                    (click)="switchToCustomerPOs()">
              <i class="bi bi-person-lines-fill me-1"></i> Customer POs / வாடிக்கையாளர் PO ({{ customerProfiles.length }})
            </button>
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-primary]="activeTab === 'HISTORY'"
                    [class.text-secondary]="activeTab !== 'HISTORY'"
                    (click)="switchToHistory()">
              <i class="bi bi-clock-history me-1"></i> Invoices History ({{ invoices().length }})
            </button>
          </div>

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
                <h6 class="text-secondary fw-semibold">No products in your catalog</h6>
                <p class="small text-muted mb-3">Add items in Products &amp; Catalog to start billing for this business.</p>
                <a routerLink="/app/products" class="btn btn-outline-success btn-sm">
                  <i class="bi bi-plus-circle me-1"></i> Add Products to Catalog
                </a>
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
                  <div class="d-flex align-items-center justify-content-between mb-0.5">
                    <label class="text-secondary text-xs d-block mb-0">Shop / Customer Name *</label>
                    <span *ngIf="selectedCustomerProfile" class="badge bg-warning bg-opacity-25 text-warning text-xs py-0 px-1 font-monospace">
                      PO Loaded ({{ cart.length }})
                    </span>
                  </div>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerName"
                         (input)="onCustomerNameInput()"
                         list="customerListSuggestions"
                         placeholder="Type customer name to auto-load PO...">
                  <datalist id="customerListSuggestions">
                    <option *ngFor="let p of customerProfiles" [value]="p.customerName">{{ p.customerPhone ? '(' + p.customerPhone + ')' : '' }}</option>
                  </datalist>
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
      <!-- VIEW 3: CUSTOMER PURCHASE ORDERS (PO) MANAGER                 -->
      <!-- ============================================================= -->
      <div *ngIf="activeTab === 'CUSTOMER_POS'" class="animate__animated animate__fadeIn no-print">
        <div class="row g-3">
          <!-- LEFT COLUMN: Saved Customers List & Search (4 cols) -->
          <div class="col-lg-4">
            <div class="glass-panel p-3 h-100 d-flex flex-column">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 class="fw-bold text-light mb-0">
                    <i class="bi bi-people-fill text-warning me-1.5"></i>Saved Customer POs
                  </h6>
                  <small class="text-secondary text-xs">Manage agreed items & wholesale rates</small>
                </div>
                <button type="button" (click)="startNewCustomerPO()" class="btn btn-warning btn-sm fw-bold px-2 py-1 text-xs">
                  <i class="bi bi-plus-lg me-1"></i>New Customer PO
                </button>
              </div>

              <!-- Search Input -->
              <div class="input-group input-group-sm mb-3">
                <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control bg-dark text-light border-secondary" [(ngModel)]="customerSearchQuery" placeholder="Search customer / shop name...">
                <button *ngIf="customerSearchQuery" (click)="customerSearchQuery = ''" class="btn btn-outline-secondary"><i class="bi bi-x"></i></button>
              </div>

              <!-- Customer Profiles Cards List -->
              <div class="flex-grow-1 overflow-y-auto pe-1" style="max-height: 640px;">
                <div *ngIf="filteredCustomerProfiles.length === 0" class="text-center py-5 text-muted small">
                  <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  <span>No customer POs found.</span>
                  <div class="mt-2">
                    <button type="button" (click)="startNewCustomerPO()" class="btn btn-outline-warning btn-xs">
                      + Create First Customer PO
                    </button>
                  </div>
                </div>

                <div *ngFor="let prof of filteredCustomerProfiles" 
                     (click)="selectCustomerForEdit(prof)"
                     class="p-2.5 mb-2 rounded-3 border transition-all cursor-pointer"
                     [ngClass]="editingCustomerPO.customerName.toLowerCase() === prof.customerName.toLowerCase() ? 'bg-warning bg-opacity-15 border-warning shadow-sm' : 'bg-dark bg-opacity-40 border-secondary border-opacity-25 hover-border-secondary'">
                  <div class="d-flex align-items-start justify-content-between gap-1 mb-1">
                    <strong class="text-light text-truncate" style="font-size: 0.92rem;">
                      <i class="bi bi-shop me-1 text-warning"></i>{{ prof.customerName }}
                    </strong>
                    <span class="badge bg-warning bg-opacity-25 text-warning font-monospace text-xs flex-shrink-0">
                      {{ prof.items?.length || 0 }} Items
                    </span>
                  </div>
                  <div class="d-flex align-items-center justify-content-between text-xs text-secondary mt-1">
                    <span *ngIf="prof.customerPhone"><i class="bi bi-telephone me-1"></i>{{ prof.customerPhone }}</span>
                    <span *ngIf="!prof.customerPhone" class="fst-italic opacity-75">No phone</span>
                    <span class="text-success fw-bold font-monospace">{{ defaultCurrency }} {{ (prof.grandTotal || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="d-flex align-items-center justify-content-between mt-2 pt-1.5 border-top border-secondary border-opacity-15">
                    <button type="button" (click)="$event.stopPropagation(); loadSpecificPOIntoBill(prof)" class="btn btn-link btn-xs text-success text-decoration-none p-0 fw-semibold" title="Load this PO into POS Counter bill">
                      <i class="bi bi-cart-plus-fill me-1"></i>Load into Bill
                    </button>
                    <button type="button" (click)="$event.stopPropagation(); deleteCustomerProfile(prof)" class="btn btn-link btn-xs text-danger text-decoration-none p-0" title="Delete this customer profile">
                      <i class="bi bi-trash3"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Customer PO Sheet Editor (8 cols) -->
          <div class="col-lg-8">
            <div class="glass-panel p-3 p-md-4 h-100 d-flex flex-column">
              <!-- Header & Quick Actions -->
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-3 border-bottom border-secondary border-opacity-20">
                <div>
                  <h5 class="fw-bold text-light mb-1">
                    <i class="bi bi-receipt text-warning me-2"></i>
                    {{ isCreatingNewPO ? 'Create Customer Purchase Order (புதிய வாடிக்கையாளர் PO)' : 'Edit Customer PO: ' + editingCustomerPO.customerName }}
                  </h5>
                  <p class="text-secondary small mb-0">
                    Configure agreed items, barcode numbers, customer prices and quantities for this customer.
                  </p>
                </div>

                <div class="d-flex align-items-center gap-2">
                  <span *ngIf="poSaveMessage" class="badge bg-success bg-opacity-25 text-success py-1.5 px-2 animate__animated animate__fadeIn">
                    <i class="bi bi-check-circle-fill me-1"></i>{{ poSaveMessage }}
                  </span>
                  <button type="button" (click)="saveCurrentCustomerPO()" class="btn btn-glow-primary btn-sm px-3 fw-bold">
                    <i class="bi bi-floppy-fill me-1"></i>Save Customer PO
                  </button>
                  <button type="button" (click)="loadCurrentPOIntoBill()" class="btn btn-success btn-sm px-3 fw-bold shadow">
                    <i class="bi bi-cart-check-fill me-1"></i>Save & Open in Bill
                  </button>
                </div>
              </div>

              <!-- Customer Info Row -->
              <div class="row g-2 mb-3 p-2.5 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-30">
                <div class="col-md-7">
                  <label class="form-label text-secondary small fw-semibold mb-1">Customer / Shop Name * (வாடிக்கையாளர் பெயர்)</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-warning border-warning border-opacity-40 fw-bold"
                         [(ngModel)]="editingCustomerPO.customerName"
                         placeholder="e.g. Kumar Store / City Super / Fashion Bug">
                </div>
                <div class="col-md-5">
                  <label class="form-label text-secondary small fw-semibold mb-1">Phone / Mobile (தொலைபேசி எண்)</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="editingCustomerPO.customerPhone"
                         placeholder="e.g. 0771234567">
                </div>
              </div>

              <!-- Quick Add From Catalog Row -->
              <div class="p-2 mb-3 rounded-2 bg-dark border border-secondary border-opacity-20 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div class="d-flex align-items-center gap-2 flex-grow-1" style="max-width: 480px;">
                  <span class="text-secondary small fw-semibold text-nowrap"><i class="bi bi-plus-circle text-info me-1"></i>Quick Add from Catalog:</span>
                  <select class="form-select form-select-sm bg-dark text-light border-secondary" #quickProdSelect (change)="addCatalogProductToPO(quickProdSelect.value); quickProdSelect.value = ''">
                    <option value="">-- Choose Product to Add to PO --</option>
                    <option *ngFor="let p of products()" [value]="p.id">
                      {{ p.name }} &bull; SKU: {{ p.sku }} &bull; (Price: {{ p.currency || defaultCurrency }} {{ p.price }})
                    </option>
                  </select>
                </div>
                <button type="button" (click)="addPORow()" class="btn btn-outline-warning btn-sm px-2.5 fw-semibold">
                  <i class="bi bi-plus-lg me-1"></i>+ Add Empty Row
                </button>
              </div>

              <!-- PO Items Table with exact requested columns: Barcode Num, Product Name, Cost/Price, Qty, Total -->
              <div class="table-responsive flex-grow-1 border border-secondary border-opacity-20 rounded-3 mb-3 bg-dark bg-opacity-30">
                <table class="table table-dark table-hover table-sm align-middle mb-0" style="font-size: 0.84rem;">
                  <thead class="text-secondary text-uppercase text-xs" style="background: rgba(15, 23, 42, 0.85);">
                    <tr>
                      <th style="width: 32px;" class="text-center">#</th>
                      <th style="width: 175px;">Barcode Number (பார்கோடு)</th>
                      <th>Product Name (பொருள் பெயர்)</th>
                      <th style="width: 75px;" class="text-center">Unit</th>
                      <th style="width: 130px;" class="text-end">Agreed Price / Cost (விலை) *</th>
                      <th style="width: 90px;" class="text-center">Default Qty (அளவு)</th>
                      <th style="width: 110px;" class="text-end">Line Total (மொத்தம்)</th>
                      <th style="width: 42px;" class="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of editingCustomerPO.items; let idx = index" class="border-secondary border-opacity-15">
                      <td class="text-center text-muted font-monospace text-xs">{{ idx + 1 }}</td>
                      <td>
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark border-secondary p-1 text-secondary"><i class="bi bi-upc"></i></span>
                          <input type="text" class="form-control form-control-sm bg-dark text-info font-monospace border-secondary p-1"
                                 [(ngModel)]="row.barcode"
                                 placeholder="Barcode / SKU">
                        </div>
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary p-1 fw-semibold"
                               [(ngModel)]="row.productName"
                               placeholder="Type or select product name"
                               [attr.list]="'poCatalogList_' + idx"
                               (change)="onPOProductNameChange(row)">
                        <datalist [id]="'poCatalogList_' + idx">
                          <option *ngFor="let p of products()" [value]="p.name">{{ p.sku }} &bull; {{ defaultCurrency }} {{ p.price }}</option>
                        </datalist>
                      </td>
                      <td class="text-center">
                        <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary text-center p-1 text-xs"
                               [(ngModel)]="row.unit"
                               placeholder="PCS"
                               style="width: 60px; margin: 0 auto;">
                      </td>
                      <td>
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-dark border-secondary p-1 text-secondary text-xs">{{ defaultCurrency }}</span>
                          <input type="number" step="0.5" min="0"
                                 class="form-control form-control-sm bg-dark text-warning fw-bold text-end border-secondary p-1"
                                 [(ngModel)]="row.unitPrice"
                                 (ngModelChange)="onPORowChange(row)"
                                 placeholder="0.00">
                        </div>
                      </td>
                      <td>
                        <input type="number" step="any" min="0"
                               class="form-control form-control-sm bg-dark text-light fw-bold text-center border-secondary p-1"
                               [(ngModel)]="row.quantity"
                               (ngModelChange)="onPORowChange(row)"
                               placeholder="1">
                      </td>
                      <td class="text-end font-monospace text-success fw-bold">
                        {{ defaultCurrency }} {{ (row.lineTotal || 0) | number:'1.2-2' }}
                      </td>
                      <td class="text-center">
                        <button type="button" (click)="removePORow(idx)" class="btn btn-link btn-xs text-danger p-0" title="Delete row">
                          <i class="bi bi-trash3 fs-6"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- PO Footer Summary Banner -->
              <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-30 d-flex flex-wrap align-items-center justify-content-between gap-2 mt-auto">
                <div class="d-flex align-items-center gap-2">
                  <button type="button" (click)="addPORow()" class="btn btn-outline-secondary btn-sm px-2.5">
                    <i class="bi bi-plus-lg me-1"></i>+ Add Row
                  </button>
                  <span class="text-secondary small ms-2">
                    Active Items: <strong class="text-light">{{ editingPOTotalItemsCount }}</strong>
                  </span>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <div class="text-end">
                    <small class="text-secondary text-xs d-block">Estimated PO Total:</small>
                    <span class="fs-5 fw-bold text-success font-monospace">
                      {{ defaultCurrency }} {{ editingPOTotalAmount | number:'1.2-2' }}
                    </span>
                  </div>
                  <button type="button" (click)="saveCurrentCustomerPO()" class="btn btn-glow-primary btn-sm px-3 fw-bold">
                    <i class="bi bi-floppy-fill me-1"></i>Save Customer PO
                  </button>
                  <button type="button" (click)="loadCurrentPOIntoBill()" class="btn btn-success btn-sm px-3 fw-bold shadow">
                    <i class="bi bi-cart-check-fill me-1"></i>Open in Bill
                  </button>
                </div>
              </div>
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
  activeTab: 'POS' | 'CUSTOMER_POS' | 'HISTORY' = 'POS';
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
  isWalkIn = true;
  customerName = 'Walk-in Customer';
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

  // Customer PO Manager State
  customerSearchQuery: string = '';
  editingCustomerPO = {
    customerName: '',
    customerPhone: '',
    items: [
      {
        productId: undefined as number | undefined,
        productName: '',
        sku: '',
        barcode: '',
        unit: 'PCS',
        unitPrice: 0,
        quantity: 1,
        lineTotal: 0
      }
    ]
  };
  isCreatingNewPO: boolean = false;
  poSaveMessage: string = '';

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
    // Clear legacy un-scoped customer PO cache so data never bleeds across tenants
    try {
      localStorage.removeItem('wms_saved_customer_pos');
    } catch (e) {}

    // Reset cart and selection to prevent any carry-over across user sessions
    this.cart = [];
    this.selectedCustomerOption = '__WALK_IN__';
    this.customerName = 'Walk-in Customer';
    this.customerPhone = '';
    this.isWalkIn = true;
    this.selectedCustomerProfile = null;
    this.customerPriceMap = {};

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
    this.wmsApi.getAllProductsList().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.products.set(res.data);
          const savedCurrency = localStorage.getItem('wms_billing_currency');
          if (savedCurrency) {
            this.defaultCurrency = savedCurrency;
          } else if (res.data[0].currency) {
            this.defaultCurrency = res.data[0].currency;
          }
        } else {
          this.products.set([]);
        }
      },
      error: () => {
        this.products.set([]);
      }
    });
  }

  loadDefaultCatalogProducts(): void {
    // Strictly tenant-isolated: do not inject any other customer's products
    this.products.set([]);
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

  switchToCustomerPOs(): void {
    this.activeTab = 'CUSTOMER_POS';
    this.loadCustomerProfiles();
    if (this.customerProfiles.length > 0 && !this.editingCustomerPO.customerName) {
      this.selectCustomerForEdit(this.customerProfiles[0]);
    }
  }

  get filteredCustomerProfiles(): CustomerProfile[] {
    if (!this.customerSearchQuery || !this.customerSearchQuery.trim()) {
      return this.customerProfiles;
    }
    const q = this.customerSearchQuery.toLowerCase().trim();
    return this.customerProfiles.filter(p =>
      p.customerName.toLowerCase().includes(q) ||
      (p.customerPhone && p.customerPhone.toLowerCase().includes(q))
    );
  }

  get editingPOTotalItemsCount(): number {
    return (this.editingCustomerPO?.items || []).filter(i => (i.productName && i.productName.trim()) || (i.barcode && i.barcode.trim())).length;
  }

  get editingPOTotalAmount(): number {
    return (this.editingCustomerPO?.items || []).reduce((acc, row) => acc + (row.lineTotal || 0), 0);
  }

  selectCustomerForEdit(profile: CustomerProfile): void {
    this.isCreatingNewPO = false;
    this.poSaveMessage = '';
    const items = (profile.items && profile.items.length > 0)
      ? profile.items.map(item => ({
          productId: item.productId,
          productName: item.productName || '',
          sku: item.sku || '',
          barcode: item.barcode || '',
          unit: item.unit || 'PCS',
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity !== null && item.quantity !== undefined ? item.quantity : 1,
          lineTotal: ((item.quantity !== null && item.quantity !== undefined ? item.quantity : 1) * (item.unitPrice || 0))
        }))
      : [
          {
            productId: undefined as number | undefined,
            productName: '',
            sku: '',
            barcode: '',
            unit: 'PCS',
            unitPrice: 0,
            quantity: 1,
            lineTotal: 0
          }
        ];

    this.editingCustomerPO = {
      customerName: profile.customerName,
      customerPhone: profile.customerPhone || '',
      items
    };
  }

  startNewCustomerPO(): void {
    this.isCreatingNewPO = true;
    this.poSaveMessage = '';
    this.editingCustomerPO = {
      customerName: '',
      customerPhone: '',
      items: [
        {
          productId: undefined as number | undefined,
          productName: '',
          sku: '',
          barcode: '',
          unit: 'PCS',
          unitPrice: 0,
          quantity: 1,
          lineTotal: 0
        }
      ]
    };
  }

  addPORow(): void {
    this.editingCustomerPO.items.push({
      productId: undefined,
      productName: '',
      sku: '',
      barcode: '',
      unit: 'PCS',
      unitPrice: 0,
      quantity: 1,
      lineTotal: 0
    });
  }

  removePORow(index: number): void {
    if (this.editingCustomerPO.items.length > 1) {
      this.editingCustomerPO.items.splice(index, 1);
    } else {
      this.editingCustomerPO.items = [{
        productId: undefined,
        productName: '',
        sku: '',
        barcode: '',
        unit: 'PCS',
        unitPrice: 0,
        quantity: 1,
        lineTotal: 0
      }];
    }
  }

  addCatalogProductToPO(prodIdStr: any): void {
    if (!prodIdStr) return;
    const prodId = Number(prodIdStr);
    const prod = this.products().find(p => p.id === prodId);
    if (!prod) return;

    const items = this.editingCustomerPO.items;
    const lastRow = items.length > 0 ? items[items.length - 1] : null;
    const isEmpty = lastRow && !lastRow.productName && !lastRow.barcode && (!lastRow.unitPrice || lastRow.unitPrice === 0);

    const newRow = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku || '',
      barcode: prod.barcode || prod.sku || '',
      unit: prod.unit || 'PCS',
      unitPrice: prod.price || 0,
      quantity: 1,
      lineTotal: prod.price || 0
    };

    if (isEmpty && lastRow) {
      items[items.length - 1] = newRow;
    } else {
      items.push(newRow);
    }
  }

  onPOProductNameChange(row: any): void {
    if (!row.productName) return;
    const prod = this.products().find(p => p.name.toLowerCase() === row.productName.toLowerCase());
    if (prod) {
      row.productId = prod.id;
      row.sku = prod.sku;
      if (!row.barcode) row.barcode = prod.barcode || prod.sku || '';
      if (!row.unitPrice || row.unitPrice === 0) row.unitPrice = prod.price || 0;
      if (!row.unit) row.unit = prod.unit || 'PCS';
    }
    this.onPORowChange(row);
  }

  onPORowChange(row: any): void {
    const qty = (row.quantity !== null && row.quantity !== undefined) ? Number(row.quantity) : 0;
    const price = (row.unitPrice !== null && row.unitPrice !== undefined) ? Number(row.unitPrice) : 0;
    row.lineTotal = qty * price;
  }

  saveCurrentCustomerPO(): void {
    const name = this.editingCustomerPO.customerName ? this.editingCustomerPO.customerName.trim() : '';
    if (!name) {
      alert('Please enter a Customer / Shop Name to save the PO.');
      return;
    }

    const validItems = this.editingCustomerPO.items
      .filter(i => (i.productName && i.productName.trim()) || (i.barcode && i.barcode.trim()))
      .map(i => ({
        productId: i.productId || -(Math.floor(Math.random() * 100000)),
        productName: i.productName.trim() || 'Product',
        sku: i.sku || i.barcode || 'PO-ITEM',
        barcode: i.barcode ? i.barcode.trim() : '',
        unit: i.unit || 'PCS',
        quantity: i.quantity !== null && i.quantity !== undefined ? Number(i.quantity) : 1,
        unitPrice: Number(i.unitPrice) || 0,
        lineTotal: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0)
      }));

    if (validItems.length === 0) {
      alert('Please add at least one product with name or barcode to save the PO.');
      return;
    }

    const grandTotal = validItems.reduce((acc, r) => acc + r.lineTotal, 0);

    this.saveCustomerProfileLocally(
      name,
      this.editingCustomerPO.customerPhone ? this.editingCustomerPO.customerPhone.trim() : '',
      'PO-' + Date.now().toString().slice(-4),
      grandTotal,
      validItems
    );

    this.loadCustomerProfiles();
    this.isCreatingNewPO = false;
    this.poSaveMessage = `Saved PO for ${name}!`;
    setTimeout(() => {
      this.poSaveMessage = '';
    }, 4000);
  }

  loadCurrentPOIntoBill(): void {
    this.saveCurrentCustomerPO();
    const prof = this.customerProfiles.find(p => p.customerName.toLowerCase() === this.editingCustomerPO.customerName.trim().toLowerCase());
    if (prof) {
      this.loadSpecificPOIntoBill(prof);
    }
  }

  loadSpecificPOIntoBill(profile: CustomerProfile): void {
    this.selectedCustomerOption = profile.customerName;
    this.customerName = profile.customerName;
    this.customerPhone = profile.customerPhone || '';
    this.isWalkIn = false;
    this.selectedCustomerProfile = profile;

    // Price memory map
    this.customerPriceMap = {};
    if (profile.items) {
      for (const itm of profile.items) {
        if (itm.productId) {
          this.customerPriceMap[itm.productId] = itm.unitPrice;
        }
      }
    }

    this.loadProfileIntoCart(profile);
    this.activeTab = 'POS';
    this.autoConvertToast = `✅ Loaded Purchase Order for "${profile.customerName}"! (${this.cart.length} items ready in bill)`;
    setTimeout(() => {
      this.autoConvertToast = null;
    }, 5000);
  }

  deleteCustomerProfile(profile: CustomerProfile): void {
    if (!confirm(`Are you sure you want to delete the saved PO profile for "${profile.customerName}"?`)) {
      return;
    }
    try {
      const list = this.getLocalProfiles().filter(p => p.customerName.toLowerCase() !== profile.customerName.toLowerCase());
      localStorage.setItem(this.getCustomerProfilesStorageKey(), JSON.stringify(list));
      this.loadCustomerProfiles();
      if (this.editingCustomerPO.customerName.toLowerCase() === profile.customerName.toLowerCase()) {
        if (this.customerProfiles.length > 0) {
          this.selectCustomerForEdit(this.customerProfiles[0]);
        } else {
          this.startNewCustomerPO();
        }
      }
    } catch (e) {
      console.warn('Failed to delete customer profile', e);
    }
  }

  onCustomerNameInput(): void {
    if (!this.customerName || !this.customerName.trim()) return;
    const cleanName = this.customerName.trim().toLowerCase();
    const match = this.customerProfiles.find(p => p.customerName.toLowerCase() === cleanName);
    if (match) {
      // User typed or selected an existing customer! Automatically populate the bill cart!
      this.selectedCustomerOption = match.customerName;
      this.customerPhone = match.customerPhone || this.customerPhone;
      this.isWalkIn = false;
      this.selectedCustomerProfile = match;

      // Map prices
      this.customerPriceMap = {};
      if (match.items) {
        for (const itm of match.items) {
          if (itm.productId) {
            this.customerPriceMap[itm.productId] = itm.unitPrice;
          }
        }
      }

      this.loadProfileIntoCart(match);
      this.autoConvertToast = `✅ Customer "${match.customerName}" matched! ${this.cart.length} items auto-populated in bill.`;
      setTimeout(() => {
        this.autoConvertToast = null;
      }, 4000);
    }
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

  private getCustomerProfilesStorageKey(): string {
    const user = this.currentUser();
    const identifier = user?.clientId || user?.email || 'default';
    return `wms_saved_customer_pos_${identifier}`;
  }

  private getLocalProfiles(): CustomerProfile[] {
    try {
      const data = localStorage.getItem(this.getCustomerProfilesStorageKey());
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read local customer profiles', e);
    }
    return [];
  }

  private saveCustomerProfileLocally(
    name: string,
    phone: string,
    invoiceNumber?: string,
    grandTotal?: number,
    customItems?: any[]
  ): void {
    if (!name || name.trim() === 'Walk-in Customer') return;
    if (!customItems && this.isWalkIn) return;
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
      localStorage.setItem(this.getCustomerProfilesStorageKey(), JSON.stringify(list));
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
        productName: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit || 'PCS',
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice,
        barcode: item.barcode ? item.barcode.trim() : (item.product.barcode ? item.product.barcode.trim() : undefined)
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
    const cleanShopName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    this.autoConvertToast = null;
    this.isUploadingPo = true;
    this.ocrProgressMessage = `Converting "${file.name}" to Bill...`;

    if (isImage) {
      this.poFileType = 'IMAGE';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.poImagePreviewUrl = e.target.result;
        this.createEmptyPoPreview(cleanShopName, 'IMAGE');
        this.processImageOcr(file, this.poImagePreviewUrl!, autoLoadToCart);
      };
      reader.readAsDataURL(file);
    } else if (isPdf) {
      this.poFileType = 'PDF';
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.poImagePreviewUrl = e.target.result;
        this.poSafePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(e.target.result);
        this.createEmptyPoPreview(cleanShopName, 'PDF');

        this.wmsApi.uploadPriceOrderFile(file).subscribe({
          next: (res) => {
            this.isUploadingPo = false;
            if (res.success && res.data) {
              this.poPreview = res.data;
              this.poPreview.fileType = 'PDF';
              this.poPreview.imagePreviewUrl = this.poImagePreviewUrl || undefined;
              this.recalculatePoTotals();
              if (res.data.items && res.data.items.length > 0) {
                if (autoLoadToCart) {
                  this.loadPoIntoCart();
                }
              } else {
                this.openPriceOrderModal();
              }
            }
          },
          error: () => {
            this.isUploadingPo = false;
            this.openPriceOrderModal();
          }
        });
      };
      reader.readAsDataURL(file);
    } else {
      // Excel (.xlsx, .xls, .csv)
      this.poFileType = 'EXCEL';
      this.createEmptyPoPreview(cleanShopName, 'EXCEL');

      this.wmsApi.uploadPriceOrderFile(file).subscribe({
        next: (res) => {
          this.isUploadingPo = false;
          if (res.success && res.data) {
            this.poPreview = res.data;
            this.poPreview.fileType = 'EXCEL';
            this.recalculatePoTotals();
            if (res.data.items && res.data.items.length > 0) {
              if (autoLoadToCart) {
                this.loadPoIntoCart();
              }
            } else {
              this.openPriceOrderModal();
            }
          }
        },
        error: () => {
          this.isUploadingPo = false;
          this.openPriceOrderModal();
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
          this.isUploadingPo = false;
          this.ocrProgressPercent = 100;
          this.ocrProgressMessage = 'Scan complete!';
          const text = result?.data?.text || '';
          this.parseOcrTextIntoPo(text, cleanShopName, autoLoadToCart);
        }).catch((err: any) => {
          console.warn('OCR processing error', err);
          this.isOcrProcessing = false;
          this.isUploadingPo = false;
          this.openPriceOrderModal();
        });
      } else {
        this.isOcrProcessing = false;
        this.isUploadingPo = false;
        this.openPriceOrderModal();
      }
    }).catch(() => {
      this.isOcrProcessing = false;
      this.isUploadingPo = false;
      this.openPriceOrderModal();
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
    if (!text || text.trim().length < 5) {
      if (this.poPreview) {
        this.poPreview.items = [];
        this.recalculatePoTotals();
      }
      this.openPriceOrderModal();
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
      } else if (lower.includes('fashion') || lower.includes('mart') || lower.includes('shop') || lower.includes('store') || lower.includes('textile')) {
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
      this.poPreview.items = matchedItems;
      this.recalculatePoTotals();
    }

    if (matchedItems.length > 0 && autoLoadToCart) {
      this.loadPoIntoCart();
    } else {
      this.openPriceOrderModal();
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

    const payload: CheckoutRequest = {
      warehouseId: this.selectedWarehouseId || undefined,
      customerName: this.poPreview.shopName || 'Wholesale Shop',
      customerPhone: this.poPreview.shopPhone || undefined,
      paymentMethod: this.paymentMethod,
      discountAmount: 0,
      taxAmount: 0,
      paidAmount: this.poPreview.estimatedTotal,
      items: validItems.map(i => ({
        productId: (i.productId && i.productId > 0) ? i.productId : 0,
        productName: i.productName,
        sku: i.sku,
        unit: i.unit || 'PCS',
        quantity: Number(i.quantity),
        unitPrice: i.customPrice,
        barcode: i.sku || undefined
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
