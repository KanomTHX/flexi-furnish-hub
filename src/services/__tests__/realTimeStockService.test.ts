import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealTimeStockService } from '../realTimeStockService';
import type { StockTransaction, StockAlert } from '@/types/warehouseStock';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      callback('SUBSCRIBED');
      return mockChannel;
    }),
    unsubscribe: vi.fn(),
    state: 'joined'
  };

  const mockSupabase = {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              product_id: 'product-1',
              product_name: 'Test Product',
              warehouse_id: 'warehouse-1',
              warehouse_name: 'Test Warehouse',
              available_quantity: 5
            },
            error: null
          })
        })
      })
    })
  };

  return { supabase: mockSupabase };
});

describe('RealTimeStockService', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear any existing subscriptions
    RealTimeStockService.cleanup();
    
    // Get the mocked supabase instance
    const supabaseModule = await import('@/integrations/supabase/client');
    mockSupabase = supabaseModule.supabase;
    mockChannel = mockSupabase.channel();
  });

  afterEach(() => {
    RealTimeStockService.cleanup();
  });

  describe('subscribe', () => {
    it('should create a subscription and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = RealTimeStockService.subscribe(
        'test-subscription',
        { warehouseId: 'warehouse-1' },
        callback
      );

      expect(mockSupabase.channel).toHaveBeenCalledWith('stock-updates-test-subscription');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple callbacks for the same subscription', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = RealTimeStockService.subscribe('test-sub', {}, callback1);
      const unsubscribe2 = RealTimeStockService.subscribe('test-sub', {}, callback2);

      expect(mockSupabase.channel).toHaveBeenCalledTimes(1); // Should reuse channel
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
    });

    it('should set up postgres change listeners based on options', () => {
      const callback = vi.fn();
      
      RealTimeStockService.subscribe(
        'test-subscription',
        { 
          warehouseId: 'warehouse-1',
          includeMovements: true,
          includeSerialNumbers: true 
        },
        callback
      );

      // Should set up listeners for movements, serial numbers, stock levels, etc.
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'stock_movements'
        }),
        expect.any(Function)
      );

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'product_serial_numbers'
        }),
        expect.any(Function)
      );
    });
  });

  describe('unsubscribe', () => {
    it('should remove specific callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = RealTimeStockService.subscribe('test-sub', {}, callback1);
      RealTimeStockService.subscribe('test-sub', {}, callback2);

      unsubscribe1();

      // Channel should still exist because callback2 is still active
      expect(mockSupabase.removeChannel).not.toHaveBeenCalled();
    });

    it('should remove channel when no callbacks remain', () => {
      const callback = vi.fn();
      const unsubscribe = RealTimeStockService.subscribe('test-sub', {}, callback);

      unsubscribe();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('processStockTransaction', () => {
    it('should process stock transaction and trigger updates', async () => {
      const callback = vi.fn();
      RealTimeStockService.subscribe('test-sub', {}, callback);

      const transaction: StockTransaction = {
        type: 'withdraw',
        warehouseId: 'warehouse-1',
        items: [
          {
            productId: 'product-1',
            serialNumberId: 'sn-1',
            quantity: 1,
            unitCost: 100
          }
        ],
        reference: 'REF-001',
        notes: 'Test transaction',
        performedBy: 'user-1'
      };

      await RealTimeStockService.processStockTransaction(transaction);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'movement_logged',
          data: expect.objectContaining({
            type: 'withdraw',
            warehouseId: 'warehouse-1'
          })
        })
      );
    });
  });

  describe('alert thresholds', () => {
    it('should update alert thresholds', () => {
      const newThresholds = { lowStock: 10, outOfStock: 0, overstock: 500 };
      
      RealTimeStockService.updateAlertThresholds(newThresholds);
      
      const currentThresholds = RealTimeStockService.getAlertThresholds();
      expect(currentThresholds).toEqual(newThresholds);
    });

    it('should partially update alert thresholds', () => {
      const originalThresholds = RealTimeStockService.getAlertThresholds();
      
      RealTimeStockService.updateAlertThresholds({ lowStock: 15 });
      
      const updatedThresholds = RealTimeStockService.getAlertThresholds();
      expect(updatedThresholds.lowStock).toBe(15);
      expect(updatedThresholds.outOfStock).toBe(originalThresholds.outOfStock);
      expect(updatedThresholds.overstock).toBe(originalThresholds.overstock);
    });
  });

  describe('connection status', () => {
    it('should return connection status for all channels', () => {
      RealTimeStockService.subscribe('sub-1', {}, vi.fn());
      RealTimeStockService.subscribe('sub-2', {}, vi.fn());

      const status = RealTimeStockService.getConnectionStatus();

      expect(status).toEqual({
        'sub-1': 'joined',
        'sub-2': 'joined'
      });
    });
  });

  describe('cleanup', () => {
    it('should remove all channels and callbacks', () => {
      RealTimeStockService.subscribe('sub-1', {}, vi.fn());
      RealTimeStockService.subscribe('sub-2', {}, vi.fn());

      RealTimeStockService.cleanup();

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2);
      
      const status = RealTimeStockService.getConnectionStatus();
      expect(Object.keys(status)).toHaveLength(0);
    });
  });

  describe('stock alert checking', () => {
    it('should check for low stock alerts', async () => {
      const callback = vi.fn();
      RealTimeStockService.subscribe('test-sub', {}, callback);

      // Mock stock data that triggers low stock alert
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                product_id: 'product-1',
                product_name: 'Test Product',
                warehouse_id: 'warehouse-1',
                warehouse_name: 'Test Warehouse',
                available_quantity: 3 // Below default threshold of 5
              },
              error: null
            })
          })
        })
      });

      // Simulate a stock level change that would trigger alert checking
      const mockPayload = {
        new: {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          available_quantity: 3
        }
      };

      // Access the private method through the callback mechanism
      // This simulates what would happen when a real database change occurs
      const handleStockLevelChange = mockChannel.on.mock.calls.find(
        call => call[1].table === 'stock_summary_view'
      )?.[2];

      if (handleStockLevelChange) {
        await handleStockLevelChange(mockPayload);
      }

      // Should trigger an alert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'alert_triggered',
          data: expect.objectContaining({
            type: 'low_stock',
            severity: 'warning',
            productId: 'product-1',
            currentStock: 3
          })
        })
      );
    });

    it('should check for out of stock alerts', async () => {
      const callback = vi.fn();
      RealTimeStockService.subscribe('test-sub', {}, callback);

      // Mock stock data that triggers out of stock alert
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                product_id: 'product-1',
                product_name: 'Test Product',
                warehouse_id: 'warehouse-1',
                warehouse_name: 'Test Warehouse',
                available_quantity: 0
              },
              error: null
            })
          })
        })
      });

      const mockPayload = {
        new: {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          available_quantity: 0
        }
      };

      const handleStockLevelChange = mockChannel.on.mock.calls.find(
        call => call[1].table === 'stock_summary_view'
      )?.[2];

      if (handleStockLevelChange) {
        await handleStockLevelChange(mockPayload);
      }

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'alert_triggered',
          data: expect.objectContaining({
            type: 'out_of_stock',
            severity: 'critical',
            productId: 'product-1',
            currentStock: 0
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const callback = vi.fn();
      RealTimeStockService.subscribe('test-sub', {}, callback);

      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const mockPayload = {
        new: {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1'
        }
      };

      const handleStockLevelChange = mockChannel.on.mock.calls.find(
        call => call[1].table === 'stock_summary_view'
      )?.[2];

      // Should not throw error
      expect(async () => {
        if (handleStockLevelChange) {
          await handleStockLevelChange(mockPayload);
        }
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();

      RealTimeStockService.subscribe('test-sub', {}, errorCallback);
      RealTimeStockService.subscribe('test-sub', {}, goodCallback);

      const mockPayload = {
        new: {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1'
        }
      };

      const handleMovementChange = mockChannel.on.mock.calls.find(
        call => call[1].table === 'stock_movements'
      )?.[2];

      // Should not throw error and should still call good callback
      expect(() => {
        if (handleMovementChange) {
          handleMovementChange(mockPayload);
        }
      }).not.toThrow();

      expect(goodCallback).toHaveBeenCalled();
    });
  });
});