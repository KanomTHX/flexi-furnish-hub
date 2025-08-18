// POS Sales Types
export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    description?: string;
    barcode?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
}

export interface Customer {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    
    // ข้อมูลเพิ่มเติมสำหรับสัญญาผ่อน
    idCard?: string; // เลขบัตรประชาชน
    occupation?: string; // อาชีพ
    monthlyIncome?: number; // รายได้ต่อเดือน
    workplace?: string; // สถานที่ทำงาน
    workAddress?: string; // ที่อยู่ที่ทำงาน
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    creditScore?: number; // คะแนนเครดิต
    blacklisted?: boolean; // บัญชีดำ
    notes?: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'cash' | 'card' | 'transfer' | 'installment';
    icon: string;
}

// Installment Contract Types
export interface InstallmentPlan {
    id: string;
    name: string;
    months: number;
    interestRate: number; // อัตราดอกเบี้ยต่อปี (%)
    downPaymentPercent: number; // เปอร์เซ็นต์เงินดาวน์
    processingFee: number; // ค่าธรรมเนียมการจัดทำสัญญา
    description?: string;
    isActive: boolean;
}

export interface InstallmentPayment {
    id: string;
    contractId: string;
    installmentNumber: number; // งวดที่
    dueDate: string;
    amount: number;
    principalAmount: number; // เงินต้น
    interestAmount: number; // ดอกเบี้ย
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paidDate?: string;
    paidAmount?: number;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
}

// Serial Number Types
export interface SerialNumber {
    id: string;
    productId: string;
    branchId: string;
    serialNumber: string;
    status: 'available' | 'reserved' | 'sold' | 'installment' | 'returned';
    costPrice?: number;
    sellingPrice?: number;
    installmentContractId?: string;
    receivedDate: string;
    soldDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    
    // Relations
    product?: Product;
    installmentContract?: InstallmentContract;
}

export interface SerialNumberSelection {
    productId: string;
    productName: string;
    serialNumbers: SerialNumber[];
    selectedSerialNumbers: string[];
    totalQuantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface InstallmentContract {
    id: string;
    contractNumber: string;
    saleId: string;
    customerId: string;
    customer: Customer;
    planId: string;
    plan: InstallmentPlan;
    
    // Serial Numbers
    serialNumbers: string[]; // Array of serial number IDs
    serialNumberDetails?: SerialNumber[]; // Full serial number objects
    
    // จำนวนเงิน
    totalAmount: number; // ยอดรวมสินค้า
    downPayment: number; // เงินดาวน์
    financedAmount: number; // ยอดที่ผ่อน
    totalInterest: number; // ดอกเบี้ยรวม
    processingFee: number; // ค่าธรรมเนียม
    totalPayable: number; // ยอดที่ต้องชำระรวม
    monthlyPayment: number; // ค่างวดต่อเดือน
    
    // วันที่
    contractDate: string;
    firstPaymentDate: string;
    lastPaymentDate: string;
    
    // สถานะ
    status: 'draft' | 'active' | 'completed' | 'defaulted' | 'cancelled';
    
    // การชำระเงิน
    payments: InstallmentPayment[];
    paidInstallments: number;
    remainingInstallments: number;
    totalPaid: number;
    remainingBalance: number;
    
    // ข้อมูลเพิ่มเติม
    guarantor?: Customer; // ผู้ค้ำประกัน
    collateral?: string; // หลักประกัน
    notes?: string;
    terms?: string; // เงื่อนไขพิเศษ
    
    // ข้อมูลระบบ
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: string;
}

export interface InstallmentSummary {
    totalContracts: number;
    activeContracts: number;
    totalFinanced: number;
    totalCollected: number;
    overdueAmount: number;
    overdueContracts: number;
    monthlyCollection: number;
}

export interface Sale {
    id: string;
    saleNumber: string;
    customerId?: string;
    customer?: Customer;
    items: CartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'pending' | 'completed' | 'failed';
    status: 'draft' | 'completed' | 'cancelled' | 'refunded';
    createdAt: string;
    updatedAt: string;
    employeeId: string;
    notes?: string;
    
