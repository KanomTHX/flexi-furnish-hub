import { useState, useEffect, useCallback } from 'react';
import { APInvoice, ARInvoice, InvoiceItem, InvoiceStatus } from '../types/accounting';
import {
  invoiceService,
  CreateAPInvoiceData,
  CreateARInvoiceData,
  InvoiceFilters,
  InvoiceSummary
} from '../services/invoiceService';
import { useAccounting } from './useAccounting';

export interface UseInvoicesReturn {
  // State
  apInvoices: APInvoice[];
  arInvoices: ARInvoice[];
  invoiceItems: { [invoiceId: string]: InvoiceItem[] };
  apSummary: InvoiceSummary | null;
  arSummary: InvoiceSummary | null;
  isLoading: boolean;
  error: string | null;
  isAccountingProcessing: boolean;
  accountingError: string | null;

  // Actions
  actions: {
    createAPInvoice: (data: CreateAPInvoiceData) => Promise<APInvoice | null>;
    createARInvoice: (data: CreateARInvoiceData) => Promise<ARInvoice | null>;
    loadAPInvoices: (filters?: InvoiceFilters) => Promise<void>;
    loadARInvoices: (filters?: InvoiceFilters) => Promise<void>;
    loadInvoiceItems: (invoiceId: string, invoiceType: 'ap' | 'ar') => Promise<void>;
    updateAPInvoicePayment: (invoiceId: string, paidAmount: number) => Promise<void>;
    updateARInvoicePayment: (invoiceId: string, paidAmount: number) => Promise<void>;
    deleteAPInvoice: (invoiceId: string) => Promise<void>;
    deleteARInvoice: (invoiceId: string) => Promise<void>;
    loadAPSummary: (branchId?: string) => Promise<void>;
    loadARSummary: (branchId?: string) => Promise<void>;
    refreshData: () => Promise<void>;
  };
}

export function useInvoices(): UseInvoicesReturn {
  const [apInvoices, setAPInvoices] = useState<APInvoice[]>([]);
  const [arInvoices, setARInvoices] = useState<ARInvoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<{ [invoiceId: string]: InvoiceItem[] }>({});
  const [apSummary, setAPSummary] = useState<InvoiceSummary | null>(null);
  const [arSummary, setARSummary] = useState<InvoiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use accounting integration
  const {
    createAccountingEntriesFromInvoice,
    isProcessing: isAccountingProcessing,
    error: accountingError
  } = useAccounting();

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(error.message || `Failed to ${operation}`);
  }, []);

  // Create AP Invoice
  const createAPInvoice = useCallback(async (data: CreateAPInvoiceData): Promise<APInvoice | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const invoice = await invoiceService.createAPInvoice(data);
      
      // Create accounting entries for the invoice
      await createAccountingEntriesFromInvoice(invoice, 'ap');
      
      // Refresh AP invoices list
      await loadAPInvoices();
      
      return invoice;
    } catch (error) {
      handleError(error, 'create AP invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createAccountingEntriesFromInvoice]);

  // Create AR Invoice
  const createARInvoice = useCallback(async (data: CreateARInvoiceData): Promise<ARInvoice | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const invoice = await invoiceService.createARInvoice(data);
      
      // Create accounting entries for the invoice
      await createAccountingEntriesFromInvoice(invoice, 'ar');
      
      // Refresh AR invoices list
      await loadARInvoices();
      
      return invoice;
    } catch (error) {
      handleError(error, 'create AR invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createAccountingEntriesFromInvoice]);

  // Load AP Invoices
  const loadAPInvoices = useCallback(async (filters?: InvoiceFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const invoices = await invoiceService.getAPInvoices(filters);
      setAPInvoices(invoices);
    } catch (error) {
      handleError(error, 'load AP invoices');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load AR Invoices
  const loadARInvoices = useCallback(async (filters?: InvoiceFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const invoices = await invoiceService.getARInvoices(filters);
      setARInvoices(invoices);
    } catch (error) {
      handleError(error, 'load AR invoices');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load Invoice Items
  const loadInvoiceItems = useCallback(async (invoiceId: string, invoiceType: 'ap' | 'ar') => {
    try {
      setError(null);
      const items = await invoiceService.getInvoiceItems(invoiceId, invoiceType);
      setInvoiceItems(prev => ({
        ...prev,
        [invoiceId]: items
      }));
    } catch (error) {
      handleError(error, 'load invoice items');
    }
  }, [handleError]);

  // Update AP Invoice Payment
  const updateAPInvoicePayment = useCallback(async (invoiceId: string, paidAmount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedInvoice = await invoiceService.updateAPInvoicePayment(invoiceId, paidAmount);
      
      // Create accounting entries for the payment
      await createAccountingEntriesFromInvoice(updatedInvoice, 'ap', paidAmount);
      
      // Update local state
      setAPInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? updatedInvoice : inv
      ));
    } catch (error) {
      handleError(error, 'update AP invoice payment');
    } finally {
      setIsLoading(false);
    }
  }, [createAccountingEntriesFromInvoice, handleError]);

  // Update AR Invoice Payment
  const updateARInvoicePayment = useCallback(async (invoiceId: string, paidAmount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedInvoice = await invoiceService.updateARInvoicePayment(invoiceId, paidAmount);
      
      // Create accounting entries for the payment
      await createAccountingEntriesFromInvoice(updatedInvoice, 'ar', paidAmount);
      
      // Update local state
      setARInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? updatedInvoice : inv
      ));
    } catch (error) {
      handleError(error, 'update AR invoice payment');
    } finally {
      setIsLoading(false);
    }
  }, [createAccountingEntriesFromInvoice, handleError]);

  // Delete AP Invoice
  const deleteAPInvoice = useCallback(async (invoiceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await invoiceService.deleteAPInvoice(invoiceId);
      
      // Remove from local state
      setAPInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setInvoiceItems(prev => {
        const { [invoiceId]: removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      handleError(error, 'delete AP invoice');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Delete AR Invoice
  const deleteARInvoice = useCallback(async (invoiceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await invoiceService.deleteARInvoice(invoiceId);
      
      // Remove from local state
      setARInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setInvoiceItems(prev => {
        const { [invoiceId]: removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      handleError(error, 'delete AR invoice');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load AP Summary
  const loadAPSummary = useCallback(async (branchId?: string) => {
    try {
      setError(null);
      const summary = await invoiceService.getAPInvoiceSummary(branchId);
      setAPSummary(summary);
    } catch (error) {
      handleError(error, 'load AP summary');
    }
  }, [handleError]);

  // Load AR Summary
  const loadARSummary = useCallback(async (branchId?: string) => {
    try {
      setError(null);
      const summary = await invoiceService.getARInvoiceSummary(branchId);
      setARSummary(summary);
    } catch (error) {
      handleError(error, 'load AR summary');
    }
  }, [handleError]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadAPInvoices(),
      loadARInvoices(),
      loadAPSummary(),
      loadARSummary()
    ]);
  }, [loadAPInvoices, loadARInvoices, loadAPSummary, loadARSummary]);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  return {
    // State
    apInvoices,
    arInvoices,
    invoiceItems,
    apSummary,
    arSummary,
    isLoading,
    error,
    isAccountingProcessing,
    accountingError,

    // Actions
    actions: {
      createAPInvoice,
      createARInvoice,
      loadAPInvoices,
      loadARInvoices,
      loadInvoiceItems,
      updateAPInvoicePayment,
      updateARInvoicePayment,
      deleteAPInvoice,
      deleteARInvoice,
      loadAPSummary,
      loadARSummary,
      refreshData
    }
  };
}

export default useInvoices;