import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Placeholder interfaces for warehouse stock functionality
export interface StockLevel {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  availableValue: number;
}

export interface SerialNumber {
  id: string;
  serial_number: string;
  product_id: string;
  warehouse_id: string;
  status: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  createdAt: string;
}

export interface StockSearchFilters {
  searchTerm: string;
  warehouseId: string;
  productId: string;
  category: string;
  status: string;
}

export interface StockAlert {
  id: string;
  type: string;
  severity: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  currentStock: number;
  currentQuantity: number;
  threshold?: number;
  message: string;
  recommendedAction: string;
  isRead: boolean;
  acknowledged: boolean;
  isResolved: boolean;
  createdAt: Date;
}

export interface StockTransaction {
  id: string;
  warehouseId: string;
  type: string;
  reference: string;
  notes: string;
  items: Array<{
    productId: string;
    serialNumberId?: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface UseStockOptions {
  warehouseId?: string;
  productId?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
  enableRealTime?: boolean;
  realTimeNotifications?: boolean;
}

export interface UseStockReturn {
  stockLevels: StockLevel[];
  serialNumbers: SerialNumber[];
  movements: StockMovement[];
  alerts: StockAlert[];
  loading: boolean;
  loadingSerialNumbers: boolean;
  loadingMovements: boolean;
  updating: boolean;
  error: string | null;
  filters: StockSearchFilters;
  setFilters: (filters: StockSearchFilters) => void;
  refetch: () => Promise<void>;
  refetchSerialNumbers: () => Promise<void>;
  refetchMovements: () => Promise<void>;
  updateStock: (transaction: StockTransaction) => Promise<boolean>;
  searchStock: (searchTerm: string) => void;
  getStockByProduct: (productId: string, warehouseId?: string) => StockLevel | undefined;
  getSerialNumbersByProduct: (productId: string, warehouseId?: string) => SerialNumber[];
  getLowStockAlerts: (threshold?: number) => StockAlert[];
  getOutOfStockAlerts: () => StockAlert[];
  markAlertAsRead: (alertId: string) => void;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    availableQuantity: number;
    reservedQuantity: number;
    lowStockItems: number;
    outOfStockItems: number;
    criticalAlerts: number;
    lastUpdated: Date;
  };
}

export function useStock(options: UseStockOptions = {}): UseStockReturn {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSerialNumbers, setLoadingSerialNumbers] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StockSearchFilters>({
    searchTerm: '',
    warehouseId: options.warehouseId || '',
    productId: options.productId || '',
    category: '',
    status: ''
  });

  const { toast } = useToast();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch stock levels based on filters
      const { data: stockData, error: stockError } = await supabase
        .from('stock_levels')
        .select('*')
        .eq('warehouse_id', filters.warehouseId)
        .eq('product_id', filters.productId);

      if (stockError) {
        throw stockError;
      }

      if (stockData) {
        setStockLevels(stockData);
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Error fetching stock levels',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters.warehouseId, filters.productId, supabase, toast]);

  const refetchSerialNumbers = useCallback(async () => {
    setLoadingSerialNumbers(true);
    try {
      // Fetch serial numbers based on filters
      const { data: serialNumberData, error: serialNumberError } = await supabase
        .from('serial_numbers')
        .select('*')
        .eq('warehouse_id', filters.warehouseId)
        .eq('product_id', filters.productId);

      if (serialNumberError) {
        throw serialNumberError;
      }

      if (serialNumberData) {
        setSerialNumbers(serialNumberData);
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Error fetching serial numbers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingSerialNumbers(false);
    }
  }, [filters.warehouseId, filters.productId, supabase, toast]);

  const refetchMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      // Fetch stock movements based on filters
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('warehouse_id', filters.warehouseId)
        .eq('product_id', filters.productId);

      if (movementError) {
        throw movementError;
      }

      if (movementData) {
        setMovements(movementData);
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Error fetching stock movements',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingMovements(false);
    }
  }, [filters.warehouseId, filters.productId, supabase, toast]);

