// Input validation utilities
import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().regex(/^[0-9]{9,10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'),
  thaiId: z.string().regex(/^[0-9]{13}$/, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  uuid: z.string().uuid('รูปแบบ UUID ไม่ถูกต้อง'),
  positiveNumber: z.number().positive('ตัวเลขต้องเป็นค่าบวก'),
  nonEmptyString: z.string().min(1, 'ข้อมูลนี้จำเป็นต้องกรอก'),
  url: z.string().url('รูปแบบ URL ไม่ถูกต้อง'),
  date: z.string().datetime('รูปแบบวันที่ไม่ถูกต้อง')
};

// Sanitization functions
export const sanitize = {
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  filename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9._-]/g, '');
  },

  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, '');
  },

  numeric: (input: string): string => {
    return input.replace(/[^0-9]/g, '');
  },

  whitespace: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  }
};

// Validation helper functions
export const validate = {
  required: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  email: (email: string): boolean => {
    return commonSchemas.email.safeParse(email).success;
  },

  phone: (phone: string): boolean => {
    return commonSchemas.phone.safeParse(phone).success;
  },

  thaiId: (id: string): boolean => {
    if (!commonSchemas.thaiId.safeParse(id).success) return false;
    
    // Thai ID checksum validation
    const digits = id.split('').map(Number);
    const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
      return acc + digit * (13 - index);
    }, 0);
    const checksum = (11 - (sum % 11)) % 10;
    
    return checksum === digits[12];
  },

  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  fileSize: (file: File, maxSizeMB: number): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  fileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  }
};

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// CSRF protection
export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken;
};