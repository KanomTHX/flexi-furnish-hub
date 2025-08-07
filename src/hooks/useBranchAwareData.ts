import { useState, useCallback, useMemo, useEffect } from 'react';
import { useBranchSecurity } from './useBranchSecurity';
import { useBranchData } from './useBranchData';
import { useSupabaseQuery } from './useSupabaseQuery';
import { BranchDataAccessMiddleware, DataAccessResponse } from '../middleware/branchDataAccess';

interface BranchAwareQueryOptions {
  tableName: string;
  columns: string;
  filters?: Record<string, any>;
  realtime?: boolean;
  fallbackData?: any[];
  resourceType?: string;
}

interface BranchAwareDataResult<T = any> {
  data: T[];
  filteredData: T[];
  isLoading: boolean;
  error: Error | null;
  accessResult: any;
  metadata: {
    totalRecords: number;
    filteredRecords: number;
    allowedBranches: string[];
    restrictedFields: string[];
  };
  refetch: () => void;
}

export function useBranchAwareData<T = any>(
  queryKey: string[],
  options: BranchAwareQueryOptions
): BranchAwareDataResult<T> {
  const { currentBranch, branches } = useBranchData();
  const { checkAccess, filterDataByAccess, logOperation } = useBranchSecurity();
  
  // ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
  const accessResult = useMemo(() => {
    if (!currentBranch) return { allowed: false, reason: 'No branch selected' };
    
    return checkAccess({
      targetBranchId: currentBranch.id,
      operation: 'view',
      resourceType: (options.resourceType as any) || 'general',
      userRole: 'user'
    });
  }, [currentBranch, checkAccess, options.resourceType]);

  // สร้าง query filters ที่รวม branch security
  const secureFilters = useMemo(() => {
    const baseFilters = options.filters || {};
    
    if (typeof accessResult === 'boolean' && !accessResult) return baseFilters;
    if (typeof accessResult === 'object' && !accessResult.allowed) return baseFilters;
    
    // ถ้าเป็น admin สามารถเข้าถึงข้อมูลทุกสาขา
    if (typeof accessResult === 'object' && 'restrictionLevel' in accessResult && accessResult.restrictionLevel === 'none') {
      return baseFilters;
    }
    
    // กรองเฉพาะสาขาที่มีสิทธิ์เข้าถึง
    const allowedBranchIds = branches.map(b => b.id);
    return {
      ...baseFilters,
        branch_id: allowedBranchIds.length === 1 
        ? allowedBranchIds[0] 
        : allowedBranchIds.join(',')
    };
  }, [options.filters, accessResult, branches]);

  // Query ข้อมูลจากฐานข้อมูล
  const query = useSupabaseQuery(
    [...queryKey, currentBranch?.id, 'access-check'],
    options.tableName,
    options.columns,
    {
      filter: Object.entries(secureFilters)
        .map(([key, value]) => {
          if (typeof value === 'string' && value.includes(',')) {
            return `${key}.in.(${value})`;
          }
          return `${key}.eq.${value}`;
        })
        .join('.and.'),
      realtime: options.realtime,
      fallbackData: options.fallbackData,
      enabled: typeof accessResult === 'object' ? accessResult.allowed : accessResult
    }
  );

  // กรองข้อมูลตามสิทธิ์การเข้าถึง
  const processedData = useMemo(() => {
    const allowed = typeof accessResult === 'object' ? accessResult.allowed : accessResult;
    if (!query.data || !allowed) {
      return {
        filteredData: [],
        metadata: {
          totalRecords: 0,
          filteredRecords: 0,
          allowedBranches: [],
          restrictedFields: []
        }
      };
    }

    const normalizedAccessResult = typeof accessResult === 'object' && 'restrictionLevel' in accessResult 
      ? accessResult 
      : { 
          allowed: typeof accessResult === 'object' ? accessResult.allowed : accessResult, 
          reason: '', 
          restrictionLevel: 'full' as const 
        };
    
    const result = BranchDataAccessMiddleware.filterDataByAccess(
      query.data,
      normalizedAccessResult,
      options.resourceType || 'general'
    );

    return {
      filteredData: result.filteredData,
      metadata: {
        ...result.metadata,
        allowedBranches: branches.map(b => b.id)
      }
    };
  }, [query.data, accessResult, options.resourceType, branches]);

  // Log การเข้าถึงข้อมูล
  useEffect(() => {
    const allowed = typeof accessResult === 'object' ? accessResult.allowed : accessResult;
    if (query.data && allowed) {
      logOperation(
        'data_access',
        options.resourceType || 'general',
        currentBranch?.id
      );
    }
  }, [query.data, logOperation, options.resourceType, currentBranch?.id]);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    data: query.data || [],
    filteredData: processedData.filteredData,
    isLoading: query.isLoading,
    error: query.error,
    accessResult,
    metadata: processedData.metadata,
    refetch
  };
}

