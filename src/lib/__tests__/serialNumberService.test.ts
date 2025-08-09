// Unit tests for Serial Number Service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SerialNumberServiceImpl } from '../serialNumberService';
import { SNStatus } from '@/types/warehouse';

// Mock dependencies
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      or: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              range: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
              }))
            }))
          }))
        }))
      })),
      in: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      in: vi.fn(() => Promise.resolve({ error: null }))
    })),
    delete: vi.fn(() => ({
      in: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

vi.mock('@/utils/serialNumberGenerator', () => ({
  generateSerialNumbers: vi.fn(),
  validateSerialNumber: vi.fn(),
  checkSerialNumberExists: vi.fn(),
  DEFAULT_SN_CONFIG: {
    pattern: "{productCode}-{year}-{sequence:3}",
    includeYear: true,
    includeMonth: false,
    sequenceLength: 3,
    separator: "-",
    resetSequenceYearly: true,
    resetSequenceMonthly: false,
  }
}));

import { generateSerialNumbers, validateSerialNumber } from '@/utils/serialNumberGenerator';

describe('SerialNumberService', () => {
  let service: SerialNumberServiceImpl;

  beforeEach(() => {
    service = new SerialNumberServiceImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSerialNumbers', () => {
    it('should create serial numbers successfully', async () => {
      // Mock validation
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: false,
        errors: [],
        suggestions: []
      });

      // Mock database insert
      const mockCreatedSNs = [
        {
          id: 'sn1',
          serial_number: 'SF001-2024-001',
          product_id: 'product1',
          warehouse_id: 'warehouse1',
          unit_cost: 1000,
          status: 'available'
        },
        {
          id: 'sn2',
          serial_number: 'SF001-2024-002',
          product_id: 'product1',
          warehouse_id: 'warehouse1',
          unit_cost: 1000,
          status: 'available'
        }
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: mockCreatedSNs,
            error: null
          }))
        }))
      });

      const data = {
        productId: 'product1',
        warehouseId: 'warehouse1',
        serialNumbers: ['SF001-2024-001', 'SF001-2024-002'],
        unitCost: 1000,
        supplierId: 'supplier1',
        invoiceNumber: 'INV001'
      };

      const result = await service.createSerialNumbers(data);

      expect(result).toHaveLength(2);
      expect(result[0].serial_number).toBe('SF001-2024-001');
      expect(result[1].serial_number).toBe('SF001-2024-002');
    });

    it('should reject invalid serial numbers', async () => {
      // Mock validation failure
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: false,
        exists: false,
        errors: ['Invalid format'],
        suggestions: []
      });

      const data = {
        productId: 'product1',
        warehouseId: 'warehouse1',
        serialNumbers: ['INVALID-SN'],
        unitCost: 1000
      };

      await expect(service.createSerialNumbers(data)).rejects.toThrow('Validation errors');
    });

    it('should reject duplicate serial numbers', async () => {
      // Mock validation - exists
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: true,
        errors: [],
        suggestions: []
      });

      const data = {
        productId: 'product1',
        warehouseId: 'warehouse1',
        serialNumbers: ['SF001-2024-001'],
        unitCost: 1000
      };

      await expect(service.createSerialNumbers(data)).rejects.toThrow('already exists');
    });

    it('should handle database errors', async () => {
      // Mock validation success
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: false,
        errors: [],
        suggestions: []
      });

      // Mock database error
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      });

      const data = {
        productId: 'product1',
        warehouseId: 'warehouse1',
        serialNumbers: ['SF001-2024-001'],
        unitCost: 1000
      };

      await expect(service.createSerialNumbers(data)).rejects.toThrow('Failed to create serial numbers');
    });
  });

  describe('generateAndCreateSNs', () => {
    it('should generate and create serial numbers', async () => {
      // Mock generation
      vi.mocked(generateSerialNumbers).mockResolvedValue({
        serialNumbers: ['SF001-2024-001', 'SF001-2024-002'],
        success: true,
        errors: [],
        duplicates: []
      });

      // Mock validation
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: false,
        errors: [],
        suggestions: []
      });

      // Mock database insert
      const mockCreatedSNs = [
        {
          id: 'sn1',
          serial_number: 'SF001-2024-001',
          product_id: 'product1',
          warehouse_id: 'warehouse1',
          unit_cost: 1000,
          status: 'available'
        },
        {
          id: 'sn2',
          serial_number: 'SF001-2024-002',
          product_id: 'product1',
          warehouse_id: 'warehouse1',
          unit_cost: 1000,
          status: 'available'
        }
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: mockCreatedSNs,
            error: null
          }))
        }))
      });

      const data = {
        productId: 'product1',
        productCode: 'SF001',
        warehouseId: 'warehouse1',
        quantity: 2,
        unitCost: 1000
      };

      const result = await service.generateAndCreateSNs(data);

      expect(result).toHaveLength(2);
      expect(generateSerialNumbers).toHaveBeenCalledWith('SF001', 2, expect.any(Object));
    });

    it('should handle generation failures', async () => {
      // Mock generation failure
      vi.mocked(generateSerialNumbers).mockResolvedValue({
        serialNumbers: [],
        success: false,
        errors: ['Generation failed'],
        duplicates: []
      });

      const data = {
        productId: 'product1',
        productCode: 'SF001',
        warehouseId: 'warehouse1',
        quantity: 2,
        unitCost: 1000
      };

      await expect(service.generateAndCreateSNs(data)).rejects.toThrow('Failed to generate serial numbers');
    });
  });

  describe('getSerialNumber', () => {
    it('should retrieve serial number by ID', async () => {
      const mockSN = {
        id: 'sn1',
        serial_number: 'SF001-2024-001',
        product_id: 'product1',
        warehouse_id: 'warehouse1',
        unit_cost: 1000,
        status: 'available'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockSN,
              error: null
            }))
          }))
        }))
      });

      const result = await service.getSerialNumber('sn1');

      expect(result).toEqual(mockSN);
    });

    it('should return null for non-existent serial number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      });

      const result = await service.getSerialNumber('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      const result = await service.getSerialNumber('sn1');

      expect(result).toBeNull();
    });
  });

  describe('getSerialNumberByCode', () => {
    it('should retrieve serial number by code', async () => {
      const mockSN = {
        id: 'sn1',
        serial_number: 'SF001-2024-001',
        product_id: 'product1',
        warehouse_id: 'warehouse1',
        unit_cost: 1000,
        status: 'available'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockSN,
              error: null
            }))
          }))
        }))
      });

      const result = await service.getSerialNumberByCode('SF001-2024-001');

      expect(result).toEqual(mockSN);
    });
  });

  describe('searchSerialNumbers', () => {
    it('should search serial numbers with filters', async () => {
      const mockSNs = [
        {
          id: 'sn1',
          serial_number: 'SF001-2024-001',
          product_id: 'product1',
          warehouse_id: 'warehouse1',
          unit_cost: 1000,
          status: 'available'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  range: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({
                      data: mockSNs,
                      error: null,
                      count: 1
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const filters = {
        searchTerm: 'SF001',
        warehouseId: 'warehouse1',
        status: 'available' as SNStatus,
        limit: 10,
        offset: 0
      };

      const result = await service.searchSerialNumbers(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty search results', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  range: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({
                      data: [],
                      error: null,
                      count: 0
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const result = await service.searchSerialNumbers({});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('updateSerialNumberStatus', () => {
    it('should update serial number status', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      await service.updateSerialNumberStatus('sn1', 'sold', {
        soldTo: 'Customer 1',
        referenceNumber: 'SALE001',
        notes: 'Sold to customer'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should handle update errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: { message: 'Update failed' }
          }))
        }))
      });

      await expect(service.updateSerialNumberStatus('sn1', 'sold')).rejects.toThrow('Failed to update serial number status');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update multiple serial numbers status', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      await service.bulkUpdateStatus(['sn1', 'sn2'], 'sold', {
        soldTo: 'Customer 1',
        referenceNumber: 'SALE001'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
    });
  });

  describe('transferSerialNumbers', () => {
    it('should transfer serial numbers between warehouses', async () => {
      // Mock get serial number
      const mockSN = {
        id: 'sn1',
        productId: 'product1',
        unitCost: 1000
      };

      // Mock the getSerialNumber method
      vi.spyOn(service, 'getSerialNumber').mockResolvedValue(mockSN as any);

      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ error: null }))
        })),
        insert: vi.fn(() => Promise.resolve({ error: null }))
      });

      const transferData = {
        serialNumberIds: ['sn1'],
        fromWarehouseId: 'warehouse1',
        toWarehouseId: 'warehouse2',
        performedBy: 'user1',
        notes: 'Transfer test'
      };

      await service.transferSerialNumbers(transferData);

      expect(service.getSerialNumber).toHaveBeenCalledWith('sn1');
    });

    it('should handle transfer errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            error: { message: 'Transfer failed' }
          }))
        }))
      });

      const transferData = {
        serialNumberIds: ['sn1'],
        fromWarehouseId: 'warehouse1',
        toWarehouseId: 'warehouse2',
        performedBy: 'user1'
      };

      await expect(service.transferSerialNumbers(transferData)).rejects.toThrow('Failed to transfer serial numbers');
    });
  });

  describe('validateSerialNumberUniqueness', () => {
    it('should validate uniqueness', async () => {
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: false,
        errors: [],
        suggestions: []
      });

      const result = await service.validateSerialNumberUniqueness('SF001-2024-001');

      expect(result).toBe(true);
    });

    it('should detect duplicates', async () => {
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: true,
        errors: [],
        suggestions: []
      });

      const result = await service.validateSerialNumberUniqueness('SF001-2024-001');

      expect(result).toBe(false);
    });
  });

  describe('checkSerialNumberAvailability', () => {
    it('should check availability', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { status: 'available' },
              error: null
            }))
          }))
        }))
      });

      const result = await service.checkSerialNumberAvailability('sn1');

      expect(result).toBe(true);
    });

    it('should return false for non-available status', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { status: 'sold' },
              error: null
            }))
          }))
        }))
      });

      const result = await service.checkSerialNumberAvailability('sn1');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Error' }
            }))
          }))
        }))
      });

      const result = await service.checkSerialNumberAvailability('sn1');

      expect(result).toBe(false);
    });
  });

  describe('getSerialNumberStats', () => {
    it('should return statistics', async () => {
      const mockStats = [
        { status: 'available', unit_cost: 1000, warehouse_id: 'w1', created_at: new Date().toISOString() },
        { status: 'sold', unit_cost: 1200, warehouse_id: 'w1', created_at: new Date().toISOString() },
        { status: 'available', unit_cost: 1100, warehouse_id: 'w2', created_at: new Date().toISOString() }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: mockStats,
            error: null
          }))
        }))
      });

      const result = await service.getSerialNumberStats('product1');

      expect(result.total).toBe(3);
      expect(result.byStatus.available).toBe(2);
      expect(result.byStatus.sold).toBe(1);
      expect(result.totalValue).toBe(3300);
      expect(result.averageCost).toBe(1100);
    });

    it('should handle empty results', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      });

      const result = await service.getSerialNumberStats();

      expect(result.total).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.averageCost).toBe(0);
    });
  });

  describe('bulkCreateSerialNumbers', () => {
    it('should create multiple serial numbers', async () => {
      // Mock validation
      vi.mocked(validateSerialNumber).mockResolvedValue({
        isValid: true,
        exists: false,
        errors: [],
        suggestions: []
      });

      const mockCreatedSNs = [
        { id: 'sn1', serial_number: 'SF001-2024-001' },
        { id: 'sn2', serial_number: 'SF001-2024-002' }
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({
            data: mockCreatedSNs,
            error: null
          }))
        }))
      });

      const data = [
        {
          serialNumber: 'SF001-2024-001',
          productId: 'product1',
          warehouseId: 'warehouse1',
          unitCost: 1000
        },
        {
          serialNumber: 'SF001-2024-002',
          productId: 'product1',
          warehouseId: 'warehouse1',
          unitCost: 1000
        }
      ];

      const result = await service.bulkCreateSerialNumbers(data);

      expect(result).toHaveLength(2);
    });
  });

  describe('bulkDeleteSerialNumbers', () => {
    it('should delete multiple serial numbers', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ error: null }))
        }))
      });

      await service.bulkDeleteSerialNumbers(['sn1', 'sn2']);

      expect(mockSupabase.from).toHaveBeenCalledWith('product_serial_numbers');
    });

    it('should handle delete errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({
            error: { message: 'Delete failed' }
          }))
        }))
      });

      await expect(service.bulkDeleteSerialNumbers(['sn1'])).rejects.toThrow('Failed to bulk delete serial numbers');
    });
  });
});