import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReconciliationService } from '@/services/reconciliationService';
import { supabase } from '@/integrations/supabase/client';
import { ReconciliationError, AccountingValidationError } from '@/errors/accounting';
import type { 
  ReconciliationReport, 
  ReconciliationItem, 
  ReconciliationAdjustment,
  Account,
  AccountingPeriod
} from '@/types/accounting';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

// Mock JournalEntryService
vi.mock('@/services/journalEntryService', () => ({
  JournalEntryService: {
    createJournalEntry: vi.fn(),
    postJournalEntry: vi.fn()
  }
}));

describe('ReconciliationService', () => {
  const mockAccount: Account = {
    id: 'account-1',
    code: 'CASH',
    name: 'Cash Account',
    type: 'asset',
    category: 'current_asset',
    balance: 10000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockPeriod: AccountingPeriod = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    fiscalYear: 2024
  };

  const mockReconciliationData = {
    accountId: 'account-1',
    period: mockPeriod,
    statementBalance: 9500,
    notes: 'Test reconciliation'
  };

  const mockReconciliation: ReconciliationReport = {
    id: 'recon-1',
    reportNumber: 'RECON-2024-0001',
    period: mockPeriod,
    accountId: 'account-1',
    account: mockAccount,
    bookBalance: 10000,
    statementBalance: 9500,
    reconciliationItems: [],
    adjustments: [],
    reconciledBalance: 10000,
    variance: 500,
    status: 'draft',
    notes: 'Test reconciliation',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createReconciliation', () => {
    it('should create a new reconciliation successfully', async () => {
      // Mock account lookup
      const mockAccountQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAccount,
                error: null
              })
            })
          })
        })
      };

      // Mock book balance calculation
      const mockBookBalanceQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: [
                    { debit_amount: 15000, credit_amount: 5000 }
                  ],
                  error: null
                })
              })
            })
          })
        })
      };

      // Mock reconciliation creation
      const mockReconciliationInsert = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'recon-1',
                report_number: 'RECON-2024-0001',
                period_start: '2024-01-01',
                period_end: '2024-01-31',
                account_id: 'account-1',
                book_balance: 10000,
                statement_balance: 9500,
                reconciled_balance: 10000,
                variance: 500,
                status: 'draft',
                notes: 'Test reconciliation',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              error: null
            })
          })
        })
      };

      // Mock RPC for report number generation
      (supabase.rpc as any).mockResolvedValue({
        data: 'RECON-2024-0001',
        error: null
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockAccountQuery) // account lookup
        .mockReturnValueOnce(mockBookBalanceQuery) // book balance calculation
        .mockReturnValueOnce(mockReconciliationInsert); // reconciliation creation

      const result = await ReconciliationService.createReconciliation(
        mockReconciliationData,
        'user-1'
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'recon-1',
        reportNumber: 'RECON-2024-0001',
        accountId: 'account-1',
        bookBalance: 10000,
        statementBalance: 9500,
        variance: 500,
        status: 'draft'
      }));

      expect(supabase.from).toHaveBeenCalledWith('chart_of_accounts');
      expect(supabase.from).toHaveBeenCalledWith('reconciliation_reports');
      expect(supabase.rpc).toHaveBeenCalledWith('generate_reconciliation_report_number');
    });

    it('should throw error when account not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Account not found' }
              })
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockFrom);

      await expect(
        ReconciliationService.createReconciliation(mockReconciliationData, 'user-1')
      ).rejects.toThrow(ReconciliationError);
    });

    it('should handle database errors during creation', async () => {
      // Mock successful account lookup
      const mockAccountFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAccount,
                error: null
              })
            })
          })
        })
      });

      // Mock book balance calculation
      const mockBookBalanceQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  data: [{ debit_amount: 10000, credit_amount: 0 }],
                  error: null
                })
              })
            })
          })
        })
      });

      // Mock failed reconciliation creation
      const mockReconciliationInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: 'RECON-2024-0001',
        error: null
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockAccountFrom)
        .mockReturnValueOnce(mockBookBalanceQuery)
        .mockReturnValueOnce(mockReconciliationInsert);

      (supabase.rpc as any).mockImplementation(mockRpc);

      await expect(
        ReconciliationService.createReconciliation(mockReconciliationData, 'user-1')
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('addReconciliationItem', () => {
    const mockItemData = {
      description: 'Outstanding check #1001',
      amount: 150,
      type: 'outstanding_check' as const,
      notes: 'Test item'
    };

    it('should add reconciliation item successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'item-1',
                reconciliation_id: 'recon-1',
                description: 'Outstanding check #1001',
                amount: 150,
                type: 'outstanding_check',
                is_reconciled: false,
                notes: 'Test item'
              },
              error: null
            })
          })
        })
      });

      // Mock update reconciled balance
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockInsert) // item creation
        .mockReturnValueOnce(mockUpdate); // balance update

      const result = await ReconciliationService.addReconciliationItem(
        'recon-1',
        mockItemData
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'item-1',
        reconciliationId: 'recon-1',
        description: 'Outstanding check #1001',
        amount: 150,
        type: 'outstanding_check',
        isReconciled: false
      }));

      expect(mockInsert).toHaveBeenCalledWith('reconciliation_items');
    });

    it('should handle database errors during item creation', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockInsert);

      await expect(
        ReconciliationService.addReconciliationItem('recon-1', mockItemData)
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('reconcileItem', () => {
    it('should mark item as reconciled successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'item-1',
                  reconciliation_id: 'recon-1',
                  description: 'Outstanding check #1001',
                  amount: 150,
                  type: 'outstanding_check',
                  is_reconciled: true,
                  reconciled_date: '2024-01-15T00:00:00Z'
                },
                error: null
              })
            })
          })
        })
      });

      // Mock balance update
      const mockBalanceUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdate) // item update
        .mockReturnValueOnce(mockBalanceUpdate); // balance update

      const result = await ReconciliationService.reconcileItem('item-1', 'user-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'item-1',
        isReconciled: true,
        reconciledDate: '2024-01-15T00:00:00Z'
      }));
    });

    it('should handle database errors during item reconciliation', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockUpdate);

      await expect(
        ReconciliationService.reconcileItem('item-1', 'user-1')
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('completeReconciliation', () => {
    it('should complete reconciliation successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'recon-1',
                  status: 'completed',
                  reconciled_by: 'user-1',
                  reconciled_at: '2024-01-15T00:00:00Z'
                },
                error: null
              })
            })
          })
        })
      });

      // Mock getReconciliationById
      const mockGet = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReconciliation,
                status: 'completed',
                reconciled_by: 'user-1',
                reconciled_at: '2024-01-15T00:00:00Z',
                account: mockAccount
              },
              error: null
            })
          })
        })
      });

      // Mock items and adjustments queries
      const mockItemsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const mockAdjustmentsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockUpdate) // completion update
        .mockReturnValueOnce(mockGet) // get reconciliation
        .mockReturnValueOnce(mockItemsQuery) // get items
        .mockReturnValueOnce(mockAdjustmentsQuery); // get adjustments

      const result = await ReconciliationService.completeReconciliation('recon-1', 'user-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'recon-1',
        status: 'completed',
        reconciledBy: 'user-1',
        reconciledAt: '2024-01-15T00:00:00Z'
      }));
    });

    it('should handle database errors during completion', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockUpdate);

      await expect(
        ReconciliationService.completeReconciliation('recon-1', 'user-1')
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('getReconciliationById', () => {
    it('should retrieve reconciliation with items and adjustments', async () => {
      const mockReconciliationQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockReconciliation,
                account: mockAccount
              },
              error: null
            })
          })
        })
      });

      const mockItemsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'item-1',
                reconciliation_id: 'recon-1',
                description: 'Outstanding check',
                amount: 150,
                type: 'outstanding_check',
                is_reconciled: false
              }
            ],
            error: null
          })
        })
      });

      const mockAdjustmentsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockReconciliationQuery)
        .mockReturnValueOnce(mockItemsQuery)
        .mockReturnValueOnce(mockAdjustmentsQuery);

      const result = await ReconciliationService.getReconciliationById('recon-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'recon-1',
        reconciliationItems: expect.arrayContaining([
          expect.objectContaining({
            id: 'item-1',
            description: 'Outstanding check',
            amount: 150,
            type: 'outstanding_check'
          })
        ])
      }));
    });

    it('should return null when reconciliation not found', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await ReconciliationService.getReconciliationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getReconciliations', () => {
    it('should retrieve reconciliations with filtering and pagination', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              range: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      ...mockReconciliation,
                      account: mockAccount
                    }
                  ],
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      });

      // Mock items and adjustments queries for each reconciliation
      const mockItemsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const mockAdjustmentsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValue(mockItemsQuery)
        .mockReturnValue(mockAdjustmentsQuery);

      const result = await ReconciliationService.getReconciliations({
        status: 'draft',
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'recon-1',
            status: 'draft'
          })
        ]),
        total: 1
      });
    });

    it('should handle database errors during retrieval', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
            count: 0
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        ReconciliationService.getReconciliations()
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('reconcileSupplierBalances', () => {
    it('should reconcile supplier balances and detect discrepancies', async () => {
      const mockSupplierQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'supplier-1',
                supplierName: 'Test Supplier'
              },
              error: null
            })
          })
        })
      });

      const mockInvoicesQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  { total_amount: 1000 },
                  { total_amount: 500 }
                ],
                error: null
              })
            })
          })
        })
      });

      const mockPaymentsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [
                  { payment_amount: 800 }
                ],
                error: null
              })
            })
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockSupplierQuery)
        .mockReturnValueOnce(mockInvoicesQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const result = await ReconciliationService.reconcileSupplierBalances(
        'supplier-1',
        mockPeriod,
        800 // supplier statement balance
      );

      expect(result).toEqual(expect.objectContaining({
        supplierId: 'supplier-1',
        supplierBalance: 800,
        bookBalance: 700, // 1500 invoices - 800 payments
        discrepancies: expect.arrayContaining([
          expect.objectContaining({
            type: 'amount_difference',
            supplierAmount: 800,
            bookAmount: 700
          })
        ])
      }));
    });

    it('should throw error when supplier not found', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Supplier not found' }
            })
          })
        })
      });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        ReconciliationService.reconcileSupplierBalances(
          'nonexistent',
          mockPeriod,
          1000
        )
      ).rejects.toThrow(ReconciliationError);
    });
  });

  describe('getReconciliationSummary', () => {
    it('should return reconciliation summary statistics', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { status: 'completed', variance: 0 },
            { status: 'draft', variance: 100 },
            { status: 'completed', variance: 50 }
          ],
          error: null
        })
      });

      const mockAccountsQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { account_id: 'account-1' },
              { account_id: 'account-2' },
              { account_id: 'account-1' } // duplicate should be counted once
            ],
            error: null
          })
        })
      });

      (supabase.from as any)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockAccountsQuery);

      const result = await ReconciliationService.getReconciliationSummary();

      expect(result).toEqual({
        totalReconciliations: 3,
        completedReconciliations: 2,
        pendingReconciliations: 1,
        totalVariance: 150,
        averageVariance: 50,
        accountsReconciled: 2,
        suppliersReconciled: 0
      });
    });

    it('should handle database errors during summary retrieval', async () => {
      const mockQuery = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        ReconciliationService.getReconciliationSummary()
      ).rejects.toThrow(ReconciliationError);
    });
  });
});