import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap, map } from 'rxjs';
import { ApiResponse } from '../models/auth.models';
import { environment } from '../../environments/environment';
import {
  Branch, Warehouse, WarehouseTree, Zone, Rack, Shelf, Bin,
  Category, Product, InventoryBalance, FefoBatchRecommendation,
  StockTransaction, StockTransfer, StockAdjustment, DashboardMetrics,
  ChartData, NotificationItem, AuditLogItem, PlatformStats, Client,
  SaleInvoice, CheckoutRequest, PriceOrderPreview
} from '../models/wms.models';

@Injectable({
  providedIn: 'root'
})
export class WmsApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Platform Admin
  getPlatformStats(): Observable<ApiResponse<PlatformStats>> {
    return this.http.get<ApiResponse<PlatformStats>>(`${this.baseUrl}/platform/stats`);
  }

  getPlatformClients(status?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/platform/clients`, { params });
  }

  updateClientStatus(id: number, status: string): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.baseUrl}/platform/clients/${id}/status`, { status });
  }

  deleteClient(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/platform/clients/${id}`);
  }

  deleteAllClients(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/platform/clients/all`);
  }

  getPlatformAuditLogs(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/platform/audit-logs`);
  }

  updatePlatformCredentials(data: { email?: string; currentPassword?: string; newPassword?: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/platform/credentials`, data);
  }

  // Dashboard
  getDashboardMetrics(): Observable<ApiResponse<DashboardMetrics>> {
    return this.http.get<ApiResponse<DashboardMetrics>>(`${this.baseUrl}/dashboard/metrics`);
  }

  getDashboardCharts(): Observable<ApiResponse<ChartData>> {
    return this.http.get<ApiResponse<ChartData>>(`${this.baseUrl}/dashboard/charts`);
  }

  // Branches
  getBranches(): Observable<ApiResponse<Branch[]>> {
    return this.http.get<ApiResponse<Branch[]>>(`${this.baseUrl}/branches`);
  }

  createBranch(branch: Partial<Branch>): Observable<ApiResponse<Branch>> {
    return this.http.post<ApiResponse<Branch>>(`${this.baseUrl}/branches`, branch);
  }

  // Warehouses & Spatial Hierarchy
  getWarehouses(branchId?: number): Observable<ApiResponse<Warehouse[]>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<ApiResponse<Warehouse[]>>(`${this.baseUrl}/warehouses`, { params });
  }

  createWarehouse(warehouse: Partial<Warehouse>): Observable<ApiResponse<Warehouse>> {
    return this.http.post<ApiResponse<Warehouse>>(`${this.baseUrl}/warehouses`, warehouse);
  }

  ensureDefaultWarehouse(name: string = 'Main Warehouse'): Observable<Warehouse> {
    return this.getWarehouses().pipe(
      switchMap(res => {
        if (res.success && res.data && res.data.length > 0) {
          const match = res.data.find(w => w.name.toLowerCase() === name.toLowerCase());
          if (match) return of(match);
          return of(res.data[0]);
        }
        return this.getBranches().pipe(
          switchMap(bRes => {
            if (bRes.success && bRes.data && bRes.data.length > 0) {
              const branchId = bRes.data[0].id;
              const code = 'WH-' + Math.floor(1000 + Math.random() * 9000);
              return this.createWarehouse({
                branchId,
                name: name || 'Main Warehouse',
                code,
                address: 'Main Facility'
              }).pipe(map(wRes => wRes.data));
            }
            return this.createBranch({
              branchName: 'Main Branch',
              branchCode: 'HQ-01',
              address: 'Headquarters'
            }).pipe(
              switchMap(nbRes => {
                const branchId = nbRes.data.id;
                const code = 'WH-' + Math.floor(1000 + Math.random() * 9000);
                return this.createWarehouse({
                  branchId,
                  name: name || 'Main Warehouse',
                  code,
                  address: 'Main Facility'
                }).pipe(map(wRes => wRes.data));
              })
            );
          })
        );
      })
    );
  }

  getWarehouseTree(id: number): Observable<ApiResponse<WarehouseTree>> {
    return this.http.get<ApiResponse<WarehouseTree>>(`${this.baseUrl}/warehouses/${id}/tree`);
  }

  addZone(warehouseId: number, zone: Partial<Zone>): Observable<ApiResponse<Zone>> {
    return this.http.post<ApiResponse<Zone>>(`${this.baseUrl}/warehouses/${warehouseId}/zones`, zone);
  }

  addRack(zoneId: number, rack: Partial<Rack>): Observable<ApiResponse<Rack>> {
    return this.http.post<ApiResponse<Rack>>(`${this.baseUrl}/warehouses/zones/${zoneId}/racks`, rack);
  }

  addShelf(rackId: number, shelf: Partial<Shelf>): Observable<ApiResponse<Shelf>> {
    return this.http.post<ApiResponse<Shelf>>(`${this.baseUrl}/warehouses/racks/${rackId}/shelves`, shelf);
  }

  addBin(shelfId: number, bin: Partial<Bin>): Observable<ApiResponse<Bin>> {
    return this.http.post<ApiResponse<Bin>>(`${this.baseUrl}/warehouses/shelves/${shelfId}/bins`, bin);
  }

  getBinByQr(qrCode: string): Observable<ApiResponse<Bin>> {
    return this.http.get<ApiResponse<Bin>>(`${this.baseUrl}/warehouses/bins/qr/${qrCode}`);
  }

  // Categories & Products
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/categories`);
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.baseUrl}/categories`, category);
  }

  getProducts(query?: string, page = 0, size = 100): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (query) params = params.set('query', query);
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/products`, { params });
  }

  getAllProductsList(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/products/all`);
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`);
  }

  scanProductCode(code: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/scan/${code}`);
  }

  createProduct(product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products`, product);
  }

  updateProduct(id: number, product: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/products/${id}`);
  }

  getProductQrImage(id: number): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.baseUrl}/products/${id}/qr-image`);
  }

  getProductBarcodeImage(id: number): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.baseUrl}/products/${id}/barcode-image`);
  }

  importProductsExcel(file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/products/import`, formData);
  }

  exportProductsExcelUrl(): string {
    return `${this.baseUrl}/products/export`;
  }

  // Inventory & Stock Movements
  getInventory(warehouseId?: number, productId?: number): Observable<ApiResponse<InventoryBalance[]>> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId.toString());
    if (productId) params = params.set('productId', productId.toString());
    return this.http.get<ApiResponse<InventoryBalance[]>>(`${this.baseUrl}/inventory`, { params });
  }

  getFefoRecommendations(productId: number, warehouseId?: number): Observable<ApiResponse<FefoBatchRecommendation[]>> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId.toString());
    return this.http.get<ApiResponse<FefoBatchRecommendation[]>>(`${this.baseUrl}/inventory/fefo/${productId}`, { params });
  }

  stockIn(payload: any): Observable<ApiResponse<InventoryBalance>> {
    return this.http.post<ApiResponse<InventoryBalance>>(`${this.baseUrl}/stock/in`, payload);
  }

  stockOut(payload: any): Observable<ApiResponse<InventoryBalance>> {
    return this.http.post<ApiResponse<InventoryBalance>>(`${this.baseUrl}/stock/out`, payload);
  }

  getStockTransactions(page = 0, size = 50): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stock/transactions`, { params });
  }

  deleteStockTransaction(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/stock/transactions/${id}`);
  }

  clearAllStockTransactions(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/stock/transactions/all`);
  }

  // Transfers
  getTransfers(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/transfers`);
  }

  createTransfer(payload: any): Observable<ApiResponse<StockTransfer>> {
    return this.http.post<ApiResponse<StockTransfer>>(`${this.baseUrl}/transfers`, payload);
  }

  approveTransfer(id: number): Observable<ApiResponse<StockTransfer>> {
    return this.http.put<ApiResponse<StockTransfer>>(`${this.baseUrl}/transfers/${id}/approve`, {});
  }

  dispatchTransfer(id: number): Observable<ApiResponse<StockTransfer>> {
    return this.http.put<ApiResponse<StockTransfer>>(`${this.baseUrl}/transfers/${id}/dispatch`, {});
  }

  receiveTransfer(id: number): Observable<ApiResponse<StockTransfer>> {
    return this.http.put<ApiResponse<StockTransfer>>(`${this.baseUrl}/transfers/${id}/receive`, {});
  }

  // Adjustments
  getAdjustments(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/adjustments`);
  }

  requestAdjustment(payload: any): Observable<ApiResponse<StockAdjustment>> {
    return this.http.post<ApiResponse<StockAdjustment>>(`${this.baseUrl}/adjustments`, payload);
  }

  reviewAdjustment(id: number, approve: boolean, reviewNotes: string): Observable<ApiResponse<StockAdjustment>> {
    return this.http.put<ApiResponse<StockAdjustment>>(`${this.baseUrl}/adjustments/${id}/review`, { approve, reviewNotes });
  }

  // Notifications
  getNotifications(): Observable<ApiResponse<NotificationItem[]>> {
    return this.http.get<ApiResponse<NotificationItem[]>>(`${this.baseUrl}/notifications`);
  }

  getUnreadNotificationsCount(): Observable<ApiResponse<{ unreadCount: number }>> {
    return this.http.get<ApiResponse<{ unreadCount: number }>>(`${this.baseUrl}/notifications/unread-count`);
  }

  markNotificationRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/notifications/read-all`, {});
  }

  // Audit Logs & Reports
  getAuditLogs(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/audit-logs`);
  }

  getInventoryPdfUrl(): string {
    return `${this.baseUrl}/reports/inventory/pdf`;
  }

  getMovementsExcelUrl(): string {
    return `${this.baseUrl}/reports/movements/excel`;
  }

  // Users
  getUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/users`);
  }

  createUser(user: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/users`, user);
  }

  // Billing & POS
  checkoutSale(payload: CheckoutRequest): Observable<ApiResponse<SaleInvoice>> {
    return this.http.post<ApiResponse<SaleInvoice>>(`${this.baseUrl}/billing/checkout`, payload);
  }

  getSaleInvoices(page = 0, size = 20, query?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (query && query.trim()) params = params.set('query', query.trim());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/billing/invoices`, { params });
  }

  getSaleInvoice(id: number): Observable<ApiResponse<SaleInvoice>> {
    return this.http.get<ApiResponse<SaleInvoice>>(`${this.baseUrl}/billing/invoices/${id}`);
  }

  uploadPriceOrderExcel(file: File): Observable<ApiResponse<PriceOrderPreview>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<PriceOrderPreview>>(`${this.baseUrl}/billing/upload-price-order`, formData);
  }

  getPriceOrderTemplateUrl(): string {
    return `${this.baseUrl}/billing/price-order-template`;
  }
}
