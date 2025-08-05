// Branch Security Hook - Phase 1
// Hook สำหรับจัดการความปลอดภัยและควบคุมการเข้าถึงข้อมูลสาขา

import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  BranchSecurityManager, 
  BranchAccessRequest, 
  BranchAccessResult,
  BranchSecurityConfig,
  defaultBranchSecurity
} from '../lib/branchSecurity';
import { BranchDataContext } from '../types/branch';
import { useBranchData } from './useBranchData';

// Security Context
interface BranchSecurityContextType {
  securityManager: BranchSecurityManager;
  currentSessionId: string | null;
  isSecurityEnabled: boolean;
  checkAccess: (request: Omit<BranchAccessRequest, 'userId' | 'currentBranchId' | 'timestamp'>) => BranchAccessResult;
  logOperation: (operation: string, resourceType: string, targetBranchId?: string) => void;
}

const BranchSecurityContext = createContext<BranchSecurityContextType | null>(null);

// Provider Component
export function BranchSecurityProvider({ 
  children, 
  config = {} 
}: { 
  children: ReactNode;
  config?: Partial<BranchSecurityConfig>;
}) {
  const [securityManager] = useState(() => 
    config ? new BranchSecurityManager({ ...defaultBranchSecurity['config'], ...config }) : defaultBranchSecurity
  );
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);
  
  const { currentBranch, branchContext } = useBranchData();

  // สร้าง Session เมื่อเปลี่ยนสาขา
  useEffect(() => {
    if (currentBranch && branchContext) {
      const sessionId = securityManager.createBranchSession('current-user', currentBranch.id);
      setCurrentSessionId(sessionId);

      return () => {
        // Cleanup session เมื่อ component unmount
        if (sessionId) {
          securityManager.logAccess(sessionId, 'session_end', 'system');
        }
      };
    }
  }, [currentBranch?.id, securityManager, branchContext]);

  // ฟังก์ชันตรวจสอบสิทธิ์การเข้าถึง
  const checkAccess = useCallback((
    request: Omit<BranchAccessRequest, 'userId' | 'currentBranchId' | 'timestamp'>
  ): BranchAccessResult => {
    if (!isSecurityEnabled || !currentBranch || !branchContext) {
      return {
        allowed: true,
        reason: 'Security disabled or missing context',
        restrictionLevel: 'none'
      };
    }

    const fullRequest: BranchAccessRequest = {
      ...request,
      userId: 'current-user', // ในการใช้งานจริงจะได้จาก auth context
      currentBranchId: currentBranch.id,
      timestamp: new Date()
    };

    return securityManager.checkBranchAccess(fullRequest, branchContext);
  }, [securityManager, currentBranch, branchContext, isSecurityEnabled]);

  // ฟังก์ชันบันทึกการดำเนินการ
  const logOperation = useCallback((
    operation: string, 
    resourceType: string, 
    targetBranchId?: string
  ) => {
    if (currentSessionId) {
      securityManager.logAccess(currentSessionId, operation, resourceType, targetBranchId);
    }
  }, [securityManager, currentSessionId]);

  const contextValue: BranchSecurityContextType = {
    securityManager,
    currentSessionId,
    isSecurityEnabled,
    checkAccess,
    logOperation
  };

  return (
    <BranchSecurityContext.Provider value={contextValue}>
      {children}
    </BranchSecurityContext.Provider>
  );
}

