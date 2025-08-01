import { Account, JournalEntry, Transaction, AccountType, AccountCategory } from '@/types/accounting';

// Account type and category mappings
export const accountTypeLabels: Record<AccountType, string> = {
  asset: 'สินทรัพย์',
  liability: 'หนี้สิน',
  equity: 'ส่วนของเจ้าของ',
  revenue: 'รายได้',
  expense: 'ค่าใช้จ่าย'
};

export const accountCategoryLabels: Record<AccountCategory, string> = {
  current_asset: 'สินทรัพย์หมุนเวียน',
  fixed_asset: 'สินทรัพย์ถาวร',
  intangible_asset: 'สินทรัพย์ไม่มีตัวตน',
  current_liability: 'หนี้สินหมุนเวียน',
  long_term_liability: 'หนี้สินระยะยาว',
  owner_equity: 'ทุนเจ้าของ',
  retained_earnings: 'กำไรสะสม',
  sales_revenue: 'รายได้จากการขาย',
  other_revenue: 'รายได้อื่น',
  cost_of_goods_sold: 'ต้นทุนขาย',
  operating_expense: 'ค่าใช้จ่ายในการดำเนินงาน',
  other_expense: 'ค่าใช้จ่ายอื่น'
};

export const journalEntryStatusLabels = {
  draft: 'ร่าง',
  pending: 'รออนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ'
};

export const transactionTypeLabels = {
  sale: 'การขาย',
  purchase: 'การซื้อ',
  payment: 'การจ่าย',
  receipt: 'การรับ',
  adjustment: 'การปรับปรุง',
  transfer: 'การโอน'
};

export const transactionStatusLabels = {
  pending: 'รอดำเนินการ',
  processed: 'ดำเนินการแล้ว',
  cancelled: 'ยกเลิก'
};

// Formatting functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat('th-TH').format(number);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Validation functions
export function validateJournalEntry(entry: Partial<JournalEntry>): string[] {
  const errors: string[] = [];

  if (!entry.description?.trim()) {
    errors.push('กรุณาระบุคำอธิบาย');
  }

  if (!entry.date) {
    errors.push('กรุณาระบุวันที่');
  }

  if (!entry.entries || entry.entries.length < 2) {
    errors.push('ต้องมีรายการบัญชีอย่างน้อย 2 รายการ');
  }

  if (entry.entries) {
    const totalDebit = entry.entries.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = entry.entries.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push('ยอดเดบิตและเครดิตต้องเท่ากัน');
    }

    entry.entries.forEach((line, index) => {
      if (!line.accountId) {
        errors.push(`รายการที่ ${index + 1}: กรุณาเลือกบัญชี`);
      }
      if (line.debitAmount === 0 && line.creditAmount === 0) {
        errors.push(`รายการที่ ${index + 1}: กรุณาระบุจำนวนเงิน`);
      }
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        errors.push(`รายการที่ ${index + 1}: ไม่สามารถมีทั้งเดบิตและเครดิตในรายการเดียวกัน`);
      }
    });
  }

  return errors;
}

export function validateAccount(account: Partial<Account>): string[] {
  const errors: string[] = [];

  if (!account.code?.trim()) {
    errors.push('กรุณาระบุรหัสบัญชี');
  }

  if (!account.name?.trim()) {
    errors.push('กรุณาระบุชื่อบัญชี');
  }

  if (!account.type) {
    errors.push('กรุณาเลือกประเภทบัญชี');
  }

  if (!account.category) {
    errors.push('กรุณาเลือกหมวดหมู่บัญชี');
  }

  return errors;
}

