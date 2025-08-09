import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type definitions based on database schema
export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type WarehouseInsert = Database['public']['Tables']['warehouses']['Insert'];
export type WarehouseUpdate = Database['public']['Tables']['warehouses']['Update'];

export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert'];

export type ProductSerialNumber = Database['public']['Tables']['product_serial_numbers']['Row'];

// Stock level calculation types
export interface StockLevel {
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  transferredQuantity: number;
  claimedQuantity: number;
  damagedQuantity: number;
  reservedQuantity: number;
  averageCost: number;
  availableValue: number;
}

export interface StockFilters {
  warehouseId?: string;
  productId?: string;
  productName?: string;
  brand?: string;
  model?: string;
  category?: string;
}

export interface MovementFilters {
  warehouseId?: string;
  productId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  performedBy?: string;
}

// Warehouse Service Class
export class WarehouseService {
  /**
   * Get all warehouses with optional filtering
   */
  static async getWarehouses(filters?: { branchId?: string; status?: string }): Promise<Warehouse[]> {
    let query = supabase
      .from('warehouses')
      .select('*')
      .order('name');

    if (filters?.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch warehouses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get warehouse by ID
   */
  static async getWarehouseById(id: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch warehouse: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new warehouse
   */
  static async createWarehouse(warehouse: WarehouseInsert): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .insert(warehouse)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create warehouse: ${error.message}`);
    }

    return data;
  }

  /**
   * Update warehouse
   */
  static async updateWarehouse(id: string, updates: WarehouseUpdate): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update warehouse: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete warehouse (soft delete by setting status to inactive)
   */
  static async deleteWarehouse(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete warehouse: ${error.message}`);
    }
  }

  /**
   * Get stock levels using the database view
   */
  static async getStockLevels(filters?: StockFilters): Promise<StockLevel[]> {
    let query = supabase
      .from('stock_summary_view')
      .select('*')
      .order('product_name')
      .order('warehouse_name');

    if (filters?.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId);
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.productName) {
      query = query.ilike('product_name', `%${filters.productName}%`);
    }

    if (filters?.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    if (filters?.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch stock levels: ${error.message}`);
    }

    return (data || []).map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      productCode: row.product_code,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      totalQuantity: row.total_quantity || 0,
      availableQuantity: row.available_quantity || 0,
      soldQuantity: row.sold_quantity || 0,
      transferredQuantity: row.transferred_quantity || 0,
      claimedQuantity: row.claimed_quantity || 0,
      damagedQuantity: row.damaged_quantity || 0,
      reservedQuantity: row.reserved_quantity || 0,
      averageCost: row.average_cost || 0,
      availableValue: row.available_value || 0,
    }));
  }

  /**
   * Get stock level for a specific product in a specific warehouse
   */
  static async getProductStockLevel(productId: string, warehouseId: string): Promise<StockLevel | null> {
    const levels = await this.getStockLevels({ productId, warehouseId });
    return levels.length > 0 ? levels[0] : null;
  }

  /**
   * Log stock movement
   */
  static async logStockMovement(movement: StockMovementInsert): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log stock movement: ${error.message}`);
    }

    return data;
  }

  /**
   * Get stock movement history
   */
  static async getMovementHistory(filters?: MovementFilters): Promise<StockMovement[]> {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products:product_id (name, code),
        warehouses:warehouse_id (name, code),
        product_serial_numbers:serial_number_id (serial_number)
      `)
      .order('created_at', { ascending: false });

    if (filters?.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId);
    }

    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters?.movementType) {
      query = query.eq('movement_type', filters.movementType);
    }

    if (filters?.performedBy) {
      query = query.eq('performed_by', filters.performedBy);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch movement history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get serial numbers for a product in a warehouse
   */
  static async getSerialNumbers(
    productId: string, 
    warehouseId: string, 
    status?: string
  ): Promise<ProductSerialNumber[]> {
    let query = supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .order('created_at');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch serial numbers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get available serial numbers for a product in a warehouse
   */
  static async getAvailableSerialNumbers(
    productId: string, 
    warehouseId: string
  ): Promise<ProductSerialNumber[]> {
    return this.getSerialNumbers(productId, warehouseId, 'available');
  }

  /**
   * Update serial number status
   */
  static async updateSerialNumberStatus(
    serialNumberId: string,
    status: string,
    referenceNumber?: string,
    soldTo?: string
  ): Promise<ProductSerialNumber> {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (referenceNumber) {
      updates.reference_number = referenceNumber;
    }

    if (soldTo) {
      updates.sold_to = soldTo;
    }

    if (status === 'sold') {
      updates.sold_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('product_serial_numbers')
      .update(updates)
      .eq('id', serialNumberId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update serial number status: ${error.message}`);
    }

    return data;
  }

  /**
   * Transfer serial number to another warehouse
   */
  static async transferSerialNumber(
    serialNumberId: string,
    targetWarehouseId: string
  ): Promise<ProductSerialNumber> {
    const { data, error } = await supabase
      .from('product_serial_numbers')
      .update({ 
        warehouse_id: targetWarehouseId,
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to transfer serial number: ${error.message}`);
    }

    return data;
  }

  /**
   * Get low stock alerts (products with available quantity below threshold)
   */
  static async getLowStockAlerts(threshold: number = 5): Promise<StockLevel[]> {
    const stockLevels = await this.getStockLevels();
    return stockLevels.filter(level => level.availableQuantity <= threshold && level.availableQuantity > 0);
  }

  /**
   * Get out of stock items
   */
  static async getOutOfStockItems(): Promise<StockLevel[]> {
    const stockLevels = await this.getStockLevels();
    return stockLevels.filter(level => level.availableQuantity === 0);
  }

  /**
   * Calculate total stock value for a warehouse
   */
  static async getWarehouseStockValue(warehouseId: string): Promise<number> {
    const stockLevels = await this.getStockLevels({ warehouseId });
    return stockLevels.reduce((total, level) => total + level.availableValue, 0);
  }

  /**
   * Get warehouse summary statistics
   */
  static async getWarehouseSummary(warehouseId: string) {
    const stockLevels = await this.getStockLevels({ warehouseId });
    
    const summary = {
      totalProducts: stockLevels.length,
      totalQuantity: stockLevels.reduce((sum, level) => sum + level.totalQuantity, 0),
      availableQuantity: stockLevels.reduce((sum, level) => sum + level.availableQuantity, 0),
      totalValue: stockLevels.reduce((sum, level) => sum + level.availableValue, 0),
      lowStockItems: stockLevels.filter(level => level.availableQuantity <= 5 && level.availableQuantity > 0).length,
      outOfStockItems: stockLevels.filter(level => level.availableQuantity === 0).length,
    };

    return summary;
  }
}