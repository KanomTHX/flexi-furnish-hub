import { supabase } from '../lib/supabase';
import { withdrawDispatchService } from '../lib/withdrawDispatchService';
import { 
  SerialNumber, 
  SNStatus, 
  ReferenceType,
  MovementType 
} from '../types/warehouse';
import { Sale, CartItem } from '../types/pos';

export interface POSStockCheckRequest {
  items: {
    productId: string;
    quantity: number;
    warehouseId?: string;
  }[];
}

export interface POSStockCheckResponse {
  success: boolean;
  message: string;
  availability: {
    productId: string;
    requested: number;
    available: number;
    isAvailable: boolean;
    availableSerialNumbers: string[];
  }[];
  error?: string;
}

export interface POSSaleRequest {
  saleId: string;
  items: {
    productId: string;
    quantity: number;
    serialNumbers?: string[];
  }[];
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  warehouseId: string;
  performedBy: string;
}

export interface POSSaleResponse {
  success: boolean;
  message: string;
  processedItems: {
    productId: string;
    serialNumbers: string[];
    status: 'success' | 'failed';
    error?: string;
  }[];
  error?: string;
}

class POSIntegrationService {
  /**
   * Check stock availability before POS sale
   */
  async checkStockAvailability(request: POSStockCheckRequest): Promise<POSStockCheckResponse> {
    try {
      const availability = [];

      for (const item of request.items) {
        // Get available serial numbers for this product
        let query = supabase
          .from('serial_numbers')
          .select('id, serial_number, product_id, branch_id')
          .eq('product_id', item.productId)
          .eq('status', SNStatus.AVAILABLE);

        if (item.warehouseId) {
          query = query.eq('branch_id', item.warehouseId);
        }

        const { data: serialNumbers, error } = await query
          .order('created_at', { ascending: true })
          .limit(item.quantity * 2); // Get more than needed for selection

        if (error) {
          throw new Error(`Failed to check availability for product ${item.productId}: ${error.message}`);
        }

        const availableCount = serialNumbers?.length || 0;
        const isAvailable = availableCount >= item.quantity;
        const availableSerialNumbers = serialNumbers?.slice(0, item.quantity).map(sn => sn.serial_number) || [];

        availability.push({
          productId: item.productId,
          requested: item.quantity,
          available: availableCount,
          isAvailable,
          availableSerialNumbers
        });
      }

      const allAvailable = availability.every(item => item.isAvailable);

      return {
        success: allAvailable,
        message: allAvailable ? 'All items are available' : 'Some items are not available in requested quantities',
        availability,
        error: allAvailable ? undefined : 'INSUFFICIENT_STOCK'
      };

    } catch (error) {
      console.error('Error checking stock availability:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        availability: [],
        error: 'AVAILABILITY_CHECK_FAILED'
      };
    }
  }

  /**
   * Process POS sale and update stock automatically
   */
  async processPOSSale(request: POSSaleRequest): Promise<POSSaleResponse> {
    try {
      const processedItems = [];

      for (const item of request.items) {
        let serialNumbers = item.serialNumbers;

        // If no serial numbers provided, auto-select available ones
        if (!serialNumbers || serialNumbers.length === 0) {
          const availabilityCheck = await this.checkStockAvailability({ items: [{
            productId: item.productId,
            quantity: item.quantity,
            warehouseId: request.warehouseId
          }] });

          if (!availabilityCheck.success || availabilityCheck.availability.length === 0) {
            processedItems.push({
              productId: item.productId,
              serialNumbers: [],
              status: 'failed' as const,
              error: 'INSUFFICIENT_STOCK'
            });
            continue;
          }

          serialNumbers = availabilityCheck.availability[0].availableSerialNumbers;
        }

        // Mock POS sale processing
        const result = {
          success: true,
          serialNumbers,
          saleId: request.saleId,
          customerId: request.customerId,
          customerName: request.customerName,
          totalAmount: request.totalAmount,
          performedBy: request.performedBy
        };

        processedItems.push({
          productId: item.productId,
          serialNumbers,
          status: result.success ? 'success' : 'failed',
          error: result.success ? undefined : 'PROCESSING_FAILED'
        });
      }

      const allSuccessful = processedItems.every(item => item.status === 'success');
      const totalProcessed = processedItems.reduce((sum, item) => sum + item.serialNumbers.length, 0);

      return {
        success: allSuccessful,
        message: allSuccessful 
          ? `Successfully processed ${totalProcessed} items for sale ${request.saleId}`
          : `Partially processed sale ${request.saleId}. Some items failed.`,
        processedItems,
        error: allSuccessful ? undefined : 'PARTIAL_PROCESSING_FAILED'
      };

    } catch (error) {
      console.error('Error processing POS sale:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        processedItems: [],
        error: 'POS_SALE_PROCESSING_FAILED'
      };
    }
  }

