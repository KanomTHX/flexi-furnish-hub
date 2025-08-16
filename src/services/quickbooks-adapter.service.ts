import { AccountingAPIGateway } from './accounting-api-gateway.service';
import { AccountingIntegrationError } from '../errors/accounting';
import { SyncResult, ExternalAccountingConfig, QuickBooksConfig } from '../types/accounting';
import { JournalEntry } from '../types/accounting';

export class QuickBooksAPIGateway implements AccountingAPIGateway {
  protected config: ExternalAccountingConfig | null = null;
  protected isConnected: boolean = false;
  private accessToken: string | null = null;
  private companyId: string | null = null;
  private baseUrl: string = 'https://sandbox-quickbooks.api.intuit.com';

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
    if (!this.config || this.config.systemType !== 'quickbooks') {
      throw new AccountingIntegrationError(
        'Invalid QuickBooks configuration',
        'INVALID_CONFIG'
      );
    }

    const qbConfig = this.config as QuickBooksConfig;
    
    try {
      // Authenticate with QuickBooks OAuth 2.0
      const authResult = await this.authenticateWithQuickBooks(qbConfig);
      this.accessToken = authResult.access_token;
      this.companyId = qbConfig.companyId;
      
      if (qbConfig.environment === 'production') {
        this.baseUrl = 'https://quickbooks.api.intuit.com';
      }

      return true;
    } catch (error) {
      throw new AccountingIntegrationError(
        `QuickBooks authentication failed: ${error.message}`,
        'AUTH_FAILED',
        { originalError: error }
      );
    }
  }

  private async performConnectionTest(): Promise<boolean> {
    try {
      const response = await this.makeQuickBooksRequest('GET', '/v3/companyinfo/1');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private async performJournalEntrySync(entry: JournalEntry): Promise<SyncResult> {
    try {
      // Convert our journal entry format to QuickBooks format
      const qbJournalEntry = this.convertToQuickBooksFormat(entry);
      
      const response = await this.makeQuickBooksRequest(
        'POST',
        '/v3/journalentry',
        qbJournalEntry
      );

      if (response.status === 200) {
        const qbEntry = response.data.QueryResponse?.JournalEntry?.[0];
        return {
          success: true,
          externalId: qbEntry?.Id,
          externalReference: qbEntry?.DocNumber,
          syncedAt: new Date(),
          details: {
            quickbooksId: qbEntry?.Id,
            docNumber: qbEntry?.DocNumber
          }
        };
      } else {
        throw new Error(`QuickBooks API returned status ${response.status}`);
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
      const response = await this.makeQuickBooksRequest(
        'GET',
        "/v3/query?query=SELECT * FROM Account"
      );

      if (response.status === 200) {
        const accounts = response.data.QueryResponse?.Account || [];
        return {
          success: true,
          recordsProcessed: accounts.length,
          syncedAt: new Date(),
          details: {
            accountsRetrieved: accounts.length,
            accounts: accounts.map((acc: any) => ({
              id: acc.Id,
              name: acc.Name,
              type: acc.AccountType,
              code: acc.AcctNum
            }))
          }
        };
      } else {
        throw new Error(`QuickBooks API returned status ${response.status}`);
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
      const response = await this.makeQuickBooksRequest('GET', '/v3/companyinfo/1');
      
      if (response.status === 200) {
        const companyInfo = response.data.QueryResponse?.CompanyInfo?.[0];
        return {
          systemType: 'quickbooks',
          companyName: companyInfo?.CompanyName,
          companyId: this.companyId,
          fiscalYearStart: companyInfo?.FiscalYearStartMonth,
          currency: companyInfo?.Country,
          version: 'QuickBooks Online API v3'
        };
      }
      
      throw new Error('Failed to fetch company info');
    } catch (error) {
      throw new AccountingIntegrationError(
        `Failed to fetch QuickBooks system info: ${error.message}`,
        'SYSTEM_INFO_FAILED',
        { originalError: error }
      );
    }
  }

  async validateConfig(config: ExternalAccountingConfig): Promise<boolean> {
    if (config.systemType !== 'quickbooks') {
      return false;
    }

    const qbConfig = config as QuickBooksConfig;
    return !!(
      qbConfig.clientId &&
      qbConfig.clientSecret &&
      qbConfig.companyId &&
      qbConfig.environment &&
      ['sandbox', 'production'].includes(qbConfig.environment)
    );
  }

  private async authenticateWithQuickBooks(config: QuickBooksConfig): Promise<any> {
    // In a real implementation, this would handle OAuth 2.0 flow
    // For now, we'll simulate the authentication
    if (!config.accessToken) {
      throw new Error('Access token required for QuickBooks authentication');
    }

    return {
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expires_in: 3600
    };
  }

  private async makeQuickBooksRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    if (!this.accessToken || !this.companyId) {
      throw new Error('Not authenticated with QuickBooks');
    }

    const url = `${this.baseUrl}/v3/company/${this.companyId}${endpoint}`;
    
    // In a real implementation, this would make actual HTTP requests
    // For now, we'll simulate the response
    return this.simulateQuickBooksResponse(method, endpoint, data);
  }

  private simulateQuickBooksResponse(method: string, endpoint: string, data?: any): any {
    // Simulate different responses based on endpoint
    if (endpoint.includes('companyinfo')) {
      return {
        status: 200,
        data: {
          QueryResponse: {
            CompanyInfo: [{
              Id: '1',
              CompanyName: 'Test Company',
              FiscalYearStartMonth: 'January',
              Country: 'US'
            }]
          }
        }
      };
    }

    if (endpoint.includes('journalentry')) {
      return {
        status: 200,
        data: {
          QueryResponse: {
            JournalEntry: [{
              Id: Math.random().toString(36).substr(2, 9),
              DocNumber: `JE-${Date.now()}`,
              TxnDate: new Date().toISOString().split('T')[0]
            }]
          }
        }
      };
    }

    if (endpoint.includes('Account')) {
      return {
        status: 200,
        data: {
          QueryResponse: {
            Account: [
              { Id: '1', Name: 'Accounts Payable', AccountType: 'Accounts Payable', AcctNum: '2000' },
              { Id: '2', Name: 'Cash', AccountType: 'Bank', AcctNum: '1000' },
              { Id: '3', Name: 'Office Supplies', AccountType: 'Expense', AcctNum: '6000' }
            ]
          }
        }
      };
    }

    return { status: 200, data: {} };
  }

  private convertToQuickBooksFormat(entry: JournalEntry): any {
    return {
      TxnDate: new Date(entry.date).toISOString().split('T')[0],
      PrivateNote: entry.description,
      Line: entry.entries.map((line, index) => ({
        Id: (index + 1).toString(),
        Description: line.description,
        Amount: line.debitAmount || line.creditAmount,
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: line.debitAmount > 0 ? 'Debit' : 'Credit',
          AccountRef: {
            value: line.accountCode,
            name: line.accountName
          }
        }
      }))
    };
  }
}