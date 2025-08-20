// Real database hooks and mock data exports for compatibility
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// TODO: Remove mock data exports when all components are updated to use real data
// These exports are kept temporarily for compatibility
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
        .eq('status', 'active');
      
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
        .eq('status', 'active');
      
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