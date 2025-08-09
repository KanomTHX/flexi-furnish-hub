// Warehouse Stock System Types - Serial Number Management

// Re-export core enums and interfaces from warehouse.ts for convenience
export {
  SNStatus,
  MovementType,
  ReferenceType,
  ClaimType,
  ClaimResolution,
  AdjustmentType,
  ReceiveStatus,
  SerialNumber,
  StockMovement,
  StockTransfer,
  StockTransferItem,
  ReceiveLog,
  ClaimLog,
  StockAdjustment,
  Product,
  Supplier,
  StockLevel,
  StockSearchFilters,
  MovementFilters,
  TransferFilters,
  StockLevelResponse,
  SerialNumberResponse,
  MovementResponse,
  ReceiveGoodsForm,
  WithdrawGoodsForm,
  TransferForm,
  ClaimForm
} from './warehouse';

// Additional specialized types for the warehouse stock system

// Service Layer Interfaces
export interface SNGeneratorService {
  generateSN(productCode: string, quantity: number): Promise<string[]>;
  validateSN(serialNumber: string): Promise<boolean>;
  getSNDetails(serialNumber: string): Promise<SerialNumber | null>;
  checkSNAvailability(serialNumber: string): Promise<boolean>;
}

export interface StockManagementService {
  getStockLevels(filters: StockSearchFilters): Promise<StockLevelResponse>;
  updateStock(transaction: StockTransaction): Promise<void>;
  getMovementHistory(filters: MovementFilters): Promise<MovementResponse>;
  checkStockAlerts(): Promise<StockAlert[]>;
  getSerialNumbers(filters: StockSearchFilters): Promise<SerialNumberResponse>;
}

export interface TransferService {
  initiateTransfer(request: TransferRequest): Promise<StockTransfer>;
  confirmTransfer(transferId: string, confirmerId: string): Promise<void>;
  cancelTransfer(transferId: string, reason: string): Promise<void>;
  getTransferHistory(filters: TransferFilters): Promise<TransferResponse>;
}

export interface PrintService {
  printReceiveDocument(receiveData: ReceiveData): Promise<void>;
  printSNStickers(serialNumbers: SerialNumber[]): Promise<void>;
  printTransferDocument(transfer: StockTransfer): Promise<void>;
  printStockReport(reportData: StockReportData): Promise<void>;
}

// Transaction and Request Types
export interface StockTransaction {
  type: 'receive' | 'withdraw' | 'transfer' | 'adjust' | 'claim';
  items: StockTransactionItem[];
  warehouseId: string;
  reference?: string;
  notes?: string;
  performedBy: string;
}

export interface StockTransactionItem {
  productId: string;
  serialNumberId?: string;
  quantity: number;
  unitCost?: number;
  reason?: string;
  targetWarehouseId?: string; // For transfers
}

export interface TransferRequest {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: TransferRequestItem[];
  notes?: string;
  initiatedBy: string;
}

export interface TransferRequestItem {
  serialNumberId: string;
  productId: string;
  unitCost: number;
}

export interface ReceiveData {
  productId: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  warehouseId: string;
  generatedSNs: SerialNumber[];
  notes?: string;
}

// Alert and Notification Types
export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'damaged';
  severity: 'info' | 'warning' | 'error' | 'critical';
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  threshold?: number;
  message: string;
  recommendedAction?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

// Report Types
export interface StockReportData {
  type: 'stock_levels' | 'movements' | 'transfers' | 'claims' | 'adjustments';
  title: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: any;
  data: any[];
  summary: StockReportSummary;
  generatedAt: Date;
  generatedBy: string;
}

export interface StockReportSummary {
  totalItems: number;
  totalValue: number;
  totalMovements?: number;
  totalTransfers?: number;
  totalClaims?: number;
  averageValue?: number;
  topProducts?: {
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }[];
}

// Dashboard and Analytics Types
export interface StockDashboardData {
  summary: {
    totalProducts: number;
    totalStockValue: number;
    totalQuantity: number;
    lowStockItems: number;
    outOfStockItems: number;
    pendingTransfers: number;
    todayMovements: number;
  };
  recentMovements: StockMovement[];
  pendingTransfers: StockTransfer[];
  stockAlerts: StockAlert[];
  topProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalValue: number;
  }[];
  warehouseUtilization: {
    warehouseId: string;
    warehouseName: string;
    totalCapacity: number;
    currentStock: number;
    utilizationPercentage: number;
  }[];
}

// Component Props Types
export interface ReceiveGoodsProps {
  onReceiveComplete: (receiveData: ReceiveData) => void;
  onCancel: () => void;
}

