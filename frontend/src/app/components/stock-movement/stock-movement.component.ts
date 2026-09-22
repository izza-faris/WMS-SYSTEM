import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { Product, Warehouse, StockTransaction } from '../../models/wms.models';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="stock-movement-page animate__animated animate__fadeIn">
      <!-- Header Bar -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Stock In & Stock Out Operations</h2>
          <p class="text-secondary small mb-0">
            Product-level Stock In, Stock Out, Balance & Revenue Tracking
          </p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- View Toggle -->
          <div class="btn-group btn-group-sm bg-dark p-0.5 rounded-2 border border-secondary border-opacity-25 me-2">
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-primary]="activeView === 'OVERVIEW'"
                    [class.text-secondary]="activeView !== 'OVERVIEW'"
                    (click)="activeView = 'OVERVIEW'">
              <i class="bi bi-table me-1"></i> Stock Overview (Table)
            </button>
            <button type="button" class="btn btn-sm px-3 fw-semibold"
                    [class.btn-primary]="activeView === 'LEDGER'"
                    [class.text-secondary]="activeView !== 'LEDGER'"
                    (click)="activeView = 'LEDGER'">
              <i class="bi bi-journal-text me-1"></i> Movement Log ({{ transactions().length }})
            </button>
          </div>

          <!-- Quick Action Buttons -->
          <a routerLink="/app/billing" class="btn btn-outline-warning btn-sm px-3 fw-bold shadow-sm">
            <i class="bi bi-receipt me-1"></i> POS Billing Counter
          </a>
          <button (click)="openStockInModal()" class="btn btn-success btn-sm px-3 fw-semibold shadow-sm">
            <i class="bi bi-box-arrow-in-down me-1"></i> + Stock In
          </button>
          <button (click)="openStockOutModal()" class="btn btn-primary btn-sm px-3 fw-semibold shadow-sm">
            <i class="bi bi-box-arrow-up-right me-1"></i> - Stock Out / Sale
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW 1: PRODUCT STOCK IN / OUT OVERVIEW TABLE & SUMMARY (IMAGE)   -->
      <!-- ================================================================= -->
      <div *ngIf="activeView === 'OVERVIEW'" class="animate__animated animate__fadeIn">
        <!-- Search & Filter Bar -->
        <div class="glass-panel p-3 mb-4">
          <div class="row g-2 align-items-center">
            <div class="col-md-6 col-lg-5">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" [(ngModel)]="searchQuery" placeholder="Search product name, SKU, or barcode...">
                <button *ngIf="searchQuery" class="btn btn-outline-secondary" (click)="searchQuery = ''"><i class="bi bi-x-lg"></i></button>
              </div>
            </div>
            <div class="col-md-6 col-lg-7 text-md-end text-secondary small">
              Showing <strong>{{ filteredProducts.length }}</strong> products &bull; 
              Total Movements: <strong>{{ transactions().length }}</strong>
            </div>
          </div>
        </div>

        <!-- TABLE 1: Main Product Stock In / Out Table (Matching Image) -->
        <div class="glass-panel p-4 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold text-light mb-0">
              <i class="bi bi-box-seam text-primary me-2"></i>Product Stock Summary
            </h5>
            <span class="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 px-2.5 py-1">
              Direct Balance Method
            </span>
          </div>

          <div class="table-responsive rounded-3 border border-primary border-opacity-30 shadow-sm">
            <table class="table table-custom table-bordered mb-0 align-middle text-center">
              <thead>
                <tr class="header-row">
                  <th class="py-3 text-uppercase text-light fw-bold" style="width: 25%; letter-spacing: 0.06em;">PRODUCT</th>
                  <th class="py-3 text-uppercase text-success fw-bold" style="width: 15%; letter-spacing: 0.06em; background: rgba(16, 185, 129, 0.08);">STOCK IN</th>
                  <th class="py-3 text-uppercase text-danger fw-bold" style="width: 15%; letter-spacing: 0.06em; background: rgba(239, 68, 68, 0.08);">STOCK OUT</th>
                  <th class="py-3 text-uppercase text-info fw-bold" style="width: 20%; letter-spacing: 0.06em; background: rgba(14, 165, 233, 0.08);">BALANCE</th>
                  <th class="py-3 text-uppercase text-warning fw-bold" style="width: 15%; letter-spacing: 0.06em; background: rgba(245, 158, 11, 0.08);">PRICE</th>
                  <th class="py-3 text-uppercase text-light fw-bold" style="width: 10%; letter-spacing: 0.06em;">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredProducts.length === 0">
                  <td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    No products found. Add products under Products & Catalog first.
                  </td>
                </tr>

                <tr *ngFor="let p of filteredProducts" class="hover-row">
                  <!-- PRODUCT -->
                  <td class="text-start py-3 px-3">
                    <div class="text-light fw-extrabold fs-6">{{ p.name }}</div>
                    <div class="d-flex align-items-center gap-1 mt-1">
                      <span *ngIf="p.sku" class="badge bg-dark text-secondary border border-secondary border-opacity-25 text-xs py-0.5 px-1.5">
                        {{ p.sku }}
                      </span>
                      <span class="badge bg-secondary bg-opacity-20 text-light border border-secondary border-opacity-25 text-xs py-0.5 px-1.5">
                        {{ p.unit || 'PCS' }}
                      </span>
                    </div>
                  </td>

                  <!-- STOCK IN -->
                  <td class="py-3 fs-5 fw-bold text-success" style="background: rgba(16, 185, 129, 0.02);">
                    {{ getStockIn(p) | number }}
                    <small class="d-block text-secondary text-xs fw-normal mt-0.5">{{ p.unit || 'PCS' }}</small>
                  </td>

                  <!-- STOCK OUT -->
                  <td class="py-3 fs-5 fw-bold text-danger" style="background: rgba(239, 68, 68, 0.02);">
                    {{ getStockOut(p) | number }}
                    <small class="d-block text-secondary text-xs fw-normal mt-0.5">{{ p.unit || 'PCS' }}</small>
                  </td>

                  <!-- BALANCE (e.g. 900 with (1200 - 300)) -->
                  <td class="py-3" style="background: rgba(14, 165, 233, 0.02);">
                    <div class="fs-4 fw-extrabold text-light">
                      {{ getBalance(p) | number }}
                    </div>
                    <div class="text-info small fw-semibold mt-0.5">
                      ({{ getStockIn(p) | number }} - {{ getStockOut(p) | number }})
                    </div>
                  </td>

                  <!-- PRICE (e.g. 120/- (Per Piece)) -->
                  <td class="py-3" style="background: rgba(245, 158, 11, 0.02);">
                    <div class="fs-5 fw-bold text-warning">
                      {{ getCurrency(p) }} {{ (p.price || 0) | number:'1.0-2' }}/-
                    </div>
                    <div class="text-secondary text-xs mt-0.5">
                      ({{ getPerUnitLabel(p) }})
                    </div>
                  </td>

                  <!-- ACTIONS -->
                  <td class="py-3 px-2">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <button (click)="openStockInModal(p)" class="btn btn-outline-success btn-xs px-2 py-1" title="Add Stock In">
                        <i class="bi bi-plus-lg"></i> In
                      </button>
                      <button (click)="openStockOutModal(p)" class="btn btn-outline-danger btn-xs px-2 py-1" title="Dispatch / Sale Stock Out">
                        <i class="bi bi-dash-lg"></i> Out
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TABLE 2: Bottom Summary Table (Matching Image Exactly) -->
        <div class="glass-panel p-4 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold text-uppercase text-light tracking-wider mb-0">
              <i class="bi bi-calculator text-success me-2"></i>Overall Operations Total
            </h6>
            <small class="text-secondary">Summary across all catalog items</small>
          </div>

          <div class="table-responsive rounded-3 border border-primary border-opacity-40 shadow-sm">
            <table class="table table-custom table-bordered mb-0 align-middle text-center">
              <thead>
                <tr class="header-row">
                  <th class="py-3 text-uppercase text-light fw-bold" style="width: 30%; letter-spacing: 0.06em;">TOTAL STOCK</th>
                  <th class="py-3 text-uppercase text-danger fw-bold" style="width: 30%; letter-spacing: 0.06em; background: rgba(239, 68, 68, 0.08);">SOLD</th>
                  <th class="py-3 text-uppercase text-success fw-bold" style="width: 40%; letter-spacing: 0.06em; background: rgba(16, 185, 129, 0.08);">TOTAL AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <!-- TOTAL STOCK -->
                  <td class="py-4">
                    <div class="fs-2 fw-extrabold text-light">
                      {{ totalStockIn | number }}
                    </div>
                    <small class="text-secondary text-xs">Total Inbound Units Received</small>
                  </td>

                  <!-- SOLD (STOCK OUT) -->
                  <td class="py-4" style="background: rgba(239, 68, 68, 0.03);">
                    <div class="fs-2 fw-extrabold text-danger">
                      {{ totalStockOut | number }}
                    </div>
                    <small class="text-secondary text-xs">Total Outbound Units Sold</small>
                  </td>

                  <!-- TOTAL AMOUNT (e.g. ₹ 36,000/- with formula) -->
                  <td class="py-4" style="background: rgba(16, 185, 129, 0.04);">
                    <div class="fs-2 fw-extrabold text-success">
                      {{ defaultCurrency }} {{ totalSoldAmount | number:'1.2-2' }}/-
                    </div>
                    <div class="text-success text-xs fw-semibold mt-1">
                      <span *ngIf="filteredProducts.length === 1">
                        ({{ totalStockOut | number }} &times; {{ (filteredProducts[0].price || 0) | number:'1.0-2' }})
                      </span>
                      <span *ngIf="filteredProducts.length > 1">
                        (Total Sold Qty &times; Selling Price)
                      </span>
                      <span *ngIf="filteredProducts.length === 0">
                        (0 &times; 0)
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Secondary Metric Pills (Balance & Remaining Catalog Value) -->
          <div class="row g-3 mt-3">
            <div class="col-md-6">
              <div class="p-3 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                <div>
                  <small class="text-secondary d-block">Current In-Stock Balance:</small>
                  <strong class="text-info fs-5">{{ totalBalance | number }} Units</strong>
                </div>
                <i class="bi bi-boxes fs-3 text-info opacity-75"></i>
              </div>
            </div>
            <div class="col-md-6">
              <div class="p-3 rounded-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                <div>
                  <small class="text-secondary d-block">Total Remaining Stock Value:</small>
                  <strong class="text-warning fs-5">{{ defaultCurrency }} {{ totalRemainingValue | number:'1.2-2' }}</strong>
                </div>
                <i class="bi bi-cash-stack fs-3 text-warning opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW 2: DETAILED MOVEMENTS LEDGER LOG (NOTEBOOK STYLE TABLE)      -->
      <!-- ================================================================= -->
      <div *ngIf="activeView === 'LEDGER'" class="animate__animated animate__fadeIn">
        <div class="glass-panel p-4">
          <!-- Header & Filter Toolbar -->
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div>
              <h5 class="fw-bold text-light mb-0">
                <i class="bi bi-journal-text text-primary me-2"></i>Stock Movements History Ledger
              </h5>
              <small class="text-secondary text-xs">Direct notebook ledger format without time system</small>
            </div>

            <div class="d-flex align-items-center gap-2">
              <!-- Filter Pills: All | Stock In | Stock Out -->
              <div class="btn-group btn-group-sm bg-dark p-0.5 rounded-2 border border-secondary border-opacity-25">
                <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                        [class.btn-primary]="ledgerFilterType === 'ALL'"
                        [class.text-secondary]="ledgerFilterType !== 'ALL'"
                        (click)="ledgerFilterType = 'ALL'">
                  All ({{ transactions().length }})
                </button>
                <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                        [class.btn-success]="ledgerFilterType === 'IN'"
                        [class.text-secondary]="ledgerFilterType !== 'IN'"
                        (click)="ledgerFilterType = 'IN'">
                  Stock in ({{ getStockInCount() }})
                </button>
                <button type="button" class="btn btn-xs px-2.5 py-1 fw-semibold"
                        [class.btn-danger]="ledgerFilterType === 'OUT'"
                        [class.text-secondary]="ledgerFilterType !== 'OUT'"
                        (click)="ledgerFilterType = 'OUT'">
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

      <!-- ================================================================= -->
      <!-- MODAL: QUICK STOCK IN (ADD STOCK)                                 -->
      <!-- ================================================================= -->
      <div *ngIf="showInModal" class="modal-backdrop-custom animate__animated animate__fadeIn">
        <div class="modal-dialog-custom glass-panel p-4 animate__animated animate__zoomIn">
          <div class="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 mb-3">
            <h5 class="fw-bold text-success mb-0">
              <i class="bi bi-box-arrow-in-down me-2"></i>Record Stock In
            </h5>
            <button class="btn btn-sm text-secondary" (click)="showInModal = false"><i class="bi bi-x-lg"></i></button>
          </div>

          <form (ngSubmit)="submitStockIn()">
            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">Product *</label>
              <select class="form-select" [(ngModel)]="stockInForm.productId" name="productId" (change)="onInProductSelectChange()" required>
                <option *ngFor="let p of products()" [value]="p.id">
                  {{ p.name }} (Current: {{ p.currentStock }} {{ p.unit || 'PCS' }})
                </option>
              </select>
            </div>

            <!-- Live Calculation Preview -->
            <div *ngIf="getSelectedInProduct() as inProd" class="p-3 bg-dark bg-opacity-60 rounded border border-success border-opacity-30 mb-3">
              <div class="d-flex justify-content-between small text-secondary mb-1">
                <span>Current Stock:</span>
                <span class="text-light fw-bold">{{ inProd.currentStock | number }} {{ inProd.unit || 'PCS' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-success mb-1">
                <span>+ Adding Stock In:</span>
                <span class="fw-bold">+{{ (stockInForm.quantity || 0) | number }} {{ inProd.unit || 'PCS' }}</span>
              </div>
              <div class="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-25 fw-bold text-light">
                <span>New Balance will be:</span>
                <span class="badge bg-success fs-6">
                  {{ (inProd.currentStock + (stockInForm.quantity || 0)) | number }} {{ inProd.unit || 'PCS' }}
                </span>
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-8">
                <label class="form-label text-secondary small fw-semibold">Stock In Quantity *</label>
                <div class="input-group">
                  <input type="number" class="form-control" [(ngModel)]="stockInForm.quantity" name="quantity" min="1" required>
                  <span class="input-group-text bg-dark border-secondary text-secondary">
                    {{ getSelectedInProduct()?.unit || 'PCS' }}
                  </span>
                </div>
              </div>
              <div class="col-4">
                <label class="form-label text-secondary small">Batch #</label>
                <input type="text" class="form-control" [(ngModel)]="stockInForm.batchNumber" name="batchNumber" placeholder="Optional">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small">Reference / Bill / GRN # <span class="text-muted fw-normal">(Optional)</span></label>
              <input type="text" class="form-control" [(ngModel)]="stockInForm.referenceNumber" name="referenceNumber" placeholder="e.g. GRN-001, Bill-104">
            </div>

            <div class="mb-4">
              <label class="form-label text-secondary small">Notes <span class="text-muted fw-normal">(Optional)</span></label>
              <input type="text" class="form-control" [(ngModel)]="stockInForm.notes" name="notes" placeholder="e.g. New stock received">
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary px-3" (click)="showInModal = false">Cancel</button>
              <button type="submit" class="btn btn-success px-4 fw-semibold shadow-sm">
                <i class="bi bi-check2-circle me-1"></i> Confirm Stock In
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL: QUICK STOCK OUT / SALE DISPATCH                            -->
      <!-- ================================================================= -->
      <div *ngIf="showOutModal" class="modal-backdrop-custom animate__animated animate__fadeIn">
        <div class="modal-dialog-custom glass-panel p-4 animate__animated animate__zoomIn">
          <div class="d-flex align-items-center justify-content-between pb-3 border-bottom border-secondary border-opacity-25 mb-3">
            <h5 class="fw-bold text-primary mb-0">
              <i class="bi bi-box-arrow-up-right me-2"></i>Record Stock Out / Sale
            </h5>
            <button class="btn btn-sm text-secondary" (click)="showOutModal = false"><i class="bi bi-x-lg"></i></button>
          </div>

          <form (ngSubmit)="submitStockOut()">
            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">Product *</label>
              <select class="form-select" [(ngModel)]="stockOutForm.productId" name="productId" (change)="onOutProductSelectChange()" required>
                <option *ngFor="let p of products()" [value]="p.id">
                  {{ p.name }} (Available: {{ p.currentStock }} {{ p.unit || 'PCS' }})
                </option>
              </select>
            </div>

            <!-- Live Calculation & Revenue Preview -->
            <div *ngIf="getSelectedOutProduct() as outProd" class="p-3 bg-dark bg-opacity-60 rounded border border-primary border-opacity-30 mb-3">
              <div class="d-flex justify-content-between small text-secondary mb-1">
                <span>Available Stock:</span>
                <span class="text-light fw-bold">{{ outProd.currentStock | number }} {{ outProd.unit || 'PCS' }}</span>
              </div>
              <div class="d-flex justify-content-between small text-danger mb-1">
                <span>- Dispatching Out:</span>
                <span class="fw-bold">-{{ (stockOutForm.quantity || 0) | number }} {{ outProd.unit || 'PCS' }}</span>
              </div>
              <div class="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-25 fw-bold text-light mb-2">
                <span>Remaining Balance:</span>
                <span class="badge fs-6" [ngClass]="(outProd.currentStock - (stockOutForm.quantity || 0)) < 0 ? 'bg-danger' : 'bg-primary'">
                  {{ (outProd.currentStock - (stockOutForm.quantity || 0)) | number }} {{ outProd.unit || 'PCS' }}
                </span>
              </div>
              <!-- Revenue Calculation: Sold Qty × Price -->
              <div class="pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between small text-warning fw-semibold">
                <span>Sale Revenue Amount:</span>
                <span>{{ getCurrency(outProd) }} {{ ((stockOutForm.quantity || 0) * (outProd.price || 0)) | number:'1.2-2' }} ({{ stockOutForm.quantity || 0 }} &times; {{ (outProd.price || 0) | number:'1.0-2' }})</span>
              </div>
              <div *ngIf="(stockOutForm.quantity || 0) > outProd.currentStock" class="alert alert-danger py-1 px-2 mt-2 mb-0 text-xs">
                <i class="bi bi-exclamation-triangle-fill me-1"></i> Warning: Dispatch exceeds currently recorded stock!
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">Stock Out Quantity *</label>
              <div class="input-group">
                <input type="number" class="form-control" [(ngModel)]="stockOutForm.quantity" name="quantity" min="1" required>
                <span class="input-group-text bg-dark border-secondary text-secondary">
                  {{ getSelectedOutProduct()?.unit || 'PCS' }}
                </span>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small">Reference / DO / Invoice # <span class="text-muted fw-normal">(Optional)</span></label>
              <input type="text" class="form-control" [(ngModel)]="stockOutForm.referenceNumber" name="referenceNumber" placeholder="e.g. Inv-001, DO-089">
            </div>

            <div class="mb-4">
              <label class="form-label text-secondary small">Notes <span class="text-muted fw-normal">(Optional)</span></label>
              <input type="text" class="form-control" [(ngModel)]="stockOutForm.notes" name="notes" placeholder="e.g. Sold to customer, counter dispatch">
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-secondary px-3" (click)="showOutModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary px-4 fw-semibold shadow-sm">
                <i class="bi bi-send-check me-1"></i> Confirm Dispatch Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-row th {
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
    }
    .hover-row:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    .tracking-wider {
      letter-spacing: 0.06em;
    }
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-dialog-custom {
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: #111827;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
    }
  `]
})
export class StockMovementComponent implements OnInit {
  activeView: 'OVERVIEW' | 'LEDGER' = 'OVERVIEW';
  ledgerFilterType: 'ALL' | 'IN' | 'OUT' = 'ALL';

  products = signal<Product[]>([]);
  warehouses = signal<Warehouse[]>([]);
  transactions = signal<StockTransaction[]>([]);

  searchQuery = '';
  defaultCurrency = '₹';

  // Modal State
  showInModal = false;
  showOutModal = false;

  stockInForm: any = {
    productId: null,
    warehouseId: null,
    quantity: 100,
    batchNumber: '',
    referenceNumber: '',
    notes: ''
  };

  stockOutForm: any = {
    productId: null,
    warehouseId: null,
    quantity: 10,
    referenceNumber: '',
    notes: ''
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.wmsApi.ensureDefaultWarehouse().subscribe(wh => {
      if (wh) {
        this.warehouses.set([wh]);
        this.stockInForm.warehouseId = wh.id;
        this.stockOutForm.warehouseId = wh.id;
      }
      this.wmsApi.getWarehouses().subscribe(wRes => {
        if (wRes.success && wRes.data && wRes.data.length > 0) {
          this.warehouses.set(wRes.data);
        }
      });
    });

    this.loadTransactions();
  }

  loadProducts() {
    this.wmsApi.getAllProductsList().subscribe(res => {
      if (res.success && res.data) {
        this.products.set(res.data);
        if (res.data.length > 0) {
          if (!this.stockInForm.productId) this.stockInForm.productId = res.data[0].id;
          if (!this.stockOutForm.productId) this.stockOutForm.productId = res.data[0].id;
          if (res.data[0].currency) this.defaultCurrency = res.data[0].currency;
        }
      }
    });
  }

  loadTransactions() {
    this.wmsApi.getStockTransactions(0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data?.content) this.transactions.set(res.data.content);
      }
    });
  }

  // --- Filtering & Calculations for Table 1 & Table 2 ---

  get filteredProducts(): Product[] {
    const list = this.products();
    if (!this.searchQuery || !this.searchQuery.trim()) return list;
    const q = this.searchQuery.trim().toLowerCase();
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }

  getStockIn(p: Product): number {
    const txIn = this.transactions()
      .filter(tx => tx.productId === p.id && this.isStockIn(tx))
      .reduce((sum, tx) => sum + (tx.quantity || 0), 0);

    const txOut = this.getStockOut(p);

    if (txIn === 0 && (p.currentStock > 0 || txOut > 0)) {
      return (p.currentStock || 0) + txOut;
    }
    return Math.max(txIn, (p.currentStock || 0) + txOut);
  }

  getStockOut(p: Product): number {
    return this.transactions()
      .filter(tx => tx.productId === p.id && this.isStockOut(tx))
      .reduce((sum, tx) => sum + (tx.quantity || 0), 0);
  }

  getBalance(p: Product): number {
    return this.getStockIn(p) - this.getStockOut(p);
  }

  getCurrency(p?: Product): string {
    return p?.currency || this.defaultCurrency || '₹';
  }

  getPerUnitLabel(p: Product): string {
    const u = (p.unit || 'PCS').toUpperCase();
    if (u === 'PCS' || u === 'PIECE' || u === 'PIECES') return 'Per Piece';
    if (u === 'KG') return 'Per KG';
    if (u === 'G') return 'Per Gram';
    if (u === 'L') return 'Per Litre';
    if (u === 'ML') return 'Per ML';
    if (u === 'BOX') return 'Per Box';
    if (u === 'PKT') return 'Per Packet';
    if (u === 'BAG') return 'Per Bag';
    if (u === 'BTL') return 'Per Bottle';
    if (u === 'CAN') return 'Per Can';
    if (u === 'DOZ') return 'Per Dozen';
    if (u === 'MTR') return 'Per Meter';
    return `Per ${p.unit || 'Unit'}`;
  }

  // --- Summary Table (Table 2) Totals ---

  get totalStockIn(): number {
    return this.filteredProducts.reduce((sum, p) => sum + this.getStockIn(p), 0);
  }

  get totalStockOut(): number {
    return this.filteredProducts.reduce((sum, p) => sum + this.getStockOut(p), 0);
  }

  get totalSoldAmount(): number {
    return this.filteredProducts.reduce((sum, p) => sum + (this.getStockOut(p) * (p.price || 0)), 0);
  }

  get totalBalance(): number {
    return this.filteredProducts.reduce((sum, p) => sum + this.getBalance(p), 0);
  }

  get totalRemainingValue(): number {
    return this.filteredProducts.reduce((sum, p) => sum + (this.getBalance(p) * (p.price || 0)), 0);
  }

  // --- Modals & Operations ---

  openStockInModal(product?: Product) {
    if (product) {
      this.stockInForm.productId = product.id;
    } else if (this.products().length > 0 && !this.stockInForm.productId) {
      this.stockInForm.productId = this.products()[0].id;
    }
    this.stockInForm.quantity = 100;
    this.stockInForm.referenceNumber = '';
    this.stockInForm.notes = '';
    this.showInModal = true;
  }

  openStockOutModal(product?: Product) {
    if (product) {
      this.stockOutForm.productId = product.id;
    } else if (this.products().length > 0 && !this.stockOutForm.productId) {
      this.stockOutForm.productId = this.products()[0].id;
    }
    this.stockOutForm.quantity = 10;
    this.stockOutForm.referenceNumber = '';
    this.stockOutForm.notes = '';
    this.showOutModal = true;
  }

  getSelectedInProduct(): Product | null {
    return this.products().find(p => p.id === Number(this.stockInForm.productId)) || null;
  }

  getSelectedOutProduct(): Product | null {
    return this.products().find(p => p.id === Number(this.stockOutForm.productId)) || null;
  }

  onInProductSelectChange() {}
  onOutProductSelectChange() {}

  submitStockIn() {
    const product = this.getSelectedInProduct();
    if (!product) {
      alert('Please select a valid product.');
      return;
    }
    const whId = this.stockInForm.warehouseId || this.warehouses()[0]?.id || 1;
    const payload = {
      productId: product.id,
      warehouseId: whId,
      quantity: this.stockInForm.quantity,
      batchNumber: this.stockInForm.batchNumber,
      referenceNumber: this.stockInForm.referenceNumber,
      notes: this.stockInForm.notes
    };

    this.wmsApi.stockIn(payload).subscribe({
      next: () => {
        const unit = product.unit || 'PCS';
        alert(`Stock In recorded successfully! Added +${this.stockInForm.quantity} ${unit} to "${product.name}".`);
        this.showInModal = false;
        this.loadProducts();
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to record Stock In')
    });
  }

  submitStockOut() {
    const product = this.getSelectedOutProduct();
    if (!product) {
      alert('Please select a valid product.');
      return;
    }
    const whId = this.stockOutForm.warehouseId || this.warehouses()[0]?.id || 1;
    const payload = {
      productId: product.id,
      warehouseId: whId,
      quantity: this.stockOutForm.quantity,
      referenceNumber: this.stockOutForm.referenceNumber,
      notes: this.stockOutForm.notes
    };

    this.wmsApi.stockOut(payload).subscribe({
      next: () => {
        const unit = product.unit || 'PCS';
        alert(`Stock Out completed successfully! Dispatched -${this.stockOutForm.quantity} ${unit} of "${product.name}".`);
        this.showOutModal = false;
        this.loadProducts();
        this.loadTransactions();
      },
      error: (err) => alert(err.error?.message || 'Failed to dispatch Stock Out')
    });
  }

  // --- Movements Ledger (History) Logic ---

  get filteredTransactions(): StockTransaction[] {
    const list = this.transactions();
    if (this.ledgerFilterType === 'IN') {
      return list.filter(tx => this.isStockIn(tx));
    }
    if (this.ledgerFilterType === 'OUT') {
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

  deleteTransaction(tx: StockTransaction): void {
    const name = this.getProductName(tx.productId);
    const unit = this.getProductUnit(tx.productId);
    if (!confirm(`Are you sure you want to delete this ${tx.transactionType} record (${tx.quantity} ${unit} for "${name}")? Inventory balance will be adjusted accordingly.`)) {
      return;
    }
    this.wmsApi.deleteStockTransaction(tx.id).subscribe({
      next: () => {
        this.loadTransactions();
        this.loadProducts();
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
        this.loadProducts();
      },
      error: (err) => alert(err.error?.message || 'Failed to clear stock movements')
    });
  }
}
