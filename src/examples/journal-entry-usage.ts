/**
 * Journal Entry Service Usage Examples
 * 
 * This file demonstrates how to use the JournalEntryService for various scenarios
 * including supplier invoices, payments, manual entries, and reversals.
 */

import { JournalEntryService, CreateJournalEntryData } from '@/services/journalEntryService';
import type { SupplierInvoice, SupplierPayment } from '@/types/supplier';
import type { JournalEntry } from '@/types/accounting';

// Example 1: Create a manual journal entry
export async function createManualJournalEntry(): Promise<JournalEntry> {
  const entryData: CreateJournalEntryData = {
    date: '2024-01-15',
    description: 'Office supplies purchase',
    reference: 'REF-001',
    sourceType: 'manual',
    lines: [
      {
        accountId: 'office-supplies-expense-account-id',
        description: 'Office supplies - stationery and materials',
        debitAmount: 500.00,
        creditAmount: 0,
        reference: 'INV-12345'
      },
      {
        accountId: 'vat-input-account-id',
        description: 'VAT on office supplies',
        debitAmount: 35.00,
        creditAmount: 0,
        reference: 'INV-12345'
      },
      {
        accountId: 'accounts-payable-account-id',
        description: 'Amount owed to Office Depot',
        debitAmount: 0,
        creditAmount: 535.00,
        reference: 'INV-12345'
      }
    ]
  };

  try {
    const journalEntry = await JournalEntryService.createJournalEntry(entryData, 'user-123');
    console.log('Manual journal entry created:', journalEntry.entryNumber);
    return journalEntry;
  } catch (error) {
    console.error('Failed to create manual journal entry:', error);
    throw error;
  }
}

// Example 2: Create journal entry from supplier invoice
export async function createJournalEntryFromInvoice(invoice: SupplierInvoice): Promise<JournalEntry> {
  try {
    const journalEntry = await JournalEntryService.createFromSupplierInvoice(invoice, 'user-123');
    console.log(`Journal entry ${journalEntry.entryNumber} created for invoice ${invoice.invoiceNumber}`);
    return journalEntry;
  } catch (error) {
    console.error('Failed to create journal entry from invoice:', error);
    throw error;
  }
}

// Example 3: Create journal entry from supplier payment
export async function createJournalEntryFromPayment(payment: SupplierPayment): Promise<JournalEntry> {
  try {
    const journalEntry = await JournalEntryService.createFromSupplierPayment(payment, 'user-123');
    console.log(`Journal entry ${journalEntry.entryNumber} created for payment ${payment.paymentNumber}`);
    return journalEntry;
  } catch (error) {
    console.error('Failed to create journal entry from payment:', error);
    throw error;
  }
}

// Example 4: Post a journal entry (approve it)
export async function postJournalEntry(entryId: string): Promise<JournalEntry> {
  try {
    const postedEntry = await JournalEntryService.postJournalEntry(entryId, 'manager-456');
    console.log(`Journal entry ${postedEntry.entryNumber} has been posted`);
    return postedEntry;
  } catch (error) {
    console.error('Failed to post journal entry:', error);
    throw error;
  }
}

// Example 5: Reverse a journal entry
export async function reverseJournalEntry(entryId: string, reason: string): Promise<JournalEntry> {
  try {
    const reversalEntry = await JournalEntryService.reverseJournalEntry(entryId, reason, 'manager-456');
    console.log(`Reversal entry ${reversalEntry.entryNumber} created`);
    return reversalEntry;
  } catch (error) {
    console.error('Failed to reverse journal entry:', error);
    throw error;
  }
}

