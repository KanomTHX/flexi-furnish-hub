import { 
  Supplier, 
  Location, 
  StockMovement, 
  StockAlert, 
  PurchaseOrder,
  ProductStock 
} from '@/types/stock';

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Thai Furniture Co., Ltd.',
    contactPerson: 'สมชาย ใจดี',
    phone: '02-123-4567',
    email: 'contact@thaifurniture.com',
    address: '123 ถนนรามคำแหง กรุงเทพฯ 10240',
    taxId: '0123456789012',
    paymentTerms: 'Net 30',
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'sup-002',
    name: 'Modern Living Supplies',
    contactPerson: 'สุดา วงศ์ใหญ่',
    phone: '02-234-5678',
    email: 'info@modernliving.co.th',
    address: '456 ถนนสุขุมวิท กรุงเทพฯ 10110',
    taxId: '0234567890123',
    paymentTerms: 'Net 15',
    isActive: true,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  },
  {
    id: 'sup-003',
    name: 'Office Pro Solutions',
    contactPerson: 'วิชัย เก่งการ',
    phone: '02-345-6789',
    email: 'sales@officepro.com',
    address: '789 ถนนพหลโยธิน กรุงเทพฯ 10400',
    taxId: '0345678901234',
    paymentTerms: 'Net 45',
    isActive: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'sup-004',
    name: 'Premium Wood Works',
    contactPerson: 'นิรันดร์ ช่างไม้',
    phone: '02-456-7890',
    email: 'orders@premiumwood.co.th',
    address: '321 ถนนลาดพร้าว กรุงเทพฯ 10230',
    taxId: '0456789012345',
    paymentTerms: 'COD',
    isActive: true,
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z'
  }
];

// Mock Locations
export const mockLocations: Location[] = [
  {
    id: 'loc-001',
    name: 'คลังสินค้าหลัก',
    code: 'WH-MAIN',
    type: 'warehouse',
    description: 'คลังสินค้าหลักสำหรับเก็บสินค้าทั่วไป',
    isActive: true,
    capacity: 10000,
    currentUtilization: 7500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'loc-002',
    name: 'ห้องโชว์รูม',
    code: 'SR-001',
    type: 'display',
    description: 'พื้นที่แสดงสินค้าสำหรับลูกค้า',
    isActive: true,
    capacity: 500,
    currentUtilization: 450,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'loc-003',
    name: 'ร้านค้าหน้าร้าน',
    code: 'ST-001',
    type: 'store',
    description: 'พื้นที่ขายสินค้าหน้าร้าน',
    isActive: true,
    capacity: 200,
    currentUtilization: 180,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'loc-004',
    name: 'โซนสินค้าชำรุด',
    code: 'DMG-001',
    type: 'damaged',
    description: 'พื้นที่เก็บสินค้าที่ชำรุดรอการซ่อมแซม',
    isActive: true,
    capacity: 100,
    currentUtilization: 25,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Stock Movements (Recent)
export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-001',
    productId: '1',
    product: {
      id: '1',
      name: 'Office Chair Executive',
      sku: 'OC-001',
      category: 'Office Furniture'
    },
    type: 'in',
    quantity: 20,
    previousStock: 15,
    newStock: 35,
    reason: 'Purchase Order Receipt',
    reference: 'PO-2024-001',
    cost: 10000,
    totalCost: 200000,
    location: 'คลังสินค้าหลัก',
    supplierId: 'sup-003',
    supplier: mockSuppliers[2],
    employeeId: 'emp-001',
    employeeName: 'สมศักดิ์ จัดการ',
    notes: 'รับสินค้าครบตามใบสั่งซื้อ คุณภาพดี',
    createdAt: '2024-08-01T14:30:00Z',
    updatedAt: '2024-08-01T14:30:00Z'
  },
  {
    id: 'mov-002',
    productId: '2',
    product: {
      id: '2',
      name: 'Dining Table Set (4 Chairs)',
      sku: 'DT-205',
      category: 'Dining Room'
    },
    type: 'out',
    quantity: 2,
    previousStock: 8,
    newStock: 6,
    reason: 'Sales Order',
    reference: 'SO-2024-015',
    location: 'ร้านค้าหน้าร้าน',
    employeeId: 'emp-002',
    employeeName: 'สุดา ขายดี',
    notes: 'ขายให้ลูกค้า คุณสมชาย',
    createdAt: '2024-08-01T16:45:00Z',
    updatedAt: '2024-08-01T16:45:00Z'
  },
  {
    id: 'mov-003',
    productId: '4',
    product: {
      id: '4',
      name: 'Sofa 3-Seater Fabric',
      sku: 'SF-301',
      category: 'Living Room'
    },
    type: 'transfer',
    quantity: 3,
    previousStock: 5,
    newStock: 2,
    reason: 'Transfer to Showroom',
    reference: 'TF-2024-003',
    location: 'ห้องโชว์รูม',
    employeeId: 'emp-001',
    employeeName: 'สมศักดิ์ จัดการ',
    notes: 'ย้ายไปโชว์รูมเพื่อแสดงสินค้า',
    createdAt: '2024-08-01T10:15:00Z',
    updatedAt: '2024-08-01T10:15:00Z'
  },
  {
    id: 'mov-004',
    productId: '3',
    product: {
      id: '3',
      name: 'Bookshelf Premium 5-Tier',
      sku: 'BS-108',
      category: 'Storage'
    },
    type: 'adjustment',
    quantity: -1,
    previousStock: 12,
    newStock: 11,
    reason: 'Stock Count Adjustment',
    reference: 'ADJ-2024-001',
    location: 'คลังสินค้าหลัก',
    employeeId: 'emp-003',
    employeeName: 'วิชัย นับสต็อก',
    notes: 'พบสินค้าชำรุด 1 ชิ้น จากการตรวจนับ',
    createdAt: '2024-07-31T17:20:00Z',
    updatedAt: '2024-07-31T17:20:00Z'
  },
  {
    id: 'mov-005',
    productId: '5',
    product: {
      id: '5',
      name: 'Coffee Table Glass Top',
      sku: 'CT-150',
      category: 'Living Room'
    },
    type: 'in',
    quantity: 15,
    previousStock: 10,
    newStock: 25,
    reason: 'Purchase Order Receipt',
    reference: 'PO-2024-002',
    cost: 12000,
    totalCost: 180000,
    location: 'คลังสินค้าหลัก',
    supplierId: 'sup-001',
    supplier: mockSuppliers[0],
    employeeId: 'emp-001',
    employeeName: 'สมศักดิ์ จัดการ',
    notes: 'รับสินค้าใหม่ล่าสุด',
    createdAt: '2024-07-31T09:00:00Z',
    updatedAt: '2024-07-31T09:00:00Z'
  }
];

