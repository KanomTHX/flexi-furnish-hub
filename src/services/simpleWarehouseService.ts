// Simple warehouse service
export class WarehouseService {
  static async getWarehouses() {
    return [
      { id: '1', name: 'คลังหลัก', location: 'กรุงเทพฯ', status: 'active' },
      { id: '2', name: 'คลังสาขา', location: 'เชียงใหม่', status: 'active' }
    ];
  }

  static async getStockLevel() { return []; }
  static async getStockLevels() { return { data: [], total: 0 }; }
  static async getStockMovements() { return { data: [], total: 0 }; }
  static async getSerialNumbers() { return { data: [], total: 0 }; }
  static async getMovementHistory() { return []; }
  static async logStockMovement() { return {}; }
  static async withdrawGoods() { return {}; }
  static async getWarehouseSummary() { return { totalProducts: 0, totalQuantity: 0, availableQuantity: 0, totalValue: 0, lowStockItems: 0, outOfStockItems: 0 }; }
  static async getLowStockAlerts() { return []; }
  static async getOutOfStockItems() { return []; }
  static async createWarehouse(data: any) { return { id: '1', ...data }; }
  static async updateWarehouse(id: string, data: any) { return { id, ...data }; }
  static async deleteWarehouse() { return true; }
  static async getWarehouseById(id: string) { return { id, name: 'คลัง', status: 'active' }; }
}

export default WarehouseService;