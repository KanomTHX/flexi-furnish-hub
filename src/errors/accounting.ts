import { BaseError, ErrorCategory, ErrorSeverity } from './base';

/**
 * Base class for all accounting integration errors
 */
export abstract class AccountingError extends BaseError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message, code, statusCode, true, {
      ...context,
      category: ErrorCategory.INTEGRATION,
      module: 'accounting'
    });
  }
}

/**
 * Error thrown when journal entry creation fails
 */
export class JournalEntryCreationError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'JOURNAL_ENTRY_CREATION_FAILED', 422, context);
  }
}

/**
 * Error thrown when journal entry posting fails
 */
export class JournalEntryPostingError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'JOURNAL_ENTRY_POSTING_FAILED', 422, context);
  }
}

/**
 * Error thrown when account mapping is invalid or missing
 */
export class AccountMappingError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ACCOUNT_MAPPING_ERROR', 400, context);
  }
}

/**
 * Error thrown when reconciliation fails
 */
export class ReconciliationError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'RECONCILIATION_FAILED', 422, context);
  }
}

/**
 * Error thrown when external accounting system integration fails
 */
export class ExternalAccountingSystemError extends AccountingError {
  public readonly systemType: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    systemType: string,
    retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message, 'EXTERNAL_ACCOUNTING_SYSTEM_ERROR', 502, {
      ...context,
      systemType,
      retryable
    });
    this.systemType = systemType;
    this.retryable = retryable;
  }
}

/**
 * Error thrown when chart of accounts operations fail
 */
export class ChartOfAccountsError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CHART_OF_ACCOUNTS_ERROR', 422, context);
  }
}

/**
 * Error thrown when accounting data validation fails
 */
export class AccountingValidationError extends AccountingError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]>, context?: Record<string, any>) {
    super(message, 'ACCOUNTING_VALIDATION_ERROR', 400, {
      ...context,
      validationErrors
    });
    this.validationErrors = validationErrors;
  }
}

/**
 * Error thrown when accounting system is temporarily unavailable
 */
export class AccountingSystemUnavailableError extends AccountingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ACCOUNTING_SYSTEM_UNAVAILABLE', 503, context);
  }
}