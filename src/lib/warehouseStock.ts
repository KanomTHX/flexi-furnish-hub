// NOTE: Serial number features temporarily disabled due to missing product_serial_numbers table
// This file has been automatically modified to prevent relationship errors
// Original functionality can be restored once the table is created

// Warehouse Stock System Database Utilities and Helpers

import { supabase } from '@/integrations/supabase/client';
import type {
  SerialNumber,
  StockLevel,
  StockMovement,
  StockTransfer,
  ReceiveLog,
  ClaimLog,
  StockAdjustment,
  Product,
  Supplier,
  StockSearchFilters,
  MovementFilters,
  TransferFilters,
  StockTransaction,
  TransferRequest,
  ReceiveData,
  SNStatus,
  MovementType,
  ReferenceType,
  ApiResponse,
  StockLevelResponse,
  SerialNumberResponse,
  MovementResponse,
  TransferResponse
} from '@/types/warehouseStock';

// Serial Number Management
export class SerialNumberService {
  /**
   * Generate serial numbers for a product
   */
  static async generateSerialNumbers(
    productCode: string,
    quantity: number,
    warehouseCode?: string
  ): Promise<string[]> {
    const { data, error } = await supabase.rpc('generate_serial_number', {
      product_code: productCode,
      warehouse_code: warehouseCode
    });

    if (error) {
      throw new Error(`Failed to generate serial numbers: ${error.message}`);
    }

    // Generate multiple SNs by calling the function multiple times
    const serialNumbers: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const { data: sn, error: snError } = await supabase.rpc('generate_serial_number', {
        product_code: productCode,
        warehouse_code: warehouseCode
      });
      
      if (snError) {
        throw new Error(`Failed to generate serial number ${i + 1}: ${snError.message}`);
      }
      
      serialNumbers.push(sn);
    }

