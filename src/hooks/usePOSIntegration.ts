import { useState, useCallback } from 'react';
import { posIntegrationService, POSStockCheckRequest, POSSaleRequest } from '../services/posIntegrationService';
import { Sale } from '../types/pos';

export function usePOSIntegration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStockAvailability = useCallback(async (request: POSStockCheckRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.checkStockAvailability(request);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        availability: [],
        error: 'AVAILABILITY_CHECK_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const processPOSSale = useCallback(async (request: POSSaleRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.processPOSSale(request);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        processedItems: [],
        error: 'POS_SALE_PROCESSING_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const reserveStock = useCallback(async (request: {
    reservationId: string;
    items: { productId: string; quantity: number; }[];
    warehouseId: string;
    reservedBy: string;
    expiresAt?: Date;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.reserveStock(request);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        reservedSerialNumbers: [],
        error: 'RESERVATION_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const releaseReservedStock = useCallback(async (reservationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.releaseReservedStock(reservationId);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: 'RELEASE_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getStockLevelsForPOS = useCallback(async (warehouseId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.getStockLevelsForPOS(warehouseId);
      
      if (!result.success) {
        setError(result.error || 'Failed to get stock levels');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        stockLevels: [],
        error: 'STOCK_LEVELS_FETCH_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaleCompletion = useCallback(async (sale: Sale) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await posIntegrationService.handlePOSSaleCompletion(sale);
      
      if (!result.success) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        processedItems: [],
        error: 'SALE_COMPLETION_FAILED'
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    checkStockAvailability,
    processPOSSale,
    reserveStock,
    releaseReservedStock,
    getStockLevelsForPOS,
    handleSaleCompletion
  };
}