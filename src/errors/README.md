# Error Handling Framework

A comprehensive error handling framework for the Supplier Billing Advanced Features system, providing centralized error management, logging, recovery strategies, and administrator notifications.

## Overview

The error handling framework consists of several key components:

- **Custom Error Classes**: Module-specific error types with rich context
- **Error Logging Service**: Centralized logging with multiple output channels
- **Error Handler Service**: Retry mechanisms and circuit breakers
- **Error Notification Service**: Administrator alerts and escalation
- **Recovery Strategies**: Automatic error recovery and fallback mechanisms

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                 ErrorHandlingService                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │   Logging   │   Handler   │Notification │  Recovery   │  │
│  │   Service   │   Service   │   Service   │ Strategies  │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Error Classes                            │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │ Accounting  │ Reporting   │     POS     │Notification │  │
│  │   Errors    │   Errors    │   Errors    │   Errors    │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Base Error                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Initialize the Error Handling System

```typescript
import { initializeErrorHandling } from './services/error-handling.service';

// Initialize for your environment
const errorHandling = initializeErrorHandling('production');
```

### 2. Handle Operations with Error Management

```typescript
import { getErrorHandlingService } from './services/error-handling.service';

const errorHandling = getErrorHandlingService();

// Wrap operations that might fail
const result = await errorHandling.handleError(async () => {
  // Your operation here
  return await someRiskyOperation();
}, {
  operationName: 'accounting_journal_entry',
  context: { transactionId: '123' }
});
```

### 3. Log Errors Manually

```typescript
import { JournalEntryCreationError } from './errors/accounting';

const error = new JournalEntryCreationError(
  'Failed to create journal entry',
  { transactionId: '123', amount: 1500.00 }
);

await errorHandling.logError(error, {
  userId: 'user_123',
  sessionId: 'sess_456'
});
```

## Error Classes

### Base Error Class

All errors extend from `BaseError` which provides:

- **Structured Information**: Error code, status code, severity
- **Rich Context**: Additional data about the error
- **Operational Flag**: Distinguishes between operational and programming errors
- **Timestamps**: When the error occurred
- **JSON Serialization**: For logging and transmission

```typescript
import { BaseError, ErrorSeverity, ErrorCategory } from './errors/base';

class CustomError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CUSTOM_ERROR_CODE', 422, true, {
      ...context,
      category: ErrorCategory.BUSINESS_LOGIC,
      module: 'custom'
    });
  }
}
```

### Module-Specific Errors

#### Accounting Errors
- `JournalEntryCreationError`: Journal entry creation failures
- `ExternalAccountingSystemError`: External system integration issues
- `ReconciliationError`: Balance reconciliation problems
- `AccountMappingError`: Chart of accounts mapping issues

#### Reporting Errors
- `ReportGenerationError`: Report creation failures
- `ReportExportError`: Export format issues
- `ReportParameterError`: Invalid report parameters
- `AnalyticsCalculationError`: Analytics computation failures

#### POS Integration Errors
- `InventorySyncError`: Inventory synchronization issues
- `AutoPurchaseOrderError`: Automatic PO creation failures
- `POSSystemUnavailableError`: POS system connectivity issues
- `InventoryDataInconsistencyError`: Data consistency problems

#### Notification Errors
- `NotificationDeliveryError`: Message delivery failures
- `EmailServiceUnavailableError`: Email service outages
- `NotificationTemplateError`: Template processing issues
- `NotificationRateLimitError`: Rate limiting violations

## Error Logging

The `ErrorLoggingService` provides centralized logging with:

- **Multiple Output Channels**: Console, database, external services
- **Severity Filtering**: Log only errors above configured threshold
- **Structured Logging**: Consistent log format with metadata
- **Log Retention**: Automatic cleanup of old logs
- **Statistics**: Error trends and analytics

### Configuration

```typescript
import { ErrorLoggingConfig, ErrorSeverity } from './services/error-logging.service';

const config: ErrorLoggingConfig = {
  enableConsoleLogging: true,
  enableDatabaseLogging: true,
  enableExternalLogging: false,
  logLevel: ErrorSeverity.MEDIUM,
  maxLogEntries: 10000,
  retentionDays: 90
};
```

### Usage

