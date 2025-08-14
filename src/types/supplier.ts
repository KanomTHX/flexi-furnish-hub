// Supplier and Billing Types
export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number; // วันที่ต้องชำระ
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  
  // Advanced Features - Accounting Integration
  accountingSystemId?: string;
  externalAccountId?: string;
  defaultExpenseAccountId?: string;
  defaultPayableAccountId?: string;
  taxAccountId?: string;
  
  // Advanced Features - Performance Tracking
  performanceRating?: number; // 1-5 scale
  qualityRating?: number; // 1-5 scale
  deliveryRating?: number; // 1-5 scale
  costRating?: number; // 1-5 scale
  overallRating?: number; // 1-5 scale
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  
  // Advanced Features - Payment Analytics
  averagePaymentDays?: number;
  onTimePaymentRate?: number; // percentage
  earlyPaymentDiscountRate?: number; // percentage
  lastPaymentDate?: Date;
  paymentHistory?: SupplierPaymentHistory[];
  
  // Advanced Features - Delivery Performance
  averageDeliveryDays?: number;
  onTimeDeliveryRate?: number; // percentage
  lastDeliveryDate?: Date;
  preferredDeliveryDays?: number[]; // 0-6, Sunday = 0
  deliveryInstructions?: string;
  
  // Advanced Features - Communication Preferences
  preferredContactMethod?: 'email' | 'phone' | 'sms' | 'portal';
  notificationPreferences?: SupplierNotificationPreferences;
  communicationLanguage?: string;
  timezone?: string;
  
  // Advanced Features - Integration Settings
  posIntegrationEnabled?: boolean;
  autoCreatePurchaseOrders?: boolean;
  stockAlertThreshold?: number;
  minimumOrderAmount?: number;
  leadTimeDays?: number;
  
  // Advanced Features - Compliance and Documentation
  certifications?: SupplierCertification[];
  contracts?: SupplierContract[];
  insuranceInfo?: SupplierInsurance;
  complianceStatus?: 'compliant' | 'non_compliant' | 'pending_review';
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  
  // Advanced Features - Financial Information
  annualRevenue?: number;
  employeeCount?: number;
  businessType?: string;
  paymentMethods?: string[];
  bankingDetails?: SupplierBankingDetails;
  
  // Advanced Features - Categorization and Tags
  category?: string;
  subcategory?: string;
  tags?: string[];
  businessSegment?: string;
  geographicRegion?: string;
  
  // Advanced Features - Relationship Management
  accountManagerId?: string;
  accountManager?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  relationshipStartDate?: Date;
  contractRenewalDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'completed';
  paymentTerms: number;
  notes?: string;
  items?: SupplierInvoiceItem[];
  payments?: SupplierPayment[];
  
  // Advanced Features - Accounting Integration
  journalEntryId?: string;
  externalInvoiceId?: string;
  accountingSystemSynced?: boolean;
  syncedAt?: Date;
  syncError?: string;
  
  // Advanced Features - Approval Workflow
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'requires_review';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  approvalWorkflowId?: string;
  
  // Advanced Features - Document Management
  attachments?: InvoiceAttachment[];
  originalDocumentUrl?: string;
  ocrProcessed?: boolean;
  ocrData?: OCRData;
  
  // Advanced Features - Payment Terms and Discounts
  earlyPaymentDiscount?: {
    percentage: number;
    daysFromInvoice: number;
    discountDueDate: Date;
  };
  latePaymentPenalty?: {
    percentage: number;
    daysAfterDue: number;
    penaltyAmount?: number;
  };
  
  // Advanced Features - Notifications and Reminders
  remindersSent?: InvoiceReminder[];
  lastReminderSent?: Date;
  nextReminderDate?: Date;
  
  // Advanced Features - Analytics and Tracking
  daysToPayment?: number;
  paymentVelocity?: 'fast' | 'normal' | 'slow';
  riskScore?: number;
  predictedPaymentDate?: Date;
  
  // Advanced Features - Integration Tracking
  posTransactionIds?: string[];
  stockMovementIds?: string[];
  
  // Advanced Features - Compliance and Audit
  auditTrail?: InvoiceAuditEntry[];
  complianceFlags?: string[];
  taxValidated?: boolean;
  taxValidationDate?: Date;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: Date;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplier?: Supplier;
  invoiceId: string;
  invoice?: SupplierInvoice;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'ach' | 'wire_transfer' | 'digital_wallet';
  referenceNumber?: string;
  notes?: string;
  
  // Advanced Features - Accounting Integration
  journalEntryId?: string;
  externalPaymentId?: string;
  accountingSystemSynced?: boolean;
  syncedAt?: Date;
  syncError?: string;
  
  // Advanced Features - Banking Integration
  bankTransactionId?: string;
  bankAccountId?: string;
  exchangeRate?: number;
  originalCurrency?: string;
  originalAmount?: number;
  bankFees?: number;
  
  // Advanced Features - Payment Processing
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processingFee?: number;
  processorTransactionId?: string;
  processorResponse?: any;
  
  // Advanced Features - Approval and Authorization
  approvalRequired?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  authorizationCode?: string;
  
  // Advanced Features - Discounts and Adjustments
  earlyPaymentDiscount?: number;
  latePaymentPenalty?: number;
  adjustmentAmount?: number;
  adjustmentReason?: string;
  
  // Advanced Features - Document Management
  attachments?: PaymentAttachment[];
  receiptUrl?: string;
  
  // Advanced Features - Reconciliation
  reconciledWith?: string; // bank statement line ID
  reconciledAt?: Date;
  reconciledBy?: string;
  reconciliationStatus?: 'pending' | 'matched' | 'unmatched' | 'disputed';
  
  // Advanced Features - Analytics
  daysFromInvoice?: number;
  wasEarlyPayment?: boolean;
  wasOnTime?: boolean;
  wasLatePayment?: boolean;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId?: string;
  supplier?: Supplier;
  supplierName: string;
  supplierContact?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  totalAmount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  items?: PurchaseOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  createdAt: Date;
}

