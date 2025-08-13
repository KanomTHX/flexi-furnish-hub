// Unified types for installments
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  idCard?: string;
  occupation?: string;
  monthlyIncome?: number;
  branchId?: string;
  emergencyContact?: EmergencyContact;
}

export interface Guarantor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
}

export interface InstallmentPlan {
  id: string;
  name: string;
  months: number;
  interestRate: number;
  processingFee: number;
  isActive: boolean;
  downPaymentPercent?: number;
}

export interface InstallmentPayment {
  id: string;
  contract_id: string;
  payment_number: number;
  due_date: string;
  amount_due: number;
  principal_amount: number;
  interest_amount: number;
  status: string;
  payment_date?: string;
  amount_paid: number;
  payment_method?: string;
  receipt_number?: string;
  late_fee: number;
  discount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  branchId?: string;
}

export interface InstallmentContract {
  id: string;
  transaction_id: string;
  contractNumber?: string;
  customerId: string;
  customer?: Customer;
  planId: string;
  plan?: InstallmentPlan;
  guarantorId?: string;
  guarantor?: Guarantor;
  totalAmount: number;
  total_months: number;
  downPayment: number;
  down_payment: number;
  monthly_payment: number;
  remaining_amount: number;
  financedAmount: number;
  totalInterest: number;
  processingFee: number;
  totalPayable: number;
  monthlyPayment: number;
  contractDate: string;
  start_date?: string;
  end_date?: string;
  interest_rate?: number;
  firstPaymentDate?: string;
  lastPaymentDate?: string;
  status: string;
  payments: InstallmentPayment[];
  paidInstallments: number;
  remainingInstallments: number;
  totalPaid: number;
  remainingBalance: number;
  collateral?: string;
  terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  branchId?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Sale {
  id: string;
  total: number;
  items: CartItem[];
}

export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';