import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WmsApiService } from '../../services/wms-api.service';
import { NotificationItem } from '../../models/wms.models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout">
      <!-- Left Sidebar -->
      <aside class="app-sidebar" [class.show]="sidebarOpen">
        <!-- Brand Logo -->
        <div class="p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-10">
          <a routerLink="/app/dashboard" class="d-flex align-items-center gap-2 text-decoration-none text-light">
            <div class="bg-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
              <i class="bi bi-boxes fs-5 text-white"></i>
            </div>
            <div>
              <div class="fw-extrabold text-light fs-5 lh-1">Aero<span class="text-gradient-primary">WMS</span></div>
              <small class="text-muted text-xs" style="font-size: 0.72rem;">{{ currentUser()?.companyName || 'Enterprise' }}</small>
            </div>
          </a>
          <button class="btn btn-sm text-secondary d-lg-none" (click)="toggleSidebar()"><i class="bi bi-x-lg"></i></button>
        </div>

        <!-- Navigation Links -->
        <div class="py-3 flex-grow-1 overflow-y-auto">
          <div class="px-3 mb-2 text-uppercase text-muted fw-bold" style="font-size: 0.68rem; letter-spacing: 0.08em;">Operations</div>

          <a routerLink="/app/dashboard" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </a>

          <a routerLink="/app/products" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-box-seam-fill"></i>
            <span>Products & Catalog</span>
          </a>

          <a routerLink="/app/inventory" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-stack"></i>
            <span>Inventory & FEFO</span>
          </a>

          <a routerLink="/app/scanner" routerLinkActive="active" class="nav-link-custom text-warning">
            <i class="bi bi-qr-code-scan"></i>
            <span>Camera Scanner</span>
          </a>

          <div class="px-3 mt-3 mb-2 text-uppercase text-muted fw-bold" style="font-size: 0.68rem; letter-spacing: 0.08em;">Logistics</div>

          <a routerLink="/app/stock-movement" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-arrow-left-right"></i>
            <span>Stock In / Out</span>
          </a>

          <a routerLink="/app/transfers" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-truck"></i>
            <span>Stock Transfers</span>
          </a>

          <a routerLink="/app/adjustments" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-clipboard-check"></i>
            <span>Adjustments</span>
          </a>

          <div class="px-3 mt-3 mb-2 text-uppercase text-muted fw-bold" style="font-size: 0.68rem; letter-spacing: 0.08em;">Structure</div>

          <a routerLink="/app/warehouses" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-diagram-3-fill"></i>
            <span>Spatial Warehouses</span>
          </a>

          <a routerLink="/app/branches" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-geo-alt-fill"></i>
            <span>Branches</span>
          </a>

          <div class="px-3 mt-3 mb-2 text-uppercase text-muted fw-bold" style="font-size: 0.68rem; letter-spacing: 0.08em;">Enterprise</div>

          <a routerLink="/app/reports" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-file-earmark-bar-graph-fill"></i>
            <span>Reports & PDF</span>
          </a>

          <a *ngIf="isClientAdmin()" routerLink="/app/users" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-people-fill"></i>
            <span>Team & Roles</span>
          </a>

          <a *ngIf="isClientAdmin()" routerLink="/app/audit-logs" routerLinkActive="active" class="nav-link-custom">
            <i class="bi bi-shield-shaded"></i>
            <span>Audit Trail</span>
          </a>
        </div>

        <!-- User Profile footer -->
        <div class="p-3 border-top border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 overflow-hidden">
            <div class="bg-indigo text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 34px; height: 34px; background: #6366f1;">
              {{ (currentUser()?.fullName || 'U').charAt(0) }}
            </div>
            <div class="overflow-hidden">
              <div class="text-light small fw-bold text-truncate">{{ currentUser()?.fullName }}</div>
              <div class="text-muted text-xs text-truncate" style="font-size: 0.72rem;">{{ currentUser()?.role }}</div>
            </div>
          </div>
          <button (click)="logout()" class="btn btn-sm text-danger" title="Logout"><i class="bi bi-box-arrow-right fs-5"></i></button>
        </div>
      </aside>

      <!-- Main Section -->
      <div class="app-main">
        <!-- Top Header -->
        <header class="navbar navbar-expand glass-panel mx-3 mt-3 px-3 py-2 border-0">
          <div class="container-fluid p-0 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-glass d-lg-none" (click)="toggleSidebar()"><i class="bi bi-list fs-5"></i></button>
              <div class="d-none d-md-flex align-items-center gap-2">
                <span class="badge badge-glow-primary px-2 py-1"><i class="bi bi-building me-1"></i>{{ currentUser()?.companyName }}</span>
                <span class="text-muted small">/</span>
                <span class="text-secondary small fw-medium">Multi-Tenant Tenant ID: #{{ currentUser()?.clientId }}</span>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <!-- Quick Scanner Button -->
              <a routerLink="/app/scanner" class="btn btn-sm btn-glass text-warning d-flex align-items-center gap-1">
                <i class="bi bi-camera-fill"></i>
                <span class="d-none d-sm-inline">Scan Code</span>
              </a>

              <!-- Notification Bell with Dropdown -->
              <div class="dropdown">
                <button class="btn btn-sm btn-glass position-relative" (click)="toggleNotifDropdown()" id="notifBtn">
                  <i class="bi bi-bell-fill"></i>
                  <span *ngIf="unreadCount() > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.65rem;">
                    {{ unreadCount() }}
                  </span>
                </button>

                <!-- Notifications Dropdown Menu -->
                <div *ngIf="showNotifDropdown" class="glass-panel position-absolute end-0 mt-2 p-3 shadow-lg animate__animated animate__fadeIn" style="width: 340px; z-index: 1050;">
                  <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-secondary border-opacity-10">
                    <span class="fw-bold small text-light">Notifications</span>
                    <button *ngIf="unreadCount() > 0" (click)="markAllRead()" class="btn btn-link btn-sm p-0 text-primary text-decoration-none text-xs">Mark all read</button>
                  </div>

                  <div *ngIf="notifications().length === 0" class="py-3 text-center text-muted small">
                    No new alerts
                  </div>

                  <div class="overflow-y-auto" style="max-height: 260px;">
                    <div *ngFor="let n of notifications()" class="p-2 mb-2 rounded" [class.bg-secondary]="n.isRead" [class.bg-opacity-10]="n.isRead" [class.bg-primary]="!n.isRead" [class.bg-opacity-15]="!n.isRead">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="badge" [ngClass]="getNotifBadge(n.type)">{{ n.type }}</span>
                        <small class="text-muted text-xs">{{ n.createdAt | date:'shortTime' }}</small>
                      </div>
                      <div class="text-light small fw-semibold">{{ n.title }}</div>
                      <div class="text-secondary text-xs">{{ n.message }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Routed Content -->
        <main class="p-3 p-md-4 flex-grow-1">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  currentUser = this.authService.currentUser;
  sidebarOpen = false;
  showNotifDropdown = false;
  unreadCount = signal<number>(0);
  notifications = signal<NotificationItem[]>([]);

  constructor(
    private authService: AuthService,
    private wmsApi: WmsApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications() {
    this.wmsApi.getNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.data);
          const unread = res.data.filter(n => !n.isRead).length;
          this.unreadCount.set(unread);
        }
      }
    });
  }

  markAllRead() {
    this.wmsApi.markAllNotificationsRead().subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.loadNotifications();
      }
    });
  }

  isClientAdmin(): boolean {
    return this.currentUser()?.role === 'CLIENT_ADMIN';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleNotifDropdown() {
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  getNotifBadge(type: string): string {
    switch (type) {
      case 'LOW_STOCK':
      case 'EXPIRING_SOON':
        return 'badge-glow-warning';
      case 'OUT_OF_STOCK':
      case 'EXPIRED':
        return 'badge-glow-danger';
      case 'TRANSFER_REQUEST':
      case 'ADJUSTMENT_REQUEST':
        return 'badge-glow-primary';
      default:
        return 'badge-glow-success';
    }
  }

  logout() {
    this.authService.logout();
  }
}
