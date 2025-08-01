import { InstallmentContract, InstallmentPlan, InstallmentPayment, Customer } from '../types/pos';

/**
 * คำนวณค่างวดรายเดือน
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0) {
    return principal / months;
  }
  
  const monthlyRate = annualRate / 100 / 12;
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
  return Math.round((monthlyPayment * months - principal) * 100) / 100;
}

/**
 * สร้างตารางการชำระเงิน
 */
export function generatePaymentSchedule(
  contract: Partial<InstallmentContract>,
  plan: InstallmentPlan
): InstallmentPayment[] {
  const payments: InstallmentPayment[] = [];
  const startDate = new Date(contract.firstPaymentDate!);
  
  let remainingBalance = contract.financedAmount!;
  const monthlyRate = plan.interestRate / 100 / 12;
  
  for (let i = 1; i <= plan.months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    
    // คำนวณดอกเบี้ยและเงินต้นในแต่ละงวด
    const interestAmount = Math.round(remainingBalance * monthlyRate * 100) / 100;
    const principalAmount = Math.round((contract.monthlyPayment! - interestAmount) * 100) / 100;
    
    remainingBalance -= principalAmount;
    
    payments.push({
      id: `${contract.id}-payment-${i}`,
      contractId: contract.id!,
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: contract.monthlyPayment!,
      principalAmount,
      interestAmount,
      status: 'pending'
    });
  }
  
  return payments;
}

/**
 * สร้างสัญญาผ่อนชำระ
 */
export function createInstallmentContract(
  saleId: string,
  customer: Customer,
  plan: InstallmentPlan,
  totalAmount: number,
  contractDate: string = new Date().toISOString().split('T')[0]
): InstallmentContract {
  const downPayment = Math.round(totalAmount * (plan.downPaymentPercent / 100) * 100) / 100;
  const financedAmount = totalAmount - downPayment;
  const monthlyPayment = calculateMonthlyPayment(financedAmount, plan.interestRate, plan.months);
  const totalInterest = calculateTotalInterest(financedAmount, monthlyPayment, plan.months);
  const totalPayable = financedAmount + totalInterest + plan.processingFee;
  
  const firstPaymentDate = new Date(contractDate);
  firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
  
  const lastPaymentDate = new Date(firstPaymentDate);
  lastPaymentDate.setMonth(lastPaymentDate.getMonth() + (plan.months - 1));
  
  const contractNumber = generateContractNumber();
  
  const contract: InstallmentContract = {
    id: `contract-${Date.now()}`,
    contractNumber,
    saleId,
    customerId: customer.id!,
    customer,
    planId: plan.id,
    plan,
    
    totalAmount,
    downPayment,
    financedAmount,
    totalInterest,
    processingFee: plan.processingFee,
    totalPayable,
    monthlyPayment,
    
    contractDate,
    firstPaymentDate: firstPaymentDate.toISOString().split('T')[0],
    lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
    
    status: 'draft',
    
    payments: [],
    paidInstallments: 0,
    remainingInstallments: plan.months,
    totalPaid: downPayment,
    remainingBalance: financedAmount,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current-user' // TODO: ใช้ user ID จริง
  };
  
  // สร้างตารางการชำระเงิน
  contract.payments = generatePaymentSchedule(contract, plan);
  
  return contract;
}

/**
 * สร้างเลขที่สัญญา
 */
export function generateContractNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-4);
  
  return `IC${year}${month}${day}${time}`;
}

/**
 * คำนวณสถานะการชำระเงิน
 */
export function calculateContractStatus(contract: InstallmentContract): {
  totalPaid: number;
  remainingBalance: number;
  paidInstallments: number;
  overduePayments: InstallmentPayment[];
  nextPayment?: InstallmentPayment;
} {
  const paidPayments = contract.payments.filter(p => p.status === 'paid');
  const totalPaid = contract.downPayment + paidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const remainingBalance = contract.totalPayable - totalPaid;
  const paidInstallments = paidPayments.length;
  
  const today = new Date().toISOString().split('T')[0];
  const overduePayments = contract.payments.filter(p => 
    p.status === 'pending' && p.dueDate < today
  );
  
  const nextPayment = contract.payments.find(p => p.status === 'pending');
  
  return {
    totalPaid,
    remainingBalance,
    paidInstallments,
    overduePayments,
    nextPayment
  };
}

/**
 * ตรวจสอบสิทธิ์การขายผ่อน
 */
