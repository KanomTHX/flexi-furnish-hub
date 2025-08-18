// Accounting Types
export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  parentId?: string;
  balance: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type AccountCategory = 
  | 'current_asset' | 'fixed_asset' | 'intangible_asset'
  | 'current_liability' | 'long_term_liability'
  | 'owner_equity' | 'retained_earnings'
  | 'sales_revenue' | 'other_revenue'
  | 'cost_of_goods_sold' | 'operating_expense' | 'other_expense';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  sourceType?: string;
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  entries: JournalEntryLine[];
  lines?: JournalEntryLine[]; // Alias for backward compatibility
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export type JournalEntryStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account: Account;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  reference?: string;
}

export interface FinancialStatement {
  id: string;
  type: FinancialStatementType;
  period: AccountingPeriod;
  data: FinancialStatementData;
  generatedAt: string;
  generatedBy: string;
}

export type FinancialStatementType = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';

export interface AccountingPeriod {
  startDate: string;
  endDate: string;
  fiscalYear: number;
  quarter?: number;
  month?: number;
}

export interface FinancialStatementData {
  assets?: AccountBalance[];
  liabilities?: AccountBalance[];
  equity?: AccountBalance[];
  revenues?: AccountBalance[];
  expenses?: AccountBalance[];
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalRevenues?: number;
  totalExpenses?: number;
  netIncome?: number;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
  debitTotal: number;
  creditTotal: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  description: string;
  reference?: string;
  sourceModule: string;
  sourceId: string;
  journalEntryId?: string;
  status: TransactionStatus;
  createdAt: string;
}

export type TransactionType = 'sale' | 'purchase' | 'payment' | 'receipt' | 'adjustment' | 'transfer';
export type TransactionStatus = 'pending' | 'processed' | 'cancelled';

export interface AccountingSettings {
  fiscalYearStart: string; // MM-DD format
  baseCurrency: string;
  decimalPlaces: number;
  autoNumbering: {
    journalEntries: boolean;
    accounts: boolean;
  };
  approvalRequired: boolean;
  retainedEarningsAccount?: string;
}

export interface AccountingSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenues: number;
  totalExpenses: number;
  netIncome: number;
  pendingEntries: number;
  recentTransactions: number;
  accountsCount: number;
}

// Advanced Accounting Integration Types
export interface ReconciliationReport {
  id: string;
  reportNumber: string;
  period: AccountingPeriod;
  accountId: string;
  account: Account;
  bookBalance: number;
  statementBalance: number;
  reconciliationItems: ReconciliationItem[];
  adjustments: ReconciliationAdjustment[];
  reconciledBalance: number;
  variance: number;
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed';
  reconciledBy?: string;
  reconciledAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  transactionId?: string;
  description: string;
  amount: number;
  type: 'outstanding_check' | 'deposit_in_transit' | 'bank_charge' | 'interest_earned' | 'error_correction';
  isReconciled: boolean;
  reconciledDate?: string;
  notes?: string;
}

export interface ReconciliationAdjustment {
  id: string;
  reconciliationId: string;
  journalEntryId: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reason: string;
  createdAt: string;
}

export interface AccountingSystemIntegration {
  id: string;
  name: string;
  type: AccountingSystemType;
  configuration: AccountingSystemConfig;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountingSystemType = 'quickbooks' | 'xero' | 'sage' | 'sap' | 'custom';

export interface AccountingSystemConfig {
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  companyId?: string;
  accountMappings: AccountMapping[];
  syncSettings: SyncSettings;
}

// External accounting system configuration types
export interface ExternalAccountingConfig {
  systemType: AccountingSystemType;
  apiUrl: string;
  credentials: any;
  isActive: boolean;
  lastSyncAt?: Date;
}

export interface QuickBooksConfig extends ExternalAccountingConfig {
  systemType: 'quickbooks';
  clientId: string;
  clientSecret: string;
  companyId: string;
  environment: 'sandbox' | 'production';
  accessToken?: string;
  refreshToken?: string;
}

export interface XeroConfig extends ExternalAccountingConfig {
  systemType: 'xero';
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scopes: string[];
  accessToken?: string;
  refreshToken?: string;
}

export interface AccountMapping {
  localAccountId: string;
  externalAccountId: string;
  externalAccountCode: string;
  externalAccountName: string;
  mappingType: 'automatic' | 'manual';
  isActive: boolean;
}

export interface SyncSettings {
  syncJournalEntries: boolean;
  syncAccounts: boolean;
  syncCustomers: boolean;
  syncSuppliers: boolean;
  autoPostEntries: boolean;
  conflictResolution: 'local_wins' | 'external_wins' | 'manual_review';
}

export interface SyncResult {
  id: string;
  integrationId: string;
  syncType: 'full' | 'incremental';
  status: 'success' | 'partial' | 'failed';
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  summary: SyncSummary;
}

export interface SyncError {
  recordId: string;
  recordType: string;
  errorCode: string;
  errorMessage: string;
  details?: any;
}

export interface SyncSummary {
  accountsSynced: number;
  journalEntriesSynced: number;
  customersSynced: number;
  suppliersSynced: number;
  conflictsDetected: number;
  conflictsResolved: number;
}

// Filter interfaces
export interface AccountFilter {
  type?: AccountType;
  category?: AccountCategory;
  isActive?: boolean;
  search?: string;
}

export interface JournalEntryFilter {
  status?: JournalEntryStatus;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  createdBy?: string;
  search?: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  sourceModule?: string;
  search?: string;
}

// Export all accounting types for easy importing
// Invoice Management Types
export interface APInvoice {
  id: string;
  vendor_name: string;
  vendor_address?: string;
  vendor_tax_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: PaymentTerm;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  notes?: string;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export interface ARInvoice {
  id: string;
  customer_name: string;
  customer_address?: string;
  customer_tax_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: PaymentTerm;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  notes?: string;
  branch_id: string;
  contract_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  invoice_type: 'ap' | 'ar';
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total_amount: number;
}

export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type PaymentTerm = 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt' | 'custom';

// Financial Reports Types
export interface IncomeStatement {
  id: string;
  period: FinancialPeriod;
  revenues: AccountBalance[];
  expenses: AccountBalance[];
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  totalRevenues: number;
  totalExpenses: number;
  branchId?: string;
  generatedAt: string;
  generatedBy: string;
}

export interface BalanceSheet {
  id: string;
  period: FinancialPeriod;
  assets: {
    currentAssets: AccountBalance[];
    fixedAssets: AccountBalance[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: AccountBalance[];
    longTermLiabilities: AccountBalance[];
    totalLiabilities: number;
  };
  equity: {
    ownerEquity: AccountBalance[];
    retainedEarnings: number;
    totalEquity: number;
  };
  branchId?: string;
  generatedAt: string;
  generatedBy: string;
}

export interface CashFlowStatement {
  id: string;
  period: FinancialPeriod;
  operatingActivities: CashFlowItem[];
  investingActivities: CashFlowItem[];
  financingActivities: CashFlowItem[];
  netCashFromOperating: number;
  netCashFromInvesting: number;
  netCashFromFinancing: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  branchId?: string;
  generatedAt: string;
  generatedBy: string;
}

export interface CashFlowItem {
  description: string;
  amount: number;
  accountId?: string;
}

export interface FinancialPeriod {
  startDate: string;
  endDate: string;
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  fiscalYear: number;
  quarter?: number;
  month?: number;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  accountType?: AccountType;
  includeInactive?: boolean;
}

export * from './errors';