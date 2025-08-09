// Unit tests for Serial Number Generator
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            single: vi.fn()
          }))
        })),
        ilike: vi.fn(() => ({
          order: vi.fn()
        }))
      }))
    }))
  }
}));

// Import after mocking
import {
  generateSerialNumbers,
  validateSerialNumber,
  checkSerialNumberExists,
  generateSingleSerialNumber,
  parseSerialNumber,
  getSerialNumberStats,
  bulkValidateSerialNumbers,
  DEFAULT_SN_CONFIG,
  SNGenerationConfig
} from '../serialNumberGenerator';
import { supabase } from '@/lib/supabase';

describe('Serial Number Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSerialNumbers', () => {
    it('should generate serial numbers with default config', async () => {
      // Mock database queries to return no existing SNs
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
          }))
        }))
      } as any);

      const result = await generateSerialNumbers('SF001', 3);

      expect(result.success).toBe(true);
      expect(result.serialNumbers).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);

      // Check format: SF001-YYYY-001, SF001-YYYY-002, SF001-YYYY-003
      const currentYear = new Date().getFullYear().toString();
      result.serialNumbers.forEach((sn, index) => {
        expect(sn).toMatch(new RegExp(`^SF001-${currentYear}-\\d{3}$`));
        expect(sn).toBe(`SF001-${currentYear}-${String(index + 1).padStart(3, '0')}`);
      });
    });

    it('should handle custom configuration', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      });

      const customConfig: Partial<SNGenerationConfig> = {
        pattern: "{productCode}_{year}_{sequence:4}",
        sequenceLength: 4,
        separator: "_"
      };

      const result = await generateSerialNumbers('TB001', 2, customConfig);

      expect(result.success).toBe(true);
      expect(result.serialNumbers).toHaveLength(2);

      const currentYear = new Date().getFullYear().toString();
      expect(result.serialNumbers[0]).toBe(`TB001_${currentYear}_0001`);
      expect(result.serialNumbers[1]).toBe(`TB001_${currentYear}_0002`);
    });

    it('should continue sequence from existing serial numbers', async () => {
      const currentYear = new Date().getFullYear().toString();
      
      // Mock existing serial numbers
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [
                { serial_number: `SF001-${currentYear}-003` },
                { serial_number: `SF001-${currentYear}-002` },
                { serial_number: `SF001-${currentYear}-001` }
              ],
              error: null
            }))
          }))
        }))
      });

      const result = await generateSerialNumbers('SF001', 2);

      expect(result.success).toBe(true);
      expect(result.serialNumbers).toHaveLength(2);
      expect(result.serialNumbers[0]).toBe(`SF001-${currentYear}-004`);
      expect(result.serialNumbers[1]).toBe(`SF001-${currentYear}-005`);
    });

    it('should validate input parameters', async () => {
      // Test empty product code
      let result = await generateSerialNumbers('', 1);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Product code is required');

      // Test invalid quantity
      result = await generateSerialNumbers('SF001', 0);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Quantity must be between 1 and 1000');

      result = await generateSerialNumbers('SF001', 1001);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Quantity must be between 1 and 1000');
    });

    it('should detect duplicate serial numbers', async () => {
      const currentYear = new Date().getFullYear().toString();
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          eq: vi.fn(() => ({
            single: vi.fn((sn: string) => {
              if (sn === `SF001-${currentYear}-001`) {
                return Promise.resolve({ data: { id: 'exists' }, error: null });
              }
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            })
          }))
        }))
      });

      const result = await generateSerialNumbers('SF001', 2);

      expect(result.success).toBe(false);
      expect(result.duplicates).toContain(`SF001-${currentYear}-001`);
      expect(result.serialNumbers).toHaveLength(1); // Only the second one should be valid
      expect(result.serialNumbers[0]).toBe(`SF001-${currentYear}-002`);
    });
  });

  describe('validateSerialNumber', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
          }))
        }))
      });
    });

    it('should validate correct serial number format', async () => {
      const result = await validateSerialNumber('SF001-2024-001');

      expect(result.isValid).toBe(true);
      expect(result.exists).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty serial number', async () => {
      const result = await validateSerialNumber('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Serial number cannot be empty');
    });

    it('should reject too short serial number', async () => {
      const result = await validateSerialNumber('ABC');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Serial number is too short (minimum 5 characters)');
    });

    it('should reject too long serial number', async () => {
      const longSN = 'A'.repeat(51);
      const result = await validateSerialNumber(longSN);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Serial number is too long (maximum 50 characters)');
    });

    it('should reject invalid characters', async () => {
      const result = await validateSerialNumber('SF001-2024-001@');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Serial number can only contain uppercase letters, numbers, hyphens, and underscores');
      expect(result.suggestions).toContain('Use only A-Z, 0-9, -, and _ characters');
    });

    it('should detect existing serial number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'exists' }, error: null }))
          }))
        }))
      });

      const result = await validateSerialNumber('SF001-2024-001');

      expect(result.isValid).toBe(true); // Format is valid
      expect(result.exists).toBe(true); // But it exists
    });
  });

  describe('checkSerialNumberExists', () => {
    it('should return true for existing serial number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'some-id' },
              error: null
            }))
          }))
        }))
      });

      const result = await checkSerialNumberExists('SF001-2024-001');
      expect(result).toBe(true);
    });

    it('should return false for non-existing serial number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            }))
          }))
        }))
      });

      const result = await checkSerialNumberExists('SF001-2024-999');
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' }
            }))
          }))
        }))
      });

      const result = await checkSerialNumberExists('SF001-2024-001');
      expect(result).toBe(false); // Should default to false on error
    });
  });

  describe('generateSingleSerialNumber', () => {
    it('should generate a single serial number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      });

      const result = await generateSingleSerialNumber('SF001');

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      const currentYear = new Date().getFullYear().toString();
      expect(result).toBe(`SF001-${currentYear}-001`);
    });

    it('should return null on generation failure', async () => {
      // Mock generation failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.reject(new Error('Database error')))
          }))
        }))
      });

      const result = await generateSingleSerialNumber('SF001');
      expect(result).toBeNull();
    });
  });

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
  });

  describe('getSerialNumberStats', () => {
    it('should return stats for a product', async () => {
      // Mock product query
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { id: 'product-id' },
                  error: null
                }))
              }))
            }))
          };
        } else if (table === 'product_serial_numbers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: [
                    { status: 'available', serial_number: 'SF001-2024-001', created_at: new Date().toISOString() },
                    { status: 'sold', serial_number: 'SF001-2024-002', created_at: new Date().toISOString() },
                    { status: 'available', serial_number: 'SF001-2024-003', created_at: new Date().toISOString() }
                  ],
                  error: null
                }))
              }))
            }))
          };
        }
        return mockSupabase.from();
      });

      const result = await getSerialNumberStats('SF001');

      expect(result.total).toBe(3);
      expect(result.available).toBe(2);
      expect(result.sold).toBe(1);
      expect(result.lastGenerated).toBe('SF001-2024-001');
      expect(result.nextSequence).toBeGreaterThan(0);
    });

    it('should handle non-existent product', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST116' }
                }))
              }))
            }))
          };
        }
        return mockSupabase.from();
      });

      const result = await getSerialNumberStats('NONEXISTENT');

      expect(result.total).toBe(0);
      expect(result.available).toBe(0);
      expect(result.sold).toBe(0);
      expect(result.nextSequence).toBe(1);
    });
  });

  describe('bulkValidateSerialNumbers', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            single: vi.fn(() => {
              if (value === 'SF001-2024-001') {
                return Promise.resolve({ data: { id: 'exists' }, error: null });
              }
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            })
          }))
        }))
      });
    });

    it('should validate multiple serial numbers', async () => {
      const serialNumbers = [
        'SF001-2024-001', // exists
        'SF001-2024-002', // valid and new
        'INVALID@SN',     // invalid format
        'SF001-2024-003'  // valid and new
      ];

      const result = await bulkValidateSerialNumbers(serialNumbers);

      expect(result.valid).toHaveLength(2);
      expect(result.valid).toContain('SF001-2024-002');
      expect(result.valid).toContain('SF001-2024-003');

      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates).toContain('SF001-2024-001');

      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].serialNumber).toBe('INVALID@SN');
      expect(result.invalid[0].errors.length).toBeGreaterThan(0);
    });

    it('should handle empty array', async () => {
      const result = await bulkValidateSerialNumbers([]);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe('Configuration handling', () => {
    it('should use default configuration when none provided', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      });

      const result = await generateSerialNumbers('SF001', 1);

      expect(result.success).toBe(true);
      expect(result.serialNumbers[0]).toMatch(/^SF001-\d{4}-\d{3}$/);
    });

    it('should merge custom configuration with defaults', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      });

      const customConfig: Partial<SNGenerationConfig> = {
        sequenceLength: 5
      };

      const result = await generateSerialNumbers('SF001', 1, customConfig);

      expect(result.success).toBe(true);
      expect(result.serialNumbers[0]).toMatch(/^SF001-\d{4}-\d{5}$/);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => Promise.reject(new Error('Connection failed')))
          }))
        }))
      });

      const result = await generateSerialNumbers('SF001', 1);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.serialNumbers).toHaveLength(0);
    });

    it('should handle validation errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.reject(new Error('Validation service down')))
          }))
        }))
      });

      const result = await bulkValidateSerialNumbers(['SF001-2024-001']);

      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
    });
  });
});