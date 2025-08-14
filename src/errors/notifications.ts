import { BaseError, ErrorCategory } from './base';

/**
 * Base class for all notification errors
 */
export abstract class NotificationError extends BaseError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message, code, statusCode, true, {
      ...context,
      category: ErrorCategory.INTEGRATION,
      module: 'notifications'
    });
  }
}

/**
 * Error thrown when notification template processing fails
 */
export class NotificationTemplateError extends NotificationError {
  public readonly templateId: string;
  public readonly templateType: string;

  constructor(message: string, templateId: string, templateType: string, context?: Record<string, any>) {
    super(message, 'NOTIFICATION_TEMPLATE_ERROR', 422, {
      ...context,
      templateId,
      templateType
    });
    this.templateId = templateId;
    this.templateType = templateType;
  }
}

/**
 * Error thrown when notification scheduling fails
 */
export class NotificationSchedulingError extends NotificationError {
  public readonly notificationType: string;
  public readonly scheduledFor: Date;

  constructor(message: string, notificationType: string, scheduledFor: Date, context?: Record<string, any>) {
    super(message, 'NOTIFICATION_SCHEDULING_FAILED', 422, {
      ...context,
      notificationType,
      scheduledFor: scheduledFor.toISOString()
    });
    this.notificationType = notificationType;
    this.scheduledFor = scheduledFor;
  }
}

/**
 * Error thrown when notification delivery fails
 */
export class NotificationDeliveryError extends NotificationError {
  public readonly deliveryChannel: string;
  public readonly recipient: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    deliveryChannel: string,
    recipient: string,
    retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message, 'NOTIFICATION_DELIVERY_FAILED', 502, {
      ...context,
      deliveryChannel,
      recipient,
      retryable
    });
    this.deliveryChannel = deliveryChannel;
    this.recipient = recipient;
    this.retryable = retryable;
  }
}

/**
 * Error thrown when email service is unavailable
 */
export class EmailServiceUnavailableError extends NotificationError {
  public readonly provider: string;

  constructor(message: string, provider: string, context?: Record<string, any>) {
    super(message, 'EMAIL_SERVICE_UNAVAILABLE', 503, {
      ...context,
      provider
    });
    this.provider = provider;
  }
}

/**
 * Error thrown when notification template variables are invalid
 */
export class NotificationTemplateVariableError extends NotificationError {
  public readonly missingVariables: string[];
  public readonly invalidVariables: string[];

  constructor(
    message: string,
    missingVariables: string[] = [],
    invalidVariables: string[] = [],
    context?: Record<string, any>
  ) {
    super(message, 'NOTIFICATION_TEMPLATE_VARIABLE_ERROR', 400, {
      ...context,
      missingVariables,
      invalidVariables
    });
    this.missingVariables = missingVariables;
    this.invalidVariables = invalidVariables;
  }
}

/**
 * Error thrown when reminder rule configuration is invalid
 */
export class ReminderRuleError extends NotificationError {
  public readonly ruleId: string;
  public readonly ruleType: string;

  constructor(message: string, ruleId: string, ruleType: string, context?: Record<string, any>) {
    super(message, 'REMINDER_RULE_ERROR', 400, {
      ...context,
      ruleId,
      ruleType
    });
    this.ruleId = ruleId;
    this.ruleType = ruleType;
  }
}

/**
 * Error thrown when notification rate limit is exceeded
 */
export class NotificationRateLimitError extends NotificationError {
  public readonly limit: number;
  public readonly resetTime: Date;

  constructor(message: string, limit: number, resetTime: Date, context?: Record<string, any>) {
    super(message, 'NOTIFICATION_RATE_LIMIT_EXCEEDED', 429, {
      ...context,
      limit,
      resetTime: resetTime.toISOString()
    });
    this.limit = limit;
    this.resetTime = resetTime;
  }
}