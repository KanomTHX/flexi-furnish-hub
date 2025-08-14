# External Accounting System Integration

This module provides comprehensive integration capabilities with external accounting systems including QuickBooks and Xero. It enables automatic synchronization of journal entries, chart of accounts, and provides robust configuration management and monitoring.

## Features

- **Multi-System Support**: QuickBooks Online and Xero integrations
- **Configuration Management**: Secure storage and management of API credentials
- **Sync Monitoring**: Real-time tracking of synchronization operations
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Type Safety**: Full TypeScript support with detailed type definitions

## Architecture

### Core Components

1. **AccountingAPIGateway**: Abstract interface for external system connections
2. **QuickBooksAPIGateway**: QuickBooks Online integration adapter
3. **XeroAPIGateway**: Xero integration adapter
4. **AccountingConfigService**: Configuration management service
5. **AccountingSyncMonitorService**: Sync operation monitoring service

### Key Files

- `accounting-api-gateway.service.ts` - Base gateway interface and factory
- `quickbooks-adapter.service.ts` - QuickBooks integration implementation
- `xero-adapter.service.ts` - Xero integration implementation
- `accounting-config.service.ts` - Configuration management
- `accounting-sync-monitor.service.ts` - Sync monitoring and status tracking

## Usage Examples

### Basic QuickBooks Integration

```typescript
import { AccountingAPIGatewayFactory } from './services/accounting-api-gateway.service';
import { accountingConfigService } from './services/accounting-config.service';

// Configure QuickBooks
const config = {
  systemType: 'quickbooks',
  apiUrl: 'https://sandbox-quickbooks.api.intuit.com',
  credentials: { accessToken: 'your-token' },
  isActive: true,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  companyId: 'your-company-id',
  environment: 'sandbox'
};

// Save and test configuration
await accountingConfigService.saveConfig(config);
const testResult = await accountingConfigService.testConfig(config);

// Create gateway and connect
const gateway = AccountingAPIGatewayFactory.create('quickbooks');
await gateway.connect(config);

// Sync journal entry
const result = await gateway.syncJournalEntry(journalEntry);
console.log('Sync result:', result);
```

### Basic Xero Integration

```typescript
// Configure Xero
const xeroConfig = {
  systemType: 'xero',
  apiUrl: 'https://api.xero.com/api.xro/2.0',
  credentials: { accessToken: 'your-token' },
  isActive: true,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tenantId: 'your-tenant-id',
  scopes: ['accounting.transactions', 'accounting.settings']
};

// Create gateway and sync
const gateway = AccountingAPIGatewayFactory.create('xero');
await gateway.connect(xeroConfig);
const result = await gateway.syncChartOfAccounts();
```

### Sync Monitoring

```typescript
import { accountingSyncMonitorService } from './services/accounting-sync-monitor.service';

// Start monitoring
const syncId = await accountingSyncMonitorService.startSync('quickbooks', 'journal_entries');

// Update status
await accountingSyncMonitorService.updateSyncStatus(syncId, {
  status: 'in_progress',
  recordsProcessed: 5
});

// Complete with result
await accountingSyncMonitorService.completeSyncWithResult(syncId, syncResult);

// Get status
const status = await accountingSyncMonitorService.getSyncStatus(syncId);
```

## Configuration

### QuickBooks Configuration

```typescript
interface QuickBooksConfig {
  systemType: 'quickbooks';
  apiUrl: string;
  credentials: any;
  isActive: boolean;
  clientId: string;
  clientSecret: string;
  companyId: string;
  environment: 'sandbox' | 'production';
  accessToken?: string;
  refreshToken?: string;
}
```

### Xero Configuration

```typescript
interface XeroConfig {
  systemType: 'xero';
  apiUrl: string;
  credentials: any;
  isActive: boolean;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scopes: string[];
  accessToken?: string;
  refreshToken?: string;
}
```

## Database Schema

The integration requires the following database tables:

### accounting_system_integrations
Stores configuration for external accounting systems.

```sql
CREATE TABLE accounting_system_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_type VARCHAR(50) NOT NULL,
  api_url VARCHAR(255) NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### integration_sync_log
Tracks synchronization operations and their status.

```sql
CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_type VARCHAR(50) NOT NULL,
  system_type VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  summary JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

The integration provides comprehensive error handling:

### Error Types

- `AccountingIntegrationError`: Base error class for integration issues
- Connection errors: Authentication and network issues
- Sync errors: Data synchronization failures
- Configuration errors: Invalid or missing configuration

### Error Recovery

- Automatic retry mechanisms with exponential backoff
- Detailed error logging and monitoring
- Graceful degradation for non-critical failures
- Manual retry capabilities through the sync monitor

## Security

### Credential Management

- All credentials are encrypted before storage
- Secure credential retrieval and decryption
- Support for OAuth 2.0 token refresh
- Environment-specific configuration (sandbox/production)

### API Security

- Rate limiting and throttling
- Secure HTTPS communications
- Proper authentication header management
- Token expiration handling

## Testing

### Unit Tests

Run the integration tests:

```bash
npm test -- src/tests/accounting-integration-simple.test.ts
```

### Test Coverage

The test suite covers:
- Gateway creation and connection
- Configuration validation
- Sync operations (journal entries, chart of accounts)
- Error handling scenarios
- Network timeout handling

### Mock Services

The tests use mock implementations that simulate:
- QuickBooks API responses
- Xero API responses
- Database operations
- Network failures

## Monitoring and Observability

### Sync Status Tracking

- Real-time sync operation monitoring
- Detailed progress tracking
- Error rate monitoring
- Performance metrics

### Logging

- Comprehensive operation logging
- Error details and stack traces
- Sync operation audit trails
- Performance timing data

## Extending the Integration

### Adding New Accounting Systems

1. Create a new adapter implementing `AccountingAPIGateway`
2. Add system-specific configuration types
3. Update the `AccountingAPIGatewayFactory`
4. Add validation and error handling
5. Create comprehensive tests

### Example New System Integration

```typescript
export class NewSystemAPIGateway implements AccountingAPIGateway {
  async connect(config: ExternalAccountingConfig): Promise<boolean> {
    // Implementation
  }
  
  async syncJournalEntry(entry: JournalEntry): Promise<SyncResult> {
    // Implementation
  }
  
  // ... other required methods
}
```

## Performance Considerations

### Optimization Strategies

- Batch processing for large data sets
- Intelligent retry mechanisms
- Connection pooling and reuse
- Efficient data transformation
- Caching of frequently accessed data

### Scalability

- Asynchronous processing
- Queue-based sync operations
- Horizontal scaling support
- Database connection optimization

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify API credentials
   - Check token expiration
   - Validate OAuth scopes

2. **Sync Failures**
   - Check network connectivity
   - Verify data format compatibility
   - Review error logs

3. **Configuration Issues**
   - Validate required fields
   - Check environment settings
   - Verify API URLs

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
DEBUG=accounting:*
LOG_LEVEL=debug
```

## Support and Maintenance

### Regular Maintenance

- Monitor sync success rates
- Update API credentials before expiration
- Review and clean up old sync logs
- Performance monitoring and optimization

### Updates and Patches

- Regular dependency updates
- API version compatibility checks
- Security patch applications
- Feature enhancements based on user feedback

## Related Documentation

- [Journal Entry Service](./README-JournalEntry.md)
- [Chart of Accounts Service](../components/accounting/README.md)
- [Error Handling Framework](../errors/README.md)
- [Database Schema](../../docs/DATABASE_SCHEMA_ADVANCED_FEATURES.md)

For more detailed examples, see the [accounting integration usage examples](../examples/accounting-integration-usage.ts).