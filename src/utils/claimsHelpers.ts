// Claims helpers placeholder
export const calculateClaimAmount = (claim: any) => 0;
export const validateClaim = (claim: any) => true;
export const formatCurrency = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('th-TH');
export const exportClaimsToCSV = (claims: any[]) => 'claims,data';
export const exportCustomersToCSV = (customers: any[]) => 'customers,data';
export const exportProductsToCSV = (products: any[]) => 'products,data';

export const claimStatusLabels = {
  pending: 'รอดำเนินการ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  completed: 'เสร็จสิ้น'
};

export const claimPriorityLabels = {
  high: 'สูง',
  medium: 'ปานกลาง',
  low: 'ต่ำ'
};

export const claimTypeLabels = {
  warranty: 'การรับประกัน',
  return: 'การคืนสินค้า',
  exchange: 'การแลกเปลี่ยน',
  repair: 'การซ่อม'
};

export default { 
  calculateClaimAmount, 
  validateClaim,
  formatCurrency,
  formatDate,
  claimStatusLabels,
  claimPriorityLabels,
  claimTypeLabels
};