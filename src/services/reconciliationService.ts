import { supabase } from '@/integrations/supabase/client';
import type { 
  ReconciliationReport,
  ReconciliationItem,
  ReconciliationAdjustment,
  Account,
  AccountingPeriod,
  JournalEntry
} from '@/types/accounting';
import type { Supplier } from '@/types/supplier';
import { 
  AccountingError,
  ReconciliationError,
  AccountingValidationError
} from '@/errors/accounting';
import { JournalEntryService } from './journalEntryService';

export interface CreateReconciliationData {
  accountId: string;
  period: AccountingPeriod;
  statementBalance: number;
  notes?: string;
}

export interface ReconciliationItemData {
  description: string;
  amount: number;
  type: 'outstanding_check' | 'deposit_in_transit' | 'bank_charge' | 'interest_earned' | 'error_correction';
  transactionId?: string;
  notes?: string;
}

export interface ReconciliationAdjustmentData {
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reason: string;
  accountId: string;
}

export interface ReconciliationFilter {
  accountId?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'reviewed';
  periodStart?: string;
  periodEnd?: string;
  reconciledBy?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SupplierReconciliationData {
  supplierId: string;
  period: AccountingPeriod;
  supplierBalance: number; // Balance from supplier statement
  bookBalance: number; // Balance from our books
  discrepancies: SupplierDiscrepancy[];
}

export interface SupplierDiscrepancy {
  type: 'missing_invoice' | 'missing_payment' | 'amount_difference' | 'date_difference';
  description: string;
  supplierAmount?: number;
  bookAmount?: number;
  supplierDate?: string;
  bookDate?: string;
  reference?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReconciliationSummary {
  totalReconciliations: number;
  completedReconciliations: number;
  pendingReconciliations: number;
  totalVariance: number;
  averageVariance: number;
  accountsReconciled: number;
  suppliersReconciled: number;
}

export class ReconciliationService {
  /**
   * Create a new reconciliation report
   */
  static async createReconciliation(
    reconciliationData: CreateReconciliationData,
    createdBy: string
  ): Promise<ReconciliationReport> {
    try {
      // Validate account exists
      const { data: account, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', reconciliationData.accountId)
        .eq('is_active', true)
        .single();

      if (accountError || !account) {
        throw new ReconciliationError(
          'Account not found or inactive',
          { accountId: reconciliationData.accountId }
        );
      }

      // Calculate book balance for the period
      const bookBalance = await this.calculateBookBalance(
        reconciliationData.accountId,
        reconciliationData.period
      );

      // Generate report number
      const reportNumber = await this.generateReportNumber();

      // Create reconciliation record
      const { data: reconciliation, error: reconciliationError } = await supabase
        .from('reconciliation_reports')
        .insert([{
          report_number: reportNumber,
          period_start: reconciliationData.period.startDate,
          period_end: reconciliationData.period.endDate,
          account_id: reconciliationData.accountId,
          book_balance: bookBalance,
          statement_balance: reconciliationData.statementBalance,
          reconciled_balance: bookBalance, // Initial value
          variance: Math.abs(bookBalance - reconciliationData.statementBalance),
          status: 'draft',
          notes: reconciliationData.notes,
          created_by: createdBy
        }])
        .select()
        .single();

      if (reconciliationError) {
        throw new ReconciliationError(
          'Failed to create reconciliation report',
          { databaseError: reconciliationError }
        );
      }

      return this.mapToReconciliationReport(reconciliation, account, [], []);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Unexpected error creating reconciliation',
        { originalError: error }
      );
    }
  }

  /**
   * Add reconciliation item
   */
  static async addReconciliationItem(
    reconciliationId: string,
    itemData: ReconciliationItemData
  ): Promise<ReconciliationItem> {
    try {
      const { data: item, error } = await supabase
        .from('reconciliation_items')
        .insert([{
          reconciliation_id: reconciliationId,
          transaction_id: itemData.transactionId,
          description: itemData.description,
          amount: itemData.amount,
          type: itemData.type,
          is_reconciled: false,
          notes: itemData.notes
        }])
        .select()
        .single();

      if (error) {
        throw new ReconciliationError(
          'Failed to add reconciliation item',
          { databaseError: error }
        );
      }

      // Update reconciliation balance
      await this.updateReconciledBalance(reconciliationId);

      return this.mapToReconciliationItem(item);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Unexpected error adding reconciliation item',
        { originalError: error }
      );
    }
  }

