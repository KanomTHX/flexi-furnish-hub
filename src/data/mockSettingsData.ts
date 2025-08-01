import {
  GeneralSettings,
  UserSettings,
  UserRole,
  Permission,
  SystemConfiguration,
  BusinessSettings,
  SecuritySettings,
  IntegrationSettings,
  SettingsCategory,
  SettingsAuditLog
} from '@/types/settings';

// Mock General Settings
export const mockGeneralSettings: GeneralSettings = {
  companyName: 'Flexi Furnish Hub',
  companyAddress: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
  companyPhone: '02-123-4567',
  companyEmail: 'info@flexifurnishhub.com',
  companyWebsite: 'https://flexifurnishhub.com',
  companyLogo: '/logo.png',
  language: 'th',
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  numberFormat: 'th-TH'
};

// Mock Permissions
export const mockPermissions: Permission[] = [
  {
    id: 'perm-001',
    name: 'จัดการสินค้า',
    description: 'สามารถเพิ่ม แก้ไข ลบสินค้าได้',
    module: 'products',
    action: 'manage'
  },
  {
    id: 'perm-002',
    name: 'ดูรายงาน',
    description: 'สามารถดูรายงานต่างๆ ได้',
    module: 'reports',
    action: 'read'
  },
  {
    id: 'perm-003',
    name: 'จัดการผู้ใช้',
    description: 'สามารถจัดการผู้ใช้งานได้',
    module: 'users',
    action: 'manage'
  },
  {
    id: 'perm-004',
    name: 'ขายสินค้า',
    description: 'สามารถใช้ระบบ POS ได้',
    module: 'pos',
    action: 'create'
  },
  {
    id: 'perm-005',
    name: 'จัดการสต็อก',
    description: 'สามารถจัดการสต็อกสินค้าได้',
    module: 'inventory',
    action: 'manage'
  }
];

// Mock User Roles
export const mockUserRoles: UserRole[] = [
  {
    id: 'role-001',
    name: 'ผู้ดูแลระบบ',
    description: 'มีสิทธิ์เต็มในการใช้งานระบบ',
    permissions: mockPermissions,
    isDefault: false
  },
  {
    id: 'role-002',
    name: 'ผู้จัดการ',
    description: 'สามารถจัดการสินค้าและดูรายงานได้',
    permissions: mockPermissions.filter(p => ['products', 'reports', 'inventory'].includes(p.module)),
    isDefault: false
  },
  {
    id: 'role-003',
    name: 'พนักงานขาย',
    description: 'สามารถขายสินค้าและดูสต็อกได้',
    permissions: mockPermissions.filter(p => ['pos', 'inventory'].includes(p.module) && p.action !== 'manage'),
    isDefault: true
  },
  {
    id: 'role-004',
    name: 'พนักงานคลัง',
    description: 'สามารถจัดการสต็อกและสินค้าได้',
    permissions: mockPermissions.filter(p => ['products', 'inventory'].includes(p.module)),
    isDefault: false
  }
];

// Mock Users
export const mockUsers: UserSettings[] = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@flexifurnishhub.com',
    firstName: 'ผู้ดูแล',
    lastName: 'ระบบ',
    role: mockUserRoles[0],
    permissions: mockUserRoles[0].permissions,
    isActive: true,
    lastLogin: new Date('2024-01-01T10:30:00'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-002',
    username: 'manager',
    email: 'manager@flexifurnishhub.com',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    role: mockUserRoles[1],
    permissions: mockUserRoles[1].permissions,
    isActive: true,
    lastLogin: new Date('2024-01-01T09:15:00'),
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-003',
    username: 'sales1',
    email: 'sales1@flexifurnishhub.com',
    firstName: 'สมหญิง',
    lastName: 'รักงาน',
    role: mockUserRoles[2],
    permissions: mockUserRoles[2].permissions,
    isActive: true,
    lastLogin: new Date('2024-01-01T08:45:00'),
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-004',
    username: 'warehouse1',
    email: 'warehouse1@flexifurnishhub.com',
    firstName: 'วิชัย',
    lastName: 'ขยัน',
    role: mockUserRoles[3],
    permissions: mockUserRoles[3].permissions,
    isActive: true,
    lastLogin: new Date('2024-01-01T07:30:00'),
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-005',
    username: 'sales2',
    email: 'sales2@flexifurnishhub.com',
    firstName: 'มาลี',
    lastName: 'ขยัน',
    role: mockUserRoles[2],
    permissions: mockUserRoles[2].permissions,
    isActive: false,
    lastLogin: new Date('2023-12-15T16:20:00'),
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2023-12-20')
  }
];

