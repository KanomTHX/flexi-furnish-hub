import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseError, ErrorSeverity, ErrorCategory } from '../errors/base';
import { AccountingError, JournalEntryCreationError } from '../errors/accounting';
import { ReportingError, ReportGenerationError } from '../errors/reporting';
import { POSError, InventorySyncError } from '../errors/pos';
import { NotificationError, NotificationDeliveryError } from '../errors/notifications';

describe('Error Handling Framework', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BaseError', () => {
    it('should create error with all properties', () => {
      const error = new JournalEntryCreationError('Test error', { transactionId: '123' });

      expect(error.name).toBe('JournalEntryCreationError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('JOURNAL_ENTRY_CREATION_FAILED');
      expect(error.statusCode).toBe(422);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({
        transactionId: '123',
        category: ErrorCategory.INTEGRATION,
        module: 'accounting'
      });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should convert to JSON correctly', () => {
      const error = new JournalEntryCreationError('Test error', { transactionId: '123' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'JournalEntryCreationError');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('code', 'JOURNAL_ENTRY_CREATION_FAILED');
      expect(json).toHaveProperty('statusCode', 422);
      expect(json).toHaveProperty('isOperational', true);
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('stack');
    });

    it('should return user-friendly message', () => {
      const operationalError = new JournalEntryCreationError('Technical error');
      const nonOperationalError = new BaseError('System error', 'SYSTEM_ERROR', 500, false);

      expect(operationalError.getUserMessage()).toBe('Technical error');
      expect(nonOperationalError.getUserMessage()).toBe('An unexpected error occurred');
    });
  });

  describe('Module-specific Errors', () => {
    it('should create accounting errors correctly', () => {
      const error = new JournalEntryCreationError('Failed to create journal entry');
      
      expect(error).toBeInstanceOf(AccountingError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('JOURNAL_ENTRY_CREATION_FAILED');
      expect(error.context?.module).toBe('accounting');
    });

    it('should create reporting errors correctly', () => {
      const error = new ReportGenerationError('Failed to generate report', 'supplier_performance');
      
      expect(error).toBeInstanceOf(ReportingError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('REPORT_GENERATION_FAILED');
      expect(error.reportType).toBe('supplier_performance');
      expect(error.context?.module).toBe('reporting');
    });

    it('should create POS errors correctly', () => {
      const error = new InventorySyncError('Sync failed', 'full', true);
      
      expect(error).toBeInstanceOf(POSError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('INVENTORY_SYNC_FAILED');
      expect(error.syncType).toBe('full');
      expect(error.retryable).toBe(true);
      expect(error.context?.module).toBe('pos');
    });

    it('should create notification errors correctly', () => {
      const error = new NotificationDeliveryError('Delivery failed', 'email', 'test@example.com', true);
      
      expect(error).toBeInstanceOf(NotificationError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe('NOTIFICATION_DELIVERY_FAILED');
      expect(error.deliveryChannel).toBe('email');
      expect(error.recipient).toBe('test@example.com');
      expect(error.retryable).toBe(true);
      expect(error.context?.module).toBe('notifications');
    });
  });


});