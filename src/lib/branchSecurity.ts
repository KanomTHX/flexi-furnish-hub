// Branch Security Layer - Phase 1
// ระบบรักษาความปลอดภัยและควบคุมการเข้าถึงข้อมูลระหว่างสาขา

import { Branch, BranchDataContext } from '../types/branch';

export interface BranchSecurityConfig {
  enforceDataIsolation: boolean;
  allowCrossBranchAccess: boolean;
  requireApprovalForSensitiveOperations: boolean;
  auditAllOperations: boolean;
  sessionTimeout: number; // minutes
  maxConcurrentSessions: number;
}

export interface BranchAccessRequest {
  userId: string;
  userRole: string;
  currentBranchId: string;
  targetBranchId: string;
  operation: 'view' | 'create' | 'update' | 'delete' | 'transfer' | 'report';
  resourceType: 'sales' | 'stock' | 'customers' | 'employees' | 'reports' | 'settings';
  timestamp: Date;
}

export interface BranchAccessResult {
  allowed: boolean;
  reason: string;
  restrictionLevel: 'none' | 'partial' | 'full';
  allowedFields?: string[];
  requiresApproval?: boolean;
  auditRequired?: boolean;
}

export class BranchSecurityManager {
  private config: BranchSecurityConfig;
  private activeSessions: Map<string, BranchSession> = new Map();

  constructor(config: BranchSecurityConfig) {
    this.config = config;
    this.initializeCleanupTimer();
  }

  // ตรวจสอบสิทธิ์การเข้าถึงข้อมูลสาขา
  checkBranchAccess(request: BranchAccessRequest, context: BranchDataContext): BranchAccessResult {
    const { userId, currentBranchId, targetBranchId, operation, resourceType } = request;

    // ตรวจสอบการเข้าถึงสาขาเดียวกัน
    if (currentBranchId === targetBranchId) {
      return {
        allowed: true,
        reason: 'Same branch access',
        restrictionLevel: 'none',
        auditRequired: this.config.auditAllOperations
      };
    }

    // ตรวจสอบสิทธิ์ Super Admin
    if (context.userPermissions.canViewAllBranches) {
      return {
        allowed: true,
        reason: 'Super admin access',
        restrictionLevel: 'none',
        auditRequired: true
      };
    }

    // ตรวจสอบการปิดใช้งาน Cross-branch access
    if (!this.config.allowCrossBranchAccess) {
      return {
        allowed: false,
        reason: 'Cross-branch access disabled',
        restrictionLevel: 'full'
      };
    }

    // ตรวจสอบสิทธิ์เฉพาะสาขา
    const targetBranch = context.accessibleBranches.find(b => b.id === targetBranchId);
    if (!targetBranch) {
      return {
        allowed: false,
        reason: 'Branch not accessible',
        restrictionLevel: 'full'
      };
    }

    // ตรวจสอบระดับการแยกข้อมูล
    const isolationLevel = targetBranch.permissions.dataIsolationLevel;
    
    if (isolationLevel === 'strict') {
      return {
        allowed: false,
        reason: 'Strict data isolation enforced',
        restrictionLevel: 'full'
      };
    }

    if (isolationLevel === 'partial') {
      return this.checkPartialAccess(request, targetBranch);
    }

    // Shared level - ตรวจสอบ operation และ resource type
    return this.checkSharedAccess(request, targetBranch);
  }

  // ตรวจสอบการเข้าถึงแบบ Partial
  private checkPartialAccess(request: BranchAccessRequest, targetBranch: Branch): BranchAccessResult {
    const { operation, resourceType } = request;
    
    // อนุญาตเฉพาะการดูข้อมูลสำหรับทรัพยากรบางประเภท
    if (operation === 'view') {
      const allowedResources = ['stock', 'reports'];
      if (allowedResources.includes(resourceType)) {
        return {
          allowed: true,
          reason: 'Partial access - view only for allowed resources',
          restrictionLevel: 'partial',
          allowedFields: this.getPartialAccessFields(resourceType),
          auditRequired: true
        };
      }
    }

    // การดำเนินการอื่นๆ ต้องได้รับการอนุมัติ
    if (this.config.requireApprovalForSensitiveOperations) {
      return {
        allowed: false,
        reason: 'Requires approval for cross-branch operation',
        restrictionLevel: 'partial',
        requiresApproval: true
      };
    }

    return {
      allowed: false,
      reason: 'Partial isolation - operation not allowed',
      restrictionLevel: 'partial'
    };
  }

