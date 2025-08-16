import { AccountingIntegrationError } from '../errors/accounting';
import { SyncResult, AccountingSystemType, ExternalAccountingConfig } from '../types/accounting';
import { JournalEntry } from '../types/accounting';

export interface AccountingAPIGateway {
  connect(config: ExternalAccountingConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  syncJournalEntry(entry: JournalEntry): Promise<SyncResult>;
  syncChartOfAccounts(): Promise<SyncResult>;
  getSystemInfo(): Promise<any>;
  validateConfig(config: ExternalAccountingConfig): Promise<boolean>;
}

export class BaseAccountingAPIGateway implements AccountingAPIGateway {
  protected config: ExternalAccountingConfig | null = null;
  protected isConnected: boolean = false;

  async connect(config: ExternalAccountingConfig): Promise<boolean> {
    try {
      const isValid = await this.validateConfig(config);
      if (!isValid) {
        throw new AccountingIntegrationError(
          'Invalid configuration provided',
          'INVALID_CONFIG'
        );
      }

      this.config = config;
      this.isConnected = await this.establishConnection();
      return this.isConnected;
    } catch (error) {
      throw new AccountingIntegrationError(
        `Failed to connect to accounting system: ${error.message}`,
        'CONNECTION_FAILED',
        { originalError: error }
      );
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.config = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConnected || !this.config) {
      return false;
    }

    try {
      return await this.performConnectionTest();
    } catch (error) {
      return false;
    }
  }

  async syncJournalEntry(entry: JournalEntry): Promise<SyncResult> {
    if (!this.isConnected) {
      throw new AccountingIntegrationError(
        'Not connected to accounting system',
        'NOT_CONNECTED'
      );
    }

    try {
      return await this.performJournalEntrySync(entry);
    } catch (error) {
      throw new AccountingIntegrationError(
        `Failed to sync journal entry: ${error.message}`,
        'SYNC_FAILED',
        { journalEntryId: entry.id, originalError: error }
      );
    }
  }

  async syncChartOfAccounts(): Promise<SyncResult> {
    if (!this.isConnected) {
      throw new AccountingIntegrationError(
        'Not connected to accounting system',
        'NOT_CONNECTED'
      );
    }

    try {
      return await this.performChartOfAccountsSync();
    } catch (error) {
      throw new AccountingIntegrationError(
        `Failed to sync chart of accounts: ${error.message}`,
        'SYNC_FAILED',
        { originalError: error }
      );
    }
  }

  async getSystemInfo(): Promise<any> {
    if (!this.isConnected) {
      throw new AccountingIntegrationError(
        'Not connected to accounting system',
        'NOT_CONNECTED'
      );
    }

    return await this.fetchSystemInfo();
  }

  async validateConfig(config: ExternalAccountingConfig): Promise<boolean> {
    // Base validation - override in specific implementations
    return !!(config.systemType && config.apiUrl && config.credentials);
  }

  // Protected methods to be implemented by specific adapters
  protected async establishConnection(): Promise<boolean> {
    throw new Error('establishConnection must be implemented by subclass');
  }

  protected async performConnectionTest(): Promise<boolean> {
    throw new Error('performConnectionTest must be implemented by subclass');
  }

  protected async performJournalEntrySync(entry: JournalEntry): Promise<SyncResult> {
    throw new Error('performJournalEntrySync must be implemented by subclass');
  }

  protected async performChartOfAccountsSync(): Promise<SyncResult> {
    throw new Error('performChartOfAccountsSync must be implemented by subclass');
  }

  protected async fetchSystemInfo(): Promise<any> {
    throw new Error('fetchSystemInfo must be implemented by subclass');
  }
}



// Factory for creating appropriate gateway instances
export class AccountingAPIGatewayFactory {
  static create(systemType: AccountingSystemType): AccountingAPIGateway {
    switch (systemType) {
      case 'quickbooks':
        // Dynamic import to avoid circular dependencies
        const { QuickBooksAPIGateway } = require('./quickbooks-adapter.service');
        return new QuickBooksAPIGateway();
      case 'xero':
        // Dynamic import to avoid circular dependencies
        const { XeroAPIGateway } = require('./xero-adapter.service');
        return new XeroAPIGateway();
      default:
        throw new AccountingIntegrationError(
          `Unsupported accounting system type: ${systemType}`,
          'UNSUPPORTED_SYSTEM'
        );
    }
  }
}