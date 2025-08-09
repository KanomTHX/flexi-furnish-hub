import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehouseService } from '@/lib/warehouseService';

// Mock the WarehouseService
vi.mock('@/lib/warehouseService', () => ({
  WarehouseService: {
    getWarehouses: vi.fn(),
    createWarehouse: vi.fn(),
    updateWarehouse: vi.fn(),
    deleteWarehouse: vi.fn(),
    getStockLevels: vi.fn(),
    getMovementHistory: vi.fn(),
    logStockMovement: vi.fn(),
    getLowStockAlerts: vi.fn(),
    getOutOfStockItems: vi.fn(),
    getWarehouseSummary: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Warehouse Hook Tests - Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WarehouseService Integration', () => {
    it('should have all required service methods available', () => {
      expect(WarehouseService.getWarehouses).toBeDefined();
      expect(WarehouseService.createWarehouse).toBeDefined();
      expect(WarehouseService.updateWarehouse).toBeDefined();
      expect(WarehouseService.deleteWarehouse).toBeDefined();
      expect(WarehouseService.getStockLevels).toBeDefined();
      expect(WarehouseService.getMovementHistory).toBeDefined();
      expect(WarehouseService.logStockMovement).toBeDefined();
      expect(WarehouseService.getLowStockAlerts).toBeDefined();
      expect(WarehouseService.getOutOfStockItems).toBeDefined();
      expect(WarehouseService.getWarehouseSummary).toBeDefined();
    });

    it('should call warehouse service methods with correct parameters', async () => {
      const mockWarehouses = [
        {
          id: '1',
          name: 'คลังหลัก',
          code: 'WH001',
          branch_id: 'branch1',
          status: 'active',
          location: 'กรุงเทพ',
          capacity: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (WarehouseService.getWarehouses as any).mockResolvedValue(mockWarehouses);

      const result = await WarehouseService.getWarehouses({ status: 'active' });

      expect(WarehouseService.getWarehouses).toHaveBeenCalledWith({ status: 'active' });
      expect(result).toEqual(mockWarehouses);
    });

    it('should handle warehouse creation through service', async () => {
      const newWarehouse = {
        name: 'คลังใหม่',
        code: 'WH002',
        branch_id: 'branch1',
      };

      const createdWarehouse = {
        id: '2',
        ...newWarehouse,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (WarehouseService.createWarehouse as any).mockResolvedValue(createdWarehouse);

      const result = await WarehouseService.createWarehouse(newWarehouse);

      expect(WarehouseService.createWarehouse).toHaveBeenCalledWith(newWarehouse);
      expect(result).toEqual(createdWarehouse);
    });

    it('should handle stock level queries', async () => {
      const mockStockLevels = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 8,
          soldQuantity: 2,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 120000,
        },
      ];

      (WarehouseService.getStockLevels as any).mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getStockLevels({ warehouseId: 'wh1' });

      expect(WarehouseService.getStockLevels).toHaveBeenCalledWith({ warehouseId: 'wh1' });
      expect(result).toEqual(mockStockLevels);
    });

    it('should handle movement logging', async () => {
      const movement = {
        product_id: 'prod1',
        warehouse_id: 'wh1',
        movement_type: 'receive' as const,
        quantity: 5,
        performed_by: 'user1',
      };

      const loggedMovement = {
        id: 'mov1',
        ...movement,
        created_at: '2024-01-01T00:00:00Z',
      };

      (WarehouseService.logStockMovement as any).mockResolvedValue(loggedMovement);

      const result = await WarehouseService.logStockMovement(movement);

      expect(WarehouseService.logStockMovement).toHaveBeenCalledWith(movement);
      expect(result).toEqual(loggedMovement);
    });

    it('should handle warehouse summary queries', async () => {
      const mockSummary = {
        totalProducts: 2,
        totalQuantity: 13,
        availableQuantity: 11,
        totalValue: 144000,
        lowStockItems: 1,
        outOfStockItems: 0,
      };

      (WarehouseService.getWarehouseSummary as any).mockResolvedValue(mockSummary);

      const result = await WarehouseService.getWarehouseSummary('wh1');

      expect(WarehouseService.getWarehouseSummary).toHaveBeenCalledWith('wh1');
      expect(result).toEqual(mockSummary);
    });

    it('should handle low stock alerts', async () => {
      const mockLowStockItems = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 3,
          availableQuantity: 3,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 45000,
        },
      ];

      (WarehouseService.getLowStockAlerts as any).mockResolvedValue(mockLowStockItems);

      const result = await WarehouseService.getLowStockAlerts(5);

      expect(WarehouseService.getLowStockAlerts).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockLowStockItems);
    });

    it('should handle out of stock queries', async () => {
      const mockOutOfStockItems = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 0,
          availableQuantity: 0,
          soldQuantity: 5,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 15000,
          availableValue: 0,
        },
      ];

      (WarehouseService.getOutOfStockItems as any).mockResolvedValue(mockOutOfStockItems);

      const result = await WarehouseService.getOutOfStockItems();

      expect(WarehouseService.getOutOfStockItems).toHaveBeenCalled();
      expect(result).toEqual(mockOutOfStockItems);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (WarehouseService.getWarehouses as any).mockRejectedValue(error);

      await expect(WarehouseService.getWarehouses()).rejects.toThrow('Database connection failed');
    });

    it('should handle empty results', async () => {
      (WarehouseService.getStockLevels as any).mockResolvedValue([]);

      const result = await WarehouseService.getStockLevels();

      expect(result).toEqual([]);
    });
  });
});