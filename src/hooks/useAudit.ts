import { useState, useMemo, useCallback } from 'react';
import {
  AuditLog,
  AuditStatistics,
  SecurityEvent,
  ComplianceReport,
  User,
  AuditFilter,
  SecurityEventFilter,
  AuditAction,
  AuditResource,
  SystemModule,
  AuditSeverity,
  AuditStatus
} from '@/types/audit';
import {
  mockAuditLogs,
  mockUsers,
  mockSecurityEvents,
  mockComplianceReports,
  calculateAuditStatistics,
  createAuditLog
} from '@/data/mockAuditData';

export function useAudit() {
  // State management
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>(mockComplianceReports);
  
  // Filters
  const [auditFilter, setAuditFilter] = useState<AuditFilter>({});
  const [securityEventFilter, setSecurityEventFilter] = useState<SecurityEventFilter>({});

  // Calculate statistics
  const statistics: AuditStatistics = useMemo(() => 
    calculateAuditStatistics(), 
    [auditLogs, securityEvents]
  );

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesUser = !auditFilter.userId || log.userId === auditFilter.userId;
      const matchesAction = !auditFilter.action || log.action === auditFilter.action;
      const matchesResource = !auditFilter.resource || log.resource === auditFilter.resource;
      const matchesModule = !auditFilter.module || log.module === auditFilter.module;
      const matchesSeverity = !auditFilter.severity || log.severity === auditFilter.severity;
      const matchesStatus = !auditFilter.status || log.status === auditFilter.status;
      
      const matchesDateFrom = !auditFilter.dateFrom || 
        log.timestamp.split('T')[0] >= auditFilter.dateFrom;
      const matchesDateTo = !auditFilter.dateTo || 
        log.timestamp.split('T')[0] <= auditFilter.dateTo;
      
      const matchesIpAddress = !auditFilter.ipAddress || 
        log.ipAddress.includes(auditFilter.ipAddress);
      
      const matchesSearch = !auditFilter.search ||
        log.description.toLowerCase().includes(auditFilter.search.toLowerCase()) ||
        log.user.fullName.toLowerCase().includes(auditFilter.search.toLowerCase()) ||
        log.user.username.toLowerCase().includes(auditFilter.search.toLowerCase()) ||
        (log.resourceName && log.resourceName.toLowerCase().includes(auditFilter.search.toLowerCase()));

      return matchesUser && matchesAction && matchesResource && matchesModule && 
             matchesSeverity && matchesStatus && matchesDateFrom && matchesDateTo && 
             matchesIpAddress && matchesSearch;
    });
  }, [auditLogs, auditFilter]);

  // Filtered security events
  const filteredSecurityEvents = useMemo(() => {
    return securityEvents.filter(event => {
      const matchesType = !securityEventFilter.type || event.type === securityEventFilter.type;
      const matchesSeverity = !securityEventFilter.severity || event.severity === securityEventFilter.severity;
      const matchesResolved = securityEventFilter.resolved === undefined || 
        event.resolved === securityEventFilter.resolved;
      
      const matchesDateFrom = !securityEventFilter.dateFrom || 
        event.timestamp.split('T')[0] >= securityEventFilter.dateFrom;
      const matchesDateTo = !securityEventFilter.dateTo || 
        event.timestamp.split('T')[0] <= securityEventFilter.dateTo;
      
      const matchesSearch = !securityEventFilter.search ||
        event.description.toLowerCase().includes(securityEventFilter.search.toLowerCase()) ||
        event.ipAddress.includes(securityEventFilter.search);

      return matchesType && matchesSeverity && matchesResolved && 
             matchesDateFrom && matchesDateTo && matchesSearch;
    });
  }, [securityEvents, securityEventFilter]);

  // Audit log operations
  const addAuditLog = useCallback((
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    module: SystemModule,
    description: string,
    details: any = {},
    severity: AuditSeverity = 'low'
  ) => {
    const newLog = createAuditLog(
      userId, action, resource, resourceId, module, description, details, severity
    );
    setAuditLogs(prev => [newLog, ...prev]);
    return newLog;
  }, []);

  const logUserAction = useCallback((
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    resourceName: string,
    module: SystemModule,
    details: any = {}
  ) => {
    const description = `${getActionDescription(action)} ${getResourceDescription(resource)}: ${resourceName}`;
    const severity = getSeverityByAction(action);
    
    return addAuditLog(userId, action, resource, resourceId, module, description, details, severity);
  }, [addAuditLog]);

  const logSystemEvent = useCallback((
    action: AuditAction,
    description: string,
    details: any = {},
    severity: AuditSeverity = 'low'
  ) => {
    return addAuditLog('system', action, 'system', 'system', 'system', description, details, severity);
  }, [addAuditLog]);

  const logSecurityEvent = useCallback((
    type: string,
    severity: AuditSeverity,
    description: string,
    details: any = {},
    userId?: string,
    ipAddress: string = '0.0.0.0'
  ) => {
    const newEvent: SecurityEvent = {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: type as any,
      severity,
      userId,
      ipAddress,
      userAgent: 'System/Automated',
      description,
      details,
      resolved: false
    };

    setSecurityEvents(prev => [newEvent, ...prev]);
    
    // Also log as audit log
    addAuditLog(
      userId || 'system',
      'system_error',
      'system',
      newEvent.id,
      'system',
      `Security Event: ${description}`,
      { securityEventId: newEvent.id, ...details },
      severity
    );

    return newEvent;
  }, [addAuditLog]);

  const resolveSecurityEvent = useCallback((eventId: string, resolvedBy: string, notes?: string) => {
    setSecurityEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          resolved: true,
          resolvedBy,
          resolvedAt: new Date().toISOString(),
          notes
        };
      }
      return event;
    }));

    // Log the resolution
    addAuditLog(
      resolvedBy,
      'update',
      'system',
      eventId,
      'system',
      `แก้ไขเหตุการณ์ความปลอดภัย: ${eventId}`,
      { notes, action: 'resolve_security_event' },
      'medium'
    );
  }, [addAuditLog]);

  // Filter operations
  const clearAuditFilter = useCallback(() => {
    setAuditFilter({});
  }, []);

  const clearSecurityEventFilter = useCallback(() => {
    setSecurityEventFilter({});
  }, []);

  // Utility functions
  const getAuditLogById = useCallback((logId: string) => {
    return auditLogs.find(log => log.id === logId);
  }, [auditLogs]);

  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);

  const getSecurityEventById = useCallback((eventId: string) => {
    return securityEvents.find(event => event.id === eventId);
  }, [securityEvents]);

  const getCriticalEvents = useCallback(() => {
    const criticalLogs = auditLogs.filter(log => log.severity === 'critical');
    const criticalSecurityEvents = securityEvents.filter(event => event.severity === 'critical');
    return { criticalLogs, criticalSecurityEvents };
  }, [auditLogs, securityEvents]);

  const getRecentActivity = useCallback((hours: number = 24) => {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return auditLogs.filter(log => new Date(log.timestamp) >= cutoffTime);
  }, [auditLogs]);

  const getFailedActions = useCallback(() => {
    return auditLogs.filter(log => log.status === 'failed' || log.status === 'error');
  }, [auditLogs]);

  const getUnresolvedSecurityEvents = useCallback(() => {
    return securityEvents.filter(event => !event.resolved);
  }, [securityEvents]);

  const getUserActivity = useCallback((userId: string, days: number = 7) => {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return auditLogs.filter(log => 
      log.userId === userId && new Date(log.timestamp) >= cutoffTime
    );
  }, [auditLogs]);

  const getModuleActivity = useCallback((module: SystemModule, days: number = 7) => {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return auditLogs.filter(log => 
      log.module === module && new Date(log.timestamp) >= cutoffTime
    );
  }, [auditLogs]);

  // Analytics functions
  const getActivityTrends = useCallback((days: number = 30) => {
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = auditLogs.filter(log => log.timestamp.split('T')[0] === dateStr);
      const successCount = dayLogs.filter(log => log.status === 'success').length;
      const failedCount = dayLogs.filter(log => log.status === 'failed' || log.status === 'error').length;
      
      trends.push({
        date: dateStr,
        total: dayLogs.length,
        success: successCount,
        failed: failedCount
      });
    }
    return trends;
  }, [auditLogs]);

  const generateComplianceReport = useCallback((
    reportType: string,
    startDate: string,
    endDate: string
  ) => {
    // Mock compliance report generation
    const newReport: ComplianceReport = {
      id: `comp-${Date.now()}`,
      reportType: reportType as any,
      period: {
        startDate,
        endDate,
        description: `${startDate} ถึง ${endDate}`
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'current-user',
      status: 'generating',
      summary: {
        totalEvents: 0,
        complianceScore: 0,
        riskLevel: 'low',
        keyMetrics: {}
      },
      findings: [],
      recommendations: []
    };

    setComplianceReports(prev => [newReport, ...prev]);

    // Simulate report generation
    setTimeout(() => {
      setComplianceReports(prev => prev.map(report => {
        if (report.id === newReport.id) {
          return {
            ...report,
            status: 'completed',
            summary: {
              totalEvents: Math.floor(Math.random() * 1000) + 100,
              complianceScore: Math.floor(Math.random() * 30) + 70,
              riskLevel: 'medium',
              keyMetrics: {
                successfulActions: Math.floor(Math.random() * 900) + 100,
                failedActions: Math.floor(Math.random() * 50) + 5,
                criticalEvents: Math.floor(Math.random() * 10) + 1
              }
            }
          };
        }
        return report;
      }));
    }, 3000);

    return newReport;
  }, []);

  return {
    // Data
    auditLogs: filteredAuditLogs,
    allAuditLogs: auditLogs,
    users,
    securityEvents: filteredSecurityEvents,
    allSecurityEvents: securityEvents,
    complianceReports,
    statistics,

    // Filters
    auditFilter,
    securityEventFilter,
    setAuditFilter,
    setSecurityEventFilter,
    clearAuditFilter,
    clearSecurityEventFilter,

    // Audit log operations
    addAuditLog,
    logUserAction,
    logSystemEvent,
    logSecurityEvent,
    resolveSecurityEvent,

    // Utility functions
    getAuditLogById,
    getUserById,
    getSecurityEventById,
    getCriticalEvents,
    getRecentActivity,
    getFailedActions,
    getUnresolvedSecurityEvents,
    getUserActivity,
    getModuleActivity,

    // Analytics
    getActivityTrends,
    generateComplianceReport
  };
}

