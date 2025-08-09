// ===================================================================
// INSTALLMENT INTEGRATION SERVICE
// บริการเชื่อมโยงระบบเช่าซื้อกับระบบคลังสินค้า
// ===================================================================

import { supabase } from '@/integrations/supabase/client';
import { InstallmentContract } from '@/types/installments';
import { SerialNumber } from '@/types/warehouse';

export interface InstallmentStockReservation {
  id: string;
  contractId: string;
  contractNumber: string;
  serialNumberId: string;
  serialNumber: string;
  productId: string;
  warehouseId: string;
  reservedAt: Date;
  status: 'reserved' | 'confirmed' | 'released';
  notes?: string;
}

export interface InstallmentStockItem {
  productId: string;
  quantity: number;
  warehouseId: string;
  unitPrice: number;
  serialNumbers?: string[]; // Optional specific SNs to reserve
}

export interface ContractStockData {
  contractId: string;
  contractNumber: string;
  items: InstallmentStockItem[];
  customerId: string;
  branchId: string;
}

// ===================================================================
// STOCK RESERVATION FUNCTIONS
// ===================================================================

/**
 * จองสต็อกสำหรับสัญญาเช่าซื้อ
 */
export async function reserveStockForContract(
  contractData: ContractStockData
): Promise<InstallmentStockReservation[]> {
  try {
    const reservations: InstallmentStockReservation[] = [];

    for (const item of contractData.items) {
      // หา SN ที่ว่างสำหรับสินค้านี้
      const availableSNs = await getAvailableSerialNumbers(
        item.productId,
        item.warehouseId,
        item.quantity,
        item.serialNumbers
      );

      if (availableSNs.length < item.quantity) {
        throw new Error(
          `สต็อกไม่เพียงพอสำหรับสินค้า ${item.productId} ต้องการ ${item.quantity} ชิ้น มีเพียง ${availableSNs.length} ชิ้น`
        );
      }

      // จอง SN ที่เลือก
      for (let i = 0; i < item.quantity; i++) {
        const sn = availableSNs[i];
        
        // อัปเดตสถานะ SN เป็น reserved
        const { error: updateError } = await supabase
          .from('product_serial_numbers')
          .update({
            status: 'reserved',
            reference_number: contractData.contractNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', sn.id);

        if (updateError) throw updateError;

        // สร้างบันทึกการจอง
        const reservation: InstallmentStockReservation = {
          id: crypto.randomUUID(),
          contractId: contractData.contractId,
          contractNumber: contractData.contractNumber,
          serialNumberId: sn.id,
          serialNumber: sn.serial_number,
          productId: item.productId,
          warehouseId: item.warehouseId,
          reservedAt: new Date(),
          status: 'reserved',
          notes: `จองสำหรับสัญญาเช่าซื้อ ${contractData.contractNumber}`
        };

        reservations.push(reservation);

        // บันทึก stock movement
        await recordStockMovement({
          productId: item.productId,
          serialNumberId: sn.id,
          warehouseId: item.warehouseId,
          movementType: 'reserve',
          quantity: 1,
          unitCost: item.unitPrice,
          referenceType: 'installment_contract',
          referenceId: contractData.contractId,
          referenceNumber: contractData.contractNumber,
          notes: `จองสต็อกสำหรับสัญญาเช่าซื้อ`
        });
      }
    }

    return reservations;
  } catch (error) {
    console.error('Error reserving stock for contract:', error);
    throw new Error(`ไม่สามารถจองสต็อกสำหรับสัญญาได้: ${error.message}`);
  }
}

/**
 * ยืนยันการขายและตัดสต็อกจริง
 */
export async function confirmStockSale(
  contractId: string,
  saleData: {
    soldTo: string;
    saleDate: Date;
    receiptNumber?: string;
  }
): Promise<void> {
  try {
    // หาการจองที่เกี่ยวข้อง
    const reservations = await getContractReservations(contractId);

    for (const reservation of reservations) {
      // อัปเดตสถานะ SN เป็น sold
      const { error: updateError } = await supabase
        .from('product_serial_numbers')
        .update({
          status: 'sold',
          sold_at: saleData.saleDate.toISOString(),
          sold_to: saleData.soldTo,
          reference_number: saleData.receiptNumber || reservation.contractNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.serialNumberId);

      if (updateError) throw updateError;

      // บันทึก stock movement
      await recordStockMovement({
        productId: reservation.productId,
        serialNumberId: reservation.serialNumberId,
        warehouseId: reservation.warehouseId,
        movementType: 'withdraw',
        quantity: 1,
        referenceType: 'installment_sale',
        referenceId: contractId,
        referenceNumber: saleData.receiptNumber || reservation.contractNumber,
        notes: `ขายผ่านสัญญาเช่าซื้อ ${reservation.contractNumber}`
      });
    }

    console.log(`ยืนยันการขายสำหรับสัญญา ${contractId} เรียบร้อย`);
  } catch (error) {
    console.error('Error confirming stock sale:', error);
    throw new Error(`ไม่สามารถยืนยันการขายได้: ${error.message}`);
  }
}

/**
 * ปลดปล่อยสต็อกที่จองไว้ (กรณียกเลิกสัญญา)
 */
export async function releaseReservedStock(
  contractId: string,
  reason: string = 'ยกเลิกสัญญา'
): Promise<void> {
  try {
    // หาการจองที่เกี่ยวข้อง
    const reservations = await getContractReservations(contractId);

    for (const reservation of reservations) {
      // อัปเดตสถานะ SN กลับเป็น available
      const { error: updateError } = await supabase
        .from('product_serial_numbers')
        .update({
          status: 'available',
          reference_number: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.serialNumberId);

      if (updateError) throw updateError;

      // บันทึก stock movement
      await recordStockMovement({
        productId: reservation.productId,
        serialNumberId: reservation.serialNumberId,
        warehouseId: reservation.warehouseId,
        movementType: 'release',
        quantity: 1,
        referenceType: 'installment_cancel',
        referenceId: contractId,
        referenceNumber: reservation.contractNumber,
        notes: `ปลดปล่อยสต็อก: ${reason}`
      });
    }

    console.log(`ปลดปล่อยสต็อกสำหรับสัญญา ${contractId} เรียบร้อย`);
  } catch (error) {
    console.error('Error releasing reserved stock:', error);
    throw new Error(`ไม่สามารถปลดปล่อยสต็อกได้: ${error.message}`);
  }
}

// ===================================================================
// SN TRACKING FUNCTIONS
// ===================================================================

/**
 * ติดตาม SN ที่ใช้ในการขายผ่อน
 */
export async function trackInstallmentSNs(
  contractId: string
): Promise<SerialNumber[]> {
  try {
    const { data, error } = await supabase
      .from('product_serial_numbers')
      .select(`
        *,
        products (
          name,
          code,
          brand,
          model
        )
      `)
      .eq('reference_number', contractId)
      .in('status', ['reserved', 'sold']);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error tracking installment SNs:', error);
    throw new Error('ไม่สามารถติดตาม SN ได้');
  }
}

/**
 * ดึงประวัติการเคลื่อนไหวของ SN ในระบบเช่าซื้อ
 */
export async function getInstallmentSNHistory(
  serialNumber: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product_serial_numbers!inner (
          serial_number
        )
      `)
      .eq('product_serial_numbers.serial_number', serialNumber)
      .in('reference_type', ['installment_contract', 'installment_sale', 'installment_cancel'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting installment SN history:', error);
    throw new Error('ไม่สามารถดึงประวัติ SN ได้');
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * หา SN ที่ว่างสำหรับการจอง
 */
async function getAvailableSerialNumbers(
  productId: string,
  warehouseId: string,
  quantity: number,
  preferredSNs?: string[]
): Promise<SerialNumber[]> {
  try {
    let query = supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'available')
      .limit(quantity);

    // ถ้าระบุ SN เฉพาะ ให้หาตามที่ระบุก่อน
    if (preferredSNs && preferredSNs.length > 0) {
      query = query.in('serial_number', preferredSNs);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting available serial numbers:', error);
    throw new Error('ไม่สามารถหา SN ที่ว่างได้');
  }
}

/**
 * ดึงการจองของสัญญา
 */
async function getContractReservations(
  contractId: string
): Promise<InstallmentStockReservation[]> {
  try {
    const { data, error } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('reference_number', contractId)
      .eq('status', 'reserved');

    if (error) throw error;

    return (data || []).map(sn => ({
      id: sn.id,
      contractId: contractId,
      contractNumber: sn.reference_number,
      serialNumberId: sn.id,
      serialNumber: sn.serial_number,
      productId: sn.product_id,
      warehouseId: sn.warehouse_id,
      reservedAt: new Date(sn.updated_at),
      status: 'reserved' as const,
      notes: `จองสำหรับสัญญาเช่าซื้อ`
    }));
  } catch (error) {
    console.error('Error getting contract reservations:', error);
    throw new Error('ไม่สามารถดึงข้อมูลการจองได้');
  }
}

/**
 * บันทึกการเคลื่อนไหวสต็อก
 */
async function recordStockMovement(movementData: {
  productId: string;
  serialNumberId: string;
  warehouseId: string;
  movementType: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('stock_movements')
      .insert({
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
        performed_by: 'system', // TODO: ใช้ user ID จริง
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording stock movement:', error);
    throw new Error('ไม่สามารถบันทึกการเคลื่อนไหวสต็อกได้');
  }
}

// ===================================================================
// INTEGRATION HOOKS
// ===================================================================

/**
 * Hook สำหรับเชื่อมต่อกับระบบเช่าซื้อ
 * เรียกใช้เมื่อมีการสร้างสัญญาใหม่
 */
export async function onInstallmentContractCreated(
  contract: InstallmentContract,
  stockItems: InstallmentStockItem[]
): Promise<InstallmentStockReservation[]> {
  try {
    const contractData: ContractStockData = {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      items: stockItems,
      customerId: contract.customerId,
      branchId: contract.branchId || 'default'
    };

    const reservations = await reserveStockForContract(contractData);
    
    console.log(`จองสต็อกสำหรับสัญญา ${contract.contractNumber} เรียบร้อย`);
    
    return reservations;
  } catch (error) {
    console.error('Error in contract creation hook:', error);
    throw error;
  }
}

/**
 * Hook สำหรับเชื่อมต่อกับระบบเช่าซื้อ
 * เรียกใช้เมื่อมีการยกเลิกสัญญา
 */
export async function onInstallmentContractCancelled(
  contractId: string,
  reason: string = 'ยกเลิกสัญญา'
): Promise<void> {
  try {
    await releaseReservedStock(contractId, reason);
    
    console.log(`ปลดปล่อยสต็อกสำหรับสัญญา ${contractId} เรียบร้อย`);
  } catch (error) {
    console.error('Error in contract cancellation hook:', error);
    throw error;
  }
}

/**
 * Hook สำหรับเชื่อมต่อกับระบบเช่าซื้อ
 * เรียกใช้เมื่อมีการยืนยันการขาย
 */
export async function onInstallmentSaleConfirmed(
  contractId: string,
  saleData: {
    soldTo: string;
    saleDate: Date;
    receiptNumber?: string;
  }
): Promise<void> {
  try {
    await confirmStockSale(contractId, saleData);
    
    console.log(`ยืนยันการขายสำหรับสัญญา ${contractId} เรียบร้อย`);
  } catch (error) {
    console.error('Error in sale confirmation hook:', error);
    throw error;
  }
}

// ===================================================================
// EXPORT DEFAULT SERVICE
// ===================================================================

export const installmentIntegrationService = {
  // Stock reservation
  reserveStockForContract,
  confirmStockSale,
  releaseReservedStock,
  
  // SN tracking
  trackInstallmentSNs,
  getInstallmentSNHistory,
  
  // Integration hooks
  onInstallmentContractCreated,
  onInstallmentContractCancelled,
  onInstallmentSaleConfirmed
};

export default installmentIntegrationService;