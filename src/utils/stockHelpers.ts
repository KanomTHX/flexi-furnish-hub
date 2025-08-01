import { ProductStock, StockMovement, StockAlert, StockSummary, StockFilter } from '@/types/stock';

/**
 * คำนวณสถานะสต็อกของสินค้า
 */
export function calculateStockStatus(
  currentStock: number,
  minStock: number,
  maxStock: number
): 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock' {
  if (currentStock === 0) {
    return 'out_of_stock';
  } else if (currentStock <= minStock) {
    return 'low_stock';
  } else if (currentStock > maxStock) {
    return 'overstock';
  } else {
    return 'in_stock';
  }
}

/**
 * คำนวณค่าเฉลี่ยต้นทุนสินค้า (Weighted Average Cost)
 */
export function calculateAverageCost(
  currentCost: number,
  currentQuantity: number,
  newCost: number,
  newQuantity: number
): number {
  if (currentQuantity + newQuantity === 0) return 0;
  
  const totalValue = (currentCost * currentQuantity) + (newCost * newQuantity);
  const totalQuantity = currentQuantity + newQuantity;
  
  return Math.round((totalValue / totalQuantity) * 100) / 100;
}

/**
 * คำนวณ Stock Turnover Rate
 */
export function calculateStockTurnover(
  soldQuantity: number,
  averageStock: number,
  periodInDays: number = 365
): number {
  if (averageStock === 0) return 0;
  
  const annualizedSold = (soldQuantity / periodInDays) * 365;
  return Math.round((annualizedSold / averageStock) * 100) / 100;
}

/**
 * คำนวณจำนวนวันที่สต็อกจะหมด (Days of Supply)
 */
export function calculateDaysOfSupply(
  currentStock: number,
  averageDailyUsage: number
): number {
  if (averageDailyUsage === 0) return Infinity;
  return Math.round(currentStock / averageDailyUsage);
}

/**
 * คำนวณ Reorder Point
 */
export function calculateReorderPoint(
  averageDailyUsage: number,
  leadTimeDays: number,
  safetyStock: number = 0
): number {
  return Math.ceil((averageDailyUsage * leadTimeDays) + safetyStock);
}

/**
 * คำนวณ Economic Order Quantity (EOQ)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  if (holdingCostPerUnit === 0) return 0;
  
  return Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit));
}

/**
 * สร้าง Stock Movement Record
 */
export function createStockMovement(
  productId: string,
  type: StockMovement['type'],
  quantity: number,
  previousStock: number,
  reason: string,
  options: {
    reference?: string;
    cost?: number;
    location?: string;
    supplierId?: string;
    employeeId: string;
    employeeName: string;
    notes?: string;
  }
): Omit<StockMovement, 'id' | 'product' | 'supplier' | 'createdAt' | 'updatedAt'> {
  const actualQuantity = type === 'out' || type === 'adjustment' && quantity > 0 
    ? -Math.abs(quantity) 
    : Math.abs(quantity);
  
  const newStock = previousStock + actualQuantity;
  
  return {
    productId,
    type,
    quantity: Math.abs(quantity),
    previousStock,
    newStock: Math.max(0, newStock),
    reason,
    reference: options.reference,
    cost: options.cost,
    totalCost: options.cost ? options.cost * Math.abs(quantity) : undefined,
    location: options.location,
    supplierId: options.supplierId,
    employeeId: options.employeeId,
    employeeName: options.employeeName,
    notes: options.notes
  };
}

/**
 * สร้าง Stock Alert
 */
export function createStockAlert(
  product: ProductStock,
  type: StockAlert['type'],
  customMessage?: string
): Omit<StockAlert, 'id' | 'createdAt'> {
  let message = customMessage;
  let severity: StockAlert['severity'] = 'low';
  
  if (!message) {
    switch (type) {
      case 'low_stock':
        message = `สินค้า ${product.name} (${product.sku}) เหลือเพียง ${product.currentStock} ชิ้น ต่ำกว่าระดับขั้นต่ำ`;
        severity = product.currentStock === 0 ? 'critical' : 'high';
        break;
      case 'out_of_stock':
        message = `สินค้า ${product.name} (${product.sku}) หมดสต็อก`;
        severity = 'critical';
        break;
      case 'overstock':
        message = `สินค้า ${product.name} (${product.sku}) มีสต็อกเกินกว่าระดับสูงสุด`;
        severity = 'medium';
        break;
      case 'expiring':
        message = `สินค้า ${product.name} (${product.sku}) จะหมดอายุเร็วๆ นี้`;
        severity = 'medium';
        break;
    }
  }
  
  return {
    productId: product.id,
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock
    },
    type,
    severity,
    message: message!,
    isRead: false
  };
}

