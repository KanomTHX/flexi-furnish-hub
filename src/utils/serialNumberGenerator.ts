// Serial Number Generator Utility
// Implements configurable SN generation patterns with validation and uniqueness checking

import { supabase } from '@/lib/supabase';

// SN Generation Configuration
export interface SNGenerationConfig {
  pattern: string; // e.g., "{productCode}-{year}-{sequence:3}"
  prefix?: string;
  suffix?: string;
  includeYear: boolean;
  includeMonth: boolean;
  sequenceLength: number;
  separator: string;
  resetSequenceYearly: boolean;
  resetSequenceMonthly: boolean;
}

// Default configuration
export const DEFAULT_SN_CONFIG: SNGenerationConfig = {
  pattern: "{productCode}-{year}-{sequence:3}",
  includeYear: true,
  includeMonth: false,
  sequenceLength: 3,
  separator: "-",
  resetSequenceYearly: true,
  resetSequenceMonthly: false,
};

// SN Validation Result
export interface SNValidationResult {
  isValid: boolean;
  exists: boolean;
  errors: string[];
  suggestions?: string[];
}

// SN Generation Result
export interface SNGenerationResult {
  serialNumbers: string[];
  success: boolean;
  errors: string[];
  duplicates: string[];
}

/**
 * Generate serial numbers based on configuration pattern
 */
export async function generateSerialNumbers(
  productCode: string,
  quantity: number,
  config: Partial<SNGenerationConfig> = {}
): Promise<SNGenerationResult> {
  try {
    const finalConfig = { ...DEFAULT_SN_CONFIG, ...config };
    const serialNumbers: string[] = [];
    const errors: string[] = [];
    const duplicates: string[] = [];

    // Validate inputs
    if (!productCode || productCode.trim().length === 0) {
      return {
        serialNumbers: [],
        success: false,
        errors: ['Product code is required'],
        duplicates: []
      };
    }

    if (quantity <= 0 || quantity > 1000) {
      return {
        serialNumbers: [],
        success: false,
        errors: ['Quantity must be between 1 and 1000'],
        duplicates: []
      };
    }

    // Get the next sequence number
    const startingSequence = await getNextSequenceNumber(productCode, finalConfig);

    // Generate serial numbers
    for (let i = 0; i < quantity; i++) {
      const sequenceNumber = startingSequence + i;
      const serialNumber = buildSerialNumber(productCode, sequenceNumber, finalConfig);
      
      // Check for uniqueness
      const exists = await checkSerialNumberExists(serialNumber);
      if (exists) {
        duplicates.push(serialNumber);
        errors.push(`Serial number ${serialNumber} already exists`);
      } else {
        serialNumbers.push(serialNumber);
      }
    }

    return {
      serialNumbers,
      success: errors.length === 0,
      errors,
      duplicates
    };

  } catch (error) {
    console.error('Error generating serial numbers:', error);
    return {
      serialNumbers: [],
      success: false,
      errors: ['Failed to generate serial numbers: ' + (error as Error).message],
      duplicates: []
    };
  }
}

/**
 * Build a serial number based on pattern
 */
function buildSerialNumber(
  productCode: string,
  sequenceNumber: number,
  config: SNGenerationConfig
): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const sequence = sequenceNumber.toString().padStart(config.sequenceLength, '0');

  let serialNumber = config.pattern;

  // Replace placeholders
  serialNumber = serialNumber.replace('{productCode}', productCode);
  serialNumber = serialNumber.replace('{year}', year);
  serialNumber = serialNumber.replace('{month}', month);
  serialNumber = serialNumber.replace(new RegExp(`{sequence:${config.sequenceLength}}`, 'g'), sequence);
  serialNumber = serialNumber.replace('{sequence}', sequence);

  // Add prefix and suffix if specified
  if (config.prefix) {
    serialNumber = config.prefix + config.separator + serialNumber;
  }
  if (config.suffix) {
    serialNumber = serialNumber + config.separator + config.suffix;
  }

  return serialNumber.toUpperCase();
}

