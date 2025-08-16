import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountingConfigService } from '@/services/accounting-config.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('AccountingConfigService', () => {
  let service: AccountingConfigService;

  beforeEach(() => {
    service = new AccountingConfigService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('getConfiguration', () => {
    it('should return accounting system configuration', async () => {
      const config = await service.getConfiguration();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('systemType');
      expect(config).toHaveProperty('connectionSettings');
      expect(config).toHaveProperty('accountMapping');
    });
  });

  describe('updateConfiguration', () => {
    it('should update accounting configuration', async () => {
      const newConfig = {
        systemType: 'quickbooks',
        connectionSettings: {
          apiUrl: 'https://api.quickbooks.com',
          clientId: 'test-client-id'
        },
        accountMapping: {
          'accounts_payable': '2000',
          'expenses': '5000'
        }
      };

      const result = await service.updateConfiguration(newConfig);
      
      expect(result).toBeDefined();
      expect(result.systemType).toBe('quickbooks');
    });

    it('should validate configuration before updating', async () => {
      const invalidConfig = {
        systemType: 'invalid-system'
      };

      await expect(service.updateConfiguration(invalidConfig))
        .rejects.toThrow('Invalid system type');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration structure', async () => {
      const validConfig = {
        systemType: 'quickbooks',
        connectionSettings: {
          apiUrl: 'https://api.quickbooks.com',
          clientId: 'test-client-id'
        }
      };

      const isValid = await service.validateConfiguration(validConfig);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        systemType: 'unknown'
      };

      const isValid = await service.validateConfiguration(invalidConfig);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getAccountMapping', () => {
    it('should return account mapping for system type', async () => {
      const mapping = await service.getAccountMapping('quickbooks');
      
      expect(mapping).toBeDefined();
      expect(typeof mapping).toBe('object');
    });
  });

  describe('testConnection', () => {
    it('should test connection with current configuration', async () => {
      const result = await service.testConnection();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });

    it('should handle connection test failures', async () => {
      vi.spyOn(service as any, 'performConnectionTest').mockRejectedValue(new Error('Connection failed'));
      
      const result = await service.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection failed');
    });
  });
});