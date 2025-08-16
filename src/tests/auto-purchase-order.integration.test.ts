import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AutoPurchaseOrderService } from '../services/auto-purchase-order.service';
import { supabase } from '../lib/supabase';
import { StockAlert, AutoPurchaseOrder } from '../types/pos';

describe('AutoPurchaseOrderService Integration Tests', () => {
  let service: AutoPurchaseOrderService;
  let testSupplier: any;
  let testProduct: any;
  let testStockAlert: StockAlert;

  beforeEach(async () => {
    service = new AutoPurchaseOrderService();

    // Create test supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        supplier_code: 'TEST-SUPPLIER-001',
        supplier_name: 'Test Supplier for Auto PO',
        contact_person: 'John Test',
        email: 'john@testsupplier.com',
        phone: '123-456-7890',
        payment_terms: 30,
        credit_limit: 50000,
        current_balance: 0,
        status: 'active'
      })
      .select()
      .single();

    if (supplierError) {
      throw new Error(`Failed to create test supplier: ${supplierError.message}`);
    }
    testSupplier = supplier;

    // Create test product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: 'Test Product for Auto PO',
        code: 'TEST-PROD-001',
        price: 100,
        category: 'Test Category',
        minimum_stock: 10,
        reorder_point: 20,
        reorder_quantity: 100
      })
      .select()
      .single();

    if (productError) {
      throw new Error(`Failed to create test product: ${productError.message}`);
    }
    testProduct = product;

    // Create supplier product mapping
    await supabase
      .from('supplier_product_mappings')
      .insert({
        product_id: testProduct.id,
        supplier_id: testSupplier.id,
        supplier_product_code: 'SUP-TEST-001',
        unit_cost: 80,
        minimum_order_quantity: 10,
        lead_time_days: 7,
        is_preferred: true,
        priority: 1,
        quality_rating: 4,
        reliability_rating: 5,
        cost_rating: 4,
        overall_rating: 4.3,
        is_active: true
      });

    // Create test stock alert
    testStockAlert = {
      id: `test-alert-${Date.now()}`,
      productId: testProduct.id,
      productName: testProduct.name,
      productCode: testProduct.code,
      currentStock: 5,
      minimumStock: testProduct.minimum_stock,
      reorderPoint: testProduct.reorder_point,
      reorderQuantity: testProduct.reorder_quantity,
      preferredSupplierId: testSupplier.id,
      urgencyLevel: 'high',
      category: testProduct.category,
      location: 'Test Warehouse',
      averageDailySales: 3,
      daysOfStockRemaining: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save stock alert to database
    await supabase
      .from('stock_alerts')
      .insert({
        id: testStockAlert.id,
        product_id: testStockAlert.productId,
        product_name: testStockAlert.productName,
        product_code: testStockAlert.productCode,
        current_stock: testStockAlert.currentStock,
        minimum_stock: testStockAlert.minimumStock,
        reorder_point: testStockAlert.reorderPoint,
        reorder_quantity: testStockAlert.reorderQuantity,
        preferred_supplier_id: testStockAlert.preferredSupplierId,
        urgency_level: testStockAlert.urgencyLevel,
        category: testStockAlert.category,
        location: testStockAlert.location,
        average_daily_sales: testStockAlert.averageDailySales,
        days_of_stock_remaining: testStockAlert.daysOfStockRemaining,
        status: testStockAlert.status,
        created_at: testStockAlert.createdAt,
        updated_at: testStockAlert.updatedAt
      });
  });

  afterEach(async () => {
    // Clean up test data
    if (testStockAlert) {
      await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', testStockAlert.id);
    }

    if (testProduct) {
      await supabase
        .from('supplier_product_mappings')
        .delete()
        .eq('product_id', testProduct.id);

      await supabase
        .from('products')
        .delete()
        .eq('id', testProduct.id);
    }

    if (testSupplier) {
      await supabase
        .from('suppliers')
        .delete()
        .eq('id', testSupplier.id);
    }

    // Clean up any created purchase orders
    await supabase
      .from('auto_purchase_orders')
      .delete()
      .like('order_number', 'APO-%');
  });

  describe('End-to-End Purchase Order Creation', () => {
    it('should create a complete purchase order from stock alert', async () => {
      const stockAlerts = [testStockAlert];

      const result = await service.createAutomaticPurchaseOrders(stockAlerts);

      expect(result).toHaveLength(1);
      
      const purchaseOrder = result[0];
      expect(purchaseOrder.id).toBeDefined();
      expect(purchaseOrder.orderNumber).toMatch(/^APO-/);
      expect(purchaseOrder.supplierId).toBe(testSupplier.id);
      expect(purchaseOrder.supplier.name).toBe(testSupplier.supplier_name);
      expect(purchaseOrder.status).toBe('draft');
      expect(purchaseOrder.items).toHaveLength(1);
      
      const item = purchaseOrder.items[0];
      expect(item.productId).toBe(testProduct.id);
      expect(item.productName).toBe(testProduct.name);
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unitCost).toBe(80); // From supplier mapping
      expect(item.stockAlertId).toBe(testStockAlert.id);

      // Verify the order was saved to database
      const { data: savedOrder, error } = await supabase
        .from('auto_purchase_orders')
        .select('*')
        .eq('id', purchaseOrder.id)
        .single();

      expect(error).toBeNull();
      expect(savedOrder).toBeDefined();
      expect(savedOrder.supplier_id).toBe(testSupplier.id);
      expect(savedOrder.status).toBe('draft');

      // Verify stock alert status was updated
      const { data: updatedAlert, error: alertError } = await supabase
        .from('stock_alerts')
        .select('status')
        .eq('id', testStockAlert.id)
        .single();

      expect(alertError).toBeNull();
      expect(updatedAlert.status).toBe('processing');
    });

    it('should handle multiple stock alerts for the same supplier', async () => {
      // Create second product and alert
      const { data: product2, error: product2Error } = await supabase
        .from('products')
        .insert({
          name: 'Test Product 2 for Auto PO',
          code: 'TEST-PROD-002',
          price: 150,
          category: 'Test Category',
          minimum_stock: 5,
          reorder_point: 10,
          reorder_quantity: 50
        })
        .select()
        .single();

      expect(product2Error).toBeNull();

      // Create supplier mapping for second product
      await supabase
        .from('supplier_product_mappings')
        .insert({
          product_id: product2.id,
          supplier_id: testSupplier.id,
          supplier_product_code: 'SUP-TEST-002',
          unit_cost: 120,
          minimum_order_quantity: 5,
          lead_time_days: 5,
          is_preferred: true,
          priority: 1,
          quality_rating: 4,
          reliability_rating: 5,
          cost_rating: 3,
          overall_rating: 4.0,
          is_active: true
        });

      const stockAlert2: StockAlert = {
        id: `test-alert-2-${Date.now()}`,
        productId: product2.id,
        productName: product2.name,
        productCode: product2.code,
        currentStock: 2,
        minimumStock: product2.minimum_stock,
        reorderPoint: product2.reorder_point,
        reorderQuantity: product2.reorder_quantity,
        preferredSupplierId: testSupplier.id,
        urgencyLevel: 'critical',
        category: product2.category,
        location: 'Test Warehouse',
        averageDailySales: 1,
        daysOfStockRemaining: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save second stock alert
      await supabase
        .from('stock_alerts')
        .insert({
          id: stockAlert2.id,
          product_id: stockAlert2.productId,
          product_name: stockAlert2.productName,
          product_code: stockAlert2.productCode,
          current_stock: stockAlert2.currentStock,
          minimum_stock: stockAlert2.minimumStock,
          reorder_point: stockAlert2.reorderPoint,
          reorder_quantity: stockAlert2.reorderQuantity,
          preferred_supplier_id: stockAlert2.preferredSupplierId,
          urgency_level: stockAlert2.urgencyLevel,
          category: stockAlert2.category,
          location: stockAlert2.location,
          average_daily_sales: stockAlert2.averageDailySales,
          days_of_stock_remaining: stockAlert2.daysOfStockRemaining,
          status: stockAlert2.status,
          created_at: stockAlert2.createdAt,
          updated_at: stockAlert2.updatedAt
        });

      const stockAlerts = [testStockAlert, stockAlert2];

      const result = await service.createAutomaticPurchaseOrders(stockAlerts);

      expect(result).toHaveLength(1); // Should combine into one order for same supplier
      
      const purchaseOrder = result[0];
      expect(purchaseOrder.items).toHaveLength(2); // Should have both products
      expect(purchaseOrder.stockAlertIds).toHaveLength(2);
      expect(purchaseOrder.stockAlertIds).toContain(testStockAlert.id);
      expect(purchaseOrder.stockAlertIds).toContain(stockAlert2.id);

      // Clean up second product
      await supabase.from('stock_alerts').delete().eq('id', stockAlert2.id);
      await supabase.from('supplier_product_mappings').delete().eq('product_id', product2.id);
      await supabase.from('products').delete().eq('id', product2.id);
    });
  });

  describe('Supplier Selection Algorithm', () => {
    it('should select optimal supplier based on criteria', async () => {
      // Create second supplier with different ratings
      const { data: supplier2, error: supplier2Error } = await supabase
        .from('suppliers')
        .insert({
          supplier_code: 'TEST-SUPPLIER-002',
          supplier_name: 'Test Supplier 2 for Auto PO',
          contact_person: 'Jane Test',
          email: 'jane@testsupplier2.com',
          phone: '987-654-3210',
          payment_terms: 30,
          credit_limit: 30000,
          current_balance: 0,
          status: 'active',
          quality_rating: 5,
          delivery_rating: 4,
          cost_rating: 5
        })
        .select()
        .single();

      expect(supplier2Error).toBeNull();

      // Create mapping for second supplier (better cost, not preferred)
      await supabase
        .from('supplier_product_mappings')
        .insert({
          product_id: testProduct.id,
          supplier_id: supplier2.id,
          supplier_product_code: 'SUP2-TEST-001',
          unit_cost: 70, // Lower cost than first supplier
          minimum_order_quantity: 20,
          lead_time_days: 10,
          is_preferred: false,
          priority: 2,
          quality_rating: 5,
          reliability_rating: 4,
          cost_rating: 5,
          overall_rating: 4.7,
          is_active: true
        });

      const result = await service.selectOptimalSupplier(testProduct.id);

      expect(result).toBeDefined();
      // Should still prefer the first supplier due to preferred status bonus
      expect(result?.supplierId).toBe(testSupplier.id);

      // Test with cost-focused criteria
      const costFocusedResult = await service.selectOptimalSupplier(testProduct.id, {
        costWeight: 0.8,
        qualityWeight: 0.1,
        reliabilityWeight: 0.05,
        leadTimeWeight: 0.05,
        preferredSupplierBonus: 0.1
      });

      expect(costFocusedResult).toBeDefined();
      // With high cost weight, might prefer the cheaper supplier
      // (depends on exact scoring calculation)

      // Clean up second supplier
      await supabase.from('supplier_product_mappings').delete().eq('supplier_id', supplier2.id);
      await supabase.from('suppliers').delete().eq('id', supplier2.id);
    });
  });

  describe('Reorder Quantity Calculation', () => {
    it('should calculate appropriate reorder quantities', async () => {
      const params = {
        productId: testProduct.id,
        currentStock: 5,
        averageDailySales: 3,
        leadTimeDays: 7,
        safetyStockDays: 3,
        seasonalityFactor: 1.2
      };

      const quantity = await service.calculateReorderQuantity(params);

      expect(quantity).toBeGreaterThan(0);
      expect(typeof quantity).toBe('number');
      
      // Should be reasonable based on input parameters
      // Lead time demand: 3 * 7 * 1.2 = 25.2
      // Safety stock: 3 * 3 = 9
      // Review period: 3 * 30 = 90
      // Total needed: ~124, minus current stock (5) = ~119
      expect(quantity).toBeGreaterThan(50);
      expect(quantity).toBeLessThan(200);
    });
  });

  describe('Purchase Order Status Management', () => {
    it('should update order status and track workflow', async () => {
      // First create a purchase order
      const stockAlerts = [testStockAlert];
      const orders = await service.createAutomaticPurchaseOrders(stockAlerts);
      const orderId = orders[0].id;

      // Update status to approved
      const workflowStatus = await service.updatePurchaseOrderStatus(
        orderId,
        'approved',
        'test-user',
        'Approved for testing'
      );

      expect(workflowStatus.currentStatus).toBe('approved');
      expect(workflowStatus.orderId).toBe(orderId);

      // Verify in database
      const { data: updatedOrder, error } = await supabase
        .from('auto_purchase_orders')
        .select('status, approved_by, approved_at')
        .eq('id', orderId)
        .single();

      expect(error).toBeNull();
      expect(updatedOrder.status).toBe('approved');
      expect(updatedOrder.approved_by).toBe('test-user');
      expect(updatedOrder.approved_at).toBeDefined();

      // Check workflow step was logged
      const { data: workflowSteps, error: stepsError } = await supabase
        .from('purchase_order_workflow_steps')
        .select('*')
        .eq('order_id', orderId);

      expect(stepsError).toBeNull();
      expect(workflowSteps).toBeDefined();
      expect(workflowSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Purchase Order Retrieval', () => {
    it('should retrieve orders with filters', async () => {
      // Create a purchase order first
      const stockAlerts = [testStockAlert];
      const orders = await service.createAutomaticPurchaseOrders(stockAlerts);
      const createdOrder = orders[0];

      // Retrieve by status
      const draftOrders = await service.getPurchaseOrdersByStatus('draft');
      
      expect(draftOrders.length).toBeGreaterThan(0);
      const foundOrder = draftOrders.find(order => order.id === createdOrder.id);
      expect(foundOrder).toBeDefined();
      expect(foundOrder?.status).toBe('draft');
      expect(foundOrder?.supplierId).toBe(testSupplier.id);

      // Retrieve with supplier filter
      const supplierOrders = await service.getPurchaseOrdersByStatus(undefined, {
        supplierId: testSupplier.id
      });

      expect(supplierOrders.length).toBeGreaterThan(0);
      expect(supplierOrders.every(order => order.supplierId === testSupplier.id)).toBe(true);
    });
  });
});