import { Role, ClientStatus, UserProfile } from './auth.models';
export type { UserProfile };

export interface Client {
  id: number;
  companyName: string;
  companyCode: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  allowNegativeStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  suspendedClients: number;
  totalBranches: number;
  totalWarehouses: number;
  totalUsers: number;
}

export interface Branch {
  id: number;
  clientId: number;
  branchName: string;
  branchCode: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Warehouse {
  id: number;
  clientId: number;
  branchId: number;
  branchName?: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

export interface Bin {
  id: number;
  clientId: number;
  shelfId: number;
  code: string;
  qrCode: string;
  capacityCubicMeters: number;
  isActive: boolean;
}

export interface Shelf {
  id: number;
  clientId: number;
  rackId: number;
  code: string;
  bins: Bin[];
}

export interface Rack {
  id: number;
  clientId: number;
  zoneId: number;
  code: string;
  shelves: Shelf[];
}

export interface Zone {
  id: number;
  clientId: number;
  warehouseId: number;
  name: string;
  code: string;
  description: string;
  racks: Rack[];
}

export interface WarehouseTree {
  id: number;
  name: string;
  code: string;
  branchId: number;
  branchName: string;
  zones: Zone[];
}

export interface Category {
  id: number;
  clientId: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  clientId: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  sku: string;
  barcode?: string;
  qrCode?: string;
  brand?: string;
  unit: string;
  description?: string;
  reorderLevel: number;
  minStockLevel: number;
  maxStockLevel: number;
  expiryTrackingEnabled: boolean;
  isActive: boolean;
  currentStock: number;
  createdAt?: string;
}

export interface InventoryBalance {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  barcode: string;
  warehouseId: number;
  warehouseName: string;
  binId?: number;
  binCode?: string;
  binQrCode?: string;
  batchId?: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface FefoBatchRecommendation {
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  availableQuantity: number;
  suggestedPickQuantity: number;
  warehouseId: number;
  binId?: number;
  binCode?: string;
}

export interface StockTransaction {
  id: number;
  clientId: number;
  warehouseId: number;
  binId?: number;
  productId: number;
  batchId?: number;
  userId: number;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUB';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceNumber: string;
  notes: string;
  createdAt: string;
}

export interface StockTransfer {
  id: number;
  clientId: number;
  transferNumber: string;
  sourceWarehouseId: number;
  destWarehouseId: number;
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  createdBy: number;
  approvedBy?: number;
  notes: string;
  createdAt: string;
}

export interface StockTransferItem {
  id: number;
  transferId: number;
  productId: number;
  batchId?: number;
  sourceBinId?: number;
  destBinId?: number;
  quantity: number;
  receivedQuantity: number;
}

export interface StockAdjustment {
  id: number;
  clientId: number;
  adjustmentNumber: string;
  warehouseId: number;
  binId?: number;
  productId: number;
  batchId?: number;
  systemQuantity: number;
  physicalQuantity: number;
  discrepancyQuantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: number;
  reviewedBy?: number;
  reviewNotes?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalInventoryQuantity: number;
  totalWarehouses: number;
  totalBranches: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  pendingAdjustmentsCount: number;
  pendingTransfersCount: number;
  recentActivities: {
    action: string;
    description: string;
    timestamp: string;
  }[];
}

export interface ChartData {
  labels: string[];
  stockInSeries: number[];
  stockOutSeries: number[];
  warehouseDistribution: {
    warehouseName: string;
    totalQuantity: number;
  }[];
}

export interface NotificationItem {
  id: number;
  clientId?: number;
  userId?: number;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED' | 'TRANSFER_REQUEST' | 'ADJUSTMENT_REQUEST' | 'REGISTRATION_STATUS' | 'SYSTEM';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  clientId?: number;
  userId?: number;
  branchId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  description: string;
  ipAddress?: string;
  createdAt: string;
}