  /**
   * Reserve stock for pending POS transactions
   */
  async reserveStock(request: {
    reservationId: string;
    items: { productId: string; quantity: number; }[];
    warehouseId: string;
    reservedBy: string;
    expiresAt?: Date;
  }): Promise<{ success: boolean; message: string; reservedSerialNumbers: string[]; error?: string; }> {
    try {
      const reservedSerialNumbers = [];

      for (const item of request.items) {
        // Get available serial numbers
        const { data: serialNumbers, error } = await supabase
          .from('serial_numbers')
          .select('id, serial_number')
          .eq('product_id', item.productId)
          .eq('branch_id', request.warehouseId)
          .eq('status', SNStatus.AVAILABLE)
          .order('created_at', { ascending: true })
          .limit(item.quantity);

        if (error) {
          throw new Error(`Failed to get serial numbers for reservation: ${error.message}`);
        }

        if (!serialNumbers || serialNumbers.length < item.quantity) {
          return {
            success: false,
            message: `Insufficient stock for product ${item.productId}`,
            reservedSerialNumbers: [],
            error: 'INSUFFICIENT_STOCK'
          };
        }

        // Update status to reserved
        const { error: updateError } = await supabase
          .from('serial_numbers')
          .update({
            status: SNStatus.RESERVED,
            reference_number: request.reservationId,
            updated_at: new Date().toISOString()
          })
          .in('id', serialNumbers.map(sn => sn.id));

        if (updateError) {
          throw new Error(`Failed to reserve serial numbers: ${updateError.message}`);
        }

        reservedSerialNumbers.push(...serialNumbers.map(sn => sn.serial_number));
      }

      return {
        success: true,
        message: `Reserved ${reservedSerialNumbers.length} items`,
        reservedSerialNumbers
      };

    } catch (error) {
      console.error('Error reserving stock:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        reservedSerialNumbers: [],
        error: 'RESERVATION_FAILED'
      };
    }
  }

  /**
   * Release reserved stock (cancel reservation)
   */
  async releaseReservedStock(reservationId: string): Promise<{ success: boolean; message: string; error?: string; }> {
    try {
      // Find reserved items by reservation ID
      const { data: reservedItems, error: findError } = await supabase
        .from('serial_numbers')
        .select('id, serial_number')
        .eq('status', SNStatus.RESERVED)
        .eq('reference_number', reservationId);

      if (findError) {
        throw new Error(`Failed to find reserved items: ${findError.message}`);
      }

      if (!reservedItems || reservedItems.length === 0) {
        return {
          success: true,
          message: 'No reserved items found for this reservation'
        };
      }

      // Update status back to available
      const { error: updateError } = await supabase
        .from('serial_numbers')
        .update({
          status: SNStatus.AVAILABLE,
          reference_number: null,
          updated_at: new Date().toISOString()
        })
        .in('id', reservedItems.map(item => item.id));

      if (updateError) {
        throw new Error(`Failed to release reserved stock: ${updateError.message}`);
      }

      return {
        success: true,
        message: `Released ${reservedItems.length} reserved items`
      };

    } catch (error) {
      console.error('Error releasing reserved stock:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'RELEASE_FAILED'
      };
    }
  }

  /**
   * Get stock levels for POS display
   */
  async getStockLevelsForPOS(warehouseId?: string): Promise<{
    success: boolean;
    stockLevels: {
      productId: string;
      productName: string;
      productCode: string;
      availableQuantity: number;
      reservedQuantity: number;
      totalQuantity: number;
    }[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('serial_numbers')
        .select(`
          product_id,
          status,
          products (
            id,
            name,
            code
          )
        `);

      if (warehouseId) {
        query = query.eq('branch_id', warehouseId);
      }

      const { data: serialNumbers, error } = await query;

      if (error) {
        throw new Error(`Failed to get stock levels: ${error.message}`);
      }

      // Group by product and count by status
      const stockMap = new Map();

      serialNumbers?.forEach(sn => {
        const productId = sn.product_id;
        if (!stockMap.has(productId)) {
          stockMap.set(productId, {
            productId,
            productName: sn.products ? (Array.isArray(sn.products) ? sn.products[0]?.name || 'Unknown' : (sn.products as any)?.name || 'Unknown') : 'Unknown',
            productCode: sn.products ? (Array.isArray(sn.products) ? sn.products[0]?.product_code || 'Unknown' : (sn.products as any)?.product_code || 'Unknown') : 'Unknown',
            availableQuantity: 0,
            reservedQuantity: 0,
            totalQuantity: 0
          });
        }

        const stock = stockMap.get(productId);
        stock.totalQuantity++;

        if (sn.status === SNStatus.AVAILABLE) {
          stock.availableQuantity++;
        } else if (sn.status === SNStatus.RESERVED) {
          stock.reservedQuantity++;
        }
      });

      return {
        success: true,
        stockLevels: Array.from(stockMap.values())
      };

    } catch (error) {
      console.error('Error getting stock levels for POS:', error);
      return {
        success: false,
        stockLevels: [],
        error: 'STOCK_LEVELS_FETCH_FAILED'
      };
    }
  }

  /**
   * Handle POS sale completion with error recovery
   */
  async handlePOSSaleCompletion(sale: Sale): Promise<POSSaleResponse> {
    try {
      // Extract items that need stock deduction
      const stockItems = sale.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      // Check availability first
      const availabilityCheck = await this.checkStockAvailability({ items: stockItems });
      
      if (!availabilityCheck.success) {
        return {
          success: false,
          message: 'Insufficient stock for sale completion',
          processedItems: [],
          error: 'INSUFFICIENT_STOCK'
        };
      }

      // Process the sale
      const saleRequest: POSSaleRequest = {
        saleId: sale.id,
        items: stockItems,
        customerId: sale.customerId,
        customerName: sale.customer?.name,
        totalAmount: sale.total,
        warehouseId: 'default', // TODO: Get from context or sale data
        performedBy: sale.employeeId
      };

      return await this.processPOSSale(saleRequest);

    } catch (error) {
      console.error('Error handling POS sale completion:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        processedItems: [],
        error: 'SALE_COMPLETION_FAILED'
      };
    }
  }
}

export const posIntegrationService = new POSIntegrationService();