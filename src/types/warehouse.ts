// Warehouse Management Types - Extended for Serial Number System

// Core Enums
export enum SNStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  TRANSFERRED = 'transferred',
  CLAIMED = 'claimed',
  DAMAGED = 'damaged',
  RESERVED = 'reserved'
}

export enum MovementType {
  RECEIVE = 'receive',
  WITHDRAW = 'withdraw',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  ADJUSTMENT = 'adjustment',
  CLAIM = 'claim',
  RETURN = 'return'
}

export enum ReferenceType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  CLAIM = 'claim',
  RETURN = 'return',
  POS = 'pos',
  INSTALLMENT = 'installment'
}

export enum ClaimType {
  RETURN = 'return',
  WARRANTY = 'warranty',
  DEFECTIVE = 'defective',
  EXCHANGE = 'exchange'
}

export enum ClaimResolution {
  REFUND = 'refund',
  EXCHANGE = 'exchange',
  REPAIR = 'repair',
  REJECT = 'reject'
}

export enum AdjustmentType {
  COUNT = 'count',
  DAMAGE = 'damage',
  LOSS = 'loss',
  FOUND = 'found',
  CORRECTION = 'correction'
}

export enum ReceiveStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TransferStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Serial Number Interface
export interface SerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    product_code: string;
    sku?: string;
    brand?: string;
    model?: string;
    category?: string;
  };
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  unitCost: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  invoiceNumber?: string;
  status: SNStatus;
  soldAt?: Date;
  soldTo?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stock Movement Interface
export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    product_code: string;
    sku?: string;
  };
  serialNumberId?: string;
  serialNumber?: SerialNumber;
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  movementType: MovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: ReferenceType;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
  performedByName?: string;
  createdAt: Date;
}

// Stock Transfer Interfaces
export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  targetWarehouseId: string;
  targetWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  status: TransferStatus;
  totalItems: number;
  items: StockTransferItem[];
  notes?: string;
  initiatedBy: string;
  initiatedByName?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  serialNumberId: string;
  serialNumber?: SerialNumber;
  productId: string;
  product?: {
    id: string;
    name: string;
    product_code: string;
  };
  quantity: number;
  unitCost: number;
  status: TransferStatus;
  createdAt: Date;
}

// Receive Log Interface
export interface ReceiveLog {
  id: string;
  receiveNumber: string;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  invoiceNumber?: string;
  totalItems: number;
  totalCost: number;
  receivedBy: string;
  receivedByName?: string;
  status: ReceiveStatus;
  notes?: string;
  createdAt: Date;
}

// Claim Log Interface
export interface ClaimLog {
  id: string;
  claimNumber: string;
  serialNumberId: string;
  serialNumber?: SerialNumber;
  claimType: ClaimType;
  reason: string;
  customerName?: string;
  originalSaleReference?: string;
  resolution?: ClaimResolution;
  processedBy: string;
  processedByName?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// Stock Adjustment Interface
export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  adjustmentType: AdjustmentType;
  totalItems: number;
  reason: string;
  performedBy: string;
  performedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
}

