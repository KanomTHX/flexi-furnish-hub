import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountingAPIGateway } from '@/services/accounting-api-gateway.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('AccountingAPIGateway', () => {
  let service: AccountingAPIGateway;

  beforeEach(() => {
    service = new AccountingAPIGateway();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('syncJournalEntries', () => {
    it('should sync journal entries to external system', async () => {
      const journalEntry = TestDataFactory.createTestJournalEntry();
      
      const result = await service.syncJournalEntries([journalEntry]);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(1);
    });

    it('should handle sync errors gracefully', async () => {
      const journalEntry = TestDataFactory.createTestJournalEntry();
      
      // Mock external API failure
      vi.spyOn(service as any, 'callExternalAPI').mockRejectedValue(new Error('API Error'));
      
      const result = await service.syncJournalEntries([journalEntry]);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getAccountMapping', () => {
    it('should return account mapping configuration', async () => {
      const mapping = await service.getAccountMapping();
      
      expect(mapping).toBeDefined();
      expect(Array.isArray(mapping)).toBe(true);
    });
  });

  describe('validateConnection', () => {
    it('should validate external system connection', async () => {
      const isValid = await service.validateConnection('quickbooks');
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should handle connection validation errors', async () => {
      vi.spyOn(service as any, 'testConnection').mockRejectedValue(new Error('Connection failed'));
      
      const isValid = await service.validateConnection('invalid-system');
      
      expect(isValid).toBe(false);
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status information', async () => {
      const status = await service.getSystemStatus();
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('systemType');
    });
  });
});