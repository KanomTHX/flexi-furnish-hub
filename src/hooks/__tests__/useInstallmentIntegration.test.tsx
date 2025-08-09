// ===================================================================
// INSTALLMENT INTEGRATION HOOK TESTS
// ทดสอบ Hook สำหรับใช้งานบริการเชื่อมโยงระบบเช่าซื้อ
// ===================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInstallmentIntegration, useInstallmentSNs, useInstallmentSNHistory } from '../useInstallmentIntegration';
import { installmentIntegrationService } from '@/services/installmentIntegrationService';
import { InstallmentContract } from '@/types/installments';
import React from 'react';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/services/installmentIntegrationService', () => ({
  installmentIntegrationService: {
    reserveStockForContract: vi.fn(),
    confirmStockSale: vi.fn(),
    releaseReservedStock: vi.fn(),
    trackInstallmentSNs: vi.fn(),
    getInstallmentSNHistory: vi.fn(),
    onInstallmentContractCreated: vi.fn(),
    onInstallmentContractCancelled: vi.fn(),
    onInstallmentSaleConfirmed: vi.fn()
  }
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useInstallmentIntegration', () => {
  const mockContractData = {
    contractId: 'contract-123',
    contractNumber: 'CONTRACT-2024-001',
    customerId: 'customer-123',
    branchId: 'branch-123',
    items: [
      {
        productId: 'product-123',
        quantity: 1,
        warehouseId: 'warehouse-123',
        unitPrice: 15000
      }
    ]
  };

  const mockContract: InstallmentContract = {
    id: 'contract-123',
    contractNumber: 'CONTRACT-2024-001',
    customerId: 'customer-123',
    customer: {
      id: 'customer-123',
      name: 'ลูกค้าทดสอบ',
      phone: '0812345678',
      email: 'test@example.com',
      address: 'ที่อยู่ทดสอบ'
    },
    planId: 'plan-123',
    plan: {
      id: 'plan-123',
      name: 'แผน 12 งวด',
      months: 12,
      interestRate: 10,
      processingFee: 500,
      isActive: true
    },
    totalAmount: 15000,
    downPayment: 3000,
    financedAmount: 12000,
    totalInterest: 1200,
    processingFee: 500,
    totalPayable: 13700,
    monthlyPayment: 1142,
    contractDate: '2024-01-01',
    firstPaymentDate: '2024-02-01',
    lastPaymentDate: '2024-12-01',
    status: 'active',
    payments: [],
    paidInstallments: 0,
    remainingInstallments: 12,
    totalPaid: 0,
    remainingBalance: 13700,
    branchId: 'branch-123'
  };

  const mockReservations = [
    {
      id: 'reservation-1',
      contractId: 'contract-123',
      contractNumber: 'CONTRACT-2024-001',
      serialNumberId: 'sn-id-1',
      serialNumber: 'SN001',
      productId: 'product-123',
      warehouseId: 'warehouse-123',
      reservedAt: new Date(),
      status: 'reserved' as const,
      notes: 'จองสำหรับสัญญาเช่าซื้อ'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.reservations).toEqual([]);
    });

    it('should have all required methods', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      expect(typeof result.current.reserveStock).toBe('function');
      expect(typeof result.current.confirmSale).toBe('function');
      expect(typeof result.current.releaseStock).toBe('function');
      expect(typeof result.current.trackSNs).toBe('function');
      expect(typeof result.current.getSNHistory).toBe('function');
      expect(typeof result.current.handleContractCreated).toBe('function');
      expect(typeof result.current.handleContractCancelled).toBe('function');
      expect(typeof result.current.handleSaleConfirmed).toBe('function');
    });
  });

  describe('reserveStock', () => {
    it('should successfully reserve stock', async () => {
      const mockService = installmentIntegrationService.reserveStockForContract as any;
      mockService.mockResolvedValue(mockReservations);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        const reservations = await result.current.reserveStock(mockContractData);
        expect(reservations).toEqual(mockReservations);
      });

      await waitFor(() => {
        expect(result.current.reservations).toEqual(mockReservations);
        expect(result.current.error).toBe(null);
        expect(toast.success).toHaveBeenCalledWith('จองสต็อกสำหรับสัญญาเช่าซื้อเรียบร้อย');
      });
    });

    it('should handle reservation errors', async () => {
      const mockError = new Error('สต็อกไม่เพียงพอ');
      const mockService = installmentIntegrationService.reserveStockForContract as any;
      mockService.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        try {
          await result.current.reserveStock(mockContractData);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('สต็อกไม่เพียงพอ');
        expect(toast.error).toHaveBeenCalledWith('สต็อกไม่เพียงพอ');
      });
    });
  });

  describe('confirmSale', () => {
    it('should successfully confirm sale', async () => {
      const mockService = installmentIntegrationService.confirmStockSale as any;
      mockService.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      const saleData = {
        soldTo: 'ลูกค้าทดสอบ',
        saleDate: new Date('2024-01-15'),
        receiptNumber: 'RECEIPT-001'
      };

      await act(async () => {
        await result.current.confirmSale('contract-123', saleData);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(toast.success).toHaveBeenCalledWith('ยืนยันการขายเรียบร้อย');
      });
    });

    it('should handle confirmation errors', async () => {
      const mockError = new Error('ไม่สามารถยืนยันการขายได้');
      const mockService = installmentIntegrationService.confirmStockSale as any;
      mockService.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      const saleData = {
        soldTo: 'ลูกค้าทดสอบ',
        saleDate: new Date('2024-01-15')
      };

      await act(async () => {
        try {
          await result.current.confirmSale('contract-123', saleData);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('ไม่สามารถยืนยันการขายได้');
        expect(toast.error).toHaveBeenCalledWith('ไม่สามารถยืนยันการขายได้');
      });
    });
  });

  describe('releaseStock', () => {
    it('should successfully release stock', async () => {
      const mockService = installmentIntegrationService.releaseReservedStock as any;
      mockService.mockResolvedValue(undefined);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        await result.current.releaseStock('contract-123', 'ยกเลิกสัญญา');
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(toast.success).toHaveBeenCalledWith('ปลดปล่อยสต็อกเรียบร้อย');
      });
    });

    it('should handle release errors', async () => {
      const mockError = new Error('ไม่สามารถปลดปล่อยสต็อกได้');
      const mockService = installmentIntegrationService.releaseReservedStock as any;
      mockService.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        try {
          await result.current.releaseStock('contract-123');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('ไม่สามารถปลดปล่อยสต็อกได้');
        expect(toast.error).toHaveBeenCalledWith('ไม่สามารถปลดปล่อยสต็อกได้');
      });
    });
  });

  describe('trackSNs', () => {
    it('should successfully track SNs', async () => {
      const mockSNs = [
        {
          id: 'sn-1',
          serial_number: 'SN001',
          product_id: 'product-123',
          status: 'sold'
        }
      ];

      const mockService = installmentIntegrationService.trackInstallmentSNs as any;
      mockService.mockResolvedValue(mockSNs);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        const sns = await result.current.trackSNs('contract-123');
        expect(sns).toEqual(mockSNs);
      });

      expect(result.current.error).toBe(null);
    });

    it('should handle tracking errors', async () => {
      const mockError = new Error('ไม่สามารถติดตาม SN ได้');
      const mockService = installmentIntegrationService.trackInstallmentSNs as any;
      mockService.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        try {
          await result.current.trackSNs('contract-123');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('ไม่สามารถติดตาม SN ได้');
      expect(toast.error).toHaveBeenCalledWith('ไม่สามารถติดตาม SN ได้');
    });
  });

  describe('getSNHistory', () => {
    it('should successfully get SN history', async () => {
      const mockHistory = [
        {
          id: 'movement-1',
          movement_type: 'reserve',
          reference_type: 'installment_contract'
        }
      ];

      const mockService = installmentIntegrationService.getInstallmentSNHistory as any;
      mockService.mockResolvedValue(mockHistory);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        const history = await result.current.getSNHistory('SN001');
        expect(history).toEqual(mockHistory);
      });

      expect(result.current.error).toBe(null);
    });

    it('should handle history errors', async () => {
      const mockError = new Error('ไม่สามารถดึงประวัติ SN ได้');
      const mockService = installmentIntegrationService.getInstallmentSNHistory as any;
      mockService.mockRejectedValue(mockError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      await act(async () => {
        try {
          await result.current.getSNHistory('SN001');
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.error).toBe('ไม่สามารถดึงประวัติ SN ได้');
      expect(toast.error).toHaveBeenCalledWith('ไม่สามารถดึงประวัติ SN ได้');
    });
  });

  describe('Integration Hooks', () => {
    describe('handleContractCreated', () => {
      it('should successfully handle contract creation', async () => {
        const mockService = installmentIntegrationService.onInstallmentContractCreated as any;
        mockService.mockResolvedValue(mockReservations);

        const wrapper = createWrapper();
        const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

        const stockItems = [
          {
            productId: 'product-123',
            quantity: 1,
            warehouseId: 'warehouse-123',
            unitPrice: 15000
          }
        ];

        await act(async () => {
          const reservations = await result.current.handleContractCreated(mockContract, stockItems);
          expect(reservations).toEqual(mockReservations);
        });

        await waitFor(() => {
          expect(result.current.reservations).toEqual(mockReservations);
          expect(result.current.error).toBe(null);
          expect(toast.success).toHaveBeenCalledWith('จองสต็อกสำหรับสัญญา CONTRACT-2024-001 เรียบร้อย');
        });
      });
    });

    describe('handleContractCancelled', () => {
      it('should successfully handle contract cancellation', async () => {
        const mockService = installmentIntegrationService.onInstallmentContractCancelled as any;
        mockService.mockResolvedValue(undefined);

        const wrapper = createWrapper();
        const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

        await act(async () => {
          await result.current.handleContractCancelled('contract-123', 'ลูกค้ายกเลิก');
        });

        await waitFor(() => {
          expect(result.current.error).toBe(null);
          expect(toast.success).toHaveBeenCalledWith('ปลดปล่อยสต็อกจากการยกเลิกสัญญาเรียบร้อย');
        });
      });
    });

    describe('handleSaleConfirmed', () => {
      it('should successfully handle sale confirmation', async () => {
        const mockService = installmentIntegrationService.onInstallmentSaleConfirmed as any;
        mockService.mockResolvedValue(undefined);

        const wrapper = createWrapper();
        const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

        const saleData = {
          soldTo: 'ลูกค้าทดสอบ',
          saleDate: new Date('2024-01-15'),
          receiptNumber: 'RECEIPT-001'
        };

        await act(async () => {
          await result.current.handleSaleConfirmed('contract-123', saleData);
        });

        await waitFor(() => {
          expect(result.current.error).toBe(null);
          expect(toast.success).toHaveBeenCalledWith('ยืนยันการขายผ่านสัญญาเช่าซื้อเรียบร้อย');
        });
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during operations', async () => {
      const mockService = installmentIntegrationService.reserveStockForContract as any;
      mockService.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useInstallmentIntegration(), { wrapper });

      act(() => {
        result.current.reserveStock(mockContractData);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});

describe('useInstallmentSNs', () => {
  it('should fetch installment SNs', async () => {
    const mockSNs = [
      {
        id: 'sn-1',
        serial_number: 'SN001',
        status: 'sold'
      }
    ];

    const mockService = installmentIntegrationService.trackInstallmentSNs as any;
    mockService.mockResolvedValue(mockSNs);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInstallmentSNs('contract-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSNs);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should not fetch when contractId is empty', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useInstallmentSNs(''), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useInstallmentSNHistory', () => {
  it('should fetch SN history', async () => {
    const mockHistory = [
      {
        id: 'movement-1',
        movement_type: 'reserve'
      }
    ];

    const mockService = installmentIntegrationService.getInstallmentSNHistory as any;
    mockService.mockResolvedValue(mockHistory);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInstallmentSNHistory('SN001'), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockHistory);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  it('should not fetch when serialNumber is empty', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useInstallmentSNHistory(''), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});