export function checkInstallmentEligibility(
  customer: Customer,
  totalAmount: number
): {
  eligible: boolean;
  reasons: string[];
  maxAmount?: number;
} {
  const reasons: string[] = [];
  let eligible = true;
  
  // ตรวจสอบข้อมูลพื้นฐาน
  if (!customer.idCard) {
    eligible = false;
    reasons.push('ไม่มีเลขบัตรประชาชน');
  }
  
  if (!customer.phone) {
    eligible = false;
    reasons.push('ไม่มีเบอร์โทรศัพท์');
  }
  
  if (!customer.address) {
    eligible = false;
    reasons.push('ไม่มีที่อยู่');
  }
  
  // ตรวจสอบบัญชีดำ
  if (customer.blacklisted) {
    eligible = false;
    reasons.push('อยู่ในบัญชีดำ');
  }
  
  // ตรวจสอบรายได้
  if (customer.monthlyIncome) {
    const maxAmount = customer.monthlyIncome * 10; // สูงสุด 10 เท่าของรายได้
    if (totalAmount > maxAmount) {
      eligible = false;
      reasons.push(`ยอดเกินวงเงินที่อนุมัติ (สูงสุด ${maxAmount.toLocaleString()} บาท)`);
    }
  }
  
  // ตรวจสอบคะแนนเครดิต
  if (customer.creditScore !== undefined && customer.creditScore < 600) {
    eligible = false;
    reasons.push('คะแนนเครดิตต่ำกว่าเกณฑ์');
  }
  
  return {
    eligible,
    reasons,
    maxAmount: customer.monthlyIncome ? customer.monthlyIncome * 10 : undefined
  };
}

/**
 * คำนวณค่าปรับล่าช้า
 */
export function calculateLateFee(payment: InstallmentPayment, lateFeeRate: number = 0.05): number {
  if (payment.status !== 'overdue') return 0;
  
  const today = new Date();
  const dueDate = new Date(payment.dueDate);
  const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLate <= 0) return 0;
  
  return Math.round(payment.amount * lateFeeRate * (daysLate / 30) * 100) / 100;
}

/**
 * อัพเดทสถานะการชำระเงิน
 */
export function updatePaymentStatus(contracts: InstallmentContract[]): InstallmentContract[] {
  const today = new Date().toISOString().split('T')[0];
  
  return contracts.map(contract => {
    const updatedPayments = contract.payments.map(payment => {
      if (payment.status === 'pending' && payment.dueDate < today) {
        return { ...payment, status: 'overdue' as const };
      }
      return payment;
    });
    
    const status = calculateContractStatus({ ...contract, payments: updatedPayments });
    
    return {
      ...contract,
      payments: updatedPayments,
      totalPaid: status.totalPaid,
      remainingBalance: status.remainingBalance,
      paidInstallments: status.paidInstallments,
      remainingInstallments: contract.plan.months - status.paidInstallments
    };
  });
}

/**
 * ส่งออกข้อมูลสัญญาเป็น CSV
 */
export function exportContractsToCSV(contracts: InstallmentContract[]): string {
  const headers = [
    'เลขที่สัญญา',
    'ชื่อลูกค้า',
    'เบอร์โทร',
    'ยอดรวม',
    'เงินดาวน์',
    'ยอดผ่อน',
    'ค่างวด',
    'จำนวนงวด',
    'ชำระแล้ว',
    'คงเหลือ',
    'สถานะ',
    'วันที่ทำสัญญา'
  ];
  
  const rows = contracts.map(contract => [
    contract.contractNumber,
    contract.customer.name,
    contract.customer.phone || '',
    contract.totalAmount.toLocaleString(),
    contract.downPayment.toLocaleString(),
    contract.financedAmount.toLocaleString(),
    contract.monthlyPayment.toLocaleString(),
    contract.plan.months.toString(),
    contract.paidInstallments.toString(),
    contract.remainingBalance.toLocaleString(),
    getContractStatusText(contract.status),
    contract.contractDate
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * แปลงสถานะสัญญาเป็นข้อความ
 */
export function getContractStatusText(status: InstallmentContract['status']): string {
  const statusMap = {
    draft: 'ร่าง',
    active: 'ใช้งาน',
    completed: 'เสร็จสิ้น',
    defaulted: 'ผิดนัด',
    cancelled: 'ยกเลิก'
  };
  
  return statusMap[status] || status;
}

/**
 * แปลงสถานะการชำระเป็นข้อความ
 */
export function getPaymentStatusText(status: InstallmentPayment['status']): string {
  const statusMap = {
    pending: 'รอชำระ',
    paid: 'ชำระแล้ว',
    overdue: 'เกินกำหนด',
    cancelled: 'ยกเลิก'
  };
  
  return statusMap[status] || status;
}