// Example 6: Validate journal entry before creation
export async function validateJournalEntryExample(): Promise<void> {
  const entryData: CreateJournalEntryData = {
    date: '2024-01-15',
    description: 'Test entry for validation',
    lines: [
      {
        accountId: 'cash-account-id',
        description: 'Cash received',
        debitAmount: 1000,
        creditAmount: 0
      },
      {
        accountId: 'revenue-account-id',
        description: 'Service revenue',
        debitAmount: 0,
        creditAmount: 1000
      }
    ]
  };

  try {
    const validation = await JournalEntryService.validateJournalEntry(entryData);
    
    if (validation.isValid) {
      console.log('Journal entry is valid and ready to create');
      if (validation.warnings.length > 0) {
        console.warn('Warnings:', validation.warnings);
      }
    } else {
      console.error('Journal entry validation failed:', validation.errors);
    }
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

// Example 7: Get journal entries with filtering
export async function getJournalEntriesExample(): Promise<void> {
  try {
    // Get all draft entries
    const draftEntries = await JournalEntryService.getJournalEntries({
      status: 'draft',
      limit: 20
    });
    console.log(`Found ${draftEntries.total} draft entries`);

    // Get entries for a specific date range
    const dateRangeEntries = await JournalEntryService.getJournalEntries({
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      limit: 50
    });
    console.log(`Found ${dateRangeEntries.total} entries in January 2024`);

    // Search entries by description
    const searchResults = await JournalEntryService.getJournalEntries({
      search: 'office supplies',
      limit: 10
    });
    console.log(`Found ${searchResults.total} entries matching "office supplies"`);

  } catch (error) {
    console.error('Error fetching journal entries:', error);
  }
}

// Example 8: Complete workflow - Invoice to Payment with Journal Entries
export async function completeInvoicePaymentWorkflow(
  invoice: SupplierInvoice,
  payment: SupplierPayment
): Promise<{ invoiceEntry: JournalEntry; paymentEntry: JournalEntry }> {
  try {
    // Step 1: Create journal entry for the invoice
    console.log('Creating journal entry for invoice...');
    const invoiceEntry = await JournalEntryService.createFromSupplierInvoice(invoice, 'user-123');
    
    // Step 2: Post the invoice journal entry
    console.log('Posting invoice journal entry...');
    await JournalEntryService.postJournalEntry(invoiceEntry.id, 'manager-456');
    
    // Step 3: Create journal entry for the payment
    console.log('Creating journal entry for payment...');
    const paymentEntry = await JournalEntryService.createFromSupplierPayment(payment, 'user-123');
    
    // Step 4: Post the payment journal entry
    console.log('Posting payment journal entry...');
    await JournalEntryService.postJournalEntry(paymentEntry.id, 'manager-456');
    
    console.log('Complete workflow finished successfully');
    return { invoiceEntry, paymentEntry };
    
  } catch (error) {
    console.error('Error in complete workflow:', error);
    throw error;
  }
}

// Example 9: Error handling and recovery
export async function journalEntryWithErrorHandling(): Promise<void> {
  const entryData: CreateJournalEntryData = {
    date: '2024-01-15',
    description: 'Test entry with error handling',
    lines: [
      {
        accountId: 'invalid-account-id', // This will cause an error
        description: 'Test line',
        debitAmount: 100,
        creditAmount: 0
      }
    ]
  };

  try {
    const journalEntry = await JournalEntryService.createJournalEntry(entryData, 'user-123');
    console.log('Journal entry created successfully:', journalEntry.entryNumber);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Journal entry creation failed:', error.message);
      
      // Handle specific error types
      if (error.name === 'AccountingValidationError') {
        console.log('This is a validation error - check the entry data');
      } else if (error.name === 'JournalEntryCreationError') {
        console.log('This is a creation error - check database connectivity');
      } else if (error.name === 'AccountMappingError') {
        console.log('This is an account mapping error - check account configuration');
      }
      
      // Attempt recovery or alternative action
      console.log('Attempting to create a simpler entry...');
      // ... recovery logic here
    }
  }
}

// Example 10: Batch operations
export async function batchJournalEntryOperations(): Promise<void> {
  const entries: CreateJournalEntryData[] = [
    {
      date: '2024-01-15',
      description: 'Batch entry 1',
      lines: [
        { accountId: 'cash-id', debitAmount: 100, creditAmount: 0, description: 'Cash' },
        { accountId: 'revenue-id', debitAmount: 0, creditAmount: 100, description: 'Revenue' }
      ]
    },
    {
      date: '2024-01-16',
      description: 'Batch entry 2',
      lines: [
        { accountId: 'expense-id', debitAmount: 50, creditAmount: 0, description: 'Expense' },
        { accountId: 'cash-id', debitAmount: 0, creditAmount: 50, description: 'Cash' }
      ]
    }
  ];

  const results: JournalEntry[] = [];
  const errors: Error[] = [];

  for (const entryData of entries) {
    try {
      const journalEntry = await JournalEntryService.createJournalEntry(entryData, 'user-123');
      results.push(journalEntry);
      console.log(`Created journal entry: ${journalEntry.entryNumber}`);
    } catch (error) {
      errors.push(error as Error);
      console.error(`Failed to create entry: ${entryData.description}`, error);
    }
  }

  console.log(`Batch operation completed: ${results.length} successful, ${errors.length} failed`);
}

// Example usage in a React component or service
export const JournalEntryExamples = {
  createManualJournalEntry,
  createJournalEntryFromInvoice,
  createJournalEntryFromPayment,
  postJournalEntry,
  reverseJournalEntry,
  validateJournalEntryExample,
  getJournalEntriesExample,
  completeInvoicePaymentWorkflow,
  journalEntryWithErrorHandling,
  batchJournalEntryOperations
};

export default JournalEntryExamples;