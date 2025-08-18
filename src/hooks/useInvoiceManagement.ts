import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import type {
  APInvoice,
  ARInvoice,
  APInvoiceFilter,
  ARInvoiceFilter,
  APInvoiceStatus,
  ARInvoiceStatus,
  PaymentMethod
} from '../types/accountingExtended';

// Define missing types for create operations
interface CreateAPInvoiceData {
  supplierId: string;
  branchId: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  withholdingTaxAmount: number;
  withholdingTaxRate: number;
  totalAmount: number;
  paymentTerms?: string;
  description?: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
    vatAmount: number;
  }[];
}

interface CreateARInvoiceData {
  customerId: string;
  branchId: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  paymentTerms?: string;
  description?: string;
  installmentContractId?: string;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
    vatAmount: number;
  }[];
}

interface CreatePaymentData {
  invoiceId: string;
  invoiceType: 'ap_invoice' | 'ar_invoice';
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankAccount?: string;
  notes?: string;
}

export function useInvoiceManagement() {
  const [loading, setLoading] = useState(false);
  const [apInvoices, setAPInvoices] = useState<APInvoice[]>([]);
  const [arInvoices, setARInvoices] = useState<ARInvoice[]>([]);
  const { toast } = useToast();

  // ========================================
  // AP INVOICE MANAGEMENT
  // ========================================

  const fetchAPInvoices = async (filters?: APInvoiceFilter) => {
    try {
      setLoading(true);
      let query = supabase
        .from('ap_invoices')
        .select(`
          *,
          invoice_line_items(*),
          invoice_payments(*)
        `);

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.supplierId) {
        query = query.eq('supplier_id', filters.supplierId);
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
      if (filters?.amountFrom) {
        query = query.gte('total_amount', filters.amountFrom);
      }
      if (filters?.amountTo) {
        query = query.lte('total_amount', filters.amountTo);
      }
      if (filters?.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = data?.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        supplierId: invoice.supplier_id,
        supplier: {
          id: invoice.supplier_id,
          name: invoice.supplier_name || '',
          taxId: invoice.supplier_tax_id,
          address: invoice.supplier_address
        },
        branchId: invoice.branch_id,
        branch: {
          id: invoice.branch_id,
          name: invoice.branch_name || '',
          code: invoice.branch_code || ''
        },
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        subtotal: invoice.subtotal,
        vatAmount: invoice.vat_amount,
        vatRate: invoice.vat_rate,
        withholdingTaxAmount: invoice.withholding_tax_amount,
        withholdingTaxRate: invoice.withholding_tax_rate,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.paid_amount || 0,
        remainingAmount: invoice.outstanding_amount || invoice.total_amount,
        status: invoice.status as APInvoiceStatus,
        paymentTerms: invoice.payment_terms,
        description: invoice.description,
        attachments: invoice.attachments || [],
        items: invoice.invoice_line_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          product: item.product_id ? {
            id: item.product_id,
            name: item.product_name || '',
            sku: item.product_sku || ''
          } : undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          vatRate: item.vat_rate,
          vatAmount: item.vat_amount
        })) || [],
        payments: invoice.invoice_payments?.map((payment: any) => ({
          id: payment.id,
          invoiceId: payment.invoice_id,
          paymentDate: payment.payment_date,
          amount: payment.amount,
          paymentMethod: payment.payment_method as PaymentMethod,
          referenceNumber: payment.reference_number,
          bankAccount: payment.bank_account,
          notes: payment.notes,
          journalEntryId: payment.journal_entry_id,
          createdBy: payment.created_by,
          createdAt: payment.created_at
        })) || [],
        journalEntryId: invoice.journal_entry_id,
        createdBy: invoice.created_by,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at
      })) || [];

      setAPInvoices(transformedData);
    } catch (error) {
      console.error('Error fetching AP invoices:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลใบวางบิลได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAPInvoice = async (data: CreateAPInvoiceData) => {
    try {
      setLoading(true);
      
      // สร้างเลขที่ใบวางบิลอัตโนมัติ
      const invoiceNumber = `AP${Date.now()}`;
      
      const { data: invoice, error } = await supabase
        .from('ap_invoices')
        .insert({
          invoice_number: invoiceNumber,
          supplier_id: data.supplierId,
          branch_id: data.branchId,
          invoice_date: data.invoiceDate,
          due_date: data.dueDate,
          subtotal: data.subtotal,
          vat_amount: data.vatAmount,
          vat_rate: data.vatRate,
          withholding_tax_amount: data.withholdingTaxAmount,
          withholding_tax_rate: data.withholdingTaxRate,
          total_amount: data.totalAmount,
          outstanding_amount: data.totalAmount,
          payment_terms: data.paymentTerms,
          description: data.description,
          status: 'pending',
          created_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      // เพิ่ม line items
      if (data.items && data.items.length > 0) {
        const lineItems = data.items.map(item => ({
          invoice_id: invoice.id,
          invoice_type: 'ap_invoice',
          product_id: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          vat_rate: item.vatRate,
          vat_amount: item.vatAmount
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItems);

        if (lineItemsError) throw lineItemsError;
      }

      toast({
        title: 'สำเร็จ',
        description: 'สร้างใบวางบิลเรียบร้อยแล้ว'
      });

      await fetchAPInvoices();
      return invoice;
    } catch (error) {
      console.error('Error creating AP invoice:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างใบวางบิลได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAPInvoiceStatus = async (id: string, status: APInvoiceStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ap_invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตสถานะใบวางบิลเรียบร้อยแล้ว'
      });

      await fetchAPInvoices();
    } catch (error) {
      console.error('Error updating AP invoice status:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAPInvoice = async (id: string) => {
    try {
      setLoading(true);
      
      // ลบ line items ก่อน
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', id)
        .eq('invoice_type', 'ap_invoice');

      // ลบ payments
      await supabase
        .from('invoice_payments')
        .delete()
        .eq('invoice_id', id)
        .eq('invoice_type', 'ap_invoice');

      // ลบ invoice
      const { error } = await supabase
        .from('ap_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบใบวางบิลเรียบร้อยแล้ว'
      });

      await fetchAPInvoices();
    } catch (error) {
      console.error('Error deleting AP invoice:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถลบใบวางบิลได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // AR INVOICE MANAGEMENT
  // ========================================

  const fetchARInvoices = async (filters?: ARInvoiceFilter) => {
    try {
      setLoading(true);
      let query = supabase
        .from('ar_invoices')
        .select(`
          *,
          invoice_line_items(*),
          invoice_payments(*)
        `);

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
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
      if (filters?.amountFrom) {
        query = query.gte('total_amount', filters.amountFrom);
      }
      if (filters?.amountTo) {
        query = query.lte('total_amount', filters.amountTo);
      }
      if (filters?.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = data?.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId: invoice.customer_id,
        customer: {
          id: invoice.customer_id,
          name: invoice.customer_name || '',
          taxId: invoice.customer_tax_id,
          address: invoice.customer_address
        },
        branchId: invoice.branch_id,
        branch: {
          id: invoice.branch_id,
          name: invoice.branch_name || '',
          code: invoice.branch_code || ''
        },
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        subtotal: invoice.subtotal,
        vatAmount: invoice.vat_amount,
        vatRate: invoice.vat_rate,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.paid_amount || 0,
        remainingAmount: invoice.outstanding_amount || invoice.total_amount,
        status: invoice.status as ARInvoiceStatus,
        paymentTerms: invoice.payment_terms,
        description: invoice.description,
        attachments: invoice.attachments || [],
        items: invoice.invoice_line_items?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          product: item.product_id ? {
            id: item.product_id,
            name: item.product_name || '',
            sku: item.product_sku || ''
          } : undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          vatRate: item.vat_rate,
          vatAmount: item.vat_amount
        })) || [],
        payments: invoice.invoice_payments?.map((payment: any) => ({
          id: payment.id,
          invoiceId: payment.invoice_id,
          paymentDate: payment.payment_date,
          amount: payment.amount,
          paymentMethod: payment.payment_method as PaymentMethod,
          referenceNumber: payment.reference_number,
          bankAccount: payment.bank_account,
          notes: payment.notes,
          journalEntryId: payment.journal_entry_id,
          createdBy: payment.created_by,
          createdAt: payment.created_at
        })) || [],
        installmentContractId: invoice.installment_contract_id,
        journalEntryId: invoice.journal_entry_id,
        createdBy: invoice.created_by,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at
      })) || [];

      setARInvoices(transformedData);
    } catch (error) {
      console.error('Error fetching AR invoices:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createARInvoice = async (data: CreateARInvoiceData) => {
    try {
      setLoading(true);
      
      // สร้างเลขที่ใบแจ้งหนี้อัตโนมัติ
      const invoiceNumber = `AR${Date.now()}`;
      
      const { data: invoice, error } = await supabase
        .from('ar_invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_id: data.customerId,
          branch_id: data.branchId,
          invoice_date: data.invoiceDate,
          due_date: data.dueDate,
          subtotal: data.subtotal,
          vat_amount: data.vatAmount,
          vat_rate: data.vatRate,
          total_amount: data.totalAmount,
          outstanding_amount: data.totalAmount,
          payment_terms: data.paymentTerms,
          description: data.description,
          installment_contract_id: data.installmentContractId,
          status: 'draft',
          created_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      // เพิ่ม line items
      if (data.items && data.items.length > 0) {
        const lineItems = data.items.map(item => ({
          invoice_id: invoice.id,
          invoice_type: 'ar_invoice',
          product_id: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          vat_rate: item.vatRate,
          vat_amount: item.vatAmount
        }));

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItems);

        if (lineItemsError) throw lineItemsError;
      }

      toast({
        title: 'สำเร็จ',
        description: 'สร้างใบแจ้งหนี้เรียบร้อยแล้ว'
      });

      await fetchARInvoices();
      return invoice;
    } catch (error) {
      console.error('Error creating AR invoice:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างใบแจ้งหนี้ได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateARInvoiceStatus = async (id: string, status: ARInvoiceStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ar_invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตสถานะใบแจ้งหนี้เรียบร้อยแล้ว'
      });

      await fetchARInvoices();
    } catch (error) {
      console.error('Error updating AR invoice status:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteARInvoice = async (id: string) => {
    try {
      setLoading(true);
      
      // ลบ line items ก่อน
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', id)
        .eq('invoice_type', 'ar_invoice');

      // ลบ payments
      await supabase
        .from('invoice_payments')
        .delete()
        .eq('invoice_id', id)
        .eq('invoice_type', 'ar_invoice');

      // ลบ invoice
      const { error } = await supabase
        .from('ar_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบใบแจ้งหนี้เรียบร้อยแล้ว'
      });

      await fetchARInvoices();
    } catch (error) {
      console.error('Error deleting AR invoice:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถลบใบแจ้งหนี้ได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PAYMENT MANAGEMENT
  // ========================================

  const createInvoicePayment = async (data: CreatePaymentData) => {
    try {
      setLoading(true);
      
      // สร้างเลขที่การชำระเงินอัตโนมัติ
      const paymentNumber = `PAY${Date.now()}`;
      
      const { data: payment, error } = await supabase
        .from('invoice_payments')
        .insert({
          payment_number: paymentNumber,
          invoice_id: data.invoiceId,
          invoice_type: data.invoiceType,
          payment_date: data.paymentDate,
          amount: data.amount,
          payment_method: data.paymentMethod,
          reference_number: data.referenceNumber,
          bank_account: data.bankAccount,
          notes: data.notes,
          created_by: 'current_user' // TODO: ใช้ user ID จริง
        })
        .select()
        .single();

      if (error) throw error;

      // อัปเดตยอดคงค้างในใบแจ้งหนี้
      const tableName = data.invoiceType === 'ap_invoice' ? 'ap_invoices' : 'ar_invoices';
      
      const { data: invoice } = await supabase
        .from(tableName)
        .select('paid_amount, total_amount')
        .eq('id', data.invoiceId)
        .single();

      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + data.amount;
        const outstandingAmount = invoice.total_amount - newPaidAmount;
        const newStatus = outstandingAmount <= 0 ? 'paid' : 
                         outstandingAmount < invoice.total_amount ? 'partially_paid' : 'pending';

        await supabase
          .from(tableName)
          .update({
            paid_amount: newPaidAmount,
            outstanding_amount: outstandingAmount,
            status: newStatus
          })
          .eq('id', data.invoiceId);
      }

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกการชำระเงินเรียบร้อยแล้ว'
      });

      // รีเฟรชข้อมูล
      if (data.invoiceType === 'ap_invoice') {
        await fetchAPInvoices();
      } else {
        await fetchARInvoices();
      }

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกการชำระเงินได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const getAPInvoiceById = (id: string) => {
    return apInvoices.find(invoice => invoice.id === id);
  };

  const getARInvoiceById = (id: string) => {
    return arInvoices.find(invoice => invoice.id === id);
  };

  const getOverdueAPInvoices = () => {
    const today = new Date().toISOString().split('T')[0];
    return apInvoices.filter(invoice => 
      invoice.dueDate < today && 
      invoice.status !== 'paid' && 
      invoice.status !== 'cancelled'
    );
  };

  const getOverdueARInvoices = () => {
    const today = new Date().toISOString().split('T')[0];
    return arInvoices.filter(invoice => 
      invoice.dueDate < today && 
      invoice.status !== 'paid' && 
      invoice.status !== 'cancelled'
    );
  };

  const getTotalAPAmount = () => {
    return apInvoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
  };

  const getTotalARAmount = () => {
    return arInvoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
  };

  const getTotalOutstandingAP = () => {
    return apInvoices.reduce((total, invoice) => total + invoice.remainingAmount, 0);
  };

  const getTotalOutstandingAR = () => {
    return arInvoices.reduce((total, invoice) => total + invoice.remainingAmount, 0);
  };

  return {
    // State
    loading,
    apInvoices,
    arInvoices,

    // AP Invoice functions
    fetchAPInvoices,
    createAPInvoice,
    updateAPInvoiceStatus,
    deleteAPInvoice,

    // AR Invoice functions
    fetchARInvoices,
    createARInvoice,
    updateARInvoiceStatus,
    deleteARInvoice,

    // Payment functions
    createInvoicePayment,

    // Utility functions
    getAPInvoiceById,
    getARInvoiceById,
    getOverdueAPInvoices,
    getOverdueARInvoices,
    getTotalAPAmount,
    getTotalARAmount,
    getTotalOutstandingAP,
    getTotalOutstandingAR
  };
}