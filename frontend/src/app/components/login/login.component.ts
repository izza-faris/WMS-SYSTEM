import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-page-container min-vh-100 position-relative d-flex flex-column justify-content-between overflow-hidden">
      <!-- Top Navigation Header -->
      <header class="position-relative z-2 px-4 py-3">
        <div class="container-xl d-flex align-items-center justify-content-between flex-wrap gap-2">
          <a routerLink="/" class="text-decoration-none d-flex align-items-center gap-2">
            <div class="brand-badge rounded-3 d-flex align-items-center justify-content-center">
              <i class="bi bi-boxes fs-5 text-white"></i>
            </div>
            <span class="fs-4 fw-extrabold text-light tracking-tight">Aero<span class="text-gradient-primary">WMS</span></span>
          </a>

          <div class="d-flex align-items-center gap-2">
            <a routerLink="/" class="btn btn-glass btn-sm d-inline-flex align-items-center gap-2">
              <i class="bi bi-arrow-left"></i>
              <span>Back to Home</span>
            </a>
            <a routerLink="/register" class="btn btn-glow-primary btn-sm d-inline-flex align-items-center gap-2">
              <i class="bi bi-building-add"></i>
              <span>Register Business</span>
            </a>
            <button (click)="openOwnerGateway()" class="btn btn-outline-warning btn-sm d-inline-flex align-items-center gap-1 border-warning border-opacity-50 text-warning" id="loginPageOwnerNavBtn">
              <i class="bi bi-shield-lock-fill"></i>
              <span>Platform Admin</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Login Content Area -->
      <main class="position-relative z-2 my-auto py-4 px-3 d-flex align-items-center justify-content-center">
        <div class="login-card glass-panel p-4 p-md-5 w-100 animate__animated animate__zoomIn position-relative">
          <!-- Ambient Glow Rim at top of card -->
          <div class="card-glow-rim"></div>

          <div class="text-center mb-4">
            <div class="header-icon-box rounded-3 d-inline-flex align-items-center justify-content-center mb-3">
              <i class="bi bi-boxes fs-4 text-white"></i>
            </div>
            <h3 class="fw-extrabold text-light mb-1">Welcome to AeroWMS</h3>
            <p class="text-secondary small mb-0">Sign in to your private tenant workspace</p>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger py-2 small mb-3 animate__animated animate__shakeX">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
          </div>

          <form (ngSubmit)="onLogin()">
            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-envelope me-1 text-primary"></i> Email Address
              </label>
              <div class="input-group">
                <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-envelope"></i></span>
                <input type="email" class="form-control" [(ngModel)]="email" name="email" required placeholder="name@company.com">
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-shield-lock me-1 text-primary"></i> Password
              </label>
              <div class="input-group">
                <span class="input-group-text bg-dark border-secondary border-opacity-25 text-secondary"><i class="bi bi-lock"></i></span>
                <input type="password" class="form-control" [(ngModel)]="password" name="password" required placeholder="••••••••">
              </div>
            </div>

            <button type="submit" [disabled]="loading" class="btn btn-glow-primary w-100 py-2 fw-semibold">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <span *ngIf="!loading"><i class="bi bi-box-arrow-in-right me-2"></i></span>
              <span>Sign In</span>
            </button>
          </form>

          <!-- Quick Credentials Switcher -->
          <div class="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center">
            <p class="text-muted small mb-2"><i class="bi bi-lightning-charge-fill text-warning me-1"></i>Quick Demo Tenant Accounts:</p>
            <div class="d-flex flex-wrap gap-1 justify-content-center mb-2">
              <button (click)="fillCreds('admin@apexretailers.com', 'Apex@123')" class="btn btn-glass btn-sm text-xs py-1">Client Admin</button>
              <button (click)="fillCreds('manager.colombo@apexretailers.com', 'Manager@123')" class="btn btn-glass btn-sm text-xs py-1">Branch Mgr</button>
              <button (click)="fillCreds('staff.colombo@apexretailers.com', 'Staff@123')" class="btn btn-glass btn-sm text-xs py-1">Staff</button>
              <button (click)="fillCreds('admin@zenithlogistics.com', 'Zenith@123')" class="btn btn-glass btn-sm text-xs py-1">Client B</button>
            </div>
            <!-- Owner Portal button -->
            <button (click)="openOwnerGateway()" class="btn btn-glass btn-sm text-xs py-1 border-danger border-opacity-40 text-warning">
              <i class="bi bi-shield-lock-fill text-danger me-1"></i>Owner / Platform Admin
            </button>
          </div>

          <div class="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
            <span class="text-secondary small">Need a business workspace? </span>
            <a routerLink="/register" class="text-gradient-primary text-decoration-none small fw-bold ms-1">Register Business →</a>
          </div>
        </div>
      </main>

      <!-- Access Restriction Popup Modal ("Only Platform Admin Can Access This") -->
      <div *ngIf="showRestrictionModal" class="modal-backdrop-custom d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn">
        <div class="glass-panel p-4 p-md-5 w-100 position-relative animate__animated animate__bounceIn restriction-card" style="max-width: 500px;">
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
                பதிவு செய்த கம்பெனி உறுப்பினர்கள் தங்கள் நிறுவன டேஷ்போர்டை அணுக சாதாரண <strong>Log In</strong> பொத்தானை பயன்படுத்தவும்.
              </span>
            </div>
          </div>

          <div class="d-flex justify-content-center">
            <button (click)="closeRestrictionModal()" class="btn btn-glow-primary py-2 px-4 w-100">
              OK, Understand
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Branding -->
      <footer class="position-relative z-2 py-3 text-center">
        <span class="text-secondary text-xs opacity-75">
          © AeroWMS Enterprise Platform • High-Security Multi-Tenant Logistics System
        </span>
      </footer>
    </div>
  `,
  styles: [`
    .login-page-container {
      background-color: transparent;
      min-height: 100vh;
      color: #f8fafc;
    }

    .login-card {
      max-width: 480px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(99, 102, 241, 0.12);
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .login-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.65), 0 0 60px rgba(99, 102, 241, 0.2);
    }

    .card-glow-rim {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%);
      box-shadow: 0 0 14px rgba(99, 102, 241, 0.8);
      border-radius: 20px 20px 0 0;
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

    .brand-badge {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }

    .header-icon-box {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
      box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
    }

    .modal-backdrop-custom {
      position: fixed;
      inset: 0;
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 2100;
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
export class LoginComponent {
  email = 'admin@apexretailers.com';
  password = 'Apex@123';
  loading = false;
  errorMessage = '';
  showRestrictionModal = false;

  constructor(private authService: AuthService, private router: Router) {}

  fillCreds(email: string, pass: string) {
    this.email = email;
    this.password = pass;
    this.errorMessage = '';
  }

  openOwnerGateway() {
    const user = this.authService.currentUser();
    if (user && user.role !== 'PLATFORM_ADMIN') {
      this.showRestrictionModal = true;
      return;
    }
    // Set credentials for owner
    this.email = 'admin@wmsplatform.com';
    this.password = 'Admin@123';
    this.onLogin();
  }

  closeRestrictionModal() {
    this.showRestrictionModal = false;
  }

  onLogin() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data.role === 'PLATFORM_ADMIN') {
          this.router.navigate(['/platform-admin'], { queryParams: { openSecurity: 'true' } });
        } else {
          this.router.navigate(['/app/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