/**
 * กรองข้อมูลสต็อกตามเงื่อนไข
 */
export function filterProductStock(
  products: ProductStock[],
  filter: StockFilter
): ProductStock[] {
  return products.filter(product => {
    // Filter by category
    if (filter.category && product.category !== filter.category) {
      return false;
    }
    
    // Filter by stock status
    if (filter.stockStatus && product.stockStatus !== filter.stockStatus) {
      return false;
    }
    
    // Filter by supplier
    if (filter.supplier && product.supplier?.id !== filter.supplier) {
      return false;
    }
    
    // Filter by location
    if (filter.location) {
      const hasLocation = product.locations.some(loc => loc.locationId === filter.location);
      if (!hasLocation) return false;
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(searchTerm);
      const matchesSku = product.sku.toLowerCase().includes(searchTerm);
      const matchesBarcode = product.barcode?.toLowerCase().includes(searchTerm);
      
      if (!matchesName && !matchesSku && !matchesBarcode) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * กรองข้อมูล Stock Movement ตามเงื่อนไข
 */
export function filterStockMovements(
  movements: StockMovement[],
  filter: StockFilter
): StockMovement[] {
  return movements.filter(movement => {
    // Filter by movement type
    if (filter.movementType && movement.type !== filter.movementType) {
      return false;
    }
    
    // Filter by date range
    if (filter.dateFrom) {
      const movementDate = new Date(movement.createdAt);
      const fromDate = new Date(filter.dateFrom);
      if (movementDate < fromDate) return false;
    }
    
    if (filter.dateTo) {
      const movementDate = new Date(movement.createdAt);
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (movementDate > toDate) return false;
    }
    
    // Filter by location
    if (filter.location && movement.location !== filter.location) {
      return false;
    }
    
    // Filter by supplier
    if (filter.supplier && movement.supplierId !== filter.supplier) {
      return false;
    }
    
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const matchesProductName = movement.product.name.toLowerCase().includes(searchTerm);
      const matchesSku = movement.product.sku.toLowerCase().includes(searchTerm);
      const matchesReference = movement.reference?.toLowerCase().includes(searchTerm);
      const matchesReason = movement.reason.toLowerCase().includes(searchTerm);
      
      if (!matchesProductName && !matchesSku && !matchesReference && !matchesReason) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * คำนวณสรุปข้อมูลสต็อก
 */
export function calculateStockSummary(
  products: ProductStock[],
  movements: StockMovement[]
): StockSummary {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + product.totalValue, 0);
  
  const lowStockItems = products.filter(p => p.stockStatus === 'low_stock').length;
  const outOfStockItems = products.filter(p => p.stockStatus === 'out_of_stock').length;
  const overstockItems = products.filter(p => p.stockStatus === 'overstock').length;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const totalMovementsToday = movements.filter(m => 
    m.createdAt.startsWith(todayStr)
  ).length;
  
  const thisMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const totalMovementsThisMonth = movements.filter(m => 
    m.createdAt.startsWith(thisMonth)
  ).length;
  
  // คำนวณ turnover เฉลี่ย (simplified)
  const totalSoldThisYear = movements
    .filter(m => m.type === 'out' && m.createdAt.startsWith(today.getFullYear().toString()))
    .reduce((sum, m) => sum + m.quantity, 0);
  
  const averageStock = products.reduce((sum, p) => sum + p.currentStock, 0) / products.length;
  const averageTurnover = averageStock > 0 ? totalSoldThisYear / averageStock : 0;
  
  // Fast/Slow moving items (simplified - based on recent movements)
  const recentMovements = movements.filter(m => {
    const movementDate = new Date(m.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return movementDate >= thirtyDaysAgo && m.type === 'out';
  });
  
  const productMovementCounts = recentMovements.reduce((acc, m) => {
    acc[m.productId] = (acc[m.productId] || 0) + m.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  const movementValues = Object.values(productMovementCounts);
  const averageMovement = movementValues.length > 0 
    ? movementValues.reduce((sum, val) => sum + val, 0) / movementValues.length 
    : 0;
  
  const fastMovingItems = Object.values(productMovementCounts).filter(count => count > averageMovement).length;
  const slowMovingItems = products.length - fastMovingItems;
  
  return {
    totalProducts,
    totalValue,
    lowStockItems,
    outOfStockItems,
    overstockItems,
    totalMovementsToday,
    totalMovementsThisMonth,
    averageTurnover: Math.round(averageTurnover * 100) / 100,
    fastMovingItems,
    slowMovingItems
  };
}

/**
 * ส่งออกข้อมูลสต็อกเป็น CSV
 */
export function exportStockToCSV(products: ProductStock[]): string {
  const headers = [
    'SKU',
    'ชื่อสินค้า',
    'หมวดหมู่',
    'สต็อกปัจจุบัน',
    'สต็อกจอง',
    'สต็อกพร้อมขาย',
    'สต็อกขั้นต่ำ',
    'สต็อกสูงสุด',
    'จุดสั่งซื้อใหม่',
    'ต้นทุนเฉลี่ย',
    'มูลค่ารวม',
    'สถานะสต็อก',
    'ผู้จัดจำหน่าย',
    'การเคลื่อนไหวล่าสุด'
  ];
  
  const rows = products.map(product => [
    product.sku,
    product.name,
    product.category,
    product.currentStock.toString(),
    product.reservedStock.toString(),
    product.availableStock.toString(),
    product.minStock.toString(),
    product.maxStock.toString(),
    product.reorderPoint.toString(),
    product.averageCost.toLocaleString(),
    product.totalValue.toLocaleString(),
    getStockStatusText(product.stockStatus),
    product.supplier?.name || '',
    product.lastMovementDate ? new Date(product.lastMovementDate).toLocaleDateString('th-TH') : ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * ส่งออกข้อมูล Stock Movement เป็น CSV
 */
export function exportMovementsToCSV(movements: StockMovement[]): string {
  const headers = [
    'วันที่',
    'SKU',
    'ชื่อสินค้า',
    'ประเภท',
    'จำนวน',
    'สต็อกก่อน',
    'สต็อกหลัง',
    'เหตุผล',
    'เลขที่อ้างอิง',
    'ต้นทุน/หน่วย',
    'ต้นทุนรวม',
    'สถานที่',
    'ผู้จัดจำหน่าย',
    'ผู้ดำเนินการ',
    'หมายเหตุ'
  ];
  
  const rows = movements.map(movement => [
    new Date(movement.createdAt).toLocaleDateString('th-TH'),
    movement.product.sku,
    movement.product.name,
    getMovementTypeText(movement.type),
    movement.quantity.toString(),
    movement.previousStock.toString(),
    movement.newStock.toString(),
    movement.reason,
    movement.reference || '',
    movement.cost?.toLocaleString() || '',
    movement.totalCost?.toLocaleString() || '',
    movement.location || '',
    movement.supplier?.name || '',
    movement.employeeName,
    movement.notes || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * แปลงสถานะสต็อกเป็นข้อความ
 */
export function getStockStatusText(status: ProductStock['stockStatus']): string {
  const statusMap = {
    in_stock: 'ปกติ',
    low_stock: 'ต่ำกว่าเกณฑ์',
    out_of_stock: 'หมดสต็อก',
    overstock: 'เกินเกณฑ์'
  };
  
  return statusMap[status] || status;
}

/**
 * แปลงประเภทการเคลื่อนไหวเป็นข้อความ
 */
export function getMovementTypeText(type: StockMovement['type']): string {
  const typeMap = {
    in: 'รับเข้า',
    out: 'จ่ายออก',
    adjustment: 'ปรับปรุง',
    transfer: 'โอนย้าย'
  };
  
  return typeMap[type] || type;
}

/**
 * แปลงระดับความสำคัญของ Alert เป็นข้อความ
 */
export function getAlertSeverityText(severity: StockAlert['severity']): string {
  const severityMap = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    critical: 'วิกฤต'
  };
  
  return severityMap[severity] || severity;
}

/**
 * แปลงประเภท Alert เป็นข้อความ
 */
export function getAlertTypeText(type: StockAlert['type']): string {
  const typeMap = {
    low_stock: 'สต็อกต่ำ',
    out_of_stock: 'หมดสต็อก',
    overstock: 'สต็อกเกิน',
    expiring: 'ใกล้หมดอายุ'
  };
  
  return typeMap[type] || type;
}

/**
 * คำนวณเปอร์เซ็นต์การใช้งานของสถานที่เก็บ
 */
export function calculateLocationUtilization(current: number, capacity: number): number {
  if (capacity === 0) return 0;
  return Math.round((current / capacity) * 100);
}

/**
 * สร้างเลขที่ Purchase Order
 */
export function generatePONumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `PO${year}${month}${day}${time}`;
}

/**
 * สร้างเลขที่ Stock Take
 */
export function generateStockTakeNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `ST${year}${month}${day}${time}`;
}