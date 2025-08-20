import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import type {
  APInvoice,
  ARInvoice,
  InvoiceLineItem,
  InvoicePayment,
  AccountingExpense,
  ExpenseCategory,
  TaxTransaction,
  FinancialReport,
  POSAccountingIntegration,
  InstallmentAccountingIntegration,
  SupplierAccountingIntegration,
  CreateAPInvoiceData,
  CreateARInvoiceData,
  CreateExpenseData,
  CreatePaymentData,
  InvoiceFilters,
  ExpenseFilters,
  TaxReportFilters
} from '../types/accountingExtended';

export function useAccountingExtended() {
  const [apInvoices, setAPInvoices] = useState<APInvoice[]>([]);
  const [arInvoices, setARInvoices] = useState<ARInvoice[]>([]);
  const [expenses, setExpenses] = useState<AccountingExpense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [taxTransactions, setTaxTransactions] = useState<TaxTransaction[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // ========================================
  // AP INVOICE MANAGEMENT
  // ========================================

  const fetchAPInvoices = async (filters?: InvoiceFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('ap_invoices')
        .select(`
          *,
          invoice_line_items(*),
          invoice_payments(*)
        `);

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      setAPInvoices(data || []);
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
          ...data,
          invoice_number: invoiceNumber,
          outstanding_amount: data.total_amount
        })
        .select()
        .single();

      if (error) throw error;

      // เพิ่ม line items ถ้ามี
      if (data.line_items && data.line_items.length > 0) {
        const lineItems = data.line_items.map(item => ({
          ...item,
          invoice_id: invoice.id,
          invoice_type: 'ap_invoice' as const
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

  const updateAPInvoiceStatus = async (id: string, status: string) => {
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

  // ========================================
  // AR INVOICE MANAGEMENT
  // ========================================

  const fetchARInvoices = async (filters?: InvoiceFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('ar_invoices')
        .select(`
          *,
          invoice_line_items(*),
          invoice_payments(*)
        `);

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.date_from) {
        query = query.gte('invoice_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('invoice_date', filters.date_to);
      }

      const { data, error } = await query.order('invoice_date', { ascending: false });

      if (error) throw error;
      setARInvoices(data || []);
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
          ...data,
          invoice_number: invoiceNumber,
          outstanding_amount: data.total_amount
        })
        .select()
        .single();

      if (error) throw error;

      // เพิ่ม line items ถ้ามี
      if (data.line_items && data.line_items.length > 0) {
        const lineItems = data.line_items.map(item => ({
          ...item,
          invoice_id: invoice.id,
          invoice_type: 'ar_invoice' as const
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
          ...data,
          payment_number: paymentNumber
        })
        .select()
        .single();

      if (error) throw error;

      // อัปเดตยอดคงค้างในใบแจ้งหนี้
      const tableName = data.invoice_type === 'ap_invoice' ? 'ap_invoices' : 'ar_invoices';
      
      const { data: invoice } = await supabase
        .from(tableName)
        .select('paid_amount, total_amount')
        .eq('id', data.invoice_id)
        .single();

      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + data.amount;
        const outstandingAmount = invoice.total_amount - newPaidAmount;
        const newStatus = outstandingAmount <= 0 ? 'paid' : 'pending';

        await supabase
          .from(tableName)
          .update({
            paid_amount: newPaidAmount,
            outstanding_amount: outstandingAmount,
            status: newStatus
          })
          .eq('id', data.invoice_id);
      }

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกการชำระเงินเรียบร้อยแล้ว'
      });

      // รีเฟรชข้อมูล
      if (data.invoice_type === 'ap_invoice') {
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
  // EXPENSE MANAGEMENT
  // ========================================

  const fetchExpenses = async (filters?: ExpenseFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('accounting_expenses')
        .select('*');

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.date_from) {
        query = query.gte('expense_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('expense_date', filters.date_to);
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลค่าใช้จ่ายได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (data: CreateExpenseData) => {
    try {
      setLoading(true);
      
      // สร้างเลขที่ค่าใช้จ่ายอัตโนมัติ
      const expenseNumber = `EXP${Date.now()}`;
      
      const { data: expense, error } = await supabase
        .from('accounting_expenses')
        .insert({
          ...data,
          expense_number: expenseNumber
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกค่าใช้จ่ายเรียบร้อยแล้ว'
      });

      await fetchExpenses();
      return expense;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกค่าใช้จ่ายได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setExpenseCategories(data || []);
    } catch (error) {
      console.error('Error fetching expense categories:', error);
    }
  };

  // ========================================
  // TAX MANAGEMENT
  // ========================================

  const fetchTaxTransactions = async (filters?: TaxReportFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('tax_transactions')
        .select('*');

      if (filters?.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters?.tax_type) {
        query = query.eq('tax_type', filters.tax_type);
      }
      if (filters?.date_from) {
        query = query.gte('transaction_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('transaction_date', filters.date_to);
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      setTaxTransactions(data || []);
    } catch (error) {
      console.error('Error fetching tax transactions:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลภาษีได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FINANCIAL REPORTS
  // ========================================

  const generateFinancialReport = async (reportType: string, periodStart: string, periodEnd: string, branchId?: string) => {
    try {
      setLoading(true);
      
      // สร้างรายงานตามประเภท
      let reportData = {};
      
      switch (reportType) {
        case 'profit_loss':
          reportData = await generateProfitLossReport(periodStart, periodEnd, branchId);
          break;
        case 'balance_sheet':
          reportData = await generateBalanceSheetReport(periodEnd, branchId);
          break;
        case 'cash_flow':
          reportData = await generateCashFlowReport(periodStart, periodEnd, branchId);
          break;
        default:
          throw new Error('ประเภทรายงานไม่ถูกต้อง');
      }

      const { data: report, error } = await supabase
        .from('financial_reports')
        .insert({
          report_name: `${reportType}_${Date.now()}`,
          report_type: reportType,
          period_start: periodStart,
          period_end: periodEnd,
          branch_id: branchId,
          data: reportData,
          status: 'completed',
          generated_by: user?.id || 'system'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานทางการเงินเรียบร้อยแล้ว'
      });

      return report;
    } catch (error) {
      console.error('Error generating financial report:', error);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานทางการเงินได้',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions สำหรับสร้างรายงาน
  const generateProfitLossReport = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement profit & loss report generation
    return {
      revenue: 0,
      expenses: 0,
      net_profit: 0,
      period_start: periodStart,
      period_end: periodEnd
    };
  };

  const generateBalanceSheetReport = async (asOfDate: string, branchId?: string) => {
    // TODO: Implement balance sheet report generation
    return {
      assets: 0,
      liabilities: 0,
      equity: 0,
      as_of_date: asOfDate
    };
  };

  const generateCashFlowReport = async (periodStart: string, periodEnd: string, branchId?: string) => {
    // TODO: Implement cash flow report generation
    return {
      operating_activities: 0,
      investing_activities: 0,
      financing_activities: 0,
      net_cash_flow: 0,
      period_start: periodStart,
      period_end: periodEnd
    };
  };

  // ========================================
  // INTEGRATION FUNCTIONS
  // ========================================

  const integratePOSTransaction = async (posTransactionId: string, revenueAmount: number, taxAmount: number, branchId: string) => {
    try {
      // สร้าง journal entry สำหรับ POS transaction
      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: `POS${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `POS Sale Transaction ${posTransactionId}`,
          total_debit: revenueAmount,
          total_credit: revenueAmount,
          created_by: 'system'
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // บันทึก integration record
      const { error: integrationError } = await supabase
        .from('pos_accounting_integration')
        .insert({
          pos_transaction_id: posTransactionId,
          journal_entry_id: journalEntry.id,
          revenue_amount: revenueAmount,
          tax_amount: taxAmount,
          branch_id: branchId,
          transaction_date: new Date().toISOString().split('T')[0]
        });

      if (integrationError) throw integrationError;

      return journalEntry;
    } catch (error) {
      console.error('Error integrating POS transaction:', error);
      throw error;
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    fetchExpenseCategories();
  }, []);

  return {
    // State
    loading,
    apInvoices,
    arInvoices,
    expenses,
    expenseCategories,
    taxTransactions,
    financialReports,

    // AP Invoice functions
    fetchAPInvoices,
    createAPInvoice,
    updateAPInvoiceStatus,

    // AR Invoice functions
    fetchARInvoices,
    createARInvoice,

    // Payment functions
    createInvoicePayment,

    // Expense functions
    fetchExpenses,
    createExpense,
    fetchExpenseCategories,

    // Tax functions
    fetchTaxTransactions,

    // Report functions
    generateFinancialReport,

    // Integration functions
    integratePOSTransaction
  };
}