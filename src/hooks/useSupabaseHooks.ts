// Placeholder hooks and mock data exports for compatibility
import { useState } from 'react';

// Mock data exports for compatibility
export const mockEmployees = [];
export const mockDepartments = [];
export const mockPositions = [];
export const mockAttendance = [];
export const mockLeaves = [];
export const mockPayrolls = [];
export const mockTrainings = [];

export const mockSalesReports = [];
export const mockInventoryReports = [];
export const mockFinancialReports = [];
export const mockCustomReportConfigs = [];
export const mockReportStats = { totalReports: 0, reportsThisMonth: 0, mostUsedReportType: 'sales', averageGenerationTime: 2.5 };
export const generateMockSalesData = () => [];
export const generateMockInventoryData = () => [];
export const generateMockFinancialData = () => [];

export const mockGeneralSettings = { companyName: '', companyAddress: '', phone: '', email: '', website: '', taxId: '', currency: 'THB', timezone: 'Asia/Bangkok', dateFormat: 'DD/MM/YYYY', language: 'th' };
export const mockUsers = [];
export const mockUserRoles = [];
export const mockPermissions = [];
export const mockSystemConfiguration = {};
export const mockBusinessSettings = {};
export const mockSecuritySettings = {};
export const mockIntegrationSettings = {};
export const mockSettingsCategories = [];
export const mockSettingsAuditLog = [];
export const getSettingsByCategory = () => [];
export const getActiveUsers = () => [];
export const getUsersByRole = () => [];
export const getRecentAuditLogs = () => [];

export const mockWarehouses = [];
export const mockWarehouseTransfers = [];
export const mockWarehouseTasks = [];
export const mockWarehouseAlerts = [];
export const calculateWarehouseSummary = () => ({});

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  return {
    employees,
    loading,
    error,
    addEmployee: () => {},
    updateEmployee: () => {},
    deleteEmployee: () => {},
    getEmployeeById: () => null,
    searchEmployees: () => [],
    getEmployeesByDepartment: () => [],
    exportEmployees: () => {},
    importEmployees: () => {},
  };
}

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  return {
    salesReports: [],
    inventoryReports: [],
    financialReports: [],
    customReports: [],
    loading,
    error,
    generateSalesReport: () => {},
    generateInventoryReport: () => {},
    generateFinancialReport: () => {},
    generateCustomReport: () => {},
    scheduleReport: () => {},
    exportReport: () => {},
  };
}

export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  return {
    generalSettings: {},
    systemSettings: {},
    userSettings: {},
    securitySettings: {},
    loading,
    error,
    updateGeneralSettings: () => {},
    updateSystemSettings: () => {},
    updateUserSettings: () => {},
    updateSecuritySettings: () => {},
    resetSettings: () => {},
    exportSettings: () => {},
    importSettings: () => {},
  };
}

// Re-export real warehouse hooks for compatibility
export { useWarehouseStock } from './useWarehouseStock';
export { useWarehouses } from './useWarehouses';