import { AccountingAPIGateway } from './accounting-api-gateway.service';
import { AccountingIntegrationError } from '../errors/accounting';
import { SyncResult, ExternalAccountingConfig, XeroConfig } from '../types/accounting';
import { JournalEntry } from '../types/accounting';

export class XeroAPIGateway implements AccountingAPIGateway {
  protected config: ExternalAccountingConfig | null = null;
  protected isConnected: boolean = false;
  private accessToken: string | null = null;
  private tenantId: string | null = null;
  private baseUrl: string = 'https://api.xero.com/api.xro/2.0';

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

  private async establishConnection(): Promise<boolean> {
    if (!this.config || this.config.systemType !== 'xero') {
      throw new AccountingIntegrationError(
        'Invalid Xero configuration',
        'INVALID_CONFIG'
      );
    }

    const xeroConfig = this.config as XeroConfig;
    
    try {
      // Authenticate with Xero OAuth 2.0
      const authResult = await this.authenticateWithXero(xeroConfig);
      this.accessToken = authResult.access_token;
      this.tenantId = xeroConfig.tenantId;

      return true;
    } catch (error) {
      throw new AccountingIntegrationError(
        `Xero authentication failed: ${error.message}`,
        'AUTH_FAILED',
        { originalError: error }
      );
    }
  }

  private async performConnectionTest(): Promise<boolean> {
    try {
      const response = await this.makeXeroRequest('GET', '/Organisation');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private async performJournalEntrySync(entry: JournalEntry): Promise<SyncResult> {
    try {
      // Convert our journal entry format to Xero format
      const xeroManualJournal = this.convertToXeroFormat(entry);
      
      const response = await this.makeXeroRequest(
        'POST',
        '/ManualJournals',
        xeroManualJournal
      );

      if (response.status === 200) {
        const xeroEntry = response.data.ManualJournals?.[0];
        return {
          success: true,
          externalId: xeroEntry?.ManualJournalID,
          externalReference: xeroEntry?.Reference,
          syncedAt: new Date(),
          details: {
            xeroId: xeroEntry?.ManualJournalID,
            reference: xeroEntry?.Reference,
            status: xeroEntry?.Status
          }
        };
      } else {
        throw new Error(`Xero API returned status ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date(),
        details: { originalError: error }
      };
    }
  }

  private async performChartOfAccountsSync(): Promise<SyncResult> {
    try {
      const response = await this.makeXeroRequest('GET', '/Accounts');

      if (response.status === 200) {
        const accounts = response.data.Accounts || [];
        return {
          success: true,
          recordsProcessed: accounts.length,
          syncedAt: new Date(),
          details: {
            accountsRetrieved: accounts.length,
            accounts: accounts.map((acc: any) => ({
              id: acc.AccountID,
              name: acc.Name,
              type: acc.Type,
              code: acc.Code,
              status: acc.Status
            }))
          }
        };
      } else {
        throw new Error(`Xero API returned status ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date(),
        details: { originalError: error }
      };
    }
  }

  private async fetchSystemInfo(): Promise<any> {
    try {
      const response = await this.makeXeroRequest('GET', '/Organisation');
      
      if (response.status === 200) {
        const organisation = response.data.Organisations?.[0];
        return {
          systemType: 'xero',
          organisationName: organisation?.Name,
          tenantId: this.tenantId,
          baseCurrency: organisation?.BaseCurrency,
          countryCode: organisation?.CountryCode,
          financialYearEndDay: organisation?.FinancialYearEndDay,
          financialYearEndMonth: organisation?.FinancialYearEndMonth,
          version: 'Xero API 2.0'
        };
      }
      
      throw new Error('Failed to fetch organisation info');
    } catch (error) {
      throw new AccountingIntegrationError(
        `Failed to fetch Xero system info: ${error.message}`,
        'SYSTEM_INFO_FAILED',
        { originalError: error }
      );
    }
  }

  async validateConfig(config: ExternalAccountingConfig): Promise<boolean> {
    if (config.systemType !== 'xero') {
      return false;
    }

    const xeroConfig = config as XeroConfig;
    return !!(
      xeroConfig.clientId &&
      xeroConfig.clientSecret &&
      xeroConfig.tenantId &&
      xeroConfig.scopes &&
      Array.isArray(xeroConfig.scopes) &&
      xeroConfig.scopes.length > 0
    );
  }

  private async authenticateWithXero(config: XeroConfig): Promise<any> {
    // In a real implementation, this would handle OAuth 2.0 flow
    // For now, we'll simulate the authentication
    if (!config.accessToken) {
      throw new Error('Access token required for Xero authentication');
    }

    return {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expires_in: 1800, // Xero tokens expire in 30 minutes
      token_type: 'Bearer'
    };
  }

  private async makeXeroRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    if (!this.accessToken || !this.tenantId) {
      throw new Error('Not authenticated with Xero');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // In a real implementation, this would make actual HTTP requests
    // For now, we'll simulate the response
    return this.simulateXeroResponse(method, endpoint, data);
  }

  private simulateXeroResponse(method: string, endpoint: string, data?: any): any {
    // Simulate different responses based on endpoint
    if (endpoint.includes('Organisation')) {
      return {
        status: 200,
        data: {
          Organisations: [{
            OrganisationID: this.tenantId,
            Name: 'Test Organisation',
            BaseCurrency: 'USD',
            CountryCode: 'US',
            FinancialYearEndDay: 31,
            FinancialYearEndMonth: 12
          }]
        }
      };
    }

    if (endpoint.includes('ManualJournals')) {
      return {
        status: 200,
        data: {
          ManualJournals: [{
            ManualJournalID: Math.random().toString(36).substr(2, 9),
            Reference: `MJ-${Date.now()}`,
            Date: new Date().toISOString().split('T')[0],
            Status: 'POSTED'
          }]
        }
      };
    }

    if (endpoint.includes('Accounts')) {
      return {
        status: 200,
        data: {
          Accounts: [
            { 
              AccountID: '1', 
              Name: 'Accounts Payable', 
              Type: 'CURRLIAB', 
              Code: '200',
              Status: 'ACTIVE'
            },
            { 
              AccountID: '2', 
              Name: 'Business Bank Account', 
              Type: 'BANK', 
              Code: '090',
              Status: 'ACTIVE'
            },
            { 
              AccountID: '3', 
              Name: 'Office Expenses', 
              Type: 'EXPENSE', 
              Code: '404',
              Status: 'ACTIVE'
            }
          ]
        }
      };
    }

    return { status: 200, data: {} };
  }

  private convertToXeroFormat(entry: JournalEntry): any {
    return {
      Reference: entry.reference || entry.entryNumber,
      Date: new Date(entry.date).toISOString().split('T')[0],
      Status: 'DRAFT',
      JournalLines: entry.entries.map(line => ({
        AccountCode: line.accountCode,
        Description: line.description,
        TaxType: 'NONE',
        ...(line.debitAmount > 0 
          ? { DebitAmount: line.debitAmount }
          : { CreditAmount: line.creditAmount }
        )
      }))
    };
  }
}