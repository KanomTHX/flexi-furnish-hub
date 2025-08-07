import { useState, useCallback, useMemo } from 'react';
import { 
  Warehouse, 
  WarehouseTransfer, 
  WarehouseTask, 
  WarehouseAlert,
  WarehouseSummary,
  WarehouseFilter,
  TransferFilter,
  TaskFilter
} from '@/types/warehouse';
import { 
  mockWarehouses, 
  mockWarehouseTransfers, 
  mockWarehouseTasks, 
  mockWarehouseAlerts,
  calculateWarehouseSummary
} from '@/hooks/useSupabaseHooks';
import { 
  filterWarehouses, 
  filterTransfers, 
  filterTasks,
  generateTransferNumber,
  generateTaskNumber
} from '@/utils/warehouseHelpers';

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>(mockWarehouseTransfers);
  const [tasks, setTasks] = useState<WarehouseTask[]>(mockWarehouseTasks);
  const [alerts, setAlerts] = useState<WarehouseAlert[]>(mockWarehouseAlerts);
  const [warehouseFilter, setWarehouseFilter] = useState<WarehouseFilter>({});
  const [transferFilter, setTransferFilter] = useState<TransferFilter>({});
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({});

  // คำนวณข้อมูลที่กรองแล้ว
  const filteredWarehouses = useMemo(() => 
    filterWarehouses(warehouses, warehouseFilter), 
    [warehouses, warehouseFilter]
  );

  const filteredTransfers = useMemo(() => 
    filterTransfers(transfers, transferFilter), 
    [transfers, transferFilter]
  );

  const filteredTasks = useMemo(() => 
    filterTasks(tasks, taskFilter), 
    [tasks, taskFilter]
  );

  // คำนวณสรุปข้อมูล
  const summary: WarehouseSummary = useMemo(() => 
    calculateWarehouseSummary(), 
    [warehouses, transfers, tasks, alerts]
  );

  // การจัดการคลังสินค้า
  const addWarehouse = useCallback((warehouse: Warehouse) => {
    setWarehouses(prev => [...prev, warehouse]);
  }, []);

  const updateWarehouse = useCallback((
    warehouseId: string, 
    updates: Partial<Warehouse>
  ) => {
    setWarehouses(prev => prev.map(warehouse => 
      warehouse.id === warehouseId 
        ? { ...warehouse, ...updates, updatedAt: new Date().toISOString() }
        : warehouse
    ));
  }, []);

  const deactivateWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prev => prev.map(warehouse => 
      warehouse.id === warehouseId 
        ? { ...warehouse, status: 'inactive' as const, updatedAt: new Date().toISOString() }
        : warehouse
    ));
  }, []);

  // การจัดการการโอนย้าย
  const createTransfer = useCallback((
    transferData: Omit<WarehouseTransfer, 'id' | 'transferNumber' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTransfer: WarehouseTransfer = {
      ...transferData,
      id: `transfer-${Date.now()}`,
      transferNumber: generateTransferNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTransfers(prev => [newTransfer, ...prev]);
    return newTransfer;
  }, []);

  const updateTransfer = useCallback((
    transferId: string, 
    updates: Partial<WarehouseTransfer>
  ) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, ...updates, updatedAt: new Date().toISOString() }
        : transfer
    ));
  }, []);

  const approveTransfer = useCallback((
    transferId: string, 
    approvedBy: string
  ) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { 
            ...transfer, 
            status: 'pending' as const,
            approvedBy,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : transfer
    ));
  }, []);

  const shipTransfer = useCallback((
    transferId: string, 
    shippingData: {
      carrier?: {
        name: string;
        trackingNumber: string;
        contact: string;
      };
      estimatedDelivery?: string;
    }
  ) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { 
            ...transfer, 
            status: 'in_transit' as const,
            shippedDate: new Date().toISOString(),
            carrier: shippingData.carrier,
            estimatedDelivery: shippingData.estimatedDelivery,
            updatedAt: new Date().toISOString()
          }
        : transfer
    ));
  }, []);

  const receiveTransfer = useCallback((
    transferId: string, 
    receivedBy: string,
    receivedItems: { itemId: string; receivedQuantity: number }[]
  ) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { 
            ...transfer, 
            status: 'delivered' as const,
            deliveredDate: new Date().toISOString(),
            receivedBy,
            receivedAt: new Date().toISOString(),
            items: transfer.items.map(item => {
              const receivedItem = receivedItems.find(ri => ri.itemId === item.id);
              return receivedItem 
                ? { ...item, receivedQuantity: receivedItem.receivedQuantity }
                : item;
            }),
            updatedAt: new Date().toISOString()
          }
        : transfer
    ));
  }, []);

  const cancelTransfer = useCallback((
    transferId: string, 
    reason: string
  ) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { 
            ...transfer, 
            status: 'cancelled' as const,
            notes: `${transfer.notes || ''}\nยกเลิก: ${reason}`,
            updatedAt: new Date().toISOString()
          }
        : transfer
    ));
  }, []);

  // การจัดการงาน
  const createTask = useCallback((
    taskData: Omit<WarehouseTask, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTask: WarehouseTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((
    taskId: string, 
    updates: Partial<WarehouseTask>
  ) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  }, []);

  const assignTask = useCallback((
    taskId: string, 
    assignedTo: string
  ) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            assignedTo,
            status: 'pending' as const,
            updatedAt: new Date().toISOString()
          }
        : task
    ));
  }, []);

  const startTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'in_progress' as const,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : task
    ));
  }, []);

  const completeTask = useCallback((
    taskId: string, 
    notes?: string
  ) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      const completedAt = new Date().toISOString();
      const actualDuration = task.startedAt 
        ? Math.round((new Date(completedAt).getTime() - new Date(task.startedAt).getTime()) / (1000 * 60))
        : undefined;

      return { 
        ...task, 
        status: 'completed' as const,
        completedAt,
        actualDuration,
        notes: notes ? `${task.notes || ''}\n${notes}` : task.notes,
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  const cancelTask = useCallback((
    taskId: string, 
    reason: string
  ) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'cancelled' as const,
            notes: `${task.notes || ''}\nยกเลิก: ${reason}`,
            updatedAt: new Date().toISOString()
          }
        : task
    ));
  }, []);

  // การจัดการ Alert
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isRead: true }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback((
    alertId: string, 
    resolution: string, 
    resolvedBy: string
  ) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            isRead: true,
            isResolved: true,
            resolvedAt: new Date().toISOString(),
            resolvedBy,
            resolution
          }
        : alert
    ));
  }, []);

  const createAlert = useCallback((
    alertData: Omit<WarehouseAlert, 'id' | 'createdAt'>
  ) => {
    const newAlert: WarehouseAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  }, []);

  // ฟังก์ชันช่วย
  const getWarehouseById = useCallback((warehouseId: string) => {
    return warehouses.find(warehouse => warehouse.id === warehouseId);
  }, [warehouses]);

  const getActiveWarehouses = useCallback(() => {
    return warehouses.filter(warehouse => warehouse.status === 'active');
  }, [warehouses]);

  const getUnreadAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.isRead);
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'critical');
  }, [alerts]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => task.status === 'pending');
  }, [tasks]);

  const getActiveTransfers = useCallback(() => {
    return transfers.filter(transfer => 
      transfer.status === 'pending' || transfer.status === 'in_transit'
    );
  }, [transfers]);

  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' && 
      new Date(task.dueDate) < now
    );
  }, [tasks]);

  // การค้นหาและกรอง
  const searchWarehouses = useCallback((searchTerm: string) => {
    setWarehouseFilter(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const searchTransfers = useCallback((searchTerm: string) => {
    setTransferFilter(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const searchTasks = useCallback((searchTerm: string) => {
    setTaskFilter(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const clearWarehouseFilter = useCallback(() => {
    setWarehouseFilter({});
  }, []);

  const clearTransferFilter = useCallback(() => {
    setTransferFilter({});
  }, []);

  const clearTaskFilter = useCallback(() => {
    setTaskFilter({});
  }, []);

  return {
    // Data
    warehouses: filteredWarehouses,
    allWarehouses: warehouses,
    transfers: filteredTransfers,
    allTransfers: transfers,
    tasks: filteredTasks,
    allTasks: tasks,
    alerts,
    summary,
    warehouseFilter,
    transferFilter,
    taskFilter,

    // Warehouse Management
    addWarehouse,
    updateWarehouse,
    deactivateWarehouse,

    // Transfer Management
    createTransfer,
    updateTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,

    // Task Management
    createTask,
    updateTask,
    assignTask,
    startTask,
    completeTask,
    cancelTask,

    // Alert Management
    markAlertAsRead,
    resolveAlert,
    createAlert,

    // Helper Functions
    getWarehouseById,
    getActiveWarehouses,
    getUnreadAlerts,
    getCriticalAlerts,
    getPendingTasks,
    getActiveTransfers,
    getOverdueTasks,

    // Search & Filter
    searchWarehouses,
    searchTransfers,
    searchTasks,
    setWarehouseFilter,
    setTransferFilter,
    setTaskFilter,
    clearWarehouseFilter,
    clearTransferFilter,
    clearTaskFilter
  };
}