    // สำหรับการขายแบบผ่อน
    installmentContractId?: string;
    installmentContract?: InstallmentContract;
}

export interface POSState {
    cart: CartItem[];
    customer?: Customer;
    paymentMethod?: PaymentMethod;
    discount: number;
    tax: number;
    subtotal: number;
    total: number;
    sales: Sale[];
}

// POS Integration Types
export interface StockAlert {
    id: string;
    productId: string;
    productName: string;
    productCode: string;
    currentStock: number;
    minimumStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    preferredSupplierId?: string;
    preferredSupplier?: {
        id: string;
        name: string;
        contactInfo: string;
    };
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    location: string;
    lastSaleDate?: string;
    averageDailySales: number;
    daysOfStockRemaining: number;
    status: 'pending' | 'processing' | 'ordered' | 'resolved' | 'ignored';
    processedAt?: string;
    processedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AutoPurchaseOrder {
    id: string;
    orderNumber: string;
    supplierId: string;
    supplier: {
        id: string;
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
    };
    items: AutoPurchaseOrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    expectedDeliveryDate: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
    automationReason: string;
    triggerType: 'low_stock' | 'scheduled_reorder' | 'seasonal_demand' | 'manual_trigger';
    stockAlertIds: string[];
    approvalRequired: boolean;
    approvedBy?: string;
    approvedAt?: string;
    sentAt?: string;
    confirmedAt?: string;
    deliveredAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AutoPurchaseOrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    receivedQuantity: number;
    remainingQuantity: number;
    stockAlertId?: string;
    supplierProductCode?: string;
    leadTimeDays: number;
    notes?: string;
}

export interface POSIntegrationConfig {
    id: string;
    name: string;
    type: 'square' | 'shopify' | 'woocommerce' | 'custom';
    configuration: POSSystemConfig;
    status: 'active' | 'inactive' | 'error';
    lastSyncAt?: string;
    nextSyncAt?: string;
    syncFrequency: 'real_time' | 'every_5_minutes' | 'hourly' | 'daily';
    syncSettings: POSSyncSettings;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface POSSystemConfig {
    apiUrl?: string;
    apiKey?: string;
    secretKey?: string;
    storeId?: string;
    locationId?: string;
    webhookUrl?: string;
    customFields?: Record<string, any>;
}

export interface POSSyncSettings {
    syncInventory: boolean;
    syncSales: boolean;
    syncCustomers: boolean;
    syncProducts: boolean;
    autoCreatePurchaseOrders: boolean;
    stockAlertThreshold: number;
    reorderPointMultiplier: number;
    conflictResolution: 'pos_wins' | 'supplier_wins' | 'manual_review';
}

export interface InventorySyncResult {
    id: string;
    integrationId: string;
    syncType: 'full' | 'incremental' | 'real_time';
    status: 'success' | 'partial' | 'failed';
    startedAt: string;
    completedAt?: string;
    productsProcessed: number;
    productsUpdated: number;
    stockAlertsGenerated: number;
    purchaseOrdersCreated: number;
    errors: InventorySyncError[];
    summary: InventorySyncSummary;
}

export interface InventorySyncError {
    productId: string;
    productCode?: string;
    errorType: 'product_not_found' | 'invalid_stock_level' | 'supplier_not_mapped' | 'api_error';
    errorMessage: string;
    details?: any;
}

export interface InventorySyncSummary {
    totalProducts: number;
    stockUpdated: number;
    lowStockDetected: number;
    outOfStockDetected: number;
    newProductsAdded: number;
    discontinuedProducts: number;
    averageStockLevel: number;
    totalInventoryValue: number;
}

export interface SupplierProductMapping {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    supplierId: string;
    supplierName: string;
    supplierProductCode?: string;
    supplierProductName?: string;
    unitCost: number;
    minimumOrderQuantity: number;
    leadTimeDays: number;
    isPreferred: boolean;
    priority: number; // 1 = highest priority
    lastOrderDate?: string;
    lastUnitCost?: number;
    qualityRating: number; // 1-5
    reliabilityRating: number; // 1-5
    costRating: number; // 1-5
    overallRating: number; // 1-5
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IntegrationHealthCheck {
    integrationId: string;
    integrationType: string;
    status: 'healthy' | 'warning' | 'error' | 'offline';
    lastCheckAt: string;
    responseTime: number; // in milliseconds
    uptime: number; // percentage
    errorRate: number; // percentage
    lastError?: string;
    metrics: IntegrationMetrics;
}

export interface IntegrationMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    peakResponseTime: number;
    dataTransferred: number; // in bytes
    recordsProcessed: number;
    lastSuccessfulSync?: string;
}// 
// Export error types for easy importing
export * from './errors';