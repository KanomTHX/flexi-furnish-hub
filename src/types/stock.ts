// Stock Management Types - Integrated with Warehouse System

export interface StockLevel {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    barcode?: string;
    image?: string;
    unitCost: number;
    sellingPrice: number;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  zoneId: string;
  zone: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  locationId?: string;
  location?: {
    id: string;
    code: string;
    rackId: string;
    level: number;
    position: number;
  };
  
  // Stock Quantities
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  damagedQuantity: number;
  
  // Stock Levels
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  safetyStock: number;
  
  // Cost Information
  averageCost: number;
  totalValue: number;
  lastCost: number;
  
  // Batch Information
  batch?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  
  // Status
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' | 'discontinued';
  
  // Tracking
  lastMovementDate: string;
  lastCountDate?: string;
  nextCountDate?: string;
  
  updatedAt: string;
  updatedBy: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    product_code: string;
    category: string;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  zoneId: string;
  zone: {
    id: string;
    name: string;
    code: string;
  };
  locationId?: string;
  
  // Movement Details
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'loss';
  subType?: 'purchase' | 'sale' | 'production' | 'count_adjustment' | 'warehouse_transfer' | 'customer_return' | 'supplier_return';
  quantity: number;
  previousStock: number;
  newStock: number;
  
  // Cost Information
  unitCost: number;
  totalCost: number;
  
  // Reference Information
  referenceType?: 'purchase_order' | 'sales_order' | 'transfer_order' | 'adjustment' | 'count';
  referenceId?: string;
  referenceNumber?: string;
  
  // Additional Details
  reason: string;
  notes?: string;
  batch?: string;
  expiryDate?: string;
  
  // Related Transfer (if applicable)
  transferId?: string;
  fromBranchId?: string;
  fromBranch?: {
    id: string;
    name: string;
    code: string;
  };
  toBranchId?: string;
  toBranch?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Supplier/Customer Information
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Tracking
  createdAt: string;
  createdBy: string;
  employeeName: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  type: 'increase' | 'decrease' | 'correction';
  reason: 'count_variance' | 'damage' | 'loss' | 'found' | 'correction' | 'expiry' | 'other';
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  
  items: StockAdjustmentItem[];
  totalItems: number;
  totalVariance: number;
  totalValue: number;
  
  // Approval
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  
  // Details
  description: string;
  notes?: string;
  attachments?: string[];
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface StockAdjustmentItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  zoneId: string;
  locationId?: string;
  
  systemQuantity: number;
  adjustedQuantity: number;
  variance: number;
  unitCost: number;
  totalCost: number;
  
  reason: string;
  notes?: string;
  batch?: string;
  expiryDate?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  zoneId?: string;
  zone?: {
    id: string;
    name: string;
    code: string;
  };
  
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired' | 'reorder_point';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  
  currentStock: number;
  threshold?: number;
  recommendedAction?: string;
  
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  
  createdAt: string;
}

export interface StockCount {
  id: string;
  countNumber: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  zoneId?: string;
  zone?: {
    id: string;
    name: string;
    code: string;
  };
  
  type: 'full' | 'partial' | 'cycle' | 'spot';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  
  // Scope
  includeAllProducts: boolean;
  productIds?: string[];
  categoryFilter?: string;
  
  // Progress
  totalItems: number;
  countedItems: number;
  varianceItems: number;
  completionPercentage: number;
  
  // Results
  totalVariance: number;
  totalVarianceValue: number;
  accuracyPercentage: number;
  
  // Schedule
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  
  // Team
  countedBy: string[];
  supervisedBy: string;
  
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface StockCountItem {
  id: string;
  countId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  locationId?: string;
  location?: {
    id: string;
    code: string;
  };
  
  systemQuantity: number;
  countedQuantity?: number;
  variance?: number;
  variancePercentage?: number;
  unitCost: number;
  varianceValue?: number;
  
  status: 'pending' | 'counted' | 'verified' | 'adjusted';
  countedBy?: string;
  countedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  
  notes?: string;
  batch?: string;
  expiryDate?: string;
}

export interface StockSummary {
  totalProducts: number;
  totalStockValue: number;
  totalQuantity: number;
  
  // By Status
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  
  // By Warehouse
  branchBreakdown: {
    branchId: string;
    branchName: string;
    totalProducts: number;
    totalValue: number;
    utilizationPercentage: number;
  }[];
  
  // Movement Summary
  todayMovements: number;
  weekMovements: number;
  monthMovements: number;
  
  // Alerts
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  
  // Top Products
  topValueProducts: {
    productId: string;
    productName: string;
    sku: string;
    totalValue: number;
    quantity: number;
  }[];
  
  topMovingProducts: {
    productId: string;
    productName: string;
    sku: string;
    movementCount: number;
    totalQuantity: number;
  }[];
  
  // Performance Metrics
  averageTurnoverRate: number;
  averageDaysOfSupply: number;
  stockAccuracy: number;
  
  lastUpdated: string;
}

// Filters and Search
export interface StockFilter {
  branchId?: string;
  zoneId?: string;
  categoryId?: string;
  status?: StockLevel['status'];
  stockLevel?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  search?: string;
  sortBy?: 'name' | 'sku' | 'quantity' | 'value' | 'lastMovement';
  sortOrder?: 'asc' | 'desc';
}

export interface MovementFilter {
  branchId?: string;
  zoneId?: string;
  productId?: string;
  type?: StockMovement['type'];
  subType?: StockMovement['subType'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'date' | 'product' | 'quantity' | 'value';
  sortOrder?: 'asc' | 'desc';
}

export interface AlertFilter {
  branchId?: string;
  type?: StockAlert['type'];
  severity?: StockAlert['severity'];
  isRead?: boolean;
  isResolved?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Export/Import Types
export interface StockExportData {
  products: {
    id: string;
    name: string;
    sku: string;
    category: string;
    branch: string;
    zone: string;
    location?: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    averageCost: number;
    totalValue: number;
    status: string;
    lastMovement: string;
    batch?: string;
    expiryDate?: string;
  }[];
  summary: {
    totalProducts: number;
    totalValue: number;
    exportDate: string;
    exportedBy: string;
  };
}

export interface MovementExportData {
  movements: {
    date: string;
    product: string;
    sku: string;
    branch: string;
    zone: string;
    type: string;
    subType?: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost: number;
    totalCost: number;
    reference?: string;
    reason: string;
    employee: string;
    notes?: string;
  }[];
  summary: {
    totalMovements: number;
    totalValue: number;
    dateRange: {
      from: string;
      to: string;
    };
    exportDate: string;
    exportedBy: string;
  };
}