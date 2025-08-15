import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandlerService } from '@/services/error-handler.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';
import { AccountingIntegrationError, POSIntegrationError, NotificationError } from '@/errors';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    service = new ErrorHandlerService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('handleServiceError', () => {
    it('should handle generic service errors', async () => {
      const error = new Error('Generic service error');
      const context = 'test-service';

      await service.handleServiceError(error, context);

      // Verify error was logged
      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs).toHaveLength(1);
    });

    it('should handle accounting integration errors', async () => {
      const error = new AccountingIntegrationError('Sync failed', 'SYNC_ERROR');
      const context = 'accounting-service';

      await service.handleServiceError(error, context);

      // Verify error was categorized correctly
      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs[0].args[0]).toMatchObject({
        errorType: 'AccountingIntegrationError',
        context: 'accounting-service'
      });
    });

    it('should handle POS integration errors', async () => {
      const error = new POSIntegrationError('Inventory sync failed', 'INVENTORY_SYNC_ERROR');
      const context = 'pos-service';

      await service.handleServiceError(error, context);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs[0].args[0]).toMatchObject({
        errorType: 'POSIntegrationError',
        context: 'pos-service'
      });
    });

    it('should handle notification errors', async () => {
      const error = new NotificationError('Email send failed', 'EMAIL_SEND_ERROR');
      const context = 'notification-service';

      await service.handleServiceError(error, context);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs[0].args[0]).toMatchObject({
        errorType: 'NotificationError',
        context: 'notification-service'
      });
    });
  });

  describe('handleIntegrationError', () => {
    it('should handle integration-specific errors', async () => {
      const error = new Error('External API timeout');
      const integration = 'quickbooks';

      await service.handleIntegrationError(error, integration);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'integration_error_logs'
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].args[0]).toMatchObject({
        integration: 'quickbooks',
        errorMessage: 'External API timeout'
      });
    });

    it('should implement retry logic for transient errors', async () => {
      const error = new Error('Network timeout');
      const integration = 'xero';

      vi.spyOn(service as any, 'isTransientError').mockReturnValue(true);
      vi.spyOn(service as any, 'scheduleRetry').mockResolvedValue(undefined);

      await service.handleIntegrationError(error, integration);

      expect(service['scheduleRetry']).toHaveBeenCalledWith(error, integration);
    });

    it('should not retry permanent errors', async () => {
      const error = new Error('Authentication failed');
      const integration = 'quickbooks';

      vi.spyOn(service as any, 'isTransientError').mockReturnValue(false);
      vi.spyOn(service as any, 'scheduleRetry').mockResolvedValue(undefined);

      await service.handleIntegrationError(error, integration);

      expect(service['scheduleRetry']).not.toHaveBeenCalled();
    });
  });

  describe('logError', () => {
    it('should log errors with appropriate severity', async () => {
      const error = new Error('Test error');
      const severity = 'high';

      await service.logError(error, severity);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs[0].args[0]).toMatchObject({
        severity: 'high',
        message: 'Test error'
      });
    });

    it('should include stack trace for critical errors', async () => {
      const error = new Error('Critical error');
      const severity = 'critical';

      await service.logError(error, severity);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      expect(logs[0].args[0]).toHaveProperty('stackTrace');
    });
  });

  describe('notifyAdministrators', () => {
    it('should send notifications for critical errors', async () => {
      const error = new Error('System failure');
      const context = 'critical-service';

      vi.spyOn(service as any, 'sendAdminNotification').mockResolvedValue(undefined);

      await service.notifyAdministrators(error, context);

      expect(service['sendAdminNotification']).toHaveBeenCalledWith({
        error,
        context,
        severity: 'critical'
      });
    });

    it('should not send notifications for low severity errors', async () => {
      const error = new Error('Minor warning');
      const context = 'non-critical-service';

      vi.spyOn(service as any, 'shouldNotifyAdmins').mockReturnValue(false);
      vi.spyOn(service as any, 'sendAdminNotification').mockResolvedValue(undefined);

      await service.notifyAdministrators(error, context);

      expect(service['sendAdminNotification']).not.toHaveBeenCalled();
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', async () => {
      // Seed some error data
      await service.logError(new Error('Error 1'), 'low');
      await service.logError(new Error('Error 2'), 'high');
      await service.logError(new Error('Error 3'), 'critical');

      const stats = await service.getErrorStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsBySeverity');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('recentErrors');
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const stats = await service.getErrorStats({ startDate, endDate });

      expect(stats).toBeDefined();
      expect(stats.dateRange).toEqual({ startDate, endDate });
    });
  });

  describe('clearOldErrors', () => {
    it('should clear errors older than specified days', async () => {
      const daysToKeep = 30;

      const result = await service.clearOldErrors(daysToKeep);

      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getErrorById', () => {
    it('should retrieve specific error by ID', async () => {
      const error = new Error('Test error');
      await service.logError(error, 'medium');

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      const errorId = logs[0].args[0].id;

      const retrievedError = await service.getErrorById(errorId);

      expect(retrievedError).toBeDefined();
      expect(retrievedError.id).toBe(errorId);
    });

    it('should return null for non-existent error ID', async () => {
      const nonExistentId = 'non-existent-id';

      const retrievedError = await service.getErrorById(nonExistentId);

      expect(retrievedError).toBeNull();
    });
  });
});