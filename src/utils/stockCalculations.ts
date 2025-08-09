/**
 * Stock Calculation Helper Functions
 * Provides utility functions for calculating stock levels, values, and status
 */

import type { StockLevel, SerialNumber, StockMovement } from '@/types/warehouseStock';

export interface StockCalculationResult {
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  transferredQuantity: number;
  claimedQuantity: number;
  damagedQuantity: number;
  totalValue: number;
  averageCost: number;
}

export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  isLowStock: boolean;
  isOutOfStock: boolean;
  isOverstock: boolean;
  alertLevel: 'none' | 'warning' | 'critical';
}

/**
 * Calculate stock quantities from serial numbers
 */
export function calculateStockFromSerialNumbers(
  serialNumbers: SerialNumber[]
): StockCalculationResult {
  const result: StockCalculationResult = {
    totalQuantity: serialNumbers.length,
    availableQuantity: 0,
    reservedQuantity: 0,
    soldQuantity: 0,
    transferredQuantity: 0,
    claimedQuantity: 0,
    damagedQuantity: 0,
    totalValue: 0,
    averageCost: 0
  };

  if (serialNumbers.length === 0) {
    return result;
  }

  // Count quantities by status
  serialNumbers.forEach(sn => {
    switch (sn.status) {
      case 'available':
        result.availableQuantity++;
        break;
      case 'sold':
        result.soldQuantity++;
        break;
      case 'transferred':
        result.transferredQuantity++;
        break;
      case 'claimed':
        result.claimedQuantity++;
        break;
      case 'damaged':
        result.damagedQuantity++;
        break;
      default:
        result.availableQuantity++;
    }
  });

  // Calculate total value and average cost
  const totalCost = serialNumbers.reduce((sum, sn) => sum + sn.unitCost, 0);
  result.averageCost = totalCost / serialNumbers.length;
  result.totalValue = result.availableQuantity * result.averageCost;

  return result;
}

/**
 * Calculate available stock (total - sold - transferred - claimed - damaged)
 */
export function calculateAvailableStock(stockLevel: StockLevel): number {
  return Math.max(0, 
    stockLevel.totalQuantity - 
    stockLevel.soldQuantity - 
    stockLevel.transferredQuantity - 
    stockLevel.claimedQuantity - 
    stockLevel.damagedQuantity
  );
}

/**
 * Calculate reserved stock (items that are allocated but not yet sold)
 */
export function calculateReservedStock(
  totalQuantity: number,
  availableQuantity: number,
  soldQuantity: number,
  transferredQuantity: number,
  claimedQuantity: number,
  damagedQuantity: number
): number {
  const accountedFor = availableQuantity + soldQuantity + transferredQuantity + claimedQuantity + damagedQuantity;
  return Math.max(0, totalQuantity - accountedFor);
}

/**
 * Calculate total stock value
 */
export function calculateTotalStockValue(
  quantity: number,
  unitCost: number
): number {
  return quantity * unitCost;
}

/**
 * Calculate stock status based on quantities and thresholds
 */
export function calculateStockStatus(
  availableQuantity: number,
  minThreshold: number = 5,
  maxThreshold?: number
): StockStatus {
  const isOutOfStock = availableQuantity === 0;
  const isLowStock = availableQuantity > 0 && availableQuantity <= minThreshold;
  const isOverstock = maxThreshold ? availableQuantity > maxThreshold : false;

  let status: StockStatus['status'];
  let alertLevel: StockStatus['alertLevel'];

  if (isOutOfStock) {
    status = 'out_of_stock';
    alertLevel = 'critical';
  } else if (isLowStock) {
    status = 'low_stock';
    alertLevel = 'warning';
  } else if (isOverstock) {
    status = 'overstock';
    alertLevel = 'warning';
  } else {
    status = 'in_stock';
    alertLevel = 'none';
  }

  return {
    status,
    isLowStock,
    isOutOfStock,
    isOverstock,
    alertLevel
  };
}

/**
 * Calculate stock turnover rate
 */
export function calculateStockTurnover(
  soldQuantity: number,
  averageStock: number,
  periodDays: number = 30
): number {
  if (averageStock === 0) return 0;
  
  // Annualize the turnover rate
  const dailyTurnover = soldQuantity / periodDays;
  const annualTurnover = dailyTurnover * 365;
  
  return annualTurnover / averageStock;
}

/**
 * Calculate days of supply
 */
