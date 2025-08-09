// Serial Number Database Service
// Handles all database operations for serial number management

import { supabase } from '@/lib/supabase';
import { SerialNumber, SNStatus, StockMovement, MovementType, ReferenceType } from '@/types/warehouse';
import { 
  generateSerialNumbers, 
  validateSerialNumber, 
  checkSerialNumberExists,
  SNGenerationConfig,
  DEFAULT_SN_CONFIG
} from '@/utils/serialNumberGenerator';

// Service interface for SN management
export interface SerialNumberService {
  // Creation and Generation
  createSerialNumbers(data: CreateSerialNumbersData): Promise<SerialNumber[]>;
  generateAndCreateSNs(data: GenerateAndCreateSNsData): Promise<SerialNumber[]>;
  
  // Retrieval and Search
  getSerialNumber(id: string): Promise<SerialNumber | null>;
  getSerialNumberByCode(serialNumber: string): Promise<SerialNumber | null>;
  searchSerialNumbers(filters: SNSearchFilters): Promise<SNSearchResult>;
  getSerialNumbersByProduct(productId: string, warehouseId?: string): Promise<SerialNumber[]>;
  getSerialNumbersByWarehouse(warehouseId: string): Promise<SerialNumber[]>;
  
  // Updates and Status Changes
  updateSerialNumberStatus(id: string, status: SNStatus, metadata?: SNStatusMetadata): Promise<void>;
  updateSerialNumber(id: string, updates: Partial<SerialNumber>): Promise<SerialNumber>;
  bulkUpdateStatus(ids: string[], status: SNStatus, metadata?: SNStatusMetadata): Promise<void>;
  
  // Transfer and Movement
  transferSerialNumbers(transferData: SNTransferData): Promise<void>;
  moveSerialNumbers(moveData: SNMoveData): Promise<void>;
  
  // Validation and Checking
  validateSerialNumberUniqueness(serialNumber: string): Promise<boolean>;
  checkSerialNumberAvailability(id: string): Promise<boolean>;
  
  // Statistics and Reports
  getSerialNumberStats(productId?: string, warehouseId?: string): Promise<SNStats>;
  getMovementHistory(serialNumberId: string): Promise<StockMovement[]>;
  
  // Bulk Operations
  bulkCreateSerialNumbers(data: BulkCreateSNData[]): Promise<SerialNumber[]>;
  bulkDeleteSerialNumbers(ids: string[]): Promise<void>;
}

// Data interfaces
export interface CreateSerialNumbersData {
  productId: string;
  warehouseId: string;
  serialNumbers: string[];
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface GenerateAndCreateSNsData {
  productId: string;
  productCode: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  notes?: string;
  config?: Partial<SNGenerationConfig>;
}

export interface SNSearchFilters {
  searchTerm?: string;
  productId?: string;
  warehouseId?: string;
  status?: SNStatus;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface SNSearchResult {
  data: SerialNumber[];
  total: number;
  hasMore: boolean;
}

export interface SNStatusMetadata {
  soldTo?: string;
  referenceNumber?: string;
  notes?: string;
  performedBy?: string;
}

export interface SNTransferData {
  serialNumberIds: string[];
  fromWarehouseId: string;
  toWarehouseId: string;
  transferId?: string;
  performedBy: string;
  notes?: string;
}

export interface SNMoveData {
  serialNumberIds: string[];
  toWarehouseId: string;
  movementType: MovementType;
  referenceType?: ReferenceType;
  referenceId?: string;
  referenceNumber?: string;
  performedBy: string;
  notes?: string;
}

export interface BulkCreateSNData {
  serialNumber: string;
  productId: string;
  warehouseId: string;
  unitCost: number;
  supplierId?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface SNStats {
  total: number;
  byStatus: Record<SNStatus, number>;
  byWarehouse: Record<string, number>;
  totalValue: number;
  averageCost: number;
  recentActivity: {
    created: number;
    sold: number;
    transferred: number;
    claimed: number;
  };
}

// Implementation of the Serial Number Service
class SerialNumberServiceImpl implements SerialNumberService {
  
  async createSerialNumbers(data: CreateSerialNumbersData): Promise<SerialNumber[]> {
    try {
      // Validate all serial numbers first
      const validationPromises = data.serialNumbers.map(sn => 
        validateSerialNumber(sn)
      );
      const validations = await Promise.all(validationPromises);
      
      // Check for validation errors
      const errors: string[] = [];
      validations.forEach((validation, index) => {
        if (!validation.isValid) {
          errors.push(`${data.serialNumbers[index]}: ${validation.errors.join(', ')}`);
        }
        if (validation.exists) {
          errors.push(`${data.serialNumbers[index]}: already exists`);
        }
      });
      
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join('; ')}`);
      }

      // Create serial numbers in database
      const serialNumbersData = data.serialNumbers.map(sn => ({
        serial_number: sn,
        product_id: data.productId,
        warehouse_id: data.warehouseId,
        unit_cost: data.unitCost,
        supplier_id: data.supplierId,
        invoice_number: data.invoiceNumber,
        notes: data.notes,
        status: 'available' as SNStatus
      }));

      const { data: createdSNs, error } = await supabase
        .from('product_serial_numbers')
        .insert(serialNumbersData)
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `);

