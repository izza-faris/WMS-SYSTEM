import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Category, Product } from '../../models/wms.models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page animate__animated animate__fadeIn">
      <!-- Top Title & Actions -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Products & Catalog</h2>
          <p class="text-secondary small mb-0">Manage items, barcodes, QR tags, reorder thresholds & categories</p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2">
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

      <!-- Search & Filters -->
      <div class="glass-panel p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search by SKU, Product Name, Barcode, Brand...">
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="selectedCategory" (change)="onFilterCategory()">
              <option value="">All Categories</option>
              <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button (click)="openCategoryModal()" class="btn btn-glass w-100 btn-sm py-2">
              <i class="bi bi-tags me-1"></i> Categories
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
                <th>SKU</th>
                <th>Category / Brand</th>
                <th>Stock Level</th>
                <th>Reorder Point</th>
                <th>Tracking</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="products().length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
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
                </td>
                <td>
                  <div class="text-secondary small">{{ p.categoryName || 'Unassigned' }}</div>
                  <small class="text-muted">{{ p.brand || '-' }}</small>
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
                    <button (click)="viewQr(p)" class="btn btn-glass" title="View QR Code">
                      <i class="bi bi-qr-code text-info"></i>
                    </button>
                    <button (click)="viewBarcode(p)" class="btn btn-glass" title="View Barcode">
                      <i class="bi bi-upc text-success"></i>
                    </button>
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
              <h5 class="fw-bold text-light mb-0">Add New Product</h5>
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
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Barcode (Optional)</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.barcode" name="barcode" placeholder="890123456789">
                </div>
                <div class="col-md-6">
                  <label class="form-label text-secondary small fw-semibold">Category</label>
                  <select class="form-select" [(ngModel)]="newProduct.categoryId" name="categoryId">
                    <option [ngValue]="null">Select Category</option>
                    <option *ngFor="let cat of categories()" [ngValue]="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Brand</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.brand" name="brand" placeholder="Brand name">
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Unit of Measure</label>
                  <input type="text" class="form-control" [(ngModel)]="newProduct.unit" name="unit" placeholder="PCS, BAG, KG, L">
                </div>
                <div class="col-md-4">
                  <label class="form-label text-secondary small fw-semibold">Reorder Threshold *</label>
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
                <button type="submit" class="btn btn-glow-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- QR / Barcode Preview Modal -->
      <div *ngIf="showCodeModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 380px;">
          <div class="modal-content glass-panel text-center p-4">
            <h5 class="fw-bold text-light mb-1">{{ codeModalTitle }}</h5>
            <p class="text-secondary small mb-3">{{ activeProduct?.name }} ({{ activeProduct?.sku }})</p>

            <div class="bg-white p-3 rounded-3 d-inline-block mx-auto mb-3">
              <img [src]="codeImageBase64" alt="Code Image" class="img-fluid" style="max-height: 200px;">
            </div>

            <div class="d-flex justify-content-center gap-2">
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
  exportUrl = '';

  showAddModal = false;
  showCodeModal = false;
  showImportModal = false;
  codeModalTitle = '';
  codeImageBase64 = '';
  activeProduct: Product | null = null;
  selectedFile: File | null = null;

  newProduct: Partial<Product> = {
    name: '',
    sku: '',
    barcode: '',
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
    // Client-side filtering or reload
    if (!this.selectedCategory) {
      this.loadProducts();
    } else {
      const catId = Number(this.selectedCategory);
      this.products.update(list => list.filter(p => p.categoryId === catId));
    }
  }

  openAddModal() {
    this.newProduct = {
      name: '',
      sku: '',
      barcode: '',
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

  openCategoryModal() {
    const catName = prompt('Enter new Category Name:');
    if (catName && catName.trim()) {
      this.wmsApi.createCategory({ name: catName.trim() }).subscribe({
        next: () => this.loadCategories()
      });
    }
  }

  saveProduct() {
    this.wmsApi.createProduct(this.newProduct).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadProducts();
      },
      error: (err) => alert(err.error?.message || 'Failed to save product')
    });
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
    this.codeModalTitle = 'Product Barcode';
    this.wmsApi.getProductBarcodeImage(p.id).subscribe({
      next: (res) => {
        this.codeImageBase64 = res.data;
        this.showCodeModal = true;
      }
    });
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
