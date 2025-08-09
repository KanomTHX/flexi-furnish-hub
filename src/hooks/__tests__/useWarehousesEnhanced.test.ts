import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWarehouses } from '../useWarehousesEnhanced';
import { WarehouseService } from '@/lib/warehouseService';
import type { Warehouse } from '@/lib/warehouseService';

// Mock the warehouse service
vi.mock('@/lib/warehouseService', () => ({
  WarehouseService: {
    getWarehouses: vi.fn(),
    getWarehouseSummary: vi.fn(),
    createWarehouse: vi.fn(),
    updateWarehouse: vi.fn(),
    deleteWarehouse: vi.fn()
  }
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock data
const mockWarehouses: Warehouse[] = [
  {
    id: 'wh1',
    name: 'Main Warehouse',
    code: 'WH001',
    type: 'main',
    status: 'active',
    branch_id: 'branch1',
    address: '123 Main St',
    manager_id: 'manager1',
    capacity: 1000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'wh2',
    name: 'Branch Warehouse',
    code: 'WH002',
    type: 'branch',
    status: 'active',
    branch_id: 'branch2',
    address: '456 Branch Ave',
    manager_id: 'manager2',
    capacity: 500,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'wh3',
    name: 'Inactive Warehouse',
    code: 'WH003',
    type: 'branch',
    status: 'inactive',
    branch_id: 'branch1',
    address: '789 Old St',
    manager_id: 'manager3',
    capacity: 300,
    is_active: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

const mockWarehouseStats = {
  totalProducts: 50,
  totalQuantity: 500,
  totalValue: 50000,
  availableQuantity: 450,
  lowStockItems: 5,
  outOfStockItems: 2,
  utilizationPercentage: 75
};

describe('useWarehouses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (WarehouseService.getWarehouses as any).mockResolvedValue(mockWarehouses);
    (WarehouseService.getWarehouseSummary as any).mockResolvedValue(mockWarehouseStats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      expect(result.current.warehouses).toEqual([]);
      expect(result.current.allWarehouses).toEqual([]);
      expect(result.current.activeWarehouses).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should auto-fetch data when autoFetch is true', async () => {
      renderHook(() => useWarehouses({ autoFetch: true }));

      await waitFor(() => {
        expect(WarehouseService.getWarehouses).toHaveBeenCalled();
      });
    });

    it('should not auto-fetch data when autoFetch is false', () => {
      renderHook(() => useWarehouses({ autoFetch: false }));

      expect(WarehouseService.getWarehouses).not.toHaveBeenCalled();
    });
  });

  describe('data fetching', () => {
    it('should fetch warehouses successfully', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.allWarehouses).toEqual(mockWarehouses);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should fetch warehouse stats for each warehouse', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(WarehouseService.getWarehouseSummary).toHaveBeenCalledTimes(mockWarehouses.length);
      expect(result.current.warehouses[0].stats).toEqual(mockWarehouseStats);
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to fetch warehouses';
      (WarehouseService.getWarehouses as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.allWarehouses).toEqual([]);
    });

    it('should handle stats fetch errors gracefully', async () => {
      (WarehouseService.getWarehouseSummary as any).mockRejectedValue(new Error('Stats error'));

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      // Should still have warehouses, but with default stats
      expect(result.current.allWarehouses).toEqual(mockWarehouses);
      expect(result.current.warehouses[0].stats.totalProducts).toBe(0);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      (WarehouseService.getWarehouses as any).mockReturnValue(promise);

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(mockWarehouses);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('filtering options', () => {
    it('should filter by branch when branchId is provided', async () => {
      const { result } = renderHook(() => useWarehouses({ 
        branchId: 'branch1',
        autoFetch: false 
      }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(WarehouseService.getWarehouses).toHaveBeenCalledWith({
        branchId: 'branch1',
        status: 'active'
      });
    });

    it('should include inactive warehouses when includeInactive is true', async () => {
      const { result } = renderHook(() => useWarehouses({ 
        includeInactive: true,
        autoFetch: false 
      }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(WarehouseService.getWarehouses).toHaveBeenCalledWith({});
    });

    it('should exclude inactive warehouses by default', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      await act(async () => {
        await result.current.refetch();
      });

      expect(WarehouseService.getWarehouses).toHaveBeenCalledWith({
        status: 'active'
      });
    });
  });

  describe('warehouse operations', () => {
    it('should create warehouse successfully', async () => {
      const newWarehouse = {
        ...mockWarehouses[0],
        id: 'wh4',
        name: 'New Warehouse',
        code: 'WH004'
      };
      (WarehouseService.createWarehouse as any).mockResolvedValue(newWarehouse);

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      const warehouseData = {
        name: 'New Warehouse',
        code: 'WH004',
        type: 'branch' as const,
        branch_id: 'branch1'
      };

      let createdWarehouse: any = null;
      await act(async () => {
        createdWarehouse = await result.current.createWarehouse(warehouseData);
      });

      expect(createdWarehouse).toEqual(newWarehouse);
      expect(WarehouseService.createWarehouse).toHaveBeenCalledWith(warehouseData);
    });

    it('should handle create warehouse errors', async () => {
      const errorMessage = 'Failed to create warehouse';
      (WarehouseService.createWarehouse as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      const warehouseData = {
        name: 'New Warehouse',
        code: 'WH004',
        type: 'branch' as const
      };

      let createdWarehouse: any = undefined;
      await act(async () => {
        createdWarehouse = await result.current.createWarehouse(warehouseData);
      });

      expect(createdWarehouse).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should update warehouse successfully', async () => {
      const updatedWarehouse = {
        ...mockWarehouses[0],
        name: 'Updated Warehouse'
      };
      (WarehouseService.updateWarehouse as any).mockResolvedValue(updatedWarehouse);

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      // First fetch warehouses
      await act(async () => {
        await result.current.refetch();
      });

      const updates = { name: 'Updated Warehouse' };
      let updatedResult: any = null;
      await act(async () => {
        updatedResult = await result.current.updateWarehouse('wh1', updates);
      });

      expect(updatedResult).toEqual(updatedWarehouse);
      expect(WarehouseService.updateWarehouse).toHaveBeenCalledWith('wh1', updates);
    });

    it('should delete warehouse successfully', async () => {
      (WarehouseService.deleteWarehouse as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      // First fetch warehouses
      await act(async () => {
        await result.current.refetch();
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteWarehouse('wh1');
      });

      expect(deleteResult).toBe(true);
      expect(WarehouseService.deleteWarehouse).toHaveBeenCalledWith('wh1');
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      // Setup warehouses data for utility function tests
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      await act(async () => {
        await result.current.refetch();
      });
    });

    it('should get warehouse by id', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const warehouse = result.current.getWarehouseById('wh1');
      expect(warehouse).toEqual(mockWarehouses[0]);
    });

    it('should get warehouse by code', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const warehouse = result.current.getWarehouseByCode('WH001');
      expect(warehouse).toEqual(mockWarehouses[0]);
    });

    it('should get warehouses by branch', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const warehouses = result.current.getWarehousesByBranch('branch1');
      expect(warehouses).toHaveLength(2); // wh1 and wh3
      expect(warehouses.map(w => w.id)).toEqual(['wh1', 'wh3']);
    });

    it('should get warehouse stats', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));

      const stats = await result.current.getWarehouseStats('wh1');
      expect(stats).toEqual(mockWarehouseStats);
      expect(WarehouseService.getWarehouseSummary).toHaveBeenCalledWith('wh1');
    });
  });

  describe('search and filtering', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      await act(async () => {
        await result.current.refetch();
      });
    });

    it('should search warehouses by name', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const searchResults = result.current.searchWarehouses('Main');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Main Warehouse');
    });

    it('should search warehouses by code', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const searchResults = result.current.searchWarehouses('WH002');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].code).toBe('WH002');
    });

    it('should filter warehouses by status', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const filterResults = result.current.filterWarehouses({ status: 'active' });
      expect(filterResults).toHaveLength(2);
      expect(filterResults.every(w => w.status === 'active')).toBe(true);
    });

    it('should filter warehouses by type', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const filterResults = result.current.filterWarehouses({ type: 'branch' });
      expect(filterResults).toHaveLength(2);
      expect(filterResults.every(w => w.type === 'branch')).toBe(true);
    });
  });

  describe('validation functions', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      await act(async () => {
        await result.current.refetch();
      });
    });

    it('should validate warehouse code uniqueness', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.validateWarehouseCode('WH001')).toBe(false); // Already exists
      expect(result.current.validateWarehouseCode('WH999')).toBe(true); // New code
      expect(result.current.validateWarehouseCode('WH001', 'wh1')).toBe(true); // Same warehouse
    });

    it('should validate warehouse name uniqueness', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.validateWarehouseName('Main Warehouse')).toBe(false); // Already exists
      expect(result.current.validateWarehouseName('New Warehouse')).toBe(true); // New name
      expect(result.current.validateWarehouseName('Main Warehouse', 'wh1')).toBe(true); // Same warehouse
    });
  });

  describe('computed values', () => {
    it('should calculate active warehouses correctly', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.activeWarehouses).toHaveLength(2);
      expect(result.current.activeWarehouses.every(w => w.status === 'active')).toBe(true);
    });

    it('should calculate summary correctly', async () => {
      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const summary = result.current.summary;
      expect(summary.totalWarehouses).toBe(3);
      expect(summary.activeWarehouses).toBe(2);
      expect(summary.totalValue).toBe(mockWarehouseStats.totalValue * mockWarehouses.length);
    });

    it('should identify top and low performing warehouses', async () => {
      // Mock different utilization rates for warehouses
      (WarehouseService.getWarehouseSummary as any)
        .mockResolvedValueOnce({ ...mockWarehouseStats, utilizationPercentage: 90 })
        .mockResolvedValueOnce({ ...mockWarehouseStats, utilizationPercentage: 60 })
        .mockResolvedValueOnce({ ...mockWarehouseStats, utilizationPercentage: 30 });

      const { result } = renderHook(() => useWarehouses({ autoFetch: false }));
      
      await act(async () => {
        await result.current.refetch();
      });

      const summary = result.current.summary;
      expect(summary.topPerformingWarehouse?.id).toBe('wh1');
      expect(summary.topPerformingWarehouse?.utilizationRate).toBe(90);
      expect(summary.lowPerformingWarehouse?.id).toBe('wh2'); // Only active warehouses considered
      expect(summary.lowPerformingWarehouse?.utilizationRate).toBe(60);
    });
  });
});