import { BaseError, ErrorSeverity, ErrorCategory } from '../errors/base';

/**
 * Notification channel types
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

/**
 * Administrator contact information
 */
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
    severityLevels: ErrorSeverity[];
    modules: string[];
    quietHours?: {
      start: string; // HH:mm format
      end: string;   // HH:mm format
      timezone: string;
    };
  };
}

/**
 * Error notification configuration
 */
export interface ErrorNotificationConfig {
  enabled: boolean;
  rateLimitPerHour: number;
  batchingEnabled: boolean;
  batchingIntervalMs: number;
  maxBatchSize: number;
  escalationRules: EscalationRule[];
  templates: NotificationTemplate[];
}

/**
 * Escalation rule for critical errors
 */
export interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    severity: ErrorSeverity[];
    modules: string[];
    errorCodes: string[];
    frequency: {
      count: number;
      periodMs: number;
    };
  };
  actions: {
    notifyAdministrators: string[]; // Administrator IDs
    channels: NotificationChannel[];
    escalateAfterMs?: number;
    escalateToAdministrators?: string[];
  };
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  severity: ErrorSeverity;
  subject: string;
  body: string;
  variables: string[];
}

/**
 * Notification delivery result
 */
export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  recipient: string;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

/**
 * Error notification batch
 */
interface ErrorNotificationBatch {
  errors: Array<{
    error: BaseError;
    context?: Record<string, any>;
    timestamp: Date;
  }>;
  administrators: Administrator[];
  scheduledFor: Date;
}

/**
 * Rate limiting tracker
 */
interface RateLimitTracker {
  count: number;
  resetTime: Date;
}

/**
 * Error notification service for administrators
 */
export class ErrorNotificationService {
  private config: ErrorNotificationConfig;
  private administrators: Map<string, Administrator> = new Map();
  private notificationBatches: ErrorNotificationBatch[] = [];
  private rateLimitTrackers: Map<string, RateLimitTracker> = new Map();
  private batchingTimer: NodeJS.Timeout | null = null;

  constructor(config: ErrorNotificationConfig) {
    this.config = config;
    this.startBatchingTimer();
  }

  /**
   * Register administrator for error notifications
   */
  registerAdministrator(administrator: Administrator): void {
    this.administrators.set(administrator.id, administrator);
  }

  /**
   * Remove administrator from notifications
   */
  unregisterAdministrator(administratorId: string): void {
    this.administrators.delete(administratorId);
  }

  /**
   * Update administrator notification preferences
   */
  updateAdministratorPreferences(
    administratorId: string,
    preferences: Administrator['notificationPreferences']
  ): void {
    const administrator = this.administrators.get(administratorId);
    if (administrator) {
      administrator.notificationPreferences = preferences;
      this.administrators.set(administratorId, administrator);
    }
  }

  /**
   * Notify administrators about an error
   */
  async notifyError(
    error: BaseError,
    context?: Record<string, any>,
    forceImmediate: boolean = false
  ): Promise<NotificationDeliveryResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    // Determine which administrators should be notified
    const relevantAdministrators = this.getRelevantAdministrators(error);
    
    if (relevantAdministrators.length === 0) {
      return [];
    }

    // Check if this should trigger immediate notification or be batched
    const shouldNotifyImmediately = forceImmediate || 
      error.statusCode >= 500 || 
      error.context?.severity === ErrorSeverity.CRITICAL ||
      this.shouldEscalate(error);

