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
import {
  mockGeneralSettings,
  mockUsers,
  mockUserRoles,
  mockPermissions,
  mockSystemConfiguration,
  mockBusinessSettings,
  mockSecuritySettings,
  mockIntegrationSettings,
  mockSettingsCategories,
  mockSettingsAuditLog,
  getSettingsByCategory,
  getActiveUsers,
  getUsersByRole,
  getRecentAuditLogs
} from '@/hooks/useSupabaseHooks';

export const useSettings = () => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(mockGeneralSettings);
  const [users, setUsers] = useState<UserSettings[]>(mockUsers);
  const [userRoles, setUserRoles] = useState<UserRole[]>(mockUserRoles);
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration>(mockSystemConfiguration);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(mockBusinessSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(mockSecuritySettings);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>(mockIntegrationSettings);
  const [settingsCategories, setSettingsCategories] = useState<SettingsCategory[]>(mockSettingsCategories);
  const [auditLogs, setAuditLogs] = useState<SettingsAuditLog[]>(mockSettingsAuditLog);
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
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'users',
        setting: 'user.created',
        oldValue: null,
        newValue: newUser,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: `สร้างผู้ใช้ใหม่: ${newUser.username}`
      };
      
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newUser;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserSettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user, ...userData, updatedAt: new Date() };
          
          // Create audit log
          const auditLog: SettingsAuditLog = {
            id: `audit-${Date.now()}`,
            module: 'users',
            setting: 'user.updated',
            oldValue: user,
            newValue: updatedUser,
            changedBy: 'current-user',
            changedAt: new Date(),
            reason: `อัปเดตผู้ใช้: ${user.username}`
          };
          
          setAuditLogs(prev => [auditLog, ...prev]);
          
          return updatedUser;
        }
        return user;
      }));
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตผู้ใช้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userToDelete = users.find(user => user.id === userId);
      if (userToDelete) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        
        // Create audit log
        const auditLog: SettingsAuditLog = {
          id: `audit-${Date.now()}`,
          module: 'users',
          setting: 'user.deleted',
          oldValue: userToDelete,
          newValue: null,
          changedBy: 'current-user',
          changedAt: new Date(),
          reason: `ลบผู้ใช้: ${userToDelete.username}`
        };
        
        setAuditLogs(prev => [auditLog, ...prev]);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบผู้ใช้');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Role Management
  const createRole = async (roleData: Omit<UserRole, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRole: UserRole = {
        ...roleData,
        id: `role-${Date.now()}`
      };
      
      setUserRoles(prev => [newRole, ...prev]);
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'users',
        setting: 'role.created',
        oldValue: null,
        newValue: newRole,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: `สร้างบทบาทใหม่: ${newRole.name}`
      };
      
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newRole;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างบทบาท');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (roleId: string, roleData: Partial<UserRole>) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserRoles(prev => prev.map(role => {
        if (role.id === roleId) {
          const updatedRole = { ...role, ...roleData };
          
          // Create audit log
          const auditLog: SettingsAuditLog = {
            id: `audit-${Date.now()}`,
            module: 'users',
            setting: 'role.updated',
            oldValue: role,
            newValue: updatedRole,
            changedBy: 'current-user',
            changedAt: new Date(),
            reason: `อัปเดตบทบาท: ${role.name}`
          };
          
          setAuditLogs(prev => [auditLog, ...prev]);
          
          return updatedRole;
        }
        return role;
      }));
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตบทบาท');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // System Configuration
  const updateSystemConfiguration = async (newConfig: SystemConfiguration) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'system',
        setting: 'systemConfiguration',
        oldValue: systemConfiguration,
        newValue: newConfig,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: 'อัปเดตการตั้งค่าระบบ'
      };
      
      setSystemConfiguration(newConfig);
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newConfig;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าระบบ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Business Settings
  const updateBusinessSettings = async (newSettings: BusinessSettings) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'business',
        setting: 'businessSettings',
        oldValue: businessSettings,
        newValue: newSettings,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: 'อัปเดตการตั้งค่าธุรกิจ'
      };
      
      setBusinessSettings(newSettings);
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newSettings;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าธุรกิจ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Security Settings
  const updateSecuritySettings = async (newSettings: SecuritySettings) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'security',
        setting: 'securitySettings',
        oldValue: securitySettings,
        newValue: newSettings,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: 'อัปเดตการตั้งค่าความปลอดภัย'
      };
      
      setSecuritySettings(newSettings);
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newSettings;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าความปลอดภัย');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Integration Settings
  const updateIntegrationSettings = async (newSettings: IntegrationSettings) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create audit log
      const auditLog: SettingsAuditLog = {
        id: `audit-${Date.now()}`,
        module: 'integration',
        setting: 'integrationSettings',
        oldValue: integrationSettings,
        newValue: newSettings,
        changedBy: 'current-user',
        changedAt: new Date(),
        reason: 'อัปเดตการตั้งค่าการเชื่อมต่อ'
      };
      
      setIntegrationSettings(newSettings);
      setAuditLogs(prev => [auditLog, ...prev]);
      
      return newSettings;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าการเชื่อมต่อ');
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
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    updateSystemConfiguration,
    updateBusinessSettings,
    updateSecuritySettings,
    updateIntegrationSettings,
    
    // Search and Filter
    searchUsers,
    searchAuditLogs,
    
    // Helpers
    getSettingsByCategory,
    getActiveUsers: () => getActiveUsers(),
    getUsersByRole,
    getRecentAuditLogs,
    getSettingsStats
  };
};