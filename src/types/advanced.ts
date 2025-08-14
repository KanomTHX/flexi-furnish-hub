// Advanced Features Type Definitions Index
// This file exports all types related to advanced supplier billing features

// Accounting Integration Types
export * from './accounting';

// Advanced Reporting Types  
export * from './reports';

// POS Integration Types
export * from './pos';

// Notification System Types
export * from './notifications';

// Error Handling Types
export * from './errors';

// Extended Supplier Types
export * from './supplier';

// Re-export commonly used base types from their respective modules
export type {
  // Date and time utilities
  DateRange,
} from './reports';

export type {
  // Accounting types
  AccountingPeriod,
  SyncResult,
  AccountingSystemIntegration,
} from './accounting';

export type {
  // POS Integration types
  StockAlert,
  AutoPurchaseOrder,
  POSIntegrationConfig,
  IntegrationHealthCheck,
} from './pos';

export type {
  // Notification system
  NotificationTemplate,
  ScheduledNotification,
  NotificationRule,
  NotificationFilters,
} from './notifications';

export type {
  // Error handling
  BaseError,
  ErrorResponse,
  ValidationResult,
} from './errors';

export type {
  // Reporting types
  ReportFilter,
  SupplierPerformanceMetrics,
} from './reports';

export type {
  // Advanced supplier features
  AdvancedSupplierFilters,
  SupplierPaymentAnalytics,
  CashFlowProjection,
  SupplierPerformanceSnapshot,
  SupplierRiskAssessment,
  SupplierOnboardingChecklist,
} from './supplier';

// Type guards for runtime type checking
export const isAccountingError = (error: any): error is import('./errors').AccountingError => {
  return error && error.type === 'accounting';
};

export const isReportingError = (error: any): error is import('./errors').ReportError => {
  return error && error.type === 'reporting';
};

export const isPOSError = (error: any): error is import('./errors').POSError => {
  return error && error.type === 'pos_integration';
};

export const isNotificationError = (error: any): error is import('./errors').NotificationErrorDetails => {
  return error && error.type === 'notification';
};

export const isSupplierBillingError = (error: any): error is import('./errors').SupplierBillingErrorDetails => {
  return error && error.type === 'supplier_billing';
};

// Utility types for advanced features
export type AdvancedFeatureModule = 'accounting' | 'reporting' | 'pos_integration' | 'notifications';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending' | 'syncing';

export type PerformanceRating = 1 | 2 | 3 | 4 | 5;

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'increasing' | 'decreasing';

// Configuration types for advanced features
export interface AdvancedFeaturesConfig {
  accounting: {
    enabled: boolean;
    autoCreateJournalEntries: boolean;
    defaultChartOfAccounts: string;
    reconciliationFrequency: 'daily' | 'weekly' | 'monthly';
  };
  reporting: {
    enabled: boolean;
    cacheReports: boolean;
    maxReportHistory: number;
    defaultExportFormat: 'pdf' | 'excel' | 'csv';
  };
  posIntegration: {
    enabled: boolean;
    autoCreatePurchaseOrders: boolean;
    stockAlertThreshold: number;
    syncFrequency: 'real_time' | 'hourly' | 'daily';
  };
  notifications: {
    enabled: boolean;
    defaultLanguage: string;
    maxDailyNotifications: number;
    retryAttempts: number;
  };
}

// API response wrapper types
export interface AdvancedAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: import('./errors').BaseError;
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
    executionTime: number;
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Event types for advanced features
export interface AdvancedFeatureEvent {
  id: string;
  type: string;
  module: AdvancedFeatureModule;
  entityId: string;
  entityType: string;
  data: any;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

// Webhook payload types
export interface WebhookPayload {
  event: AdvancedFeatureEvent;
  signature: string;
  timestamp: string;
  version: string;
}