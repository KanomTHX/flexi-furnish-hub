// Simple warehouse service
export class WarehouseService {
  static async getWarehouses() {
    return [
      { id: '1', name: 'คลังหลัก', location: 'กรุงเทพฯ', status: 'active' },
      { id: '2', name: 'คลังสาขา', location: 'เชียงใหม่', status: 'active' }
    ];
  }

  static async getStockLevel(warehouseId?: string) { return []; }
  static async getStockLevels(warehouseId?: string) { return { data: [], total: 0 }; }
  static async getStockMovements(warehouseId?: string) { return { data: [], total: 0 }; }
  static async getSerialNumbers(productId?: string) { return { data: [], total: 0 }; }
  static async getMovementHistory(warehouseId?: string) { return []; }
  static async logStockMovement(movement: any) { return {}; }
  static async withdrawGoods(items: any) { return {}; }
  static async receiveGoods(items: any) { return {}; }
  static async getWarehouseSummary(warehouseId?: string) { return { totalProducts: 0, totalQuantity: 0, availableQuantity: 0, totalValue: 0, lowStockItems: 0, outOfStockItems: 0 }; }
  static async getLowStockAlerts(warehouseId?: string) { return []; }
  static async getOutOfStockItems(warehouseId?: string) { return []; }
  static async createWarehouse(data: any) { return { id: '1', ...data }; }
  static async updateWarehouse(id: string, data: any) { return { id, ...data }; }
  static async deleteWarehouse(id: string) { return true; }
  static async getWarehouseById(id: string) { return { id, name: 'คลัง', status: 'active' }; }
}

export default WarehouseService;