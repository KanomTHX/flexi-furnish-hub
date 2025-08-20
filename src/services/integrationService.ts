// Integration Service - เชื่อมต่อระบบต่างๆ เข้าด้วยกัน
import { supabase } from '@/integrations/supabase/client';
import { SupplierService } from './supplierService';
import { WarehouseService } from './warehouseService';
import type { 
  SupplierInvoice, 
  SupplierPayment, 
  CreateInvoiceData,
  CreatePaymentData 
} from '@/types/supplier';
import type { 
  StockMovement,
  ReceiveLog 
} from '@/types/warehouse';

// Journal Entry Types for Accounting Integration
export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  referenceType: 'supplier_invoice' | 'supplier_payment' | 'purchase_order' | 'stock_receive';
  referenceId: string;
  referenceNumber: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  lines: JournalEntryLine[];
  createdBy: string;
  createdAt: Date;
}

export interface JournalEntryLine {
  id: string;
  entryId: string;
  accountId: string;
  account?: {
    id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
  };
  description: string;
  debitAmount: number;
  creditAmount: number;
  createdAt: Date;
}

// Purchase Order Integration Types
export interface PurchaseOrderIntegration {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'pending' | 'approved' | 'received' | 'invoiced' | 'completed';
  totalAmount: number;
  receivedAmount: number;
  invoicedAmount: number;
  items: PurchaseOrderItemIntegration[];
}

export interface PurchaseOrderItemIntegration {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  receivedQuantity: number;
  invoicedQuantity: number;
}

export class IntegrationService {
  // ==================== ACCOUNTING INTEGRATION ====================
  
