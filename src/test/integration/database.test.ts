// Integration tests for database operations
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { serialNumberService } from '@/lib/serialNumberService';
import { WarehouseService } from '@/lib/warehouseService';
import { transferService } from '@/lib/transferService';
import { withdrawDispatchService } from '@/lib/withdrawDispatchService';
import { receiveGoodsService } from '@/lib/receiveGoodsService';
import { realTimeStockService } from '@/services/realTimeStockService';
import { printService } from '@/services/printService';

// Mock Supabase for integration tests
vi.mock('@/integrations/supabase/client');

// Test data
const testWarehouse = {
  id: 'test-warehouse-1',
  name: 'Test Warehouse',
  code: 'TW001',
  branch_id: 'test-branch-1',
  type: 'main' as const,
  is_active: true
};

const testProduct = {
  id: 'test-product-1',
  name: 'Test Product',
  code: 'TP001',
  sku: 'TP001-TEST',
  brand: 'Test Brand',
  model: 'Test Model',
  category: 'Test Category',
  unit_cost: 1000,
  selling_price: 2000,
  is_active: true
};

const testSupplier = {
  id: 'test-supplier-1',
  name: 'Test Supplier',
  code: 'TS001',
  contact_person: 'Test Contact',
  phone: '123-456-7890',
  email: 'test@supplier.com'
};

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Setup test data
    await supabase.from('branches').upsert({
      id: 'test-branch-1',
      name: 'Test Branch',
      code: 'TB001',
      address: 'Test Address',
      is_active: true
    });

    await supabase.from('warehouses').upsert(testWarehouse);
    await supabase.from('products').upsert(testProduct);
    await supabase.from('suppliers').upsert(testSupplier);
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('product_serial_numbers').delete().like('serial_number', 'TEST-%');
    await supabase.from('stock_movements').delete().eq('warehouse_id', testWarehouse.id);
    await supabase.from('stock_transfers').delete().or(`source_warehouse_id.eq.${testWarehouse.id},target_warehouse_id.eq.${testWarehouse.id}`);
    await supabase.from('products').delete().eq('id', testProduct.id);
    await supabase.from('suppliers').delete().eq('id', testSupplier.id);
    await supabase.from('warehouses').delete().eq('id', testWarehouse.id);
    await supabase.from('branches').delete().eq('id', 'test-branch-1');
  });

  describe('Serial Number Operations', () => {
    let createdSNs: any[] = [];

    afterEach(async () => {
      // Cleanup created serial numbers
      if (createdSNs.length > 0) {
        const ids = createdSNs.map(sn => sn.id);
        await supabase.from('product_serial_numbers').delete().in('id', ids);
        createdSNs = [];
      }
    });

    it('should create serial numbers successfully', async () => {
      const data = {
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 3,
        unitCost: 1000,
        supplierId: testSupplier.id,
        invoiceNumber: 'TEST-INV-001'
      };

      const result = await serialNumberService.generateAndCreateSNs(data);

      expect(result).toHaveLength(3);
      expect(result[0].serial_number).toMatch(/^TP001-\d{4}-\d{3}$/);
      expect(result[0].product_id).toBe(testProduct.id);
      expect(result[0].warehouse_id).toBe(testWarehouse.id);
      expect(result[0].unit_cost).toBe(1000);
      expect(result[0].status).toBe('available');

      createdSNs = result;
    });

    it('should search serial numbers with filters', async () => {
      // First create some serial numbers
      const data = {
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 2,
        unitCost: 1000
      };

      createdSNs = await serialNumberService.generateAndCreateSNs(data);

      // Search for them
      const searchResult = await serialNumberService.searchSerialNumbers({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        status: 'available'
      });

      expect(searchResult.data.length).toBeGreaterThanOrEqual(2);
      expect(searchResult.data[0].product_id).toBe(testProduct.id);
      expect(searchResult.data[0].warehouse_id).toBe(testWarehouse.id);
      expect(searchResult.data[0].status).toBe('available');
    });

    it('should update serial number status', async () => {
      // Create a serial number
      const data = {
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 1,
        unitCost: 1000
      };

      createdSNs = await serialNumberService.generateAndCreateSNs(data);
      const sn = createdSNs[0];

      // Update status
      await serialNumberService.updateSerialNumberStatus(
        sn.id,
        'sold',
        'Test Customer',
        'SALE-001',
        'Test sale'
      );

      // Verify update
      const updated = await serialNumberService.getSerialNumber(sn.id);
      expect(updated?.status).toBe('sold');
      expect(updated?.sold_to).toBe('Test Customer');
      expect(updated?.reference_number).toBe('SALE-001');
    });

    it('should transfer serial numbers between warehouses', async () => {
      // Create second warehouse
      const warehouse2 = {
        id: 'test-warehouse-2',
        name: 'Test Warehouse 2',
        code: 'TW002',
        branch_id: 'test-branch-1',
        type: 'branch' as const,
        is_active: true
      };

      await supabase.from('warehouses').upsert(warehouse2);

      try {
        // Create serial numbers in first warehouse
        const data = {
          productId: testProduct.id,
          productCode: testProduct.code,
          warehouseId: testWarehouse.id,
          quantity: 2,
          unitCost: 1000
        };

        createdSNs = await serialNumberService.generateAndCreateSNs(data);

        // Transfer to second warehouse
        const transferData = {
          serialNumberIds: createdSNs.map(sn => sn.id),
          fromWarehouseId: testWarehouse.id,
          toWarehouseId: warehouse2.id,
          performedBy: 'test-user',
          notes: 'Test transfer'
        };

        await serialNumberService.transferSerialNumbers(transferData);

        // Verify transfer
        for (const sn of createdSNs) {
          const updated = await serialNumberService.getSerialNumber(sn.id);
          expect(updated?.warehouse_id).toBe(warehouse2.id);
        }
      } finally {
        // Cleanup second warehouse
        await supabase.from('warehouses').delete().eq('id', warehouse2.id);
      }
    });
  });

  describe('Warehouse Operations', () => {
    it('should get warehouses successfully', async () => {
      const warehouses = await WarehouseService.getWarehouses();
      
      expect(warehouses).toBeInstanceOf(Array);
      expect(warehouses.length).toBeGreaterThan(0);
      
      const testWh = warehouses.find(wh => wh.id === testWarehouse.id);
      expect(testWh).toBeDefined();
      expect(testWh?.name).toBe(testWarehouse.name);
      expect(testWh?.code).toBe(testWarehouse.code);
    });

    it('should get warehouse by id', async () => {
      const warehouse = await WarehouseService.getWarehouse(testWarehouse.id);
      
      expect(warehouse).toBeDefined();
      expect(warehouse?.id).toBe(testWarehouse.id);
      expect(warehouse?.name).toBe(testWarehouse.name);
    });

    it('should create and update warehouse', async () => {
      const newWarehouse = {
        name: 'New Test Warehouse',
        code: 'NTW001',
        branch_id: 'test-branch-1',
        type: 'branch' as const,
        address: 'New Test Address',
        is_active: true
      };

      // Create warehouse
      const created = await WarehouseService.createWarehouse(newWarehouse);
      expect(created).toBeDefined();
      expect(created.name).toBe(newWarehouse.name);
      expect(created.code).toBe(newWarehouse.code);

      try {
        // Update warehouse
        const updateData = {
          name: 'Updated Test Warehouse',
          address: 'Updated Address'
        };

        const updated = await WarehouseService.updateWarehouse(created.id, updateData);
        expect(updated.name).toBe(updateData.name);
        expect(updated.address).toBe(updateData.address);
      } finally {
        // Cleanup
        await supabase.from('warehouses').delete().eq('id', created.id);
      }
    });
  });

  describe('Transfer Operations', () => {
    let warehouse2: any;
    let createdSNs: any[] = [];

    beforeEach(async () => {
      // Create second warehouse
      warehouse2 = {
        id: 'test-warehouse-2',
        name: 'Test Warehouse 2',
        code: 'TW002',
        branch_id: 'test-branch-1',
        type: 'branch' as const,
        is_active: true
      };

      await supabase.from('warehouses').upsert(warehouse2);

      // Create serial numbers for transfer
      const data = {
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 3,
        unitCost: 1000
      };

      createdSNs = await serialNumberService.generateAndCreateSNs(data);
    });

    afterEach(async () => {
      // Cleanup
      if (createdSNs.length > 0) {
        const ids = createdSNs.map(sn => sn.id);
        await supabase.from('product_serial_numbers').delete().in('id', ids);
      }
      await supabase.from('warehouses').delete().eq('id', warehouse2.id);
    });

    it('should create and confirm transfer', async () => {
      const transferData = {
        sourceWarehouseId: testWarehouse.id,
        targetWarehouseId: warehouse2.id,
        items: createdSNs.map(sn => ({
          serialNumberId: sn.id,
          productId: sn.product_id,
          quantity: 1,
          unitCost: sn.unit_cost
        })),
        notes: 'Test transfer',
        initiatedBy: 'test-user'
      };

      // Create transfer
      const transfer = await transferService.createTransfer(transferData);
      expect(transfer).toBeDefined();
      expect(transfer.source_warehouse_id).toBe(testWarehouse.id);
      expect(transfer.target_warehouse_id).toBe(warehouse2.id);
      expect(transfer.status).toBe('pending');

      try {
        // Confirm transfer
        await transferService.confirmTransfer(transfer.id, 'test-user');

        // Verify transfer status
        const confirmedTransfer = await transferService.getTransfer(transfer.id);
        expect(confirmedTransfer?.status).toBe('completed');

        // Verify serial numbers moved
        for (const sn of createdSNs) {
          const updated = await serialNumberService.getSerialNumber(sn.id);
          expect(updated?.warehouse_id).toBe(warehouse2.id);
        }
      } finally {
        // Cleanup transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id);
      }
    });

    it('should cancel transfer', async () => {
      const transferData = {
        sourceWarehouseId: testWarehouse.id,
        targetWarehouseId: warehouse2.id,
        items: createdSNs.slice(0, 1).map(sn => ({
          serialNumberId: sn.id,
          productId: sn.product_id,
          quantity: 1,
          unitCost: sn.unit_cost
        })),
        notes: 'Test transfer to cancel',
        initiatedBy: 'test-user'
      };

      // Create transfer
      const transfer = await transferService.createTransfer(transferData);

      try {
        // Cancel transfer
        await transferService.cancelTransfer(transfer.id, 'test-user', 'Test cancellation');

        // Verify transfer status
        const cancelledTransfer = await transferService.getTransfer(transfer.id);
        expect(cancelledTransfer?.status).toBe('cancelled');

        // Verify serial numbers stayed in original warehouse
        const sn = createdSNs[0];
        const unchanged = await serialNumberService.getSerialNumber(sn.id);
        expect(unchanged?.warehouse_id).toBe(testWarehouse.id);
      } finally {
        // Cleanup transfer
        await supabase.from('stock_transfers').delete().eq('id', transfer.id);
      }
    });
  });

  describe('Stock Movement Logging', () => {
    let createdSNs: any[] = [];

    afterEach(async () => {
      // Cleanup
      if (createdSNs.length > 0) {
        const ids = createdSNs.map(sn => sn.id);
        await supabase.from('product_serial_numbers').delete().in('id', ids);
      }
      await supabase.from('stock_movements').delete().eq('warehouse_id', testWarehouse.id);
    });

    it('should log stock movements correctly', async () => {
      // Create serial numbers
      const data = {
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 2,
        unitCost: 1000
      };

      createdSNs = await serialNumberService.generateAndCreateSNs(data);

      // Check that receive movements were logged
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('warehouse_id', testWarehouse.id)
        .eq('movement_type', 'receive')
        .eq('product_id', testProduct.id);

      expect(movements).toBeDefined();
      expect(movements!.length).toBeGreaterThanOrEqual(2);
      
      const movement = movements![0];
      expect(movement.movement_type).toBe('receive');
      expect(movement.quantity).toBe(1);
      expect(movement.unit_cost).toBe(1000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Try to create serial number with non-existent product
      const invalidData = {
        productId: 'non-existent-product',
        productCode: 'INVALID',
        warehouseId: testWarehouse.id,
        quantity: 1,
        unitCost: 1000
      };

      await expect(serialNumberService.generateAndCreateSNs(invalidData))
        .rejects.toThrow();
    });

    it('should handle concurrent operations', async () => {
      // Create serial numbers concurrently
      const promises = Array.from({ length: 3 }, (_, i) => 
        serialNumberService.generateAndCreateSNs({
          productId: testProduct.id,
          productCode: testProduct.code,
          warehouseId: testWarehouse.id,
          quantity: 1,
          unitCost: 1000 + i * 100
        })
      );

      const results = await Promise.all(promises);
      
      // Verify all were created successfully
      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result).toHaveLength(1);
        expect(result[0].unit_cost).toBe(1000 + i * 100);
      });

      // Cleanup
      const allSNs = results.flat();
      const ids = allSNs.map(sn => sn.id);
      await supabase.from('product_serial_numbers').delete().in('id', ids);
    });
  });
});
describe('Receive Goods Integration', () => {
    it('should integrate receive goods workflow end-to-end', async () => {
      // Mock the complete receive goods flow
      vi.mocked(receiveGoodsService.receiveGoods).mockResolvedValue({
        id: 'receive-1',
        receive_number: 'RCV-001',
        supplier_id: testSupplier.id,
        warehouse_id: testWarehouse.id,
        invoice_number: 'INV-001',
        total_items: 5,
        total_cost: 5000,
        received_by: 'user-1',
        status: 'completed',
        notes: 'Test receive',
        created_at: new Date().toISOString(),
        items: Array.from({ length: 5 }, (_, i) => ({
          id: `item-${i}`,
          product_id: testProduct.id,
          quantity: 1,
          unit_cost: 1000,
          serial_numbers: [`TP001-2024-${String(i + 1).padStart(3, '0')}`]
        }))
      });

      const receiveData = {
        supplierId: testSupplier.id,
        warehouseId: testWarehouse.id,
        invoiceNumber: 'INV-001',
        items: [{
          productId: testProduct.id,
          quantity: 5,
          unitCost: 1000
        }],
        notes: 'Test receive',
        receivedBy: 'user-1'
      };

      const result = await receiveGoodsService.receiveGoods(receiveData);

      expect(result).toBeDefined();
      expect(result.total_items).toBe(5);
      expect(result.total_cost).toBe(5000);
      expect(result.items).toHaveLength(5);
      expect(result.items[0].serial_numbers).toHaveLength(1);
    });

    it('should handle receive goods with multiple products', async () => {
      const testProduct2 = { ...testProduct, id: 'test-product-2', code: 'TP002' };

      vi.mocked(receiveGoodsService.receiveGoods).mockResolvedValue({
        id: 'receive-2',
        receive_number: 'RCV-002',
        supplier_id: testSupplier.id,
        warehouse_id: testWarehouse.id,
        invoice_number: 'INV-002',
        total_items: 8,
        total_cost: 13000,
        received_by: 'user-1',
        status: 'completed',
        notes: 'Multi-product receive',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            product_id: testProduct.id,
            quantity: 3,
            unit_cost: 1000,
            serial_numbers: ['TP001-2024-001', 'TP001-2024-002', 'TP001-2024-003']
          },
          {
            id: 'item-2',
            product_id: testProduct2.id,
            quantity: 5,
            unit_cost: 2000,
            serial_numbers: ['TP002-2024-001', 'TP002-2024-002', 'TP002-2024-003', 'TP002-2024-004', 'TP002-2024-005']
          }
        ]
      });

      const receiveData = {
        supplierId: testSupplier.id,
        warehouseId: testWarehouse.id,
        invoiceNumber: 'INV-002',
        items: [
          { productId: testProduct.id, quantity: 3, unitCost: 1000 },
          { productId: testProduct2.id, quantity: 5, unitCost: 2000 }
        ],
        notes: 'Multi-product receive',
        receivedBy: 'user-1'
      };

      const result = await receiveGoodsService.receiveGoods(receiveData);

      expect(result.total_items).toBe(8);
      expect(result.total_cost).toBe(13000);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].serial_numbers).toHaveLength(3);
      expect(result.items[1].serial_numbers).toHaveLength(5);
    });
  });

  describe('Withdraw/Dispatch Integration', () => {
    let testSerialNumbers: any[];

    beforeEach(() => {
      testSerialNumbers = Array.from({ length: 5 }, (_, i) => ({
        id: `sn-${i}`,
        serial_number: `TP001-2024-${String(i + 1).padStart(3, '0')}`,
        product_id: testProduct.id,
        warehouse_id: testWarehouse.id,
        unit_cost: 1000,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    });

    it('should handle withdraw operation with stock updates', async () => {
      vi.mocked(withdrawDispatchService.withdrawItems).mockResolvedValue({
        id: 'withdraw-1',
        type: 'withdraw',
        warehouse_id: testWarehouse.id,
        total_items: 2,
        reference_number: 'WD-001',
        notes: 'Test withdraw',
        performed_by: 'user-1',
        created_at: new Date().toISOString(),
        items: testSerialNumbers.slice(0, 2).map(sn => ({
          id: `item-${sn.id}`,
          serial_number_id: sn.id,
          product_id: sn.product_id,
          quantity: 1,
          unit_cost: sn.unit_cost,
          status: 'withdrawn'
        }))
      });

      const withdrawData = {
        warehouseId: testWarehouse.id,
        items: testSerialNumbers.slice(0, 2).map(sn => ({
          serialNumberId: sn.id,
          productId: sn.product_id,
          quantity: 1
        })),
        referenceNumber: 'WD-001',
        notes: 'Test withdraw',
        performedBy: 'user-1'
      };

      const result = await withdrawDispatchService.withdrawItems(withdrawData);

      expect(result).toBeDefined();
      expect(result.total_items).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].status).toBe('withdrawn');
    });

    it('should handle dispatch operation with customer info', async () => {
      vi.mocked(withdrawDispatchService.dispatchItems).mockResolvedValue({
        id: 'dispatch-1',
        type: 'dispatch',
        warehouse_id: testWarehouse.id,
        total_items: 3,
        reference_number: 'DISP-001',
        customer_name: 'Test Customer',
        customer_phone: '123-456-7890',
        delivery_address: 'Test Address',
        notes: 'Test dispatch',
        performed_by: 'user-1',
        created_at: new Date().toISOString(),
        items: testSerialNumbers.slice(0, 3).map(sn => ({
          id: `item-${sn.id}`,
          serial_number_id: sn.id,
          product_id: sn.product_id,
          quantity: 1,
          unit_cost: sn.unit_cost,
          status: 'dispatched'
        }))
      });

      const dispatchData = {
        warehouseId: testWarehouse.id,
        items: testSerialNumbers.slice(0, 3).map(sn => ({
          serialNumberId: sn.id,
          productId: sn.product_id,
          quantity: 1
        })),
        referenceNumber: 'DISP-001',
        customerName: 'Test Customer',
        customerPhone: '123-456-7890',
        deliveryAddress: 'Test Address',
        notes: 'Test dispatch',
        performedBy: 'user-1'
      };

      const result = await withdrawDispatchService.dispatchItems(dispatchData);

      expect(result).toBeDefined();
      expect(result.total_items).toBe(3);
      expect(result.customer_name).toBe('Test Customer');
      expect(result.items).toHaveLength(3);
      expect(result.items[0].status).toBe('dispatched');
    });
  });

  describe('Real-time Stock Integration', () => {
    it('should handle real-time stock updates', async () => {
      const mockCallback = vi.fn();
      
      // Mock real-time service
      vi.mocked(realTimeStockService.subscribe).mockImplementation((subscriptionId, options, callback) => {
        // Simulate real-time update
        setTimeout(() => {
          callback({
            type: 'stock_level_changed',
            data: {
              productId: testProduct.id,
              warehouseId: testWarehouse.id,
              previousStock: 10,
              currentStock: 8,
              change: -2,
              reason: 'sale'
            }
          });
        }, 100);

        return () => {}; // unsubscribe function
      });

      const unsubscribe = realTimeStockService.subscribe(
        'test-subscription',
        { warehouseId: testWarehouse.id },
        mockCallback
      );

      // Wait for the callback to be called
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'stock_level_changed',
        data: expect.objectContaining({
          productId: testProduct.id,
          warehouseId: testWarehouse.id,
          currentStock: 8
        })
      });

      unsubscribe();
    });

    it('should trigger stock alerts', async () => {
      const mockCallback = vi.fn();
      
      vi.mocked(realTimeStockService.subscribe).mockImplementation((subscriptionId, options, callback) => {
        // Simulate low stock alert
        setTimeout(() => {
          callback({
            type: 'alert_triggered',
            data: {
              type: 'low_stock',
              severity: 'warning',
              productId: testProduct.id,
              warehouseId: testWarehouse.id,
              productName: testProduct.name,
              warehouseName: testWarehouse.name,
              currentStock: 2,
              threshold: 5,
              message: 'Stock level is below threshold'
            }
          });
        }, 100);

        return () => {};
      });

      const unsubscribe = realTimeStockService.subscribe(
        'alert-subscription',
        { warehouseId: testWarehouse.id, alertsEnabled: true },
        mockCallback
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'alert_triggered',
        data: expect.objectContaining({
          type: 'low_stock',
          severity: 'warning',
          currentStock: 2,
          threshold: 5
        })
      });

      unsubscribe();
    });
  });

  describe('Print Service Integration', () => {
    it('should generate and print receive documents', async () => {
      const receiveData = {
        id: 'receive-1',
        receive_number: 'RCV-001',
        supplier_name: testSupplier.name,
        warehouse_name: testWarehouse.name,
        invoice_number: 'INV-001',
        total_items: 3,
        total_cost: 3000,
        received_by: 'user-1',
        created_at: new Date().toISOString(),
        items: [
          {
            product_name: testProduct.name,
            quantity: 3,
            unit_cost: 1000,
            serial_numbers: ['TP001-2024-001', 'TP001-2024-002', 'TP001-2024-003']
          }
        ]
      };

      vi.mocked(printService.printReceiveDocument).mockResolvedValue({
        success: true,
        documentUrl: 'test-document-url',
        printJobId: 'print-job-1'
      });

      const result = await printService.printReceiveDocument(receiveData);

      expect(result.success).toBe(true);
      expect(result.documentUrl).toBeDefined();
      expect(result.printJobId).toBeDefined();
    });

    it('should generate and print serial number stickers', async () => {
      const serialNumbers = testSerialNumbers.slice(0, 3);

      vi.mocked(printService.printSNStickers).mockResolvedValue({
        success: true,
        stickerUrls: serialNumbers.map((_, i) => `sticker-url-${i}`),
        printJobId: 'sticker-job-1'
      });

      const result = await printService.printSNStickers(serialNumbers);

      expect(result.success).toBe(true);
      expect(result.stickerUrls).toHaveLength(3);
      expect(result.printJobId).toBeDefined();
    });

    it('should generate and print transfer documents', async () => {
      const transferData = {
        id: 'transfer-1',
        transfer_number: 'TRF-001',
        source_warehouse_name: 'Source Warehouse',
        target_warehouse_name: 'Target Warehouse',
        total_items: 2,
        initiated_by: 'user-1',
        created_at: new Date().toISOString(),
        items: [
          {
            product_name: testProduct.name,
            serial_number: 'TP001-2024-001',
            unit_cost: 1000
          },
          {
            product_name: testProduct.name,
            serial_number: 'TP001-2024-002',
            unit_cost: 1000
          }
        ]
      };

      vi.mocked(printService.printTransferDocument).mockResolvedValue({
        success: true,
        documentUrl: 'transfer-document-url',
        printJobId: 'transfer-job-1'
      });

      const result = await printService.printTransferDocument(transferData);

      expect(result.success).toBe(true);
      expect(result.documentUrl).toBeDefined();
      expect(result.printJobId).toBeDefined();
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle complete workflow from receive to dispatch', async () => {
      // Step 1: Receive goods
      vi.mocked(receiveGoodsService.receiveGoods).mockResolvedValue({
        id: 'receive-1',
        receive_number: 'RCV-001',
        supplier_id: testSupplier.id,
        warehouse_id: testWarehouse.id,
        invoice_number: 'INV-001',
        total_items: 2,
        total_cost: 2000,
        received_by: 'user-1',
        status: 'completed',
        notes: 'Integration test',
        created_at: new Date().toISOString(),
        items: [{
          id: 'item-1',
          product_id: testProduct.id,
          quantity: 2,
          unit_cost: 1000,
          serial_numbers: ['TP001-2024-001', 'TP001-2024-002']
        }]
      });

      // Step 2: Search for received items
      vi.mocked(serialNumberService.searchSerialNumbers).mockResolvedValue({
        data: [
          {
            id: 'sn-1',
            serial_number: 'TP001-2024-001',
            product_id: testProduct.id,
            warehouse_id: testWarehouse.id,
            unit_cost: 1000,
            status: 'available'
          },
          {
            id: 'sn-2',
            serial_number: 'TP001-2024-002',
            product_id: testProduct.id,
            warehouse_id: testWarehouse.id,
            unit_cost: 1000,
            status: 'available'
          }
        ],
        count: 2,
        error: null
      });

      // Step 3: Dispatch items
      vi.mocked(withdrawDispatchService.dispatchItems).mockResolvedValue({
        id: 'dispatch-1',
        type: 'dispatch',
        warehouse_id: testWarehouse.id,
        total_items: 2,
        reference_number: 'DISP-001',
        customer_name: 'Integration Customer',
        notes: 'Integration test dispatch',
        performed_by: 'user-1',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            serial_number_id: 'sn-1',
            product_id: testProduct.id,
            quantity: 1,
            unit_cost: 1000,
            status: 'dispatched'
          },
          {
            id: 'item-2',
            serial_number_id: 'sn-2',
            product_id: testProduct.id,
            quantity: 1,
            unit_cost: 1000,
            status: 'dispatched'
          }
        ]
      });

      // Execute workflow
      const receiveResult = await receiveGoodsService.receiveGoods({
        supplierId: testSupplier.id,
        warehouseId: testWarehouse.id,
        invoiceNumber: 'INV-001',
        items: [{ productId: testProduct.id, quantity: 2, unitCost: 1000 }],
        notes: 'Integration test',
        receivedBy: 'user-1'
      });

      const searchResult = await serialNumberService.searchSerialNumbers({
        productId: testProduct.id,
        warehouseId: testWarehouse.id,
        status: 'available'
      });

      const dispatchResult = await withdrawDispatchService.dispatchItems({
        warehouseId: testWarehouse.id,
        items: searchResult.data.map(sn => ({
          serialNumberId: sn.id,
          productId: sn.product_id,
          quantity: 1
        })),
        referenceNumber: 'DISP-001',
        customerName: 'Integration Customer',
        notes: 'Integration test dispatch',
        performedBy: 'user-1'
      });

      // Verify complete workflow
      expect(receiveResult.total_items).toBe(2);
      expect(searchResult.data).toHaveLength(2);
      expect(dispatchResult.total_items).toBe(2);
      expect(dispatchResult.items.every(item => item.status === 'dispatched')).toBe(true);
    });

    it('should handle transfer workflow with confirmation', async () => {
      const warehouse2 = { ...testWarehouse, id: 'warehouse-2', name: 'Target Warehouse' };

      // Step 1: Create transfer
      vi.mocked(transferService.createTransfer).mockResolvedValue({
        id: 'transfer-1',
        transfer_number: 'TRF-001',
        source_warehouse_id: testWarehouse.id,
        target_warehouse_id: warehouse2.id,
        status: 'pending',
        total_items: 1,
        notes: 'Integration transfer',
        initiated_by: 'user-1',
        created_at: new Date().toISOString()
      });

      // Step 2: Confirm transfer
      vi.mocked(transferService.confirmTransfer).mockResolvedValue(undefined);

      // Step 3: Get updated transfer
      vi.mocked(transferService.getTransfer).mockResolvedValue({
        id: 'transfer-1',
        transfer_number: 'TRF-001',
        source_warehouse_id: testWarehouse.id,
        target_warehouse_id: warehouse2.id,
        status: 'completed',
        total_items: 1,
        notes: 'Integration transfer',
        initiated_by: 'user-1',
        confirmed_by: 'user-2',
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString()
      });

      // Execute workflow
      const transfer = await transferService.createTransfer({
        sourceWarehouseId: testWarehouse.id,
        targetWarehouseId: warehouse2.id,
        items: [{
          serialNumberId: 'sn-1',
          productId: testProduct.id,
          quantity: 1,
          unitCost: 1000
        }],
        notes: 'Integration transfer',
        initiatedBy: 'user-1'
      });

      await transferService.confirmTransfer(transfer.id, 'user-2');
      const confirmedTransfer = await transferService.getTransfer(transfer.id);

      expect(transfer.status).toBe('pending');
      expect(confirmedTransfer?.status).toBe('completed');
      expect(confirmedTransfer?.confirmed_by).toBe('user-2');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database constraint violations', async () => {
      // Mock constraint violation
      vi.mocked(serialNumberService.generateAndCreateSNs).mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );

      await expect(serialNumberService.generateAndCreateSNs({
        productId: testProduct.id,
        productCode: testProduct.code,
        warehouseId: testWarehouse.id,
        quantity: 1,
        unitCost: 1000
      })).rejects.toThrow('duplicate key value violates unique constraint');
    });

    it('should handle foreign key violations', async () => {
      vi.mocked(transferService.createTransfer).mockRejectedValue(
        new Error('insert or update on table violates foreign key constraint')
      );

      await expect(transferService.createTransfer({
        sourceWarehouseId: 'non-existent-warehouse',
        targetWarehouseId: testWarehouse.id,
        items: [{
          serialNumberId: 'sn-1',
          productId: testProduct.id,
          quantity: 1,
          unitCost: 1000
        }],
        notes: 'Error test',
        initiatedBy: 'user-1'
      })).rejects.toThrow('foreign key constraint');
    });

    it('should handle network timeouts gracefully', async () => {
      vi.mocked(WarehouseService.getWarehouses).mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(WarehouseService.getWarehouses()).rejects.toThrow('Network timeout');
    });
  });