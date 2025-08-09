// Receive Goods Service
// Handles all operations related to goods receiving functionality

import { supabase } from '@/integrations/supabase/client';
import { serialNumberService } from './serialNumberService';
import { WarehouseService } from './warehouseService';
import type { ReceiveLog, SerialNumber } from '@/types/warehouse';

// Interface for receive goods request
export interface ReceiveGoodsRequest {
  warehouseId: string;
  supplierId?: string;
  invoiceNumber?: string;
  items: ReceiveGoodsItem[];
  notes?: string;
  receivedBy: string;
}

export interface ReceiveGoodsItem {
  productId: string;
  productCode: string;
  quantity: number;
  unitCost: number;
}

// Interface for receive goods response
export interface ReceiveGoodsResponse {
  receiveLog: ReceiveLog;
  serialNumbers: SerialNumber[];
  totalItems: number;
  totalCost: number;
}

// Interface for receive goods validation
export interface ReceiveGoodsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Interface for receive goods filters
export interface ReceiveGoodsFilters {
  warehouseId?: string;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'draft' | 'completed' | 'cancelled';
  receivedBy?: string;
  invoiceNumber?: string;
  limit?: number;
  offset?: number;
}

// Interface for receive goods search result
export interface ReceiveGoodsSearchResult {
  data: ReceiveLog[];
  total: number;
  hasMore: boolean;
}

// Interface for receive goods statistics
export interface ReceiveGoodsStats {
  totalReceives: number;
  totalItems: number;
  totalValue: number;
  averageItemsPerReceive: number;
  averageValuePerReceive: number;
  topSuppliers: {
    supplierId: string;
    supplierName: string;
    totalReceives: number;
    totalValue: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalValue: number;
  }[];
  recentActivity: {
    date: string;
    totalReceives: number;
    totalItems: number;
    totalValue: number;
  }[];
}

export class ReceiveGoodsService {
  /**
   * Validate receive goods request
   */
  static async validateReceiveRequest(request: ReceiveGoodsRequest): Promise<ReceiveGoodsValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate warehouse exists and is active
      const warehouse = await WarehouseService.getWarehouseById(request.warehouseId);
      if (!warehouse) {
        errors.push('ไม่พบคลังสินค้าที่ระบุ');
      } else if (warehouse.status !== 'active') {
        errors.push('คลังสินค้าไม่ได้ใช้งาน');
      }

      // Validate supplier if provided
      if (request.supplierId) {
        const { data: supplier, error } = await supabase
          .from('suppliers')
          .select('id, is_active')
          .eq('id', request.supplierId)
          .single();

        if (error || !supplier) {
          errors.push('ไม่พบผู้จำหน่ายที่ระบุ');
        } else if (!supplier.is_active) {
          warnings.push('ผู้จำหน่ายไม่ได้ใช้งาน');
        }
      }

      // Validate items
      if (!request.items || request.items.length === 0) {
        errors.push('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ');
      } else {
        // Validate each item
        const productIds = request.items.map(item => item.productId);
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, code, is_active')
          .in('id', productIds);

        if (productsError) {
          errors.push('ไม่สามารถตรวจสอบข้อมูลสินค้าได้');
        } else {
          request.items.forEach((item, index) => {
            const product = products?.find(p => p.id === item.productId);
            
            if (!product) {
              errors.push(`ไม่พบสินค้ารายการที่ ${index + 1}`);
            } else if (!product.is_active) {
              warnings.push(`สินค้า "${product.name}" ไม่ได้ใช้งาน`);
            }

            if (item.quantity <= 0) {
              errors.push(`จำนวนสินค้ารายการที่ ${index + 1} ต้องมากกว่า 0`);
            }

            if (item.unitCost <= 0) {
              errors.push(`ราคาต่อหน่วยรายการที่ ${index + 1} ต้องมากกว่า 0`);
            }

            // Check if product code matches
            if (product && product.code !== item.productCode) {
              warnings.push(`รหัสสินค้ารายการที่ ${index + 1} ไม่ตรงกับข้อมูลในระบบ`);
            }
          });
        }
      }

