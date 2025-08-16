import { supabase } from '@/integrations/supabase/client';
import type { 
  JournalEntry, 
  JournalEntryLine, 
  JournalEntryStatus,
  Account 
} from '@/types/accounting';
import type { 
  SupplierInvoice, 
  SupplierPayment 
} from '@/types/supplier';
import { 
  JournalEntryCreationError, 
  JournalEntryPostingError, 
  AccountMappingError,
  AccountingValidationError,
  AccountingError
} from '@/errors/accounting';

export interface CreateJournalEntryData {
  date: string;
  description: string;
  reference?: string;
  sourceType?: 'supplier_invoice' | 'supplier_payment' | 'manual' | 'adjustment';
  sourceId?: string;
  lines: CreateJournalEntryLineData[];
}

export interface CreateJournalEntryLineData {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  reference?: string;
}

export interface JournalEntryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface JournalEntryFilter {
  status?: JournalEntryStatus;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  createdBy?: string;
  sourceType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class JournalEntryService {
  /**
   * Create a new journal entry
   */
  static async createJournalEntry(
    entryData: CreateJournalEntryData,
    createdBy: string
  ): Promise<JournalEntry> {
    try {
      // Validate the journal entry
      const validation = await this.validateJournalEntry(entryData);
      if (!validation.isValid) {
        throw new AccountingValidationError(
          `Journal entry validation failed: ${validation.errors.join(', ')}`,
          { general: validation.errors },
          { warnings: validation.warnings }
        );
      }

      // Generate entry number
      const entryNumber = await this.generateEntryNumber();

      // Calculate totals
      const totalDebit = entryData.lines.reduce((sum, line) => sum + line.debitAmount, 0);
      const totalCredit = entryData.lines.reduce((sum, line) => sum + line.creditAmount, 0);

      // Create journal entry
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          entry_number: entryNumber,
          date: entryData.date,
          description: entryData.description,
          reference: entryData.reference,
          total_debit: totalDebit,
          total_credit: totalCredit,
          status: 'draft',
          source_type: entryData.sourceType || 'manual',
          source_id: entryData.sourceId,
          created_by: createdBy
        }])
        .select()
        .single();

      if (entryError) {
        throw new JournalEntryCreationError(
          'Failed to create journal entry',
          { databaseError: entryError }
        );
      }

      // Create journal entry lines
      const lines = entryData.lines.map(line => ({
        journal_entry_id: entry.id,
        account_id: line.accountId,
        description: line.description || entryData.description,
        debit_amount: line.debitAmount,
        credit_amount: line.creditAmount,
        reference: line.reference
      }));

      const { data: createdLines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines)
        .select(`
          *,
          account:chart_of_accounts(*)
        `);

      if (linesError) {
        // Rollback the journal entry
        await supabase.from('journal_entries').delete().eq('id', entry.id);
        throw new JournalEntryCreationError(
          'Failed to create journal entry lines',
          { databaseError: linesError }
        );
      }

