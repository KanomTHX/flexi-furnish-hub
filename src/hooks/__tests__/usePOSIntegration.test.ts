import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePOSIntegration } from '../usePOSIntegration';
import { posIntegrationService } from '../../services/posIntegrationService';

// Mock the service
vi.mock('../../services/posIntegrationService', () => ({
  posIntegrationService: {
    checkStockAvailability: vi.fn(),
    processPOSSale: vi.fn(),
    reserveStock: vi.fn(),
    releaseReservedStock: vi.fn(),
    getStockLevelsForPOS: vi.fn(),
    handlePOSSaleCompletion: vi.fn()
  }
}));

describe('usePOSIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePOSIntegration());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.checkStockAvailability).toBe('function');
    expect(typeof result.current.processPOSSale).toBe('function');
    expect(typeof result.current.reserveStock).toBe('function');
    expect(typeof result.current.releaseReservedStock).toBe('function');
    expect(typeof result.current.getStockLevelsForPOS).toBe('function');
    expect(typeof result.current.handleSaleCompletion).toBe('function');
  });

  describe('checkStockAvailability', () => {
    it('should check stock availability successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'All items available',
        availability: [
          {
            productId: 'prod1',
            requested: 2,
            available: 5,
            isAvailable: true,
            availableSerialNumbers: ['SN001', 'SN002']
          }
        ]
      };

      (posIntegrationService.checkStockAvailability as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.checkStockAvailability({
          items: [{ productId: 'prod1', quantity: 2 }]
        });
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle availability check failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Insufficient stock',
        availability: [],
        error: 'INSUFFICIENT_STOCK'
      };

      (posIntegrationService.checkStockAvailability as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.checkStockAvailability({
          items: [{ productId: 'prod1', quantity: 10 }]
        });
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.error).toBe('Insufficient stock');
    });

    it('should handle service errors', async () => {
      (posIntegrationService.checkStockAvailability as any).mockRejectedValue(
        new Error('Service error')
      );

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.checkStockAvailability({
          items: [{ productId: 'prod1', quantity: 1 }]
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('AVAILABILITY_CHECK_FAILED');
      expect(result.current.error).toBe('Service error');
    });
  });

  describe('processPOSSale', () => {
    it('should process POS sale successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Sale processed successfully',
        processedItems: [
          {
            productId: 'prod1',
            serialNumbers: ['SN001'],
            status: 'success' as const
          }
        ]
      };

      (posIntegrationService.processPOSSale as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.processPOSSale({
          saleId: 'sale123',
          items: [{ productId: 'prod1', quantity: 1 }],
          totalAmount: 1000,
          warehouseId: 'wh1',
          performedBy: 'user1'
        });
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle processing failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Processing failed',
        processedItems: [],
        error: 'PROCESSING_FAILED'
      };

      (posIntegrationService.processPOSSale as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.processPOSSale({
          saleId: 'sale123',
          items: [{ productId: 'prod1', quantity: 1 }],
          totalAmount: 1000,
          warehouseId: 'wh1',
          performedBy: 'user1'
        });
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.error).toBe('Processing failed');
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Stock reserved successfully',
        reservedSerialNumbers: ['SN001', 'SN002']
      };

      (posIntegrationService.reserveStock as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.reserveStock({
          reservationId: 'res123',
          items: [{ productId: 'prod1', quantity: 2 }],
          warehouseId: 'wh1',
          reservedBy: 'user1'
        });
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('releaseReservedStock', () => {
    it('should release reserved stock successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Reserved stock released'
      };

      (posIntegrationService.releaseReservedStock as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.releaseReservedStock('res123');
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('getStockLevelsForPOS', () => {
    it('should get stock levels successfully', async () => {
      const mockResponse = {
        success: true,
        stockLevels: [
          {
            productId: 'prod1',
            productName: 'Product 1',
            productCode: 'P001',
            availableQuantity: 5,
            reservedQuantity: 2,
            totalQuantity: 7
          }
        ]
      };

      (posIntegrationService.getStockLevelsForPOS as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      let response;
      await act(async () => {
        response = await result.current.getStockLevelsForPOS('wh1');
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('handleSaleCompletion', () => {
    it('should handle sale completion successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Sale completed successfully',
        processedItems: []
      };

      (posIntegrationService.handlePOSSaleCompletion as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePOSIntegration());

      const mockSale = {
        id: 'sale123',
        items: [{ product: { id: 'prod1' }, quantity: 1 }],
        total: 1000,
        employeeId: 'emp1'
      };

      let response;
      await act(async () => {
        response = await result.current.handleSaleCompletion(mockSale as any);
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should manage loading state correctly', async () => {
    (posIntegrationService.checkStockAvailability as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, availability: [] }), 100))
    );

    const { result } = renderHook(() => usePOSIntegration());

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.checkStockAvailability({ items: [] });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });
});