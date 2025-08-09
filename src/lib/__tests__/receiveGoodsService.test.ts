import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReceiveGoodsService, type ReceiveGoodsRequest } from '../receiveGoodsService';
import { serialNumberService } from '../serialNumberService';
import { WarehouseService } from '../warehouseService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('../serialNumberService');
vi.mock('../warehouseService');
vi.mock('@/integrations/supabase/client');

// Mock data
const mockWarehouse = {
  id: 'warehouse-1',
  name: 'คลังหลัก',
  code: 'WH001',
  status: 'active'
};

const mockSupplier = {
  id: 'supplier-1',
  name: 'บริษัท เฟอร์นิเจอร์ จำกัด',
  code: 'SUP001',
  is_active: true
};

const mockProducts = [
  {
    id: 'product-1',
    name: 'โซฟา 3 ที่นั่ง',
    code: 'SF001',
    is_active: true
  },
  {
    id: 'product-2',
    name: 'โต๊ะทำงาน',
    code: 'TB001',
    is_active: true
  }
];

const mockReceiveLog = {
  id: 'receive-1',
  receive_number: 'RCV-20240808-001',
  supplier_id: 'supplier-1',
  warehouse_id: 'warehouse-1',
  invoice_number: 'INV-2024-001',
  total_items: 2,
  total_cost: 30000,
  received_by: 'user-1',
  status: 'completed',
  notes: 'Test receive',
  created_at: '2024-08-08T10:00:00Z'
};

const mockSerialNumbers = [
  {
    id: 'sn-1',
    serialNumber: 'SF001-2024-001',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'available'
  },
  {
    id: 'sn-2',
    serialNumber: 'SF001-2024-002',
    productId: 'product-1',
    warehouseId: 'warehouse-1',
    unitCost: 15000,
    status: 'available'
  }
];