  /**
   * Mark reconciliation item as reconciled
   */
  static async reconcileItem(
    itemId: string,
    reconciledBy: string
  ): Promise<ReconciliationItem> {
    try {
      const { data: item, error } = await supabase
        .from('reconciliation_items')
        .update({
          is_reconciled: true,
          reconciled_date: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw new ReconciliationError(
          'Failed to reconcile item',
          { databaseError: error }
        );
      }

      // Update reconciliation balance
      await this.updateReconciledBalance(item.reconciliation_id);

      return this.mapToReconciliationItem(item);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Unexpected error reconciling item',
        { originalError: error }
      );
    }
  }

  /**
   * Add manual adjustment
   */
  static async addManualAdjustment(
    reconciliationId: string,
    adjustmentData: ReconciliationAdjustmentData,
    createdBy: string
  ): Promise<ReconciliationAdjustment> {
    try {
      // Create journal entry for the adjustment
      const journalEntry = await JournalEntryService.createJournalEntry({
        date: new Date().toISOString().split('T')[0],
        description: `Reconciliation Adjustment: ${adjustmentData.description}`,
        reference: `RECON-ADJ-${Date.now()}`,
        sourceType: 'adjustment',
        sourceId: reconciliationId,
        lines: [
          {
            accountId: adjustmentData.accountId,
            description: adjustmentData.description,
            debitAmount: adjustmentData.type === 'debit' ? adjustmentData.amount : 0,
            creditAmount: adjustmentData.type === 'credit' ? adjustmentData.amount : 0
          },
          {
            accountId: await this.getAdjustmentOffsetAccountId(),
            description: `Offset for: ${adjustmentData.description}`,
            debitAmount: adjustmentData.type === 'credit' ? adjustmentData.amount : 0,
            creditAmount: adjustmentData.type === 'debit' ? adjustmentData.amount : 0
          }
        ]
      }, createdBy);

      // Post the journal entry
      await JournalEntryService.postJournalEntry(journalEntry.id, createdBy);

      // Create adjustment record
      const { data: adjustment, error } = await supabase
        .from('reconciliation_adjustments')
        .insert([{
          reconciliation_id: reconciliationId,
          journal_entry_id: journalEntry.id,
          description: adjustmentData.description,
          amount: adjustmentData.amount,
          type: adjustmentData.type,
          reason: adjustmentData.reason
        }])
        .select()
        .single();

      if (error) {
        throw new ReconciliationError(
          'Failed to create adjustment',
          { databaseError: error }
        );
      }

      // Update reconciliation balance
      await this.updateReconciledBalance(reconciliationId);

      return this.mapToReconciliationAdjustment(adjustment);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Unexpected error creating adjustment',
        { originalError: error }
      );
    }
  }

