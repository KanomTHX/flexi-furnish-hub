// ===================================================================
// UPDATED TYPES FOR INSTALLMENT SYSTEM
// Types ที่อัปเดตสำหรับระบบสัญญาผ่อนชำระ
// ===================================================================

// ข้อมูลผู้ติดต่อฉุกเฉิน
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: 'บิดา' | 'มารดา' | 'คู่สมรส' | 'พี่น้อง' | 'เพื่อน' | 'อื่นๆ';
}

// ข้อมูลลูกค้า (อัปเดต)
export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  
  // ข้อมูลที่อยู่แบบแยกส่วน (ใหม่)
  houseNumber?: string; // บ้านเลขที่
  province?: string; // จังหวัด
  district?: string; // อำเภอ
  subdistrict?: string; // ตำบล
  zipCode?: string; // รหัสไปรษณีย์
  
  // ข้อมูลเพิ่มเติมสำหรับสัญญาผ่อน
  idCard?: string; // เลขบัตรประชาชน
  occupation?: string; // อาชีพ
  monthlyIncome?: number; // รายได้ต่อเดือน
  workplace?: string; // สถานที่ทำงาน
  workAddress?: string; // ที่อยู่ที่ทำงาน
  
  // ผู้ติดต่อฉุกเฉิน
  emergencyContact?: EmergencyContact;
  
  // ข้อมูลเครดิต
  creditScore?: number; // คะแนนเครดิต
  blacklisted?: boolean; // บัญชีดำ
  
  // หมายเหตุ
  notes?: string;
  
  // ข้อมูลระบบ
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  branchId?: string;
}

// ข้อมูลผู้ค้ำประกัน (ใหม่)
export interface Guarantor {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  
  // ข้อมูลที่อยู่แบบแยกส่วน (ใหม่)
  houseNumber?: string; // บ้านเลขที่
  province?: string; // จังหวัด
  district?: string; // อำเภอ
  subdistrict?: string; // ตำบล
  zipCode?: string; // รหัสไปรษณีย์
  
  // ข้อมูลบัตรประชาชน
  idCard: string;
  
  // ข้อมูลการงาน
  occupation: string;
  monthlyIncome: number;
  workplace?: string;
  workAddress?: string;
  
  // ผู้ติดต่อฉุกเฉินของผู้ค้ำประกัน
  emergencyContact?: EmergencyContact;
  
  // ข้อมูลระบบ
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  branchId?: string;
}

// แผนผ่อนชำระ (อัปเดต)
export interface InstallmentPlan {
  id: string;
  name: string;
  months: number;
  interestRate: number; // อัตราดอกเบี้ยต่อปี (%)
  downPaymentPercent: number; // เปอร์เซ็นต์เงินดาวน์
  processingFee: number; // ค่าธรรมเนียมการจัดทำสัญญา
  description?: string;
  
  // เงื่อนไขการใช้งาน (ใหม่)
  minAmount?: number; // ยอดเงินขั้นต่ำ
  maxAmount?: number; // ยอดเงินสูงสุด
  requiresGuarantor?: boolean; // บังคับใช้ผู้ค้ำประกัน
  
  // สถานะ
  isActive: boolean;
  
  // ข้อมูลระบบ
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// การชำระเงินงวด (อัปเดต - ตรงกับฐานข้อมูลจริง)
export interface InstallmentPayment {
  id: string;
  contractId: string;
  installmentPlanId?: string; // installment_plan_id ในฐานข้อมูล
  installmentNumber: number; // payment_number ในฐานข้อมูล
  dueDate: string;
  amount: number; // amount_due ในฐานข้อมูล
  principalAmount: number; // เงินต้น
  interestAmount: number; // ดอกเบี้ย
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string; // payment_date ในฐานข้อมูล
  paidAmount?: number; // amount_paid ในฐานข้อมูล
  paymentMethod?: string;
  receiptNumber?: string;
  
  // ข้อมูลเพิ่มเติม (ใหม่)
  lateFee?: number; // ค่าปรับล่าช้า
  discount?: number; // ส่วนลด
  notes?: string;
  