// Product Interface (Extended)
export interface Product {
  id: string;
  name: string;
  product_code: string;
  sku?: string;
  category?: string;
  brand?: string;
  model?: string;
  description?: string;
  unitCost: number;
  sellingPrice: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Interface
export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number;
  creditLimit: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stock Level Summary Interface
export interface StockLevel {
  productId: string;
  productName: string;
  productCode: string;
  brand?: string;
  model?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  transferredQuantity: number;
  claimedQuantity: number;
  damagedQuantity: number;
  reservedQuantity: number;
  averageCost: number;
  availableValue: number;
}

// Search and Filter Interfaces
export interface StockSearchFilters {
  searchTerm?: string;
  warehouseId?: string;
  productId?: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status?: SNStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MovementFilters {
  warehouseId?: string;
  productId?: string;
  movementType?: MovementType;
  referenceType?: ReferenceType;
  dateFrom?: Date;
  dateTo?: Date;
  performedBy?: string;
}

export interface TransferFilters {
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  status?: TransferStatus;
  dateFrom?: Date;
  dateTo?: Date;
  initiatedBy?: string;
}

// API Response Interfaces
export interface StockLevelResponse {
  data: StockLevel[];
  total: number;
  page: number;
  limit: number;
}

export interface SerialNumberResponse {
  data: SerialNumber[];
  total: number;
  page: number;
  limit: number;
}

export interface MovementResponse {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

// Form Interfaces
export interface ReceiveGoodsForm {
  productId: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  warehouseId: string;
  notes?: string;
}

export interface WithdrawGoodsForm {
  serialNumbers: string[];
  reason: string;
  referenceType?: ReferenceType;
  referenceNumber?: string;
  soldTo?: string;
  notes?: string;
}

export interface TransferForm {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  serialNumbers: string[];
  notes?: string;
}

export interface ClaimForm {
  serialNumberId: string;
  claimType: ClaimType;
  reason: string;
  customerName?: string;
  originalSaleReference?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'main' | 'branch' | 'distribution' | 'retail' | 'temporary';
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  address: {
    street: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    manager: string;
    phone: string;
    email: string;
    emergencyContact?: string;
  };
  capacity: {
    totalArea: number; // ตารางเมตร
    usableArea: number;
    storageCapacity: number; // จำนวนชิ้น
    currentUtilization: number;
    utilizationPercentage: number;
  };
  zones: WarehouseZone[];
  facilities: {
    hasLoading: boolean;
    hasUnloading: boolean;
    hasColdStorage: boolean;
    hasSecuritySystem: boolean;
    hasFireSafety: boolean;
    hasClimateControl: boolean;
    parkingSpaces: number;
    loadingDocks: number;
  };
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  staff: WarehouseStaff[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface WarehouseZone {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: 'receiving' | 'storage' | 'picking' | 'packing' | 'shipping' | 'returns' | 'quarantine' | 'office';
  description?: string;
  area: number; // ตารางเมตร
  capacity: number; // จำนวนชิ้น
  currentStock: number;
  utilizationPercentage: number;
  temperature?: {
    min: number;
    max: number;
    current: number;
  };
  humidity?: {
    min: number;
    max: number;
    current: number;
  };
  restrictions: {
    maxWeight: number; // กิโลกรัม
    maxHeight: number; // เมตร
    hazardousAllowed: boolean;
    fragileOnly: boolean;
    climateControlled: boolean;
  };
  equipment: ZoneEquipment[];
  racks: StorageRack[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageRack {
  id: string;
  zoneId: string;
  code: string;
  type: 'pallet' | 'shelf' | 'bin' | 'floor' | 'hanging';
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  levels: number;
  capacity: number;
  currentOccupancy: number;
  locations: StorageLocation[];
  isActive: boolean;
  lastInspection?: string;
  nextInspection?: string;
}

export interface StorageLocation {
  id: string;
  rackId: string;
  code: string; // เช่น A-01-01-01 (Zone-Rack-Level-Position)
  level: number;
  position: number;
  status: 'empty' | 'occupied' | 'reserved' | 'blocked' | 'damaged';
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
  };
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastMovement?: string;
  assignedAt?: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  maxWeight: number;
  currentWeight: number;
  notes?: string;
}

export interface ZoneEquipment {
  id: string;
  name: string;
  type: 'forklift' | 'conveyor' | 'scanner' | 'scale' | 'printer' | 'computer' | 'camera' | 'sensor';
  model: string;
  serialNumber: string;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  lastMaintenance?: string;
  nextMaintenance?: string;
  assignedTo?: string;
  notes?: string;
}

export interface WarehouseStaff {
  id: string;
  warehouseId: string;
  employeeId: string;
  name: string;
  position: 'manager' | 'supervisor' | 'forklift_operator' | 'picker' | 'packer' | 'receiver' | 'security' | 'maintenance';
  department: 'operations' | 'receiving' | 'shipping' | 'inventory' | 'maintenance' | 'security' | 'administration';
  shift: 'morning' | 'afternoon' | 'night' | 'rotating';
  phone: string;
  email: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  permissions: string[];
  certifications: string[];
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouse: {
    id: string;
    name: string;
    code: string;
  };
  toWarehouseId: string;
  toWarehouse: {
    id: string;
    name: string;
    code: string;
  };
  status: 'draft' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  items: TransferItem[];
  totalItems: number;
  totalValue: number;
  requestedDate: string;
  scheduledDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  estimatedDelivery?: string;
  carrier?: {
    name: string;
    trackingNumber: string;
    contact: string;
  };
  reason: string;
  notes?: string;
  documents: TransferDocument[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
}

export interface TransferItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    barcode?: string;
  };
  requestedQuantity: number;
  shippedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  fromLocationId?: string;
  toLocationId?: string;
  batch?: string;
  expiryDate?: string;
  condition: 'new' | 'used' | 'damaged' | 'refurbished';
  notes?: string;
}

export interface TransferDocument {
  id: string;
  type: 'transfer_order' | 'packing_list' | 'delivery_note' | 'receipt' | 'invoice' | 'photo';
  name: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface WarehouseTask {
  id: string;
  warehouseId: string;
  type: 'receiving' | 'picking' | 'packing' | 'shipping' | 'counting' | 'maintenance' | 'cleaning' | 'inspection';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  assignedTo?: string;
  assignedBy: string;
  estimatedDuration: number; // นาที
  actualDuration?: number;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  relatedItems?: {
    productId: string;
    quantity: number;
    locationId?: string;
  }[];
  instructions?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseReport {
  id: string;
  type: 'utilization' | 'productivity' | 'accuracy' | 'safety' | 'cost' | 'performance';
  title: string;
  warehouseId?: string;
  dateRange: {
    from: string;
    to: string;
  };
  metrics: Record<string, any>;
  data: any[];
  summary: {
    totalItems: number;
    totalValue: number;
    averageAccuracy: number;
    utilizationRate: number;
    productivityScore: number;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface WarehouseAlert {
  id: string;
  warehouseId: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  type: 'capacity' | 'temperature' | 'humidity' | 'security' | 'equipment' | 'safety' | 'maintenance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source?: string; // sensor ID, equipment ID, etc.
  value?: number;
  threshold?: number;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  createdAt: string;
}

export interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalUtilization: number;
  averageUtilizationRate: number;
  totalStaff: number;
  activeTransfers: number;
  pendingTasks: number;
  criticalAlerts: number;
  totalValue: number;
  topPerformingWarehouse: {
    id: string;
    name: string;
    utilizationRate: number;
    productivityScore: number;
  };
  lowPerformingWarehouse: {
    id: string;
    name: string;
    utilizationRate: number;
    productivityScore: number;
  };
}

// Filters and Search
export interface WarehouseFilter {
  type?: Warehouse['type'];
  status?: Warehouse['status'];
  province?: string;
  utilizationMin?: number;
  utilizationMax?: number;
  search?: string;
}

export interface TransferFilter {
  status?: WarehouseTransfer['status'];
  priority?: WarehouseTransfer['priority'];
  fromWarehouse?: string;
  toWarehouse?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TaskFilter {
  type?: WarehouseTask['type'];
  status?: WarehouseTask['status'];
  priority?: WarehouseTask['priority'];
  assignedTo?: string;
  warehouseId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}