import { 
  Warehouse, 
  WarehouseZone, 
  WarehouseTransfer, 
  WarehouseTask, 
  WarehouseAlert,
  WarehouseFilter,
  TransferFilter,
  TaskFilter,
  WarehouseSummary
} from '@/types/warehouse';

/**
 * คำนวณเปอร์เซ็นต์การใช้งานคลังสินค้า
 */
export function calculateUtilizationPercentage(
  currentUtilization: number,
  totalCapacity: number
): number {
  if (totalCapacity === 0) return 0;
  return Math.round((currentUtilization / totalCapacity) * 100);
}

/**
 * คำนวณพื้นที่ว่างที่เหลือ
 */
export function calculateAvailableCapacity(
  totalCapacity: number,
  currentUtilization: number
): number {
  return Math.max(0, totalCapacity - currentUtilization);
}

/**
 * คำนวณประสิทธิภาพการใช้งานโซน
 */
export function calculateZoneEfficiency(zone: WarehouseZone): {
  utilizationRate: number;
  efficiency: 'low' | 'medium' | 'high' | 'optimal';
  recommendation: string;
} {
  const utilizationRate = zone.utilizationPercentage;
  
  let efficiency: 'low' | 'medium' | 'high' | 'optimal';
  let recommendation: string;
  
  if (utilizationRate < 30) {
    efficiency = 'low';
    recommendation = 'พื้นที่ใช้งานต่ำ ควรพิจารณาปรับปรุงการจัดเก็บ';
  } else if (utilizationRate < 60) {
    efficiency = 'medium';
    recommendation = 'การใช้งานปานกลาง สามารถเพิ่มประสิทธิภาพได้';
  } else if (utilizationRate < 85) {
    efficiency = 'high';
    recommendation = 'การใช้งานดี มีประสิทธิภาพสูง';
  } else {
    efficiency = 'optimal';
    recommendation = 'การใช้งานเต็มที่ ควรระวังการจัดเก็บเกิน';
  }
  
  return { utilizationRate, efficiency, recommendation };
}

/**
 * สร้างรหัสการโอนย้าย
 */
export function generateTransferNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `TF-${year}-${month}${day}${time}`;
}

/**
 * สร้างรหัสงาน
 */
export function generateTaskNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `TSK${year}${month}${day}${time}`;
}

/**
 * คำนวณระยะเวลาการทำงาน
 */
export function calculateTaskDuration(
  startTime: string,
  endTime: string
): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // นาที
}

/**
 * คำนวณประสิทธิภาพการทำงาน
 */
export function calculateTaskEfficiency(
  estimatedDuration: number,
  actualDuration: number
): {
  efficiency: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  variance: number;
} {
  if (actualDuration === 0) {
    return { efficiency: 0, status: 'poor', variance: 0 };
  }
  
  const efficiency = Math.round((estimatedDuration / actualDuration) * 100);
  const variance = Math.round(((actualDuration - estimatedDuration) / estimatedDuration) * 100);
  
  let status: 'excellent' | 'good' | 'average' | 'poor';
  
  if (efficiency >= 120) {
    status = 'excellent';
  } else if (efficiency >= 100) {
    status = 'good';
  } else if (efficiency >= 80) {
    status = 'average';
  } else {
    status = 'poor';
  }
  
  return { efficiency, status, variance };
}

/**
 * กรองคลังสินค้า
 */
