// Accounting helpers
import { exportService } from '../services/exportService';
import type { Account, JournalEntry, Transaction } from '../types/accounting';
import type { ExportServiceOptions } from '../services/exportService';

export const calculateTaxAmount = (amount: number, rate: number) => amount * rate;
export const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const validateAccountingEntry = (entry: any) => true;
export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('th-TH');

// Enhanced export functions using exportService
export const exportAccountsToExcel = async (accounts: Account[]) => {
  const options: ExportServiceOptions = {
    format: 'excel',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportChartOfAccounts(accounts, options);
};

export const exportAccountsToPDF = async (accounts: Account[]) => {
  const options: ExportServiceOptions = {
    format: 'pdf',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportChartOfAccounts(accounts, options);
};

export const exportJournalEntriesToExcel = async (entries: JournalEntry[]) => {
  const options: ExportServiceOptions = {
    format: 'excel',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportJournalEntries(entries, options);
};

export const exportJournalEntriesToPDF = async (entries: JournalEntry[]) => {
  const options: ExportServiceOptions = {
    format: 'pdf',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportJournalEntries(entries, options);
};

export const exportTransactionsToExcel = async (transactions: Transaction[]) => {
  const options: ExportServiceOptions = {
    format: 'excel',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportTransactions(transactions, options);
};

export const exportTransactionsToPDF = async (transactions: Transaction[]) => {
  const options: ExportServiceOptions = {
    format: 'pdf',
    includeDetails: true,
    includeSummary: false
  };
  await exportService.exportTransactions(transactions, options);
};



export const accountTypeLabels = {
  asset: 'สินทรัพย์',
  liability: 'หนี้สิน',
  equity: 'ทุน',
  revenue: 'รายได้',
  expense: 'ค่าใช้จ่าย'
};

export const accountCategoryLabels = {
  current_asset: 'สินทรัพย์หมุนเวียน',
  fixed_asset: 'สินทรัพย์ถาวร',
  current_liability: 'หนี้สินหมุนเวียน',
  long_term_liability: 'หนี้สินระยะยาว'
};

export const journalEntryStatusLabels = {
  draft: 'แบบร่าง',
  posted: 'บันทึกแล้ว',
  cancelled: 'ยกเลิก'
};

export default {
  calculateTaxAmount,
  formatCurrency,
  validateAccountingEntry,
  formatDate,
  accountTypeLabels,
  accountCategoryLabels,
  journalEntryStatusLabels
};