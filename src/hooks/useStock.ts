import { useState, useCallback, useMemo } from 'react';
import { 
  ProductStock, 
  StockMovement, 
  StockAlert, 
  StockSummary,
  StockFilter,
  Supplier,
  Location,
  PurchaseOrder
} from '@/types/stock';
import { 
  mockProductStock, 
  mockStockMovements, 
  mockStockAlerts,
  mockSuppliers,
  mockLocations
} from '@/data/mockStockData';
import { 
  filterProductStock, 
  filterStockMovements, 
  calculateStockSummary,
  createStockMovement,
  createStockAlert,
  calculateStockStatus
} from '@/utils/stockHelpers';

export function useStock() {
  const [products, setProducts] = useState<ProductStock[]>(mockProductStock);
  const [movements, setMovements] = useState<StockMovement[]>(mockStockMovements);
  const [alerts, setAlerts] = useState<StockAlert[]>(mockStockAlerts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filter, setFilter] = useState<StockFilter>({});

  // คำนวณข้อมูลที่กรองแล้ว
  const filteredProducts = useMemo(() => 
    filterProductStock(products, filter), 
    [products, filter]
  );

  const filteredMovements = useMemo(() => 
    filterStockMovements(movements, filter), 
    [movements, filter]
  );

  // คำนวณสรุปข้อมูล
  const summary: StockSummary = useMemo(() => 
    calculateStockSummary(products, movements), 
    [products, movements]
  );

  // การจัดการสินค้า
  const updateProductStock = useCallback((
    productId: string, 
    updates: Partial<ProductStock>
  ) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, ...updates }
        : product
    ));
  }, []);

  const addProduct = useCallback((product: ProductStock) => {
    setProducts(prev => [...prev, product]);
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
  }, []);

  // การจัดการ Stock Movement
  const addStockMovement = useCallback((
    productId: string,
    type: StockMovement['type'],
    quantity: number,
    reason: string,
    options: {
      reference?: string;
      cost?: number;
      location?: string;
      supplierId?: string;
      employeeId: string;
      employeeName: string;
      notes?: string;
    }
  ) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // สร้าง movement record
    const movementData = createStockMovement(
      productId,
      type,
      quantity,
      product.currentStock,
      reason,
      options
    );

    const newMovement: StockMovement = {
      ...movementData,
      id: `mov-${Date.now()}`,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category
      },
      supplier: options.supplierId 
        ? suppliers.find(s => s.id === options.supplierId)
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // อัพเดท stock ของสินค้า
    const actualQuantity = type === 'out' || (type === 'adjustment' && quantity < 0)
      ? -Math.abs(quantity)
      : Math.abs(quantity);
    
    const newStock = Math.max(0, product.currentStock + actualQuantity);
    const newAvailableStock = Math.max(0, newStock - product.reservedStock);
    
    // คำนวณต้นทุนเฉลี่ยใหม่ (ถ้ามีการรับสินค้าเข้า)
    let newAverageCost = product.averageCost;
    if (type === 'in' && options.cost) {
      const totalValue = (product.averageCost * product.currentStock) + (options.cost * quantity);
      const totalQuantity = product.currentStock + quantity;
      newAverageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    }

    const updatedProduct: ProductStock = {
      ...product,
      currentStock: newStock,
      availableStock: newAvailableStock,
      averageCost: newAverageCost,
      totalValue: newStock * newAverageCost,
      stockStatus: calculateStockStatus(newStock, product.minStock, product.maxStock),
      lastMovementDate: new Date().toISOString()
    };

    // อัพเดท state
    setMovements(prev => [newMovement, ...prev]);
    setProducts(prev => prev.map(p => 
      p.id === productId ? updatedProduct : p
    ));

    // สร้าง alert ถ้าจำเป็น
    checkAndCreateAlerts(updatedProduct);

    return newMovement;
  }, [products, suppliers]);

  // ตรวจสอบและสร้าง Alert
  const checkAndCreateAlerts = useCallback((product: ProductStock) => {
    const newAlerts: StockAlert[] = [];

    // ตรวจสอบสต็อกต่ำ
    if (product.stockStatus === 'low_stock') {
      const existingAlert = alerts.find(a => 
        a.productId === product.id && 
        a.type === 'low_stock' && 
        !a.isRead
      );
      
      if (!existingAlert) {
        const alertData = createStockAlert(product, 'low_stock');
        newAlerts.push({
          ...alertData,
          id: `alert-${Date.now()}-1`,
          createdAt: new Date().toISOString()
        });
      }
    }

    // ตรวจสอบหมดสต็อก
    if (product.stockStatus === 'out_of_stock') {
      const existingAlert = alerts.find(a => 
        a.productId === product.id && 
        a.type === 'out_of_stock' && 
        !a.isRead
      );
      
      if (!existingAlert) {
        const alertData = createStockAlert(product, 'out_of_stock');
        newAlerts.push({
          ...alertData,
          id: `alert-${Date.now()}-2`,
          createdAt: new Date().toISOString()
        });
      }
    }

    // ตรวจสอบสต็อกเกิน
    if (product.stockStatus === 'overstock') {
      const existingAlert = alerts.find(a => 
        a.productId === product.id && 
        a.type === 'overstock' && 
        !a.isRead
      );
      
      if (!existingAlert) {
        const alertData = createStockAlert(product, 'overstock');
        newAlerts.push({
          ...alertData,
          id: `alert-${Date.now()}-3`,
          createdAt: new Date().toISOString()
        });
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  }, [alerts]);

  // การจัดการ Alert
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isRead: true }
        : alert
    ));
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  }, []);

  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // การจัดการ Supplier
  const addSupplier = useCallback((supplier: Supplier) => {
    setSuppliers(prev => [...prev, supplier]);
  }, []);

  const updateSupplier = useCallback((
    supplierId: string, 
    updates: Partial<Supplier>
  ) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId 
        ? { ...supplier, ...updates, updatedAt: new Date().toISOString() }
        : supplier
    ));
  }, []);

  const deactivateSupplier = useCallback((supplierId: string) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId 
        ? { ...supplier, isActive: false, updatedAt: new Date().toISOString() }
        : supplier
    ));
  }, []);

  // การจัดการ Location
  const addLocation = useCallback((location: Location) => {
    setLocations(prev => [...prev, location]);
  }, []);

  const updateLocation = useCallback((
    locationId: string, 
    updates: Partial<Location>
  ) => {
    setLocations(prev => prev.map(location => 
      location.id === locationId 
        ? { ...location, ...updates, updatedAt: new Date().toISOString() }
        : location
    ));
  }, []);

  // การจัดการ Purchase Order
  const addPurchaseOrder = useCallback((po: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, po]);
  }, []);

  const updatePurchaseOrder = useCallback((
    poId: string, 
    updates: Partial<PurchaseOrder>
  ) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.id === poId 
        ? { ...po, ...updates, updatedAt: new Date().toISOString() }
        : po
    ));
  }, []);

  // การรับสินค้าจาก PO
  const receivePurchaseOrder = useCallback((
    poId: string,
    receivedItems: { productId: string; receivedQuantity: number; unitCost: number }[]
  ) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // สร้าง stock movements สำหรับสินค้าที่รับเข้า
    receivedItems.forEach(item => {
      addStockMovement(
        item.productId,
        'in',
        item.receivedQuantity,
        'Purchase Order Receipt',
        {
          reference: po.poNumber,
          cost: item.unitCost,
          location: 'คลังสินค้าหลัก',
          supplierId: po.supplierId,
          employeeId: 'current-user',
          employeeName: 'ผู้ใช้ปัจจุบัน',
          notes: `รับสินค้าจาก PO ${po.poNumber}`
        }
      );
    });

    // อัพเดทสถานะ PO
    const allItemsReceived = po.items.every(item => 
      item.receivedQuantity >= item.quantity
    );
    
    const newStatus = allItemsReceived ? 'completed' : 'partial';
    
    updatePurchaseOrder(poId, {
      status: newStatus,
      receivedDate: new Date().toISOString()
    });
  }, [purchaseOrders, addStockMovement, updatePurchaseOrder]);

  // ฟังก์ชันช่วย
  const getUnreadAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.isRead);
  }, [alerts]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => alert.severity === 'critical');
  }, [alerts]);

  const getLowStockProducts = useCallback(() => {
    return products.filter(product => product.stockStatus === 'low_stock');
  }, [products]);

  const getOutOfStockProducts = useCallback(() => {
    return products.filter(product => product.stockStatus === 'out_of_stock');
  }, [products]);

  const getProductById = useCallback((productId: string) => {
    return products.find(product => product.id === productId);
  }, [products]);

  const getSupplierById = useCallback((supplierId: string) => {
    return suppliers.find(supplier => supplier.id === supplierId);
  }, [suppliers]);

  const getLocationById = useCallback((locationId: string) => {
    return locations.find(location => location.id === locationId);
  }, [locations]);

  // การค้นหาและกรอง
  const searchProducts = useCallback((searchTerm: string) => {
    setFilter(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const setStockFilter = useCallback((newFilter: Partial<StockFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  return {
    // Data
    products: filteredProducts,
    allProducts: products,
    movements: filteredMovements,
    allMovements: movements,
    alerts,
    suppliers,
    locations,
    purchaseOrders,
    summary,
    filter,

    // Product Management
    updateProductStock,
    addProduct,
    removeProduct,

    // Stock Movement
    addStockMovement,

    // Alert Management
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert,

    // Supplier Management
    addSupplier,
    updateSupplier,
    deactivateSupplier,

    // Location Management
    addLocation,
    updateLocation,

    // Purchase Order Management
    addPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrder,

    // Helper Functions
    getUnreadAlerts,
    getCriticalAlerts,
    getLowStockProducts,
    getOutOfStockProducts,
    getProductById,
    getSupplierById,
    getLocationById,

    // Search & Filter
    searchProducts,
    setStockFilter,
    clearFilter
  };
}