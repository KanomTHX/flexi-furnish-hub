// Enhanced Warehouses Hook - Connected to Database with Advanced Features
import { useState, useEffect, useCallback } from 'react';
import { WarehouseService } from '@/services/warehouseService';
import type { Warehouse, StockLevel } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';

export interface UseWarehousesEnhancedOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
  includeStats?: boolean;
  includeAlerts?: boolean;
}

export interface WarehouseStats {
  [warehouseId: string]: {
    totalProducts: number;
    totalQuantity: number;
    availableQuantity: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    utilizationRate: number;
    lastUpdated: Date;
  };
}

export interface WarehouseAlert {
  id: string;
  warehouseId: string;
  warehouseName: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  threshold?: number;
  createdAt: Date;
}

export function useWarehousesEnhanced(options: UseWarehousesEnhancedOptions = {}) {
  const { 
    autoFetch = true, 
    refreshInterval, 
    includeStats = true, 
    includeAlerts = true 
  } = options;
  const { toast } = useToast();

  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats>({});
  const [alerts, setAlerts] = useState<WarehouseAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch warehouses with enhanced data
  const fetchWarehouses = useCallback(async (filters?: {
    status?: string;
    branchId?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const warehousesData = await WarehouseService.getWarehouses(filters);
      setWarehouses(warehousesData);

      // Fetch stats for each warehouse if requested
      if (includeStats) {
        const stats: WarehouseStats = {};
        
        for (const warehouse of warehousesData) {
          try {
            const summary = await WarehouseService.getWarehouseSummary(warehouse.id);
            stats[warehouse.id] = {
              ...summary,
              utilizationRate: 0, // Would need capacity data to calculate
              lastUpdated: new Date()
            };
          } catch (err) {
            console.warn(`Failed to get stats for warehouse ${warehouse.id}:`, err);
            stats[warehouse.id] = {
              totalProducts: 0,
              totalQuantity: 0,
              availableQuantity: 0,
              totalValue: 0,
              lowStockItems: 0,
              outOfStockItems: 0,
              utilizationRate: 0,
              lastUpdated: new Date()
            };
          }
        }
        
        setWarehouseStats(stats);
      }

      return warehousesData;
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
  }, [includeStats, toast]);

  // Fetch warehouse alerts
  const fetchAlerts = useCallback(async () => {
    if (!includeAlerts) return [];

    try {
      const alerts: WarehouseAlert[] = [];

      // Get low stock alerts
      const lowStockItems = await WarehouseService.getLowStockAlerts(5);
      for (const item of lowStockItems) {
        alerts.push({
          id: `low-stock-${item.productId}-${item.warehouseId}`,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          type: 'low_stock',
          severity: item.availableQuantity <= 2 ? 'critical' : 'medium',
          message: `${item.productName} มีสต็อกเหลือน้อย (${item.availableQuantity} ชิ้น)`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.availableQuantity,
          threshold: 5,
          createdAt: new Date()
        });
      }

      // Get out of stock alerts
      const outOfStockItems = await WarehouseService.getOutOfStockItems();
      for (const item of outOfStockItems) {
        alerts.push({
          id: `out-of-stock-${item.productId}-${item.warehouseId}`,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          type: 'out_of_stock',
          severity: 'high',
          message: `${item.productName} หมดสต็อก`,
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          threshold: 0,
          createdAt: new Date()
        });
      }

      // Sort alerts by severity
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      setAlerts(alerts);
      return alerts;
    } catch (err) {
      console.error('Error fetching warehouse alerts:', err);
      return [];
    }
  }, [includeAlerts]);

  // Get warehouse performance metrics
  const getWarehousePerformance = useCallback(async (warehouseId: string, period: 'day' | 'week' | 'month' = 'month') => {
    try {
      // This would require additional database views/functions for performance metrics
      // For now, return basic metrics from stock movements
      const dateFrom = new Date();
      switch (period) {
        case 'day':
          dateFrom.setDate(dateFrom.getDate() - 1);
          break;
        case 'week':
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case 'month':
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          break;
      }

      const { data: movements } = await WarehouseService.getStockMovements({
        warehouseId,
        dateFrom: dateFrom.toISOString(),
        limit: 1000
      });

      // Calculate performance metrics
      const inboundMovements = movements.filter(m => ['receive', 'transfer_in', 'adjustment_in'].includes(m.movementType));
      const outboundMovements = movements.filter(m => ['sale', 'transfer_out', 'adjustment_out', 'claim'].includes(m.movementType));

      const totalInbound = inboundMovements.reduce((sum, m) => sum + m.quantity, 0);
      const totalOutbound = outboundMovements.reduce((sum, m) => sum + m.quantity, 0);
      const turnoverRate = totalInbound > 0 ? (totalOutbound / totalInbound) * 100 : 0;

      return {
        period,
        totalInbound,
        totalOutbound,
        netMovement: totalInbound - totalOutbound,
        turnoverRate,
        totalTransactions: movements.length,
        averageTransactionSize: movements.length > 0 ? (totalInbound + totalOutbound) / movements.length : 0
      };
    } catch (err) {
      console.error('Error getting warehouse performance:', err);
      return null;
    }
  }, []);

  // Get top performing warehouses
  const getTopPerformingWarehouses = useCallback(async (metric: 'value' | 'quantity' | 'turnover' = 'value', limit: number = 5) => {
    try {
      const warehousesWithStats = warehouses.map(warehouse => ({
        ...warehouse,
        stats: warehouseStats[warehouse.id] || {
          totalProducts: 0,
          totalQuantity: 0,
          availableQuantity: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          utilizationRate: 0,
          lastUpdated: new Date()
        }
      }));

      // Sort by selected metric
      const sorted = warehousesWithStats.sort((a, b) => {
        switch (metric) {
          case 'value':
            return b.stats.totalValue - a.stats.totalValue;
          case 'quantity':
            return b.stats.totalQuantity - a.stats.totalQuantity;
          case 'turnover':
            return b.stats.utilizationRate - a.stats.utilizationRate;
          default:
            return 0;
        }
      });

      return sorted.slice(0, limit);
    } catch (err) {
      console.error('Error getting top performing warehouses:', err);
      return [];
    }
  }, [warehouses, warehouseStats]);

  // Auto-fetch data on mount
  useEffect(() => {
    if (autoFetch) {
      Promise.all([
        fetchWarehouses(),
        fetchAlerts()
      ]);
    }
  }, [autoFetch, fetchWarehouses, fetchAlerts]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (autoFetch) {
          Promise.all([
            fetchWarehouses(),
            fetchAlerts()
          ]);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoFetch, fetchWarehouses, fetchAlerts]);

  return {
    // Data
    warehouses,
    warehouseStats,
    alerts,
    
    // State
    loading,
    error,
    
    // Actions
    fetchWarehouses,
    fetchAlerts,
    getWarehousePerformance,
    getTopPerformingWarehouses,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => Promise.all([
      fetchWarehouses(),
      fetchAlerts()
    ])
  };
}
