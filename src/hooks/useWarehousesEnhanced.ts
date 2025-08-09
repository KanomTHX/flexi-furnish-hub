import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WarehouseService } from '@/lib/warehouseService';
import type { Warehouse, WarehouseInsert, WarehouseUpdate } from '@/lib/warehouseService';
import type { StockLevel } from '@/types/warehouseStock';

export interface UseWarehousesOptions {
  branchId?: string;
  autoFetch?: boolean;
  includeInactive?: boolean;
}

export interface WarehouseWithStats extends Warehouse {
  stats: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    availableQuantity: number;
    lowStockItems: number;
    outOfStockItems: number;
    utilizationPercentage: number;
  };
}

export interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalUtilization: number;
  averageUtilization: number;
  totalValue: number;
  topPerformingWarehouse: {
    id: string;
    name: string;
    utilizationRate: number;
  } | null;
  lowPerformingWarehouse: {
    id: string;
    name: string;
    utilizationRate: number;
  } | null;
}

export interface UseWarehousesReturn {
  // Data
  warehouses: WarehouseWithStats[];
  allWarehouses: Warehouse[];
  activeWarehouses: Warehouse[];
  
  // Loading states
  loading: boolean;
  updating: boolean;
  
  // Error state
  error: string | null;
  
  // Summary
  summary: WarehouseSummary;
  
  // Actions
  refetch: () => Promise<void>;
  createWarehouse: (warehouse: WarehouseInsert) => Promise<Warehouse | null>;
  updateWarehouse: (id: string, updates: WarehouseUpdate) => Promise<Warehouse | null>;
  deleteWarehouse: (id: string) => Promise<boolean>;
  
  // Utility functions
  getWarehouseById: (id: string) => Warehouse | undefined;
  getWarehouseByCode: (code: string) => Warehouse | undefined;
  getWarehousesByBranch: (branchId: string) => Warehouse[];
  getWarehouseStats: (warehouseId: string) => Promise<WarehouseWithStats['stats'] | null>;
  
  // Filtering and search
  searchWarehouses: (searchTerm: string) => WarehouseWithStats[];
  filterWarehouses: (filters: WarehouseFilters) => WarehouseWithStats[];
  
  // Validation
  validateWarehouseCode: (code: string, excludeId?: string) => boolean;
  validateWarehouseName: (name: string, excludeId?: string) => boolean;
}

export interface WarehouseFilters {
  status?: 'active' | 'inactive' | 'maintenance' | 'closed';
  type?: 'main' | 'branch' | 'distribution' | 'retail' | 'temporary';
  branchId?: string;
  searchTerm?: string;
  minUtilization?: number;
  maxUtilization?: number;
}