```typescript
// Log with automatic severity detection
await loggingService.logError(error, context, userId, sessionId);

// Log with explicit severity
await loggingService.log(
  ErrorSeverity.CRITICAL,
  ErrorCategory.INTEGRATION,
  'accounting',
  error,
  context
);

// Get error statistics
const stats = await loggingService.getErrorStatistics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});
```

## Error Handling and Retry

The `ErrorHandlerService` provides:

- **Automatic Retries**: Configurable retry logic with exponential backoff
- **Circuit Breakers**: Prevent cascading failures in external integrations
- **Recovery Strategies**: Automatic error recovery and fallback mechanisms
- **Operation Context**: Track and correlate related operations

### Retry Configuration

```typescript
// Register retry configuration for specific operations
handlerService.registerRetryConfig('accounting_sync', {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrorCodes: ['EXTERNAL_ACCOUNTING_SYSTEM_ERROR']
});
```

### Circuit Breakers

Circuit breakers automatically prevent calls to failing external services:

- **Closed**: Normal operation
- **Open**: Failing fast, not calling external service
- **Half-Open**: Testing if service has recovered

```typescript
// Check circuit breaker status
const status = handlerService.getCircuitBreakerState('external_accounting');

// Reset circuit breaker manually
handlerService.resetCircuitBreaker('external_accounting');
```

## Error Notifications

The `ErrorNotificationService` handles administrator notifications:

- **Multiple Channels**: Email, SMS, Slack, webhooks, in-app
- **Escalation Rules**: Automatic escalation based on error patterns
- **Rate Limiting**: Prevent notification spam
- **Batching**: Group related errors for efficiency
- **Templates**: Customizable notification messages

### Administrator Registration

```typescript
const administrator = {
  id: 'admin_001',
  name: 'System Administrator',
  email: 'admin@company.com',
  phone: '+1234567890',
  role: 'System Administrator',
  isActive: true,
  notificationPreferences: {
    channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
    severityLevels: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
    modules: ['accounting', 'pos'],
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'UTC'
    }
  }
};

notificationService.registerAdministrator(administrator);
```

### Escalation Rules

```typescript
const escalationRule = {
  id: 'critical_accounting_errors',
  name: 'Critical Accounting Error Escalation',
  conditions: {
    severity: [ErrorSeverity.CRITICAL],
    modules: ['accounting'],
    errorCodes: ['EXTERNAL_ACCOUNTING_SYSTEM_ERROR'],
    frequency: { count: 1, periodMs: 0 } // Immediate
  },
  actions: {
    notifyAdministrators: ['admin_001', 'admin_002'],
    channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
    escalateAfterMs: 300000, // 5 minutes
    escalateToAdministrators: ['manager_001']
  }
};
```

## Recovery Strategies

The framework includes automatic recovery strategies for common error scenarios:

### Accounting Recovery
- **Alternative Systems**: Switch to backup accounting system
- **Offline Mode**: Queue transactions for later processing
- **Simplified Entries**: Create basic journal entries when complex ones fail

### Reporting Recovery
- **Reduced Datasets**: Generate reports with limited data
- **Alternative Formats**: Export in different format if preferred fails
- **Cached Results**: Use previously generated reports

### POS Recovery
- **Partial Sync**: Sync critical items only
- **Alternative Suppliers**: Use backup suppliers for purchase orders
- **Offline Mode**: Continue operations without real-time sync

### Notification Recovery
- **Alternative Channels**: Switch from email to SMS or Slack
- **Backup Providers**: Use different email service providers
- **Delayed Delivery**: Queue notifications for later delivery

### Custom Recovery Strategies

```typescript
// Register custom recovery strategy
errorHandling.registerRecoveryStrategy('CUSTOM_ERROR_CODE', {
  canRecover: (error) => {
    return error.code === 'CUSTOM_ERROR_CODE' && error.context?.retryable;
  },
  recover: async (error, context) => {
    // Custom recovery logic
    return { recovered: true, method: 'custom_solution' };
  },
  fallback: async (error, context) => {
    // Fallback when recovery fails
    return { fallback: true, method: 'manual_intervention' };
  }
});
```

## Configuration

### Environment-Specific Configuration

The framework supports different configurations for different environments:

