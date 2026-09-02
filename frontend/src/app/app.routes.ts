import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LayoutComponent } from './components/layout/layout.component';
import { PlatformAdminComponent } from './components/platform-admin/platform-admin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { BranchesComponent } from './components/branches/branches.component';
import { WarehousesComponent } from './components/warehouses/warehouses.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { StockMovementComponent } from './components/stock-movement/stock-movement.component';
import { StockTransferComponent } from './components/stock-transfer/stock-transfer.component';
import { StockAdjustmentComponent } from './components/stock-adjustment/stock-adjustment.component';
import { ScannerComponent } from './components/scanner/scanner.component';
import { ReportsComponent } from './components/reports/reports.component';
import { UsersComponent } from './components/users/users.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Platform Admin Routes
  {
    path: 'platform-admin',
    component: PlatformAdminComponent,
    canActivate: [authGuard],
    data: { roles: ['PLATFORM_ADMIN'] }
  },

  // Tenant Workspace
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'branches', component: BranchesComponent },
      { path: 'warehouses', component: WarehousesComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'stock-movement', component: StockMovementComponent },
      { path: 'transfers', component: StockTransferComponent },
      { path: 'adjustments', component: StockAdjustmentComponent },
      { path: 'scanner', component: ScannerComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'users', component: UsersComponent, data: { roles: ['CLIENT_ADMIN'] } },
      { path: 'audit-logs', component: AuditLogsComponent, data: { roles: ['CLIENT_ADMIN'] } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