  // ข้อมูลระบบ
  createdAt?: string;
  updatedAt?: string;
  processedBy?: string;
  branchId?: string;
}

// สัญญาผ่อนชำระ (อัปเดต - ตรงกับฐานข้อมูลจริง)
export interface InstallmentContract {
  id: string;
  contractNumber: string;
  transactionId?: string; // transaction_id ในฐานข้อมูล
  customerId: string;
  customer: Customer;
  planId: string;
  plan: InstallmentPlan;
  
  // ข้อมูลผู้ค้ำประกัน (ใหม่)
  guarantorId?: string;
  guarantor?: Guarantor;
  requiresGuarantor?: boolean;
  
  // จำนวนเงิน
  totalAmount: number; // ยอดรวมสินค้า
  downPayment: number; // เงินดาวน์
  financedAmount: number; // ยอดที่ผ่อน (financed_amount)
  remainingAmount?: number; // remaining_amount ในฐานข้อมูล
  totalInterest: number; // ดอกเบี้ยรวม
  processingFee: number; // ค่าธรรมเนียม
  totalPayable: number; // ยอดที่ต้องชำระรวม
  monthlyPayment: number; // ค่างวดต่อเดือน
  
  // วันที่
  contractDate: string;
  firstPaymentDate: string;
  lastPaymentDate: string;
  
  // สถานะ (ใช้ค่าที่ถูกต้องในฐานข้อมูล)
  status: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  
  // การชำระเงิน
  payments: InstallmentPayment[];
  paidInstallments: number;
  remainingInstallments: number;
  totalPaid: number;
  remainingBalance: number;
  
  // ข้อมูลเพิ่มเติม (อัปเดต)
  collateral?: string; // หลักประกัน
  terms?: string; // เงื่อนไขพิเศษ
  notes?: string; // หมายเหตุ
  
  // ข้อมูลระบบ
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string; // ผู้อนุมัติ (ใหม่)
  approvedAt?: string; // วันที่อนุมัติ (ใหม่)
  branchId?: string; // สาขา (ใหม่)
}

// ประวัติการเปลี่ยนแปลงสัญญา (ใหม่)
export interface ContractHistory {
  id: string;
  contractId: string;
  action: 'created' | 'updated' | 'payment' | 'status_change' | 'approved' | 'cancelled';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  createdAt: string;
  createdBy: string;
}

// เอกสารแนบ (ใหม่)
export interface ContractDocument {
  id: string;
  contractId?: string;
  guarantorId?: string;
  customerId?: string;
  
  documentType: 'id_card' | 'income_proof' | 'work_certificate' | 'contract' | 'guarantor_id' | 'guarantor_income' | 'other';
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  
  createdAt: string;
  uploadedBy: string;
}

// สรุปข้อมูลสัญญา (อัปเดต)
export interface InstallmentSummary {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number; // ใหม่
  defaultedContracts: number; // ใหม่
  totalFinanced: number;
  totalCollected: number;
  overdueAmount: number;
  overdueContracts: number;
  monthlyCollection: number;
  
  // สถิติเพิ่มเติม (ใหม่)
  averageContractAmount: number;
  averageMonthlyPayment: number;
  onTimePaymentRate: number; // อัตราการชำระตรงเวลา
  defaultRate: number; // อัตราการผิดนัด
}

// ข้อมูลการตรวจสอบสิทธิ์ (อัปเดต)
export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high'; // ใหม่
  recommendedPlans: string[]; // ใหม่
  requiresGuarantor: boolean; // ใหม่
  maxLoanAmount: number; // ใหม่
}

// ข้อมูลการคำนวณผ่อนชำระ (อัปเดต)
export interface InstallmentCalculation {
  downPayment: number;
  financedAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  
  // ข้อมูลเพิ่มเติม (ใหม่)
  effectiveInterestRate: number; // อัตราดอกเบี้ยที่แท้จริง
  totalCost: number; // ต้นทุนรวม
  paymentSchedule: PaymentScheduleItem[]; // ตารางการชำระ
}