      if (error) {
        throw new Error(`Failed to create serial numbers: ${error.message}`);
      }

      // Log stock movements for each created SN
      const movementPromises = createdSNs.map(sn => 
        this.logStockMovement({
          productId: sn.product_id,
          serialNumberId: sn.id,
          warehouseId: sn.warehouse_id,
          movementType: 'receive',
          quantity: 1,
          unitCost: sn.unit_cost,
          referenceType: 'purchase',
          referenceNumber: data.invoiceNumber,
          notes: `Serial number created: ${sn.serial_number}`,
          performedBy: 'system' // This should be replaced with actual user ID
        })
      );

      await Promise.all(movementPromises);

      return createdSNs as SerialNumber[];

    } catch (error) {
      console.error('Error creating serial numbers:', error);
      throw error;
    }
  }

  async generateAndCreateSNs(data: GenerateAndCreateSNsData): Promise<SerialNumber[]> {
    try {
      // Generate serial numbers
      const config = { ...DEFAULT_SN_CONFIG, ...data.config };
      const generationResult = await generateSerialNumbers(
        data.productCode,
        data.quantity,
        config
      );

      if (!generationResult.success) {
        throw new Error(`Failed to generate serial numbers: ${generationResult.errors.join(', ')}`);
      }

      // Create the generated serial numbers
      return await this.createSerialNumbers({
        productId: data.productId,
        warehouseId: data.warehouseId,
        serialNumbers: generationResult.serialNumbers,
        unitCost: data.unitCost,
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes
      });

    } catch (error) {
      console.error('Error generating and creating serial numbers:', error);
      throw error;
    }
  }

  async getSerialNumber(id: string): Promise<SerialNumber | null> {
    try {
      const { data, error } = await supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get serial number: ${error.message}`);
      }

      return data as SerialNumber || null;

    } catch (error) {
      console.error('Error getting serial number:', error);
      return null;
    }
  }

  async getSerialNumberByCode(serialNumber: string): Promise<SerialNumber | null> {
    try {
      const { data, error } = await supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `)
        .eq('serial_number', serialNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get serial number: ${error.message}`);
      }

      return data as SerialNumber || null;

    } catch (error) {
      console.error('Error getting serial number by code:', error);
      return null;
    }
  }

  async searchSerialNumbers(filters: SNSearchFilters): Promise<SNSearchResult> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`serial_number.ilike.%${filters.searchTerm}%,product.name.ilike.%${filters.searchTerm}%`);
      }

      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to search serial numbers: ${error.message}`);
      }

