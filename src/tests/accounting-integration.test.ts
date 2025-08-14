import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccountingAPIGatewayFactory } from '../services/accounting-api-gateway.service';
import { QuickBooksAPIGateway } from '../services/quickbooks-adapter.service';
import { XeroAPIGateway } from '../services/xero-adapter.service';
import { accountingConfigService } from '../services/accounting-config.service';
import { accountingSyncMonitorService } from '../services/accounting-sync-monitor.service';
import { AccountingIntegrationError } from '../errors/accounting';
import { 
  QuickBooksConfig, 
  XeroConfig, 
  JournalEntry, 
  JournalEntryLine 
} from '../types/accounting';

// Mock Supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      upsert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })),
      update: vi.fn(() => ({ eq: vi.fn() })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn() })) })),
      rpc: vi.fn()
    }))
  }
}));

describe('Accounting Integration Tests', () => {
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
        },
        {
          id: 'line-2',
          accountId: 'acc-2',
          account: {
            id: 'acc-2',
            code: '6000',
            name: 'Office Supplies',
            type: 'expense',
            category: 'operating_expense',
            balance: 0,
            isActive: true,
            description: 'Office supplies expense',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          description: 'Office supplies purchase',
          debitAmount: 0,
          creditAmount: 1000,
          reference: 'INV-001'
        }
      ],
      attachments: [],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AccountingAPIGatewayFactory', () => {
    it('should create QuickBooks gateway for quickbooks system type', () => {
      const gateway = AccountingAPIGatewayFactory.create('quickbooks');
      expect(gateway).toBeInstanceOf(QuickBooksAPIGateway);
    });

    it('should create Xero gateway for xero system type', () => {
      const gateway = AccountingAPIGatewayFactory.create('xero');
      expect(gateway).toBeInstanceOf(XeroAPIGateway);
    });

    it('should throw error for unsupported system type', () => {
      expect(() => {
        AccountingAPIGatewayFactory.create('unsupported' as any);
      }).toThrow(AccountingIntegrationError);
    });
  });

  describe('QuickBooksAPIGateway', () => {
    let gateway: QuickBooksAPIGateway;

    beforeEach(() => {
      gateway = new QuickBooksAPIGateway();
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
  });

  describe('XeroAPIGateway', () => {
    let gateway: XeroAPIGateway;

    beforeEach(() => {
      gateway = new XeroAPIGateway();
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
  });

  describe('AccountingConfigService', () => {
    beforeEach(() => {
      // Mock successful database operations
      const mockSupabase = {
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'config-id',
                  system_type: 'quickbooks',
                  api_url: mockQuickBooksConfig.apiUrl,
                  encrypted_credentials: 'encrypted-data',
                  is_active: true,
                  configuration: {},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              }))
            }))
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'config-id',
                  system_type: 'quickbooks',
                  api_url: mockQuickBooksConfig.apiUrl,
                  encrypted_credentials: 'eyJhY2Nlc3NUb2tlbiI6InRlc3QtdG9rZW4ifQ==', // base64 encoded
                  is_active: true,
                  configuration: {
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    companyId: 'test-company-id',
                    environment: 'sandbox'
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              }))
            }))
          }))
        }))
      };

      vi.mocked(require('../integrations/supabase/client').supabase).mockReturnValue(mockSupabase);
    });

    it('should save config successfully', async () => {
      const result = await accountingConfigService.saveConfig(mockQuickBooksConfig);
      expect(result.systemType).toBe('quickbooks');
      expect(result.isActive).toBe(true);
    });

    it('should retrieve config successfully', async () => {
      const result = await accountingConfigService.getConfig('quickbooks');
      expect(result).not.toBeNull();
      expect(result?.systemType).toBe('quickbooks');
    });

    it('should test config successfully', async () => {
      // Mock the gateway factory to return a mock gateway
      const mockGateway = {
        connect: vi.fn().mockResolvedValue(true),
        testConnection: vi.fn().mockResolvedValue(true),
        disconnect: vi.fn().mockResolvedValue(undefined)
      };

      vi.doMock('../services/accounting-api-gateway.service', () => ({
        AccountingAPIGatewayFactory: {
          create: vi.fn().mockReturnValue(mockGateway)
        }
      }));

      const result = await accountingConfigService.testConfig(mockQuickBooksConfig);
      expect(result).toBe(true);
      expect(mockGateway.connect).toHaveBeenCalledWith(mockQuickBooksConfig);
      expect(mockGateway.testConnection).toHaveBeenCalled();
      expect(mockGateway.disconnect).toHaveBeenCalled();
    });
  });

  describe('AccountingSyncMonitorService', () => {
    beforeEach(() => {
      // Mock successful database operations
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'sync-id',
                  integration_type: 'accounting',
                  system_type: 'quickbooks',
                  sync_type: 'journal_entries',
                  status: 'pending',
                  started_at: new Date().toISOString(),
                  records_processed: 0,
                  retry_count: 0,
                  max_retries: 3
                },
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'sync-id',
                  integration_type: 'accounting',
                  system_type: 'quickbooks',
                  sync_type: 'journal_entries',
                  status: 'completed',
                  started_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  records_processed: 5,
                  records_succeeded: 5,
                  records_failed: 0,
                  retry_count: 0,
                  max_retries: 3
                },
                error: null
              }))
            }))
          }))
        }))
      };

      vi.mocked(require('../integrations/supabase/client').supabase).mockReturnValue(mockSupabase);
    });

    it('should start sync monitoring successfully', async () => {
      const syncId = await accountingSyncMonitorService.startSync('quickbooks', 'journal_entries');
      expect(syncId).toBe('sync-id');
    });

    it('should update sync status successfully', async () => {
      await expect(
        accountingSyncMonitorService.updateSyncStatus('sync-id', {
          status: 'in_progress',
          recordsProcessed: 3
        })
      ).resolves.not.toThrow();
    });

    it('should complete sync with result successfully', async () => {
      const mockResult = {
        id: 'result-id',
        integrationId: 'integration-id',
        syncType: 'full',
        status: 'success',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        recordsProcessed: 5,
        recordsSucceeded: 5,
        recordsFailed: 0,
        errors: [],
        summary: {
          accountsSynced: 3,
          journalEntriesSynced: 2,
          customersSynced: 0,
          suppliersSynced: 0,
          conflictsDetected: 0,
          conflictsResolved: 0
        }
      };

      await expect(
        accountingSyncMonitorService.completeSyncWithResult('sync-id', mockResult)
      ).resolves.not.toThrow();
    });

    it('should fail sync successfully', async () => {
      const error = new AccountingIntegrationError('Test error', 'TEST_ERROR');
      
      await expect(
        accountingSyncMonitorService.failSync('sync-id', error)
      ).resolves.not.toThrow();
    });

    it('should retrieve sync status successfully', async () => {
      const status = await accountingSyncMonitorService.getSyncStatus('sync-id');
      expect(status).not.toBeNull();
      expect(status?.id).toBe('sync-id');
      expect(status?.systemType).toBe('quickbooks');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      const gateway = new QuickBooksAPIGateway();
      const invalidConfig = { ...mockQuickBooksConfig, accessToken: undefined };
      
      await expect(gateway.connect(invalidConfig)).rejects.toThrow(AccountingIntegrationError);
    });

    it('should handle sync failures gracefully', async () => {
      const gateway = new QuickBooksAPIGateway();
      
      // Try to sync without connecting first
      await expect(gateway.syncJournalEntry(mockJournalEntry)).rejects.toThrow(AccountingIntegrationError);
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

  describe('Integration Workflow', () => {
    it('should complete full integration workflow', async () => {
      // 1. Save configuration
      const savedConfig = await accountingConfigService.saveConfig(mockQuickBooksConfig);
      expect(savedConfig.systemType).toBe('quickbooks');

      // 2. Test configuration
      const testResult = await accountingConfigService.testConfig(savedConfig);
      expect(testResult).toBe(true);

      // 3. Start sync monitoring
      const syncId = await accountingSyncMonitorService.startSync('quickbooks', 'journal_entries');
      expect(syncId).toBeDefined();

      // 4. Create gateway and connect
      const gateway = AccountingAPIGatewayFactory.create('quickbooks');
      await gateway.connect(savedConfig);

      // 5. Sync journal entry
      const syncResult = await gateway.syncJournalEntry(mockJournalEntry);
      expect(syncResult.success).toBe(true);

      // 6. Complete sync monitoring
      const mockResult = {
        id: syncId,
        integrationId: 'integration-id',
        syncType: 'full' as const,
        status: 'success' as const,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        recordsProcessed: 1,
        recordsSucceeded: 1,
        recordsFailed: 0,
        errors: [],
        summary: {
          accountsSynced: 0,
          journalEntriesSynced: 1,
          customersSynced: 0,
          suppliersSynced: 0,
          conflictsDetected: 0,
          conflictsResolved: 0
        }
      };

      await accountingSyncMonitorService.completeSyncWithResult(syncId, mockResult);

      // 7. Verify sync status
      const finalStatus = await accountingSyncMonitorService.getSyncStatus(syncId);
      expect(finalStatus?.status).toBe('completed');
    });
  });
});