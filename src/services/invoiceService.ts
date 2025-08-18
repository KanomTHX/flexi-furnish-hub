import { supabase } from '../lib/supabase';
import { APInvoice, ARInvoice, InvoiceItem, InvoiceStatus, PaymentTerm } from '../types/accounting';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAPInvoiceData {
  vendor_name: string;
  vendor_address?: string;
  vendor_tax_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: PaymentTerm;
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
  notes?: string;
  branch_id: string;
}

export interface CreateARInvoiceData {
  customer_name: string;
  customer_address?: string;
  customer_tax_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: PaymentTerm;
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
  notes?: string;
  branch_id: string;
  contract_id?: string; // For installment contracts
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  vendor_name?: string;
  customer_name?: string;
  invoice_number?: string;
}

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_amount: number;
  tax_amount: number;
}

class InvoiceService {
  // AP Invoice Methods
  async createAPInvoice(data: CreateAPInvoiceData): Promise<APInvoice> {
    try {
      const invoiceId = uuidv4();
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        return sum + (itemTotal * (item.tax_rate || 0) / 100);
      }, 0);
      const total_amount = subtotal + tax_amount;

      // Create AP Invoice
      const apInvoice: Omit<APInvoice, 'created_at' | 'updated_at'> = {
        id: invoiceId,
        vendor_name: data.vendor_name,
        vendor_address: data.vendor_address,
        vendor_tax_id: data.vendor_tax_id,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        payment_terms: data.payment_terms,
        subtotal,
        tax_amount,
        total_amount,
        paid_amount: 0,
        outstanding_amount: total_amount,
        status: 'pending',
        notes: data.notes,
        branch_id: data.branch_id
      };

      const { data: createdInvoice, error: invoiceError } = await supabase
        .from('ap_invoices')
        .insert([apInvoice])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = data.items.map(item => ({
        id: uuidv4(),
        invoice_id: invoiceId,
        invoice_type: 'ap' as const,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return createdInvoice;
    } catch (error) {
      console.error('Error creating AP invoice:', error);
      throw error;
    }
  }

  async createARInvoice(data: CreateARInvoiceData): Promise<ARInvoice> {
    try {
      const invoiceId = uuidv4();
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_amount = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        return sum + (itemTotal * (item.tax_rate || 0) / 100);
      }, 0);
      const total_amount = subtotal + tax_amount;

      // Create AR Invoice
      const arInvoice: Omit<ARInvoice, 'created_at' | 'updated_at'> = {
        id: invoiceId,
        customer_name: data.customer_name,
        customer_address: data.customer_address,
        customer_tax_id: data.customer_tax_id,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        payment_terms: data.payment_terms,
        subtotal,
        tax_amount,
        total_amount,
        paid_amount: 0,
        outstanding_amount: total_amount,
        status: 'pending',
        notes: data.notes,
        branch_id: data.branch_id,
        contract_id: data.contract_id
      };

      const { data: createdInvoice, error: invoiceError } = await supabase
        .from('ar_invoices')
        .insert([arInvoice])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = data.items.map(item => ({
        id: uuidv4(),
        invoice_id: invoiceId,
        invoice_type: 'ar' as const,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return createdInvoice;
    } catch (error) {
      console.error('Error creating AR invoice:', error);
      throw error;
    }
  }

  // Get invoices with filters
  async getAPInvoices(filters: InvoiceFilters = {}): Promise<APInvoice[]> {
    try {
      let query = supabase.from('ap_invoices').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }
      if (filters.vendor_name) {
        query = query.ilike('vendor_name', `%${filters.vendor_name}%`);
      }
      if (filters.invoice_number) {
        query = query.ilike('invoice_number', `%${filters.invoice_number}%`);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AP invoices:', error);
      throw error;
    }
  }

  async getARInvoices(filters: InvoiceFilters = {}): Promise<ARInvoice[]> {
    try {
      let query = supabase.from('ar_invoices').select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }
      if (filters.customer_name) {
        query = query.ilike('customer_name', `%${filters.customer_name}%`);
      }
      if (filters.invoice_number) {
        query = query.ilike('invoice_number', `%${filters.invoice_number}%`);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AR invoices:', error);
      throw error;
    }
  }

  // Get invoice items
  async getInvoiceItems(invoiceId: string, invoiceType: 'ap' | 'ar'): Promise<InvoiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('invoice_type', invoiceType);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      throw error;
    }
  }

