// Error Types for Advanced Features

// Base Error Interface
export interface BaseError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  userId?: string;
  context?: Record<string, any>;
}

// Accounting Integration Errors
export class AccountingIntegrationError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'AccountingIntegrationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface AccountingError extends BaseError {
  type: 'accounting';
  subType: AccountingErrorType;
  accountId?: string;
  journalEntryId?: string;
  integrationId?: string;
}

export type AccountingErrorType = 
  | 'journal_entry_creation_failed'
  | 'account_mapping_error'
  | 'reconciliation_failed'
  | 'external_system_connection_failed'
  | 'sync_failed'
  | 'validation_error'
  | 'permission_denied'
  | 'duplicate_entry'
  | 'balance_mismatch'
  | 'chart_of_accounts_error';

// Reporting Errors
export class ReportingError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'ReportingError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface ReportError extends BaseError {
  type: 'reporting';
  subType: ReportingErrorType;
  reportId?: string;
  reportType?: string;
  executionId?: string;
}

export type ReportingErrorType = 
  | 'report_generation_failed'
  | 'data_source_unavailable'
  | 'invalid_parameters'
  | 'export_failed'
  | 'schedule_failed'
  | 'template_not_found'
  | 'insufficient_data'
  | 'timeout_error'
  | 'memory_limit_exceeded'
  | 'permission_denied'
  | 'invalid_date_range'
  | 'calculation_error';

// POS Integration Errors
export class POSIntegrationError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'POSIntegrationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface POSError extends BaseError {
  type: 'pos_integration';
  subType: POSErrorType;
  productId?: string;
  stockAlertId?: string;
  purchaseOrderId?: string;
  integrationId?: string;
}

export type POSErrorType = 
  | 'inventory_sync_failed'
  | 'stock_alert_creation_failed'
  | 'auto_purchase_order_failed'
  | 'supplier_mapping_error'
  | 'api_connection_failed'
  | 'invalid_product_data'
  | 'stock_level_mismatch'
  | 'supplier_not_found'
  | 'insufficient_stock_data'
  | 'reorder_calculation_failed'
  | 'webhook_processing_failed'
  | 'rate_limit_exceeded';

// Notification Errors
export class NotificationError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'NotificationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface NotificationErrorDetails extends BaseError {
  type: 'notification';
  subType: NotificationErrorType;
  notificationId?: string;
  templateId?: string;
  recipientEmail?: string;
  batchId?: string;
}

export type NotificationErrorType = 
  | 'template_not_found'
  | 'template_rendering_failed'
  | 'invalid_recipient'
  | 'delivery_failed'
  | 'smtp_connection_failed'
  | 'rate_limit_exceeded'
  | 'bounce_detected'
  | 'spam_complaint'
  | 'unsubscribed_recipient'
  | 'invalid_template_variables'
  | 'scheduling_failed'
  | 'batch_processing_failed';

// Supplier Billing Errors
export class SupplierBillingError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'SupplierBillingError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface SupplierBillingErrorDetails extends BaseError {
  type: 'supplier_billing';
  subType: SupplierBillingErrorType;
  supplierId?: string;
  invoiceId?: string;
  paymentId?: string;
  purchaseOrderId?: string;
}

export type SupplierBillingErrorType = 
  | 'supplier_not_found'
  | 'invoice_creation_failed'
  | 'payment_processing_failed'
  | 'duplicate_invoice'
  | 'invalid_payment_amount'
  | 'credit_limit_exceeded'
  | 'payment_terms_violation'
  | 'supplier_inactive'
  | 'invoice_already_paid'
  | 'insufficient_data'
  | 'validation_failed'
  | 'workflow_error';

// System Errors
export class SystemError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export interface SystemErrorDetails extends BaseError {
  type: 'system';
  subType: SystemErrorType;
  serviceId?: string;
  operationId?: string;
}

export type SystemErrorType = 
  | 'database_connection_failed'
  | 'external_api_unavailable'
  | 'configuration_error'
  | 'authentication_failed'
  | 'authorization_failed'
  | 'resource_not_found'
  | 'service_unavailable'
  | 'timeout_error'
  | 'memory_limit_exceeded'
  | 'disk_space_full'
  | 'network_error'
  | 'unknown_error';

// Validation Errors
export interface ValidationError extends BaseError {
  type: 'validation';
  field: string;
  value: any;
  constraint: string;
  expectedFormat?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

// Error Response Types
export interface ErrorResponse {
  success: false;
  error: {
    type: string;
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    validationErrors?: ValidationError[];
  };
  metadata?: {
    version: string;
    environment: string;
    correlationId?: string;
  };
}

export interface ErrorLog {
  id: string;
  type: string;
  subType: string;
  code: string;
  message: string;
  details?: any;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  stackTrace?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  severity: ErrorSeverity;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error Handler Configuration
export interface ErrorHandlerConfig {
  logErrors: boolean;
  notifyAdmins: boolean;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // milliseconds
  enableStackTrace: boolean;
  sensitiveFields: string[]; // fields to mask in logs
  errorReporting: {
    enabled: boolean;
    service: 'sentry' | 'bugsnag' | 'custom';
    apiKey?: string;
    environment: string;
  };
}

// Error Recovery Strategies
export interface ErrorRecoveryStrategy {
  errorType: string;
  strategy: RecoveryStrategyType;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: string;
  escalationRules: EscalationRule[];
}

export type RecoveryStrategyType = 
  | 'retry'
  | 'fallback'
  | 'circuit_breaker'
  | 'queue_for_manual_review'
  | 'ignore'
  | 'escalate';

export interface EscalationRule {
  condition: string; // e.g., "attempts > 3"
  action: 'notify_admin' | 'create_ticket' | 'disable_service' | 'switch_to_fallback';
  recipients?: string[];
  message?: string;
}

// Error Statistics
export interface ErrorStatistics {
  period: {
    startDate: string;
    endDate: string;
  };
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByService: Record<string, number>;
  topErrors: TopError[];
  errorTrends: ErrorTrend[];
  resolutionMetrics: ResolutionMetrics;
}

export interface TopError {
  type: string;
  code: string;
  message: string;
  count: number;
  lastOccurrence: string;
  averageResolutionTime?: number;
}

export interface ErrorTrend {
  date: string;
  count: number;
  severity: ErrorSeverity;
  type: string;
}

export interface ResolutionMetrics {
  totalResolved: number;
  averageResolutionTime: number; // in minutes
  resolutionRate: number; // percentage
  escalationRate: number; // percentage
  autoResolvedCount: number;
  manualResolvedCount: number;
}