// Main Hook
export function useBranchSecurity() {
  const context = useContext(BranchSecurityContext);
  
  if (!context) {
    throw new Error('useBranchSecurity must be used within a BranchSecurityProvider');
  }

  const { 
    securityManager, 
    currentSessionId, 
    isSecurityEnabled, 
    checkAccess: contextCheckAccess, 
    logOperation: contextLogOperation 
  } = context;

  // ตรวจสอบสิทธิ์การดูข้อมูลสาขา
  const canViewBranchData = useCallback((branchId: string, resourceType: string = 'general') => {
    const result = contextCheckAccess({
      targetBranchId: branchId,
      operation: 'view',
      resourceType: resourceType as any,
      userRole: 'user' // ในการใช้งานจริงจะได้จาก auth context
    });

    contextLogOperation('access_check', resourceType, branchId);
    return result;
  }, [contextCheckAccess, contextLogOperation]);

  // ตรวจสอบสิทธิ์การแก้ไขข้อมูลสาขา
  const canEditBranchData = useCallback((branchId: string, resourceType: string = 'general') => {
    const result = contextCheckAccess({
      targetBranchId: branchId,
      operation: 'update',
      resourceType: resourceType as any,
      userRole: 'user'
    });

    contextLogOperation('edit_check', resourceType, branchId);
    return result;
  }, [contextCheckAccess, contextLogOperation]);

  // ตรวจสอบสิทธิ์การลบข้อมูล
  const canDeleteBranchData = useCallback((branchId: string, resourceType: string = 'general') => {
    const result = contextCheckAccess({
      targetBranchId: branchId,
      operation: 'delete',
      resourceType: resourceType as any,
      userRole: 'user'
    });

    contextLogOperation('delete_check', resourceType, branchId);
    return result;
  }, [contextCheckAccess, contextLogOperation]);

  // ตรวจสอบสิทธิ์การโอนย้ายข้อมูล
  const canTransferBetweenBranches = useCallback((fromBranchId: string, toBranchId: string) => {
    const result = contextCheckAccess({
      targetBranchId: toBranchId,
      operation: 'transfer',
      resourceType: 'stock',
      userRole: 'user'
    });

    contextLogOperation('transfer_check', 'stock', toBranchId);
    return result;
  }, [contextCheckAccess, contextLogOperation]);

  // ฟิลเตอร์ข้อมูลตาม Security Rules
  const filterDataByAccess = useCallback(<T extends { branchId?: string }>(
    data: T[], 
    resourceType: string = 'general'
  ): T[] => {
    if (!isSecurityEnabled) return data;

    return data.filter(item => {
      if (!item.branchId) return true;
      
      const access = canViewBranchData(item.branchId, resourceType);
      return access.allowed;
    });
  }, [canViewBranchData, isSecurityEnabled]);

  // รายงานการใช้งาน Session
  const getSessionReport = useCallback(() => {
    if (!currentSessionId) return null;
    return securityManager.getSessionReport(currentSessionId);
  }, [securityManager, currentSessionId]);

  // ตรวจสอบสถานะ Session
  const isSessionValid = useCallback(() => {
    if (!currentSessionId) return false;
    return securityManager.validateSession(currentSessionId);
  }, [securityManager, currentSessionId]);

  // สถิติการเข้าถึง
  const [accessStats, setAccessStats] = useState({
    totalChecks: 0,
    allowedAccess: 0,
    deniedAccess: 0,
    partialAccess: 0
  });

  // อัพเดทสถิติเมื่อมีการตรวจสอบสิทธิ์
  const trackAccessCheck = useCallback((result: BranchAccessResult) => {
    setAccessStats(prev => ({
      totalChecks: prev.totalChecks + 1,
      allowedAccess: prev.allowedAccess + (result.allowed ? 1 : 0),
      deniedAccess: prev.deniedAccess + (!result.allowed ? 1 : 0),
      partialAccess: prev.partialAccess + (result.restrictionLevel === 'partial' ? 1 : 0)
    }));
  }, []);

  // Enhanced check functions with tracking
  const checkAccessWithTracking = useCallback((
    request: Omit<BranchAccessRequest, 'userId' | 'currentBranchId' | 'timestamp'>
  ) => {
    const result = contextCheckAccess(request);
    trackAccessCheck(result);
    return result;
  }, [contextCheckAccess, trackAccessCheck]);

  return {
    // Core functions
    checkAccess: checkAccessWithTracking,
    logOperation: contextLogOperation,
    
    // Convenience functions
    canViewBranchData,
    canEditBranchData,
    canDeleteBranchData,
    canTransferBetweenBranches,
    
    // Data filtering
    filterDataByAccess,
    
    // Session management
    currentSessionId,
    getSessionReport,
    isSessionValid,
    
    // Security status
    isSecurityEnabled,
    accessStats,
    
    // Manager instance for advanced usage
    securityManager
  };
}

// Utility hook for specific resource types
export function useResourceSecurity(resourceType: string) {
  const security = useBranchSecurity();
  
  const canView = useCallback((branchId: string) => 
    security.canViewBranchData(branchId, resourceType), [security, resourceType]);
    
  const canEdit = useCallback((branchId: string) => 
    security.canEditBranchData(branchId, resourceType), [security, resourceType]);
    
  const canDelete = useCallback((branchId: string) => 
    security.canDeleteBranchData(branchId, resourceType), [security, resourceType]);
    
  const filterData = useCallback(<T extends { branchId?: string }>(data: T[]) => 
    security.filterDataByAccess(data, resourceType), [security, resourceType]);

  return {
    canView,
    canEdit,
    canDelete,
    filterData,
    logOperation: (operation: string, targetBranchId?: string) => 
      security.logOperation(operation, resourceType, targetBranchId)
  };
}