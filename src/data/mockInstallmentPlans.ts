import { InstallmentPlan } from '../types/pos';

export const mockInstallmentPlans: InstallmentPlan[] = [
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
  },
  {
    id: 'plan-12m-8',
    name: 'ผ่อน 12 เดือน (ดอกเบี้ย 8%)',
    months: 12,
    interestRate: 8,
    downPaymentPercent: 15,
    processingFee: 1200,
    description: 'ผ่อนชำระ 12 งวด ดอกเบี้ย 8% ต่อปี เงินดาวน์ 15%',
    isActive: true
  },
  {
    id: 'plan-18m-10',
    name: 'ผ่อน 18 เดือน (ดอกเบี้ย 10%)',
    months: 18,
    interestRate: 10,
    downPaymentPercent: 10,
    processingFee: 1500,
    description: 'ผ่อนชำระ 18 งวด ดอกเบี้ย 10% ต่อปี เงินดาวน์ 10%',
    isActive: true
  },
  {
    id: 'plan-24m-12',
    name: 'ผ่อน 24 เดือน (ดอกเบี้ย 12%)',
    months: 24,
    interestRate: 12,
    downPaymentPercent: 10,
    processingFee: 2000,
    description: 'ผ่อนชำระ 24 งวด ดอกเบี้ย 12% ต่อปี เงินดาวน์ 10%',
    isActive: true
  },
  {
    id: 'plan-36m-15',
    name: 'ผ่อน 36 เดือน (ดอกเบี้ย 15%)',
    months: 36,
    interestRate: 15,
    downPaymentPercent: 5,
    processingFee: 2500,
    description: 'ผ่อนชำระ 36 งวด ดอกเบี้ย 15% ต่อปี เงินดาวน์ 5%',
    isActive: true
  },
  {
    id: 'plan-vip-0',
    name: 'แพ็คเกจ VIP (ไม่มีดอกเบี้ย)',
    months: 12,
    interestRate: 0,
    downPaymentPercent: 50,
    processingFee: 0,
    description: 'สำหรับลูกค้า VIP ผ่อน 12 งวด ไม่มีดอกเบี้ย เงินดาวน์ 50%',
    isActive: true
  },
  {
    id: 'plan-student-3',
    name: 'แพ็คเกจนักเรียน/นักศึกษา',
    months: 6,
    interestRate: 3,
    downPaymentPercent: 25,
    processingFee: 300,
    description: 'สำหรับนักเรียน/นักศึกษา ผ่อน 6 งวด ดอกเบี้ย 3% ต่อปี',
    isActive: true
  }
];

// ฟังก์ชันช่วยในการค้นหาแผนผ่อน
export function getInstallmentPlanById(id: string): InstallmentPlan | undefined {
  return mockInstallmentPlans.find(plan => plan.id === id);
}

export function getActiveInstallmentPlans(): InstallmentPlan[] {
  return mockInstallmentPlans.filter(plan => plan.isActive);
}

export function getInstallmentPlansByMonths(months: number): InstallmentPlan[] {
  return mockInstallmentPlans.filter(plan => plan.months === months && plan.isActive);
}

export function getInstallmentPlansByMaxInterest(maxRate: number): InstallmentPlan[] {
  return mockInstallmentPlans.filter(plan => plan.interestRate <= maxRate && plan.isActive);
}