  /**
   * สร้าง Journal Entry สำหรับใบแจ้งหนี้ซัพพลายเออร์
   */
  static async createInvoiceJournalEntry(invoice: SupplierInvoice): Promise<JournalEntry> {
    try {
      // สร้าง Journal Entry Number
      const entryNumber = await this.generateJournalEntryNumber();
      
      // สร้าง Journal Entry
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: invoice.invoiceDate.toISOString().split('T')[0],
          description: `ใบแจ้งหนี้ซัพพลายเออร์ ${invoice.invoiceNumber}`,
          reference_type: 'supplier_invoice',
          reference_id: invoice.id,
          reference_number: invoice.invoiceNumber,
          total_debit: invoice.totalAmount,
          total_credit: invoice.totalAmount,
          status: 'posted',
          created_by: 'system'
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // สร้าง Journal Entry Lines
      const lines = [
        // Dr. Inventory/Expense Account
        {
          entry_id: entry.id,
          account_id: await this.getAccountId('INVENTORY'), // หรือ EXPENSE
          description: `สินค้าจากซัพพลายเออร์ ${invoice.supplier?.supplierName}`,
          debit_amount: invoice.subtotal,
          credit_amount: 0
        },
        // Dr. VAT Input (ถ้ามี)
        ...(invoice.taxAmount > 0 ? [{
          entry_id: entry.id,
          account_id: await this.getAccountId('VAT_INPUT'),
          description: 'ภาษีซื้อ',
          debit_amount: invoice.taxAmount,
          credit_amount: 0
        }] : []),
        // Cr. Accounts Payable
        {
          entry_id: entry.id,
          account_id: await this.getAccountId('ACCOUNTS_PAYABLE'),
          description: `เจ้าหนี้ ${invoice.supplier?.supplierName}`,
          debit_amount: 0,
          credit_amount: invoice.totalAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return {
        id: entry.id,
        entryNumber: entry.entry_number,
        entryDate: new Date(entry.entry_date),
        description: entry.description,
        referenceType: entry.reference_type,
        referenceId: entry.reference_id,
        referenceNumber: entry.reference_number,
        totalDebit: entry.total_debit,
        totalCredit: entry.total_credit,
        status: entry.status,
        lines: [], // จะ populate ภายหลังถ้าต้องการ
        createdBy: entry.created_by,
        createdAt: new Date(entry.created_at)
      };
    } catch (error) {
      console.error('Error creating invoice journal entry:', error);
      throw new Error('ไม่สามารถสร้าง Journal Entry สำหรับใบแจ้งหนี้ได้');
    }
  }

  /**
   * สร้าง Journal Entry สำหรับการชำระเงินซัพพลายเออร์
   */
  static async createPaymentJournalEntry(payment: SupplierPayment): Promise<JournalEntry> {
    try {
      const entryNumber = await this.generateJournalEntryNumber();
      
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: payment.paymentDate.toISOString().split('T')[0],
          description: `ชำระเงินซัพพลายเออร์ ${payment.paymentNumber}`,
          reference_type: 'supplier_payment',
          reference_id: payment.id,
          reference_number: payment.paymentNumber,
          total_debit: payment.paymentAmount,
          total_credit: payment.paymentAmount,
          status: 'posted',
          created_by: 'system'
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // สร้าง Journal Entry Lines
      const lines = [
        // Dr. Accounts Payable
        {
          entry_id: entry.id,
          account_id: await this.getAccountId('ACCOUNTS_PAYABLE'),
          description: `ชำระหนี้ ${payment.supplier?.supplierName}`,
          debit_amount: payment.paymentAmount,
          credit_amount: 0
        },
        // Cr. Cash/Bank Account
        {
          entry_id: entry.id,
          account_id: await this.getAccountId(this.getPaymentAccountType(payment.paymentMethod)),
          description: `ชำระด้วย ${this.getPaymentMethodText(payment.paymentMethod)}`,
          debit_amount: 0,
          credit_amount: payment.paymentAmount
        }
      ];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return {
        id: entry.id,
        entryNumber: entry.entry_number,
        entryDate: new Date(entry.entry_date),
        description: entry.description,
        referenceType: entry.reference_type,
        referenceId: entry.reference_id,
        referenceNumber: entry.reference_number,
        totalDebit: entry.total_debit,
        totalCredit: entry.total_credit,
        status: entry.status,
        lines: [],
        createdBy: entry.created_by,
        createdAt: new Date(entry.created_at)
      };
    } catch (error) {
      console.error('Error creating payment journal entry:', error);
      throw new Error('ไม่สามารถสร้าง Journal Entry สำหรับการชำระเงินได้');
    }
  }

  // ==================== POS INTEGRATION ====================
  
  /**
   * สร้าง Purchase Order จาก POS System
   */
  static async createPurchaseOrderFromPOS(orderData: {
    supplierId: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    expectedDeliveryDate?: Date;
  }): Promise<PurchaseOrderIntegration> {
    try {
      // สร้าง Order Number
      const orderNumber = await this.generatePurchaseOrderNumber();
      
      // คำนวณยอดรวม
      const totalAmount = orderData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitCost), 0
      );

      // สร้าง Purchase Order
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([{
          order_number: orderNumber,
          supplier_id: orderData.supplierId,
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: orderData.expectedDeliveryDate?.toISOString().split('T')[0],
          total_amount: totalAmount,
          status: 'pending',
          notes: orderData.notes,
          created_by: 'pos_system'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // สร้าง Purchase Order Items
      const items = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.quantity * item.unitCost,
        received_quantity: 0
      }));

      const { data: orderItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items)
        .select();

      if (itemsError) throw itemsError;

      return {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        status: order.status,
        totalAmount: order.total_amount,
        receivedAmount: 0,
        invoicedAmount: 0,
        items: orderItems.map(item => ({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          unitCost: item.unit_cost,
          receivedQuantity: item.received_quantity,
          invoicedQuantity: 0
        }))
      };
    } catch (error) {
      console.error('Error creating purchase order from POS:', error);
      throw new Error('ไม่สามารถสร้าง Purchase Order จาก POS ได้');
    }
  }

  /**
   * อัปเดตสถานะ Purchase Order เมื่อมีการรับสินค้า
   */
  static async updatePurchaseOrderOnReceive(
    orderId: string, 
    receivedItems: { productId: string; receivedQuantity: number }[]
  ): Promise<void> {
    try {
      // อัปเดต received quantity ในแต่ละ item
      for (const item of receivedItems) {
        await supabase
          .from('purchase_order_items')
          .update({
            received_quantity: supabase.raw('received_quantity + ?', [item.receivedQuantity])
          })
          .eq('order_id', orderId)
          .eq('product_id', item.productId);
      }

      // ตรวจสอบว่ารับสินค้าครบแล้วหรือไม่
      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('quantity, received_quantity')
        .eq('order_id', orderId);

      const isFullyReceived = items?.every(item => 
        item.received_quantity >= item.quantity
      );

      // อัปเดตสถานะ Purchase Order
      const newStatus = isFullyReceived ? 'received' : 'approved';
      await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    } catch (error) {
      console.error('Error updating purchase order on receive:', error);
      throw new Error('ไม่สามารถอัปเดต Purchase Order เมื่อรับสินค้าได้');
    }
  }

