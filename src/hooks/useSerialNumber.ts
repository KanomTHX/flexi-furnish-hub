import { useState, useEffect, useCallback } from 'react';
import { SerialNumberService } from '@/services/serialNumberService';
import type {
  SerialNumber,
  SerialNumberHistory,
  SerialNumberFilter,
  SerialNumberStats,
  CreateSerialNumberRequest,
  UpdateSerialNumberRequest,
  UpdateSerialNumberStatusRequest,
  TransferSerialNumberRequest,
  BulkUpdateSerialNumberRequest,
  SerialNumberSearchResult,
  WarehouseZone,
  WarehouseShelf,
} from '@/types/serialNumber';

interface UseSerialNumberOptions {
  warehouseId?: string;
  productId?: string;
  autoFetch?: boolean;
}

interface UseSerialNumberReturn {
  // Data
  serialNumbers: SerialNumber[];
  selectedSerialNumber: SerialNumber | null;
  history: SerialNumberHistory[];
  stats: SerialNumberStats;
  zones: WarehouseZone[];
  shelves: WarehouseShelf[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSerialNumbers: (filter?: SerialNumberFilter) => Promise<void>;
  getSerialNumberById: (id: string) => Promise<SerialNumber | null>;
  searchByBarcode: (barcode: string) => Promise<SerialNumberSearchResult>;
  createSerialNumbers: (request: CreateSerialNumberRequest) => Promise<SerialNumber[]>;
  updateSerialNumber: (id: string, request: UpdateSerialNumberRequest) => Promise<SerialNumber>;
  updateSerialNumberStatus: (id: string, request: UpdateSerialNumberStatusRequest) => Promise<SerialNumber>;
  transferSerialNumbers: (request: TransferSerialNumberRequest) => Promise<SerialNumber[]>;
  bulkUpdateSerialNumbers: (request: BulkUpdateSerialNumberRequest) => Promise<SerialNumber[]>;
  getHistory: (serialNumberId: string) => Promise<void>;
  getStats: (filter?: SerialNumberFilter) => Promise<void>;
  getZones: (warehouseId: string) => Promise<void>;
  getShelves: (zoneId: string) => Promise<void>;
  exportSerialNumbers: (filter?: SerialNumberFilter) => Promise<string>;
  generateSerialNumbers: (prefix: string, count: number, startNumber?: number) => string[];
  
  // Utilities
  setSelectedSerialNumber: (serialNumber: SerialNumber | null) => void;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useSerialNumber(options: UseSerialNumberOptions = {}): UseSerialNumberReturn {
  const { warehouseId, productId, autoFetch = true } = options;
  
  // State
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<SerialNumber | null>(null);
  const [history, setHistory] = useState<SerialNumberHistory[]>([]);
  const [stats, setStats] = useState<SerialNumberStats>({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    installment: 0,
    claimed: 0,
    damaged: 0,
    transferred: 0,
    returned: 0,
    maintenance: 0,
    disposed: 0,
  });
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [shelves, setShelves] = useState<WarehouseShelf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current filter
  const [currentFilter, setCurrentFilter] = useState<SerialNumberFilter>({
    warehouseId,
    productId,
  });

  /**
   * Fetch serial numbers
   */
  const fetchSerialNumbers = useCallback(async (filter?: SerialNumberFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const appliedFilter = filter || currentFilter;
      setCurrentFilter(appliedFilter);
      
      const data = await SerialNumberService.getSerialNumbers(appliedFilter);
      setSerialNumbers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch serial numbers';
      setError(errorMessage);
      console.error('Error fetching serial numbers:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  /**
   * Get serial number by ID
   */
  const getSerialNumberById = useCallback(async (id: string): Promise<SerialNumber | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.getSerialNumberById(id);
      if (data) {
        setSelectedSerialNumber(data);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch serial number';
      setError(errorMessage);
      console.error('Error fetching serial number:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search by barcode
   */
  const searchByBarcode = useCallback(async (barcode: string): Promise<SerialNumberSearchResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SerialNumberService.searchByBarcode(barcode);
      if (result.found && result.serialNumber) {
        setSelectedSerialNumber(result.serialNumber);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search serial number';
      setError(errorMessage);
      console.error('Error searching serial number:', err);
      return { found: false };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create serial numbers
   */
  const createSerialNumbers = useCallback(async (request: CreateSerialNumberRequest): Promise<SerialNumber[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.createSerialNumbers(request);
      
      // Refresh the list
      await fetchSerialNumbers();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create serial numbers';
      setError(errorMessage);
      console.error('Error creating serial numbers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSerialNumbers]);

  /**
   * Update serial number
   */
  const updateSerialNumber = useCallback(async (
    id: string,
    request: UpdateSerialNumberRequest
  ): Promise<SerialNumber> => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: This would need to be implemented in SerialNumberService
      // For now, we'll throw an error
      throw new Error('Update serial number not implemented yet');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update serial number';
      setError(errorMessage);
      console.error('Error updating serial number:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update serial number status
   */
  const updateSerialNumberStatus = useCallback(async (
    id: string,
    request: UpdateSerialNumberStatusRequest
  ): Promise<SerialNumber> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.updateSerialNumberStatus(id, request);
      
      // Update the serial number in the list
      setSerialNumbers(prev => 
        prev.map(sn => sn.id === id ? data : sn)
      );
      
      // Update selected serial number if it's the same one
      if (selectedSerialNumber?.id === id) {
        setSelectedSerialNumber(data);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update serial number status';
      setError(errorMessage);
      console.error('Error updating serial number status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedSerialNumber]);

  /**
   * Transfer serial numbers
   */
  const transferSerialNumbers = useCallback(async (request: TransferSerialNumberRequest): Promise<SerialNumber[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.transferSerialNumbers(request);
      
      // Refresh the list
      await fetchSerialNumbers();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer serial numbers';
      setError(errorMessage);
      console.error('Error transferring serial numbers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSerialNumbers]);

  /**
   * Bulk update serial numbers
   */
  const bulkUpdateSerialNumbers = useCallback(async (request: BulkUpdateSerialNumberRequest): Promise<SerialNumber[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.bulkUpdateSerialNumbers(request);
      
      // Refresh the list
      await fetchSerialNumbers();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update serial numbers';
      setError(errorMessage);
      console.error('Error bulk updating serial numbers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSerialNumbers]);

  /**
   * Get history
   */
  const getHistory = useCallback(async (serialNumberId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.getSerialNumberHistory(serialNumberId);
      setHistory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get stats
   */
  const getStats = useCallback(async (filter?: SerialNumberFilter) => {
    try {
      const appliedFilter = filter || currentFilter;
      const data = await SerialNumberService.getSerialNumberStats(appliedFilter);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [currentFilter]);

  /**
   * Get zones
   */
  const getZones = useCallback(async (warehouseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.getWarehouseZones(warehouseId);
      setZones(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch zones';
      setError(errorMessage);
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get shelves
   */
  const getShelves = useCallback(async (zoneId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SerialNumberService.getWarehouseShelves(zoneId);
      setShelves(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shelves';
      setError(errorMessage);
      console.error('Error fetching shelves:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export serial numbers
   */
  const exportSerialNumbers = useCallback(async (filter?: SerialNumberFilter): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      
      const appliedFilter = filter || currentFilter;
      const csvContent = await SerialNumberService.exportSerialNumbers(appliedFilter);
      return csvContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export serial numbers';
      setError(errorMessage);
      console.error('Error exporting serial numbers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  /**
   * Generate serial numbers
   */
  const generateSerialNumbers = useCallback((prefix: string, count: number, startNumber?: number): string[] => {
    return SerialNumberService.generateSerialNumbers(prefix, count, startNumber);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSerialNumbers(),
      getStats(),
    ]);
  }, [fetchSerialNumbers, getStats]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchSerialNumbers();
      getStats();
    }
  }, [autoFetch, warehouseId, productId]);

  // Auto-fetch zones when warehouse changes
  useEffect(() => {
    if (warehouseId) {
      getZones(warehouseId);
    }
  }, [warehouseId, getZones]);

  return {
    // Data
    serialNumbers,
    selectedSerialNumber,
    history,
    stats,
    zones,
    shelves,
    
    // State
    loading,
    error,
    
    // Actions
    fetchSerialNumbers,
    getSerialNumberById,
    searchByBarcode,
    createSerialNumbers,
    updateSerialNumber,
    updateSerialNumberStatus,
    transferSerialNumbers,
    bulkUpdateSerialNumbers,
    getHistory,
    getStats,
    getZones,
    getShelves,
    exportSerialNumbers,
    generateSerialNumbers,
    
    // Utilities
    setSelectedSerialNumber,
    clearError,
    refresh,
  };
}

// Specialized hooks for specific use cases

/**
 * Hook for warehouse-specific serial number management
 */
export function useWarehouseSerialNumbers(warehouseId: string) {
  return useSerialNumber({ warehouseId, autoFetch: true });
}

/**
 * Hook for product-specific serial number management
 */
export function useProductSerialNumbers(productId: string) {
  return useSerialNumber({ productId, autoFetch: true });
}

/**
 * Hook for serial number search and lookup
 */
export function useSerialNumberSearch() {
  return useSerialNumber({ autoFetch: false });
}

/**
 * Hook for serial number statistics
 */
export function useSerialNumberStats(filter?: SerialNumberFilter) {
  const [stats, setStats] = useState<SerialNumberStats>({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    installment: 0,
    claimed: 0,
    damaged: 0,
    transferred: 0,
    returned: 0,
    maintenance: 0,
    disposed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (newFilter?: SerialNumberFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const appliedFilter = newFilter || filter;
      const data = await SerialNumberService.getSerialNumberStats(appliedFilter);
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refresh: fetchStats,
  };
}