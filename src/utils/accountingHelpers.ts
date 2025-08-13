// Accounting helpers placeholder
export const calculateTaxAmount = (amount: number, rate: number) => amount * rate;
export const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const validateAccountingEntry = (entry: any) => true;
export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('th-TH');

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