// Mock Stock Alerts
export const mockStockAlerts: StockAlert[] = [
  {
    id: 'alert-001',
    productId: '6',
    product: {
      id: '6',
      name: 'Wardrobe 3-Door',
      sku: 'WD-401',
      currentStock: 2,
      minStock: 5,
      maxStock: 20
    },
    type: 'low_stock',
    severity: 'high',
    message: 'สินค้า Wardrobe 3-Door (WD-401) เหลือเพียง 2 ชิ้น ต่ำกว่าระดับขั้นต่ำ',
    isRead: false,
    createdAt: '2024-08-01T08:00:00Z'
  },
  {
    id: 'alert-002',
    productId: '7',
    product: {
      id: '7',
      name: 'Desk Lamp LED',
      sku: 'DL-102',
      currentStock: 0,
      minStock: 10,
      maxStock: 50
    },
    type: 'out_of_stock',
    severity: 'critical',
    message: 'สินค้า Desk Lamp LED (DL-102) หมดสต็อก',
    isRead: false,
    createdAt: '2024-08-01T07:30:00Z'
  },
  {
    id: 'alert-003',
    productId: '1',
    product: {
      id: '1',
      name: 'Office Chair Executive',
      sku: 'OC-001',
      currentStock: 35,
      minStock: 10,
      maxStock: 25
    },
    type: 'overstock',
    severity: 'medium',
    message: 'สินค้า Office Chair Executive (OC-001) มีสต็อกเกินกว่าระดับสูงสุด',
    isRead: true,
    createdAt: '2024-08-01T14:35:00Z'
  },
  {
    id: 'alert-004',
    productId: '8',
    product: {
      id: '8',
      name: 'Mattress Queen Size',
      sku: 'MT-501',
      currentStock: 8,
      minStock: 5,
      maxStock: 15
    },
    type: 'expiring',
    severity: 'medium',
    message: 'สินค้า Mattress Queen Size (MT-501) จะหมดอายุใน 30 วัน',
    isRead: false,
    createdAt: '2024-07-31T16:00:00Z'
  }
];

