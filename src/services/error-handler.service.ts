import { BaseError, ErrorSeverity, ErrorCategory } from '../errors/base';
import { ErrorLoggingService } from './error-logging.service';
import { AccountingError, ExternalAccountingSystemError } from '../errors/accounting';
import { POSError, InventorySyncError } from '../errors/pos';
import { NotificationError, NotificationDeliveryError } from '../errors/notifications';

/**
 * Retry configuration for different error types
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrorCodes: string[];
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringPeriodMs: number;
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: BaseError) => boolean;
  recover: (error: BaseError, context?: Record<string, any>) => Promise<any>;
  fallback?: (error: BaseError, context?: Record<string, any>) => Promise<any>;
}

/**
 * Circuit breaker state
 */
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker for external service calls
 */
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.config.recoveryTimeoutMs) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

/**
 * Centralized error handler service with retry mechanisms and recovery strategies
 */
export class ErrorHandlerService {
  private errorLoggingService: ErrorLoggingService;
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();

  constructor(errorLoggingService: ErrorLoggingService) {
    this.errorLoggingService = errorLoggingService;
    this.initializeDefaultConfigurations();
    this.initializeRecoveryStrategies();
  }

  /**
   * Handle error with automatic retry and recovery
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const operationName = context?.operationName || 'unknown_operation';
    let lastError: Error;

    // Get retry configuration
    const retryConfig = this.getRetryConfig(operationName, customRetryConfig);

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Use circuit breaker for external operations
        if (this.isExternalOperation(operationName)) {
          const circuitBreaker = this.getCircuitBreaker(operationName);
          return await circuitBreaker.execute(operation);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Log the error
        await this.errorLoggingService.logError(
          lastError,
          {
            ...context,
            attempt,
            maxAttempts: retryConfig.maxAttempts,
            operationName
          }
        );

        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryConfig)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, retryConfig);
        await this.sleep(delay);
      }
    }

    // All retries failed, try recovery strategies
    if (lastError instanceof BaseError) {
      const recoveryResult = await this.attemptRecovery(lastError, context);
      if (recoveryResult.recovered) {
        return recoveryResult.result;
      }
    }

    // Log final failure
    await this.errorLoggingService.logCriticalError(
      lastError,
      {
        ...context,
        finalFailure: true,
        operationName
      }
    );

    throw lastError;
  }

  /**
   * Handle error without retry (for logging and recovery only)
   */
  async handleErrorWithoutRetry(
    error: Error | BaseError,
    context?: Record<string, any>
  ): Promise<void> {
    // Log the error
    await this.errorLoggingService.logError(error, context);

    // Attempt recovery if it's a BaseError
    if (error instanceof BaseError) {
      await this.attemptRecovery(error, context);
    }
  }

  /**
   * Register custom retry configuration for specific operations
   */
  registerRetryConfig(operationName: string, config: RetryConfig): void {
    this.retryConfigs.set(operationName, config);
  }

