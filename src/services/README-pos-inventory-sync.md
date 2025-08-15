# POS Inventory Synchronization Service

## Overview

The POS Inventory Synchronization Service provides comprehensive real-time inventory management capabilities for the Supplier Billing Advanced Features system. It handles inventory synchronization between POS systems and the supplier billing system, generates stock alerts, creates automatic purchase orders, and resolves inventory conflicts.

## Features

### 🔄 Real-time Inventory Synchronization
- Full and incremental inventory synchronization
- Integration-specific sync capabilities
- Concurrent sync prevention
- Performance monitoring and metrics

### 📊 Stock Alert Management
- Automatic stock level monitoring
- Configurable urgency levels (low, medium, high, critical)
- Targeted alert generation
- Alert processing and resolution

### 📦 Automatic Purchase Order Creation
- Stock alert-based purchase order generation
- Supplier preference management
- Approval workflow integration
- Multi-supplier order consolidation

### 📋 Delivery Receipt Processing
- Inventory updates from delivery receipts
- Stock alert resolution
- Serial number management
- Audit trail maintenance

### ⚖️ Conflict Resolution
- Multiple resolution strategies
- Manual review workflow
- Data consistency maintenance
- Conflict tracking and reporting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                POS Inventory Sync Service                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Sync      │  │   Stock     │  │   Purchase Order    │  │
│  │  Manager    │  │   Alert     │  │     Manager         │  │
│  │             │  │  Generator  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Delivery   │  │  Conflict   │  │   Integration       │  │
│  │ Processor   │  │  Resolver   │  │    Monitor          │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Products │ Stock Alerts │ Purchase Orders │ Sync Logs     │
│  Serial Numbers │ Suppliers │ Conflicts │ Mappings        │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Inventory Synchronization

```typescript
import { posInventorySyncService } from '../services/pos-inventory-sync.service';

// Perform full inventory sync
const syncResult = await posInventorySyncService.syncInventoryLevels();

console.log(`Sync completed: ${syncResult.status}`);
console.log(`Products processed: ${syncResult.productsProcessed}`);
console.log(`Stock alerts generated: ${syncResult.stockAlertsGenerated}`);
```

### Integration-Specific Sync

```typescript
// Sync specific POS integration
const integrationId = 'pos-square-main';
const syncResult = await posInventorySyncService.syncInventoryLevels(integrationId);

if (syncResult.status === 'success') {
  console.log('Integration sync successful');
} else {
  console.log('Sync errors:', syncResult.errors);
}
```

### Stock Alert Monitoring

```typescript
// Monitor all inventory levels
const alerts = await posInventorySyncService.monitorInventoryLevels();

// Filter critical alerts
const criticalAlerts = alerts.filter(alert => alert.urgencyLevel === 'critical');

if (criticalAlerts.length > 0) {
  console.log(`${criticalAlerts.length} products are out of stock!`);
}
```

### Targeted Alert Generation

```typescript
// Generate alerts for specific criteria
const alerts = await posInventorySyncService.generateStockAlerts({
  productId: 'product-123',
  urgencyLevel: 'high',
  warehouseId: 'warehouse-main'
});
```

### Process Stock Alerts

```typescript
// Process alerts and create purchase orders
const alertIds = ['alert-1', 'alert-2', 'alert-3'];
const purchaseOrders = await posInventorySyncService.processStockAlerts(alertIds);

console.log(`Created ${purchaseOrders.length} purchase orders`);
```

### Delivery Receipt Processing

```typescript
const deliveryData = {
  deliveryId: 'DEL-001',
  supplierId: 'supplier-abc',
  items: [
    {
      productId: 'product-001',
      productCode: 'WIDGET-001',
      quantityReceived: 100,
      unitCost: 15.99
    }
  ],
  receivedAt: new Date().toISOString(),
  receivedBy: 'warehouse-manager',
  warehouseId: 'main-warehouse'
};

const result = await posInventorySyncService.updateInventoryFromDelivery(deliveryData);
```

### Conflict Resolution

```typescript
const conflicts = [
  {
    productId: 'product-001',
    productCode: 'WIDGET-001',
    posValue: 25,
    systemValue: 30,
    lastUpdated: new Date().toISOString()
  }
];

// Resolve using POS values
const result = await posInventorySyncService.resolveSyncConflicts(conflicts, 'pos_wins');

console.log(`Resolved: ${result.resolved}, Manual review: ${result.manualReviewRequired}`);
```

## Configuration

### Sync Settings

```typescript
interface POSSyncSettings {
  syncInventory: boolean;
  syncSales: boolean;
  syncCustomers: boolean;
  syncProducts: boolean;
  autoCreatePurchaseOrders: boolean;
  stockAlertThreshold: number;
  reorderPointMultiplier: number;
  conflictResolution: 'pos_wins' | 'supplier_wins' | 'manual_review';
}
```

### Integration Configuration

```typescript
interface POSIntegrationConfig {
  id: string;
  name: string;
  type: 'square' | 'shopify' | 'woocommerce' | 'custom';
  configuration: POSSystemConfig;
  status: 'active' | 'inactive' | 'error';
  syncFrequency: 'real_time' | 'every_5_minutes' | 'hourly' | 'daily';
  syncSettings: POSSyncSettings;
}
```

## Error Handling

The service implements comprehensive error handling with custom error types:

### Error Types

