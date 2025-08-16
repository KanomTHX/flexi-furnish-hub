import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AutoPurchaseOrderService } from '../services/auto-purchase-order.service';
import { StockAlert, AutoPurchaseOrder, SupplierProductMapping } from '../types/pos';
import { Supplier } from '../types/supplier';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock ErrorHandlerService
vi.mock('../services/error-handler.service', () => ({
  ErrorHandlerService: vi.fn(() => ({
    handleServiceError: vi.fn()
  }))
}));

// Mock POS errors
vi.mock('../errors/pos', () => ({
  POSIntegrationError: class POSIntegrationError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'POSIntegrationError';
    }
  },
  StockAlertProcessingError: class StockAlertProcessingError extends Error {
    constructor(message: string, public type: string) {
      super(message);
      this.name = 'StockAlertProcessingError';
    }
  }
}));

describe('AutoPurchaseOrderService', () => {
  let service: AutoPurchaseOrderService;
  let mockSupabaseFrom: any;

  beforeEach(async () => {
    const { supabase } = await import('../lib/supabase');
    mockSupabaseFrom = vi.mocked(supabase.from);
    service = new AutoPurchaseOrderService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createAutomaticPurchaseOrders', () => {
    it('should create purchase orders from stock alerts', async () => {
      const mockStockAlerts: StockAlert[] = [
        {
          id: 'alert1',
          productId: 'product1',
          productName: 'Test Product 1',
          productCode: 'TP001',
          currentStock: 5,
          minimumStock: 10,
          reorderPoint: 15,
          reorderQuantity: 50,
          preferredSupplierId: 'supplier1',
          urgencyLevel: 'high',
          category: 'Electronics',
          location: 'Warehouse A',
          averageDailySales: 2,
          daysOfStockRemaining: 2,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const mockSupplier = {
        id: 'supplier1',
        name: 'Test Supplier',
        contact_person: 'John Doe',
        email: 'john@supplier.com',
        phone: '123-456-7890'
      };

      const mockMapping = {
        supplier_id: 'supplier1',
        product_id: 'product1',
        unit_cost: 10,
        lead_time_days: 7,
        supplier_product_code: 'SUP001'
      };

      const mockSavedOrder = {
        id: 'order1',
        order_number: 'APO-123456',
        supplier_id: 'supplier1',
        subtotal: 500,
        tax_amount: 35,
        total_amount: 535,
        status: 'draft'
      };

      // Mock the chain of calls for supplier fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSupplier, error: null })
          })
        })
      });

      // Mock supplier product mapping fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockMapping, error: null })
              })
            })
          })
        })
      });

      // Mock approval rules fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              ascending: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      // Mock purchase order insert
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockSavedOrder, error: null })
          })
        })
      });

      // Mock purchase order items insert
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock stock alerts update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await service.createAutomaticPurchaseOrders(mockStockAlerts);

      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBeDefined();
      expect(result[0].supplierId).toBe('supplier1');
      expect(result[0].items).toHaveLength(1);
      expect(result[0].status).toBe('draft');
    });

    it('should handle errors gracefully', async () => {
      const mockStockAlerts: StockAlert[] = [
        {
          id: 'alert1',
          productId: 'product1',
          productName: 'Test Product 1',
          productCode: 'TP001',
          currentStock: 5,
          minimumStock: 10,
          reorderPoint: 15,
          reorderQuantity: 50,
          preferredSupplierId: 'supplier1',
          urgencyLevel: 'high',
          category: 'Electronics',
          location: 'Warehouse A',
          averageDailySales: 2,
          daysOfStockRemaining: 2,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock supplier fetch error
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Supplier not found' } 
            })
          })
        })
      });

      await expect(service.createAutomaticPurchaseOrders(mockStockAlerts))
        .rejects.toThrow('POSIntegrationError');
    });
  });

  describe('selectOptimalSupplier', () => {
    it('should select supplier with highest score', async () => {
      const mockMappings = [
        {
          supplier_id: 'supplier1',
          product_id: 'product1',
          unit_cost: 10,
          lead_time_days: 7,
          is_preferred: true,
          suppliers: {
            id: 'supplier1',
            name: 'Supplier 1',
            quality_rating: 4,
            delivery_rating: 5,
            cost_rating: 3
          }
        },
        {
          supplier_id: 'supplier2',
          product_id: 'product1',
          unit_cost: 8,
          lead_time_days: 10,
          is_preferred: false,
          suppliers: {
            id: 'supplier2',
            name: 'Supplier 2',
            quality_rating: 3,
            delivery_rating: 3,
            cost_rating: 5
          }
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockMappings, error: null })
            })
          })
        })
      });

      const result = await service.selectOptimalSupplier('product1');

      expect(result).toBeDefined();
      expect(result?.supplierId).toBe('supplier1'); // Should prefer the preferred supplier
    });

    it('should return null when no suppliers available', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      const result = await service.selectOptimalSupplier('product1');

      expect(result).toBeNull();
    });
  });

  describe('calculateReorderQuantity', () => {
    it('should calculate optimal reorder quantity', async () => {
      const params = {
        productId: 'product1',
        currentStock: 5,
        averageDailySales: 2,
        leadTimeDays: 7,
        safetyStockDays: 3,
        seasonalityFactor: 1.2
      };

      const result = await service.calculateReorderQuantity(params);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
      
      // Should account for lead time, safety stock, and review period
      const expectedMinimum = Math.ceil(params.averageDailySales * 7); // At least 1 week
      expect(result).toBeGreaterThanOrEqual(expectedMinimum);
    });

    it('should handle zero average daily sales', async () => {
      const params = {
        productId: 'product1',
        currentStock: 5,
        averageDailySales: 0,
        leadTimeDays: 7,
        safetyStockDays: 3
      };

      const result = await service.calculateReorderQuantity(params);

      expect(result).toBeGreaterThan(0); // Should still return a positive quantity
    });
  });

  describe('checkApprovalRequirement', () => {
    it('should require approval for high-value orders', async () => {
      const mockRules = [
        {
          id: 'rule1',
          condition: 'total_amount',
          operator: 'greater_than',
          value: 1000,
          approver_roles: ['manager'],
          is_active: true
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              ascending: vi.fn().mockResolvedValue({ data: mockRules, error: null })
            })
          })
        })
      });

      const purchaseOrder = {
        totalAmount: 1500,
        stockAlertIds: ['alert1']
      };

      const result = await service.checkApprovalRequirement(purchaseOrder);

      expect(result.requiresApproval).toBe(true);
      expect(result.requiredApprovers).toContain('manager');
    });

    it('should not require approval for low-value orders', async () => {
      const mockRules = [
        {
          id: 'rule1',
          condition: 'total_amount',
          operator: 'greater_than',
          value: 1000,
          approver_roles: ['manager'],
          is_active: true
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              ascending: vi.fn().mockResolvedValue({ data: mockRules, error: null })
            })
          })
        })
      });

      const purchaseOrder = {
        totalAmount: 500,
        stockAlertIds: ['alert1']
      };

      const result = await service.checkApprovalRequirement(purchaseOrder);

      expect(result.requiresApproval).toBe(false);
      expect(result.applicableRules).toHaveLength(0);
    });
  });

  describe('updatePurchaseOrderStatus', () => {
    it('should update order status and log workflow step', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'approved',
        approved_by: 'user1',
        approved_at: expect.any(String),
        approval_required: false
      };

      // Mock order update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
            })
          })
        })
      });

      // Mock workflow step logging
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock workflow status retrieval - order fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
          })
        })
      });

      // Mock workflow status retrieval - workflow steps fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              ascending: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      });

      const result = await service.updatePurchaseOrderStatus('order1', 'approved', 'user1');

      expect(result.currentStatus).toBe('approved');
      expect(result.orderId).toBe('order1');
    });

    it('should handle status update errors', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Order not found' } 
              })
            })
          })
        })
      });

      await expect(service.updatePurchaseOrderStatus('order1', 'approved', 'user1'))
        .rejects.toThrow('POSIntegrationError');
    });
  });

  describe('getPurchaseOrdersByStatus', () => {
    it('should retrieve orders by status with filters', async () => {
      const mockOrders = [
        {
          id: 'order1',
          order_number: 'APO-001',
          supplier_id: 'supplier1',
          status: 'pending_approval',
          total_amount: 1000,
          created_at: '2024-01-01T00:00:00Z',
          subtotal: 900,
          tax_amount: 100,
          expected_delivery_date: '2024-01-15',
          automation_reason: 'Low stock alert',
          trigger_type: 'low_stock',
          stock_alert_ids: ['alert1'],
          approval_required: true,
          suppliers: {
            id: 'supplier1',
            name: 'Test Supplier'
          },
          auto_purchase_order_items: []
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      ascending: vi.fn().mockResolvedValue({ data: mockOrders, error: null })
                    })
                  })
                })
              })
            })
          })
        })
      });

      const result = await service.getPurchaseOrdersByStatus('pending_approval', {
        supplierId: 'supplier1',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        approvalRequired: true
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order1');
      expect(result[0].status).toBe('pending_approval');
    });

    it('should handle retrieval errors', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ascending: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          })
        })
      });

      await expect(service.getPurchaseOrdersByStatus())
        .rejects.toThrow('POSIntegrationError');
    });
  });

  describe('getPurchaseOrderWorkflowStatus', () => {
    it('should return complete workflow status', async () => {
      const mockOrder = {
        id: 'order1',
        status: 'pending_approval',
        approval_required: true
      };

      const mockWorkflowSteps = [
        {
          step_name: 'created',
          status: 'completed',
          completed_at: '2024-01-01T00:00:00Z',
          completed_by: 'system'
        }
      ];

      // Mock order fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
          })
        })
      });

      // Mock workflow steps fetch
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              ascending: vi.fn().mockResolvedValue({ data: mockWorkflowSteps, error: null })
            })
          })
        })
      });

      const result = await service.getPurchaseOrderWorkflowStatus('order1');

      expect(result.orderId).toBe('order1');
      expect(result.currentStatus).toBe('pending_approval');
      expect(result.approvalRequired).toBe(true);
      expect(result.workflowSteps).toHaveLength(1);
    });
  });
});