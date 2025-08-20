import { supabase } from '@/lib/supabase';
import type {
  SerialNumber,
  SerialNumberHistory,
  SerialNumberFilter,
  SerialNumberStats,
  CreateSerialNumberRequest,
  UpdateSerialNumberRequest,
  UpdateSerialNumberStatusRequest,
  TransferSerialNumberRequest,
  BulkUpdateSerialNumberRequest,
  SerialNumberSearchResult,
  SerialNumberValidation,
  WarehouseZone,
  WarehouseShelf,
} from '@/types/serialNumber';

export class SerialNumberService {
  /**
   * Get all serial numbers with optional filtering
   */
  static async getSerialNumbers(filter?: SerialNumberFilter): Promise<SerialNumber[]> {
    try {
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*),
          purchase_order:purchase_orders(*)
        `);

      // Apply filters
      if (filter?.search) {
        query = query.ilike('serial_number', `%${filter.search}%`);
      }
      
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      
      if (filter?.branchId) {
        query = query.eq('branch_id', filter.branchId);
      }
      
      if (filter?.productId) {
        query = query.eq('product_id', filter.productId);
      }
      
      if (filter?.supplierId) {
        query = query.eq('supplier_id', filter.supplierId);
      }
      
      if (filter?.dateFrom) {
        query = query.gte('created_at', filter.dateFrom);
      }
      
      if (filter?.dateTo) {
        query = query.lte('created_at', filter.dateTo);
      }
      
      if (filter?.position) {
        query = query.ilike('position', `%${filter.position}%`);
      }
      
      if (filter?.hasWarranty !== undefined) {
        if (filter.hasWarranty) {
          query = query.not('warranty_expiry', 'is', null);
        } else {
          query = query.is('warranty_expiry', null);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching serial numbers:', error);
      throw error;
    }
  }

  /**
   * Get serial number by ID
   */
  static async getSerialNumberById(id: string): Promise<SerialNumber | null> {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*),
          purchase_order:purchase_orders(*),
          history:serial_number_history(
            *,
            from_warehouse:from_branch_id(name),
            to_warehouse:to_branch_id(name),
            performer:performed_by(first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching serial number:', error);
      throw error;
    }
  }

  /**
   * Search serial number by barcode/serial number
   */
  static async searchByBarcode(barcode: string): Promise<SerialNumberSearchResult> {
    try {
      // Exact match first
      const { data: exactMatch, error: exactError } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*)
        `)
        .eq('serial_number', barcode)
        .single();

      if (!exactError && exactMatch) {
        return {
          found: true,
          serialNumber: exactMatch,
        };
      }

