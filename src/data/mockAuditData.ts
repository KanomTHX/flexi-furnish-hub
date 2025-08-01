import { 
  AuditLog, 
  AuditStatistics, 
  SecurityEvent, 
  ComplianceReport,
  User,
  AuditAction,
  AuditResource,
  SystemModule,
  AuditSeverity,
  AuditStatus,
  UserRole
} from '@/types/audit';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@company.com',
    fullName: 'ผู้ดูแลระบบ',
    role: 'admin',
    department: 'IT'
  },
  {
    id: 'user-002',
    username: 'manager01',
    email: 'manager@company.com',
    fullName: 'นายจัดการ สมชาย',
    role: 'manager',
    department: 'Sales'
  },
  {
    id: 'user-003',
    username: 'cashier01',
    email: 'cashier1@company.com',
    fullName: 'นางสาวแคชเชียร์ มาลี',
    role: 'cashier',
    department: 'Sales'
  },
  {
    id: 'user-004',
    username: 'warehouse01',
    email: 'warehouse@company.com',
    fullName: 'นายคลังสินค้า สมศักดิ์',
    role: 'warehouse',
    department: 'Warehouse'
  },
  {
    id: 'user-005',
    username: 'accountant01',
    email: 'accounting@company.com',
    fullName: 'นางบัญชี สุดา',
    role: 'accountant',
    department: 'Finance'
  }
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2024-01-25T09:15:30Z',
    userId: 'user-003',
    user: mockUsers[2],
    action: 'create',
    resource: 'order',
    resourceId: 'order-001',
    resourceName: 'ใบสั่งซื้อ #ORD-2024-001',
    module: 'pos',
    description: 'สร้างใบสั่งซื้อใหม่',
    details: {
      newValues: {
        orderId: 'order-001',
        customerId: 'cust-001',
        totalAmount: 15000,
        items: 3
      },
      additionalInfo: {
        paymentMethod: 'cash',
        discount: 0
      }
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-001',
    severity: 'low',
    status: 'success',
    createdAt: '2024-01-25T09:15:30Z'
  },
  {
    id: 'audit-002',
    timestamp: '2024-01-25T09:30:45Z',
    userId: 'user-004',
    user: mockUsers[3],
    action: 'update',
    resource: 'inventory',
    resourceId: 'prod-001',
    resourceName: 'โซฟา 3 ที่นั่ง',
    module: 'inventory',
    description: 'อัปเดตจำนวนสินค้าในคลัง',
    details: {
      oldValues: {
        quantity: 50,
        location: 'A-01'
      },
      newValues: {
        quantity: 47,
        location: 'A-01'
      },
      changedFields: ['quantity'],
      affectedRecords: 1
    },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-002',
    severity: 'low',
    status: 'success',
    createdAt: '2024-01-25T09:30:45Z'
  },
  {
    id: 'audit-003',
    timestamp: '2024-01-25T10:00:15Z',
    userId: 'user-005',
    user: mockUsers[4],
    action: 'create',
    resource: 'journal_entry',
    resourceId: 'je-001',
    resourceName: 'รายการบัญชี JE-2024-001',
    module: 'accounting',
    description: 'สร้างรายการบัญชีใหม่',
    details: {
      newValues: {
        entryNumber: 'JE-2024-001',
        totalDebit: 15000,
        totalCredit: 15000,
        description: 'บันทึกการขายสินค้า'
      },
      additionalInfo: {
        entriesCount: 2,
        reference: 'ORD-2024-001'
      }
    },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-003',
    severity: 'medium',
    status: 'success',
    createdAt: '2024-01-25T10:00:15Z'
  },
  {
    id: 'audit-004',
    timestamp: '2024-01-25T10:15:22Z',
    userId: 'user-002',
    user: mockUsers[1],
    action: 'approve',
    resource: 'transfer',
    resourceId: 'transfer-001',
    resourceName: 'การโอนย้าย TRF-2024-001',
    module: 'warehouse',
    description: 'อนุมัติการโอนย้ายสินค้า',
    details: {
      oldValues: {
        status: 'pending'
      },
      newValues: {
        status: 'approved',
        approvedBy: 'user-002'
      },
      changedFields: ['status', 'approvedBy'],
      additionalInfo: {
        fromWarehouse: 'WH-001',
        toWarehouse: 'WH-002',
        itemsCount: 5
      }
    },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-004',
    severity: 'medium',
    status: 'success',
    createdAt: '2024-01-25T10:15:22Z'
  },
  {
    id: 'audit-005',
    timestamp: '2024-01-25T10:45:10Z',
    userId: 'user-001',
    user: mockUsers[0],
    action: 'config_change',
    resource: 'system',
    resourceId: 'config-001',
    resourceName: 'การตั้งค่าระบบ',
    module: 'system',
    description: 'เปลี่ยนแปลงการตั้งค่าระบบ',
    details: {
      oldValues: {
        maxLoginAttempts: 3,
        sessionTimeout: 30
      },
      newValues: {
        maxLoginAttempts: 5,
        sessionTimeout: 60
      },
      changedFields: ['maxLoginAttempts', 'sessionTimeout'],
      additionalInfo: {
        reason: 'เพิ่มความสะดวกในการใช้งาน'
      }
    },
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-005',
    severity: 'high',
    status: 'success',
    createdAt: '2024-01-25T10:45:10Z'
  },
  {
    id: 'audit-006',
    timestamp: '2024-01-25T11:00:33Z',
    userId: 'user-003',
    user: mockUsers[2],
    action: 'login_failed',
    resource: 'session',
    resourceId: 'sess-failed-001',
    module: 'auth',
    description: 'ความพยายามเข้าสู่ระบบล้มเหลว',
    details: {
      errorMessage: 'รหัสผ่านไม่ถูกต้อง',
      additionalInfo: {
        attemptNumber: 2,
        username: 'cashier01'
      }
    },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-failed-001',
    severity: 'medium',
    status: 'failed',
    createdAt: '2024-01-25T11:00:33Z'
  },
  {
    id: 'audit-007',
    timestamp: '2024-01-25T11:30:18Z',
    userId: 'user-002',
    user: mockUsers[1],
    action: 'export',
    resource: 'report',
    resourceId: 'report-001',
    resourceName: 'รายงานยอดขาย',
    module: 'reports',
    description: 'ส่งออกรายงานยอดขาย',
    details: {
      additionalInfo: {
        reportType: 'sales_summary',
        dateRange: '2024-01-01 to 2024-01-25',
        format: 'CSV',
        recordCount: 150
      }
    },
    ipAddress: '192.168.1.106',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-006',
    severity: 'medium',
    status: 'success',
    createdAt: '2024-01-25T11:30:18Z'
  },
  {
    id: 'audit-008',
    timestamp: '2024-01-25T12:15:45Z',
    userId: 'user-004',
    user: mockUsers[3],
    action: 'delete',
    resource: 'product',
    resourceId: 'prod-999',
    resourceName: 'สินค้าทดสอบ',
    module: 'inventory',
    description: 'ลบสินค้าที่ไม่ใช้แล้ว',
    details: {
      oldValues: {
        name: 'สินค้าทดสอบ',
        sku: 'TEST-001',
        quantity: 0,
        status: 'inactive'
      },
      additionalInfo: {
        reason: 'สินค้าทดสอบที่ไม่ใช้แล้ว'
      }
    },
    ipAddress: '192.168.1.107',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-007',
    severity: 'high',
    status: 'success',
    createdAt: '2024-01-25T12:15:45Z'
  },
  {
    id: 'audit-009',
    timestamp: '2024-01-25T13:00:12Z',
    userId: 'user-001',
    user: mockUsers[0],
    action: 'backup',
    resource: 'system',
    resourceId: 'backup-001',
    resourceName: 'การสำรองข้อมูลประจำวัน',
    module: 'system',
    description: 'สำรองข้อมูลระบบ',
    details: {
      additionalInfo: {
        backupType: 'full',
        size: '2.5GB',
        duration: '15 minutes',
        location: '/backups/daily/2024-01-25.sql'
      }
    },
    ipAddress: '192.168.1.108',
    userAgent: 'System/Automated',
    sessionId: 'sess-system-001',
    severity: 'low',
    status: 'success',
    createdAt: '2024-01-25T13:00:12Z'
  },
  {
    id: 'audit-010',
    timestamp: '2024-01-25T14:30:55Z',
    userId: 'user-003',
    user: mockUsers[2],
    action: 'void',
    resource: 'payment',
    resourceId: 'pay-001',
    resourceName: 'การชำระเงิน PAY-2024-001',
    module: 'pos',
    description: 'ยกเลิกการชำระเงิน',
    details: {
      oldValues: {
        status: 'completed',
        amount: 5000
      },
      newValues: {
        status: 'voided',
        amount: 0,
        voidReason: 'ลูกค้าขอยกเลิก'
      },
      changedFields: ['status', 'amount', 'voidReason'],
      additionalInfo: {
        originalOrderId: 'order-002',
        refundMethod: 'cash'
      }
    },
    ipAddress: '192.168.1.109',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'sess-008',
    severity: 'high',
    status: 'success',
    createdAt: '2024-01-25T14:30:55Z'
  }
];