// Mock System Configuration
export const mockSystemConfiguration: SystemConfiguration = {
  databaseSettings: {
    host: 'localhost',
    port: 5432,
    database: 'flexi_furnish_hub',
    username: 'postgres',
    connectionPool: 10,
    timeout: 30000,
    ssl: false
  },
  backupSettings: {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retention: 30,
    location: '/backups',
    compression: true
  },
  notificationSettings: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlert: true,
    orderAlert: true,
    paymentAlert: true,
    systemAlert: true
  },
  emailSettings: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'noreply@flexifurnishhub.com',
    smtpPassword: '********',
    smtpSecurity: 'tls',
    fromEmail: 'noreply@flexifurnishhub.com',
    fromName: 'Flexi Furnish Hub'
  },
  apiSettings: {
    rateLimit: 1000,
    timeout: 30000,
    cors: ['http://localhost:3000', 'https://flexifurnishhub.com'],
    apiKeys: [
      {
        id: 'api-001',
        name: 'Mobile App',
        key: 'ffh_mobile_***************',
        permissions: ['read', 'write'],
        isActive: true,
        expiresAt: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'api-002',
        name: 'External Integration',
        key: 'ffh_ext_***************',
        permissions: ['read'],
        isActive: true,
        expiresAt: new Date('2024-06-30'),
        createdAt: new Date('2024-01-01')
      }
    ],
    webhooks: [
      {
        id: 'webhook-001',
        name: 'Order Notification',
        url: 'https://external-system.com/webhook/orders',
        events: ['order.created', 'order.updated'],
        isActive: true,
        secret: 'webhook_secret_***',
        createdAt: new Date('2024-01-01')
      }
    ]
  },
  performanceSettings: {
    cacheEnabled: true,
    cacheTtl: 3600,
    compressionEnabled: true,
    minifyAssets: true,
    lazyLoading: true
  }
};

// Mock Business Settings
export const mockBusinessSettings: BusinessSettings = {
  taxSettings: {
    defaultTaxRate: 7,
    taxIncluded: false,
    taxNumber: '0123456789012',
    taxCategories: [
      { id: 'tax-001', name: 'ภาษีมูลค่าเพิ่ม', rate: 7, description: 'ภาษีมูลค่าเพิ่มทั่วไป' },
      { id: 'tax-002', name: 'ยกเว้นภาษี', rate: 0, description: 'สินค้าที่ยกเว้นภาษี' }
    ]
  },
  paymentSettings: {
    defaultPaymentMethod: 'cash',
    acceptedMethods: [
      { id: 'cash', name: 'เงินสด', type: 'cash', isActive: true, processingFee: 0 },
      { id: 'card', name: 'บัตรเครดิต', type: 'card', isActive: true, processingFee: 2.5 },
      { id: 'transfer', name: 'โอนเงิน', type: 'bank_transfer', isActive: true, processingFee: 0 },
      { id: 'wallet', name: 'กระเป๋าเงินดิจิทัล', type: 'digital_wallet', isActive: true, processingFee: 1.5 }
    ],
    paymentTerms: 30,
    lateFee: 2,
    discountSettings: {
      maxDiscountPercent: 20,
      requireApproval: true,
      approvalThreshold: 10
    }
  },
  shippingSettings: {
    defaultShippingMethod: 'standard',
    shippingMethods: [
      { id: 'standard', name: 'จัดส่งมาตรฐาน', cost: 50, estimatedDays: 3, isActive: true },
      { id: 'express', name: 'จัดส่งด่วน', cost: 100, estimatedDays: 1, isActive: true },
      { id: 'pickup', name: 'รับที่ร้าน', cost: 0, estimatedDays: 0, isActive: true }
    ],
    freeShippingThreshold: 2000,
    shippingZones: [
      { id: 'zone-001', name: 'กรุงเทพและปริมณฑล', areas: ['กรุงเทพฯ', 'นนทบุรี', 'ปทุมธานี'], shippingCost: 50 },
      { id: 'zone-002', name: 'ต่างจังหวัด', areas: ['อื่นๆ'], shippingCost: 100 }
    ]
  },
  inventorySettings: {
    lowStockThreshold: 10,
    autoReorder: false,
    reorderPoint: 5,
    reorderQuantity: 50,
    trackSerialNumbers: false,
    allowNegativeStock: false
  },
  pricingSettings: {
    defaultMarkup: 30,
    pricingTiers: [
      { id: 'tier-001', name: 'ขายปลีก', minQuantity: 1, discountPercent: 0 },
      { id: 'tier-002', name: 'ขายส่ง', minQuantity: 10, discountPercent: 10 },
      { id: 'tier-003', name: 'ตัวแทนจำหน่าย', minQuantity: 50, discountPercent: 20 }
    ],
    dynamicPricing: false,
    priceRounding: 'nearest'
  }
};

// Mock Security Settings
export const mockSecuritySettings: SecuritySettings = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiry: 90,
    preventReuse: 5
  },
  sessionSettings: {
    sessionTimeout: 3600,
    maxConcurrentSessions: 3,
    rememberMe: true,
    rememberMeDuration: 2592000
  },
  twoFactorAuth: {
    enabled: false,
    required: false,
    methods: ['email'],
    backupCodes: true
  },
  loginSettings: {
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    captchaEnabled: true,
    captchaThreshold: 3
  },
  encryptionSettings: {
    algorithm: 'AES-256',
    keySize: 256,
    saltRounds: 12,
    dataEncryption: true
  }
};

