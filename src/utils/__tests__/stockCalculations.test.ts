import { describe, it, expect } from 'vitest';
import {
  calculateStockFromSerialNumbers,
  calculateAvailableStock,
  calculateReservedStock,
  calculateTotalStockValue,
  calculateStockStatus,
  calculateStockTurnover,
  calculateDaysOfSupply,
  calculateMovementVelocity,
  calculateStockAccuracy,
  calculateReorderPoint,
  calculateEOQ,
  calculateABCClassification,
  calculateStockVariance,
  calculateSafetyStock,
  calculateStockAging,
  formatCurrency,
  formatPercentage,
  formatQuantity
} from '../stockCalculations';
import type { SerialNumber, StockLevel, StockMovement } from '@/types/warehouseStock';

// Mock data
const mockSerialNumbers: SerialNumber[] = [
  {
    id: '1',
    serialNumber: 'SN001',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 100,
    status: 'available',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    serialNumber: 'SN002',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 120,
    status: 'available',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: '3',
    serialNumber: 'SN003',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 110,
    status: 'sold',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: '4',
    serialNumber: 'SN004',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 105,
    status: 'transferred',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  },
  {
    id: '5',
    serialNumber: 'SN005',
    productId: 'prod1',
    warehouseId: 'wh1',
    unitCost: 115,
    status: 'claimed',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  }
];

const mockStockLevel: StockLevel = {
  productId: 'prod1',
  productName: 'Test Product',
  productCode: 'TP001',
  warehouseId: 'wh1',
  warehouseName: 'Test Warehouse',
  warehouseCode: 'WH001',
  totalQuantity: 10,
  availableQuantity: 5,
  soldQuantity: 2,
  transferredQuantity: 1,
  claimedQuantity: 1,
  damagedQuantity: 1,
  reservedQuantity: 0,
  averageCost: 100,
  availableValue: 500
};

const mockStockLevels: StockLevel[] = [
  {
    ...mockStockLevel,
    productId: 'prod1',
    availableValue: 1000
  },
  {
    ...mockStockLevel,
    productId: 'prod2',
    availableValue: 500
  },
  {
    ...mockStockLevel,
    productId: 'prod3',
    availableValue: 300
  },
  {
    ...mockStockLevel,
    productId: 'prod4',
    availableValue: 200
  }
];

const mockMovements: StockMovement[] = [
  {
    id: '1',
    productId: 'prod1',
    warehouseId: 'wh1',
    movementType: 'receive',
    quantity: 5,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    productId: 'prod1',
    warehouseId: 'wh1',
    movementType: 'withdraw',
    quantity: -2,
    createdAt: new Date('2024-01-02')
  },
  {
    id: '3',
    productId: 'prod1',
    warehouseId: 'wh1',
    movementType: 'transfer_out',
    quantity: -1,
    createdAt: new Date('2024-01-03')
  }
] as StockMovement[];

