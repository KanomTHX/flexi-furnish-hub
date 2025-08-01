import { 
  Warehouse, 
  WarehouseZone, 
  StorageRack, 
  StorageLocation,
  WarehouseStaff,
  WarehouseTransfer,
  WarehouseTask,
  WarehouseAlert,
  ZoneEquipment
} from '@/types/warehouse';

// Mock Warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'คลังสินค้าหลัก กรุงเทพฯ',
    code: 'BKK-MAIN',
    type: 'main',
    status: 'active',
    address: {
      street: '123 ถนนรามคำแหง',
      district: 'หัวหมาก',
      province: 'กรุงเทพมหานคร',
      postalCode: '10240',
      country: 'ประเทศไทย',
      coordinates: {
        lat: 13.7563,
        lng: 100.5018
      }
    },
    contact: {
      manager: 'สมชาย จัดการ',
      phone: '02-123-4567',
      email: 'manager.bkk@company.com',
      emergencyContact: '081-234-5678'
    },
    capacity: {
      totalArea: 5000,
      usableArea: 4200,
      storageCapacity: 10000,
      currentUtilization: 7500,
      utilizationPercentage: 75
    },
    zones: [],
    facilities: {
      hasLoading: true,
      hasUnloading: true,
      hasColdStorage: false,
      hasSecuritySystem: true,
      hasFireSafety: true,
      hasClimateControl: true,
      parkingSpaces: 20,
      loadingDocks: 4
    },
    operatingHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '08:00', close: '16:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    staff: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'wh-002',
    name: 'คลังสินค้าสาขา เชียงใหม่',
    code: 'CNX-BRANCH',
    type: 'branch',
    status: 'active',
    address: {
      street: '456 ถนนห้วยแก้ว',
      district: 'เมือง',
      province: 'เชียงใหม่',
      postalCode: '50100',
      country: 'ประเทศไทย',
      coordinates: {
        lat: 18.7883,
        lng: 98.9853
      }
    },
    contact: {
      manager: 'สุดา ดูแล',
      phone: '053-123-456',
      email: 'manager.cnx@company.com',
      emergencyContact: '081-345-6789'
    },
    capacity: {
      totalArea: 2000,
      usableArea: 1700,
      storageCapacity: 4000,
      currentUtilization: 2800,
      utilizationPercentage: 70
    },
    zones: [],
    facilities: {
      hasLoading: true,
      hasUnloading: true,
      hasColdStorage: true,
      hasSecuritySystem: true,
      hasFireSafety: true,
      hasClimateControl: false,
      parkingSpaces: 10,
      loadingDocks: 2
    },
    operatingHours: {
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '15:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    staff: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'wh-003',
    name: 'ศูนย์กระจายสินค้า ปทุมธานี',
    code: 'PTH-DIST',
    type: 'distribution',
    status: 'active',
    address: {
      street: '789 ถนนพหลโยธิน',
      district: 'คลองหลวง',
      province: 'ปทุมธานี',
      postalCode: '12120',
      country: 'ประเทศไทย',
      coordinates: {
        lat: 14.0722,
        lng: 100.6192
      }
    },
    contact: {
      manager: 'วิชัย กระจาย',
      phone: '02-234-5678',
      email: 'manager.pth@company.com',
      emergencyContact: '081-456-7890'
    },
    capacity: {
      totalArea: 8000,
      usableArea: 7200,
      storageCapacity: 15000,
      currentUtilization: 12000,
      utilizationPercentage: 80
    },
    zones: [],
    facilities: {
      hasLoading: true,
      hasUnloading: true,
      hasColdStorage: true,
      hasSecuritySystem: true,
      hasFireSafety: true,
      hasClimateControl: true,
      parkingSpaces: 50,
      loadingDocks: 8
    },
    operatingHours: {
      monday: { open: '06:00', close: '20:00', isOpen: true },
      tuesday: { open: '06:00', close: '20:00', isOpen: true },
      wednesday: { open: '06:00', close: '20:00', isOpen: true },
      thursday: { open: '06:00', close: '20:00', isOpen: true },
      friday: { open: '06:00', close: '20:00', isOpen: true },
      saturday: { open: '06:00', close: '18:00', isOpen: true },
      sunday: { open: '08:00', close: '16:00', isOpen: true }
    },
    staff: [],
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
    createdBy: 'admin'
  },
  {
    id: 'wh-004',
    name: 'คลังสินค้าชั่วคราว สมุทรปราการ',
    code: 'SPK-TEMP',
    type: 'temporary',
    status: 'maintenance',
    address: {
      street: '321 ถนนสุขุมวิท',
      district: 'บางพลี',
      province: 'สมุทรปราการ',
      postalCode: '10540',
      country: 'ประเทศไทย'
    },
    contact: {
      manager: 'นิรันดร์ ซ่อมแซม',
      phone: '02-345-6789',
      email: 'manager.spk@company.com'
    },
    capacity: {
      totalArea: 1500,
      usableArea: 1200,
      storageCapacity: 2500,
      currentUtilization: 500,
      utilizationPercentage: 20
    },
    zones: [],
    facilities: {
      hasLoading: true,
      hasUnloading: true,
      hasColdStorage: false,
      hasSecuritySystem: true,
      hasFireSafety: true,
      hasClimateControl: false,
      parkingSpaces: 5,
      loadingDocks: 1
    },
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '00:00', close: '00:00', isOpen: false },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    staff: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z',
    createdBy: 'admin'
  }
];

