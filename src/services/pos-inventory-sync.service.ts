import { supabase } from '../lib/supabase';
import { 
  StockAlert, 
  AutoPurchaseOrder, 
  InventorySyncResult, 
  InventorySyncError,
  InventorySyncSummary,
  POSIntegrationConfig,
  SupplierProductMapping,
  IntegrationHealthCheck
} from '../types/pos';
import { 
  InventorySyncError as InventorySyncErrorClass,
  StockAlertProcessingError,
  InventoryDataInconsistencyError,
  POSSystemUnavailableError
} from '../errors/pos';
import { ErrorHandlerService } from './error-handler.service';

export interface InventoryUpdateRequest {
  productId: string;
  productCode: string;
  currentStock: number;
  reservedStock?: number;
  lastSaleDate?: string;
  averageDailySales?: number;
  location?: string;
  source: 'pos' | 'manual' | 'delivery' | 'adjustment';
  timestamp: string;
}

export interface StockAlertGenerationParams {
  productId?: string;
  branchId?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  forceRecalculation?: boolean;
}

export interface ConflictResolutionStrategy {
  strategy: 'pos_wins' | 'supplier_wins' | 'manual_review' | 'latest_timestamp';
  manualReviewRequired?: boolean;
  conflictDetails?: {
    posValue: any;
    supplierValue: any;
    timestamp: string;
  };
}

/**
 * Advanced POS Integration Service for inventory synchronization
 * Handles real-time sync, stock alerts, and conflict resolution
 */
export class POSInventorySyncService {
  private errorHandler: ErrorHandlerService;
  private syncInProgress: Map<string, boolean> = new Map();
  private lastSyncTimestamp: Map<string, string> = new Map();

  constructor() {
    this.errorHandler = new ErrorHandlerService();
  }

  /**
   * Perform real-time inventory synchronization
   */
  async syncInventoryLevels(integrationId?: string): Promise<InventorySyncResult> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = new Date().toISOString();

    try {
      // Prevent concurrent syncs for the same integration
      if (integrationId && this.syncInProgress.get(integrationId)) {
        throw new InventorySyncErrorClass(
          'Sync already in progress for this integration',
          'full',
          false,
          { integrationId }
        );
      }

      if (integrationId) {
        this.syncInProgress.set(integrationId, true);
      }

      // Get integration configuration
      const config = integrationId ? await this.getIntegrationConfig(integrationId) : null;
      
      // Get current inventory data from POS system
      const posInventoryData = await this.fetchPOSInventoryData(config);
      
      // Get current system inventory data
      const systemInventoryData = await this.fetchSystemInventoryData();
      
      // Compare and identify discrepancies
      const discrepancies = await this.identifyInventoryDiscrepancies(
        posInventoryData,
        systemInventoryData
      );

      // Resolve conflicts based on configuration
      const resolutionResults = await this.resolveInventoryConflicts(
        discrepancies,
        config?.syncSettings.conflictResolution || 'latest_timestamp'
      );

      // Update system inventory
      const updateResults = await this.updateSystemInventory(resolutionResults);

      // Generate stock alerts for low inventory
      const stockAlerts = await this.generateStockAlerts({
        forceRecalculation: true
      });

      // Create automatic purchase orders if enabled
      const purchaseOrders = config?.syncSettings.autoCreatePurchaseOrders 
        ? await this.createAutomaticPurchaseOrders(stockAlerts)
        : [];

      const completedAt = new Date().toISOString();
      
      // Update last sync timestamp
      if (integrationId) {
        this.lastSyncTimestamp.set(integrationId, completedAt);
      }

      const result: InventorySyncResult = {
        id: syncId,
        integrationId: integrationId || 'manual',
        syncType: 'full',
        status: updateResults.errors.length === 0 ? 'success' : 'partial',
        startedAt,
        completedAt,
        productsProcessed: updateResults.processed,
        productsUpdated: updateResults.updated,
        stockAlertsGenerated: stockAlerts.length,
        purchaseOrdersCreated: purchaseOrders.length,
        errors: updateResults.errors,
        summary: await this.generateSyncSummary(updateResults)
      };

      // Log sync result
      await this.logSyncResult(result);

      return result;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'inventory_sync');
      
