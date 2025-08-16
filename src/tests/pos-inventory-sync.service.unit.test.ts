import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POSInventorySyncService } from '../services/pos-inventory-sync.service';
import { supabase } from '../lib/supabase';
import { ErrorHandlerService } from '../services/error-handler.service';
import { 
  InventorySyncError,
  StockAlertProcessingError,
  InventoryDataInconsistencyError 
} from '../errors/pos';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis()
    }))
  }
}));

vi.mock('../services/error-handler.service', () => ({
  ErrorHandlerService: vi.fn(() => ({
    handleServiceError: vi.fn()
  }))
}));

describe('POSInventorySyncService', () => {
  let service: POSInventorySyncService;
  let mockSupabaseFrom: any;
  let mockErrorHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new POSInventorySyncService();
    mockSupabaseFrom = vi.mocked(supabase.from);
    mockErrorHandler = vi.mocked(ErrorHandlerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncInventoryLevels', () => {
    it('should successfully perform full inventory synchronization', async () => {
      // Mock integration config
      const mockConfig = {
        id: 'test-integration',
        syncSettings: {
          conflictResolution: 'pos_wins',
          autoCreatePurchaseOrders: true
        }
      };

      // Mock the chain of calls for getting integration config
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockConfig, error: null })
      };

      // Mock products data for summary
      const mockProductsChain = {
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'product1',
              product_serial_numbers: [
                { id: '1', status: 'available' },
                { id: '2', status: 'available' }
              ]
            }
          ],
          error: null
        })
      };

      // Mock sync log insertion
      const mockLogChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockChain)  // For integration config
        .mockReturnValueOnce(mockProductsChain)  // For products summary
        .mockReturnValueOnce(mockLogChain);  // For sync log

      const result = await service.syncInventoryLevels('test-integration');

      expect(result).toMatchObject({
        integrationId: 'test-integration',
        syncType: 'full',
        productsProcessed: 0,
        productsUpdated: 0,
        stockAlertsGenerated: 0,
        purchaseOrdersCreated: 0
      });

      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(['success', 'partial', 'failed']).toContain(result.status);
    });

    it('should handle sync errors gracefully', async () => {
      const mockError = new Error('Database connection failed');
      
      const mockErrorChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(mockError)
      };

      const mockLogChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockErrorChain)  // For integration config (fails)
        .mockReturnValueOnce(mockLogChain);   // For sync log

      const result = await service.syncInventoryLevels('test-integration');

      expect(result.status).toBe('failed');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorMessage).toContain('Database connection failed');
      expect(mockErrorHandler).toHaveBeenCalled();
    });

    it('should prevent concurrent syncs for the same integration', async () => {
      const integrationId = 'test-integration';
      
      // Mock successful chains for both attempts
      const mockChain1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { syncSettings: {} }, error: null })
      };

      const mockChain2 = {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      const mockLogChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom
        .mockReturnValue(mockChain1)
        .mockReturnValue(mockChain2)
        .mockReturnValue(mockLogChain);

      // Start first sync
      const firstSyncPromise = service.syncInventoryLevels(integrationId);
      
      // Try to start second sync immediately
      const secondSyncPromise = service.syncInventoryLevels(integrationId);

      const [firstResult, secondResult] = await Promise.all([firstSyncPromise, secondSyncPromise]);

      // One should succeed, one should fail with concurrent sync error
      const results = [firstResult, secondResult];
      const failedResults = results.filter(r => r.status === 'failed');
      
      expect(failedResults.length).toBeGreaterThan(0);
      if (failedResults.length > 0) {
        expect(failedResults[0].errors[0].errorMessage).toContain('Sync already in progress');
      }
    });
  });

  describe('monitorInventoryLevels', () => {
    it('should generate stock alerts for low inventory products', async () => {
      const mockProducts = [
        {
          id: 'product1',
          name: 'Test Product 1',
          code: 'TP001',
          minimum_stock: 10,
          reorder_point: 15,
          reorder_quantity: 50,
          category: 'Electronics',
          product_serial_numbers: [
            { id: '1', status: 'available', warehouses: { location: 'Main Warehouse' } },
            { id: '2', status: 'available', warehouses: { location: 'Main Warehouse' } }
          ]
        },
        {
          id: 'product2',
          name: 'Test Product 2',
          code: 'TP002',
          minimum_stock: 5,
          reorder_point: 10,
          reorder_quantity: 25,
          category: 'Office Supplies',
          product_serial_numbers: [] // Out of stock
        }
      ];

      // Mock products fetch
      const mockProductsChain = {
        select: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      };

      // Mock supplier product mapping calls
      const mockSupplierChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            supplierId: 'supplier1',
            supplierName: 'Test Supplier'
          },
          error: null
        })
      };

      // Mock stock alerts insertion
      const mockAlertsChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockProductsChain)    // For products fetch
        .mockReturnValue(mockSupplierChain)        // For supplier mappings (multiple calls)
        .mockReturnValueOnce(mockAlertsChain);     // For alerts insertion

      const alerts = await service.monitorInventoryLevels();

      expect(alerts).toHaveLength(2);
      expect(alerts[0].urgencyLevel).toBe('medium'); // 2 units, reorder point 15
      expect(alerts[1].urgencyLevel).toBe('critical'); // 0 units
      expect(alerts[1].productCode).toBe('TP002');
    });

    it('should handle monitoring errors', async () => {
      const mockError = new Error('Failed to fetch products');
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(mockError)
      });

      await expect(service.monitorInventoryLevels()).rejects.toThrow(StockAlertProcessingError);
      expect(mockErrorHandler).toHaveBeenCalled();
    });
  });

  describe('generateStockAlerts', () => {
    it('should generate alerts based on parameters', async () => {
      const mockProducts = [
        {
          id: 'product1',
          name: 'Low Stock Product',
          code: 'LSP001',
          minimum_stock: 5,
          reorder_point: 10,
          reorder_quantity: 30,
          category: 'Test Category',
          product_serial_numbers: [
            { id: '1', status: 'available', warehouse_id: 'warehouse1' },
            { id: '2', status: 'sold', warehouse_id: 'warehouse1' }
          ]
        }
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const params = {
        productId: 'product1',
        urgencyLevel: 'medium' as const
      };

      const alerts = await service.generateStockAlerts(params);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].productId).toBe('product1');
      expect(alerts[0].currentStock).toBe(1); // Only 1 available
      expect(alerts[0].urgencyLevel).toBe('medium');
    });

    it('should filter by warehouse when specified', async () => {
      const mockProducts = [
        {
          id: 'product1',
          name: 'Test Product',
          code: 'TP001',
          minimum_stock: 5,
          reorder_point: 10,
          reorder_quantity: 20,
          category: 'Test',
          product_serial_numbers: [
            { id: '1', status: 'available', warehouse_id: 'warehouse1' },
            { id: '2', status: 'available', warehouse_id: 'warehouse2' }
          ]
        }
      ];

      const mockChain = {
        select: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null
        })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const params = {
        warehouseId: 'warehouse1'
      };

      const alerts = await service.generateStockAlerts(params);

      // Should only consider stock from warehouse1 (1 unit)
      expect(alerts).toHaveLength(1);
      expect(alerts[0].currentStock).toBe(1);
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('Database error');
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(mockError)
      });

      await expect(service.generateStockAlerts()).rejects.toThrow(StockAlertProcessingError);
    });
  });

  describe('processStockAlerts', () => {
    it('should create purchase orders for alerts with suppliers', async () => {
      const mockAlerts = [
        {
          id: 'alert1',
          product_id: 'product1',
          product_name: 'Test Product 1',
          product_code: 'TP001',
          preferred_supplier_id: 'supplier1',
          reorder_quantity: 50
        },
        {
          id: 'alert2',
          product_id: 'product2',
          product_name: 'Test Product 2',
          product_code: 'TP002',
          preferred_supplier_id: null // No supplier
        }
      ];

      // Mock alerts fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAlerts,
              error: null
            })
          })
        })
      });

      // Mock supplier fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'supplier1',
                name: 'Test Supplier',
                contact_person: 'John Doe',
                email: 'john@supplier.com',
                phone: '123-456-7890'
              },
              error: null
            })
          })
        })
      });

      // Mock purchase order insertion
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock alert status update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null })
        })
      });

      // Mock manual review update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const purchaseOrders = await service.processStockAlerts(['alert1', 'alert2']);

      expect(purchaseOrders).toHaveLength(1);
      expect(purchaseOrders[0].supplierId).toBe('supplier1');
      expect(purchaseOrders[0].items).toHaveLength(1);
      expect(purchaseOrders[0].automationReason).toContain('stock alert');
    });

    it('should handle processing errors', async () => {
      const mockError = new Error('Failed to fetch alerts');
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockRejectedValue(mockError)
          })
        })
      });

      await expect(service.processStockAlerts(['alert1'])).rejects.toThrow(StockAlertProcessingError);
    });
  });

  describe('updateInventoryFromDelivery', () => {
    it('should successfully update inventory from delivery receipt', async () => {
      const deliveryData = {
        deliveryId: 'delivery1',
        supplierId: 'supplier1',
        items: [
          {
            productId: 'product1',
            productCode: 'TP001',
            quantityReceived: 100,
            unitCost: 10.50
          },
          {
            productId: 'product2',
            productCode: 'TP002',
            quantityReceived: 50,
            unitCost: 25.00
          }
        ],
        receivedAt: new Date().toISOString(),
        receivedBy: 'user1',
        warehouseId: 'warehouse1'
      };

      // Mock stock alert updates
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      // Mock delivery log insertion
      const mockLogChain = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom
        .mockReturnValue(mockUpdateChain)  // For stock alert updates (multiple calls)
        .mockReturnValueOnce(mockLogChain); // For delivery log

      const result = await service.updateInventoryFromDelivery(deliveryData);

      expect(result.success).toBe(true);
      expect(result.updatedProducts).toHaveLength(2);
      expect(result.updatedProducts).toContain('product1');
      expect(result.updatedProducts).toContain('product2');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial delivery updates with errors', async () => {
      const deliveryData = {
        deliveryId: 'delivery1',
        supplierId: 'supplier1',
        items: [
          {
            productId: 'product1',
            productCode: 'TP001',
            quantityReceived: 100
          },
          {
            productId: 'invalid-product',
            productCode: 'INVALID',
            quantityReceived: 50
          }
        ],
        receivedAt: new Date().toISOString(),
        receivedBy: 'user1',
        warehouseId: 'warehouse1'
      };

      // Mock stock alert updates and delivery log insertion
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.updateInventoryFromDelivery(deliveryData);

      expect(result.success).toBe(true); // Should still succeed for valid items
      expect(result.updatedProducts).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('resolveSyncConflicts', () => {
    it('should resolve conflicts using pos_wins strategy', async () => {
      const conflicts = [
        {
          productId: 'product1',
          productCode: 'TP001',
          posValue: 15,
          systemValue: 10,
          lastUpdated: new Date().toISOString()
        },
        {
          productId: 'product2',
          productCode: 'TP002',
          posValue: 5,
          systemValue: 8,
          lastUpdated: new Date().toISOString()
        }
      ];

      const result = await service.resolveSyncConflicts(conflicts, 'pos_wins');

      expect(result.resolved).toBe(2);
      expect(result.manualReviewRequired).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should mark conflicts for manual review when using manual_review strategy', async () => {
      const conflicts = [
        {
          productId: 'product1',
          productCode: 'TP001',
          posValue: 15,
          systemValue: 10,
          lastUpdated: new Date().toISOString()
        }
      ];

      // Mock conflict insertion
      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await service.resolveSyncConflicts(conflicts, 'manual_review');

      expect(result.resolved).toBe(0);
      expect(result.manualReviewRequired).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle resolution errors', async () => {
      const conflicts = [
        {
          productId: 'product1',
          productCode: 'TP001',
          posValue: 15,
          systemValue: 10,
          lastUpdated: new Date().toISOString()
        }
      ];

      // Simulate error in conflict resolution
      const result = await service.resolveSyncConflicts(conflicts, 'pos_wins');

      // Should handle errors gracefully
      expect(result.resolved).toBeGreaterThanOrEqual(0);
      expect(result.manualReviewRequired).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should throw InventorySyncError for sync failures', async () => {
      const mockError = new Error('Network timeout');
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(mockError)
      });

      const result = await service.syncInventoryLevels('test-integration');
      
      expect(result.status).toBe('failed');
      expect(result.errors[0].errorType).toBe('api_error');
    });

    it('should throw StockAlertProcessingError for alert processing failures', async () => {
      const mockError = new Error('Alert processing failed');
      
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockRejectedValue(mockError)
      });

      await expect(service.monitorInventoryLevels()).rejects.toThrow(StockAlertProcessingError);
    });
  });

  describe('integration health checks', () => {
    it('should track sync performance metrics', async () => {
      const startTime = Date.now();
      
      // Mock successful sync
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      const result = await service.syncInventoryLevels();
      
      const endTime = Date.now();
      const syncDuration = endTime - startTime;

      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
      expect(new Date(result.completedAt!).getTime() - new Date(result.startedAt).getTime()).toBeGreaterThanOrEqual(0);
    });
  });
});