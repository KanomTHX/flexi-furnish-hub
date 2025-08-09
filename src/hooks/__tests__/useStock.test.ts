import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStock } from '../useStock';
import { StockService, SerialNumberService } from '@/lib/warehouseStock';
import type { StockLevel, SerialNumber, StockMovement } from '@/types/warehouseStock';

// Mock the services
vi.mock('@/lib/warehouseStock', () => ({
  StockService: {
    getStockLevels: vi.fn(),
    getMovements: vi.fn(),
    logMovement: vi.fn()
  },
  SerialNumberService: {
    searchSerialNumbers: vi.fn(),
    updateSerialNumberStatus: vi.fn()
  }
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock data
const mockStockLevels: StockLevel[] = [
  {
    productId: 'prod1',
    productName: 'Test Product 1',
    productCode: 'TP001',
    warehouseId: 'wh1',
    warehouseName: 'Test Warehouse',
    warehouseCode: 'WH001',
    totalQuantity: 10,
    availableQuantity: 8,
    soldQuantity: 2,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 100,
    availableValue: 800
  },
  {
    productId: 'prod2',
    productName: 'Test Product 2',
    productCode: 'TP002',
    warehouseId: 'wh1',
    warehouseName: 'Test Warehouse',
    warehouseCode: 'WH001',
    totalQuantity: 3,
    availableQuantity: 3,
    soldQuantity: 0,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 200,
    availableValue: 600
  },
  {
    productId: 'prod3',
    productName: 'Test Product 3',
    productCode: 'TP003',
    warehouseId: 'wh1',
    warehouseName: 'Test Warehouse',
    warehouseCode: 'WH001',
    totalQuantity: 0,
    availableQuantity: 0,
    soldQuantity: 0,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    reservedQuantity: 0,
    averageCost: 150,
    availableValue: 0
  }
];

const mockSerialNumbers: SerialNumber[] = [
  {
    id: '1',
    serialNumber: 'SN001',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 100,
    status: 'available',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    serialNumber: 'SN002',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 100,
    status: 'sold',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

const mockMovements: StockMovement[] = [
  {
    id: '1',
    productId: 'prod1',
    warehouseId: 'wh1',
    movementType: 'receive',
    quantity: 10,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    productId: 'prod1',
    warehouseId: 'wh1',
    movementType: 'withdraw',
    quantity: -2,
    createdAt: new Date('2024-01-02')
  }
] as StockMovement[];

describe('useStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (StockService.getStockLevels as any).mockResolvedValue({
      data: mockStockLevels,
      total: mockStockLevels.length,
      page: 1,
      limit: 50
    });
    
    (SerialNumberService.searchSerialNumbers as any).mockResolvedValue({
      data: mockSerialNumbers,
      total: mockSerialNumbers.length,
      page: 1,
      limit: 50
    });
    
    (StockService.getMovements as any).mockResolvedValue({
      data: mockMovements,
      total: mockMovements.length,
      page: 1,
      limit: 50
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      expect(result.current.stockLevels).toEqual([]);
      expect(result.current.serialNumbers).toEqual([]);
      expect(result.current.movements).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should auto-fetch data when autoFetch is true', async () => {
      renderHook(() => useStock({ autoFetch: true }));

      await waitFor(() => {
        expect(StockService.getStockLevels).toHaveBeenCalled();
        expect(SerialNumberService.searchSerialNumbers).toHaveBeenCalled();
        expect(StockService.getMovements).toHaveBeenCalled();
      });
    });

    it('should not auto-fetch data when autoFetch is false', () => {
      renderHook(() => useStock({ autoFetch: false }));

      expect(StockService.getStockLevels).not.toHaveBeenCalled();
      expect(SerialNumberService.searchSerialNumbers).not.toHaveBeenCalled();
      expect(StockService.getMovements).not.toHaveBeenCalled();
    });
  });

  describe('data fetching', () => {
    it('should fetch stock levels successfully', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.stockLevels).toEqual(mockStockLevels);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch stock levels';
      (StockService.getStockLevels as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useStock({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.stockLevels).toEqual([]);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      (StockService.getStockLevels as any).mockReturnValue(promise);

      const { result } = renderHook(() => useStock({ autoFetch: false }));

      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({
          data: mockStockLevels,
          total: mockStockLevels.length,
          page: 1,
          limit: 50
        });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('filters', () => {
    it('should update filters correctly', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      act(() => {
        result.current.setFilters({ warehouseId: 'wh2', productId: 'prod2' });
      });

      expect(result.current.filters.warehouseId).toBe('wh2');
      expect(result.current.filters.productId).toBe('prod2');
    });

    it('should pass filters to service calls', async () => {
      const { result } = renderHook(() => useStock({ 
        warehouseId: 'wh1', 
        productId: 'prod1',
        autoFetch: false 
      }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(StockService.getStockLevels).toHaveBeenCalledWith({
        warehouseId: 'wh1',
        productId: 'prod1'
      });
    });
  });

  describe('stock operations', () => {
    it('should update stock successfully', async () => {
      (StockService.logMovement as any).mockResolvedValue('movement-id');
      (SerialNumberService.updateSerialNumberStatus as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useStock({ autoFetch: false }));

      const transaction = {
        type: 'withdraw' as const,
        warehouseId: 'wh1',
        items: [
          {
            productId: 'prod1',
            serialNumberId: 'sn1',
            quantity: 1,
            unitCost: 100
          }
        ],
        reference: 'REF001',
        notes: 'Test transaction',
        performedBy: 'user1'
      };

      let success: boolean = false;
      await act(async () => {
        success = await result.current.updateStock(transaction);
      });

      expect(success).toBe(true);
      expect(StockService.logMovement).toHaveBeenCalledWith(
        'prod1',
        'sn1',
        'wh1',
        'withdraw',
        1,
        100,
        'manual',
        undefined,
        'REF001',
        'Test transaction'
      );
      expect(SerialNumberService.updateSerialNumberStatus).toHaveBeenCalledWith(
        'sn1',
        'sold',
        undefined,
        'REF001',
        'Test transaction'
      );
    });

    it('should handle update stock errors', async () => {
      const errorMessage = 'Failed to log movement';
      (StockService.logMovement as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useStock({ autoFetch: false }));

      const transaction = {
        type: 'withdraw' as const,
        warehouseId: 'wh1',
        items: [
          {
            productId: 'prod1',
            quantity: 1
          }
        ],
        performedBy: 'user1'
      };

      let success: boolean = true;
      await act(async () => {
        success = await result.current.updateStock(transaction);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('search functionality', () => {
    it('should update search filters', () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      act(() => {
        result.current.searchStock('test search');
      });

      expect(result.current.filters.searchTerm).toBe('test search');
    });
  });

  describe('utility functions', () => {
    it('should get stock by product', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data
      await act(async () => {
        await result.current.refetch();
      });

      const stock = result.current.getStockByProduct('prod1', 'wh1');
      expect(stock).toEqual(mockStockLevels[0]);
    });

    it('should get serial numbers by product', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data
      await act(async () => {
        await result.current.refetch();
      });

      const serialNumbers = result.current.getSerialNumbersByProduct('prod1', 'wh1');
      expect(serialNumbers).toEqual(mockSerialNumbers);
    });

    it('should calculate stock from serial numbers', () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      const calculation = result.current.calculateStock(mockSerialNumbers);
      expect(calculation.totalQuantity).toBe(2);
      expect(calculation.availableQuantity).toBe(1);
      expect(calculation.soldQuantity).toBe(1);
    });

    it('should get stock status', () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      const status = result.current.getStockStatus(mockStockLevels[0]);
      expect(status.status).toBe('in_stock');
      expect(status.isLowStock).toBe(false);
      expect(status.isOutOfStock).toBe(false);
    });
  });

  describe('alerts', () => {
    it('should generate low stock alerts', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data
      await act(async () => {
        await result.current.refetch();
      });

      const alerts = result.current.getLowStockAlerts(5);
      expect(alerts).toHaveLength(1); // prod2 has 3 items, which is <= 5
      expect(alerts[0].type).toBe('low_stock');
      expect(alerts[0].productId).toBe('prod2');
    });

    it('should generate out of stock alerts', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data
      await act(async () => {
        await result.current.refetch();
      });

      const alerts = result.current.getOutOfStockAlerts();
      expect(alerts).toHaveLength(1); // prod3 has 0 items
      expect(alerts[0].type).toBe('out_of_stock');
      expect(alerts[0].productId).toBe('prod3');
    });

    it('should mark alerts as read', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data and generate alerts
      await act(async () => {
        await result.current.refetch();
      });

      // Get initial alerts
      const initialAlerts = result.current.alerts;
      expect(initialAlerts.some(alert => !alert.isRead)).toBe(true);

      // Mark first alert as read
      act(() => {
        result.current.markAlertAsRead(initialAlerts[0].id);
      });

      const updatedAlerts = result.current.alerts;
      const markedAlert = updatedAlerts.find(alert => alert.id === initialAlerts[0].id);
      expect(markedAlert?.isRead).toBe(true);
    });
  });

  describe('summary calculations', () => {
    it('should calculate summary correctly', async () => {
      const { result } = renderHook(() => useStock({ autoFetch: false }));

      // Set mock data
      await act(async () => {
        await result.current.refetch();
      });

      const summary = result.current.summary;
      expect(summary.totalProducts).toBe(3);
      expect(summary.totalQuantity).toBe(13); // 10 + 3 + 0
      expect(summary.totalValue).toBe(1400); // 800 + 600 + 0
      expect(summary.availableQuantity).toBe(11); // 8 + 3 + 0
      expect(summary.lowStockItems).toBe(1); // prod2 with 3 items
      expect(summary.outOfStockItems).toBe(1); // prod3 with 0 items
    });
  });

  describe('options handling', () => {
    it('should handle warehouseId and productId options', () => {
      const { result } = renderHook(() => useStock({
        warehouseId: 'wh1',
        productId: 'prod1',
        autoFetch: false
      }));

      expect(result.current.filters.warehouseId).toBe('wh1');
      expect(result.current.filters.productId).toBe('prod1');
    });

    it('should handle refresh interval', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useStock({
        autoFetch: false,
        refreshInterval: 1000
      }));

      // Manually trigger initial fetch
      await act(async () => {
        await result.current.refetch();
      });

      // Clear the initial calls
      vi.clearAllMocks();

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Check if the service was called again
      expect(StockService.getStockLevels).toHaveBeenCalled();

      vi.useRealTimers();
    }, 10000);
  });
});