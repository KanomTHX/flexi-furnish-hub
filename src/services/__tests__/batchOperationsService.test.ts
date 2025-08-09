import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchOperationsService } from '../batchOperationsService';
import { BatchOperation } from '@/components/warehouses/BatchOperations';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('BatchOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processBatch', () => {
    it('processes transfer operation successfully', async () => {
      const operation: BatchOperation = {
        type: 'transfer',
        targetWarehouseId: 'warehouse-2'
      };
      const serialNumbers = ['SN-001', 'SN-002'];

      // Mock successful responses
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'available'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: 'sn-2',
            serial_number: 'SN-002',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'available'
          },
          error: null
        });

      mockSupabase.from().insert().select().single
        .mockResolvedValue({
          data: { id: 'transfer-1', transfer_number: 'T-001' },
          error: null
        });

      mockSupabase.from().insert
        .mockResolvedValue({ error: null });

      mockSupabase.from().update().eq
        .mockResolvedValue({ error: null });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });

    it('handles partial failures', async () => {
      const operation: BatchOperation = {
        type: 'withdraw'
      };
      const serialNumbers = ['SN-001', 'SN-002'];

      // Mock one success, one failure
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'available'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Serial number not found' }
        });

      mockSupabase.from().update().eq
        .mockResolvedValue({ error: null });

      mockSupabase.from().insert
        .mockResolvedValue({ error: null });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.failed[0].serialNumber).toBe('SN-002');
    });

    it('handles adjustment operation', async () => {
      const operation: BatchOperation = {
        type: 'adjust',
        adjustmentReason: 'Stock count correction'
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockResolvedValue({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'available'
          },
          error: null
        });

      mockSupabase.from().insert().select().single
        .mockResolvedValue({
          data: { id: 'adj-1', adjustment_number: 'ADJ-001' },
          error: null
        });

      mockSupabase.from().insert
        .mockResolvedValue({ error: null });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    it('handles status update operation', async () => {
      const operation: BatchOperation = {
        type: 'status_update',
        newStatus: 'damaged'
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockResolvedValue({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'available'
          },
          error: null
        });

      mockSupabase.from().update().eq
        .mockResolvedValue({ error: null });

      mockSupabase.from().insert
        .mockResolvedValue({ error: null });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });

    it('validates serial number availability for transfer', async () => {
      const operation: BatchOperation = {
        type: 'transfer',
        targetWarehouseId: 'warehouse-2'
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockResolvedValue({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            product_id: 'prod-1',
            warehouse_id: 'warehouse-1',
            unit_cost: 1000,
            status: 'sold' // Not available
          },
          error: null
        });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('not available for transfer');
    });
  });

  describe('validateSerialNumbers', () => {
    it('validates existing serial numbers', async () => {
      const serialNumbers = ['SN-001', 'SN-002', 'SN-999'];

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            serial_number: 'SN-001',
            products: { name: 'Product 1' },
            warehouses: { name: 'Warehouse 1' }
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            serial_number: 'SN-002',
            products: { name: 'Product 2' },
            warehouses: { name: 'Warehouse 1' }
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await batchOperationsService.validateSerialNumbers(serialNumbers);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.valid[0].serialNumber).toBe('SN-001');
      expect(result.valid[1].serialNumber).toBe('SN-002');
      expect(result.invalid[0].serialNumber).toBe('SN-999');
      expect(result.invalid[0].reason).toBe('Serial number not found');
    });

    it('handles validation errors', async () => {
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockRejectedValue(new Error('Database error'));

      const result = await batchOperationsService.validateSerialNumbers(serialNumbers);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].reason).toBe('Validation error');
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      const operation: BatchOperation = {
        type: 'withdraw'
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockRejectedValue(new Error('Database connection failed'));

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('Database connection failed');
    });

    it('handles unsupported operation types', async () => {
      const operation: BatchOperation = {
        type: 'unsupported' as any
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockResolvedValue({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            status: 'available'
          },
          error: null
        });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('Unsupported operation type');
    });
  });

  describe('print labels operation', () => {
    it('processes print labels operation', async () => {
      const operation: BatchOperation = {
        type: 'print_labels'
      };
      const serialNumbers = ['SN-001'];

      mockSupabase.from().select().eq().single
        .mockResolvedValue({
          data: {
            id: 'sn-1',
            serial_number: 'SN-001',
            products: { name: 'Product 1', code: 'P001' }
          },
          error: null
        });

      const result = await batchOperationsService.processBatch(operation, serialNumbers);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });
  });
});