    return serialNumbers;
  }

  /**
   * Validate if a serial number is unique and available
   */
  static async validateSerialNumber(serialNumber: string): Promise<boolean> {
    const { data, error } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .select('id')
      .eq('serial_number', serialNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to validate serial number: ${error.message}`);
    }

    return !data; // Returns true if no existing SN found (available)
  }

  /**
   * Get serial number details
   */
  static async getSerialNumberDetails(serialNumber: string): Promise<SerialNumber | null> {
    const { data, error } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .select(`
        *,
        product:products(*),
        warehouse:warehouses(id, name, code),
        supplier:suppliers(id, name, code)
      `)
      .eq('serial_number', serialNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get serial number details: ${error.message}`);
    }

    return this.mapSerialNumberData(data);
  }

  /**
   * Create serial numbers in bulk
   */
  static async createSerialNumbers(serialNumbers: Omit<SerialNumber, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<SerialNumber[]> {
    const { data, error } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .insert(serialNumbers.map(sn => ({
        serial_number: sn.serialNumber,
        product_id: sn.productId,
        warehouse_id: sn.warehouseId,
        unit_cost: sn.unitCost,
        supplier_id: sn.supplierId,
        invoice_number: sn.invoiceNumber,
        status: sn.status,
        notes: sn.notes
      })))
      .select(`
        *,
        product:products(*),
        warehouse:warehouses(id, name, code),
        supplier:suppliers(id, name, code)
      `);

    if (error) {
      throw new Error(`Failed to create serial numbers: ${error.message}`);
    }

    return data.map(this.mapSerialNumberData);
  }

  /**
   * Update serial number status
   */
  static async updateSerialNumberStatus(
    serialNumberId: string,
    status: SNStatus,
    soldTo?: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'sold') {
      updateData.sold_at = new Date().toISOString();
      updateData.sold_to = soldTo;
    }

    if (referenceNumber) {
      updateData.reference_number = referenceNumber;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { error } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .update(updateData)
      .eq('id', serialNumberId);

    if (error) {
      throw new Error(`Failed to update serial number status: ${error.message}`);
    }
  }

  /**
   * Search serial numbers with filters
   */
  static async searchSerialNumbers(filters: StockSearchFilters): Promise<SerialNumberResponse> {
    let query = supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .select(`
        *,
        product:products(*),
        warehouse:warehouses(id, name, code),
        supplier:suppliers(id, name, code)
      `, { count: 'exact' });

    // Apply filters
    if (filters.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId);
    }

    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.serialNumber) {
      query = query.ilike('serial_number', `%${filters.serialNumber}%`);
    }

    if (filters.searchTerm) {
      query = query.or(`
        serial_number.ilike.%${filters.searchTerm}%,
        product.name.ilike.%${filters.searchTerm}%,
        product.code.ilike.%${filters.searchTerm}%
      `);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search serial numbers: ${error.message}`);
    }

    return {
      data: data?.map(this.mapSerialNumberData) || [],
      total: count || 0,
      page: 1,
      limit: 50
    };
  }

  /**
   * Map database data to SerialNumber interface
   */
  private static mapSerialNumberData(data: any): SerialNumber {
    return {
      id: data.id,
      serialNumber: data.serial_number,
      productId: data.product_id,
      product: data.product ? {
        id: data.product.id,
        name: data.product.name,
        code: data.product.code,
        sku: data.product.sku,
        brand: data.product.brand,
        model: data.product.model,
        category: data.product.category
      } : undefined,
      warehouseId: data.warehouse_id,
      warehouse: data.warehouse ? {
        id: data.warehouse.id,
        name: data.warehouse.name,
        code: data.warehouse.code
      } : undefined,
      unitCost: parseFloat(data.unit_cost),
      supplierId: data.supplier_id,
      supplier: data.supplier ? {
        id: data.supplier.id,
        name: data.supplier.name,
        code: data.supplier.code
      } : undefined,
      invoiceNumber: data.invoice_number,
      status: data.status as SNStatus,
      soldAt: data.sold_at ? new Date(data.sold_at) : undefined,
      soldTo: data.sold_to,
      referenceNumber: data.reference_number,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

// Stock Management Service
export class StockService {
  /**
   * Get stock levels with filters
   */
  static async getStockLevels(filters: StockSearchFilters = {}): Promise<StockLevelResponse> {
    const { data, error } = await supabase.rpc('get_stock_levels', {
      warehouse_id_param: filters.warehouseId || null,
      product_id_param: filters.productId || null
    });

    if (error) {
      throw new Error(`Failed to get stock levels: ${error.message}`);
    }

    let filteredData = data || [];

    // Apply additional filters
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter((item: any) =>
        item.product_name.toLowerCase().includes(searchTerm) ||
        item.product_code.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category) {
      // Note: This would require joining with products table to get category
      // For now, we'll skip this filter
    }

    const stockLevels: StockLevel[] = filteredData.map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      productCode: item.product_code,
      warehouseId: item.warehouse_id,
      warehouseName: item.warehouse_name,
      warehouseCode: '', // Not available in the function
      totalQuantity: parseInt(item.total_quantity),
      availableQuantity: parseInt(item.available_quantity),
      soldQuantity: parseInt(item.sold_quantity),
      transferredQuantity: parseInt(item.transferred_quantity),
      claimedQuantity: parseInt(item.claimed_quantity),
      damagedQuantity: parseInt(item.damaged_quantity),
      reservedQuantity: 0, // Not calculated in the function yet
      averageCost: 0, // Not calculated in the function yet
      availableValue: 0 // Not calculated in the function yet
    }));

    return {
      data: stockLevels,
      total: stockLevels.length,
      page: 1,
      limit: 50
    };
  }

  /**
   * Log stock movement
   */
  static async logMovement(
    productId: string,
    serialNumberId: string | null,
    warehouseId: string,
    movementType: MovementType,
    quantity: number = 1,
    unitCost?: number,
    referenceType?: ReferenceType,
    referenceId?: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_stock_movement', {
      product_id_param: productId,
      serial_number_id_param: serialNumberId,
      warehouse_id_param: warehouseId,
      movement_type_param: movementType,
      quantity_param: quantity,
      unit_cost_param: unitCost,
      reference_type_param: referenceType,
      reference_id_param: referenceId,
      reference_number_param: referenceNumber,
      notes_param: notes
    });

    if (error) {
      throw new Error(`Failed to log stock movement: ${error.message}`);
    }

    return data;
  }

  /**
   * Get stock movements with filters
   */
  static async getMovements(filters: MovementFilters = {}): Promise<MovementResponse> {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name, code, sku),
        warehouse:warehouses(id, name, code),
        serial_number:// product_serial_numbers( // Disabled - table not availableid, serial_number)
      `, { count: 'exact' });

    // Apply filters
    if (filters.warehouseId) {
      query = query.eq('warehouse_id', filters.warehouseId);
    }

    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }

    if (filters.movementType) {
      query = query.eq('movement_type', filters.movementType);
    }

    if (filters.referenceType) {
      query = query.eq('reference_type', filters.referenceType);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get stock movements: ${error.message}`);
    }

    const movements: StockMovement[] = data?.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        code: item.product.code,
        sku: item.product.sku
      } : undefined,
      serialNumberId: item.serial_number_id,
      serialNumber: item.serial_number ? {
        id: item.serial_number.id,
        serialNumber: item.serial_number.serial_number
      } as any : undefined,
      warehouseId: item.warehouse_id,
      warehouse: item.warehouse ? {
        id: item.warehouse.id,
        name: item.warehouse.name,
        code: item.warehouse.code
      } : undefined,
      movementType: item.movement_type as MovementType,
      quantity: item.quantity,
      unitCost: item.unit_cost ? parseFloat(item.unit_cost) : undefined,
      referenceType: item.reference_type as ReferenceType,
      referenceId: item.reference_id,
      referenceNumber: item.reference_number,
      notes: item.notes,
      performedBy: item.performed_by,
      createdAt: new Date(item.created_at)
    })) || [];

    return {
      data: movements,
      total: count || 0,
      page: 1,
      limit: 50
    };
  }
}

// Transfer Service
export class TransferService {
  /**
   * Initiate a stock transfer
   */
  static async initiateTransfer(request: TransferRequest): Promise<StockTransfer> {
    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}`;

    // Create transfer record
    const { data: transferData, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        transfer_number: transferNumber,
        source_warehouse_id: request.sourceWarehouseId,
        target_warehouse_id: request.targetWarehouseId,
        total_items: request.items.length,
        notes: request.notes,
        initiated_by: request.initiatedBy
      })
      .select()
      .single();

    if (transferError) {
      throw new Error(`Failed to create transfer: ${transferError.message}`);
    }

    // Create transfer items
    const transferItems = request.items.map(item => ({
      transfer_id: transferData.id,
      serial_number_id: item.serialNumberId,
      product_id: item.productId,
      unit_cost: item.unitCost
    }));

    const { error: itemsError } = await supabase
      .from('stock_transfer_items')
      .insert(transferItems);

    if (itemsError) {
      throw new Error(`Failed to create transfer items: ${itemsError.message}`);
    }

    // Update serial numbers status to 'transferred'
    const { error: updateError } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .update({ status: 'transferred' })
      .in('id', request.items.map(item => item.serialNumberId));

    if (updateError) {
      throw new Error(`Failed to update serial numbers: ${updateError.message}`);
    }

    // Return the created transfer
    return await this.getTransferById(transferData.id);
  }

  /**
   * Confirm a stock transfer
   */
  static async confirmTransfer(transferId: string, confirmerId: string): Promise<void> {
    // Get transfer details
    const transfer = await this.getTransferById(transferId);
    
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    // Update transfer status
    const { error: transferError } = await supabase
      .from('stock_transfers')
      .update({
        status: 'completed',
        confirmed_by: confirmerId,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', transferId);

    if (transferError) {
      throw new Error(`Failed to confirm transfer: ${transferError.message}`);
    }

    // Update transfer items status
    const { error: itemsError } = await supabase
      .from('stock_transfer_items')
      .update({ status: 'completed' })
      .eq('transfer_id', transferId);

    if (itemsError) {
      throw new Error(`Failed to update transfer items: ${itemsError.message}`);
    }

    // Update serial numbers warehouse and status
    const { error: updateError } = await supabase
      // .from('product_serial_numbers') // Disabled - table not available
      .update({
        warehouse_id: transfer.targetWarehouseId,
        status: 'available'
      })
      .in('id', transfer.items.map(item => item.serialNumberId));

    if (updateError) {
      throw new Error(`Failed to update serial numbers warehouse: ${updateError.message}`);
    }
  }

  /**
   * Get transfer by ID
   */
  static async getTransferById(transferId: string): Promise<StockTransfer> {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(`
        *,
        source_warehouse:warehouses!source_warehouse_id(id, name, code),
        target_warehouse:warehouses!target_warehouse_id(id, name, code),
        items:stock_transfer_items(
          *,
          serial_number:// product_serial_numbers( // Disabled - table not available*),
          product:products(id, name, code)
        )
      `)
      .eq('id', transferId)
      .single();

    if (error) {
      throw new Error(`Failed to get transfer: ${error.message}`);
    }

    return this.mapTransferData(data);
  }

  /**
   * Get transfers with filters
   */
  static async getTransfers(filters: TransferFilters = {}): Promise<TransferResponse> {
    let query = supabase
      .from('stock_transfers')
      .select(`
        *,
        source_warehouse:warehouses!source_warehouse_id(id, name, code),
        target_warehouse:warehouses!target_warehouse_id(id, name, code),
        items:stock_transfer_items(
          *,
          serial_number:// product_serial_numbers( // Disabled - table not available*),
          product:products(id, name, code)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.sourceWarehouseId) {
      query = query.eq('source_warehouse_id', filters.sourceWarehouseId);
    }

    if (filters.targetWarehouseId) {
      query = query.eq('target_warehouse_id', filters.targetWarehouseId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get transfers: ${error.message}`);
    }

    return {
      data: data?.map(this.mapTransferData) || [],
      total: count || 0,
      page: 1,
      limit: 50
    };
  }

  /**
   * Map database data to StockTransfer interface
   */
  private static mapTransferData(data: any): StockTransfer {
    return {
      id: data.id,
      transferNumber: data.transfer_number,
      sourceWarehouseId: data.source_warehouse_id,
      sourceWarehouse: data.source_warehouse ? {
        id: data.source_warehouse.id,
        name: data.source_warehouse.name,
        code: data.source_warehouse.code
      } : undefined,
      targetWarehouseId: data.target_warehouse_id,
      targetWarehouse: data.target_warehouse ? {
        id: data.target_warehouse.id,
        name: data.target_warehouse.name,
        code: data.target_warehouse.code
      } : undefined,
      status: data.status,
      totalItems: data.total_items,
      items: data.items?.map((item: any) => ({
        id: item.id,
        transferId: item.transfer_id,
        serialNumberId: item.serial_number_id,
        serialNumber: item.serial_number ? SerialNumberService['mapSerialNumberData'](item.serial_number) : undefined,
        productId: item.product_id,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          code: item.product.code
        } : undefined,
        quantity: item.quantity,
        unitCost: parseFloat(item.unit_cost),
        status: item.status,
        createdAt: new Date(item.created_at)
      })) || [],
      notes: data.notes,
      initiatedBy: data.initiated_by,
      confirmedBy: data.confirmed_by,
      createdAt: new Date(data.created_at),
      confirmedAt: data.confirmed_at ? new Date(data.confirmed_at) : undefined
    };
  }
}

