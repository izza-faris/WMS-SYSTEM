import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-page-container min-vh-100 position-relative d-flex flex-column justify-content-between overflow-hidden">
      <!-- Top Navigation Header -->
      <header class="position-relative z-2 px-4 py-3">
        <div class="container-xl d-flex align-items-center justify-content-between">
          <a routerLink="/" class="text-decoration-none d-flex align-items-center gap-2">
            <div class="brand-badge rounded-3 d-flex align-items-center justify-content-center">
              <i class="bi bi-boxes fs-5 text-white"></i>
            </div>
            <span class="fs-4 fw-extrabold text-light tracking-tight">Aero<span class="text-gradient-primary">WMS</span></span>
          </a>

          <div class="d-flex align-items-center gap-3">
            <a routerLink="/" class="btn btn-glass btn-sm d-none d-sm-inline-flex align-items-center gap-2">
              <i class="bi bi-arrow-left"></i>
              <span>Back to Home</span>
            </a>
            <a routerLink="/login" class="btn btn-glass btn-sm d-flex align-items-center gap-2">
              <i class="bi bi-box-arrow-in-right"></i>
              <span>Sign In</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Main Registration Content Area with Floating Badges -->
      <main class="position-relative z-2 my-auto py-4 px-3 d-flex align-items-center justify-content-center">
        <!-- Floating Logistics Status Badges (Desktop Viewport) -->
        <div class="floating-badge badge-top-left d-none d-xl-flex align-items-center gap-3 animate__animated animate__fadeInLeft">
          <div class="badge-icon-wrap badge-icon-success">
            <i class="bi bi-arrow-repeat fs-5"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-light small">Real-Time FEFO Engine</span>
              <span class="status-pulse pulse-success"></span>
            </div>
            <span class="text-secondary text-xs">Automated batch dispatch active</span>
          </div>
        </div>

        <div class="floating-badge badge-top-right d-none d-xl-flex align-items-center gap-3 animate__animated animate__fadeInRight">
          <div class="badge-icon-wrap badge-icon-cyan">
            <i class="bi bi-qr-code-scan fs-5"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-light small">5-Level Spatial QR</span>
              <span class="status-pulse pulse-cyan"></span>
            </div>
            <span class="text-secondary text-xs">Zone → Rack → Shelf → Bin</span>
          </div>
        </div>

        <div class="floating-badge badge-bottom-left d-none d-xl-flex align-items-center gap-3 animate__animated animate__fadeInLeft">
          <div class="badge-icon-wrap badge-icon-primary">
            <i class="bi bi-shield-check fs-5"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-light small">Multi-Tenant Isolation</span>
              <span class="status-pulse pulse-primary"></span>
            </div>
            <span class="text-secondary text-xs">Cryptographic zero cross-leakage</span>
          </div>
        </div>

        <div class="floating-badge badge-bottom-right d-none d-xl-flex align-items-center gap-3 animate__animated animate__fadeInRight">
          <div class="badge-icon-wrap badge-icon-warning">
            <i class="bi bi-buildings-fill fs-5"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-light small">Multi-Warehouse Mesh</span>
              <span class="status-pulse pulse-warning"></span>
            </div>
            <span class="text-secondary text-xs">Instant cross-branch transfer</span>
          </div>
        </div>

        <!-- Registration Glass Card -->
        <div class="register-card glass-panel w-100 p-4 p-md-5 animate__animated animate__zoomIn position-relative">
          <!-- Ambient Glow Stripe at top rim of card -->
          <div class="card-glow-rim"></div>

          <div class="text-center mb-4">
            <div class="header-icon-box rounded-3 d-inline-flex align-items-center justify-content-center mb-3">
              <i class="bi bi-building-add fs-4 text-white"></i>
            </div>
            <h3 class="fw-extrabold text-light mb-1">Register Your Business</h3>
            <p class="text-secondary small mb-0">Join AeroWMS multi-tenant warehouse & supply-chain platform</p>
          </div>

          <!-- Success Alert -->
          <div *ngIf="successMessage" class="alert alert-success py-3 animate__animated animate__fadeIn">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-check-circle-fill fs-5"></i>
              <span class="fw-bold">Registration Submitted!</span>
            </div>
            <p class="small mb-3">{{ successMessage }}</p>
            <a routerLink="/login" class="btn btn-sm btn-success px-3 fw-semibold">
              <i class="bi bi-box-arrow-in-right me-1"></i> Go to Login
            </a>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="alert alert-danger py-2 small mb-3 animate__animated animate__shakeX">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ errorMessage }}
          </div>

          <!-- Form Content -->
          <form *ngIf="!successMessage" (ngSubmit)="onRegister()">
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-building me-1 text-primary"></i> Company Name *
                </label>
                <input type="text" class="form-control" [(ngModel)]="form.companyName" name="companyName" required placeholder="Acme Logistics Ltd">
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-hash me-1 text-primary"></i> Company Code *
                </label>
                <input type="text" class="form-control" [(ngModel)]="form.companyCode" name="companyCode" required placeholder="ACME" style="text-transform: uppercase;">
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-envelope me-1 text-primary"></i> Business Email *
                </label>
                <input type="email" class="form-control" [(ngModel)]="form.email" name="email" required placeholder="contact@acme.com">
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-telephone me-1 text-primary"></i> Phone Number *
                </label>
                <input type="text" class="form-control" [(ngModel)]="form.phone" name="phone" required placeholder="+1 555-0199">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label text-secondary small fw-semibold">
                <i class="bi bi-geo-alt me-1 text-primary"></i> Primary Office Address
              </label>
              <input type="text" class="form-control" [(ngModel)]="form.address" name="address" placeholder="123 Industrial Way, Sector 4">
            </div>

            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-person-badge me-1 text-primary"></i> Admin Full Name *
                </label>
                <input type="text" class="form-control" [(ngModel)]="form.adminName" name="adminName" required placeholder="John Doe">
              </div>
              <div class="col-md-6">
                <label class="form-label text-secondary small fw-semibold">
                  <i class="bi bi-shield-lock me-1 text-primary"></i> Password *
                </label>
                <input type="password" class="form-control" [(ngModel)]="form.password" name="password" required placeholder="Minimum 6 characters">
              </div>
            </div>

            <button type="submit" [disabled]="loading" class="btn btn-glow-primary w-100 py-2 fw-semibold submit-btn">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <span *ngIf="!loading"><i class="bi bi-rocket-takeoff-fill me-2"></i></span>
              <span>Submit Registration</span>
            </button>
          </form>

          <div class="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
            <span class="text-secondary small">Already have an approved account? </span>
            <a routerLink="/login" class="text-gradient-primary text-decoration-none small fw-bold ms-1">
              Sign In Here →
            </a>
          </div>
        </div>
      </main>

      <!-- Footer Branding -->
      <footer class="position-relative z-2 py-3 text-center">
        <span class="text-secondary text-xs opacity-75">
          © AeroWMS Enterprise Platform • High-Security Multi-Tenant Logistics System
        </span>
      </footer>
    </div>
  `,
  styles: [`
    .register-page-container {
      background-color: transparent;
      min-height: 100vh;
      color: #f8fafc;
    }

    /* Floating Status Badges around Register Card */
    .floating-badge {
      position: absolute;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      padding: 12px 18px;
      border-radius: 16px;
      z-index: 5;
      pointer-events: auto;
      transition: all 0.3s ease;
      max-width: 270px;
    }

    .floating-badge:hover {
      transform: translateY(-4px) scale(1.03);
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 16px 36px rgba(79, 70, 229, 0.25);
    }

    .badge-top-left {
      top: 18%;
      left: 5%;
      animation: floatBadge1 7s ease-in-out infinite alternate;
    }

    .badge-top-right {
      top: 22%;
      right: 5%;
      animation: floatBadge2 8s ease-in-out infinite alternate;
    }

    .badge-bottom-left {
      bottom: 18%;
      left: 6%;
      animation: floatBadge2 9s ease-in-out infinite alternate 1s;
    }

    .badge-bottom-right {
      bottom: 20%;
      right: 6%;
      animation: floatBadge1 7.5s ease-in-out infinite alternate 0.5s;
    }

    @keyframes floatBadge1 {
      0% { transform: translateY(0px) rotate(0deg); }
      100% { transform: translateY(-16px) rotate(1deg); }
    }

    @keyframes floatBadge2 {
      0% { transform: translateY(0px) rotate(0deg); }
      100% { transform: translateY(-18px) rotate(-1deg); }
    }

    .badge-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .badge-icon-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-icon-cyan {
      background: rgba(6, 182, 212, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .badge-icon-primary {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .badge-icon-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .status-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
      animation: pulseDot 2s infinite ease-in-out;
    }

    .pulse-success { background-color: #34d399; box-shadow: 0 0 8px #34d399; }
    .pulse-cyan { background-color: #38bdf8; box-shadow: 0 0 8px #38bdf8; }
    .pulse-primary { background-color: #818cf8; box-shadow: 0 0 8px #818cf8; }
    .pulse-warning { background-color: #fbbf24; box-shadow: 0 0 8px #fbbf24; }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.5; }
    }

    /* Register Card Enhancement */
    .register-card {
      max-width: 620px;
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

    .register-card:hover {
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

    .submit-btn {
      font-size: 1rem;
      letter-spacing: 0.02em;
    }

    .text-cyan {
      color: #06b6d4;
    }

    .text-xs {
      font-size: 0.76rem;
    }
  `]
})
export class RegisterComponent {
  form = {
    companyName: '',
    companyCode: '',
    email: '',
    phone: '',
    address: '',
    adminName: '',
    password: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  onRegister(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.registerClient(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Registration successful. Account pending approval.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please review inputs.';
      }
    });
  }
}
