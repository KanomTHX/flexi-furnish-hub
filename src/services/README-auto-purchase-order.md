# Auto Purchase Order Service

The `AutoPurchaseOrderService` provides comprehensive functionality for automatic purchase order generation, supplier selection algorithms, reorder point calculations, approval workflows, and purchase order status tracking.

## Features

- **Automatic PO Generation**: Creates purchase orders from stock alerts
- **Intelligent Supplier Selection**: Multi-criteria supplier selection algorithm
- **Optimal Reorder Calculations**: Economic order quantity with safety stock
- **Approval Workflows**: Configurable approval rules and tracking
- **Status Management**: Complete purchase order lifecycle management
- **Integration Ready**: Works with POS systems and inventory management

## Core Components

### 1. Automatic Purchase Order Creation

```typescript
import { AutoPurchaseOrderService } from './auto-purchase-order.service';

const service = new AutoPurchaseOrderService();

// Create purchase orders from stock alerts
const stockAlerts = [/* stock alert objects */];
const purchaseOrders = await service.createAutomaticPurchaseOrders(stockAlerts);
```

### 2. Supplier Selection Algorithm

The service uses a weighted scoring system to select optimal suppliers:

```typescript
// Default criteria weights
const criteria = {
  costWeight: 0.4,           // 40% weight on cost
  qualityWeight: 0.25,       // 25% weight on quality
  reliabilityWeight: 0.25,   // 25% weight on reliability
  leadTimeWeight: 0.1,       // 10% weight on lead time
  preferredSupplierBonus: 0.2 // 20% bonus for preferred suppliers
};

const optimalSupplier = await service.selectOptimalSupplier(productId, criteria);
```

### 3. Reorder Quantity Calculation

Uses Economic Order Quantity (EOQ) principles with safety stock:

```typescript
const reorderParams = {
  productId: 'product_123',
  currentStock: 10,
  averageDailySales: 5,
  leadTimeDays: 7,
  safetyStockDays: 3,
  seasonalityFactor: 1.2
};

const quantity = await service.calculateReorderQuantity(reorderParams);
```

### 4. Approval Workflow Management

```typescript
// Check if order requires approval
const approvalCheck = await service.checkApprovalRequirement(purchaseOrder);

// Update order status with workflow tracking
const workflowStatus = await service.updatePurchaseOrderStatus(
  orderId,
  'approved',
  'manager_user_id',
  'Approved for urgent stock replenishment'
);
```

## Database Schema

The service works with the following database tables:

### auto_purchase_orders
```sql
CREATE TABLE auto_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    automation_reason TEXT,
    trigger_type VARCHAR(50),
    stock_alert_ids UUID[],
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### auto_purchase_order_items
```sql
CREATE TABLE auto_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES auto_purchase_orders(id),
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    remaining_quantity INTEGER NOT NULL,
    stock_alert_id UUID,
    supplier_product_code VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    notes TEXT
);
```

### purchase_order_approval_rules
```sql
CREATE TABLE purchase_order_approval_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    condition VARCHAR(50) NOT NULL, -- 'total_amount', 'supplier_risk', etc.
    operator VARCHAR(20) NOT NULL,  -- 'greater_than', 'less_than', etc.
    value JSONB NOT NULL,
    approver_roles TEXT[] NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### purchase_order_workflow_steps
