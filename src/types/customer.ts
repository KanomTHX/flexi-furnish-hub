// Customer Management Types
import { DatabaseEntity } from './common';

// Base Customer Interface
export interface Customer {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  
  // ข้อมูลเพิ่มเติมสำหรับสัญญาผ่อน
  idCard?: string; // เลขบัตรประชาชน
  occupation?: string; // อาชีพ
  monthlyIncome?: number; // รายได้ต่อเดือน
  workplace?: string; // สถานที่ทำงาน
  workAddress?: string; // ที่อยู่ที่ทำงาน
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  creditScore?: number; // คะแนนเครดิต
  blacklisted?: boolean; // บัญชีดำ
  notes?: string;
}

// Extended Customer Data with Analytics
export interface CustomerData extends Customer {
  creditScore: number;
  totalContracts: number;
  activeContracts: number;
  totalFinanced: number;
  totalPaid: number;
  overdueAmount: number;
  lastPaymentDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  customerSince: Date;
  notes: string;
}

// Guarantor Interface
export interface Guarantor {
  id?: string;
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  idCard: string;
  occupation: string;
  monthlyIncome: number;
  relationship: string; // ความสัมพันธ์กับลูกค้า
  workplace?: string;
  workAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  guaranteeAmount: number; // จำนวนเงินที่ค้ำประกัน
  guaranteeStartDate: Date;
  guaranteeEndDate?: Date;
  status: 'active' | 'inactive' | 'expired';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Metrics Interface
export interface CustomerMetrics {
  customerId: string;
  
  // Financial Metrics
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  totalInstallmentContracts: number;
  activeInstallmentContracts: number;
  completedInstallmentContracts: number;
  defaultedInstallmentContracts: number;
  
  // Payment Metrics
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  paymentReliabilityScore: number; // 0-100
  averageDaysLate: number;
  
  // Credit Metrics
  creditScore: number;
  creditLimit: number;
  creditUtilization: number; // เปอร์เซ็นต์การใช้เครดิต
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  
  // Behavioral Metrics
  customerLifetimeValue: number;
  customerSince: Date;
  lastPurchaseDate?: Date;
  lastPaymentDate?: Date;
  preferredPaymentMethod?: string;
  communicationPreference?: 'phone' | 'email' | 'sms' | 'line';
  
  // Engagement Metrics
  totalInteractions: number;
  lastContactDate?: Date;
  responseRate: number; // อัตราการตอบกลับ
  satisfactionScore?: number; // 1-5
  
  // Calculated Fields
  monthsSinceLastPurchase?: number;
  monthsSinceLastPayment?: number;
  projectedLifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  
  // Timestamps
  calculatedAt: Date;
  lastUpdated: Date;
}

// Customer Analytics Summary
export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
  
  // Risk Distribution
  lowRiskCustomers: number;
  mediumRiskCustomers: number;
  highRiskCustomers: number;
  criticalRiskCustomers: number;
  
  // Financial Summary
  totalCustomerValue: number;
  averageCustomerValue: number;
  totalOutstandingAmount: number;
  totalOverdueAmount: number;
  
  // Payment Performance
  onTimePaymentRate: number;
  averagePaymentDelay: number;
  defaultRate: number;
  
  // Growth Metrics
  customerGrowthRate: number;
  customerRetentionRate: number;
  customerChurnRate: number;
  
  // Top Performers
  topCustomersByValue: CustomerData[];
  topCustomersByPayments: CustomerData[];
  riskCustomers: CustomerData[];
}

// Customer Search and Filter Options
export interface CustomerFilterOptions {
  search?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  status?: 'active' | 'inactive' | 'blacklisted' | 'all';
  hasActiveContracts?: boolean;
  hasOverduePayments?: boolean;
  creditScoreMin?: number;
  creditScoreMax?: number;
  monthlyIncomeMin?: number;
  monthlyIncomeMax?: number;
  customerSinceFrom?: Date;
  customerSinceTo?: Date;
  lastPaymentFrom?: Date;
  lastPaymentTo?: Date;
  sortBy?: 'name' | 'creditScore' | 'totalFinanced' | 'lastPaymentDate' | 'customerSince';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Customer Form Data
export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  idCard: string;
  occupation: string;
  monthlyIncome: number;
  workplace?: string;
  workAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
}

// Customer Creation Data
export interface CreateCustomerData extends CustomerFormData {
  branchId?: string;
  customerCode?: string;
  type?: 'individual' | 'business';
  creditLimit?: number;
}

// Customer Update Data
export interface UpdateCustomerData extends Partial<CustomerFormData> {
  creditScore?: number;
  creditLimit?: number;
  blacklisted?: boolean;
  status?: 'active' | 'inactive' | 'blacklisted';
}

// Customer API Response Types
export interface CustomerResponse {
  data: CustomerData;
  success: boolean;
  message?: string;
}

export interface CustomersResponse {
  data: CustomerData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  success: boolean;
  message?: string;
}

export interface CustomerMetricsResponse {
  data: CustomerMetrics;
  success: boolean;
  message?: string;
}

export interface CustomerAnalyticsResponse {
  data: CustomerAnalytics;
  success: boolean;
  message?: string;
}

// Customer Event Types
export interface CustomerEvent {
  id: string;
  customerId: string;
  type: 'created' | 'updated' | 'payment' | 'contract_created' | 'contract_completed' | 'contact' | 'note_added';
  description: string;
  data?: Record<string, any>;
  performedBy: string;
  performedAt: Date;
}

// Customer Communication Types
export interface CustomerCommunication {
  id: string;
  customerId: string;
  type: 'phone' | 'email' | 'sms' | 'line' | 'visit' | 'letter';
  direction: 'inbound' | 'outbound';
  subject?: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  sentBy: string;
  sentAt: Date;
  readAt?: Date;
  repliedAt?: Date;
  attachments?: string[];
  notes?: string;
}

// Customer Document Types
export interface CustomerDocument {
  id: string;
  customerId: string;
  type: 'id_card' | 'income_certificate' | 'work_certificate' | 'bank_statement' | 'contract' | 'other';
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
}

// Export all types
export type {
  Customer,
  CustomerData,
  Guarantor,
  CustomerMetrics,
  CustomerAnalytics,
  CustomerFilterOptions,
  CustomerFormData,
  CreateCustomerData,
  UpdateCustomerData,
  CustomerResponse,
  CustomersResponse,
  CustomerMetricsResponse,
  CustomerAnalyticsResponse,
  CustomerEvent,
  CustomerCommunication,
  CustomerDocument
};