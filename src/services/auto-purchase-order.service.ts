import { supabase } from '../lib/supabase';
import { 
  AutoPurchaseOrder, 
  AutoPurchaseOrderItem,
  StockAlert,
  SupplierProductMapping
} from '../types/pos';
import { Supplier } from '../types/supplier';
import { 
  POSIntegrationError,
  StockAlertProcessingError
} from '../errors/pos';
import { ErrorHandlerService } from './error-handler.service';

export interface SupplierSelectionCriteria {
  costWeight: number; // 0-1
  qualityWeight: number; // 0-1
  reliabilityWeight: number; // 0-1
  leadTimeWeight: number; // 0-1
  preferredSupplierBonus: number; // 0-1
}

export interface ReorderCalculationParams {
  productId: string;
  currentStock: number;
  averageDailySales: number;
  leadTimeDays: number;
  safetyStockDays: number;
  seasonalityFactor?: number;
}

export interface PurchaseOrderApprovalRule {
  id: string;
  name: string;
  condition: 'total_amount' | 'supplier_risk' | 'product_category' | 'urgency_level';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: any;
  approverRoles: string[];
  isActive: boolean;
}

export interface PurchaseOrderWorkflowStatus {
  orderId: string;
  currentStatus: AutoPurchaseOrder['status'];
  approvalRequired: boolean;
  approvers: {
    userId: string;
    userName: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    comments?: string;
  }[];
  workflowSteps: {
    step: string;
    status: 'pending' | 'completed' | 'skipped';
    completedAt?: string;
    completedBy?: string;
  }[];
}

/**
 * Automatic Purchase Order Service
 * Handles PO generation, supplier selection, approval workflows, and status tracking
 */
export class AutoPurchaseOrderService {
  private errorHandler: ErrorHandlerService;
  private defaultSelectionCriteria: SupplierSelectionCriteria = {
    costWeight: 0.4,
    qualityWeight: 0.25,
    reliabilityWeight: 0.25,
    leadTimeWeight: 0.1,
    preferredSupplierBonus: 0.2
  };

  constructor() {
    this.errorHandler = new ErrorHandlerService();
  }

