import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Branch, 
  BranchDataContext, 
  BranchEmployee, 
  BranchCustomer, 
  BranchAnalytics,
  BranchFilter,
  BranchTransfer,
  BranchStock
} from '../types/branch';
import { BranchDataAccessMiddleware, DataAccessResponse } from '../middleware/branchDataAccess';
import { 
  StockLevel,
  StockMovement,
  StockAlert
} from '../types/stock';
import { branchService } from '@/services/branchService';
import { useAuth } from './useAuth';

export function useBranchData() {
  // Get user profile from auth context
  const { profile } = useAuth();
  
  // Branch State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branchContext, setBranchContext] = useState<BranchDataContext | null>(null);
  const [branchEmployees, setBranchEmployees] = useState<BranchEmployee[]>([]);
  const [branchCustomers, setBranchCustomers] = useState<BranchCustomer[]>([]);
  const [branchAnalytics, setBranchAnalytics] = useState<BranchAnalytics[]>([]);
  const [branchTransfers, setBranchTransfers] = useState<BranchTransfer[]>([]);
  
  // Branch-specific Stock Data
  const [branchStockLevels, setBranchStockLevels] = useState<BranchStock[]>([]);
  const [branchStockMovements, setBranchStockMovements] = useState<StockMovement[]>([]);
  const [branchStockAlerts, setBranchStockAlerts] = useState<StockAlert[]>([]);
  
  // Filters
  const [branchFilter, setBranchFilter] = useState<BranchFilter>({});
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  // Initialize data from database
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Load branches using branchService
        const branchesData = await branchService.getBranches();
        setBranches(branchesData);
        
        // Set current branch based on user profile or default to first branch
        let userBranch = null;
        if (profile?.branch_id) {
          userBranch = branchesData.find(branch => branch.id === profile.branch_id);
        }
        
        const defaultBranch = userBranch || branchesData[0];
        if (defaultBranch) {
          setCurrentBranch(defaultBranch);
          setSelectedBranchIds([defaultBranch.id]);
        }

        // Initialize empty arrays for other data (to be implemented later)
        setBranchEmployees([]);
        setBranchCustomers([]);
        setBranchAnalytics([]);
        setBranchStockLevels([]);
        setBranchStockMovements([]);
        setBranchStockAlerts([]);
        
        // Set context based on user profile
        setBranchContext({
          currentBranch: defaultBranch || null,
          userPermissions: {
            canSwitchBranch: !profile?.branch_id, // Allow switching only if no specific branch assigned
            canViewAllBranches: !profile?.branch_id, // Allow viewing all branches only if no specific branch assigned
            canManageBranches: true,
            allowedOperations: ['view', 'create', 'update', 'delete']
          },
          accessibleBranches: profile?.branch_id 
            ? branchesData.filter(branch => branch.id === profile.branch_id)
            : branchesData
        });
        
      } catch (error) {
        console.error('Error initializing branch data:', error);
        // Fallback to empty state
        setBranches([]);
        setBranchEmployees([]);
        setBranchCustomers([]);
        setBranchAnalytics([]);
        setBranchStockLevels([]);
        setBranchStockMovements([]);
        setBranchStockAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [profile?.branch_id]); // Re-initialize when user's branch changes

  // Filtered Branches
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      if (branchFilter.type && branch.type !== branchFilter.type) return false;
      if (branchFilter.status && branch.status !== branchFilter.status) return false;
      if (branchFilter.province && branch.address.province !== branchFilter.province) return false;
      if (branchFilter.search) {
        const searchLower = branchFilter.search.toLowerCase();
        return branch.name.toLowerCase().includes(searchLower) ||
               branch.code.toLowerCase().includes(searchLower) ||
               branch.address.province.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [branches, branchFilter]);

  // Branch-specific filtered data
  const getCurrentBranchData = useCallback(<T extends { branchId: string }>(data: T[]) => {
    if (!currentBranch) return [];
    return data.filter(item => item.branchId === currentBranch.id);
  }, [currentBranch]);

  const getSelectedBranchesData = useCallback(<T extends { branchId: string }>(data: T[]) => {
    if (selectedBranchIds.length === 0) return data;
    return data.filter(item => selectedBranchIds.includes(item.branchId));
  }, [selectedBranchIds]);

  // Current branch specific data
  const currentBranchEmployees = useMemo(() => 
    getCurrentBranchData(branchEmployees), [branchEmployees, getCurrentBranchData]
  );

  const currentBranchCustomers = useMemo(() => 
    getCurrentBranchData(branchCustomers), [branchCustomers, getCurrentBranchData]
  );

  const currentBranchStock = useMemo(() => 
    getCurrentBranchData(branchStockLevels), [branchStockLevels, getCurrentBranchData]
  );

  const currentBranchMovements = useMemo(() => 
    branchStockMovements.filter(movement => movement.warehouseId === currentBranch?.id), 
    [branchStockMovements, currentBranch]
  );

  const currentBranchAlerts = useMemo(() => 
    branchStockAlerts.filter(alert => alert.warehouseId === currentBranch?.id), 
    [branchStockAlerts, currentBranch]
  );

  // Selected branches data (for comparison/reporting)
  const selectedBranchesEmployees = useMemo(() => 
    getSelectedBranchesData(branchEmployees), [branchEmployees, getSelectedBranchesData]
  );

  const selectedBranchesCustomers = useMemo(() => 
    getSelectedBranchesData(branchCustomers), [branchCustomers, getSelectedBranchesData]
  );

  const selectedBranchesStock = useMemo(() => 
    getSelectedBranchesData(branchStockLevels), [branchStockLevels, getSelectedBranchesData]
  );

  const selectedBranchesAnalytics = useMemo(() => 
    branchAnalytics.filter(analytics => selectedBranchIds.includes(analytics.branchId)), 
    [branchAnalytics, selectedBranchIds]
  );

  // Branch Summary
  const branchSummary = useMemo(() => {
    const selectedBranches = branches.filter(b => selectedBranchIds.includes(b.id));
    const selectedAnalytics = selectedBranchesAnalytics;
    
    return {
      totalBranches: selectedBranches.length,
      activeBranches: selectedBranches.filter(b => b.status === 'active').length,
      totalEmployees: selectedBranches.reduce((sum, b) => sum + b.stats.totalEmployees, 0),
      totalCustomers: selectedBranches.reduce((sum, b) => sum + b.stats.totalCustomers, 0),
      totalProducts: selectedBranches.reduce((sum, b) => sum + b.stats.totalProducts, 0),
      totalRevenue: selectedAnalytics.reduce((sum, a) => sum + a.financial.totalRevenue, 0),
      totalProfit: selectedAnalytics.reduce((sum, a) => sum + a.financial.netProfit, 0),
      averageProfitMargin: selectedAnalytics.length > 0 
        ? selectedAnalytics.reduce((sum, a) => sum + a.financial.netProfitMargin, 0) / selectedAnalytics.length 
        : 0,
      bestPerformingBranch: selectedAnalytics.length > 0 
        ? selectedAnalytics.reduce((best, current) => 
            current.financial.netProfitMargin > best.financial.netProfitMargin ? current : best
          )
        : null,
      worstPerformingBranch: selectedAnalytics.length > 0 
        ? selectedAnalytics.reduce((worst, current) => 
            current.financial.netProfitMargin < worst.financial.netProfitMargin ? current : worst
          )
        : null,
      totalStockValue: selectedBranchesStock.reduce((sum, s) => sum + s.totalValue, 0),
      totalLowStockItems: selectedBranchesStock.filter(s => s.status === 'low_stock').length,
      totalOutOfStockItems: selectedBranchesStock.filter(s => s.status === 'out_of_stock').length,
      totalCriticalAlerts: selectedBranchesStock.filter(s => 
        branchStockAlerts.some(a => a.productId === s.productId && a.severity === 'critical')
      ).length
    };
  }, [branches, selectedBranchIds, selectedBranchesAnalytics, selectedBranchesStock, branchStockAlerts]);

  // Branch Actions
  const switchBranch = useCallback(async (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;

    setIsSwitchingBranch(true);
    try {
      // Check permissions
      if (branchContext?.userPermissions.canSwitchBranch) {
        setCurrentBranch(branch);
        
        // Update context
        setBranchContext(prev => prev ? {
          ...prev,
          currentBranch: branch
        } : null);
        
        // Simulate API call to load branch-specific data
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        throw new Error('ไม่มีสิทธิ์ในการเปลี่ยนสาขา');
      }
    } catch (error) {
      console.error('Error switching branch:', error);
      throw error;
    } finally {
      setIsSwitchingBranch(false);
    }
  }, [branches, branchContext]);

  const updateBranch = useCallback(async (branchId: string, updates: Partial<Branch>) => {
    setIsUpdating(true);
    try {
      // Prepare update data for branchService
      const updateData = {
        name: updates.name,
        code: updates.code,
        address: updates.address?.street,
        phone: updates.contact?.phone,
        email: updates.contact?.email,
        manager_name: updates.contact?.manager,
        status: updates.status === 'maintenance' ? 'inactive' : updates.status // Convert maintenance to inactive
      };

      // Update branch using branchService
      const updatedBranch = await branchService.updateBranch(branchId, updateData);
      
      // Update local state
      setBranches(prev => prev.map(branch => 
        branch.id === branchId ? updatedBranch : branch
      ));
      
      // Update current branch if it's the one being updated
      if (currentBranch?.id === branchId) {
        setCurrentBranch(updatedBranch);
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [currentBranch]);

  const createBranch = useCallback(async (branchData: { name: string; code?: string; address?: string; phone?: string; email?: string; manager_name?: string }) => {
    setIsUpdating(true);
    try {
      // Create branch using branchService
      const newBranch = await branchService.createBranch({
        name: branchData.name,
        code: branchData.code,
        address: branchData.address,
        phone: branchData.phone,
        email: branchData.email,
        manager_name: branchData.manager_name,
        status: 'active'
      });
      
      // Update local state
      setBranches(prev => [...prev, newBranch]);
      
      return newBranch;
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteBranch = useCallback(async (branchId: string) => {
    setIsUpdating(true);
    try {
      // Delete branch using branchService
      await branchService.deleteBranch(branchId);
      
      // Update local state
      setBranches(prev => prev.filter(branch => branch.id !== branchId));
      
      // If current branch is deleted, switch to first available branch
      if (currentBranch?.id === branchId) {
        const remainingBranches = branches.filter(branch => branch.id !== branchId);
        setCurrentBranch(remainingBranches[0] || null);
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [currentBranch, branches]);

  const createBranchTransfer = useCallback(async (transfer: Omit<BranchTransfer, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsUpdating(true);
    try {
      const newTransfer: BranchTransfer = {
        ...transfer,
        id: `branch-transfer-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setBranchTransfers(prev => [newTransfer, ...prev]);
      
      // If it's a stock transfer, update stock levels
      if (transfer.type === 'stock') {
        // This would typically involve more complex logic
        // For now, just simulate the transfer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const approveBranchTransfer = useCallback(async (transferId: string, approvedBy: string) => {
    setIsUpdating(true);
    try {
      setBranchTransfers(prev => prev.map(transfer => 
        transfer.id === transferId 
          ? {
              ...transfer,
              status: 'approved' as const,
              approvedBy,
              approvedDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : transfer
      ));
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Enhanced data isolation helpers with security middleware
  const getIsolatedData = useCallback(<T extends { branchId: string }>(
    data: T[], 
    branchId: string,
    resourceType: string = 'general'
  ) => {
    const filtered = data.filter(item => item.branchId === branchId);
    
    // ในการใช้งานจริง จะใช้ security middleware เพื่อกรองข้อมูล
    // const accessResult = security.checkAccess({ targetBranchId: branchId, operation: 'view', resourceType });
    // return BranchDataAccessMiddleware.filterDataByAccess(filtered, accessResult, resourceType);
    
    return filtered;
  }, []);

  const canAccessBranchData = useCallback((branchId: string, resourceType: string = 'general') => {
    if (!branchContext || !currentBranch) return false;
    
    // Super admin can access all
    if (branchContext.userPermissions.canViewAllBranches) return true;
    
    // Can access own branch
    if (branchId === currentBranch.id) return true;
    
    // Check if branch allows access to other branches
    const hasPermission = currentBranch.permissions.canAccessOtherBranches && 
                         branchContext.accessibleBranches.some(b => b.id === branchId);
    
    if (!hasPermission) return false;
    
    // Check data isolation level
    const targetBranch = branchContext.accessibleBranches.find(b => b.id === branchId);
    if (targetBranch?.permissions.dataIsolationLevel === 'strict') return false;
    
    return true;
  }, [branchContext, currentBranch]);

  // Enhanced data access with middleware processing
  const getSecureData = useCallback(<T extends { branchId: string }>(
    data: T[],
    targetBranchId: string,
    resourceType: string,
    operation: 'view' | 'create' | 'update' | 'delete' = 'view'
  ) => {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const canAccess = canAccessBranchData(targetBranchId, resourceType);
    
    if (!canAccess) {
      return {
        success: false,
        data: [],
        accessResult: {
          allowed: false,
          reason: 'Access denied to branch data',
          restrictionLevel: 'full' as const
        }
      };
    }

    // กรองข้อมูลตามสาขา
    const filteredData = data.filter(item => item.branchId === targetBranchId);
    
    return {
      success: true,
      data: filteredData,
      accessResult: {
        allowed: true,
        reason: 'Access granted',
        restrictionLevel: 'none' as const
      }
    };
  }, [canAccessBranchData]);

  // Export functions
  const exportBranchData = useCallback((branchIds?: string[]) => {
    const branchesToExport = branchIds || selectedBranchIds;
    const branchesData = branches.filter(b => branchesToExport.includes(b.id));
    
    const csvData = branchesData.map(branch => ({
      รหัสสาขา: branch.code,
      ชื่อสาขา: branch.name,
      ประเภท: branch.type,
      สถานะ: branch.status,
      จังหวัด: branch.address.province,
      ผู้จัดการ: branch.contact.manager,
      จำนวนพนักงาน: branch.stats.totalEmployees,
      จำนวนลูกค้า: branch.stats.totalCustomers,
      จำนวนสินค้า: branch.stats.totalProducts,
      ยอดขายรวม: branch.stats.totalSales,
      รายได้เฉลี่ย: branch.stats.averageOrderValue,
      รายได้รายเดือน: branch.stats.monthlyRevenue,
      รายได้รายปี: branch.stats.yearlyRevenue
    }));

    console.log('Branch data prepared for export:', csvData);
  }, [branches, selectedBranchIds]);

  const exportBranchComparison = useCallback(() => {
    const analyticsData = selectedBranchesAnalytics;
    
    const csvData = analyticsData.map(analytics => ({
      รหัสสาขา: analytics.branchCode,
      ชื่อสาขา: analytics.branchName,
      รายได้รวม: analytics.financial.totalRevenue,
      ต้นทุนรวม: analytics.financial.totalCost,
      กำไรขั้นต้น: analytics.financial.grossProfit,
      'กำไรขั้นต้น (%)': analytics.financial.grossProfitMargin,
      กำไรสุทธิ: analytics.financial.netProfit,
      'กำไรสุทธิ (%)': analytics.financial.netProfitMargin,
      จำนวนคำสั่งซื้อ: analytics.sales.totalOrders,
      มูลค่าเฉลี่ยต่อคำสั่งซื้อ: analytics.sales.averageOrderValue,
      'การเติบโต (%)': analytics.sales.growth,
      จำนวนลูกค้าใหม่: analytics.customers.newCustomers,
      'อัตราการกลับมาซื้อ (%)': analytics.customers.customerRetentionRate,
      มูลค่าสต็อกรวม: analytics.stock.totalValue,
      'อัตราการหมุนเวียนสต็อก': analytics.stock.turnoverRate
    }));

    console.log('Branch comparison data prepared for export:', csvData);
  }, [selectedBranchesAnalytics]);

  return {
    // Branch Data
    branches: filteredBranches,
    currentBranch,
    branchContext,
    branchSummary,
    
    // Branch-specific Data
    currentBranchEmployees,
    currentBranchCustomers,
    currentBranchStock,
    currentBranchMovements,
    currentBranchAlerts,
    
    // Multi-branch Data
    selectedBranchesEmployees,
    selectedBranchesCustomers,
    selectedBranchesStock,
    selectedBranchesAnalytics,
    
    // All Data
    allBranchEmployees: branchEmployees,
    allBranchCustomers: branchCustomers,
    allBranchStock: branchStockLevels,
    allBranchAnalytics: branchAnalytics,
    branchTransfers,
    
    // Filters & Selection
    branchFilter,
    setBranchFilter,
    selectedBranchIds,
    setSelectedBranchIds,
    
    // States
    isLoading,
    isUpdating,
    isSwitchingBranch,
    
    // Actions
    switchBranch,
    updateBranch,
    createBranch,
    deleteBranch,
    createBranchTransfer,
    approveBranchTransfer,
    
    // Utilities
    getIsolatedData,
    canAccessBranchData,
    getSecureData,
    exportBranchData,
    exportBranchComparison
  };
}