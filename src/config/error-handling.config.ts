import { ErrorSeverity, ErrorCategory } from '../errors/base';
import { 
  ErrorLoggingConfig, 
  ErrorNotificationConfig, 
  NotificationChannel, 
  Administrator,
  EscalationRule,
  NotificationTemplate 
} from '../services/error-notification.service';

/**
 * Default error logging configuration
 */
export const defaultErrorLoggingConfig: ErrorLoggingConfig = {
  enableConsoleLogging: true,
  enableDatabaseLogging: true,
  enableExternalLogging: false,
  logLevel: ErrorSeverity.MEDIUM,
  maxLogEntries: 10000,
  retentionDays: 90,
  externalLogEndpoint: process.env.EXTERNAL_LOG_ENDPOINT,
  externalLogApiKey: process.env.EXTERNAL_LOG_API_KEY
};

/**
 * Default notification templates
 */
export const defaultNotificationTemplates: NotificationTemplate[] = [
  // Email templates
  {
    id: 'email_critical',
    name: 'Critical Error Email',
    channel: NotificationChannel.EMAIL,
    severity: ErrorSeverity.CRITICAL,
    subject: '🚨 CRITICAL ERROR - {{errorCode}} - Immediate Action Required',
    body: `
CRITICAL ERROR ALERT

An critical error has occurred in the Supplier Billing system that requires immediate attention.

Error Details:
- Error Code: {{errorCode}}
- Message: {{errorMessage}}
- Module: {{module}}
- Timestamp: {{timestamp}}

Context:
{{context}}

This error may impact system functionality and requires immediate investigation.

Please check the system logs and take appropriate action.

---
Supplier Billing System
Automated Error Notification
    `.trim(),
    variables: ['errorCode', 'errorMessage', 'module', 'timestamp', 'context']
  },
  {
    id: 'email_high',
    name: 'High Priority Error Email',
    channel: NotificationChannel.EMAIL,
    severity: ErrorSeverity.HIGH,
    subject: '⚠️ High Priority Error - {{errorCode}}',
    body: `
HIGH PRIORITY ERROR

A high priority error has occurred in the Supplier Billing system.

Error Details:
- Error Code: {{errorCode}}
- Message: {{errorMessage}}
- Module: {{module}}
- Timestamp: {{timestamp}}

Context:
{{context}}

Please review and address this error when possible.

---
Supplier Billing System
Automated Error Notification
    `.trim(),
    variables: ['errorCode', 'errorMessage', 'module', 'timestamp', 'context']
  },
  {
    id: 'email_medium',
    name: 'Medium Priority Error Email',
    channel: NotificationChannel.EMAIL,
    severity: ErrorSeverity.MEDIUM,
    subject: 'System Error Notification - {{errorCode}}',
    body: `
SYSTEM ERROR NOTIFICATION

An error has occurred in the Supplier Billing system.

Error Details:
- Error Code: {{errorCode}}
- Message: {{errorMessage}}
- Module: {{module}}
- Timestamp: {{timestamp}}

Context:
{{context}}

This error has been logged for review.

---
Supplier Billing System
Automated Error Notification
    `.trim(),
    variables: ['errorCode', 'errorMessage', 'module', 'timestamp', 'context']
  },
  // SMS templates
  {
    id: 'sms_critical',
    name: 'Critical Error SMS',
    channel: NotificationChannel.SMS,
    severity: ErrorSeverity.CRITICAL,
    subject: 'CRITICAL ERROR',
    body: 'CRITICAL ERROR in Supplier Billing: {{errorCode}} - {{errorMessage}}. Check system immediately.',
    variables: ['errorCode', 'errorMessage']
  },
  {
    id: 'sms_high',
    name: 'High Priority Error SMS',
    channel: NotificationChannel.SMS,
    severity: ErrorSeverity.HIGH,
    subject: 'High Priority Error',
    body: 'High priority error in Supplier Billing: {{errorCode}} - {{errorMessage}}. Please review.',
    variables: ['errorCode', 'errorMessage']
  },
  // Slack templates
  {
    id: 'slack_critical',
    name: 'Critical Error Slack',
    channel: NotificationChannel.SLACK,
    severity: ErrorSeverity.CRITICAL,
    subject: 'Critical Error Alert',
    body: `
🚨 **CRITICAL ERROR ALERT** 🚨

**Error Code:** {{errorCode}}
**Message:** {{errorMessage}}
**Module:** {{module}}
**Time:** {{timestamp}}

**Context:**
\`\`\`
{{context}}
\`\`\`

@channel This requires immediate attention!
    `.trim(),
    variables: ['errorCode', 'errorMessage', 'module', 'timestamp', 'context']
  },
  {
    id: 'slack_high',
    name: 'High Priority Error Slack',
    channel: NotificationChannel.SLACK,
    severity: ErrorSeverity.HIGH,
    subject: 'High Priority Error',
    body: `
⚠️ **High Priority Error**

**Error Code:** {{errorCode}}
**Message:** {{errorMessage}}
**Module:** {{module}}
**Time:** {{timestamp}}

**Context:**
\`\`\`
{{context}}
\`\`\`
    `.trim(),
    variables: ['errorCode', 'errorMessage', 'module', 'timestamp', 'context']
  }
];

