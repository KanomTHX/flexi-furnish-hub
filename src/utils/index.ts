// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Placeholder utility functions
export const accountingHelpers = {};
export const auditHelpers = {};
export const claimsHelpers = {};
export const exportHelpers = {};
export const installmentHelpers = {
  calculateMonthlyPayment: (amount: number, rate: number, months: number) => amount / months,
  calculateTotalInterest: (amount: number, payment: number, months: number) => 0
};
export const posHelpers = {};
export const reportHelpers = {};
export const settingsHelpers = {};
export const warehouseHelpers = {};

export const testConnection = () => Promise.resolve({ success: true });
export const supabaseAdmin = {};
export const supabaseTableCreator = {};
export const envCheck = {};
export const checkPosSystem = {};

export default {
  accountingHelpers,
  auditHelpers,
  claimsHelpers,
  exportHelpers,
  installmentHelpers,
  posHelpers,
  reportHelpers,
  settingsHelpers,
  warehouseHelpers,
  testConnection,
  supabaseAdmin,
  supabaseTableCreator,
  envCheck,
  checkPosSystem
};