  // ตรวจสอบการเข้าถึงแบบ Shared
  private checkSharedAccess(request: BranchAccessRequest, targetBranch: Branch): BranchAccessResult {
    const { operation, resourceType } = request;

    // ตรวจสอบรายการ operations ที่อนุญาต
    const allowedOperations = targetBranch.permissions.canViewReports;
    
    if (operation === 'view' && allowedOperations.includes('all')) {
      return {
        allowed: true,
        reason: 'Shared access - view allowed',
        restrictionLevel: 'none',
        auditRequired: true
      };
    }

    // การดำเนินการที่มีความเสี่ยงสูง
    const sensitiveOperations = ['delete', 'transfer'];
    if (sensitiveOperations.includes(operation)) {
      return {
        allowed: false,
        reason: 'Sensitive operation requires approval',
        restrictionLevel: 'partial',
        requiresApproval: true
      };
    }

    return {
      allowed: true,
      reason: 'Shared access allowed',
      restrictionLevel: 'partial',
      auditRequired: true
    };
  }

  // กำหนดฟิลด์ที่อนุญาตให้เข้าถึงในแต่ละทรัพยากร
  private getPartialAccessFields(resourceType: string): string[] {
    const fieldMappings: Record<string, string[]> = {
      stock: ['productId', 'productName', 'quantity', 'category', 'status'],
      reports: ['summary', 'totals', 'aggregated'],
      customers: ['name', 'totalPurchases', 'status'],
      employees: ['name', 'position', 'department'],
      sales: ['total', 'date', 'status']
    };

    return fieldMappings[resourceType] || [];
  }

  // สร้าง Session สำหรับการติดตามการเข้าถึง
  createBranchSession(userId: string, branchId: string): string {
    const sessionId = this.generateSessionId();
    const session: BranchSession = {
      id: sessionId,
      userId,
      branchId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      accessLog: []
    };

    this.activeSessions.set(sessionId, session);
    this.cleanupExpiredSessions();

    return sessionId;
  }

  // บันทึกการเข้าถึงข้อมูล
  logAccess(sessionId: string, operation: string, resourceType: string, targetBranchId?: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.lastActivity = new Date();
    session.accessLog.push({
      timestamp: new Date(),
      operation,
      resourceType,
      targetBranchId,
      success: true
    });

    // จำกัดจำนวน log entries
    if (session.accessLog.length > 100) {
      session.accessLog = session.accessLog.slice(-50);
    }
  }

  // ตรวจสอบ Session ที่ใช้งานอยู่
  validateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    const now = new Date();
    const timeDiff = now.getTime() - session.lastActivity.getTime();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    if (timeDiff > timeoutMs) {
      session.isActive = false;
      return false;
    }

    return true;
  }

  // ล้าง Session ที่หมดอายุ
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeDiff = now.getTime() - session.lastActivity.getTime();
      if (timeDiff > timeoutMs) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // ตั้งเวลาทำความสะอาดอัตโนมัติ
  private initializeCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // ทุก 5 นาที
  }

  // สร้าง Session ID
  private generateSessionId(): string {
    return `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // รายงานการเข้าถึงของ Session
  getSessionReport(sessionId: string): BranchSessionReport | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      userId: session.userId,
      branchId: session.branchId,
      duration: new Date().getTime() - session.createdAt.getTime(),
      totalOperations: session.accessLog.length,
      operationsByType: this.groupLogsByType(session.accessLog),
      isActive: session.isActive,
      lastActivity: session.lastActivity
    };
  }

  // จัดกลุ่ม Log ตามประเภท
  private groupLogsByType(logs: BranchAccessLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.resourceType] = (acc[log.resourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Interfaces สำหรับ Session Management
export interface BranchSession {
  id: string;
  userId: string;
  branchId: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  accessLog: BranchAccessLog[];
}

export interface BranchAccessLog {
  timestamp: Date;
  operation: string;
  resourceType: string;
  targetBranchId?: string;
  success: boolean;
}

export interface BranchSessionReport {
  sessionId: string;
  userId: string;
  branchId: string;
  duration: number;
  totalOperations: number;
  operationsByType: Record<string, number>;
  isActive: boolean;
  lastActivity: Date;
}

// สร้าง Instance เริ่มต้น
export const defaultBranchSecurity = new BranchSecurityManager({
  enforceDataIsolation: true,
  allowCrossBranchAccess: true,
  requireApprovalForSensitiveOperations: true,
  auditAllOperations: true,
  sessionTimeout: 30, // 30 minutes
  maxConcurrentSessions: 3
});