/**
 * Default escalation rules
 */
export const defaultEscalationRules: EscalationRule[] = [
  {
    id: 'critical_errors',
    name: 'Critical Error Escalation',
    conditions: {
      severity: [ErrorSeverity.CRITICAL],
      modules: [],
      errorCodes: [],
      frequency: {
        count: 1,
        periodMs: 0 // Immediate
      }
    },
    actions: {
      notifyAdministrators: ['admin_primary', 'admin_secondary'],
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.SLACK],
      escalateAfterMs: 300000, // 5 minutes
      escalateToAdministrators: ['admin_manager']
    }
  },
  {
    id: 'accounting_integration_failures',
    name: 'Accounting Integration Failure Escalation',
    conditions: {
      severity: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: ['accounting'],
      errorCodes: ['EXTERNAL_ACCOUNTING_SYSTEM_ERROR', 'JOURNAL_ENTRY_CREATION_FAILED'],
      frequency: {
        count: 3,
        periodMs: 900000 // 15 minutes
      }
    },
    actions: {
      notifyAdministrators: ['admin_accounting', 'admin_primary'],
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      escalateAfterMs: 600000, // 10 minutes
      escalateToAdministrators: ['admin_manager']
    }
  },
  {
    id: 'pos_integration_failures',
    name: 'POS Integration Failure Escalation',
    conditions: {
      severity: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: ['pos'],
      errorCodes: ['INVENTORY_SYNC_FAILED', 'POS_SYSTEM_UNAVAILABLE'],
      frequency: {
        count: 5,
        periodMs: 1800000 // 30 minutes
      }
    },
    actions: {
      notifyAdministrators: ['admin_operations', 'admin_primary'],
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      escalateAfterMs: 900000, // 15 minutes
      escalateToAdministrators: ['admin_manager']
    }
  },
  {
    id: 'notification_failures',
    name: 'Notification System Failure Escalation',
    conditions: {
      severity: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: ['notifications'],
      errorCodes: ['NOTIFICATION_DELIVERY_FAILED', 'EMAIL_SERVICE_UNAVAILABLE'],
      frequency: {
        count: 10,
        periodMs: 3600000 // 1 hour
      }
    },
    actions: {
      notifyAdministrators: ['admin_primary'],
      channels: [NotificationChannel.SLACK], // Use Slack if email is failing
      escalateAfterMs: 1800000, // 30 minutes
      escalateToAdministrators: ['admin_manager']
    }
  }
];

/**
 * Default error notification configuration
 */
export const defaultErrorNotificationConfig: ErrorNotificationConfig = {
  enabled: true,
  rateLimitPerHour: 50,
  batchingEnabled: true,
  batchingIntervalMs: 300000, // 5 minutes
  maxBatchSize: 10,
  escalationRules: defaultEscalationRules,
  templates: defaultNotificationTemplates
};

/**
 * Default administrators (should be configured per environment)
 */