- `InventorySyncError`: Thrown when inventory synchronization fails
- `StockAlertProcessingError`: Thrown when stock alert processing fails
- `InventoryDataInconsistencyError`: Thrown when inventory data is inconsistent
- `POSSystemUnavailableError`: Thrown when POS system is unreachable
- `ReorderPointCalculationError`: Thrown when reorder point calculation fails

### Error Recovery

```typescript
try {
  const syncResult = await posInventorySyncService.syncInventoryLevels();
} catch (error) {
  if (error instanceof InventorySyncError) {
    if (error.retryable) {
      // Retry the operation
      console.log('Retrying sync operation...');
    } else {
      // Log error and notify administrators
      console.error('Non-retryable sync error:', error.message);
    }
  }
}
```

## Performance Considerations

### Concurrency Control

The service prevents concurrent syncs for the same integration to avoid data conflicts:

```typescript
// This will fail if another sync is already running for the same integration
const syncResult = await posInventorySyncService.syncInventoryLevels('integration-1');
```

### Batch Processing

Large inventory operations are processed in batches to maintain performance:

- Stock alerts are generated in batches of 100 products
- Purchase orders are created per supplier to optimize processing
- Delivery receipts are processed item by item with error isolation

### Caching

The service implements intelligent caching for:
- Supplier product mappings
- Integration configurations
- Reorder point calculations
- Average daily sales data

## Monitoring and Metrics

### Sync Metrics

```typescript
interface InventorySyncResult {
  id: string;
  integrationId: string;
  syncType: 'full' | 'incremental' | 'real_time';
  status: 'success' | 'partial' | 'failed';
  startedAt: string;
  completedAt?: string;
  productsProcessed: number;
  productsUpdated: number;
  stockAlertsGenerated: number;
  purchaseOrdersCreated: number;
  errors: InventorySyncError[];
  summary: InventorySyncSummary;
}
```

### Health Checks

```typescript
interface IntegrationHealthCheck {
  integrationId: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  lastCheckAt: string;
  responseTime: number;
  uptime: number;
  errorRate: number;
  metrics: IntegrationMetrics;
}
```

## Database Schema

### Core Tables

#### stock_alerts
```sql
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  product_code VARCHAR(100),
  current_stock INTEGER,
  minimum_stock INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  preferred_supplier_id UUID REFERENCES suppliers(id),
  urgency_level VARCHAR(20),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### auto_purchase_orders
```sql
CREATE TABLE auto_purchase_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  total_amount DECIMAL(12,2),
  status VARCHAR(20),
  automation_reason TEXT,
  trigger_type VARCHAR(50),
  stock_alert_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE
);
```

#### integration_sync_log
```sql
CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY,
  integration_type VARCHAR(50),
  sync_type VARCHAR(50),
  status VARCHAR(20),
  records_processed INTEGER,
  errors_count INTEGER,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Testing

### Unit Tests

Run unit tests for the inventory sync service:

```bash
npm test src/tests/pos-inventory-sync.service.unit.test.ts
```

### Integration Tests

Run integration tests with real database operations:

```bash
npm test src/tests/pos-inventory-sync.integration.test.ts
```

### Test Coverage

The service maintains comprehensive test coverage including:
- ✅ Inventory synchronization scenarios
- ✅ Stock alert generation and processing
- ✅ Purchase order creation
- ✅ Delivery receipt processing
- ✅ Conflict resolution strategies
- ✅ Error handling and recovery
- ✅ Performance and scalability tests

## Best Practices

### 1. Sync Frequency

- Use real-time sync for critical inventory items
- Use hourly sync for standard inventory
- Use daily sync for slow-moving items

### 2. Alert Thresholds

- Set reorder points based on lead times and sales velocity
- Use different urgency levels for different product categories
- Consider seasonal variations in demand

### 3. Conflict Resolution

- Use `pos_wins` for high-velocity retail environments
- Use `supplier_wins` for warehouse-centric operations
- Use `manual_review` for high-value items

### 4. Error Handling

- Implement retry logic with exponential backoff
- Log all errors for monitoring and analysis
- Set up alerts for critical sync failures

### 5. Performance Optimization

- Batch process large operations
- Use database indexes on frequently queried fields
- Implement connection pooling for database operations
- Cache frequently accessed data

## Troubleshooting

### Common Issues

#### Sync Failures
```
Error: Sync already in progress for this integration
Solution: Wait for current sync to complete or check for stuck processes
```

#### Stock Alert Generation Issues
```
Error: Failed to calculate average daily sales
Solution: Ensure sales history data is available and accurate
```

#### Purchase Order Creation Failures
```
Error: No preferred supplier found for product
Solution: Configure supplier-product mappings in the system
```

### Debug Mode

Enable debug logging for detailed operation tracking:

```typescript
// Set environment variable
process.env.POS_SYNC_DEBUG = 'true';

// Or enable programmatically
posInventorySyncService.enableDebugMode(true);
```

## Support

For issues, questions, or feature requests related to the POS Inventory Synchronization Service:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Examine the error logs for specific error details
4. Consult the integration documentation for your POS system

## Changelog

### Version 1.0.0
- Initial implementation of inventory synchronization
- Stock alert generation and processing
- Automatic purchase order creation
- Delivery receipt processing
- Conflict resolution mechanisms
- Comprehensive error handling
- Performance optimizations
- Full test coverage