import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealTimeStock } from '../useRealTimeStock';
import { RealTimeStockService } from '@/services/realTimeStockService';
import type { StockUpdateEvent, StockAlert } from '@/types/warehouseStock';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock the RealTimeStockService
vi.mock('@/services/realTimeStockService', () => ({
  RealTimeStockService: {
    subscribe: vi.fn(),
    getConnectionStatus: vi.fn(),
    cleanup: vi.fn()
  }
}));

const mockRealTimeStockService = RealTimeStockService as any;

describe('useRealTimeStock', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    mockRealTimeStockService.subscribe.mockReturnValue(mockUnsubscribe);
    mockRealTimeStockService.getConnectionStatus.mockReturnValue({
      'test-subscription': 'joined'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.recentUpdates).toEqual([]);
      expect(result.current.activeAlerts).toEqual([]);
      expect(result.current.updateCount).toBe(0);
      expect(result.current.lastUpdateTime).toBeNull();
    });

    it('should connect automatically when enabled', () => {
      renderHook(() => 
        useRealTimeStock('test-subscription', { enabled: true })
      );

      expect(mockRealTimeStockService.subscribe).toHaveBeenCalledWith(
        'test-subscription',
        expect.objectContaining({ enabled: true }),
        expect.any(Function)
      );
    });

    it('should not connect when disabled', () => {
      renderHook(() => 
        useRealTimeStock('test-subscription', { enabled: false })
      );

      expect(mockRealTimeStockService.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should connect when connect is called', () => {
      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription', { enabled: false })
      );

      act(() => {
        result.current.connect();
      });

      expect(mockRealTimeStockService.subscribe).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should disconnect when disconnect is called', () => {
      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription', { enabled: true })
      );

      act(() => {
        result.current.disconnect();
      });

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('disconnected');
    });

    it('should handle connection errors', () => {
      mockRealTimeStockService.subscribe.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription', { showNotifications: true })
      );

      act(() => {
        result.current.connect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('error');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Connection Error',
          variant: 'destructive'
        })
      );
    });
  });

  describe('stock update handling', () => {
    it('should handle stock level changes', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const stockUpdateEvent: StockUpdateEvent = {
        type: 'stock_level_changed',
        data: { productId: 'product-1', warehouseId: 'warehouse-1' },
        timestamp: new Date(),
        productId: 'product-1',
        warehouseId: 'warehouse-1'
      };

      act(() => {
        updateCallback!(stockUpdateEvent);
      });

      expect(result.current.recentUpdates).toHaveLength(1);
      expect(result.current.recentUpdates[0]).toEqual(stockUpdateEvent);
      expect(result.current.updateCount).toBe(1);
      expect(result.current.lastUpdateTime).toBeInstanceOf(Date);
    });

    it('should handle movement logged events', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const movementEvent: StockUpdateEvent = {
        type: 'movement_logged',
        data: { type: 'receive', quantity: 10 },
        timestamp: new Date()
      };

      act(() => {
        updateCallback!(movementEvent);
      });

      expect(result.current.recentUpdates).toContainEqual(movementEvent);
      expect(result.current.updateCount).toBe(1);
    });

    it('should handle serial number updates', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const serialNumberEvent: StockUpdateEvent = {
        type: 'serial_number_updated',
        data: { serialNumber: 'SN001', status: 'sold' },
        timestamp: new Date()
      };

      act(() => {
        updateCallback!(serialNumberEvent);
      });

      expect(result.current.recentUpdates).toContainEqual(serialNumberEvent);
    });

    it('should limit recent updates to 50 items', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      // Add 60 updates
      act(() => {
        for (let i = 0; i < 60; i++) {
          updateCallback!({
            type: 'stock_level_changed',
            data: { index: i },
            timestamp: new Date()
          });
        }
      });

      expect(result.current.recentUpdates).toHaveLength(50);
      expect(result.current.updateCount).toBe(60);
    });
  });

  describe('alert handling', () => {
    it('should handle alert triggered events', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const alert: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        threshold: 5,
        message: 'Low stock alert',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      const alertEvent: StockUpdateEvent = {
        type: 'alert_triggered',
        data: alert,
        timestamp: new Date(),
        productId: 'product-1',
        warehouseId: 'warehouse-1'
      };

      act(() => {
        updateCallback!(alertEvent);
      });

      expect(result.current.activeAlerts).toContainEqual(alert);
      expect(result.current.recentUpdates).toContainEqual(alertEvent);
    });

    it('should show critical alert notifications', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      renderHook(() => 
        useRealTimeStock('test-subscription', { showNotifications: true })
      );

      const criticalAlert: StockAlert = {
        id: 'alert-1',
        type: 'out_of_stock',
        severity: 'critical',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 0,
        message: 'Out of stock',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      act(() => {
        updateCallback!({
          type: 'alert_triggered',
          data: criticalAlert,
          timestamp: new Date()
        });
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Critical Stock Alert',
          variant: 'destructive'
        })
      );
    });

    it('should replace existing alerts for same product/warehouse', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const alert1: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        message: 'Low stock',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      const alert2: StockAlert = {
        id: 'alert-2',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 2,
        message: 'Low stock updated',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      act(() => {
        updateCallback!({
          type: 'alert_triggered',
          data: alert1,
          timestamp: new Date()
        });
      });

      expect(result.current.activeAlerts).toHaveLength(1);

      act(() => {
        updateCallback!({
          type: 'alert_triggered',
          data: alert2,
          timestamp: new Date()
        });
      });

      expect(result.current.activeAlerts).toHaveLength(1);
      expect(result.current.activeAlerts[0].id).toBe('alert-2');
    });

    it('should mark alerts as read', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const alert: StockAlert = {
        id: 'alert-1',
        type: 'low_stock',
        severity: 'warning',
        productId: 'product-1',
        productName: 'Test Product',
        warehouseId: 'warehouse-1',
        warehouseName: 'Test Warehouse',
        currentStock: 3,
        message: 'Low stock',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      };

      act(() => {
        updateCallback!({
          type: 'alert_triggered',
          data: alert,
          timestamp: new Date()
        });
      });

      expect(result.current.activeAlerts[0].isRead).toBe(false);

      act(() => {
        result.current.markAlertAsRead('alert-1');
      });

      expect(result.current.activeAlerts[0].isRead).toBe(true);
    });
  });

  describe('event handlers', () => {
    it('should register and call stock level change handlers', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const handler = vi.fn();
      let unregister: () => void;

      act(() => {
        unregister = result.current.onStockLevelChange(handler);
      });

      const stockEvent: StockUpdateEvent = {
        type: 'stock_level_changed',
        data: { productId: 'product-1' },
        timestamp: new Date()
      };

      act(() => {
        updateCallback!(stockEvent);
      });

      expect(handler).toHaveBeenCalledWith({ productId: 'product-1' });

      // Test unregistering
      act(() => {
        unregister!();
      });

      act(() => {
        updateCallback!(stockEvent);
      });

      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle errors in event handlers gracefully', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      act(() => {
        result.current.onStockLevelChange(errorHandler);
        result.current.onStockLevelChange(goodHandler);
      });

      const stockEvent: StockUpdateEvent = {
        type: 'stock_level_changed',
        data: { productId: 'product-1' },
        timestamp: new Date()
      };

      // Should not throw and should still call good handler
      expect(() => {
        act(() => {
          updateCallback!(stockEvent);
        });
      }).not.toThrow();

      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should clear updates', () => {
      let updateCallback: (event: StockUpdateEvent) => void;
      
      mockRealTimeStockService.subscribe.mockImplementation((id, options, callback) => {
        updateCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      // Add some updates
      act(() => {
        updateCallback!({
          type: 'stock_level_changed',
          data: {},
          timestamp: new Date()
        });
      });

      expect(result.current.recentUpdates).toHaveLength(1);
      expect(result.current.updateCount).toBe(1);

      act(() => {
        result.current.clearUpdates();
      });

      expect(result.current.recentUpdates).toHaveLength(0);
      expect(result.current.updateCount).toBe(0);
      expect(result.current.lastUpdateTime).toBeNull();
    });
  });

  describe('connection status monitoring', () => {
    it('should monitor connection status', async () => {
      const { result } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      // Initially disconnected
      expect(result.current.connectionStatus).toBe('disconnected');

      // Mock status change
      mockRealTimeStockService.getConnectionStatus.mockReturnValue({
        'test-subscription': 'joined'
      });

      // Wait for status check interval
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('joined');
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 6000 });
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => 
        useRealTimeStock('test-subscription')
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});