  // ==================== WAREHOUSE INTEGRATION ====================
  
  /**
   * รับสินค้าเข้าคลังและเชื่อมต่อกับ Purchase Order
   */
  static async receiveGoodsWithPurchaseOrder(receiveData: {
    warehouseId: string;
    purchaseOrderId: string;
    supplierId: string;
    invoiceNumber?: string;
    items: {
      productId: string;
      quantity: number;
      unitCost: number;
    }[];
    notes?: string;
    receivedBy: string;
  }): Promise<{
    receiveLog: ReceiveLog;
    stockMovements: StockMovement[];
    purchaseOrderUpdated: boolean;
  }> {
    try {
      // รับสินค้าเข้าคลังผ่าน WarehouseService
      const warehouseResult = await WarehouseService.receiveGoods({
        warehouseId: receiveData.warehouseId,
        supplierId: receiveData.supplierId,
        invoiceNumber: receiveData.invoiceNumber,
        items: receiveData.items,
        notes: receiveData.notes,
        receivedBy: receiveData.receivedBy
      });

      // อัปเดต Purchase Order
      await this.updatePurchaseOrderOnReceive(
        receiveData.purchaseOrderId,
        receiveData.items.map(item => ({
          productId: item.productId,
          receivedQuantity: item.quantity
        }))
      );

      // สร้าง Journal Entry สำหรับการรับสินค้า
      await this.createReceiveJournalEntry({
        receiveNumber: warehouseResult.receiveLog.receiveNumber,
        supplierId: receiveData.supplierId,
        totalAmount: receiveData.items.reduce((sum, item) => 
          sum + (item.quantity * item.unitCost), 0
        ),
        receiveDate: new Date()
      });

      return {
        receiveLog: warehouseResult.receiveLog,
        stockMovements: warehouseResult.movements,
        purchaseOrderUpdated: true
      };
    } catch (error) {
      console.error('Error receiving goods with purchase order:', error);
      throw new Error('ไม่สามารถรับสินค้าเข้าคลังและเชื่อมต่อกับ Purchase Order ได้');
    }
  }

  /**
   * สร้าง Journal Entry สำหรับการรับสินค้า
   */
  static async createReceiveJournalEntry(receiveData: {
    receiveNumber: string;
    supplierId: string;
    totalAmount: number;
    receiveDate: Date;
  }): Promise<void> {
    try {
      const entryNumber = await this.generateJournalEntryNumber();
      
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          entry_date: receiveData.receiveDate.toISOString().split('T')[0],
          description: `รับสินค้าเข้าคลัง ${receiveData.receiveNumber}`,
          reference_type: 'stock_receive',
          reference_id: receiveData.receiveNumber,
          reference_number: receiveData.receiveNumber,
          total_debit: receiveData.totalAmount,
          total_credit: receiveData.totalAmount,
          status: 'posted',
          created_by: 'system'
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // สร้าง Journal Entry Lines
      const lines = [
        // Dr. Inventory
        {
          entry_id: entry.id,
          account_id: await this.getAccountId('INVENTORY'),
          description: 'รับสินค้าเข้าคลัง',
          debit_amount: receiveData.totalAmount,
          credit_amount: 0
        },
        // Cr. Goods Received Not Invoiced (GRNI)
        {
          entry_id: entry.id,
          account_id: await this.getAccountId('GRNI'),
          description: 'สินค้าที่รับแต่ยังไม่ได้ใบแจ้งหนี้',
          debit_amount: 0,
          credit_amount: receiveData.totalAmount
        }
      ];

      await supabase
        .from('journal_entry_lines')
        .insert(lines);

    } catch (error) {
      console.error('Error creating receive journal entry:', error);
      // ไม่ throw error เพราะไม่ต้องการให้การรับสินค้าล้มเหลว
    }
  }

  // ==================== REPORTING INTEGRATION ====================
  
