// Error Notification Service Types and Configurations

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook'
}

export interface ErrorLoggingConfig {
  enableConsoleLogging: boolean;
  enableDatabaseLogging: boolean;
  enableExternalLogging: boolean;
  logLevel: string;
  maxLogEntries: number;
  retentionDays: number;
  externalLogEndpoint?: string;
  externalLogApiKey?: string;
}

export interface ErrorNotificationConfig {
  enabled: boolean;
  rateLimitPerHour: number;
  batchingEnabled: boolean;
  batchingIntervalMs: number;
  maxBatchSize: number;
  escalationRules: EscalationRule[];
  templates: NotificationTemplate[];
}

export interface Administrator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  slackUserId?: string;
  role: string;
  isActive: boolean;
  notificationPreferences: {
    channels: NotificationChannel[];
    severityLevels: string[];
    modules: string[];
    quietHours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    severity: string[];
    modules: string[];
    errorCodes: string[];
    frequency: {
      count: number;
      periodMs: number;
    };
  };
  actions: {
    notifyAdministrators: string[];
    channels: NotificationChannel[];
    escalateAfterMs: number;
    escalateToAdministrators: string[];
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  severity: string;
  subject: string;
  body: string;
  variables: string[];
}