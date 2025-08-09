import { auditTrailService } from '@/services/auditTrailService';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  component?: string;
  data?: Record<string, any>;
  timestamp?: string;
  stackTrace?: string;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly userMessage: string;
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.SYSTEM_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {},
    userMessage?: string,
    code?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString()
    };
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.code = code || this.generateErrorCode();
    this.retryable = retryable;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    this.context.stackTrace = this.stack;
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.BUSINESS_LOGIC_ERROR:
        return 'This operation cannot be completed due to business rules.';
      case ErrorType.DATABASE_ERROR:
        return 'A database error occurred. Please try again later.';
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your connection and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT_ERROR:
        return 'This operation conflicts with existing data.';
      case ErrorType.EXTERNAL_SERVICE_ERROR:
        return 'An external service is temporarily unavailable.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  private generateErrorCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${this.type.substr(0, 3)}-${timestamp}-${random}`.toUpperCase();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      userMessage: this.userMessage,
      code: this.code,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

// Specific Error Classes
export class ValidationError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      context,
      userMessage || 'Please check your input and try again.',
      undefined,
      false
    );
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.BUSINESS_LOGIC_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      userMessage || 'This operation cannot be completed due to business rules.',
      undefined,
      false
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      context,
      userMessage || 'A database error occurred. Please try again later.',
      undefined,
      true
    );
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.NETWORK_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      userMessage || 'Network connection failed. Please check your connection and try again.',
      undefined,
      true
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      ErrorSeverity.HIGH,
      context,
      userMessage || 'Please log in to continue.',
      undefined,
      false
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.AUTHORIZATION_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      userMessage || 'You do not have permission to perform this action.',
      undefined,
      false
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.NOT_FOUND_ERROR,
      ErrorSeverity.LOW,
      context,
      userMessage || 'The requested resource was not found.',
      undefined,
      false
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context: ErrorContext = {}, userMessage?: string) {
    super(
      message,
      ErrorType.CONFLICT_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      userMessage || 'This operation conflicts with existing data.',
      undefined,
      false
    );
  }
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleError(error: Error | AppError, context: ErrorContext = {}): Promise<void> {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
      // Merge additional context
      appError.context = { ...appError.context, ...context };
    } else {
      // Convert regular Error to AppError
      appError = this.convertToAppError(error, context);
    }

    // Log the error
    this.logError(appError);

    // Send to audit trail for critical errors
    if (appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.HIGH) {
      try {
        await auditTrailService.logSystemError(appError, appError.context);
      } catch (auditError) {
        console.error('Failed to log error to audit trail:', auditError);
      }
    }

    // Send to external monitoring service (if configured)
    this.sendToMonitoring(appError);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', appError.toJSON());
    }
  }

  private convertToAppError(error: Error, context: ErrorContext): AppError {
    // Try to determine error type from error message or properties
    let errorType = ErrorType.SYSTEM_ERROR;
    let severity = ErrorSeverity.MEDIUM;

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      errorType = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.LOW;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (error.message.includes('database') || error.message.includes('sql')) {
      errorType = ErrorType.DATABASE_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('auth')) {
      errorType = ErrorType.AUTHENTICATION_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('not found')) {
      errorType = ErrorType.NOT_FOUND_ERROR;
      severity = ErrorSeverity.LOW;
    }

    return new AppError(
      error.message,
      errorType,
      severity,
      { ...context, originalError: error.name },
      undefined,
      undefined,
      errorType === ErrorType.NETWORK_ERROR || errorType === ErrorType.DATABASE_ERROR
    );
  }

  private logError(error: AppError): void {
    // Add to in-memory log
    this.errorLog.unshift(error);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console with appropriate level
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`[CRITICAL] ${error.code}: ${error.message}`, error.context);
        break;
      case ErrorSeverity.HIGH:
        console.error(`[HIGH] ${error.code}: ${error.message}`, error.context);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(`[MEDIUM] ${error.code}: ${error.message}`, error.context);
        break;
      case ErrorSeverity.LOW:
        console.info(`[LOW] ${error.code}: ${error.message}`, error.context);
        break;
    }
  }

  private sendToMonitoring(error: AppError): void {
    // This would integrate with external monitoring services like Sentry, DataDog, etc.
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      console.error('CRITICAL ERROR - Send to monitoring:', error.toJSON());
    }
  }

  getRecentErrors(limit: number = 50): AppError[] {
    return this.errorLog.slice(0, limit);
  }

  getErrorsByType(type: ErrorType, limit: number = 50): AppError[] {
    return this.errorLog.filter(error => error.type === type).slice(0, limit);
  }

  getErrorsBySeverity(severity: ErrorSeverity, limit: number = 50): AppError[] {
    return this.errorLog.filter(error => error.severity === severity).slice(0, limit);
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    };

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    await errorHandler.handleError(error as Error, context);
    throw error;
  }
};

export const handleSyncError = <T>(
  operation: () => T,
  context: ErrorContext = {}
): T => {
  try {
    return operation();
  } catch (error) {
    errorHandler.handleError(error as Error, context);
    throw error;
  }
};

// React Error Boundary helper
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    errorHandler.handleError(error, {
      component: componentName,
      data: errorInfo
    });
  };
};

// API Error Handler
export const handleApiError = async (response: Response, context: ErrorContext = {}): Promise<never> => {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;
  let errorType = ErrorType.SYSTEM_ERROR;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch {
    // Response doesn't contain JSON
  }

  // Determine error type based on status code
  switch (response.status) {
    case 400:
      errorType = ErrorType.VALIDATION_ERROR;
      break;
    case 401:
      errorType = ErrorType.AUTHENTICATION_ERROR;
      break;
    case 403:
      errorType = ErrorType.AUTHORIZATION_ERROR;
      break;
    case 404:
      errorType = ErrorType.NOT_FOUND_ERROR;
      break;
    case 409:
      errorType = ErrorType.CONFLICT_ERROR;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = ErrorType.DATABASE_ERROR;
      break;
    default:
      errorType = ErrorType.SYSTEM_ERROR;
  }

  const appError = new AppError(
    errorMessage,
    errorType,
    response.status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
    { ...context, statusCode: response.status, url: response.url },
    undefined,
    undefined,
    response.status >= 500
  );

  await errorHandler.handleError(appError);
  throw appError;
};

// Export error types and classes
export {
  ErrorType,
  ErrorSeverity,
  AppError,
  ValidationError,
  BusinessLogicError,
  DatabaseError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};