      // Fuzzy search for suggestions
      const { data: suggestions, error: suggestError } = await supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*)
        `)
        .ilike('serial_number', `%${barcode}%`)
        .limit(5);

      return {
        found: false,
        suggestions: suggestions || [],
      };
    } catch (error) {
      console.error('Error searching serial number:', error);
      throw error;
    }
  }

  /**
   * Create new serial numbers
   */
  static async createSerialNumbers(request: CreateSerialNumberRequest): Promise<SerialNumber[]> {
    try {
      // Validate serial numbers
      const validation = await this.validateSerialNumbers(request.serialNumbers);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare serial number records
      const serialNumberRecords = request.serialNumbers.map(sn => ({
        serial_number: sn,
        product_id: request.productId,
        branch_id: request.branchId,
        supplier_id: request.supplierId,
        purchase_order_id: request.purchaseOrderId,
        status: 'available',
        position: request.position,
        unit_cost: request.unitCost,
        purchase_date: request.purchaseDate,
        warranty_expiry: request.warrantyExpiry,
        notes: request.notes,
        created_by: 'current-user', // TODO: Get from auth context
        updated_by: 'current-user',
      }));

      const { data, error } = await supabase
        .from('serial_numbers')
        .insert(serialNumberRecords)
        .select();

      if (error) throw error;

      // Log history for each created serial number
      const historyRecords = data.map(sn => ({
        serial_number_id: sn.id,
        action: 'created',
        to_status: 'available',
        to_branch_id: request.branchId,
        to_position: request.position,
        notes: `Created with ${request.serialNumbers.length} serial numbers`,
        performed_by: 'current-user',
        performed_at: new Date(),
      }));

      await supabase
        .from('serial_number_history')
        .insert(historyRecords);

      return data;
    } catch (error) {
      console.error('Error creating serial numbers:', error);
      throw error;
    }
  }

  /**
   * Update serial number status
   */
  static async updateSerialNumberStatus(
    id: string,
    request: UpdateSerialNumberStatusRequest
  ): Promise<SerialNumber> {
    try {
      // Get current serial number
      const current = await this.getSerialNumberById(id);
      if (!current) {
        throw new Error('Serial number not found');
      }

      // Update serial number
      const { data, error } = await supabase
        .from('serial_numbers')
        .update({
          status: request.newStatus,
          position: request.toPosition || current.position,
          branch_id: request.toBranchId || current.branchId,
          notes: request.notes || current.notes,
          updated_by: request.performedBy,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log history
      await supabase
        .from('serial_number_history')
        .insert({
          serial_number_id: id,
          action: 'status_changed',
          from_status: current.status,
          to_status: request.newStatus,
          from_branch_id: current.branchId,
          to_branch_id: request.toBranchId || current.branchId,
          from_position: current.position,
          to_position: request.toPosition || current.position,
          order_id: request.orderId,
          customer_id: request.customerId,
          notes: request.notes,
          performed_by: request.performedBy,
          performed_at: new Date(),
        });

      return data;
    } catch (error) {
      console.error('Error updating serial number status:', error);
      throw error;
    }
  }

  /**
   * Transfer serial numbers between warehouses
   */
  static async transferSerialNumbers(request: TransferSerialNumberRequest): Promise<SerialNumber[]> {
    try {
      // Get current serial numbers
      const { data: currentSNs, error: fetchError } = await supabase
        .from('serial_numbers')
        .select('*')
        .in('id', request.serialNumberIds);

      if (fetchError) throw fetchError;
      if (!currentSNs || currentSNs.length === 0) {
        throw new Error('No serial numbers found');
      }

      // Update serial numbers
      const { data, error } = await supabase
        .from('serial_numbers')
        .update({
          branch_id: request.toBranchId,
          position: request.toPosition,
          status: 'transferred',
          notes: request.notes,
          updated_by: request.performedBy,
          updated_at: new Date(),
        })
        .in('id', request.serialNumberIds)
        .select();

      if (error) throw error;

      // Log history for each transferred serial number
      const historyRecords = currentSNs.map(sn => ({
        serial_number_id: sn.id,
        action: 'transferred',
        from_status: sn.status,
        to_status: 'transferred',
        from_branch_id: sn.branch_id,
        to_branch_id: request.toBranchId,
        from_position: sn.position,
        to_position: request.toPosition,
        notes: request.notes,
        performed_by: request.performedBy,
        performed_at: new Date(),
      }));

      await supabase
        .from('serial_number_history')
        .insert(historyRecords);

      return data;
    } catch (error) {
      console.error('Error transferring serial numbers:', error);
      throw error;
    }
  }

  /**
   * Get serial number statistics
   */
  static async getSerialNumberStats(filter?: SerialNumberFilter): Promise<SerialNumberStats> {
    try {
      let query = supabase
        .from('serial_numbers')
        .select('status');

      // Apply filters
      if (filter?.branchId) {
        query = query.eq('branch_id', filter.branchId);
      }
      
      if (filter?.productId) {
        query = query.eq('product_id', filter.productId);
      }
      
      if (filter?.supplierId) {
        query = query.eq('supplier_id', filter.supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate stats
      const stats: SerialNumberStats = {
        total: 0,
        available: 0,
        reserved: 0,
        sold: 0,
        installment: 0,
        claimed: 0,
        damaged: 0,
        transferred: 0,
        returned: 0,
        maintenance: 0,
        disposed: 0,
      };

      data?.forEach(item => {
        stats.total++;
        if (stats.hasOwnProperty(item.status)) {
          (stats as any)[item.status]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting serial number stats:', error);
      throw error;
    }
  }

  /**
   * Validate serial numbers
   */
  static async validateSerialNumbers(serialNumbers: string[]): Promise<SerialNumberValidation> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for duplicates in the array
      const duplicates = serialNumbers.filter((sn, index) => serialNumbers.indexOf(sn) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate serial numbers: ${duplicates.join(', ')}`);
      }

      // Check for existing serial numbers in database
      const { data: existing, error } = await supabase
        .from('serial_numbers')
        .select('serial_number')
        .in('serial_number', serialNumbers);

      if (error) throw error;

      if (existing && existing.length > 0) {
        const existingSNs = existing.map(item => item.serial_number);
        errors.push(`Serial numbers already exist: ${existingSNs.join(', ')}`);
      }

      // Validate format (basic validation)
      const invalidFormat = serialNumbers.filter(sn => {
        // Basic validation: should be alphanumeric and at least 3 characters
        return !/^[A-Za-z0-9]{3,}$/.test(sn);
      });

      if (invalidFormat.length > 0) {
        errors.push(`Invalid format: ${invalidFormat.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating serial numbers:', error);
      throw error;
    }
  }

  /**
   * Get serial number history
   */
  static async getSerialNumberHistory(serialNumberId: string): Promise<SerialNumberHistory[]> {
    try {
      const { data, error } = await supabase
        .from('serial_number_history')
        .select(`
          *,
          serial_number:serial_numbers(serial_number),
          from_warehouse:from_branch_id(name),
          to_warehouse:to_branch_id(name),
          performer:performed_by(first_name, last_name)
        `)
        .eq('serial_number_id', serialNumberId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching serial number history:', error);
      throw error;
    }
  }

  /**
   * Bulk update serial numbers
   */
  static async bulkUpdateSerialNumbers(request: BulkUpdateSerialNumberRequest): Promise<SerialNumber[]> {
    try {
      const { data, error } = await supabase
        .from('serial_numbers')
        .update({
          ...request.updates,
          updated_by: request.performedBy,
          updated_at: new Date(),
        })
        .in('id', request.serialNumberIds)
        .select();

      if (error) throw error;

      // Log history for bulk update
      const historyRecords = request.serialNumberIds.map(id => ({
        serial_number_id: id,
        action: 'updated',
        notes: `Bulk update: ${Object.keys(request.updates).join(', ')}`,
        performed_by: request.performedBy,
        performed_at: new Date(),
      }));

      await supabase
        .from('serial_number_history')
        .insert(historyRecords);

      return data;
    } catch (error) {
      console.error('Error bulk updating serial numbers:', error);
      throw error;
    }
  }

  /**
   * Get warehouse zones
   */
  static async getWarehouseZones(branchId: string): Promise<WarehouseZone[]> {
    try {
      const { data, error } = await supabase
        .from('warehouse_zones')
        .select(`
          *,
          warehouse:warehouses(*),
          shelves:warehouse_shelves(*)
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching warehouse zones:', error);
      throw error;
    }
  }

  /**
   * Get warehouse shelves
   */
  static async getWarehouseShelves(zoneId: string): Promise<WarehouseShelf[]> {
    try {
      const { data, error } = await supabase
        .from('warehouse_shelves')
        .select(`
          *,
          zone:warehouse_zones(*)
        `)
        .eq('zone_id', zoneId)
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching warehouse shelves:', error);
      throw error;
    }
  }

  /**
   * Generate serial numbers automatically
   */
  static generateSerialNumbers(prefix: string, count: number, startNumber: number = 1): string[] {
    const serialNumbers: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const number = (startNumber + i).toString().padStart(6, '0');
      serialNumbers.push(`${prefix}${number}`);
    }
    
    return serialNumbers;
  }

  /**
   * Export serial numbers to CSV
   */
  static async exportSerialNumbers(filter?: SerialNumberFilter): Promise<string> {
    try {
      const serialNumbers = await this.getSerialNumbers(filter);
      
      const headers = [
        'Serial Number',
        'Product Code',
        'Product Name',
        'Warehouse',
        'Status',
        'Position',
        'Unit Cost',
        'Purchase Date',
        'Warranty Expiry',
        'Created At',
        'Notes'
      ];
      
      const rows = serialNumbers.map(sn => [
        sn.serialNumber,
        sn.product?.code || '',
        sn.product?.name || '',
        sn.warehouse?.name || '',
        sn.status,
        sn.position || '',
        sn.unitCost?.toString() || '',
        sn.purchaseDate ? new Date(sn.purchaseDate).toLocaleDateString() : '',
        sn.warrantyExpiry ? new Date(sn.warrantyExpiry).toLocaleDateString() : '',
        new Date(sn.createdAt).toLocaleDateString(),
        sn.notes || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting serial numbers:', error);
      throw error;
    }
  }
}