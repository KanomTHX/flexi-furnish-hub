import { BaseError, ErrorSeverity, ErrorCategory } from '../errors/base';

/**
 * Error log entry interface
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: ErrorSeverity;
  category: ErrorCategory;
  module: string;
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Error logging configuration
 */
export interface ErrorLoggingConfig {
  enableConsoleLogging: boolean;
  enableDatabaseLogging: boolean;
  enableExternalLogging: boolean;
  logLevel: ErrorSeverity;
  maxLogEntries: number;
  retentionDays: number;
  externalLogEndpoint?: string;
  externalLogApiKey?: string;
}

/**
 * Centralized error logging service
 */
export class ErrorLoggingService {
  private config: ErrorLoggingConfig;
  private logBuffer: ErrorLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: ErrorLoggingConfig) {
    this.config = config;
    this.startPeriodicFlush();
  }

  /**
   * Log an error with automatic severity detection
   */
  async logError(
    error: Error | BaseError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): Promise<void> {
    const severity = this.determineSeverity(error);
    const category = this.determineCategory(error);
    const module = this.determineModule(error);

    await this.log(severity, category, module, error, context, userId, sessionId, requestId);
  }

  /**
   * Log with explicit severity level
   */
  async log(
    severity: ErrorSeverity,
    category: ErrorCategory,
    module: string,
    error: Error | BaseError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    // Check if we should log this severity level
    if (!this.shouldLog(severity)) {
      return;
    }

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level: severity,
      category,
      module,
      code: error instanceof BaseError ? error.code : 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        ...(error instanceof BaseError ? error.context : {})
      },
      userId,
      sessionId,
      requestId,
      userAgent,
      ipAddress
    };

    // Add to buffer for batch processing
    this.logBuffer.push(logEntry);

    // Console logging (immediate)
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Flush immediately for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      await this.flushLogs();
    }
  }

  /**
   * Log critical error with immediate notification
   */
  async logCriticalError(
    error: Error | BaseError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): Promise<void> {
    await this.log(
      ErrorSeverity.CRITICAL,
      this.determineCategory(error),
      this.determineModule(error),
      error,
      context,
      userId,
      sessionId,
      requestId
    );

    // Immediate notification for critical errors
    await this.notifyAdministrators(error, context);
  }

  /**
   * Get error logs with filtering
   */
  async getErrorLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    module?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ErrorLogEntry[]> {
    // This would typically query the database
    // For now, return filtered buffer (in production, implement database query)
    let logs = [...this.logBuffer];

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    if (filters.severity) {
      logs = logs.filter(log => log.level === filters.severity);
    }

    if (filters.category) {
      logs = logs.filter(log => log.category === filters.category);
    }

    if (filters.module) {
      logs = logs.filter(log => log.module === filters.module);
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    return logs.slice(offset, offset + limit);
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(period: { startDate: Date; endDate: Date }): Promise<{
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsByModule: Record<string, number>;
    topErrors: Array<{ code: string; count: number; message: string }>;
  }> {
    const logs = await this.getErrorLogs({
      startDate: period.startDate,
      endDate: period.endDate,
      limit: 10000
    });

    const stats = {
      totalErrors: logs.length,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsByModule: {} as Record<string, number>,
      topErrors: [] as Array<{ code: string; count: number; message: string }>
    };

    // Initialize counters
    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });

    const errorCounts: Record<string, { count: number; message: string }> = {};

    // Count errors
    logs.forEach(log => {
      stats.errorsBySeverity[log.level]++;
      stats.errorsByCategory[log.category]++;
      stats.errorsByModule[log.module] = (stats.errorsByModule[log.module] || 0) + 1;

      if (!errorCounts[log.code]) {
        errorCounts[log.code] = { count: 0, message: log.message };
      }
      errorCounts[log.code].count++;
    });

    // Get top errors
    stats.topErrors = Object.entries(errorCounts)
      .map(([code, data]) => ({ code, count: data.count, message: data.message }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Flush logs to persistent storage
   */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Database logging
      if (this.config.enableDatabaseLogging) {
        await this.logToDatabase(logsToFlush);
      }

      // External logging service
      if (this.config.enableExternalLogging && this.config.externalLogEndpoint) {
        await this.logToExternalService(logsToFlush);
      }
    } catch (error) {
      // If logging fails, put logs back in buffer and log to console
      this.logBuffer.unshift(...logsToFlush);
      console.error('Failed to flush error logs:', error);
    }
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    // This would typically delete from database
    // For now, clean buffer (in production, implement database cleanup)
    this.logBuffer = this.logBuffer.filter(log => log.timestamp > cutoffDate);
  }

  /**
   * Notify administrators of critical errors
   */
  private async notifyAdministrators(error: Error | BaseError, context?: Record<string, any>): Promise<void> {
    try {
      // This would integrate with notification service
      // For now, just log to console
      console.error('CRITICAL ERROR - Administrator notification required:', {
        error: error.message,
        code: error instanceof BaseError ? error.code : 'UNKNOWN_ERROR',
        context,
        timestamp: new Date().toISOString()
      });
    } catch (notificationError) {
      console.error('Failed to notify administrators:', notificationError);
    }
  }

  /**
   * Determine error severity automatically
   */
  private determineSeverity(error: Error | BaseError): ErrorSeverity {
    if (error instanceof BaseError) {
      // Map status codes to severity
      if (error.statusCode >= 500) return ErrorSeverity.CRITICAL;
      if (error.statusCode >= 400) return ErrorSeverity.HIGH;
      return ErrorSeverity.MEDIUM;
    }

    // For non-BaseError instances, default to HIGH
    return ErrorSeverity.HIGH;
  }

  /**
   * Determine error category automatically
   */
  private determineCategory(error: Error | BaseError): ErrorCategory {
    if (error instanceof BaseError && error.context?.category) {
      return error.context.category as ErrorCategory;
    }

    // Default category based on error type or message
    if (error.message.toLowerCase().includes('validation')) {
      return ErrorCategory.VALIDATION;
    }
    if (error.message.toLowerCase().includes('auth')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (error.message.toLowerCase().includes('database')) {
      return ErrorCategory.DATABASE;
    }
    if (error.message.toLowerCase().includes('network')) {
      return ErrorCategory.NETWORK;
    }

    return ErrorCategory.SYSTEM;
  }

  /**
   * Determine error module automatically
   */
  private determineModule(error: Error | BaseError): string {
    if (error instanceof BaseError && error.context?.module) {
      return error.context.module as string;
    }

    // Try to determine from error name or stack trace
    if (error.name.toLowerCase().includes('accounting')) return 'accounting';
    if (error.name.toLowerCase().includes('reporting')) return 'reporting';
    if (error.name.toLowerCase().includes('pos')) return 'pos';
    if (error.name.toLowerCase().includes('notification')) return 'notifications';

    return 'unknown';
  }

  /**
   * Check if error should be logged based on configuration
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityLevels = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL
    ];

    const configLevelIndex = severityLevels.indexOf(this.config.logLevel);
    const errorLevelIndex = severityLevels.indexOf(severity);

    return errorLevelIndex >= configLevelIndex;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(logEntry: ErrorLogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const level = logEntry.level.toUpperCase();
    const module = logEntry.module.toUpperCase();

    console.error(`[${timestamp}] ${level} [${module}] ${logEntry.code}: ${logEntry.message}`);
    
    if (logEntry.context && Object.keys(logEntry.context).length > 0) {
      console.error('Context:', JSON.stringify(logEntry.context, null, 2));
    }

    if (logEntry.stack && logEntry.level === ErrorSeverity.CRITICAL) {
      console.error('Stack trace:', logEntry.stack);
    }
  }

  /**
   * Log to database (placeholder implementation)
   */
  private async logToDatabase(logs: ErrorLogEntry[]): Promise<void> {
    // This would implement actual database insertion
    // For now, just simulate the operation
    console.log(`Logging ${logs.length} entries to database`);
  }

  /**
   * Log to external service (placeholder implementation)
   */
  private async logToExternalService(logs: ErrorLogEntry[]): Promise<void> {
    if (!this.config.externalLogEndpoint || !this.config.externalLogApiKey) {
      return;
    }

    // This would implement actual HTTP request to external logging service
    console.log(`Sending ${logs.length} entries to external logging service`);
  }

  /**
   * Start periodic log flushing
   */
  private startPeriodicFlush(): void {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs().catch(error => {
        console.error('Periodic log flush failed:', error);
      });
    }, 30000);
  }

  /**
   * Stop periodic log flushing
   */
  public stopPeriodicFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.stopPeriodicFlush();
    await this.flushLogs();
  }
}