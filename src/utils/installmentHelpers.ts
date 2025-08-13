// Installment helpers
export const calculateMonthlyPayment = (amount: number, rate: number, months: number) => {
  if (rate === 0) return amount / months;
  const monthlyRate = rate / 100 / 12;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

export const calculateTotalInterest = (principal: number, monthlyPayment: number, months: number) => {
  return (monthlyPayment * months) - principal;
};

export const createInstallmentContract = (data: any) => Promise.resolve({ id: 'mock-id', ...data });

export const checkInstallmentEligibility = (customer: any, amount: number) => {
  return Promise.resolve({
    eligible: true,
    maxAmount: amount * 2,
    reasons: []
  });
};

export default { 
  calculateMonthlyPayment, 
  calculateTotalInterest,
  createInstallmentContract,
  checkInstallmentEligibility
};