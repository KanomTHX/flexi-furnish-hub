import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posIntegrationService } from '../posIntegrationService';
import { supabase } from '../../lib/supabase';
import { withdrawDispatchService } from '../../lib/withdrawDispatchService';
import { SNStatus } from '../../types/warehouse';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
        in: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

vi.mock('../../lib/withdrawDispatchService', () => ({
  withdrawDispatchService: {
    processPOSSale: vi.fn()
  }
}));

describe('POSIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkStockAvailability', () => {
    it('should check stock availability for single product', async () => {
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001', product_id: 'prod1', warehouse_id: 'wh1' },
        { id: '2', serial_number: 'SN002', product_id: 'prod1', warehouse_id: 'wh1' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const request = {
        items: [{ productId: 'prod1', quantity: 2, warehouseId: 'wh1' }]
      };

      const result = await posIntegrationService.checkStockAvailability(request);

      expect(result.success).toBe(true);
      expect(result.availability).toHaveLength(1);
      expect(result.availability[0]).toEqual({
        productId: 'prod1',
        requested: 2,
        available: 2,
        isAvailable: true,
        availableSerialNumbers: ['SN001', 'SN002']
      });
    });

    it('should handle insufficient stock', async () => {
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001', product_id: 'prod1', warehouse_id: 'wh1' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const request = {
        items: [{ productId: 'prod1', quantity: 3, warehouseId: 'wh1' }]
      };

      const result = await posIntegrationService.checkStockAvailability(request);

      expect(result.success).toBe(false);
      expect(result.availability[0].isAvailable).toBe(false);
      expect(result.availability[0].available).toBe(1);
      expect(result.availability[0].requested).toBe(3);
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const request = {
        items: [{ productId: 'prod1', quantity: 1 }]
      };

      const result = await posIntegrationService.checkStockAvailability(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('AVAILABILITY_CHECK_FAILED');
    });
  });

  describe('processPOSSale', () => {
    it('should process POS sale successfully', async () => {
      // Mock availability check
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001', product_id: 'prod1', warehouse_id: 'wh1' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      // Mock withdraw dispatch service
      (withdrawDispatchService.processPOSSale as any).mockResolvedValue({
        success: true,
        message: 'Sale processed successfully'
      });

      const request = {
        saleId: 'sale123',
        items: [{ productId: 'prod1', quantity: 1 }],
        totalAmount: 1000,
        warehouseId: 'wh1',
        performedBy: 'user1'
      };

      const result = await posIntegrationService.processPOSSale(request);

      expect(result.success).toBe(true);
      expect(result.processedItems).toHaveLength(1);
      expect(result.processedItems[0].status).toBe('success');
    });

    it('should handle processing failures', async () => {
      // Mock withdraw dispatch service failure
      (withdrawDispatchService.processPOSSale as any).mockResolvedValue({
        success: false,
        message: 'Processing failed',
        error: 'PROCESSING_ERROR'
      });

      const request = {
        saleId: 'sale123',
        items: [{ productId: 'prod1', quantity: 1, serialNumbers: ['SN001'] }],
        totalAmount: 1000,
        warehouseId: 'wh1',
        performedBy: 'user1'
      };

      const result = await posIntegrationService.processPOSSale(request);

      expect(result.success).toBe(false);
      expect(result.processedItems[0].status).toBe('failed');
      expect(result.processedItems[0].error).toBe('PROCESSING_ERROR');
    });
  });  desc
ribe('reserveStock', () => {
    it('should reserve stock successfully', async () => {
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001' },
        { id: '2', serial_number: 'SN002' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
                }))
              }))
            }))
          }))
        }))
      }));

      const mockUpdate = vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      }));

      (supabase.from as any).mockImplementation(() => ({
        select: mockFrom().select,
        update: mockUpdate
      }));

      const request = {
        reservationId: 'res123',
        items: [{ productId: 'prod1', quantity: 2 }],
        warehouseId: 'wh1',
        reservedBy: 'user1'
      };

      const result = await posIntegrationService.reserveStock(request);

      expect(result.success).toBe(true);
      expect(result.reservedSerialNumbers).toEqual(['SN001', 'SN002']);
    });

    it('should handle insufficient stock for reservation', async () => {
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
                }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const request = {
        reservationId: 'res123',
        items: [{ productId: 'prod1', quantity: 3 }],
        warehouseId: 'wh1',
        reservedBy: 'user1'
      };

      const result = await posIntegrationService.reserveStock(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_STOCK');
    });
  });

  describe('releaseReservedStock', () => {
    it('should release reserved stock successfully', async () => {
      const mockReservedItems = [
        { id: '1', serial_number: 'SN001' },
        { id: '2', serial_number: 'SN002' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: mockReservedItems, error: null }))
          }))
        }))
      }));

      const mockUpdate = vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      }));

      (supabase.from as any).mockImplementation(() => ({
        select: mockFrom().select,
        update: mockUpdate
      }));

      const result = await posIntegrationService.releaseReservedStock('res123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Released 2 reserved items');
    });

    it('should handle no reserved items found', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await posIntegrationService.releaseReservedStock('res123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('No reserved items found');
    });
  });

  describe('getStockLevelsForPOS', () => {
    it('should get stock levels successfully', async () => {
      const mockSerialNumbers = [
        {
          product_id: 'prod1',
          status: SNStatus.AVAILABLE,
          products: { id: 'prod1', name: 'Product 1', code: 'P001' }
        },
        {
          product_id: 'prod1',
          status: SNStatus.RESERVED,
          products: { id: 'prod1', name: 'Product 1', code: 'P001' }
        },
        {
          product_id: 'prod2',
          status: SNStatus.AVAILABLE,
          products: { id: 'prod2', name: 'Product 2', code: 'P002' }
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await posIntegrationService.getStockLevelsForPOS('wh1');

      expect(result.success).toBe(true);
      expect(result.stockLevels).toHaveLength(2);
      
      const prod1Stock = result.stockLevels.find(s => s.productId === 'prod1');
      expect(prod1Stock?.availableQuantity).toBe(1);
      expect(prod1Stock?.reservedQuantity).toBe(1);
      expect(prod1Stock?.totalQuantity).toBe(2);
    });
  });

  describe('handlePOSSaleCompletion', () => {
    it('should handle sale completion successfully', async () => {
      const mockSale = {
        id: 'sale123',
        items: [
          {
            product: { id: 'prod1', name: 'Product 1' },
            quantity: 1
          }
        ],
        total: 1000,
        employeeId: 'emp1'
      };

      // Mock availability check
      const mockSerialNumbers = [
        { id: '1', serial_number: 'SN001', product_id: 'prod1', warehouse_id: 'wh1' }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: mockSerialNumbers, error: null }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      // Mock withdraw dispatch service
      (withdrawDispatchService.processPOSSale as any).mockResolvedValue({
        success: true,
        message: 'Sale processed successfully'
      });

      const result = await posIntegrationService.handlePOSSaleCompletion(mockSale as any);

      expect(result.success).toBe(true);
      expect(result.processedItems).toHaveLength(1);
    });

    it('should handle insufficient stock during sale completion', async () => {
      const mockSale = {
        id: 'sale123',
        items: [
          {
            product: { id: 'prod1', name: 'Product 1' },
            quantity: 5
          }
        ],
        total: 1000,
        employeeId: 'emp1'
      };

      // Mock insufficient stock
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await posIntegrationService.handlePOSSaleCompletion(mockSale as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_STOCK');
    });
  });
});