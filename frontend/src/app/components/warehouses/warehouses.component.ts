import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Branch, Warehouse, WarehouseTree, Zone, Rack, Shelf, Bin } from '../../models/wms.models';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="warehouses-page animate__animated animate__fadeIn">
      <!-- Title & Warehouse Selector -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Spatial Warehouse Storage Layout</h2>
          <p class="text-secondary small mb-0">5-Level Hierarchy: Warehouse -> Zone -> Rack -> Shelf -> Bin location QR tags</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button (click)="openCreateWhModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
            <i class="bi bi-building-add"></i>
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      <!-- Facility Cards / Selector -->
      <div *ngIf="warehouses().length === 0" class="glass-panel p-5 text-center mb-4">
        <i class="bi bi-building-slash fs-1 text-secondary d-block mb-3"></i>
        <h5 class="text-light fw-bold">No Warehouses Configured Yet</h5>
        <p class="text-muted small mb-3">Get started by creating your first storage facility or branch warehouse.</p>
        <button (click)="openCreateWhModal()" class="btn btn-glow-primary btn-sm">
          <i class="bi bi-plus-lg me-1"></i> Add First Warehouse
        </button>
      </div>

      <div *ngIf="warehouses().length > 0" class="row g-3 mb-4">
        <div *ngFor="let wh of warehouses()" class="col-md-6 col-lg-4">
          <div class="glass-panel p-3 glass-card-interactive" 
               [style.border-color]="selectedWarehouseId === wh.id ? 'var(--primary)' : 'rgba(255,255,255,0.08)'"
               (click)="selectWarehouse(wh.id)">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge bg-primary bg-opacity-20 text-primary">{{ wh.code }}</span>
              <span class="badge" [ngClass]="wh.isActive ? 'badge-glow-success' : 'bg-secondary'">{{ wh.isActive ? 'Active' : 'Inactive' }}</span>
            </div>
            <h5 class="fw-bold text-light mb-1">{{ wh.name }}</h5>
            <div class="text-secondary small mb-1"><i class="bi bi-geo-alt me-1"></i>{{ wh.branchName || 'Regional Hub' }}</div>
            <small class="text-muted text-xs">{{ wh.address || 'No address specified' }}</small>
          </div>
        </div>
      </div>

      <!-- Spatial Hierarchy Tree View -->
      <div *ngIf="activeTree()" class="glass-panel p-4 mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pb-3 border-bottom border-secondary border-opacity-10">
          <div>
            <h4 class="fw-bold text-light mb-1"><i class="bi bi-diagram-3 text-info me-2"></i>{{ activeTree()?.name }} ({{ activeTree()?.code }})</h4>
            <span class="text-secondary small">Visual physical layout and Location Bin QR codes</span>
          </div>

          <button (click)="openAddZoneModal()" class="btn btn-glass btn-sm text-info">
            <i class="bi bi-plus-circle me-1"></i> Add Zone
          </button>
        </div>

        <div *ngIf="activeTree()?.zones?.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-grid-3x3-gap fs-1 text-secondary d-block mb-2"></i>
          No storage zones defined yet for this warehouse. Click "Add Zone" to start mapping.
        </div>

        <!-- Zones Accordion / Cards -->
        <div class="row g-4">
          <div *ngFor="let zone of activeTree()?.zones" class="col-lg-6">
            <div class="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-20 h-100">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span class="badge bg-info bg-opacity-20 text-info me-2">Zone {{ zone.code }}</span>
                  <span class="fw-bold text-light">{{ zone.name }}</span>
                </div>
                <button (click)="openAddRackModal(zone.id)" class="btn btn-glass btn-sm py-1 px-2 text-xs text-secondary">
                  <i class="bi bi-plus-lg"></i> Rack
                </button>
              </div>
              <p class="text-muted text-xs mb-3">{{ zone.description || 'General storage zone' }}</p>

              <!-- Racks Inside Zone -->
              <div class="d-flex flex-column gap-2">
                <div *ngFor="let rack of zone.racks" class="p-2 bg-dark bg-opacity-75 rounded border border-secondary border-opacity-15">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge bg-secondary text-xs">Rack {{ rack.code }}</span>
                    <button (click)="openAddShelfModal(rack.id)" class="btn btn-link btn-sm p-0 text-xs text-primary text-decoration-none">+ Shelf</button>
                  </div>

                  <!-- Shelves Inside Rack -->
                  <div class="row g-2 mt-1">
                    <div *ngFor="let shelf of rack.shelves" class="col-12">
                      <div class="p-2 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-10">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <small class="text-secondary fw-semibold">Shelf {{ shelf.code }}</small>
                          <button (click)="openAddBinModal(shelf.id)" class="btn btn-link btn-sm p-0 text-xs text-success text-decoration-none">+ Bin (QR)</button>
                        </div>

                        <!-- Bins Inside Shelf -->
                        <div class="d-flex flex-wrap gap-2">
                          <div *ngFor="let bin of shelf.bins" class="p-2 bg-dark rounded border border-secondary border-opacity-25 d-flex align-items-center gap-2">
                            <i class="bi bi-qr-code text-warning"></i>
                            <div>
                              <div class="text-light fw-bold text-xs">{{ bin.code }}</div>
                              <div class="text-muted text-xs font-monospace" style="font-size: 0.65rem;">{{ bin.qrCode }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Warehouse Modal with Searchable Branch -->
      <div *ngIf="showWhModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Add Warehouse</h5>
              <button (click)="showWhModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="saveWarehouse()">
              <!-- Searchable Branch Selector (No plain dropdown!) -->
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold d-flex align-items-center justify-content-between">
                  <span>Branch (Search or Create) *</span>
                  <span *ngIf="selectedBranchObj" class="text-success text-xs"><i class="bi bi-check-circle-fill me-1"></i>Selected: {{ selectedBranchObj.branchName }}</span>
                </label>

                <!-- Search Input Box -->
                <div class="input-group mb-2">
                  <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control" 
                         [(ngModel)]="branchSearchQuery" 
                         name="branchSearch" 
                         (input)="onBranchSearchInput()"
                         (focus)="showBranchDropdown = true"
                         placeholder="Type to search branch (e.g. Jaffna, Colombo)...">
                  <button *ngIf="selectedBranchObj" type="button" class="btn btn-sm btn-outline-secondary" (click)="clearSelectedBranch()">
                    <i class="bi bi-x"></i>
                  </button>
                </div>

                <!-- Filtered Branch Results List -->
                <div *ngIf="showBranchDropdown" class="p-2 bg-dark rounded border border-secondary border-opacity-25 mb-2 shadow-sm" style="max-height: 180px; overflow-y: auto;">
                  <div *ngFor="let b of filteredBranches()" 
                       (click)="selectBranch(b)"
                       class="p-2 rounded d-flex align-items-center justify-content-between cursor-pointer hover-bg-secondary mb-1"
                       [class.bg-primary]="newWh.branchId === b.id"
                       [class.bg-opacity-25]="newWh.branchId === b.id"
                       style="cursor: pointer;">
                    <div>
                      <div class="text-light small fw-bold">{{ b.branchName }}</div>
                      <small class="text-muted text-xs">{{ b.branchCode }} &bull; {{ b.address || 'No address' }}</small>
                    </div>
                    <span class="badge bg-secondary text-xs">Select</span>
                  </div>

                  <!-- Option to create a new branch if not found -->
                  <div *ngIf="filteredBranches().length === 0 || branchSearchQuery.trim()" class="pt-2 border-top border-secondary border-opacity-25">
                    <button type="button" (click)="quickCreateBranch(branchSearchQuery)" class="btn btn-sm btn-outline-primary w-100 text-start d-flex align-items-center justify-content-between">
                      <span><i class="bi bi-plus-circle me-1"></i> Create new branch: <strong>"{{ branchSearchQuery || 'Main Branch' }}"</strong></span>
                      <span class="badge bg-primary">Instant Add</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Warehouse Name *</label>
                <input type="text" class="form-control" [(ngModel)]="newWh.name" name="name" required placeholder="Jaffna Central Warehouse">
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Warehouse Code *</label>
                <input type="text" class="form-control" [(ngModel)]="newWh.code" name="code" required placeholder="JAF-WH01">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small fw-semibold">Address</label>
                <input type="text" class="form-control" [(ngModel)]="newWh.address" name="address" placeholder="e.g. Hospital Road, Jaffna, Sri Lanka">
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showWhModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" [disabled]="!newWh.branchId" class="btn btn-glow-primary">Save Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WarehousesComponent implements OnInit {
  warehouses = signal<Warehouse[]>([]);
  branches = signal<Branch[]>([]);
  activeTree = signal<WarehouseTree | null>(null);
  selectedWarehouseId: number | null = null;
  showWhModal = false;

  branchSearchQuery = '';
  showBranchDropdown = false;
  selectedBranchObj: Branch | null = null;

  newWh: Partial<Warehouse> = { name: '', code: '', address: '', branchId: undefined, isActive: true };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadBranches();
  }

  loadWarehouses() {
    this.wmsApi.getWarehouses().subscribe({
      next: (res) => {
        if (res.success) {
          this.warehouses.set(res.data);
          if (res.data.length > 0 && !this.selectedWarehouseId) {
            this.selectWarehouse(res.data[0].id);
          }
        }
      }
    });
  }

  loadBranches() {
    this.wmsApi.getBranches().subscribe(res => {
      if (res.success) {
        this.branches.set(res.data);
        if (res.data.length > 0 && !this.newWh.branchId) {
          this.selectBranch(res.data[0]);
        }
      }
    });
  }

  filteredBranches(): Branch[] {
    const q = this.branchSearchQuery.toLowerCase().trim();
    if (!q) return this.branches();
    return this.branches().filter(b => 
      b.branchName.toLowerCase().includes(q) || 
      b.branchCode.toLowerCase().includes(q) || 
      (b.address && b.address.toLowerCase().includes(q))
    );
  }

  onBranchSearchInput() {
    this.showBranchDropdown = true;
  }

  selectBranch(b: Branch) {
    this.selectedBranchObj = b;
    this.newWh.branchId = b.id;
    this.branchSearchQuery = b.branchName;
    this.showBranchDropdown = false;
  }

  clearSelectedBranch() {
    this.selectedBranchObj = null;
    this.newWh.branchId = undefined;
    this.branchSearchQuery = '';
    this.showBranchDropdown = true;
  }

  quickCreateBranch(name: string) {
    const branchName = (name && name.trim()) ? name.trim() : 'Main Branch';
    const code = branchName.substring(0, 3).toUpperCase() + '-BR01';
    
    this.wmsApi.createBranch({ branchName, branchCode: code, address: '', phone: '', isActive: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branches.update(list => [...list, res.data]);
          this.selectBranch(res.data);
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to create branch')
    });
  }

  selectWarehouse(id: number) {
    this.selectedWarehouseId = id;
    this.wmsApi.getWarehouseTree(id).subscribe({
      next: (res) => { if (res.success) this.activeTree.set(res.data); }
    });
  }

  openCreateWhModal() {
    this.newWh = { name: '', code: '', address: '', branchId: this.branches()[0]?.id, isActive: true };
    this.branchSearchQuery = this.branches()[0]?.branchName || '';
    this.selectedBranchObj = this.branches()[0] || null;
    this.showBranchDropdown = false;
    this.showWhModal = true;
  }

  saveWarehouse() {
    if (!this.newWh.branchId) {
      alert('Please search and select a branch (or create one) first!');
      return;
    }

    this.wmsApi.createWarehouse(this.newWh).subscribe({
      next: (res) => {
        this.showWhModal = false;
        this.loadWarehouses();
        if (res.data) {
          this.selectWarehouse(res.data.id);
        }
      },
      error: (err) => alert(err.error?.message || 'Failed to create warehouse')
    });
  }

  openAddZoneModal() {
    const code = prompt('Enter Zone Code (e.g. ZA, ZB):');
    const name = prompt('Enter Zone Name (e.g. Cold Storage, Dry Bulk):');
    if (code && name && this.selectedWarehouseId) {
      this.wmsApi.addZone(this.selectedWarehouseId, { code: code.trim(), name: name.trim(), description: '' }).subscribe({
        next: () => this.selectWarehouse(this.selectedWarehouseId!)
      });
    }
  }

  openAddRackModal(zoneId: number) {
    const code = prompt('Enter Rack Code (e.g. R01, R02):');
    if (code && this.selectedWarehouseId) {
      this.wmsApi.addRack(zoneId, { code: code.trim() }).subscribe({
        next: () => this.selectWarehouse(this.selectedWarehouseId!)
      });
    }
  }

  openAddShelfModal(rackId: number) {
    const code = prompt('Enter Shelf Code (e.g. S01, S02):');
    if (code && this.selectedWarehouseId) {
      this.wmsApi.addShelf(rackId, { code: code.trim() }).subscribe({
        next: () => this.selectWarehouse(this.selectedWarehouseId!)
      });
    }
  }

  openAddBinModal(shelfId: number) {
    const code = prompt('Enter Bin Code (e.g. B001, B002):');
    if (code && this.selectedWarehouseId) {
      this.wmsApi.addBin(shelfId, { code: code.trim(), capacityCubicMeters: 10 }).subscribe({
        next: () => this.selectWarehouse(this.selectedWarehouseId!)
      });
    }
  }
}
