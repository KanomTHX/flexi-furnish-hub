import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferService, TransferService } from '../transferService';
import { supabase } from '../supabase';

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}));

describe('TransferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock functions
    Object.values(mockSupabaseQuery).forEach(fn => {
      if (typeof fn === 'function') {
        fn.mockReturnThis?.();
      }
    });
  });

  describe('initiateTransfer', () => {
    it('should create a new transfer successfully', async () => {
      const mockSerialNumbers = [
        {
          id: 'sn1',
          serial_number: 'SN001',
          product_id: 'prod1',
          warehouse_id: 'wh1',
          unit_cost: 1000,
          status: 'available',
          products: {
            id: 'prod1',
            name: 'Product 1',
            code: 'P001',
            sku: 'SKU001'
          }
        }
      ];

      const mockTransfer = {
        id: 'transfer1',
        transfer_number: 'TF202501010001',
        source_warehouse_id: 'wh1',
        target_warehouse_id: 'wh2',
        status: 'pending',
        total_items: 1,
        notes: 'Test transfer',
        initiated_by: 'user1',
        created_at: new Date().toISOString(),
        source_warehouse: {
          id: 'wh1',
          name: 'Warehouse 1',
          code: 'WH001'
        },
        target_warehouse: {
          id: 'wh2',
          name: 'Warehouse 2',
          code: 'WH002'
        }
      };

      // Mock serial numbers query
      mockSupabaseQuery.eq.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({
          data: mockSerialNumbers,
          error: null
        })
      });

      // Mock transfer insert
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: mockTransfer,
        error: null
      });

      // Mock transfer items insert
      mockSupabaseQuery.insert.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock serial numbers update
      mockSupabaseQuery.in.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock stock movements insert
      mockSupabaseQuery.insert.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock generateTransferNumber
      mockSupabaseQuery.limit.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock getTransferById
      vi.spyOn(transferService, 'getTransferById').mockResolvedValue({
        ...mockTransfer,
        items: []
      } as any);

      const request = {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh2',
        serialNumbers: ['sn1'],
        notes: 'Test transfer'
      };

      const result = await transferService.initiateTransfer(request, 'user1');

      expect(result.transferNumber).toBe('TF202501010001');
      expect(result.status).toBe('pending');
      expect(result.totalItems).toBe(1);
    });

    it('should throw error if serial numbers not available', async () => {
      // Mock empty serial numbers result
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const request = {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh2',
        serialNumbers: ['sn1'],
        notes: 'Test transfer'
      };

      await expect(transferService.initiateTransfer(request, 'user1'))
        .rejects.toThrow('ไม่พบ Serial Number ที่เลือกหรือสินค้าไม่พร้อมโอน');
    });

    it('should throw error if some serial numbers not available', async () => {
      const mockSerialNumbers = [
        {
          id: 'sn1',
          serial_number: 'SN001',
          product_id: 'prod1',
          warehouse_id: 'wh1',
          unit_cost: 1000,
          status: 'available'
        }
      ];

      // Mock serial numbers query - only 1 out of 2 requested
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue({
            data: mockSerialNumbers,
            error: null
          })
        })
      });

      const request = {
        sourceWarehouseId: 'wh1',
        targetWarehouseId: 'wh2',
        serialNumbers: ['sn1', 'sn2'], // Request 2 but only 1 available
        notes: 'Test transfer'
      };

      await expect(transferService.initiateTransfer(request, 'user1'))
        .rejects.toThrow('Serial Number บางตัวไม่พร้อมสำหรับการโอน');
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm transfer successfully', async () => {
      const mockTransfer = {
        id: 'transfer1',
        transferNumber: 'TF202501010001',
        status: 'pending',
        targetWarehouseId: 'wh2',
        sourceWarehouse: { name: 'Warehouse 1' },
        targetWarehouse: { name: 'Warehouse 2' }
      };

      const mockTransferItems = [
        {
          serial_number_id: 'sn1',
          product_id: 'prod1',
          unit_cost: 1000,
          serial_number: {
            id: 'sn1',
            serial_number: 'SN001'
          }
        }
      ];

      // Mock getTransferById
      vi.spyOn(transferService, 'getTransferById')
        .mockResolvedValueOnce(mockTransfer as any)
        .mockResolvedValueOnce({
          ...mockTransfer,
          status: 'completed'
        } as any);

      // Mock transfer update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Mock transfer items query
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockTransferItems,
          error: null
        })
      });

      // Mock serial numbers update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Mock stock movements insert
      mockSupabaseFrom.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Mock transfer items update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const confirmation = {
        transferId: 'transfer1',
        confirmedBy: 'user2',
        notes: 'Confirmed'
      };

      const result = await transferService.confirmTransfer(confirmation);

      expect(result.status).toBe('completed');
    });

    it('should throw error if transfer cannot be confirmed', async () => {
      const mockTransfer = {
        id: 'transfer1',
        status: 'completed' // Already completed
      };

      vi.spyOn(transferService, 'getTransferById').mockResolvedValue(mockTransfer as any);

      const confirmation = {
        transferId: 'transfer1',
        confirmedBy: 'user2'
      };

      await expect(transferService.confirmTransfer(confirmation))
        .rejects.toThrow('การโอนนี้ไม่สามารถยืนยันได้');
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel transfer successfully', async () => {
      const mockTransfer = {
        id: 'transfer1',
        status: 'pending',
        notes: 'Original notes'
      };

      const mockTransferItems = [
        { serial_number_id: 'sn1' }
      ];

      // Mock getTransferById
      vi.spyOn(transferService, 'getTransferById').mockResolvedValue(mockTransfer as any);

      // Mock transfer update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Mock transfer items query
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockTransferItems,
          error: null
        })
      });

      // Mock serial numbers update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      // Mock transfer items update
      mockSupabaseFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      await transferService.cancelTransfer('transfer1', 'Test reason', 'user1');

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should throw error if transfer cannot be cancelled', async () => {
      const mockTransfer = {
        id: 'transfer1',
        status: 'completed' // Already completed
      };

      vi.spyOn(transferService, 'getTransferById').mockResolvedValue(mockTransfer as any);

      await expect(transferService.cancelTransfer('transfer1', 'Test reason', 'user1'))
        .rejects.toThrow('การโอนนี้ไม่สามารถยกเลิกได้');
    });
  });

  describe('getAvailableSerialNumbers', () => {
    it('should return available serial numbers', async () => {
      const mockSerialNumbers = [
        {
          id: 'sn1',
          serial_number: 'SN001',
          product_id: 'prod1',
          warehouse_id: 'wh1',
          unit_cost: 1000,
          status: 'available',
          created_at: new Date().toISOString(),
          product: {
            id: 'prod1',
            name: 'Product 1',
            code: 'P001',
            sku: 'SKU001',
            brand: 'Brand A',
            model: 'Model X'
          }
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockResolvedValue({
              data: mockSerialNumbers,
              error: null
            })
          })
        })
      });

      const result = await transferService.getAvailableSerialNumbers('wh1');

      expect(result).toHaveLength(1);
      expect(result[0].serialNumber).toBe('SN001');
      expect(result[0].status).toBe('available');
    });

    it('should filter by search term', async () => {
      const mockSerialNumbers = [
        {
          id: 'sn1',
          serial_number: 'SN001',
          product: {
            name: 'Test Product'
          }
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnThis(),
            or: vi.fn().mockResolvedValue({
              data: mockSerialNumbers,
              error: null
            })
          })
        })
      });

      const result = await transferService.getAvailableSerialNumbers('wh1', 'Test');

      expect(result).toHaveLength(1);
    });
  });

  describe('getTransfers', () => {
    it('should return transfers with filters', async () => {
      const mockTransfers = [
        {
          id: 'transfer1',
          transfer_number: 'TF202501010001',
          source_warehouse_id: 'wh1',
          target_warehouse_id: 'wh2',
          status: 'pending',
          total_items: 1,
          created_at: new Date().toISOString()
        }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockTransfers,
          error: null
        })
      });

      const result = await transferService.getTransfers({
        sourceWarehouseId: 'wh1',
        status: 'pending'
      });

      expect(result).toHaveLength(1);
      expect(result[0].transferNumber).toBe('TF202501010001');
    });
  });

  describe('getTransferStats', () => {
    it('should return transfer statistics', async () => {
      const mockTransfers = [
        { status: 'pending', total_items: 1 },
        { status: 'pending', total_items: 2 },
        { status: 'completed', total_items: 1 },
        { status: 'cancelled', total_items: 1 }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
          data: mockTransfers,
          error: null
        })
      });

      const result = await transferService.getTransferStats();

      expect(result.pending).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(1);
      expect(result.inTransit).toBe(0);
    });

    it('should filter by warehouse', async () => {
      const mockTransfers = [
        { status: 'pending', total_items: 1 }
      ];

      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: mockTransfers,
          error: null
        })
      });

      const result = await transferService.getTransferStats('wh1');

      expect(result.pending).toBe(1);
    });
  });
});