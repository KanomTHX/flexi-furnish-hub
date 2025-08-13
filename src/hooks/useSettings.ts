import { useState, useEffect } from 'react';
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
  SettingsAuditLog,
  SettingsModule
} from '@/types/settings';

export const useSettings = () => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    companyName: 'บริษัท เฟอร์นิเจอร์ เฟล็กซี่ จำกัด',
    companyPhone: '02-123-4567',
    companyEmail: 'info@furniturecompany.com',
    companyWebsite: 'www.furniturecompany.com',
    companyLogo: '',
    companyAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    dateFormat: 'DD/MM/YYYY',
    language: 'th',
    defaultPaymentTerms: 30
  });
  const [users, setUsers] = useState<UserSettings[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration>({
    version: '1.0.0',
    environment: 'production',
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    maxFileSize: 10,
    allowedFileTypes: ['.jpg', '.png', '.pdf', '.docx'],
    sessionTimeout: 30,
    autoBackup: true,
    backupFrequency: 'daily'
  });
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    discountPolicy: {
      maxDiscount: 20,
      requireApproval: true,
      approvalThreshold: 15
    },
    returnPolicy: {
      returnPeriod: 30,
      restockingFee: 5,
      allowPartialReturns: true
    },
    shippingPolicy: {
      freeShippingThreshold: 5000,
      standardRate: 100,
      expressRate: 200
    },
    loyaltyProgram: {
      enabled: true,
      pointsPerBaht: 1,
      redemptionRate: 0.01
    }
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    lockoutPolicy: {
      maxAttempts: 5,
      lockoutDuration: 30,
      resetAfter: 60
    },
    sessionSecurity: {
      sessionTimeout: 30,
      requireReauth: true,
      logoutInactive: true
    },
    auditLogging: {
      enabled: true,
      logLevel: 'detailed',
      retentionDays: 365
    },
    twoFactorAuth: {
      enabled: false,
      methods: ['sms'],
      required: false
    }
  });
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    email: {
      provider: 'sendgrid',
      apiKey: '',
      fromEmail: 'noreply@company.com',
      fromName: 'Furniture Company'
    },
    sms: {
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: ''
    },
    analytics: {
      provider: 'google',
      trackingId: '',
      enhanced: true
    }
  });
  const [settingsCategories, setSettingsCategories] = useState<SettingsCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<SettingsAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Data is already loaded from mock data
      setLoading(false);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลการตั้งค่า');
      console.error('Error loading settings data:', err);
      setLoading(false);
    }
  };

  // General Settings
  const updateGeneralSettings = async (newSettings: GeneralSettings) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'general',
        setting: 'generalSettings',
        oldValue: generalSettings,
        newValue: newSettings,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: 'อัปเดตการตั้งค่าทั่วไป'
      };
      
      setGeneralSettings(newSettings);
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newSettings;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าทั่วไป');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // User Management
  const createUser = async (userData: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: UserSettings = {
        ...userData,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      
      setUsers(prev => [newUser, ...prev]);
      
      return newUser;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search and Filter
  const searchUsers = (query: string) => {
    return users.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.firstName.toLowerCase().includes(query.toLowerCase()) ||
      user.lastName.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchAuditLogs = (query: string, module?: SettingsModule) => {
    let filtered = auditLogs;
    
    if (module) {
      filtered = filtered.filter(log => log.module === module);
    }
    
    if (query) {
      filtered = filtered.filter(log =>
        log.setting.toLowerCase().includes(query.toLowerCase()) ||
        log.changedBy.toLowerCase().includes(query.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    return filtered;
  };

  // Statistics
  const getSettingsStats = () => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      totalRoles: userRoles.length,
      totalPermissions: permissions.length,
      recentChanges: auditLogs.filter(log => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return log.changedAt >= dayAgo;
      }).length
    };
  };

  return {
    // Data
    generalSettings,
    users,
    userRoles,
    permissions,
    systemConfiguration,
    businessSettings,
    securitySettings,
    integrationSettings,
    settingsCategories,
    auditLogs,
    
    // State
    loading,
    error,
    
    // Actions
    loadSettingsData,
    updateGeneralSettings,
    createUser,
    
    // Search and Filter
    searchUsers,
    searchAuditLogs,
    
    // Helpers
    getSettingsStats
  };
};