```sql
CREATE TABLE purchase_order_workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES auto_purchase_orders(id),
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Reference

### createAutomaticPurchaseOrders(stockAlerts)

Creates automatic purchase orders from stock alerts.

**Parameters:**
- `stockAlerts: StockAlert[]` - Array of stock alerts to process

**Returns:** `Promise<AutoPurchaseOrder[]>` - Created purchase orders

**Example:**
```typescript
const orders = await service.createAutomaticPurchaseOrders([
  {
    id: 'alert_001',
    productId: 'prod_001',
    productName: 'Widget A',
    currentStock: 5,
    reorderPoint: 20,
    preferredSupplierId: 'supplier_001',
    urgencyLevel: 'high'
    // ... other properties
  }
]);
```

### selectOptimalSupplier(productId, criteria?)

Selects the optimal supplier for a product using weighted criteria.

**Parameters:**
- `productId: string` - Product identifier
- `criteria?: Partial<SupplierSelectionCriteria>` - Optional custom criteria weights

**Returns:** `Promise<SupplierProductMapping | null>` - Best supplier mapping or null

### calculateReorderQuantity(params)

Calculates optimal reorder quantity using EOQ principles.

**Parameters:**
- `params: ReorderCalculationParams` - Calculation parameters

**Returns:** `Promise<number>` - Optimal reorder quantity

### checkApprovalRequirement(purchaseOrder)

Checks if a purchase order requires approval based on configured rules.

**Parameters:**
- `purchaseOrder: Partial<AutoPurchaseOrder>` - Purchase order to check

**Returns:** `Promise<ApprovalCheckResult>` - Approval requirement details

### updatePurchaseOrderStatus(orderId, newStatus, updatedBy, comments?)

Updates purchase order status with workflow tracking.

**Parameters:**
- `orderId: string` - Purchase order ID
- `newStatus: AutoPurchaseOrder['status']` - New status
- `updatedBy: string` - User making the update
- `comments?: string` - Optional comments

**Returns:** `Promise<PurchaseOrderWorkflowStatus>` - Updated workflow status

### getPurchaseOrdersByStatus(status?, filters?)

Retrieves purchase orders by status with optional filters.

**Parameters:**
- `status?: AutoPurchaseOrder['status']` - Optional status filter
- `filters?: PurchaseOrderFilters` - Optional additional filters

**Returns:** `Promise<AutoPurchaseOrder[]>` - Matching purchase orders

### getPurchaseOrderWorkflowStatus(orderId)

Gets complete workflow status for a purchase order.

**Parameters:**
- `orderId: string` - Purchase order ID

**Returns:** `Promise<PurchaseOrderWorkflowStatus>` - Complete workflow status

## Configuration

### Supplier Selection Criteria

Customize supplier selection by adjusting weights:

```typescript
const customCriteria = {
  costWeight: 0.5,           // Emphasize cost
  qualityWeight: 0.3,        // Quality important
  reliabilityWeight: 0.15,   // Reliability less important
  leadTimeWeight: 0.05,      // Lead time least important
  preferredSupplierBonus: 0.1 // Small preferred bonus
};
```

### Approval Rules

Configure approval rules in the database:

```sql
INSERT INTO purchase_order_approval_rules (
    name,
    condition,
    operator,
    value,
    approver_roles
) VALUES (
    'High Value Orders',
    'total_amount',
    'greater_than',
    '5000',
    ARRAY['manager', 'finance_director']
);
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const orders = await service.createAutomaticPurchaseOrders(stockAlerts);
} catch (error) {
  if (error instanceof POSIntegrationError) {
    console.error('POS Integration Error:', error.message);
    console.error('Error Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Integration with Other Services

### POS Inventory Sync Service

```typescript
import { POSInventorySyncService } from './pos-inventory-sync.service';

const posService = new POSInventorySyncService();
const autoPoService = new AutoPurchaseOrderService();

// Generate stock alerts from inventory monitoring
const stockAlerts = await posService.monitorInventoryLevels();

// Create purchase orders from alerts
const purchaseOrders = await autoPoService.createAutomaticPurchaseOrders(stockAlerts);
```

### Notification Service

```typescript
// After creating purchase orders, send notifications
for (const order of purchaseOrders) {
  if (order.approvalRequired) {
    await notificationService.sendApprovalRequest(order);
  } else {
    await notificationService.sendOrderToSupplier(order);
  }
}
```

## Best Practices

### 1. Supplier Data Quality

Ensure supplier product mappings are up-to-date:
- Regular review of unit costs
- Update lead times based on performance
- Maintain quality and reliability ratings

### 2. Approval Workflow Design

- Set appropriate approval thresholds
- Define clear escalation paths
- Include timeout mechanisms for approvals

### 3. Reorder Quantity Optimization

- Regularly review and adjust safety stock levels
- Consider seasonal demand patterns
- Monitor and optimize carrying costs

### 4. Error Monitoring

- Implement comprehensive logging
- Set up alerts for failed order creation
- Monitor supplier selection accuracy

### 5. Performance Optimization

- Index frequently queried fields
- Use database views for complex queries
- Implement caching for supplier ratings

## Testing

The service includes comprehensive test coverage:

```bash
# Run unit tests
npm test auto-purchase-order.service.unit.test.ts

# Run integration tests
npm test auto-purchase-order.integration.test.ts

# Run all tests with coverage
npm run test:coverage
```

## Monitoring and Analytics

Track key metrics:

- **Order Creation Rate**: Orders created per time period
- **Supplier Selection Accuracy**: How often optimal suppliers are chosen
- **Approval Cycle Time**: Time from creation to approval
- **Order Fulfillment Rate**: Percentage of orders successfully delivered
- **Cost Savings**: Savings from optimal supplier selection

## Future Enhancements

Planned improvements:

1. **Machine Learning Integration**: AI-powered supplier selection
2. **Dynamic Pricing**: Real-time price comparison
3. **Supplier Performance Prediction**: Predictive analytics for supplier reliability
4. **Advanced Seasonality**: More sophisticated demand forecasting
5. **Multi-currency Support**: Handle international suppliers
6. **Bulk Order Optimization**: Optimize across multiple products

## Support

For issues or questions:

1. Check the test files for usage examples
2. Review error logs for troubleshooting
3. Consult the integration documentation
4. Contact the development team

## License

This service is part of the Supplier Billing Advanced Features system and follows the same licensing terms.