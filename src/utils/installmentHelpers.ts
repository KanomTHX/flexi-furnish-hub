// ===================================================================
// INSTALLMENT HELPER FUNCTIONS
// ฟังก์ชันช่วยเหลือสำหรับระบบผ่อนชำระ - อัปเดตให้ตรงกับฐานข้อมูล
// ===================================================================

import { Customer, InstallmentPlan, InstallmentContract, EligibilityCheck } from '@/types/installments';

/**
 * ตรวจสอบสิทธิ์การผ่อนชำระ
 */
export function checkInstallmentEligibility(
  customer: Customer,
  amount: number
): EligibilityCheck {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let requiresGuarantor = false;
  let maxLoanAmount = 0;

  // ตรวจสอบข้อมูลพื้นฐาน
  if (!customer.name?.trim()) {
    reasons.push('กรุณากรอกชื่อ-นามสกุล');
  }

  if (!customer.idCard?.trim()) {
    reasons.push('กรุณากรอกเลขบัตรประชาชน');
  }

  if (!customer.phone?.trim()) {
    reasons.push('กรุณากรอกเบอร์โทรศัพท์');
  }

  if (!customer.address?.trim()) {
    reasons.push('กรุณากรอกที่อยู่');
  }

  if (!customer.occupation?.trim()) {
    reasons.push('กรุณากรอกอาชีพ');
  }

  if (!customer.monthlyIncome || customer.monthlyIncome <= 0) {
    reasons.push('กรุณากรอกรายได้ต่อเดือน');
  }

  // ตรวจสอบรายได้
  if (customer.monthlyIncome) {
    maxLoanAmount = customer.monthlyIncome * 20; // 20 เท่าของรายได้

    if (customer.monthlyIncome < 15000) {
      // ไม่ใส่ใน reasons เพื่อให้สร้างสัญญาได้ แต่จะต้องมีผู้ค้ำประกัน
      riskLevel = 'high';
    } else if (customer.monthlyIncome < 25000) {
      riskLevel = 'medium';
    }

    // ตรวจสอบอัตราส่วนหนี้ต่อรายได้
    const estimatedMonthlyPayment = amount * 0.05; // ประมาณ 5%
    const debtToIncomeRatio = estimatedMonthlyPayment / customer.monthlyIncome;

    if (debtToIncomeRatio > 0.4) {
      reasons.push('อัตราส่วนหนี้ต่อรายได้สูงเกินไป (ไม่ควรเกิน 40%)');
      riskLevel = 'high';
    } else if (debtToIncomeRatio > 0.3) {
      riskLevel = 'medium';
    }
  }

  // ตรวจสอบยอดเงิน
  if (amount < 1000) {
    reasons.push('ยอดเงินขั้นต่ำ 1,000 บาท');
  }

  if (amount > maxLoanAmount) {
    reasons.push(`ยอดเงินสูงเกินไป (สูงสุด ${maxLoanAmount.toLocaleString()} บาท)`);
  }

  // กำหนดว่าต้องมีผู้ค้ำประกันหรือไม่
  if (amount > 100000 || riskLevel === 'high' || customer.monthlyIncome < 15000) {
    requiresGuarantor = true;
  }

  // แนะนำแผนที่เหมาะสม
  const recommendedPlans: string[] = [];
  if (riskLevel === 'low') {
    recommendedPlans.push('PLAN003', 'PLAN006', 'PLAN012');
    if (amount > 50000) {
      recommendedPlans.push('PLAN024', 'PLAN036');
    }
  } else if (riskLevel === 'medium') {
    recommendedPlans.push('PLAN003', 'PLAN006');
    if (requiresGuarantor) {
      recommendedPlans.push('PLAN024');
    }
  } else {
    if (requiresGuarantor) {
      recommendedPlans.push('PLAN024');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    riskLevel,
    recommendedPlans,
    requiresGuarantor,
    maxLoanAmount
  };
}

/**
 * คำนวณค่างวดรายเดือน
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  months: number
): number {
  if (annualInterestRate === 0) {
    return Math.round((principal / months) * 100) / 100;
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * คำนวณดอกเบี้ยรวม
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  months: number
): number {
  const totalPayments = monthlyPayment * months;
  return Math.round((totalPayments - principal) * 100) / 100;
}

/**
 * คำนวณยอดคงเหลือ
 */
export function calculateRemainingBalance(
  principal: number,
  monthlyPayment: number,
  annualInterestRate: number,
  paymentsMade: number
): number {
  if (annualInterestRate === 0) {
    return principal - (monthlyPayment * paymentsMade);
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const remaining = principal * Math.pow(1 + monthlyRate, paymentsMade) - 
                   monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

  return Math.max(0, Math.round(remaining * 100) / 100);
}

/**
 * สร้างสัญญาผ่อนชำระ (สำหรับ backward compatibility)
 */
export function createInstallmentContract(
  saleId: string,
  customer: Customer,
  plan: InstallmentPlan,
  totalAmount: number
): InstallmentContract {
  const downPayment = Math.round(totalAmount * (plan.downPaymentPercent / 100) * 100) / 100;
  const financedAmount = totalAmount - downPayment;
  const monthlyPayment = calculateMonthlyPayment(financedAmount, plan.interestRate, plan.months);
  const totalInterest = calculateTotalInterest(financedAmount, monthlyPayment, plan.months);
  const totalPayable = financedAmount + totalInterest + plan.processingFee;

  const now = new Date();
  const firstPaymentDate = new Date(now);
  firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
  
  const lastPaymentDate = new Date(now);
  lastPaymentDate.setMonth(lastPaymentDate.getMonth() + plan.months);

  return {
    id: crypto.randomUUID(),
    contractNumber: `CONTRACT-${Date.now()}`,
    transactionId: crypto.randomUUID(),
    customerId: customer.id || crypto.randomUUID(),
    customer,
    planId: plan.id,
    plan,
    totalAmount,
    downPayment,
    financedAmount,
    remainingAmount: financedAmount,
    totalInterest,
    processingFee: plan.processingFee,
    totalPayable,
    monthlyPayment,
    contractDate: now.toISOString().split('T')[0],
    firstPaymentDate: firstPaymentDate.toISOString().split('T')[0],
    lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
    status: 'pending', // ใช้ 'pending' แทน 'draft'
    payments: [],
    paidInstallments: 0,
    remainingInstallments: plan.months,
    totalPaid: 0,
    remainingBalance: totalPayable,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    createdBy: 'system'
  };
}

/**
 * ตรวจสอบว่าแผนต้องมีผู้ค้ำประกันหรือไม่
 */
export function requiresGuarantor(
  plan: InstallmentPlan,
  customer: Customer,
  amount: number
): boolean {
  // ตรวจสอบจากแผนเอง
  if (plan.requiresGuarantor) {
    return true;
  }

  // ตรวจสอบจากยอดเงิน
  if (amount > 100000) {
    return true;
  }

  // ตรวจสอบจากระยะเวลา
  if (plan.months > 24) {
    return true;
  }

  // ตรวจสอบจากรายได้
  if (customer.monthlyIncome) {
    const monthlyPayment = calculateMonthlyPayment(
      amount - (amount * plan.downPaymentPercent / 100),
      plan.interestRate,
      plan.months
    );

    if (customer.monthlyIncome < monthlyPayment * 3) {
      return true;
    }
  }

  return false;
}

/**
 * คำนวณค่าปรับล่าช้า
 */
export function calculateLateFee(
  payment: any,
  lateFeeRate: number = 0.01 // 1% ต่อวัน
): number {
  // ถ้าชำระแล้วหรือยังไม่เกินกำหนด
  if (payment.paidDate || !isPaymentOverdue(payment.dueDate)) {
    return payment.lateFee || 0;
  }
  
  const daysLate = Math.abs(calculateDaysRemaining(payment.dueDate));
  const amount = payment.amount || payment.amount_due || 0;
  
  if (daysLate <= 0) return 0;
  
  const lateFee = amount * lateFeeRate * daysLate;
  const maxLateFee = amount * 0.1; // สูงสุด 10% ของยอดเงิน
  
  return Math.min(lateFee, maxLateFee);
}

/**
 * คำนวณค่าปรับล่าช้า (overload สำหรับการใช้งานแบบเดิม)
 */
export function calculateLateFeeByAmount(
  amount: number,
  daysLate: number,
  lateFeeRate: number = 0.01 // 1% ต่อวัน
): number {
  if (daysLate <= 0) return 0;
  
  const lateFee = amount * lateFeeRate * daysLate;
  const maxLateFee = amount * 0.1; // สูงสุด 10% ของยอดเงิน
  
  return Math.min(lateFee, maxLateFee);
}

/**
 * ตรวจสอบสถานะการชำระเงิน
 */
export function getPaymentStatus(
  dueDate: string,
  paidDate?: string,
  paidAmount?: number,
  totalAmount?: number
): 'pending' | 'paid' | 'partial' | 'overdue' {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (paidDate && paidAmount && totalAmount) {
    if (paidAmount >= totalAmount) {
      return 'paid';
    } else if (paidAmount > 0) {
      return 'partial';
    }
  }
  
  if (today > due) {
    return 'overdue';
  }
  
  return 'pending';
}

/**
 * คำนวณสถานะสัญญา
 */
export function calculateContractStatus(contract: any): {
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  overduePayments: any[];
  nextPaymentDate?: string;
  totalOverdue: number;
  paidInstallments: number;
  remainingBalance: number;
} {
  const overduePayments = contract.payments?.filter((payment: any) => {
    return isPaymentOverdue(payment.dueDate, payment.paidDate);
  }) || [];

  let status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled' = 'pending';

  // ถ้าสัญญาถูกยกเลิกแล้ว
  if (contract.status === 'cancelled') {
    status = 'cancelled';
  }
  // ถ้าชำระครบแล้ว
  else if (contract.paidInstallments >= (contract.paidInstallments + contract.remainingInstallments) ||
           contract.totalPaid >= contract.totalPayable) {
    status = 'completed';
  }
  // ถ้ามีการชำระล่าช้ามาก
  else if (overduePayments.length > 3) {
    status = 'defaulted';
  }
  // ถ้ามีการชำระแล้ว
  else if (contract.paidInstallments > 0 || contract.totalPaid > 0) {
    status = 'active';
  }

  // หาวันที่ชำระถัดไป
  const nextPayment = contract.payments?.find((payment: any) => 
    payment.status === 'pending' && !isPaymentOverdue(payment.dueDate)
  );

  const totalOverdue = overduePayments.reduce((sum: number, payment: any) => 
    sum + (payment.amount || 0), 0
  );

  const paidInstallments = contract.paidInstallments || 0;
  const remainingBalance = contract.remainingBalance || 0;

  return {
    status,
    overduePayments,
    nextPaymentDate: nextPayment?.dueDate,
    totalOverdue,
    paidInstallments,
    remainingBalance
  };
}

/**
 * คำนวณเปอร์เซ็นต์การชำระเงิน
 */
export function calculatePaymentProgress(
  totalPaid: number,
  totalPayable: number
): number {
  if (totalPayable <= 0) return 0;
  const progress = (totalPaid / totalPayable) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * คำนวณจำนวนวันที่เหลือ
 */
export function calculateDaysRemaining(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * ตรวจสอบว่าการชำระเงินล่าช้าหรือไม่
 */
export function isPaymentOverdue(dueDate: string, paidDate?: string): boolean {
  if (paidDate) return false; // ถ้าชำระแล้วไม่ถือว่าล่าช้า
  
  const today = new Date();
  const due = new Date(dueDate);
  return today > due;
}

/**
 * อัปเดตสถานะการชำระเงินของสัญญาทั้งหมด
 */
export function updatePaymentStatus(contracts: any[]): any[] {
  return contracts.map(contract => {
    // อัปเดตสถานะของแต่ละการชำระเงิน
    const updatedPayments = contract.payments?.map((payment: any) => ({
      ...payment,
      status: getPaymentStatus(
        payment.dueDate,
        payment.paidDate,
        payment.paidAmount,
        payment.amount
      )
    })) || [];

    // คำนวณข้อมูลสรุป
    const paidPayments = updatedPayments.filter((p: any) => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);
    const remainingBalance = contract.totalPayable - totalPaid;

    return {
      ...contract,
      payments: updatedPayments,
      paidInstallments: paidPayments.length,
      remainingInstallments: updatedPayments.length - paidPayments.length,
      totalPaid,
      remainingBalance: Math.max(0, remainingBalance)
    };
  });
}

/**
 * ดึงข้อความสถานะสัญญา
 */
export function getContractStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'รอดำเนินการ',
    active: 'ใช้งานอยู่',
    completed: 'เสร็จสิ้น',
    defaulted: 'ผิดนัด',
    cancelled: 'ยกเลิก'
  };
  
  return statusMap[status] || status;
}

/**
 * ดึงข้อความสถานะการชำระเงิน
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    partial: 'ชำระบางส่วน',
    overdue: 'เกินกำหนด',
    cancelled: 'ยกเลิก'
  };
  
  return statusMap[status] || status;
}

/**
 * ส่งออกข้อมูลสัญญาเป็น CSV
 */
export function exportContractsToCSV(contracts: any[]): string {
  const headers = [
    'เลขที่สัญญา',
    'ชื่อลูกค้า',
    'แผนผ่อนชำระ',
    'ยอดรวม',
    'ยอดที่ชำระแล้ว',
    'ยอดคงเหลือ',
    'สถานะ',
    'วันที่สร้างสัญญา'
  ];

  const csvData = contracts.map(contract => [
    contract.contractNumber || '',
    contract.customer?.name || '',
    contract.plan?.name || '',
    contract.totalAmount || 0,
    contract.totalPaid || 0,
    contract.remainingBalance || 0,
    getContractStatusText(contract.status),
    contract.contractDate || contract.createdAt || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return '\uFEFF' + csvContent;
}

/**
 * ฟอร์แมตตัวเลขเป็นสกุลเงิน
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * ฟอร์แมตวันที่
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}