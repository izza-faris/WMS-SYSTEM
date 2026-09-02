import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WmsApiService } from '../../services/wms-api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Business Intelligence & Export Reports</h2>
          <p class="text-secondary small mb-0">Generate production-grade PDF and Excel reports scoped strictly to your tenant workspace</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- PDF Inventory Report -->
        <div class="col-md-6">
          <div class="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="p-3 bg-danger bg-opacity-10 text-danger rounded-3 d-inline-block mb-3">
                <i class="bi bi-file-earmark-pdf-fill fs-2"></i>
              </div>
              <h4 class="fw-bold text-light">Inventory Balances Report (PDF)</h4>
              <p class="text-secondary small mb-4">
                Detailed inventory audit report formatted in A4 Landscape containing product details, storage bin locations, batch expiration dates, and on-hand balances.
              </p>
            </div>

            <a [href]="inventoryPdfUrl" target="_blank" class="btn btn-danger d-flex align-items-center justify-content-center gap-2 py-2">
              <i class="bi bi-download"></i>
              <span>Download PDF Report</span>
            </a>
          </div>
        </div>

        <!-- Excel Movements Report -->
        <div class="col-md-6">
          <div class="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="p-3 bg-success bg-opacity-10 text-success rounded-3 d-inline-block mb-3">
                <i class="bi bi-file-earmark-excel-fill fs-2"></i>
              </div>
              <h4 class="fw-bold text-light">Stock Movements Ledger (Excel .xlsx)</h4>
              <p class="text-secondary small mb-4">
                Comprehensive spreadsheet of all historical stock changes, including Stock In receipts, Stock Out dispatches, inter-branch transfers, and physical cycle count adjustments.
              </p>
            </div>

            <a [href]="movementsExcelUrl" target="_blank" class="btn btn-success d-flex align-items-center justify-content-center gap-2 py-2">
              <i class="bi bi-file-earmark-spreadsheet-fill"></i>
              <span>Download Excel Spreadsheet</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  inventoryPdfUrl = '';
  movementsExcelUrl = '';

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.inventoryPdfUrl = this.wmsApi.getInventoryPdfUrl();
    this.movementsExcelUrl = this.wmsApi.getMovementsExcelUrl();
  }
}
