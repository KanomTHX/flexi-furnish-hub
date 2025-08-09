import { supabase } from '@/integrations/supabase/client';
import { StockAdjustmentData, AdjustmentItem } from '@/components/warehouses/StockAdjustment';

export interface AdjustmentResult {
  adjustmentId: string;
  adjustmentNumber: string;
  processedItems: number;
  failedItems: Array<{ serialNumber: string; error: string }>;
  success: boolean;
}

export class StockAdjustmentService {
  async processAdjustment(adjustmentData: StockAdjustmentData): Promise<AdjustmentResult> {
    const result: AdjustmentResult = {
      adjustmentId: '',
      adjustmentNumber: adjustmentData.adjustmentNumber,
      processedItems: 0,
      failedItems: [],
      success: false
    };

    try {
      // Create adjustment record
      const { data: adjustment, error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          adjustment_number: adjustmentData.adjustmentNumber,
          warehouse_id: adjustmentData.warehouseId,
          adjustment_type: adjustmentData.adjustmentType,
          total_items: adjustmentData.totalItems,
          reason: adjustmentData.reason,
          status: 'pending'
        })
        .select()
        .single();

      if (adjustmentError || !adjustment) {
        throw new Error('Failed to create adjustment record');
      }

      result.adjustmentId = adjustment.id;

      // Process each item
      for (const item of adjustmentData.items) {
        try {
          await this.processAdjustmentItem(adjustment.id, item);
          result.processedItems++;
        } catch (error) {
          result.failedItems.push({
            serialNumber: item.serialNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update adjustment status
      const finalStatus = result.failedItems.length === 0 ? 'approved' : 'partial';
      await supabase
        .from('stock_adjustments')
        .update({ 
          status: finalStatus,
          approved_at: new Date().toISOString()
        })
        .eq('id', adjustment.id);

      result.success = result.processedItems > 0;

      // Log the adjustment completion
      await this.logAdjustmentCompletion(adjustment.id, result);

      return result;
    } catch (error) {
      throw new Error(`Adjustment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processAdjustmentItem(adjustmentId: string, item: AdjustmentItem): Promise<void> {
    // Get current serial number data
    const { data: snData, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('*')
      .eq('serial_number', item.serialNumber)
      .single();

    if (snError || !snData) {
      throw new Error(`Serial number not found: ${item.serialNumber}`);
    }

    // Process based on adjustment type
    switch (item.adjustmentType) {
      case 'add':
        await this.addToStock(snData, item, adjustmentId);
        break;
      case 'remove':
        await this.removeFromStock(snData, item, adjustmentId);
        break;
      case 'status_change':
        await this.changeStatus(snData, item, adjustmentId);
        break;
      case 'correction':
        await this.correctData(snData, item, adjustmentId);
        break;
      default:
        throw new Error(`Unsupported adjustment type: ${item.adjustmentType}`);
    }
  }

  private async addToStock(snData: any, item: AdjustmentItem, adjustmentId: string): Promise<void> {
    // Update serial number to available status
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to add ${item.serialNumber} to stock`);
    }

    // Log stock movement
    await this.logStockMovement(
      snData.id,
      snData.product_id,
      snData.warehouse_id,
      'adjustment',
      1,
      snData.unit_cost,
      'adjustment',
      adjustmentId,
      `Added to stock: ${item.reason}`
    );
  }

  private async removeFromStock(snData: any, item: AdjustmentItem, adjustmentId: string): Promise<void> {
    // Update serial number status to indicate removal
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({
        status: 'damaged', // or another appropriate status
        updated_at: new Date().toISOString()
      })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to remove ${item.serialNumber} from stock`);
    }

    // Log stock movement
    await this.logStockMovement(
      snData.id,
      snData.product_id,
      snData.warehouse_id,
      'adjustment',
      -1,
      snData.unit_cost,
      'adjustment',
      adjustmentId,
      `Removed from stock: ${item.reason}`
    );
  }

  private async changeStatus(snData: any, item: AdjustmentItem, adjustmentId: string): Promise<void> {
    if (!item.newStatus) {
      throw new Error('New status is required for status change adjustment');
    }

    // Update serial number status
    const { error: updateError } = await supabase
      .from('product_serial_numbers')
      .update({
        status: item.newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', snData.id);

    if (updateError) {
      throw new Error(`Failed to change status for ${item.serialNumber}`);
    }

    // Log stock movement
    await this.logStockMovement(
      snData.id,
      snData.product_id,
      snData.warehouse_id,
      'adjustment',
      0, // No quantity change, just status
      snData.unit_cost,
      'adjustment',
      adjustmentId,
      `Status changed from ${snData.status} to ${item.newStatus}: ${item.reason}`
    );
  }

  private async correctData(snData: any, item: AdjustmentItem, adjustmentId: string): Promise<void> {
    // For data corrections, we just log the correction without changing the SN
    // The actual correction would depend on what data needs to be corrected
    
    // Log stock movement for audit trail
    await this.logStockMovement(
      snData.id,
      snData.product_id,
      snData.warehouse_id,
      'adjustment',
      0, // No quantity change
      snData.unit_cost,
      'adjustment',
      adjustmentId,
      `Data correction: ${item.reason}`
    );
  }

  private async logStockMovement(
    serialNumberId: string,
    productId: string,
    warehouseId: string,
    movementType: string,
    quantity: number,
    unitCost: number,
    referenceType: string,
    referenceId: string,
    notes: string
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

  private async logAdjustmentCompletion(adjustmentId: string, result: AdjustmentResult): Promise<void> {
    // Log adjustment completion for audit trail
    const logData = {
      adjustment_id: adjustmentId,
      processed_items: result.processedItems,
      failed_items: result.failedItems.length,
      success: result.success,
      timestamp: new Date().toISOString()
    };

    console.log('Adjustment completed:', logData);
  }

  async getAdjustmentHistory(warehouseId?: string, limit: number = 50): Promise<any[]> {
    let query = supabase
      .from('stock_adjustments')
      .select(`
        *,
        warehouses (name, code),
        stock_movements (
          id,
          product_id,
          serial_number_id,
          movement_type,
          quantity,
          notes,
          created_at,
          product_serial_numbers (serial_number),
          products (name, code)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch adjustment history: ${error.message}`);
    }

    return data || [];
  }

  async getAdjustmentDetails(adjustmentId: string): Promise<any> {
    const { data, error } = await supabase
      .from('stock_adjustments')
      .select(`
        *,
        warehouses (name, code),
        stock_movements (
          id,
          product_id,
          serial_number_id,
          movement_type,
          quantity,
          unit_cost,
          notes,
          created_at,
          product_serial_numbers (serial_number),
          products (name, code, brand, model)
        )
      `)
      .eq('id', adjustmentId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch adjustment details: ${error.message}`);
    }

    return data;
  }

  async approveAdjustment(adjustmentId: string, approverId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_adjustments')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', adjustmentId);

    if (error) {
      throw new Error(`Failed to approve adjustment: ${error.message}`);
    }
  }

  async rejectAdjustment(adjustmentId: string, approverId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('stock_adjustments')
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        reason: `${reason} (Original: ${reason})`
      })
      .eq('id', adjustmentId);

    if (error) {
      throw new Error(`Failed to reject adjustment: ${error.message}`);
    }
  }
}

export const stockAdjustmentService = new StockAdjustmentService();