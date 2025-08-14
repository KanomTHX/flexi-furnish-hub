import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JournalEntryService, CreateJournalEntryData } from '@/services/journalEntryService';
import { supabase } from '@/integrations/supabase/client';
import { 
  AccountingValidationError,
  JournalEntryCreationError,
  JournalEntryPostingError,
  AccountMappingError
} from '@/errors/accounting';
import type { SupplierInvoice, SupplierPayment } from '@/types/supplier';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('JournalEntryService', () => {
  const mockSupabaseFrom = vi.mocked(supabase.from);
  const mockSupabaseRpc = vi.mocked(supabase.rpc);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createJournalEntry', () => {
    const validEntryData: CreateJournalEntryData = {
      date: '2024-01-15',
      description: 'Test journal entry',
      reference: 'TEST-001',
      sourceType: 'manual',
      lines: [
        {
          accountId: 'acc-1',
          description: 'Debit entry',
          debitAmount: 1000,
          creditAmount: 0
        },
        {
          accountId: 'acc-2',
          description: 'Credit entry',
          debitAmount: 0,
          creditAmount: 1000
        }
      ]
    };

    it('should create a journal entry successfully', async () => {
      // Mock account validation for both accounts in the entry
      const mockAccountValidation = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'acc-1', is_active: true }
            })
          })
        })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockAccountValidation as any)
        .mockReturnValueOnce(mockAccountValidation as any);

      // Mock entry number generation
      mockSupabaseRpc.mockResolvedValue({ data: 'JE-2024-001' });

      // Mock journal entry creation
      const mockJournalEntry = {
        id: 'je-1',
        entry_number: 'JE-2024-001',
        date: '2024-01-15',
        description: 'Test journal entry',
        reference: 'TEST-001',
        total_debit: 1000,
        total_credit: 1000,
        status: 'draft',
        source_type: 'manual',
        source_id: null,
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockJournalEntry,
              error: null
            })
          })
        })
      } as any);

      // Mock journal entry lines creation
      const mockLines = [
        {
          id: 'line-1',
          journal_entry_id: 'je-1',
          account_id: 'acc-1',
          description: 'Debit entry',
          debit_amount: 1000,
          credit_amount: 0,
          reference: null,
          account: {
            id: 'acc-1',
            account_code: 'CASH',
            account_name: 'Cash Account',
            account_type: 'asset',
            account_category: 'current_asset',
            parent_id: null,
            balance: 0,
            is_active: true,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 'line-2',
          journal_entry_id: 'je-1',
          account_id: 'acc-2',
          description: 'Credit entry',
          debit_amount: 0,
          credit_amount: 1000,
          reference: null,
          account: {
            id: 'acc-2',
            account_code: 'REVENUE',
            account_name: 'Revenue Account',
            account_type: 'revenue',
            account_category: 'sales_revenue',
            parent_id: null,
            balance: 0,
            is_active: true,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockLines,
            error: null
          })
        })
      } as any);

      const result = await JournalEntryService.createJournalEntry(validEntryData, 'user-1');

      expect(result).toMatchObject({
        id: 'je-1',
        entryNumber: 'JE-2024-001',
        description: 'Test journal entry',
        totalDebit: 1000,
        totalCredit: 1000,
        status: 'draft'
      });
      expect(result.entries).toHaveLength(2);
    });

    it('should throw validation error for invalid entry data', async () => {
      const invalidEntryData: CreateJournalEntryData = {
        date: '2024-01-15',
        description: '',
        lines: [
          {
            accountId: 'acc-1',
            description: 'Debit entry',
            debitAmount: 1000,
            creditAmount: 500 // Invalid: both debit and credit
          }
        ]
      };

      await expect(
        JournalEntryService.createJournalEntry(invalidEntryData, 'user-1')
      ).rejects.toThrow(AccountingValidationError);
    });

    it('should throw error when journal entry creation fails', async () => {
      // Mock validation to pass - need to mock both accounts
      const mockAccountValidation = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'acc-1', is_active: true }
            })
          })
        })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockAccountValidation as any)
        .mockReturnValueOnce(mockAccountValidation as any);

      mockSupabaseRpc.mockResolvedValue({ data: 'JE-2024-001' });

      // Mock journal entry creation failure
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      await expect(
        JournalEntryService.createJournalEntry(validEntryData, 'user-1')
      ).rejects.toThrow(JournalEntryCreationError);
    });
  });

  describe('createFromSupplierInvoice', () => {
    const mockInvoice: SupplierInvoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      supplierId: 'sup-1',
      supplier: {
        id: 'sup-1',
        supplierCode: 'SUP001',
        supplierName: 'Test Supplier',
        paymentTerms: 30,
        creditLimit: 100000,
        currentBalance: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      invoiceDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-14'),
      subtotal: 1000,
      taxAmount: 70,
      discountAmount: 0,
      totalAmount: 1070,
      paidAmount: 0,
      remainingAmount: 1070,
      status: 'pending',
      paymentTerms: 30,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create journal entry from supplier invoice', async () => {
      // Mock account lookups
      const mockAccountLookup = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'acc-expense' }
              })
            })
          })
        })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockAccountLookup as any) // EXPENSE account
        .mockReturnValueOnce(mockAccountLookup as any) // VAT_INPUT account
        .mockReturnValueOnce(mockAccountLookup as any); // ACCOUNTS_PAYABLE account

      // Mock validation for each account (3 accounts)
      const mockAccountValidation = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'acc-1', is_active: true }
            })
          })
        })
      };

      for (let i = 0; i < 3; i++) {
        mockSupabaseFrom.mockReturnValueOnce(mockAccountValidation as any);
      }

      // Mock entry number generation
      mockSupabaseRpc.mockResolvedValue({ data: 'JE-2024-001' });

      // Mock journal entry creation
      const mockJournalEntry = {
        id: 'je-1',
        entry_number: 'JE-2024-001',
        date: '2024-01-15',
        description: 'Supplier Invoice INV-001',
        reference: 'INV-001',
        total_debit: 1070,
        total_credit: 1070,
        status: 'draft',
        source_type: 'supplier_invoice',
        source_id: 'inv-1',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockJournalEntry,
              error: null
            })
          })
        })
      } as any);

      // Mock journal entry lines creation
      const mockLines = [
        {
          id: 'line-1',
          journal_entry_id: 'je-1',
          account_id: 'acc-expense',
          description: 'Purchase from Test Supplier',
          debit_amount: 1000,
          credit_amount: 0,
          reference: 'INV-001',
          account: {
            id: 'acc-expense',
            account_code: 'EXPENSE',
            account_name: 'Expense Account',
            account_type: 'expense',
            account_category: 'operating_expense',
            parent_id: null,
            balance: 0,
            is_active: true,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockLines,
            error: null
          })
        })
      } as any);

      // Mock invoice update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      } as any);

      const result = await JournalEntryService.createFromSupplierInvoice(mockInvoice, 'user-1');

      expect(result).toMatchObject({
        id: 'je-1',
        entryNumber: 'JE-2024-001',
        description: 'Supplier Invoice INV-001',
        totalDebit: 1070,
        totalCredit: 1070
      });
    });

    it('should throw error when required accounts are not found', async () => {
      // Mock account lookup failure
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null
              })
            })
          })
        })
      } as any);

      await expect(
        JournalEntryService.createFromSupplierInvoice(mockInvoice, 'user-1')
      ).rejects.toThrow(AccountMappingError);
    });
  });

  describe('validateJournalEntry', () => {
    it('should validate a correct journal entry', async () => {
      const validEntry: CreateJournalEntryData = {
        date: '2024-01-15',
        description: 'Test entry',
        lines: [
          {
            accountId: 'acc-1',
            description: 'Debit line',
            debitAmount: 1000,
            creditAmount: 0
          },
          {
            accountId: 'acc-2',
            description: 'Credit line',
            debitAmount: 0,
            creditAmount: 1000
          }
        ]
      };

      // Mock account validation
      const mockAccountValidation = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'acc-1', is_active: true }
            })
          })
        })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockAccountValidation as any)
        .mockReturnValueOnce(mockAccountValidation as any);

      const result = await JournalEntryService.validateJournalEntry(validEntry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidEntry: CreateJournalEntryData = {
        date: '',
        description: '',
        lines: [
          {
            accountId: '',
            description: 'Invalid line',
            debitAmount: 1000,
            creditAmount: 500 // Both debit and credit
          }
        ]
      };

      const result = await JournalEntryService.validateJournalEntry(invalidEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Date is required');
      expect(result.errors).toContain('At least two journal entry lines are required');
    });

    it('should detect unbalanced entries', async () => {
      const unbalancedEntry: CreateJournalEntryData = {
        date: '2024-01-15',
        description: 'Unbalanced entry',
        lines: [
          {
            accountId: 'acc-1',
            description: 'Debit line',
            debitAmount: 1000,
            creditAmount: 0
          },
          {
            accountId: 'acc-2',
            description: 'Credit line',
            debitAmount: 0,
            creditAmount: 500 // Unbalanced
          }
        ]
      };

      // Mock account validation
      const mockAccountValidation = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'acc-1', is_active: true }
            })
          })
        })
      };

      mockSupabaseFrom
        .mockReturnValueOnce(mockAccountValidation as any)
        .mockReturnValueOnce(mockAccountValidation as any);

      const result = await JournalEntryService.validateJournalEntry(unbalancedEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total debits (1000) must equal total credits (500)');
    });
  });
});