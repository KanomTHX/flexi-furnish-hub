/**
 * External Accounting System Integration Usage Examples
 * 
 * This file demonstrates how to use the external accounting system integration
 * features including QuickBooks and Xero adapters, configuration management,
 * and sync monitoring.
 */

import { AccountingAPIGatewayFactory } from '../services/accounting-api-gateway.service';
import { accountingConfigService } from '../services/accounting-config.service';
import { accountingSyncMonitorService } from '../services/accounting-sync-monitor.service';
import { 
  QuickBooksConfig, 
  XeroConfig, 
  JournalEntry,
  AccountingSystemType 
} from '../types/accounting';

// Example configurations
const quickbooksConfig: QuickBooksConfig = {
  systemType: 'quickbooks',
  apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
  credentials: {
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token'
  },
  isActive: true,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  companyId: 'your-company-id',
  environment: 'sandbox', // or 'production'
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token'
};

const xeroConfig: XeroConfig = {
  systemType: 'xero',
  apiUrl: 'https://api.xero.com/api.xro/2.0',
  credentials: {
    accessToken: 'your-access-token',
    refreshToken: 'your-refresh-token'
  },
  isActive: true,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tenantId: 'your-tenant-id',
  scopes: ['accounting.transactions', 'accounting.settings'],
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token'
};