export function filterWarehouses(
  warehouses: Warehouse[],
  filter: WarehouseFilter
): Warehouse[] {
  return warehouses.filter(warehouse => {
    // Filter by type
    if (filter.type && warehouse.type !== filter.type) {
      return false;
    }
    
    // Filter by status
    if (filter.status && warehouse.status !== filter.status) {
      return false;
    }
    
    // Filter by province
    if (filter.province && warehouse.address.province !== filter.province) {
      return false;
    }
    
    // Filter by utilization range
    if (filter.utilizationMin !== undefined) {
      if (warehouse.capacity.utilizationPercentage < filter.utilizationMin) {
        return false;
      }
    }
    
    if (filter.utilizationMax !== undefined) {
      if (warehouse.capacity.utilizationPercentage > filter.utilizationMax) {
        return false;
      }
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesName = warehouse.name.toLowerCase().includes(searchTerm);
      const matchesCode = warehouse.code.toLowerCase().includes(searchTerm);
      const matchesManager = warehouse.contact.manager.toLowerCase().includes(searchTerm);
      
      if (!matchesName && !matchesCode && !matchesManager) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * กรองการโอนย้าย
 */
export function filterTransfers(
  transfers: WarehouseTransfer[],
  filter: TransferFilter
): WarehouseTransfer[] {
  return transfers.filter(transfer => {
    // Filter by status
    if (filter.status && transfer.status !== filter.status) {
      return false;
    }
    
    // Filter by priority
    if (filter.priority && transfer.priority !== filter.priority) {
      return false;
    }
    
    // Filter by from warehouse
    if (filter.fromWarehouse && transfer.fromWarehouseId !== filter.fromWarehouse) {
      return false;
    }
    
    // Filter by to warehouse
    if (filter.toWarehouse && transfer.toWarehouseId !== filter.toWarehouse) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateFrom) {
      const transferDate = new Date(transfer.requestedDate);
      const fromDate = new Date(filter.dateFrom);
      if (transferDate < fromDate) return false;
    }
    
    if (filter.dateTo) {
      const transferDate = new Date(transfer.requestedDate);
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (transferDate > toDate) return false;
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesNumber = transfer.transferNumber.toLowerCase().includes(searchTerm);
      const matchesReason = transfer.reason.toLowerCase().includes(searchTerm);
      const matchesFromWarehouse = transfer.fromWarehouse.name.toLowerCase().includes(searchTerm);
      const matchesToWarehouse = transfer.toWarehouse.name.toLowerCase().includes(searchTerm);
      
      if (!matchesNumber && !matchesReason && !matchesFromWarehouse && !matchesToWarehouse) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * กรองงาน
 */
export function filterTasks(
  tasks: WarehouseTask[],
  filter: TaskFilter
): WarehouseTask[] {
  return tasks.filter(task => {
    // Filter by type
    if (filter.type && task.type !== filter.type) {
      return false;
    }
    
    // Filter by status
    if (filter.status && task.status !== filter.status) {
      return false;
    }
    
    // Filter by priority
    if (filter.priority && task.priority !== filter.priority) {
      return false;
    }
    
    // Filter by assigned to
    if (filter.assignedTo && task.assignedTo !== filter.assignedTo) {
      return false;
    }
    
    // Filter by warehouse
    if (filter.warehouseId && task.warehouseId !== filter.warehouseId) {
      return false;
    }
    
    // Filter by due date range
    if (filter.dueDateFrom) {
      const taskDate = new Date(task.dueDate);
      const fromDate = new Date(filter.dueDateFrom);
      if (taskDate < fromDate) return false;
    }
    
    if (filter.dueDateTo) {
      const taskDate = new Date(task.dueDate);
      const toDate = new Date(filter.dueDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (taskDate > toDate) return false;
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchTerm);
      const matchesDescription = task.description.toLowerCase().includes(searchTerm);
      
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * ส่งออกข้อมูลคลังสินค้าเป็น CSV
 */
export function exportWarehousesToCSV(warehouses: Warehouse[]): string {
  const headers = [
    'รหัสคลัง',
    'ชื่อคลัง',
    'ประเภท',
    'สถานะ',
    'จังหวัด',
    'ผู้จัดการ',
    'เบอร์โทร',
    'พื้นที่รวม (ตร.ม.)',
    'ความจุ (ชิ้น)',
    'การใช้งานปัจจุบัน',
    'เปอร์เซ็นต์การใช้งาน',
    'จำนวนพนักงาน'
  ];
  
  const rows = warehouses.map(warehouse => [
    warehouse.code,
    warehouse.name,
    getWarehouseTypeText(warehouse.type),
    getWarehouseStatusText(warehouse.status),
    warehouse.address.province,
    warehouse.contact.manager,
    warehouse.contact.phone,
    warehouse.capacity.totalArea.toString(),
    warehouse.capacity.storageCapacity.toString(),
    warehouse.capacity.currentUtilization.toString(),
    warehouse.capacity.utilizationPercentage.toString() + '%',
    warehouse.staff.length.toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * ส่งออกข้อมูลการโอนย้ายเป็น CSV
 */
export function exportTransfersToCSV(transfers: WarehouseTransfer[]): string {
  const headers = [
    'เลขที่โอนย้าย',
    'จากคลัง',
    'ไปคลัง',
    'สถานะ',
    'ความสำคัญ',
    'จำนวนรายการ',
    'มูลค่ารวม',
    'วันที่ขอ',
    'วันที่กำหนดส่ง',
    'วันที่ส่งจริง',
    'เหตุผล',
    'ผู้สร้าง'
  ];
  
  const rows = transfers.map(transfer => [
    transfer.transferNumber,
    transfer.fromWarehouse.name,
    transfer.toWarehouse.name,
    getTransferStatusText(transfer.status),
    getPriorityText(transfer.priority),
    transfer.totalItems.toString(),
    transfer.totalValue.toLocaleString(),
    new Date(transfer.requestedDate).toLocaleDateString('th-TH'),
    transfer.scheduledDate ? new Date(transfer.scheduledDate).toLocaleDateString('th-TH') : '',
    transfer.shippedDate ? new Date(transfer.shippedDate).toLocaleDateString('th-TH') : '',
    transfer.reason,
    transfer.createdBy
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * ส่งออกข้อมูลงานเป็น CSV
 */
export function exportTasksToCSV(tasks: WarehouseTask[]): string {
  const headers = [
    'ประเภทงาน',
    'หัวข้อ',
    'คำอธิบาย',
    'ความสำคัญ',
    'สถานะ',
    'ผู้รับผิดชอบ',
    'ผู้มอบหมาย',
    'เวลาที่ประมาณ (นาที)',
    'เวลาที่ใช้จริง (นาที)',
    'วันที่กำหนดเสร็จ',
    'วันที่เริ่ม',
    'วันที่เสร็จ',
    'วันที่สร้าง'
  ];
  
  const rows = tasks.map(task => [
    getTaskTypeText(task.type),
    task.title,
    task.description,
    getPriorityText(task.priority),
    getTaskStatusText(task.status),
    task.assignedTo || '',
    task.assignedBy,
    task.estimatedDuration.toString(),
    task.actualDuration?.toString() || '',
    new Date(task.dueDate).toLocaleDateString('th-TH'),
    task.startedAt ? new Date(task.startedAt).toLocaleDateString('th-TH') : '',
    task.completedAt ? new Date(task.completedAt).toLocaleDateString('th-TH') : '',
    new Date(task.createdAt).toLocaleDateString('th-TH')
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * แปลงประเภทคลังเป็นข้อความ
 */
export function getWarehouseTypeText(type: Warehouse['type']): string {
  const typeMap = {
    main: 'คลังหลัก',
    branch: 'คลังสาขา',
    distribution: 'ศูนย์กระจายสินค้า',
    retail: 'คลังร้านค้า',
    temporary: 'คลังชั่วคราว'
  };
  
  return typeMap[type] || type;
}

/**
 * แปลงสถานะคลังเป็นข้อความ
 */
export function getWarehouseStatusText(status: Warehouse['status']): string {
  const statusMap = {
    active: 'ใช้งาน',
    inactive: 'ไม่ใช้งาน',
    maintenance: 'ซ่อมแซม',
    closed: 'ปิด'
  };
  
  return statusMap[status] || status;
}

/**
 * แปลงสถานะการโอนย้ายเป็นข้อความ
 */
export function getTransferStatusText(status: WarehouseTransfer['status']): string {
  const statusMap = {
    draft: 'ร่าง',
    pending: 'รอดำเนินการ',
    in_transit: 'กำลังขนส่ง',
    delivered: 'ส่งแล้ว',
    cancelled: 'ยกเลิก'
  };
  
  return statusMap[status] || status;
}

/**
 * แปลงประเภทงานเป็นข้อความ
 */
export function getTaskTypeText(type: WarehouseTask['type']): string {
  const typeMap = {
    receiving: 'รับสินค้า',
    picking: 'จัดเตรียมสินค้า',
    packing: 'แพ็คสินค้า',
    shipping: 'ส่งสินค้า',
    counting: 'ตรวจนับ',
    maintenance: 'ซ่อมแซม',
    cleaning: 'ทำความสะอาด',
    inspection: 'ตรวจสอบ'
  };
  
  return typeMap[type] || type;
}

/**
 * แปลงสถานะงานเป็นข้อความ
 */
export function getTaskStatusText(status: WarehouseTask['status']): string {
  const statusMap = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    on_hold: 'พักงาน'
  };
  
  return statusMap[status] || status;
}

/**
 * แปลงระดับความสำคัญเป็นข้อความ
 */
export function getPriorityText(priority: 'low' | 'normal' | 'high' | 'urgent'): string {
  const priorityMap = {
    low: 'ต่ำ',
    normal: 'ปกติ',
    high: 'สูง',
    urgent: 'ด่วนมาก'
  };
  
  return priorityMap[priority] || priority;
}

/**
 * แปลงระดับความรุนแรงของ Alert เป็นข้อความ
 */
export function getAlertSeverityText(severity: WarehouseAlert['severity']): string {
  const severityMap = {
    info: 'ข้อมูล',
    warning: 'คำเตือน',
    error: 'ข้อผิดพลาด',
    critical: 'วิกฤต'
  };
  
  return severityMap[severity] || severity;
}

/**
 * แปลงประเภท Alert เป็นข้อความ
 */
export function getAlertTypeText(type: WarehouseAlert['type']): string {
  const typeMap = {
    capacity: 'ความจุ',
    temperature: 'อุณหภูมิ',
    humidity: 'ความชื้น',
    security: 'ความปลอดภัย',
    equipment: 'อุปกรณ์',
    safety: 'ความปลอดภัย',
    maintenance: 'การบำรุงรักษา'
  };
  
  return typeMap[type] || type;
}

/**
 * คำนวณระยะทางระหว่างคลัง (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // รัศมีโลกในหน่วยกิโลเมตร
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // ปัดเศษ 2 ตำแหน่ง
}

/**
 * คำนวณเวลาการขนส่งโดยประมาณ
 */
export function estimateTransportTime(
  distance: number,
  averageSpeed: number = 60 // กม./ชม.
): number {
  return Math.ceil(distance / averageSpeed); // ชั่วโมง
}

/**
 * ตรวจสอบว่าคลังเปิดทำการหรือไม่
 */
export function isWarehouseOpen(warehouse: Warehouse, date: Date = new Date()): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()] as keyof typeof warehouse.operatingHours;
  const hours = warehouse.operatingHours[dayName];
  
  if (!hours.isOpen) return false;
  
  const currentTime = date.getHours() * 100 + date.getMinutes();
  const openTime = parseInt(hours.open.replace(':', ''));
  const closeTime = parseInt(hours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * คำนวณค่าใช้จ่ายในการขนส่ง
 */
export function calculateTransportCost(
  distance: number,
  weight: number,
  ratePerKm: number = 15,
  ratePerKg: number = 2
): number {
  const distanceCost = distance * ratePerKm;
  const weightCost = weight * ratePerKg;
  const baseCost = 500; // ค่าธรรมเนียมพื้นฐาน
  
  return Math.round(baseCost + distanceCost + weightCost);
}