/**
 * Error Logging and Monitoring Utility
 * Handles error reporting, logging, and monitoring for production
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  context: ErrorContext;
  fingerprint?: string;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

class ErrorLogger {
  private logLevel: LogLevel;
  private enableConsoleLogging: boolean;
  private enableRemoteLogging: boolean;
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.enableConsoleLogging = import.meta.env.DEV || import.meta.env.VITE_LOG_LEVEL === 'debug';
    this.enableRemoteLogging = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
    this.sessionId = this.generateSessionId();
    
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    // Setup periodic error reporting
    if (this.enableRemoteLogging) {
      this.setupPeriodicReporting();
    }
  }

  private getLogLevel(): LogLevel {
    const level = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warning': return LogLevel.WARNING;
      case 'error': return LogLevel.ERROR;
      default: return import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.ERROR;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        component: 'Global',
        action: 'unhandledrejection',
        metadata: { promise: event.promise }
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, {
        component: 'Global',
        action: 'error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.logError(`Resource loading failed: ${(event.target as any)?.src || 'unknown'}`, {
          component: 'Global',
          action: 'resource_error',
          metadata: { target: event.target }
        });
      }
    }, true);
  }

  private setupPeriodicReporting(): void {
    // Send queued errors every 30 seconds
    setInterval(() => {
      this.flushErrorQueue();
    }, 30000);

    // Send errors before page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrorQueue();
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createErrorReport(
    error: Error | string,
    level: 'error' | 'warning' | 'info' | 'debug',
    context: Partial<ErrorContext> = {}
  ): ErrorReport {
    const errorObj = error instanceof Error ? error : new Error(error);
    const fullContext: ErrorContext = {
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
      ...context
    };

    return {
      id: this.generateErrorId(),
      message: errorObj.message,
      stack: errorObj.stack,
      level,
      context: fullContext,
      fingerprint: this.generateFingerprint(errorObj, fullContext)
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.message}_${context.component}_${context.action}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendErrorsToRemote(errors);
    } catch (error) {
      // If remote logging fails, put errors back in queue
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send errors to remote logging service:', error);
    }
  }

  private async sendErrorsToRemote(errors: ErrorReport[]): Promise<void> {
    if (!this.enableRemoteLogging) return;

    // Send to Sentry if configured
    if (import.meta.env.VITE_SENTRY_DSN) {
      await this.sendToSentry(errors);
    }

    // Send to custom logging endpoint if configured
    if (import.meta.env.VITE_LOGGING_ENDPOINT) {
      await this.sendToCustomEndpoint(errors);
    }

    // Store in local database for offline support
    await this.storeErrorsLocally(errors);
  }

  private async sendToSentry(errors: ErrorReport[]): Promise<void> {
    // Implementation would depend on Sentry SDK
    // This is a placeholder for Sentry integration
    console.log('Sending errors to Sentry:', errors);
  }

  private async sendToCustomEndpoint(errors: ErrorReport[]): Promise<void> {
    const endpoint = import.meta.env.VITE_LOGGING_ENDPOINT;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors }),
    });

    if (!response.ok) {
      throw new Error(`Logging endpoint returned ${response.status}`);
    }
  }

  private async storeErrorsLocally(errors: ErrorReport[]): Promise<void> {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      const allErrors = [...existingErrors, ...errors];
      
      // Keep only the last 1000 errors
      const trimmedErrors = allErrors.slice(-1000);
      
      localStorage.setItem('error_logs', JSON.stringify(trimmedErrors));
    } catch (error) {
      console.warn('Failed to store errors locally:', error);
    }
  }

  // Public logging methods
  public logError(error: Error | string, context?: Partial<ErrorContext>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorReport = this.createErrorReport(error, 'error', context);
    
    if (this.enableConsoleLogging) {
      console.error('Error:', errorReport);
    }

    this.errorQueue.push(errorReport);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }

    // Send critical errors immediately
    if (this.enableRemoteLogging) {
      this.flushErrorQueue();
    }
  }

  public logWarning(message: string, context?: Partial<ErrorContext>): void {
    if (!this.shouldLog(LogLevel.WARNING)) return;

    const errorReport = this.createErrorReport(message, 'warning', context);
    
    if (this.enableConsoleLogging) {
      console.warn('Warning:', errorReport);
    }

    this.errorQueue.push(errorReport);
  }

  public logInfo(message: string, context?: Partial<ErrorContext>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const errorReport = this.createErrorReport(message, 'info', context);
    
    if (this.enableConsoleLogging) {
      console.info('Info:', errorReport);
    }

    this.errorQueue.push(errorReport);
  }

  public logDebug(message: string, context?: Partial<ErrorContext>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const errorReport = this.createErrorReport(message, 'debug', context);
    
    if (this.enableConsoleLogging) {
      console.debug('Debug:', errorReport);
    }

    // Don't queue debug messages for remote logging
  }

  // Performance monitoring
  public measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const startTime = performance.now();
    
    return fn().then(
      (result) => {
        const duration = performance.now() - startTime;
        
        if (duration > 1000) { // Log slow operations
          this.logWarning(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`, {
            ...context,
            action: 'performance',
            metadata: { operation, duration }
          });
        }
        
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.logError(error, {
          ...context,
          action: 'performance_error',
          metadata: { operation, duration }
        });
        throw error;
      }
    );
  }

  // Get error statistics
  public getErrorStats(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
    const errorsByLevel = errors.reduce((acc: Record<string, number>, error: ErrorReport) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {});

    return {
      totalErrors: errors.length,
      errorsByLevel,
      recentErrors: errors.slice(-10)
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Export convenience functions
export const logError = (error: Error | string, context?: Partial<ErrorContext>) => 
  errorLogger.logError(error, context);

export const logWarning = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logWarning(message, context);

export const logInfo = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logInfo(message, context);

export const logDebug = (message: string, context?: Partial<ErrorContext>) => 
  errorLogger.logDebug(message, context);

export const measurePerformance = <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>
) => errorLogger.measurePerformance(operation, fn, context);