export interface StockInquiryProps {
  searchFilters: StockSearchFilters;
  onFilterChange: (filters: StockSearchFilters) => void;
  onSerialNumberSelect: (serialNumber: SerialNumber) => void;
}

export interface WithdrawDispatchProps {
  mode: 'withdraw' | 'dispatch' | 'claim';
  onTransactionComplete: (transaction: StockTransaction) => void;
  onCancel: () => void;
}

export interface TransferProps {
  sourceWarehouse?: Warehouse;
  onTransferInitiate: (transfer: TransferRequest) => void;
  onTransferConfirm: (transferId: string) => void;
  onCancel: () => void;
}

export interface SNGeneratorProps {
  productCode: string;
  quantity: number;
  onGenerate: (serialNumbers: string[]) => void;
  onValidate: (serialNumber: string) => Promise<boolean>;
}

export interface SNListProps {
  serialNumbers: SerialNumber[];
  onSelect: (serialNumber: SerialNumber) => void;
  onStatusChange: (serialNumberId: string, status: SNStatus) => void;
  selectable?: boolean;
  multiSelect?: boolean;
}

export interface StockCardProps {
  stockLevel: StockLevel;
  onClick: () => void;
  showDetails?: boolean;
}

export interface MovementLogProps {
  movements: StockMovement[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface PrintDialogProps {
  type: 'receive' | 'transfer' | 'sticker' | 'report';
  data: any;
  onPrint: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export interface TransferDialogProps {
  transfer: StockTransfer;
  onConfirm: () => void;
  onCancel: () => void;
  onReject: (reason: string) => void;
  isOpen: boolean;
}

// Hook Return Types
export interface UseStockReturn {
  stockLevels: StockLevel[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  searchStock: (filters: StockSearchFilters) => void;
  updateStock: (transaction: StockTransaction) => Promise<void>;
}

export interface UseWarehousesReturn {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getWarehouse: (id: string) => Warehouse | undefined;
}

export interface UseSerialNumbersReturn {
  serialNumbers: SerialNumber[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  generateSN: (productCode: string, quantity: number) => Promise<string[]>;
  validateSN: (serialNumber: string) => Promise<boolean>;
  updateSNStatus: (serialNumberId: string, status: SNStatus) => Promise<void>;
}

export interface UseMovementsReturn {
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getMovements: (filters: MovementFilters) => void;
}

export interface UseTransfersReturn {
  transfers: StockTransfer[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  initiateTransfer: (request: TransferRequest) => Promise<StockTransfer>;
  confirmTransfer: (transferId: string) => Promise<void>;
  cancelTransfer: (transferId: string, reason: string) => Promise<void>;
}

// Utility Types
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'name' | 'code' | 'quantity' | 'value' | 'date' | 'status';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

// Error Types
export interface StockError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export enum StockErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_SN = 'DUPLICATE_SN',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  WAREHOUSE_NOT_FOUND = 'WAREHOUSE_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  SERIAL_NUMBER_NOT_FOUND = 'SERIAL_NUMBER_NOT_FOUND',
  TRANSFER_NOT_ALLOWED = 'TRANSFER_NOT_ALLOWED',
  INVALID_STATUS_CHANGE = 'INVALID_STATUS_CHANGE',
  PRINT_ERROR = 'PRINT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// Configuration Types
export interface StockSystemConfig {
  snGenerationPattern: string;
  autoGenerateSN: boolean;
  requireApprovalForAdjustments: boolean;
  enableRealTimeUpdates: boolean;
  printStickerSize: {
    width: number;
    height: number;
  };
  stockAlertThresholds: {
    lowStock: number;
    outOfStock: number;
    overstock: number;
  };
  transferApprovalRequired: boolean;
  claimApprovalRequired: boolean;
}

// Import/Export Types
export interface StockExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeMovements: boolean;
  includeSerialNumbers: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  warehouseIds?: string[];
  productIds?: string[];
}

export interface StockImportData {
  products: Product[];
  serialNumbers: Omit<SerialNumber, 'id' | 'createdAt' | 'updatedAt'>[];
  movements: Omit<StockMovement, 'id' | 'createdAt'>[];
}

// Response wrapper for API calls
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: StockError;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Re-export Warehouse interface from warehouse.ts
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'main' | 'branch' | 'distribution' | 'retail' | 'temporary';
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  address: any;
  contact: any;
  capacity: any;
  facilities: any;
  operatingHours: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Transfer response type
export interface TransferResponse {
  data: StockTransfer[];
  total: number;
  page: number;
  limit: number;
}