```typescript
import { getErrorHandlingConfig } from './config/error-handling.config';

// Development: Verbose logging, no notifications
const devConfig = getErrorHandlingConfig('development');

// Staging: Moderate logging, limited notifications
const stagingConfig = getErrorHandlingConfig('staging');

// Production: Optimized logging, full notifications
const prodConfig = getErrorHandlingConfig('production');
```

### Module-Specific Configuration

Each module can have its own error handling configuration:

```typescript
import { moduleErrorConfigs } from './config/error-handling.config';

const accountingConfig = moduleErrorConfigs.accounting;
// {
//   retryAttempts: 3,
//   retryDelayMs: 2000,
//   circuitBreakerThreshold: 5,
//   enableRecovery: true,
//   criticalErrorCodes: ['EXTERNAL_ACCOUNTING_SYSTEM_ERROR', ...]
// }
```

## Monitoring and Analytics

### Health Monitoring

```typescript
// Check system health
const health = await errorHandling.getHealthStatus();
console.log('Status:', health.status); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Components:', health.components);
console.log('Issues:', health.issues);
```

### Error Statistics

```typescript
// Get comprehensive error statistics
const stats = await errorHandling.getStatistics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

console.log('Total Errors:', stats.totalErrors);
console.log('Recovery Success Rate:', stats.recoverySuccessRate);
console.log('Top Errors:', stats.topErrors);
```

### Circuit Breaker Monitoring

```typescript
// Monitor circuit breaker states
const circuitBreakerStatus = errorHandling.getCircuitBreakerStatus();
console.log('Accounting System:', circuitBreakerStatus.accounting_external_sync);
console.log('POS System:', circuitBreakerStatus.pos_external_sync);
```

## Best Practices

### 1. Use Appropriate Error Types
- Use specific error classes for different failure scenarios
- Include relevant context information
- Set appropriate severity levels

### 2. Handle Errors at the Right Level
- Use `handleError()` for operations that should be retried
- Use `logError()` for errors that need logging but no retry
- Use `handleCriticalError()` for system-threatening issues

### 3. Provide Rich Context
- Include operation parameters, user information, and system state
- Use structured data that can be easily searched and analyzed
- Avoid sensitive information in error contexts

### 4. Configure Appropriately
- Set retry limits based on operation criticality
- Configure notifications to avoid alert fatigue
- Adjust logging levels for different environments

### 5. Monitor and Respond
- Regularly review error statistics and trends
- Update recovery strategies based on common failure patterns
- Maintain administrator contact information and preferences

## Testing

The framework includes comprehensive tests:

```bash
# Run error handling tests
npm test src/tests/error-handling.test.ts

# Run with coverage
npm run test:coverage
```

### Test Examples

```typescript
import { describe, it, expect } from 'vitest';
import { JournalEntryCreationError } from './errors/accounting';

describe('Error Handling', () => {
  it('should create error with correct properties', () => {
    const error = new JournalEntryCreationError('Test error', { id: '123' });
    
    expect(error.code).toBe('JOURNAL_ENTRY_CREATION_FAILED');
    expect(error.context?.id).toBe('123');
    expect(error.context?.module).toBe('accounting');
  });
});
```

## Examples

See `src/examples/error-handling-usage.ts` for comprehensive usage examples covering:

- System initialization
- Module-specific error handling
- Custom recovery strategies
- Monitoring and analytics
- Configuration management

## Environment Variables

Configure the error handling system using environment variables:

```bash
# External logging
EXTERNAL_LOG_ENDPOINT=https://logs.example.com/api/v1/logs
EXTERNAL_LOG_API_KEY=your_api_key_here

# Administrator contacts
ADMIN_PRIMARY_EMAIL=admin@company.com
ADMIN_PRIMARY_PHONE=+1234567890
ADMIN_PRIMARY_SLACK=U1234567890

# Notification services
SENDGRID_API_KEY=your_sendgrid_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Contributing

When adding new error types or recovery strategies:

1. Extend the appropriate base error class
2. Include relevant context information
3. Add recovery strategies if applicable
4. Update configuration as needed
5. Add tests for new functionality
6. Update documentation

## Support

For questions or issues with the error handling framework:

1. Check the examples and documentation
2. Review existing error patterns and recovery strategies
3. Consult the test files for usage patterns
4. Contact the development team for complex scenarios