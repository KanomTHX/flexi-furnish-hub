import {
  GeneralSettings,
  UserSettings,
  UserRole,
  Permission,
  SystemConfiguration,
  BusinessSettings,
  SecuritySettings,
  IntegrationSettings,
  PasswordPolicy,
  Setting,
  SettingsAuditLog
} from '@/types/settings';

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+\s()]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string, policy: PasswordPolicy): string[] => {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`รหัสผ่านต้องมีความยาวอย่างน้อย ${policy.minLength} ตัวอักษร`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }

  return errors;
};

// Settings validation
export const validateGeneralSettings = (settings: GeneralSettings): string[] => {
  const errors: string[] = [];

  if (!settings.companyName.trim()) {
    errors.push('ชื่อบริษัทไม่สามารถเว้นว่างได้');
  }

  if (!settings.companyEmail.trim()) {
    errors.push('อีเมลบริษัทไม่สามารถเว้นว่างได้');
  } else if (!validateEmail(settings.companyEmail)) {
    errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }

  if (!settings.companyPhone.trim()) {
    errors.push('เบอร์โทรศัพท์ไม่สามารถเว้นว่างได้');
  } else if (!validatePhone(settings.companyPhone)) {
    errors.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
  }

  if (settings.companyWebsite && !validateUrl(settings.companyWebsite)) {
    errors.push('รูปแบบ URL เว็บไซต์ไม่ถูกต้อง');
  }

  return errors;
};

export const validateUserSettings = (user: UserSettings): string[] => {
  const errors: string[] = [];

  if (!user.username.trim()) {
    errors.push('ชื่อผู้ใช้ไม่สามารถเว้นว่างได้');
  } else if (user.username.length < 3) {
    errors.push('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
  }

  if (!user.email.trim()) {
    errors.push('อีเมลไม่สามารถเว้นว่างได้');
  } else if (!validateEmail(user.email)) {
    errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }

  if (!user.firstName.trim()) {
    errors.push('ชื่อไม่สามารถเว้นว่างได้');
  }

  if (!user.lastName.trim()) {
    errors.push('นามสกุลไม่สามารถเว้นว่างได้');
  }

  if (!user.role) {
    errors.push('ต้องเลือกบทบาทผู้ใช้');
  }

  return errors;
};

// Permission helpers
export const hasPermission = (user: UserSettings, module: string, action: string): boolean => {
  return user.permissions.some(permission => 
    permission.module === module && 
    (permission.action === action || permission.action === 'manage')
  );
};

export const getUserPermissions = (user: UserSettings): string[] => {
  return user.permissions.map(permission => `${permission.module}:${permission.action}`);
};

export const getRolePermissions = (role: UserRole): string[] => {
  return role.permissions.map(permission => `${permission.module}:${permission.action}`);
};

// Settings comparison
export const compareSettings = (oldSettings: any, newSettings: any): SettingsAuditLog[] => {
  const changes: SettingsAuditLog[] = [];
  const timestamp = new Date();

  const compareObject = (old: any, updated: any, path: string = '') => {
    Object.keys(updated).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = old[key];
      const newValue = updated[key];

      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        if (typeof oldValue === 'object' && oldValue !== null) {
          compareObject(oldValue, newValue, currentPath);
        }
      } else if (oldValue !== newValue) {
        changes.push({
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          module: 'general', // This should be determined based on the settings type
          setting: currentPath,
          oldValue,
          newValue,
          changedBy: 'current-user', // This should be the actual user
          changedAt: timestamp
        });
      }
    });
  };

  compareObject(oldSettings, newSettings);
  return changes;
};

// Export helpers
export const exportSettingsToJSON = (settings: any, filename: string) => {
  const dataStr = JSON.stringify(settings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportAuditLogToCSV = (auditLogs: SettingsAuditLog[]) => {
  const headers = ['วันที่', 'โมดูล', 'การตั้งค่า', 'ค่าเดิม', 'ค่าใหม่', 'ผู้แก้ไข', 'เหตุผล'];
  const csvContent = [
    headers.join(','),
    ...auditLogs.map(log => [
      log.changedAt.toLocaleDateString('th-TH'),
      log.module,
      log.setting,
      typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : log.oldValue,
      typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : log.newValue,
      log.changedBy,
      log.reason || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'settings-audit-log.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Import helpers
export const importSettingsFromJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        resolve(settings);
      } catch (error) {
        reject(new Error('ไฟล์ JSON ไม่ถูกต้อง'));
      }
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.readAsText(file);
  });
};

// Backup helpers
export const createSettingsBackup = (settings: any, name: string, description: string) => {
  return {
    id: `backup-${Date.now()}`,
    name,
    description,
    settings: JSON.parse(JSON.stringify(settings)), // Deep clone
    createdAt: new Date(),
    createdBy: 'current-user' // This should be the actual user
  };
};

// Format helpers
export const formatSettingValue = (value: any, type: string): string => {
  switch (type) {
    case 'boolean':
      return value ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    case 'number':
      return value.toLocaleString('th-TH');
    case 'date':
      return new Date(value).toLocaleDateString('th-TH');
    case 'array':
      return Array.isArray(value) ? value.join(', ') : value;
    case 'object':
      return typeof value === 'object' ? JSON.stringify(value) : value;
    default:
      return String(value);
  }
};

// Security helpers
export const generateApiKey = (prefix: string = 'ffh'): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = `${prefix}_`;
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateWebhookSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const maskSensitiveData = (value: string, visibleChars: number = 4): string => {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars);
};

// Theme helpers
export const getAvailableThemes = () => {
  return [
    { id: 'light', name: 'สว่าง', description: 'ธีมสีสว่าง' },
    { id: 'dark', name: 'มืด', description: 'ธีมสีมืด' },
    { id: 'auto', name: 'อัตโนมัติ', description: 'ปรับตามระบบ' }
  ];
};

export const getAvailableLanguages = () => {
  return [
    { id: 'th', name: 'ไทย', flag: '🇹🇭' },
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'zh', name: '中文', flag: '🇨🇳' }
  ];
};

export const getAvailableTimezones = () => {
  return [
    { id: 'Asia/Bangkok', name: 'เอเชีย/กรุงเทพ (UTC+7)', offset: '+07:00' },
    { id: 'Asia/Tokyo', name: 'เอเชีย/โตเกียว (UTC+9)', offset: '+09:00' },
    { id: 'Europe/London', name: 'ยุโรป/ลอนดอน (UTC+0)', offset: '+00:00' },
    { id: 'America/New_York', name: 'อเมริกา/นิวยอร์ก (UTC-5)', offset: '-05:00' }
  ];
};

export const getAvailableCurrencies = () => {
  return [
    { id: 'THB', name: 'บาทไทย', symbol: '฿' },
    { id: 'USD', name: 'ดอลลาร์สหรัฐ', symbol: '$' },
    { id: 'EUR', name: 'ยูโร', symbol: '€' },
    { id: 'JPY', name: 'เยนญี่ปุ่น', symbol: '¥' }
  ];
};