  const updateStock = useCallback(async (transaction: StockTransaction): Promise<boolean> => {
    toast({
      title: 'Feature Disabled',
      description: 'Stock management is currently disabled',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  const searchStock = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const getStockByProduct = useCallback((productId: string, warehouseId?: string): StockLevel | undefined => {
    return stockLevels.find(stock => 
      stock.productId === productId && 
      (!warehouseId || stock.warehouseId === warehouseId)
    );
  }, [stockLevels]);

  const getSerialNumbersByProduct = useCallback((productId: string, warehouseId?: string): SerialNumber[] => {
    return serialNumbers.filter(sn => 
      sn.product_id === productId && 
      (!warehouseId || sn.warehouse_id === warehouseId)
    );
  }, [serialNumbers]);

  const getLowStockAlerts = useCallback((threshold: number = 5): StockAlert[] => {
    return stockLevels.filter(stock => stock.availableQuantity <= threshold).map(stock => ({
      id: `low-stock-${stock.productId}-${stock.warehouseId}`,
      type: 'low_stock',
      severity: 'warning',
      productId: stock.productId,
      productName: stock.productName,
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouseName,
      currentStock: stock.availableQuantity,
      currentQuantity: stock.availableQuantity,
      threshold: threshold,
      message: `Low stock for ${stock.productName} in ${stock.warehouseName}. Current stock: ${stock.availableQuantity}, Threshold: ${threshold}`,
      recommendedAction: 'Reorder stock',
      isRead: false,
      acknowledged: false,
      isResolved: false,
      createdAt: new Date(),
    }));
  }, [stockLevels]);

  const getOutOfStockAlerts = useCallback((): StockAlert[] => {
    return stockLevels.filter(stock => stock.availableQuantity === 0).map(stock => ({
      id: `out-of-stock-${stock.productId}-${stock.warehouseId}`,
      type: 'out_of_stock',
      severity: 'critical',
      productId: stock.productId,
      productName: stock.productName,
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouseName,
      currentStock: stock.availableQuantity,
      currentQuantity: stock.availableQuantity,
      message: `Out of stock for ${stock.productName} in ${stock.warehouseName}`,
      recommendedAction: 'Reorder stock immediately',
      isRead: false,
      acknowledged: false,
      isResolved: false,
      createdAt: new Date(),
    }));
  }, [stockLevels]);

  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }, [setAlerts]);

  const summary = {
    totalProducts: stockLevels.length,
    totalQuantity: stockLevels.reduce((sum, stock) => sum + stock.totalQuantity, 0),
    totalValue: stockLevels.reduce((sum, stock) => sum + stock.availableValue, 0),
    availableQuantity: stockLevels.reduce((sum, stock) => sum + stock.availableQuantity, 0),
    reservedQuantity: stockLevels.reduce((sum, stock) => sum + stock.reservedQuantity, 0),
    lowStockItems: stockLevels.filter(stock => stock.availableQuantity <= 5).length,
    outOfStockItems: stockLevels.filter(stock => stock.availableQuantity === 0).length,
    criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
    lastUpdated: new Date()
  };

  useEffect(() => {
    if (options.autoFetch !== false) {
      refetch();
      refetchSerialNumbers();
      refetchMovements();
    }
  }, [refetch, refetchSerialNumbers, refetchMovements, options.autoFetch]);

  return {
    stockLevels,
    serialNumbers,
    movements,
    alerts,
    loading,
    loadingSerialNumbers,
    loadingMovements,
    updating,
    error,
    filters,
    setFilters,
    refetch,
    refetchSerialNumbers,
    refetchMovements,
    updateStock,
    searchStock,
    getStockByProduct,
    getSerialNumbersByProduct,
    getLowStockAlerts,
    getOutOfStockAlerts,
    markAlertAsRead,
    summary
  };
}