// Mock Warehouse Zones
export const mockWarehouseZones: WarehouseZone[] = [
  {
    id: 'zone-001',
    warehouseId: 'wh-001',
    name: 'โซนรับสินค้า',
    code: 'A',
    type: 'receiving',
    description: 'พื้นที่สำหรับรับสินค้าเข้าคลัง',
    area: 500,
    capacity: 1000,
    currentStock: 200,
    utilizationPercentage: 20,
    temperature: {
      min: 20,
      max: 30,
      current: 25
    },
    restrictions: {
      maxWeight: 1000,
      maxHeight: 3,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: true
    },
    equipment: [],
    racks: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'zone-002',
    warehouseId: 'wh-001',
    name: 'โซนเก็บสินค้าหลัก',
    code: 'B',
    type: 'storage',
    description: 'พื้นที่เก็บสินค้าหลัก',
    area: 2000,
    capacity: 6000,
    currentStock: 4500,
    utilizationPercentage: 75,
    restrictions: {
      maxWeight: 2000,
      maxHeight: 5,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: true
    },
    equipment: [],
    racks: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'zone-003',
    warehouseId: 'wh-001',
    name: 'โซนจัดเตรียมสินค้า',
    code: 'C',
    type: 'picking',
    description: 'พื้นที่จัดเตรียมสินค้าสำหรับส่งออก',
    area: 800,
    capacity: 1500,
    currentStock: 800,
    utilizationPercentage: 53,
    restrictions: {
      maxWeight: 500,
      maxHeight: 2,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: false
    },
    equipment: [],
    racks: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  },
  {
    id: 'zone-004',
    warehouseId: 'wh-001',
    name: 'โซนส่งสินค้า',
    code: 'D',
    type: 'shipping',
    description: 'พื้นที่ส่งสินค้าออกจากคลัง',
    area: 400,
    capacity: 800,
    currentStock: 300,
    utilizationPercentage: 38,
    restrictions: {
      maxWeight: 1000,
      maxHeight: 3,
      hazardousAllowed: false,
      fragileOnly: false,
      climateControlled: false
    },
    equipment: [],
    racks: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-08-01T10:00:00Z'
  }
];

// Mock Warehouse Staff
export const mockWarehouseStaff: WarehouseStaff[] = [
  {
    id: 'staff-001',
    warehouseId: 'wh-001',
    employeeId: 'EMP-001',
    name: 'สมชาย จัดการ',
    position: 'manager',
    department: 'administration',
    shift: 'morning',
    phone: '081-234-5678',
    email: 'somchai@company.com',
    startDate: '2024-01-01',
    isActive: true,
    permissions: ['manage_warehouse', 'view_reports', 'manage_staff'],
    certifications: ['Warehouse Management', 'Safety Training']
  },
  {
    id: 'staff-002',
    warehouseId: 'wh-001',
    employeeId: 'EMP-002',
    name: 'สุดา คุมงาน',
    position: 'supervisor',
    department: 'operations',
    shift: 'morning',
    phone: '081-345-6789',
    email: 'suda@company.com',
    startDate: '2024-01-15',
    isActive: true,
    permissions: ['manage_operations', 'assign_tasks'],
    certifications: ['Forklift Operation', 'Safety Training']
  },
  {
    id: 'staff-003',
    warehouseId: 'wh-001',
    employeeId: 'EMP-003',
    name: 'วิชัย ขับรถ',
    position: 'forklift_operator',
    department: 'operations',
    shift: 'morning',
    phone: '081-456-7890',
    email: 'wichai@company.com',
    startDate: '2024-02-01',
    isActive: true,
    permissions: ['operate_forklift', 'move_inventory'],
    certifications: ['Forklift License', 'Heavy Equipment Operation']
  },
  {
    id: 'staff-004',
    warehouseId: 'wh-002',
    employeeId: 'EMP-004',
    name: 'มาลี เก็บของ',
    position: 'picker',
    department: 'operations',
    shift: 'afternoon',
    phone: '081-567-8901',
    email: 'malee@company.com',
    startDate: '2024-02-15',
    isActive: true,
    permissions: ['pick_items', 'scan_products'],
    certifications: ['Product Handling', 'Scanner Operation']
  }
];

