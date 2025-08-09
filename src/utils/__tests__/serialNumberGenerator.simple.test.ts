// Simple unit tests for Serial Number Generator utility functions
import { describe, it, expect } from 'vitest';
import { parseSerialNumber, DEFAULT_SN_CONFIG } from '../serialNumberGenerator';

describe('Serial Number Generator - Utility Functions', () => {
  describe('parseSerialNumber', () => {
    it('should parse standard format serial number', () => {
      const result = parseSerialNumber('SF001-2024-123');

      expect(result.isValid).toBe(true);
      expect(result.productCode).toBe('SF001');
      expect(result.year).toBe(2024);
      expect(result.sequence).toBe(123);
      expect(result.month).toBeUndefined();
    });

    it('should parse format with month', () => {
      const result = parseSerialNumber('TB001-2024-03-045');

      expect(result.isValid).toBe(true);
      expect(result.productCode).toBe('TB001');
      expect(result.year).toBe(2024);
      expect(result.month).toBe(3);
      expect(result.sequence).toBe(45);
    });

    it('should handle invalid format', () => {
      const result = parseSerialNumber('INVALID-FORMAT');

      expect(result.isValid).toBe(false);
      expect(result.productCode).toBeUndefined();
      expect(result.year).toBeUndefined();
      expect(result.sequence).toBeUndefined();
    });

    it('should handle empty input', () => {
      const result = parseSerialNumber('');

      expect(result.isValid).toBe(false);
    });

    it('should handle complex product codes', () => {
      const result = parseSerialNumber('ABC123-2024-001');

      expect(result.isValid).toBe(true);
      expect(result.productCode).toBe('ABC123');
      expect(result.year).toBe(2024);
      expect(result.sequence).toBe(1);
    });
  });

  describe('DEFAULT_SN_CONFIG', () => {
    it('should have correct default configuration', () => {
      expect(DEFAULT_SN_CONFIG.pattern).toBe('{productCode}-{year}-{sequence:3}');
      expect(DEFAULT_SN_CONFIG.includeYear).toBe(true);
      expect(DEFAULT_SN_CONFIG.includeMonth).toBe(false);
      expect(DEFAULT_SN_CONFIG.sequenceLength).toBe(3);
      expect(DEFAULT_SN_CONFIG.separator).toBe('-');
      expect(DEFAULT_SN_CONFIG.resetSequenceYearly).toBe(true);
      expect(DEFAULT_SN_CONFIG.resetSequenceMonthly).toBe(false);
    });
  });

  describe('Serial Number Format Validation', () => {
    it('should validate correct serial number patterns', () => {
      const validPatterns = [
        'SF001-2024-001',
        'TB123-2023-999',
        'ABC-2024-001',
        'PRODUCT123-2024-001'
      ];

      validPatterns.forEach(pattern => {
        const result = parseSerialNumber(pattern);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid serial number patterns', () => {
      const invalidPatterns = [
        'SF001',
        'SF001-2024',
        '2024-001',
        'SF001-YEAR-001',
        'SF001-2024-ABC',
        ''
      ];

      invalidPatterns.forEach(pattern => {
        const result = parseSerialNumber(pattern);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Serial Number Components', () => {
    it('should extract correct year from serial number', () => {
      const testCases = [
        { sn: 'SF001-2024-001', expectedYear: 2024 },
        { sn: 'TB001-2023-001', expectedYear: 2023 },
        { sn: 'ABC-2025-001', expectedYear: 2025 }
      ];

      testCases.forEach(({ sn, expectedYear }) => {
        const result = parseSerialNumber(sn);
        expect(result.year).toBe(expectedYear);
      });
    });

    it('should extract correct sequence from serial number', () => {
      const testCases = [
        { sn: 'SF001-2024-001', expectedSequence: 1 },
        { sn: 'SF001-2024-123', expectedSequence: 123 },
        { sn: 'SF001-2024-999', expectedSequence: 999 }
      ];

      testCases.forEach(({ sn, expectedSequence }) => {
        const result = parseSerialNumber(sn);
        expect(result.sequence).toBe(expectedSequence);
      });
    });

    it('should extract correct product code from serial number', () => {
      const testCases = [
        { sn: 'SF001-2024-001', expectedCode: 'SF001' },
        { sn: 'TABLE123-2024-001', expectedCode: 'TABLE123' },
        { sn: 'A-2024-001', expectedCode: 'A' }
      ];

      testCases.forEach(({ sn, expectedCode }) => {
        const result = parseSerialNumber(sn);
        expect(result.productCode).toBe(expectedCode);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle leading zeros in sequence', () => {
      const result = parseSerialNumber('SF001-2024-001');
      expect(result.sequence).toBe(1);
    });

    it('should handle large sequence numbers', () => {
      const result = parseSerialNumber('SF001-2024-9999');
      expect(result.sequence).toBe(9999);
    });

    it('should handle different year formats', () => {
      // Only 4-digit years should be valid
      const validYear = parseSerialNumber('SF001-2024-001');
      expect(validYear.isValid).toBe(true);
      expect(validYear.year).toBe(2024);

      const invalidYear = parseSerialNumber('SF001-24-001');
      expect(invalidYear.isValid).toBe(false);
    });
  });
});