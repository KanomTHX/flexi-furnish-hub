import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountingSyncMonitorService } from '@/services/accounting-sync-monitor.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('AccountingSyncMonitorService', () => {
  let service: AccountingSyncMonitorService;

  beforeEach(() => {
    service = new AccountingSyncMonitorService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', async () => {
      const status = await service.getSyncStatus();
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('nextSync');
      expect(status).toHaveProperty('errorCount');
    });
  });

  describe('startSync', () => {
    it('should start synchronization process', async () => {
      const result = await service.startSync();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.syncId).toBeDefined();
    });

    it('should prevent multiple concurrent syncs', async () => {
      await service.startSync();
      
      await expect(service.startSync())
        .rejects.toThrow('Sync already in progress');
    });
  });

  describe('stopSync', () => {
    it('should stop running synchronization', async () => {
      await service.startSync();
      
      const result = await service.stopSync();
      
      expect(result.success).toBe(true);
    });

    it('should handle stop when no sync is running', async () => {
      const result = await service.stopSync();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('No sync in progress');
    });
  });

  describe('getSyncHistory', () => {
    it('should return sync history with pagination', async () => {
      const history = await service.getSyncHistory({ page: 1, limit: 10 });
      
      expect(history).toBeDefined();
      expect(history).toHaveProperty('records');
      expect(history).toHaveProperty('total');
      expect(history).toHaveProperty('page');
      expect(history).toHaveProperty('limit');
      expect(Array.isArray(history.records)).toBe(true);
    });

    it('should filter sync history by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const history = await service.getSyncHistory({
        startDate,
        endDate,
        page: 1,
        limit: 10
      });
      
      expect(history.records.every(record => 
        record.createdAt >= startDate && record.createdAt <= endDate
      )).toBe(true);
    });
  });

  describe('getSyncErrors', () => {
    it('should return recent sync errors', async () => {
      const errors = await service.getSyncErrors();
      
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should filter errors by severity', async () => {
      const criticalErrors = await service.getSyncErrors({ severity: 'critical' });
      
      expect(Array.isArray(criticalErrors)).toBe(true);
      expect(criticalErrors.every(error => error.severity === 'critical')).toBe(true);
    });
  });

  describe('retryFailedSync', () => {
    it('should retry a failed sync operation', async () => {
      const syncId = 'failed-sync-id';
      
      const result = await service.retryFailedSync(syncId);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.newSyncId).toBeDefined();
    });

    it('should handle retry of non-existent sync', async () => {
      const syncId = 'non-existent-sync-id';
      
      await expect(service.retryFailedSync(syncId))
        .rejects.toThrow('Sync record not found');
    });
  });

  describe('scheduleSync', () => {
    it('should schedule automatic sync', async () => {
      const schedule = {
        frequency: 'daily',
        time: '02:00',
        enabled: true
      };

      const result = await service.scheduleSync(schedule);
      
      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeDefined();
    });

    it('should validate schedule parameters', async () => {
      const invalidSchedule = {
        frequency: 'invalid-frequency'
      };

      await expect(service.scheduleSync(invalidSchedule))
        .rejects.toThrow('Invalid schedule frequency');
    });
  });

  describe('getHealthCheck', () => {
    it('should return system health status', async () => {
      const health = await service.getHealthCheck();
      
      expect(health).toBeDefined();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('timestamp');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });
  });
});