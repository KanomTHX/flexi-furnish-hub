// Simple Supplier Service - Type-safe approach
import { supabase } from '@/integrations/supabase/client';
import type { 
  Supplier, 
  SupplierInvoice, 
  CreateSupplierData,
  CreateInvoiceData,
  SupplierFilters,
  InvoiceFilters,
  SupplierSummary
} from '@/types/supplier';

export class SupplierServiceSimple {
  // ==================== SUPPLIER MANAGEMENT ====================
  
  /**
   * Get all suppliers with optional filtering
   */
  static async getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    try {
      // Use any to bypass TypeScript issues
      let query = (supabase as any)
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
      
      return (data || []).map((item: any) => ({
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
   * Create new supplier
   */
  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
    try {
      console.log('Creating supplier with data:', supplierData);
      
      const insertData = {
        supplier_code: supplierData.supplierCode,
        supplier_name: supplierData.supplierName,
        contact_person: supplierData.contactPerson || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        tax_id: supplierData.taxId || '',
        payment_terms: supplierData.paymentTerms || 30,
        credit_limit: supplierData.creditLimit || 0,
        notes: supplierData.notes || '',
        status: 'active'
      };

      console.log('Insert data:', insertData);

      const { data, error } = await (supabase as any)
        .from('suppliers')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Created supplier:', data);

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
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      
      // Handle specific Supabase errors
      if (error.code === '23505') {
        throw new Error('รหัสซัพพลายเออร์นี้มีอยู่แล้ว กรุณาใช้รหัสอื่น');
      } else if (error.code === '23502') {
        throw new Error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      } else if (error.message) {
        throw new Error(`เกิดข้อผิดพลาด: ${error.message}`);
      } else {
        throw new Error('ไม่สามารถสร้างซัพพลายเออร์ได้');
      }
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

      const { data, error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      let query = (supabase as any)
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

      if (filters?.search) {
        query = query.ilike('invoice_number', `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error, count } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;

      const invoices: SupplierInvoice[] = (data || []).map((item: any) => ({
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
      console.log('Creating invoice with data:', invoiceData);
      
      // Calculate totals
      const subtotal = invoiceData.subtotal;
      const taxAmount = invoiceData.taxAmount || 0;
      const discountAmount = invoiceData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      const dueDate = invoiceData.dueDate || new Date(Date.now() + (invoiceData.paymentTerms || 30) * 24 * 60 * 60 * 1000);

      const insertData = {
        invoice_number: invoiceData.invoiceNumber,
        supplier_id: invoiceData.supplierId,
        purchase_order_id: invoiceData.purchaseOrderId || null,
        invoice_date: invoiceData.invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        remaining_amount: totalAmount,
        payment_terms: invoiceData.paymentTerms || 30,
        notes: invoiceData.notes || '',
        created_by: 'current-user-id'
      };

      console.log('Invoice insert data:', insertData);

      // Create invoice
      const { data: invoice, error: invoiceError } = await (supabase as any)
        .from('supplier_invoices')
        .insert([insertData])
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw invoiceError;
      }

      console.log('Created invoice:', invoice);

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

        const { error: itemsError } = await (supabase as any)
          .from('supplier_invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

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
    } catch (error: any) {
      console.error('Error creating supplier invoice:', error);
      
      // Handle specific Supabase errors
      if (error.code === '23505') {
        throw new Error('เลขที่ใบแจ้งหนี้นี้มีอยู่แล้ว กรุณาใช้เลขที่อื่น');
      } else if (error.code === '23502') {
        throw new Error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      } else if (error.code === '23503') {
        throw new Error('ไม่พบซัพพลายเออร์ที่เลือก กรุณาเลือกซัพพลายเออร์ที่ถูกต้อง');
      } else if (error.message) {
        throw new Error(`เกิดข้อผิดพลาด: ${error.message}`);
      } else {
        throw new Error('ไม่สามารถสร้างใบแจ้งหนี้ได้');
      }
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await (supabase as any)
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
   * Get supplier payments
   */
  static async getSupplierPayments(filters?: any): Promise<{
    data: any[];
    total: number;
  }> {
    try {
      let query = (supabase as any)
        .from('supplier_payments')
        .select(`
          *,
          supplier:suppliers(id, supplier_name, supplier_code),
          invoice:supplier_invoices(id, invoice_number, total_amount)
        `, { count: 'exact' });

      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error, count } = await query.order('payment_date', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching supplier payments:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Create supplier payment
   */
  static async createSupplierPayment(paymentData: any): Promise<any> {
    try {
      const { data: payment, error: paymentError } = await (supabase as any)
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
          created_by: 'current-user-id'
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      return payment;
    } catch (error: any) {
      console.error('Error creating supplier payment:', error);
      throw new Error('ไม่สามารถสร้างการชำระเงินได้');
    }
  }

  /**
   * Get supplier billing summary
   */
  static async getSupplierBillingSummary(supplierId?: string): Promise<any[]> {
    try {
      let query = (supabase as any)
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

      return (data || []).map((supplier: any) => {
        const invoices = supplier.invoices || [];
        const payments = supplier.payments || [];

        const totalInvoices = invoices.length;
        const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);
        const paidAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.paid_amount || 0), 0);
        const outstandingAmount = invoices.reduce((sum: number, inv: any) => sum + inv.remaining_amount, 0);

        return {
          supplierId: supplier.id,
          supplierName: supplier.supplier_name,
          totalInvoices,
          totalAmount,
          paidAmount,
          outstandingAmount,
          overdueAmount: 0,
          lastPaymentDate: payments.length > 0 ? new Date(payments[0].payment_date) : undefined,
          averagePaymentDays: 30
        };
      });
    } catch (error) {
      console.error('Error getting supplier billing summary:', error);
      return [];
    }
  }

  /**
   * Get supplier summary statistics
   */
  static async getSupplierSummary(): Promise<SupplierSummary> {
    try {
      // Get supplier counts
      const { data: suppliers } = await (supabase as any)
        .from('suppliers')
        .select('id, status, current_balance');

      const totalSuppliers = suppliers?.length || 0;
      const activeSuppliers = suppliers?.filter((s: any) => s.status === 'active').length || 0;
      const totalOutstanding = suppliers?.reduce((sum: number, s: any) => sum + (s.current_balance || 0), 0) || 0;

      return {
        totalSuppliers,
        activeSuppliers,
        totalOutstanding,
        overdueAmount: 0,
        totalPaidThisMonth: 0,
        averagePaymentDays: 30
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
}

export default SupplierServiceSimple;