// ===================================================================
// INSTALLMENT TYPES - Updated to use unified types
// Re-exports from unified types to maintain compatibility
// ===================================================================

// Re-export all unified types
export {
  type EmergencyContact,
  type Customer,
  type Guarantor,
  type InstallmentPlan,
  type InstallmentPayment,
  type InstallmentContract,
  type Product,
  type ContractStatus
} from './unified';

// Additional installment-specific types that don't conflict
export interface InstallmentSummary {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  defaultedContracts: number;
  totalFinanced: number;
  totalCollected: number;
  overdueAmount: number;
  overdueContracts: number;
  monthlyCollection: number;
  
  // Statistics
  averageContractAmount: number;
  averageMonthlyPayment: number;
  onTimePaymentRate: number;
  defaultRate: number;
}

export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendedPlans: string[];
  requiresGuarantor: boolean;
  maxLoanAmount: number;
}

export interface InstallmentCalculation {
  downPayment: number;
  financedAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  effectiveInterestRate: number;
  totalCost: number;
  paymentSchedule: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
}

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

export interface RiskAssessment {
  customerId: string;
  guarantorId?: string;
  contractAmount: number;
  
  customerRiskScore: number;
  guarantorRiskScore?: number;
  overallRiskScore: number;
  
  riskFactors: {
    incomeToPaymentRatio: number;
    creditHistory: 'good' | 'fair' | 'poor' | 'unknown';
    employmentStability: 'stable' | 'unstable' | 'unknown';
    existingDebt: number;
    collateralValue: number;
  };
  
  recommendations: string[];
  approvalStatus: 'approved' | 'conditional' | 'rejected';
  conditions?: string[];
}

export interface InstallmentReport {
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
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
  
  paymentStats: {
    totalCollected: number;
    onTimePayments: number;
    latePayments: number;
    overdueAmount: number;
    collectionRate: number;
  };
  
  riskStats: {
    lowRiskContracts: number;
    mediumRiskContracts: number;
    highRiskContracts: number;
    defaultedContracts: number;
    defaultRate: number;
  };
}

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

export interface InstallmentSettings {
  interestCalculationMethod: 'simple' | 'compound' | 'flat_rate';
  gracePeriodDays: number;
  lateFeeRate: number;
  maxLateFee: number;
  minCreditScore: number;
  maxDebtToIncomeRatio: number;
  requireGuarantorAmount: number;
  requireGuarantorMonths: number;
  paymentReminderDays: number[];
  overdueNotificationDays: number[];
  autoReportGeneration: boolean;
  reportRecipients: string[];
}