// Mock Integration Settings
export const mockIntegrationSettings: IntegrationSettings = {
  externalSystems: [
    {
      id: 'ext-001',
      name: 'ระบบบัญชี',
      type: 'accounting',
      endpoint: 'https://accounting-system.com/api',
      apiKey: 'acc_***************',
      isActive: true,
      lastSync: new Date('2024-01-01T06:00:00'),
      syncFrequency: 3600
    },
    {
      id: 'ext-002',
      name: 'ระบบจัดส่ง',
      type: 'shipping',
      endpoint: 'https://shipping-provider.com/api',
      apiKey: 'ship_***************',
      isActive: false,
      lastSync: new Date('2023-12-15T12:00:00'),
      syncFrequency: 1800
    }
  ],
  webhookSettings: {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 5000,
    timeout: 30000,
    signatureVerification: true
  },
  syncSettings: {
    autoSync: true,
    syncInterval: 3600,
    conflictResolution: 'local',
    syncBatchSize: 100
  },
  exportSettings: {
    defaultFormat: 'csv',
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD',
    encoding: 'UTF-8'
  },
  importSettings: {
    allowedFormats: ['csv', 'xlsx', 'json'],
    maxFileSize: 10485760,
    validateData: true,
    skipErrors: false,
    batchSize: 1000
  }
};

// Mock Settings Categories
export const mockSettingsCategories: SettingsCategory[] = [
  {
    id: 'general',
    name: 'การตั้งค่าทั่วไป',
    description: 'ข้อมูลบริษัท ภาษา และการตั้งค่าพื้นฐาน',
    icon: 'Settings',
    settings: []
  },
  {
    id: 'users',
    name: 'จัดการผู้ใช้งาน',
    description: 'ผู้ใช้งาน บทบาท และสิทธิ์การเข้าถึง',
    icon: 'Users',
    settings: []
  },
  {
    id: 'system',
    name: 'การตั้งค่าระบบ',
    description: 'ฐานข้อมูล การสำรองข้อมูล และการแจ้งเตือน',
    icon: 'Server',
    settings: []
  },
  {
    id: 'business',
    name: 'การตั้งค่าธุรกิจ',
    description: 'ภาษี การชำระเงิน และการจัดส่ง',
    icon: 'Building',
    settings: []
  },
  {
    id: 'security',
    name: 'ความปลอดภัย',
    description: 'รหัสผ่าน การเข้าสู่ระบบ และการเข้ารหัส',
    icon: 'Shield',
    settings: []
  },
  {
    id: 'integration',
    name: 'การเชื่อมต่อ',
    description: 'ระบบภายนอก API และการซิงค์ข้อมูล',
    icon: 'Link',
    settings: []
  }
];

// Mock Settings Audit Log
export const mockSettingsAuditLog: SettingsAuditLog[] = [
  {
    id: 'audit-001',
    module: 'general',
    setting: 'companyName',
    oldValue: 'Furniture Store',
    newValue: 'Flexi Furnish Hub',
    changedBy: 'admin',
    changedAt: new Date('2024-01-01T10:30:00'),
    reason: 'อัปเดตชื่อบริษัท'
  },
  {
    id: 'audit-002',
    module: 'business',
    setting: 'defaultTaxRate',
    oldValue: 10,
    newValue: 7,
    changedBy: 'manager',
    changedAt: new Date('2024-01-01T09:15:00'),
    reason: 'ปรับอัตราภาษีตามกฎหมายใหม่'
  },
  {
    id: 'audit-003',
    module: 'security',
    setting: 'passwordPolicy.minLength',
    oldValue: 6,
    newValue: 8,
    changedBy: 'admin',
    changedAt: new Date('2024-01-01T08:45:00'),
    reason: 'เพิ่มความปลอดภัยของรหัสผ่าน'
  },
  {
    id: 'audit-004',
    module: 'users',
    setting: 'user.isActive',
    oldValue: true,
    newValue: false,
    changedBy: 'admin',
    changedAt: new Date('2023-12-20T16:20:00'),
    reason: 'ปิดการใช้งานผู้ใช้ที่ลาออก'
  }
];

// Helper functions
export const getSettingsByCategory = (category: string) => {
  switch (category) {
    case 'general':
      return mockGeneralSettings;
    case 'users':
      return { users: mockUsers, roles: mockUserRoles, permissions: mockPermissions };
    case 'system':
      return mockSystemConfiguration;
    case 'business':
      return mockBusinessSettings;
    case 'security':
      return mockSecuritySettings;
    case 'integration':
      return mockIntegrationSettings;
    default:
      return null;
  }
};

export const getActiveUsers = () => {
  return mockUsers.filter(user => user.isActive);
};

export const getUsersByRole = (roleId: string) => {
  return mockUsers.filter(user => user.role.id === roleId);
};

export const getRecentAuditLogs = (limit: number = 10) => {
  return mockSettingsAuditLog
    .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
    .slice(0, limit);
};