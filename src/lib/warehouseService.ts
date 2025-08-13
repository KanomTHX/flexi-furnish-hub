// Placeholder warehouse service for compatibility
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  capacity?: number;
  status: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minThreshold: number;
  maxThreshold: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  type: 'receive' | 'withdraw' | 'transfer' | 'adjust';
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  timestamp: string;
  userId: string;
  userName: string;
  notes?: string;
}

export const WarehouseService = {
  async getWarehouses(filters?: any): Promise<Warehouse[]> {
    return [];
  },

  async createWarehouse(warehouse: any): Promise<Warehouse> {
    throw new Error('Warehouse functionality not available');
  },

  async updateWarehouse(id: string, updates: any): Promise<Warehouse> {
    throw new Error('Warehouse functionality not available');
  },

  async deleteWarehouse(id: string): Promise<void> {
    throw new Error('Warehouse functionality not available');
  },

  async getStockLevels(filters?: any): Promise<StockLevel[]> {
    return [];
  },

  async getMovementHistory(filters?: any): Promise<StockMovement[]> {
    return [];
  },

  async logStockMovement(movement: any): Promise<void> {
    throw new Error('Stock movement functionality not available');
  },

  async getLowStockAlerts(threshold?: number): Promise<StockLevel[]> {
    return [];
  },

  async getOutOfStockItems(): Promise<StockLevel[]> {
    return [];
  },

  async getWarehouseSummary(warehouseId: string): Promise<any> {
    return {
      totalProducts: 0,
      totalQuantity: 0,
      availableQuantity: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };
  }
};