// Summary and Statistics Types
export interface SupplierSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOutstanding: number;
  overdueAmount: number;
  totalPaidThisMonth: number;
  averagePaymentDays: number;
}

export interface SupplierBillingSummary {
  supplierId: string;
  supplierName: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  lastPaymentDate?: Date;
  averagePaymentDays: number;
}

// Filter and Search Types
export interface SupplierFilters {
  search?: string;
  status?: string;
  hasOutstanding?: boolean;
  hasOverdue?: boolean;
}

export interface InvoiceFilters {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentFilters {
  supplierId?: string;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Form Data Types
export interface CreateSupplierData {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  supplierId: string;
  purchaseOrderId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentTerms?: number;
  notes?: string;
  items: {
    productId: string;
    description?: string;
    quantity: number;
    unitCost: number;
  }[];
}

export interface CreatePaymentData {
  paymentNumber: string;
  supplierId: string;
  invoiceId: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  referenceNumber?: string;
  notes?: string;
}

// API Response Types
export interface SuppliersResponse {
  data: Supplier[];
  total: number;
}

export interface InvoicesResponse {
  data: SupplierInvoice[];
  total: number;
}

export interface PaymentsResponse {
  data: SupplierPayment[];
  total: number;
}

// Advanced Supplier Types
export interface SupplierPaymentHistory {
  id: string;
  supplierId: string;
  invoiceId: string;
  paymentDate: Date;
  amount: number;
  daysToPayment: number;
  wasEarlyPayment: boolean;
  wasOnTime: boolean;
  wasLate: boolean;
  discountTaken?: number;
  paymentMethod: string;
}

export interface SupplierNotificationPreferences {
  paymentReminders: boolean;
  invoiceNotifications: boolean;
  purchaseOrderNotifications: boolean;
  monthlyStatements: boolean;
  marketingCommunications: boolean;
  systemAlerts: boolean;
  preferredFrequency: 'immediate' | 'daily' | 'weekly';
  quietHours?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface SupplierCertification {
  id: string;
  name: string;
  type: string;
  issuingBody: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  status: 'active' | 'expired' | 'suspended';
  documentUrl?: string;
}

export interface SupplierContract {
  id: string;
  contractNumber: string;
  type: 'master_agreement' | 'purchase_agreement' | 'service_agreement' | 'nda';
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  status: 'active' | 'expired' | 'terminated' | 'pending';
  terms?: string;
  documentUrl?: string;
  autoRenewal: boolean;
  noticePeriodDays?: number;
}

export interface SupplierInsurance {
  generalLiability?: InsurancePolicy;
  productLiability?: InsurancePolicy;
  professionalIndemnity?: InsurancePolicy;
  workersCompensation?: InsurancePolicy;
}

export interface InsurancePolicy {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  documentUrl?: string;
}

export interface SupplierBankingDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface SupplierPerformanceSnapshot {
  supplierId: string;
  supplierName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Financial Performance
  totalSpend: number;
  invoiceCount: number;
  averageInvoiceAmount: number;
  paymentPerformance: {
    averageDaysToPayment: number;
    onTimePaymentRate: number;
    earlyPaymentRate: number;
    latePaymentRate: number;
  };
  
