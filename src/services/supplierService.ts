// Real Supplier Service - Connected to Supabase Database
import { supabase } from '@/integrations/supabase/client';
import type { 
  Supplier, 
  SupplierInvoice, 
  SupplierPayment,
  PurchaseOrder,
  CreateSupplierData,
  CreateInvoiceData,
  CreatePaymentData,
  SupplierFilters,
  InvoiceFilters,
  PaymentFilters,
  SupplierSummary,
  SupplierBillingSummary
} from '@/types/supplier';

export class SupplierService {
  // ==================== SUPPLIER MANAGEMENT ====================
  
  /**
   * Get all suppliers with optional filtering
   */
  static async getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`supplier_name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`);
      }

      if (filters?.hasOutstanding) {
        query = query.gt('current_balance', 0);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        supplierCode: item.supplier_code,
        supplierName: item.supplier_name,
        contactPerson: item.contact_person,
        phone: item.phone,
        email: item.email,
        address: item.address,
        taxId: item.tax_id,
        paymentTerms: item.payment_terms || 30,
        creditLimit: item.credit_limit || 0,
        currentBalance: item.current_balance || 0,
        status: item.status,
        notes: item.notes,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('ไม่สามารถดึงข้อมูลซัพพลายเออร์ได้');
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        supplierCode: data.supplier_code,
        supplierName: data.supplier_name,
        contactPerson: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxId: data.tax_id,
        paymentTerms: data.payment_terms || 30,
        creditLimit: data.credit_limit || 0,
        currentBalance: data.current_balance || 0,
        status: data.status,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return null;
    }
  }

  /**
   * Create new supplier
   */
  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          supplier_code: supplierData.supplierCode,
          supplier_name: supplierData.supplierName,
          contact_person: supplierData.contactPerson,
          phone: supplierData.phone,
          email: supplierData.email,
          address: supplierData.address,
          tax_id: supplierData.taxId,
          payment_terms: supplierData.paymentTerms || 30,
          credit_limit: supplierData.creditLimit || 0,
          notes: supplierData.notes,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        supplierCode: data.supplier_code,
        supplierName: data.supplier_name,
        contactPerson: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxId: data.tax_id,
        paymentTerms: data.payment_terms,
        creditLimit: data.credit_limit,
        currentBalance: data.current_balance || 0,
        status: data.status,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error('ไม่สามารถสร้างซัพพลายเออร์ได้');
    }
  }

  /**
   * Update supplier
   */
  static async updateSupplier(id: string, updates: Partial<CreateSupplierData>): Promise<Supplier> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.supplierName) updateData.supplier_name = updates.supplierName;
      if (updates.contactPerson) updateData.contact_person = updates.contactPerson;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email) updateData.email = updates.email;
      if (updates.address) updateData.address = updates.address;
      if (updates.taxId) updateData.tax_id = updates.taxId;
      if (updates.paymentTerms !== undefined) updateData.payment_terms = updates.paymentTerms;
      if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
      if (updates.notes) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        supplierCode: data.supplier_code,
        supplierName: data.supplier_name,
        contactPerson: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxId: data.tax_id,
        paymentTerms: data.payment_terms,
        creditLimit: data.credit_limit,
        currentBalance: data.current_balance || 0,
        status: data.status,
        notes: data.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('ไม่สามารถอัปเดตซัพพลายเออร์ได้');
    }
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw new Error('ไม่สามารถลบซัพพลายเออร์ได้');
    }
  }

  // ==================== INVOICE MANAGEMENT ====================

  /**
   * Get supplier invoices with filtering
   */
  static async getSupplierInvoices(filters?: InvoiceFilters): Promise<{
    data: SupplierInvoice[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, supplier_name, supplier_code),
          items:supplier_invoice_items(
            id, product_id, description, quantity, unit_cost, total_cost
          ),
          payments:supplier_payments(
            id, payment_number, payment_date, payment_amount, payment_method
          )
        `, { count: 'exact' });

      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('invoice_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('invoice_date', filters.dateTo);
      }

      if (filters?.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }

      if (filters?.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      if (filters?.search) {
        query = query.ilike('invoice_number', `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;

      const invoices: SupplierInvoice[] = (data || []).map(item => ({
        id: item.id,
        invoiceNumber: item.invoice_number,
        supplierId: item.supplier_id,
        supplier: item.supplier ? {
          id: item.supplier.id,
          supplierCode: item.supplier.supplier_code,
          supplierName: item.supplier.supplier_name,
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          paymentTerms: 30,
          creditLimit: 0,
          currentBalance: 0,
          status: 'active' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined,
        purchaseOrderId: item.purchase_order_id,
        purchaseOrder: undefined,
        invoiceDate: new Date(item.invoice_date),
        dueDate: new Date(item.due_date),
        subtotal: item.subtotal,
        taxAmount: item.tax_amount || 0,
        discountAmount: item.discount_amount || 0,
        totalAmount: item.total_amount,
        paidAmount: item.paid_amount || 0,
        remainingAmount: item.remaining_amount,
        status: item.status,
        paymentTerms: item.payment_terms || 30,
        notes: item.notes,
        items: item.items?.map((invItem: any) => ({
          id: invItem.id,
          invoiceId: item.id,
          productId: invItem.product_id,
          product: undefined,
          description: invItem.description,
          quantity: invItem.quantity,
          unitCost: invItem.unit_cost,
          totalCost: invItem.total_cost,
          createdAt: new Date()
        })),
        payments: item.payments?.map((payment: any) => ({
          id: payment.id,
          paymentNumber: payment.payment_number,
          supplierId: item.supplier_id,
          invoiceId: item.id,
          paymentDate: new Date(payment.payment_date),
          paymentAmount: payment.payment_amount,
          paymentMethod: payment.payment_method,
          referenceNumber: '',
          createdBy: '',
          createdAt: new Date()
        })),
        createdBy: item.created_by,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      return {
        data: invoices,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
      throw new Error('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
    }
  }

  /**
   * Create supplier invoice
   */
  static async createSupplierInvoice(invoiceData: CreateInvoiceData): Promise<SupplierInvoice> {
    try {
      // Calculate totals
      const subtotal = invoiceData.subtotal;
      const taxAmount = invoiceData.taxAmount || 0;
      const discountAmount = invoiceData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const dueDate = invoiceData.dueDate || new Date(Date.now() + (invoiceData.paymentTerms || 30) * 24 * 60 * 60 * 1000);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('supplier_invoices')
        .insert([{
          invoice_number: invoiceData.invoiceNumber,
          supplier_id: invoiceData.supplierId,
          purchase_order_id: invoiceData.purchaseOrderId,
          invoice_date: invoiceData.invoiceDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          payment_terms: invoiceData.paymentTerms || 30,
          notes: invoiceData.notes,
          created_by: 'current-user-id' // TODO: Get from auth context
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (invoiceData.items.length > 0) {
        const items = invoiceData.items.map(item => ({
          invoice_id: invoice.id,
          product_id: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.quantity * item.unitCost
        }));

        const { error: itemsError } = await supabase
          .from('supplier_invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Update supplier balance
      await supabase.rpc('update_supplier_balance', {
        supplier_id: invoiceData.supplierId,
        amount: totalAmount
      });

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        supplierId: invoice.supplier_id,
        purchaseOrderId: invoice.purchase_order_id,
        invoiceDate: new Date(invoice.invoice_date),
        dueDate: new Date(invoice.due_date),
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount,
        discountAmount: invoice.discount_amount,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.paid_amount || 0,
        remainingAmount: invoice.remaining_amount,
        status: invoice.status,
        paymentTerms: invoice.payment_terms,
        notes: invoice.notes,
        createdBy: invoice.created_by,
        createdAt: new Date(invoice.created_at),
        updatedAt: new Date(invoice.updated_at)
      };
    } catch (error) {
      console.error('Error creating supplier invoice:', error);
      throw new Error('ไม่สามารถสร้างใบแจ้งหนี้ได้');
    }
  }

  // ==================== PAYMENT MANAGEMENT ====================

  /**
   * Get supplier payments
   */
  static async getSupplierPayments(filters?: PaymentFilters): Promise<{
    data: SupplierPayment[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('supplier_payments')
        .select(`
          *,
          supplier:suppliers(id, supplier_name, supplier_code),
          invoice:supplier_invoices(id, invoice_number, total_amount)
        `, { count: 'exact' });

      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters?.invoiceId) {
        query = query.eq('invoice_id', filters.invoiceId);
      }

      if (filters?.dateFrom) {
        query = query.gte('payment_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('payment_date', filters.dateTo);
      }

      if (filters?.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      if (filters?.search) {
        query = query.or(`payment_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query.order('payment_date', { ascending: false });

      if (error) throw error;

      const payments: SupplierPayment[] = (data || []).map(item => ({
        id: item.id,
        paymentNumber: item.payment_number,
        supplierId: item.supplier_id,
        supplier: item.supplier ? {
          id: item.supplier.id,
          supplierCode: item.supplier.supplier_code,
          supplierName: item.supplier.supplier_name,
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          paymentTerms: 30,
          creditLimit: 0,
          currentBalance: 0,
          status: 'active' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined,
        invoiceId: item.invoice_id,
        invoice: item.invoice ? {
          id: item.invoice.id,
          invoiceNumber: item.invoice.invoice_number,
          supplierId: item.supplier_id,
          invoiceDate: new Date(),
          dueDate: new Date(),
          subtotal: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: item.invoice.total_amount,
          paidAmount: 0,
          remainingAmount: 0,
          status: 'pending' as any,
          paymentTerms: 30,
          createdBy: '',
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined,
        paymentDate: new Date(item.payment_date),
        paymentAmount: item.payment_amount,
        paymentMethod: item.payment_method,
        referenceNumber: item.reference_number,
        notes: item.notes,
        createdBy: item.created_by,
        createdAt: new Date(item.created_at)
      }));

      return {
        data: payments,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching supplier payments:', error);
      throw new Error('ไม่สามารถดึงข้อมูลการชำระเงินได้');
    }
  }

  /**
   * Create supplier payment
   */
  static async createSupplierPayment(paymentData: CreatePaymentData): Promise<SupplierPayment> {
    try {
      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('supplier_payments')
        .insert([{
          payment_number: paymentData.paymentNumber,
          supplier_id: paymentData.supplierId,
          invoice_id: paymentData.invoiceId,
          payment_date: paymentData.paymentDate.toISOString().split('T')[0],
          payment_amount: paymentData.paymentAmount,
          payment_method: paymentData.paymentMethod,
          reference_number: paymentData.referenceNumber,
          notes: paymentData.notes,
          created_by: 'current-user-id' // TODO: Get from auth context
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update invoice paid amount and status
      const { data: invoice } = await supabase
        .from('supplier_invoices')
        .select('paid_amount, total_amount')
        .eq('id', paymentData.invoiceId)
        .single();

      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + paymentData.paymentAmount;
        const remainingAmount = invoice.total_amount - newPaidAmount;
        const status = remainingAmount <= 0 ? 'paid' : 'pending';

        await supabase
          .from('supplier_invoices')
          .update({
            paid_amount: newPaidAmount,
            remaining_amount: remainingAmount,
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentData.invoiceId);

        // Update supplier balance
        await supabase.rpc('update_supplier_balance', {
          supplier_id: paymentData.supplierId,
          amount: -paymentData.paymentAmount
        });
      }

      return {
        id: payment.id,
        paymentNumber: payment.payment_number,
        supplierId: payment.supplier_id,
        invoiceId: payment.invoice_id,
        paymentDate: new Date(payment.payment_date),
        paymentAmount: payment.payment_amount,
        paymentMethod: payment.payment_method,
        referenceNumber: payment.reference_number,
        notes: payment.notes,
        createdBy: payment.created_by,
        createdAt: new Date(payment.created_at)
      };
    } catch (error) {
      console.error('Error creating supplier payment:', error);
      throw new Error('ไม่สามารถสร้างการชำระเงินได้');
    }
  }

  // ==================== SUMMARY AND STATISTICS ====================

  /**
   * Get supplier summary statistics
   */
  static async getSupplierSummary(): Promise<SupplierSummary> {
    try {
      // Get supplier counts
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, status, current_balance');

      const totalSuppliers = suppliers?.length || 0;
      const activeSuppliers = suppliers?.filter(s => s.status === 'active').length || 0;
      const totalOutstanding = suppliers?.reduce((sum, s) => sum + (s.current_balance || 0), 0) || 0;

      // Get overdue invoices
      const { data: overdueInvoices } = await supabase
        .from('supplier_invoices')
        .select('remaining_amount')
        .lt('due_date', new Date().toISOString().split('T')[0])
        .gt('remaining_amount', 0);

      const overdueAmount = overdueInvoices?.reduce((sum, inv) => sum + inv.remaining_amount, 0) || 0;

      // Get payments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('supplier_payments')
        .select('payment_amount')
        .gte('payment_date', startOfMonth.toISOString().split('T')[0]);

      const totalPaidThisMonth = monthlyPayments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0;

      return {
        totalSuppliers,
        activeSuppliers,
        totalOutstanding,
        overdueAmount,
        totalPaidThisMonth,
        averagePaymentDays: 30 // TODO: Calculate actual average
      };
    } catch (error) {
      console.error('Error getting supplier summary:', error);
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalOutstanding: 0,
        overdueAmount: 0,
        totalPaidThisMonth: 0,
        averagePaymentDays: 0
      };
    }
  }

  /**
   * Get supplier billing summary
   */
  static async getSupplierBillingSummary(supplierId?: string): Promise<SupplierBillingSummary[]> {
    try {
      let query = supabase
        .from('suppliers')
        .select(`
          id, supplier_name,
          invoices:supplier_invoices(total_amount, paid_amount, remaining_amount),
          payments:supplier_payments(payment_date)
        `);

      if (supplierId) {
        query = query.eq('id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(supplier => {
        const invoices = supplier.invoices || [];
        const payments = supplier.payments || [];

        const totalInvoices = invoices.length;
        const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);
        const paidAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.paid_amount || 0), 0);
        const outstandingAmount = invoices.reduce((sum: number, inv: any) => sum + inv.remaining_amount, 0);
        const overdueAmount = 0; // TODO: Calculate overdue amount

        const lastPayment = payments.length > 0 
          ? new Date(Math.max(...payments.map((p: any) => new Date(p.payment_date).getTime())))
          : undefined;

        return {
          supplierId: supplier.id,
          supplierName: supplier.supplier_name,
          totalInvoices,
          totalAmount,
          paidAmount,
          outstandingAmount,
          overdueAmount,
          lastPaymentDate: lastPayment,
          averagePaymentDays: 30 // TODO: Calculate actual average
        };
      });
    } catch (error) {
      console.error('Error getting supplier billing summary:', error);
      return [];
    }
  }
}

export default SupplierService;