      const result: InventorySyncResult = {
        id: syncId,
        integrationId: integrationId || 'manual',
        syncType: 'full',
        status: 'failed',
        startedAt,
        productsProcessed: 0,
        productsUpdated: 0,
        stockAlertsGenerated: 0,
        purchaseOrdersCreated: 0,
        errors: [{
          productId: 'unknown',
          errorType: 'api_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown sync error'
        }],
        summary: {
          totalProducts: 0,
          stockUpdated: 0,
          lowStockDetected: 0,
          outOfStockDetected: 0,
          newProductsAdded: 0,
          discontinuedProducts: 0,
          averageStockLevel: 0,
          totalInventoryValue: 0
        }
      };

      await this.logSyncResult(result);
      return result;

    } finally {
      if (integrationId) {
        this.syncInProgress.delete(integrationId);
      }
    }
  }

  /**
   * Monitor inventory levels and generate alerts
   */
  async monitorInventoryLevels(): Promise<StockAlert[]> {
    try {
      const alerts: StockAlert[] = [];

      // Get all products with their current stock levels
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          code,
          minimum_stock,
          reorder_point,
          reorder_quantity,
          category,
          serial_numbers (
            id,
            status,
            branch_id,
            warehouses (
              id,
              name,
              location
            )
          )
        `);

      if (error) {
        throw new Error(`Failed to fetch products for monitoring: ${error.message}`);
      }

      for (const product of products || []) {
        const serialNumbers = product.serial_numbers || [];
        const availableStock = serialNumbers.filter((sn: any) => sn.status === 'available').length;
        const reorderPoint = product.reorder_point || product.minimum_stock || 10;

        if (availableStock <= reorderPoint) {
          // Calculate urgency level
          let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (availableStock === 0) {
            urgencyLevel = 'critical';
          } else if (availableStock <= reorderPoint * 0.3) {
            urgencyLevel = 'high';
          } else if (availableStock <= reorderPoint * 0.7) {
            urgencyLevel = 'medium';
          } else {
            urgencyLevel = 'low';
          }

          // Get preferred supplier
          const preferredSupplier = await this.getPreferredSupplier(product.id);

          // Calculate days of stock remaining
          const averageDailySales = await this.calculateAverageDailySales(product.id);
          const daysOfStockRemaining = averageDailySales > 0 ? Math.floor(availableStock / averageDailySales) : 999;

          const alert: StockAlert = {
            id: `alert_${product.id}_${Date.now()}`,
            productId: product.id,
            productName: product.name,
            productCode: product.product_code,
            currentStock: availableStock,
            minimumStock: product.minimum_stock || 0,
            reorderPoint,
            reorderQuantity: product.reorder_quantity || reorderPoint * 2,
            preferredSupplierId: preferredSupplier?.supplierId,
            preferredSupplier: preferredSupplier ? {
              id: preferredSupplier.supplierId,
              name: preferredSupplier.supplierName,
              contactInfo: preferredSupplier.supplierName // TODO: Get actual contact info
            } : undefined,
            urgencyLevel,
            category: product.category || 'General',
            location: serialNumbers[0]?.warehouses?.location || 'Unknown',
            averageDailySales,
            daysOfStockRemaining,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          alerts.push(alert);
        }
      }

      // Save alerts to database
      if (alerts.length > 0) {
        await this.saveStockAlerts(alerts);
      }

      return alerts;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'inventory_monitoring');
      throw new StockAlertProcessingError(
        `Failed to monitor inventory levels: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'monitoring'
      );
    }
  }

  /**
   * Generate stock alerts based on parameters
   */
  async generateStockAlerts(params: StockAlertGenerationParams = {}): Promise<StockAlert[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          code,
          minimum_stock,
          reorder_point,
          reorder_quantity,
          category,
          serial_numbers!inner (
            id,
            status,
            branch_id,
            warehouses (
              id,
              name,
              location
            )
          )
        `);

      if (params.productId) {
        query = query.eq('id', params.productId);
      }

      const { data: products, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch products for alert generation: ${error.message}`);
      }

      const alerts: StockAlert[] = [];

      for (const product of products || []) {
        const serialNumbers = product.serial_numbers || [];
        
        // Filter by warehouse if specified
        const relevantSerialNumbers = params.branchId 
          ? serialNumbers.filter((sn: any) => sn.branch_id === params.branchId)
          : serialNumbers;

        const availableStock = relevantSerialNumbers.filter((sn: any) => sn.status === 'available').length;
        const reorderPoint = product.reorder_point || product.minimum_stock || 10;

        // Check if alert is needed
        const needsAlert = availableStock <= reorderPoint;
        
        // Apply urgency level filter if specified
        if (params.urgencyLevel && needsAlert) {
          let calculatedUrgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          
          if (availableStock === 0) {
            calculatedUrgency = 'critical';
          } else if (availableStock <= reorderPoint * 0.3) {
            calculatedUrgency = 'high';
          } else if (availableStock <= reorderPoint * 0.7) {
            calculatedUrgency = 'medium';
          } else {
            calculatedUrgency = 'low';
          }

          if (calculatedUrgency !== params.urgencyLevel) {
            continue;
          }
        }

        if (needsAlert || params.forceRecalculation) {
          const alert = await this.createStockAlert(product, availableStock, reorderPoint);
          alerts.push(alert);
        }
      }

      return alerts;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'stock_alert_generation');
      throw new StockAlertProcessingError(
        `Failed to generate stock alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'generation'
      );
    }
  }

  /**
   * Process stock alerts and create purchase orders
   */
  async processStockAlerts(alertIds: string[]): Promise<AutoPurchaseOrder[]> {
    try {
      const purchaseOrders: AutoPurchaseOrder[] = [];

      // Get alerts from database
      const { data: alerts, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .in('id', alertIds)
        .eq('status', 'pending');

      if (error) {
        throw new Error(`Failed to fetch stock alerts: ${error.message}`);
      }

      // Group alerts by preferred supplier
      const alertsBySupplier = new Map<string, any[]>();
      
      for (const alert of alerts || []) {
        const supplierId = alert.preferred_supplier_id || 'no_supplier';
        if (!alertsBySupplier.has(supplierId)) {
          alertsBySupplier.set(supplierId, []);
        }
        alertsBySupplier.get(supplierId)!.push(alert);
      }

      // Create purchase orders for each supplier
      for (const [supplierId, supplierAlerts] of alertsBySupplier) {
        if (supplierId === 'no_supplier') {
          // Mark alerts as requiring manual review
          await this.markAlertsForManualReview(supplierAlerts.map(a => a.id));
          continue;
        }

        const purchaseOrder = await this.createAutomaticPurchaseOrderForSupplier(
          supplierId,
          supplierAlerts
        );
        
        if (purchaseOrder) {
          purchaseOrders.push(purchaseOrder);
          
          // Update alert status
          await supabase
            .from('stock_alerts')
            .update({ 
              status: 'processing',
              processed_at: new Date().toISOString(),
              processed_by: 'system'
            })
            .in('id', supplierAlerts.map(a => a.id));
        }
      }

      return purchaseOrders;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'stock_alert_processing');
      throw new StockAlertProcessingError(
        `Failed to process stock alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'processing'
      );
    }
  }

  /**
   * Update inventory from delivery receipts
   */
  async updateInventoryFromDelivery(deliveryData: {
    deliveryId: string;
    supplierId: string;
    items: {
      productId: string;
      productCode: string;
      quantityReceived: number;
      serialNumbers?: string[];
      unitCost?: number;
    }[];
    receivedAt: string;
    receivedBy: string;
    branchId: string;
  }): Promise<{ success: boolean; updatedProducts: string[]; errors: string[] }> {
    try {
      const updatedProducts: string[] = [];
      const errors: string[] = [];

      for (const item of deliveryData.items) {
        try {
          // Update product stock levels
          const updateResult = await this.updateProductStock({
            productId: item.productId,
            productCode: item.productCode,
            currentStock: item.quantityReceived, // This will be added to existing stock
            source: 'delivery',
            timestamp: deliveryData.receivedAt
          });

          if (updateResult.success) {
            updatedProducts.push(item.productId);
            
            // Update any related stock alerts
            await this.updateStockAlertsAfterDelivery(item.productId, item.quantityReceived);
          } else {
            errors.push(`Failed to update stock for product ${item.productCode}: ${updateResult.error}`);
          }

        } catch (itemError) {
          errors.push(`Error processing item ${item.productCode}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
        }
      }

      // Log delivery processing
      await this.logDeliveryProcessing(deliveryData, updatedProducts, errors);

      return {
        success: errors.length === 0,
        updatedProducts,
        errors
      };

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'delivery_inventory_update');
      throw new Error(`Failed to update inventory from delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve sync conflicts using specified strategy
   */
  async resolveSyncConflicts(
    conflicts: Array<{
      productId: string;
      productCode: string;
      posValue: number;
      systemValue: number;
      lastUpdated: string;
    }>,
    strategy: ConflictResolutionStrategy['strategy'] = 'latest_timestamp'
  ): Promise<{ resolved: number; manualReviewRequired: number; errors: string[] }> {
    try {
      let resolved = 0;
      let manualReviewRequired = 0;
      const errors: string[] = [];

      for (const conflict of conflicts) {
        try {
          let resolvedValue: number;
          let requiresManualReview = false;

          switch (strategy) {
            case 'pos_wins':
              resolvedValue = conflict.posValue;
              break;
              
            case 'supplier_wins':
              resolvedValue = conflict.systemValue;
              break;
              
            case 'latest_timestamp':
              // For now, default to POS value as it's more recent
              resolvedValue = conflict.posValue;
              break;
              
            case 'manual_review':
              requiresManualReview = true;
              resolvedValue = conflict.systemValue; // Keep current value
              break;
              
            default:
              requiresManualReview = true;
              resolvedValue = conflict.systemValue;
          }

          if (requiresManualReview) {
            await this.createConflictForManualReview(conflict);
            manualReviewRequired++;
          } else {
            // Update system with resolved value
            const updateResult = await this.updateProductStock({
              productId: conflict.productId,
              productCode: conflict.productCode,
              currentStock: resolvedValue,
              source: 'manual',
              timestamp: new Date().toISOString()
            });

            if (updateResult.success) {
              resolved++;
            } else {
              errors.push(`Failed to resolve conflict for ${conflict.productCode}: ${updateResult.error}`);
            }
          }

        } catch (conflictError) {
          errors.push(`Error resolving conflict for ${conflict.productCode}: ${conflictError instanceof Error ? conflictError.message : 'Unknown error'}`);
        }
      }

      return { resolved, manualReviewRequired, errors };

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'conflict_resolution');
      throw new Error(`Failed to resolve sync conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async getIntegrationConfig(integrationId: string): Promise<POSIntegrationConfig | null> {
    const { data, error } = await supabase
      .from('pos_integration_configs')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      throw new Error(`Failed to get integration config: ${error.message}`);
    }

    return data;
  }

  private async fetchPOSInventoryData(config: POSIntegrationConfig | null): Promise<any[]> {
    // Mock implementation - in real scenario, this would call external POS API
    // For now, return empty array to simulate no external data
    return [];
  }

  private async fetchSystemInventoryData(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        code,
        name,
        serial_numbers (
            id,
            status,
            warehouse_id
          )
      `);

    if (error) {
      throw new Error(`Failed to fetch system inventory: ${error.message}`);
    }

    return data || [];
  }

  private async identifyInventoryDiscrepancies(posData: any[], systemData: any[]): Promise<any[]> {
    const discrepancies: any[] = [];
    
    // For now, return empty array as we don't have real POS data
    // In real implementation, this would compare posData with systemData
    
    return discrepancies;
  }

  private async resolveInventoryConflicts(discrepancies: any[], strategy: string): Promise<any> {
    return {
      processed: 0,
      updated: 0,
      errors: []
    };
  }

  private async updateSystemInventory(resolutionResults: any): Promise<{
    processed: number;
    updated: number;
    errors: InventorySyncError[];
  }> {
    return {
      processed: 0,
      updated: 0,
      errors: []
    };
  }

  private async createAutomaticPurchaseOrders(stockAlerts: StockAlert[]): Promise<AutoPurchaseOrder[]> {
    const purchaseOrders: AutoPurchaseOrder[] = [];
    
    // Group alerts by supplier
    const alertsBySupplier = new Map<string, StockAlert[]>();
    
    for (const alert of stockAlerts) {
      if (alert.preferredSupplierId) {
        if (!alertsBySupplier.has(alert.preferredSupplierId)) {
          alertsBySupplier.set(alert.preferredSupplierId, []);
        }
        alertsBySupplier.get(alert.preferredSupplierId)!.push(alert);
      }
    }

    // Create purchase orders for each supplier
    for (const [supplierId, alerts] of alertsBySupplier) {
      const purchaseOrder = await this.createAutomaticPurchaseOrderForSupplier(supplierId, alerts);
      if (purchaseOrder) {
        purchaseOrders.push(purchaseOrder);
      }
    }

    return purchaseOrders;
  }

  private async generateSyncSummary(updateResults: any): Promise<InventorySyncSummary> {
    // Get current inventory statistics
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        serial_numbers (
          id,
          status
        )
      `);

    if (error) {
      throw new Error(`Failed to generate sync summary: ${error.message}`);
    }

    const totalProducts = products?.length || 0;
    let totalAvailableStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products || []) {
      const availableStock = product.serial_numbers?.filter((sn: any) => sn.status === 'available').length || 0;
      totalAvailableStock += availableStock;
      
      if (availableStock === 0) {
        outOfStockCount++;
      } else if (availableStock <= 10) { // Assuming 10 as low stock threshold
        lowStockCount++;
      }
    }

    return {
      totalProducts,
      stockUpdated: updateResults.updated,
      lowStockDetected: lowStockCount,
      outOfStockDetected: outOfStockCount,
      newProductsAdded: 0, // TODO: Track new products
      discontinuedProducts: 0, // TODO: Track discontinued products
      averageStockLevel: totalProducts > 0 ? totalAvailableStock / totalProducts : 0,
      totalInventoryValue: 0 // TODO: Calculate based on product costs
    };
  }

  private async logSyncResult(result: InventorySyncResult): Promise<void> {
    const { error } = await supabase
      .from('integration_sync_log')
      .insert({
        integration_type: 'pos',
        sync_type: result.syncType,
        status: result.status,
        records_processed: result.productsProcessed,
        errors_count: result.errors.length,
        error_details: result.errors.length > 0 ? result.errors : null,
        started_at: result.startedAt,
        completed_at: result.completedAt
      });

    if (error) {
      console.error('Failed to log sync result:', error);
    }
  }

  private async getPreferredSupplier(productId: string): Promise<SupplierProductMapping | null> {
    const { data, error } = await supabase
      .from('supplier_product_mappings')
      .select('*')
      .eq('product_id', productId)
      .eq('is_preferred', true)
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Failed to get preferred supplier:', error);
    }

    return data;
  }

  private async calculateAverageDailySales(productId: string): Promise<number> {
    // Mock calculation - in real scenario, this would analyze sales history
    return Math.random() * 5; // Random value between 0-5 for demo
  }

  private async createStockAlert(product: any, availableStock: number, reorderPoint: number): Promise<StockAlert> {
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (availableStock === 0) {
      urgencyLevel = 'critical';
    } else if (availableStock <= reorderPoint * 0.3) {
      urgencyLevel = 'high';
    } else if (availableStock <= reorderPoint * 0.7) {
      urgencyLevel = 'medium';
    } else {
      urgencyLevel = 'low';
    }

    const preferredSupplier = await this.getPreferredSupplier(product.id);
    const averageDailySales = await this.calculateAverageDailySales(product.id);
    const daysOfStockRemaining = averageDailySales > 0 ? Math.floor(availableStock / averageDailySales) : 999;

    return {
      id: `alert_${product.id}_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: product.product_code,
      currentStock: availableStock,
      minimumStock: product.minimum_stock || 0,
      reorderPoint,
      reorderQuantity: product.reorder_quantity || reorderPoint * 2,
      preferredSupplierId: preferredSupplier?.supplierId,
      preferredSupplier: preferredSupplier ? {
        id: preferredSupplier.supplierId,
        name: preferredSupplier.supplierName,
        contactInfo: preferredSupplier.supplierName
      } : undefined,
      urgencyLevel,
      category: product.category || 'General',
      location: 'Main Warehouse', // TODO: Get actual location
      averageDailySales,
      daysOfStockRemaining,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async saveStockAlerts(alerts: StockAlert[]): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .insert(alerts.map(alert => ({
        id: alert.id,
        product_id: alert.productId,
        product_name: alert.productName,
        product_code: alert.productCode,
        current_stock: alert.currentStock,
        minimum_stock: alert.minimumStock,
        reorder_point: alert.reorderPoint,
        reorder_quantity: alert.reorderQuantity,
        preferred_supplier_id: alert.preferredSupplierId,
        urgency_level: alert.urgencyLevel,
        category: alert.category,
        location: alert.location,
        average_daily_sales: alert.averageDailySales,
        days_of_stock_remaining: alert.daysOfStockRemaining,
        status: alert.status,
        created_at: alert.createdAt,
        updated_at: alert.updatedAt
      })));

    if (error) {
      throw new Error(`Failed to save stock alerts: ${error.message}`);
    }
  }

  private async createAutomaticPurchaseOrderForSupplier(
    supplierId: string,
    alerts: any[]
  ): Promise<AutoPurchaseOrder | null> {
    try {
      // Get supplier information
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, contact_person, email, phone')
        .eq('id', supplierId)
        .single();

      if (supplierError) {
        throw new Error(`Failed to get supplier info: ${supplierError.message}`);
      }

      // Create purchase order items
      const items = alerts.map(alert => ({
        id: `item_${alert.id}`,
        orderId: '', // Will be set after order creation
        productId: alert.product_id,
        productName: alert.product_name,
        productCode: alert.product_code,
        quantity: alert.reorder_quantity,
        unitCost: 0, // TODO: Get from supplier product mapping
        totalCost: 0,
        receivedQuantity: 0,
        remainingQuantity: alert.reorder_quantity,
        stockAlertId: alert.id,
        leadTimeDays: 7, // Default lead time
        notes: `Auto-generated from stock alert - Current stock: ${alert.current_stock}`
      }));

      const orderNumber = `APO-${Date.now()}`;
      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

      const purchaseOrder: AutoPurchaseOrder = {
        id: `apo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderNumber,
        supplierId,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          contactPerson: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone
        },
        items,
        subtotal: totalAmount,
        taxAmount: totalAmount * 0.07, // 7% tax
        totalAmount: totalAmount * 1.07,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'draft',
        automationReason: `Auto-generated from ${alerts.length} stock alert(s)`,
        triggerType: 'low_stock',
        stockAlertIds: alerts.map(a => a.id),
        approvalRequired: totalAmount > 10000, // Require approval for orders over 10,000
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update item order IDs
      purchaseOrder.items.forEach(item => {
        item.orderId = purchaseOrder.id;
      });

      // Save to database
      const { error } = await supabase
        .from('auto_purchase_orders')
        .insert({
          id: purchaseOrder.id,
          order_number: purchaseOrder.orderNumber,
          supplier_id: purchaseOrder.supplierId,
          subtotal: purchaseOrder.subtotal,
          tax_amount: purchaseOrder.taxAmount,
          total_amount: purchaseOrder.totalAmount,
          expected_delivery_date: purchaseOrder.expectedDeliveryDate,
          status: purchaseOrder.status,
          automation_reason: purchaseOrder.automationReason,
          trigger_type: purchaseOrder.triggerType,
          stock_alert_ids: purchaseOrder.stockAlertIds,
          approval_required: purchaseOrder.approvalRequired,
          created_at: purchaseOrder.createdAt,
          updated_at: purchaseOrder.updatedAt
        });

      if (error) {
        throw new Error(`Failed to save purchase order: ${error.message}`);
      }

      return purchaseOrder;

    } catch (error) {
      console.error('Failed to create automatic purchase order:', error);
      return null;
    }
  }

  private async markAlertsForManualReview(alertIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('stock_alerts')
      .update({ 
        status: 'manual_review_required',
        notes: 'No preferred supplier found - requires manual review',
        updated_at: new Date().toISOString()
      })
      .in('id', alertIds);

    if (error) {
      console.error('Failed to mark alerts for manual review:', error);
    }
  }

  private async updateProductStock(request: InventoryUpdateRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // This is a simplified implementation
      // In a real scenario, this would update the actual stock levels
      
      // For now, just log the update
      console.log(`Stock update for product ${request.productCode}: ${request.currentStock} (source: ${request.source})`);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async updateStockAlertsAfterDelivery(productId: string, quantityReceived: number): Promise<void> {
    // Update any pending alerts for this product
    const { error } = await supabase
      .from('stock_alerts')
      .update({ 
        status: 'resolved',
        notes: `Resolved by delivery - ${quantityReceived} units received`,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('status', 'pending');

    if (error) {
      console.error('Failed to update stock alerts after delivery:', error);
    }
  }

  private async logDeliveryProcessing(
    deliveryData: any,
    updatedProducts: string[],
    errors: string[]
  ): Promise<void> {
    const { error } = await supabase
      .from('integration_sync_log')
      .insert({
        integration_type: 'delivery',
        sync_type: 'delivery_receipt',
        status: errors.length === 0 ? 'success' : 'partial',
        records_processed: deliveryData.items.length,
        errors_count: errors.length,
        error_details: errors.length > 0 ? errors : null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log delivery processing:', error);
    }
  }

  private async createConflictForManualReview(conflict: any): Promise<void> {
    // Create a record for manual review
    const { error } = await supabase
      .from('inventory_conflicts')
      .insert({
        product_id: conflict.productId,
        product_code: conflict.productCode,
        pos_value: conflict.posValue,
        system_value: conflict.systemValue,
        last_updated: conflict.lastUpdated,
        status: 'pending_review',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create conflict for manual review:', error);
    }
  }
}

export const posInventorySyncService = new POSInventorySyncService();