// Example journal entry
const sampleJournalEntry: JournalEntry = {
  id: 'je-001',
  entryNumber: 'JE-2024-001',
  date: '2024-01-15',
  description: 'Supplier invoice payment',
  reference: 'INV-001',
  totalDebit: 1000,
  totalCredit: 1000,
  status: 'approved',
  createdBy: 'user-123',
  entries: [
    {
      id: 'line-1',
      accountId: 'acc-payable',
      account: {
        id: 'acc-payable',
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        category: 'current_liability',
        balance: 5000,
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
      accountId: 'acc-cash',
      account: {
        id: 'acc-cash',
        code: '1000',
        name: 'Cash',
        type: 'asset',
        category: 'current_asset',
        balance: 10000,
        isActive: true,
        description: 'Cash account',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      description: 'Cash payment',
      debitAmount: 0,
      creditAmount: 1000,
      reference: 'INV-001'
    }
  ],
  attachments: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

/**
 * Example 1: Basic QuickBooks Integration
 */
export async function quickbooksIntegrationExample() {
  console.log('=== QuickBooks Integration Example ===');
  
  try {
    // 1. Save configuration
    console.log('1. Saving QuickBooks configuration...');
    const savedConfig = await accountingConfigService.saveConfig(quickbooksConfig);
    console.log('Configuration saved:', savedConfig.systemType);

    // 2. Test configuration
    console.log('2. Testing configuration...');
    const testResult = await accountingConfigService.testConfig(savedConfig);
    console.log('Configuration test result:', testResult);

    // 3. Create gateway and connect
    console.log('3. Creating gateway and connecting...');
    const gateway = AccountingAPIGatewayFactory.create('quickbooks');
    const connected = await gateway.connect(savedConfig);
    console.log('Connected:', connected);

    // 4. Get system information
    console.log('4. Fetching system information...');
    const systemInfo = await gateway.getSystemInfo();
    console.log('System info:', systemInfo);

    // 5. Sync chart of accounts
    console.log('5. Syncing chart of accounts...');
    const chartSync = await gateway.syncChartOfAccounts();
    console.log('Chart sync result:', chartSync);

    // 6. Sync journal entry
    console.log('6. Syncing journal entry...');
    const entrySync = await gateway.syncJournalEntry(sampleJournalEntry);
    console.log('Journal entry sync result:', entrySync);

    // 7. Disconnect
    await gateway.disconnect();
    console.log('7. Disconnected from QuickBooks');

  } catch (error) {
    console.error('QuickBooks integration error:', error);
  }
}

/**
 * Example 2: Basic Xero Integration
 */
export async function xeroIntegrationExample() {
  console.log('=== Xero Integration Example ===');
  
  try {
    // 1. Save configuration
    console.log('1. Saving Xero configuration...');
    const savedConfig = await accountingConfigService.saveConfig(xeroConfig);
    console.log('Configuration saved:', savedConfig.systemType);

    // 2. Create gateway and connect
    console.log('2. Creating gateway and connecting...');
    const gateway = AccountingAPIGatewayFactory.create('xero');
    const connected = await gateway.connect(savedConfig);
    console.log('Connected:', connected);

    // 3. Get system information
    console.log('3. Fetching system information...');
    const systemInfo = await gateway.getSystemInfo();
    console.log('System info:', systemInfo);

    // 4. Sync chart of accounts
    console.log('4. Syncing chart of accounts...');
    const chartSync = await gateway.syncChartOfAccounts();
    console.log('Chart sync result:', chartSync);

    // 5. Sync journal entry
    console.log('5. Syncing journal entry...');
    const entrySync = await gateway.syncJournalEntry(sampleJournalEntry);
    console.log('Journal entry sync result:', entrySync);

    // 6. Disconnect
    await gateway.disconnect();
    console.log('6. Disconnected from Xero');

  } catch (error) {
    console.error('Xero integration error:', error);
  }
}

/**
 * Example 3: Configuration Management
 */
export async function configurationManagementExample() {
  console.log('=== Configuration Management Example ===');
  
  try {
    // 1. Save multiple configurations
    console.log('1. Saving multiple configurations...');
    await accountingConfigService.saveConfig(quickbooksConfig);
    await accountingConfigService.saveConfig(xeroConfig);

    // 2. Get all configurations
    console.log('2. Retrieving all configurations...');
    const allConfigs = await accountingConfigService.getAllConfigs();
    console.log('All configurations:', allConfigs.map(c => c.systemType));

    // 3. Get specific configuration
    console.log('3. Retrieving QuickBooks configuration...');
    const qbConfig = await accountingConfigService.getConfig('quickbooks');
    console.log('QuickBooks config found:', !!qbConfig);

    // 4. Update configuration
    console.log('4. Updating configuration...');
    if (qbConfig) {
      const updatedConfig = await accountingConfigService.updateConfig('quickbooks', {
        isActive: false
      });
      console.log('Configuration updated, active:', updatedConfig.isActive);
    }

    // 5. Test configuration
    console.log('5. Testing configurations...');
    for (const config of allConfigs) {
      try {
        const testResult = await accountingConfigService.testConfig(config);
        console.log(`${config.systemType} test result:`, testResult);
      } catch (error) {
        console.log(`${config.systemType} test failed:`, error.message);
      }
    }

  } catch (error) {
    console.error('Configuration management error:', error);
  }
}

/**
 * Example 4: Sync Monitoring
 */
export async function syncMonitoringExample() {
  console.log('=== Sync Monitoring Example ===');
  
  try {
    // 1. Start sync monitoring
    console.log('1. Starting sync monitoring...');
    const syncId = await accountingSyncMonitorService.startSync('quickbooks', 'journal_entries');
    console.log('Sync started with ID:', syncId);

    // 2. Update sync status
    console.log('2. Updating sync status...');
    await accountingSyncMonitorService.updateSyncStatus(syncId, {
      status: 'in_progress',
      recordsProcessed: 5
    });

    // 3. Get sync status
    console.log('3. Getting sync status...');
    const status = await accountingSyncMonitorService.getSyncStatus(syncId);
    console.log('Current status:', status?.status, 'Records processed:', status?.recordsProcessed);

    // 4. Complete sync with result
    console.log('4. Completing sync...');
    const mockResult = {
      id: syncId,
      integrationId: 'integration-123',
      syncType: 'full' as const,
      status: 'success' as const,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: 10,
      recordsSucceeded: 9,
      recordsFailed: 1,
      errors: [
        {
          recordId: 'record-5',
          recordType: 'journal_entry',
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Invalid account code'
        }
      ],
      summary: {
        accountsSynced: 0,
        journalEntriesSynced: 9,
        customersSynced: 0,
        suppliersSynced: 0,
        conflictsDetected: 0,
        conflictsResolved: 0
      }
    };

    await accountingSyncMonitorService.completeSyncWithResult(syncId, mockResult);
    console.log('Sync completed successfully');

    // 5. Get recent syncs
    console.log('5. Getting recent syncs...');
    const recentSyncs = await accountingSyncMonitorService.getRecentSyncs('quickbooks', 5);
    console.log('Recent syncs count:', recentSyncs.length);

    // 6. Get active syncs
    console.log('6. Getting active syncs...');
    const activeSyncs = await accountingSyncMonitorService.getActiveSyncs();
    console.log('Active syncs count:', activeSyncs.length);

  } catch (error) {
    console.error('Sync monitoring error:', error);
  }
}

/**
 * Example 5: Complete Integration Workflow
 */
export async function completeIntegrationWorkflow(systemType: AccountingSystemType) {
  console.log(`=== Complete ${systemType.toUpperCase()} Integration Workflow ===`);
  
  try {
    const config = systemType === 'quickbooks' ? quickbooksConfig : xeroConfig;
    
    // 1. Configuration setup
    console.log('1. Setting up configuration...');
    const savedConfig = await accountingConfigService.saveConfig(config);
    const testResult = await accountingConfigService.testConfig(savedConfig);
    
    if (!testResult) {
      throw new Error('Configuration test failed');
    }
    console.log('Configuration setup complete');

    // 2. Start sync monitoring
    console.log('2. Starting sync monitoring...');
    const syncId = await accountingSyncMonitorService.startSync(systemType, 'full_sync');

    // 3. Connect to external system
    console.log('3. Connecting to external system...');
    const gateway = AccountingAPIGatewayFactory.create(systemType);
    await gateway.connect(savedConfig);

    // 4. Sync chart of accounts
    console.log('4. Syncing chart of accounts...');
    await accountingSyncMonitorService.updateSyncStatus(syncId, {
      status: 'in_progress',
      recordsProcessed: 0
    });

    const chartResult = await gateway.syncChartOfAccounts();
    console.log('Chart of accounts synced:', chartResult.recordsProcessed);

    // 5. Sync journal entries
    console.log('5. Syncing journal entries...');
    const entryResult = await gateway.syncJournalEntry(sampleJournalEntry);
    console.log('Journal entry synced:', entryResult.recordsProcessed);

    // 6. Complete sync monitoring
    console.log('6. Completing sync monitoring...');
    const finalResult = {
      id: syncId,
      integrationId: `${systemType}-integration`,
      syncType: 'full' as const,
      status: (chartResult.recordsProcessed > 0 && entryResult.recordsProcessed > 0) ? 'success' as const : 'partial' as const,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      recordsProcessed: 2,
      recordsSucceeded: (chartResult.recordsProcessed > 0 ? 1 : 0) + (entryResult.recordsProcessed > 0 ? 1 : 0),
      recordsFailed: (chartResult.recordsProcessed === 0 ? 1 : 0) + (entryResult.recordsProcessed === 0 ? 1 : 0),
      errors: [],
      summary: {
        accountsSynced: chartResult.recordsProcessed || 0,
        journalEntriesSynced: entryResult.recordsProcessed > 0 ? 1 : 0,
        customersSynced: 0,
        suppliersSynced: 0,
        conflictsDetected: 0,
        conflictsResolved: 0
      }
    };

    await accountingSyncMonitorService.completeSyncWithResult(syncId, finalResult);

    // 7. Disconnect
    await gateway.disconnect();
    console.log('7. Integration workflow completed successfully');

    return {
      success: true,
      syncId,
      chartResult,
      entryResult
    };

  } catch (error) {
    console.error('Integration workflow error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example 6: Error Handling and Recovery
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  try {
    // 1. Test with invalid configuration
    console.log('1. Testing with invalid configuration...');
    const invalidConfig = { ...quickbooksConfig, clientId: '' };
    
    try {
      await accountingConfigService.testConfig(invalidConfig);
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }

    // 2. Test connection without proper setup
    console.log('2. Testing connection without setup...');
    const gateway = AccountingAPIGatewayFactory.create('quickbooks');
    
    try {
      await gateway.syncJournalEntry(sampleJournalEntry);
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }

    // 3. Test sync monitoring failure handling
    console.log('3. Testing sync failure handling...');
    const syncId = await accountingSyncMonitorService.startSync('quickbooks', 'test_sync');
    
    const testError = new Error('Simulated sync failure');
    await accountingSyncMonitorService.failSync(syncId, testError);
    
    const failedStatus = await accountingSyncMonitorService.getSyncStatus(syncId);
    console.log('Failed sync status:', failedStatus?.status);

    // 4. Test retry scheduling
    console.log('4. Testing retry scheduling...');
    const retrySyncId = await accountingSyncMonitorService.startSync('quickbooks', 'retry_test');
    await accountingSyncMonitorService.scheduleRetry(retrySyncId, 30); // 30 minutes
    
    const retryStatus = await accountingSyncMonitorService.getSyncStatus(retrySyncId);
    console.log('Retry scheduled for:', retryStatus?.nextRetryAt);

  } catch (error) {
    console.error('Error handling example error:', error);
  }
}

// Export all examples for easy usage
export const accountingIntegrationExamples = {
  quickbooksIntegrationExample,
  xeroIntegrationExample,
  configurationManagementExample,
  syncMonitoringExample,
  completeIntegrationWorkflow,
  errorHandlingExample
};

// Usage instructions
console.log(`
=== Accounting Integration Usage Examples ===

To run these examples:

1. QuickBooks Integration:
   await quickbooksIntegrationExample();

2. Xero Integration:
   await xeroIntegrationExample();

3. Configuration Management:
   await configurationManagementExample();

4. Sync Monitoring:
   await syncMonitoringExample();

5. Complete Workflow:
   await completeIntegrationWorkflow('quickbooks');
   await completeIntegrationWorkflow('xero');

6. Error Handling:
   await errorHandlingExample();

Note: Make sure to replace the example credentials with real ones
and ensure your database is properly set up before running these examples.
`);