// Hook สำหรับจัดการข้อมูลแบบ Cross-branch
export function useCrossBranchData<T = any>(
  queryKey: string[],
  options: BranchAwareQueryOptions & {
    includeSummary?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): BranchAwareDataResult<T> & {
  branchSummary?: any;
  bestPerformingBranch?: any;
} {
  const { branches } = useBranchData();
  const { checkAccess } = useBranchSecurity();
  
  // ตรวจสอบสิทธิ์การเข้าถึงข้อมูลข้ามสาขา
  const crossBranchAccess = useMemo(() => {
    return checkAccess({
      targetBranchId: 'all',
      operation: 'view',
      resourceType: (options.resourceType as any) || 'general',
      userRole: 'user'
    });
  }, [checkAccess, options.resourceType]);

  // Query ข้อมูลจากทุกสาขาที่มีสิทธิ์
  const query = useSupabaseQuery(
    [...queryKey, 'cross-branch', 'multi-access'],
    options.tableName,
    options.columns,
    {
      filter: branches.length > 0 
        ? `branch_id.in.(${branches.map(b => b.id).join(',')})`
        : '',
      realtime: options.realtime,
      fallbackData: options.fallbackData,
      enabled: typeof crossBranchAccess === 'object' ? crossBranchAccess.allowed : crossBranchAccess
    }
  );

  // ประมวลผลข้อมูลด้วย Middleware
  const processedData = useMemo(() => {
    const allowed = typeof crossBranchAccess === 'object' ? crossBranchAccess.allowed : crossBranchAccess;
    if (!query.data || !allowed) {
      return {
        filteredData: [],
        metadata: {
          totalRecords: 0,
          filteredRecords: 0,
          allowedBranches: [],
          restrictedFields: []
        },
        branchSummary: null
      };
    }

    const branchNames = branches.reduce((acc, branch) => {
      acc[branch.id] = branch.name;
      return acc;
    }, {} as Record<string, string>);

    const normalizedCrossBranchAccess = typeof crossBranchAccess === 'object' && 'restrictionLevel' in crossBranchAccess 
      ? crossBranchAccess 
      : { 
          allowed: typeof crossBranchAccess === 'object' ? crossBranchAccess.allowed : crossBranchAccess, 
          reason: '', 
          restrictionLevel: 'full' as const 
        };
    
    const response = BranchDataAccessMiddleware.processApiResponse(
      query.data,
      normalizedCrossBranchAccess,
      options.resourceType || 'general',
      {
        includeSummary: options.includeSummary,
        branchNames,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder
      }
    );

    return {
      filteredData: response.data || [],
      metadata: response.metadata || {
        totalRecords: 0,
        filteredRecords: 0,
        allowedBranches: branches.map(b => b.id),
        restrictedFields: []
      },
      branchSummary: (response.metadata as any)?.summary
    };
  }, [query.data, crossBranchAccess, branches, options]);

  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    data: query.data || [],
    filteredData: processedData.filteredData,
    isLoading: query.isLoading,
    error: query.error,
    accessResult: crossBranchAccess,
    metadata: {
      totalRecords: processedData.metadata.totalRecords || 0,
      filteredRecords: processedData.metadata.filteredRecords || 0,
      allowedBranches: 'allowedBranches' in processedData.metadata ? processedData.metadata.allowedBranches : branches.map(b => b.id),
      restrictedFields: processedData.metadata.restrictedFields || []
    },
    branchSummary: processedData.branchSummary,
    bestPerformingBranch: processedData.branchSummary?.[0], // สาขาที่มีผลงานดีที่สุด
    refetch
  };
}

// Hook สำหรับ Real-time Branch Switching
export function useBranchSwitching() {
  const { currentBranch, switchBranch, branches } = useBranchData();
  const { isSessionValid, getSessionReport } = useBranchSecurity();
  const [switchingState, setSwitchingState] = useState<{
    isLoading: boolean;
    error: string | null;
    progress: number;
  }>({
    isLoading: false,
    error: null,
    progress: 0
  });

  const switchBranchSecurely = useCallback(async (branchId: string) => {
    setSwitchingState({
      isLoading: true,
      error: null,
      progress: 0
    });

    try {
      // ตรวจสอบสิทธิ์การเข้าถึงสาขาที่ต้องการเปลี่ยน
      const targetBranch = branches.find(b => b.id === branchId);
      if (!targetBranch) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงสาขานี้');
      }

      setSwitchingState(prev => ({ ...prev, progress: 25 }));

      // ตรวจสอบ session validity
      if (!isSessionValid()) {
        throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      }

      setSwitchingState(prev => ({ ...prev, progress: 50 }));

      // สลับสาขา
      await switchBranch(branchId);

      setSwitchingState(prev => ({ ...prev, progress: 75 }));

      // รอให้ข้อมูลโหลดเสร็จ
      await new Promise(resolve => setTimeout(resolve, 500));

      setSwitchingState(prev => ({ ...prev, progress: 100 }));

      // รีเซ็ต state
      setTimeout(() => {
        setSwitchingState({
          isLoading: false,
          error: null,
          progress: 0
        });
      }, 200);

    } catch (error) {
      setSwitchingState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ',
        progress: 0
      });
    }
  }, [switchBranch, branches, isSessionValid]);

  const getSessionInfo = useCallback(() => {
    return getSessionReport();
  }, [getSessionReport]);

  return {
    currentBranch,
    userAccessibleBranches: branches,
    switchingState,
    switchBranchSecurely,
    getSessionInfo
  };
}