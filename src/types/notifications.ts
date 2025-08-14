// Notification System Types

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  previewData?: Record<string, any>;
  isActive: boolean;
  isSystem: boolean; // system templates cannot be deleted
  language: string;
  version: number;
  tags: string[];
  description?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'payment_reminder'
  | 'overdue_notice'
  | 'monthly_statement'
  | 'invoice_received'
  | 'payment_confirmation'
  | 'contract_expiry'
  | 'stock_alert'
  | 'purchase_order_approval'
  | 'system_alert'
  | 'custom';

export type NotificationCategory = 
  | 'supplier_billing'
  | 'inventory'
  | 'accounting'
  | 'system'
  | 'marketing'
  | 'compliance';

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  format?: string; // for dates, numbers, etc.
  validation?: VariableValidation;
}

export interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: any[];
}

export interface ScheduledNotification {
  id: string;
  templateId: string;
  template?: NotificationTemplate;
  type: NotificationType;
  category: NotificationCategory;
  
  // Recipients
  recipientEmail: string;
  recipientName?: string;
  recipientId?: string; // supplier ID, customer ID, etc.
  recipientType: 'supplier' | 'customer' | 'employee' | 'admin' | 'external';
  
  // Content
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, any>;
  
  // Scheduling
  scheduledFor: string;
  timezone: string;
  priority: NotificationPriority;
  
  // Status and Tracking
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  
  // Related Data
  relatedEntityId?: string;
  relatedEntityType?: string;
  relatedData?: Record<string, any>;
  
  // Error Handling
  errorMessage?: string;
  errorCode?: string;
  retryAfter?: string;
  
  // Metadata
  tags: string[];
  campaignId?: string;
  batchId?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 
  | 'scheduled'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  
  // Trigger Conditions
  triggerEvent: TriggerEvent;
  conditions: NotificationCondition[];
  
  // Template and Recipients
  templateId: string;
  template?: NotificationTemplate;
  recipientRules: RecipientRule[];
  
  // Scheduling
  scheduleType: 'immediate' | 'delayed' | 'recurring';
  delay?: NotificationDelay;
  recurringSchedule?: RecurringSchedule;
  
  // Limits and Controls
  maxNotificationsPerDay?: number;
  maxNotificationsPerRecipient?: number;
  cooldownPeriod?: number; // minutes between notifications
  
  // Metadata
  tags: string[];
  category: NotificationCategory;
  priority: NotificationPriority;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TriggerEvent = 
  | 'invoice_created'
  | 'invoice_due_soon'
  | 'invoice_overdue'
  | 'payment_received'
  | 'stock_low'
  | 'stock_out'
  | 'purchase_order_created'
  | 'purchase_order_approved'
  | 'contract_expiring'
  | 'system_error'
  | 'custom_event';

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RecipientRule {
  type: 'specific' | 'role' | 'department' | 'dynamic';
  recipients: string[]; // email addresses, user IDs, or role names
  dynamicField?: string; // field to extract recipient from (e.g., 'supplier.email')
}

export interface NotificationDelay {
  amount: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  endDate?: string;
  maxOccurrences?: number;
}

export interface NotificationHistory {
  id: string;
  notificationId: string;
  notification?: ScheduledNotification;
  event: NotificationEvent;
  timestamp: string;
  details?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export type NotificationEvent = 
  | 'created'
  | 'scheduled'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'opened'
  | 'clicked'
  | 'unsubscribed'
  | 'complained'
  | 'failed'
  | 'cancelled';

export interface NotificationBatch {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  template?: NotificationTemplate;
  
  // Recipients
  totalRecipients: number;
  processedRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  
  // Status
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  
  // Settings
  priority: NotificationPriority;
  scheduleFor?: string;
  timezone: string;
  
  // Tracking
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  type: 'one_time' | 'recurring' | 'triggered';
  
  // Templates and Content
  templates: string[]; // template IDs
  segmentId?: string; // recipient segment
  
  // Scheduling
  startDate: string;
  endDate?: string;
  schedule?: RecurringSchedule;
  
  // Status and Metrics
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  
  // Performance Metrics
  openRate: number;
  clickRate: number;
  conversionRate: number;
  roi: number;
  
  // Metadata
  tags: string[];
  category: NotificationCategory;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId?: string;
  email: string;
  
  // Global Preferences
  isEnabled: boolean;
  preferredLanguage: string;
  timezone: string;
  
  // Channel Preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  
  // Category Preferences
  categoryPreferences: CategoryPreference[];
  
  // Frequency Limits
  maxDailyNotifications: number;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  quietDays?: number[]; // 0-6, Sunday = 0
  
  // Unsubscribe Info
  unsubscribedAt?: string;
  unsubscribeReason?: string;
  
  updatedAt: string;
}

export interface CategoryPreference {
  category: NotificationCategory;
  enabled: boolean;
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'disabled';
  types: NotificationType[];
}

export interface NotificationAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  
  // Volume Metrics
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  
  // Rate Metrics
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  
  // Performance by Category
  categoryMetrics: CategoryMetrics[];
  
  // Performance by Template
  templateMetrics: TemplateMetrics[];
  
  // Trends
  dailyMetrics: DailyMetrics[];
  
  // Top Performers
  topTemplates: TemplatePerformance[];
  topCampaigns: CampaignPerformance[];
}

export interface CategoryMetrics {
  category: NotificationCategory;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface TemplateMetrics {
  templateId: string;
  templateName: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface DailyMetrics {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  openRate: number;
  clickRate: number;
  totalSent: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  roi: number;
}

// API Response Types
export interface NotificationResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface NotificationListResponse {
  data: ScheduledNotification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NotificationTemplateListResponse {
  data: NotificationTemplate[];
  total: number;
  categories: NotificationCategory[];
  types: NotificationType[];
}

// Filter and Search Types
export interface NotificationFilters {
  status?: NotificationStatus[];
  type?: NotificationType[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  recipientEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  templateId?: string;
  campaignId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateFilters {
  type?: NotificationType[];
  category?: NotificationCategory[];
  isActive?: boolean;
  language?: string;
  search?: string;
  tags?: string[];
  createdBy?: string;
  limit?: number;
  offset?: number;
}