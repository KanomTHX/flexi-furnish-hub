import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuickBooksAPIGateway } from '../services/quickbooks-adapter.service';
import { XeroAPIGateway } from '../services/xero-adapter.service';
import { AccountingIntegrationError } from '../errors/accounting';
import { 
  QuickBooksConfig, 
  XeroConfig, 
  JournalEntry 
} from '../types/accounting';

describe('Accounting Integration - Simple Tests', () => {
  let mockQuickBooksConfig: QuickBooksConfig;
  let mockXeroConfig: XeroConfig;
  let mockJournalEntry: JournalEntry;

  beforeEach(() => {
    mockQuickBooksConfig = {
      systemType: 'quickbooks',
      apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
      credentials: { accessToken: 'test-token' },
      isActive: true,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      companyId: 'test-company-id',
      environment: 'sandbox',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token'
    };

    mockXeroConfig = {
      systemType: 'xero',
      apiUrl: 'https://api.xero.com/api.xro/2.0',
      credentials: { accessToken: 'test-token' },
      isActive: true,
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tenantId: 'test-tenant-id',
      scopes: ['accounting.transactions', 'accounting.settings'],
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token'
    };

    mockJournalEntry = {
      id: 'test-entry-id',
      entryNumber: 'JE-001',
      date: '2024-01-15',
      description: 'Test journal entry',
      reference: 'REF-001',
      totalDebit: 1000,
      totalCredit: 1000,
      status: 'approved',
      createdBy: 'test-user',
      entries: [
        {
          id: 'line-1',
          accountId: 'acc-1',
          account: {
            id: 'acc-1',
            code: '2000',
            name: 'Accounts Payable',
            type: 'liability',
            category: 'current_liability',
            balance: 0,
            isActive: true,
            description: 'Supplier payables',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          description: 'Supplier invoice',
          debitAmount: 1000,
          creditAmount: 0,
          reference: 'INV-001'
        }
      ],
      attachments: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };
  });

  describe('QuickBooksAPIGateway', () => {
    let gateway: QuickBooksAPIGateway;

    beforeEach(() => {
      gateway = new QuickBooksAPIGateway();
    });

    it('should create instance successfully', () => {
      expect(gateway).toBeInstanceOf(QuickBooksAPIGateway);
    });

    it('should connect successfully with valid config', async () => {
      const result = await gateway.connect(mockQuickBooksConfig);
      expect(result).toBe(true);
    });

    it('should throw error with invalid config', async () => {
      const invalidConfig = { ...mockQuickBooksConfig, clientId: '' };
      await expect(gateway.connect(invalidConfig)).rejects.toThrow(AccountingIntegrationError);
    });

    it('should test connection successfully when connected', async () => {
      await gateway.connect(mockQuickBooksConfig);
      const result = await gateway.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for connection test when not connected', async () => {
      const result = await gateway.testConnection();
      expect(result).toBe(false);
    });

    it('should sync journal entry successfully', async () => {
      await gateway.connect(mockQuickBooksConfig);
      const result = await gateway.syncJournalEntry(mockJournalEntry);
      
      expect(result.success).toBe(true);
      expect(result.externalId).toBeDefined();
      expect(result.syncedAt).toBeInstanceOf(Date);
    });

    it('should sync chart of accounts successfully', async () => {
      await gateway.connect(mockQuickBooksConfig);
      const result = await gateway.syncChartOfAccounts();
      
      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBeGreaterThan(0);
      expect(result.details?.accounts).toBeDefined();
    });

    it('should fetch system info successfully', async () => {
      await gateway.connect(mockQuickBooksConfig);
      const systemInfo = await gateway.getSystemInfo();
      
      expect(systemInfo.systemType).toBe('quickbooks');
      expect(systemInfo.companyName).toBeDefined();
      expect(systemInfo.version).toBeDefined();
    });

    it('should validate QuickBooks config correctly', async () => {
      const validResult = await gateway.validateConfig(mockQuickBooksConfig);
      expect(validResult).toBe(true);

      const invalidConfig = { ...mockQuickBooksConfig, environment: 'invalid' as any };
      const invalidResult = await gateway.validateConfig(invalidConfig);
      expect(invalidResult).toBe(false);
    });

    it('should handle sync failures gracefully', async () => {
      // Try to sync without connecting first
      await expect(gateway.syncJournalEntry(mockJournalEntry)).rejects.toThrow(AccountingIntegrationError);
    });
  });

  describe('XeroAPIGateway', () => {
    let gateway: XeroAPIGateway;

    beforeEach(() => {
      gateway = new XeroAPIGateway();
    });

    it('should create instance successfully', () => {
      expect(gateway).toBeInstanceOf(XeroAPIGateway);
    });

    it('should connect successfully with valid config', async () => {
      const result = await gateway.connect(mockXeroConfig);
      expect(result).toBe(true);
    });

    it('should throw error with invalid config', async () => {
      const invalidConfig = { ...mockXeroConfig, tenantId: '' };
      await expect(gateway.connect(invalidConfig)).rejects.toThrow(AccountingIntegrationError);
    });

    it('should test connection successfully when connected', async () => {
      await gateway.connect(mockXeroConfig);
      const result = await gateway.testConnection();
      expect(result).toBe(true);
    });

    it('should sync journal entry successfully', async () => {
      await gateway.connect(mockXeroConfig);
      const result = await gateway.syncJournalEntry(mockJournalEntry);
      
      expect(result.success).toBe(true);
      expect(result.externalId).toBeDefined();
      expect(result.syncedAt).toBeInstanceOf(Date);
    });

    it('should sync chart of accounts successfully', async () => {
      await gateway.connect(mockXeroConfig);
      const result = await gateway.syncChartOfAccounts();
      
      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBeGreaterThan(0);
      expect(result.details?.accounts).toBeDefined();
    });

    it('should fetch system info successfully', async () => {
      await gateway.connect(mockXeroConfig);
      const systemInfo = await gateway.getSystemInfo();
      
      expect(systemInfo.systemType).toBe('xero');
      expect(systemInfo.organisationName).toBeDefined();
      expect(systemInfo.version).toBeDefined();
    });

    it('should validate Xero config correctly', async () => {
      const validResult = await gateway.validateConfig(mockXeroConfig);
      expect(validResult).toBe(true);

      const invalidConfig = { ...mockXeroConfig, scopes: [] };
      const invalidResult = await gateway.validateConfig(invalidConfig);
      expect(invalidResult).toBe(false);
    });

    it('should handle sync failures gracefully', async () => {
      // Try to sync without connecting first
      await expect(gateway.syncJournalEntry(mockJournalEntry)).rejects.toThrow(AccountingIntegrationError);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      const gateway = new QuickBooksAPIGateway();
      const invalidConfig = { ...mockQuickBooksConfig, accessToken: undefined };
      
      await expect(gateway.connect(invalidConfig)).rejects.toThrow(AccountingIntegrationError);
    });

    it('should handle network timeouts', async () => {
      const gateway = new QuickBooksAPIGateway();
      await gateway.connect(mockQuickBooksConfig);
      
      // Mock a network timeout scenario
      vi.spyOn(gateway as any, 'makeQuickBooksRequest').mockRejectedValue(new Error('Network timeout'));
      
      const result = await gateway.syncJournalEntry(mockJournalEntry);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });


  });
});