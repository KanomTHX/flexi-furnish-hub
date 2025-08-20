// Placeholder warehouse stock service for compatibility
import { supabase } from '@/integrations/supabase/client';
import { 
  StockLevel, 
  SerialNumber, 
  StockMovement, 
  StockAlert,
  StockSearchFilters,
  MovementType
} from '@/types/warehouseStock';

// Placeholder service that returns empty data since warehouse tables don't exist
export const warehouseStockService = {
  async getStockLevels(filters?: Partial<StockSearchFilters>): Promise<StockLevel[]> {
    return [];
  },

  async getSerialNumbers(filters?: { branchId?: string; productId?: string; status?: string }): Promise<SerialNumber[]> {
    return [];
  },

  async addSerialNumber(serialNumber: Omit<SerialNumber, 'id' | 'created_at' | 'updated_at'>): Promise<SerialNumber> {
    throw new Error('Serial number functionality not available');
  },

  async updateSerialNumberStatus(id: string, status: string, notes?: string): Promise<void> {
    throw new Error('Serial number functionality not available');
  },

  async getAvailableSerialNumbers(branchId: string, productId?: string): Promise<SerialNumber[]> {
    return [];
  },

  async getStockMovements(filters?: { branchId?: string; productId?: string; type?: MovementType }): Promise<StockMovement[]> {
    return [];
  },

  async logStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<string> {
    throw new Error('Stock movement functionality not available');
  },

  async getStockAlerts(): Promise<StockAlert[]> {
    return [];
  },

  async getLowStockAlerts(threshold: number = 5): Promise<StockAlert[]> {
    return [];
  },

  async getOutOfStockAlerts(): Promise<StockAlert[]> {
    return [];
  },

  async getStockSummary(branchId?: string): Promise<{
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    return {
      totalProducts: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };
  }
};