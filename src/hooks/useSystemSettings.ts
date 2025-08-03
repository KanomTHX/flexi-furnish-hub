import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SystemSettings {
  // General Settings
  general: {
    companyName: string;
    companyLogo: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Security Settings
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expirationDays: number;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  
  // Audit Settings
  audit: {
    enableAuditLogging: boolean;
    logRetentionDays: number;
    logLevel: 'basic' | 'detailed' | 'verbose';
    realTimeMonitoring: boolean;
    alertThresholds: {
      failedLogins: number;
      suspiciousActivity: number;
      dataAccess: number;
    };
    autoArchive: boolean;
    archiveAfterDays: number;
  };
  
  // Notification Settings
  notifications: {
    email: {
      enabled: boolean;
      smtpServer: string;
      smtpPort: number;
      username: string;
      password: string;
      fromAddress: string;
      encryption: 'none' | 'tls' | 'ssl';
    };
    alerts: {
      securityIncidents: boolean;
      systemErrors: boolean;
      performanceIssues: boolean;
      complianceViolations: boolean;
      maintenanceReminders: boolean;
    };
    recipients: {
      admins: string[];
      managers: string[];
      auditors: string[];
    };
  };
  
  // Backup Settings
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    location: 'local' | 'cloud' | 'both';
    retention: number;
    encryption: boolean;
    compression: boolean;
  };
  
  // Integration Settings
  integrations: {
    ldap: {
      enabled: boolean;
      server: string;
      port: number;
      baseDN: string;
      bindDN: string;
      bindPassword: string;
      userFilter: string;
      groupFilter: string;
    };
    api: {
      enabled: boolean;
      rateLimit: number;
      allowedOrigins: string[];
      requireApiKey: boolean;
      logRequests: boolean;
    };
    sso: {
      enabled: boolean;
      provider: 'saml' | 'oauth' | 'openid';
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      issuer: string;
    };
  };
}

const defaultSettings: SystemSettings = {
  general: {
    companyName: 'บริษัท เฟอร์นิเจอร์ เฟล็กซี่ จำกัด',
    companyLogo: '',
    timezone: 'Asia/Bangkok',
    dateFormat: 'DD/MM/YYYY',
    currency: 'THB',
    language: 'th',
    theme: 'light'
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expirationDays: 90
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorAuth: false,
    ipWhitelist: []
  },
  audit: {
    enableAuditLogging: true,
    logRetentionDays: 365,
    logLevel: 'detailed',
    realTimeMonitoring: true,
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 3,
      dataAccess: 10
    },
    autoArchive: true,
    archiveAfterDays: 90
  },
  notifications: {
    email: {
      enabled: false,
      smtpServer: '',
      smtpPort: 587,
      username: '',
      password: '',
      fromAddress: '',
      encryption: 'tls'
    },
    alerts: {
      securityIncidents: true,
      systemErrors: true,
      performanceIssues: false,
      complianceViolations: true,
      maintenanceReminders: false
    },
    recipients: {
      admins: [],
      managers: [],
      auditors: []
    }
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    location: 'local',
    retention: 30,
    encryption: true,
    compression: true
  },
  integrations: {
    ldap: {
      enabled: false,
      server: '',
      port: 389,
      baseDN: '',
      bindDN: '',
      bindPassword: '',
      userFilter: '',
      groupFilter: ''
    },
    api: {
      enabled: true,
      rateLimit: 1000,
      allowedOrigins: ['*'],
      requireApiKey: false,
      logRequests: true
    },
    sso: {
      enabled: false,
      provider: 'oauth',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      issuer: ''
    }
  }
};

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const updateSettings = (section: keyof SystemSettings, updates: Partial<SystemSettings[keyof SystemSettings]>) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      setHasChanges(false);
      toast({
        title: "บันทึกการตั้งค่าสำเร็จ! ✅",
        description: "การตั้งค่าระบบได้รับการอัปเดตแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "รีเซ็ตการตั้งค่าแล้ว",
      description: "การตั้งค่าทั้งหมดถูกรีเซ็ตเป็นค่าเริ่มต้น"
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "ส่งออกการตั้งค่าสำเร็จ",
      description: "ไฟล์การตั้งค่าถูกดาวน์โหลดแล้ว"
    });
  };

  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
        toast({
          title: "นำเข้าการตั้งค่าสำเร็จ",
          description: "การตั้งค่าได้รับการอัปเดตจากไฟล์"
        });
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไฟล์การตั้งค่าไม่ถูกต้อง",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const testConnection = async (type: 'email' | 'ldap' | 'sso') => {
    setIsLoading(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "ทดสอบการเชื่อมต่อสำเร็จ! ✅",
        description: `การเชื่อมต่อ ${type.toUpperCase()} ทำงานได้ปกติ`
      });
      return true;
    } catch (error) {
      toast({
        title: "การทดสอบล้มเหลว",
        description: `ไม่สามารถเชื่อมต่อ ${type.toUpperCase()} ได้`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateSettings = () => {
    const errors: string[] = [];
    
    // Validate general settings
    if (!settings.general.companyName.trim()) {
      errors.push('ชื่อบริษัทไม่สามารถเว้นว่างได้');
    }
    
    // Validate security settings
    if (settings.security.passwordPolicy.minLength < 6) {
      errors.push('ความยาวรหัสผ่านขั้นต่ำต้องไม่น้อยกว่า 6 ตัวอักษร');
    }
    
    // Validate email settings
    if (settings.notifications.email.enabled) {
      if (!settings.notifications.email.smtpServer.trim()) {
        errors.push('SMTP Server ไม่สามารถเว้นว่างได้');
      }
      if (!settings.notifications.email.fromAddress.trim()) {
        errors.push('From Address ไม่สามารถเว้นว่างได้');
      }
    }
    
    return errors;
  };

  return {
    settings,
    isLoading,
    hasChanges,
    updateSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    testConnection,
    validateSettings
  };
};