  // Delivery Performance
  deliveryPerformance: {
    averageDeliveryDays: number;
    onTimeDeliveryRate: number;
    earlyDeliveryRate: number;
    lateDeliveryRate: number;
  };
  
  // Quality Metrics
  qualityMetrics: {
    defectRate: number;
    returnRate: number;
    complaintCount: number;
    qualityScore: number;
  };
  
  // Overall Ratings
  overallRating: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendationScore: number;
  
  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining';
  spendTrend: 'increasing' | 'stable' | 'decreasing';
  
  lastUpdated: Date;
}

export interface SupplierRiskAssessment {
  supplierId: string;
  assessmentDate: Date;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  riskFactors: {
    financial: RiskFactor;
    operational: RiskFactor;
    compliance: RiskFactor;
    geographic: RiskFactor;
    reputational: RiskFactor;
  };
  
  mitigationStrategies: string[];
  reviewDate: Date;
  assessedBy: string;
  notes?: string;
}

export interface RiskFactor {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  impact: string;
  likelihood: string;
}

export interface SupplierOnboardingChecklist {
  supplierId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  completionPercentage: number;
  
  steps: OnboardingStep[];
  
  assignedTo?: string;
  startDate?: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;
  notes?: string;
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  completedBy?: string;
  documents?: OnboardingDocument[];
  notes?: string;
}

export interface OnboardingDocument {
  id: string;
  name: string;
  type: string;
  required: boolean;
  status: 'pending' | 'received' | 'approved' | 'rejected';
  uploadedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  fileUrl?: string;
  rejectionReason?: string;
}

// Extended Filter Types
export interface AdvancedSupplierFilters extends SupplierFilters {
  category?: string;
  riskLevel?: string;
  performanceRating?: {
    min?: number;
    max?: number;
  };
  paymentTermsRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  accountManagerId?: string;
  complianceStatus?: string;
  certificationRequired?: boolean;
  lastPaymentDateRange?: {
    from?: string;
    to?: string;
  };
  averagePaymentDaysRange?: {
    min?: number;
    max?: number;
  };
}

// Extended Summary Types
export interface AdvancedSupplierSummary extends SupplierSummary {
  // Risk Distribution
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  // Performance Distribution
  performanceDistribution: {
    excellent: number; // 4.5-5.0
    good: number; // 3.5-4.4
    average: number; // 2.5-3.4
    poor: number; // 1.0-2.4
    unrated: number;
  };
  
  // Compliance Status
  complianceDistribution: {
    compliant: number;
    nonCompliant: number;
    pendingReview: number;
  };
  
  // Integration Status
  integrationStats: {
    posIntegrationEnabled: number;
    autoOrderingEnabled: number;
    accountingIntegrationEnabled: number;
  };
  
  // Top Performers
  topPerformers: {
    bySpend: SupplierBillingSummary[];
    byRating: SupplierBillingSummary[];
    byReliability: SupplierBillingSummary[];
  };
  