      // Validate invoice number uniqueness if provided
      if (request.invoiceNumber && request.supplierId) {
        const { data: existingReceive } = await supabase
          .from('receive_logs')
          .select('id')
          .eq('supplier_id', request.supplierId)
          .eq('invoice_number', request.invoiceNumber)
          .limit(1);

        if (existingReceive && existingReceive.length > 0) {
          warnings.push('เลขที่ใบวางบิลนี้เคยใช้แล้วกับผู้จำหน่ายนี้');
        }
      }

    } catch (error) {
      console.error('Error validating receive request:', error);
      errors.push('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Process goods receiving
   */
  static async receiveGoods(request: ReceiveGoodsRequest): Promise<ReceiveGoodsResponse> {
    try {
      // Validate request first
      const validation = await this.validateReceiveRequest(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Calculate totals
      const totalItems = request.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = request.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

      // Generate receive number
      const receiveNumber = await this.generateReceiveNumber();

      // Create receive log
      const { data: receiveLog, error: receiveError } = await supabase
        .from('receive_logs')
        .insert({
          receive_number: receiveNumber,
          supplier_id: request.supplierId || null,
          warehouse_id: request.warehouseId,
          invoice_number: request.invoiceNumber || null,
          total_items: totalItems,
          total_cost: totalCost,
          received_by: request.receivedBy,
          status: 'completed',
          notes: request.notes || null
        })
        .select(`
          *,
          supplier:suppliers(*),
          warehouse:warehouses(*),
          received_by_profile:employee_profiles!received_by(*)
        `)
        .single();

      if (receiveError) {
        throw new Error(`Failed to create receive log: ${receiveError.message}`);
      }

      // Process each item - generate serial numbers
      const allSerialNumbers: SerialNumber[] = [];
      
      for (const item of request.items) {
        try {
          const serialNumbers = await serialNumberService.generateAndCreateSNs({
            productId: item.productId,
            productCode: item.productCode,
            warehouseId: request.warehouseId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            supplierId: request.supplierId,
            invoiceNumber: request.invoiceNumber,
            notes: `Received via ${receiveNumber}`
          });

          allSerialNumbers.push(...serialNumbers);

        } catch (error) {
          console.error(`Error processing item ${item.productId}:`, error);
          // Continue with other items but log the error
          throw new Error(`Failed to process item ${item.productCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        receiveLog: receiveLog as ReceiveLog,
        serialNumbers: allSerialNumbers,
        totalItems,
        totalCost
      };

    } catch (error) {
      console.error('Error receiving goods:', error);
      throw error;
    }
  }

  /**
   * Get receive logs with filtering
   */
  static async getReceiveLogs(filters?: ReceiveGoodsFilters): Promise<ReceiveGoodsSearchResult> {
    try {
      let query = supabase
        .from('receive_logs')
        .select(`
          *,
          supplier:suppliers(*),
          warehouse:warehouses(*),
          received_by_profile:employee_profiles!received_by(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }

      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.receivedBy) {
        query = query.eq('received_by', filters.receivedBy);
      }

      if (filters?.invoiceNumber) {
        query = query.ilike('invoice_number', `%${filters.invoiceNumber}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get receive logs: ${error.message}`);
      }

      return {
        data: data as ReceiveLog[] || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };

    } catch (error) {
      console.error('Error getting receive logs:', error);
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get receive log by ID
   */
  static async getReceiveLogById(id: string): Promise<ReceiveLog | null> {
    try {
      const { data, error } = await supabase
        .from('receive_logs')
        .select(`
          *,
          supplier:suppliers(*),
          warehouse:warehouses(*),
          received_by_profile:employee_profiles!received_by(*)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get receive log: ${error.message}`);
      }

      return data as ReceiveLog || null;

    } catch (error) {
      console.error('Error getting receive log by ID:', error);
      return null;
    }
  }

  /**
   * Get receive log by receive number
   */
  static async getReceiveLogByNumber(receiveNumber: string): Promise<ReceiveLog | null> {
    try {
      const { data, error } = await supabase
        .from('receive_logs')
        .select(`
          *,
          supplier:suppliers(*),
          warehouse:warehouses(*),
          received_by_profile:employee_profiles!received_by(*)
        `)
        .eq('receive_number', receiveNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get receive log: ${error.message}`);
      }

      return data as ReceiveLog || null;

    } catch (error) {
      console.error('Error getting receive log by number:', error);
      return null;
    }
  }

  /**
   * Get serial numbers for a receive log
   */
  static async getReceiveSerialNumbers(receiveLogId: string): Promise<SerialNumber[]> {
    try {
      // Get the receive log first to get the receive number
      const receiveLog = await this.getReceiveLogById(receiveLogId);
      if (!receiveLog) {
        return [];
      }

      // Search for serial numbers created for this receive
      const result = await serialNumberService.searchSerialNumbers({
        searchTerm: receiveLog.receive_number,
        limit: 1000 // Get all related serial numbers
      });

      return result.data;

    } catch (error) {
      console.error('Error getting receive serial numbers:', error);
      return [];
    }
  }

  /**
   * Cancel receive log
   */
  static async cancelReceiveLog(id: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      // Update receive log status
      const { error: updateError } = await supabase
        .from('receive_logs')
        .update({
          status: 'cancelled',
          notes: `Cancelled: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to cancel receive log: ${updateError.message}`);
      }

      // Get associated serial numbers and mark them as cancelled/damaged
      const serialNumbers = await this.getReceiveSerialNumbers(id);
      
      if (serialNumbers.length > 0) {
        const serialNumberIds = serialNumbers.map(sn => sn.id);
        await serialNumberService.bulkUpdateStatus(
          serialNumberIds,
          'damaged', // or create a 'cancelled' status
          {
            notes: `Receive cancelled: ${reason}`,
            performedBy: cancelledBy
          }
        );
      }

    } catch (error) {
      console.error('Error cancelling receive log:', error);
      throw error;
    }
  }

  /**
   * Get receive goods statistics
   */
  static async getReceiveStats(
    warehouseId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ReceiveGoodsStats> {
    try {
      let query = supabase
        .from('receive_logs')
        .select(`
          *,
          supplier:suppliers(id, name),
          product_serial_numbers!inner(product_id, product:products(id, name))
        `);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get receive stats: ${error.message}`);
      }

      // Calculate statistics
      const stats: ReceiveGoodsStats = {
        totalReceives: data?.length || 0,
        totalItems: 0,
        totalValue: 0,
        averageItemsPerReceive: 0,
        averageValuePerReceive: 0,
        topSuppliers: [],
        topProducts: [],
        recentActivity: []
      };

      if (data && data.length > 0) {
        // Calculate totals
        stats.totalItems = data.reduce((sum, log) => sum + (log.total_items || 0), 0);
        stats.totalValue = data.reduce((sum, log) => sum + (log.total_cost || 0), 0);
        stats.averageItemsPerReceive = stats.totalItems / stats.totalReceives;
        stats.averageValuePerReceive = stats.totalValue / stats.totalReceives;

        // Calculate top suppliers
        const supplierMap = new Map();
        data.forEach(log => {
          if (log.supplier) {
            const key = log.supplier.id;
            if (!supplierMap.has(key)) {
              supplierMap.set(key, {
                supplierId: log.supplier.id,
                supplierName: log.supplier.name,
                totalReceives: 0,
                totalValue: 0
              });
            }
            const supplier = supplierMap.get(key);
            supplier.totalReceives++;
            supplier.totalValue += log.total_cost || 0;
          }
        });

        stats.topSuppliers = Array.from(supplierMap.values())
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 10);

        // Calculate recent activity (last 30 days by day)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const activityMap = new Map();
        data.forEach(log => {
          const logDate = new Date(log.created_at);
          if (logDate >= thirtyDaysAgo) {
            const dateKey = logDate.toISOString().split('T')[0];
            if (!activityMap.has(dateKey)) {
              activityMap.set(dateKey, {
                date: dateKey,
                totalReceives: 0,
                totalItems: 0,
                totalValue: 0
              });
            }
            const activity = activityMap.get(dateKey);
            activity.totalReceives++;
            activity.totalItems += log.total_items || 0;
            activity.totalValue += log.total_cost || 0;
          }
        });

        stats.recentActivity = Array.from(activityMap.values())
          .sort((a, b) => a.date.localeCompare(b.date));
      }

      return stats;

    } catch (error) {
      console.error('Error getting receive stats:', error);
      return {
        totalReceives: 0,
        totalItems: 0,
        totalValue: 0,
        averageItemsPerReceive: 0,
        averageValuePerReceive: 0,
        topSuppliers: [],
        topProducts: [],
        recentActivity: []
      };
    }
  }

  /**
   * Generate unique receive number
   */
  private static async generateReceiveNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Format: RCV-YYYYMMDD-NNN
    const prefix = `RCV-${year}${month}${day}`;
    
    // Get the highest sequence number for today
    const { data, error } = await supabase
      .from('receive_logs')
      .select('receive_number')
      .like('receive_number', `${prefix}-%`)
      .order('receive_number', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].receive_number;
      const lastSequence = parseInt(lastNumber.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(3, '0')}`;
  }
}

// Export singleton instance
export const receiveGoodsService = new ReceiveGoodsService();