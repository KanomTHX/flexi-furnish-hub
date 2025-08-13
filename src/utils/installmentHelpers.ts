// Installment helpers
export const calculateMonthlyPayment = (amount: number, rate: number, months: number) => {
  if (rate === 0) return amount / months;
  const monthlyRate = rate / 100 / 12;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

export const calculateTotalInterest = (principal: number, monthlyPayment: number, months: number) => {
  return (monthlyPayment * months) - principal;
};

export const createInstallmentContract = async (data: any) => {
  return { id: 'mock-id', ...data };
};

export const checkInstallmentEligibility = async (customer: any, amount: number) => {
  return {
    eligible: true,
    maxAmount: amount * 2,
    reasons: []
  };
};

export const calculateContractStatus = (contract: any) => ({
  status: 'active',
  paidInstallments: 0,
  remainingBalance: contract?.totalAmount || 0,
  overduePayments: 0
});
export const getContractStatusText = (status: string) => status;
export const getPaymentStatusText = (status: string) => status;
export const exportContractsToCSV = (contracts: any[]) => 'contract1,contract2,contract3';
export const updatePaymentStatus = (paymentId: string, status: string) => Promise.resolve();
export const calculateLateFee = (payment: any, daysPastDue: number = 0) => daysPastDue * 10;

export default { 
  calculateMonthlyPayment, 
  calculateTotalInterest,
  createInstallmentContract,
  checkInstallmentEligibility,
  calculateContractStatus,
  getContractStatusText,
  getPaymentStatusText,
  exportContractsToCSV,
  updatePaymentStatus,
  calculateLateFee
};