import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withdrawDispatchService } from '../withdrawDispatchService';
import { supabase } from '../supabase';
import { 
  MovementType, 
  ReferenceType, 
  SNStatus, 
  ClaimType, 
  ClaimResolution 
} from '../../types/warehouse';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          })),
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          data: [],
          error: null
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {},
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('WithdrawDispatchService', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSerialNumbers = [
    {
      id: 'sn-1',
      serial_number: 'SN001',
      product_id: 'prod-1',
      warehouse_id: 'wh-1',
      unit_cost: 1000,
      status: SNStatus.AVAILABLE,
      products: {
        id: 'prod-1',
        name: 'Test Product',
        code: 'TP001'
      }
    },
    {
      id: 'sn-2',
      serial_number: 'SN002',
      product_id: 'prod-1',
      warehouse_id: 'wh-1',
      unit_cost: 1000,
      status: SNStatus.AVAILABLE,
      products: {
        id: 'prod-1',
        name: 'Test Product',
        code: 'TP001'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('withdrawItems', () => {
    it('should successfully withdraw available items', async () => {
      // Mock serial numbers query
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockSerialNumbers,
            error: null
          })
        })
      });

      // Mock update query
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      // Mock insert query
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'movement-1',
              product_id: 'prod-1',
              serial_number_id: 'sn-1',
              warehouse_id: 'wh-1',
              movement_type: MovementType.WITHDRAW,
              quantity: 1,
              unit_cost: 1000,
              reference_type: ReferenceType.SALE,
              reference_number: 'SALE-001',
              notes: 'Test withdrawal',
              performed_by: 'user-123'
            },
            error: null
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'product_serial_numbers') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
        if (table === 'stock_movements') {
          return {
            insert: mockInsert
          };
        }
        return {};
      });

      const request = {
        serialNumbers: ['SN001', 'SN002'],
        movementType: MovementType.WITHDRAW,
        referenceType: ReferenceType.SALE,
        referenceNumber: 'SALE-001',
        soldTo: 'Customer A',
        notes: 'Test withdrawal',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.withdrawItems(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully withdrew 2 items');
      expect(result.data?.processedItems).toBe(2);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should fail when serial numbers are not available', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [], // No available items
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const request = {
        serialNumbers: ['SN001', 'SN002'],
        movementType: MovementType.WITHDRAW,
        referenceType: ReferenceType.SALE,
        referenceNumber: 'SALE-001',
        soldTo: 'Customer A',
        notes: 'Test withdrawal',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.withdrawItems(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No available serial numbers found');
      expect(result.error).toBe('SERIAL_NUMBERS_NOT_FOUND');
    });

    it('should fail when some serial numbers are not available', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockSerialNumbers[0]], // Only one item available
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const request = {
        serialNumbers: ['SN001', 'SN002'],
        movementType: MovementType.WITHDRAW,
        referenceType: ReferenceType.SALE,
        referenceNumber: 'SALE-001',
        soldTo: 'Customer A',
        notes: 'Test withdrawal',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.withdrawItems(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Some serial numbers are not available');
      expect(result.error).toBe('SERIAL_NUMBERS_UNAVAILABLE');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const request = {
        serialNumbers: ['SN001'],
        movementType: MovementType.WITHDRAW,
        referenceType: ReferenceType.SALE,
        referenceNumber: 'SALE-001',
        soldTo: 'Customer A',
        notes: 'Test withdrawal',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.withdrawItems(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch serial numbers');
      expect(result.error).toBe('WITHDRAW_FAILED');
    });
  });

  describe('dispatchItems', () => {
    const mockSoldSerialNumbers = [
      {
        ...mockSerialNumbers[0],
        status: SNStatus.SOLD,
        sold_at: new Date().toISOString(),
        sold_to: 'Customer A'
      }
    ];

    it('should successfully dispatch sold items', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockSoldSerialNumbers,
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'movement-1',
              product_id: 'prod-1',
              serial_number_id: 'sn-1',
              warehouse_id: 'wh-1',
              movement_type: MovementType.WITHDRAW,
              quantity: 1,
              unit_cost: 1000,
              reference_type: ReferenceType.SALE,
              reference_number: 'DISPATCH-001',
              notes: 'Dispatched to: Customer B',
              performed_by: 'user-123'
            },
            error: null
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'product_serial_numbers') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
        if (table === 'stock_movements') {
          return {
            insert: mockInsert
          };
        }
        return {};
      });

      const request = {
        serialNumbers: ['SN001'],
        dispatchTo: 'Customer B',
        referenceNumber: 'DISPATCH-001',
        notes: 'Express delivery',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.dispatchItems(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully dispatched 1 items');
      expect(result.data?.processedItems).toBe(1);
    });

    it('should fail when no sold items are found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const request = {
        serialNumbers: ['SN001'],
        dispatchTo: 'Customer B',
        referenceNumber: 'DISPATCH-001',
        notes: 'Express delivery',
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.dispatchItems(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No sold serial numbers found for dispatch');
      expect(result.error).toBe('SERIAL_NUMBERS_NOT_FOUND');
    });
  });

  describe('processClaim', () => {
    const mockSoldSerialNumber = {
      id: 'sn-1',
      serial_number: 'SN001',
      product_id: 'prod-1',
      warehouse_id: 'wh-1',
      unit_cost: 1000,
      status: SNStatus.SOLD,
      sold_to: 'Customer A',
      reference_number: 'SALE-001',
      products: {
        id: 'prod-1',
        name: 'Test Product',
        code: 'TP001'
      }
    };

    it('should successfully process a claim', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockSoldSerialNumber,
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'claim-1',
              claim_number: 'CLM-123456789',
              serial_number_id: 'sn-1',
              claim_type: ClaimType.RETURN,
              reason: 'Defective product',
              customer_name: 'Customer A',
              original_sale_reference: 'SALE-001',
              resolution: ClaimResolution.REFUND,
              processed_by: 'user-123'
            },
            error: null
          })
        })
      });

      const mockMovementInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'movement-1',
              product_id: 'prod-1',
              serial_number_id: 'sn-1',
              warehouse_id: 'wh-1',
              movement_type: MovementType.CLAIM,
              quantity: 1,
              unit_cost: 1000,
              reference_type: ReferenceType.CLAIM,
              reference_number: 'CLM-123456789',
              notes: 'Claim: return - Defective product',
              performed_by: 'user-123'
            },
            error: null
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'product_serial_numbers') {
          return {
            select: mockSelect,
            update: mockUpdate
          };
        }
        if (table === 'claim_logs') {
          return {
            insert: mockInsert
          };
        }
        if (table === 'stock_movements') {
          return {
            insert: mockMovementInsert
          };
        }
        return {};
      });

      const request = {
        serialNumberId: 'sn-1',
        claimType: ClaimType.RETURN,
        reason: 'Defective product',
        customerName: 'Customer A',
        originalSaleReference: 'SALE-001',
        resolution: ClaimResolution.REFUND,
        processedBy: 'user-123'
      };

      const result = await withdrawDispatchService.processClaim(request);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Claim processed successfully');
      expect(result.data?.processedItems).toBe(1);
    });

    it('should fail when serial number is not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Serial number not found' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const request = {
        serialNumberId: 'invalid-sn',
        claimType: ClaimType.RETURN,
        reason: 'Defective product',
        customerName: 'Customer A',
        originalSaleReference: 'SALE-001',
        resolution: ClaimResolution.REFUND,
        processedBy: 'user-123'
      };

      const result = await withdrawDispatchService.processClaim(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Serial number not found');
      expect(result.error).toBe('CLAIM_FAILED');
    });
  });

  describe('getAvailableSerialNumbers', () => {
    it('should fetch available serial numbers', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSerialNumbers,
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const result = await withdrawDispatchService.getAvailableSerialNumbers();

      expect(result).toEqual(mockSerialNumbers);
      expect(mockSelect).toHaveBeenCalled();
    });

    it.skip('should filter by warehouse and product', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockSerialNumbers,
          error: null
        })
      };

      const mockSelect = vi.fn().mockReturnValue(mockQuery);

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const result = await withdrawDispatchService.getAvailableSerialNumbers('wh-1', 'prod-1');

      expect(result).toEqual(mockSerialNumbers);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available');
      expect(mockQuery.eq).toHaveBeenCalledWith('warehouse_id', 'wh-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      const result = await withdrawDispatchService.getAvailableSerialNumbers();

      expect(result).toEqual([]);
    });
  });

  describe('POS Integration', () => {
    it('should process POS sale correctly', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockSerialNumbers[0]], // Only return one item that matches
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'movement-1',
              product_id: 'prod-1',
              serial_number_id: 'sn-1',
              warehouse_id: 'wh-1',
              movement_type: MovementType.WITHDRAW,
              quantity: 1,
              unit_cost: 1000,
              reference_type: ReferenceType.POS,
              reference_number: 'POS-001',
              notes: 'POS Sale - Total: 1000',
              performed_by: 'user-123'
            },
            error: null
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'product_serial_numbers') {
          return { select: mockSelect, update: mockUpdate };
        }
        if (table === 'stock_movements') {
          return { insert: mockInsert };
        }
        return {};
      });

      const saleData = {
        serialNumbers: ['SN001'],
        saleId: 'POS-001',
        customerId: 'CUST-001',
        customerName: 'Customer A',
        totalAmount: 1000,
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.processPOSSale(saleData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully withdrew 1 items');
    });
  });

  describe('Installment Integration', () => {
    it('should process installment sale correctly', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockSerialNumbers[0]], // Return only one item that matches
            error: null
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'movement-1',
              product_id: 'prod-1',
              serial_number_id: 'sn-1',
              warehouse_id: 'wh-1',
              movement_type: MovementType.WITHDRAW,
              quantity: 1,
              unit_cost: 1000,
              reference_type: ReferenceType.INSTALLMENT,
              reference_number: 'CONTRACT-001',
              notes: 'Installment Sale - Contract: CONTRACT-001, Total: 1000',
              performed_by: 'user-123'
            },
            error: null
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'product_serial_numbers') {
          return { select: mockSelect, update: mockUpdate };
        }
        if (table === 'stock_movements') {
          return { insert: mockInsert };
        }
        return {};
      });

      const installmentData = {
        serialNumbers: ['SN001'],
        contractId: 'CONTRACT-001',
        customerId: 'CUST-001',
        customerName: 'Customer A',
        totalAmount: 1000,
        performedBy: 'user-123'
      };

      const result = await withdrawDispatchService.processInstallmentSale(installmentData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully withdrew 1 items');
    });
  });
});