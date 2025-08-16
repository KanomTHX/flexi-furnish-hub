import { supabase } from '../integrations/supabase/client';
import { AccountingIntegrationError } from '../errors/accounting';
import { 
  ExternalAccountingConfig, 
  AccountingSystemType, 
  QuickBooksConfig, 
  XeroConfig 
} from '../types/accounting';

export interface AccountingConfigService {
  saveConfig(config: ExternalAccountingConfig): Promise<ExternalAccountingConfig>;
  getConfig(systemType: AccountingSystemType): Promise<ExternalAccountingConfig | null>;
  getAllConfigs(): Promise<ExternalAccountingConfig[]>;
  updateConfig(systemType: AccountingSystemType, updates: Partial<ExternalAccountingConfig>): Promise<ExternalAccountingConfig>;
  deleteConfig(systemType: AccountingSystemType): Promise<void>;
  testConfig(config: ExternalAccountingConfig): Promise<boolean>;
  encryptCredentials(credentials: any): Promise<string>;
  decryptCredentials(encryptedCredentials: string): Promise<any>;
}

export class SupabaseAccountingConfigService implements AccountingConfigService {
  private readonly tableName = 'accounting_system_integrations';

  async saveConfig(config: ExternalAccountingConfig): Promise<ExternalAccountingConfig> {
    try {
      // Encrypt sensitive credentials before saving
      const encryptedCredentials = await this.encryptCredentials(config.credentials);
      
      const configData = {
        system_type: config.systemType,
        api_url: config.apiUrl,
        encrypted_credentials: encryptedCredentials,
        is_active: config.isActive,
        last_sync_at: config.lastSyncAt?.toISOString(),
        configuration: this.serializeSystemSpecificConfig(config),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(configData, { 
          onConflict: 'system_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to save accounting configuration: ${error.message}`,
          'CONFIG_SAVE_FAILED',
          { error, systemType: config.systemType }
        );
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error saving configuration: ${error.message}`,
        'CONFIG_SAVE_ERROR',
        { originalError: error }
      );
    }
  }

  async getConfig(systemType: AccountingSystemType): Promise<ExternalAccountingConfig | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('system_type', systemType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new AccountingIntegrationError(
          `Failed to retrieve accounting configuration: ${error.message}`,
          'CONFIG_RETRIEVE_FAILED',
          { error, systemType }
        );
      }

      return this.mapFromDatabase(data);
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error retrieving configuration: ${error.message}`,
        'CONFIG_RETRIEVE_ERROR',
        { originalError: error }
      );
    }
  }

  async getAllConfigs(): Promise<ExternalAccountingConfig[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to retrieve accounting configurations: ${error.message}`,
          'CONFIG_LIST_FAILED',
          { error }
        );
      }

      return Promise.all(data.map(item => this.mapFromDatabase(item)));
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error retrieving configurations: ${error.message}`,
        'CONFIG_LIST_ERROR',
        { originalError: error }
      );
    }
  }

  async updateConfig(
    systemType: AccountingSystemType, 
    updates: Partial<ExternalAccountingConfig>
  ): Promise<ExternalAccountingConfig> {
    try {
      const existingConfig = await this.getConfig(systemType);
      if (!existingConfig) {
        throw new AccountingIntegrationError(
          `Configuration not found for system type: ${systemType}`,
          'CONFIG_NOT_FOUND',
          { systemType }
        );
      }

      const updatedConfig = { ...existingConfig, ...updates };
      return await this.saveConfig(updatedConfig);
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error updating configuration: ${error.message}`,
        'CONFIG_UPDATE_ERROR',
        { originalError: error }
      );
    }
  }

  async deleteConfig(systemType: AccountingSystemType): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('system_type', systemType);

      if (error) {
        throw new AccountingIntegrationError(
          `Failed to delete accounting configuration: ${error.message}`,
          'CONFIG_DELETE_FAILED',
          { error, systemType }
        );
      }
    } catch (error) {
      if (error instanceof AccountingIntegrationError) {
        throw error;
      }
      throw new AccountingIntegrationError(
        `Unexpected error deleting configuration: ${error.message}`,
        'CONFIG_DELETE_ERROR',
        { originalError: error }
      );
    }
  }

  async testConfig(config: ExternalAccountingConfig): Promise<boolean> {
    try {
      // Import the gateway factory dynamically to avoid circular dependencies
      const { AccountingAPIGatewayFactory } = await import('./accounting-api-gateway.service');
      
      const gateway = AccountingAPIGatewayFactory.create(config.systemType);
      await gateway.connect(config);
      const isConnected = await gateway.testConnection();
      await gateway.disconnect();
      
      return isConnected;
    } catch (error) {
      throw new AccountingIntegrationError(
        `Configuration test failed: ${error.message}`,
        'CONFIG_TEST_FAILED',
        { originalError: error, systemType: config.systemType }
      );
    }
  }

  async encryptCredentials(credentials: any): Promise<string> {
    // In a real implementation, this would use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    try {
      const jsonString = JSON.stringify(credentials);
      return Buffer.from(jsonString).toString('base64');
    } catch (error) {
      throw new AccountingIntegrationError(
        'Failed to encrypt credentials',
        'ENCRYPTION_FAILED',
        { originalError: error }
      );
    }
  }

  async decryptCredentials(encryptedCredentials: string): Promise<any> {
    // In a real implementation, this would use proper decryption
    // For now, we'll use base64 decoding as a placeholder
    try {
      const jsonString = Buffer.from(encryptedCredentials, 'base64').toString();
      return JSON.parse(jsonString);
    } catch (error) {
      throw new AccountingIntegrationError(
        'Failed to decrypt credentials',
        'DECRYPTION_FAILED',
        { originalError: error }
      );
    }
  }

  private async mapFromDatabase(data: any): Promise<ExternalAccountingConfig> {
    const decryptedCredentials = await this.decryptCredentials(data.encrypted_credentials);
    
    const baseConfig: ExternalAccountingConfig = {
      systemType: data.system_type,
      apiUrl: data.api_url,
      credentials: decryptedCredentials,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined
    };

    // Add system-specific properties
    return this.deserializeSystemSpecificConfig(baseConfig, data.configuration);
  }

  private serializeSystemSpecificConfig(config: ExternalAccountingConfig): any {
    switch (config.systemType) {
      case 'quickbooks':
        const qbConfig = config as QuickBooksConfig;
        return {
          clientId: qbConfig.clientId,
          clientSecret: qbConfig.clientSecret,
          companyId: qbConfig.companyId,
          environment: qbConfig.environment,
          accessToken: qbConfig.accessToken,
          refreshToken: qbConfig.refreshToken
        };
      
      case 'xero':
        const xeroConfig = config as XeroConfig;
        return {
          clientId: xeroConfig.clientId,
          clientSecret: xeroConfig.clientSecret,
          tenantId: xeroConfig.tenantId,
          scopes: xeroConfig.scopes,
          accessToken: xeroConfig.accessToken,
          refreshToken: xeroConfig.refreshToken
        };
      
      default:
        return {};
    }
  }

  private deserializeSystemSpecificConfig(
    baseConfig: ExternalAccountingConfig, 
    serializedConfig: any
  ): ExternalAccountingConfig {
    switch (baseConfig.systemType) {
      case 'quickbooks':
        return {
          ...baseConfig,
          clientId: serializedConfig.clientId,
          clientSecret: serializedConfig.clientSecret,
          companyId: serializedConfig.companyId,
          environment: serializedConfig.environment,
          accessToken: serializedConfig.accessToken,
          refreshToken: serializedConfig.refreshToken
        } as QuickBooksConfig;
      
      case 'xero':
        return {
          ...baseConfig,
          clientId: serializedConfig.clientId,
          clientSecret: serializedConfig.clientSecret,
          tenantId: serializedConfig.tenantId,
          scopes: serializedConfig.scopes || [],
          accessToken: serializedConfig.accessToken,
          refreshToken: serializedConfig.refreshToken
        } as XeroConfig;
      
      default:
        return baseConfig;
    }
  }
}

// Export singleton instance
export const accountingConfigService = new SupabaseAccountingConfigService();