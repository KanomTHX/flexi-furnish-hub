// Constants to replace mock data
export const paymentMethods = [
  { id: 'cash', name: 'เงินสด', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'บัตรเครดิต/เดบิต', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'โอนเงินผ่านธนาคาร', type: 'transfer' as const, icon: '🏦' }
];

export const allPaymentMethods = [
  { id: 'cash', name: 'เงินสด', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'บัตรเครดิต/เดบิต', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'โอนเงินผ่านธนาคาร', type: 'transfer' as const, icon: '🏦' },
  { id: 'installment', name: 'ผ่อนชำระ', type: 'installment' as const, icon: '📅' }
];

export const installmentPlans = [
  {
    id: 'plan-3m-0',
    name: 'ผ่อน 3 เดือน (ไม่มีดอกเบี้ย)',
    months: 3,
    interestRate: 0,
    downPaymentPercent: 30,
    processingFee: 500,
    description: 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย เงินดาวน์ 30%',
    isActive: true
  },
  {
    id: 'plan-6m-5',
    name: 'ผ่อน 6 เดือน (ดอกเบี้ย 5%)',
    months: 6,
    interestRate: 5,
    downPaymentPercent: 20,
    processingFee: 800,
    description: 'ผ่อนชำระ 6 งวด ดอกเบี้ย 5% ต่อปี เงินดาวน์ 20%',
    isActive: true
  }
];

export function getActiveInstallmentPlans() {
  return installmentPlans.filter(plan => plan.isActive);
}