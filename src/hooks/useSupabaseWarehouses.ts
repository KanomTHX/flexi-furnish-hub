import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SupabaseWarehouse {
  id: string;
  branch_id: string;
  code: string;
  name: string;
  location?: string;
  capacity?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseStockMovement {
  id: string;
  branch_id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

interface SupabasePurchaseOrder {
  id: string;
  branch_id: string;
  order_number: string;
  supplier_name?: string;
  supplier_contact?: string;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SupabasePurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity?: number;
  created_at: string;
}

interface SupabaseProductInventory {
  id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_updated: string;
  status: string;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
  capacity?: number;
  utilizationPercentage: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  movementType: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName?: string;
  supplierContact?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity?: number;
}

interface ProductInventory {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
  status: string;
}

interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalUtilization: number;
  averageUtilizationRate: number;
  totalProducts: number;
  totalStockValue: number;
  totalMovements: number;
  totalPurchaseOrders: number;
  pendingOrders: number;
}

export function useSupabaseWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [productInventory, setProductInventory] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // แปลงข้อมูลจาก Supabase เป็น Warehouse
  const convertToWarehouse = useCallback((warehouse: SupabaseWarehouse): Warehouse => {
    // คำนวณ utilization percentage แบบ mock เนื่องจากไม่มีข้อมูลจริง
    const utilizationPercentage = warehouse.capacity 
      ? Math.floor(Math.random() * 80) + 10 // Random 10-90%
      : 0;

    return {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      utilizationPercentage,
      status: warehouse.status,
      createdAt: warehouse.created_at,
      updatedAt: warehouse.updated_at
    };
  }, []);

  // แปลงข้อมูลจาก Supabase เป็น StockMovement
  const convertToStockMovement = useCallback((movement: SupabaseStockMovement, warehouseName: string): StockMovement => {
    return {
      id: movement.id,
      warehouseId: movement.warehouse_id,
      warehouseName,
      productId: movement.product_id,
      movementType: movement.movement_type,
      quantity: movement.quantity,
      unitCost: movement.unit_cost,
      referenceType: movement.reference_type,
      referenceId: movement.reference_id,
      reason: movement.reason,
      notes: movement.notes,
      createdAt: movement.created_at,
      createdBy: movement.created_by
    };
  }, []);

  // แปลงข้อมูลจาก Supabase เป็น PurchaseOrder
  const convertToPurchaseOrder = useCallback((
    order: SupabasePurchaseOrder,
    items: SupabasePurchaseOrderItem[]
  ): PurchaseOrder => {
    return {
      id: order.id,
      orderNumber: order.order_number,
      supplierName: order.supplier_name,
      supplierContact: order.supplier_contact,
      orderDate: order.order_date,
      expectedDeliveryDate: order.expected_delivery_date,
      totalAmount: order.total_amount,
      status: order.status,
      notes: order.notes,
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        totalCost: item.total_cost,
        receivedQuantity: item.received_quantity
      })),
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }, []);

  // โหลดข้อมูลคลังสินค้า
  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const warehousesData = (data || []).map(convertToWarehouse);
      setWarehouses(warehousesData);
    } catch (err) {
      console.error('Error loading warehouses:', err);
      setError('ไม่สามารถโหลดข้อมูลคลังสินค้าได้');
    } finally {
      setLoading(false);
    }
  }, [convertToWarehouse]);

  // โหลดข้อมูลการเคลื่อนไหวสต็อก
  const loadStockMovements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (movementsError) throw movementsError;

      // โหลดข้อมูลคลังสินค้าเพื่อใช้ในการแปลงข้อมูล
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, name');

      if (warehousesError) throw warehousesError;

      const warehouseMap = new Map(warehousesData?.map(w => [w.id, w.name]) || []);

      const movements = (movementsData || []).map(movement => 
        convertToStockMovement(movement, warehouseMap.get(movement.warehouse_id) || 'Unknown')
      );

      setStockMovements(movements);
    } catch (err) {
      console.error('Error loading stock movements:', err);
      setError('ไม่สามารถโหลดข้อมูลการเคลื่อนไหวสต็อกได้');
    } finally {
      setLoading(false);
    }
  }, [convertToStockMovement]);

  // โหลดข้อมูลใบสั่งซื้อ
  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setPurchaseOrders([]);
        return;
      }

      // โหลดรายการสินค้าในใบสั่งซื้อ
      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .in('purchase_order_id', orderIds);

      if (itemsError) throw itemsError;

      const orders = ordersData.map(order => {
        const orderItems = itemsData?.filter(item => item.purchase_order_id === order.id) || [];
        return convertToPurchaseOrder(order, orderItems);
      });

      setPurchaseOrders(orders);
    } catch (err) {
      console.error('Error loading purchase orders:', err);
      setError('ไม่สามารถโหลดข้อมูลใบสั่งซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [convertToPurchaseOrder]);

  // โหลดข้อมูลสต็อกสินค้า
  const loadProductInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('product_inventory')
        .select('*')
        .order('last_updated', { ascending: false });

      if (fetchError) throw fetchError;

      const inventory = (data || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        reservedQuantity: item.reserved_quantity,
        availableQuantity: item.available_quantity,
        lastUpdated: item.last_updated,
        status: item.status
      }));

      setProductInventory(inventory);
    } catch (err) {
      console.error('Error loading product inventory:', err);
      setError('ไม่สามารถโหลดข้อมูลสต็อกสินค้าได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลทั้งหมด
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadWarehouses(),
      loadStockMovements(),
      loadPurchaseOrders(),
      loadProductInventory()
    ]);
  }, [loadWarehouses, loadStockMovements, loadPurchaseOrders, loadProductInventory]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // สร้างคลังสินค้าใหม่
  const createWarehouse = useCallback(async (warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt' | 'utilizationPercentage'>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('warehouses')
        .insert({
          branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
          code: warehouseData.code,
          name: warehouseData.name,
          location: warehouseData.location,
          capacity: warehouseData.capacity,
          status: warehouseData.status
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newWarehouse = convertToWarehouse(data);
      setWarehouses(prev => [newWarehouse, ...prev]);

      return newWarehouse;
    } catch (err) {
      console.error('Error creating warehouse:', err);
      setError('ไม่สามารถสร้างคลังสินค้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertToWarehouse]);

  // อัปเดตคลังสินค้า
  const updateWarehouse = useCallback(async (warehouseId: string, updates: Partial<Warehouse>) => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      if (updates.status) updateData.status = updates.status;

      const { error: updateError } = await supabase
        .from('warehouses')
        .update(updateData)
        .eq('id', warehouseId);

      if (updateError) throw updateError;

      // อัปเดต local state
      setWarehouses(prev => prev.map(warehouse => 
        warehouse.id === warehouseId 
          ? { ...warehouse, ...updates }
          : warehouse
      ));
    } catch (err) {
      console.error('Error updating warehouse:', err);
      setError('ไม่สามารถอัปเดตคลังสินค้าได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // สร้างการเคลื่อนไหวสต็อก
  const createStockMovement = useCallback(async (movementData: Omit<StockMovement, 'id' | 'createdAt' | 'warehouseName'>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('stock_movements')
        .insert({
          branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
          warehouse_id: movementData.warehouseId,
          product_id: movementData.productId,
          movement_type: movementData.movementType,
          quantity: movementData.quantity,
          unit_cost: movementData.unitCost,
          reference_type: movementData.referenceType,
          reference_id: movementData.referenceId,
          reason: movementData.reason,
          notes: movementData.notes,
          created_by: movementData.createdBy
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // หาชื่อคลังสินค้า
      const warehouse = warehouses.find(w => w.id === movementData.warehouseId);
      const warehouseName = warehouse?.name || 'Unknown';

      const newMovement = convertToStockMovement(data, warehouseName);
      setStockMovements(prev => [newMovement, ...prev]);

      return newMovement;
    } catch (err) {
      console.error('Error creating stock movement:', err);
      setError('ไม่สามารถสร้างการเคลื่อนไหวสต็อกได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertToStockMovement, warehouses]);

  // สร้างใบสั่งซื้อ
  const createPurchaseOrder = useCallback(async (orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      // สร้างใบสั่งซื้อ
      const { data: orderResult, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          branch_id: '00000000-0000-0000-0000-000000000001', // Default branch
          order_number: orderData.orderNumber,
          supplier_name: orderData.supplierName,
          supplier_contact: orderData.supplierContact,
          order_date: orderData.orderDate,
          expected_delivery_date: orderData.expectedDeliveryDate,
          total_amount: orderData.totalAmount,
          status: orderData.status,
          notes: orderData.notes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // สร้างรายการสินค้า
      const itemsData = orderData.items.map(item => ({
        purchase_order_id: orderResult.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.totalCost,
        received_quantity: item.receivedQuantity || 0
      }));

      const { data: itemsResult, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsData)
        .select();

      if (itemsError) throw itemsError;

      const newOrder = convertToPurchaseOrder(orderResult, itemsResult || []);
      setPurchaseOrders(prev => [newOrder, ...prev]);

      return newOrder;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      setError('ไม่สามารถสร้างใบสั่งซื้อได้');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [convertToPurchaseOrder]);

  // คำนวณสรุปข้อมูล
  const summary: WarehouseSummary = useMemo(() => {
    return {
      totalWarehouses: warehouses.length,
      activeWarehouses: warehouses.filter(w => w.status === 'active').length,
      totalCapacity: warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0),
      totalUtilization: warehouses.reduce((sum, w) => sum + Math.round((w.capacity || 0) * (w.utilizationPercentage / 100)), 0),
      averageUtilizationRate: warehouses.length > 0 
        ? warehouses.reduce((sum, w) => sum + w.utilizationPercentage, 0) / warehouses.length 
        : 0,
      totalProducts: productInventory.length,
      totalStockValue: productInventory.reduce((sum, p) => sum + (p.quantity * 100), 0), // Mock calculation
      totalMovements: stockMovements.length,
      totalPurchaseOrders: purchaseOrders.length,
      pendingOrders: purchaseOrders.filter(o => o.status === 'pending').length
    };
  }, [warehouses, productInventory, stockMovements, purchaseOrders]);

  // ค้นหาคลังสินค้า
  const searchWarehouses = useCallback((query: string) => {
    if (!query.trim()) return warehouses;
    
    const searchTerm = query.toLowerCase();
    return warehouses.filter(warehouse => 
      warehouse.name.toLowerCase().includes(searchTerm) ||
      warehouse.code.toLowerCase().includes(searchTerm) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm))
    );
  }, [warehouses]);

  return {
    warehouses,
    stockMovements,
    purchaseOrders,
    productInventory,
    summary,
    loading,
    error,
    actions: {
      loadAllData,
      loadWarehouses,
      loadStockMovements,
      loadPurchaseOrders,
      loadProductInventory,
      createWarehouse,
      updateWarehouse,
      createStockMovement,
      createPurchaseOrder,
      searchWarehouses
    }
  };
}