/**
 * Get the next sequence number for a product
 */
async function getNextSequenceNumber(
  productCode: string,
  config: SNGenerationConfig
): Promise<number> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Build the pattern to search for existing serial numbers
    let searchPattern = config.pattern;
    searchPattern = searchPattern.replace('{productCode}', productCode);
    searchPattern = searchPattern.replace('{year}', year.toString());
    searchPattern = searchPattern.replace('{month}', month.toString().padStart(2, '0'));
    
    // Create a SQL LIKE pattern
    const likePattern = searchPattern.replace(new RegExp(`{sequence:${config.sequenceLength}}`, 'g'), '%');
    const likePatternFinal = likePattern.replace('{sequence}', '%');

    // Query existing serial numbers
    const { data: existingSNs, error } = await supabase
      .from('product_serial_numbers')
      .select('serial_number')
      .ilike('serial_number', likePatternFinal)
      .order('serial_number', { ascending: false });

    if (error) {
      console.error('Error querying existing serial numbers:', error);
      return 1; // Default to 1 if query fails
    }

    if (!existingSNs || existingSNs.length === 0) {
      return 1; // Start from 1 if no existing serial numbers
    }

    // Extract sequence numbers and find the maximum
    let maxSequence = 0;
    const sequenceRegex = new RegExp(`${productCode}-${year}-(\\d{${config.sequenceLength}})`);

    for (const sn of existingSNs) {
      const match = sn.serial_number.match(sequenceRegex);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }

    return maxSequence + 1;

  } catch (error) {
    console.error('Error getting next sequence number:', error);
    return 1; // Default to 1 if error occurs
  }
}

/**
 * Check if a serial number already exists
 */
export async function checkSerialNumberExists(serialNumber: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('product_serial_numbers')
      .select('id')
      .eq('serial_number', serialNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking serial number existence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking serial number existence:', error);
    return false;
  }
}

/**
 * Validate a serial number format and uniqueness
 */
export async function validateSerialNumber(
  serialNumber: string,
  config: Partial<SNGenerationConfig> = {}
): Promise<SNValidationResult> {
  const finalConfig = { ...DEFAULT_SN_CONFIG, ...config };
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Basic format validation
  if (!serialNumber || serialNumber.trim().length === 0) {
    errors.push('Serial number cannot be empty');
  }

  if (serialNumber.length < 5) {
    errors.push('Serial number is too short (minimum 5 characters)');
  }

  if (serialNumber.length > 50) {
    errors.push('Serial number is too long (maximum 50 characters)');
  }

  // Pattern validation
  const patternRegex = /^[A-Z0-9\-_]+$/;
  if (!patternRegex.test(serialNumber)) {
    errors.push('Serial number can only contain uppercase letters, numbers, hyphens, and underscores');
    suggestions.push('Use only A-Z, 0-9, -, and _ characters');
  }

  // Check for uniqueness
  const exists = await checkSerialNumberExists(serialNumber);

  return {
    isValid: errors.length === 0,
    exists,
    errors,
    suggestions
  };
}

/**
 * Generate a single serial number for a specific product
 */
export async function generateSingleSerialNumber(
  productCode: string,
  config: Partial<SNGenerationConfig> = {}
): Promise<string | null> {
  const result = await generateSerialNumbers(productCode, 1, config);
  return result.success && result.serialNumbers.length > 0 ? result.serialNumbers[0] : null;
}

/**
 * Parse a serial number to extract components
 */
