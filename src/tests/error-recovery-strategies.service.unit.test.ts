import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorRecoveryStrategiesService } from '@/services/error-recovery-strategies';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';
import { AccountingIntegrationError, POSIntegrationError } from '@/errors';

describe('ErrorRecoveryStrategiesService', () => {
  let service: ErrorRecoveryStrategiesService;

  beforeEach(() => {
    service = new ErrorRecoveryStrategiesService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('executeRecoveryStrategy', () => {
    it('should execute appropriate recovery strategy for accounting errors', async () => {
      const error = new AccountingIntegrationError('Sync failed', 'SYNC_ERROR');
      const context = 'journal-entry-sync';

      vi.spyOn(service as any, 'retryWithBackoff').mockResolvedValue({ success: true });

      const result = await service.executeRecoveryStrategy(error, context);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('retry_with_backoff');
      expect(service['retryWithBackoff']).toHaveBeenCalled();
    });

    it('should execute fallback strategy for POS errors', async () => {
      const error = new POSIntegrationError('Inventory sync failed', 'INVENTORY_ERROR');
      const context = 'inventory-sync';

      vi.spyOn(service as any, 'queueForLaterProcessing').mockResolvedValue({ success: true });

      const result = await service.executeRecoveryStrategy(error, context);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('queue_for_later');
      expect(service['queueForLaterProcessing']).toHaveBeenCalled();
    });

    it('should handle unknown error types gracefully', async () => {
      const error = new Error('Unknown error');
      const context = 'unknown-context';

      const result = await service.executeRecoveryStrategy(error, context);

      expect(result.success).toBe(false);
      expect(result.strategy).toBe('no_recovery');
      expect(result.message).toContain('No recovery strategy available');
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry operation with exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await service.retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2
      });

      expect(result.success).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const result = await service.retryWithBackoff(operation, {
        maxRetries: 2,
        initialDelay: 50,
        backoffMultiplier: 2
      });

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect maximum delay limit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      const startTime = Date.now();

      await service.retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 10,
        maxDelay: 2000
      });

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(10000); // Should not take too long due to maxDelay
    });
  });

  describe('queueForLaterProcessing', () => {
    it('should queue failed operation for later processing', async () => {
      const operation = {
        type: 'inventory_sync',
        data: { productId: 'prod-123', quantity: 50 },
        context: 'pos-integration'
      };

      const result = await service.queueForLaterProcessing(operation);

      expect(result.success).toBe(true);
      expect(result.queueId).toBeDefined();

      const queuedItems = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'recovery_queue'
      );
      expect(queuedItems).toHaveLength(1);
    });

    it('should set appropriate retry schedule', async () => {
      const operation = {
        type: 'journal_entry_sync',
        data: { entryId: 'je-123' },
        priority: 'high'
      };

      await service.queueForLaterProcessing(operation);

      const queuedItems = mockDatabase.getCallHistory().filter(call => 
        call.method === 'insert' && call.table === 'recovery_queue'
      );
      
      const queuedItem = queuedItems[0].args[0];
      expect(queuedItem.scheduledFor).toBeInstanceOf(Date);
      expect(queuedItem.priority).toBe('high');
    });
  });

  describe('processRecoveryQueue', () => {
    it('should process queued recovery operations', async () => {
      // Seed recovery queue with test data
      mockDatabase.seedData('recovery_queue', [
        {
          id: '1',
          type: 'inventory_sync',
          data: { productId: 'prod-123' },
          status: 'pending',
          scheduledFor: new Date(Date.now() - 1000), // Past due
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'journal_entry_sync',
          data: { entryId: 'je-456' },
          status: 'pending',
          scheduledFor: new Date(Date.now() + 60000), // Future
          createdAt: new Date()
        }
      ]);

      vi.spyOn(service as any, 'executeQueuedOperation').mockResolvedValue({ success: true });

      const result = await service.processRecoveryQueue();

      expect(result.processed).toBe(1); // Only the past due item
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle processing failures gracefully', async () => {
      mockDatabase.seedData('recovery_queue', [
        {
          id: '1',
          type: 'failing_operation',
          data: {},
          status: 'pending',
          scheduledFor: new Date(Date.now() - 1000),
          createdAt: new Date()
        }
      ]);

      vi.spyOn(service as any, 'executeQueuedOperation').mockRejectedValue(new Error('Processing failed'));

      const result = await service.processRecoveryQueue();

      expect(result.processed).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
    });
  });

  describe('getRecoveryStrategies', () => {
    it('should return available recovery strategies', async () => {
      const strategies = await service.getRecoveryStrategies();

      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
      
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('name');
        expect(strategy).toHaveProperty('description');
        expect(strategy).toHaveProperty('applicableErrors');
      });
    });
  });

  describe('configureRecoveryStrategy', () => {
    it('should configure recovery strategy for error type', async () => {
      const config = {
        errorType: 'AccountingIntegrationError',
        strategy: 'retry_with_backoff',
        parameters: {
          maxRetries: 5,
          initialDelay: 200,
          backoffMultiplier: 1.5
        }
      };

      const result = await service.configureRecoveryStrategy(config);

      expect(result.success).toBe(true);
      expect(result.configId).toBeDefined();
    });

    it('should validate strategy configuration', async () => {
      const invalidConfig = {
        errorType: 'UnknownError',
        strategy: 'invalid_strategy'
      };

      await expect(service.configureRecoveryStrategy(invalidConfig))
        .rejects.toThrow('Invalid recovery strategy configuration');
    });
  });

  describe('getRecoveryStats', () => {
    it('should return recovery statistics', async () => {
      const stats = await service.getRecoveryStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalRecoveryAttempts');
      expect(stats).toHaveProperty('successfulRecoveries');
      expect(stats).toHaveProperty('failedRecoveries');
      expect(stats).toHaveProperty('strategiesUsed');
      expect(stats).toHaveProperty('averageRecoveryTime');
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const stats = await service.getRecoveryStats({ startDate, endDate });

      expect(stats.dateRange).toEqual({ startDate, endDate });
    });
  });

  describe('circuitBreakerStrategy', () => {
    it('should open circuit breaker after consecutive failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      const circuitName = 'test-service';

      // Trigger multiple failures to open circuit
      for (let i = 0; i < 5; i++) {
        await service.executeWithCircuitBreaker(operation, circuitName);
      }

      const circuitState = await service.getCircuitBreakerState(circuitName);
      expect(circuitState.state).toBe('open');
    });

    it('should allow requests in half-open state after timeout', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce({ success: true });
      const circuitName = 'recovery-test-service';

      // Open the circuit
      await service.executeWithCircuitBreaker(operation, circuitName);
      
      // Simulate timeout passage
      vi.spyOn(service as any, 'isCircuitBreakerTimeoutExpired').mockReturnValue(true);

      const result = await service.executeWithCircuitBreaker(operation, circuitName);

      expect(result.success).toBe(true);
      
      const circuitState = await service.getCircuitBreakerState(circuitName);
      expect(circuitState.state).toBe('closed');
    });
  });

  describe('bulkRecoveryOperation', () => {
    it('should process multiple recovery operations in batch', async () => {
      const operations = [
        { type: 'sync_journal_entry', data: { id: '1' } },
        { type: 'sync_journal_entry', data: { id: '2' } },
        { type: 'sync_journal_entry', data: { id: '3' } }
      ];

      vi.spyOn(service as any, 'executeQueuedOperation').mockResolvedValue({ success: true });

      const result = await service.bulkRecoveryOperation(operations);

      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle partial batch failures', async () => {
      const operations = [
        { type: 'sync_journal_entry', data: { id: '1' } },
        { type: 'sync_journal_entry', data: { id: '2' } }
      ];

      vi.spyOn(service as any, 'executeQueuedOperation')
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Operation failed'));

      const result = await service.bulkRecoveryOperation(operations);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});