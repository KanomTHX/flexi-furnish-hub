import { supabase } from '@/integrations/supabase/client';
import { BatchOperation, BatchOperationType } from '@/components/warehouses/BatchOperations';

export interface BatchResult {
  success: string[];
  failed: { serialNumber: string; error: string }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class BatchOperationsService {
  async processBatch(operation: BatchOperation, serialNumbers: string[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: [],
      failed: [],
      summary: {
        total: serialNumbers.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each serial number
    for (const sn of serialNumbers) {
      try {
        await this.processSingleItem(operation, sn);
        result.success.push(sn);
        result.summary.successful++;
      } catch (error) {
        result.failed.push({
          serialNumber: sn,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        result.summary.failed++;
      }
    }

    // Log batch operation
    await this.logBatchOperation(operation, result);

    return result;
  }

  private async processSingleItem(operation: BatchOperation, serialNumber: string): Promise<void> {
    switch (operation.type) {
      case 'transfer':
        await this.transferSerialNumber(serialNumber, operation.targetWarehouseId!);
        break;
      case 'withdraw':
        await this.withdrawSerialNumber(serialNumber, operation.notes);
        break;
      case 'adjust':
        await this.adjustSerialNumber(serialNumber, operation.adjustmentReason!, operation.notes);
        break;
      case 'status_update':
        await this.updateSerialNumberStatus(serialNumber, operation.newStatus!);
        break;
      case 'print_labels':
        await this.printLabel(serialNumber);
        break;
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async transferSerialNumber(serialNumber: string, targetWarehouseId: string): Promise<void> {
    // Get current SN details
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${serialNumber}`);
    }

    if (snData.status !== 'available') {
      throw new Error(`Serial number ${serialNumber} is not available for transfer`);
    }

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        transfer_number: `BT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source_warehouse_id: snData.warehouse_id,
        target_warehouse_id: targetWarehouseId,
        status: 'completed',
        total_items: 1,
        notes: 'Batch transfer operation'
      })
      .select()
      .single();

    if (transferError || !transfer) {
      throw new Error(`Failed to create transfer record for ${serialNumber}`);
    }

    // Create transfer item
    const { error: itemError } = await supabase
      .from('stock_transfer_items')
      .insert({
        transfer_id: transfer.id,
        serial_number_id: snData.id,
        product_id: snData.product_id,
        quantity: 1,
        unit_cost: snData.unit_cost,
        status: 'confirmed'
      });

    if (itemError) {
      throw new Error(`Failed to create transfer item for ${serialNumber}`);
    }

    // Update SN warehouse
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({ warehouse_id: targetWarehouseId })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to update warehouse for ${serialNumber}`);
    }

    // Log movement
    await this.logStockMovement(snData.id, snData.product_id, snData.warehouse_id, 'transfer_out', 1, snData.unit_cost, 'transfer', transfer.id);
    await this.logStockMovement(snData.id, snData.product_id, targetWarehouseId, 'transfer_in', 1, snData.unit_cost, 'transfer', transfer.id);
  }

  private async withdrawSerialNumber(serialNumber: string, notes?: string): Promise<void> {
    // Get current SN details
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${serialNumber}`);
    }

    if (snData.status !== 'available') {
      throw new Error(`Serial number ${serialNumber} is not available for withdrawal`);
    }

    // Update SN status
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({ 
        status: 'sold',
        sold_at: new Date().toISOString(),
        reference_number: `BATCH-WITHDRAW-${Date.now()}`
      })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to withdraw ${serialNumber}`);
    }

    // Log movement
    await this.logStockMovement(snData.id, snData.product_id, snData.warehouse_id, 'withdraw', 1, snData.unit_cost, 'sale', null, notes);
  }

  private async adjustSerialNumber(serialNumber: string, reason: string, notes?: string): Promise<void> {
    // Get current SN details
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${serialNumber}`);
    }

    // Create adjustment record
    const { data: adjustment, error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        adjustment_number: `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        warehouse_id: snData.warehouse_id,
        adjustment_type: 'correction',
        total_items: 1,
        reason: reason,
        status: 'approved'
      })
      .select()
      .single();

    if (adjustmentError || !adjustment) {
      throw new Error(`Failed to create adjustment record for ${serialNumber}`);
    }

    // Log movement
    await this.logStockMovement(snData.id, snData.product_id, snData.warehouse_id, 'adjustment', 1, snData.unit_cost, 'adjustment', adjustment.id, notes);
  }

  private async updateSerialNumberStatus(serialNumber: string, newStatus: string): Promise<void> {
    // Get current SN details
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${serialNumber}`);
    }

    // Update SN status
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to update status for ${serialNumber}`);
    }

    // Log movement if status change affects stock
    if (newStatus === 'damaged' || newStatus === 'claimed') {
      await this.logStockMovement(snData.id, snData.product_id, snData.warehouse_id, 'adjustment', 1, snData.unit_cost, 'adjustment', null, `Status changed to ${newStatus}`);
    }
  }

  private async printLabel(serialNumber: string): Promise<void> {
    // Get SN details for printing
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select(`
        *,
        products (name, code, brand, model)
      `)
      .eq('serial_number', serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${serialNumber}`);
    }

    // This would integrate with actual printing service
    console.log(`Printing label for ${serialNumber}:`, snData);
    
    // For now, just simulate printing
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async logStockMovement(
    serialNumberId: string,
    productId: string,
    warehouseId: string,
    movementType: string,
    quantity: number,
    unitCost: number,
    referenceType: string,
    referenceId: string | null,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        serial_number_id: serialNumberId,
        warehouse_id: warehouseId,
        movement_type: movementType,
        quantity: quantity,
        unit_cost: unitCost,
        reference_type: referenceType,
        reference_id: referenceId,
        notes: notes
      });

    if (error) {
      console.error('Failed to log stock movement:', error);
    }
  }

  private async logBatchOperation(operation: BatchOperation, result: BatchResult): Promise<void> {
    // Log the batch operation for audit trail
    const logData = {
      operation_type: operation.type,
      total_items: result.summary.total,
      successful_items: result.summary.successful,
      failed_items: result.summary.failed,
      operation_details: operation,
      result_summary: result.summary,
      timestamp: new Date().toISOString()
    };

    // This could be stored in a batch_operations_log table
    console.log('Batch operation completed:', logData);
  }

  async validateSerialNumbers(serialNumbers: string[]): Promise<{
    valid: Array<{ serialNumber: string; details: any }>;
    invalid: Array<{ serialNumber: string; reason: string }>;
  }> {
    const valid: Array<{ serialNumber: string; details: any }> = [];
    const invalid: Array<{ serialNumber: string; reason: string }> = [];

    for (const sn of serialNumbers) {
      try {
        const { data, error } = await supabase
          .from('product_serial_numbers')
          .select(`
            *,
            products (name, code, brand, model),
            warehouses (name, code)
          `)
          .eq('serial_number', sn)
          .single();

        if (error || !data) {
          invalid.push({ serialNumber: sn, reason: 'Serial number not found' });
        } else {
          valid.push({ serialNumber: sn, details: data });
        }
      } catch (error) {
        invalid.push({ serialNumber: sn, reason: 'Validation error' });
      }
    }

    return { valid, invalid };
  }
}

export const batchOperationsService = new BatchOperationsService();