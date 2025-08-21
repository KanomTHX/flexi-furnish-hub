// Real Supplier Billing Hook - Connected to Database
import { useState, useEffect, useCallback } from 'react';
import SupplierServiceSimple from '@/services/supplierServiceSimple';
import type { 
  Supplier, 
  SupplierInvoice, 
  SupplierPayment,
  CreateSupplierData,
  CreateInvoiceData,
  CreatePaymentData,
  SupplierFilters,
  InvoiceFilters,
  PaymentFilters,
  SupplierSummary,
  SupplierBillingSummary
} from '@/types/supplier';
import { useToast } from '@/hooks/use-toast';

export interface UseSupplierBillingOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useSupplierBilling(options: UseSupplierBillingOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;
  const { toast } = useToast();

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SupplierSummary>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    totalPaidThisMonth: 0,
    averagePaymentDays: 0
  });
  const [billingSummary, setBillingSummary] = useState<SupplierBillingSummary[]>([]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async (filters?: SupplierFilters) => {
    try {
      setLoading(true);
      setError(null);

      const data = await SupplierServiceSimple.getSuppliers(filters);
      setSuppliers(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลซัพพลายเออร์ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch invoices
  const fetchInvoices = useCallback(async (filters?: InvoiceFilters) => {
    try {
      setLoading(true);
      setError(null);

      const result = await SupplierServiceSimple.getSupplierInvoices(filters);
      setInvoices(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch payments
  const fetchPayments = useCallback(async (filters?: PaymentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const result = await SupplierServiceSimple.getSupplierPayments(filters);
      setPayments(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลการชำระเงินได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create supplier
  const createSupplier = useCallback(async (supplierData: CreateSupplierData, branchId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const newSupplier = await SupplierServiceSimple.createSupplier(supplierData, branchId);
      
      // Refresh suppliers list
      await fetchSuppliers();

      toast({
        title: 'สำเร็จ',
        description: 'สร้างซัพพลายเออร์เรียบร้อยแล้ว',
      });

      return newSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างซัพพลายเออร์ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers, toast]);

  // Update supplier
  const updateSupplier = useCallback(async (id: string, updates: Partial<CreateSupplierData>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSupplier = await SupplierServiceSimple.updateSupplier(id, updates);
      
      // Refresh suppliers list
      await fetchSuppliers();

      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตซัพพลายเออร์เรียบร้อยแล้ว',
      });

      return updatedSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตซัพพลายเออร์ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers, toast]);

  // Delete supplier
  const deleteSupplier = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await SupplierServiceSimple.deleteSupplier(id);
      
      // Refresh suppliers list
      await fetchSuppliers();

      toast({
        title: 'สำเร็จ',
        description: 'ลบซัพพลายเออร์เรียบร้อยแล้ว',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถลบซัพพลายเออร์ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers, toast]);

  // Create invoice
  const createInvoice = useCallback(async (invoiceData: CreateInvoiceData) => {
    try {
      setLoading(true);
      setError(null);

      const newInvoice = await SupplierServiceSimple.createSupplierInvoice(invoiceData);
      
      // Refresh data
      await Promise.all([
        fetchInvoices(),
        fetchSuppliers(),
        fetchSummary()
      ]);

      toast({
        title: 'สำเร็จ',
        description: 'สร้างใบแจ้งหนี้เรียบร้อยแล้ว',
      });

      return newInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถสร้างใบแจ้งหนี้ได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices, fetchSuppliers, toast]);

  // Create payment
  const createPayment = useCallback(async (paymentData: CreatePaymentData) => {
    try {
      setLoading(true);
      setError(null);

      const newPayment = await SupplierServiceSimple.createSupplierPayment(paymentData);
      
      // Refresh data
      await Promise.all([
        fetchPayments(),
        fetchInvoices(),
        fetchSuppliers(),
        fetchSummary()
      ]);

      toast({
        title: 'สำเร็จ',
        description: 'บันทึกการชำระเงินเรียบร้อยแล้ว',
      });

      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถบันทึกการชำระเงินได้';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments, fetchInvoices, fetchSuppliers, toast]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await SupplierServiceSimple.getSupplierSummary();
      setSummary(summaryData);
      return summaryData;
    } catch (err) {
      console.error('Error fetching supplier summary:', err);
      return summary;
    }
  }, [summary]);

  // Fetch billing summary
  const fetchBillingSummary = useCallback(async (supplierId?: string) => {
    try {
      const billingSummaryData = await SupplierServiceSimple.getSupplierBillingSummary(supplierId);
      setBillingSummary(billingSummaryData);
      return billingSummaryData;
    } catch (err) {
      console.error('Error fetching billing summary:', err);
      return [];
    }
  }, []);

  // Get supplier by ID
  const getSupplierById = useCallback(async (id: string) => {
    try {
      return await SupplierServiceSimple.getSupplierById(id);
    } catch (err) {
      console.error('Error getting supplier by ID:', err);
      return null;
    }
  }, []);

  // Get overdue invoices
  const getOverdueInvoices = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await fetchInvoices({
        dueDateTo: today,
        status: 'pending'
      });
      return result.data.filter(invoice => invoice.remainingAmount > 0);
    } catch (err) {
      console.error('Error getting overdue invoices:', err);
      return [];
    }
  }, [fetchInvoices]);

  // Get pending invoices
  const getPendingInvoices = useCallback(async () => {
    try {
      const result = await fetchInvoices({
        status: 'pending'
      });
      return result.data;
    } catch (err) {
      console.error('Error getting pending invoices:', err);
      return [];
    }
  }, [fetchInvoices]);

  // Auto-fetch data on mount
  useEffect(() => {
    if (autoFetch) {
      Promise.all([
        fetchSuppliers(),
        fetchInvoices({ limit: 50 }),
        fetchPayments({ limit: 50 }),
        fetchSummary(),
        fetchBillingSummary()
      ]);
    }
  }, [autoFetch, fetchSuppliers, fetchInvoices, fetchPayments, fetchSummary, fetchBillingSummary]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        if (autoFetch) {
          Promise.all([
            fetchSuppliers(),
            fetchInvoices({ limit: 50 }),
            fetchSummary()
          ]);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, autoFetch, fetchSuppliers, fetchInvoices, fetchSummary]);

  return {
    // Data
    suppliers,
    invoices,
    payments,
    summary,
    billingSummary,
    
    // State
    loading,
    error,
    
    // Supplier Actions
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    
    // Invoice Actions
    fetchInvoices,
    createInvoice,
    getOverdueInvoices,
    getPendingInvoices,
    
    // Payment Actions
    fetchPayments,
    createPayment,
    
    // Summary Actions
    fetchSummary,
    fetchBillingSummary,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => Promise.all([
      fetchSuppliers(),
      fetchInvoices({ limit: 50 }),
      fetchPayments({ limit: 50 }),
      fetchSummary(),
      fetchBillingSummary()
    ])
  };
}