export const defaultAdministrators: Administrator[] = [
  {
    id: 'admin_primary',
    name: 'Primary Administrator',
    email: process.env.ADMIN_PRIMARY_EMAIL || 'admin@company.com',
    phone: process.env.ADMIN_PRIMARY_PHONE,
    slackUserId: process.env.ADMIN_PRIMARY_SLACK,
    role: 'System Administrator',
    isActive: true,
    notificationPreferences: {
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      severityLevels: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: [],
      quietHours: {
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    }
  },
  {
    id: 'admin_secondary',
    name: 'Secondary Administrator',
    email: process.env.ADMIN_SECONDARY_EMAIL || 'admin2@company.com',
    phone: process.env.ADMIN_SECONDARY_PHONE,
    slackUserId: process.env.ADMIN_SECONDARY_SLACK,
    role: 'System Administrator',
    isActive: true,
    notificationPreferences: {
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
      severityLevels: [ErrorSeverity.CRITICAL],
      modules: [],
      quietHours: {
        start: '23:00',
        end: '07:00',
        timezone: 'UTC'
      }
    }
  },
  {
    id: 'admin_accounting',
    name: 'Accounting Administrator',
    email: process.env.ADMIN_ACCOUNTING_EMAIL || 'accounting-admin@company.com',
    role: 'Accounting Administrator',
    isActive: true,
    notificationPreferences: {
      channels: [NotificationChannel.EMAIL],
      severityLevels: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: ['accounting'],
      quietHours: {
        start: '18:00',
        end: '09:00',
        timezone: 'UTC'
      }
    }
  },
  {
    id: 'admin_operations',
    name: 'Operations Administrator',
    email: process.env.ADMIN_OPERATIONS_EMAIL || 'operations-admin@company.com',
    role: 'Operations Administrator',
    isActive: true,
    notificationPreferences: {
      channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
      severityLevels: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      modules: ['pos', 'notifications'],
      quietHours: {
        start: '20:00',
        end: '08:00',
        timezone: 'UTC'
      }
    }
  },
  {
    id: 'admin_manager',
    name: 'IT Manager',
    email: process.env.ADMIN_MANAGER_EMAIL || 'it-manager@company.com',
    phone: process.env.ADMIN_MANAGER_PHONE,
    slackUserId: process.env.ADMIN_MANAGER_SLACK,
    role: 'IT Manager',
    isActive: true,
    notificationPreferences: {
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
      severityLevels: [ErrorSeverity.CRITICAL],
      modules: [],
      quietHours: {
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    }
  }
];

/**
 * Environment-specific configuration
 */
export const getErrorHandlingConfig = (environment: string = 'development') => {
  const baseConfig = {
    logging: defaultErrorLoggingConfig,
    notification: defaultErrorNotificationConfig,
    administrators: defaultAdministrators
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enableConsoleLogging: false,
          enableDatabaseLogging: true,
          enableExternalLogging: true,
          logLevel: ErrorSeverity.MEDIUM
        },
        notification: {
          ...baseConfig.notification,
          enabled: true,
          rateLimitPerHour: 100
        }
      };

    case 'staging':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enableConsoleLogging: true,
          enableDatabaseLogging: true,
          enableExternalLogging: false,
          logLevel: ErrorSeverity.LOW
        },
        notification: {
          ...baseConfig.notification,
          enabled: true,
          rateLimitPerHour: 20
        }
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enableConsoleLogging: true,
          enableDatabaseLogging: false,
          enableExternalLogging: false,
          logLevel: ErrorSeverity.LOW
        },
        notification: {
          ...baseConfig.notification,
          enabled: false,
          rateLimitPerHour: 5
        }
      };
  }
};

/**
 * Module-specific error handling configuration
 */
export const moduleErrorConfigs = {
  accounting: {
    retryAttempts: 3,
    retryDelayMs: 2000,
    circuitBreakerThreshold: 5,
    enableRecovery: true,
    criticalErrorCodes: [
      'EXTERNAL_ACCOUNTING_SYSTEM_ERROR',
      'JOURNAL_ENTRY_POSTING_FAILED',
      'RECONCILIATION_FAILED'
    ]
  },
  reporting: {
    retryAttempts: 2,
    retryDelayMs: 5000,
    circuitBreakerThreshold: 3,
    enableRecovery: true,
    criticalErrorCodes: [
      'REPORT_DATA_TOO_LARGE',
      'ANALYTICS_CALCULATION_FAILED'
    ]
  },
  pos: {
    retryAttempts: 5,
    retryDelayMs: 1000,
    circuitBreakerThreshold: 10,
    enableRecovery: true,
    criticalErrorCodes: [
      'POS_SYSTEM_UNAVAILABLE',
      'INVENTORY_DATA_INCONSISTENCY'
    ]
  },
  notifications: {
    retryAttempts: 3,
    retryDelayMs: 10000,
    circuitBreakerThreshold: 5,
    enableRecovery: true,
    criticalErrorCodes: [
      'EMAIL_SERVICE_UNAVAILABLE',
      'NOTIFICATION_RATE_LIMIT_EXCEEDED'
    ]
  }
};