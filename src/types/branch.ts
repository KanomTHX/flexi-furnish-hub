// Branch Management Types - Multi-Branch Data Separation System

export interface Branch {
  id: string;
  code: string;
  name: string;
  type: 'main' | 'branch' | 'outlet' | 'warehouse';
  status: 'active' | 'inactive' | 'maintenance';
  
  // Location Information
  address: {
    street: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Contact Information
  contact: {
    phone: string;
    email: string;
    manager: string;
    managerPhone: string;
    fax?: string;
  };
  
  // Business Information
  businessInfo: {
    taxId?: string;
    registrationNumber?: string;
    establishedDate: string;
    businessHours: {
      open: string;
      close: string;
      workingDays: string[];
    };
  };
  
  // Settings
  settings: {
    timezone: string;
    currency: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
    taxRate: number;
    allowNegativeStock: boolean;
    autoApproveTransfers: boolean;
    requireManagerApproval: boolean;
  };
  
  // Permissions & Access Control
  permissions: {
    canAccessOtherBranches: boolean;
    canTransferToBranches: string[];
    canViewReports: string[];
    dataIsolationLevel: 'strict' | 'partial' | 'shared';
  };
  
  // Statistics
  stats: {
    totalEmployees: number;
    totalCustomers: number;
    totalProducts: number;
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  
  // System Information
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BranchDataContext {
  currentBranch: Branch;
  accessibleBranches: Branch[];
  userPermissions: {
    canSwitchBranch: boolean;
    canViewAllBranches: boolean;
    canManageBranches: boolean;
    allowedOperations: string[];
  };
}

export interface BranchFilter {
  type?: Branch['type'];
  status?: Branch['status'];
  province?: string;
  search?: string;
  sortBy?: 'name' | 'code' | 'type' | 'revenue' | 'employees';
  sortOrder?: 'asc' | 'desc';
}

// Data Isolation Types
export interface BranchIsolatedData<T> {
  branchId: string;
  branchCode: string;
  branchName: string;
  data: T[];
  totalCount: number;
  lastUpdated: string;
}

export interface CrossBranchData<T> {
  branches: BranchIsolatedData<T>[];
  summary: {
    totalRecords: number;
    branchCount: number;
    lastSyncDate: string;
  };
}

// Branch-specific data types
export interface BranchStock extends StockLevel {
  branchId: string;
  branchCode: string;
  branchName: string;
  isSharedWithBranches?: string[];
  transferRestrictions?: {
    allowedDestinations: string[];
    requiresApproval: boolean;
    minimumQuantity: number;
  };
}

export interface BranchSales {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  saleNumber: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    branchId: string; // Customer belongs to specific branch
  };
  items: BranchSaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'installment';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  salesPerson: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface BranchSaleItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  warehouseId?: string;
  notes?: string;
}

export interface BranchEmployee {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  permissions: {
    modules: string[];
    operations: string[];
    canAccessOtherBranches: boolean;
    dataAccessLevel: 'own_branch' | 'selected_branches' | 'all_branches';
    accessibleBranches?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface BranchCustomer {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  customerCode: string;
  type: 'individual' | 'business';
  name: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    district: string;
    province: string;
    postalCode: string;
  };
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface BranchReport {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  reportType: 'sales' | 'stock' | 'financial' | 'employee' | 'customer';
  reportName: string;
  period: {
    from: string;
    to: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  };
  data: any;
  summary: {
    totalRecords: number;
    totalValue: number;
    averageValue: number;
    growth: number;
  };
  generatedAt: string;
  generatedBy: string;
}

// Branch Transfer Types
export interface BranchTransfer {
  id: string;
  transferNumber: string;
  type: 'stock' | 'employee' | 'customer' | 'data';
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  fromBranchId: string;
  fromBranch: {
    id: string;
    name: string;
    code: string;
  };
  
  toBranchId: string;
  toBranch: {
    id: string;
    name: string;
    code: string;
  };
  
  items: BranchTransferItem[];
  totalItems: number;
  totalValue: number;
  
  requestedDate: string;
  requestedBy: string;
  approvedDate?: string;
  approvedBy?: string;
  shippedDate?: string;
  receivedDate?: string;
  receivedBy?: string;
  
  notes?: string;
  attachments?: string[];
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface BranchTransferItem {
  id: string;
  type: 'product' | 'employee' | 'customer' | 'data';
  referenceId: string;
  referenceName: string;
  quantity?: number;
  unitValue?: number;
  totalValue: number;
  status: 'pending' | 'shipped' | 'received' | 'cancelled';
  notes?: string;
}

// Branch Synchronization
export interface BranchSync {
  id: string;
  syncType: 'full' | 'incremental' | 'selective';
  dataTypes: ('products' | 'customers' | 'employees' | 'sales' | 'stock' | 'settings')[];
  sourceBranchId: string;
  targetBranchIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
    percentage: number;
  };
  conflicts: BranchSyncConflict[];
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  createdAt: string;
  createdBy: string;
}

export interface BranchSyncConflict {
  id: string;
  recordType: string;
  recordId: string;
  recordName: string;
  conflictType: 'duplicate' | 'version' | 'permission' | 'validation';
  sourceBranchId: string;
  targetBranchId: string;
  sourceData: any;
  targetData: any;
  resolution: 'pending' | 'use_source' | 'use_target' | 'merge' | 'skip';
  resolvedAt?: string;
  resolvedBy?: string;
}

// Branch Analytics
export interface BranchAnalytics {
  branchId: string;
  branchCode: string;
  branchName: string;
  period: {
    from: string;
    to: string;
  };
  
  sales: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    growth: number;
    topProducts: {
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }[];
    topCustomers: {
      customerId: string;
      customerName: string;
      totalOrders: number;
      totalRevenue: number;
    }[];
  };
  
  stock: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    turnoverRate: number;
    fastMovingProducts: {
      productId: string;
      productName: string;
      movementCount: number;
      turnoverRate: number;
    }[];
    slowMovingProducts: {
      productId: string;
      productName: string;
      daysWithoutMovement: number;
      currentStock: number;
    }[];
  };
  
  employees: {
    totalEmployees: number;
    activeEmployees: number;
    averageSalesPerEmployee: number;
    topPerformers: {
      employeeId: string;
      employeeName: string;
      totalSales: number;
      totalRevenue: number;
    }[];
  };
  
  customers: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    customerRetentionRate: number;
    averageCustomerValue: number;
  };
  
  financial: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: number;
    netProfit: number;
    netProfitMargin: number;
  };
  
  generatedAt: string;
}

// Branch Comparison
export interface BranchComparison {
  period: {
    from: string;
    to: string;
  };
  branches: {
    branchId: string;
    branchCode: string;
    branchName: string;
    metrics: {
      revenue: number;
      orders: number;
      customers: number;
      employees: number;
      products: number;
      averageOrderValue: number;
      customerSatisfaction: number;
      profitMargin: number;
    };
    ranking: {
      revenue: number;
      orders: number;
      profitMargin: number;
      efficiency: number;
      overall: number;
    };
  }[];
  summary: {
    totalBranches: number;
    totalRevenue: number;
    totalOrders: number;
    averageRevenue: number;
    bestPerforming: {
      branchId: string;
      branchName: string;
      score: number;
    };
    worstPerforming: {
      branchId: string;
      branchName: string;
      score: number;
    };
  };
  generatedAt: string;
}

// Import types from stock.ts to avoid circular dependency
import { StockLevel } from './stock';