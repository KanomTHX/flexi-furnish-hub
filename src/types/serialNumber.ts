export interface SerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  warehouseId: string;
  supplierId?: string;
  purchaseOrderId?: string;
  status: SerialNumberStatus;
  position?: string; // Zone/Shelf location
  unitCost?: number;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  
  // Relations
  product?: Product;
  warehouse?: Warehouse;
  supplier?: Supplier;
  purchaseOrder?: PurchaseOrder;
  history?: SerialNumberHistory[];
}

export type SerialNumberStatus = 
  | 'available'     // พร้อมขาย
  | 'reserved'      // จองแล้ว
  | 'sold'          // ขายแล้ว
  | 'installment'   // เช่าซื้อ
  | 'claimed'       // เคลม
  | 'damaged'       // เสียหาย
  | 'transferred'   // โอนย้าย
  | 'returned'      // คืนสินค้า
  | 'maintenance'   // ซ่อมบำรุง
  | 'disposed';     // จำหน่ายทิ้ง

export interface SerialNumberHistory {
  id: string;
  serialNumberId: string;
  action: SerialNumberAction;
  fromStatus?: SerialNumberStatus;
  toStatus?: SerialNumberStatus;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  fromPosition?: string;
  toPosition?: string;
  orderId?: string; // Sales/Purchase Order ID
  customerId?: string;
  notes?: string;
  performedBy: string;
  performedAt: Date;
  
  // Relations
  serialNumber?: SerialNumber;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  order?: SalesOrder | PurchaseOrder;
  customer?: Customer;
  performer?: User;
}

export type SerialNumberAction = 
  | 'created'       // สร้าง SN
  | 'received'      // รับเข้าคลัง
  | 'reserved'      // จองสินค้า
  | 'sold'          // ขายสินค้า
  | 'installment'   // ทำเช่าซื้อ
  | 'transferred'   // โอนย้าย
  | 'moved'         // เปลี่ยนตำแหน่ง
  | 'claimed'       // เคลมสินค้า
  | 'damaged'       // รายงานเสียหาย
  | 'repaired'      // ซ่อมแซม
  | 'returned'      // คืนสินค้า
  | 'disposed'      // จำหน่ายทิ้ง
  | 'status_changed' // เปลี่ยนสถานะ
  | 'updated';      // อัปเดตข้อมูล

export interface SerialNumberFilter {
  search?: string;
  status?: SerialNumberStatus | '';
  warehouseId?: string;
  productId?: string;
  supplierId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  position?: string;
  hasWarranty?: boolean;
}

export interface SerialNumberStats {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  installment: number;
  claimed: number;
  damaged: number;
  transferred: number;
  returned: number;
  maintenance: number;
  disposed: number;
}

export interface CreateSerialNumberRequest {
  productId: string;
  warehouseId: string;
  supplierId?: string;
  purchaseOrderId?: string;
  serialNumbers: string[]; // Array of serial numbers to create
  position?: string;
  unitCost?: number;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
}

export interface UpdateSerialNumberRequest {
  serialNumber?: string;
  position?: string;
  notes?: string;
  warrantyExpiry?: Date;
}

export interface UpdateSerialNumberStatusRequest {
  newStatus: SerialNumberStatus;
  orderId?: string;
  customerId?: string;
  toWarehouseId?: string;
  toPosition?: string;
  notes?: string;
  performedBy: string;
}

export interface TransferSerialNumberRequest {
  serialNumberIds: string[];
  toWarehouseId: string;
  toPosition?: string;
  notes?: string;
  performedBy: string;
}

export interface BulkUpdateSerialNumberRequest {
  serialNumberIds: string[];
  updates: Partial<UpdateSerialNumberRequest>;
  performedBy: string;
}

export interface SerialNumberSearchResult {
  found: boolean;
  serialNumber?: SerialNumber;
  suggestions?: SerialNumber[];
}

export interface SerialNumberValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Warehouse Location Types
export interface WarehouseZone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
  currentOccupancy: number;
  temperature?: number;
  humidity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  warehouse?: Warehouse;
  shelves?: WarehouseShelf[];
}

export interface WarehouseShelf {
  id: string;
  zoneId: string;
  code: string;
  name: string;
  level: number; // Floor level (1, 2, 3, etc.)
  position: string; // A1, A2, B1, etc.
  capacity?: number;
  currentOccupancy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  zone?: WarehouseZone;
  serialNumbers?: SerialNumber[];
}

// Integration Types
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  requiresSerialNumber: boolean;
  warrantyPeriod?: number; // in months
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  managerId?: string;
  capacity?: number;
  currentOccupancy: number;
  temperature?: number;
  humidity?: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  totalAmount: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  orderDate: Date;
  deliveryDate?: Date;
  totalAmount: number;
  paymentMethod?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}