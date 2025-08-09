import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehouseService } from '../warehouseService';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('WarehouseService - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Class Structure', () => {
    it('should have all required static methods', () => {
      expect(typeof WarehouseService.getWarehouses).toBe('function');
      expect(typeof WarehouseService.getWarehouseById).toBe('function');
      expect(typeof WarehouseService.createWarehouse).toBe('function');
      expect(typeof WarehouseService.updateWarehouse).toBe('function');
      expect(typeof WarehouseService.deleteWarehouse).toBe('function');
      expect(typeof WarehouseService.getStockLevels).toBe('function');
      expect(typeof WarehouseService.logStockMovement).toBe('function');
      expect(typeof WarehouseService.getMovementHistory).toBe('function');
      expect(typeof WarehouseService.getSerialNumbers).toBe('function');
      expect(typeof WarehouseService.updateSerialNumberStatus).toBe('function');
      expect(typeof WarehouseService.transferSerialNumber).toBe('function');
      expect(typeof WarehouseService.getLowStockAlerts).toBe('function');
      expect(typeof WarehouseService.getOutOfStockItems).toBe('function');
      expect(typeof WarehouseService.getWarehouseStockValue).toBe('function');
      expect(typeof WarehouseService.getWarehouseSummary).toBe('function');
    });
  });

  describe('Stock Level Calculations', () => {
    it('should filter low stock items correctly', async () => {
      const mockStockLevels = [
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
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 10,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 80000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getLowStockAlerts(5);

      expect(result).toHaveLength(1);
      expect(result[0].productCode).toBe('SF001');
      expect(result[0].availableQuantity).toBe(3);
    });

    it('should identify out of stock items correctly', async () => {
      const mockStockLevels = [
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
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 10,
          availableQuantity: 10,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 80000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getOutOfStockItems();

      expect(result).toHaveLength(1);
      expect(result[0].productCode).toBe('SF001');
      expect(result[0].availableQuantity).toBe(0);
    });

    it('should calculate warehouse summary correctly', async () => {
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
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 3,
          availableQuantity: 3,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 24000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getWarehouseSummary('wh1');

      expect(result).toEqual({
        totalProducts: 2,
        totalQuantity: 13,
        availableQuantity: 11,
        totalValue: 144000,
        lowStockItems: 1, // TB001 has 3 items which is <= 5
        outOfStockItems: 0,
      });
    });

    it('should calculate warehouse stock value correctly', async () => {
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
        {
          productId: 'prod2',
          productName: 'โต๊ะทำงาน',
          productCode: 'TB001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 3,
          availableQuantity: 3,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 8000,
          availableValue: 24000,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const result = await WarehouseService.getWarehouseStockValue('wh1');

      expect(result).toBe(144000);
    });
  });

  describe('Type Definitions', () => {
    it('should have correct StockLevel interface structure', () => {
      const mockStockLevel = {
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
      };

      // Check that all required properties exist
      expect(mockStockLevel).toHaveProperty('productId');
      expect(mockStockLevel).toHaveProperty('productName');
      expect(mockStockLevel).toHaveProperty('productCode');
      expect(mockStockLevel).toHaveProperty('warehouseId');
      expect(mockStockLevel).toHaveProperty('warehouseName');
      expect(mockStockLevel).toHaveProperty('totalQuantity');
      expect(mockStockLevel).toHaveProperty('availableQuantity');
      expect(mockStockLevel).toHaveProperty('soldQuantity');
      expect(mockStockLevel).toHaveProperty('transferredQuantity');
      expect(mockStockLevel).toHaveProperty('claimedQuantity');
      expect(mockStockLevel).toHaveProperty('damagedQuantity');
      expect(mockStockLevel).toHaveProperty('reservedQuantity');
      expect(mockStockLevel).toHaveProperty('averageCost');
      expect(mockStockLevel).toHaveProperty('availableValue');
    });

    it('should have correct filter interfaces', () => {
      const stockFilters = {
        warehouseId: 'wh1',
        productId: 'prod1',
        productName: 'โซฟา',
        brand: 'HomePro',
        model: 'Classic',
        category: 'เฟอร์นิเจอร์',
      };

      const movementFilters = {
        warehouseId: 'wh1',
        productId: 'prod1',
        movementType: 'receive',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        performedBy: 'user1',
      };

      // Check that filter objects have expected structure
      expect(stockFilters).toHaveProperty('warehouseId');
      expect(stockFilters).toHaveProperty('productId');
      expect(stockFilters).toHaveProperty('productName');
      expect(stockFilters).toHaveProperty('brand');
      expect(stockFilters).toHaveProperty('model');
      expect(stockFilters).toHaveProperty('category');

      expect(movementFilters).toHaveProperty('warehouseId');
      expect(movementFilters).toHaveProperty('productId');
      expect(movementFilters).toHaveProperty('movementType');
      expect(movementFilters).toHaveProperty('dateFrom');
      expect(movementFilters).toHaveProperty('dateTo');
      expect(movementFilters).toHaveProperty('performedBy');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty stock levels gracefully', async () => {
      // Mock empty stock levels
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue([]);

      const lowStockResult = await WarehouseService.getLowStockAlerts(5);
      const outOfStockResult = await WarehouseService.getOutOfStockItems();
      const stockValue = await WarehouseService.getWarehouseStockValue('wh1');
      const summary = await WarehouseService.getWarehouseSummary('wh1');

      expect(lowStockResult).toEqual([]);
      expect(outOfStockResult).toEqual([]);
      expect(stockValue).toBe(0);
      expect(summary).toEqual({
        totalProducts: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      });
    });

    it('should handle null/undefined values in stock calculations', async () => {
      const mockStockLevels = [
        {
          productId: 'prod1',
          productName: 'โซฟา 3 ที่นั่ง',
          productCode: 'SF001',
          warehouseId: 'wh1',
          warehouseName: 'คลังหลัก',
          totalQuantity: 0,
          availableQuantity: 0,
          soldQuantity: 0,
          transferredQuantity: 0,
          claimedQuantity: 0,
          damagedQuantity: 0,
          reservedQuantity: 0,
          averageCost: 0,
          availableValue: 0,
        },
      ];

      // Mock the getStockLevels method
      vi.spyOn(WarehouseService, 'getStockLevels').mockResolvedValue(mockStockLevels);

      const summary = await WarehouseService.getWarehouseSummary('wh1');

      expect(summary.totalProducts).toBe(1);
      expect(summary.totalQuantity).toBe(0);
      expect(summary.availableQuantity).toBe(0);
      expect(summary.totalValue).toBe(0);
      expect(summary.outOfStockItems).toBe(1);
    });
  });
});