import { supabase } from './supabase';
import { 
  SerialNumber, 
  StockMovement, 
  MovementType, 
  ReferenceType, 
  SNStatus,
  WithdrawGoodsForm,
  ClaimForm,
  ClaimType,
  ClaimResolution
} from '../types/warehouse';

export interface WithdrawRequest {
  serialNumbers: string[];
  movementType: MovementType;
  referenceType?: ReferenceType;
  referenceNumber?: string;
  soldTo?: string;
  notes?: string;
  performedBy: string;
}

export interface DispatchRequest {
  serialNumbers: string[];
  dispatchTo: string;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
}

export interface ClaimRequest {
  serialNumberId: string;
  claimType: ClaimType;
  reason: string;
  customerName?: string;
  originalSaleReference?: string;
  resolution?: ClaimResolution;
  processedBy: string;
}

export interface WithdrawDispatchResponse {
  success: boolean;
  message: string;
  data?: {
    processedItems: number;
    movements: StockMovement[];
  };
  error?: string;
}

class WithdrawDispatchService {
  /**
   * Withdraw items from stock (remove from available inventory)
   */
  async withdrawItems(request: WithdrawRequest): Promise<WithdrawDispatchResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate serial numbers exist and are available
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
            code
          )
        `)
        .in('serial_number', request.serialNumbers)
        .eq('status', SNStatus.AVAILABLE);

      if (snError) {
        throw new Error(`Failed to fetch serial numbers: ${snError.message}`);
      }

      if (!serialNumbers || serialNumbers.length === 0) {
        return {
          success: false,
          message: 'No available serial numbers found',
          error: 'SERIAL_NUMBERS_NOT_FOUND'
        };
      }

      if (serialNumbers.length !== request.serialNumbers.length) {
        const foundSNs = serialNumbers.map(sn => sn.serial_number);
        const missingSNs = request.serialNumbers.filter(sn => !foundSNs.includes(sn));
        return {
          success: false,
          message: `Some serial numbers are not available: ${missingSNs.join(', ')}`,
          error: 'SERIAL_NUMBERS_UNAVAILABLE'
        };
      }

      // Start transaction
      const movements: StockMovement[] = [];
      const processedItems: string[] = [];

      for (const sn of serialNumbers) {
        // Update serial number status
        const newStatus = request.movementType === MovementType.WITHDRAW ? SNStatus.SOLD : SNStatus.TRANSFERRED;
        
        const { error: updateError } = await supabase
          .from('product_serial_numbers')
          .update({
            status: newStatus,
            sold_at: new Date().toISOString(),
            sold_to: request.soldTo,
            reference_number: request.referenceNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', sn.id);

        if (updateError) {
          throw new Error(`Failed to update serial number ${sn.serial_number}: ${updateError.message}`);
        }

        // Create stock movement record
        const { data: movement, error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: sn.product_id,
            serial_number_id: sn.id,
            warehouse_id: sn.warehouse_id,
            movement_type: request.movementType,
            quantity: 1,
            unit_cost: sn.unit_cost,
            reference_type: request.referenceType,
            reference_number: request.referenceNumber,
            notes: request.notes,
            performed_by: request.performedBy
          })
          .select()
          .single();

        if (movementError) {
          throw new Error(`Failed to create movement record: ${movementError.message}`);
        }

        movements.push(movement);
        processedItems.push(sn.serial_number);
      }

      return {
        success: true,
        message: `Successfully withdrew ${processedItems.length} items`,
        data: {
          processedItems: processedItems.length,
          movements
        }
      };

    } catch (error) {
      console.error('Error withdrawing items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'WITHDRAW_FAILED'
      };
    }
  }

  /**
   * Dispatch items (update status to dispatched/delivered)
   */
  async dispatchItems(request: DispatchRequest): Promise<WithdrawDispatchResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate serial numbers exist and are sold
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
            code
          )
        `)
        .in('serial_number', request.serialNumbers)
        .eq('status', SNStatus.SOLD);

      if (snError) {
        throw new Error(`Failed to fetch serial numbers: ${snError.message}`);
      }

      if (!serialNumbers || serialNumbers.length === 0) {
        return {
          success: false,
          message: 'No sold serial numbers found for dispatch',
          error: 'SERIAL_NUMBERS_NOT_FOUND'
        };
      }

      const movements: StockMovement[] = [];
      const processedItems: string[] = [];

      for (const sn of serialNumbers) {
        // Update serial number with dispatch info
        const { error: updateError } = await supabase
          .from('product_serial_numbers')
          .update({
            sold_to: request.dispatchTo,
            reference_number: request.referenceNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', sn.id);

        if (updateError) {
          throw new Error(`Failed to update serial number ${sn.serial_number}: ${updateError.message}`);
        }

        // Create dispatch movement record
        const { data: movement, error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: sn.product_id,
            serial_number_id: sn.id,
            warehouse_id: sn.warehouse_id,
            movement_type: MovementType.WITHDRAW, // Dispatch is a type of withdrawal
            quantity: 1,
            unit_cost: sn.unit_cost,
            reference_type: ReferenceType.SALE,
            reference_number: request.referenceNumber,
            notes: `Dispatched to: ${request.dispatchTo}. ${request.notes || ''}`,
            performed_by: request.performedBy
          })
          .select()
          .single();

        if (movementError) {
          throw new Error(`Failed to create movement record: ${movementError.message}`);
        }

        movements.push(movement);
        processedItems.push(sn.serial_number);
      }

      return {
        success: true,
        message: `Successfully dispatched ${processedItems.length} items`,
        data: {
          processedItems: processedItems.length,
          movements
        }
      };

    } catch (error) {
      console.error('Error dispatching items:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'DISPATCH_FAILED'
      };
    }
  }

  /**
   * Process claim (return/warranty/defective/exchange)
   */
  async processClaim(request: ClaimRequest): Promise<WithdrawDispatchResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get serial number details
      const { data: serialNumber, error: snError } = await supabase
        .from('product_serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          warehouse_id,
          unit_cost,
          status,
          sold_to,
          reference_number,
          products (
            id,
            name,
            code
          )
        `)
        .eq('id', request.serialNumberId)
        .single();

      if (snError || !serialNumber) {
        throw new Error('Serial number not found');
      }

      // Generate claim number
      const claimNumber = `CLM-${Date.now()}`;

      // Create claim log
      const { data: claimLog, error: claimError } = await supabase
        .from('claim_logs')
        .insert({
          claim_number: claimNumber,
          serial_number_id: request.serialNumberId,
          claim_type: request.claimType,
          reason: request.reason,
          customer_name: request.customerName,
          original_sale_reference: request.originalSaleReference,
          resolution: request.resolution,
          processed_by: request.processedBy
        })
        .select()
        .single();

      if (claimError) {
        throw new Error(`Failed to create claim log: ${claimError.message}`);
      }

      // Update serial number status
      const { error: updateError } = await supabase
        .from('product_serial_numbers')
        .update({
          status: SNStatus.CLAIMED,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.serialNumberId);

      if (updateError) {
        throw new Error(`Failed to update serial number status: ${updateError.message}`);
      }

      // Create claim movement record
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: serialNumber.product_id,
          serial_number_id: request.serialNumberId,
          warehouse_id: serialNumber.warehouse_id,
          movement_type: MovementType.CLAIM,
          quantity: 1,
          unit_cost: serialNumber.unit_cost,
          reference_type: ReferenceType.CLAIM,
          reference_number: claimNumber,
          notes: `Claim: ${request.claimType} - ${request.reason}`,
          performed_by: request.processedBy
        })
        .select()
        .single();

      if (movementError) {
        throw new Error(`Failed to create movement record: ${movementError.message}`);
      }

      return {
        success: true,
        message: `Claim processed successfully: ${claimNumber}`,
        data: {
          processedItems: 1,
          movements: [movement]
        }
      };

    } catch (error) {
      console.error('Error processing claim:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'CLAIM_FAILED'
      };
    }
  }

  /**
   * Get available serial numbers for withdrawal
   */
  async getAvailableSerialNumbers(warehouseId?: string, productId?: string): Promise<SerialNumber[]> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          warehouse_id,
          unit_cost,
          status,
          supplier_id,
          invoice_number,
          created_at,
          updated_at,
          products (
            id,
            name,
            code,
            brand,
            model
          ),
          warehouses (
            id,
            name,
            code
          )
        `)
        .eq('status', SNStatus.AVAILABLE)
        .order('created_at', { ascending: false });

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch available serial numbers: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching available serial numbers:', error);
      return [];
    }
  }

  /**
   * Get sold serial numbers for dispatch
   */
  async getSoldSerialNumbers(warehouseId?: string, productId?: string): Promise<SerialNumber[]> {
    try {
      let query = supabase
        .from('product_serial_numbers')
        .select(`
          id,
          serial_number,
          product_id,
          warehouse_id,
          unit_cost,
          status,
          sold_at,
          sold_to,
          reference_number,
          created_at,
          updated_at,
          products (
            id,
            name,
            code,
            brand,
            model
          ),
          warehouses (
            id,
            name,
            code
          )
        `)
        .eq('status', SNStatus.SOLD)
        .order('sold_at', { ascending: false });

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch sold serial numbers: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Error fetching sold serial numbers:', error);
      return [];
    }
  }

  /**
   * Integration point for POS system
   */
  async processPOSSale(saleData: {
    serialNumbers: string[];
    saleId: string;
    customerId?: string;
    customerName?: string;
    totalAmount: number;
    performedBy: string;
  }): Promise<WithdrawDispatchResponse> {
    return this.withdrawItems({
      serialNumbers: saleData.serialNumbers,
      movementType: MovementType.WITHDRAW,
      referenceType: ReferenceType.POS,
      referenceNumber: saleData.saleId,
      soldTo: saleData.customerName || saleData.customerId,
      notes: `POS Sale - Total: ${saleData.totalAmount}`,
      performedBy: saleData.performedBy
    });
  }

  /**
   * Integration point for installment system
   */
  async processInstallmentSale(installmentData: {
    serialNumbers: string[];
    contractId: string;
    customerId: string;
    customerName: string;
    totalAmount: number;
    performedBy: string;
  }): Promise<WithdrawDispatchResponse> {
    return this.withdrawItems({
      serialNumbers: installmentData.serialNumbers,
      movementType: MovementType.WITHDRAW,
      referenceType: ReferenceType.INSTALLMENT,
      referenceNumber: installmentData.contractId,
      soldTo: installmentData.customerName,
      notes: `Installment Sale - Contract: ${installmentData.contractId}, Total: ${installmentData.totalAmount}`,
      performedBy: installmentData.performedBy
    });
  }
}

export const withdrawDispatchService = new WithdrawDispatchService();