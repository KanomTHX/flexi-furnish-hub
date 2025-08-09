import { describe, it, expect } from 'vitest';
import {
  validateSerialNumber,
  validateSerialNumbers,
  validateQuantity,
  validateUnitCost,
  validateUUID,
  validateEmail,
  validateDateRange,
  sanitizeString,
  sanitizeSerialNumber,
  sanitizeNumericInput,
  validateReceiveGoods,
  validateTransfer,
  validateAdjustment,
  validateStockOperation,
  validateTransferOperation,
  ValidationError
} from '../validation';

describe('Validation Utils', () => {
  describe('validateSerialNumber', () => {
    it('validates correct serial numbers', () => {
      expect(validateSerialNumber('ABC-123')).toBe(true);
      expect(validateSerialNumber('TEST_456')).toBe(true);
      expect(validateSerialNumber('PRODUCT-2024-001')).toBe(true);
      expect(validateSerialNumber('12345')).toBe(true);
    });

    it('rejects invalid serial numbers', () => {
      expect(validateSerialNumber('AB')).toBe(false); // Too short
      expect(validateSerialNumber('A'.repeat(51))).toBe(false); // Too long
      expect(validateSerialNumber('ABC@123')).toBe(false); // Invalid characters
      expect(validateSerialNumber('ABC 123')).toBe(false); // Contains space
      expect(validateSerialNumber('')).toBe(false); // Empty
    });
  });

  describe('validateSerialNumbers', () => {
    it('separates valid and invalid serial numbers', () => {
      const sns = ['VALID-123', 'AB', 'ANOTHER-VALID', 'INVALID@#$', 'GOOD_456'];
      const result = validateSerialNumbers(sns);
      
      expect(result.valid).toEqual(['VALID-123', 'ANOTHER-VALID', 'GOOD_456']);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].sn).toBe('AB');
      expect(result.invalid[1].sn).toBe('INVALID@#$');
    });

    it('handles empty array', () => {
      const result = validateSerialNumbers([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });
  });

  describe('validateQuantity', () => {
    it('validates positive integers', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
      expect(validateQuantity(9999)).toBe(true);
    });

    it('rejects invalid quantities', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity(1.5)).toBe(false);
      expect(validateQuantity(10001)).toBe(false);
    });
  });

  describe('validateUnitCost', () => {
    it('validates positive numbers', () => {
      expect(validateUnitCost(0.01)).toBe(true);
      expect(validateUnitCost(100)).toBe(true);
      expect(validateUnitCost(9999999)).toBe(true);
    });

    it('rejects invalid costs', () => {
      expect(validateUnitCost(0)).toBe(false);
      expect(validateUnitCost(-1)).toBe(false);
      expect(validateUnitCost(10000001)).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('validates correct UUIDs', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    it('validates correct date ranges', () => {
      expect(validateDateRange('2024-01-01', '2024-01-31')).toBe(true);
      expect(validateDateRange('2024-01-01', '2024-01-01')).toBe(true);
    });

    it('rejects invalid date ranges', () => {
      expect(validateDateRange('2024-01-31', '2024-01-01')).toBe(false);
    });

    it('handles missing dates', () => {
      expect(validateDateRange()).toBe(true);
      expect(validateDateRange('2024-01-01')).toBe(true);
      expect(validateDateRange(undefined, '2024-01-31')).toBe(true);
    });
  });

  describe('sanitization functions', () => {
    describe('sanitizeString', () => {
      it('trims and removes dangerous characters', () => {
        expect(sanitizeString('  hello world  ')).toBe('hello world');
        expect(sanitizeString('test<script>alert()</script>')).toBe('testscriptalert()/script');
      });
    });

    describe('sanitizeSerialNumber', () => {
      it('normalizes serial numbers', () => {
        expect(sanitizeSerialNumber('  abc-123  ')).toBe('ABC-123');
        expect(sanitizeSerialNumber('test@#$456')).toBe('TEST456');
      });
    });

    describe('sanitizeNumericInput', () => {
      it('extracts numbers from strings', () => {
        expect(sanitizeNumericInput('123.45')).toBe(123.45);
        expect(sanitizeNumericInput('$1,234.56')).toBe(1234.56);
        expect(sanitizeNumericInput('abc')).toBe(null);
      });
    });
  });

  describe('form validators', () => {
    describe('validateReceiveGoods', () => {
      it('validates correct receive goods data', () => {
        const data = {
          productId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 10,
          unitCost: 100.50,
          warehouseId: '123e4567-e89b-12d3-a456-426614174001'
        };
        
        const result = validateReceiveGoods(data);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(data);
      });

      it('rejects invalid receive goods data', () => {
        const data = {
          productId: 'invalid-uuid',
          quantity: -1,
          unitCost: 0,
          warehouseId: 'invalid-uuid'
        };
        
        const result = validateReceiveGoods(data);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('validateTransfer', () => {
      it('validates correct transfer data', () => {
        const data = {
          sourceWarehouseId: '123e4567-e89b-12d3-a456-426614174000',
          targetWarehouseId: '123e4567-e89b-12d3-a456-426614174001',
          serialNumbers: ['SN-001', 'SN-002']
        };
        
        const result = validateTransfer(data);
        expect(result.success).toBe(true);
      });

      it('rejects transfer with same source and target', () => {
        const data = {
          sourceWarehouseId: '123e4567-e89b-12d3-a456-426614174000',
          targetWarehouseId: '123e4567-e89b-12d3-a456-426614174000',
          serialNumbers: ['SN-001']
        };
        
        const result = validateTransfer(data);
        expect(result.success).toBe(false);
        expect(result.errors?.targetWarehouseId).toContain('must be different');
      });
    });

    describe('validateAdjustment', () => {
      it('validates correct adjustment data', () => {
        const data = {
          warehouseId: '123e4567-e89b-12d3-a456-426614174000',
          adjustmentType: 'correction' as const,
          reason: 'Stock count correction',
          items: [{
            serialNumber: 'SN-001',
            adjustmentType: 'correction' as const,
            reason: 'Found extra item'
          }]
        };
        
        const result = validateAdjustment(data);
        expect(result.success).toBe(true);
      });

      it('rejects adjustment without items', () => {
        const data = {
          warehouseId: '123e4567-e89b-12d3-a456-426614174000',
          adjustmentType: 'correction' as const,
          reason: 'Test',
          items: []
        };
        
        const result = validateAdjustment(data);
        expect(result.success).toBe(false);
        expect(result.errors?.items).toContain('At least one item is required');
      });
    });
  });

  describe('business logic validators', () => {
    describe('validateStockOperation', () => {
      it('validates correct stock operation', () => {
        const result = validateStockOperation(
          'receive',
          ['SN-001', 'SN-002'],
          '123e4567-e89b-12d3-a456-426614174000'
        );
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('rejects invalid operation type', () => {
        const result = validateStockOperation(
          'invalid-operation',
          ['SN-001'],
          '123e4567-e89b-12d3-a456-426614174000'
        );
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid operation type');
      });

      it('rejects empty serial numbers', () => {
        const result = validateStockOperation('receive', []);
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('At least one serial number is required');
      });
    });

    describe('validateTransferOperation', () => {
      it('validates correct transfer operation', () => {
        const result = validateTransferOperation(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
          ['SN-001', 'SN-002']
        );
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('rejects same source and target warehouses', () => {
        const warehouseId = '123e4567-e89b-12d3-a456-426614174000';
        const result = validateTransferOperation(
          warehouseId,
          warehouseId,
          ['SN-001']
        );
        
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Source and target warehouses must be different');
      });

      it('rejects invalid serial numbers', () => {
        const result = validateTransferOperation(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
          ['VALID-SN', 'AB', 'INVALID@#$']
        );
        
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('Invalid serial numbers: AB, INVALID@#$');
      });
    });
  });

  describe('ValidationError class', () => {
    it('creates validation error with correct properties', () => {
      const error = new ValidationError('Test error', 'testField', 'TEST_CODE');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.code).toBe('TEST_CODE');
    });
  });
});