  // Update invoice status and payment
  async updateAPInvoicePayment(invoiceId: string, paidAmount: number): Promise<APInvoice> {
    try {
      // Get current invoice
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('ap_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = currentInvoice.paid_amount + paidAmount;
      const outstandingAmount = currentInvoice.total_amount - newPaidAmount;
      
      let status: InvoiceStatus = 'pending';
      if (outstandingAmount <= 0) {
        status = 'paid';
      } else if (newPaidAmount > 0) {
        status = 'partial';
      }

      const { data, error } = await supabase
        .from('ap_invoices')
        .update({
          paid_amount: newPaidAmount,
          outstanding_amount: Math.max(0, outstandingAmount),
          status
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AP invoice payment:', error);
      throw error;
    }
  }

  async updateARInvoicePayment(invoiceId: string, paidAmount: number): Promise<ARInvoice> {
    try {
      // Get current invoice
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('ar_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = currentInvoice.paid_amount + paidAmount;
      const outstandingAmount = currentInvoice.total_amount - newPaidAmount;
      
      let status: InvoiceStatus = 'pending';
      if (outstandingAmount <= 0) {
        status = 'paid';
      } else if (newPaidAmount > 0) {
        status = 'partial';
      }

      const { data, error } = await supabase
        .from('ar_invoices')
        .update({
          paid_amount: newPaidAmount,
          outstanding_amount: Math.max(0, outstandingAmount),
          status
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AR invoice payment:', error);
      throw error;
    }
  }

  // Get invoice summaries
  async getAPInvoiceSummary(branchId?: string): Promise<InvoiceSummary> {
    try {
      let query = supabase.from('ap_invoices').select('total_amount, paid_amount, outstanding_amount, tax_amount, status, due_date');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      return {
        total_invoices: data?.length || 0,
        total_amount: data?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0,
        paid_amount: data?.reduce((sum, inv) => sum + inv.paid_amount, 0) || 0,
        outstanding_amount: data?.reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0,
        overdue_amount: data?.filter(inv => inv.status !== 'paid' && inv.due_date < today)
          .reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0,
        tax_amount: data?.reduce((sum, inv) => sum + inv.tax_amount, 0) || 0
      };
    } catch (error) {
      console.error('Error getting AP invoice summary:', error);
      throw error;
    }
  }

  async getARInvoiceSummary(branchId?: string): Promise<InvoiceSummary> {
    try {
      let query = supabase.from('ar_invoices').select('total_amount, paid_amount, outstanding_amount, tax_amount, status, due_date');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      
      return {
        total_invoices: data?.length || 0,
        total_amount: data?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0,
        paid_amount: data?.reduce((sum, inv) => sum + inv.paid_amount, 0) || 0,
        outstanding_amount: data?.reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0,
        overdue_amount: data?.filter(inv => inv.status !== 'paid' && inv.due_date < today)
          .reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0,
        tax_amount: data?.reduce((sum, inv) => sum + inv.tax_amount, 0) || 0
      };
    } catch (error) {
      console.error('Error getting AR invoice summary:', error);
      throw error;
    }
  }

  // Delete invoice
  async deleteAPInvoice(invoiceId: string): Promise<void> {
    try {
      // Delete invoice items first
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('invoice_type', 'ap');

      // Delete invoice
      const { error } = await supabase
        .from('ap_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting AP invoice:', error);
      throw error;
    }
  }

  async deleteARInvoice(invoiceId: string): Promise<void> {
    try {
      // Delete invoice items first
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)
        .eq('invoice_type', 'ar');

      // Delete invoice
      const { error } = await supabase
        .from('ar_invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting AR invoice:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;