      return {
        data: data as SerialNumber[] || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };

    } catch (error) {
      console.error('Error searching serial numbers:', error);
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async getSerialNumbersByProduct(productId: string, warehouseId?: string): Promise<SerialNumber[]> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `)
        .eq('product_id', productId);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get serial numbers by product: ${error.message}`);
      }

      return data as SerialNumber[] || [];

    } catch (error) {
      console.error('Error getting serial numbers by product:', error);
      return [];
    }
  }

  async getSerialNumbersByWarehouse(warehouseId: string): Promise<SerialNumber[]> {
    try {
      const { data, error } = await supabase
        .from('product_serial_numbers')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `)
        .eq('warehouse_id', warehouseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get serial numbers by warehouse: ${error.message}`);
      }

      return data as SerialNumber[] || [];

    } catch (error) {
      console.error('Error getting serial numbers by warehouse:', error);
      return [];
    }
  }

  async updateSerialNumberStatus(
    id: string, 
    status: SNStatus, 
    metadata?: SNStatusMetadata
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (metadata) {
        if (metadata.soldTo) updates.sold_to = metadata.soldTo;
        if (metadata.referenceNumber) updates.reference_number = metadata.referenceNumber;
        if (metadata.notes) updates.notes = metadata.notes;
        
        if (status === 'sold') {
          updates.sold_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('product_serial_numbers')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update serial number status: ${error.message}`);
      }

      // The trigger will automatically log the movement

    } catch (error) {
      console.error('Error updating serial number status:', error);
      throw error;
    }
  }

  async updateSerialNumber(id: string, updates: Partial<SerialNumber>): Promise<SerialNumber> {
    try {
      const { data, error } = await supabase
        .from('product_serial_numbers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update serial number: ${error.message}`);
      }

      return data as SerialNumber;

    } catch (error) {
      console.error('Error updating serial number:', error);
      throw error;
    }
  }

  async bulkUpdateStatus(
    ids: string[], 
    status: SNStatus, 
    metadata?: SNStatusMetadata
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (metadata) {
        if (metadata.soldTo) updates.sold_to = metadata.soldTo;
        if (metadata.referenceNumber) updates.reference_number = metadata.referenceNumber;
        if (metadata.notes) updates.notes = metadata.notes;
        
        if (status === 'sold') {
          updates.sold_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('product_serial_numbers')
        .update(updates)
        .in('id', ids);

      if (error) {
        throw new Error(`Failed to bulk update serial number status: ${error.message}`);
      }

    } catch (error) {
      console.error('Error bulk updating serial number status:', error);
      throw error;
    }
  }

  async transferSerialNumbers(transferData: SNTransferData): Promise<void> {
    try {
      // Update warehouse for all serial numbers
      const { error: updateError } = await supabase
        .from('product_serial_numbers')
        .update({
          warehouse_id: transferData.toWarehouseId,
          status: 'transferred' as SNStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', transferData.serialNumberIds);

      if (updateError) {
        throw new Error(`Failed to transfer serial numbers: ${updateError.message}`);
      }

      // Log movements for each serial number
      const movementPromises = transferData.serialNumberIds.map(async (snId) => {
        // Get serial number details
        const sn = await this.getSerialNumber(snId);
        if (sn) {
          // Log transfer out from source warehouse
          await this.logStockMovement({
            productId: sn.productId,
            serialNumberId: snId,
            warehouseId: transferData.fromWarehouseId,
            movementType: 'transfer_out',
            quantity: 1,
            unitCost: sn.unitCost,
            referenceType: 'transfer',
            referenceId: transferData.transferId,
            notes: transferData.notes,
            performedBy: transferData.performedBy
          });

          // Log transfer in to target warehouse
          await this.logStockMovement({
            productId: sn.productId,
            serialNumberId: snId,
            warehouseId: transferData.toWarehouseId,
            movementType: 'transfer_in',
            quantity: 1,
            unitCost: sn.unitCost,
            referenceType: 'transfer',
            referenceId: transferData.transferId,
            notes: transferData.notes,
            performedBy: transferData.performedBy
          });
        }
      });

      await Promise.all(movementPromises);

    } catch (error) {
      console.error('Error transferring serial numbers:', error);
      throw error;
    }
  }

  async moveSerialNumbers(moveData: SNMoveData): Promise<void> {
    try {
      // Update warehouse for all serial numbers
      const { error: updateError } = await supabase
        .from('product_serial_numbers')
        .update({
          warehouse_id: moveData.toWarehouseId,
          updated_at: new Date().toISOString()
        })
        .in('id', moveData.serialNumberIds);

      if (updateError) {
        throw new Error(`Failed to move serial numbers: ${updateError.message}`);
      }

      // Log movements for each serial number
      const movementPromises = moveData.serialNumberIds.map(async (snId) => {
        const sn = await this.getSerialNumber(snId);
        if (sn) {
          await this.logStockMovement({
            productId: sn.productId,
            serialNumberId: snId,
            warehouseId: moveData.toWarehouseId,
            movementType: moveData.movementType,
            quantity: 1,
            unitCost: sn.unitCost,
            referenceType: moveData.referenceType,
            referenceId: moveData.referenceId,
            referenceNumber: moveData.referenceNumber,
            notes: moveData.notes,
            performedBy: moveData.performedBy
          });
        }
      });

      await Promise.all(movementPromises);

    } catch (error) {
      console.error('Error moving serial numbers:', error);
      throw error;
    }
  }

  async validateSerialNumberUniqueness(serialNumber: string): Promise<boolean> {
    return !(await checkSerialNumberExists(serialNumber));
  }

  async checkSerialNumberAvailability(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_serial_numbers')
        .select('status')
        .eq('id', id)
        .single();

      if (error) {
        return false;
      }

      return data?.status === 'available';

    } catch (error) {
      console.error('Error checking serial number availability:', error);
      return false;
    }
  }

  async getSerialNumberStats(productId?: string, warehouseId?: string): Promise<SNStats> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select('status, unit_cost, warehouse_id, created_at');

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get serial number stats: ${error.message}`);
      }

      const stats: SNStats = {
        total: data?.length || 0,
        byStatus: {
          available: 0,
          sold: 0,
          transferred: 0,
          claimed: 0,
          damaged: 0,
          reserved: 0
        },
        byWarehouse: {},
        totalValue: 0,
        averageCost: 0,
        recentActivity: {
          created: 0,
          sold: 0,
          transferred: 0,
          claimed: 0
        }
      };

      if (data && data.length > 0) {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        data.forEach(sn => {
          // Count by status
          stats.byStatus[sn.status as SNStatus]++;
          
          // Count by warehouse
          if (!stats.byWarehouse[sn.warehouse_id]) {
            stats.byWarehouse[sn.warehouse_id] = 0;
          }
          stats.byWarehouse[sn.warehouse_id]++;
          
          // Calculate total value
          stats.totalValue += sn.unit_cost || 0;
          
          // Recent activity (last 30 days)
          const createdAt = new Date(sn.created_at);
          if (createdAt >= last30Days) {
            stats.recentActivity.created++;
            
            switch (sn.status) {
              case 'sold':
                stats.recentActivity.sold++;
                break;
              case 'transferred':
                stats.recentActivity.transferred++;
                break;
              case 'claimed':
                stats.recentActivity.claimed++;
                break;
            }
          }
        });

        stats.averageCost = stats.totalValue / stats.total;
      }

      return stats;

    } catch (error) {
      console.error('Error getting serial number stats:', error);
      return {
        total: 0,
        byStatus: {
          available: 0,
          sold: 0,
          transferred: 0,
          claimed: 0,
          damaged: 0,
          reserved: 0
        },
        byWarehouse: {},
        totalValue: 0,
        averageCost: 0,
        recentActivity: {
          created: 0,
          sold: 0,
          transferred: 0,
          claimed: 0
        }
      };
    }
  }

  async getMovementHistory(serialNumberId: string): Promise<StockMovement[]> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*)
        `)
        .eq('serial_number_id', serialNumberId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get movement history: ${error.message}`);
      }

      return data as StockMovement[] || [];

    } catch (error) {
      console.error('Error getting movement history:', error);
      return [];
    }
  }

  async bulkCreateSerialNumbers(data: BulkCreateSNData[]): Promise<SerialNumber[]> {
    try {
      // Validate all serial numbers first
      const validationPromises = data.map(item => 
        validateSerialNumber(item.serialNumber)
      );
      const validations = await Promise.all(validationPromises);
      
      // Check for validation errors
      const errors: string[] = [];
      validations.forEach((validation, index) => {
        if (!validation.isValid) {
          errors.push(`${data[index].serialNumber}: ${validation.errors.join(', ')}`);
        }
        if (validation.exists) {
          errors.push(`${data[index].serialNumber}: already exists`);
        }
      });
      
      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join('; ')}`);
      }

      // Create serial numbers in database
      const serialNumbersData = data.map(item => ({
        serial_number: item.serialNumber,
        product_id: item.productId,
        warehouse_id: item.warehouseId,
        unit_cost: item.unitCost,
        supplier_id: item.supplierId,
        invoice_number: item.invoiceNumber,
        notes: item.notes,
        status: 'available' as SNStatus
      }));

      const { data: createdSNs, error } = await supabase
        .from('product_serial_numbers')
        .insert(serialNumbersData)
        .select(`
          *,
          product:products(*),
          warehouse:warehouses(*),
          supplier:suppliers(*)
        `);

      if (error) {
        throw new Error(`Failed to bulk create serial numbers: ${error.message}`);
      }

      return createdSNs as SerialNumber[];

    } catch (error) {
      console.error('Error bulk creating serial numbers:', error);
      throw error;
    }
  }

  async bulkDeleteSerialNumbers(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_serial_numbers')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error(`Failed to bulk delete serial numbers: ${error.message}`);
      }

    } catch (error) {
      console.error('Error bulk deleting serial numbers:', error);
      throw error;
    }
  }

  // Helper method to log stock movements
  private async logStockMovement(data: {
    productId: string;
    serialNumberId?: string;
    warehouseId: string;
    movementType: MovementType;
    quantity: number;
    unitCost?: number;
    referenceType?: ReferenceType;
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    performedBy: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.productId,
          serial_number_id: data.serialNumberId,
          warehouse_id: data.warehouseId,
          movement_type: data.movementType,
          quantity: data.quantity,
          unit_cost: data.unitCost,
          reference_type: data.referenceType,
          reference_id: data.referenceId,
          reference_number: data.referenceNumber,
          notes: data.notes,
          performed_by: data.performedBy
        });

      if (error) {
        console.error('Error logging stock movement:', error);
        // Don't throw here as this is a logging operation
      }

    } catch (error) {
      console.error('Error logging stock movement:', error);
      // Don't throw here as this is a logging operation
    }
  }
}

// Export singleton instance
export const serialNumberService = new SerialNumberServiceImpl();

// Export the service class for testing
export { SerialNumberServiceImpl };