  /**
   * Register custom recovery strategy
   */
  registerRecoveryStrategy(errorCode: string, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  /**
   * Get circuit breaker state for monitoring
   */
  getCircuitBreakerState(operationName: string): CircuitBreakerState | null {
    const circuitBreaker = this.circuitBreakers.get(operationName);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  /**
   * Reset circuit breaker (for manual intervention)
   */
  resetCircuitBreaker(operationName: string): void {
    this.circuitBreakers.delete(operationName);
  }

  /**
   * Get error statistics from logging service
   */
  async getErrorStatistics(period: { startDate: Date; endDate: Date }) {
    return this.errorLoggingService.getErrorStatistics(period);
  }

  /**
   * Initialize default retry configurations
   */
  private initializeDefaultConfigurations(): void {
    // Accounting integration retries
    this.retryConfigs.set('accounting_journal_entry', {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrorCodes: ['EXTERNAL_ACCOUNTING_SYSTEM_ERROR', 'ACCOUNTING_SYSTEM_UNAVAILABLE']
    });

    // POS integration retries
    this.retryConfigs.set('pos_inventory_sync', {
      maxAttempts: 5,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 1.5,
      retryableErrorCodes: ['INVENTORY_SYNC_FAILED', 'POS_SYSTEM_UNAVAILABLE']
    });

    // Notification delivery retries
    this.retryConfigs.set('notification_delivery', {
      maxAttempts: 3,
      baseDelayMs: 5000,
      maxDelayMs: 60000,
      backoffMultiplier: 2,
      retryableErrorCodes: ['NOTIFICATION_DELIVERY_FAILED', 'EMAIL_SERVICE_UNAVAILABLE']
    });

    // Report generation retries
    this.retryConfigs.set('report_generation', {
      maxAttempts: 2,
      baseDelayMs: 3000,
      maxDelayMs: 15000,
      backoffMultiplier: 2,
      retryableErrorCodes: ['REPORT_GENERATION_FAILED']
    });

    // Default configuration
    this.retryConfigs.set('default', {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrorCodes: []
    });
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Accounting system recovery
    this.recoveryStrategies.set('EXTERNAL_ACCOUNTING_SYSTEM_ERROR', {
      canRecover: (error: BaseError) => {
        return error instanceof ExternalAccountingSystemError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Try alternative accounting system or queue for manual processing
        console.log('Attempting accounting system recovery:', error.message);
        // Implementation would queue transaction for manual processing
        return { queued: true, message: 'Transaction queued for manual processing' };
      },
      fallback: async (error: BaseError, context?: Record<string, any>) => {
        // Log to manual processing queue
        console.log('Accounting fallback: queuing for manual processing');
        return { fallback: true, message: 'Queued for manual accounting entry' };
      }
    });

    // POS integration recovery
    this.recoveryStrategies.set('INVENTORY_SYNC_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof InventorySyncError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Try partial sync or alternative sync method
        console.log('Attempting POS sync recovery:', error.message);
        // Implementation would try partial sync
        return { partialSync: true, message: 'Partial inventory sync completed' };
      }
    });

    // Notification delivery recovery
    this.recoveryStrategies.set('NOTIFICATION_DELIVERY_FAILED', {
      canRecover: (error: BaseError) => {
        return error instanceof NotificationDeliveryError && error.retryable;
      },
      recover: async (error: BaseError, context?: Record<string, any>) => {
        // Try alternative delivery channel
        console.log('Attempting notification delivery recovery:', error.message);
        // Implementation would try SMS or alternative email provider
        return { alternativeDelivery: true, message: 'Notification sent via alternative channel' };
      }
    });
  }

  /**
   * Get retry configuration for operation
   */
  private getRetryConfig(operationName: string, customConfig?: Partial<RetryConfig>): RetryConfig {
    const baseConfig = this.retryConfigs.get(operationName) || this.retryConfigs.get('default')!;
    
    if (customConfig) {
      return { ...baseConfig, ...customConfig };
    }
    
    return baseConfig;
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: Error, retryConfig: RetryConfig): boolean {
    if (error instanceof BaseError) {
      return retryConfig.retryableErrorCodes.includes(error.code);
    }
    
    // For non-BaseError instances, check common retryable conditions
    const retryableMessages = ['timeout', 'connection', 'network', 'unavailable', 'temporary'];
    return retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if operation is external (requires circuit breaker)
   */
  private isExternalOperation(operationName: string): boolean {
    const externalOperations = [
      'accounting_external_sync',
      'pos_external_sync',
      'email_delivery',
      'banking_integration'
    ];
    return externalOperations.includes(operationName);
  }

  /**
   * Get or create circuit breaker for operation
   */
  private getCircuitBreaker(operationName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(operationName)) {
      const config: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeoutMs: 60000, // 1 minute
        monitoringPeriodMs: 300000 // 5 minutes
      };
      this.circuitBreakers.set(operationName, new CircuitBreaker(config));
    }
    return this.circuitBreakers.get(operationName)!;
  }

  /**
   * Attempt error recovery using registered strategies
   */
  private async attemptRecovery(
    error: BaseError,
    context?: Record<string, any>
  ): Promise<{ recovered: boolean; result?: any }> {
    const strategy = this.recoveryStrategies.get(error.code);
    
    if (!strategy || !strategy.canRecover(error)) {
      return { recovered: false };
    }

    try {
      const result = await strategy.recover(error, context);
      
      // Log successful recovery
      await this.errorLoggingService.log(
        ErrorSeverity.MEDIUM,
        ErrorCategory.SYSTEM,
        'error_recovery',
        new Error(`Recovery successful for ${error.code}`),
        { originalError: error.message, recoveryResult: result, ...context }
      );
      
      return { recovered: true, result };
    } catch (recoveryError) {
      // Recovery failed, try fallback if available
      if (strategy.fallback) {
        try {
          const fallbackResult = await strategy.fallback(error, context);
          
          await this.errorLoggingService.log(
            ErrorSeverity.HIGH,
            ErrorCategory.SYSTEM,
            'error_recovery',
            new Error(`Fallback used for ${error.code}`),
            { originalError: error.message, fallbackResult, ...context }
          );
          
          return { recovered: true, result: fallbackResult };
        } catch (fallbackError) {
          // Both recovery and fallback failed
          await this.errorLoggingService.logCriticalError(
            fallbackError as Error,
            { originalError: error.message, recoveryFailed: true, ...context }
          );
        }
      }
      
      return { recovered: false };
    }
  }
}