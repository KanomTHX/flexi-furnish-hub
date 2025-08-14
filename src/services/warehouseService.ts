// Real Warehouse Service - Connected to Supabase Database
import { supabase } from '@/integrations/supabase/client';
import type { 
  Warehouse, 
  StockLevel, 
  StockMovement, 
  SerialNumber,
  StockTransfer,
  ReceiveLog,
  ClaimLog,
  StockAdjustment,
  Product,
  Supplier
} from '@/types/warehouse';

export class WarehouseService {
  // ==================== WAREHOUSE MANAGEMENT ====================
  
  /**
   * Get all warehouses with optional filtering
   */
  static async getWarehouses(filters?: {
    status?: string;
    branchId?: string;
    search?: string;
  }): Promise<Warehouse[]> {
    try {
      let query = supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('ไม่สามารถดึงข้อมูลคลังสินค้าได้');
    }
  }

  /**
   * Get warehouse by ID
   */
  static async getWarehouseById(id: string): Promise<Warehouse | null> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      return null;
    }
  }

  /**
   * Create new warehouse
   */
  static async createWarehouse(warehouseData: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert([{
          name: warehouseData.name,
          code: warehouseData.code,
          location: warehouseData.address?.street || warehouseData.location,
          manager_id: warehouseData.contact?.manager,
          status: warehouseData.status || 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw new Error('ไม่สามารถสร้างคลังสินค้าได้');
    }
  }

  /**
   * Update warehouse
   */
  static async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .update({
          name: updates.name,
          location: updates.address?.street || updates.location,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw new Error('ไม่สามารถอัปเดตคลังสินค้าได้');
    }
  }

  /**
   * Delete warehouse
   */
  static async deleteWarehouse(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw new Error('ไม่สามารถลบคลังสินค้าได้');
    }
  }

  // ==================== STOCK LEVEL MANAGEMENT ====================

  /**
   * Get stock levels with filtering and search
   */
  static async getStockLevels(filters?: {
    warehouseId?: string;
    productId?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: StockLevel[];
    total: number;
  }> {
    try {
      // Use the stock_summary_view for better performance
      let query = supabase
        .from('stock_summary_view')
        .select('*', { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.search) {
        query = query.or(`product_name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        // Filter by stock status
        switch (filters.status) {
          case 'in_stock':
            query = query.gt('available_quantity', 0);
            break;
          case 'low_stock':
            query = query.lte('available_quantity', 5).gt('available_quantity', 0);
            break;
          case 'out_of_stock':
            query = query.eq('available_quantity', 0);
            break;
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('product_name');

      if (error) throw error;

      // Transform data to match StockLevel interface
      const stockLevels: StockLevel[] = (data || []).map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        productCode: item.product_code,
        brand: item.brand,
        model: item.model,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouse_name,
        warehouseCode: item.warehouse_code,
        totalQuantity: item.total_quantity || 0,
        availableQuantity: item.available_quantity || 0,
        soldQuantity: item.sold_quantity || 0,
        transferredQuantity: item.transferred_quantity || 0,
        claimedQuantity: item.claimed_quantity || 0,
        damagedQuantity: item.damaged_quantity || 0,
        reservedQuantity: item.reserved_quantity || 0,
        averageCost: item.average_cost || 0,
        availableValue: item.available_value || 0
      }));

      return {
        data: stockLevels,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสต็อกได้');
    }
  }

  /**
   * Get stock movements history
   */
  static async getStockMovements(filters?: {
    warehouseId?: string;
    productId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: StockMovement[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, code),
          warehouse:warehouses(id, name, code),
          serial_number:product_serial_numbers(serial_number)
        `, { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.movementType) {
        query = query.eq('movement_type', filters.movementType);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match StockMovement interface
      const movements: StockMovement[] = (data || []).map(item => ({
        id: item.id,
        productId: item.product_id,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code
        } : undefined,
        serialNumberId: item.serial_number_id,
        serialNumber: item.serial_number ? {
          id: item.serial_number_id,
          serialNumber: item.serial_number.serial_number,
          productId: item.product_id,
          warehouseId: item.warehouse_id,
          unitCost: item.unit_cost || 0,
          status: 'available' as any,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.created_at)
        } : undefined,
        warehouseId: item.warehouse_id,
        warehouse: item.warehouse ? {
          id: item.warehouse.id,
          name: item.warehouse.name,
          code: item.warehouse.code
        } : undefined,
        movementType: item.movement_type,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        referenceType: item.reference_type,
        referenceId: item.reference_id,
        referenceNumber: item.reference_number,
        notes: item.notes,
        performedBy: item.performed_by,
        createdAt: new Date(item.created_at)
      }));

      return {
        data: movements,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw new Error('ไม่สามารถดึงข้อมูลการเคลื่อนไหวสต็อกได้');
    }
  }

  // ==================== SERIAL NUMBER MANAGEMENT ====================

  /**
   * Get serial numbers with filtering
   */
  static async getSerialNumbers(filters?: {
    warehouseId?: string;
    productId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: SerialNumber[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(id, name, code, brand, model, category),
          warehouse:warehouses(id, name, code),
          supplier:suppliers(id, name, code)
        `, { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.ilike('serial_number', `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match SerialNumber interface
      const serialNumbers: SerialNumber[] = (data || []).map(item => ({
        id: item.id,
        serialNumber: item.serial_number,
        productId: item.product_id,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code,
          brand: item.product.brand,
          model: item.product.model,
          category: item.product.category
        } : undefined,
        warehouseId: item.warehouse_id,
        warehouse: item.warehouse ? {
          id: item.warehouse.id,
          name: item.warehouse.name,
          code: item.warehouse.code
        } : undefined,
        unitCost: item.unit_cost,
        supplierId: item.supplier_id,
        supplier: item.supplier ? {
          id: item.supplier.id,
          name: item.supplier.name,
          code: item.supplier.code
        } : undefined,
        invoiceNumber: item.invoice_number,
        status: item.status,
        soldAt: item.sold_at ? new Date(item.sold_at) : undefined,
        soldTo: item.sold_to,
        referenceNumber: item.reference_number,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      return {
        data: serialNumbers,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching serial numbers:', error);
      throw new Error('ไม่สามารถดึงข้อมูลหมายเลขซีเรียลได้');
    }
  }

  /**
   * Create serial numbers for received goods
   */
  static async createSerialNumbers(serialNumbers: {
    productId: string;
    warehouseId: string;
    unitCost: number;
    supplierId?: string;
    invoiceNumber?: string;
    quantity: number;
  }[]): Promise<SerialNumber[]> {
    try {
      const serialNumbersToInsert = [];

      for (const item of serialNumbers) {
        for (let i = 0; i < item.quantity; i++) {
          // Generate serial number using the database function
          const { data: serialNumberData, error: serialError } = await supabase
            .rpc('generate_serial_number', {
              product_code: `PROD-${item.productId.slice(-8)}`, // Use last 8 chars of product ID
              warehouse_code: `WH-${item.warehouseId.slice(-4)}` // Use last 4 chars of warehouse ID
            });

          if (serialError) throw serialError;

          serialNumbersToInsert.push({
            serial_number: serialNumberData,
            product_id: item.productId,
            warehouse_id: item.warehouseId,
            unit_cost: item.unitCost,
            supplier_id: item.supplierId,
            invoice_number: item.invoiceNumber,
            status: 'available'
          });
        }
      }

      const { data, error } = await supabase
        .from('product_serial_numbers')
        .insert(serialNumbersToInsert)
        .select(`
          *,
          product:products(id, name, code),
          warehouse:warehouses(id, name, code)
        `);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        serialNumber: item.serial_number,
        productId: item.product_id,
        product: item.product,
        warehouseId: item.warehouse_id,
        warehouse: item.warehouse,
        unitCost: item.unit_cost,
        supplierId: item.supplier_id,
        invoiceNumber: item.invoice_number,
        status: item.status,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('Error creating serial numbers:', error);
      throw new Error('ไม่สามารถสร้างหมายเลขซีเรียลได้');
    }
  }

  // ==================== STOCK OPERATIONS ====================

  /**
   * Receive goods into warehouse
   */
  static async receiveGoods(receiveData: {
    warehouseId: string;
    supplierId?: string;
    invoiceNumber?: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    receivedBy: string;
  }): Promise<{
    receiveLog: ReceiveLog;
    serialNumbers: SerialNumber[];
    movements: StockMovement[];
  }> {
    try {
      // Generate receive number
      const receiveNumber = `RCV-${Date.now()}`;
      const totalItems = receiveData.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = receiveData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

      // Create receive log
      const { data: receiveLog, error: receiveError } = await supabase
        .from('receive_logs')
        .insert([{
          receive_number: receiveNumber,
          supplier_id: receiveData.supplierId,
          warehouse_id: receiveData.warehouseId,
          invoice_number: receiveData.invoiceNumber,
          total_items: totalItems,
          total_cost: totalCost,
          received_by: receiveData.receivedBy,
          status: 'completed',
          notes: receiveData.notes
        }])
        .select()
        .single();

      if (receiveError) throw receiveError;

      // Create serial numbers for each item
      const serialNumbers = await this.createSerialNumbers(
        receiveData.items.map(item => ({
          ...item,
          warehouseId: receiveData.warehouseId,
          supplierId: receiveData.supplierId,
          invoiceNumber: receiveData.invoiceNumber
        }))
      );

      // Log stock movements
      const movements = [];
      for (const item of receiveData.items) {
        const movement = await this.logStockMovement({
          productId: item.productId,
          warehouseId: receiveData.warehouseId,
          movementType: 'receive',
          quantity: item.quantity,
          unitCost: item.unitCost,
          referenceType: 'purchase',
          referenceNumber: receiveNumber,
          notes: receiveData.notes,
          performedBy: receiveData.receivedBy
        });
        movements.push(movement);
      }

      return {
        receiveLog: {
          id: receiveLog.id,
          receiveNumber: receiveLog.receive_number,
          supplierId: receiveLog.supplier_id,
          warehouseId: receiveLog.warehouse_id,
          invoiceNumber: receiveLog.invoice_number,
          totalItems: receiveLog.total_items,
          totalCost: receiveLog.total_cost,
          receivedBy: receiveLog.received_by,
          status: receiveLog.status,
          notes: receiveLog.notes,
          createdAt: new Date(receiveLog.created_at)
        },
        serialNumbers,
        movements
      };
    } catch (error) {
      console.error('Error receiving goods:', error);
      throw new Error('ไม่สามารถรับสินค้าเข้าคลังได้');
    }
  }

  /**
   * Log stock movement
   */
  static async logStockMovement(movementData: {
    productId: string;
    serialNumberId?: string;
    warehouseId: string;
    movementType: string;
    quantity: number;
    unitCost?: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    performedBy: string;
  }): Promise<StockMovement> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: movementData.productId,
          serial_number_id: movementData.serialNumberId,
          warehouse_id: movementData.warehouseId,
          movement_type: movementData.movementType,
          quantity: movementData.quantity,
          unit_cost: movementData.unitCost,
          reference_type: movementData.referenceType,
          reference_id: movementData.referenceId,
          reference_number: movementData.referenceNumber,
          notes: movementData.notes,
          performed_by: movementData.performedBy
        }])
        .select(`
          *,
          product:products(id, name, code),
          warehouse:warehouses(id, name, code)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        productId: data.product_id,
        product: data.product,
        serialNumberId: data.serial_number_id,
        warehouseId: data.warehouse_id,
        warehouse: data.warehouse,
        movementType: data.movement_type,
        quantity: data.quantity,
        unitCost: data.unit_cost,
        referenceType: data.reference_type,
        referenceId: data.reference_id,
        referenceNumber: data.reference_number,
        notes: data.notes,
        performedBy: data.performed_by,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error logging stock movement:', error);
      throw new Error('ไม่สามารถบันทึกการเคลื่อนไหวสต็อกได้');
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Get warehouse summary statistics
   */
  static async getWarehouseSummary(warehouseId?: string): Promise<{
    totalProducts: number;
    totalQuantity: number;
    availableQuantity: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  }> {
    try {
      const { data: stockLevels } = await this.getStockLevels({ 
        warehouseId,
        limit: 1000 // Get all for summary
      });

      const summary = stockLevels.data.reduce((acc, stock) => ({
        totalProducts: acc.totalProducts + 1,
        totalQuantity: acc.totalQuantity + stock.totalQuantity,
        availableQuantity: acc.availableQuantity + stock.availableQuantity,
        totalValue: acc.totalValue + stock.availableValue,
        lowStockItems: acc.lowStockItems + (stock.availableQuantity <= 5 && stock.availableQuantity > 0 ? 1 : 0),
        outOfStockItems: acc.outOfStockItems + (stock.availableQuantity === 0 ? 1 : 0)
      }), {
        totalProducts: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      });

      return summary;
    } catch (error) {
      console.error('Error getting warehouse summary:', error);
      return {
        totalProducts: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      };
    }
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(threshold: number = 5): Promise<StockLevel[]> {
    try {
      const { data } = await this.getStockLevels({
        limit: 100
      });

      return data.filter(stock => 
        stock.availableQuantity <= threshold && stock.availableQuantity > 0
      );
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      return [];
    }
  }

  /**
   * Get out of stock items
   */
  static async getOutOfStockItems(): Promise<StockLevel[]> {
    try {
      const { data } = await this.getStockLevels({
        status: 'out_of_stock',
        limit: 100
      });

      return data;
    } catch (error) {
      console.error('Error getting out of stock items:', error);
      return [];
    }
  }
}

export default WarehouseService;