  /**
   * สร้างข้อมูลสำหรับ Analytics Dashboard
   */
  static async generateSupplierAnalytics(dateFrom?: Date, dateTo?: Date): Promise<{
    supplierPerformance: any[];
    paymentTrends: any[];
    purchaseAnalytics: any[];
    inventoryImpact: any[];
  }> {
    try {
      const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const toDate = dateTo || new Date();

      // Supplier Performance Analytics
      const { data: supplierPerformance } = await supabase
        .from('supplier_billing_summary')
        .select('*')
        .order('outstanding_amount', { ascending: false });

      // Payment Trends
      const { data: paymentTrends } = await supabase
        .from('supplier_payments')
        .select(`
          payment_date,
          payment_amount,
          payment_method,
          supplier:suppliers(supplier_name)
        `)
        .gte('payment_date', fromDate.toISOString().split('T')[0])
        .lte('payment_date', toDate.toISOString().split('T')[0])
        .order('payment_date');

      // Purchase Analytics
      const { data: purchaseAnalytics } = await supabase
        .from('purchase_orders')
        .select(`
          order_date,
          total_amount,
          status,
          supplier:suppliers(supplier_name)
        `)
        .gte('order_date', fromDate.toISOString().split('T')[0])
        .lte('order_date', toDate.toISOString().split('T')[0])
        .order('order_date');

      // Inventory Impact (จาก stock movements)
      const { data: inventoryImpact } = await supabase
        .from('stock_movements')
        .select(`
          created_at,
          movement_type,
          quantity,
          unit_cost,
          product:products(name, product_code)
        `)
        .eq('movement_type', 'receive')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at');

      return {
        supplierPerformance: supplierPerformance || [],
        paymentTrends: paymentTrends || [],
        purchaseAnalytics: purchaseAnalytics || [],
        inventoryImpact: inventoryImpact || []
      };
    } catch (error) {
      console.error('Error generating supplier analytics:', error);
      return {
        supplierPerformance: [],
        paymentTrends: [],
        purchaseAnalytics: [],
        inventoryImpact: []
      };
    }
  }

  /**
   * สร้างรายงาน Supplier Performance
   */
  static async generateSupplierPerformanceReport(supplierId?: string): Promise<{
    summary: any;
    monthlyTrends: any[];
    paymentHistory: any[];
    orderHistory: any[];
  }> {
    try {
      let supplierFilter = supplierId ? { supplier_id: supplierId } : {};

      // Summary
      const { data: summary } = await supabase
        .from('supplier_billing_summary')
        .select('*')
        .eq('supplier_id', supplierId || '')
        .single();

      // Monthly Trends (last 12 months)
      const { data: monthlyTrends } = await supabase.rpc('get_supplier_monthly_trends', {
        supplier_id_param: supplierId
      });

      // Payment History
      const { data: paymentHistory } = await supabase
        .from('supplier_payments')
        .select(`
          *,
          invoice:supplier_invoices(invoice_number, total_amount)
        `)
        .eq('supplier_id', supplierId || '')
        .order('payment_date', { ascending: false })
        .limit(50);

      // Order History
      const { data: orderHistory } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId || '')
        .order('order_date', { ascending: false })
        .limit(50);

      return {
        summary: summary || {},
        monthlyTrends: monthlyTrends || [],
        paymentHistory: paymentHistory || [],
        orderHistory: orderHistory || []
      };
    } catch (error) {
      console.error('Error generating supplier performance report:', error);
      return {
        summary: {},
        monthlyTrends: [],
        paymentHistory: [],
        orderHistory: []
      };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  /**
   * สร้างเลขที่ Journal Entry
   */
  private static async generateJournalEntryNumber(): Promise<string> {
    const { data } = await supabase.rpc('generate_journal_entry_number');
    return data || `JE${Date.now()}`;
  }

  /**
   * สร้างเลขที่ Purchase Order
   */
  private static async generatePurchaseOrderNumber(): Promise<string> {
    const { data } = await supabase.rpc('generate_purchase_order_number');
    return data || `PO${Date.now()}`;
  }

  /**
   * ดึง Account ID จาก Account Code
   */
  private static async getAccountId(accountCode: string): Promise<string> {
    const { data } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('account_code', accountCode)
      .single();
    
    return data?.id || 'default-account-id';
  }

  /**
   * แปลง Payment Method เป็น Account Type
   */
  private static getPaymentAccountType(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'cash':
        return 'CASH';
      case 'bank_transfer':
        return 'BANK';
      case 'check':
        return 'BANK';
      case 'credit_card':
        return 'CREDIT_CARD';
      default:
        return 'CASH';
    }
  }

  /**
   * แปลง Payment Method เป็นข้อความไทย
   */
  private static getPaymentMethodText(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'cash':
        return 'เงินสด';
      case 'bank_transfer':
        return 'โอนเงิน';
      case 'check':
        return 'เช็ค';
      case 'credit_card':
        return 'บัตรเครดิต';
      default:
        return paymentMethod;
    }
  }
}

export default IntegrationService;