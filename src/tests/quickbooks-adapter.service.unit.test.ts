import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuickBooksAdapterService } from '@/services/quickbooks-adapter.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('QuickBooksAdapterService', () => {
  let service: QuickBooksAdapterService;

  beforeEach(() => {
    service = new QuickBooksAdapterService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('authenticate', () => {
    it('should authenticate with QuickBooks API', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      };

      const result = await service.authenticate(credentials);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
    });

    it('should handle authentication failures', async () => {
      const invalidCredentials = {
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret',
        redirectUri: 'invalid-uri'
      };

      vi.spyOn(service as any, 'callQuickBooksAPI').mockRejectedValue(new Error('Authentication failed'));

      await expect(service.authenticate(invalidCredentials))
        .rejects.toThrow('Authentication failed');
    });
  });

  describe('syncJournalEntries', () => {
    it('should sync journal entries to QuickBooks', async () => {
      const journalEntries = [
        TestDataFactory.createTestJournalEntry(),
        TestDataFactory.createTestJournalEntry()
      ];

      const result = await service.syncJournalEntries(journalEntries);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial sync failures', async () => {
      const journalEntries = [
        TestDataFactory.createTestJournalEntry(),
        TestDataFactory.createTestJournalEntry()
      ];

      vi.spyOn(service as any, 'createJournalEntry')
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('QuickBooks API error'));

      const result = await service.syncJournalEntries(journalEntries);
      
      expect(result.success).toBe(false);
      expect(result.recordsProcessed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getChartOfAccounts', () => {
    it('should fetch chart of accounts from QuickBooks', async () => {
      const accounts = await service.getChartOfAccounts();
      
      expect(Array.isArray(accounts)).toBe(true);
    });

    it('should handle API errors when fetching accounts', async () => {
      vi.spyOn(service as any, 'callQuickBooksAPI').mockRejectedValue(new Error('API Error'));

      await expect(service.getChartOfAccounts())
        .rejects.toThrow('API Error');
    });
  });

  describe('createAccount', () => {
    it('should create account in QuickBooks', async () => {
      const accountData = {
        name: 'Test Account',
        accountType: 'Expense',
        accountSubType: 'AdvertisingPromotional'
      };

      const result = await service.createAccount(accountData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(accountData.name);
    });

    it('should validate account data before creation', async () => {
      const invalidAccountData = {
        name: '', // Empty name should fail validation
        accountType: 'InvalidType'
      };

      await expect(service.createAccount(invalidAccountData))
        .rejects.toThrow('Invalid account data');
    });
  });

  describe('getCompanyInfo', () => {
    it('should fetch company information from QuickBooks', async () => {
      const companyInfo = await service.getCompanyInfo();
      
      expect(companyInfo).toBeDefined();
      expect(companyInfo).toHaveProperty('companyName');
      expect(companyInfo).toHaveProperty('country');
      expect(companyInfo).toHaveProperty('fiscalYearStart');
    });
  });

  describe('validateConnection', () => {
    it('should validate QuickBooks connection', async () => {
      const isValid = await service.validateConnection();
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for invalid connection', async () => {
      vi.spyOn(service as any, 'callQuickBooksAPI').mockRejectedValue(new Error('Unauthorized'));

      const isValid = await service.validateConnection();
      
      expect(isValid).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'test-refresh-token';

      const result = await service.refreshToken(refreshToken);
      
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should handle token refresh failures', async () => {
      const invalidRefreshToken = 'invalid-token';

      vi.spyOn(service as any, 'callQuickBooksAPI').mockRejectedValue(new Error('Invalid refresh token'));

      await expect(service.refreshToken(invalidRefreshToken))
        .rejects.toThrow('Invalid refresh token');
    });
  });
});