// Mock Warehouse Transfers
export const mockWarehouseTransfers: WarehouseTransfer[] = [
  {
    id: 'transfer-001',
    transferNumber: 'TF-2024-001',
    fromWarehouseId: 'wh-001',
    fromWarehouse: {
      id: 'wh-001',
      name: 'คลังสินค้าหลัก กรุงเทพฯ',
      code: 'BKK-MAIN'
    },
    toWarehouseId: 'wh-002',
    toWarehouse: {
      id: 'wh-002',
      name: 'คลังสินค้าสาขา เชียงใหม่',
      code: 'CNX-BRANCH'
    },
    status: 'in_transit',
    priority: 'normal',
    items: [
      {
        id: 'item-001',
        productId: '1',
        product: {
          id: '1',
          name: 'Office Chair Executive',
          sku: 'OC-001',
          category: 'Office Furniture',
          barcode: '1234567890123'
        },
        requestedQuantity: 10,
        shippedQuantity: 10,
        receivedQuantity: 0,
        unitCost: 10000,
        totalCost: 100000,
        condition: 'new'
      },
      {
        id: 'item-002',
        productId: '3',
        product: {
          id: '3',
          name: 'Bookshelf Premium 5-Tier',
          sku: 'BS-108',
          category: 'Storage',
          barcode: '1234567890125'
        },
        requestedQuantity: 5,
        shippedQuantity: 5,
        receivedQuantity: 0,
        unitCost: 7500,
        totalCost: 37500,
        condition: 'new'
      }
    ],
    totalItems: 15,
    totalValue: 137500,
    requestedDate: '2024-07-28T00:00:00Z',
    scheduledDate: '2024-07-30T00:00:00Z',
    shippedDate: '2024-07-30T08:00:00Z',
    estimatedDelivery: '2024-08-02T16:00:00Z',
    carrier: {
      name: 'บริษัท ขนส่งดี จำกัด',
      trackingNumber: 'TRK-2024-001',
      contact: '02-555-1234'
    },
    reason: 'เติมสต็อกสาขาเชียงใหม่',
    notes: 'ขนส่งระวังสินค้าแตกหัก',
    documents: [],
    createdAt: '2024-07-28T10:00:00Z',
    updatedAt: '2024-07-30T08:00:00Z',
    createdBy: 'staff-001',
    approvedBy: 'staff-001',
    approvedAt: '2024-07-28T14:00:00Z'
  },
  {
    id: 'transfer-002',
    transferNumber: 'TF-2024-002',
    fromWarehouseId: 'wh-003',
    fromWarehouse: {
      id: 'wh-003',
      name: 'ศูนย์กระจายสินค้า ปทุมธานี',
      code: 'PTH-DIST'
    },
    toWarehouseId: 'wh-001',
    toWarehouse: {
      id: 'wh-001',
      name: 'คลังสินค้าหลัก กรุงเทพฯ',
      code: 'BKK-MAIN'
    },
    status: 'pending',
    priority: 'high',
    items: [
      {
        id: 'item-003',
        productId: '2',
        product: {
          id: '2',
          name: 'Dining Table Set (4 Chairs)',
          sku: 'DT-205',
          category: 'Dining Room',
          barcode: '1234567890124'
        },
        requestedQuantity: 8,
        shippedQuantity: 0,
        receivedQuantity: 0,
        unitCost: 22000,
        totalCost: 176000,
        condition: 'new'
      }
    ],
    totalItems: 8,
    totalValue: 176000,
    requestedDate: '2024-08-01T00:00:00Z',
    scheduledDate: '2024-08-03T00:00:00Z',
    reason: 'เติมสต็อกด่วนสำหรับออเดอร์ใหญ่',
    documents: [],
    createdAt: '2024-08-01T09:00:00Z',
    updatedAt: '2024-08-01T09:00:00Z',
    createdBy: 'staff-002'
  }
];

