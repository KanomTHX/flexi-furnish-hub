// Branch-specific Sales Types
import { Branch } from './branch';

export interface BranchSale {
  id: string;
  saleNumber: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Customer Information
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    branchId: string;
  };
  
  // Sale Details
  items: BranchSaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Payment Information
  paymentMethod: 'cash' | 'card' | 'transfer' | 'installment';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paidAmount: number;
  changeAmount: number;
  
  // Sale Status
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  
  // Staff Information
  salesPersonId: string;
  salesPersonName: string;
  cashierId?: string;
  cashierName?: string;
  
  // Timestamps
  saleDate: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  
  // Additional Information
  notes?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  
  // System Information
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BranchSaleItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    image?: string;
  };
  
  // Quantity and Pricing
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalPrice: number;
  
  // Stock Information
  warehouseId?: string;
  stockReserved: boolean;
  
  // Additional Information
  notes?: string;
  warranty?: {
    period: number;
    unit: 'days' | 'months' | 'years';
    terms: string;
  };
}

export interface BranchInstallment {
  id: string;
  contractNumber: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Customer Information
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    idCard: string;
    address: string;
    occupation: string;
    monthlyIncome: number;
    branchId: string;
  };
  
  // Sale Reference
  saleId?: string;
  saleNumber?: string;
  
  // Contract Details
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number;
  installmentPeriod: number; // months
  monthlyPayment: number;
  
  // Payment Schedule
  payments: BranchInstallmentPayment[];
  
  // Contract Status
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  
  // Dates
  contractDate: string;
  firstPaymentDate: string;
  lastPaymentDate: string;
  completedDate?: string;
  
  // Staff Information
  salesPersonId: string;
  salesPersonName: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Additional Information
  notes?: string;
  terms?: string;
  collateral?: string;
  
  // System Information
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BranchInstallmentPayment {
  id: string;
  installmentId: string;
  paymentNumber: number;
  
  // Payment Details
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  
  // Payment Status
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  
  // Payment Information
  paidDate?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  receiptNumber?: string;
  
  // Late Payment
  lateFee: number;
  daysOverdue: number;
  
  // Staff Information
  collectedBy?: string;
  collectorName?: string;
  
  // Additional Information
  notes?: string;
  
  // System Information
  createdAt: string;
  updatedAt: string;
}

export interface BranchClaim {
  id: string;
  claimNumber: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Customer Information
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    branchId: string;
  };
  
  // Product Information
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    image?: string;
  };
  
  // Sale Reference
  saleId?: string;
  saleNumber?: string;
  purchaseDate?: string;
  
  // Claim Details
  type: 'warranty' | 'defect' | 'damage' | 'return' | 'exchange' | 'refund';
  category: 'product_defect' | 'shipping_damage' | 'wrong_item' | 'not_as_described' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Claim Description
  title: string;
  description: string;
  symptoms?: string;
  customerRequest: string;
  
  // Status and Resolution
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'resolved' | 'closed';
  resolution?: 'repair' | 'replace' | 'refund' | 'exchange' | 'no_action';
  resolutionDetails?: string;
  
  // Staff Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  
  // Dates
  submittedDate: string;
  reviewedDate?: string;
  resolvedDate?: string;
  closedDate?: string;
  
  // Cost Information
  estimatedCost?: number;
  actualCost?: number;
  refundAmount?: number;
  
  // Attachments and Evidence
  attachments?: string[];
  photos?: string[];
  
  // Customer Satisfaction
  customerRating?: number;
  customerFeedback?: string;
  
  // Additional Information
  notes?: string;
  internalNotes?: string;
  
  // System Information
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface BranchFinancial {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Period Information
  period: {
    from: string;
    to: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  
  // Revenue
  revenue: {
    totalSales: number;
    cashSales: number;
    cardSales: number;
    installmentSales: number;
    refunds: number;
    netRevenue: number;
  };
  
  // Costs
  costs: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    staffCosts: number;
    rentAndUtilities: number;
    marketingExpenses: number;
    otherExpenses: number;
    totalCosts: number;
  };
  
  // Profitability
  profitability: {
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
    ebitda: number;
    ebitdaMargin: number;
  };
  
  // Cash Flow
  cashFlow: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    cashBalance: number;
  };
  
  // Key Metrics
  metrics: {
    averageTransactionValue: number;
    transactionCount: number;
    customerCount: number;
    repeatCustomerRate: number;
    inventoryTurnover: number;
    daysInInventory: number;
  };
  
  // Comparisons
  comparison: {
    previousPeriod: {
      revenueGrowth: number;
      profitGrowth: number;
      customerGrowth: number;
    };
    budget: {
      revenueVariance: number;
      profitVariance: number;
      expenseVariance: number;
    };
  };
  
  // System Information
  generatedAt: string;
  generatedBy: string;
}

// Summary Types
export interface BranchSalesSummary {
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Sales Metrics
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTransactions: number;
  
  // Growth Metrics
  revenueGrowth: number;
  transactionGrowth: number;
  customerGrowth: number;
  
  // Top Products
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  
  // Top Customers
  topCustomers: {
    customerId: string;
    customerName: string;
    totalSpent: number;
    transactionCount: number;
  }[];
  
  // Payment Methods
  paymentMethods: {
    cash: number;
    card: number;
    transfer: number;
    installment: number;
  };
  
  // Time Period
  period: {
    from: string;
    to: string;
  };
  
  lastUpdated: string;
}

export interface BranchInstallmentSummary {
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Contract Metrics
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  defaultedContracts: number;
  
  // Financial Metrics
  totalFinanced: number;
  totalCollected: number;
  outstandingBalance: number;
  overdueAmount: number;
  
  // Performance Metrics
  collectionRate: number;
  defaultRate: number;
  averageContractValue: number;
  averageMonthlyPayment: number;
  
  // Aging Analysis
  aging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days90Plus: number;
  };
  
  lastUpdated: string;
}

export interface BranchClaimSummary {
  branchId: string;
  branchCode: string;
  branchName: string;
  
  // Claim Metrics
  totalClaims: number;
  openClaims: number;
  resolvedClaims: number;
  rejectedClaims: number;
  
  // Resolution Metrics
  averageResolutionTime: number; // days
  resolutionRate: number;
  customerSatisfactionRate: number;
  
  // Cost Metrics
  totalClaimCost: number;
  averageClaimCost: number;
  refundAmount: number;
  
  // Claim Types
  claimTypes: {
    warranty: number;
    defect: number;
    damage: number;
    return: number;
    exchange: number;
    refund: number;
  };
  
  // Priority Distribution
  priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  
  lastUpdated: string;
}