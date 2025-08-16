import { BaseError, ErrorSeverity, ErrorCategory } from '../errors/base';
import { ErrorLoggingService } from './error-logging.service';
import { ErrorHandlerService } from './error-handler.service';
import { ErrorNotificationService } from './error-notification.service';
import { ErrorRecoveryStrategies } from './error-recovery-strategies';
import { 
  getErrorHandlingConfig, 
  moduleErrorConfigs 
} from '../config/error-handling.config';

/**
 * Error handling service statistics
 */
export interface ErrorHandlingStatistics {
  totalErrors: number;
  errorsByModule: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recoverySuccessRate: number;
  notificationDeliveryRate: number;
  averageResolutionTime: number;
  topErrors: Array<{
    code: string;
    count: number;
    message: string;
    module: string;
  }>;
}

/**
 * Error handling service health status
 */
export interface ErrorHandlingHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    logging: 'healthy' | 'degraded' | 'unhealthy';
    notifications: 'healthy' | 'degraded' | 'unhealthy';
    recovery: 'healthy' | 'degraded' | 'unhealthy';
  };
  lastHealthCheck: Date;
  issues: string[];
}

/**
 * Main error handling service that coordinates all error handling components
 */
export class ErrorHandlingService {
  private loggingService: ErrorLoggingService;
  private handlerService: ErrorHandlerService;
  private notificationService: ErrorNotificationService;
  private recoveryStrategies: ErrorRecoveryStrategies;
  private environment: string;
  private isInitialized: boolean = false;

  constructor(environment: string = 'development') {
    this.environment = environment;
    this.initializeServices();
  }

  /**
   * Initialize all error handling services
   */
  private initializeServices(): void {
    const config = getErrorHandlingConfig(this.environment);

    // Initialize logging service
    this.loggingService = new ErrorLoggingService(config.logging);

    // Initialize handler service with logging
    this.handlerService = new ErrorHandlerService(this.loggingService);

    // Initialize notification service
    this.notificationService = new ErrorNotificationService(config.notification);

    // Register administrators
    config.administrators.forEach(admin => {
      this.notificationService.registerAdministrator(admin);
    });

    // Initialize recovery strategies
    this.recoveryStrategies = new ErrorRecoveryStrategies();

    // Register recovery strategies with handler service
    const strategies = this.recoveryStrategies.getAllStrategies();
    strategies.forEach((strategy, errorCode) => {
      this.handlerService.registerRecoveryStrategy(errorCode, strategy);
    });

    // Register module-specific retry configurations
    Object.entries(moduleErrorConfigs).forEach(([module, config]) => {
      this.handlerService.registerRetryConfig(`${module}_operation`, {
        maxAttempts: config.retryAttempts,
        baseDelayMs: config.retryDelayMs,
        maxDelayMs: config.retryDelayMs * 10,
        backoffMultiplier: 2,
        retryableErrorCodes: config.criticalErrorCodes
      });
    });

    this.isInitialized = true;
  }

  /**
   * Handle error with full error handling pipeline
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.ensureInitialized();

    try {
      return await this.handlerService.handleError(operation, context);
    } catch (error) {
      // If handler service fails, still try to log and notify
      await this.logAndNotifyError(error as Error, context);
      throw error;
    }
  }

  /**
   * Handle error without retry (for logging and notification only)
   */
  async logError(
    error: Error | BaseError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): Promise<void> {
    this.ensureInitialized();

    // Log the error
    await this.loggingService.logError(error, context, userId, sessionId, requestId);

    // Notify administrators if it's a BaseError
    if (error instanceof BaseError) {
      await this.notificationService.notifyError(error, context);
    }
  }

  /**
   * Handle critical error with immediate notification
   */
  async handleCriticalError(
    error: Error | BaseError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): Promise<void> {
    this.ensureInitialized();

    // Log as critical
    await this.loggingService.logCriticalError(error, context, userId, sessionId, requestId);

    // Immediate notification
    if (error instanceof BaseError) {
      await this.notificationService.notifyCriticalError(error, context);
    }
  }

  /**
   * Handle system health alert
   */
  async handleSystemHealthAlert(
    message: string,
    severity: ErrorSeverity,
    metrics?: Record<string, any>
  ): Promise<void> {
    this.ensureInitialized();

    await this.notificationService.notifySystemHealth(message, severity, metrics);
  }

  /**
   * Get error handling statistics
   */
  async getStatistics(period: { startDate: Date; endDate: Date }): Promise<ErrorHandlingStatistics> {
    this.ensureInitialized();

    const loggingStats = await this.loggingService.getErrorStatistics(period);
    const notificationStats = this.notificationService.getNotificationStatistics(period);

    return {
      totalErrors: loggingStats.totalErrors,
      errorsByModule: loggingStats.errorsByModule,
      errorsBySeverity: loggingStats.errorsBySeverity,
      recoverySuccessRate: this.calculateRecoverySuccessRate(loggingStats),
      notificationDeliveryRate: notificationStats.deliverySuccessRate,
      averageResolutionTime: notificationStats.averageDeliveryTime,
      topErrors: loggingStats.topErrors.map(error => ({
        ...error,
        module: this.extractModuleFromCode(error.code)
      }))
    };
  }

