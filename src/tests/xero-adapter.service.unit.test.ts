import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XeroAdapterService } from '@/services/xero-adapter.service';
import { TestDataFactory } from '@/test/factories';
import { mockDatabase } from '@/test/mocks';

describe('XeroAdapterService', () => {
  let service: XeroAdapterService;

  beforeEach(() => {
    service = new XeroAdapterService();
    mockDatabase.clearData();
    TestDataFactory.reset();
  });

  describe('authenticate', () => {
    it('should authenticate with Xero API', async () => {
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

      vi.spyOn(service as any, 'callXeroAPI').mockRejectedValue(new Error('Authentication failed'));

      await expect(service.authenticate(invalidCredentials))
        .rejects.toThrow('Authentication failed');
    });
  });

  describe('syncJournalEntries', () => {
    it('should sync journal entries to Xero', async () => {
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

    it('should handle sync errors gracefully', async () => {
      const journalEntries = [TestDataFactory.createTestJournalEntry()];

      vi.spyOn(service as any, 'createManualJournal').mockRejectedValue(new Error('Xero API error'));

      const result = await service.syncJournalEntries(journalEntries);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getChartOfAccounts', () => {
    it('should fetch chart of accounts from Xero', async () => {
      const accounts = await service.getChartOfAccounts();
      
      expect(Array.isArray(accounts)).toBe(true);
    });

    it('should handle API errors when fetching accounts', async () => {
      vi.spyOn(service as any, 'callXeroAPI').mockRejectedValue(new Error('API Error'));

      await expect(service.getChartOfAccounts())
        .rejects.toThrow('API Error');
    });
  });

  describe('createAccount', () => {
    it('should create account in Xero', async () => {
      const accountData = {
        code: 'TEST001',
        name: 'Test Account',
        type: 'EXPENSE'
      };

      const result = await service.createAccount(accountData);
      
      expect(result).toBeDefined();
      expect(result.accountID).toBeDefined();
      expect(result.name).toBe(accountData.name);
    });

    it('should validate account data before creation', async () => {
      const invalidAccountData = {
        code: '', // Empty code should fail validation
        name: '',
        type: 'INVALID_TYPE'
      };

      await expect(service.createAccount(invalidAccountData))
        .rejects.toThrow('Invalid account data');
    });
  });

  describe('getOrganisation', () => {
    it('should fetch organisation information from Xero', async () => {
      const orgInfo = await service.getOrganisation();
      
      expect(orgInfo).toBeDefined();
      expect(orgInfo).toHaveProperty('name');
      expect(orgInfo).toHaveProperty('countryCode');
      expect(orgInfo).toHaveProperty('financialYearEndMonth');
    });
  });

  describe('validateConnection', () => {
    it('should validate Xero connection', async () => {
      const isValid = await service.validateConnection();
      
      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for invalid connection', async () => {
      vi.spyOn(service as any, 'callXeroAPI').mockRejectedValue(new Error('Unauthorized'));

      const isValid = await service.validateConnection();
      
      expect(isValid).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'test-refresh-token';

      const result = await service.refreshToken(refreshToken);
      
      expect(result).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it('should handle token refresh failures', async () => {
      const invalidRefreshToken = 'invalid-token';

      vi.spyOn(service as any, 'callXeroAPI').mockRejectedValue(new Error('Invalid refresh token'));

      await expect(service.refreshToken(invalidRefreshToken))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getContacts', () => {
    it('should fetch contacts from Xero', async () => {
      const contacts = await service.getContacts();
      
      expect(Array.isArray(contacts)).toBe(true);
    });

    it('should filter contacts by type', async () => {
      const suppliers = await service.getContacts({ where: 'IsSupplier==true' });
      
      expect(Array.isArray(suppliers)).toBe(true);
    });
  });

  describe('createContact', () => {
    it('should create contact in Xero', async () => {
      const contactData = {
        name: 'Test Supplier',
        isSupplier: true,
        emailAddress: 'supplier@test.com'
      };

      const result = await service.createContact(contactData);
      
      expect(result).toBeDefined();
      expect(result.contactID).toBeDefined();
      expect(result.name).toBe(contactData.name);
    });
  });
});