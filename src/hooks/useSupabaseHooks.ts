// Real database hooks and mock data exports for compatibility
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch employees from database
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, name)
        `);
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลพนักงานได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setDepartments(data || []);
    } catch (err: any) {
      console.error('Error fetching departments:', err.message);
    }
  }, []);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setPositions(data || []);
    } catch (err: any) {
      console.error('Error fetching positions:', err.message);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
  }, [fetchEmployees, fetchDepartments, fetchPositions]);
  
  return {
    employees,
    departments,
    positions,
    loading,
    error,
    fetchEmployees,
    fetchDepartments,
    fetchPositions,
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