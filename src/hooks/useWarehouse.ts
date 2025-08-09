import { useState, useEffect } from 'react';
import { WarehouseService, type Warehouse, type StockLevel, type StockMovement } from '@/lib/warehouseService';
import { useToast } from '@/hooks/use-toast';

export interface UseWarehouseOptions {
  autoFetch?: boolean;
  branchId?: string;
}

export interface UseWarehouseReturn {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createWarehouse: (warehouse: any) => Promise<Warehouse | null>;
  updateWarehouse: (id: string, updates: any) => Promise<Warehouse | null>;
  deleteWarehouse: (id: string) => Promise<boolean>;
}

export function useWarehouse(options: UseWarehouseOptions = {}): UseWarehouseReturn {
  const { autoFetch = true, branchId } = options;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = branchId ? { branchId, status: 'active' } : { status: 'active' };
      const data = await WarehouseService.getWarehouses(filters);
      setWarehouses(data);
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
  };

  const createWarehouse = async (warehouse: any): Promise<Warehouse | null> => {
    try {
      setLoading(true);
      const newWarehouse = await WarehouseService.createWarehouse(warehouse);
      setWarehouses(prev => [...prev, newWarehouse]);
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
      setLoading(false);
    }
  };

  const updateWarehouse = async (id: string, updates: any): Promise<Warehouse | null> => {
    try {
      setLoading(true);
      const updatedWarehouse = await WarehouseService.updateWarehouse(id, updates);
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
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await WarehouseService.deleteWarehouse(id);
      setWarehouses(prev => prev.filter(warehouse => warehouse.id !== id));
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchWarehouses();
    }
  }, [autoFetch, branchId]);

  return {
    warehouses,
    loading,
    error,
    refetch: fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
}

export interface UseStockOptions {
  warehouseId?: string;
  productId?: string;
  autoFetch?: boolean;
}

export interface UseStockReturn {
  stockLevels: StockLevel[];
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  refetchStock: () => Promise<void>;
  refetchMovements: () => Promise<void>;
  logMovement: (movement: any) => Promise<boolean>;
  getLowStockAlerts: (threshold?: number) => Promise<StockLevel[]>;
  getOutOfStockItems: () => Promise<StockLevel[]>;
}

export function useStock(options: UseStockOptions = {}): UseStockReturn {
  const { warehouseId, productId, autoFetch = true } = options;
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStockLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = { warehouseId, productId };
      const data = await WarehouseService.getStockLevels(filters);
      setStockLevels(data);
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
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = { warehouseId, productId };
      const data = await WarehouseService.getMovementHistory(filters);
      setMovements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movements';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logMovement = async (movement: any): Promise<boolean> => {
    try {
      setLoading(true);
      await WarehouseService.logStockMovement(movement);
      // Refresh both stock levels and movements after logging
      await Promise.all([fetchStockLevels(), fetchMovements()]);
      toast({
        title: 'Success',
        description: 'Stock movement logged successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log movement';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getLowStockAlerts = async (threshold: number = 5): Promise<StockLevel[]> => {
    try {
      return await WarehouseService.getLowStockAlerts(threshold);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get low stock alerts';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  const getOutOfStockItems = async (): Promise<StockLevel[]> => {
    try {
      return await WarehouseService.getOutOfStockItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get out of stock items';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchStockLevels();
      fetchMovements();
    }
  }, [autoFetch, warehouseId, productId]);

  return {
    stockLevels,
    movements,
    loading,
    error,
    refetchStock: fetchStockLevels,
    refetchMovements: fetchMovements,
    logMovement,
    getLowStockAlerts,
    getOutOfStockItems,
  };
}

export interface UseWarehouseSummaryOptions {
  warehouseId: string;
  autoFetch?: boolean;
}

export interface WarehouseSummary {
  totalProducts: number;
  totalQuantity: number;
  availableQuantity: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface UseWarehouseSummaryReturn {
  summary: WarehouseSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWarehouseSummary(options: UseWarehouseSummaryOptions): UseWarehouseSummaryReturn {
  const { warehouseId, autoFetch = true } = options;
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WarehouseService.getWarehouseSummary(warehouseId);
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouse summary';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && warehouseId) {
      fetchSummary();
    }
  }, [autoFetch, warehouseId]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}