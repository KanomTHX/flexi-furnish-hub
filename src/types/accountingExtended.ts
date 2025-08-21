// Extended Accounting Types for Comprehensive Financial Management

// ===== Invoice Management =====
export interface APInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  withholdingTaxAmount: number;
  withholdingTaxRate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: APInvoiceStatus;
  paymentTerms?: string;
  description?: string;
  attachments?: string[];
  items: APInvoiceItem[];
  payments: APPayment[];
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type APInvoiceStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface APInvoiceItem {
  id: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
}

export interface APPayment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankAccount?: string;
  notes?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ARInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    taxId?: string;
    address?: string;
  };
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: ARInvoiceStatus;
  paymentTerms?: string;
  description?: string;
  attachments?: string[];
  items: ARInvoiceItem[];
  payments: ARPayment[];
  installmentContractId?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ARInvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface ARInvoiceItem {
  id: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
}

export interface ARPayment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankAccount?: string;
  notes?: string;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'promissory_note';

// ===== Expense Management =====
export interface AccountingExpense {
  id: string;
  expenseNumber: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  employeeId?: string;
  employee?: {
    id: string;
    name: string;
    position: string;
  };
  categoryId: string;
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  description: string;
  vendor?: string;
  receiptNumber?: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  attachments?: string[];
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  accountId: string; // Link to chart of accounts
  isActive: boolean;
  description?: string;
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'rejected';

// ===== Financial Reports =====
export interface ProfitLossReport {
  id: string;
  reportNumber: string;
  period: AccountingPeriod;
  branchId?: string; // null for consolidated
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  revenues: ReportLineItem[];
  costOfGoodsSold: ReportLineItem[];
  grossProfit: number;
  operatingExpenses: ReportLineItem[];
  operatingIncome: number;
  otherIncome: ReportLineItem[];
  otherExpenses: ReportLineItem[];
  netIncome: number;
  generatedAt: string;
  generatedBy: string;
}

export interface BalanceSheetReport {
  id: string;
  reportNumber: string;
  asOfDate: string;
  branchId?: string; // null for consolidated
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  assets: {
    currentAssets: ReportLineItem[];
    fixedAssets: ReportLineItem[];
    otherAssets: ReportLineItem[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: ReportLineItem[];
    longTermLiabilities: ReportLineItem[];
    totalLiabilities: number;
  };
  equity: {
    ownerEquity: ReportLineItem[];
    retainedEarnings: number;
    totalEquity: number;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface CashFlowReport {
  id: string;
  reportNumber: string;
  period: AccountingPeriod;
  branchId?: string; // null for consolidated
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  operatingActivities: {
    netIncome: number;
    adjustments: ReportLineItem[];
    workingCapitalChanges: ReportLineItem[];
    netCashFromOperating: number;
  };
  investingActivities: {
    activities: ReportLineItem[];
    netCashFromInvesting: number;
  };
  financingActivities: {
    activities: ReportLineItem[];
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: string;
  generatedBy: string;
}

export interface ReportLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

export interface AccountingPeriod {
  startDate: string;
  endDate: string;
  fiscalYear: number;
  quarter?: number;
  month?: number;
  label: string; // e.g., "Q1 2024", "January 2024"
}

// ===== Tax Management =====
export interface TaxReport {
  id: string;
  reportNumber: string;
  reportType: TaxReportType;
  period: AccountingPeriod;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  salesVAT: {
    totalSales: number;
    vatAmount: number;
    transactions: TaxTransactionSummary[];
  };
  purchaseVAT: {
    totalPurchases: number;
    vatAmount: number;
    transactions: TaxTransactionSummary[];
  };
  withholdingTax: {
    totalWithholding: number;
    transactions: TaxTransactionSummary[];
  };
  netVATPayable: number;
  generatedAt: string;
  generatedBy: string;
}

export type TaxReportType = 'vat_sales' | 'vat_purchase' | 'withholding_tax' | 'comprehensive';

export interface TaxTransactionSummary {
  transactionId: string;
  transactionType: 'sale' | 'purchase';
  date: string;
  documentNumber: string;
  customerSupplier: string;
  taxId?: string;
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  withholdingRate?: number;
  withholdingAmount?: number;
}

// ===== Integration with Other Modules =====
export interface POSIntegration {
  transactionId: string;
  saleDate: string;
  branchId: string;
  totalAmount: number;
  vatAmount: number;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  journalEntryId?: string;
  processed: boolean;
  processedAt?: string;
}

export interface InstallmentIntegration {
  contractId: string;
  paymentId: string;
  paymentDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  branchId: string;
  customerId: string;
  journalEntryId?: string;
  processed: boolean;
  processedAt?: string;
}

export interface SupplierIntegration {
  supplierId: string;
  invoiceId?: string;
  paymentId?: string;
  transactionType: 'invoice' | 'payment';
  amount: number;
  vatAmount: number;
  withholdingAmount: number;
  branchId: string;
  journalEntryId?: string;
  processed: boolean;
  processedAt?: string;
}

// ===== Dashboard and Analytics =====
export interface AccountingDashboard {
  period: AccountingPeriod;
  branchId?: string;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
  };
  revenueByBranch: BranchFinancialSummary[];
  expensesByCategory: ExpenseCategorySummary[];
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    net: number;
  };
  pendingItems: {
    pendingInvoices: number;
    overdueInvoices: number;
    pendingExpenses: number;
    pendingJournalEntries: number;
  };
  trends: {
    revenueGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
  };
}

export interface BranchFinancialSummary {
  branchId: string;
  branchName: string;
  branchCode: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  margin: number;
  employeeCount?: number;
  revenuePerEmployee?: number;
}

export interface ExpenseCategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  budgetAmount?: number;
  variance?: number;
}

// ===== Filters and Search =====
export interface APInvoiceFilter {
  status?: APInvoiceStatus;
  supplierId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

export interface ARInvoiceFilter {
  status?: ARInvoiceStatus;
  customerId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

export interface ExpenseFilter {
  status?: ExpenseStatus;
  categoryId?: string;
  branchId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

// ===== Export and Import =====
export interface ExportOptions {
  format: 'excel' | 'pdf';
  includeDetails: boolean;
  includeSummary: boolean;
  period?: AccountingPeriod;
  branchIds?: string[];
  template?: string;
}

export interface ImportResult {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}