import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Branch } from '../../models/wms.models';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branches-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Business Branches</h2>
          <p class="text-secondary small mb-0">Manage regional branches and assigned management teams</p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
          <i class="bi bi-plus-lg"></i>
          <span>Create Branch</span>
        </button>
      </div>

      <!-- Live Search Bar -->
      <div class="glass-panel p-3 mb-4">
        <div class="input-group">
          <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" [(ngModel)]="searchQuery" placeholder="Search branch by name (e.g. Jaffna, Colombo), branch code, or address...">
          <button *ngIf="searchQuery" class="btn btn-outline-secondary" (click)="searchQuery = ''"><i class="bi bi-x"></i></button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredBranches().length === 0" class="glass-panel p-5 text-center mb-4">
        <i class="bi bi-geo-alt-fill fs-1 text-secondary d-block mb-3"></i>
        <h5 class="text-light fw-bold">No Branches Found</h5>
        <p class="text-muted small mb-3">
          <span *ngIf="searchQuery">No branches match the search query "{{ searchQuery }}".</span>
          <span *ngIf="!searchQuery">Create your first branch to start organizing your warehouses.</span>
        </p>
        <button (click)="openCreateModal()" class="btn btn-glow-primary btn-sm">
          <i class="bi bi-plus-lg me-1"></i> Add Branch
        </button>
      </div>

      <!-- Branches Card Grid -->
      <div *ngIf="filteredBranches().length > 0" class="row g-4 mb-4">
        <div *ngFor="let b of filteredBranches()" class="col-md-6 col-lg-4">
          <div class="glass-panel p-4 h-100 position-relative animate__animated animate__fadeIn">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div class="bg-primary bg-opacity-10 text-primary rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="bi bi-geo-alt-fill fs-5"></i>
              </div>
              <span class="badge" [ngClass]="b.isActive ? 'badge-glow-success' : 'bg-secondary'">
                {{ b.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <h5 class="fw-bold text-light mb-1">{{ b.branchName }}</h5>
            <div class="text-primary font-monospace small mb-3">{{ b.branchCode }}</div>

            <div class="text-secondary small mb-2"><i class="bi bi-pin-map me-2"></i>{{ b.address || 'No address specified' }}</div>
            <div class="text-secondary small"><i class="bi bi-telephone me-2"></i>{{ b.phone || '-' }}</div>
          </div>
        </div>
      </div>

      <!-- Create Branch Modal -->
      <div *ngIf="showModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Create New Branch</h5>
              <button (click)="showModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="saveBranch()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Branch Name *</label>
                <input type="text" class="form-control" [(ngModel)]="newBranch.branchName" name="branchName" required placeholder="e.g. Jaffna Branch or Colombo Central">
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Branch Code *</label>
                <input type="text" class="form-control" [(ngModel)]="newBranch.branchCode" name="branchCode" required placeholder="e.g. JAF-BR01">
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Address</label>
                <input type="text" class="form-control" [(ngModel)]="newBranch.address" name="address" placeholder="Physical street address">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small fw-semibold">Phone</label>
                <input type="text" class="form-control" [(ngModel)]="newBranch.phone" name="phone" placeholder="+94 21 222 3344">
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" class="btn btn-glow-primary">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BranchesComponent implements OnInit {
  branches = signal<Branch[]>([]);
  searchQuery = '';
  showModal = false;

  newBranch: Partial<Branch> = {
    branchName: '',
    branchCode: '',
    address: '',
    phone: '',
    isActive: true
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches() {
    this.wmsApi.getBranches().subscribe({
      next: (res) => { if (res.success) this.branches.set(res.data); }
    });
  }

  filteredBranches(): Branch[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.branches();
    return this.branches().filter(b => 
      b.branchName.toLowerCase().includes(q) || 
      b.branchCode.toLowerCase().includes(q) || 
      (b.address && b.address.toLowerCase().includes(q))
    );
  }

  openCreateModal() {
    this.newBranch = { branchName: '', branchCode: '', address: '', phone: '', isActive: true };
    this.showModal = true;
  }

  saveBranch() {
    this.wmsApi.createBranch(this.newBranch).subscribe({
      next: () => {
        this.showModal = false;
        this.loadBranches();
      },
      error: (err) => alert(err.error?.message || 'Failed to create branch')
    });
  }
}
