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
          <h2 class="fw-bold text-light mb-1">Optical Barcode & Price Scanner (விலை சரிபார்ப்பு)</h2>
          <p class="text-secondary small mb-0">Scan barcode or QR code with camera or USB laser scanner to instantly view product price & inventory</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <button (click)="soundEnabled = !soundEnabled" class="btn btn-sm" [ngClass]="soundEnabled ? 'btn-outline-success' : 'btn-outline-secondary'" title="Toggle scan beep sound">
            <i class="bi" [ngClass]="soundEnabled ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'"></i>
            <span>Scanner Beep: {{ soundEnabled ? 'ON' : 'OFF' }}</span>
          </button>
        </div>
      </div>

      <div class="row g-4">
        <!-- Live Scanner Viewport with Animated Laser -->
        <div class="col-lg-5">
          <div class="glass-panel p-4 text-center">
            <h5 class="fw-bold text-light mb-3"><i class="bi bi-camera-video-fill text-warning me-2"></i>Live Optical Camera Viewport</h5>

            <!-- Camera Viewport Box -->
            <div class="scanner-container mb-3 position-relative rounded-3 overflow-hidden" style="min-height: 280px; background: #000;">
              <div id="reader" style="width: 100%;"></div>
              
              <!-- Animated Green Laser Viewfinder Overlay -->
              <div class="scanner-viewfinder" *ngIf="scannerActive">
                <div class="scanner-laser"></div>
              </div>
            </div>

            <!-- Manual Barcode Input Fallback -->
            <div class="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-20 text-start">
              <label class="form-label text-secondary small fw-semibold">Handheld Laser Scanner / Manual Barcode Input</label>
              <div class="input-group mb-2">
                <span class="input-group-text bg-dark border-secondary text-success"><i class="bi bi-upc-scan"></i></span>
                <input id="manualCodeInput" type="text" class="form-control" [(ngModel)]="manualCode" (keyup.enter)="lookupCode(manualCode)" placeholder="Scan barcode or type SKU...">
                <button (click)="lookupCode(manualCode)" class="btn btn-glow-primary">
                  <i class="bi bi-search me-1"></i> Scan & Check
                </button>
              </div>
              <div class="d-flex justify-content-between align-items-center text-muted text-xs">
                <span>Tip: Point laser scanner gun at barcode and pull trigger</span>
                <span *ngIf="scannedProduct()" class="text-success cursor-pointer" (click)="clearCurrentScan()"><i class="bi bi-x-circle me-1"></i>Clear</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Scanned Product Intelligence & Price Card -->
        <div class="col-lg-7">
          <div class="glass-panel p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="fw-bold text-light mb-0"><i class="bi bi-cpu text-info me-2"></i>Scanned Item & Price Telemetry</h5>
              <span *ngIf="scannedProduct()" class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2 py-1">
                <i class="bi bi-check-circle-fill me-1"></i> Verified Live
              </span>
            </div>

            <div *ngIf="!scannedProduct()" class="text-center py-5 text-muted">
              <i class="bi bi-upc-scan fs-1 text-secondary d-block mb-3 animate__animated animate__pulse animate__infinite"></i>
              <h6 class="text-light fw-semibold">Ready to Scan Barcode</h6>
              <p class="small text-secondary mb-0">Point your camera at a barcode, scan with a handheld scanner gun, or enter the code above to immediately see the price and stock.</p>
            </div>

            <div *ngIf="scannedProduct()" class="animate__animated animate__fadeIn">
              <!-- Item Header Card -->
              <div class="p-3 bg-primary bg-opacity-15 rounded-3 border border-primary border-opacity-30 mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="badge bg-primary">MATCH CONFIRMED</span>
                  <span class="font-monospace text-primary text-xs">SKU: {{ scannedProduct()?.sku }}</span>
                </div>
                <h3 class="fw-bold text-light mb-1">{{ scannedProduct()?.name }}</h3>
                <div class="text-secondary small d-flex flex-wrap gap-3">
                  <span><i class="bi bi-tag me-1 text-info"></i>{{ scannedProduct()?.brand || 'Standard Brand' }}</span>
                  <span><i class="bi bi-box me-1 text-warning"></i>Unit: {{ scannedProduct()?.unit }}</span>
                  <span *ngIf="scannedProduct()?.barcode"><i class="bi bi-upc me-1 text-success"></i>Barcode: <strong class="font-monospace text-light">{{ scannedProduct()?.barcode }}</strong></span>
                </div>
              </div>

              <!-- PROMINENT GLOWING PRICE CARD -->
              <div class="price-hero-card p-4 rounded-3 text-center mb-3 shadow" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 78, 59, 0.35)); border: 2px solid #10b981; box-shadow: 0 0 25px rgba(16, 185, 129, 0.25);">
                <div class="small text-uppercase text-success fw-bold tracking-wider mb-1">
                  <i class="bi bi-cash-stack me-1"></i> SELLING PRICE / விற்பனை விலை
                </div>
                <div class="display-3 fw-bolder text-light my-2 font-monospace">
                  <span class="text-success">{{ scannedProduct()?.currency || 'Rs.' }}</span> {{ (scannedProduct()?.price || 0) | number:'1.2-2' }}
                </div>
                <div class="d-flex justify-content-center align-items-center gap-2">
                  <span class="badge bg-success bg-opacity-30 text-success border border-success border-opacity-40 px-3 py-1">
                    Per {{ scannedProduct()?.unit || 'Unit' }}
                  </span>
                  <span class="badge bg-dark text-light border border-secondary px-3 py-1">
                    Inclusive of Taxes
                  </span>
                </div>
              </div>

              <!-- Stock & Reorder Info -->
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="p-3 bg-dark rounded border border-secondary border-opacity-20 text-center">
                    <small class="text-secondary text-xs d-block">Available Stock</small>
                    <div class="fs-2 fw-bold" [ngClass]="{
                      'text-danger': scannedProduct()?.currentStock === 0,
                      'text-warning': (scannedProduct()?.currentStock || 0) > 0 && (scannedProduct()?.currentStock || 0) <= (scannedProduct()?.reorderLevel || 10),
                      'text-light': (scannedProduct()?.currentStock || 0) > (scannedProduct()?.reorderLevel || 10)
                    }">
                      {{ scannedProduct()?.currentStock }} <span class="text-xs text-muted fw-normal">{{ scannedProduct()?.unit }}</span>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-dark rounded border border-secondary border-opacity-20 text-center">
                    <small class="text-secondary text-xs d-block">Reorder Point</small>
                    <div class="fs-2 fw-bold text-warning">{{ scannedProduct()?.reorderLevel }} <span class="text-xs text-muted fw-normal">{{ scannedProduct()?.unit }}</span></div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="d-flex flex-wrap gap-2">
                <a routerLink="/app/stock-movement" class="btn btn-success flex-grow-1">
                  <i class="bi bi-box-arrow-in-down me-1"></i> Stock In
                </a>
                <a routerLink="/app/stock-movement" class="btn btn-glow-primary flex-grow-1">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Stock Out
                </a>
                <button (click)="printSticker(scannedProduct()!)" class="btn btn-outline-info">
                  <i class="bi bi-printer me-1"></i> Print Price Label
                </button>
              </div>
            </div>

            <!-- Recent Scans Trail -->
            <div *ngIf="recentScans().length > 0" class="mt-4 pt-3 border-top border-secondary border-opacity-20">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="text-secondary small fw-semibold"><i class="bi bi-clock-history me-1"></i>Recent Price Lookups</span>
                <span class="text-muted text-xs">{{ recentScans().length }} items scanned</span>
              </div>
              <div class="list-group list-group-flush bg-transparent">
                <div *ngFor="let item of recentScans()" (click)="selectRecent(item.product)" class="list-group-item bg-transparent text-light border-secondary border-opacity-10 px-2 py-2 d-flex align-items-center justify-content-between cursor-pointer hover-glow">
                  <div>
                    <span class="fw-semibold text-light small">{{ item.product.name }}</span>
                    <span class="text-muted text-xs ms-2 font-monospace">({{ item.product.barcode || item.product.sku }})</span>
                  </div>
                  <div class="text-end">
                    <span class="text-success fw-bold font-monospace me-2">{{ item.product.currency || 'Rs.' }} {{ (item.product.price || 0) | number:'1.2-2' }}</span>
                    <small class="text-muted text-xs">{{ item.time }}</small>
                  </div>
                </div>
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
  soundEnabled = true;
  recentScans = signal<{ product: Product; time: string }[]>([]);
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

  playBeep() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // AudioContext policy
    }
  }

  lookupCode(code: string) {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim();
    this.wmsApi.scanProductCode(cleanCode).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.scannedProduct.set(res.data);
          if (this.soundEnabled) {
            this.playBeep();
          }
          const time = new Date().toLocaleTimeString();
          this.recentScans.update(list => [{ product: res.data, time }, ...list.filter(x => x.product.id !== res.data.id).slice(0, 4)]);
          
          // Re-focus and select manual input for instant continuous barcode gun scanning
          setTimeout(() => {
            const input = document.getElementById('manualCodeInput') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
          }, 100);
        }
      },
      error: () => {
        alert('No product found matching code: ' + cleanCode);
      }
    });
  }

  clearCurrentScan() {
    this.scannedProduct.set(null);
    this.manualCode = '';
  }

  selectRecent(product: Product) {
    this.scannedProduct.set(product);
  }

  printSticker(p: Product) {
    this.wmsApi.getProductBarcodeImage(p.id).subscribe({
      next: (res) => {
        const barcodeBase64 = res.data;
        const printWindow = window.open('', '_blank', 'width=450,height=500');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Barcode Price Sticker - ${p.name}</title>
                <style>
                  @page { size: auto; margin: 4mm; }
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; margin: 0; padding: 12px; }
                  .sticker { border: 2px dashed #222; padding: 14px; border-radius: 8px; max-width: 320px; margin: 0 auto; }
                  .prod-name { font-size: 15px; font-weight: 800; margin-bottom: 2px; text-transform: uppercase; }
                  .sku { font-size: 11px; color: #555; font-family: monospace; margin-bottom: 8px; }
                  img { max-height: 85px; width: auto; margin: 6px 0; }
                  .barcode-num { font-family: monospace; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
                  .price-tag { border-top: 2px solid #000; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900; }
                </style>
              </head>
              <body onload="window.print(); window.close();">
                <div class="sticker">
                  <div class="prod-name">${p.name}</div>
                  <div class="sku">SKU: ${p.sku} ${p.brand ? '• ' + p.brand : ''}</div>
                  <img src="${barcodeBase64}" />
                  <div class="barcode-num">${p.barcode || p.sku}</div>
                  <div class="price-tag">
                    <span>PRICE:</span>
                    <span>${p.currency || 'Rs.'} ${Number(p.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    });
  }
}

