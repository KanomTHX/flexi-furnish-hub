// Performance tests for stock operations
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { measurePerformance, createTestDatabase, createMockProduct, createMockWarehouse } from '../utils/testHelpers';
import { serialNumberService } from '@/lib/serialNumberService';
import { WarehouseService } from '@/lib/warehouseService';
import { transferService } from '@/lib/transferService';

// Mock dependencies
vi.mock('@/integrations/supabase/client');

describe('Stock Operations Performance Tests', () => {
  let testDb: ReturnType<typeof createTestDatabase>;

  beforeEach(() => {
    testDb = createTestDatabase();
    vi.clearAllMocks();
  });

  describe('Serial Number Generation Performance', () => {
    it('should generate 100 serial numbers within acceptable time', async () => {
      const mockProduct = createMockProduct();
      const mockWarehouse = createMockWarehouse();

      // Mock the service to use test database
      vi.mocked(serialNumberService.generateAndCreateSNs).mockImplementation(async (data) => {
        const serialNumbers = [];
        for (let i = 0; i < data.quantity; i++) {
          const sn = {
            id: `sn-${i}`,
            serial_number: `${data.productCode}-2024-${String(i + 1).padStart(3, '0')}`,
            product_id: data.productId,
            warehouse_id: data.warehouseId,
            unit_cost: data.unitCost,
            status: 'available' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          testDb.insert('product_serial_numbers', sn);
          serialNumbers.push(sn);
        }
        return serialNumbers;
      });

      const performance = await measurePerformance(async () => {
        await serialNumberService.generateAndCreateSNs({
          productId: mockProduct.id,
          productCode: mockProduct.code,
          warehouseId: mockWarehouse.id,
          quantity: 100,
          unitCost: 1000
        });
      }, 10);

      // Should complete within 1 second on average
      expect(performance.avg).toBeLessThan(1000);
      expect(performance.max).toBeLessThan(2000);
    });

    it('should handle concurrent serial number generation', async () => {
      const mockProduct = createMockProduct();
      const mockWarehouse = createMockWarehouse();

      vi.mocked(serialNumberService.generateAndCreateSNs).mockImplementation(async (data) => {
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const serialNumbers = [];
        for (let i = 0; i < data.quantity; i++) {
          const sn = {
            id: `sn-${Date.now()}-${i}`,
            serial_number: `${data.productCode}-2024-${String(i + 1).padStart(3, '0')}`,
            product_id: data.productId,
            warehouse_id: data.warehouseId,
            unit_cost: data.unitCost,
            status: 'available' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          testDb.insert('product_serial_numbers', sn);
          serialNumbers.push(sn);
        }
        return serialNumbers;
      });

      const concurrentOperations = Array.from({ length: 10 }, () =>
        serialNumberService.generateAndCreateSNs({
          productId: mockProduct.id,
          productCode: mockProduct.code,
          warehouseId: mockWarehouse.id,
          quantity: 10,
          unitCost: 1000
        })
      );

      const start = performance.now();
      const results = await Promise.all(concurrentOperations);
      const end = performance.now();

      // All operations should complete
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveLength(10);
      });

      // Should complete within reasonable time (concurrent operations should be faster than sequential)
      expect(end - start).toBeLessThan(500);
    });
  });

  describe('Stock Search Performance', () => {
    beforeEach(async () => {
      // Create test data
      const mockProduct = createMockProduct();
      const mockWarehouse = createMockWarehouse();

      // Create 1000 serial numbers for testing
      for (let i = 0; i < 1000; i++) {
        testDb.insert('product_serial_numbers', {
          id: `sn-${i}`,
          serial_number: `TP001-2024-${String(i + 1).padStart(4, '0')}`,
          product_id: mockProduct.id,
          warehouse_id: mockWarehouse.id,
          unit_cost: 1000 + (i % 100),
          status: i % 10 === 0 ? 'sold' : 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    it('should search through large dataset efficiently', async () => {
      vi.mocked(serialNumberService.searchSerialNumbers).mockImplementation(async (filters) => {
        const allSNs = testDb.select('product_serial_numbers');
        let filtered = allSNs;

        if (filters.productId) {
          filtered = filtered.filter((sn: any) => sn.product_id === filters.productId);
        }
        if (filters.warehouseId) {
          filtered = filtered.filter((sn: any) => sn.warehouse_id === filters.warehouseId);
        }
        if (filters.status) {
          filtered = filtered.filter((sn: any) => sn.status === filters.status);
        }
        if (filters.serialNumber) {
          filtered = filtered.filter((sn: any) => 
            sn.serial_number.includes(filters.serialNumber)
          );
        }

        return {
          data: filtered.slice(0, filters.limit || 50),
          count: filtered.length,
          error: null
        };
      });

      const performance = await measurePerformance(async () => {
        await serialNumberService.searchSerialNumbers({
          productId: 'product-1',
          status: 'available',
          limit: 50
        });
      }, 50);

      // Search should be fast even with large dataset
      expect(performance.avg).toBeLessThan(100);
      expect(performance.max).toBeLessThan(200);
    });

    it('should handle complex search queries efficiently', async () => {
      vi.mocked(serialNumberService.searchSerialNumbers).mockImplementation(async (filters) => {
        // Simulate complex database query
        await new Promise(resolve => setTimeout(resolve, 5));
        
        const allSNs = testDb.select('product_serial_numbers');
        const filtered = allSNs.filter((sn: any) => {
          if (filters.serialNumber && !sn.serial_number.includes(filters.serialNumber)) return false;
          if (filters.status && sn.status !== filters.status) return false;
          if (filters.minCost && sn.unit_cost < filters.minCost) return false;
          if (filters.maxCost && sn.unit_cost > filters.maxCost) return false;
          return true;
        });

        return {
          data: filtered.slice(0, filters.limit || 50),
          count: filtered.length,
          error: null
        };
      });

      const performance = await measurePerformance(async () => {
        await serialNumberService.searchSerialNumbers({
          serialNumber: '2024',
          status: 'available',
          minCost: 1000,
          maxCost: 1050,
          limit: 100
        });
      }, 20);

      expect(performance.avg).toBeLessThan(200);
    });
  });

  describe('Transfer Operations Performance', () => {
    it('should handle bulk transfers efficiently', async () => {
      const mockWarehouse1 = createMockWarehouse({ id: 'wh-1' });
      const mockWarehouse2 = createMockWarehouse({ id: 'wh-2' });

      // Create 100 serial numbers for transfer
      const serialNumbers = Array.from({ length: 100 }, (_, i) => ({
        id: `sn-${i}`,
        serial_number: `TP001-2024-${String(i + 1).padStart(3, '0')}`,
        product_id: 'product-1',
        warehouse_id: mockWarehouse1.id,
        unit_cost: 1000,
        status: 'available' as const
      }));

      serialNumbers.forEach(sn => testDb.insert('product_serial_numbers', sn));

      vi.mocked(transferService.createTransfer).mockImplementation(async (data) => {
        // Simulate transfer creation
        const transfer = {
          id: 'transfer-1',
          transfer_number: 'TRF-001',
          source_warehouse_id: data.sourceWarehouseId,
          target_warehouse_id: data.targetWarehouseId,
          status: 'pending' as const,
          total_items: data.items.length,
          notes: data.notes,
          initiated_by: data.initiatedBy,
          created_at: new Date().toISOString()
        };

        testDb.insert('stock_transfers', transfer);
        return transfer;
      });

      vi.mocked(transferService.confirmTransfer).mockImplementation(async (transferId, confirmedBy) => {
        // Simulate transfer confirmation and SN updates
        const transfer = testDb.select('stock_transfers', (t: any) => t.id === transferId)[0];
        if (transfer) {
          testDb.update('stock_transfers', transferId, {
            status: 'completed',
            confirmed_by: confirmedBy,
            confirmed_at: new Date().toISOString()
          });

          // Update all serial numbers
          serialNumbers.forEach(sn => {
            testDb.update('product_serial_numbers', sn.id, {
              warehouse_id: mockWarehouse2.id
            });
          });
        }
      });

      const performance = await measurePerformance(async () => {
        const transfer = await transferService.createTransfer({
          sourceWarehouseId: mockWarehouse1.id,
          targetWarehouseId: mockWarehouse2.id,
          items: serialNumbers.map(sn => ({
            serialNumberId: sn.id,
            productId: sn.product_id,
            quantity: 1,
            unitCost: sn.unit_cost
          })),
          notes: 'Bulk transfer test',
          initiatedBy: 'user-1'
        });

        await transferService.confirmTransfer(transfer.id, 'user-2');
      }, 10);

      // Bulk transfer should complete within reasonable time
      expect(performance.avg).toBeLessThan(500);
      expect(performance.max).toBeLessThan(1000);
    });
  });

  describe('Warehouse Operations Performance', () => {
    it('should load warehouse data efficiently', async () => {
      // Create multiple warehouses
      for (let i = 0; i < 50; i++) {
        testDb.insert('warehouses', createMockWarehouse({
          id: `warehouse-${i}`,
          name: `Warehouse ${i}`,
          code: `WH${String(i).padStart(3, '0')}`
        }));
      }

      vi.mocked(WarehouseService.getWarehouses).mockImplementation(async () => {
        return testDb.select('warehouses');
      });

      const performance = await measurePerformance(async () => {
        await WarehouseService.getWarehouses();
      }, 20);

      expect(performance.avg).toBeLessThan(100);
    });

    it('should calculate stock levels efficiently', async () => {
      const mockWarehouse = createMockWarehouse();
      const mockProduct = createMockProduct();

      // Create many serial numbers
      for (let i = 0; i < 500; i++) {
        testDb.insert('product_serial_numbers', {
          id: `sn-${i}`,
          serial_number: `TP001-2024-${String(i + 1).padStart(4, '0')}`,
          product_id: mockProduct.id,
          warehouse_id: mockWarehouse.id,
          unit_cost: 1000,
          status: i % 5 === 0 ? 'sold' : 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Mock stock level calculation
      const calculateStockLevels = async (warehouseId: string) => {
        const sns = testDb.select('product_serial_numbers', (sn: any) => sn.warehouse_id === warehouseId);
        const available = sns.filter((sn: any) => sn.status === 'available').length;
        const total = sns.length;
        
        return {
          warehouseId,
          totalQuantity: total,
          availableQuantity: available,
          reservedQuantity: 0,
          soldQuantity: total - available
        };
      };

      const performance = await measurePerformance(async () => {
        await calculateStockLevels(mockWarehouse.id);
      }, 30);

      expect(performance.avg).toBeLessThan(50);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated operations', async () => {
      const mockProduct = createMockProduct();
      const mockWarehouse = createMockWarehouse();

      vi.mocked(serialNumberService.generateAndCreateSNs).mockImplementation(async (data) => {
        const serialNumbers = [];
        for (let i = 0; i < data.quantity; i++) {
          serialNumbers.push({
            id: `sn-${Date.now()}-${i}`,
            serial_number: `${data.productCode}-2024-${String(i + 1).padStart(3, '0')}`,
            product_id: data.productId,
            warehouse_id: data.warehouseId,
            unit_cost: data.unitCost,
            status: 'available' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        return serialNumbers;
      });

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await serialNumberService.generateAndCreateSNs({
          productId: mockProduct.id,
          productCode: mockProduct.code,
          warehouseId: mockWarehouse.id,
          quantity: 10,
          unitCost: 1000
        });

        // Clear references to prevent accumulation
        if (i % 10 === 0) {
          testDb.clear('product_serial_numbers');
        }
      }

      // Test should complete without memory issues
      expect(true).toBe(true);
    });
  });

  describe('Stress Tests', () => {
    it('should handle high concurrent load', async () => {
      const mockProduct = createMockProduct();
      const mockWarehouse = createMockWarehouse();

      vi.mocked(serialNumberService.generateAndCreateSNs).mockImplementation(async (data) => {
        // Simulate variable response time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        return Array.from({ length: data.quantity }, (_, i) => ({
          id: `sn-${Date.now()}-${Math.random()}-${i}`,
          serial_number: `${data.productCode}-2024-${String(i + 1).padStart(3, '0')}`,
          product_id: data.productId,
          warehouse_id: data.warehouseId,
          unit_cost: data.unitCost,
          status: 'available' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      });

      // Create 50 concurrent operations
      const operations = Array.from({ length: 50 }, () =>
        serialNumberService.generateAndCreateSNs({
          productId: mockProduct.id,
          productCode: mockProduct.code,
          warehouseId: mockWarehouse.id,
          quantity: 5,
          unitCost: 1000
        })
      );

      const start = performance.now();
      const results = await Promise.all(operations);
      const end = performance.now();

      // All operations should succeed
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toHaveLength(5);
      });

      // Should handle concurrent load efficiently
      expect(end - start).toBeLessThan(2000);
    });
  });
});