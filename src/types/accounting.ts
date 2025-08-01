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
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  entries: JournalEntryLine[];
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