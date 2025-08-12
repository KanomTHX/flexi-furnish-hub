// ===================================================================
// UNIFIED TYPES - Single source of truth for shared types
// This file resolves conflicts between pos.ts and installments.ts
// ===================================================================

// Emergency Contact - unified definition
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: 'บิดา' | 'มารดา' | 'คู่สมรส' | 'พี่น้อง' | 'เพื่อน' | 'อื่นๆ';
}

// Customer - unified definition based on actual database schema
export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  
  // Database fields from customers table
  branch_id?: string; // From database
  branchId?: string; // Legacy alias
  customer_code?: string;
  type?: 'individual' | 'business';
  tax_id?: string;
  credit_limit?: number;
  status?: 'active' | 'inactive';
  
  // Extended address fields (for installment forms)
  houseNumber?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  zipCode?: string;
  
  // Installment specific fields
  id_card?: string; // Maps to database id_card
  idCard?: string; // Legacy alias
  occupation?: string;
  monthly_income?: number;
  monthlyIncome?: number; // Legacy alias
  workplace?: string;
  work_address?: string; // Maps to database work_address
  workAddress?: string; // Legacy alias
  
  // Emergency contact from database
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Credit information
  credit_score?: number;
  creditScore?: number; // Legacy alias
  blacklisted?: boolean;
  notes?: string;
  
  // Financial tracking
  current_balance?: number;
  total_purchases?: number;
  last_purchase_date?: string;
  
  // System fields
  created_at?: string;
  createdAt?: string; // Legacy alias
  updated_at?: string;
  updatedAt?: string; // Legacy alias
  createdBy?: string;
}

// Guarantor - unified definition based on database schema
export interface Guarantor {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address: string; // Required in database
  
  // Database fields
  branch_id?: string;
  branchId?: string; // Legacy alias
  id_card: string; // Required in database
  idCard?: string; // Legacy alias
  occupation: string; // Required in database
  monthly_income: number; // Required in database
  monthlyIncome?: number; // Legacy alias
  workplace?: string;
  work_address?: string;
  workAddress?: string; // Legacy alias
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // System fields
  created_at?: string;
  createdAt?: string; // Legacy alias
  updated_at?: string;
  updatedAt?: string; // Legacy alias
  created_by?: string;
  createdBy?: string; // Legacy alias
}

// Installment Plan - unified definition
export interface InstallmentPlan {
  id: string;
  name?: string;
  months?: number;
  interest_rate?: number;
  interestRate?: number; // Legacy alias
  down_payment_percent?: number;
  downPaymentPercent?: number; // Legacy alias
  processing_fee?: number;
  processingFee?: number; // Legacy alias
  description?: string;
  
  // Conditions
  min_amount?: number;
  max_amount?: number;
  requires_guarantor?: boolean;
  requiresGuarantor?: boolean; // Legacy alias
  
  // Status
  is_active?: boolean;
  isActive?: boolean; // Legacy alias
  status?: 'active' | 'inactive';
  
  // System fields
  branch_id?: string;
  branchId?: string; // Legacy alias
  customer_id?: string;
  customerId?: string; // Legacy alias
  sales_transaction_id?: string;
  created_at?: string;
  createdAt?: string; // Legacy alias
  updated_at?: string;
  updatedAt?: string; // Legacy alias
  createdBy?: string;
}

// Installment Payment - unified definition
export interface InstallmentPayment {
  id: string;
  contract_id?: string;
  installment_plan_id?: string;
  payment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid?: number;
  principal_amount?: number;
  interest_amount?: number;
  late_fee?: number;
  discount?: number;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
  
  // System fields
  branch_id?: string;
  processed_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Installment Contract - unified definition
export interface InstallmentContract {
  id: string;
  contract_number?: string;
  contractNumber?: string; // Legacy alias
  transaction_id: string;
  saleId?: string; // Legacy alias for transaction_id
  customer_id?: string;
  customerId?: string; // Legacy alias
  customer?: Customer;
  plan_id?: string;
  planId?: string; // Legacy alias
  plan?: InstallmentPlan;
  
