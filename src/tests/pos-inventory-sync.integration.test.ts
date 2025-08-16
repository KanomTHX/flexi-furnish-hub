import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POSInventorySyncService } from '../services/pos-inventory-sync.service';
import { supabase } from '../lib/supabase';
import { StockAlert, AutoPurchaseOrder, InventorySyncResult } from '../types/pos';

// Integration tests for POS Inventory Sync Service
// These tests use real database operations but with test data

describe('POSInventorySyncService Integration Tests', () => {
  let service: POSInventorySyncService;
  let testProductIds: string[] = [];
  let testSupplierIds: string[] = [];
  let testAlertIds: string[] = [];

  beforeEach(async () => {
    service = new POSInventorySyncService();
    
    // Create test data
    await setupTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  describe('Real-time Inventory Synchronization', () => {
    it('should perform end-to-end inventory sync with real database', async () => {
      // Create test products with low stock
      const testProduct = await createTestProduct({
        name: 'Test Sync Product',
        code: 'TSP001',
        minimum_stock: 10,
        reorder_point: 15,
        reorder_quantity: 50
      });

      testProductIds.push(testProduct.id);

      // Create some serial numbers (low stock scenario)
      await createTestSerialNumbers(testProduct.id, 5); // Below reorder point

      // Perform sync
      const syncResult = await service.syncInventoryLevels();

      expect(syncResult).toMatchObject({
        syncType: 'full',
        status: expect.stringMatching(/success|partial/),
        productsProcessed: expect.any(Number),
        stockAlertsGenerated: expect.any(Number)
      });

      expect(syncResult.startedAt).toBeDefined();
      expect(syncResult.completedAt).toBeDefined();
      expect(syncResult.summary).toBeDefined();
      expect(syncResult.summary.totalProducts).toBeGreaterThan(0);
    });

    it('should handle concurrent sync requests properly', async () => {
      const integrationId = 'test-concurrent-sync';

      // Start multiple syncs simultaneously
      const syncPromises = [
        service.syncInventoryLevels(integrationId),
        service.syncInventoryLevels(integrationId),
        service.syncInventoryLevels(integrationId)
      ];

      const results = await Promise.all(syncPromises);

      // At least one should succeed, others might fail due to concurrency control
      const successfulSyncs = results.filter(r => r.status === 'success');
      const failedSyncs = results.filter(r => r.status === 'failed');

      expect(successfulSyncs.length).toBeGreaterThanOrEqual(1);
      
      // Failed syncs should have concurrency error
      failedSyncs.forEach(result => {
        expect(result.errors.some(e => e.errorMessage.includes('already in progress'))).toBe(true);
      });
    });
  });

  describe('Stock Alert Generation and Processing', () => {
    it('should generate and process stock alerts end-to-end', async () => {
      // Create test product with low stock
      const testProduct = await createTestProduct({
        name: 'Low Stock Product',
        code: 'LSP001',
        minimum_stock: 5,
        reorder_point: 10,
        reorder_quantity: 30
      });

      testProductIds.push(testProduct.id);

      // Create test supplier
      const testSupplier = await createTestSupplier({
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '123-456-7890'
      });

      testSupplierIds.push(testSupplier.id);

      // Create supplier-product mapping
      await createSupplierProductMapping(testProduct.id, testSupplier.id);

      // Create low stock scenario (2 units, reorder point is 10)
      await createTestSerialNumbers(testProduct.id, 2);

      // Generate stock alerts
      const alerts = await service.generateStockAlerts({
        productId: testProduct.id
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        productId: testProduct.id,
        currentStock: 2,
        urgencyLevel: 'high', // 2 is <= 10 * 0.3 = 3
        status: 'pending'
      });

      testAlertIds.push(alerts[0].id);

      // Process the alerts
      const purchaseOrders = await service.processStockAlerts([alerts[0].id]);

      expect(purchaseOrders).toHaveLength(1);
      expect(purchaseOrders[0]).toMatchObject({
        supplierId: testSupplier.id,
        status: 'draft',
        triggerType: 'low_stock'
      });

      expect(purchaseOrders[0].items).toHaveLength(1);
      expect(purchaseOrders[0].items[0]).toMatchObject({
        productId: testProduct.id,
        quantity: 30, // reorder_quantity
        stockAlertId: alerts[0].id
      });
    });

    it('should monitor inventory levels and detect critical stock situations', async () => {
      // Create out-of-stock product
      const outOfStockProduct = await createTestProduct({
        name: 'Out of Stock Product',
        code: 'OOS001',
        minimum_stock: 5,
        reorder_point: 10,
        reorder_quantity: 25
      });

      testProductIds.push(outOfStockProduct.id);

      // Don't create any serial numbers (out of stock)

      // Monitor inventory levels
      const alerts = await service.monitorInventoryLevels();

      const criticalAlert = alerts.find(alert => alert.productId === outOfStockProduct.id);
      
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.urgencyLevel).toBe('critical');
      expect(criticalAlert?.currentStock).toBe(0);
      expect(criticalAlert?.daysOfStockRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Delivery Receipt Processing', () => {
    it('should update inventory from delivery receipts', async () => {
      // Create test product
      const testProduct = await createTestProduct({
        name: 'Delivery Test Product',
        code: 'DTP001',
        minimum_stock: 10,
        reorder_point: 15,
        reorder_quantity: 50
      });

      testProductIds.push(testProduct.id);

      // Create test supplier
      const testSupplier = await createTestSupplier({
        name: 'Delivery Test Supplier',
        email: 'delivery@supplier.com'
      });

      testSupplierIds.push(testSupplier.id);

      // Create initial low stock
      await createTestSerialNumbers(testProduct.id, 5);

      // Create stock alert
      const alerts = await service.generateStockAlerts({
        productId: testProduct.id
      });

      expect(alerts).toHaveLength(1);
      testAlertIds.push(alerts[0].id);

      // Process delivery receipt
      const deliveryData = {
        deliveryId: `delivery_${Date.now()}`,
        supplierId: testSupplier.id,
        items: [
          {
            productId: testProduct.id,
            productCode: testProduct.code,
            quantityReceived: 50,
            unitCost: 15.99
          }
        ],
        receivedAt: new Date().toISOString(),
        receivedBy: 'test-user',
        warehouseId: 'test-warehouse'
      };

      const result = await service.updateInventoryFromDelivery(deliveryData);

      expect(result.success).toBe(true);
      expect(result.updatedProducts).toContain(testProduct.id);
      expect(result.errors).toHaveLength(0);

      // Verify that stock alerts were updated
      const { data: updatedAlerts } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('id', alerts[0].id);

      expect(updatedAlerts?.[0]?.status).toBe('resolved');
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve inventory conflicts using different strategies', async () => {
      const conflicts = [
        {
          productId: 'test-product-1',
          productCode: 'TP001',
          posValue: 25,
          systemValue: 20,
          lastUpdated: new Date().toISOString()
        },
        {
          productId: 'test-product-2',
          productCode: 'TP002',
          posValue: 10,
          systemValue: 15,
          lastUpdated: new Date().toISOString()
        }
      ];

      // Test pos_wins strategy
      const posWinsResult = await service.resolveSyncConflicts(conflicts, 'pos_wins');
      expect(posWinsResult.resolved).toBe(2);
      expect(posWinsResult.manualReviewRequired).toBe(0);

      // Test manual_review strategy
      const manualReviewResult = await service.resolveSyncConflicts(conflicts, 'manual_review');
      expect(manualReviewResult.resolved).toBe(0);
      expect(manualReviewResult.manualReviewRequired).toBe(2);

      // Verify manual review records were created
      const { data: conflictRecords } = await supabase
        .from('inventory_conflicts')
        .select('*')
        .in('product_id', ['test-product-1', 'test-product-2']);

      expect(conflictRecords).toHaveLength(2);
      expect(conflictRecords?.every(record => record.status === 'pending_review')).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large inventory sync operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple test products
      const productPromises = Array.from({ length: 10 }, (_, i) =>
        createTestProduct({
          name: `Bulk Test Product ${i + 1}`,
          code: `BTP${String(i + 1).padStart(3, '0')}`,
          minimum_stock: 5,
          reorder_point: 10,
          reorder_quantity: 20
        })
      );

      const testProducts = await Promise.all(productPromises);
      testProductIds.push(...testProducts.map(p => p.id));

      // Create serial numbers for each product (some low stock, some adequate)
      const serialNumberPromises = testProducts.map((product, i) =>
        createTestSerialNumbers(product.id, i % 3 === 0 ? 3 : 15) // Every 3rd product has low stock
      );

      await Promise.all(serialNumberPromises);

      // Perform sync
      const syncResult = await service.syncInventoryLevels();

      const endTime = Date.now();
      const syncDuration = endTime - startTime;

      expect(syncResult.status).toMatch(/success|partial/);
      expect(syncResult.productsProcessed).toBeGreaterThanOrEqual(10);
      expect(syncDuration).toBeLessThan(30000); // Should complete within 30 seconds

      // Should generate alerts for low stock products
      expect(syncResult.stockAlertsGenerated).toBeGreaterThan(0);
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Create test product
      const testProduct = await createTestProduct({
        name: 'Concurrency Test Product',
        code: 'CTP001',
        minimum_stock: 10,
        reorder_point: 15,
        reorder_quantity: 30
      });

      testProductIds.push(testProduct.id);
      await createTestSerialNumbers(testProduct.id, 8); // Low stock

      // Perform concurrent operations
      const operations = [
        service.generateStockAlerts({ productId: testProduct.id }),
        service.monitorInventoryLevels(),
        service.updateInventoryFromDelivery({
          deliveryId: `concurrent_delivery_${Date.now()}`,
          supplierId: 'test-supplier',
          items: [{
            productId: testProduct.id,
            productCode: testProduct.code,
            quantityReceived: 20
          }],
          receivedAt: new Date().toISOString(),
          receivedBy: 'test-user',
          warehouseId: 'test-warehouse'
        })
      ];

      const results = await Promise.allSettled(operations);

      // All operations should complete without throwing errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Operation ${index} failed:`, result.reason);
        }
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  // Helper functions for test data setup and cleanup

  async function setupTestData() {
    // Create test warehouse if needed
    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('name', 'Test Warehouse')
      .single();

    if (!warehouse) {
      await supabase
        .from('warehouses')
        .insert({
          name: 'Test Warehouse',
          location: 'Test Location',
          is_active: true
        });
    }
  }

  async function cleanupTestData() {
    // Clean up in reverse order of dependencies
    
    // Clean up stock alerts
    if (testAlertIds.length > 0) {
      await supabase
        .from('stock_alerts')
        .delete()
        .in('id', testAlertIds);
    }

    // Clean up serial numbers
    if (testProductIds.length > 0) {
      await supabase
        .from('product_serial_numbers')
        .delete()
        .in('product_id', testProductIds);
    }

    // Clean up supplier product mappings
    if (testProductIds.length > 0) {
      await supabase
        .from('supplier_product_mappings')
        .delete()
        .in('product_id', testProductIds);
    }

    // Clean up products
    if (testProductIds.length > 0) {
      await supabase
        .from('products')
        .delete()
        .in('id', testProductIds);
    }

    // Clean up suppliers
    if (testSupplierIds.length > 0) {
      await supabase
        .from('suppliers')
        .delete()
        .in('id', testSupplierIds);
    }

    // Clean up test conflicts
    await supabase
      .from('inventory_conflicts')
      .delete()
      .in('product_id', ['test-product-1', 'test-product-2']);

    // Clean up sync logs
    await supabase
      .from('integration_sync_log')
      .delete()
      .eq('integration_type', 'pos');

    // Reset arrays
    testProductIds = [];
    testSupplierIds = [];
    testAlertIds = [];
  }

  async function createTestProduct(productData: {
    name: string;
    code: string;
    minimum_stock: number;
    reorder_point: number;
    reorder_quantity: number;
  }) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        code: productData.code,
        minimum_stock: productData.minimum_stock,
        reorder_point: productData.reorder_point,
        reorder_quantity: productData.reorder_quantity,
        category: 'Test Category',
        price: 100,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test product: ${error.message}`);
    }

    return data;
  }

  async function createTestSupplier(supplierData: {
    name: string;
    email: string;
    phone?: string;
  }) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplierData.name,
        email: supplierData.email,
        phone: supplierData.phone,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test supplier: ${error.message}`);
    }

    return data;
  }

  async function createTestSerialNumbers(productId: string, count: number) {
    const serialNumbers = Array.from({ length: count }, (_, i) => ({
      product_id: productId,
      serial_number: `SN${productId.slice(-4)}_${String(i + 1).padStart(3, '0')}`,
      status: 'available',
      warehouse_id: 'test-warehouse'
    }));

    const { error } = await supabase
      .from('product_serial_numbers')
      .insert(serialNumbers);

    if (error) {
      throw new Error(`Failed to create test serial numbers: ${error.message}`);
    }
  }

  async function createSupplierProductMapping(productId: string, supplierId: string) {
    const { error } = await supabase
      .from('supplier_product_mappings')
      .insert({
        product_id: productId,
        supplier_id: supplierId,
        unit_cost: 10.99,
        minimum_order_quantity: 10,
        lead_time_days: 7,
        is_preferred: true,
        priority: 1,
        quality_rating: 4.5,
        reliability_rating: 4.8,
        cost_rating: 4.2,
        overall_rating: 4.5,
        is_active: true
      });

    if (error) {
      throw new Error(`Failed to create supplier product mapping: ${error.message}`);
    }
  }
});