import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Warehouse, 
  WarehouseTransfer, 
  WarehouseTask, 
  WarehouseAlert,
  WarehouseSummary,
  WarehouseFilter,
  TransferFilter,
  TaskFilter
} from '../types/warehouse';
import {
  StockLevel,
  StockMovement,
  StockAlert,
  StockSummary,
  StockAdjustment,
  StockCount,
  StockFilter,
  MovementFilter,
  AlertFilter
} from '../types/stock';
import { 
  mockWarehouses,
  mockWarehouseTransfers,
  mockWarehouseTasks,
  mockWarehouseAlerts
} from '@/hooks/useSupabaseHooks';

export function useWarehouseStock() {
  // Warehouse State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [warehouseTasks, setWarehouseTasks] = useState<WarehouseTask[]>([]);
  const [warehouseAlerts, setWarehouseAlerts] = useState<WarehouseAlert[]>([]);
  
  // Stock State
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  
  // Filters
  const [warehouseFilter, setWarehouseFilter] = useState<WarehouseFilter>({});
  const [transferFilter, setTransferFilter] = useState<TransferFilter>({});
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({});
  const [stockFilter, setStockFilter] = useState<StockFilter>({});
  const [movementFilter, setMovementFilter] = useState<MovementFilter>({});
  const [alertFilter, setAlertFilter] = useState<AlertFilter>({});
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Load warehouse data
        setWarehouses(mockWarehouses);
        setTransfers(mockWarehouseTransfers);
        setWarehouseTasks(mockWarehouseTasks);
        setWarehouseAlerts(mockWarehouseAlerts);
        
        // Load stock data
        setStockLevels(mockStockLevels);
        setStockMovements(mockStockMovements);
        setStockAlerts(mockStockAlerts);
        setStockAdjustments(mockStockAdjustments);
        setStockCounts(mockStockCounts);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filtered Data
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => {
      if (warehouseFilter.type && warehouse.type !== warehouseFilter.type) return false;
      if (warehouseFilter.status && warehouse.status !== warehouseFilter.status) return false;
      if (warehouseFilter.province && warehouse.address.province !== warehouseFilter.province) return false;
      if (warehouseFilter.utilizationMin && warehouse.capacity.utilizationPercentage < warehouseFilter.utilizationMin) return false;
      if (warehouseFilter.utilizationMax && warehouse.capacity.utilizationPercentage > warehouseFilter.utilizationMax) return false;
      if (warehouseFilter.search) {
        const searchLower = warehouseFilter.search.toLowerCase();
        return warehouse.name.toLowerCase().includes(searchLower) ||
               warehouse.code.toLowerCase().includes(searchLower) ||
               warehouse.address.province.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [warehouses, warehouseFilter]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      if (transferFilter.status && transfer.status !== transferFilter.status) return false;
      if (transferFilter.priority && transfer.priority !== transferFilter.priority) return false;
      if (transferFilter.fromWarehouse && transfer.fromWarehouseId !== transferFilter.fromWarehouse) return false;
      if (transferFilter.toWarehouse && transfer.toWarehouseId !== transferFilter.toWarehouse) return false;
      if (transferFilter.dateFrom && transfer.requestedDate < transferFilter.dateFrom) return false;
      if (transferFilter.dateTo && transfer.requestedDate > transferFilter.dateTo) return false;
      if (transferFilter.search) {
        const searchLower = transferFilter.search.toLowerCase();
        return transfer.transferNumber.toLowerCase().includes(searchLower) ||
               transfer.fromWarehouse.name.toLowerCase().includes(searchLower) ||
               transfer.toWarehouse.name.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [transfers, transferFilter]);

  const filteredStockLevels = useMemo(() => {
    return stockLevels.filter(stock => {
      if (stockFilter.warehouseId && stock.warehouseId !== stockFilter.warehouseId) return false;
      if (stockFilter.zoneId && stock.zoneId !== stockFilter.zoneId) return false;
      if (stockFilter.status && stock.status !== stockFilter.status) return false;
      if (stockFilter.stockLevel) {
        switch (stockFilter.stockLevel) {
          case 'low_stock':
            if (stock.status !== 'low_stock') return false;
            break;
          case 'out_of_stock':
            if (stock.status !== 'out_of_stock') return false;
            break;
          case 'overstock':
            if (stock.status !== 'overstock') return false;
            break;
          case 'in_stock':
            if (stock.status !== 'in_stock') return false;
            break;
        }
      }
      if (stockFilter.search) {
        const searchLower = stockFilter.search.toLowerCase();
        return stock.product.name.toLowerCase().includes(searchLower) ||
               stock.product.sku.toLowerCase().includes(searchLower) ||
               stock.product.category.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [stockLevels, stockFilter]);

  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter(movement => {
      if (movementFilter.warehouseId && movement.warehouseId !== movementFilter.warehouseId) return false;
      if (movementFilter.zoneId && movement.zoneId !== movementFilter.zoneId) return false;
      if (movementFilter.productId && movement.productId !== movementFilter.productId) return false;
      if (movementFilter.type && movement.type !== movementFilter.type) return false;
      if (movementFilter.subType && movement.subType !== movementFilter.subType) return false;
      if (movementFilter.dateFrom && movement.createdAt < movementFilter.dateFrom) return false;
      if (movementFilter.dateTo && movement.createdAt > movementFilter.dateTo) return false;
      if (movementFilter.search) {
        const searchLower = movementFilter.search.toLowerCase();
        return movement.product.name.toLowerCase().includes(searchLower) ||
               movement.product.sku.toLowerCase().includes(searchLower) ||
               movement.reason.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [stockMovements, movementFilter]);

  // Combined Summary
  const combinedSummary = useMemo((): WarehouseSummary & StockSummary => {
    const safeWarehouses = warehouses || [];
    const safeTransfers = transfers || [];
    const safeWarehouseTasks = warehouseTasks || [];
    const safeWarehouseAlerts = warehouseAlerts || [];
    const safeStockLevels = stockLevels || [];
    const safeStockMovements = stockMovements || [];
    const safeStockAlerts = stockAlerts || [];

    const warehouseSummary = {
      totalWarehouses: safeWarehouses.length,
      activeWarehouses: safeWarehouses.filter(w => w?.status === 'active').length,
      totalCapacity: safeWarehouses.reduce((sum, w) => sum + (w?.capacity?.storageCapacity || 0), 0),
      totalUtilization: safeWarehouses.reduce((sum, w) => sum + (w?.capacity?.currentUtilization || 0), 0),
      averageUtilizationRate: safeWarehouses.length > 0 
        ? safeWarehouses.reduce((sum, w) => sum + (w?.capacity?.utilizationPercentage || 0), 0) / safeWarehouses.length 
        : 0,
      totalStaff: safeWarehouses.reduce((sum, w) => sum + (w?.staff?.length || 0), 0),
      activeTransfers: safeTransfers.filter(t => t?.status === 'in_transit').length,
      pendingTasks: safeWarehouseTasks.filter(t => t?.status === 'pending').length,
      criticalAlerts: [...safeWarehouseAlerts, ...safeStockAlerts].filter(a => a?.severity === 'critical').length,
      totalValue: safeStockLevels.reduce((sum, s) => sum + (s?.totalValue || 0), 0),
      topPerformingWarehouse: safeWarehouses.length > 0 
        ? (() => {
            const best = safeWarehouses.reduce((best, current) => 
              (current?.capacity?.utilizationPercentage || 0) > (best?.capacity?.utilizationPercentage || 0) ? current : best
            );
            return {
              id: best?.id || '',
              name: best?.name || '',
              utilizationRate: best?.capacity?.utilizationPercentage || 85,
              productivityScore: 90
            };
          })()
        : { id: '', name: '', utilizationRate: 0, productivityScore: 0 },
      lowPerformingWarehouse: safeWarehouses.length > 0 
        ? (() => {
            const worst = safeWarehouses.reduce((worst, current) => 
              (current?.capacity?.utilizationPercentage || 100) < (worst?.capacity?.utilizationPercentage || 100) ? current : worst
            );
            return {
              id: worst?.id || '',
              name: worst?.name || '',
              utilizationRate: worst?.capacity?.utilizationPercentage || 45,
              productivityScore: 60
            };
          })()
        : { id: '', name: '', utilizationRate: 0, productivityScore: 0 }
    };

    const stockSummary = {
      totalProducts: safeStockLevels.length,
      totalStockValue: safeStockLevels.reduce((sum, s) => sum + (s?.totalValue || 0), 0),
      totalQuantity: safeStockLevels.reduce((sum, s) => sum + (s?.quantity || 0), 0),
      inStockItems: safeStockLevels.filter(s => s?.status === 'in_stock').length,
      lowStockItems: safeStockLevels.filter(s => s?.status === 'low_stock').length,
      outOfStockItems: safeStockLevels.filter(s => s?.status === 'out_of_stock').length,
      overstockItems: safeStockLevels.filter(s => s?.status === 'overstock').length,
      warehouseBreakdown: safeWarehouses.map(w => ({
        warehouseId: w?.id || '',
        warehouseName: w?.name || '',
        totalProducts: safeStockLevels.filter(s => s?.warehouseId === w?.id).length,
        totalValue: safeStockLevels.filter(s => s?.warehouseId === w?.id).reduce((sum, s) => sum + (s?.totalValue || 0), 0),
        utilizationPercentage: w?.capacity?.utilizationPercentage || 0
      })),
      todayMovements: safeStockMovements.filter(m => 
        m?.createdAt && new Date(m.createdAt).toDateString() === new Date().toDateString()
      ).length,
      weekMovements: safeStockMovements.filter(m => {
        if (!m?.createdAt) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(m.createdAt) >= weekAgo;
      }).length,
      monthMovements: safeStockMovements.filter(m => {
        if (!m?.createdAt) return false;
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(m.createdAt) >= monthAgo;
      }).length,
      criticalAlerts: safeStockAlerts.filter(a => a?.severity === 'critical').length,
      highAlerts: safeStockAlerts.filter(a => a?.severity === 'high').length,
      mediumAlerts: safeStockAlerts.filter(a => a?.severity === 'medium').length,
      lowAlerts: safeStockAlerts.filter(a => a?.severity === 'low').length,
      topValueProducts: safeStockLevels.length > 0
        ? safeStockLevels
            .sort((a, b) => (b?.totalValue || 0) - (a?.totalValue || 0))
            .slice(0, 5)
            .map(s => ({
              productId: s?.productId || '',
              productName: s?.product?.name || '',
              sku: s?.product?.sku || '',
              totalValue: s?.totalValue || 0,
              quantity: s?.quantity || 0
            }))
        : [],
      topMovingProducts: safeStockMovements.length > 0
        ? safeStockMovements
            .reduce((acc, movement) => {
              if (!movement?.productId || !movement?.product) return acc;
              const existing = acc.find(p => p.productId === movement.productId);
              if (existing) {
                existing.movementCount++;
                existing.totalQuantity += Math.abs(movement.quantity || 0);
              } else {
                acc.push({
                  productId: movement.productId,
                  productName: movement.product.name || '',
                  sku: movement.product.sku || '',
                  movementCount: 1,
                  totalQuantity: Math.abs(movement.quantity || 0)
                });
              }
              return acc;
            }, [] as any[])
            .sort((a, b) => (b?.movementCount || 0) - (a?.movementCount || 0))
            .slice(0, 5)
        : [],
      averageTurnoverRate: 12, // Mock calculation
      averageDaysOfSupply: 30, // Mock calculation
      stockAccuracy: 98.5, // Mock calculation
      lastUpdated: new Date().toISOString()
    };

    return { ...warehouseSummary, ...stockSummary };
  }, [warehouses, transfers, warehouseTasks, warehouseAlerts, stockLevels, stockMovements, stockAlerts]);

  // Warehouse Actions
  const updateWarehouse = useCallback(async (id: string, updates: Partial<Warehouse>) => {
    setIsUpdating(true);
    try {
      setWarehouses(prev => prev.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ));
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const createTransfer = useCallback(async (transfer: Omit<WarehouseTransfer, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsUpdating(true);
    try {
      const newTransfer: WarehouseTransfer = {
        ...transfer,
        id: `transfer-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTransfers(prev => [newTransfer, ...prev]);
      
      // Create corresponding stock movements
      for (const item of transfer.items) {
        const outMovement: StockMovement = {
          id: `movement-out-${Date.now()}-${item.id}`,
          productId: item.productId,
          product: item.product,
          warehouseId: transfer.fromWarehouseId,
          warehouse: transfer.fromWarehouse,
          zoneId: item.fromLocationId || 'default-zone',
          zone: { id: 'default-zone', name: 'Default Zone', code: 'DZ' },
          type: 'out',
          subType: 'warehouse_transfer',
          quantity: -item.requestedQuantity,
          previousStock: 100, // Mock
          newStock: 100 - item.requestedQuantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          referenceType: 'transfer_order',
          referenceId: newTransfer.id,
          referenceNumber: newTransfer.transferNumber,
          reason: `Transfer to ${transfer.toWarehouse.name}`,
          transferId: newTransfer.id,
          toWarehouseId: transfer.toWarehouseId,
          toWarehouse: transfer.toWarehouse,
          createdAt: new Date().toISOString(),
          createdBy: transfer.createdBy,
          employeeName: 'System User'
        };

        const inMovement: StockMovement = {
          ...outMovement,
          id: `movement-in-${Date.now()}-${item.id}`,
          warehouseId: transfer.toWarehouseId,
          warehouse: transfer.toWarehouse,
          type: 'in',
          quantity: item.requestedQuantity,
          previousStock: 50, // Mock
          newStock: 50 + item.requestedQuantity,
          reason: `Transfer from ${transfer.fromWarehouse.name}`,
          fromWarehouseId: transfer.fromWarehouseId,
          fromWarehouse: transfer.fromWarehouse,
          toWarehouseId: undefined,
          toWarehouse: undefined
        };

        setStockMovements(prev => [outMovement, inMovement, ...prev]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const approveTransfer = useCallback(async (transferId: string, approvedBy: string) => {
    setIsUpdating(true);
    try {
      setTransfers(prev => prev.map(t => 
        t.id === transferId 
          ? { 
              ...t, 
              status: 'pending' as const,
              approvedBy,
              approvedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : t
      ));
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Stock Actions
  const adjustStock = useCallback(async (adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsUpdating(true);
    try {
      const newAdjustment: StockAdjustment = {
        ...adjustment,
        id: `adjustment-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setStockAdjustments(prev => [newAdjustment, ...prev]);

      // Update stock levels and create movements
      for (const item of adjustment.items) {
        // Update stock level
        setStockLevels(prev => prev.map(stock => 
          stock.productId === item.productId && stock.warehouseId === adjustment.warehouseId
            ? {
                ...stock,
                quantity: stock.quantity + item.variance,
                availableQuantity: stock.availableQuantity + item.variance,
                totalValue: (stock.quantity + item.variance) * stock.averageCost,
                lastMovementDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: adjustment.createdBy
              }
            : stock
        ));

        // Create stock movement
        const movement: StockMovement = {
          id: `movement-adj-${Date.now()}-${item.id}`,
          productId: item.productId,
          product: item.product,
          warehouseId: adjustment.warehouseId,
          warehouse: adjustment.warehouse,
          zoneId: item.zoneId,
          zone: { id: item.zoneId, name: 'Zone', code: 'Z' },
          type: 'adjustment',
          subType: 'count_adjustment',
          quantity: item.variance,
          previousStock: item.systemQuantity,
          newStock: item.adjustedQuantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          referenceType: 'adjustment',
          referenceId: newAdjustment.id,
          referenceNumber: newAdjustment.adjustmentNumber,
          reason: item.reason,
          notes: item.notes,
          batch: item.batch,
          expiryDate: item.expiryDate,
          createdAt: new Date().toISOString(),
          createdBy: adjustment.createdBy,
          employeeName: 'System User'
        };

        setStockMovements(prev => [movement, ...prev]);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Task Actions
  const assignTask = useCallback(async (taskId: string, assignedTo: string) => {
    setIsUpdating(true);
    try {
      setWarehouseTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              assignedTo,
              status: 'pending' as const,
              updatedAt: new Date().toISOString()
            }
          : t
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const startTask = useCallback(async (taskId: string) => {
    setIsUpdating(true);
    try {
      setWarehouseTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'in_progress' as const,
              startedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : t
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const completeTask = useCallback(async (taskId: string, actualDuration?: number, notes?: string) => {
    setIsUpdating(true);
    try {
      setWarehouseTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              actualDuration,
              notes: notes || t.notes,
              updatedAt: new Date().toISOString()
            }
          : t
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Alert Actions
  const markAlertAsRead = useCallback(async (alertId: string, isWarehouseAlert: boolean = true) => {
    setIsUpdating(true);
    try {
      if (isWarehouseAlert) {
        setWarehouseAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, isRead: true } : a
        ));
      } else {
        setStockAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, isRead: true } : a
        ));
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string, resolution: string, isWarehouseAlert: boolean = true) => {
    setIsUpdating(true);
    try {
      const resolvedAt = new Date().toISOString();
      if (isWarehouseAlert) {
        setWarehouseAlerts(prev => prev.map(a => 
          a.id === alertId 
            ? { 
                ...a, 
                isRead: true, 
                isResolved: true, 
                resolvedAt,
                resolution,
                resolvedBy: 'current-user'
              } 
            : a
        ));
      } else {
        setStockAlerts(prev => prev.map(a => 
          a.id === alertId 
            ? { 
                ...a, 
                isRead: true, 
                isResolved: true, 
                resolvedAt,
                resolution,
                resolvedBy: 'current-user'
              } 
            : a
        ));
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Export Functions
  const exportWarehouseData = useCallback(() => {
    const csvData = filteredWarehouses.map(warehouse => ({
      รหัสคลัง: warehouse.code,
      ชื่อคลัง: warehouse.name,
      ประเภท: warehouse.type,
      สถานะ: warehouse.status,
      จังหวัด: warehouse.address.province,
      ผู้จัดการ: warehouse.contact.manager,
      พื้นที่รวม: warehouse.capacity.totalArea,
      ความจุ: warehouse.capacity.storageCapacity,
      'การใช้งาน (%)': warehouse.capacity.utilizationPercentage,
      จำนวนพนักงาน: warehouse.staff.length
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `warehouses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredWarehouses]);

  const exportStockData = useCallback(() => {
    const csvData = filteredStockLevels.map(stock => ({
      SKU: stock.product.sku,
      ชื่อสินค้า: stock.product.name,
      หมวดหมู่: stock.product.category,
      คลัง: stock.warehouse.name,
      โซน: stock.zone.name,
      จำนวน: stock.quantity,
      จอง: stock.reservedQuantity,
      พร้อมขาย: stock.availableQuantity,
      'สต็อกขั้นต่ำ': stock.minStock,
      'สต็อกสูงสุด': stock.maxStock,
      'ต้นทุนเฉลี่ย': stock.averageCost,
      มูลค่ารวม: stock.totalValue,
      สถานะ: stock.status,
      'การเคลื่อนไหวล่าสุด': stock.lastMovementDate
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-levels-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredStockLevels]);

  return {
    // Data
    warehouses: filteredWarehouses,
    transfers: filteredTransfers,
    warehouseTasks,
    warehouseAlerts,
    stockLevels: filteredStockLevels,
    stockMovements: filteredStockMovements,
    stockAlerts,
    stockAdjustments,
    stockCounts,
    summary: combinedSummary,
    
    // Filters
    warehouseFilter,
    setWarehouseFilter,
    transferFilter,
    setTransferFilter,
    taskFilter,
    setTaskFilter,
    stockFilter,
    setStockFilter,
    movementFilter,
    setMovementFilter,
    alertFilter,
    setAlertFilter,
    
    // States
    isLoading,
    isUpdating,
    
    // Actions
    updateWarehouse,
    createTransfer,
    approveTransfer,
    adjustStock,
    assignTask,
    startTask,
    completeTask,
    markAlertAsRead,
    resolveAlert,
    exportWarehouseData,
    exportStockData
  };
}