import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StockService, SerialNumberService } from '@/lib/warehouseStock';
import { RealTimeStockService } from '@/services/realTimeStockService';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import type {
  StockLevel,
  SerialNumber,
  StockMovement,
  StockSearchFilters,
  MovementFilters,
  StockLevelResponse,
  SerialNumberResponse,
  MovementResponse,
  StockTransaction,
  StockAlert,
  ApiResponse
} from '@/types/warehouseStock';
import {
  calculateStockFromSerialNumbers,
  calculateAvailableStock,
  calculateReservedStock,
  calculateTotalStockValue,
  calculateStockStatus,
  type StockCalculationResult,
  type StockStatus
} from '@/utils/stockCalculations';

export interface UseStockOptions {
  warehouseId?: string;
  productId?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  realTimeNotifications?: boolean;
}

export interface UseStockReturn {
  // Data
  stockLevels: StockLevel[];
  serialNumbers: SerialNumber[];
  movements: StockMovement[];
  alerts: StockAlert[];
  
  // Loading states
  loading: boolean;
  loadingSerialNumbers: boolean;
  loadingMovements: boolean;
  updating: boolean;
  
  // Error states
  error: string | null;
  
  // Pagination and filtering
  filters: StockSearchFilters;
  movementFilters: MovementFilters;
  
  // Calculated values
  summary: StockSummary;
  
  // Actions
  setFilters: (filters: StockSearchFilters) => void;
  setMovementFilters: (filters: MovementFilters) => void;
  refetch: () => Promise<void>;
  refetchSerialNumbers: () => Promise<void>;
  refetchMovements: () => Promise<void>;
  
  // Stock operations
  updateStock: (transaction: StockTransaction) => Promise<boolean>;
  searchStock: (searchTerm: string) => void;
  getStockByProduct: (productId: string, warehouseId?: string) => StockLevel | undefined;
  getSerialNumbersByProduct: (productId: string, warehouseId?: string) => SerialNumber[];
  
  // Stock calculations
  calculateStock: (serialNumbers: SerialNumber[]) => StockCalculationResult;
  getStockStatus: (stockLevel: StockLevel) => StockStatus;
  
  // Alerts and notifications
  getLowStockAlerts: (threshold?: number) => StockAlert[];
  getOutOfStockAlerts: () => StockAlert[];
  markAlertAsRead: (alertId: string) => void;
}

export interface StockSummary {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalAlerts: number;
  lastUpdated: Date;
}

