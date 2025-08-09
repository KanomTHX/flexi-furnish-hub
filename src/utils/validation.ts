import { z } from 'zod';

// Serial Number Validation
export const serialNumberSchema = z.string()
  .min(5, 'Serial number must be at least 5 characters')
  .max(50, 'Serial number must not exceed 50 characters')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Serial number can only contain letters, numbers, hyphens, and underscores');

// Product Validation
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  code: z.string().min(1, 'Product code is required').max(50, 'Product code too long'),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional()
});

// Warehouse Validation
export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Warehouse name too long'),
  code: z.string().min(1, 'Warehouse code is required').max(20, 'Warehouse code too long'),
  type: z.enum(['main', 'branch', 'showroom', 'damaged']),
  address: z.string().optional(),
  capacity: z.number().positive().optional(),
  isActive: z.boolean().default(true)
});

// Stock Receive Validation
export const receiveGoodsSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitCost: z.number().positive('Unit cost must be positive'),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  invoiceNumber: z.string().max(100, 'Invoice number too long').optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  notes: z.string().optional()
});

// Stock Transfer Validation
export const transferSchema = z.object({
  sourceWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  targetWarehouseId: z.string().uuid('Invalid target warehouse ID'),
  serialNumbers: z.array(z.string()).min(1, 'At least one serial number is required'),
  notes: z.string().optional()
}).refine(data => data.sourceWarehouseId !== data.targetWarehouseId, {
  message: 'Source and target warehouses must be different',
  path: ['targetWarehouseId']
});

// Stock Adjustment Validation
export const adjustmentSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID'),
  adjustmentType: z.enum(['count', 'damage', 'loss', 'found', 'correction']),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  notes: z.string().optional(),
  items: z.array(z.object({
    serialNumber: serialNumberSchema,
    adjustmentType: z.enum(['add', 'remove', 'status_change', 'correction']),
    reason: z.string().min(1, 'Item reason is required'),
    newStatus: z.string().optional()
  })).min(1, 'At least one item is required')
});

// Batch Operation Validation
export const batchOperationSchema = z.object({
  type: z.enum(['transfer', 'withdraw', 'adjust', 'status_update', 'print_labels']),
  serialNumbers: z.array(serialNumberSchema).min(1, 'At least one serial number is required'),
  targetWarehouseId: z.string().uuid().optional(),
  newStatus: z.string().optional(),
  adjustmentReason: z.string().optional(),
  notes: z.string().optional()
});

// User Input Validation
export const userInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
  isActive: z.boolean().default(true)
});

// Search Filter Validation
export const searchFilterSchema = z.object({
  searchTerm: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: serialNumberSchema.optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.enum(['available', 'sold', 'transferred', 'claimed', 'damaged']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

// Validation Helper Functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateSerialNumber = (sn: string): boolean => {
  try {
    serialNumberSchema.parse(sn);
    return true;
  } catch (error) {
    return false;
  }
};

export const validateSerialNumbers = (sns: string[]): {
  valid: string[];
  invalid: Array<{ sn: string; error: string }>;
} => {
  const valid: string[] = [];
  const invalid: Array<{ sn: string; error: string }> = [];

  sns.forEach(sn => {
    try {
      serialNumberSchema.parse(sn);
      valid.push(sn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({
          sn,
          error: error.errors[0]?.message || 'Invalid format'
        });
      } else {
        invalid.push({
          sn,
          error: 'Validation failed'
        });
      }
    }
  });

  return { valid, invalid };
};

export const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 10000;
};

export const validateUnitCost = (cost: number): boolean => {
  return typeof cost === 'number' && cost > 0 && cost <= 10000000;
};

export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateEmail = (email: string): boolean => {
  try {
    z.string().email().parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validateDateRange = (dateFrom?: string, dateTo?: string): boolean => {
  if (!dateFrom || !dateTo) return true;
  
  try {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return from <= to;
  } catch {
    return false;
  }
};

// Sanitization Functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeSerialNumber = (sn: string): string => {
  return sn.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
};

export const sanitizeNumericInput = (input: string): number | null => {
  const num = parseFloat(input.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
};

// Form Validation Helpers
export const createFormValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
    try {
      const validData = schema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { success: false, errors };
      }
      return { success: false, errors: { general: 'Validation failed' } };
    }
  };
};

// Specific validators for common use cases
export const validateReceiveGoods = createFormValidator(receiveGoodsSchema);
export const validateTransfer = createFormValidator(transferSchema);
export const validateAdjustment = createFormValidator(adjustmentSchema);
export const validateBatchOperation = createFormValidator(batchOperationSchema);
export const validateSearchFilter = createFormValidator(searchFilterSchema);

// Business Logic Validation
export const validateStockOperation = (
  operation: string,
  serialNumbers: string[],
  warehouseId?: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check operation type
  const validOperations = ['receive', 'withdraw', 'transfer', 'adjust'];
  if (!validOperations.includes(operation)) {
    errors.push('Invalid operation type');
  }

  // Check serial numbers
  if (!serialNumbers || serialNumbers.length === 0) {
    errors.push('At least one serial number is required');
  } else {
    const { invalid } = validateSerialNumbers(serialNumbers);
    if (invalid.length > 0) {
      errors.push(`Invalid serial numbers: ${invalid.map(i => i.sn).join(', ')}`);
    }
  }

  // Check warehouse ID for certain operations
  if (['receive', 'transfer'].includes(operation) && (!warehouseId || !validateUUID(warehouseId))) {
    errors.push('Valid warehouse ID is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateTransferOperation = (
  sourceWarehouseId: string,
  targetWarehouseId: string,
  serialNumbers: string[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validateUUID(sourceWarehouseId)) {
    errors.push('Invalid source warehouse ID');
  }

  if (!validateUUID(targetWarehouseId)) {
    errors.push('Invalid target warehouse ID');
  }

  if (sourceWarehouseId === targetWarehouseId) {
    errors.push('Source and target warehouses must be different');
  }

  const { invalid } = validateSerialNumbers(serialNumbers);
  if (invalid.length > 0) {
    errors.push(`Invalid serial numbers: ${invalid.map(i => i.sn).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Export all schemas for external use
export {
  serialNumberSchema,
  productSchema,
  warehouseSchema,
  receiveGoodsSchema,
  transferSchema,
  adjustmentSchema,
  batchOperationSchema,
  userInputSchema,
  searchFilterSchema
};