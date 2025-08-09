import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { 
  StockLevel, 
  StockMovement, 
  SerialNumber, 
  StockAlert,
  StockTransaction 
} from '@/types/warehouseStock';

export interface StockUpdateEvent {
  type: 'stock_level_changed' | 'movement_logged' | 'serial_number_updated' | 'alert_triggered';
  data: any;
  timestamp: Date;
  warehouseId?: string;
  productId?: string;
}

export interface StockSubscriptionOptions {
  warehouseId?: string;
  productId?: string;
  includeMovements?: boolean;
  includeSerialNumbers?: boolean;
  includeAlerts?: boolean;
}

export type StockUpdateCallback = (event: StockUpdateEvent) => void;

export class RealTimeStockService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static callbacks: Map<string, StockUpdateCallback[]> = new Map();
  private static alertThresholds = {
    lowStock: 5,
    outOfStock: 0,
    overstock: 1000
  };

  /**
   * Subscribe to real-time stock updates
   */
  static subscribe(
    subscriptionId: string,
    options: StockSubscriptionOptions,
    callback: StockUpdateCallback
  ): () => void {
    // Store callback
    if (!this.callbacks.has(subscriptionId)) {
      this.callbacks.set(subscriptionId, []);
    }
    this.callbacks.get(subscriptionId)!.push(callback);

    // Create or get existing channel
    if (!this.channels.has(subscriptionId)) {
      this.createChannel(subscriptionId, options);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionId, callback);
  }

  /**
   * Create a real-time channel for stock updates
   */
  private static createChannel(subscriptionId: string, options: StockSubscriptionOptions) {
    const channel = supabase.channel(`stock-updates-${subscriptionId}`);

    // Subscribe to stock movements
    if (options.includeMovements !== false) {
      let movementFilter = 'stock_movements:*';
      if (options.warehouseId) {
        movementFilter = `stock_movements:warehouse_id=eq.${options.warehouseId}`;
      }

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements',
          filter: options.warehouseId ? `warehouse_id=eq.${options.warehouseId}` : undefined
        },
        (payload) => {
          this.handleMovementChange(subscriptionId, payload);
        }
      );
    }

    // Subscribe to serial number updates
    if (options.includeSerialNumbers !== false) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_serial_numbers',
          filter: options.warehouseId ? `warehouse_id=eq.${options.warehouseId}` : undefined
        },
        (payload) => {
          this.handleSerialNumberChange(subscriptionId, payload);
        }
      );
    }

    // Subscribe to stock level changes (via view updates)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stock_summary_view'
      },
      (payload) => {
        this.handleStockLevelChange(subscriptionId, payload);
      }
    );

    // Subscribe to receive logs
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'receive_logs'
      },
      (payload) => {
        this.handleReceiveLogChange(subscriptionId, payload);
      }
    );

    // Subscribe to transfers
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stock_transfers'
      },
      (payload) => {
        this.handleTransferChange(subscriptionId, payload);
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Real-time stock monitoring active for ${subscriptionId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Real-time stock monitoring error for ${subscriptionId}`);
      }
    });

    this.channels.set(subscriptionId, channel);
  }

  /**
   * Handle stock movement changes
   */
  private static handleMovementChange(subscriptionId: string, payload: any) {
    const movement = payload.new as StockMovement;
    
    const event: StockUpdateEvent = {
      type: 'movement_logged',
      data: movement,
      timestamp: new Date(),
      warehouseId: movement.warehouseId,
      productId: movement.productId
    };

    this.notifyCallbacks(subscriptionId, event);

    // Trigger stock level recalculation
    this.triggerStockRecalculation(movement.warehouseId, movement.productId);
  }

  /**
   * Handle serial number changes
   */
  private static handleSerialNumberChange(subscriptionId: string, payload: any) {
    const serialNumber = payload.new as SerialNumber;
    
    const event: StockUpdateEvent = {
      type: 'serial_number_updated',
      data: serialNumber,
      timestamp: new Date(),
      warehouseId: serialNumber.warehouseId,
      productId: serialNumber.productId
    };

    this.notifyCallbacks(subscriptionId, event);

    // Check for stock alerts
    this.checkStockAlerts(serialNumber.warehouseId, serialNumber.productId);
  }

  /**
   * Handle stock level changes
   */
  private static handleStockLevelChange(subscriptionId: string, payload: any) {
    const stockLevel = payload.new;
    
    const event: StockUpdateEvent = {
      type: 'stock_level_changed',
      data: stockLevel,
      timestamp: new Date(),
      warehouseId: stockLevel.warehouse_id,
      productId: stockLevel.product_id
    };

    this.notifyCallbacks(subscriptionId, event);

    // Check for alerts
    this.checkStockAlerts(stockLevel.warehouse_id, stockLevel.product_id);
  }

  /**
   * Handle receive log changes
   */
  private static handleReceiveLogChange(subscriptionId: string, payload: any) {
    const receiveLog = payload.new;
    
    const event: StockUpdateEvent = {
      type: 'movement_logged',
      data: {
        type: 'receive',
        warehouseId: receiveLog.warehouse_id,
        reference: receiveLog.receive_number,
        notes: `Goods received: ${receiveLog.total_items} items`
      },
      timestamp: new Date(),
      warehouseId: receiveLog.warehouse_id
    };

    this.notifyCallbacks(subscriptionId, event);
  }

  /**
   * Handle transfer changes
   */
  private static handleTransferChange(subscriptionId: string, payload: any) {
    const transfer = payload.new;
    
    const event: StockUpdateEvent = {
      type: 'movement_logged',
      data: {
        type: 'transfer',
        sourceWarehouseId: transfer.source_warehouse_id,
        targetWarehouseId: transfer.target_warehouse_id,
        status: transfer.status,
        reference: transfer.transfer_number
      },
      timestamp: new Date(),
      warehouseId: transfer.source_warehouse_id
    };

    this.notifyCallbacks(subscriptionId, event);
  }

  /**
   * Trigger stock level recalculation
   */
  private static async triggerStockRecalculation(warehouseId: string, productId: string) {
    try {
      // This would typically call a database function or trigger a recalculation
      // For now, we'll emit an event to notify subscribers
      const event: StockUpdateEvent = {
        type: 'stock_level_changed',
        data: {
          warehouseId,
          productId,
          recalculated: true
        },
        timestamp: new Date(),
        warehouseId,
        productId
      };

      // Notify all active subscriptions
      this.channels.forEach((channel, subscriptionId) => {
        this.notifyCallbacks(subscriptionId, event);
      });
    } catch (error) {
      console.error('Failed to trigger stock recalculation:', error);
    }
  }

  /**
   * Check for stock alerts
   */
  private static async checkStockAlerts(warehouseId: string, productId: string) {
    try {
      // Get current stock level
      const { data: stockData, error } = await supabase
        .from('stock_summary_view')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .eq('product_id', productId)
        .single();

      if (error || !stockData) return;

      const alerts: StockAlert[] = [];

      // Check for out of stock
      if (stockData.available_quantity <= this.alertThresholds.outOfStock) {
        alerts.push({
          id: `out-of-stock-${productId}-${warehouseId}-${Date.now()}`,
          type: 'out_of_stock',
          severity: 'critical',
          productId,
          productName: stockData.product_name,
          warehouseId,
          warehouseName: stockData.warehouse_name,
          currentStock: stockData.available_quantity,
          message: `${stockData.product_name} is out of stock in ${stockData.warehouse_name}`,
          recommendedAction: 'Urgent: Reorder or transfer stock immediately',
          isRead: false,
          isResolved: false,
          createdAt: new Date()
        });
      }
      // Check for low stock
      else if (stockData.available_quantity <= this.alertThresholds.lowStock) {
        alerts.push({
          id: `low-stock-${productId}-${warehouseId}-${Date.now()}`,
          type: 'low_stock',
          severity: 'warning',
          productId,
          productName: stockData.product_name,
          warehouseId,
          warehouseName: stockData.warehouse_name,
          currentStock: stockData.available_quantity,
          threshold: this.alertThresholds.lowStock,
          message: `${stockData.product_name} is running low in ${stockData.warehouse_name}`,
          recommendedAction: 'Consider reordering or transferring stock',
          isRead: false,
          isResolved: false,
          createdAt: new Date()
        });
      }

      // Emit alert events
      alerts.forEach(alert => {
        const event: StockUpdateEvent = {
          type: 'alert_triggered',
          data: alert,
          timestamp: new Date(),
          warehouseId,
          productId
        };

        // Notify all active subscriptions
        this.channels.forEach((channel, subscriptionId) => {
          this.notifyCallbacks(subscriptionId, event);
        });
      });

    } catch (error) {
      console.error('Failed to check stock alerts:', error);
    }
  }

  /**
   * Notify all callbacks for a subscription
   */
  private static notifyCallbacks(subscriptionId: string, event: StockUpdateEvent) {
    const callbacks = this.callbacks.get(subscriptionId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in stock update callback:', error);
        }
      });
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  static unsubscribe(subscriptionId: string, callback?: StockUpdateCallback): void {
    if (callback) {
      // Remove specific callback
      const callbacks = this.callbacks.get(subscriptionId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // If no more callbacks, remove the channel
        if (callbacks.length === 0) {
          this.removeChannel(subscriptionId);
        }
      }
    } else {
      // Remove entire subscription
      this.removeChannel(subscriptionId);
    }
  }

  /**
   * Remove a channel and clean up
   */
  private static removeChannel(subscriptionId: string) {
    const channel = this.channels.get(subscriptionId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(subscriptionId);
    }
    this.callbacks.delete(subscriptionId);
  }

  /**
   * Update alert thresholds
   */
  static updateAlertThresholds(thresholds: Partial<typeof RealTimeStockService.alertThresholds>) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get current alert thresholds
   */
  static getAlertThresholds() {
    return { ...this.alertThresholds };
  }

  /**
   * Process stock transaction and emit real-time updates
   */
  static async processStockTransaction(transaction: StockTransaction): Promise<void> {
    try {
      // This would be called after a stock transaction is completed
      // to ensure real-time updates are sent to all subscribers
      
      const event: StockUpdateEvent = {
        type: 'movement_logged',
        data: {
          type: transaction.type,
          warehouseId: transaction.warehouseId,
          items: transaction.items,
          reference: transaction.reference,
          notes: transaction.notes
        },
        timestamp: new Date(),
        warehouseId: transaction.warehouseId
      };

      // Notify all active subscriptions
      this.channels.forEach((channel, subscriptionId) => {
        this.notifyCallbacks(subscriptionId, event);
      });

      // Trigger recalculation for affected products
      for (const item of transaction.items) {
        await this.triggerStockRecalculation(transaction.warehouseId, item.productId);
        await this.checkStockAlerts(transaction.warehouseId, item.productId);
      }

    } catch (error) {
      console.error('Failed to process stock transaction for real-time updates:', error);
    }
  }

  /**
   * Get connection status for all channels
   */
  static getConnectionStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    this.channels.forEach((channel, subscriptionId) => {
      status[subscriptionId] = channel.state;
    });
    return status;
  }

  /**
   * Cleanup all subscriptions
   */
  static cleanup(): void {
    this.channels.forEach((channel, subscriptionId) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.callbacks.clear();
  }
}