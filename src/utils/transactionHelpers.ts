import { Transaction, TransactionType, Account } from '@/types/accounting';

// Helper functions for transaction management

export interface AutoTransactionConfig {
  sourceModule: string;
  sourceId: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference?: string;
  date?: string;
}

// Create transaction from POS sale
export function createSaleTransaction(saleData: {
  saleId: string;
  amount: number;
  customerName?: string;
  invoiceNumber: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'sale',
    date: saleData.date || new Date().toISOString().split('T')[0],
    amount: saleData.amount,
    description: `ขายสินค้า${saleData.customerName ? ` - ${saleData.customerName}` : ''}`,
    reference: saleData.invoiceNumber,
    sourceModule: 'pos',
    sourceId: saleData.saleId,
    status: 'processed'
  };
}

// Create transaction from inventory purchase
export function createPurchaseTransaction(purchaseData: {
  purchaseId: string;
  amount: number;
  supplierName?: string;
  purchaseOrderNumber: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'purchase',
    date: purchaseData.date || new Date().toISOString().split('T')[0],
    amount: purchaseData.amount,
    description: `ซื้อสินค้า${purchaseData.supplierName ? ` - ${purchaseData.supplierName}` : ''}`,
    reference: purchaseData.purchaseOrderNumber,
    sourceModule: 'inventory',
    sourceId: purchaseData.purchaseId,
    status: 'processed'
  };
}