// Mock Security Events
export const mockSecurityEvents: SecurityEvent[] = [
  {
    id: 'sec-001',
    timestamp: '2024-01-25T11:00:33Z',
    type: 'multiple_failed_logins',
    severity: 'medium',
    userId: 'user-003',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: 'ตรวจพบความพยายามเข้าสู่ระบบล้มเหลวหลายครั้ง',
    details: {
      attemptCount: 3,
      timeWindow: '5 minutes',
      riskScore: 6.5,
      mitigationActions: ['account_locked', 'notification_sent']
    },
    resolved: true,
    resolvedBy: 'user-001',
    resolvedAt: '2024-01-25T11:15:00Z',
    notes: 'ผู้ใช้ลืมรหัสผ่าน ได้รีเซ็ตรหัสผ่านใหม่แล้ว'
  },
  {
    id: 'sec-002',
    timestamp: '2024-01-25T15:45:20Z',
    type: 'unusual_data_access',
    severity: 'high',
    userId: 'user-002',
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: 'การเข้าถึงข้อมูลในปริมาณมากผิดปกติ',
    details: {
      affectedResources: ['customer_data', 'financial_reports'],
      riskScore: 8.2,
      timeWindow: '30 minutes',
      additionalContext: {
        recordsAccessed: 500,
        normalAverage: 50
      }
    },
    resolved: false
  },
  {
    id: 'sec-003',
    timestamp: '2024-01-25T16:20:10Z',
    type: 'suspicious_activity',
    severity: 'critical',
    ipAddress: '203.154.123.45',
    userAgent: 'Unknown/Bot',
    description: 'ตรวจพบกิจกรรมที่น่าสงสัยจาก IP ภายนอก',
    details: {
      riskScore: 9.5,
      mitigationActions: ['ip_blocked', 'alert_sent'],
      additionalContext: {
        requestCount: 1000,
        timeWindow: '10 minutes',
        endpoints: ['/api/users', '/api/financial', '/api/customers']
      }
    },
    resolved: true,
    resolvedBy: 'user-001',
    resolvedAt: '2024-01-25T16:25:00Z',
    notes: 'บล็อก IP และเพิ่มใน blacklist แล้ว'
  }
];

