// Real Warehouse Service - Connected to Supabase Database
import { supabase } from '@/integrations/supabase/client';
import { auditTrailService } from './auditTrailService';
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
      // Query from product_inventory without joins to avoid foreign key issues
      let query = supabase
        .from('product_inventory')
        .select('*', { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('branch_id', filters.warehouseId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      // Skip search filter for now since product_inventory doesn't have product_name/product_code
      // if (filters?.search) {
      //   query = query.or(`product_name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%`);
      // }

      if (filters?.status) {
        // Filter by inventory status
        switch (filters.status) {
          case 'in_stock':
            query = query.gt('quantity', 0);
            break;
          case 'low_stock':
            query = query.lte('quantity', 5).gt('quantity', 0);
            break;
          case 'out_of_stock':
            query = query.eq('quantity', 0);
            break;
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('last_updated', { ascending: false });

      if (error) throw error;

      // Transform product_inventory data to StockLevel interface
      const stockLevels: StockLevel[] = (data || []).map(item => ({
        productId: item.product_id,
        productName: `Product ${item.product_id?.slice(-8) || 'Unknown'}`,
        productCode: `PRD-${item.product_id?.slice(-4) || '0000'}`,
        brand: '',
        model: '',
        warehouseId: item.branch_id,
        warehouseName: `Branch ${item.branch_id?.slice(-8) || 'Unknown'}`,
        warehouseCode: `BR-${item.branch_id?.slice(-4) || '0000'}`,
        totalQuantity: item.quantity || 0,
        availableQuantity: item.available_quantity || item.quantity || 0,
        soldQuantity: item.sold_quantity || 0,
        transferredQuantity: item.transferred_quantity || 0,
        claimedQuantity: item.claimed_quantity || 0,
        damagedQuantity: item.damaged_quantity || 0,
        reservedQuantity: item.reserved_quantity || 0,
        averageCost: 0, // No cost data in product_inventory
        availableValue: 0 // No cost data to calculate value
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
    branchId?: string;
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
          product:products(id, name, product_code),
          warehouse:warehouses(id, name, code, branch_id)
        `, { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('branch_id', filters.warehouseId);
      }

      if (filters?.branchId) {
        query = query.eq('warehouse.branch_id', filters.branchId);
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
          code: item.product.product_code
        } : undefined,
        serialNumberId: item.serial_number_id,
        serialNumber: item.serial_number_id ? {
          id: item.serial_number_id,
          serialNumber: `SN-${item.serial_number_id.slice(-8)}`,
          productId: item.product_id,
          branchId: item.branch_id,
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
        .from('product_inventory')
        .select('*', { count: 'exact' });

      if (filters?.warehouseId) {
        query = query.eq('branch_id', filters.warehouseId);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Skip search for now since product_inventory doesn't have serial_number
      // if (filters?.search) {
      //   query = query.ilike('serial_number', `%${filters.search}%`);
      // }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('last_updated', { ascending: false });

      if (error) throw error;

      // Transform product_inventory data to SerialNumber interface
      const serialNumbers: SerialNumber[] = (data || []).map(item => ({
        id: item.id,
        serialNumber: `INV-${item.id.slice(-8)}`, // Generate serial from inventory ID
        productId: item.product_id,
        product: {
          id: item.product_id,
          name: `Product ${item.product_id.slice(-8)}`,
          code: `PRD-${item.product_id.slice(-4)}`,
          brand: '',
          model: '',
          category: ''
        },
        warehouseId: item.branch_id,
        warehouse: {
          id: item.branch_id,
          name: `Branch ${item.branch_id.slice(-8)}`,
          code: `BR-${item.branch_id.slice(-4)}`
        },
        unitCost: 0, // No cost data in product_inventory
        supplierId: '',
        supplier: undefined,
        invoiceNumber: '',
        status: item.status || 'available',
        soldAt: undefined,
        soldTo: '',
        referenceNumber: '',
        notes: '',
        createdAt: new Date(item.last_updated),
        updatedAt: new Date(item.last_updated)
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
    branchId: string;
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
              warehouse_code: `BR-${item.branchId.slice(-4)}` // Use last 4 chars of branch ID
            });

          if (serialError) throw serialError;

          serialNumbersToInsert.push({
            serial_number: serialNumberData,
            product_id: item.productId,
            branch_id: item.branchId,
            unit_cost: item.unitCost,
            supplier_id: item.supplierId,
            invoice_number: item.invoiceNumber,
            status: 'available'
          });
        }
      }

      const { data, error } = await supabase
        .from('serial_numbers')
        .insert(serialNumbersToInsert)
        .select(`
          *,
          product:products(id, name, product_code),
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
   * Withdraw goods from warehouse
   */
  static async withdrawGoods(withdrawData: {
    branchId: string;
    serialNumberIds: string[];
    reason: string;
    referenceType?: string;
    referenceNumber?: string;
    soldTo?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{
    movements: StockMovement[];
    updatedSerialNumbers: SerialNumber[];
  }> {
    try {
      const movements: StockMovement[] = [];
      const updatedSerialNumbers: SerialNumber[] = [];

      // Process each serial number
      for (const serialNumberId of withdrawData.serialNumberIds) {
        // Get serial number details
        const { data: serialNumber, error: snError } = await supabase
          .from('serial_numbers')
          .select(`
            *,
            product:products(id, name, product_code)
          `)
          .eq('id', serialNumberId)
          .single();

        if (snError) throw snError;

        // Update serial number status
        const newStatus = withdrawData.referenceType === 'sale' ? 'sold' : 
                         withdrawData.referenceType === 'transfer' ? 'transferred' :
                         withdrawData.referenceType === 'claim' ? 'claimed' : 'sold';

        const { data: updatedSN, error: updateError } = await supabase
          .from('serial_numbers')
          .update({
            status: newStatus,
            sold_at: newStatus === 'sold' ? new Date().toISOString() : null,
            sold_to: withdrawData.customerName || withdrawData.soldTo,
            reference_number: withdrawData.referenceNumber,
            notes: withdrawData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', serialNumberId)
          .select(`
            *,
            product:products(id, name, product_code),
            warehouse:warehouses(id, name, code)
          `)
          .single();

        if (updateError) throw updateError;

        // Log stock movement
        const movement = await this.logStockMovement({
          productId: serialNumber.product_id,
          serialNumberId: serialNumberId,
          warehouseId: withdrawData.branchId,
          movementType: 'withdraw',
          quantity: 1,
          unitCost: serialNumber.unit_cost,
          referenceType: withdrawData.referenceType || 'sale',
          referenceNumber: withdrawData.referenceNumber,
          notes: `${withdrawData.reason}${withdrawData.notes ? ` - ${withdrawData.notes}` : ''}`,
          performedBy: withdrawData.performedBy
        });

        movements.push(movement);
        updatedSerialNumbers.push({
          id: updatedSN.id,
          serialNumber: updatedSN.serial_number,
          productId: updatedSN.product_id,
          product: updatedSN.product,
          branchId: updatedSN.branch_id,
          warehouse: updatedSN.warehouse,
          unitCost: updatedSN.unit_cost,
          supplierId: updatedSN.supplier_id,
          invoiceNumber: updatedSN.invoice_number,
          status: updatedSN.status,
          soldAt: updatedSN.sold_at ? new Date(updatedSN.sold_at) : undefined,
          soldTo: updatedSN.sold_to,
          referenceNumber: updatedSN.reference_number,
          notes: updatedSN.notes,
          createdAt: new Date(updatedSN.created_at),
          updatedAt: new Date(updatedSN.updated_at)
        });

        // Log audit trail
        await auditTrailService.logWarehouseOperation(
          'STOCK_WITHDRAW',
          'serial_numbers',
          serialNumberId,
          `จ่ายสินค้า ${serialNumber.product?.name} (${serialNumber.serial_number}) - ${withdrawData.reason}`,
          { status: serialNumber.status },
          { status: newStatus, sold_to: withdrawData.customerName || withdrawData.soldTo },
          {
            warehouse_id: withdrawData.warehouseId,
            reference_type: withdrawData.referenceType,
            reference_number: withdrawData.referenceNumber,
            performed_by: withdrawData.performedBy
          }
        );
      }

      return {
        movements,
        updatedSerialNumbers
      };
    } catch (error) {
      console.error('Error withdrawing goods:', error);
      throw new Error('ไม่สามารถจ่ายสินค้าได้');
    }
  }

  /**
   * Transfer goods between warehouses
   */
  static async transferGoods(transferData: {
    sourceBranchId: string;
    targetBranchId: string;
    serialNumberIds: string[];
    reason: string;
    priority?: string;
    scheduledDate?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{
    transferNumber: string;
    outMovements: StockMovement[];
    inMovements: StockMovement[];
    updatedSerialNumbers: SerialNumber[];
  }> {
    try {
      const transferNumber = `TRF-${Date.now()}`;
      const outMovements: StockMovement[] = [];
      const inMovements: StockMovement[] = [];
      const updatedSerialNumbers: SerialNumber[] = [];

      // Process each serial number
      for (const serialNumberId of transferData.serialNumberIds) {
        // Get serial number details
        const { data: serialNumber, error: snError } = await supabase
          .from('serial_numbers')
          .select(`
            *,
            product:products(id, name, product_code)
          `)
          .eq('id', serialNumberId)
          .single();

        if (snError) throw snError;

        // Update serial number warehouse and status
        const { data: updatedSN, error: updateError } = await supabase
          .from('serial_numbers')
          .update({
            branch_id: transferData.targetBranchId,
            status: 'transferred',
            reference_number: transferNumber,
            notes: transferData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', serialNumberId)
          .select(`
            *,
            product:products(id, name, product_code),
            warehouse:warehouses(id, name, code)
          `)
          .single();

        if (updateError) throw updateError;

        // Log transfer out movement
        const outMovement = await this.logStockMovement({
          productId: serialNumber.product_id,
          serialNumberId: serialNumberId,
          warehouseId: transferData.sourceBranchId,
          movementType: 'transfer_out',
          quantity: 1,
          unitCost: serialNumber.unit_cost,
          referenceType: 'transfer',
          referenceNumber: transferNumber,
          notes: `Transfer to target branch - ${transferData.reason}`,
          performedBy: transferData.performedBy
        });

        // Log transfer in movement
        const inMovement = await this.logStockMovement({
          productId: serialNumber.product_id,
          serialNumberId: serialNumberId,
          warehouseId: transferData.targetBranchId,
          movementType: 'transfer_in',
          quantity: 1,
          unitCost: serialNumber.unit_cost,
          referenceType: 'transfer',
          referenceNumber: transferNumber,
          notes: `Transfer from source branch - ${transferData.reason}`,
          performedBy: transferData.performedBy
        });

        outMovements.push(outMovement);
        inMovements.push(inMovement);
        updatedSerialNumbers.push({
          id: updatedSN.id,
          serialNumber: updatedSN.serial_number,
          productId: updatedSN.product_id,
          product: updatedSN.product,
          warehouseId: updatedSN.warehouse_id,
          warehouse: updatedSN.warehouse,
          unitCost: updatedSN.unit_cost,
          supplierId: updatedSN.supplier_id,
          invoiceNumber: updatedSN.invoice_number,
          status: updatedSN.status,
          soldAt: updatedSN.sold_at ? new Date(updatedSN.sold_at) : undefined,
          soldTo: updatedSN.sold_to,
          referenceNumber: updatedSN.reference_number,
          notes: updatedSN.notes,
          createdAt: new Date(updatedSN.created_at),
          updatedAt: new Date(updatedSN.updated_at)
        });

        // Log audit trail
        await auditTrailService.logWarehouseOperation(
          'STOCK_TRANSFER',
          'serial_numbers',
          serialNumberId,
          `โอนย้ายสินค้า ${serialNumber.product?.name} (${serialNumber.serial_number}) - ${transferData.reason}`,
          { warehouse_id: transferData.sourceWarehouseId, status: serialNumber.status },
          { warehouse_id: transferData.targetWarehouseId, status: 'transferred' },
          {
            transfer_number: transferNumber,
            source_warehouse_id: transferData.sourceWarehouseId,
            target_warehouse_id: transferData.targetWarehouseId,
            priority: transferData.priority,
            scheduled_date: transferData.scheduledDate,
            performed_by: transferData.performedBy
          }
        );
      }

      return {
        transferNumber,
        outMovements,
        inMovements,
        updatedSerialNumbers
      };
    } catch (error) {
      console.error('Error transferring goods:', error);
      throw new Error('ไม่สามารถโอนย้ายสินค้าได้');
    }
  }

  /**
   * Adjust stock levels
   */
  static async adjustStock(adjustmentData: {
    warehouseId: string;
    adjustmentType: string;
    serialNumberIds: string[];
    reason: string;
    notes?: string;
    performedBy: string;
  }): Promise<{
    adjustmentNumber: string;
    movements: StockMovement[];
    updatedSerialNumbers: SerialNumber[];
  }> {
    try {
      const adjustmentNumber = `ADJ-${Date.now()}`;
      const movements: StockMovement[] = [];
      const updatedSerialNumbers: SerialNumber[] = [];

      // Process each serial number
      for (const serialNumberId of adjustmentData.serialNumberIds) {
        // Get serial number details
        const { data: serialNumber, error: snError } = await supabase
          .from('serial_numbers')
          .select(`
            *,
            product:products(id, name, product_code)
          `)
          .eq('id', serialNumberId)
          .single();

        if (snError) throw snError;

        // Update serial number if needed (for status changes)
        let updatedSN = serialNumber;
        if (adjustmentData.adjustmentType === 'damage') {
          const { data: updated, error: updateError } = await supabase
            .from('serial_numbers')
            .update({
              status: 'damaged',
              reference_number: adjustmentNumber,
              notes: adjustmentData.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', serialNumberId)
            .select(`
              *,
              product:products(id, name, product_code),
              warehouse:warehouses(id, name, code)
            `)
            .single();

          if (updateError) throw updateError;
          updatedSN = updated;
        }

        // Log stock movement
        const movement = await this.logStockMovement({
          productId: serialNumber.product_id,
          serialNumberId: serialNumberId,
          warehouseId: adjustmentData.warehouseId,
          movementType: 'adjustment',
          quantity: adjustmentData.adjustmentType === 'loss' ? -1 : 
                   adjustmentData.adjustmentType === 'found' ? 1 : 0,
          unitCost: serialNumber.unit_cost,
          referenceType: 'adjustment',
          referenceNumber: adjustmentNumber,
          notes: `${adjustmentData.adjustmentType}: ${adjustmentData.reason}`,
          performedBy: adjustmentData.performedBy
        });

        movements.push(movement);
        updatedSerialNumbers.push({
          id: updatedSN.id,
          serialNumber: updatedSN.serial_number,
          productId: updatedSN.product_id,
          product: updatedSN.product,
          warehouseId: updatedSN.warehouse_id,
          warehouse: updatedSN.warehouse,
          unitCost: updatedSN.unit_cost,
          supplierId: updatedSN.supplier_id,
          invoiceNumber: updatedSN.invoice_number,
          status: updatedSN.status,
          soldAt: updatedSN.sold_at ? new Date(updatedSN.sold_at) : undefined,
          soldTo: updatedSN.sold_to,
          referenceNumber: updatedSN.reference_number,
          notes: updatedSN.notes,
          createdAt: new Date(updatedSN.created_at),
          updatedAt: new Date(updatedSN.updated_at)
        });

        // Log audit trail
        await auditTrailService.logWarehouseOperation(
          'STOCK_ADJUSTMENT',
          'serial_numbers',
          serialNumberId,
          `ปรับปรุงสต็อก ${serialNumber.product?.name} (${serialNumber.serial_number}) - ${adjustmentData.adjustmentType}: ${adjustmentData.reason}`,
          { status: serialNumber.status },
          { status: updatedSN.status },
          {
            adjustment_number: adjustmentNumber,
            adjustment_type: adjustmentData.adjustmentType,
            warehouse_id: adjustmentData.warehouseId,
            performed_by: adjustmentData.performedBy
          }
        );
      }

      return {
        adjustmentNumber,
        movements,
        updatedSerialNumbers
      };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw new Error('ไม่สามารถปรับปรุงสต็อกได้');
    }
  }

  /**
   * Search by barcode or serial number
   */
  static async searchByBarcode(searchData: {
    barcode: string;
    warehouseId?: string;
  }): Promise<{
    found: boolean;
    serialNumber?: SerialNumber;
    suggestions?: SerialNumber[];
  }> {
    try {
      // Search for exact match first
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(id, name, product_code, brand, model, category),
          warehouse:warehouses(id, name, code),
          supplier:suppliers(id, name, code)
        `)
        .or(`serial_number.eq.${searchData.barcode},product.barcode.eq.${searchData.barcode}`);

      if (searchData.warehouseId) {
        query = query.eq('warehouse_id', searchData.warehouseId);
      }

      const { data: exactMatch, error: exactError } = await query.limit(1);

      if (exactError) throw exactError;

      if (exactMatch && exactMatch.length > 0) {
        const serialNumber = exactMatch[0];
        return {
          found: true,
          serialNumber: {
            id: serialNumber.id,
            serialNumber: serialNumber.serial_number,
            productId: serialNumber.product_id,
            product: serialNumber.product,
            warehouseId: serialNumber.warehouse_id,
            warehouse: serialNumber.warehouse,
            unitCost: serialNumber.unit_cost,
            supplierId: serialNumber.supplier_id,
            supplier: serialNumber.supplier,
            invoiceNumber: serialNumber.invoice_number,
            status: serialNumber.status,
            soldAt: serialNumber.sold_at ? new Date(serialNumber.sold_at) : undefined,
            soldTo: serialNumber.sold_to,
            referenceNumber: serialNumber.reference_number,
            notes: serialNumber.notes,
            createdAt: new Date(serialNumber.created_at),
            updatedAt: new Date(serialNumber.updated_at)
          }
        };
      }

      // If no exact match, search for similar items
      let suggestionQuery = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(id, name, product_code, brand, model, category),
          warehouse:warehouses(id, name, code)
        `)
        .or(`serial_number.ilike.%${searchData.barcode}%,product.name.ilike.%${searchData.barcode}%,product.product_code.ilike.%${searchData.barcode}%`);

      if (searchData.warehouseId) {
        suggestionQuery = suggestionQuery.eq('warehouse_id', searchData.warehouseId);
      }

      const { data: suggestions, error: suggestionError } = await suggestionQuery.limit(5);

      if (suggestionError) throw suggestionError;

      const suggestionResults: SerialNumber[] = (suggestions || []).map(item => ({
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
        soldAt: item.sold_at ? new Date(item.sold_at) : undefined,
        soldTo: item.sold_to,
        referenceNumber: item.reference_number,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      return {
        found: false,
        suggestions: suggestionResults
      };

    } catch (error) {
      console.error('Error searching by barcode:', error);
      throw new Error('ไม่สามารถค้นหาบาร์โค้ดได้');
    }
  }

  /**
   * Log barcode scan activity
   */
  static async logBarcodeScan(scanData: {
    barcode: string;
    warehouseId: string;
    found: boolean;
    serialNumberId?: string;
    performedBy: string;
    notes?: string;
  }): Promise<void> {
    try {
      // Log the scan activity
      await this.logStockMovement({
        productId: scanData.serialNumberId ? 'scan-activity' : 'unknown',
        serialNumberId: scanData.serialNumberId,
        warehouseId: scanData.warehouseId,
        movementType: 'scan',
        quantity: 0, // No quantity change for scans
        referenceType: 'barcode_scan',
        referenceNumber: `SCAN-${Date.now()}`,
        notes: `Barcode scan: ${scanData.barcode} - ${scanData.found ? 'Found' : 'Not found'}${scanData.notes ? ` - ${scanData.notes}` : ''}`,
        performedBy: scanData.performedBy
      });
    } catch (error) {
      console.error('Error logging barcode scan:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Process batch operations
   */
  static async processBatchOperation(batchData: {
    type: string;
    warehouseId: string;
    serialNumbers: string[];
    targetWarehouseId?: string;
    newStatus?: string;
    newPrice?: number;
    adjustmentReason?: string;
    notes?: string;
    performedBy: string;
  }): Promise<{
    batchNumber: string;
    results: Array<{
      serialNumber: string;
      success: boolean;
      message: string;
    }>;
  }> {
    try {
      const batchNumber = `BATCH-${Date.now()}`;
      const results: Array<{
        serialNumber: string;
        success: boolean;
        message: string;
      }> = [];

      // Process each serial number
      for (const serialNumber of batchData.serialNumbers) {
        try {
          // Get serial number details first
          const { data: snData, error: snError } = await supabase
            .from('serial_numbers')
            .select('*')
            .eq('serial_number', serialNumber)
            .eq('warehouse_id', batchData.warehouseId)
            .single();

          if (snError || !snData) {
            results.push({
              serialNumber,
              success: false,
              message: 'ไม่พบ Serial Number ในคลังนี้'
            });
            continue;
          }

          // Process based on operation type
          switch (batchData.type) {
            case 'status_update':
              await this.updateSerialNumberStatus(snData.id, batchData.newStatus!, batchNumber);
              results.push({
                serialNumber,
                success: true,
                message: `อัปเดตสถานะเป็น ${batchData.newStatus} แล้ว`
              });
              break;

            case 'transfer':
              await this.transferSerialNumber(snData.id, batchData.targetWarehouseId!, batchNumber);
              results.push({
                serialNumber,
                success: true,
                message: `โอนย้ายไปคลังปลายทางแล้ว`
              });
              break;

            case 'adjust':
              await this.adjustSerialNumber(snData.id, batchData.adjustmentReason!, batchNumber);
              results.push({
                serialNumber,
                success: true,
                message: 'ปรับปรุงข้อมูลแล้ว'
              });
              break;

            case 'price_update':
              await this.updateSerialNumberPrice(snData.id, batchData.newPrice!, batchNumber);
              results.push({
                serialNumber,
                success: true,
                message: `อัปเดตราคาเป็น ฿${batchData.newPrice} แล้ว`
              });
              break;

            default:
              results.push({
                serialNumber,
                success: false,
                message: `ไม่รองรับการดำเนินการ: ${batchData.type}`
              });
          }

          // Log the batch operation
          await this.logStockMovement({
            productId: snData.product_id,
            serialNumberId: snData.id,
            warehouseId: batchData.warehouseId,
            movementType: 'batch_operation',
            quantity: 0, // No quantity change for batch operations
            unitCost: snData.unit_cost,
            referenceType: 'batch',
            referenceNumber: batchNumber,
            notes: `Batch ${batchData.type}: ${batchData.notes || ''}`,
            performedBy: batchData.performedBy
          });

          // Log audit trail
          await auditTrailService.logWarehouseOperation(
            'BATCH_OPERATION',
            'serial_numbers',
            snData.id,
            `ดำเนินการแบบกลุ่ม: ${batchData.type} สำหรับ ${serialNumber}`,
            { status: snData.status },
            { 
              status: batchData.newStatus || snData.status,
              warehouse_id: batchData.targetWarehouseId || snData.warehouse_id,
              unit_cost: batchData.newPrice || snData.unit_cost
            },
            {
              batch_number: batchNumber,
              batch_type: batchData.type,
              warehouse_id: batchData.warehouseId,
              target_warehouse_id: batchData.targetWarehouseId,
              performed_by: batchData.performedBy
            }
          );

        } catch (error) {
          console.error(`Error processing ${serialNumber}:`, error);
          results.push({
            serialNumber,
            success: false,
            message: 'เกิดข้อผิดพลาดในการดำเนินการ'
          });
        }
      }

      return {
        batchNumber,
        results
      };

    } catch (error) {
      console.error('Error processing batch operation:', error);
      throw new Error('ไม่สามารถดำเนินการแบบกลุ่มได้');
    }
  }

  /**
   * Update serial number status (for batch operations)
   */
  private static async updateSerialNumberStatus(
    serialNumberId: string, 
    newStatus: string, 
    batchNumber: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serial_numbers')
      .update({
        status: newStatus,
        reference_number: batchNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  }

  /**
   * Transfer serial number (for batch operations)
   */
  private static async transferSerialNumber(
    serialNumberId: string, 
    targetWarehouseId: string, 
    batchNumber: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serial_numbers')
      .update({
        warehouse_id: targetWarehouseId,
        status: 'transferred',
        reference_number: batchNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  }

  /**
   * Adjust serial number (for batch operations)
   */
  private static async adjustSerialNumber(
    serialNumberId: string, 
    reason: string, 
    batchNumber: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serial_numbers')
      .update({
        notes: reason,
        reference_number: batchNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  }

  /**
   * Update serial number price (for batch operations)
   */
  private static async updateSerialNumberPrice(
    serialNumberId: string, 
    newPrice: number, 
    batchNumber: string
  ): Promise<void> {
    const { error } = await supabase
      .from('serial_numbers')
      .update({
        unit_cost: newPrice,
        reference_number: batchNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  }

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

      // Since receive_logs table doesn't exist, we'll create a mock receive log
      // and focus on stock movements and inventory updates
      const receiveLog = {
        id: `mock-${Date.now()}`,
        receive_number: receiveNumber,
        supplier_id: receiveData.supplierId,
        warehouse_id: receiveData.warehouseId,
        invoice_number: receiveData.invoiceNumber,
        total_items: totalItems,
        total_cost: totalCost,
        received_by: receiveData.receivedBy,
        status: 'completed',
        notes: receiveData.notes,
        created_at: new Date().toISOString()
      };

      console.log('📝 สร้าง Receive Log (Mock):', receiveNumber);

      // Create serial numbers for each item
      console.log('📝 สร้าง Serial Numbers สำหรับสินค้า');
      const serialNumbers = await this.createSerialNumbers(
        receiveData.items.map(item => ({
          ...item,
          branchId: receiveData.warehouseId, // Use warehouseId as branchId
          supplierId: receiveData.supplierId,
          invoiceNumber: receiveData.invoiceNumber
        }))
      );

      // Log stock movements and update inventory
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

        // Update product inventory
        await this.updateProductInventory({
          productId: item.productId,
          warehouseId: receiveData.warehouseId,
          quantityChange: item.quantity,
          operation: 'add'
        });
        console.log(`📦 อัปเดตสต็อก Product ${item.productId}: +${item.quantity}`);
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
          product:products(id, name, product_code),
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

  /**
   * Update product inventory
   */
  static async updateProductInventory(data: {
    productId: string;
    warehouseId: string;
    quantityChange: number;
    operation: 'add' | 'subtract';
  }): Promise<void> {
    try {
      // Get current inventory
      const { data: currentInventory, error: fetchError } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('product_id', data.productId)
        .eq('warehouse_id', data.warehouseId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const newQuantity = currentInventory 
        ? (data.operation === 'add' 
            ? currentInventory.quantity + data.quantityChange 
            : currentInventory.quantity - data.quantityChange)
        : (data.operation === 'add' ? data.quantityChange : 0);

      if (currentInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('product_inventory')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', data.productId)
          .eq('warehouse_id', data.warehouseId);

        if (updateError) throw updateError;
      } else {
        // Create new inventory record
        const { error: insertError } = await supabase
          .from('product_inventory')
          .insert({
            product_id: data.productId,
            warehouse_id: data.warehouseId,
            quantity: newQuantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating product inventory:', error);
      throw new Error('ไม่สามารถอัปเดตสต็อกสินค้าได้');
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

      // Ensure stockLevels.data exists and is an array
      const stockData = stockLevels?.data || [];
      
      const summary = stockData.reduce((acc, stock) => ({
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
  static async getLowStockAlerts(threshold: number = 5, warehouseId?: string): Promise<StockLevel[]> {
    try {
      const { data } = await this.getStockLevels({
        warehouseId,
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
  static async getOutOfStockItems(warehouseId?: string): Promise<StockLevel[]> {
    try {
      const { data } = await this.getStockLevels({
        warehouseId,
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