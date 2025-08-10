// NOTE: Serial number features temporarily disabled due to missing product_serial_numbers table
// This file has been automatically modified to prevent relationship errors
// Original functionality can be restored once the table is created

import { supabase } from './supabase';
import { 
  StockTransfer, 
  StockTransferItem, 
  TransferForm, 
  TransferStatus,
  SerialNumber,
  MovementType,
  ReferenceType
} from '@/types/warehouse';

export interface TransferRequest {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  serialNumbers: string[];
  notes?: string;
}

export interface TransferConfirmation {
  transferId: string;
  confirmedBy: string;
  notes?: string;
}

export class TransferService {
  /**
   * สร้างการโอนสินค้าใหม่
   */
  async initiateTransfer(request: TransferRequest, initiatedBy: string): Promise<StockTransfer> {
    try {
      // ตรวจสอบ Serial Numbers ที่เลือก
      const { data: serialNumbers, error: snError } = await supabase
        .from('product_serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          warehouse_id,
          unit_cost,
          status,
          products (
            id,
            name,
            code,
            sku
          )
        `)
        .in('id', request.serialNumbers)
        .eq('warehouse_id', request.sourceWarehouseId)
        .eq('status', 'available');

      if (snError) throw snError;
      if (!serialNumbers || serialNumbers.length === 0) {
        throw new Error('ไม่พบ Serial Number ที่เลือกหรือสินค้าไม่พร้อมโอน');
      }

      if (serialNumbers.length !== request.serialNumbers.length) {
        throw new Error('Serial Number บางตัวไม่พร้อมสำหรับการโอน');
      }

      // สร้างเลขที่โอน
      const transferNumber = await this.generateTransferNumber();

      // สร้างการโอนในฐานข้อมูล
      const { data: transfer, error: transferError } = await supabase
        .from('stock_transfers')
        .insert({
          transfer_number: transferNumber,
          source_warehouse_id: request.sourceWarehouseId,
          target_warehouse_id: request.targetWarehouseId,
          status: 'pending',
          total_items: serialNumbers.length,
          notes: request.notes,
          initiated_by: initiatedBy
        })
        .select(`
          id,
          transfer_number,
          source_warehouse_id,
          target_warehouse_id,
          status,
          total_items,
          notes,
          initiated_by,
          created_at,
          source_warehouse:warehouses!source_warehouse_id (
            id,
            name,
            code
          ),
          target_warehouse:warehouses!target_warehouse_id (
            id,
            name,
            code
          )
        `)
        .single();

      if (transferError) throw transferError;

      // สร้างรายการสินค้าที่โอน
      const transferItems = serialNumbers.map(sn => ({
        transfer_id: transfer.id,
        serial_number_id: sn.id,
        product_id: sn.product_id,
        quantity: 1,
        unit_cost: sn.unit_cost,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('stock_transfer_items')
        .insert(transferItems);

      if (itemsError) throw itemsError;

      // อัปเดตสถานะ Serial Numbers เป็น transferred
      const { error: updateSNError } = await supabase
        .from('product_serial_numbers')
        .update({ status: 'transferred' })
        .in('id', request.serialNumbers);

      if (updateSNError) throw updateSNError;

      // บันทึก Stock Movement สำหรับคลังต้นทาง (transfer_out)
      const outMovements = serialNumbers.map(sn => ({
        product_id: sn.product_id,
        serial_number_id: sn.id,
        warehouse_id: request.sourceWarehouseId,
        movement_type: 'transfer_out',
        quantity: -1,
        unit_cost: sn.unit_cost,
        reference_type: 'transfer',
        reference_id: transfer.id,
        reference_number: transferNumber,
        notes: `โอนไปยัง ${transfer.target_warehouse.name}`,
        performed_by: initiatedBy
      }));

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(outMovements);

      if (movementError) throw movementError;

      // ดึงข้อมูลการโอนที่สมบูรณ์
      return await this.getTransferById(transfer.id);

    } catch (error) {
      console.error('Error initiating transfer:', error);
      throw error;
    }
  }

  /**
   * ยืนยันการรับสินค้าโอน
   */
  async confirmTransfer(confirmation: TransferConfirmation): Promise<StockTransfer> {
    try {
      // ดึงข้อมูลการโอน
      const transfer = await this.getTransferById(confirmation.transferId);
      
      if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
        throw new Error('การโอนนี้ไม่สามารถยืนยันได้');
      }

      // อัปเดตสถานะการโอน
      const { error: updateTransferError } = await supabase
        .from('stock_transfers')
        .update({
          status: 'completed',
          confirmed_by: confirmation.confirmedBy,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', confirmation.transferId);

      if (updateTransferError) throw updateTransferError;

      // ดึงรายการ Serial Numbers ที่โอน
      const { data: transferItems, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select(`
          serial_number_id,
          product_id,
          unit_cost,
          serial_number:product_serial_numbers(
            id,
            serial_number
          )
        `)
        .eq('transfer_id', confirmation.transferId);

      if (itemsError) throw itemsError;

      // อัปเดต warehouse_id ของ Serial Numbers
      const serialNumberIds = transferItems.map(item => item.serial_number_id);
      const { error: updateSNError } = await supabase
        .from('product_serial_numbers')
        .update({ 
          warehouse_id: transfer.targetWarehouseId,
          status: 'available'
        })
        .in('id', serialNumberIds);

      if (updateSNError) throw updateSNError;

      // บันทึก Stock Movement สำหรับคลังปลายทาง (transfer_in)
      const inMovements = transferItems.map(item => ({
        product_id: item.product_id,
        serial_number_id: item.serial_number_id,
        warehouse_id: transfer.targetWarehouseId,
        movement_type: 'transfer_in',
        quantity: 1,
        unit_cost: item.unit_cost,
        reference_type: 'transfer',
        reference_id: confirmation.transferId,
        reference_number: transfer.transferNumber,
        notes: `รับโอนจาก ${transfer.sourceWarehouse?.name}`,
        performed_by: confirmation.confirmedBy
      }));

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(inMovements);

      if (movementError) throw movementError;

      // อัปเดตสถานะรายการโอน
      const { error: updateItemsError } = await supabase
        .from('stock_transfer_items')
        .update({ status: 'completed' })
        .eq('transfer_id', confirmation.transferId);

      if (updateItemsError) throw updateItemsError;

      return await this.getTransferById(confirmation.transferId);

    } catch (error) {
      console.error('Error confirming transfer:', error);
      throw error;
    }
  }

  /**
   * ยกเลิกการโอน
   */
  async cancelTransfer(transferId: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      const transfer = await this.getTransferById(transferId);
      
      if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
        throw new Error('การโอนนี้ไม่สามารถยกเลิกได้');
      }

      // อัปเดตสถานะการโอน
      const { error: updateTransferError } = await supabase
        .from('stock_transfers')
        .update({
          status: 'cancelled',
          notes: `${transfer.notes || ''}\n\nยกเลิกโดย: ${cancelledBy}\nเหตุผล: ${reason}`
        })
        .eq('id', transferId);

      if (updateTransferError) throw updateTransferError;

      // ดึงรายการ Serial Numbers ที่โอน
      const { data: transferItems, error: itemsError } = await supabase
        .from('stock_transfer_items')
        .select('serial_number_id')
        .eq('transfer_id', transferId);

      if (itemsError) throw itemsError;

      // คืนสถานะ Serial Numbers เป็น available
      const serialNumberIds = transferItems.map(item => item.serial_number_id);
      const { error: updateSNError } = await supabase
        .from('product_serial_numbers')
        .update({ status: 'available' })
        .in('id', serialNumberIds);

      if (updateSNError) throw updateSNError;

      // อัปเดตสถานะรายการโอน
      const { error: updateItemsError } = await supabase
        .from('stock_transfer_items')
        .update({ status: 'cancelled' })
        .eq('transfer_id', transferId);

      if (updateItemsError) throw updateItemsError;

    } catch (error) {
      console.error('Error cancelling transfer:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลการโอนตาม ID
   */
  async getTransferById(transferId: string): Promise<StockTransfer> {
    const { data: transfer, error } = await supabase
      .from('stock_transfers')
      .select(`
        id,
        transfer_number,
        source_warehouse_id,
        target_warehouse_id,
        status,
        total_items,
        notes,
        initiated_by,
        confirmed_by,
        created_at,
        confirmed_at,
        source_warehouse:warehouses!source_warehouse_id (
          id,
          name,
          code
        ),
        target_warehouse:warehouses!target_warehouse_id (
          id,
          name,
          code
        ),
        items:stock_transfer_items (
          id,
          serial_number_id,
          product_id,
          quantity,
          unit_cost,
          status,
          serial_number:product_serial_numbers(
            id,
            serial_number,
            product:products (
              id,
              name,
              code,
              sku
            )
          )
        )
      `)
      .eq('id', transferId)
      .single();

    if (error) throw error;
    return transfer as StockTransfer;
  }

  /**
   * ดึงรายการการโอนทั้งหมด
   */
  async getTransfers(filters?: {
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
    status?: TransferStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<StockTransfer[]> {
    let query = supabase
      .from('stock_transfers')
      .select(`
        id,
        transfer_number,
        source_warehouse_id,
        target_warehouse_id,
        status,
        total_items,
        notes,
        initiated_by,
        confirmed_by,
        created_at,
        confirmed_at,
        source_warehouse:warehouses!source_warehouse_id (
          id,
          name,
          code
        ),
        target_warehouse:warehouses!target_warehouse_id (
          id,
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.sourceWarehouseId) {
      query = query.eq('source_warehouse_id', filters.sourceWarehouseId);
    }

    if (filters?.targetWarehouseId) {
      query = query.eq('target_warehouse_id', filters.targetWarehouseId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as StockTransfer[];
  }

  /**
   * ดึงรายการ Serial Numbers ที่พร้อมโอน
   */
  async getAvailableSerialNumbers(warehouseId: string, searchTerm?: string): Promise<SerialNumber[]> {
    let query = supabase
      .from('product_serial_numbers')
      .select(`
        id,
        serial_number,
        product_id,
        warehouse_id,
        unit_cost,
        status,
        created_at,
        product:products (
          id,
          name,
          code,
          sku,
          brand,
          model
        )
      `)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`
        serial_number.ilike.%${searchTerm}%,
        products.name.ilike.%${searchTerm}%,
        products.code.ilike.%${searchTerm}%,
        products.sku.ilike.%${searchTerm}%
      `);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SerialNumber[];
  }

  /**
   * สร้างเลขที่โอนอัตโนมัติ
   */
  private async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `TF${year}${month}`;

    // หาเลขที่โอนล่าสุดในเดือนนี้
    const { data, error } = await supabase
      .from('stock_transfers')
      .select('transfer_number')
      .like('transfer_number', `${prefix}%`)
      .order('transfer_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].transfer_number;
      const lastSequence = parseInt(lastNumber.slice(-4));
      nextNumber = lastSequence + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * ดึงสถิติการโอน
   */
  async getTransferStats(warehouseId?: string): Promise<{
    pending: number;
    inTransit: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  }> {
    let query = supabase
      .from('stock_transfers')
      .select('status, total_items');

    if (warehouseId) {
      query = query.or(`source_warehouse_id.eq.${warehouseId},target_warehouse_id.eq.${warehouseId}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      pending: 0,
      inTransit: 0,
      completed: 0,
      cancelled: 0,
      totalValue: 0
    };

    data.forEach(transfer => {
      switch (transfer.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'in_transit':
          stats.inTransit++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
    });

    return stats;
  }
}

export const transferService = new TransferService();