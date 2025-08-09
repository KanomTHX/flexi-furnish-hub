// ===================================================================
// INSTALLMENT INTEGRATION SERVICE TESTS
// ทดสอบบริการเชื่อมโยงระบบเช่าซื้อกับระบบคลังสินค้า
// ===================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  installmentIntegrationService,
  reserveStockForContract,
  confirmStockSale,
  releaseReservedStock,
  trackInstallmentSNs,
  getInstallmentSNHistory,
  onInstallmentContractCreated,
  onInstallmentContractCancelled,
  onInstallmentSaleConfirmed,
  type ContractStockData,
  type InstallmentStockItem
} from '../installmentIntegrationService';
import { InstallmentContract } from '@/types/installments';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
            in: vi.fn(() => ({ data: [], error: null })),
            order: vi.fn(() => ({ data: [], error: null }))
          })),
          in: vi.fn(() => ({ data: [], error: null })),
          limit: vi.fn(() => ({ data: [], error: null }))
        })),
        in: vi.fn(() => ({ data: [], error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null }))
    }))
  }
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
});

describe('InstallmentIntegrationService', () => {
  const mockContractData: ContractStockData = {
    contractId: 'contract-123',
    contractNumber: 'CONTRACT-2024-001',
    customerId: 'customer-123',
    branchId: 'branch-123',
    items: [
      {
        productId: 'product-123',
        quantity: 2,
        warehouseId: 'warehouse-123',
        unitPrice: 15000,
        serialNumbers: ['SN001', 'SN002']
      }
    ]
  };

  const mockSerialNumbers = [
    {
      id: 'sn-id-1',
      serial_number: 'SN001',
      product_id: 'product-123',
      warehouse_id: 'warehouse-123',
      status: 'available',
      unit_cost: 15000
    },
    {
      id: 'sn-id-2',
      serial_number: 'SN002',
      product_id: 'product-123',
      warehouse_id: 'warehouse-123',
      status: 'available',
      unit_cost: 15000
    }
  ];

  const mockInstallmentContract: InstallmentContract = {
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
    totalAmount: 30000,
    downPayment: 5000,
    financedAmount: 25000,
    totalInterest: 2500,
    processingFee: 500,
    totalPayable: 28000,
    monthlyPayment: 2333,
    contractDate: '2024-01-01',
    firstPaymentDate: '2024-02-01',
    lastPaymentDate: '2024-12-01',
    status: 'active',
    payments: [],
    paidInstallments: 0,
    remainingInstallments: 12,
    totalPaid: 0,
    remainingBalance: 28000,
    branchId: 'branch-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reserveStockForContract', () => {
    it('should successfully reserve stock for contract', async () => {
      // Mock available serial numbers
      const mockFrom = vi.fn((table) => {
        if (table === 'product_serial_numbers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      data: mockSerialNumbers,
                      error: null
                    }))
                  }))
                }))
              }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          };
        }
        if (table === 'stock_movements') {
          return {
            insert: vi.fn(() => ({ error: null }))
          };
        }
        return {
          select: vi.fn(() => ({ data: [], error: null })),
          update: vi.fn(() => ({ error: null })),
          insert: vi.fn(() => ({ error: null }))
        };
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await reserveStockForContract(mockContractData);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        contractId: 'contract-123',
        contractNumber: 'CONTRACT-2024-001',
        serialNumber: 'SN001',
        status: 'reserved'
      });

      // Verify SN status update was called
      expect(mockFrom).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should throw error when insufficient stock', async () => {
      // Mock insufficient stock
      const mockFrom = vi.fn((table) => {
        if (table === 'product_serial_numbers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      data: [mockSerialNumbers[0]], // Only 1 SN available, need 2
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          };
        }
        return {
          select: vi.fn(() => ({ data: [], error: null })),
          update: vi.fn(() => ({ error: null })),
          insert: vi.fn(() => ({ error: null }))
        };
      });

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(reserveStockForContract(mockContractData))
        .rejects.toThrow('สต็อกไม่เพียงพอสำหรับสินค้า');
    });

    it('should handle database errors', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: null,
                  error: { message: 'Database error' }
                }))
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(reserveStockForContract(mockContractData))
        .rejects.toThrow('ไม่สามารถหา SN ที่ว่างได้');
    });
  });

  describe('confirmStockSale', () => {
    it('should successfully confirm stock sale', async () => {
      const mockReservedSNs = [
        {
          id: 'sn-id-1',
          serial_number: 'SN001',
          product_id: 'product-123',
          warehouse_id: 'warehouse-123',
          status: 'reserved',
          reference_number: 'CONTRACT-2024-001'
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: mockReservedSNs,
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        })),
        insert: vi.fn(() => ({ error: null }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const saleData = {
        soldTo: 'ลูกค้าทดสอบ',
        saleDate: new Date('2024-01-15'),
        receiptNumber: 'RECEIPT-001'
      };

      await expect(confirmStockSale('contract-123', saleData))
        .resolves.not.toThrow();

      // Verify update was called
      expect(mockFrom).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should handle errors during sale confirmation', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const saleData = {
        soldTo: 'ลูกค้าทดสอบ',
        saleDate: new Date('2024-01-15')
      };

      await expect(confirmStockSale('contract-123', saleData))
        .rejects.toThrow('ไม่สามารถยืนยันการขายได้');
    });
  });

  describe('releaseReservedStock', () => {
    it('should successfully release reserved stock', async () => {
      const mockReservedSNs = [
        {
          id: 'sn-id-1',
          serial_number: 'SN001',
          product_id: 'product-123',
          warehouse_id: 'warehouse-123',
          status: 'reserved',
          reference_number: 'CONTRACT-2024-001'
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: mockReservedSNs,
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        })),
        insert: vi.fn(() => ({ error: null }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(releaseReservedStock('contract-123', 'ยกเลิกสัญญา'))
        .resolves.not.toThrow();

      // Verify update was called
      expect(mockFrom).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should handle errors during stock release', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(releaseReservedStock('contract-123'))
        .rejects.toThrow('ไม่สามารถปลดปล่อยสต็อกได้');
    });
  });

  describe('trackInstallmentSNs', () => {
    it('should successfully track installment SNs', async () => {
      const mockSNs = [
        {
          id: 'sn-id-1',
          serial_number: 'SN001',
          product_id: 'product-123',
          status: 'sold',
          products: {
            name: 'โซฟา 3 ที่นั่ง',
            code: 'SF001',
            brand: 'Brand A',
            model: 'Model X'
          }
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              data: mockSNs,
              error: null
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await trackInstallmentSNs('contract-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        serial_number: 'SN001',
        status: 'sold'
      });
    });

    it('should handle errors during SN tracking', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(trackInstallmentSNs('contract-123'))
        .rejects.toThrow('ไม่สามารถติดตาม SN ได้');
    });
  });

  describe('getInstallmentSNHistory', () => {
    it('should successfully get SN history', async () => {
      const mockHistory = [
        {
          id: 'movement-1',
          movement_type: 'reserve',
          quantity: 1,
          reference_type: 'installment_contract',
          reference_number: 'CONTRACT-2024-001',
          created_at: '2024-01-01T00:00:00Z',
          product_serial_numbers: {
            serial_number: 'SN001'
          }
        }
      ];

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockHistory,
                error: null
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await getInstallmentSNHistory('SN001');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        movement_type: 'reserve',
        reference_type: 'installment_contract'
      });
    });

    it('should handle errors during history retrieval', async () => {
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                data: null,
                error: { message: 'Database error' }
              }))
            }))
          }))
        }))
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      await expect(getInstallmentSNHistory('SN001'))
        .rejects.toThrow('ไม่สามารถดึงประวัติ SN ได้');
    });
  });

  describe('Integration Hooks', () => {
    describe('onInstallmentContractCreated', () => {
      it('should successfully handle contract creation', async () => {
        const mockStockItems: InstallmentStockItem[] = [
          {
            productId: 'product-123',
            quantity: 1,
            warehouseId: 'warehouse-123',
            unitPrice: 15000
          }
        ];

        // Mock successful reservation
        const mockFrom = vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [mockSerialNumbers[0]],
                    error: null
                  }))
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null }))
          })),
          insert: vi.fn(() => ({ error: null }))
        }));

        (supabase.from as any).mockImplementation(mockFrom);

        const result = await onInstallmentContractCreated(
          mockInstallmentContract,
          mockStockItems
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          contractId: 'contract-123',
          status: 'reserved'
        });
      });

      it('should handle errors during contract creation', async () => {
        const mockStockItems: InstallmentStockItem[] = [
          {
            productId: 'product-123',
            quantity: 1,
            warehouseId: 'warehouse-123',
            unitPrice: 15000
          }
        ];

        // Mock error
        const mockFrom = vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: null,
                    error: { message: 'Database error' }
                  }))
                }))
              }))
            }))
          }))
        }));

        (supabase.from as any).mockImplementation(mockFrom);

        await expect(onInstallmentContractCreated(
          mockInstallmentContract,
          mockStockItems
        )).rejects.toThrow();
      });
    });

    describe('onInstallmentContractCancelled', () => {
      it('should successfully handle contract cancellation', async () => {
        const mockReservedSNs = [
          {
            id: 'sn-id-1',
            serial_number: 'SN001',
            product_id: 'product-123',
            warehouse_id: 'warehouse-123',
            status: 'reserved',
            reference_number: 'contract-123'
          }
        ];

        const mockFrom = vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockReservedSNs,
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null }))
          })),
          insert: vi.fn(() => ({ error: null }))
        }));

        (supabase.from as any).mockImplementation(mockFrom);

        await expect(onInstallmentContractCancelled('contract-123', 'ลูกค้ายกเลิก'))
          .resolves.not.toThrow();
      });
    });

    describe('onInstallmentSaleConfirmed', () => {
      it('should successfully handle sale confirmation', async () => {
        const mockReservedSNs = [
          {
            id: 'sn-id-1',
            serial_number: 'SN001',
            product_id: 'product-123',
            warehouse_id: 'warehouse-123',
            status: 'reserved',
            reference_number: 'contract-123'
          }
        ];

        const mockFrom = vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: mockReservedSNs,
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null }))
          })),
          insert: vi.fn(() => ({ error: null }))
        }));

        (supabase.from as any).mockImplementation(mockFrom);

        const saleData = {
          soldTo: 'ลูกค้าทดสอบ',
          saleDate: new Date('2024-01-15'),
          receiptNumber: 'RECEIPT-001'
        };

        await expect(onInstallmentSaleConfirmed('contract-123', saleData))
          .resolves.not.toThrow();
      });
    });
  });

  describe('Service Object', () => {
    it('should export all required methods', () => {
      expect(installmentIntegrationService).toHaveProperty('reserveStockForContract');
      expect(installmentIntegrationService).toHaveProperty('confirmStockSale');
      expect(installmentIntegrationService).toHaveProperty('releaseReservedStock');
      expect(installmentIntegrationService).toHaveProperty('trackInstallmentSNs');
      expect(installmentIntegrationService).toHaveProperty('getInstallmentSNHistory');
      expect(installmentIntegrationService).toHaveProperty('onInstallmentContractCreated');
      expect(installmentIntegrationService).toHaveProperty('onInstallmentContractCancelled');
      expect(installmentIntegrationService).toHaveProperty('onInstallmentSaleConfirmed');
    });

    it('should have all methods as functions', () => {
      expect(typeof installmentIntegrationService.reserveStockForContract).toBe('function');
      expect(typeof installmentIntegrationService.confirmStockSale).toBe('function');
      expect(typeof installmentIntegrationService.releaseReservedStock).toBe('function');
      expect(typeof installmentIntegrationService.trackInstallmentSNs).toBe('function');
      expect(typeof installmentIntegrationService.getInstallmentSNHistory).toBe('function');
      expect(typeof installmentIntegrationService.onInstallmentContractCreated).toBe('function');
      expect(typeof installmentIntegrationService.onInstallmentContractCancelled).toBe('function');
      expect(typeof installmentIntegrationService.onInstallmentSaleConfirmed).toBe('function');
    });
  });
});