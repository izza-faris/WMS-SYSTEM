import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { AuthService } from '../../services/auth.service';
import { Client, PlatformStats } from '../../models/wms.models';

@Component({
  selector: 'app-platform-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-vh-100 p-4 animate__animated animate__fadeIn position-relative" style="background-color: transparent;">
      <!-- Top Platform Bar -->
      <div class="glass-panel p-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 position-relative" style="overflow: hidden;">
        <div class="card-glow-rim"></div>

        <div class="d-flex align-items-center gap-3">
          <div class="bg-danger rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;">
            <i class="bi bi-shield-lock-fill fs-4 text-white"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <h3 class="fw-bold text-light mb-0">Platform Admin Center</h3>
              <span class="badge bg-danger text-white rounded-pill px-2.5 py-1 text-xs fw-bold shadow-sm">
                <i class="bi bi-shield-fill-check me-1"></i>Owner Only
              </span>
            </div>
            <span class="text-secondary small">Global tenant governance & onboarding approval</span>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3">
          <!-- Owner Security Settings Button -->
          <button (click)="openSecurityModal()" class="btn btn-glow-primary btn-sm d-flex align-items-center gap-2 border border-warning border-opacity-50 shadow-sm" id="ownerSecurityBtn">
            <i class="bi bi-key-fill text-warning fs-6"></i>
            <span class="fw-bold">Owner Email & Password Settings</span>
            <span class="badge bg-warning text-dark rounded-pill ms-1">Root</span>
          </button>

          <button (click)="logout()" class="btn btn-glass btn-sm text-danger d-flex align-items-center gap-1">
            <i class="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <!-- Owner Security Modal -->
      <div *ngIf="showSecurityModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn">
        <div class="glass-panel p-4 p-md-5 w-100 position-relative animate__animated animate__zoomIn" style="max-width: 540px; border: 1px solid rgba(99, 102, 241, 0.4); box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 50px rgba(99, 102, 241, 0.25);">
          <div class="card-glow-rim"></div>

          <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-primary rounded-3 d-flex align-items-center justify-content-center text-white" style="width: 40px; height: 40px;">
                <i class="bi bi-shield-lock fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-light mb-0">Owner Security & Credentials</h5>
                <span class="text-secondary small">Set your private email and secret password</span>
              </div>
            </div>
            <button (click)="closeSecurityModal()" class="btn btn-sm btn-glass text-secondary">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div *ngIf="securitySuccess" class="alert alert-success py-2 small mb-3 animate__animated animate__fadeIn">
            <i class="bi bi-check-circle-fill me-2"></i>{{ securitySuccess }}
          </div>

          <div *ngIf="securityError" class="alert alert-danger py-2 small mb-3 animate__animated animate__shakeX">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ securityError }}
          </div>

          <form (ngSubmit)="saveSecuritySettings()">
            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-envelope me-1 text-primary"></i> Owner Email Address
              </label>
              <input type="email" class="form-control" [(ngModel)]="securityForm.email" name="ownerEmail" required placeholder="izzafaris.it@gmail.com">
              <small class="text-muted text-xs">This is your private root login email. No tenant can see this.</small>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-lock me-1 text-warning"></i> Current Password
              </label>
              <input type="password" class="form-control" [(ngModel)]="securityForm.currentPassword" name="currentPassword" placeholder="Enter current password if changing">
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-key me-1 text-success"></i> New Password
                </label>
                <input type="password" class="form-control" [(ngModel)]="securityForm.newPassword" name="newPassword" placeholder="Minimum 6 characters">
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-check2-circle me-1 text-success"></i> Confirm Password
                </label>
                <input type="password" class="form-control" [(ngModel)]="securityForm.confirmPassword" name="confirmPassword" placeholder="Repeat new password">
              </div>
            </div>

            <div class="mb-3 pt-3 border-top border-secondary border-opacity-25">
              <label class="form-label text-secondary small fw-semibold d-flex align-items-center justify-content-between">
                <span><i class="bi bi-shield-lock-fill me-1 text-warning"></i> Owner Master PIN (Front-end Button Privacy Lock)</span>
                <span class="badge bg-danger text-white text-xs">Privacy Gate</span>
              </label>
              <input type="text" class="form-control text-warning fw-bold" [(ngModel)]="securityForm.ownerPin" name="ownerPin" placeholder="Owner Secret PIN (e.g. 2621)" maxlength="20">
              <small class="text-muted text-xs d-block mt-1">This Master PIN blocks strangers from clicking or opening the "Platform Admin Owner" button.</small>
              <div class="mt-2">
                <button type="button" (click)="revokeVerifiedDevices()" class="btn btn-glass btn-sm text-danger text-xs py-1">
                  <i class="bi bi-shield-slash me-1"></i> Lock All Devices (Require PIN everywhere)
                </button>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25">
              <button type="button" (click)="closeSecurityModal()" class="btn btn-glass btn-sm px-3">Cancel</button>
              <button type="submit" [disabled]="securityLoading" class="btn btn-glow-primary btn-sm px-4">
                <span *ngIf="securityLoading" class="spinner-border spinner-border-sm me-1"></span>
                <span *ngIf="!securityLoading"><i class="bi bi-shield-check me-1"></i></span>
                <span>Save New Credentials</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Platform Metrics Grid -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="glass-panel p-3">
            <div class="text-secondary small">Total Registered Businesses</div>
            <div class="kpi-number text-light">{{ stats()?.totalClients || 0 }}</div>
            <div class="text-muted text-xs mt-1">Platform Tenants</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="glass-panel p-3">
            <div class="text-secondary small">Active Subscriptions</div>
            <div class="kpi-number text-success">{{ stats()?.activeClients || 0 }}</div>
            <div class="text-success text-xs mt-1"><i class="bi bi-check-circle"></i> Operational</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="glass-panel p-3">
            <div class="text-secondary small">Pending Onboarding Requests</div>
            <div class="kpi-number text-warning">{{ stats()?.pendingClients || 0 }}</div>
            <div class="text-warning text-xs mt-1"><i class="bi bi-clock-history"></i> Awaiting Approval</div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="glass-panel p-3">
            <div class="text-secondary small">Total Warehouses</div>
            <div class="kpi-number text-info">{{ stats()?.totalWarehouses || 0 }}</div>
            <div class="text-muted text-xs mt-1">{{ stats()?.totalBranches || 0 }} Branches Mesh</div>
          </div>
        </div>
      </div>

      <!-- Pending Onboarding Approval Requests -->
      <div *ngIf="pendingClients().length > 0" class="glass-panel p-4 mb-4 border-warning border-opacity-50">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5 class="fw-bold text-warning mb-0">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>Action Required: Pending Business Approvals ({{ pendingClients().length }})
          </h5>
        </div>

        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Code</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Submitted Date</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let client of pendingClients()">
                <td class="fw-bold text-light">{{ client.companyName }}</td>
                <td><span class="badge bg-primary">{{ client.companyCode }}</span></td>
                <td>{{ client.email }}</td>
                <td>{{ client.phone }}</td>
                <td class="text-muted small">{{ client.createdAt | date:'mediumDate' }}</td>
                <td class="text-end">
                  <button (click)="updateStatus(client.id, 'ACTIVE')" class="btn btn-success btn-sm me-2">
                    <i class="bi bi-check-lg me-1"></i>Approve Onboarding
                  </button>
                  <button (click)="updateStatus(client.id, 'REJECTED')" class="btn btn-outline-danger btn-sm">
                    Reject
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- All Platform Businesses Table -->
      <div class="glass-panel p-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h5 class="fw-bold text-light mb-1">Registered Tenant Businesses</h5>
            <p class="text-secondary small mb-0">Full directory of active, pending, and suspended customer instances</p>
          </div>
          <button (click)="deleteAll()" class="btn btn-outline-danger btn-sm">
            <i class="bi bi-trash3-fill me-1"></i>Delete All Tenants
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Code</th>
                <th>Contact Email</th>
                <th>Status</th>
                <th>Negative Stock</th>
                <th class="text-end">Governance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let client of allClients()">
                <td class="text-muted">#{{ client.id }}</td>
                <td class="fw-bold text-light">{{ client.companyName }}</td>
                <td><span class="badge bg-dark border border-secondary">{{ client.companyCode }}</span></td>
                <td>{{ client.email }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-success': client.status === 'ACTIVE',
                    'bg-warning': client.status === 'PENDING',
                    'bg-danger': client.status === 'SUSPENDED' || client.status === 'REJECTED'
                  }">{{ client.status }}</span>
                </td>
                <td>
                  <span *ngIf="client.allowNegativeStock" class="badge bg-warning text-dark">Enabled</span>
                  <span *ngIf="!client.allowNegativeStock" class="badge bg-secondary">Disabled (Safe)</span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button *ngIf="client.status === 'ACTIVE'" (click)="updateStatus(client.id, 'SUSPENDED')" class="btn btn-outline-warning btn-sm">Suspend</button>
                    <button *ngIf="client.status === 'SUSPENDED' || client.status === 'REJECTED'" (click)="updateStatus(client.id, 'ACTIVE')" class="btn btn-outline-success btn-sm">Activate</button>
                    <button (click)="deleteClient(client.id, client.companyName)" class="btn btn-outline-danger btn-sm" title="Delete Company">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 2000;
    }

    .card-glow-rim {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #ef4444 0%, #6366f1 50%, #06b6d4 100%);
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
      border-radius: 12px 12px 0 0;
    }
  `]
})
export class PlatformAdminComponent implements OnInit {
  stats = signal<PlatformStats | null>(null);
  allClients = signal<Client[]>([]);
  pendingClients = signal<Client[]>([]);

  showSecurityModal = false;
  securityForm = {
    email: 'izzafaris.it@gmail.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    ownerPin: '2621'
  };
  securityLoading = false;
  securityError = '';
  securitySuccess = '';

  constructor(
    private wmsApi: WmsApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.route.queryParams.subscribe(params => {
      if (params['openSecurity'] === 'true') {
        setTimeout(() => this.openSecurityModal(), 150);
      }
    });
  }

  loadData() {
    this.wmsApi.getPlatformStats().subscribe({
      next: (res) => { if (res.success) this.stats.set(res.data); }
    });

    this.wmsApi.getPlatformClients().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) {
          const list: Client[] = res.data.content;
          this.allClients.set(list);
          this.pendingClients.set(list.filter(c => c.status === 'PENDING'));
        }
      }
    });
  }

  openSecurityModal() {
    const user = this.authService.currentUser();
    this.securityForm = {
      email: user?.email || 'izzafaris.it@gmail.com',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      ownerPin: localStorage.getItem('wms_owner_master_pin') || '2621'
    };
    this.securityError = '';
    this.securitySuccess = '';
    this.showSecurityModal = true;
  }

  closeSecurityModal() {
    this.showSecurityModal = false;
  }

  revokeVerifiedDevices() {
    localStorage.removeItem('wms_owner_device_verified');
    this.securitySuccess = 'All devices locked! Master PIN will be required on the next button click.';
    setTimeout(() => {
      this.securitySuccess = '';
    }, 3000);
  }

  saveSecuritySettings() {
    if (this.securityForm.newPassword) {
      if (this.securityForm.newPassword.length < 6) {
        this.securityError = 'New password must be at least 6 characters.';
        return;
      }
      if (this.securityForm.newPassword !== this.securityForm.confirmPassword) {
        this.securityError = 'New password and confirm password do not match.';
        return;
      }
    }

    // Save Master PIN locally
    if (this.securityForm.ownerPin && this.securityForm.ownerPin.trim()) {
      localStorage.setItem('wms_owner_master_pin', this.securityForm.ownerPin.trim());
    }

    this.securityLoading = true;
    this.securityError = '';
    this.securitySuccess = '';

    this.wmsApi.updatePlatformCredentials({
      email: this.securityForm.email,
      currentPassword: this.securityForm.currentPassword,
      newPassword: this.securityForm.newPassword
    }).subscribe({
      next: (res) => {
        this.securityLoading = false;
        this.securitySuccess = 'Platform Administrator credentials & Master PIN updated successfully!';
        if (res.data?.email) {
          const current = this.authService.currentUser();
          if (current) {
            current.email = res.data.email;
          }
        }
        setTimeout(() => {
          this.closeSecurityModal();
        }, 1500);
      },
      error: (err) => {
        this.securityLoading = false;
        // Even if server password update wasn't triggered (e.g. only PIN was changed without password), treat as success if no new password was provided
        if (!this.securityForm.newPassword && !this.securityForm.currentPassword) {
          this.securitySuccess = 'Master PIN updated successfully!';
          setTimeout(() => this.closeSecurityModal(), 1200);
        } else {
          this.securityError = err.error?.message || 'Failed to update credentials. Please verify current password.';
        }
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.wmsApi.updateClientStatus(id, status).subscribe({
      next: () => {
        this.loadData();
      }
    });
  }

  deleteClient(id: number, name: string) {
    if (confirm(`Are you sure you want to permanently delete company: "${name}" and all its inventory data?`)) {
      this.wmsApi.deleteClient(id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Failed to delete client')
      });
    }
  }

  deleteAll() {
    if (confirm('Are you sure you want to delete ALL registered companies? This cannot be undone.')) {
      this.wmsApi.deleteAllClients().subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err.error?.message || 'Failed to delete all clients')
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
