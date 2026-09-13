import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WmsApiService } from '../../services/wms-api.service';
import { Branch, UserProfile } from '../../models/wms.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Team & Role Permissions</h2>
          <p class="text-secondary small mb-0">Manage client organization users, role assignments, and branch authorizations</p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2">
          <i class="bi bi-person-plus-fill"></i>
          <span>Invite User</span>
        </button>
      </div>

      <!-- Users Table -->
      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Assigned Branch</th>
                <th>Phone</th>
                <th class="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users()" class="animate__animated animate__fadeIn">
                <td>
                  <div class="fw-bold text-light">{{ u.fullName }}</div>
                  <small class="text-muted">{{ u.email }}</small>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-glow-danger': u.role === 'PLATFORM_ADMIN',
                    'badge-glow-primary': u.role === 'CLIENT_ADMIN',
                    'badge-glow-warning': u.role === 'BRANCH_MANAGER',
                    'badge-glow-success': u.role === 'WAREHOUSE_STAFF',
                    'bg-secondary': u.role === 'VIEWER'
                  }">{{ u.role }}</span>
                </td>
                <td class="text-secondary small">{{ u.branchName || 'All Branches (Enterprise)' }}</td>
                <td class="text-muted small">{{ u.phone || '-' }}</td>
                <td class="text-end">
                  <span class="badge bg-success bg-opacity-20 text-success">Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create User Modal -->
      <div *ngIf="showModal" class="modal d-block" style="background: rgba(0,0,0,0.75); z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content glass-panel p-4">
            <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <h5 class="fw-bold text-light mb-0">Add Team Member</h5>
              <button (click)="showModal = false" class="btn btn-sm text-secondary"><i class="bi bi-x-lg"></i></button>
            </div>

            <form (ngSubmit)="saveUser()">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Full Name *</label>
                <input type="text" class="form-control" [(ngModel)]="newUser.fullName" name="fullName" required placeholder="Jane Smith">
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Email *</label>
                <input type="email" class="form-control" [(ngModel)]="newUser.email" name="email" required placeholder="jane@company.com">
              </div>

              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label text-secondary small fw-semibold">Role *</label>
                  <select class="form-select" [(ngModel)]="newUser.role" name="role" required>
                    <option value="CLIENT_ADMIN">Client Admin</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    <option value="VIEWER">Viewer (Read-Only)</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label text-secondary small fw-semibold">Branch Assignment</label>
                  <input type="text" class="form-control" [(ngModel)]="newUser.branchSearch" list="userBranchList" name="branchSearch" placeholder="Type Branch (or All)">
                  <datalist id="userBranchList">
                    <option value="All Branches"></option>
                    <option *ngFor="let b of branches()" [value]="b.branchName">{{ b.branchName }}</option>
                  </datalist>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label text-secondary small fw-semibold">Password *</label>
                <input type="password" class="form-control" [(ngModel)]="newUser.password" name="password" required placeholder="Minimum 6 characters">
              </div>

              <div class="mb-4">
                <label class="form-label text-secondary small">Phone Number</label>
                <input type="text" class="form-control" [(ngModel)]="newUser.phone" name="phone" placeholder="+1 555-0188">
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" (click)="showModal = false" class="btn btn-glass">Cancel</button>
                <button type="submit" class="btn btn-glow-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users = signal<UserProfile[]>([]);
  branches = signal<Branch[]>([]);
  showModal = false;

  newUser: any = {
    fullName: '',
    email: '',
    role: 'WAREHOUSE_STAFF',
    branchId: null,
    branchSearch: '',
    password: '',
    phone: ''
  };

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.wmsApi.getBranches().subscribe(res => {
      if (res.success) this.branches.set(res.data);
    });
  }

  loadUsers() {
    this.wmsApi.getUsers().subscribe({
      next: (res) => {
        if (res.success) this.users.set(res.data);
      }
    });
  }

  openCreateModal() {
    this.newUser.branchSearch = '';
    this.showModal = true;
  }

  saveUser() {
    const term = (this.newUser.branchSearch || '').trim().toLowerCase();
    if (!term || term === 'all' || term === 'all branches' || term === 'all / none') {
      this.newUser.branchId = null;
    } else {
      const b = this.branches().find(branch => branch.branchName.toLowerCase() === term);
      this.newUser.branchId = b ? b.id : null;
    }

    const payload = {
      fullName: this.newUser.fullName,
      email: this.newUser.email,
      role: this.newUser.role,
      branchId: this.newUser.branchId,
      password: this.newUser.password,
      phone: this.newUser.phone
    };

    this.wmsApi.createUser(payload).subscribe({
      next: () => {
        this.showModal = false;
        alert('User created successfully!');
        this.loadUsers();
      },
      error: (err) => alert(err.error?.message || 'Failed to create user')
    });
  }
}