export function parseSerialNumber(serialNumber: string): {
  productCode?: string;
  year?: number;
  month?: number;
  sequence?: number;
  isValid: boolean;
} {
  try {
    // Try to parse standard format: PRODUCTCODE-YYYY-NNN
    const standardMatch = serialNumber.match(/^([A-Z0-9]+)-(\d{4})-(\d+)$/);
    if (standardMatch) {
      return {
        productCode: standardMatch[1],
        year: parseInt(standardMatch[2], 10),
        sequence: parseInt(standardMatch[3], 10),
        isValid: true
      };
    }

    // Try to parse with month: PRODUCTCODE-YYYY-MM-NNN
    const monthMatch = serialNumber.match(/^([A-Z0-9]+)-(\d{4})-(\d{2})-(\d+)$/);
    if (monthMatch) {
      return {
        productCode: monthMatch[1],
        year: parseInt(monthMatch[2], 10),
        month: parseInt(monthMatch[3], 10),
        sequence: parseInt(monthMatch[4], 10),
        isValid: true
      };
    }

    return { isValid: false };
  } catch (error) {
    return { isValid: false };
  }
}

/**
 * Get serial number statistics for a product
 */
export async function getSerialNumberStats(productCode: string): Promise<{
  total: number;
  available: number;
  sold: number;
  transferred: number;
  claimed: number;
  damaged: number;
  reserved: number;
  lastGenerated?: string;
  nextSequence: number;
}> {
  try {
    // Get product ID first
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('code', productCode)
      .single();

    if (productError || !product) {
      return {
        total: 0,
        available: 0,
        sold: 0,
        transferred: 0,
        claimed: 0,
        damaged: 0,
        reserved: 0,
        nextSequence: 1
      };
    }

    // Get serial number statistics
    const { data: stats, error: statsError } = await supabase
      .from('product_serial_numbers')
      .select('status, serial_number, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    if (statsError) {
      console.error('Error getting serial number stats:', statsError);
      return {
        total: 0,
        available: 0,
        sold: 0,
        transferred: 0,
        claimed: 0,
        damaged: 0,
        reserved: 0,
        nextSequence: 1
      };
    }

    const statusCounts = {
      total: stats?.length || 0,
      available: 0,
      sold: 0,
      transferred: 0,
      claimed: 0,
      damaged: 0,
      reserved: 0
    };

    let lastGenerated: string | undefined;
    if (stats && stats.length > 0) {
      lastGenerated = stats[0].serial_number;
      
      // Count by status
      stats.forEach(sn => {
        switch (sn.status) {
          case 'available':
            statusCounts.available++;
            break;
          case 'sold':
            statusCounts.sold++;
            break;
          case 'transferred':
            statusCounts.transferred++;
            break;
          case 'claimed':
            statusCounts.claimed++;
            break;
          case 'damaged':
            statusCounts.damaged++;
            break;
          case 'reserved':
            statusCounts.reserved++;
            break;
        }
      });
    }

    // Get next sequence number
    const nextSequence = await getNextSequenceNumber(productCode, DEFAULT_SN_CONFIG);

    return {
      ...statusCounts,
      lastGenerated,
      nextSequence
    };

  } catch (error) {
    console.error('Error getting serial number stats:', error);
    return {
      total: 0,
      available: 0,
      sold: 0,
      transferred: 0,
      claimed: 0,
      damaged: 0,
      reserved: 0,
      nextSequence: 1
    };
  }
}

/**
 * Bulk validate serial numbers
 */
export async function bulkValidateSerialNumbers(
  serialNumbers: string[],
  config: Partial<SNGenerationConfig> = {}
): Promise<{
  valid: string[];
  invalid: { serialNumber: string; errors: string[] }[];
  duplicates: string[];
}> {
  const valid: string[] = [];
  const invalid: { serialNumber: string; errors: string[] }[] = [];
  const duplicates: string[] = [];

  for (const sn of serialNumbers) {
    const validation = await validateSerialNumber(sn, config);
    
    if (validation.isValid && !validation.exists) {
      valid.push(sn);
    } else {
      if (validation.exists) {
        duplicates.push(sn);
      }
      if (!validation.isValid) {
        invalid.push({
          serialNumber: sn,
          errors: validation.errors
        });
      }
    }
  }

  return { valid, invalid, duplicates };
}