// Mock Warehouse Tasks
export const mockWarehouseTasks: WarehouseTask[] = [
  {
    id: 'task-001',
    warehouseId: 'wh-001',
    type: 'receiving',
    title: 'รับสินค้าจากผู้จัดจำหน่าย ABC',
    description: 'รับสินค้าเฟอร์นิเจอร์ตามใบสั่งซื้อ PO-2024-001',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'staff-003',
    assignedBy: 'staff-002',
    estimatedDuration: 120,
    dueDate: '2024-08-01T16:00:00Z',
    startedAt: '2024-08-01T14:00:00Z',
    relatedItems: [
      {
        productId: '1',
        quantity: 20,
        locationId: 'zone-001'
      }
    ],
    instructions: 'ตรวจสอบสภาพสินค้าให้ดี บันทึกรายการที่ชำรุด',
    createdAt: '2024-08-01T13:00:00Z',
    updatedAt: '2024-08-01T14:00:00Z'
  },
  {
    id: 'task-002',
    warehouseId: 'wh-001',
    type: 'picking',
    title: 'จัดเตรียมสินค้าสำหรับออเดอร์ #12345',
    description: 'เก็บสินค้าตามรายการสำหรับลูกค้า บริษัท XYZ',
    priority: 'normal',
    status: 'pending',
    assignedTo: 'staff-004',
    assignedBy: 'staff-002',
    estimatedDuration: 60,
    dueDate: '2024-08-02T10:00:00Z',
    relatedItems: [
      {
        productId: '2',
        quantity: 2,
        locationId: 'zone-002'
      },
      {
        productId: '3',
        quantity: 1,
        locationId: 'zone-002'
      }
    ],
    instructions: 'ตรวจสอบ SKU ให้ถูกต้อง แพ็คให้เรียบร้อย',
    createdAt: '2024-08-01T15:00:00Z',
    updatedAt: '2024-08-01T15:00:00Z'
  },
  {
    id: 'task-003',
    warehouseId: 'wh-002',
    type: 'counting',
    title: 'ตรวจนับสต็อกประจำเดือน - โซน A',
    description: 'ตรวจนับสต็อกสินค้าในโซน A ประจำเดือนสิงหาคม',
    priority: 'low',
    status: 'pending',
    assignedBy: 'staff-001',
    estimatedDuration: 240,
    dueDate: '2024-08-05T17:00:00Z',
    instructions: 'ใช้เครื่องสแกนบาร์โค้ด บันทึกผลต่างที่พบ',
    createdAt: '2024-08-01T08:00:00Z',
    updatedAt: '2024-08-01T08:00:00Z'
  }
];

// Mock Warehouse Alerts
export const mockWarehouseAlerts: WarehouseAlert[] = [
  {
    id: 'alert-001',
    warehouseId: 'wh-001',
    warehouse: {
      id: 'wh-001',
      name: 'คลังสินค้าหลัก กรุงเทพฯ',
      code: 'BKK-MAIN'
    },
    type: 'capacity',
    severity: 'warning',
    title: 'การใช้งานพื้นที่ใกล้เต็ม',
    message: 'การใช้งานพื้นที่ในโซน B ถึง 85% แล้ว ควรจัดการสต็อก',
    source: 'zone-002',
    value: 85,
    threshold: 80,
    isRead: false,
    isResolved: false,
    createdAt: '2024-08-01T12:00:00Z'
  },
  {
    id: 'alert-002',
    warehouseId: 'wh-002',
    warehouse: {
      id: 'wh-002',
      name: 'คลังสินค้าสาขา เชียงใหม่',
      code: 'CNX-BRANCH'
    },
    type: 'temperature',
    severity: 'critical',
    title: 'อุณหภูมิในห้องเย็นสูงเกินกำหนด',
    message: 'อุณหภูมิในห้องเย็นขณะนี้ 8°C เกินกว่าที่กำหนด (5°C)',
    source: 'cold-storage-01',
    value: 8,
    threshold: 5,
    isRead: false,
    isResolved: false,
    createdAt: '2024-08-01T11:30:00Z'
  },
  {
    id: 'alert-003',
    warehouseId: 'wh-003',
    warehouse: {
      id: 'wh-003',
      name: 'ศูนย์กระจายสินค้า ปทุมธานี',
      code: 'PTH-DIST'
    },
    type: 'equipment',
    severity: 'error',
    title: 'รถฟอร์คลิฟท์ขัดข้อง',
    message: 'รถฟอร์คลิฟท์หมายเลข FL-003 ขัดข้อง ต้องซ่อมแซม',
    source: 'forklift-003',
    isRead: true,
    isResolved: false,
    createdAt: '2024-07-31T16:45:00Z'
  },
  {
    id: 'alert-004',
    warehouseId: 'wh-001',
    warehouse: {
      id: 'wh-001',
      name: 'คลังสินค้าหลัก กรุงเทพฯ',
      code: 'BKK-MAIN'
    },
    type: 'security',
    severity: 'info',
    title: 'การเข้าออกนอกเวลา',
    message: 'มีการเข้าออกคลังสินค้านอกเวลาทำการ เวลา 19:30',
    source: 'security-gate-01',
    isRead: true,
    isResolved: true,
    resolvedAt: '2024-07-31T20:00:00Z',
    resolvedBy: 'security-001',
    resolution: 'ตรวจสอบแล้ว เป็นการทำงานล่วงเวลาที่ได้รับอนุมัติ',
    createdAt: '2024-07-31T19:30:00Z'
  }
];