// Utility functions
export const warehouseStockUtils = {
  /**
   * Format serial number for display
   */
  formatSerialNumber: (sn: string): string => {
    return sn.toUpperCase();
  },

  /**
   * Get status color for UI
   */
  getStatusColor: (status: SNStatus): string => {
    const colors = {
      available: 'green',
      sold: 'blue',
      transferred: 'orange',
      claimed: 'red',
      damaged: 'gray',
      reserved: 'yellow'
    };
    return colors[status] || 'gray';
  },

  /**
   * Calculate stock value
   */
  calculateStockValue: (stockLevel: StockLevel): number => {
    return stockLevel.availableQuantity * stockLevel.averageCost;
  },

  /**
   * Check if stock is low
   */
  isLowStock: (available: number, threshold: number = 5): boolean => {
    return available <= threshold && available > 0;
  },

  /**
   * Check if out of stock
   */
  isOutOfStock: (available: number): boolean => {
    return available === 0;
  },

  /**
   * Format movement type for display
   */
  formatMovementType: (type: MovementType): string => {
    const labels = {
      receive: 'รับสินค้า',
      withdraw: 'เบิกสินค้า',
      transfer_out: 'โอนออก',
      transfer_in: 'โอนเข้า',
      adjustment: 'ปรับปรุง',
      claim: 'เคลม',
      return: 'คืนสินค้า'
    };
    return labels[type] || type;
  }
};

// All services are already exported as classes above