describe('ReceiveGoodsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock WarehouseService
    vi.mocked(WarehouseService.getWarehouseById).mockResolvedValue(mockWarehouse);
    
    // Mock serialNumberService
    vi.mocked(serialNumberService.generateAndCreateSNs).mockResolvedValue(mockSerialNumbers);
    vi.mocked(serialNumberService.searchSerialNumbers).mockResolvedValue({
      data: mockSerialNumbers,
      total: 2,
      hasMore: false
    });
    vi.mocked(serialNumberService.bulkUpdateStatus).mockResolvedValue();
    
    // Mock Supabase
    const mockFrom = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIn = vi.fn().mockReturnThis();
    const mockInsert = vi.fn().mockReturnThis();
    const mockUpdate = vi.fn().mockReturnThis();
    const mockSingle = vi.fn();
    const mockLimit = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockRange = vi.fn().mockReturnThis();
    const mockIlike = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockReturnThis();
    const mockLte = vi.fn().mockReturnThis();
    const mockLike = vi.fn().mockReturnThis();
    
    vi.mocked(supabase.from).mockImplementation(mockFrom);
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
      limit: mockLimit,
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      gte: mockGte,
      lte: mockLte,
      like: mockLike
    });
    
    mockEq.mockReturnValue({
      single: mockSingle,
      limit: mockLimit,
      order: mockOrder
    });
    
    mockIn.mockReturnValue({
      order: mockOrder
    });
    
    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle
    });
    
    mockUpdate.mockReturnValue({
      eq: mockEq
    });
    
    mockSingle.mockResolvedValue({
      data: mockReceiveLog,
      error: null
    });
    
    mockOrder.mockResolvedValue({
      data: mockProducts,
      error: null
    });
    
    mockLimit.mockResolvedValue({
      data: [{ receive_number: 'RCV-20240808-001' }],
      error: null
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateReceiveRequest', () => {
    const validRequest: ReceiveGoodsRequest = {
      warehouseId: 'warehouse-1',
      supplierId: 'supplier-1',
      invoiceNumber: 'INV-2024-001',
      items: [
        {
          productId: 'product-1',
          productCode: 'SF001',
          quantity: 1,
          unitCost: 15000
        }
      ],
      notes: 'Test receive',
      receivedBy: 'user-1'
    };

    it('validates a valid request successfully', async () => {
      // Mock supplier check
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'suppliers') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: mockSupplier,
                  error: null
                })
              })
            })
          } as any;
        }
        
        if (table === 'products') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: mockProducts,
                error: null
              })
            })
          } as any;
        }
        
        if (table === 'receive_logs') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({
                    data: [],
                    error: null
                  })
                })
              })
            })
          } as any;
        }
        
        return {} as any;
      });

      const result = await ReceiveGoodsService.validateReceiveRequest(validRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for non-existent warehouse', async () => {
      vi.mocked(WarehouseService.getWarehouseById).mockResolvedValue(null);
      
      const result = await ReceiveGoodsService.validateReceiveRequest(validRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ไม่พบคลังสินค้าที่ระบุ');
    });

    it('returns error for inactive warehouse', async () => {
      vi.mocked(WarehouseService.getWarehouseById).mockResolvedValue({
        ...mockWarehouse,
        status: 'inactive'
      });
      
      const result = await ReceiveGoodsService.validateReceiveRequest(validRequest);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('คลังสินค้าไม่ได้ใช้งาน');
    });

    it('returns error for empty items', async () => {
      const requestWithoutItems = {
        ...validRequest,
        items: []
      };
      
      const result = await ReceiveGoodsService.validateReceiveRequest(requestWithoutItems);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('กรุณาระบุรายการสินค้าอย่างน้อย 1 รายการ');
    });

    it('returns error for invalid item quantities', async () => {
      const requestWithInvalidQuantity = {
        ...validRequest,
        items: [
          {
            productId: 'product-1',
            productCode: 'SF001',
            quantity: 0,
            unitCost: 15000
          }
        ]
      };
      
      // Mock products check
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: mockProducts,
                error: null
              })
            })
          } as any;
        }
        return {} as any;
      });
      
      const result = await ReceiveGoodsService.validateReceiveRequest(requestWithInvalidQuantity);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('จำนวนสินค้ารายการที่ 1 ต้องมากกว่า 0');
    });

    it('returns error for invalid unit costs', async () => {
      const requestWithInvalidCost = {
        ...validRequest,
        items: [
          {
            productId: 'product-1',
            productCode: 'SF001',
            quantity: 1,
            unitCost: 0
          }
        ]
      };
      
      // Mock products check
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: mockProducts,
                error: null
              })
            })
          } as any;
        }
        return {} as any;
      });
      
      const result = await ReceiveGoodsService.validateReceiveRequest(requestWithInvalidCost);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ราคาต่อหน่วยรายการที่ 1 ต้องมากกว่า 0');
    });

    it('returns warning for duplicate invoice number', async () => {
      // Mock existing receive log with same invoice
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'suppliers') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: mockSupplier,
                  error: null
                })
              })
            })
          } as any;
        }
        
        if (table === 'products') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: mockProducts,
                error: null
              })
            })
          } as any;
        }
        
        if (table === 'receive_logs') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({
                    data: [{ id: 'existing-receive' }],
                    error: null
                  })
                })
              })
            })
          } as any;
        }
        
        return {} as any;
      });
      
      const result = await ReceiveGoodsService.validateReceiveRequest(validRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('เลขที่ใบวางบิลนี้เคยใช้แล้วกับผู้จำหน่ายนี้');
    });
  });

  describe('receiveGoods', () => {
    const validRequest: ReceiveGoodsRequest = {
      warehouseId: 'warehouse-1',
      supplierId: 'supplier-1',
      invoiceNumber: 'INV-2024-001',
      items: [
        {
          productId: 'product-1',
          productCode: 'SF001',
          quantity: 2,
          unitCost: 15000
        }
      ],
      notes: 'Test receive',
      receivedBy: 'user-1'
    };

    beforeEach(() => {
      // Mock validation to pass
      vi.spyOn(ReceiveGoodsService, 'validateReceiveRequest').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });
      
      // Mock receive number generation
      vi.spyOn(ReceiveGoodsService as any, 'generateReceiveNumber').mockResolvedValue('RCV-20240808-001');
    });

    it('successfully processes goods receiving', async () => {
      const result = await ReceiveGoodsService.receiveGoods(validRequest);
      
      expect(result.receiveLog).toEqual(mockReceiveLog);
      expect(result.serialNumbers).toEqual(mockSerialNumbers);
      expect(result.totalItems).toBe(2);
      expect(result.totalCost).toBe(30000);
      
      expect(serialNumberService.generateAndCreateSNs).toHaveBeenCalledWith({
        productId: 'product-1',
        productCode: 'SF001',
        warehouseId: 'warehouse-1',
        quantity: 2,
        unitCost: 15000,
        supplierId: 'supplier-1',
        invoiceNumber: 'INV-2024-001',
        notes: 'Received via RCV-20240808-001'
      });
    });

    it('throws error when validation fails', async () => {
      vi.spyOn(ReceiveGoodsService, 'validateReceiveRequest').mockResolvedValue({
        isValid: false,
        errors: ['Validation error'],
        warnings: []
      });
      
      await expect(ReceiveGoodsService.receiveGoods(validRequest))
        .rejects.toThrow('Validation failed: Validation error');
    });

    it('throws error when receive log creation fails', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'receive_logs') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          } as any;
        }
        return {} as any;
      });
      
      await expect(ReceiveGoodsService.receiveGoods(validRequest))
        .rejects.toThrow('Failed to create receive log: Database error');
    });

    it('throws error when serial number generation fails', async () => {
      vi.mocked(serialNumberService.generateAndCreateSNs).mockRejectedValue(
        new Error('Serial number generation failed')
      );
      
      await expect(ReceiveGoodsService.receiveGoods(validRequest))
        .rejects.toThrow('Failed to process item SF001: Serial number generation failed');
    });
  });

  describe('getReceiveLogs', () => {
    it('returns receive logs with default filters', async () => {
      const mockReceiveLogs = [mockReceiveLog];
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          range: () => ({
            order: () => Promise.resolve({
              data: mockReceiveLogs,
              error: null,
              count: 1
            })
          })
        })
      }) as any);
      
      const result = await ReceiveGoodsService.getReceiveLogs();
      
      expect(result.data).toEqual(mockReceiveLogs);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('applies warehouse filter correctly', async () => {
      const mockEq = vi.fn().mockReturnThis();
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          eq: mockEq,
          range: () => ({
            order: () => Promise.resolve({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      }) as any);
      
      await ReceiveGoodsService.getReceiveLogs({ warehouseId: 'warehouse-1' });
      
      expect(mockEq).toHaveBeenCalledWith('warehouse_id', 'warehouse-1');
    });

    it('applies date range filters correctly', async () => {
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          gte: mockGte,
          lte: mockLte,
          range: () => ({
            order: () => Promise.resolve({
              data: [],
              error: null,
              count: 0
            })
          })
        })
      }) as any);
      
      const dateFrom = new Date('2024-08-01');
      const dateTo = new Date('2024-08-31');
      
      await ReceiveGoodsService.getReceiveLogs({ dateFrom, dateTo });
      
      expect(mockGte).toHaveBeenCalledWith('created_at', dateFrom.toISOString());
      expect(mockLte).toHaveBeenCalledWith('created_at', dateTo.toISOString());
    });
  });

  describe('getReceiveLogById', () => {
    it('returns receive log when found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: mockReceiveLog,
              error: null
            })
          })
        })
      }) as any);
      
      const result = await ReceiveGoodsService.getReceiveLogById('receive-1');
      
      expect(result).toEqual(mockReceiveLog);
    });

    it('returns null when not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      }) as any);
      
      const result = await ReceiveGoodsService.getReceiveLogById('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('cancelReceiveLog', () => {
    it('successfully cancels receive log and updates serial numbers', async () => {
      vi.spyOn(ReceiveGoodsService, 'getReceiveLogById').mockResolvedValue(mockReceiveLog);
      
      await ReceiveGoodsService.cancelReceiveLog('receive-1', 'Test cancellation', 'user-1');
      
      expect(serialNumberService.bulkUpdateStatus).toHaveBeenCalledWith(
        ['sn-1', 'sn-2'],
        'damaged',
        {
          notes: 'Receive cancelled: Test cancellation',
          performedBy: 'user-1'
        }
      );
    });
  });

  describe('generateReceiveNumber', () => {
    it('generates receive number with correct format', async () => {
      // Access private method for testing
      const generateReceiveNumber = (ReceiveGoodsService as any).generateReceiveNumber;
      
      const result = await generateReceiveNumber();
      
      expect(result).toMatch(/^RCV-\d{8}-\d{3}$/);
    });

    it('increments sequence number correctly', async () => {
      // Mock existing receive with same date prefix
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: () => ({
          like: () => ({
            order: () => ({
              limit: () => Promise.resolve({
                data: [{ receive_number: 'RCV-20240808-005' }],
                error: null
              })
            })
          })
        })
      }) as any);
      
      const generateReceiveNumber = (ReceiveGoodsService as any).generateReceiveNumber;
      const result = await generateReceiveNumber();
      
      expect(result).toMatch(/^RCV-\d{8}-006$/);
    });
  });
});