  // Guarantor information
  guarantor_id?: string;
  guarantorId?: string; // Legacy alias
  guarantor?: Guarantor;
  requires_guarantor?: boolean;
  requiresGuarantor?: boolean; // Legacy alias
  
  // Financial details
  total_months: number;
  totalAmount?: number; // Legacy alias
  monthly_payment: number;
  monthlyPayment?: number; // Legacy alias
  down_payment: number;
  downPayment?: number; // Legacy alias
  financed_amount?: number;
  financedAmount?: number; // Legacy alias
  remaining_amount: number;
  remainingAmount?: number; // Legacy alias
  interest_rate?: number;
  interestRate?: number; // Legacy alias
  total_interest?: number;
  totalInterest?: number; // Legacy alias
  processing_fee?: number;
  processingFee?: number; // Legacy alias
  total_payable?: number;
  totalPayable?: number; // Legacy alias
  
  // Dates
  start_date: string;
  end_date: string;
  contract_date?: string;
  contractDate?: string; // Legacy alias
  first_payment_date?: string;
  firstPaymentDate?: string; // Legacy alias
  last_payment_date?: string;
  lastPaymentDate?: string; // Legacy alias
  
  // Status and tracking
  status?: 'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  paid_installments?: number;
  paidInstallments?: number; // Legacy alias
  remaining_installments?: number;
  remainingInstallments?: number; // Legacy alias
  total_paid?: number;
  totalPaid?: number; // Legacy alias
  remaining_balance?: number;
  remainingBalance?: number; // Legacy alias
  
  // Additional payments array for legacy compatibility
  payments?: InstallmentPayment[];
  
  // Additional info
  collateral?: string;
  notes?: string;
  terms?: string;
  
  // System fields
  branch_id?: string;
  branchId?: string; // Legacy alias
  approved_by?: string;
  approvedBy?: string; // Legacy alias
  approved_at?: string;
  approvedAt?: string; // Legacy alias
  created_by?: string;
  createdBy?: string; // Legacy alias
  created_at: string;
  createdAt?: string; // Legacy alias
  updated_at: string;
  updatedAt?: string; // Legacy alias
}

// Product - unified definition
export interface Product {
  id: string;
  name: string;
  product_code: string;
  description?: string;
  category_id?: string;
  unit?: string;
  cost_price?: number;
  selling_price: number;
  status?: 'active' | 'inactive';
  
  // Additional fields for POS
  sku?: string;
  price?: number; // Alias for selling_price
  category?: string;
  stock?: number;
  image?: string;
  barcode?: string;
  
  // Stock levels
  min_stock_level?: number;
  max_stock_level?: number;
  
  // System fields
  created_at?: string;
  updated_at?: string;
}

// Cart Item for POS
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

// Payment Method
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'installment';
  icon?: string;
}

// Sale/Transaction
export interface Sale {
  id: string;
  saleNumber?: string;
  transaction_number?: string;
  customerId?: string;
  customer?: Customer;
  items?: CartItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod?: PaymentMethod;
  payment_method?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  status?: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded';
  
  // System fields
  branch_id?: string;
  employee_id?: string;
  transaction_date?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  
  // Installment related
  installmentContractId?: string;
  installmentContract?: InstallmentContract;
}

// Contract status calculation result
export interface ContractStatus {
  status: 'active' | 'cancelled' | 'pending' | 'completed' | 'defaulted';
  overduePayments: any[];
  nextPaymentDate?: string;
  totalOverdue: number;
  paidInstallments: number;
  remainingBalance: number;
}

// Re-export commonly used types
export type {
  EmergencyContact,
  Customer,
  Guarantor,
  InstallmentPlan,
  InstallmentPayment,
  InstallmentContract,
  Product,
  CartItem,
  PaymentMethod,
  Sale,
  ContractStatus
};