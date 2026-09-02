import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WmsApiService } from '../../services/wms-api.service';
import { Product } from '../../models/wms.models';
import { Html5QrcodeScanner } from 'html5-qrcode';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="scanner-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Optical Barcode & QR Code Scanner</h2>
          <p class="text-secondary small mb-0">Use device camera or laser scanner to instantly identify products and location bins</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Live Scanner Viewport with Animated Laser -->
        <div class="col-lg-6">
          <div class="glass-panel p-4 text-center">
            <h5 class="fw-bold text-light mb-3"><i class="bi bi-camera-video-fill text-warning me-2"></i>Live Optical Camera Viewport</h5>

            <!-- Camera Viewport Box -->
            <div class="scanner-container mb-3 position-relative" style="min-height: 280px; background: #000;">
              <div id="reader" style="width: 100%;"></div>
              
              <!-- Animated Green Laser Viewfinder Overlay -->
              <div class="scanner-viewfinder" *ngIf="scannerActive">
                <div class="scanner-laser"></div>
              </div>
            </div>

            <!-- Manual Barcode Input Fallback -->
            <div class="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-20 text-start">
              <label class="form-label text-secondary small fw-semibold">Manual Code Input / Handheld Scanner</label>
              <div class="input-group">
                <input type="text" class="form-control" [(ngModel)]="manualCode" (keyup.enter)="lookupCode(manualCode)" placeholder="e.g. 8901234560011 or RICE-BAS-001">
                <button (click)="lookupCode(manualCode)" class="btn btn-glow-primary">
                  <i class="bi bi-search me-1"></i> Lookup
                </button>
              </div>
              <small class="text-muted text-xs mt-1 d-block">Quick test codes: <code>8901234560011</code> (Rice), <code>8901234560028</code> (Tea)</small>
            </div>
          </div>
        </div>

        <!-- Scanned Product Intelligence -->
        <div class="col-lg-6">
          <div class="glass-panel p-4 h-100">
            <h5 class="fw-bold text-light mb-3"><i class="bi bi-cpu text-info me-2"></i>Scanned Item Telemetry</h5>

            <div *ngIf="!scannedProduct()" class="text-center py-5 text-muted">
              <i class="bi bi-upc-scan fs-1 text-secondary d-block mb-3"></i>
              Point your camera at a product barcode, location QR code, or enter code manually to inspect real-time stock.
            </div>

            <div *ngIf="scannedProduct()" class="animate__animated animate__fadeIn">
              <div class="p-3 bg-primary bg-opacity-15 rounded-3 border border-primary border-opacity-30 mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="badge bg-primary">MATCH CONFIRMED</span>
                  <span class="font-monospace text-primary text-xs">{{ scannedProduct()?.sku }}</span>
                </div>
                <h4 class="fw-bold text-light mb-1">{{ scannedProduct()?.name }}</h4>
                <div class="text-secondary small">{{ scannedProduct()?.brand || 'Standard Brand' }} &bull; {{ scannedProduct()?.unit }}</div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="p-3 bg-dark rounded border border-secondary border-opacity-20 text-center">
                    <small class="text-secondary text-xs">Total Stock</small>
                    <div class="fs-3 fw-bold text-light">{{ scannedProduct()?.currentStock }}</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-dark rounded border border-secondary border-opacity-20 text-center">
                    <small class="text-secondary text-xs">Reorder Level</small>
                    <div class="fs-3 fw-bold text-warning">{{ scannedProduct()?.reorderLevel }}</div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions for Scanned Product -->
              <div class="d-flex gap-2">
                <a routerLink="/app/stock-movement" class="btn btn-success flex-grow-1">
                  <i class="bi bi-box-arrow-in-down me-1"></i> Stock In
                </a>
                <a routerLink="/app/stock-movement" class="btn btn-glow-primary flex-grow-1">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Stock Out
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ScannerComponent implements OnInit, OnDestroy {
  manualCode = '';
  scannedProduct = signal<Product | null>(null);
  scannerActive = true;
  private html5QrcodeScanner: any;

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.initScanner();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.html5QrcodeScanner) {
      try {
        this.html5QrcodeScanner.clear();
      } catch (e) {}
    }
  }

  private initScanner(): void {
    try {
      this.html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      this.html5QrcodeScanner.render(
        (decodedText: string) => {
          this.lookupCode(decodedText);
        },
        (error: any) => {}
      );
    } catch (e) {
      console.log("Camera not initialized: ", e);
    }
  }

  lookupCode(code: string) {
    if (!code || !code.trim()) return;
    this.wmsApi.scanProductCode(code.trim()).subscribe({
      next: (res) => {
        if (res.success) {
          this.scannedProduct.set(res.data);
        }
      },
      error: () => {
        alert('No product found matching code: ' + code);
      }
    });
  }
}
