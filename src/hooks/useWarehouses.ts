// Real Warehouses Hook - Connected to Database
import { useState, useEffect, useCallback } from 'react';
import WarehouseService from '@/services/simpleWarehouseService';
import type { Warehouse } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export interface UseWarehousesOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export interface WarehouseFilters {
  status?: string;
  branchId?: string;
  search?: string;
}

export function useWarehouses(options: UseWarehousesOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const { toast } = useToast();

  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouseSummary, setWarehouseSummary] = useState({
    totalWarehouses: 0,
    activeWarehouses: 0,
    totalCapacity: 0,
    totalUtilization: 0,
    totalProducts: 0,
    totalQuantity: 0,
    availableQuantity: 0,
    reservedQuantity: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiredItems: 0
  });

  // Fetch warehouses
  const fetchWarehouses = useCallback(async (filters?: WarehouseFilters) => {
    try {
      setLoading(true);
      setError(null);

      const data = await WarehouseService.getWarehouses(filters);
      setWarehouses(data);

      // Calculate summary
      const summary = {
        totalWarehouses: data.length,
        activeWarehouses: data.filter(w => w.status === 'active').length,
        totalCapacity: 0, // Would need capacity field in database
        totalUtilization: 0, // Would need utilization calculation
        totalProducts: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        expiredItems: 0
      };

      // Get stock summary for all warehouses
      for (const warehouse of data) {
        try {
          const stockSummary = await WarehouseService.getWarehouseSummary(warehouse.id);
          summary.totalProducts += stockSummary.totalProducts;
          summary.totalQuantity += stockSummary.totalQuantity;
          summary.availableQuantity += stockSummary.availableQuantity;
          summary.totalValue += stockSummary.totalValue;
          summary.lowStockItems += stockSummary.lowStockItems;
          summary.outOfStockItems += stockSummary.outOfStockItems;
        } catch (err) {
          console.warn(`Failed to get summary for warehouse ${warehouse.id}:`, err);
        }
      }

      setWarehouseSummary(summary);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลคลังสินค้าได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get warehouse by ID
  const getWarehouseById = useCallback(async (id: string) => {
    try {
      return await WarehouseService.getWarehouseById(id);
    } catch (err) {
      console.error('Error getting warehouse by ID:', err);
      return null;
    }
  }, []);

  // Create warehouse
  const createWarehouse = useCallback(async (warehouseData: Partial<Warehouse>) => {
    try {
      setLoading(true);
      setError(null);

      const newWarehouse = await WarehouseService.createWarehouse(warehouseData);
      
      // Refresh warehouses list
      await fetchWarehouses();

      toast({
        title: 'สำเร็จ',
        description: 'สร้างคลังสินค้าเรียบร้อยแล้ว',
      });

      return newWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างคลังสินค้าได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses, toast]);

  // Update warehouse
  const updateWarehouse = useCallback(async (id: string, updates: Partial<Warehouse>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedWarehouse = await WarehouseService.updateWarehouse(id, updates);
      
      // Refresh warehouses list
      await fetchWarehouses();

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตคลังสินค้าเรียบร้อยแล้ว',
      });

      return updatedWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตคลังสินค้าได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses, toast]);

  // Delete warehouse
  const deleteWarehouse = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await WarehouseService.deleteWarehouse(id);
      
      // Refresh warehouses list
      await fetchWarehouses();

      toast({
        title: 'สำเร็จ',
        description: 'ลบคลังสินค้าเรียบร้อยแล้ว',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถลบคลังสินค้าได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWarehouses, toast]);

  // Auto-fetch data on mount
  useEffect(() => {
    if (autoFetch) {
      fetchWarehouses();
    }
  }, [autoFetch, fetchWarehouses]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (autoFetch) {
          fetchWarehouses();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoFetch, fetchWarehouses]);

  return {
    // Data
    warehouses,
    warehouseSummary,
    
    // State
    loading,
    error,
    
    // Actions
    fetchWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => fetchWarehouses()
  };
}
