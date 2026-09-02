import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="landing-page min-vh-100 d-flex flex-column position-relative overflow-hidden">
      <!-- Top Navbar -->
      <nav class="navbar navbar-expand-lg glass-panel mx-3 mt-3 px-4 py-2 border-0 position-relative z-2">
        <div class="container-fluid p-0">
          <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-light" routerLink="/">
            <div class="bg-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
              <i class="bi bi-boxes fs-5 text-white"></i>
            </div>
            <span class="fs-4 fw-extrabold tracking-tight">Aero<span class="text-gradient-primary">WMS</span></span>
          </a>

          <div class="d-flex align-items-center gap-2 gap-md-3">
            <a routerLink="/login" class="btn btn-glass px-3 px-md-4">Log In</a>
            <a routerLink="/register" class="btn btn-glow-primary px-3 px-md-4">Register Business</a>
            
            <!-- Platform Admin / Owner Button -->
            <button (click)="onPlatformAdminClick()" 
                    class="btn btn-owner-portal d-inline-flex align-items-center gap-2 px-3 px-md-4" 
                    id="ownerPortalNavBtn"
                    title="Platform Admin & Owner Portal">
              <i class="bi bi-shield-lock-fill text-warning"></i>
              <span class="fw-bold d-none d-sm-inline">Platform Admin</span>
              <span class="badge bg-danger text-white rounded-pill text-xs ms-1">Owner</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="container py-5 text-center my-auto animate__animated animate__fadeIn position-relative z-2">
        <div class="badge badge-glow-primary px-3 py-2 rounded-pill mb-3 fw-semibold fs-6">
          <i class="bi bi-shield-check me-1"></i> Multi-Tenant SME Warehouse Operating System
        </div>
        <h1 class="display-3 fw-bolder text-light mb-4">
          Intelligent Inventory & <br/>
          <span class="text-gradient-primary">Multi-Warehouse Logistics</span>
        </h1>
        <p class="lead text-secondary mx-auto mb-5" style="max-width: 720px;">
          Strict data isolation, FEFO batch expiry management, 5-level spatial storage hierarchy, and real-time barcode & QR scanning tailored for modern enterprises.
        </p>

        <!-- Quick 1-Click Demo Launcher & Platform Options -->
        <div class="glass-panel p-4 mx-auto mb-5 position-relative" style="max-width: 900px;">
          <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <h5 class="fw-bold text-light mb-0"><i class="bi bi-lightning-charge-fill text-warning me-2"></i>Instant 1-Click Demo Login</h5>
            <span class="text-muted text-xs">Click tenant or owner to experience role isolation</span>
          </div>

          <div class="d-flex flex-wrap justify-content-center gap-2 mb-3">
            <button (click)="quickLogin('admin@apexretailers.com', 'Apex@123')" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
              <span class="badge bg-primary">Client Admin</span>
              <span>Apex Retailers</span>
            </button>
            <button (click)="quickLogin('manager.colombo@apexretailers.com', 'Manager@123')" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
              <span class="badge bg-info text-dark">Branch Manager</span>
              <span>Colombo Branch</span>
            </button>
            <button (click)="quickLogin('staff.colombo@apexretailers.com', 'Staff@123')" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
              <span class="badge bg-success">Staff</span>
              <span>Warehouse Floor</span>
            </button>
            <button (click)="quickLogin('admin@zenithlogistics.com', 'Zenith@123')" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark">Tenant B</span>
              <span>Zenith Logistics</span>
            </button>
            <!-- Platform Owner Button at bottom launcher -->
            <button (click)="onPlatformAdminClick()" class="btn btn-owner-launcher btn-sm d-flex align-items-center gap-2" id="bottomOwnerBtn">
              <span class="badge bg-danger text-white"><i class="bi bi-shield-fill me-1"></i>Owner</span>
              <span>Platform Admin Portal</span>
            </button>
          </div>
        </div>

        <!-- Key Highlights Grid -->
        <div class="row g-4 text-start">
          <div class="col-md-4">
            <div class="glass-panel p-4 h-100">
              <div class="p-3 bg-primary bg-opacity-10 rounded-3 d-inline-block text-primary mb-3">
                <i class="bi bi-shield-lock-fill fs-3"></i>
              </div>
              <h5 class="fw-bold text-light">Strict Tenant Isolation</h5>
              <p class="text-secondary small mb-0">Cryptographic JWT tenant context guarantees zero cross-tenant leakage. Verified against IDOR attacks.</p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="glass-panel p-4 h-100">
              <div class="p-3 bg-info bg-opacity-10 rounded-3 d-inline-block text-info mb-3">
                <i class="bi bi-hourglass-split fs-3"></i>
              </div>
              <h5 class="fw-bold text-light">FEFO & Expiry Heatmap</h5>
              <p class="text-secondary small mb-0">First-Expired First-Out automated dispatch recommendations to prevent perishable inventory loss.</p>
            </div>
          </div>

          <div class="col-md-4">
            <div class="glass-panel p-4 h-100">
              <div class="p-3 bg-success bg-opacity-10 rounded-3 d-inline-block text-success mb-3">
                <i class="bi bi-qr-code-scan fs-3"></i>
              </div>
              <h5 class="fw-bold text-light">5-Level Spatial QR Tracking</h5>
              <p class="text-secondary small mb-0">Warehouse -> Zone -> Rack -> Shelf -> Bin location QR tags for precision floor scanning.</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Owner Access Gateway Modal (For Web Application Owner) -->
      <div *ngIf="showOwnerModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn">
        <div class="glass-panel p-4 p-md-5 w-100 position-relative animate__animated animate__zoomIn owner-modal-card" style="max-width: 520px;">
          <div class="card-glow-rim-danger"></div>

          <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center gap-3">
              <div class="bg-danger bg-opacity-20 border border-danger border-opacity-40 rounded-3 d-flex align-items-center justify-content-center text-danger" style="width: 44px; height: 44px;">
                <i class="bi bi-shield-lock-fill fs-4 text-warning"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="fw-extrabold text-light mb-0">Platform Admin & Owner</h5>
                  <span class="badge bg-danger text-white text-xs">Super Admin</span>
                </div>
                <span class="text-secondary small">Web Application Owner Authentication</span>
              </div>
            </div>
            <button (click)="closeOwnerModal()" class="btn btn-sm btn-glass text-secondary" id="closeOwnerModalBtn">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Alert for Registered Company Members -->
          <div class="alert alert-warning py-2 small mb-3 border-warning border-opacity-30 d-flex align-items-start gap-2">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-5 flex-shrink-0 mt-1"></i>
            <div>
              <strong class="text-light">Restricted Portal:</strong>
              <div class="text-warning-emphasis text-xs mt-1">
                Only the Platform Administrator (Owner) can log in here. Registered company members must use the standard <strong>Log In</strong> button.
              </div>
            </div>
          </div>

          <div *ngIf="ownerError" class="alert alert-danger py-2 small mb-3 animate__animated animate__shakeX">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ ownerError }}
          </div>

          <form (ngSubmit)="submitOwnerLogin()">
            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-envelope me-1 text-primary"></i> Owner Email Address
              </label>
              <input type="email" class="form-control" [(ngModel)]="ownerEmail" name="ownerEmail" required placeholder="izzafaris.it@gmail.com">
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-lock me-1 text-warning"></i> Owner Password
              </label>
              <div class="input-group">
                <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="ownerPassword" name="ownerPassword" required placeholder="••••••••">
                <button type="button" (click)="showPassword = !showPassword" class="btn btn-glass text-secondary">
                  <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="ownerLoading" class="btn btn-glow-primary w-100 py-2 fw-semibold mb-2" id="submitOwnerLoginBtn">
              <span *ngIf="ownerLoading" class="spinner-border spinner-border-sm me-2"></span>
              <span *ngIf="!ownerLoading"><i class="bi bi-box-arrow-in-right me-2"></i></span>
              <span>Sign In as Platform Owner & Open Settings</span>
            </button>
          </form>

          <!-- Quick 1-Click Launch Owner Button -->
          <div class="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <button (click)="quickOwnerLogin()" [disabled]="ownerLoading" class="btn btn-outline-warning w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-2" id="quickOwnerBtn">
              <i class="bi bi-lightning-charge-fill text-warning"></i>
              <span class="fw-bold">⚡ 1-Click Launch Owner Portal (izzafaris.it&#64;gmail.com)</span>
            </button>
            <div class="text-center">
              <small class="text-muted text-xs">Directly opens Platform Admin and Owner Email/Password management.</small>
            </div>
          </div>

          <!-- Company Member Test Trigger -->
          <div class="mt-3 pt-2 text-center">
            <button (click)="triggerCompanyMemberRestriction()" class="btn btn-glass btn-sm text-secondary text-xs">
              <i class="bi bi-building me-1"></i> I am a Registered Company Member (Click to Test)
            </button>
          </div>
        </div>
      </div>

      <!-- Access Restriction Popup Modal ("Only Platform Admin Can Access This") -->
      <div *ngIf="showRestrictionModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn">
        <div class="glass-panel p-4 p-md-5 w-100 position-relative animate__animated animate__bounceIn restriction-card" style="max-width: 500px;" id="restrictionModal">
          <div class="card-glow-rim-danger"></div>

          <div class="text-center mb-3">
            <div class="restriction-icon-wrap rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
              <i class="bi bi-shield-x fs-1 text-danger animate__animated animate__pulse animate__infinite"></i>
            </div>
            
            <div class="mb-2">
              <span class="badge bg-danger text-white border border-danger px-3 py-1 text-xs fw-bold rounded-pill shadow-sm">
                <i class="bi bi-shield-x me-1"></i>ACCESS RESTRICTED
              </span>
            </div>

            <!-- The exact phrase requested by the user -->
            <h4 class="fw-extrabold text-light mb-2 text-gradient-danger">
              Only Platform Admin Can Access This
            </h4>
            <p class="text-light small fw-semibold mb-1">
              Platform Admin (Owner) மட்டுமே இந்த பக்கத்தை அணுக முடியும்!
            </p>
          </div>

          <div class="restriction-explanation p-3 rounded-3 mb-4 text-start">
            <div class="d-flex align-items-start gap-2 mb-2">
              <i class="bi bi-info-circle-fill text-warning flex-shrink-0 mt-1"></i>
              <span class="text-secondary small">
                இந்த பகுதி AeroWMS பிளாட்பார்மின் தலைமை உரிமையாளருக்காக (Application Owner) ஒதுக்கப்பட்டுள்ளது.
              </span>
            </div>
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-building-check text-info flex-shrink-0 mt-1"></i>
              <span class="text-secondary small">
                பதிவு செய்த கம்பெனி உறுப்பினர்கள் (Registered Company Admins, Managers & Staff) உங்கள் நிறுவன டேஷ்போர்டை அணுக சாதாரண <strong>Log In</strong> பொத்தானை பயன்படுத்தவும்.
              </span>
            </div>
          </div>

          <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button (click)="goToLogin()" class="btn btn-glow-primary py-2 px-4 flex-grow-1" id="goToLoginBtn">
              <i class="bi bi-box-arrow-in-right me-2"></i>Go to Company Log In
            </button>
            <button (click)="closeRestrictionModal()" class="btn btn-glass py-2 px-4" id="closeRestrictionBtn">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="mt-auto py-3 text-center text-muted small border-top border-secondary border-opacity-10 position-relative z-2">
        © 2026 AeroWMS Enterprise Platform. Built with Spring Boot 3 & Angular 18.
      </footer>
    </div>
  `,
  styles: [`
    .btn-owner-portal {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.2) 100%);
      border: 1px solid rgba(245, 158, 11, 0.5);
      color: #fbbf24;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.15);
    }

    .btn-owner-portal:hover {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(245, 158, 11, 0.35) 100%);
      border-color: #fbbf24;
      color: #ffffff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
    }

    .btn-owner-launcher {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .btn-owner-launcher:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
      color: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 2100;
    }

    .card-glow-rim-danger {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #6366f1 100%);
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.8);
      border-radius: 16px 16px 0 0;
    }

    .owner-modal-card {
      border: 1px solid rgba(245, 158, 11, 0.3);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(245, 158, 11, 0.15);
      border-radius: 20px;
    }

    .restriction-card {
      border: 1px solid rgba(239, 68, 68, 0.4);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.85), 0 0 60px rgba(239, 68, 68, 0.25);
      border-radius: 20px;
    }

    .restriction-icon-wrap {
      width: 72px;
      height: 72px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      box-shadow: 0 0 24px rgba(239, 68, 68, 0.2);
    }

    .text-gradient-danger {
      background: linear-gradient(135deg, #f87171 0%, #fca5a5 50%, #fbbf24 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .restriction-explanation {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .text-xs {
      font-size: 0.76rem;
    }
  `]
})
export class LandingComponent {
  showOwnerModal = false;
  showRestrictionModal = false;
  showPassword = false;

  ownerEmail = 'izzafaris.it@gmail.com';
  ownerPassword = 'Admin@123';
  ownerLoading = false;
  ownerError = '';

  constructor(private authService: AuthService, private router: Router) {}

  quickLogin(email: string, pass: string) {
    this.authService.login({ email, password: pass }).subscribe({
      next: (res) => {
        if (res.data.role === 'PLATFORM_ADMIN') {
          this.router.navigate(['/platform-admin'], { queryParams: { openSecurity: 'true' } });
        } else {
          this.router.navigate(['/app/dashboard']);
        }
      },
      error: (err) => alert(err.error?.message || 'Login failed')
    });
  }

  onPlatformAdminClick() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      if (currentUser.role === 'PLATFORM_ADMIN') {
        // Owner is already authenticated, direct to Platform Admin Center with Security Settings open
        this.router.navigate(['/platform-admin'], { queryParams: { openSecurity: 'true' } });
        return;
      } else {
        // User is currently logged in as a company member (CLIENT_ADMIN, BRANCH_MANAGER, STAFF)
        this.showRestrictionModal = true;
        return;
      }
    }

    // Visitor / Not logged in: open Owner Gateway modal
    this.ownerError = '';
    this.showOwnerModal = true;
  }

  closeOwnerModal() {
    this.showOwnerModal = false;
  }

  closeRestrictionModal() {
    this.showRestrictionModal = false;
  }

  goToLogin() {
    this.showRestrictionModal = false;
    this.router.navigate(['/login']);
  }

  triggerCompanyMemberRestriction() {
    this.showOwnerModal = false;
    this.showRestrictionModal = true;
  }

  quickOwnerLogin() {
    this.ownerEmail = 'izzafaris.it@gmail.com';
    this.ownerPassword = 'Admin@123';
    this.submitOwnerLogin();
  }

  submitOwnerLogin() {
    this.ownerLoading = true;
    this.ownerError = '';

    const performLogin = (targetEmail: string) => {
      this.authService.login({ email: targetEmail, password: this.ownerPassword }).subscribe({
        next: (res) => {
          this.ownerLoading = false;
          if (res.data.role === 'PLATFORM_ADMIN') {
            this.showOwnerModal = false;
            this.router.navigate(['/platform-admin'], { queryParams: { openSecurity: 'true' } });
          } else {
            this.authService.logout();
            this.showOwnerModal = false;
            this.showRestrictionModal = true;
          }
        },
        error: (err) => {
          if (targetEmail === 'izzafaris.it@gmail.com') {
            performLogin('admin@wmsplatform.com');
          } else {
            this.ownerLoading = false;
            this.ownerError = err.error?.message || 'Login failed. Please verify owner credentials.';
          }
        }
      });
    };

    performLogin(this.ownerEmail);
  }
}