export function useStock(options: UseStockOptions = {}): UseStockReturn {
  const {
    warehouseId,
    productId,
    autoFetch = true,
    refreshInterval,
    enableRealTime = true,
    realTimeNotifications = true
  } = options;

  // State
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSerialNumbers, setLoadingSerialNumbers] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<StockSearchFilters>({
    warehouseId,
    productId
  });
  const [movementFilters, setMovementFilters] = useState<MovementFilters>({
    warehouseId,
    productId
  });

  const { toast } = useToast();

  // Real-time stock monitoring
  const realTimeStock = useRealTimeStock(`stock-${warehouseId || 'all'}-${productId || 'all'}`, {
    warehouseId,
    productId,
    enabled: enableRealTime,
    showNotifications: realTimeNotifications,
    includeMovements: true,
    includeSerialNumbers: true,
    includeAlerts: true
  });

  // Merge real-time alerts with local alerts
  useEffect(() => {
    if (realTimeStock.activeAlerts.length > 0) {
      setAlerts(realTimeStock.activeAlerts);
    }
  }, [realTimeStock.activeAlerts]);

  // Auto-refresh when real-time updates are received
  useEffect(() => {
    if (realTimeStock.updateCount > 0) {
      // Debounce the refresh to avoid too many API calls
      const timeoutId = setTimeout(() => {
        refetch();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [realTimeStock.updateCount]);

  // Fetch stock levels
  const fetchStockLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await StockService.getStockLevels(filters);
      setStockLevels(response.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock levels';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Fetch serial numbers
  const fetchSerialNumbers = useCallback(async () => {
    try {
      setLoadingSerialNumbers(true);
      setError(null);
      
      const response = await SerialNumberService.searchSerialNumbers(filters);
      setSerialNumbers(response.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch serial numbers';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingSerialNumbers(false);
    }
  }, [filters, toast]);

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    try {
      setLoadingMovements(true);
      setError(null);
      
      const response = await StockService.getMovements(movementFilters);
      setMovements(response.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movements';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoadingMovements(false);
    }
  }, [movementFilters, toast]);

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchStockLevels(),
      fetchSerialNumbers(),
      fetchMovements()
    ]);
  }, [fetchStockLevels, fetchSerialNumbers, fetchMovements]);

  // Update stock
  const updateStock = useCallback(async (transaction: StockTransaction): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);

      // Process each transaction item
      for (const item of transaction.items) {
        await StockService.logMovement(
          item.productId,
          item.serialNumberId || null,
          transaction.warehouseId,
          transaction.type as any,
          item.quantity,
          item.unitCost,
          'manual' as any,
          undefined,
          transaction.reference,
          transaction.notes
        );

        // Update serial number status if applicable
        if (item.serialNumberId) {
          let newStatus: any = 'available';
          
          switch (transaction.type) {
            case 'withdraw':
              newStatus = 'sold';
              break;
            case 'transfer':
              newStatus = 'transferred';
              break;
            case 'claim':
              newStatus = 'claimed';
              break;
          }

          await SerialNumberService.updateSerialNumberStatus(
            item.serialNumberId,
            newStatus,
            undefined,
            transaction.reference,
            transaction.notes
          );
        }
      }

      // Process real-time updates
      if (enableRealTime) {
        await RealTimeStockService.processStockTransaction(transaction);
      }

      // Refresh data
      await refetch();

      toast({
        title: 'Success',
        description: 'Stock updated successfully',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stock';
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
  }, [refetch, toast, enableRealTime]);

  // Search stock
  const searchStock = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  // Get stock by product
  const getStockByProduct = useCallback((productId: string, warehouseId?: string): StockLevel | undefined => {
    return stockLevels.find(stock => 
      stock.productId === productId && 
      (!warehouseId || stock.warehouseId === warehouseId)
    );
  }, [stockLevels]);

  // Get serial numbers by product
  const getSerialNumbersByProduct = useCallback((productId: string, warehouseId?: string): SerialNumber[] => {
    return serialNumbers.filter(sn => 
      sn.productId === productId && 
      (!warehouseId || sn.warehouseId === warehouseId)
    );
  }, [serialNumbers]);

  // Calculate stock from serial numbers
  const calculateStock = useCallback((serialNumbers: SerialNumber[]): StockCalculationResult => {
    return calculateStockFromSerialNumbers(serialNumbers);
  }, []);

  // Get stock status
  const getStockStatus = useCallback((stockLevel: StockLevel): StockStatus => {
    return calculateStockStatus(stockLevel.availableQuantity);
  }, []);

  // Get low stock alerts
  const getLowStockAlerts = useCallback((threshold: number = 5): StockAlert[] => {
    return stockLevels
      .filter(stock => stock.availableQuantity <= threshold && stock.availableQuantity > 0)
      .map(stock => ({
        id: `low-stock-${stock.productId}-${stock.warehouseId}`,
        type: 'low_stock' as const,
        severity: 'warning' as const,
        productId: stock.productId,
        productName: stock.productName,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        currentStock: stock.availableQuantity,
        threshold,
        message: `${stock.productName} is running low in ${stock.warehouseName}`,
        recommendedAction: 'Consider reordering or transferring stock',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      }));
  }, [stockLevels]);

  // Get out of stock alerts
  const getOutOfStockAlerts = useCallback((): StockAlert[] => {
    return stockLevels
      .filter(stock => stock.availableQuantity === 0)
      .map(stock => ({
        id: `out-of-stock-${stock.productId}-${stock.warehouseId}`,
        type: 'out_of_stock' as const,
        severity: 'critical' as const,
        productId: stock.productId,
        productName: stock.productName,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        currentStock: 0,
        message: `${stock.productName} is out of stock in ${stock.warehouseName}`,
        recommendedAction: 'Urgent: Reorder or transfer stock immediately',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      }));
  }, [stockLevels]);

  // Mark alert as read
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  // Calculate summary
  const summary = useMemo((): StockSummary => {
    const totalProducts = stockLevels.length;
    const totalQuantity = stockLevels.reduce((sum, stock) => sum + stock.totalQuantity, 0);
    const totalValue = stockLevels.reduce((sum, stock) => sum + stock.availableValue, 0);
    const availableQuantity = stockLevels.reduce((sum, stock) => sum + stock.availableQuantity, 0);
    const reservedQuantity = stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0);
    const lowStockItems = stockLevels.filter(stock => 
      stock.availableQuantity <= 5 && stock.availableQuantity > 0
    ).length;
    const outOfStockItems = stockLevels.filter(stock => stock.availableQuantity === 0).length;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      availableQuantity,
      reservedQuantity,
      lowStockItems,
      outOfStockItems,
      criticalAlerts,
      lastUpdated: new Date()
    };
  }, [stockLevels, alerts]);

  // Update alerts when stock levels change
  useEffect(() => {
    const lowStockAlerts = getLowStockAlerts();
    const outOfStockAlerts = getOutOfStockAlerts();
    setAlerts([...lowStockAlerts, ...outOfStockAlerts]);
  }, [stockLevels, getLowStockAlerts, getOutOfStockAlerts]);

  // Auto-fetch data on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        refetch();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, refetch]);

  // Update filters when options change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      warehouseId,
      productId
    }));
    setMovementFilters(prev => ({
      ...prev,
      warehouseId,
      productId
    }));
  }, [warehouseId, productId]);

  return {
    // Data
    stockLevels,
    serialNumbers,
    movements,
    alerts,
    
    // Loading states
    loading,
    loadingSerialNumbers,
    loadingMovements,
    updating,
    
    // Error state
    error,
    
    // Filters
    filters,
    movementFilters,
    
    // Summary
    summary,
    
    // Actions
    setFilters,
    setMovementFilters,
    refetch,
    refetchSerialNumbers: fetchSerialNumbers,
    refetchMovements: fetchMovements,
    
    // Stock operations
    updateStock,
    searchStock,
    getStockByProduct,
    getSerialNumbersByProduct,
    
    // Calculations
    calculateStock,
    getStockStatus,
    
    // Alerts
    getLowStockAlerts,
    getOutOfStockAlerts,
    markAlertAsRead
  };
}