  // Alerts and Notifications
  activeAlerts: {
    paymentOverdue: number;
    contractExpiring: number;
    certificationExpiring: number;
    performanceIssues: number;
    complianceIssues: number;
  };
}

// Supporting Interfaces for Advanced Features
export interface InvoiceAttachment {
  id: string;
  invoiceId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface PaymentAttachment {
  id: string;
  paymentId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface OCRData {
  invoiceNumber?: string;
  supplierName?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  taxAmount?: number;
  lineItems?: OCRLineItem[];
  confidence: number;
  processedAt: Date;
  rawData?: any;
}

export interface OCRLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  type: 'payment_due_soon' | 'payment_overdue' | 'final_notice';
  sentAt: Date;
  sentTo: string[];
  templateUsed: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'bounced';
  openedAt?: Date;
  clickedAt?: Date;
}

export interface InvoiceAuditEntry {
  id: string;
  invoiceId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

// Extended Create/Update Data Types
export interface CreateAdvancedInvoiceData extends CreateInvoiceData {
  // Approval workflow
  requiresApproval?: boolean;
  approvalWorkflowId?: string;
  
  // Early payment discount
  earlyPaymentDiscount?: {
    percentage: number;
    daysFromInvoice: number;
  };
  
  // Late payment penalty
  latePaymentPenalty?: {
    percentage: number;
    daysAfterDue: number;
  };
  
  // Document attachments
  attachments?: File[];
  
  // Integration settings
  syncToAccounting?: boolean;
  accountingAccountId?: string;
  
  // Notification settings
  sendNotifications?: boolean;
  customReminderSchedule?: ReminderSchedule[];
}

export interface CreateAdvancedPaymentData extends CreatePaymentData {
  // Banking details
  bankAccountId?: string;
  bankTransactionId?: string;
  
  // Processing details
  processingFee?: number;
  exchangeRate?: number;
  originalCurrency?: string;
  originalAmount?: number;
  
  // Approval
  requiresApproval?: boolean;
  
  // Discounts and adjustments
  earlyPaymentDiscount?: number;
  adjustmentAmount?: number;
  adjustmentReason?: string;
  
  // Document attachments
  attachments?: File[];
  
  // Integration settings
  syncToAccounting?: boolean;
  syncToBanking?: boolean;
}

export interface ReminderSchedule {
  daysBeforeDue: number;
  templateId: string;
  recipients: string[];
}

// Advanced Analytics Types
export interface SupplierPaymentAnalytics {
  supplierId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Payment Timing
  averageDaysToPayment: number;
  medianDaysToPayment: number;
  onTimePaymentRate: number;
  earlyPaymentRate: number;
  latePaymentRate: number;
  
  // Payment Amounts
  totalPaid: number;
  averagePaymentAmount: number;
  largestPayment: number;
  smallestPayment: number;
  
  // Discounts and Penalties
  totalEarlyPaymentDiscounts: number;
  totalLatePaymentPenalties: number;
  discountUtilizationRate: number;
  
  // Payment Methods
  paymentMethodDistribution: Record<string, number>;
  preferredPaymentMethod: string;
  
  // Trends
  paymentTrend: 'improving' | 'stable' | 'declining';
  volumeTrend: 'increasing' | 'stable' | 'decreasing';
  
  // Predictions
  predictedNextPaymentDate?: Date;
  riskOfLatePayment: number; // 0-100 percentage
  
  calculatedAt: Date;
}

export interface CashFlowProjection {
  supplierId?: string; // if null, represents all suppliers
  projectionDate: Date;
  
  // Projected Inflows (payments to suppliers)
  projectedPayments: ProjectedPayment[];
  totalProjectedPayments: number;
  
  // By time periods
  next7Days: number;
  next30Days: number;
  next60Days: number;
  next90Days: number;
  
  // By confidence level
  highConfidence: number; // 90%+ probability
  mediumConfidence: number; // 70-89% probability
  lowConfidence: number; // 50-69% probability
  
  // Seasonal adjustments
  seasonalityFactor: number;
  adjustedProjection: number;
  
  calculatedAt: Date;
  lastUpdated: Date;
}

export interface ProjectedPayment {
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  projectedPaymentDate: Date;
  confidence: number; // 0-100 percentage
  daysFromDue: number;
  paymentProbability: number;
  riskFactors: string[];
}

// Export error types for easy importing
export * from './errors';