// Mock Product Stock Data
export const mockProductStock: ProductStock[] = [
  {
    id: '1',
    name: 'Office Chair Executive',
    sku: 'OC-001',
    category: 'Office Furniture',
    currentStock: 35,
    reservedStock: 5,
    availableStock: 30,
    minStock: 10,
    maxStock: 25,
    reorderPoint: 15,
    reorderQuantity: 20,
    averageCost: 10000,
    totalValue: 350000,
    lastMovementDate: '2024-08-01T14:30:00Z',
    stockStatus: 'overstock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 30 },
      { locationId: 'loc-002', locationName: 'ห้องโชว์รูม', quantity: 3 },
      { locationId: 'loc-003', locationName: 'ร้านค้าหน้าร้าน', quantity: 2 }
    ],
    supplier: { id: 'sup-003', name: 'Office Pro Solutions' },
    barcode: '1234567890123'
  },
  {
    id: '2',
    name: 'Dining Table Set (4 Chairs)',
    sku: 'DT-205',
    category: 'Dining Room',
    currentStock: 6,
    reservedStock: 2,
    availableStock: 4,
    minStock: 3,
    maxStock: 12,
    reorderPoint: 5,
    reorderQuantity: 8,
    averageCost: 22000,
    totalValue: 132000,
    lastMovementDate: '2024-08-01T16:45:00Z',
    stockStatus: 'in_stock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 4 },
      { locationId: 'loc-003', locationName: 'ร้านค้าหน้าร้าน', quantity: 2 }
    ],
    supplier: { id: 'sup-001', name: 'Thai Furniture Co., Ltd.' },
    barcode: '1234567890124'
  },
  {
    id: '3',
    name: 'Bookshelf Premium 5-Tier',
    sku: 'BS-108',
    category: 'Storage',
    currentStock: 11,
    reservedStock: 1,
    availableStock: 10,
    minStock: 8,
    maxStock: 20,
    reorderPoint: 10,
    reorderQuantity: 15,
    averageCost: 7500,
    totalValue: 82500,
    lastMovementDate: '2024-07-31T17:20:00Z',
    stockStatus: 'in_stock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 8 },
      { locationId: 'loc-002', locationName: 'ห้องโชว์รูม', quantity: 2 },
      { locationId: 'loc-003', locationName: 'ร้านค้าหน้าร้าน', quantity: 1 }
    ],
    supplier: { id: 'sup-004', name: 'Premium Wood Works' },
    barcode: '1234567890125'
  },
  {
    id: '4',
    name: 'Sofa 3-Seater Fabric',
    sku: 'SF-301',
    category: 'Living Room',
    currentStock: 2,
    reservedStock: 1,
    availableStock: 1,
    minStock: 3,
    maxStock: 8,
    reorderPoint: 4,
    reorderQuantity: 6,
    averageCost: 28000,
    totalValue: 56000,
    lastMovementDate: '2024-08-01T10:15:00Z',
    stockStatus: 'low_stock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 1 },
      { locationId: 'loc-002', locationName: 'ห้องโชว์รูม', quantity: 1 }
    ],
    supplier: { id: 'sup-002', name: 'Modern Living Supplies' },
    barcode: '1234567890126'
  },
  {
    id: '5',
    name: 'Coffee Table Glass Top',
    sku: 'CT-150',
    category: 'Living Room',
    currentStock: 25,
    reservedStock: 3,
    availableStock: 22,
    minStock: 8,
    maxStock: 20,
    reorderPoint: 12,
    reorderQuantity: 15,
    averageCost: 12000,
    totalValue: 300000,
    lastMovementDate: '2024-07-31T09:00:00Z',
    stockStatus: 'overstock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 20 },
      { locationId: 'loc-002', locationName: 'ห้องโชว์รูม', quantity: 3 },
      { locationId: 'loc-003', locationName: 'ร้านค้าหน้าร้าน', quantity: 2 }
    ],
    supplier: { id: 'sup-001', name: 'Thai Furniture Co., Ltd.' },
    barcode: '1234567890127'
  },
  {
    id: '6',
    name: 'Wardrobe 3-Door',
    sku: 'WD-401',
    category: 'Bedroom',
    currentStock: 2,
    reservedStock: 0,
    availableStock: 2,
    minStock: 5,
    maxStock: 20,
    reorderPoint: 8,
    reorderQuantity: 12,
    averageCost: 45000,
    totalValue: 90000,
    lastMovementDate: '2024-07-28T11:20:00Z',
    stockStatus: 'low_stock',
    locations: [
      { locationId: 'loc-001', locationName: 'คลังสินค้าหลัก', quantity: 2 }
    ],
    supplier: { id: 'sup-004', name: 'Premium Wood Works' },
    barcode: '1234567890128'
  },
  {
    id: '7',
    name: 'Desk Lamp LED',
    sku: 'DL-102',
    category: 'Lighting',
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    minStock: 10,
    maxStock: 50,
    reorderPoint: 15,
    reorderQuantity: 30,
    averageCost: 1500,
    totalValue: 0,
    lastMovementDate: '2024-07-25T14:30:00Z',
    stockStatus: 'out_of_stock',
    locations: [],
    supplier: { id: 'sup-003', name: 'Office Pro Solutions' },
    barcode: '1234567890129'
  }
];

// Helper functions
export function getSupplierById(id: string): Supplier | undefined {
  return mockSuppliers.find(supplier => supplier.id === id);
}

export function getLocationById(id: string): Location | undefined {
  return mockLocations.find(location => location.id === id);
}

export function getProductStockById(id: string): ProductStock | undefined {
  return mockProductStock.find(product => product.id === id);
}

export function getActiveSuppliers(): Supplier[] {
  return mockSuppliers.filter(supplier => supplier.isActive);
}

export function getActiveLocations(): Location[] {
  return mockLocations.filter(location => location.isActive);
}

export function getUnreadAlerts(): StockAlert[] {
  return mockStockAlerts.filter(alert => !alert.isRead);
}

export function getCriticalAlerts(): StockAlert[] {
  return mockStockAlerts.filter(alert => alert.severity === 'critical');
}

export function getLowStockProducts(): ProductStock[] {
  return mockProductStock.filter(product => product.stockStatus === 'low_stock');
}

export function getOutOfStockProducts(): ProductStock[] {
  return mockProductStock.filter(product => product.stockStatus === 'out_of_stock');
}

export function getOverstockProducts(): ProductStock[] {
  return mockProductStock.filter(product => product.stockStatus === 'overstock');
}