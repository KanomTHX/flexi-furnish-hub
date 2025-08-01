// Warehouse Management Types
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