export function calculateDaysOfSupply(
  availableQuantity: number,
  averageDailySales: number
): number {
  if (averageDailySales === 0) return Infinity;
  return availableQuantity / averageDailySales;
}

/**
 * Calculate stock movement velocity
 */
export function calculateMovementVelocity(
  movements: StockMovement[],
  periodDays: number = 30
): number {
  const recentMovements = movements.filter(movement => {
    const movementDate = new Date(movement.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    return movementDate >= cutoffDate;
  });

  const totalMovementQuantity = recentMovements.reduce(
    (sum, movement) => sum + Math.abs(movement.quantity), 
    0
  );

  return totalMovementQuantity / periodDays;
}

/**
 * Calculate stock accuracy percentage
 */
export function calculateStockAccuracy(
  systemQuantity: number,
  physicalQuantity: number
): number {
  if (systemQuantity === 0 && physicalQuantity === 0) return 100;
  if (systemQuantity === 0) return 0;
  
  const accuracy = Math.min(physicalQuantity, systemQuantity) / Math.max(physicalQuantity, systemQuantity);
  return Math.round(accuracy * 100);
}

/**
 * Calculate reorder point
 */
export function calculateReorderPoint(
  averageDailySales: number,
  leadTimeDays: number,
  safetyStockDays: number = 7
): number {
  return Math.ceil(averageDailySales * (leadTimeDays + safetyStockDays));
}

/**
 * Calculate economic order quantity (EOQ)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  if (holdingCostPerUnit === 0) return 0;
  return Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
}

/**
 * Calculate ABC classification based on value
 */
export function calculateABCClassification(
  stockLevels: StockLevel[]
): { productId: string; classification: 'A' | 'B' | 'C'; value: number; percentage: number }[] {
  // Calculate total value
  const totalValue = stockLevels.reduce((sum, stock) => sum + stock.availableValue, 0);
  
  // Sort by value descending
  const sortedStocks = stockLevels
    .map(stock => ({
      productId: stock.productId,
      value: stock.availableValue,
      percentage: (stock.availableValue / totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value);

  // Assign classifications
  let cumulativePercentage = 0;
  return sortedStocks.map(stock => {
    cumulativePercentage += stock.percentage;
    
    let classification: 'A' | 'B' | 'C';
    if (cumulativePercentage <= 80) {
      classification = 'A';
    } else if (cumulativePercentage <= 95) {
      classification = 'B';
    } else {
      classification = 'C';
    }

    return {
      ...stock,
      classification
    };
  });
}

/**
 * Calculate stock variance
 */
export function calculateStockVariance(
  systemQuantity: number,
  physicalQuantity: number
): {
  variance: number;
  variancePercentage: number;
  varianceType: 'positive' | 'negative' | 'none';
} {
  const variance = physicalQuantity - systemQuantity;
  const variancePercentage = systemQuantity === 0 ? 0 : (variance / systemQuantity) * 100;
  
  let varianceType: 'positive' | 'negative' | 'none';
  if (variance > 0) {
    varianceType = 'positive';
  } else if (variance < 0) {
    varianceType = 'negative';
  } else {
    varianceType = 'none';
  }

  return {
    variance,
    variancePercentage: Math.round(variancePercentage * 100) / 100,
    varianceType
  };
}

/**
 * Calculate safety stock level
 */
export function calculateSafetyStock(
  averageDailySales: number,
  maxDailySales: number,
  averageLeadTime: number,
  maxLeadTime: number
): number {
  return Math.ceil(
    (maxDailySales * maxLeadTime) - (averageDailySales * averageLeadTime)
  );
}

/**
 * Calculate stock aging analysis
 */
export function calculateStockAging(
  serialNumbers: SerialNumber[]
): {
  '0-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
} {
  const now = new Date();
  const aging = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0
  };

  serialNumbers.forEach(sn => {
    if (sn.status === 'available') {
      const daysSinceCreated = Math.floor(
        (now.getTime() - sn.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreated <= 30) {
        aging['0-30']++;
      } else if (daysSinceCreated <= 60) {
        aging['31-60']++;
      } else if (daysSinceCreated <= 90) {
        aging['61-90']++;
      } else {
        aging['90+']++;
      }
    }
  });

  return aging;
}

/**
 * Utility function to format currency
 */
export function formatCurrency(amount: number, currency: string = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Utility function to format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Utility function to format quantity
 */
export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('th-TH').format(quantity);
}