// รายการตารางการชำระ (ใหม่)
export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
}

// ข้อมูลการวิเคราะห์ความเสี่ยง (ใหม่)
export interface RiskAssessment {
  customerId: string;
  guarantorId?: string;
  contractAmount: number;
  
  // คะแนนความเสี่ยง
  customerRiskScore: number; // 0-100
  guarantorRiskScore?: number; // 0-100
  overallRiskScore: number; // 0-100
  
  // ปัจจัยความเสี่ยง
  riskFactors: {
    incomeToPaymentRatio: number; // อัตราส่วนรายได้ต่อค่างวด
    creditHistory: 'good' | 'fair' | 'poor' | 'unknown';
    employmentStability: 'stable' | 'unstable' | 'unknown';
    existingDebt: number; // หนี้สินที่มีอยู่
    collateralValue: number; // มูลค่าหลักประกัน
  };
  
  // คำแนะนำ
  recommendations: string[];
  approvalStatus: 'approved' | 'conditional' | 'rejected';
  conditions?: string[]; // เงื่อนไขการอนุมัติ
}

// ข้อมูลรายงาน (ใหม่)
export interface InstallmentReport {
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  // สถิติการขาย
  salesStats: {
    totalContracts: number;
    totalAmount: number;
    averageAmount: number;
    topPlans: Array<{
      planName: string;
      count: number;
      amount: number;
    }>;
  };
  
  // สถิติการชำระ
  paymentStats: {
    totalCollected: number;
    onTimePayments: number;
    latePayments: number;
    overdueAmount: number;
    collectionRate: number;
  };
  
  // สถิติความเสี่ยง
  riskStats: {
    lowRiskContracts: number;
    mediumRiskContracts: number;
    highRiskContracts: number;
    defaultedContracts: number;
    defaultRate: number;
  };
}

// ข้อมูลการแจ้งเตือน (ใหม่)
export interface InstallmentNotification {
  id: string;
  type: 'payment_due' | 'payment_overdue' | 'contract_expiring' | 'risk_alert' | 'system_alert';
  title: string;
  message: string;
  contractId?: string;
  customerId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'dismissed';
  createdAt: string;
  dueDate?: string;
  amount?: number;
}

// ข้อมูลการตั้งค่าระบบ (ใหม่)
export interface InstallmentSettings {
  // การคำนวณดอกเบี้ย
  interestCalculationMethod: 'simple' | 'compound' | 'flat_rate';
  gracePeriodDays: number; // วันผ่อนผันก่อนคิดค่าปรับ
  lateFeeRate: number; // อัตราค่าปรับล่าช้า (% ต่อวัน)
  maxLateFee: number; // ค่าปรับสูงสุด
  
  // เงื่อนไขการอนุมัติ
  minCreditScore: number;
  maxDebtToIncomeRatio: number; // อัตราส่วนหนี้ต่อรายได้สูงสุด
  requireGuarantorAmount: number; // ยอดเงินที่ต้องมีผู้ค้ำ
  requireGuarantorMonths: number; // จำนวนงวดที่ต้องมีผู้ค้ำ
  
  // การแจ้งเตือน
  paymentReminderDays: number[]; // วันที่แจ้งเตือนก่อนครบกำหนด
  overdueNotificationDays: number[]; // วันที่แจ้งเตือนหลังเกินกำหนด
  
  // การรายงาน
  autoReportGeneration: boolean;
  reportRecipients: string[]; // อีเมลผู้รับรายงาน
}

// Export all types
export type {
  Customer,
  Guarantor,
  InstallmentPlan,
  InstallmentPayment,
  InstallmentContract,
  ContractHistory,
  ContractDocument,
  InstallmentSummary,
  EligibilityCheck,
  InstallmentCalculation,
  PaymentScheduleItem,
  RiskAssessment,
  InstallmentReport,
  InstallmentNotification,
  InstallmentSettings,
  EmergencyContact
};