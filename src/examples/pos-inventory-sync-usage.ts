/**
 * POS Inventory Synchronization Service Usage Examples
 * 
 * This file demonstrates how to use the POSInventorySyncService for various
 * inventory management scenarios including real-time sync, stock alerts,
 * and conflict resolution.
 */

import { posInventorySyncService } from '../services/pos-inventory-sync.service';
import { StockAlert, AutoPurchaseOrder, InventorySyncResult } from '../types/pos';

// Example 1: Basic Inventory Synchronization
export async function basicInventorySync() {
  console.log('🔄 Starting basic inventory synchronization...');
  
  try {
    // Perform a full inventory sync
    const syncResult = await posInventorySyncService.syncInventoryLevels();
    
    console.log('✅ Sync completed:', {
      status: syncResult.status,
      productsProcessed: syncResult.productsProcessed,
      productsUpdated: syncResult.productsUpdated,
      stockAlertsGenerated: syncResult.stockAlertsGenerated,
      purchaseOrdersCreated: syncResult.purchaseOrdersCreated,
      duration: new Date(syncResult.completedAt!).getTime() - new Date(syncResult.startedAt).getTime()
    });

    if (syncResult.errors.length > 0) {
      console.warn('⚠️ Sync completed with errors:', syncResult.errors);
    }

    return syncResult;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Example 2: Integration-Specific Synchronization
export async function integrationSpecificSync(integrationId: string) {
  console.log(`🔄 Starting sync for integration: ${integrationId}`);
  
  try {
    const syncResult = await posInventorySyncService.syncInventoryLevels(integrationId);
    
    console.log('✅ Integration sync completed:', {
      integrationId: syncResult.integrationId,
      status: syncResult.status,
      summary: syncResult.summary
    });

    // Handle different sync statuses
    switch (syncResult.status) {
      case 'success':
        console.log('🎉 All inventory data synchronized successfully');
        break;
      case 'partial':
        console.log('⚠️ Partial sync - some items had errors');
        console.log('Errors:', syncResult.errors);
        break;
      case 'failed':
        console.log('❌ Sync failed completely');
        console.log('Errors:', syncResult.errors);
        break;
    }

    return syncResult;
  } catch (error) {
    console.error('❌ Integration sync failed:', error);
    throw error;
  }
}

// Example 3: Stock Alert Monitoring and Processing
export async function monitorAndProcessStockAlerts() {
  console.log('📊 Monitoring inventory levels for stock alerts...');
  
  try {
    // Monitor inventory levels
    const alerts = await posInventorySyncService.monitorInventoryLevels();
    
    console.log(`📋 Generated ${alerts.length} stock alerts`);
    
    // Group alerts by urgency
    const alertsByUrgency = alerts.reduce((acc, alert) => {
      acc[alert.urgencyLevel] = (acc[alert.urgencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Alert breakdown by urgency:', alertsByUrgency);
    
    // Process critical and high urgency alerts immediately
    const urgentAlerts = alerts.filter(alert => 
      alert.urgencyLevel === 'critical' || alert.urgencyLevel === 'high'
    );
    
    if (urgentAlerts.length > 0) {
      console.log(`🚨 Processing ${urgentAlerts.length} urgent alerts...`);
      
      const purchaseOrders = await posInventorySyncService.processStockAlerts(
        urgentAlerts.map(alert => alert.id)
      );
      
      console.log(`📦 Created ${purchaseOrders.length} automatic purchase orders`);
      
      // Log purchase order details
      purchaseOrders.forEach(po => {
        console.log(`PO ${po.orderNumber}: ${po.supplier.name} - $${po.totalAmount.toFixed(2)}`);
        console.log(`  Items: ${po.items.length}, Expected delivery: ${po.expectedDeliveryDate}`);
      });
    }
    
    return { alerts, purchaseOrders: urgentAlerts.length > 0 ? await posInventorySyncService.processStockAlerts(urgentAlerts.map(a => a.id)) : [] };
  } catch (error) {
    console.error('❌ Stock alert monitoring failed:', error);
    throw error;
  }
}

// Example 4: Targeted Stock Alert Generation
export async function generateTargetedStockAlerts() {
  console.log('🎯 Generating targeted stock alerts...');
  
  try {
    // Generate alerts for specific criteria
    const scenarios = [
      {
        name: 'Critical Stock Only',
        params: { urgencyLevel: 'critical' as const }
      },
      {
        name: 'Specific Product',
        params: { productId: 'product-123' }
      },
      {
        name: 'Warehouse-Specific',
        params: { warehouseId: 'warehouse-main' }
      },
      {
        name: 'Force Recalculation',
        params: { forceRecalculation: true }
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n📊 ${scenario.name}:`);
      
      const alerts = await posInventorySyncService.generateStockAlerts(scenario.params);
      
      console.log(`  Generated ${alerts.length} alerts`);
      
      if (alerts.length > 0) {
        const sampleAlert = alerts[0];
        console.log(`  Sample: ${sampleAlert.productName} (${sampleAlert.productCode})`);
        console.log(`    Current stock: ${sampleAlert.currentStock}`);
        console.log(`    Reorder point: ${sampleAlert.reorderPoint}`);
        console.log(`    Urgency: ${sampleAlert.urgencyLevel}`);
        console.log(`    Days remaining: ${sampleAlert.daysOfStockRemaining}`);
      }
    }
  } catch (error) {
    console.error('❌ Targeted alert generation failed:', error);
    throw error;
  }
}

// Example 5: Delivery Receipt Processing
export async function processDeliveryReceipt() {
  console.log('📦 Processing delivery receipt...');
  
  const deliveryData = {
    deliveryId: `DEL-${Date.now()}`,
    supplierId: 'supplier-abc-123',
    items: [
      {
        productId: 'product-001',
        productCode: 'WIDGET-001',
        quantityReceived: 100,
        serialNumbers: ['SN001', 'SN002', 'SN003'], // Optional
        unitCost: 15.99
      },
      {
        productId: 'product-002',
        productCode: 'GADGET-002',
        quantityReceived: 50,
        unitCost: 29.99
      }
    ],
    receivedAt: new Date().toISOString(),
    receivedBy: 'warehouse-manager-001',
    warehouseId: 'warehouse-main'
  };
  
  try {
    const result = await posInventorySyncService.updateInventoryFromDelivery(deliveryData);
    
    console.log('✅ Delivery processed:', {
      success: result.success,
      updatedProducts: result.updatedProducts.length,
      errors: result.errors.length
    });
    
    if (result.updatedProducts.length > 0) {
      console.log('📈 Updated products:', result.updatedProducts);
    }
    
    if (result.errors.length > 0) {
      console.log('⚠️ Processing errors:', result.errors);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Delivery processing failed:', error);
    throw error;
  }
}

// Example 6: Conflict Resolution Scenarios
export async function handleInventoryConflicts() {
  console.log('⚖️ Handling inventory conflicts...');
  
  // Sample conflicts that might occur during sync
  const conflicts = [
    {
      productId: 'product-001',
      productCode: 'WIDGET-001',
      posValue: 25,      // POS system shows 25 units
      systemValue: 30,   // Our system shows 30 units
      lastUpdated: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    },
    {
      productId: 'product-002',
      productCode: 'GADGET-002',
      posValue: 15,      // POS system shows 15 units
      systemValue: 10,   // Our system shows 10 units
      lastUpdated: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    }
  ];
  
  try {
    // Test different resolution strategies
    const strategies = [
      'pos_wins',
      'supplier_wins',
      'latest_timestamp',
      'manual_review'
    ] as const;
    
    for (const strategy of strategies) {
      console.log(`\n🔧 Testing ${strategy} strategy:`);
      
      const result = await posInventorySyncService.resolveSyncConflicts(conflicts, strategy);
      
      console.log(`  Resolved: ${result.resolved}`);
      console.log(`  Manual review required: ${result.manualReviewRequired}`);
      console.log(`  Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log(`  Error details:`, result.errors);
      }
    }
  } catch (error) {
    console.error('❌ Conflict resolution failed:', error);
    throw error;
  }
}

// Example 7: Comprehensive Inventory Management Workflow
export async function comprehensiveInventoryWorkflow() {
  console.log('🔄 Starting comprehensive inventory management workflow...');
  
  try {
    // Step 1: Perform initial sync
    console.log('\n1️⃣ Initial inventory synchronization...');
    const syncResult = await posInventorySyncService.syncInventoryLevels();
    
    // Step 2: Monitor for stock alerts
    console.log('\n2️⃣ Monitoring stock levels...');
    const alerts = await posInventorySyncService.monitorInventoryLevels();
    
    // Step 3: Process urgent alerts
    const urgentAlerts = alerts.filter(alert => 
      alert.urgencyLevel === 'critical' || alert.urgencyLevel === 'high'
    );
    
    let purchaseOrders: AutoPurchaseOrder[] = [];
    if (urgentAlerts.length > 0) {
      console.log('\n3️⃣ Processing urgent stock alerts...');
      purchaseOrders = await posInventorySyncService.processStockAlerts(
        urgentAlerts.map(alert => alert.id)
      );
    }
    
    // Step 4: Handle any conflicts that arose during sync
    if (syncResult.errors.length > 0) {
      console.log('\n4️⃣ Resolving sync conflicts...');
      
      // Extract conflicts from sync errors (simplified example)
      const conflicts = syncResult.errors
        .filter(error => error.errorType === 'invalid_stock_level')
        .map(error => ({
          productId: error.productId,
          productCode: error.productCode || 'UNKNOWN',
          posValue: 0, // Would be extracted from error details
          systemValue: 0, // Would be extracted from error details
          lastUpdated: new Date().toISOString()
        }));
      
      if (conflicts.length > 0) {
        await posInventorySyncService.resolveSyncConflicts(conflicts, 'pos_wins');
      }
    }
    
    // Step 5: Generate summary report
    console.log('\n📊 Workflow Summary:');
    console.log(`  Sync Status: ${syncResult.status}`);
    console.log(`  Products Processed: ${syncResult.productsProcessed}`);
    console.log(`  Stock Alerts Generated: ${alerts.length}`);
    console.log(`  Purchase Orders Created: ${purchaseOrders.length}`);
    console.log(`  Total Inventory Value: $${syncResult.summary.totalInventoryValue.toFixed(2)}`);
    
    return {
      syncResult,
      alerts,
      purchaseOrders,
      summary: {
        totalProducts: syncResult.summary.totalProducts,
        lowStockProducts: syncResult.summary.lowStockDetected,
        outOfStockProducts: syncResult.summary.outOfStockDetected,
        averageStockLevel: syncResult.summary.averageStockLevel,
        totalValue: syncResult.summary.totalInventoryValue
      }
    };
  } catch (error) {
    console.error('❌ Comprehensive workflow failed:', error);
    throw error;
  }
}

// Example 8: Real-time Monitoring Setup
export async function setupRealTimeMonitoring() {
  console.log('⏰ Setting up real-time inventory monitoring...');
  
  // Simulate a monitoring loop (in production, this would be a scheduled job)
  const monitoringInterval = setInterval(async () => {
    try {
      console.log(`\n🔍 [${new Date().toISOString()}] Checking inventory levels...`);
      
      // Quick stock level check
      const alerts = await posInventorySyncService.generateStockAlerts({
        urgencyLevel: 'critical'
      });
      
      if (alerts.length > 0) {
        console.log(`🚨 CRITICAL: ${alerts.length} products are out of stock!`);
        
        // Process critical alerts immediately
        const purchaseOrders = await posInventorySyncService.processStockAlerts(
          alerts.map(alert => alert.id)
        );
        
        console.log(`📦 Auto-created ${purchaseOrders.length} emergency purchase orders`);
      } else {
        console.log('✅ All critical stock levels are adequate');
      }
    } catch (error) {
      console.error('❌ Monitoring check failed:', error);
    }
  }, 30000); // Check every 30 seconds
  
  // Stop monitoring after 5 minutes (for demo purposes)
  setTimeout(() => {
    clearInterval(monitoringInterval);
    console.log('⏹️ Real-time monitoring stopped');
  }, 300000);
  
  return monitoringInterval;
}

// Example usage function to run all examples
export async function runAllExamples() {
  console.log('🚀 Running all POS Inventory Sync examples...\n');
  
  try {
    // Run examples in sequence
    await basicInventorySync();
    await integrationSpecificSync('pos-integration-001');
    await monitorAndProcessStockAlerts();
    await generateTargetedStockAlerts();
    await processDeliveryReceipt();
    await handleInventoryConflicts();
    await comprehensiveInventoryWorkflow();
    
    // Setup real-time monitoring (runs in background)
    setupRealTimeMonitoring();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  }
}

// Export individual functions for selective usage
export {
  posInventorySyncService
};

// Utility functions for common operations
export const InventorySyncUtils = {
  /**
   * Calculate urgency level based on stock levels
   */
  calculateUrgencyLevel(currentStock: number, reorderPoint: number): 'low' | 'medium' | 'high' | 'critical' {
    if (currentStock === 0) return 'critical';
    if (currentStock <= reorderPoint * 0.3) return 'high';
    if (currentStock <= reorderPoint * 0.7) return 'medium';
    return 'low';
  },

  /**
   * Format sync result for display
   */
  formatSyncResult(result: InventorySyncResult): string {
    const duration = result.completedAt 
      ? new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()
      : 0;
    
    return `Sync ${result.id}: ${result.status} (${result.productsProcessed} products, ${duration}ms)`;
  },

  /**
   * Group stock alerts by urgency
   */
  groupAlertsByUrgency(alerts: StockAlert[]): Record<string, StockAlert[]> {
    return alerts.reduce((acc, alert) => {
      acc[alert.urgencyLevel] = acc[alert.urgencyLevel] || [];
      acc[alert.urgencyLevel].push(alert);
      return acc;
    }, {} as Record<string, StockAlert[]>);
  },

  /**
   * Calculate total value of purchase orders
   */
  calculatePurchaseOrderValue(orders: AutoPurchaseOrder[]): number {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }
};