  /**
   * Complete reconciliation
   */
  static async completeReconciliation(
    reconciliationId: string,
    reconciledBy: string
  ): Promise<ReconciliationReport> {
    try {
      const { data: reconciliation, error } = await supabase
        .from('reconciliation_reports')
        .update({
          status: 'completed',
          reconciled_by: reconciledBy,
          reconciled_at: new Date().toISOString()
        })
        .eq('id', reconciliationId)
        .select()
        .single();

      if (error) {
        throw new ReconciliationError(
          'Failed to complete reconciliation',
          { databaseError: error }
        );
      }

      return await this.getReconciliationById(reconciliationId) as ReconciliationReport;
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Unexpected error completing reconciliation',
        { originalError: error }
      );
    }
  }

  /**
   * Get reconciliation by ID
   */
  static async getReconciliationById(reconciliationId: string): Promise<ReconciliationReport | null> {
    try {
      const { data: reconciliation, error: reconciliationError } = await supabase
        .from('reconciliation_reports')
        .select(`
          *,
          account:chart_of_accounts(*)
        `)
        .eq('id', reconciliationId)
        .single();

      if (reconciliationError || !reconciliation) {
        return null;
      }

      // Get reconciliation items
      const { data: items } = await supabase
        .from('reconciliation_items')
        .select('*')
        .eq('reconciliation_id', reconciliationId);

      // Get adjustments
      const { data: adjustments } = await supabase
        .from('reconciliation_adjustments')
        .select('*')
        .eq('reconciliation_id', reconciliationId);

      return this.mapToReconciliationReport(
        reconciliation,
        reconciliation.account,
        items || [],
        adjustments || []
      );
    } catch (error) {
      throw new ReconciliationError(
        'Failed to get reconciliation',
        { originalError: error }
      );
    }
  }

  /**
   * Get reconciliations with filtering
   */
  static async getReconciliations(filter: ReconciliationFilter = {}): Promise<{
    data: ReconciliationReport[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('reconciliation_reports')
        .select(`
          *,
          account:chart_of_accounts(*)
        `, { count: 'exact' });

      // Apply filters
      if (filter.accountId) {
        query = query.eq('account_id', filter.accountId);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.periodStart) {
        query = query.gte('period_start', filter.periodStart);
      }
      if (filter.periodEnd) {
        query = query.lte('period_end', filter.periodEnd);
      }
      if (filter.reconciledBy) {
        query = query.eq('reconciled_by', filter.reconciledBy);
      }
      if (filter.search) {
        query = query.or(`report_number.ilike.%${filter.search}%,notes.ilike.%${filter.search}%`);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      // Order by created date descending
      query = query.order('created_at', { ascending: false });

      const { data: reconciliations, error, count } = await query;

      if (error) {
        throw new ReconciliationError(
          'Failed to fetch reconciliations',
          { databaseError: error }
        );
      }

      // Get items and adjustments for each reconciliation
      const reconciliationsWithDetails = await Promise.all(
        (reconciliations || []).map(async (reconciliation) => {
          const { data: items } = await supabase
            .from('reconciliation_items')
            .select('*')
            .eq('reconciliation_id', reconciliation.id);

          const { data: adjustments } = await supabase
            .from('reconciliation_adjustments')
            .select('*')
            .eq('reconciliation_id', reconciliation.id);

          return this.mapToReconciliationReport(
            reconciliation,
            reconciliation.account,
            items || [],
            adjustments || []
          );
        })
      );

      return {
        data: reconciliationsWithDetails,
        total: count || 0
      };
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Failed to get reconciliations',
        { originalError: error }
      );
    }
  }

  /**
   * Reconcile supplier balances
   */
  static async reconcileSupplierBalances(
    supplierId: string,
    period: AccountingPeriod,
    supplierStatementBalance: number
  ): Promise<SupplierReconciliationData> {
    try {
      // Get supplier
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (supplierError || !supplier) {
        throw new ReconciliationError(
          'Supplier not found',
          { supplierId }
        );
      }

      // Calculate book balance for supplier
      const bookBalance = await this.calculateSupplierBookBalance(supplierId, period);

      // Detect discrepancies
      const discrepancies = await this.detectSupplierDiscrepancies(
        supplierId,
        period,
        supplierStatementBalance,
        bookBalance
      );

      return {
        supplierId,
        period,
        supplierBalance: supplierStatementBalance,
        bookBalance,
        discrepancies
      };
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Failed to reconcile supplier balances',
        { originalError: error }
      );
    }
  }

  /**
   * Get reconciliation summary
   */
  static async getReconciliationSummary(period?: AccountingPeriod): Promise<ReconciliationSummary> {
    try {
      let query = supabase
        .from('reconciliation_reports')
        .select('status, variance');

      if (period) {
        query = query
          .gte('period_start', period.startDate)
          .lte('period_end', period.endDate);
      }

      const { data: reconciliations, error } = await query;

      if (error) {
        throw new ReconciliationError(
          'Failed to get reconciliation summary',
          { databaseError: error }
        );
      }

      const total = reconciliations?.length || 0;
      const completed = reconciliations?.filter(r => r.status === 'completed').length || 0;
      const pending = reconciliations?.filter(r => r.status !== 'completed').length || 0;
      const totalVariance = reconciliations?.reduce((sum, r) => sum + (r.variance || 0), 0) || 0;
      const averageVariance = total > 0 ? totalVariance / total : 0;

      // Get unique accounts reconciled
      const { data: accounts, error: accountsError } = await supabase
        .from('reconciliation_reports')
        .select('account_id')
        .eq('status', 'completed');

      const accountsReconciled = new Set(accounts?.map(a => a.account_id) || []).size;

      return {
        totalReconciliations: total,
        completedReconciliations: completed,
        pendingReconciliations: pending,
        totalVariance,
        averageVariance,
        accountsReconciled,
        suppliersReconciled: 0 // This would need additional logic to track
      };
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new ReconciliationError(
        'Failed to get reconciliation summary',
        { originalError: error }
      );
    }
  }

  // Private helper methods

  private static async generateReportNumber(): Promise<string> {
    try {
      const { data } = await supabase.rpc('generate_reconciliation_report_number');
      return data || `RECON-${new Date().getFullYear()}-${Date.now()}`;
    } catch (error) {
      return `RECON-${new Date().getFullYear()}-${Date.now()}`;
    }
  }

  private static async calculateBookBalance(
    accountId: string,
    period: AccountingPeriod
  ): Promise<number> {
    try {
      // Get all journal entry lines for this account in the period
      const { data: lines, error } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          journal_entry:journal_entries!inner(date, status)
        `)
        .eq('account_id', accountId)
        .eq('journal_entry.status', 'approved')
        .gte('journal_entry.date', period.startDate)
        .lte('journal_entry.date', period.endDate);

      if (error) {
        throw new ReconciliationError(
          'Failed to calculate book balance',
          { databaseError: error }
        );
      }

      // Calculate balance
      let balance = 0;
      for (const line of lines || []) {
        balance += line.debit_amount - line.credit_amount;
      }

      return balance;
    } catch (error) {
      throw new ReconciliationError(
        'Failed to calculate book balance',
        { originalError: error }
      );
    }
  }

  private static async calculateSupplierBookBalance(
    supplierId: string,
    period: AccountingPeriod
  ): Promise<number> {
    try {
      // Get all invoices for supplier in period
      const { data: invoices, error: invoicesError } = await supabase
        .from('supplier_invoices')
        .select('total_amount')
        .eq('supplier_id', supplierId)
        .gte('invoice_date', period.startDate)
        .lte('invoice_date', period.endDate);

      // Get all payments for supplier in period
      const { data: payments, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select('payment_amount')
        .eq('supplier_id', supplierId)
        .gte('payment_date', period.startDate)
        .lte('payment_date', period.endDate);

      if (invoicesError || paymentsError) {
        throw new ReconciliationError(
          'Failed to calculate supplier book balance',
          { invoicesError, paymentsError }
        );
      }

      const totalInvoices = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
      const totalPayments = payments?.reduce((sum, pay) => sum + pay.payment_amount, 0) || 0;

      return totalInvoices - totalPayments;
    } catch (error) {
      throw new ReconciliationError(
        'Failed to calculate supplier book balance',
        { originalError: error }
      );
    }
  }

  private static async detectSupplierDiscrepancies(
    supplierId: string,
    period: AccountingPeriod,
    supplierBalance: number,
    bookBalance: number
  ): Promise<SupplierDiscrepancy[]> {
    const discrepancies: SupplierDiscrepancy[] = [];

    // Check for balance difference
    const balanceDifference = Math.abs(supplierBalance - bookBalance);
    if (balanceDifference > 0.01) {
      discrepancies.push({
        type: 'amount_difference',
        description: `Balance difference: Supplier shows ${supplierBalance}, books show ${bookBalance}`,
        supplierAmount: supplierBalance,
        bookAmount: bookBalance,
        severity: balanceDifference > 1000 ? 'high' : balanceDifference > 100 ? 'medium' : 'low'
      });
    }

    // Additional discrepancy detection logic would go here
    // This could include checking for missing invoices, payments, etc.

    return discrepancies;
  }

  private static async updateReconciledBalance(reconciliationId: string): Promise<void> {
    try {
      // Get reconciliation
      const { data: reconciliation } = await supabase
        .from('reconciliation_reports')
        .select('book_balance, statement_balance')
        .eq('id', reconciliationId)
        .single();

      if (!reconciliation) return;

      // Get all reconciliation items
      const { data: items } = await supabase
        .from('reconciliation_items')
        .select('amount, type, is_reconciled')
        .eq('reconciliation_id', reconciliationId);

      // Get all adjustments
      const { data: adjustments } = await supabase
        .from('reconciliation_adjustments')
        .select('amount, type')
        .eq('reconciliation_id', reconciliationId);

      // Calculate reconciled balance
      let reconciledBalance = reconciliation.book_balance;

      // Apply reconciliation items
      for (const item of items || []) {
        if (item.is_reconciled) {
          if (item.type === 'outstanding_check' || item.type === 'bank_charge') {
            reconciledBalance -= item.amount;
          } else {
            reconciledBalance += item.amount;
          }
        }
      }

      // Apply adjustments
      for (const adjustment of adjustments || []) {
        if (adjustment.type === 'debit') {
          reconciledBalance += adjustment.amount;
        } else {
          reconciledBalance -= adjustment.amount;
        }
      }

      // Calculate new variance
      const variance = Math.abs(reconciledBalance - reconciliation.statement_balance);

      // Update reconciliation
      await supabase
        .from('reconciliation_reports')
        .update({
          reconciled_balance: reconciledBalance,
          variance: variance
        })
        .eq('id', reconciliationId);
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error('Failed to update reconciled balance:', error);
    }
  }

  private static async getAdjustmentOffsetAccountId(): Promise<string> {
    // This should be configurable, but for now return a default adjustment account
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('account_code', 'RECONCILIATION_ADJUSTMENTS')
      .eq('is_active', true)
      .single();

    return account?.id || 'default-adjustment-account';
  }

  private static mapToReconciliationReport(
    reconciliation: any,
    account: any,
    items: any[],
    adjustments: any[]
  ): ReconciliationReport {
    return {
      id: reconciliation.id,
      reportNumber: reconciliation.report_number,
      period: {
        startDate: reconciliation.period_start,
        endDate: reconciliation.period_end,
        fiscalYear: new Date(reconciliation.period_start).getFullYear()
      },
      accountId: reconciliation.account_id,
      account: {
        id: account.id,
        code: account.account_code,
        name: account.account_name,
        type: account.account_type,
        category: account.account_category,
        parentId: account.parent_id,
        balance: account.balance || 0,
        isActive: account.is_active,
        description: account.description,
        createdAt: account.created_at,
        updatedAt: account.updated_at
      },
      bookBalance: reconciliation.book_balance,
      statementBalance: reconciliation.statement_balance,
      reconciliationItems: items.map(item => this.mapToReconciliationItem(item)),
      adjustments: adjustments.map(adj => this.mapToReconciliationAdjustment(adj)),
      reconciledBalance: reconciliation.reconciled_balance,
      variance: reconciliation.variance,
      status: reconciliation.status,
      reconciledBy: reconciliation.reconciled_by,
      reconciledAt: reconciliation.reconciled_at,
      reviewedBy: reconciliation.reviewed_by,
      reviewedAt: reconciliation.reviewed_at,
      notes: reconciliation.notes,
      createdAt: reconciliation.created_at,
      updatedAt: reconciliation.updated_at
    };
  }

  private static mapToReconciliationItem(item: any): ReconciliationItem {
    return {
      id: item.id,
      reconciliationId: item.reconciliation_id,
      transactionId: item.transaction_id,
      description: item.description,
      amount: item.amount,
      type: item.type,
      isReconciled: item.is_reconciled,
      reconciledDate: item.reconciled_date,
      notes: item.notes
    };
  }

  private static mapToReconciliationAdjustment(adjustment: any): ReconciliationAdjustment {
    return {
      id: adjustment.id,
      reconciliationId: adjustment.reconciliation_id,
      journalEntryId: adjustment.journal_entry_id,
      description: adjustment.description,
      amount: adjustment.amount,
      type: adjustment.type,
      reason: adjustment.reason,
      createdAt: adjustment.created_at
    };
  }
}

export default ReconciliationService;