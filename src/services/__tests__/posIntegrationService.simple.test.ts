import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies first
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [
                  { id: '1', serial_number: 'SN001', product_id: 'prod1', warehouse_id: 'wh1' },
                  { id: '2', serial_number: 'SN002', product_id: 'prod1', warehouse_id: 'wh1' }
                ], 
                error: null 
              }))
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

vi.mock('../../lib/withdrawDispatchService', () => ({
  withdrawDispatchService: {
    processPOSSale: vi.fn(() => Promise.resolve({
      success: true,
      message: 'Sale processed successfully'
    }))
  }
}));

// Import after mocks
import { posIntegrationService } from '../posIntegrationService';
import { supabase } from '../../lib/supabase';

describe('POSIntegrationService - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check stock availability for a simple request', async () => {
    const request = {
      items: [{ productId: 'prod1', quantity: 2 }]
    };

    const result = await posIntegrationService.checkStockAvailability(request);

    expect(result.success).toBe(true);
    expect(result.availability).toHaveLength(1);
    expect(result.availability[0].productId).toBe('prod1');
    expect(result.availability[0].isAvailable).toBe(true);
    expect(result.availability[0].availableSerialNumbers).toHaveLength(2);
  });

  it('should process a simple POS sale', async () => {
    const request = {
      saleId: 'sale123',
      items: [{ productId: 'prod1', quantity: 1, serialNumbers: ['SN001'] }],
      totalAmount: 1000,
      warehouseId: 'wh1',
      performedBy: 'user1'
    };

    const result = await posIntegrationService.processPOSSale(request);

    expect(result.success).toBe(true);
    expect(result.processedItems).toHaveLength(1);
    expect(result.processedItems[0].status).toBe('success');
  });

  it('should handle stock reservation', async () => {
    const request = {
      reservationId: 'res123',
      items: [{ productId: 'prod1', quantity: 2 }],
      warehouseId: 'wh1',
      reservedBy: 'user1'
    };

    const result = await posIntegrationService.reserveStock(request);

    expect(result.success).toBe(true);
    expect(result.reservedSerialNumbers).toHaveLength(2);
  });

  it('should get stock levels for POS', async () => {
    // Mock different response for stock levels
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => Promise.resolve({
        data: [
          {
            product_id: 'prod1',
            status: 'available',
            products: { id: 'prod1', name: 'Product 1', code: 'P001' }
          },
          {
            product_id: 'prod1',
            status: 'available',
            products: { id: 'prod1', name: 'Product 1', code: 'P001' }
          }
        ],
        error: null
      }))
    });

    const result = await posIntegrationService.getStockLevelsForPOS('wh1');

    expect(result.success).toBe(true);
    expect(result.stockLevels).toHaveLength(1);
    expect(result.stockLevels[0].productId).toBe('prod1');
    expect(result.stockLevels[0].availableQuantity).toBe(2);
  });

  it('should handle sale completion workflow', async () => {
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

    const result = await posIntegrationService.handlePOSSaleCompletion(mockSale as any);

    expect(result.success).toBe(true);
    expect(result.processedItems).toHaveLength(1);
  });
});