  /**
   * Get error handling health status
   */
  async getHealthStatus(): Promise<ErrorHandlingHealth> {
    this.ensureInitialized();

    const issues: string[] = [];
    let loggingHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let notificationHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let recoveryHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check logging service health
    try {
      // Test logging by creating a test log entry
      await this.loggingService.log(
        ErrorSeverity.LOW,
        ErrorCategory.SYSTEM,
        'health_check',
        new Error('Health check test'),
        { healthCheck: true }
      );
    } catch (error) {
      loggingHealth = 'unhealthy';
      issues.push('Logging service is not responding');
    }

    // Check notification service health
    try {
      // Test notification service (this would be a dry run in real implementation)
      const testResult = await this.notificationService.testNotification(
        'admin_primary',
        'email' as any
      );
      if (!testResult.success) {
        notificationHealth = 'degraded';
        issues.push('Notification service has delivery issues');
      }
    } catch (error) {
      notificationHealth = 'unhealthy';
      issues.push('Notification service is not responding');
    }

    // Check recovery strategies health
    try {
      const strategies = this.recoveryStrategies.getAllStrategies();
      if (strategies.size === 0) {
        recoveryHealth = 'degraded';
        issues.push('No recovery strategies are registered');
      }
    } catch (error) {
      recoveryHealth = 'unhealthy';
      issues.push('Recovery strategies service is not responding');
    }

    // Determine overall health
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if ([loggingHealth, notificationHealth, recoveryHealth].includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if ([loggingHealth, notificationHealth, recoveryHealth].includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      components: {
        logging: loggingHealth,
        notifications: notificationHealth,
        recovery: recoveryHealth
      },
      lastHealthCheck: new Date(),
      issues
    };
  }

  /**
   * Register custom error recovery strategy
   */
  registerRecoveryStrategy(errorCode: string, strategy: any): void {
    this.ensureInitialized();
    this.recoveryStrategies.registerStrategy(errorCode, strategy);
    this.handlerService.registerRecoveryStrategy(errorCode, strategy);
  }

  /**
   * Register administrator for notifications
   */
  registerAdministrator(administrator: any): void {
    this.ensureInitialized();
    this.notificationService.registerAdministrator(administrator);
  }

  /**
   * Update administrator notification preferences
   */
  updateAdministratorPreferences(administratorId: string, preferences: any): void {
    this.ensureInitialized();
    this.notificationService.updateAdministratorPreferences(administratorId, preferences);
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, any> {
    this.ensureInitialized();
    
    const operations = [
      'accounting_external_sync',
      'pos_external_sync',
      'email_delivery',
      'banking_integration'
    ];

    const status: Record<string, any> = {};
    operations.forEach(operation => {
      status[operation] = this.handlerService.getCircuitBreakerState(operation);
    });

    return status;
  }

  /**
   * Reset circuit breaker for specific operation
   */
  resetCircuitBreaker(operationName: string): void {
    this.ensureInitialized();
    this.handlerService.resetCircuitBreaker(operationName);
  }

  /**
   * Flush all pending logs
   */
  async flushLogs(): Promise<void> {
    this.ensureInitialized();
    await this.loggingService.flushLogs();
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(): Promise<void> {
    this.ensureInitialized();
    await this.loggingService.cleanupOldLogs();
  }

  /**
   * Shutdown error handling service gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Flush any pending logs
      await this.loggingService.flushLogs();
      
      // Cleanup logging service
      await this.loggingService.cleanup();
      
      // Cleanup notification service
      this.notificationService.cleanup();
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during error handling service shutdown:', error);
    }
  }

  /**
   * Private helper methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ErrorHandlingService is not initialized');
    }
  }

  private async logAndNotifyError(
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await this.loggingService.logError(error, context);
      
      if (error instanceof BaseError) {
        await this.notificationService.notifyError(error, context);
      }
    } catch (loggingError) {
      // If logging fails, at least try to log to console
      console.error('Failed to log error:', error);
      console.error('Logging error:', loggingError);
    }
  }

  private calculateRecoverySuccessRate(stats: any): number {
    // This would calculate actual recovery success rate from logs
    // For now, return a mock value
    return 0.85; // 85% recovery success rate
  }

  private extractModuleFromCode(errorCode: string): string {
    // Extract module from error code patterns
    if (errorCode.includes('ACCOUNTING')) return 'accounting';
    if (errorCode.includes('REPORT')) return 'reporting';
    if (errorCode.includes('POS') || errorCode.includes('INVENTORY')) return 'pos';
    if (errorCode.includes('NOTIFICATION') || errorCode.includes('EMAIL')) return 'notifications';
    return 'unknown';
  }
}

/**
 * Singleton instance for global error handling
 */
let globalErrorHandlingService: ErrorHandlingService | null = null;

/**
 * Get or create global error handling service instance
 */
export function getErrorHandlingService(environment?: string): ErrorHandlingService {
  if (!globalErrorHandlingService) {
    globalErrorHandlingService = new ErrorHandlingService(environment);
  }
  return globalErrorHandlingService;
}

/**
 * Initialize global error handling service
 */
export function initializeErrorHandling(environment: string = 'development'): ErrorHandlingService {
  globalErrorHandlingService = new ErrorHandlingService(environment);
  return globalErrorHandlingService;
}

/**
 * Shutdown global error handling service
 */
export async function shutdownErrorHandling(): Promise<void> {
  if (globalErrorHandlingService) {
    await globalErrorHandlingService.shutdown();
    globalErrorHandlingService = null;
  }
}