// Helper functions
export function getWarehouseById(id: string): Warehouse | undefined {
  return mockWarehouses.find(warehouse => warehouse.id === id);
}

export function getWarehousesByType(type: Warehouse['type']): Warehouse[] {
  return mockWarehouses.filter(warehouse => warehouse.type === type);
}

export function getActiveWarehouses(): Warehouse[] {
  return mockWarehouses.filter(warehouse => warehouse.status === 'active');
}

export function getWarehouseZonesByWarehouseId(warehouseId: string): WarehouseZone[] {
  return mockWarehouseZones.filter(zone => zone.warehouseId === warehouseId);
}

export function getWarehouseStaffByWarehouseId(warehouseId: string): WarehouseStaff[] {
  return mockWarehouseStaff.filter(staff => staff.warehouseId === warehouseId);
}

export function getActiveTransfers(): WarehouseTransfer[] {
  return mockWarehouseTransfers.filter(transfer => 
    transfer.status === 'pending' || transfer.status === 'in_transit'
  );
}

export function getPendingTasks(): WarehouseTask[] {
  return mockWarehouseTasks.filter(task => task.status === 'pending');
}

export function getUnreadAlerts(): WarehouseAlert[] {
  return mockWarehouseAlerts.filter(alert => !alert.isRead);
}

export function getCriticalAlerts(): WarehouseAlert[] {
  return mockWarehouseAlerts.filter(alert => alert.severity === 'critical');
}

export function getWarehouseUtilizationRate(warehouse: Warehouse): number {
  return Math.round((warehouse.capacity.currentUtilization / warehouse.capacity.storageCapacity) * 100);
}

export function calculateWarehouseSummary() {
  const totalWarehouses = mockWarehouses.length;
  const activeWarehouses = getActiveWarehouses().length;
  const totalCapacity = mockWarehouses.reduce((sum, wh) => sum + wh.capacity.storageCapacity, 0);
  const totalUtilization = mockWarehouses.reduce((sum, wh) => sum + wh.capacity.currentUtilization, 0);
  const averageUtilizationRate = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0;
  const totalStaff = mockWarehouseStaff.filter(staff => staff.isActive).length;
  const activeTransfers = getActiveTransfers().length;
  const pendingTasks = getPendingTasks().length;
  const criticalAlerts = getCriticalAlerts().length;

  // คำนวณคลังที่มีประสิทธิภาพสูงสุดและต่ำสุด
  const warehousesWithUtilization = mockWarehouses.map(wh => ({
    ...wh,
    utilizationRate: getWarehouseUtilizationRate(wh),
    productivityScore: Math.random() * 100 // Mock productivity score
  }));

  const topPerforming = warehousesWithUtilization.reduce((prev, current) => 
    current.productivityScore > prev.productivityScore ? current : prev
  );

  const lowPerforming = warehousesWithUtilization.reduce((prev, current) => 
    current.productivityScore < prev.productivityScore ? current : prev
  );

  return {
    totalWarehouses,
    activeWarehouses,
    totalCapacity,
    totalUtilization,
    averageUtilizationRate: Math.round(averageUtilizationRate),
    totalStaff,
    activeTransfers,
    pendingTasks,
    criticalAlerts,
    totalValue: 5000000, // Mock total value
    topPerformingWarehouse: {
      id: topPerforming.id,
      name: topPerforming.name,
      utilizationRate: topPerforming.utilizationRate,
      productivityScore: Math.round(topPerforming.productivityScore)
    },
    lowPerformingWarehouse: {
      id: lowPerforming.id,
      name: lowPerforming.name,
      utilizationRate: lowPerforming.utilizationRate,
      productivityScore: Math.round(lowPerforming.productivityScore)
    }
  };
}