// Create transaction from payment
export function createPaymentTransaction(paymentData: {
  paymentId: string;
  amount: number;
  payeeName?: string;
  paymentType: 'salary' | 'rent' | 'utilities' | 'supplies' | 'other';
  reference?: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  const descriptions = {
    salary: 'จ่ายเงินเดือนพนักงาน',
    rent: 'จ่ายค่าเช่า',
    utilities: 'จ่ายค่าสาธารณูปโภค',
    supplies: 'จ่ายค่าวัสดุสำนักงาน',
    other: 'จ่ายค่าใช้จ่ายอื่น'
  };

  return {
    type: 'payment',
    date: paymentData.date || new Date().toISOString().split('T')[0],
    amount: paymentData.amount,
    description: `${descriptions[paymentData.paymentType]}${paymentData.payeeName ? ` - ${paymentData.payeeName}` : ''}`,
    reference: paymentData.reference || `PAY-${Date.now()}`,
    sourceModule: 'accounting',
    sourceId: paymentData.paymentId,
    status: 'pending'
  };
}

// Create transaction from customer payment receipt
export function createReceiptTransaction(receiptData: {
  receiptId: string;
  amount: number;
  customerName?: string;
  receiptNumber: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'receipt',
    date: receiptData.date || new Date().toISOString().split('T')[0],
    amount: receiptData.amount,
    description: `รับชำระหนี้${receiptData.customerName ? ` - ${receiptData.customerName}` : ''}`,
    reference: receiptData.receiptNumber,
    sourceModule: 'pos',
    sourceId: receiptData.receiptId,
    status: 'processed'
  };
}

// Create transaction from inventory adjustment
export function createAdjustmentTransaction(adjustmentData: {
  adjustmentId: string;
  amount: number;
  adjustmentType: 'increase' | 'decrease';
  reason: string;
  reference?: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'adjustment',
    date: adjustmentData.date || new Date().toISOString().split('T')[0],
    amount: adjustmentData.amount,
    description: `ปรับปรุงสินค้าคงเหลือ (${adjustmentData.adjustmentType === 'increase' ? 'เพิ่ม' : 'ลด'}) - ${adjustmentData.reason}`,
    reference: adjustmentData.reference || `ADJ-${Date.now()}`,
    sourceModule: 'inventory',
    sourceId: adjustmentData.adjustmentId,
    status: 'pending'
  };
}

// Create transaction from branch transfer
export function createTransferTransaction(transferData: {
  transferId: string;
  amount: number;
  fromBranch: string;
  toBranch: string;
  transferType: 'cash' | 'inventory';
  reference?: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'transfer',
    date: transferData.date || new Date().toISOString().split('T')[0],
    amount: transferData.amount,
    description: `โอน${transferData.transferType === 'cash' ? 'เงิน' : 'สินค้า'}จาก ${transferData.fromBranch} ไป ${transferData.toBranch}`,
    reference: transferData.reference || `TRF-${Date.now()}`,
    sourceModule: 'warehouse',
    sourceId: transferData.transferId,
    status: 'pending'
  };
}

// Create transaction from installment payment
export function createInstallmentTransaction(installmentData: {
  installmentId: string;
  amount: number;
  customerName: string;
  installmentNumber: number;
  totalInstallments: number;
  reference?: string;
  date?: string;
}): Omit<Transaction, 'id' | 'createdAt'> {
  return {
    type: 'receipt',
    date: installmentData.date || new Date().toISOString().split('T')[0],
    amount: installmentData.amount,
    description: `รับชำระผ่อน งวดที่ ${installmentData.installmentNumber}/${installmentData.totalInstallments} - ${installmentData.customerName}`,
    reference: installmentData.reference || `INST-${Date.now()}`,
    sourceModule: 'installments',
    sourceId: installmentData.installmentId,
    status: 'processed'
  };
}

// Auto-determine journal entry accounts based on transaction
export function getAutoJournalAccounts(
  transaction: Transaction, 
  accounts: Account[]
): { debitAccount: Account | null; creditAccount: Account | null } {
  let debitAccount: Account | null = null;
  let creditAccount: Account | null = null;

  switch (transaction.type) {
    case 'sale':
      // Dr. Cash/Accounts Receivable, Cr. Sales Revenue
      debitAccount = accounts.find(acc => acc.code === '1000') || null; // Cash
      creditAccount = accounts.find(acc => acc.code === '4000') || null; // Sales Revenue
      break;

    case 'purchase':
      // Dr. Inventory/Expense, Cr. Cash/Accounts Payable
      debitAccount = accounts.find(acc => acc.code === '1200') || null; // Inventory
      creditAccount = accounts.find(acc => acc.code === '2000') || null; // Accounts Payable
      break;

    case 'payment':
      // Determine expense account based on description
      if (transaction.description.includes('เงินเดือน')) {
        debitAccount = accounts.find(acc => acc.code === '6200') || null; // Salary Expense
      } else if (transaction.description.includes('ค่าเช่า')) {
        debitAccount = accounts.find(acc => acc.code === '6000') || null; // Rent Expense
      } else if (transaction.description.includes('ไฟฟ้า')) {
        debitAccount = accounts.find(acc => acc.code === '6100') || null; // Utilities Expense
      } else {
        debitAccount = accounts.find(acc => acc.type === 'expense') || null; // Default expense
      }
      creditAccount = accounts.find(acc => acc.code === '1000') || null; // Cash
      break;

    case 'receipt':
      // Dr. Cash, Cr. Accounts Receivable
      debitAccount = accounts.find(acc => acc.code === '1000') || null; // Cash
      creditAccount = accounts.find(acc => acc.code === '1100') || null; // Accounts Receivable
      break;

    case 'adjustment':
      // Dr./Cr. based on context - default to inventory adjustment
      debitAccount = accounts.find(acc => acc.code === '1200') || null; // Inventory
      creditAccount = accounts.find(acc => acc.code === '5000') || null; // Cost of Goods Sold
      break;

    case 'transfer':
      // Dr. Cash (destination), Cr. Cash (source) - same account for simplicity
      debitAccount = accounts.find(acc => acc.code === '1000') || null; // Cash
      creditAccount = accounts.find(acc => acc.code === '1000') || null; // Cash
      break;
  }

  return { debitAccount, creditAccount };
}

// Validate transaction data
export function validateTransactionData(transaction: Partial<Transaction>): string[] {
  const errors: string[] = [];

  if (!transaction.type) {
    errors.push('กรุณาระบุประเภทธุรกรรม');
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push('กรุณาระบุจำนวนเงินที่ถูกต้อง');
  }

  if (!transaction.description?.trim()) {
    errors.push('กรุณาระบุรายละเอียดธุรกรรม');
  }

  if (!transaction.date) {
    errors.push('กรุณาระบุวันที่ธุรกรรม');
  }

  if (!transaction.sourceModule) {
    errors.push('กรุณาระบุโมดูลต้นทาง');
  }

  if (!transaction.sourceId) {
    errors.push('กรุณาระบุรหัสอ้างอิงต้นทาง');
  }

  return errors;
}

// Format transaction for display
export function formatTransactionDisplay(transaction: Transaction): {
  typeLabel: string;
  statusLabel: string;
  amountDisplay: string;
  dateDisplay: string;
  moduleLabel: string;
} {
  const typeLabels = {
    sale: 'การขาย',
    purchase: 'การซื้อ',
    payment: 'การจ่าย',
    receipt: 'การรับ',
    adjustment: 'ปรับปรุง',
    transfer: 'โอนย้าย'
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    processed: 'ดำเนินการแล้ว',
    cancelled: 'ยกเลิก'
  };

  const moduleLabels = {
    pos: 'ระบบขาย (POS)',
    inventory: 'ระบบคลังสินค้า',
    accounting: 'ระบบบัญชี',
    warehouse: 'ระบบคลัง',
    claims: 'ระบบเคลม',
    installments: 'ระบบผ่อนชำระ'
  };

  return {
    typeLabel: typeLabels[transaction.type] || transaction.type,
    statusLabel: statusLabels[transaction.status] || transaction.status,
    amountDisplay: `${transaction.amount.toLocaleString()} บาท`,
    dateDisplay: new Date(transaction.date).toLocaleDateString('th-TH'),
    moduleLabel: moduleLabels[transaction.sourceModule as keyof typeof moduleLabels] || transaction.sourceModule
  };
}

// Export transaction data to CSV
export function exportTransactionToCSV(transactions: Transaction[]): string {
  const headers = [
    'วันที่',
    'ประเภท',
    'รายละเอียด',
    'จำนวนเงิน',
    'เลขที่อ้างอิง',
    'โมดูลต้นทาง',
    'รหัสต้นทาง',
    'สถานะ',
    'วันที่สร้าง'
  ];

  const rows = transactions.map(transaction => {
    const formatted = formatTransactionDisplay(transaction);
    return [
      formatted.dateDisplay,
      formatted.typeLabel,
      transaction.description,
      transaction.amount.toString(),
      transaction.reference || '',
      formatted.moduleLabel,
      transaction.sourceId,
      formatted.statusLabel,
      new Date(transaction.createdAt).toLocaleString('th-TH')
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

// Calculate transaction statistics
export function calculateTransactionStats(transactions: Transaction[]) {
  const total = transactions.length;
  const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  
  const byType = transactions.reduce((acc, txn) => {
    acc[txn.type] = (acc[txn.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = transactions.reduce((acc, txn) => {
    acc[txn.status] = (acc[txn.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byModule = transactions.reduce((acc, txn) => {
    acc[txn.sourceModule] = (acc[txn.sourceModule] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const income = transactions
    .filter(txn => txn.type === 'sale' || txn.type === 'receipt')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const expense = transactions
    .filter(txn => txn.type === 'purchase' || txn.type === 'payment')
    .reduce((sum, txn) => sum + txn.amount, 0);

  return {
    total,
    totalAmount,
    income,
    expense,
    netAmount: income - expense,
    averageAmount: total > 0 ? totalAmount / total : 0,
    byType,
    byStatus,
    byModule
  };
}