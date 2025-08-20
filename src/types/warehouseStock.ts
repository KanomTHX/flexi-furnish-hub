// Warehouse Stock Types
export interface StockUpdateEvent {
  id: string;
  type: 'receive' | 'withdraw' | 'transfer' | 'adjust' | 'stock_level_changed' | 'movement_logged' | 'serial_number_updated' | 'alert_triggered';
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  serialNumbers?: string[];
  reason?: string;
  timestamp: string;
  userId: string;
  userName: string;
  data?: any;
}

export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'damaged' | 'expiring';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning' | 'info';
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  currentQuantity: number;
  threshold?: number;
  message: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  isRead?: boolean;
  recommendedAction?: string;
  currentStock?: number;
}

export interface StockLevel {
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minThreshold: number;
  maxThreshold: number;
  lastUpdated: string;
}

export interface StockSearchFilters {
  searchTerm: string;
  branchId: string;
  category: string;
  status: 'available' | 'reserved' | 'damaged' | 'out_of_stock' | '';
  productId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface BranchStockSummary {
  branchId: string;
  branchName: string;
  totalProducts: number;
  totalQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  lastUpdated: string;
}

// Enhanced StockLevel interface with additional properties for compatibility
export interface EnhancedStockLevel extends StockLevel {
  productCode?: string;
  totalQuantity?: number;
  soldQuantity?: number;
  transferredQuantity?: number;
  claimedQuantity?: number;
  damagedQuantity?: number;
  averageCost?: number;
  availableValue?: number;
}

// Enhanced StockMovement interface with additional properties for compatibility
export interface StockMovement {
  id: string;
  type: 'receive' | 'withdraw' | 'transfer' | 'adjust';
  movementType?: MovementType;
  productId: string;
  productName: string;
  product?: {
    name: string;
    code: string;
  };
  branchId: string;
  branchName: string;
  branch?: {
    name: string;
  };
  quantity: number;
  timestamp: string;
  createdAt?: string;
  userId: string;
  userName: string;
  performedBy?: string;
  notes?: string;
  serialNumber?: string;
  referenceNumber?: string;
  unitCost?: number;
}

export type MovementType = 'receive' | 'withdraw' | 'transfer' | 'adjust';

// Additional types for compatibility
export interface SerialNumber {
  id: string;
  serial_number: string;
  product_id: string;
  branch_id: string;
  status: SNStatus;
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceBranchId: string;
  targetBranchId: string;
  totalItems: number;
  items: Array<{
    productId: string;
    quantity: number;
    serialNumbers?: string[];
  }>;
  status: TransferStatus;
  initiatedBy: string;
  createdAt: string;
  notes?: string;
}

export interface StockTransaction {
  id: string;
  type: MovementType;
  reference: string;
  timestamp: string;
}

export type SNStatus = 'available' | 'sold' | 'transferred' | 'claimed' | 'damaged';

export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

// Import TransferStatus into warehouse.ts exports
export type { TransferStatus as WarehouseTransferStatus };