// Helper functions
function getActionDescription(action: AuditAction): string {
  const descriptions = {
    create: 'สร้าง',
    read: 'อ่าน',
    update: 'แก้ไข',
    delete: 'ลบ',
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    login_failed: 'เข้าสู่ระบบล้มเหลว',
    export: 'ส่งออก',
    import: 'นำเข้า',
    backup: 'สำรองข้อมูล',
    restore: 'กู้คืนข้อมูล',
    approve: 'อนุมัติ',
    reject: 'ปฏิเสธ',
    assign: 'มอบหมาย',
    complete: 'เสร็จสิ้น',
    payment: 'ชำระเงิน',
    refund: 'คืนเงิน',
    void: 'ยกเลิก',
    config_change: 'เปลี่ยนแปลงการตั้งค่า',
    permission_change: 'เปลี่ยนแปลงสิทธิ์',
    system_start: 'เริ่มระบบ',
    system_stop: 'หยุดระบบ',
    system_error: 'ข้อผิดพลาดระบบ'
  };
  return descriptions[action] || action;
}

function getResourceDescription(resource: AuditResource): string {
  const descriptions = {
    user: 'ผู้ใช้',
    product: 'สินค้า',
    customer: 'ลูกค้า',
    order: 'คำสั่งซื้อ',
    payment: 'การชำระเงิน',
    inventory: 'สินค้าคงคลัง',
    warehouse: 'คลังสินค้า',
    transfer: 'การโอนย้าย',
    claim: 'การเคลม',
    account: 'บัญชี',
    journal_entry: 'รายการบัญชี',
    report: 'รายงาน',
    system: 'ระบบ',
    config: 'การตั้งค่า',
    permission: 'สิทธิ์',
    role: 'บทบาท',
    file: 'ไฟล์',
    backup: 'การสำรองข้อมูล',
    session: 'เซสชัน'
  };
  return descriptions[resource] || resource;
}

function getSeverityByAction(action: AuditAction): AuditSeverity {
  const highSeverityActions: AuditAction[] = [
    'delete', 'config_change', 'permission_change', 'backup', 'restore', 'void'
  ];
  const mediumSeverityActions: AuditAction[] = [
    'create', 'update', 'approve', 'reject', 'payment', 'refund', 'export'
  ];
  const criticalSeverityActions: AuditAction[] = [
    'system_error', 'login_failed'
  ];

  if (criticalSeverityActions.includes(action)) return 'critical';
  if (highSeverityActions.includes(action)) return 'high';
  if (mediumSeverityActions.includes(action)) return 'medium';
  return 'low';
}