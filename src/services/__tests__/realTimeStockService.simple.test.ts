import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase first
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED');
        return {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn(),
          unsubscribe: vi.fn(),
          state: 'joined'
        };
      }),
      unsubscribe: vi.fn(),
      state: 'joined'
    }),
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
  }
}));

import { RealTimeStockService } from '../realTimeStockService';
import type { StockTransaction } from '@/types/warehouseStock';

describe('RealTimeStockService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RealTimeStockService.cleanup();
  });

  afterEach(() => {
    RealTimeStockService.cleanup();
  });

  describe('basic functionality', () => {
    it('should create service instance', () => {
      expect(RealTimeStockService).toBeDefined();
    });

    it('should have subscribe method', () => {
      expect(typeof RealTimeStockService.subscribe).toBe('function');
    });

    it('should have unsubscribe method', () => {
      expect(typeof RealTimeStockService.unsubscribe).toBe('function');
    });

    it('should have cleanup method', () => {
      expect(typeof RealTimeStockService.cleanup).toBe('function');
    });

    it('should create a subscription', () => {
      const callback = vi.fn();
      const unsubscribe = RealTimeStockService.subscribe(
        'test-subscription',
        { warehouseId: 'warehouse-1' },
        callback
      );

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle multiple subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsubscribe1 = RealTimeStockService.subscribe('sub-1', {}, callback1);
      const unsubscribe2 = RealTimeStockService.subscribe('sub-2', {}, callback2);

      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
    });

    it('should update alert thresholds', () => {
      const newThresholds = { lowStock: 10, outOfStock: 0, overstock: 500 };
      
      RealTimeStockService.updateAlertThresholds(newThresholds);
      
      const currentThresholds = RealTimeStockService.getAlertThresholds();
      expect(currentThresholds).toEqual(newThresholds);
    });

    it('should get connection status', () => {
      RealTimeStockService.subscribe('test-sub', {}, vi.fn());
      
      const status = RealTimeStockService.getConnectionStatus();
      expect(typeof status).toBe('object');
    });

    it('should process stock transactions', async () => {
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

      // Should not throw
      await expect(RealTimeStockService.processStockTransaction(transaction)).resolves.toBeUndefined();
    });

    it('should cleanup subscriptions', () => {
      RealTimeStockService.subscribe('sub-1', {}, vi.fn());
      RealTimeStockService.subscribe('sub-2', {}, vi.fn());

      RealTimeStockService.cleanup();

      const status = RealTimeStockService.getConnectionStatus();
      expect(Object.keys(status)).toHaveLength(0);
    });
  });
});