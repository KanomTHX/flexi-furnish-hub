// Simple unit tests for Serial Number Service
import { describe, it, expect, vi } from 'vitest';
import { SNStatus } from '@/types/warehouse';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock the generator utility
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

import { SerialNumberServiceImpl } from '../serialNumberService';

describe('SerialNumberService - Core Functionality', () => {
  let service: SerialNumberServiceImpl;

  beforeEach(() => {
    service = new SerialNumberServiceImpl();
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(SerialNumberServiceImpl);
    });

    it('should have all required methods', () => {
      expect(typeof service.createSerialNumbers).toBe('function');
      expect(typeof service.generateAndCreateSNs).toBe('function');
      expect(typeof service.getSerialNumber).toBe('function');
      expect(typeof service.getSerialNumberByCode).toBe('function');
      expect(typeof service.searchSerialNumbers).toBe('function');
      expect(typeof service.updateSerialNumberStatus).toBe('function');
      expect(typeof service.bulkUpdateStatus).toBe('function');
      expect(typeof service.transferSerialNumbers).toBe('function');
      expect(typeof service.validateSerialNumberUniqueness).toBe('function');
      expect(typeof service.checkSerialNumberAvailability).toBe('function');
      expect(typeof service.getSerialNumberStats).toBe('function');
      expect(typeof service.getMovementHistory).toBe('function');
      expect(typeof service.bulkCreateSerialNumbers).toBe('function');
      expect(typeof service.bulkDeleteSerialNumbers).toBe('function');
    });
  });

  describe('Data Validation', () => {
    it('should validate serial number status enum', () => {
      const validStatuses = ['available', 'sold', 'transferred', 'claimed', 'damaged', 'reserved'];
      
      validStatuses.forEach(status => {
        expect(Object.values(SNStatus)).toContain(status);
      });
    });

    it('should have correct SNStatus enum values', () => {
      expect(SNStatus.AVAILABLE).toBe('available');
      expect(SNStatus.SOLD).toBe('sold');
      expect(SNStatus.TRANSFERRED).toBe('transferred');
      expect(SNStatus.CLAIMED).toBe('claimed');
      expect(SNStatus.DAMAGED).toBe('damaged');
      expect(SNStatus.RESERVED).toBe('reserved');
    });
  });

  describe('Interface Compliance', () => {
    it('should implement all required service methods', () => {
      const requiredMethods = [
        'createSerialNumbers',
        'generateAndCreateSNs',
        'getSerialNumber',
        'getSerialNumberByCode',
        'searchSerialNumbers',
        'getSerialNumbersByProduct',
        'getSerialNumbersByWarehouse',
        'updateSerialNumberStatus',
        'updateSerialNumber',
        'bulkUpdateStatus',
        'transferSerialNumbers',
        'moveSerialNumbers',
        'validateSerialNumberUniqueness',
        'checkSerialNumberAvailability',
        'getSerialNumberStats',
        'getMovementHistory',
        'bulkCreateSerialNumbers',
        'bulkDeleteSerialNumbers'
      ];

      requiredMethods.forEach(method => {
        expect(service).toHaveProperty(method);
        expect(typeof (service as any)[method]).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      // Test with empty search filters
      const result = await service.searchSerialNumbers({});
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
    });

    it('should return null for non-existent serial number', async () => {
      const result = await service.getSerialNumber('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return empty array for empty search results', async () => {
      const result = await service.searchSerialNumbers({ searchTerm: 'non-existent' });
      
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('Method Return Types', () => {
    it('should return correct types for search methods', async () => {
      const searchResult = await service.searchSerialNumbers({});
      
      expect(searchResult).toHaveProperty('data');
      expect(searchResult).toHaveProperty('total');
      expect(searchResult).toHaveProperty('hasMore');
      expect(Array.isArray(searchResult.data)).toBe(true);
    });

    it('should return correct types for stats methods', async () => {
      const stats = await service.getSerialNumberStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byWarehouse');
      expect(stats).toHaveProperty('totalValue');
      expect(stats).toHaveProperty('averageCost');
      expect(stats).toHaveProperty('recentActivity');
      
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.totalValue).toBe('number');
      expect(typeof stats.averageCost).toBe('number');
      expect(typeof stats.byStatus).toBe('object');
      expect(typeof stats.byWarehouse).toBe('object');
      expect(typeof stats.recentActivity).toBe('object');
    });

    it('should return correct types for movement history', async () => {
      const movements = await service.getMovementHistory('test-id');
      
      expect(Array.isArray(movements)).toBe(true);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle default configuration', () => {
      // This tests that the service can be instantiated with default config
      const newService = new SerialNumberServiceImpl();
      expect(newService).toBeInstanceOf(SerialNumberServiceImpl);
    });
  });

  describe('Async Method Behavior', () => {
    it('should return promises for async methods', () => {
      const methods = [
        'createSerialNumbers',
        'generateAndCreateSNs',
        'getSerialNumber',
        'getSerialNumberByCode',
        'searchSerialNumbers',
        'getSerialNumbersByProduct',
        'getSerialNumbersByWarehouse',
        'updateSerialNumberStatus',
        'updateSerialNumber',
        'bulkUpdateStatus',
        'transferSerialNumbers',
        'moveSerialNumbers',
        'validateSerialNumberUniqueness',
        'checkSerialNumberAvailability',
        'getSerialNumberStats',
        'getMovementHistory',
        'bulkCreateSerialNumbers',
        'bulkDeleteSerialNumbers'
      ];

      methods.forEach(method => {
        const mockData = method === 'createSerialNumbers' || method === 'generateAndCreateSNs' || method === 'bulkCreateSerialNumbers'
          ? { productId: 'test', warehouseId: 'test', serialNumbers: ['test'], unitCost: 100 }
          : method === 'updateSerialNumberStatus' || method === 'bulkUpdateStatus'
          ? 'test-id'
          : method === 'transferSerialNumbers' || method === 'moveSerialNumbers'
          ? { serialNumberIds: ['test'], fromWarehouseId: 'test', toWarehouseId: 'test', performedBy: 'test' }
          : 'test-id';

        const result = (service as any)[method](mockData, 'available');
        expect(result).toBeInstanceOf(Promise);
      });
    });
  });
});