  /**
   * Create automatic purchase orders from stock alerts
   */
  async createAutomaticPurchaseOrders(stockAlerts: StockAlert[]): Promise<AutoPurchaseOrder[]> {
    try {
      const purchaseOrders: AutoPurchaseOrder[] = [];

      // Group alerts by preferred supplier or use supplier selection algorithm
      const alertsBySupplier = await this.groupAlertsByOptimalSupplier(stockAlerts);

      for (const [supplierId, alerts] of alertsBySupplier) {
        try {
          const purchaseOrder = await this.createPurchaseOrderForSupplier(supplierId, alerts);
          if (purchaseOrder) {
            purchaseOrders.push(purchaseOrder);
          }
        } catch (error) {
          await this.errorHandler.handleServiceError(
            error as Error, 
            `auto_purchase_order_creation_${supplierId}`
          );
          // Continue with other suppliers even if one fails
        }
      }

      return purchaseOrders;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'auto_purchase_order_batch_creation');
      throw new POSIntegrationError(
        `Failed to create automatic purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUTO_PO_CREATION_FAILED'
      );
    }
  }

  /**
   * Select optimal supplier for a product based on multiple criteria
   */
  async selectOptimalSupplier(
    productId: string, 
    criteria: Partial<SupplierSelectionCriteria> = {}
  ): Promise<SupplierProductMapping | null> {
    try {
      const selectionCriteria = { ...this.defaultSelectionCriteria, ...criteria };

      // Get all supplier mappings for the product
      const { data: mappings, error } = await supabase
        .from('supplier_product_mappings')
        .select(`
          *,
          suppliers (
            id,
            name,
            performance_rating,
            quality_rating,
            delivery_rating,
            cost_rating,
            risk_level,
            status
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .eq('suppliers.status', 'active');

      if (error) {
        throw new Error(`Failed to fetch supplier mappings: ${error.message}`);
      }

      if (!mappings || mappings.length === 0) {
        return null;
      }

      // Calculate scores for each supplier
      const scoredSuppliers = mappings.map(mapping => {
        const supplier = mapping.suppliers;
        
        // Normalize scores (assuming ratings are 1-5)
        const costScore = (6 - (mapping.unit_cost || 3)) / 5; // Lower cost = higher score
        const qualityScore = (supplier.quality_rating || 3) / 5;
        const reliabilityScore = (supplier.delivery_rating || 3) / 5;
        const leadTimeScore = (30 - (mapping.lead_time_days || 15)) / 30; // Shorter lead time = higher score
        const preferredBonus = mapping.is_preferred ? selectionCriteria.preferredSupplierBonus : 0;

        // Calculate weighted score
        const totalScore = 
          (costScore * selectionCriteria.costWeight) +
          (qualityScore * selectionCriteria.qualityWeight) +
          (reliabilityScore * selectionCriteria.reliabilityWeight) +
          (leadTimeScore * selectionCriteria.leadTimeWeight) +
          preferredBonus;

        return {
          mapping,
          score: totalScore,
          breakdown: {
            costScore,
            qualityScore,
            reliabilityScore,
            leadTimeScore,
            preferredBonus
          }
        };
      });

      // Sort by score (highest first) and return the best supplier
      scoredSuppliers.sort((a, b) => b.score - a.score);
      
      return scoredSuppliers[0]?.mapping || null;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'supplier_selection');
      throw new POSIntegrationError(
        `Failed to select optimal supplier: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SUPPLIER_SELECTION_FAILED'
      );
    }
  }

  /**
   * Calculate optimal reorder quantity based on various factors
   */
  async calculateReorderQuantity(params: ReorderCalculationParams): Promise<number> {
    try {
      const {
        currentStock,
        averageDailySales,
        leadTimeDays,
        safetyStockDays,
        seasonalityFactor = 1.0
      } = params;

      // Economic Order Quantity (EOQ) calculation
      // Simplified version - in real scenario, would include carrying costs and order costs
      const demandDuringLeadTime = averageDailySales * leadTimeDays * seasonalityFactor;
      const safetyStock = averageDailySales * safetyStockDays;
      const reorderPoint = demandDuringLeadTime + safetyStock;

      // Calculate optimal order quantity
      // Using a simplified approach: order enough to last for lead time + safety period + review period
      const reviewPeriodDays = 30; // Monthly review
      const optimalQuantity = Math.ceil(
        (averageDailySales * (leadTimeDays + safetyStockDays + reviewPeriodDays) * seasonalityFactor) - currentStock
      );

      // Ensure minimum order quantity
      const minimumOrderQuantity = Math.max(1, Math.ceil(averageDailySales * 7)); // At least 1 week of sales
      
      return Math.max(optimalQuantity, minimumOrderQuantity);

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'reorder_quantity_calculation');
      throw new Error(`Failed to calculate reorder quantity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if purchase order requires approval based on rules
   */
  async checkApprovalRequirement(purchaseOrder: Partial<AutoPurchaseOrder>): Promise<{
    requiresApproval: boolean;
    applicableRules: PurchaseOrderApprovalRule[];
    requiredApprovers: string[];
  }> {
    try {
      // Get approval rules
      const { data: rules, error } = await supabase
        .from('purchase_order_approval_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch approval rules: ${error.message}`);
      }

      const applicableRules: PurchaseOrderApprovalRule[] = [];
      const requiredApprovers = new Set<string>();

      for (const rule of rules || []) {
        let ruleApplies = false;

        switch (rule.condition) {
          case 'total_amount':
            if (rule.operator === 'greater_than' && (purchaseOrder.totalAmount || 0) > rule.value) {
              ruleApplies = true;
            } else if (rule.operator === 'less_than' && (purchaseOrder.totalAmount || 0) < rule.value) {
              ruleApplies = true;
            }
            break;

          case 'supplier_risk':
            // Would need to get supplier risk level
            break;

          case 'urgency_level':
            const hasHighUrgency = purchaseOrder.stockAlertIds?.some(alertId => 
              // Would need to check alert urgency levels
              false // Placeholder
            );
            if (rule.operator === 'equals' && hasHighUrgency === rule.value) {
              ruleApplies = true;
            }
            break;
        }

        if (ruleApplies) {
          applicableRules.push(rule);
          rule.approverRoles.forEach(role => requiredApprovers.add(role));
        }
      }

      return {
        requiresApproval: applicableRules.length > 0,
        applicableRules,
        requiredApprovers: Array.from(requiredApprovers)
      };

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'approval_requirement_check');
      // Default to requiring approval for safety
      return {
        requiresApproval: true,
        applicableRules: [],
        requiredApprovers: ['manager']
      };
    }
  }

  /**
   * Update purchase order status with workflow tracking
   */
  async updatePurchaseOrderStatus(
    orderId: string, 
    newStatus: AutoPurchaseOrder['status'],
    updatedBy: string,
    comments?: string
  ): Promise<PurchaseOrderWorkflowStatus> {
    try {
      // Update the purchase order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('auto_purchase_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'approved' && { approved_by: updatedBy, approved_at: new Date().toISOString() }),
          ...(newStatus === 'sent' && { sent_at: new Date().toISOString() }),
          ...(newStatus === 'confirmed' && { confirmed_at: new Date().toISOString() }),
          ...(newStatus === 'received' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update purchase order: ${updateError.message}`);
      }

      // Log workflow step
      await this.logWorkflowStep(orderId, newStatus, updatedBy, comments);

      // Get current workflow status
      const workflowStatus = await this.getPurchaseOrderWorkflowStatus(orderId);

      // Update related stock alerts if order is confirmed or received
      if (newStatus === 'confirmed' || newStatus === 'received') {
        await this.updateRelatedStockAlerts(orderId, newStatus);
      }

      return workflowStatus;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'purchase_order_status_update');
      throw new POSIntegrationError(
        `Failed to update purchase order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PO_STATUS_UPDATE_FAILED'
      );
    }
  }

  /**
   * Get purchase order workflow status
   */
  async getPurchaseOrderWorkflowStatus(orderId: string): Promise<PurchaseOrderWorkflowStatus> {
    try {
      // Get purchase order details
      const { data: order, error: orderError } = await supabase
        .from('auto_purchase_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Failed to fetch purchase order: ${orderError.message}`);
      }

      // Get workflow steps
      const { data: workflowSteps, error: stepsError } = await supabase
        .from('purchase_order_workflow_steps')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (stepsError) {
        throw new Error(`Failed to fetch workflow steps: ${stepsError.message}`);
      }

      // Get approval information if required
      const approvers = order.approval_required ? await this.getOrderApprovers(orderId) : [];

      const workflowStatus: PurchaseOrderWorkflowStatus = {
        orderId,
        currentStatus: order.status,
        approvalRequired: order.approval_required || false,
        approvers,
        workflowSteps: (workflowSteps || []).map(step => ({
          step: step.step_name,
          status: step.status,
          completedAt: step.completed_at,
          completedBy: step.completed_by
        }))
      };

      return workflowStatus;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'workflow_status_retrieval');
      throw new POSIntegrationError(
        `Failed to get workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'WORKFLOW_STATUS_FAILED'
      );
    }
  }

  /**
   * Get purchase orders by status with filtering
   */
  async getPurchaseOrdersByStatus(
    status?: AutoPurchaseOrder['status'],
    filters?: {
      supplierId?: string;
      dateFrom?: string;
      dateTo?: string;
      urgencyLevel?: string;
      approvalRequired?: boolean;
    }
  ): Promise<AutoPurchaseOrder[]> {
    try {
      let query = supabase
        .from('auto_purchase_orders')
        .select(`
          *,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone
          ),
          auto_purchase_order_items (
            *
          )
        `);

      if (status) {
        query = query.eq('status', status);
      }

      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.approvalRequired !== undefined) {
        query = query.eq('approval_required', filters.approvalRequired);
      }

      const { data: orders, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch purchase orders: ${error.message}`);
      }

      return (orders || []).map(order => this.mapDatabaseOrderToType(order));

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'purchase_orders_retrieval');
      throw new POSIntegrationError(
        `Failed to get purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PO_RETRIEVAL_FAILED'
      );
    }
  }

  // Private helper methods

  private async groupAlertsByOptimalSupplier(stockAlerts: StockAlert[]): Promise<Map<string, StockAlert[]>> {
    const alertsBySupplier = new Map<string, StockAlert[]>();

    for (const alert of stockAlerts) {
      let supplierId = alert.preferredSupplierId;

      // If no preferred supplier, use selection algorithm
      if (!supplierId) {
        const optimalSupplier = await this.selectOptimalSupplier(alert.productId);
        supplierId = optimalSupplier?.supplierId;
      }

      if (supplierId) {
        if (!alertsBySupplier.has(supplierId)) {
          alertsBySupplier.set(supplierId, []);
        }
        alertsBySupplier.get(supplierId)!.push(alert);
      }
    }

    return alertsBySupplier;
  }

  private async createPurchaseOrderForSupplier(
    supplierId: string,
    alerts: StockAlert[]
  ): Promise<AutoPurchaseOrder | null> {
    try {
      // Get supplier information
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (supplierError) {
        throw new Error(`Failed to get supplier: ${supplierError.message}`);
      }

      // Create purchase order items with optimized quantities
      const items: AutoPurchaseOrderItem[] = [];
      let subtotal = 0;

      for (const alert of alerts) {
        // Get supplier product mapping for pricing
        const mapping = await this.getSupplierProductMapping(supplierId, alert.productId);
        
        // Calculate optimal reorder quantity
        const reorderQuantity = await this.calculateReorderQuantity({
          productId: alert.productId,
          currentStock: alert.currentStock,
          averageDailySales: alert.averageDailySales,
          leadTimeDays: mapping?.leadTimeDays || 7,
          safetyStockDays: 3
        });

        const unitCost = mapping?.unitCost || 0;
        const totalCost = reorderQuantity * unitCost;

        const item: AutoPurchaseOrderItem = {
          id: `item_${alert.id}_${Date.now()}`,
          orderId: '', // Will be set after order creation
          productId: alert.productId,
          productName: alert.productName,
          productCode: alert.productCode,
          quantity: reorderQuantity,
          unitCost,
          totalCost,
          receivedQuantity: 0,
          remainingQuantity: reorderQuantity,
          stockAlertId: alert.id,
          supplierProductCode: mapping?.supplierProductCode,
          leadTimeDays: mapping?.leadTimeDays || 7,
          notes: `Auto-generated from stock alert - Current: ${alert.currentStock}, Reorder Point: ${alert.reorderPoint}`
        };

        items.push(item);
        subtotal += totalCost;
      }

      if (items.length === 0) {
        return null;
      }

      // Create purchase order
      const orderNumber = await this.generateOrderNumber();
      const taxAmount = subtotal * 0.07; // 7% tax
      const totalAmount = subtotal + taxAmount;

      const purchaseOrder: Partial<AutoPurchaseOrder> = {
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
        subtotal,
        taxAmount,
        totalAmount,
        expectedDeliveryDate: this.calculateExpectedDeliveryDate(
          Math.max(...items.map(item => item.leadTimeDays))
        ),
        status: 'draft',
        automationReason: `Auto-generated from ${alerts.length} stock alert(s)`,
        triggerType: 'low_stock',
        stockAlertIds: alerts.map(alert => alert.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check approval requirements
      const approvalCheck = await this.checkApprovalRequirement(purchaseOrder);
      purchaseOrder.approvalRequired = approvalCheck.requiresApproval;

      // Save to database
      const { data: savedOrder, error: saveError } = await supabase
        .from('auto_purchase_orders')
        .insert({
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
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save purchase order: ${saveError.message}`);
      }

      // Save purchase order items
      const itemsToSave = items.map(item => ({
        ...item,
        orderId: savedOrder.id,
        order_id: savedOrder.id
      }));

      const { error: itemsError } = await supabase
        .from('auto_purchase_order_items')
        .insert(itemsToSave);

      if (itemsError) {
        throw new Error(`Failed to save purchase order items: ${itemsError.message}`);
      }

      // Update stock alerts status
      await supabase
        .from('stock_alerts')
        .update({ 
          status: 'processing',
          processed_at: new Date().toISOString(),
          processed_by: 'auto_purchase_order_system'
        })
        .in('id', alerts.map(alert => alert.id));

      return {
        ...purchaseOrder,
        id: savedOrder.id,
        items: itemsToSave
      } as AutoPurchaseOrder;

    } catch (error) {
      await this.errorHandler.handleServiceError(error as Error, 'purchase_order_creation');
      throw new POSIntegrationError(
        `Failed to create purchase order for supplier ${supplierId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PO_CREATION_FAILED'
      );
    }
  }

  private async getSupplierProductMapping(
    supplierId: string, 
    productId: string
  ): Promise<SupplierProductMapping | null> {
    const { data, error } = await supabase
      .from('supplier_product_mappings')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get supplier product mapping:', error);
    }

    return data;
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `APO-${timestamp}-${random}`;
  }

  private calculateExpectedDeliveryDate(leadTimeDays: number): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + leadTimeDays);
    return deliveryDate.toISOString().split('T')[0];
  }

  private async logWorkflowStep(
    orderId: string,
    stepName: string,
    completedBy: string,
    comments?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('purchase_order_workflow_steps')
      .insert({
        order_id: orderId,
        step_name: stepName,
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        comments
      });

    if (error) {
      console.error('Failed to log workflow step:', error);
    }
  }

  private async getOrderApprovers(orderId: string): Promise<PurchaseOrderWorkflowStatus['approvers']> {
    // Mock implementation - in real scenario, would fetch from approvals table
    return [];
  }

  private async updateRelatedStockAlerts(
    orderId: string,
    status: AutoPurchaseOrder['status']
  ): Promise<void> {
    const alertStatus = status === 'received' ? 'resolved' : 'ordered';
    
    const { error } = await supabase
      .from('stock_alerts')
      .update({ status: alertStatus })
      .in('id', 
        supabase
          .from('auto_purchase_orders')
          .select('stock_alert_ids')
          .eq('id', orderId)
          .single()
          .then(result => result.data?.stock_alert_ids || [])
      );

    if (error) {
      console.error('Failed to update related stock alerts:', error);
    }
  }

  private mapDatabaseOrderToType(dbOrder: any): AutoPurchaseOrder {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      supplierId: dbOrder.supplier_id,
      supplier: dbOrder.suppliers ? {
        id: dbOrder.suppliers.id,
        name: dbOrder.suppliers.name,
        contactPerson: dbOrder.suppliers.contact_person,
        email: dbOrder.suppliers.email,
        phone: dbOrder.suppliers.phone
      } : {
        id: dbOrder.supplier_id,
        name: 'Unknown Supplier'
      },
      items: (dbOrder.auto_purchase_order_items || []).map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        productCode: item.product_code,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        totalCost: item.total_cost,
        receivedQuantity: item.received_quantity,
        remainingQuantity: item.remaining_quantity,
        stockAlertId: item.stock_alert_id,
        supplierProductCode: item.supplier_product_code,
        leadTimeDays: item.lead_time_days,
        notes: item.notes
      })),
      subtotal: dbOrder.subtotal,
      taxAmount: dbOrder.tax_amount,
      totalAmount: dbOrder.total_amount,
      expectedDeliveryDate: dbOrder.expected_delivery_date,
      status: dbOrder.status,
      automationReason: dbOrder.automation_reason,
      triggerType: dbOrder.trigger_type,
      stockAlertIds: dbOrder.stock_alert_ids || [],
      approvalRequired: dbOrder.approval_required,
      approvedBy: dbOrder.approved_by,
      approvedAt: dbOrder.approved_at,
      sentAt: dbOrder.sent_at,
      confirmedAt: dbOrder.confirmed_at,
      deliveredAt: dbOrder.delivered_at,
      notes: dbOrder.notes,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at
    };
  }
}