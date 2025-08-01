// Stock Management Types
export interface StockMovement {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // เลขที่อ้างอิง เช่น PO, SO, Transfer
  cost?: number; // ต้นทุนต่อหน่วย
  totalCost?: number;
  location?: string; // สถานที่เก็บ
  batch?: string; // หมายเลข batch
  expiryDate?: string; // วันหมดอายุ
  supplierId?: string;
  supplier?: Supplier;
  employeeId: string;
  employeeName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
  };
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: Supplier;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  remainingQuantity: number;
  notes?: string;
}

export interface StockTake {
  id: string;
  takeNumber: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  type: 'full' | 'partial' | 'cycle';
  location?: string;
  category?: string;
  items: StockTakeItem[];
  startDate: string;
  endDate?: string;
  totalVariance: number;
  totalVarianceValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  completedBy?: string;
}

export interface StockTakeItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentCost: number;
  };
  systemQuantity: number;
  countedQuantity?: number;
  variance: number;
  varianceValue: number;
  reason?: string;
  notes?: string;
  countedBy?: string;
  countedAt?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  type: 'warehouse' | 'store' | 'display' | 'damaged' | 'quarantine';
  description?: string;
  isActive: boolean;
  capacity?: number;
  currentUtilization?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockLevel {
  productId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  averageCost: number;
  lastMovementDate?: string;
  updatedAt: string;
}

export interface StockSummary {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockItems: number;
  totalMovementsToday: number;
  totalMovementsThisMonth: number;
  averageTurnover: number;
  fastMovingItems: number;
  slowMovingItems: number;
}

export interface StockReport {
  id: string;
  type: 'inventory_valuation' | 'stock_movement' | 'abc_analysis' | 'aging' | 'turnover';
  title: string;
  parameters: Record<string, any>;
  data: any[];
  generatedAt: string;
  generatedBy: string;
}

// Filters and Search
export interface StockFilter {
  category?: string;
  location?: string;
  supplier?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  movementType?: StockMovement['type'];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ProductStock {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  averageCost: number;
  totalValue: number;
  lastMovementDate?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  locations: {
    locationId: string;
    locationName: string;
    quantity: number;
  }[];
  supplier?: {
    id: string;
    name: string;
  };
  image?: string;
  barcode?: string;
}