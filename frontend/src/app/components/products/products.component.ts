import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { Category, Product } from '../../models/wms.models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="products-page animate__animated animate__fadeIn">
      <!-- Top Title & Actions -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Products & Catalog (பொருட்கள் & விலை விபரம்)</h2>
          <p class="text-secondary small mb-0">Manage items, barcodes, prices, stock levels, and print price tag stickers</p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Quick Price Checker Button -->
          <button (click)="openScannerModal()" class="btn btn-outline-success btn-sm d-flex align-items-center gap-2" title="Check product price instantly">
            <i class="bi bi-upc-scan"></i>
            <span>Instant Price Checker (விலை சரிபார்ப்பு)</span>
          </button>

          <button (click)="openAddModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-plus-lg"></i>
            <span>Add Product</span>
          </button>

          <button (click)="openImportModal()" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-file-earmark-excel text-success"></i>
            <span>Import Excel</span>
          </button>

          <a [href]="exportUrl" target="_blank" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-download"></i>
            <span>Export</span>
          </a>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="glass-panel p-3 mb-4">
        <div class="row g-2 align-items-center">
          <!-- General Search -->
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search Name, SKU, Brand...">
            </div>
          </div>

          <!-- Quick Barcode Price Lookup -->
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-dark border-success border-opacity-50 text-success"><i class="bi bi-upc-scan"></i></span>
              <input type="text" class="form-control border-success border-opacity-30" [(ngModel)]="quickBarcode" (keyup.enter)="checkPriceDirect()" placeholder="Scan/Type Barcode for Price...">
              <button (click)="checkPriceDirect()" class="btn btn-outline-success btn-sm">Check</button>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="selectedCategory" (change)="onFilterCategory()">
              <option value="">All Categories</option>
              <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <!-- Currency Selector -->
          <div class="col-md-2">
            <select class="form-select bg-dark text-light border-secondary" [(ngModel)]="defaultCurrency" (change)="onDefaultCurrencyChange()" title="Choose Currency Symbol">
              <option *ngFor="let c of availableCurrencies" [value]="c.symbol">{{ c.symbol }} ({{ c.code }})</option>
            </select>
          </div>

          <!-- Categories modal button -->
          <div class="col-md-1">
            <button (click)="openCategoryModal()" class="btn btn-glass w-100 btn-sm py-2" title="Manage Categories">
              <i class="bi bi-tags"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Products Data Table -->
      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Product Info</th>
                <th>SKU & Barcode</th>
                <th>Category / Brand</th>
                <th>Price / விலை</th>
                <th>Stock Level</th>
                <th>Reorder Point</th>
                <th>Tracking</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="products().length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                  No products found matching the criteria.
                </td>
              </tr>
              <tr *ngFor="let p of products()" class="animate__animated animate__fadeIn">
                <td>
                  <div class="fw-bold text-light">{{ p.name }}</div>
                  <small class="text-muted">{{ p.unit }}</small>
                </td>
                <td>
                  <span class="badge bg-dark border border-secondary text-primary font-monospace">{{ p.sku }}</span>
                  <div *ngIf="p.barcode" class="text-secondary text-xs font-monospace mt-1">
                    <i class="bi bi-upc me-1 text-success"></i>{{ p.barcode }}
                  </div>
                </td>
                <td>
                  <div class="text-secondary small">{{ p.categoryName || 'Unassigned' }}</div>
                  <small class="text-muted">{{ p.brand || '-' }}</small>
                </td>
                <td>
                  <!-- Prominent Price Display in Table -->
                  <div class="fs-6 fw-bold text-success font-monospace">
                    {{ p.currency || defaultCurrency }} {{ (p.price || 0) | number:'1.2-2' }}
                  </div>
                  <small class="text-muted text-xs">per {{ p.unit }}</small>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span class="fw-bold" [ngClass]="{
                      'text-danger': p.currentStock === 0,
                      'text-warning': p.currentStock > 0 && p.currentStock <= p.reorderLevel,
                      'text-success': p.currentStock > p.reorderLevel
                    }">{{ p.currentStock }}</span>
                    <span *ngIf="p.currentStock <= p.reorderLevel && p.currentStock > 0" class="badge badge-glow-warning text-xs">Low Stock</span>
                    <span *ngIf="p.currentStock === 0" class="badge badge-glow-danger text-xs">Out of Stock</span>
                  </div>
                </td>
                <td class="text-secondary small">{{ p.reorderLevel }} units</td>
                <td>
                  <span *ngIf="p.expiryTrackingEnabled" class="badge badge-glow-warning text-xs">
                    <i class="bi bi-clock-history me-1"></i> FEFO Expiry
                  </span>
                  <span *ngIf="!p.expiryTrackingEnabled" class="badge bg-secondary text-xs">Standard</span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <!-- Check Price Quick Button -->
                    <button (click)="viewPriceDetail(p)" class="btn btn-glass text-success" title="View Price Card">
                      <i class="bi bi-tag-fill"></i>
                    </button>
                    <!-- View/Print Barcode Sticker -->
                    <button (click)="viewBarcode(p)" class="btn btn-glass text-info" title="Barcode & Price Sticker">
                      <i class="bi bi-upc"></i>
                    </button>
                    <!-- QR Code -->
                    <button (click)="viewQr(p)" class="btn btn-glass text-primary" title="View QR Code">
                      <i class="bi bi-qr-code"></i>
                    </button>
                    <!-- Edit Product -->
                    <button (click)="openEditModal(p)" class="btn btn-glass text-warning" title="Edit Product, Price & Barcode">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <!-- Delete Product -->
                    <button (click)="deleteProduct(p)" class="btn btn-glass text-danger" title="Delete Product">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div *ngIf="showAddModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content glass-panel border-0 p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">
                <i class="bi" [ngClass]="isEditing ? 'bi-pencil-square text-warning' : 'bi-plus-circle text-primary'"></i>
                {{ isEditing ? 'Edit Product & Price' : 'Add New Product' }}
              </h5>
              <button (click)="showAddModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="saveProduct()">
              <div class="row g-3 mb-3">
                <div class="col-md-8">
                  <label class="form-label text-secondary small fw-semibold">Product Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.name" name="name" required placeholder="e.g. Basmati Rice 5kg">
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">SKU Code *</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.sku" name="sku" required placeholder="RICE-001">
                </div>
              </div>

              <div class="row g-3 mb-3">
                <!-- Barcode with Auto-Generate helper -->
                <div class="col-md-6">
                  <div class="d-flex align-items-center justify-content-between">
                    <label class="form-label text-secondary small fw-semibold mb-1">Barcode (Optional)</label>
                    <button type="button" (click)="autoGenerateBarcode()" class="btn btn-link text-info text-decoration-none p-0 text-xs">
                      <i class="bi bi-magic me-1"></i> Auto-Generate Barcode
                    </button>
                  </div>
                  <div class="input-group">
                    <span class="input-group-text bg-dark border-secondary text-secondary"><i class="bi bi-upc"></i></span>
                    <input type="text" class="form-control" [(ngModel)]="newProduct.barcode" name="barcode" placeholder="e.g. 890123456789 or scan barcode here">
                  </div>
                  <small class="text-muted text-xs">You can also scan directly using your USB barcode scanner</small>
                </div>

                <!-- Category -->
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Category</label>
                  <select class="form-select" [(ngModel)]="newProduct.categoryId" name="categoryId">
                    <option [ngValue]="null">Select Category</option>
                    <option *ngFor="let cat of categories()" [ngValue]="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <!-- Currency & Price -->
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Price / விற்பனை விலை *</label>
                  <div class="input-group">
                    <select class="form-select bg-dark text-light border-secondary" style="max-width: 95px;" [(ngModel)]="newProduct.currency" name="currency">
                      <option *ngFor="let c of availableCurrencies" [value]="c.symbol">{{ c.symbol }}</option>
                    </select>
                    <input type="number" step="0.01" min="0" class="form-control text-success fw-bold" [(ngModel)]="newProduct.price" name="price" placeholder="0.00" required>
                  </div>
                </div>

                <div class="col-md-3">
                  <label class="form-label text-secondary small fw-semibold">Brand</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.brand" name="brand" placeholder="Brand name">
                </div>
                <div class="col-md-2">
                  <label class="form-label text-secondary small fw-semibold">Unit</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.unit" name="unit" placeholder="PCS, KG">
                </div>
                <div class="col-md-3">
                  <label class="form-label text-secondary small fw-semibold">Reorder Point *</label>
                  <input type="number" class="form-control" [(ngModel)]="newProduct.reorderLevel" name="reorderLevel" required>
                </div>
              </div>

              <div class="form-check form-switch mb-4">
                <input class="form-check-input" type="checkbox" id="expirySwitch" [(ngModel)]="newProduct.expiryTrackingEnabled" name="expiryTrackingEnabled">
                <label class="form-check-label text-light small fw-semibold" for="expirySwitch">
                  Enable FEFO Batch & Expiry Date Tracking
                </label>
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showAddModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" class="btn btn-glow-primary">{{ isEditing ? 'Update Product' : 'Save Product' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Quick Price Card Modal (Shows immediately upon Barcode Scan) -->
      <div *ngIf="showPriceModal" class="modal d-block" style="background: rgba(0,0,0,0.8); z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;">
          <div class="modal-content glass-panel border border-success border-opacity-50 p-4 text-center">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1">
                <i class="bi bi-check-circle-fill me-1"></i> Barcode Verified
              </span>
              <button (click)="showPriceModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <h4 class="fw-bold text-light mb-1 mt-2">{{ lookedUpProduct?.name }}</h4>
            <div class="text-secondary small mb-3">
              SKU: <span class="font-monospace text-primary">{{ lookedUpProduct?.sku }}</span>
              <span *ngIf="lookedUpProduct?.barcode"> &bull; Barcode: <span class="font-monospace text-light">{{ lookedUpProduct?.barcode }}</span></span>
            </div>

            <!-- Glowing Price Box -->
            <div class="p-3 rounded-3 my-3 shadow" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 78, 59, 0.35)); border: 2px solid #10b981;">
              <small class="text-uppercase text-success fw-bold tracking-wider d-block">Selling Price / விலை</small>
              <div class="display-4 fw-bolder text-light font-monospace my-1">
                <span class="text-success">{{ lookedUpProduct?.currency || defaultCurrency }}</span> {{ (lookedUpProduct?.price || 0) | number:'1.2-2' }}
              </div>
              <small class="text-light text-opacity-75">Per {{ lookedUpProduct?.unit || 'Unit' }} &bull; Tax Incl.</small>
            </div>

            <div class="row g-2 text-start mb-3">
              <div class="col-6">
                <div class="p-2 bg-dark rounded border border-secondary border-opacity-20 text-center">
                  <small class="text-secondary text-xs d-block">Current Stock</small>
                  <strong class="fs-5 text-light">{{ lookedUpProduct?.currentStock }} {{ lookedUpProduct?.unit }}</strong>
                </div>
              </div>
              <div class="col-6">
                <div class="p-2 bg-dark rounded border border-secondary border-opacity-20 text-center">
                  <small class="text-secondary text-xs d-block">Brand / Category</small>
                  <strong class="fs-6 text-light">{{ lookedUpProduct?.brand || lookedUpProduct?.categoryName || '-' }}</strong>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-center gap-2">
              <button (click)="viewBarcode(lookedUpProduct!)" class="btn btn-outline-info btn-sm">
                <i class="bi bi-printer me-1"></i> Print Sticker
              </button>
              <button (click)="showPriceModal = false" class="btn btn-glass btn-sm">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Realistic Barcode & Price Tag Sticker Modal -->
      <div *ngIf="showCodeModal" class="modal d-block" style="background: rgba(0,0,0,0.8); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
          <div class="modal-content glass-panel text-center p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold text-light mb-0">{{ codeModalTitle }}</h5>
              <button (click)="showCodeModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <!-- Professional Printable Sticker Label -->
            <div id="printable-sticker" class="bg-white text-dark p-3 rounded-3 shadow-lg mx-auto mb-3 border border-dark" style="max-width: 320px; text-align: center;">
              <div class="fw-bold text-uppercase text-truncate" style="font-size: 0.95rem; letter-spacing: 0.5px;">
                {{ activeProduct?.name }}
              </div>
              <div class="text-muted small mb-2 font-monospace">
                SKU: {{ activeProduct?.sku }} <span *ngIf="activeProduct?.brand">&bull; {{ activeProduct?.brand }}</span>
              </div>

              <div class="my-2 d-flex justify-content-center">
                <img [src]="codeImageBase64" alt="Barcode Image" class="img-fluid" style="max-height: 95px;">
              </div>

              <div class="font-monospace fw-bold text-dark small mb-2" *ngIf="activeProduct?.barcode">
                {{ activeProduct?.barcode }}
              </div>

              <!-- Big Bold Price Tag on Sticker -->
              <div class="pt-2 border-top border-dark border-opacity-50 d-flex align-items-center justify-content-between px-2">
                <span class="text-uppercase small fw-bold text-muted">PRICE:</span>
                <span class="fs-4 fw-bolder text-dark font-monospace">
                  {{ activeProduct?.currency || defaultCurrency }} {{ (activeProduct?.price || 0) | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <div class="d-flex justify-content-center gap-2">
              <button (click)="printSticker()" class="btn btn-glow-primary">
                <i class="bi bi-printer me-1"></i> Print Sticker Label
              </button>
              <button (click)="showCodeModal = false" class="btn btn-glass">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Excel Import Modal -->
      <div *ngIf="showImportModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Import Products (Excel .xlsx)</h5>
              <button (click)="showImportModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <p class="text-secondary small">Upload an Excel spreadsheet with columns: <code>Name, SKU, Barcode, Brand, Unit</code>.</p>

            <input type="file" class="form-control mb-3" (change)="onFileSelected($event)" accept=".xlsx">

            <div class="d-flex justify-content-end gap-2">
              <button type="button" (click)="showImportModal = false" class="btn btn-glass">Cancel</button>
              <button type="button" (click)="uploadExcel()" [disabled]="!selectedFile" class="btn btn-glow-primary">Upload & Import</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  searchQuery = '';
  selectedCategory = '';
  quickBarcode = '';
  exportUrl = '';

  availableCurrencies = [
    { symbol: 'Rs.', code: 'LKR - Sri Lanka' },
    { symbol: '$', code: 'USD - US Dollar' },
    { symbol: '₹', code: 'INR - India' },
    { symbol: '€', code: 'EUR - Euro' },
    { symbol: '£', code: 'GBP - UK Pound' },
    { symbol: 'AED', code: 'AED - UAE Dirham' },
    { symbol: 'SAR', code: 'SAR - Saudi Riyal' },
    { symbol: 'QAR', code: 'QAR - Qatar' },
    { symbol: 'KWD', code: 'KWD - Kuwait' },
    { symbol: 'BHD', code: 'BHD - Bahrain' },
    { symbol: 'OMR', code: 'OMR - Oman' },
    { symbol: 'RM', code: 'MYR - Malaysia' },
    { symbol: 'S$', code: 'SGD - Singapore' },
    { symbol: 'C$', code: 'CAD - Canada' },
    { symbol: 'A$', code: 'AUD - Australia' }
  ];
  defaultCurrency = localStorage.getItem('wms_currency') || 'Rs.';

  showAddModal = false;
  showCodeModal = false;
  showPriceModal = false;
  showImportModal = false;
  isEditing = false;
  editingId: number | null = null;
  codeModalTitle = '';
  codeImageBase64 = '';
  activeProduct: Product | null = null;
  lookedUpProduct: Product | null = null;
  selectedFile: File | null = null;

  newProduct: Partial<Product> = {
    name: '',
    sku: '',
    barcode: '',
    price: 0,
    currency: this.defaultCurrency,
    categoryId: undefined,
    brand: '',
    unit: 'PCS',
    reorderLevel: 10,
    minStockLevel: 5,
    maxStockLevel: 1000,
    expiryTrackingEnabled: false
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.exportUrl = this.wmsApi.exportProductsExcelUrl();
    this.loadProducts();
    this.loadCategories();
  }

  onDefaultCurrencyChange() {
    localStorage.setItem('wms_currency', this.defaultCurrency);
    if (this.newProduct) {
      this.newProduct.currency = this.defaultCurrency;
    }
  }

  loadProducts() {
    this.wmsApi.getProducts(this.searchQuery).subscribe({
      next: (res) => {
        if (res.success && res.data?.content) {
          this.products.set(res.data.content);
        }
      }
    });
  }

  loadCategories() {
    this.wmsApi.getCategories().subscribe({
      next: (res) => {
        if (res.success) this.categories.set(res.data);
      }
    });
  }

  onSearch() {
    this.loadProducts();
  }

  onFilterCategory() {
    if (!this.selectedCategory) {
      this.loadProducts();
    } else {
      const catId = Number(this.selectedCategory);
      this.products.update(list => list.filter(p => p.categoryId === catId));
    }
  }

  playBeep() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  checkPriceDirect() {
    if (!this.quickBarcode || !this.quickBarcode.trim()) return;
    const code = this.quickBarcode.trim();
    this.wmsApi.scanProductCode(code).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.playBeep();
          this.lookedUpProduct = res.data;
          this.showPriceModal = true;
          this.quickBarcode = '';
        }
      },
      error: () => {
        alert('No product found for Barcode / SKU: ' + code);
      }
    });
  }

  viewPriceDetail(p: Product) {
    this.lookedUpProduct = p;
    this.showPriceModal = true;
  }

  openScannerModal() {
    // Navigate or prompt barcode
    const code = prompt('Scan barcode with your scanner or type SKU / Barcode:');
    if (code && code.trim()) {
      this.quickBarcode = code.trim();
      this.checkPriceDirect();
    }
  }

  autoGenerateBarcode() {
    // Generate 12-digit standard barcode prefix 890 + 9 digits
    const rand = Math.floor(100000000 + Math.random() * 900000000).toString();
    this.newProduct.barcode = '890' + rand;
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = null;
    this.newProduct = {
      name: '',
      sku: '',
      barcode: '',
      price: 0,
      currency: this.defaultCurrency,
      categoryId: undefined,
      brand: '',
      unit: 'PCS',
      reorderLevel: 10,
      minStockLevel: 5,
      maxStockLevel: 1000,
      expiryTrackingEnabled: false
    };
    this.showAddModal = true;
  }

  openEditModal(p: Product) {
    this.isEditing = true;
    this.editingId = p.id;
    this.newProduct = {
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      price: p.price || 0,
      currency: p.currency || this.defaultCurrency,
      categoryId: p.categoryId,
      brand: p.brand || '',
      unit: p.unit || 'PCS',
      reorderLevel: p.reorderLevel,
      minStockLevel: p.minStockLevel,
      maxStockLevel: p.maxStockLevel,
      expiryTrackingEnabled: p.expiryTrackingEnabled
    };
    this.showAddModal = true;
  }

  openCategoryModal() {
    const catName = prompt('Enter new Category Name:');
    if (catName && catName.trim()) {
      this.wmsApi.createCategory({ name: catName.trim() }).subscribe({
        next: () => this.loadCategories()
      });
    }
  }

  saveProduct() {
    if (this.isEditing && this.editingId) {
      this.wmsApi.updateProduct(this.editingId, this.newProduct).subscribe({
        next: () => {
          this.showAddModal = false;
          this.loadProducts();
        },
        error: (err) => alert(err.error?.message || 'Failed to update product')
      });
    } else {
      this.wmsApi.createProduct(this.newProduct).subscribe({
        next: () => {
          this.showAddModal = false;
          this.loadProducts();
        },
        error: (err) => alert(err.error?.message || 'Failed to save product')
      });
    }
  }

  deleteProduct(p: Product) {
    if (!confirm(`Are you sure you want to delete "${p.name}" (${p.sku})?\n\nThis will permanently remove the product along with its inventory stock balances and movement ledger records.`)) {
      return;
    }
    this.wmsApi.deleteProduct(p.id).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => alert(err.error?.message || 'Failed to delete product')
    });
  }

  viewQr(p: Product) {
    this.activeProduct = p;
    this.codeModalTitle = 'Product QR Code';
    this.wmsApi.getProductQrImage(p.id).subscribe({
      next: (res) => {
        this.codeImageBase64 = res.data;
        this.showCodeModal = true;
      }
    });
  }

  viewBarcode(p: Product) {
    this.activeProduct = p;
    this.codeModalTitle = 'Product Barcode & Price Sticker';
    this.wmsApi.getProductBarcodeImage(p.id).subscribe({
      next: (res) => {
        this.codeImageBase64 = res.data;
        this.showCodeModal = true;
        if (this.showPriceModal) {
          this.showPriceModal = false;
        }
      }
    });
  }

  printSticker() {
    const printWindow = window.open('', '_blank', 'width=450,height=500');
    if (printWindow && this.activeProduct) {
      const p = this.activeProduct;
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode Price Sticker - ${p.name}</title>
            <style>
              @page { size: auto; margin: 4mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; margin: 0; padding: 12px; }
              .sticker { border: 2px dashed #222; padding: 14px; border-radius: 8px; max-width: 320px; margin: 0 auto; }
              .prod-name { font-size: 15px; font-weight: 800; margin-bottom: 2px; text-transform: uppercase; }
              .sku { font-size: 11px; color: #555; font-family: monospace; margin-bottom: 8px; }
              img { max-height: 85px; width: auto; margin: 6px 0; }
              .barcode-num { font-family: monospace; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
              .price-tag { border-top: 2px solid #000; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="sticker">
              <div class="prod-name">${p.name}</div>
              <div class="sku">SKU: ${p.sku} ${p.brand ? '• ' + p.brand : ''}</div>
              <img src="${this.codeImageBase64}" />
              <div class="barcode-num">${p.barcode || p.sku}</div>
              <div class="price-tag">
                <span>PRICE:</span>
                <span>${p.currency || this.defaultCurrency} ${Number(p.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  openImportModal() {
    this.selectedFile = null;
    this.showImportModal = true;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadExcel() {
    if (!this.selectedFile) return;
    this.wmsApi.importProductsExcel(this.selectedFile).subscribe({
      next: (res) => {
        alert(res.message || 'Import completed');
        this.showImportModal = false;
        this.loadProducts();
      },
      error: (err) => alert(err.error?.message || 'Failed to import Excel')
    });
  }
}
