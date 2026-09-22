import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { AuthService } from '../../services/auth.service';
import { Product, Warehouse, Category, SaleInvoice, SaleInvoiceItem, CheckoutRequest } from '../../models/wms.models';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
              <i class="bi bi-receipt-cutoff text-success me-2"></i>POS & Billing Counter
            </h2>
            <span class="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-2.5 py-1">
              Live Auto-Stock Out
            </span>
          </div>
          <p class="text-secondary small mb-0 mt-1">
            Fast multi-item checkout, automated inventory deductions, and instant printable sales receipts
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
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
            <!-- Customer Info Header -->
            <div class="p-2.5 rounded-2 bg-dark bg-opacity-60 border border-secondary border-opacity-20 mb-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-light small">
                  <i class="bi bi-person-circle text-info me-1"></i>Customer Details
                </span>
                <div class="form-check form-check-inline form-switch mb-0">
                  <input class="form-check-input" type="checkbox" id="walkInCheck" [(ngModel)]="isWalkIn" (change)="onWalkInToggle()">
                  <label class="form-check-label text-secondary text-xs" for="walkInCheck">Walk-in</label>
                </div>
              </div>

              <div class="row g-2">
                <div class="col-7">
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerName" placeholder="Customer Name *" [disabled]="isWalkIn">
                </div>
                <div class="col-5">
                  <input type="text" class="form-control form-control-sm bg-dark text-light border-secondary"
                         [(ngModel)]="customerPhone" placeholder="Mobile # (Opt)" [disabled]="isWalkIn">
                </div>
              </div>
            </div>

            <!-- Cart Table Items -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fw-bold text-light small">
                <i class="bi bi-bag-check text-success me-1"></i>Bill Items ({{ cart.length }})
              </span>
              <button *ngIf="cart.length > 0" (click)="clearCart()" class="btn btn-link btn-xs text-danger text-decoration-none p-0">
                <i class="bi bi-trash3 me-0.5"></i>Clear Cart
              </button>
            </div>

            <div class="cart-scroll flex-grow-1 overflow-y-auto mb-3 pe-1" style="max-height: 320px; min-height: 180px;">
              <div *ngIf="cart.length === 0" class="text-center py-5 text-muted border border-dashed border-secondary border-opacity-25 rounded-2">
                <i class="bi bi-cart-x fs-2 d-block mb-1 text-secondary opacity-50"></i>
                <span>Cart is empty. Click any product on the left to add.</span>
              </div>

              <div *ngFor="let item of cart; let i = index" class="cart-item-row p-2 mb-1.5 rounded-2 bg-dark bg-opacity-40 border border-secondary border-opacity-20 d-flex align-items-center justify-content-between gap-2">
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold text-light small text-truncate">{{ item.product.name }}</div>
                  <div class="text-muted text-xs">
                    {{ defaultCurrency }} {{ item.unitPrice | number:'1.2-2' }} &times; {{ item.quantity }} {{ item.product.unit || 'PCS' }}
                    <span *ngIf="item.quantity > item.product.currentStock" class="text-danger fw-bold ms-1">
                      (Exceeds stock: {{ item.product.currentStock }})
                    </span>
                  </div>
                </div>

                <!-- Quantity Controls -->
                <div class="d-flex align-items-center gap-1">
                  <button class="btn btn-outline-secondary btn-xs px-2 py-0.5" (click)="decreaseQty(item)">-</button>
                  <input type="number" class="form-control form-control-sm text-center p-0 border-secondary bg-dark text-light"
                         style="width: 44px; height: 26px;"
                         [(ngModel)]="item.quantity"
                         (ngModelChange)="onQtyChange(item)" min="1">
                  <button class="btn btn-outline-secondary btn-xs px-2 py-0.5" (click)="increaseQty(item)">+</button>
                </div>

                <!-- Line Total -->
                <div class="text-end" style="min-width: 75px;">
                  <div class="fw-bold text-warning small">
                    {{ defaultCurrency }} {{ item.totalPrice | number:'1.2-2' }}
                  </div>
                  <button class="btn btn-link btn-xs text-danger text-decoration-none p-0" (click)="removeFromCart(i)" title="Remove item">
                    <i class="bi bi-x-circle"></i>
                  </button>
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
                  <th class="py-3">Customer</th>
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
                  Inventory & Retail Warehouse Management
                </p>
                <div class="text-xs bill-meta-text">
                  Phone: {{ currentUser()?.phone || '+91 98765 43210' }} &bull; Email: {{ currentUser()?.email || 'store@aerowms.com' }}
                </div>
              </div>

              <!-- Bill Metadata (2-col or stacked) -->
              <div class="d-flex justify-content-between align-items-start small mb-3 pb-2 border-bottom border-dark border-opacity-10 bill-meta-section">
                <div>
                  <div><strong>Bill No:</strong> <span class="font-monospace text-success fw-bold">{{ currentBill.invoiceNumber }}</span></div>
                  <div><strong>Date:</strong> {{ currentBill.createdAt | date:'dd-MMM-yyyy, hh:mm a' }}</div>
                  <div><strong>Cashier:</strong> {{ currentUser()?.fullName || 'Cashier 01' }}</div>
                </div>
                <div class="text-end">
                  <div><strong>Customer:</strong> {{ currentBill.customerName }}</div>
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
                      <small *ngIf="item.sku" class="text-muted d-block text-xs">SKU: {{ item.sku }}</small>
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
                <div class="fw-bold text-xs mb-1">THANK YOU FOR YOUR PURCHASE!</div>
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

  // Cart & Customer Form State
  cart: CartItem[] = [];
  isWalkIn = true;
  customerName = 'Walk-in Customer';
  customerPhone = '';
  paymentMethod = 'CASH';
  discountAmount: number = 0;
  taxAmount: number = 0;
  paidAmount: number | null = null;

  isSubmitting = false;

  // Modal State
  showBillModal = false;
  currentBill: SaleInvoice | null = null;

  constructor(
    private wmsApi: WmsApiService,
    private authService: AuthService
  ) {}

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit(): void {
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

  addToCart(product: Product): void {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
      existing.totalPrice = existing.quantity * existing.unitPrice;
    } else {
      const price = product.price || 0;
      this.cart.push({
        product,
        quantity: 1,
        unitPrice: price,
        totalPrice: price
      });
    }
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
      alert('Your cart is empty! Please add products before checking out.');
      return;
    }

    if (!this.customerName || !this.customerName.trim()) {
      alert('Please enter customer name (or toggle Walk-in).');
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
        unitPrice: item.unitPrice
      }))
    };

    this.isSubmitting = true;
    this.wmsApi.checkoutSale(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.currentBill = res.data;
          this.showBillModal = true;
          // Clear cart and reload stock in background
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
