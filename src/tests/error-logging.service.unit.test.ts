import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorLoggingService } from '@/services/error-logging.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('ErrorLoggingService', () => {
  let service: ErrorLoggingService;

  beforeEach(() => {
    service = new ErrorLoggingService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('logError', () => {
    it('should log error with all required fields', async () => {
      const error = new Error('Test error message');
      const context = 'test-service';
      const severity = 'medium';

      await service.logError(error, context, severity);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      
      expect(logs).toHaveLength(1);
      expect(logs[0].args[0]).toMatchObject({
        message: 'Test error message',
        context: 'test-service',
        severity: 'medium',
        errorType: 'Error'
      });
    });

    it('should include stack trace when available', async () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      await service.logError(error, 'test-context', 'high');

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      
      expect(logs[0].args[0]).toHaveProperty('stackTrace');
      expect(logs[0].args[0].stackTrace).toContain('Error: Test error');
    });

    it('should handle errors without stack trace', async () => {
      const error = new Error('Simple error');
      delete error.stack;

      await service.logError(error, 'test-context', 'low');

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      
      expect(logs[0].args[0].stackTrace).toBeNull();
    });

    it('should include additional metadata when provided', async () => {
      const error = new Error('Error with metadata');
      const metadata = {
        userId: 'user-123',
        requestId: 'req-456',
        customField: 'custom-value'
      };

      await service.logError(error, 'test-context', 'high', metadata);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'error_logs'
      );
      
      expect(logs[0].args[0].metadata).toEqual(metadata);
    });
  });

  describe('logIntegrationError', () => {
    it('should log integration-specific errors', async () => {
      const error = new Error('API connection failed');
      const integration = 'quickbooks';
      const operation = 'sync_journal_entries';

      await service.logIntegrationError(error, integration, operation);

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'integration_error_logs'
      );
      
      expect(logs).toHaveLength(1);
      expect(logs[0].args[0]).toMatchObject({
        integration: 'quickbooks',
        operation: 'sync_journal_entries',
        errorMessage: 'API connection failed'
      });
    });

    it('should include request/response data for API errors', async () => {
      const error = new Error('API error');
      const integration = 'xero';
      const operation = 'create_account';
      const requestData = { name: 'Test Account', type: 'EXPENSE' };
      const responseData = { error: 'Invalid account type' };

      await service.logIntegrationError(error, integration, operation, {
        requestData,
        responseData
      });

      const logs = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'integration_error_logs'
      );
      
      expect(logs[0].args[0].requestData).toEqual(requestData);
      expect(logs[0].args[0].responseData).toEqual(responseData);
    });
  });

  describe('getErrorLogs', () => {
    it('should retrieve error logs with pagination', async () => {
      // Create some test errors
      await service.logError(new Error('Error 1'), 'context-1', 'low');
      await service.logError(new Error('Error 2'), 'context-2', 'medium');
      await service.logError(new Error('Error 3'), 'context-3', 'high');

      const result = await service.getErrorLogs({ page: 1, limit: 2 });

      expect(result).toBeDefined();
      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should filter logs by severity', async () => {
      await service.logError(new Error('Low error'), 'context', 'low');
      await service.logError(new Error('High error'), 'context', 'high');
      await service.logError(new Error('Critical error'), 'context', 'critical');

      const result = await service.getErrorLogs({ 
        severity: 'high',
        page: 1,
        limit: 10 
      });

      expect(result.logs.every(log => log.severity === 'high')).toBe(true);
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getErrorLogs({
        startDate,
        endDate,
        page: 1,
        limit: 10
      });

      expect(result.logs.every(log => 
        log.createdAt >= startDate && log.createdAt <= endDate
      )).toBe(true);
    });

    it('should filter logs by context', async () => {
      await service.logError(new Error('Service A error'), 'service-a', 'medium');
      await service.logError(new Error('Service B error'), 'service-b', 'medium');

      const result = await service.getErrorLogs({
        context: 'service-a',
        page: 1,
        limit: 10
      });

      expect(result.logs.every(log => log.context === 'service-a')).toBe(true);
    });
  });

  describe('getErrorStats', () => {
    it('should return error statistics', async () => {
      // Create test data
      await service.logError(new Error('Error 1'), 'service-a', 'low');
      await service.logError(new Error('Error 2'), 'service-a', 'high');
      await service.logError(new Error('Error 3'), 'service-b', 'critical');

      const stats = await service.getErrorStats();

      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsBySeverity).toBeDefined();
      expect(stats.errorsByContext).toBeDefined();
      expect(stats.errorsByType).toBeDefined();
    });

    it('should calculate error trends over time', async () => {
      const stats = await service.getErrorStats({ includeTrends: true });

      expect(stats.trends).toBeDefined();
      expect(stats.trends).toHaveProperty('daily');
      expect(stats.trends).toHaveProperty('weekly');
      expect(stats.trends).toHaveProperty('monthly');
    });
  });

  describe('clearOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      const daysToKeep = 30;

      const result = await service.clearOldLogs(daysToKeep);

      expect(result).toBeDefined();
      expect(result.deletedCount).toBeGreaterThanOrEqual(0);
      expect(result.success).toBe(true);
    });

    it('should handle cleanup errors gracefully', async () => {
      vi.spyOn(mockDatabase, 'delete').mockRejectedValue(new Error('Database error'));

      const result = await service.clearOldLogs(30);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('exportErrorLogs', () => {
    it('should export error logs in specified format', async () => {
      await service.logError(new Error('Export test'), 'test-context', 'medium');

      const result = await service.exportErrorLogs({
        format: 'csv',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBeDefined();
    });

    it('should support multiple export formats', async () => {
      const formats = ['csv', 'json', 'xlsx'];

      for (const format of formats) {
        const result = await service.exportErrorLogs({ format });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('searchErrorLogs', () => {
    it('should search logs by message content', async () => {
      await service.logError(new Error('Database connection failed'), 'db-service', 'high');
      await service.logError(new Error('API timeout occurred'), 'api-service', 'medium');

      const result = await service.searchErrorLogs({
        query: 'database',
        page: 1,
        limit: 10
      });

      expect(result.logs.every(log => 
        log.message.toLowerCase().includes('database')
      )).toBe(true);
    });

    it('should search logs by multiple criteria', async () => {
      const result = await service.searchErrorLogs({
        query: 'connection',
        severity: 'high',
        context: 'db-service',
        page: 1,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.logs)).toBe(true);
    });
  });
});