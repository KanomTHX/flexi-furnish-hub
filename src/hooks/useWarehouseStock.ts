// Real Warehouse Stock Hook - Connected to Database
import { useState, useEffect, useCallback } from 'react';
import WarehouseService from '@/services/simpleWarehouseService';
import type { StockLevel, StockMovement, SerialNumber } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export interface UseWarehouseStockOptions {
  warehouseId?: string;
  productId?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
}

export interface StockFilters {
  warehouseId?: string;
  productId?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface MovementFilters {
  warehouseId?: string;
  productId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export function useWarehouseStock(options: UseWarehouseStockOptions = {}) {
  const { warehouseId, productId, autoFetch = true, refreshInterval } = options;
  const { toast } = useToast();

  // State
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    availableQuantity: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  // Fetch stock levels
  const fetchStockLevels = useCallback(async (filters?: StockFilters) => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters = {
        warehouseId: filters?.warehouseId || warehouseId,
        productId: filters?.productId || productId,
        search: filters?.search,
        status: filters?.status,
        limit: filters?.limit || 100,
        offset: filters?.offset || 0
      };

      const result = await WarehouseService.getStockLevels(searchFilters);
      setStockLevels(result.data);

      // Update summary
      const newSummary = result.data.reduce((acc, stock) => ({
        totalProducts: acc.totalProducts + 1,
        totalQuantity: acc.totalQuantity + stock.totalQuantity,
        availableQuantity: acc.availableQuantity + stock.availableQuantity,
        totalValue: acc.totalValue + stock.availableValue,
        lowStockItems: acc.lowStockItems + (stock.availableQuantity <= 5 && stock.availableQuantity > 0 ? 1 : 0),
        outOfStockItems: acc.outOfStockItems + (stock.availableQuantity === 0 ? 1 : 0)
      }), {
        totalProducts: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      });

      setSummary(newSummary);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลสต็อกได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId, toast]);

  // Fetch stock movements
  const fetchStockMovements = useCallback(async (filters?: MovementFilters) => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters = {
        warehouseId: filters?.warehouseId || warehouseId,
        productId: filters?.productId || productId,
        movementType: filters?.movementType,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0
      };

      const result = await WarehouseService.getStockMovements(searchFilters);
      setStockMovements(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลการเคลื่อนไหวสต็อกได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId, toast]);

  // Fetch serial numbers
  const fetchSerialNumbers = useCallback(async (filters?: {
    warehouseId?: string;
    productId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters = {
        warehouseId: filters?.warehouseId || warehouseId,
        productId: filters?.productId || productId,
        status: filters?.status,
        search: filters?.search,
        limit: filters?.limit || 100,
        offset: filters?.offset || 0
      };

      const result = await WarehouseService.getSerialNumbers(searchFilters);
      setSerialNumbers(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลหมายเลขซีเรียลได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId, toast]);

  // Receive goods
  const receiveGoods = useCallback(async (receiveData: {
    warehouseId: string;
    supplierId?: string;
    invoiceNumber?: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    receivedBy: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await WarehouseService.receiveGoods(receiveData);
      
      // Refresh data after receiving goods
      await Promise.all([
        fetchStockLevels(),
        fetchStockMovements(),
        fetchSerialNumbers()
      ]);

      toast({
        title: 'สำเร็จ',
        description: `รับสินค้าเข้าคลังเรียบร้อยแล้ว (${result.receiveLog.totalItems} รายการ)`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถรับสินค้าเข้าคลังได้';
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
  }, [fetchStockLevels, fetchStockMovements, fetchSerialNumbers, toast]);

  // Log stock movement
  const logStockMovement = useCallback(async (movementData: {
    productId: string;
    serialNumberId?: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    unitCost?: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    performedBy: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const movement = await WarehouseService.logStockMovement(movementData);
      
      // Refresh data after logging movement
      await Promise.all([
        fetchStockLevels(),
        fetchStockMovements()
      ]);

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกการเคลื่อนไหวสต็อกเรียบร้อยแล้ว',
      });

      return movement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถบันทึกการเคลื่อนไหวสต็อกได้';
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
  }, [fetchStockLevels, fetchStockMovements, toast]);

  // Get warehouse summary
  const getWarehouseSummary = useCallback(async (targetWarehouseId?: string) => {
    try {
      const summaryData = await WarehouseService.getWarehouseSummary(
        targetWarehouseId || warehouseId
      );
      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      console.error('Error getting warehouse summary:', err);
      return summary;
    }
  }, [warehouseId, summary]);

  // Get low stock alerts
  const getLowStockAlerts = useCallback(async (threshold: number = 5) => {
    try {
      return await WarehouseService.getLowStockAlerts(threshold);
    } catch (err) {
      console.error('Error getting low stock alerts:', err);
      return [];
    }
  }, []);

  // Get out of stock items
  const getOutOfStockItems = useCallback(async () => {
    try {
      return await WarehouseService.getOutOfStockItems();
    } catch (err) {
      console.error('Error getting out of stock items:', err);
      return [];
    }
  }, []);

  // Auto-fetch data on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      Promise.all([
        fetchStockLevels(),
        fetchStockMovements(),
        fetchSerialNumbers()
      ]);
    }
  }, [autoFetch, warehouseId, productId, fetchStockLevels, fetchStockMovements, fetchSerialNumbers]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (autoFetch) {
          fetchStockLevels();
          fetchStockMovements();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoFetch, fetchStockLevels, fetchStockMovements]);

  return {
    // Data
    stockLevels,
    stockMovements,
    serialNumbers,
    summary,
    
    // State
    loading,
    error,
    
    // Actions
    fetchStockLevels,
    fetchStockMovements,
    fetchSerialNumbers,
    receiveGoods,
    logStockMovement,
    getWarehouseSummary,
    getLowStockAlerts,
    getOutOfStockItems,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => Promise.all([
      fetchStockLevels(),
      fetchStockMovements(),
      fetchSerialNumbers()
    ])
  };
}