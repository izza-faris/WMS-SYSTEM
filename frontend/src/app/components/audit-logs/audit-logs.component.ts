import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WmsApiService } from '../../services/wms-api.service';
import { AuditLogItem } from '../../models/wms.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-logs-page animate__animated animate__fadeIn">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold text-light mb-1">Security & Operational Audit Trail</h2>
          <p class="text-secondary small mb-0">Immutable tenant-scoped activity ledger recording stock mutations, user updates, and system events</p>
        </div>
      </div>

      <div class="glass-panel p-0 overflow-hidden mb-4">
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity Affected</th>
                <th>Description</th>
                <th>User / IP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs()" class="animate__animated animate__fadeIn">
                <td class="text-muted small text-nowrap">{{ log.createdAt | date:'medium' }}</td>
                <td>
                  <span class="badge bg-primary bg-opacity-20 text-primary">{{ log.action }}</span>
                </td>
                <td>
                  <span class="text-light small fw-bold">{{ log.entityType }}</span>
                  <small *ngIf="log.entityId" class="text-muted text-xs ms-1">#{{ log.entityId }}</small>
                </td>
                <td class="text-secondary small">{{ log.description }}</td>
                <td class="text-muted text-xs">
                  <div>User #{{ log.userId || 'System' }}</div>
                  <div>{{ log.ipAddress || '127.0.0.1' }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLogItem[]>([]);

  constructor(private wmsApi: WmsApiService) {}

  ngOnInit(): void {
    this.wmsApi.getAuditLogs().subscribe({
      next: (res) => {
        if (res.success && res.data?.content) this.logs.set(res.data.content);
      }
    });
  }
}
