import React, { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  BranchSecurityManager, 
  BranchAccessRequest, 
  BranchAccessResult,
  BranchSecurityConfig,
  defaultBranchSecurity
} from '../lib/branchSecurity';
import { BranchDataContext } from '../types/branch';
import { useBranchData } from './useBranchData';

interface BranchSecurityContextType {
  securityManager: BranchSecurityManager;
  currentSessionId: string | null;
  isSecurityEnabled: boolean;
  checkAccess: (request: Omit<BranchAccessRequest, 'userId' | 'currentBranchId' | 'timestamp'>) => BranchAccessResult;
  logOperation: (operation: string, resourceType: string, targetBranchId?: string) => void;
}

const BranchSecurityContext = createContext<BranchSecurityContextType | null>(null);

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

  useEffect(() => {
    if (currentBranch && branchContext) {
      const sessionId = securityManager.createBranchSession('current-user', currentBranch.id);
      setCurrentSessionId(sessionId);

      return () => {
        if (sessionId) {
          securityManager.logAccess(sessionId, 'session_end', 'system');
        }
      };
    }
  }, [currentBranch?.id, securityManager, branchContext]);

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
      userId: 'current-user',
      currentBranchId: currentBranch.id,
      timestamp: new Date()
    };

    return securityManager.checkBranchAccess(fullRequest, branchContext);
  }, [securityManager, currentBranch, branchContext, isSecurityEnabled]);

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

  return React.createElement(
    BranchSecurityContext.Provider,
    { value: contextValue },
    children
  );
}

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

  const canViewBranchData = useCallback((branchId: string, resourceType: string = 'general') => {
    const result = contextCheckAccess({
      targetBranchId: branchId,
      operation: 'view',
      resourceType: resourceType as any,
      userRole: 'user'
    });

    contextLogOperation('access_check', resourceType, branchId);
    return result;
  }, [contextCheckAccess, contextLogOperation]);

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

  const filterDataByAccess = useCallback((
    data: any[], 
    resourceType: string = 'general'
  ) => {
    if (!isSecurityEnabled) return data;

    return data.filter(item => {
      if (!item.branchId) return true;
      
      const access = canViewBranchData(item.branchId, resourceType);
      return access.allowed;
    });
  }, [canViewBranchData, isSecurityEnabled]);

  const getSessionReport = useCallback(() => {
    if (!currentSessionId) return null;
    return securityManager.getSessionReport(currentSessionId);
  }, [securityManager, currentSessionId]);

  const isSessionValid = useCallback(() => {
    if (!currentSessionId) return false;
    return securityManager.validateSession(currentSessionId);
  }, [securityManager, currentSessionId]);

  const [accessStats, setAccessStats] = useState({
    totalChecks: 0,
    allowedAccess: 0,
    deniedAccess: 0,
    partialAccess: 0
  });

  const trackAccessCheck = useCallback((result: BranchAccessResult) => {
    setAccessStats(prev => ({
      totalChecks: prev.totalChecks + 1,
      allowedAccess: prev.allowedAccess + (result.allowed ? 1 : 0),
      deniedAccess: prev.deniedAccess + (!result.allowed ? 1 : 0),
      partialAccess: prev.partialAccess + (result.restrictionLevel === 'partial' ? 1 : 0)
    }));
  }, []);

  const checkAccessWithTracking = useCallback((
    request: Omit<BranchAccessRequest, 'userId' | 'currentBranchId' | 'timestamp'>
  ) => {
    const result = contextCheckAccess(request);
    trackAccessCheck(result);
    return result;
  }, [contextCheckAccess, trackAccessCheck]);

  return {
    checkAccess: checkAccessWithTracking,
    logOperation: contextLogOperation,
    canViewBranchData,
    canEditBranchData,
    canDeleteBranchData,
    canTransferBetweenBranches,
    filterDataByAccess,
    currentSessionId,
    getSessionReport,
    isSessionValid,
    isSecurityEnabled,
    accessStats,
    securityManager
  };
}

export function useResourceSecurity(resourceType: string) {
  const security = useBranchSecurity();
  
  const canView = useCallback((branchId: string) => 
    security.canViewBranchData(branchId, resourceType), [security, resourceType]);
    
  const canEdit = useCallback((branchId: string) => 
    security.canEditBranchData(branchId, resourceType), [security, resourceType]);
    
  const canDelete = useCallback((branchId: string) => 
    security.canDeleteBranchData(branchId, resourceType), [security, resourceType]);
    
  const filterData = useCallback((data: any[]) => 
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