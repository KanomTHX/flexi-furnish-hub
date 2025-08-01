import { 
  Account, 
  JournalEntry, 
  Transaction, 
  AccountingSummary,
  AccountType,
  AccountCategory,
  JournalEntryStatus,
  TransactionType,
  TransactionStatus
} from '@/types/accounting';

// Mock Chart of Accounts
export const mockAccounts: Account[] = [
  // Assets
  {
    id: 'acc-001',
    code: '1000',
    name: 'เงินสด',
    type: 'asset',
    category: 'current_asset',
    balance: 150000,
    isActive: true,
    description: 'เงินสดในมือและเงินฝากธนาคาร',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-002',
    code: '1100',
    name: 'ลูกหนี้การค้า',
    type: 'asset',
    category: 'current_asset',
    balance: 85000,
    isActive: true,
    description: 'ลูกหนี้จากการขายสินค้าเครดิต',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-003',
    code: '1200',
    name: 'สินค้าคงเหลือ',
    type: 'asset',
    category: 'current_asset',
    balance: 320000,
    isActive: true,
    description: 'มูลค่าสินค้าคงเหลือในคลัง',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-004',
    code: '1500',
    name: 'อุปกรณ์และเครื่องใช้สำนักงาน',
    type: 'asset',
    category: 'fixed_asset',
    balance: 45000,
    isActive: true,
    description: 'อุปกรณ์สำนักงานและเครื่องใช้ต่างๆ',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-005',
    code: '1600',
    name: 'ยานพาหนะ',
    type: 'asset',
    category: 'fixed_asset',
    balance: 280000,
    isActive: true,
    description: 'รถยนต์และยานพาหนะสำหรับการขนส่ง',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },

  // Liabilities
  {
    id: 'acc-006',
    code: '2000',
    name: 'เจ้าหนี้การค้า',
    type: 'liability',
    category: 'current_liability',
    balance: 65000,
    isActive: true,
    description: 'เจ้าหนี้จากการซื้อสินค้าเครดิต',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-007',
    code: '2100',
    name: 'ภาษีขายที่ต้องชำระ',
    type: 'liability',
    category: 'current_liability',
    balance: 12000,
    isActive: true,
    description: 'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-008',
    code: '2200',
    name: 'เงินเดือนค้างจ่าย',
    type: 'liability',
    category: 'current_liability',
    balance: 28000,
    isActive: true,
    description: 'เงินเดือนพนักงานที่ค้างจ่าย',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },

  // Equity
  {
    id: 'acc-009',
    code: '3000',
    name: 'ทุนจดทะเบียน',
    type: 'equity',
    category: 'owner_equity',
    balance: 500000,
    isActive: true,
    description: 'ทุนจดทะเบียนของบริษัท',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-010',
    code: '3100',
    name: 'กำไรสะสม',
    type: 'equity',
    category: 'retained_earnings',
    balance: 195000,
    isActive: true,
    description: 'กำไรสะสมจากการดำเนินงาน',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },

  // Revenue
  {
    id: 'acc-011',
    code: '4000',
    name: 'รายได้จากการขาย',
    type: 'revenue',
    category: 'sales_revenue',
    balance: 450000,
    isActive: true,
    description: 'รายได้จากการขายสินค้า',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-012',
    code: '4100',
    name: 'รายได้อื่น',
    type: 'revenue',
    category: 'other_revenue',
    balance: 15000,
    isActive: true,
    description: 'รายได้จากแหล่งอื่นๆ',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },

  // Expenses
  {
    id: 'acc-013',
    code: '5000',
    name: 'ต้นทุนขาย',
    type: 'expense',
    category: 'cost_of_goods_sold',
    balance: 270000,
    isActive: true,
    description: 'ต้นทุนสินค้าที่ขาย',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-014',
    code: '6000',
    name: 'ค่าเช่า',
    type: 'expense',
    category: 'operating_expense',
    balance: 24000,
    isActive: true,
    description: 'ค่าเช่าสำนักงานและคลังสินค้า',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-015',
    code: '6100',
    name: 'ค่าไฟฟ้า',
    type: 'expense',
    category: 'operating_expense',
    balance: 8500,
    isActive: true,
    description: 'ค่าไฟฟ้าและสาธารณูปโภค',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc-016',
    code: '6200',
    name: 'เงินเดือนพนักงาน',
    type: 'expense',
    category: 'operating_expense',
    balance: 85000,
    isActive: true,
    description: 'เงินเดือนและค่าแรงพนักงาน',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
];

// Mock Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'je-001',
    entryNumber: 'JE-2024-001',
    date: '2024-01-15',
    description: 'บันทึกการขายสินค้าเงินสด',
    reference: 'INV-2024-001',
    totalDebit: 15000,
    totalCredit: 15000,
    status: 'approved',
    createdBy: 'user-001',
    approvedBy: 'manager-001',
    approvedAt: '2024-01-15T14:30:00Z',
    entries: [
      {
        id: 'jel-001',
        accountId: 'acc-001',
        account: mockAccounts[0],
        description: 'รับเงินสดจากการขาย',
        debitAmount: 15000,
        creditAmount: 0,
        reference: 'INV-2024-001'
      },
      {
        id: 'jel-002',
        accountId: 'acc-011',
        account: mockAccounts[10],
        description: 'รายได้จากการขายสินค้า',
        debitAmount: 0,
        creditAmount: 15000,
        reference: 'INV-2024-001'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: 'je-002',
    entryNumber: 'JE-2024-002',
    date: '2024-01-16',
    description: 'บันทึกการซื้อสินค้าเครดิต',
    reference: 'PO-2024-001',
    totalDebit: 25000,
    totalCredit: 25000,
    status: 'approved',
    createdBy: 'user-002',
    approvedBy: 'manager-001',
    approvedAt: '2024-01-16T16:00:00Z',
    entries: [
      {
        id: 'jel-003',
        accountId: 'acc-003',
        account: mockAccounts[2],
        description: 'ซื้อสินค้าเข้าคลัง',
        debitAmount: 25000,
        creditAmount: 0,
        reference: 'PO-2024-001'
      },
      {
        id: 'jel-004',
        accountId: 'acc-006',
        account: mockAccounts[5],
        description: 'เจ้าหนี้การค้า',
        debitAmount: 0,
        creditAmount: 25000,
        reference: 'PO-2024-001'
      }
    ],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T16:00:00Z'
  },
  {
    id: 'je-003',
    entryNumber: 'JE-2024-003',
    date: '2024-01-17',
    description: 'จ่ายค่าเช่าประจำเดือน',
    reference: 'RENT-2024-01',
    totalDebit: 12000,
    totalCredit: 12000,
    status: 'pending',
    createdBy: 'user-003',
    entries: [
      {
        id: 'jel-005',
        accountId: 'acc-014',
        account: mockAccounts[13],
        description: 'ค่าเช่าประจำเดือน มกราคม',
        debitAmount: 12000,
        creditAmount: 0,
        reference: 'RENT-2024-01'
      },
      {
        id: 'jel-006',
        accountId: 'acc-001',
        account: mockAccounts[0],
        description: 'จ่ายเงินสดค่าเช่า',
        debitAmount: 0,
        creditAmount: 12000,
        reference: 'RENT-2024-01'
      }
    ],
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-17T11:00:00Z'
  }
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    type: 'sale',
    date: '2024-01-15',
    amount: 15000,
    description: 'ขายสินค้าเงินสด - ใบกำกับภาษี INV-2024-001',
    reference: 'INV-2024-001',
    sourceModule: 'pos',
    sourceId: 'sale-001',
    journalEntryId: 'je-001',
    status: 'processed',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'txn-002',
    type: 'purchase',
    date: '2024-01-16',
    amount: 25000,
    description: 'ซื้อสินค้าเครดิต - ใบสั่งซื้อ PO-2024-001',
    reference: 'PO-2024-001',
    sourceModule: 'inventory',
    sourceId: 'purchase-001',
    journalEntryId: 'je-002',
    status: 'processed',
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    id: 'txn-003',
    type: 'payment',
    date: '2024-01-17',
    amount: 12000,
    description: 'จ่ายค่าเช่าประจำเดือน มกราคม 2024',
    reference: 'RENT-2024-01',
    sourceModule: 'accounting',
    sourceId: 'expense-001',
    journalEntryId: 'je-003',
    status: 'pending',
    createdAt: '2024-01-17T11:00:00Z'
  },
  {
    id: 'txn-004',
    type: 'receipt',
    date: '2024-01-18',
    amount: 8500,
    description: 'รับชำระหนี้จากลูกค้า',
    reference: 'RCP-2024-001',
    sourceModule: 'pos',
    sourceId: 'payment-001',
    status: 'pending',
    createdAt: '2024-01-18T14:00:00Z'
  }
];

// Calculate accounting summary
export function calculateAccountingSummary(): AccountingSummary {
  const assets = mockAccounts.filter(acc => acc.type === 'asset');
  const liabilities = mockAccounts.filter(acc => acc.type === 'liability');
  const equity = mockAccounts.filter(acc => acc.type === 'equity');
  const revenues = mockAccounts.filter(acc => acc.type === 'revenue');
  const expenses = mockAccounts.filter(acc => acc.type === 'expense');

  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);
  const totalRevenues = revenues.reduce((sum, acc) => sum + acc.balance, 0);
  const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);

  const pendingEntries = mockJournalEntries.filter(je => je.status === 'pending').length;
  const recentTransactions = mockTransactions.filter(txn => {
    const txnDate = new Date(txn.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return txnDate >= weekAgo;
  }).length;

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenues,
    totalExpenses,
    netIncome: totalRevenues - totalExpenses,
    pendingEntries,
    recentTransactions,
    accountsCount: mockAccounts.length
  };
}