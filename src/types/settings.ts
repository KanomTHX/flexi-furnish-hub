export interface GeneralSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo: string;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

export interface UserSettings {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface SystemConfiguration {
  databaseSettings: DatabaseSettings;
  backupSettings: BackupSettings;
  notificationSettings: NotificationSettings;
  emailSettings: EmailSettings;
  apiSettings: ApiSettings;
  performanceSettings: PerformanceSettings;
}

export interface DatabaseSettings {
  host: string;
  port: number;
  database: string;
  username: string;
  connectionPool: number;
  timeout: number;
  ssl: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number;
  location: string;
  compression: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lowStockAlert: boolean;
  orderAlert: boolean;
  paymentAlert: boolean;
  systemAlert: boolean;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecurity: 'none' | 'tls' | 'ssl';
  fromEmail: string;
  fromName: string;
}

export interface ApiSettings {
  rateLimit: number;
  timeout: number;
  cors: string[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: Date;
}

export interface PerformanceSettings {
  cacheEnabled: boolean;
  cacheTtl: number;
  compressionEnabled: boolean;
  minifyAssets: boolean;
  lazyLoading: boolean;
}

export interface BusinessSettings {
  taxSettings: TaxSettings;
  paymentSettings: PaymentSettings;
  shippingSettings: ShippingSettings;
  inventorySettings: InventorySettings;
  pricingSettings: PricingSettings;
}

export interface TaxSettings {
  defaultTaxRate: number;
  taxIncluded: boolean;
  taxNumber: string;
  taxCategories: TaxCategory[];
}

export interface TaxCategory {
  id: string;
  name: string;
  rate: number;
  description: string;
}

export interface PaymentSettings {
  defaultPaymentMethod: string;
  acceptedMethods: PaymentMethod[];
  paymentTerms: number;
  lateFee: number;
  discountSettings: DiscountSettings;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet';
  isActive: boolean;
  processingFee: number;
}

export interface DiscountSettings {
  maxDiscountPercent: number;
  requireApproval: boolean;
  approvalThreshold: number;
}

export interface ShippingSettings {
  defaultShippingMethod: string;
  shippingMethods: ShippingMethod[];
  freeShippingThreshold: number;
  shippingZones: ShippingZone[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  areas: string[];
  shippingCost: number;
}

export interface InventorySettings {
  lowStockThreshold: number;
  autoReorder: boolean;
  reorderPoint: number;
  reorderQuantity: number;
  trackSerialNumbers: boolean;
  allowNegativeStock: boolean;
}

export interface PricingSettings {
  defaultMarkup: number;
  pricingTiers: PricingTier[];
  dynamicPricing: boolean;
  priceRounding: 'none' | 'up' | 'down' | 'nearest';
}

export interface PricingTier {
  id: string;
  name: string;
  minQuantity: number;
  discountPercent: number;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionSettings: SessionSettings;
  twoFactorAuth: TwoFactorAuthSettings;
  loginSettings: LoginSettings;
  encryptionSettings: EncryptionSettings;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiry: number;
  preventReuse: number;
}

export interface SessionSettings {
  sessionTimeout: number;
  maxConcurrentSessions: number;
  rememberMe: boolean;
  rememberMeDuration: number;
}

export interface TwoFactorAuthSettings {
  enabled: boolean;
  required: boolean;
  methods: ('sms' | 'email' | 'app')[];
  backupCodes: boolean;
}

export interface LoginSettings {
  maxLoginAttempts: number;
  lockoutDuration: number;
  captchaEnabled: boolean;
  captchaThreshold: number;
}

export interface EncryptionSettings {
  algorithm: string;
  keySize: number;
  saltRounds: number;
  dataEncryption: boolean;
}

export interface IntegrationSettings {
  externalSystems: ExternalSystem[];
  webhookSettings: WebhookSettings;
  syncSettings: SyncSettings;
  exportSettings: ExportSettings;
  importSettings: ImportSettings;
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  lastSync: Date;
  syncFrequency: number;
}

export interface WebhookSettings {
  enabled: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  signatureVerification: boolean;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  conflictResolution: 'local' | 'remote' | 'manual';
  syncBatchSize: number;
}

export interface ExportSettings {
  defaultFormat: 'csv' | 'excel' | 'pdf' | 'json';
  includeHeaders: boolean;
  dateFormat: string;
  encoding: string;
}

export interface ImportSettings {
  allowedFormats: string[];
  maxFileSize: number;
  validateData: boolean;
  skipErrors: boolean;
  batchSize: number;
}

export interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Setting[];
}

export interface Setting {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'file' | 'color';
  value: any;
  defaultValue: any;
  options?: SettingOption[];
  validation?: SettingValidation;
  isRequired: boolean;
  isReadonly: boolean;
}

export interface SettingOption {
  label: string;
  value: any;
}

export interface SettingValidation {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface SettingsBackup {
  id: string;
  name: string;
  description: string;
  settings: any;
  createdAt: Date;
  createdBy: string;
}

export type SettingsModule = 
  | 'general' 
  | 'users' 
  | 'system' 
  | 'business' 
  | 'security' 
  | 'integration';

export interface SettingsAuditLog {
  id: string;
  module: SettingsModule;
  setting: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}