describe('stockCalculations', () => {
  describe('calculateStockFromSerialNumbers', () => {
    it('should calculate stock correctly from serial numbers', () => {
      const result = calculateStockFromSerialNumbers(mockSerialNumbers);
      
      expect(result.totalQuantity).toBe(5);
      expect(result.availableQuantity).toBe(2);
      expect(result.soldQuantity).toBe(1);
      expect(result.transferredQuantity).toBe(1);
      expect(result.claimedQuantity).toBe(1);
      expect(result.averageCost).toBe(110); // (100+120+110+105+115)/5
      expect(result.totalValue).toBe(220); // 2 available * 110 average cost
    });

    it('should handle empty serial numbers array', () => {
      const result = calculateStockFromSerialNumbers([]);
      
      expect(result.totalQuantity).toBe(0);
      expect(result.availableQuantity).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.averageCost).toBe(0);
    });
  });

  describe('calculateAvailableStock', () => {
    it('should calculate available stock correctly', () => {
      const available = calculateAvailableStock(mockStockLevel);
      expect(available).toBe(5); // 10 - 2 - 1 - 1 - 1 = 5
    });

    it('should not return negative values', () => {
      const stockLevel = {
        ...mockStockLevel,
        totalQuantity: 5,
        soldQuantity: 3,
        transferredQuantity: 2,
        claimedQuantity: 1,
        damagedQuantity: 1
      };
      
      const available = calculateAvailableStock(stockLevel);
      expect(available).toBe(0); // Should be 0, not negative
    });
  });

  describe('calculateReservedStock', () => {
    it('should calculate reserved stock correctly', () => {
      const reserved = calculateReservedStock(10, 5, 2, 1, 1, 1);
      expect(reserved).toBe(0); // 10 - (5+2+1+1+1) = 0
    });

    it('should handle cases where total is less than accounted', () => {
      const reserved = calculateReservedStock(8, 5, 2, 1, 1, 1);
      expect(reserved).toBe(0); // Should not be negative
    });

    it('should calculate positive reserved stock', () => {
      const reserved = calculateReservedStock(12, 5, 2, 1, 1, 1);
      expect(reserved).toBe(2); // 12 - (5+2+1+1+1) = 2
    });
  });

  describe('calculateTotalStockValue', () => {
    it('should calculate total stock value correctly', () => {
      const value = calculateTotalStockValue(10, 100);
      expect(value).toBe(1000);
    });

    it('should handle zero quantities', () => {
      const value = calculateTotalStockValue(0, 100);
      expect(value).toBe(0);
    });
  });

  describe('calculateStockStatus', () => {
    it('should return out_of_stock for zero quantity', () => {
      const status = calculateStockStatus(0);
      expect(status.status).toBe('out_of_stock');
      expect(status.isOutOfStock).toBe(true);
      expect(status.alertLevel).toBe('critical');
    });

    it('should return low_stock for quantities at or below threshold', () => {
      const status = calculateStockStatus(3, 5);
      expect(status.status).toBe('low_stock');
      expect(status.isLowStock).toBe(true);
      expect(status.alertLevel).toBe('warning');
    });

    it('should return in_stock for normal quantities', () => {
      const status = calculateStockStatus(10, 5);
      expect(status.status).toBe('in_stock');
      expect(status.isLowStock).toBe(false);
      expect(status.isOutOfStock).toBe(false);
      expect(status.alertLevel).toBe('none');
    });

    it('should return overstock when above max threshold', () => {
      const status = calculateStockStatus(100, 5, 50);
      expect(status.status).toBe('overstock');
      expect(status.isOverstock).toBe(true);
      expect(status.alertLevel).toBe('warning');
    });
  });

  describe('calculateStockTurnover', () => {
    it('should calculate turnover rate correctly', () => {
      const turnover = calculateStockTurnover(60, 10, 30); // 60 sold in 30 days, avg stock 10
      expect(turnover).toBe(73); // (60/30) * 365 / 10 = 73
    });

    it('should handle zero average stock', () => {
      const turnover = calculateStockTurnover(60, 0, 30);
      expect(turnover).toBe(0);
    });
  });

  describe('calculateDaysOfSupply', () => {
    it('should calculate days of supply correctly', () => {
      const days = calculateDaysOfSupply(30, 2); // 30 available, 2 per day
      expect(days).toBe(15);
    });

    it('should return Infinity for zero daily sales', () => {
      const days = calculateDaysOfSupply(30, 0);
      expect(days).toBe(Infinity);
    });
  });

  describe('calculateMovementVelocity', () => {
    it('should calculate movement velocity correctly', () => {
      // Create movements within the last 30 days
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago
      
      const recentMovements: StockMovement[] = [
        {
          id: '1',
          productId: 'prod1',
          warehouseId: 'wh1',
          movementType: 'receive',
          quantity: 5,
          createdAt: recentDate
        },
        {
          id: '2',
          productId: 'prod1',
          warehouseId: 'wh1',
          movementType: 'withdraw',
          quantity: -2,
          createdAt: recentDate
        }
      ] as StockMovement[];
      
      const velocity = calculateMovementVelocity(recentMovements, 30);
      const totalMovement = 5 + 2; // Sum of absolute quantities
      expect(velocity).toBe(totalMovement / 30);
    });

    it('should handle empty movements array', () => {
      const velocity = calculateMovementVelocity([], 30);
      expect(velocity).toBe(0);
    });
  });

  describe('calculateStockAccuracy', () => {
    it('should calculate 100% accuracy for matching quantities', () => {
      const accuracy = calculateStockAccuracy(10, 10);
      expect(accuracy).toBe(100);
    });

    it('should calculate accuracy for different quantities', () => {
      const accuracy = calculateStockAccuracy(10, 8);
      expect(accuracy).toBe(80); // min(8,10) / max(8,10) * 100
    });

    it('should handle zero system quantity', () => {
      const accuracy = calculateStockAccuracy(0, 5);
      expect(accuracy).toBe(0);
    });

    it('should handle both zero quantities', () => {
      const accuracy = calculateStockAccuracy(0, 0);
      expect(accuracy).toBe(100);
    });
  });

  describe('calculateReorderPoint', () => {
    it('should calculate reorder point correctly', () => {
      const reorderPoint = calculateReorderPoint(2, 10, 7); // 2/day, 10 days lead time, 7 days safety
      expect(reorderPoint).toBe(34); // 2 * (10 + 7) = 34
    });
  });

  describe('calculateEOQ', () => {
    it('should calculate EOQ correctly', () => {
      const eoq = calculateEOQ(1000, 50, 2); // 1000 annual demand, 50 ordering cost, 2 holding cost
      const expected = Math.sqrt((2 * 1000 * 50) / 2);
      expect(eoq).toBe(expected);
    });

    it('should handle zero holding cost', () => {
      const eoq = calculateEOQ(1000, 50, 0);
      expect(eoq).toBe(0);
    });
  });

  describe('calculateABCClassification', () => {
    it('should classify products correctly', () => {
      const classification = calculateABCClassification(mockStockLevels);
      
      expect(classification).toHaveLength(4);
      expect(classification[0].classification).toBe('A'); // Highest value product
      expect(classification[0].productId).toBe('prod1');
      
      // Check that percentages add up to 100
      const totalPercentage = classification.reduce((sum, item) => sum + item.percentage, 0);
      expect(Math.round(totalPercentage)).toBe(100);
    });

    it('should handle empty stock levels', () => {
      const classification = calculateABCClassification([]);
      expect(classification).toHaveLength(0);
    });
  });

  describe('calculateStockVariance', () => {
    it('should calculate positive variance correctly', () => {
      const variance = calculateStockVariance(10, 12);
      expect(variance.variance).toBe(2);
      expect(variance.variancePercentage).toBe(20);
      expect(variance.varianceType).toBe('positive');
    });

    it('should calculate negative variance correctly', () => {
      const variance = calculateStockVariance(10, 8);
      expect(variance.variance).toBe(-2);
      expect(variance.variancePercentage).toBe(-20);
      expect(variance.varianceType).toBe('negative');
    });

    it('should handle zero variance', () => {
      const variance = calculateStockVariance(10, 10);
      expect(variance.variance).toBe(0);
      expect(variance.variancePercentage).toBe(0);
      expect(variance.varianceType).toBe('none');
    });

    it('should handle zero system quantity', () => {
      const variance = calculateStockVariance(0, 5);
      expect(variance.variancePercentage).toBe(0);
    });
  });

  describe('calculateSafetyStock', () => {
    it('should calculate safety stock correctly', () => {
      const safetyStock = calculateSafetyStock(10, 15, 7, 10);
      expect(safetyStock).toBe(80); // (15 * 10) - (10 * 7) = 150 - 70 = 80
    });
  });

  describe('calculateStockAging', () => {
    it('should calculate stock aging correctly', () => {
      // Create serial numbers with recent dates
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago
      
      const recentSerialNumbers: SerialNumber[] = [
        {
          id: '1',
          serialNumber: 'SN001',
          productId: 'prod1',
          warehouseId: 'wh1',
          unitCost: 100,
          status: 'available',
          createdAt: recentDate,
          updatedAt: recentDate
        },
        {
          id: '2',
          serialNumber: 'SN002',
          productId: 'prod1',
          warehouseId: 'wh1',
          unitCost: 120,
          status: 'available',
          createdAt: recentDate,
          updatedAt: recentDate
        }
      ];
      
      const aging = calculateStockAging(recentSerialNumbers);
      
      // All available items should be in 0-30 days category
      expect(aging['0-30']).toBe(2); // 2 available items
      expect(aging['31-60']).toBe(0);
      expect(aging['61-90']).toBe(0);
      expect(aging['90+']).toBe(0);
    });

    it('should only count available items', () => {
      const aging = calculateStockAging(mockSerialNumbers);
      const totalAging = aging['0-30'] + aging['31-60'] + aging['61-90'] + aging['90+'];
      const availableCount = mockSerialNumbers.filter(sn => sn.status === 'available').length;
      expect(totalAging).toBe(availableCount);
    });
  });

  describe('formatting functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        const formatted = formatCurrency(1234.56);
        expect(formatted).toMatch(/1,234\.56/); // Should contain formatted number
      });
    });

    describe('formatPercentage', () => {
      it('should format percentage correctly', () => {
        const formatted = formatPercentage(12.345, 2);
        expect(formatted).toBe('12.35%');
      });

      it('should use default decimal places', () => {
        const formatted = formatPercentage(12.345);
        expect(formatted).toBe('12.3%');
      });
    });

    describe('formatQuantity', () => {
      it('should format quantity correctly', () => {
        const formatted = formatQuantity(1234);
        expect(formatted).toMatch(/1,234/); // Should contain formatted number
      });
    });
  });
});