// Calculate audit statistics
export function calculateAuditStatistics(): AuditStatistics {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalLogs = mockAuditLogs.length;
  const todayLogs = mockAuditLogs.filter(log => 
    log.timestamp.split('T')[0] === today
  ).length;
  const weekLogs = mockAuditLogs.filter(log => 
    new Date(log.timestamp) >= weekAgo
  ).length;
  const monthLogs = mockAuditLogs.filter(log => 
    new Date(log.timestamp) >= monthAgo
  ).length;

  const criticalEvents = mockAuditLogs.filter(log => 
    log.severity === 'critical'
  ).length + mockSecurityEvents.filter(event => 
    event.severity === 'critical'
  ).length;

  const failedActions = mockAuditLogs.filter(log => 
    log.status === 'failed' || log.status === 'error'
  ).length;

  const uniqueUsers = new Set(mockAuditLogs.map(log => log.userId)).size;

  // Top actions
  const actionCounts = mockAuditLogs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({
      action: action as AuditAction,
      count,
      percentage: (count / totalLogs) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top modules
  const moduleCounts = mockAuditLogs.reduce((acc, log) => {
    acc[log.module] = (acc[log.module] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topModules = Object.entries(moduleCounts)
    .map(([module, count]) => ({
      module: module as SystemModule,
      count,
      percentage: (count / totalLogs) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top users
  const userCounts = mockAuditLogs.reduce((acc, log) => {
    if (!acc[log.userId]) {
      acc[log.userId] = {
        count: 0,
        lastActivity: log.timestamp,
        user: log.user
      };
    }
    acc[log.userId].count++;
    if (log.timestamp > acc[log.userId].lastActivity) {
      acc[log.userId].lastActivity = log.timestamp;
    }
    return acc;
  }, {} as Record<string, any>);

  const topUsers = Object.entries(userCounts)
    .map(([userId, data]) => ({
      userId,
      username: data.user.username,
      fullName: data.user.fullName,
      count: data.count,
      lastActivity: data.lastActivity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Hourly activity (mock data)
  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: Math.floor(Math.random() * 20) + 1
  }));

  // Daily trends (mock data for last 7 days)
  const dailyTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const totalLogs = Math.floor(Math.random() * 50) + 10;
    const failedCount = Math.floor(Math.random() * 5);
    const criticalCount = Math.floor(Math.random() * 2);
    
    return {
      date: date.toISOString().split('T')[0],
      totalLogs,
      successCount: totalLogs - failedCount,
      failedCount,
      criticalCount
    };
  }).reverse();

  return {
    totalLogs,
    todayLogs,
    weekLogs,
    monthLogs,
    criticalEvents,
    failedActions,
    uniqueUsers,
    topActions,
    topModules,
    topUsers,
    hourlyActivity,
    dailyTrends
  };
}

// Mock Compliance Reports
export const mockComplianceReports: ComplianceReport[] = [
  {
    id: 'comp-001',
    reportType: 'access_control',
    period: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      description: 'มกราคม 2024'
    },
    generatedAt: '2024-02-01T09:00:00Z',
    generatedBy: 'user-001',
    status: 'completed',
    summary: {
      totalEvents: 1250,
      complianceScore: 85.5,
      riskLevel: 'medium',
      keyMetrics: {
        successfulLogins: 1180,
        failedLogins: 45,
        privilegeEscalations: 2,
        unauthorizedAccess: 0
      }
    },
    findings: [
      {
        id: 'find-001',
        category: 'Authentication',
        severity: 'medium',
        description: 'พบความพยายามเข้าสู่ระบบล้มเหลวเกินเกณฑ์',
        evidence: ['45 failed login attempts', 'Multiple IP addresses'],
        recommendation: 'เพิ่มการตรวจสอบ 2FA และปรับปรุงนโยบายรหัสผ่าน',
        status: 'open'
      }
    ],
    recommendations: [
      'ปรับปรุงระบบการตรวจสอบสิทธิ์',
      'เพิ่มการฝึกอบรมด้านความปลอดภัย',
      'ตรวจสอบและอัปเดตสิทธิ์ผู้ใช้งาน'
    ]
  }
];

// Helper function to create audit log
export function createAuditLog(
  userId: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  module: SystemModule,
  description: string,
  details: any = {},
  severity: AuditSeverity = 'low'
): AuditLog {
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
  
  return {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId,
    user,
    action,
    resource,
    resourceId,
    module,
    description,
    details,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: `sess-${Date.now()}`,
    severity,
    status: 'success',
    createdAt: new Date().toISOString()
  };
}