    if (shouldNotifyImmediately) {
      return await this.sendImmediateNotifications(error, relevantAdministrators, context);
    } else if (this.config.batchingEnabled) {
      this.addToBatch(error, relevantAdministrators, context);
      return [];
    } else {
      return await this.sendImmediateNotifications(error, relevantAdministrators, context);
    }
  }

  /**
   * Send critical error notification immediately
   */
  async notifyCriticalError(
    error: BaseError,
    context?: Record<string, any>
  ): Promise<NotificationDeliveryResult[]> {
    return await this.notifyError(error, context, true);
  }

  /**
   * Send system health alert
   */
  async notifySystemHealth(
    message: string,
    severity: ErrorSeverity,
    metrics?: Record<string, any>
  ): Promise<NotificationDeliveryResult[]> {
    const systemError = new (class extends BaseError {
      constructor() {
        super(message, 'SYSTEM_HEALTH_ALERT', 500, true, {
          category: ErrorCategory.SYSTEM,
          module: 'system_health',
          metrics
        });
      }
    })();

    return await this.notifyError(systemError, { systemHealth: true }, true);
  }

  /**
   * Get notification statistics
   */
  getNotificationStatistics(period: { startDate: Date; endDate: Date }): {
    totalNotifications: number;
    notificationsByChannel: Record<NotificationChannel, number>;
    notificationsBySeverity: Record<ErrorSeverity, number>;
    deliverySuccessRate: number;
    averageDeliveryTime: number;
  } {
    // This would typically query a database or log store
    // For now, return mock statistics
    return {
      totalNotifications: 0,
      notificationsByChannel: {
        [NotificationChannel.EMAIL]: 0,
        [NotificationChannel.SMS]: 0,
        [NotificationChannel.SLACK]: 0,
        [NotificationChannel.WEBHOOK]: 0,
        [NotificationChannel.IN_APP]: 0
      },
      notificationsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      deliverySuccessRate: 0,
      averageDeliveryTime: 0
    };
  }

  /**
   * Test notification delivery for an administrator
   */
  async testNotification(
    administratorId: string,
    channel: NotificationChannel
  ): Promise<NotificationDeliveryResult> {
    const administrator = this.administrators.get(administratorId);
    if (!administrator) {
      return {
        success: false,
        channel,
        recipient: administratorId,
        error: 'Administrator not found'
      };
    }

    const testError = new (class extends BaseError {
      constructor() {
        super('Test notification', 'TEST_NOTIFICATION', 200, true, {
          category: ErrorCategory.SYSTEM,
          module: 'test'
        });
      }
    })();

    const template = this.getNotificationTemplate(channel, ErrorSeverity.LOW);
    const message = this.formatNotificationMessage(testError, template, {});

    return await this.deliverNotification(administrator, channel, message);
  }

  /**
   * Get relevant administrators for an error
   */
  private getRelevantAdministrators(error: BaseError): Administrator[] {
    const relevantAdmins: Administrator[] = [];

    for (const admin of this.administrators.values()) {
      if (!admin.isActive) continue;

      const prefs = admin.notificationPreferences;
      
      // Check severity level
      if (!prefs.severityLevels.includes(this.getErrorSeverity(error))) {
        continue;
      }

      // Check module
      const errorModule = error.context?.module || 'unknown';
      if (prefs.modules.length > 0 && !prefs.modules.includes(errorModule)) {
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(admin)) {
        // Only notify for critical errors during quiet hours
        if (this.getErrorSeverity(error) !== ErrorSeverity.CRITICAL) {
          continue;
        }
      }

      relevantAdmins.push(admin);
    }

    return relevantAdmins;
  }

  /**
   * Send immediate notifications to administrators
   */
  private async sendImmediateNotifications(
    error: BaseError,
    administrators: Administrator[],
    context?: Record<string, any>
  ): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];
    const severity = this.getErrorSeverity(error);

    for (const admin of administrators) {
      // Check rate limiting
      if (this.isRateLimited(admin.id)) {
        results.push({
          success: false,
          channel: NotificationChannel.EMAIL, // Default channel for rate limit
          recipient: admin.email,
          error: 'Rate limited'
        });
        continue;
      }

      // Send notification via preferred channels
      for (const channel of admin.notificationPreferences.channels) {
        const template = this.getNotificationTemplate(channel, severity);
        const message = this.formatNotificationMessage(error, template, context);
        
        const result = await this.deliverNotification(admin, channel, message);
        results.push(result);

        // Update rate limiting
        this.updateRateLimit(admin.id);
      }
    }

    return results;
  }

  /**
   * Add error to notification batch
   */
  private addToBatch(
    error: BaseError,
    administrators: Administrator[],
    context?: Record<string, any>
  ): void {
    const scheduledFor = new Date(Date.now() + this.config.batchingIntervalMs);
    
    // Find existing batch or create new one
    let batch = this.notificationBatches.find(b => 
      b.scheduledFor.getTime() === scheduledFor.getTime() &&
      this.arraysEqual(b.administrators.map(a => a.id), administrators.map(a => a.id))
    );

    if (!batch) {
      batch = {
        errors: [],
        administrators,
        scheduledFor
      };
      this.notificationBatches.push(batch);
    }

    batch.errors.push({
      error,
      context,
      timestamp: new Date()
    });

    // If batch is full, send immediately
    if (batch.errors.length >= this.config.maxBatchSize) {
      this.sendBatchNotification(batch);
      this.notificationBatches = this.notificationBatches.filter(b => b !== batch);
    }
  }

  /**
   * Send batched notification
   */
  private async sendBatchNotification(batch: ErrorNotificationBatch): Promise<void> {
    const batchSummary = this.createBatchSummary(batch.errors);
    
    for (const admin of batch.administrators) {
      for (const channel of admin.notificationPreferences.channels) {
        const template = this.getBatchNotificationTemplate(channel);
        const message = this.formatBatchNotificationMessage(batchSummary, template);
        
        await this.deliverNotification(admin, channel, message);
        this.updateRateLimit(admin.id);
      }
    }
  }

  /**
   * Deliver notification via specific channel
   */
  private async deliverNotification(
    administrator: Administrator,
    channel: NotificationChannel,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    const startTime = Date.now();

    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmailNotification(administrator, message);
        
        case NotificationChannel.SMS:
          return await this.sendSMSNotification(administrator, message);
        
        case NotificationChannel.SLACK:
          return await this.sendSlackNotification(administrator, message);
        
        case NotificationChannel.WEBHOOK:
          return await this.sendWebhookNotification(administrator, message);
        
        case NotificationChannel.IN_APP:
          return await this.sendInAppNotification(administrator, message);
        
        default:
          return {
            success: false,
            channel,
            recipient: administrator.email,
            error: 'Unsupported notification channel'
          };
      }
    } catch (error) {
      return {
        success: false,
        channel,
        recipient: administrator.email,
        error: (error as Error).message
      };
    }
  }

  /**
   * Send email notification (placeholder implementation)
   */
  private async sendEmailNotification(
    administrator: Administrator,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    // This would integrate with actual email service
    console.log(`Sending email to ${administrator.email}: ${message.subject}`);
    
    return {
      success: true,
      channel: NotificationChannel.EMAIL,
      recipient: administrator.email,
      messageId: `email_${Date.now()}`,
      deliveredAt: new Date()
    };
  }

  /**
   * Send SMS notification (placeholder implementation)
   */
  private async sendSMSNotification(
    administrator: Administrator,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    if (!administrator.phone) {
      return {
        success: false,
        channel: NotificationChannel.SMS,
        recipient: administrator.phone || 'unknown',
        error: 'Phone number not available'
      };
    }

    // This would integrate with SMS service
    console.log(`Sending SMS to ${administrator.phone}: ${message.body}`);
    
    return {
      success: true,
      channel: NotificationChannel.SMS,
      recipient: administrator.phone,
      messageId: `sms_${Date.now()}`,
      deliveredAt: new Date()
    };
  }

  /**
   * Send Slack notification (placeholder implementation)
   */
  private async sendSlackNotification(
    administrator: Administrator,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    if (!administrator.slackUserId) {
      return {
        success: false,
        channel: NotificationChannel.SLACK,
        recipient: administrator.slackUserId || 'unknown',
        error: 'Slack user ID not available'
      };
    }

    // This would integrate with Slack API
    console.log(`Sending Slack message to ${administrator.slackUserId}: ${message.body}`);
    
    return {
      success: true,
      channel: NotificationChannel.SLACK,
      recipient: administrator.slackUserId,
      messageId: `slack_${Date.now()}`,
      deliveredAt: new Date()
    };
  }

  /**
   * Send webhook notification (placeholder implementation)
   */
  private async sendWebhookNotification(
    administrator: Administrator,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    // This would send HTTP POST to configured webhook URL
    console.log(`Sending webhook notification for ${administrator.id}: ${message.subject}`);
    
    return {
      success: true,
      channel: NotificationChannel.WEBHOOK,
      recipient: administrator.id,
      messageId: `webhook_${Date.now()}`,
      deliveredAt: new Date()
    };
  }

  /**
   * Send in-app notification (placeholder implementation)
   */
  private async sendInAppNotification(
    administrator: Administrator,
    message: { subject: string; body: string }
  ): Promise<NotificationDeliveryResult> {
    // This would store notification in database for in-app display
    console.log(`Creating in-app notification for ${administrator.id}: ${message.subject}`);
    
    return {
      success: true,
      channel: NotificationChannel.IN_APP,
      recipient: administrator.id,
      messageId: `inapp_${Date.now()}`,
      deliveredAt: new Date()
    };
  }

  /**
   * Get notification template for channel and severity
   */
  private getNotificationTemplate(channel: NotificationChannel, severity: ErrorSeverity): NotificationTemplate {
    const template = this.config.templates.find(t => 
      t.channel === channel && t.severity === severity
    );

    if (template) {
      return template;
    }

    // Return default template
    return {
      id: 'default',
      name: 'Default Template',
      channel,
      severity,
      subject: 'System Error Alert - {{errorCode}}',
      body: 'An error occurred in the system:\n\nError: {{errorMessage}}\nCode: {{errorCode}}\nTime: {{timestamp}}\nModule: {{module}}\n\nContext: {{context}}',
      variables: ['errorCode', 'errorMessage', 'timestamp', 'module', 'context']
    };
  }

  /**
   * Get batch notification template
   */
  private getBatchNotificationTemplate(channel: NotificationChannel): NotificationTemplate {
    return {
      id: 'batch',
      name: 'Batch Template',
      channel,
      severity: ErrorSeverity.MEDIUM,
      subject: 'System Error Summary - {{errorCount}} errors',
      body: 'Error Summary:\n\n{{errorSummary}}\n\nTotal Errors: {{errorCount}}\nTime Period: {{timePeriod}}',
      variables: ['errorCount', 'errorSummary', 'timePeriod']
    };
  }

  /**
   * Format notification message using template
   */
  private formatNotificationMessage(
    error: BaseError,
    template: NotificationTemplate,
    context?: Record<string, any>
  ): { subject: string; body: string } {
    const variables = {
      errorCode: error.code,
      errorMessage: error.message,
      timestamp: error.timestamp.toISOString(),
      module: error.context?.module || 'unknown',
      context: JSON.stringify(context || {}, null, 2)
    };

    let subject = template.subject;
    let body = template.body;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { subject, body };
  }

  /**
   * Format batch notification message
   */
  private formatBatchNotificationMessage(
    batchSummary: any,
    template: NotificationTemplate
  ): { subject: string; body: string } {
    const variables = {
      errorCount: batchSummary.totalErrors,
      errorSummary: batchSummary.summary,
      timePeriod: batchSummary.timePeriod
    };

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { subject, body };
  }

  /**
   * Create batch summary from errors
   */
  private createBatchSummary(errors: Array<{ error: BaseError; context?: Record<string, any>; timestamp: Date }>) {
    const errorCounts: Record<string, number> = {};
    const modules: Set<string> = new Set();
    let earliestTime = new Date();
    let latestTime = new Date(0);

    errors.forEach(({ error, timestamp }) => {
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
      modules.add(error.context?.module || 'unknown');
      
      if (timestamp < earliestTime) earliestTime = timestamp;
      if (timestamp > latestTime) latestTime = timestamp;
    });

    const summary = Object.entries(errorCounts)
      .map(([code, count]) => `${code}: ${count}`)
      .join('\n');

    return {
      totalErrors: errors.length,
      summary,
      timePeriod: `${earliestTime.toISOString()} - ${latestTime.toISOString()}`,
      modules: Array.from(modules)
    };
  }

  /**
   * Get error severity from BaseError
   */
  private getErrorSeverity(error: BaseError): ErrorSeverity {
    if (error.statusCode >= 500) return ErrorSeverity.CRITICAL;
    if (error.statusCode >= 400) return ErrorSeverity.HIGH;
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Check if administrator is in quiet hours
   */
  private isInQuietHours(administrator: Administrator): boolean {
    const quietHours = administrator.notificationPreferences.quietHours;
    if (!quietHours) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: quietHours.timezone 
    }).substring(0, 5);

    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  /**
   * Check if administrator is rate limited
   */
  private isRateLimited(administratorId: string): boolean {
    const tracker = this.rateLimitTrackers.get(administratorId);
    if (!tracker) return false;

    if (new Date() > tracker.resetTime) {
      this.rateLimitTrackers.delete(administratorId);
      return false;
    }

    return tracker.count >= this.config.rateLimitPerHour;
  }

  /**
   * Update rate limit for administrator
   */
  private updateRateLimit(administratorId: string): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    const tracker = this.rateLimitTrackers.get(administratorId);
    if (tracker && now < tracker.resetTime) {
      tracker.count++;
    } else {
      this.rateLimitTrackers.set(administratorId, {
        count: 1,
        resetTime
      });
    }
  }

  /**
   * Check if error should be escalated
   */
  private shouldEscalate(error: BaseError): boolean {
    // Check escalation rules
    for (const rule of this.config.escalationRules) {
      if (this.matchesEscalationRule(error, rule)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if error matches escalation rule
   */
  private matchesEscalationRule(error: BaseError, rule: EscalationRule): boolean {
    const severity = this.getErrorSeverity(error);
    const module = error.context?.module || 'unknown';

    return rule.conditions.severity.includes(severity) &&
           (rule.conditions.modules.length === 0 || rule.conditions.modules.includes(module)) &&
           (rule.conditions.errorCodes.length === 0 || rule.conditions.errorCodes.includes(error.code));
  }

  /**
   * Start batching timer
   */
  private startBatchingTimer(): void {
    if (!this.config.batchingEnabled) return;

    this.batchingTimer = setInterval(() => {
      const now = new Date();
      const batchesToSend = this.notificationBatches.filter(batch => batch.scheduledFor <= now);
      
      batchesToSend.forEach(batch => {
        this.sendBatchNotification(batch);
      });

      this.notificationBatches = this.notificationBatches.filter(batch => batch.scheduledFor > now);
    }, this.config.batchingIntervalMs);
  }

  /**
   * Stop batching timer
   */
  public stopBatchingTimer(): void {
    if (this.batchingTimer) {
      clearInterval(this.batchingTimer);
      this.batchingTimer = null;
    }
  }

  /**
   * Utility function to compare arrays
   */
  private arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopBatchingTimer();
    
    // Send any remaining batches
    this.notificationBatches.forEach(batch => {
      this.sendBatchNotification(batch);
    });
    
    this.notificationBatches = [];
  }
}