export function useWarehouses(options: UseWarehousesOptions = {}): UseWarehousesReturn {
  const {
    branchId,
    autoFetch = true,
    includeInactive = false
  } = options;

  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStats, setWarehouseStats] = useState<Map<string, WarehouseWithStats['stats']>>(new Map());
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (branchId) filters.branchId = branchId;
      if (!includeInactive) filters.status = 'active';
      
      const data = await WarehouseService.getWarehouses(filters);
      setWarehouses(data);
      
      // Fetch stats for each warehouse
      const statsPromises = data.map(async (warehouse) => {
        try {
          const stats = await WarehouseService.getWarehouseSummary(warehouse.id);
          return { warehouseId: warehouse.id, stats };
        } catch (err) {
          console.warn(`Failed to fetch stats for warehouse ${warehouse.id}:`, err);
          return {
            warehouseId: warehouse.id,
            stats: {
              totalProducts: 0,
              totalQuantity: 0,
              totalValue: 0,
              availableQuantity: 0,
              lowStockItems: 0,
              outOfStockItems: 0,
              utilizationPercentage: 0
            }
          };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap = new Map();
      statsResults.forEach(({ warehouseId, stats }) => {
        statsMap.set(warehouseId, stats);
      });
      setWarehouseStats(statsMap);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouses';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, includeInactive, toast]);

  // Create warehouse
  const createWarehouse = useCallback(async (warehouse: WarehouseInsert): Promise<Warehouse | null> => {
    try {
      setUpdating(true);
      setError(null);
      
      const newWarehouse = await WarehouseService.createWarehouse(warehouse);
      
      // Add to local state
      setWarehouses(prev => [...prev, newWarehouse]);
      
      // Initialize stats for new warehouse
      setWarehouseStats(prev => new Map(prev).set(newWarehouse.id, {
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        availableQuantity: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        utilizationPercentage: 0
      }));
      
      toast({
        title: 'Success',
        description: 'Warehouse created successfully',
      });
      
      return newWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create warehouse';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  // Update warehouse
  const updateWarehouse = useCallback(async (id: string, updates: WarehouseUpdate): Promise<Warehouse | null> => {
    try {
      setUpdating(true);
      setError(null);
      
      const updatedWarehouse = await WarehouseService.updateWarehouse(id, updates);
      
      // Update local state
      setWarehouses(prev => 
        prev.map(warehouse => 
          warehouse.id === id ? updatedWarehouse : warehouse
        )
      );
      
      toast({
        title: 'Success',
        description: 'Warehouse updated successfully',
      });
      
      return updatedWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update warehouse';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  // Delete warehouse (soft delete)
  const deleteWarehouse = useCallback(async (id: string): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);
      
      await WarehouseService.deleteWarehouse(id);
      
      // Update local state
      setWarehouses(prev => 
        prev.map(warehouse => 
          warehouse.id === id 
            ? { ...warehouse, status: 'inactive' as const }
            : warehouse
        )
      );
      
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete warehouse';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  // Get warehouse stats
  const getWarehouseStats = useCallback(async (warehouseId: string): Promise<WarehouseWithStats['stats'] | null> => {
    try {
      const stats = await WarehouseService.getWarehouseSummary(warehouseId);
      
      // Update local stats cache
      setWarehouseStats(prev => new Map(prev).set(warehouseId, stats));
      
      return stats;
    } catch (err) {
      console.warn(`Failed to fetch stats for warehouse ${warehouseId}:`, err);
      return null;
    }
  }, []);

  // Utility functions
  const getWarehouseById = useCallback((id: string): Warehouse | undefined => {
    return warehouses.find(warehouse => warehouse.id === id);
  }, [warehouses]);

  const getWarehouseByCode = useCallback((code: string): Warehouse | undefined => {
    return warehouses.find(warehouse => warehouse.code === code);
  }, [warehouses]);

  const getWarehousesByBranch = useCallback((branchId: string): Warehouse[] => {
    return warehouses.filter(warehouse => warehouse.branch_id === branchId);
  }, [warehouses]);

  // Computed values
  const warehousesWithStats = useMemo((): WarehouseWithStats[] => {
    return warehouses.map(warehouse => ({
      ...warehouse,
      stats: warehouseStats.get(warehouse.id) || {
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        availableQuantity: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        utilizationPercentage: 0
      }
    }));
  }, [warehouses, warehouseStats]);

  // Search warehouses
  const searchWarehouses = useCallback((searchTerm: string): WarehouseWithStats[] => {
    const term = searchTerm.toLowerCase();
    return warehousesWithStats.filter(warehouse =>
      warehouse.name.toLowerCase().includes(term) ||
      warehouse.code.toLowerCase().includes(term) ||
      (warehouse.address && warehouse.address.toLowerCase().includes(term))
    );
  }, [warehousesWithStats]);

  // Filter warehouses
  const filterWarehouses = useCallback((filters: WarehouseFilters): WarehouseWithStats[] => {
    return warehousesWithStats.filter(warehouse => {
      if (filters.status && warehouse.status !== filters.status) return false;
      if (filters.type && warehouse.type !== filters.type) return false;
      if (filters.branchId && warehouse.branch_id !== filters.branchId) return false;
      if (filters.minUtilization && warehouse.stats.utilizationPercentage < filters.minUtilization) return false;
      if (filters.maxUtilization && warehouse.stats.utilizationPercentage > filters.maxUtilization) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesName = warehouse.name.toLowerCase().includes(term);
        const matchesCode = warehouse.code.toLowerCase().includes(term);
        const matchesAddress = warehouse.address && warehouse.address.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesAddress) return false;
      }
      return true;
    });
  }, [warehousesWithStats]);

  // Validation functions
  const validateWarehouseCode = useCallback((code: string, excludeId?: string): boolean => {
    return !warehouses.some(warehouse => 
      warehouse.code === code && warehouse.id !== excludeId
    );
  }, [warehouses]);

  const validateWarehouseName = useCallback((name: string, excludeId?: string): boolean => {
    return !warehouses.some(warehouse => 
      warehouse.name === name && warehouse.id !== excludeId
    );
  }, [warehouses]);

  const activeWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => warehouse.status === 'active');
  }, [warehouses]);

  const summary = useMemo((): WarehouseSummary => {
    const totalWarehouses = warehouses.length;
    const activeWarehousesCount = activeWarehouses.length;
    const totalValue = Array.from(warehouseStats.values()).reduce((sum, stats) => sum + stats.totalValue, 0);
    
    // Calculate utilization stats
    const utilizationRates = warehousesWithStats.map(w => w.stats.utilizationPercentage);
    const averageUtilization = utilizationRates.length > 0 
      ? utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length 
      : 0;
    
    // Find top and low performing warehouses
    const sortedByUtilization = warehousesWithStats
      .filter(w => w.status === 'active')
      .sort((a, b) => b.stats.utilizationPercentage - a.stats.utilizationPercentage);
    
    const topPerformingWarehouse = sortedByUtilization.length > 0 
      ? {
          id: sortedByUtilization[0].id,
          name: sortedByUtilization[0].name,
          utilizationRate: sortedByUtilization[0].stats.utilizationPercentage
        }
      : null;
    
    const lowPerformingWarehouse = sortedByUtilization.length > 0 
      ? {
          id: sortedByUtilization[sortedByUtilization.length - 1].id,
          name: sortedByUtilization[sortedByUtilization.length - 1].name,
          utilizationRate: sortedByUtilization[sortedByUtilization.length - 1].stats.utilizationPercentage
        }
      : null;

    return {
      totalWarehouses,
      activeWarehouses: activeWarehousesCount,
      totalCapacity: 0, // Would need capacity data from warehouse schema
      totalUtilization: 0, // Would need utilization data from warehouse schema
      averageUtilization,
      totalValue,
      topPerformingWarehouse,
      lowPerformingWarehouse
    };
  }, [warehouses, activeWarehouses, warehousesWithStats, warehouseStats]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchWarehouses();
    }
  }, [autoFetch, fetchWarehouses]);

  return {
    // Data
    warehouses: warehousesWithStats,
    allWarehouses: warehouses,
    activeWarehouses,
    
    // Loading states
    loading,
    updating,
    
    // Error state
    error,
    
    // Summary
    summary,
    
    // Actions
    refetch: fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    
    // Utility functions
    getWarehouseById,
    getWarehouseByCode,
    getWarehousesByBranch,
    getWarehouseStats,
    
    // Filtering and search
    searchWarehouses,
    filterWarehouses,
    
    // Validation
    validateWarehouseCode,
    validateWarehouseName
  };
}