      return this.mapToJournalEntry(entry, createdLines);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new JournalEntryCreationError(
        'Unexpected error creating journal entry',
        { originalError: error }
      );
    }
  }

  /**
   * Create journal entry from supplier invoice
   */
  static async createFromSupplierInvoice(
    invoice: SupplierInvoice,
    createdBy: string
  ): Promise<JournalEntry> {
    try {
      // Get account mappings
      const expenseAccountId = await this.getAccountIdByCode('EXPENSE') || 
                              await this.getAccountIdByCode('INVENTORY');
      const vatInputAccountId = await this.getAccountIdByCode('VAT_INPUT');
      const payableAccountId = await this.getAccountIdByCode('ACCOUNTS_PAYABLE');

      if (!expenseAccountId || !payableAccountId) {
        throw new AccountMappingError(
          'Required accounts not found for invoice journal entry',
          { expenseAccountId, payableAccountId }
        );
      }

      // Create journal entry lines
      const lines: CreateJournalEntryLineData[] = [
        // Dr. Expense/Inventory
        {
          accountId: expenseAccountId,
          description: `Purchase from ${invoice.supplier?.supplierName || 'Supplier'}`,
          debitAmount: invoice.subtotal,
          creditAmount: 0,
          reference: invoice.invoiceNumber
        }
      ];

      // Add VAT input if applicable
      if (invoice.taxAmount > 0 && vatInputAccountId) {
        lines.push({
          accountId: vatInputAccountId,
          description: 'Input VAT',
          debitAmount: invoice.taxAmount,
          creditAmount: 0,
          reference: invoice.invoiceNumber
        });
      }

      // Cr. Accounts Payable
      lines.push({
        accountId: payableAccountId,
        description: `Payable to ${invoice.supplier?.supplierName || 'Supplier'}`,
        debitAmount: 0,
        creditAmount: invoice.totalAmount,
        reference: invoice.invoiceNumber
      });

      const entryData: CreateJournalEntryData = {
        date: invoice.invoiceDate.toISOString().split('T')[0],
        description: `Supplier Invoice ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        sourceType: 'supplier_invoice',
        sourceId: invoice.id,
        lines
      };

      const journalEntry = await this.createJournalEntry(entryData, createdBy);

      // Update invoice with journal entry reference
      await supabase
        .from('supplier_invoices')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', invoice.id);

      return journalEntry;
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new JournalEntryCreationError(
        'Failed to create journal entry from supplier invoice',
        { originalError: error }
      );
    }
  }

  /**
   * Create journal entry from supplier payment
   */
  static async createFromSupplierPayment(
    payment: SupplierPayment,
    createdBy: string
  ): Promise<JournalEntry> {
    try {
      // Get account mappings
      const payableAccountId = await this.getAccountIdByCode('ACCOUNTS_PAYABLE');
      const cashAccountId = this.getPaymentAccountId(payment.paymentMethod);

      if (!payableAccountId || !cashAccountId) {
        throw new AccountMappingError(
          'Required accounts not found for payment journal entry',
          { payableAccountId, cashAccountId, paymentMethod: payment.paymentMethod }
        );
      }

      const lines: CreateJournalEntryLineData[] = [
        // Dr. Accounts Payable
        {
          accountId: payableAccountId,
          description: `Payment to ${payment.supplier?.supplierName || 'Supplier'}`,
          debitAmount: payment.paymentAmount,
          creditAmount: 0,
          reference: payment.paymentNumber
        },
        // Cr. Cash/Bank
        {
          accountId: cashAccountId,
          description: `Payment via ${this.getPaymentMethodDescription(payment.paymentMethod)}`,
          debitAmount: 0,
          creditAmount: payment.paymentAmount,
          reference: payment.paymentNumber
        }
      ];

      const entryData: CreateJournalEntryData = {
        date: payment.paymentDate.toISOString().split('T')[0],
        description: `Supplier Payment ${payment.paymentNumber}`,
        reference: payment.paymentNumber,
        sourceType: 'supplier_payment',
        sourceId: payment.id,
        lines
      };

      const journalEntry = await this.createJournalEntry(entryData, createdBy);

      // Update payment with journal entry reference
      await supabase
        .from('supplier_payments')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', payment.id);

      return journalEntry;
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new JournalEntryCreationError(
        'Failed to create journal entry from supplier payment',
        { originalError: error }
      );
    }
  }

  /**
   * Post a journal entry (change status from draft to approved)
   */
  static async postJournalEntry(
    entryId: string,
    approvedBy: string
  ): Promise<JournalEntry> {
    try {
      // Get the journal entry
      const entry = await this.getJournalEntryById(entryId);
      if (!entry) {
        throw new JournalEntryPostingError(
          'Journal entry not found',
          { entryId }
        );
      }

      if (entry.status !== 'draft') {
        throw new JournalEntryPostingError(
          `Cannot post journal entry with status: ${entry.status}`,
          { currentStatus: entry.status }
        );
      }

      // Validate before posting
      const validation = await this.validateJournalEntryById(entryId);
      if (!validation.isValid) {
        throw new AccountingValidationError(
          `Cannot post invalid journal entry: ${validation.errors.join(', ')}`,
          { general: validation.errors }
        );
      }

      // Update status to approved
      const { data: updatedEntry, error } = await supabase
        .from('journal_entries')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new JournalEntryPostingError(
          'Failed to post journal entry',
          { databaseError: error }
        );
      }

      // Get updated entry with lines
      return await this.getJournalEntryById(entryId) as JournalEntry;
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new JournalEntryPostingError(
        'Unexpected error posting journal entry',
        { originalError: error }
      );
    }
  }

  /**
   * Reverse a journal entry
   */
  static async reverseJournalEntry(
    entryId: string,
    reason: string,
    reversedBy: string
  ): Promise<JournalEntry> {
    try {
      // Get the original journal entry
      const originalEntry = await this.getJournalEntryById(entryId);
      if (!originalEntry) {
        throw new JournalEntryPostingError(
          'Journal entry not found',
          { entryId }
        );
      }

      if (originalEntry.status !== 'approved') {
        throw new JournalEntryPostingError(
          'Can only reverse approved journal entries',
          { currentStatus: originalEntry.status }
        );
      }

      // Create reversal entry with opposite amounts
      const reversalLines: CreateJournalEntryLineData[] = originalEntry.entries.map(line => ({
        accountId: line.accountId,
        description: `Reversal: ${line.description}`,
        debitAmount: line.creditAmount, // Swap debit and credit
        creditAmount: line.debitAmount,
        reference: `REV-${originalEntry.entryNumber}`
      }));

      const reversalData: CreateJournalEntryData = {
        date: new Date().toISOString().split('T')[0],
        description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
        reference: `REV-${originalEntry.entryNumber}`,
        sourceType: 'adjustment',
        sourceId: entryId,
        lines: reversalLines
      };

      // Create the reversal entry
      const reversalEntry = await this.createJournalEntry(reversalData, reversedBy);
      
      // Post the reversal entry immediately
      await this.postJournalEntry(reversalEntry.id, reversedBy);

      // Update original entry status to reversed
      await supabase
        .from('journal_entries')
        .update({
          status: 'rejected', // Using rejected as reversed status
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      return reversalEntry;
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new JournalEntryPostingError(
        'Failed to reverse journal entry',
        { originalError: error }
      );
    }
  }

  /**
   * Get journal entry by ID
   */
  static async getJournalEntryById(entryId: string): Promise<JournalEntry | null> {
    try {
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (entryError || !entry) {
        return null;
      }

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          account:chart_of_accounts(*)
        `)
        .eq('journal_entry_id', entryId);

      if (linesError) {
        throw new AccountingError(
          'Failed to fetch journal entry lines',
          'DATABASE_ERROR',
          500,
          { databaseError: linesError }
        );
      }

      return this.mapToJournalEntry(entry, lines || []);
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new AccountingError(
        'Failed to get journal entry',
        'UNKNOWN_ERROR',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get journal entries with filtering
   */
  static async getJournalEntries(filter: JournalEntryFilter = {}): Promise<{
    data: JournalEntry[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('journal_entries')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.dateFrom) {
        query = query.gte('date', filter.dateFrom);
      }
      if (filter.dateTo) {
        query = query.lte('date', filter.dateTo);
      }
      if (filter.createdBy) {
        query = query.eq('created_by', filter.createdBy);
      }
      if (filter.sourceType) {
        query = query.eq('source_type', filter.sourceType);
      }
      if (filter.search) {
        query = query.or(`description.ilike.%${filter.search}%,entry_number.ilike.%${filter.search}%,reference.ilike.%${filter.search}%`);
      }

      // Apply pagination
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      // Order by date descending
      query = query.order('date', { ascending: false });

      const { data: entries, error, count } = await query;

      if (error) {
        throw new AccountingError(
          'Failed to fetch journal entries',
          'DATABASE_ERROR',
          500,
          { databaseError: error }
        );
      }

      // Get lines for each entry
      const entriesWithLines = await Promise.all(
        (entries || []).map(async (entry) => {
          const { data: lines } = await supabase
            .from('journal_entry_lines')
            .select(`
              *,
              account:chart_of_accounts(*)
            `)
            .eq('journal_entry_id', entry.id);

          return this.mapToJournalEntry(entry, lines || []);
        })
      );

      return {
        data: entriesWithLines,
        total: count || 0
      };
    } catch (error) {
      if (error instanceof AccountingError) {
        throw error;
      }
      throw new AccountingError(
        'Failed to get journal entries',
        'UNKNOWN_ERROR',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Validate journal entry data
   */
  static async validateJournalEntry(entryData: CreateJournalEntryData): Promise<JournalEntryValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!entryData.description?.trim()) {
        errors.push('Description is required');
      }

      if (!entryData.date) {
        errors.push('Date is required');
      }

      if (!entryData.lines || entryData.lines.length === 0) {
        errors.push('At least one journal entry line is required');
      }

      if (entryData.lines && entryData.lines.length < 2) {
        errors.push('At least two journal entry lines are required');
      }

      // Validate lines
      if (entryData.lines) {
        for (let i = 0; i < entryData.lines.length; i++) {
          const line = entryData.lines[i];
          
          if (!line.accountId) {
            errors.push(`Line ${i + 1}: Account is required`);
          }

          if (line.debitAmount < 0 || line.creditAmount < 0) {
            errors.push(`Line ${i + 1}: Amounts cannot be negative`);
          }

          if (line.debitAmount > 0 && line.creditAmount > 0) {
            errors.push(`Line ${i + 1}: Cannot have both debit and credit amounts`);
          }

          if (line.debitAmount === 0 && line.creditAmount === 0) {
            errors.push(`Line ${i + 1}: Must have either debit or credit amount`);
          }

          // Validate account exists
          if (line.accountId) {
            const { data: account } = await supabase
              .from('chart_of_accounts')
              .select('id, is_active')
              .eq('id', line.accountId)
              .single();

            if (!account) {
              errors.push(`Line ${i + 1}: Account not found`);
            } else if (!account.is_active) {
              warnings.push(`Line ${i + 1}: Account is inactive`);
            }
          }
        }

        // Check if debits equal credits
        const totalDebits = entryData.lines.reduce((sum, line) => sum + line.debitAmount, 0);
        const totalCredits = entryData.lines.reduce((sum, line) => sum + line.creditAmount, 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small rounding differences
          errors.push(`Total debits (${totalDebits}) must equal total credits (${totalCredits})`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation error occurred'],
        warnings: []
      };
    }
  }

  /**
   * Validate existing journal entry by ID
   */
  static async validateJournalEntryById(entryId: string): Promise<JournalEntryValidationResult> {
    try {
      const entry = await this.getJournalEntryById(entryId);
      if (!entry) {
        return {
          isValid: false,
          errors: ['Journal entry not found'],
          warnings: []
        };
      }

      const entryData: CreateJournalEntryData = {
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        lines: entry.entries.map(line => ({
          accountId: line.accountId,
          description: line.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          reference: line.reference
        }))
      };

      return await this.validateJournalEntry(entryData);
    } catch (error) {
      return {
        isValid: false,
        errors: ['Error validating journal entry'],
        warnings: []
      };
    }
  }

  // Private helper methods

  private static async generateEntryNumber(): Promise<string> {
    try {
      const { data } = await supabase.rpc('generate_journal_entry_number');
      return data || `JE-${new Date().getFullYear()}-${Date.now()}`;
    } catch (error) {
      return `JE-${new Date().getFullYear()}-${Date.now()}`;
    }
  }

  private static async getAccountIdByCode(accountCode: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('account_code', accountCode)
        .eq('is_active', true)
        .single();

      return data?.id || null;
    } catch (error) {
      return null;
    }
  }

  private static getPaymentAccountId(paymentMethod: string): string | null {
    // This should be configurable, but for now we'll use hardcoded mappings
    const accountMappings: Record<string, string> = {
      'cash': 'CASH',
      'bank_transfer': 'BANK',
      'check': 'BANK',
      'credit_card': 'CREDIT_CARD',
      'ach': 'BANK',
      'wire_transfer': 'BANK',
      'digital_wallet': 'DIGITAL_WALLET'
    };

    const accountCode = accountMappings[paymentMethod];
    if (!accountCode) return null;

    // In a real implementation, this would be async and look up the actual account ID
    // For now, return the account code as a placeholder
    return accountCode;
  }

  private static getPaymentMethodDescription(paymentMethod: string): string {
    const descriptions: Record<string, string> = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'check': 'Check',
      'credit_card': 'Credit Card',
      'ach': 'ACH Transfer',
      'wire_transfer': 'Wire Transfer',
      'digital_wallet': 'Digital Wallet'
    };

    return descriptions[paymentMethod] || paymentMethod;
  }

  private static mapToJournalEntry(entry: any, lines: any[]): JournalEntry {
    return {
      id: entry.id,
      entryNumber: entry.entry_number,
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      totalDebit: entry.total_debit,
      totalCredit: entry.total_credit,
      status: entry.status,
      createdBy: entry.created_by,
      approvedBy: entry.approved_by,
      approvedAt: entry.approved_at,
      entries: lines.map(line => ({
        id: line.id,
        accountId: line.account_id,
        account: line.account ? {
          id: line.account.id,
          code: line.account.account_code,
          name: line.account.account_name,
          type: line.account.account_type,
          category: line.account.account_category,
          parentId: line.account.parent_id,
          balance: line.account.balance || 0,
          isActive: line.account.is_active,
          description: line.account.description,
          createdAt: line.account.created_at,
          updatedAt: line.account.updated_at
        } : {
          id: line.account_id,
          code: 'UNKNOWN',
          name: 'Unknown Account',
          type: 'asset',
          category: 'current_asset',
          balance: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        description: line.description,
        debitAmount: line.debit_amount,
        creditAmount: line.credit_amount,
        reference: line.reference
      })),
      lines: lines.map(line => ({
        id: line.id,
        accountId: line.account_id,
        account: line.account ? {
          id: line.account.id,
          code: line.account.account_code,
          name: line.account.account_name,
          type: line.account.account_type,
          category: line.account.account_category,
          parentId: line.account.parent_id,
          balance: line.account.balance || 0,
          isActive: line.account.is_active,
          description: line.account.description,
          createdAt: line.account.created_at,
          updatedAt: line.account.updated_at
        } : {
          id: line.account_id,
          code: 'UNKNOWN',
          name: 'Unknown Account',
          type: 'asset',
          category: 'current_asset',
          balance: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        description: line.description,
        debitAmount: line.debit_amount,
        creditAmount: line.credit_amount,
        reference: line.reference
      })),
      attachments: [],
      createdAt: entry.created_at,
      updatedAt: entry.updated_at
    };
  }
}

export default JournalEntryService;