// Export functions
export function exportAccountsToCSV(accounts: Account[]): string {
  const headers = ['รหัสบัญชี', 'ชื่อบัญชี', 'ประเภท', 'หมวดหมู่', 'ยอดคงเหลือ', 'สถานะ', 'คำอธิบาย'];
  
  const rows = accounts.map(account => [
    account.code,
    account.name,
    accountTypeLabels[account.type],
    accountCategoryLabels[account.category],
    formatCurrency(account.balance),
    account.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน',
    account.description || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportJournalEntriesToCSV(entries: JournalEntry[]): string {
  const headers = ['เลขที่รายการ', 'วันที่', 'คำอธิบาย', 'อ้างอิง', 'เดบิต', 'เครดิต', 'สถานะ', 'ผู้สร้าง', 'ผู้อนุมัติ'];
  
  const rows = entries.map(entry => [
    entry.entryNumber,
    formatDate(entry.date),
    entry.description,
    entry.reference || '',
    formatCurrency(entry.totalDebit),
    formatCurrency(entry.totalCredit),
    journalEntryStatusLabels[entry.status],
    entry.createdBy,
    entry.approvedBy || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ['วันที่', 'ประเภท', 'จำนวนเงิน', 'คำอธิบาย', 'อ้างอิง', 'โมดูล', 'สถานะ'];
  
  const rows = transactions.map(transaction => [
    formatDate(transaction.date),
    transactionTypeLabels[transaction.type],
    formatCurrency(transaction.amount),
    transaction.description,
    transaction.reference || '',
    transaction.sourceModule,
    transactionStatusLabels[transaction.status]
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Financial calculations
export function calculateAccountBalance(account: Account, entries: JournalEntry[]): number {
  let balance = 0;

  entries.forEach(entry => {
    if (entry.status === 'approved') {
      entry.entries.forEach(line => {
        if (line.accountId === account.id) {
          if (account.type === 'asset' || account.type === 'expense') {
            balance += line.debitAmount - line.creditAmount;
          } else {
            balance += line.creditAmount - line.debitAmount;
          }
        }
      });
    }
  });

  return balance;
}

export function generateAccountCode(accounts: Account[], type: AccountType): string {
  const typePrefix = {
    asset: '1',
    liability: '2',
    equity: '3',
    revenue: '4',
    expense: '5'
  };

  const existingCodes = accounts
    .filter(acc => acc.type === type)
    .map(acc => parseInt(acc.code))
    .filter(code => !isNaN(code))
    .sort((a, b) => b - a);

  const baseCode = parseInt(typePrefix[type] + '000');
  const nextCode = existingCodes.length > 0 ? existingCodes[0] + 100 : baseCode;

  return nextCode.toString();
}

// Chart of accounts helpers
export function buildAccountHierarchy(accounts: Account[]): Account[] {
  const accountMap = new Map<string, Account & { children?: Account[] }>();
  const rootAccounts: (Account & { children?: Account[] })[] = [];

  // Create map of all accounts
  accounts.forEach(account => {
    accountMap.set(account.id, { ...account, children: [] });
  });

  // Build hierarchy
  accounts.forEach(account => {
    const accountWithChildren = accountMap.get(account.id)!;
    
    if (account.parentId) {
      const parent = accountMap.get(account.parentId);
      if (parent) {
        parent.children!.push(accountWithChildren);
      } else {
        rootAccounts.push(accountWithChildren);
      }
    } else {
      rootAccounts.push(accountWithChildren);
    }
  });

  return rootAccounts;
}

// Report helpers
export function generateTrialBalance(accounts: Account[]) {
  const assetAccounts = accounts.filter(acc => acc.type === 'asset');
  const liabilityAccounts = accounts.filter(acc => acc.type === 'liability');
  const equityAccounts = accounts.filter(acc => acc.type === 'equity');
  const revenueAccounts = accounts.filter(acc => acc.type === 'revenue');
  const expenseAccounts = accounts.filter(acc => acc.type === 'expense');

  return {
    assets: assetAccounts,
    liabilities: liabilityAccounts,
    equity: equityAccounts,
    revenues: revenueAccounts,
    expenses: expenseAccounts,
    totalAssets: assetAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    totalLiabilities: liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    totalEquity: equityAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    totalRevenues: revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    totalExpenses: expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  };
}