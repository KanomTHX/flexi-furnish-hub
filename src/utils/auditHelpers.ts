import { 
  AuditLog, 
  SecurityEvent, 
  User,
  AuditAction,
  AuditResource,
  SystemModule,
  AuditSeverity,
  AuditStatus
} from '@/types/audit';

// Label mappings
export const auditActionLabels: Record<AuditAction, string> = {
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

export const auditResourceLabels: Record<AuditResource, string> = {
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

export const systemModuleLabels: Record<SystemModule, string> = {
  pos: 'ระบบขาย (POS)',
  inventory: 'คลังสินค้า',
  warehouse: 'จัดการคลัง',
  accounting: 'บัญชี',
  claims: 'การเคลม',
  installments: 'ผ่อนชำระ',
  reports: 'รายงาน',
  settings: 'การตั้งค่า',
  users: 'ผู้ใช้งาน',
  system: 'ระบบ',
  auth: 'การยืนยันตัวตน'
};

export const auditSeverityLabels: Record<AuditSeverity, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
  critical: 'วิกฤต'
};

export const auditStatusLabels: Record<AuditStatus, string> = {
  success: 'สำเร็จ',
  failed: 'ล้มเหลว',
  warning: 'คำเตือน',
  error: 'ข้อผิดพลาด'
};

export const securityEventTypeLabels = {
  multiple_failed_logins: 'ความพยายามเข้าสู่ระบบล้มเหลวหลายครั้ง',
  suspicious_activity: 'กิจกรรมที่น่าสงสัย',
  unauthorized_access: 'การเข้าถึงโดยไม่ได้รับอนุญาต',
  privilege_escalation: 'การยกระดับสิทธิ์',
  data_breach_attempt: 'ความพยายามละเมิดข้อมูล',
  unusual_data_access: 'การเข้าถึงข้อมูลผิดปกติ',
  system_intrusion: 'การบุกรุกระบบ',
  malware_detected: 'ตรวจพบมัลแวร์'
};

export const userRoleLabels = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  cashier: 'แคชเชียร์',
  warehouse: 'พนักงานคลัง',
  accountant: 'นักบัญชี',
  viewer: 'ผู้ดู'
};

// Formatting functions
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} วัน`;
  if (hours > 0) return `${hours} ชั่วโมง`;
  if (minutes > 0) return `${minutes} นาที`;
  return `${seconds} วินาที`;
}

export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'เมื่อสักครู่';
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return formatDate(dateString);
}

// Color helpers
export function getSeverityColor(severity: AuditSeverity): string {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return colors[severity];
}

export function getStatusColor(status: AuditStatus): string {
  const colors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };
  return colors[status];
}

export function getActionColor(action: AuditAction): string {
  const dangerousActions = ['delete', 'void', 'system_error', 'login_failed'];
  const warningActions = ['config_change', 'permission_change', 'backup', 'restore'];
  const infoActions = ['create', 'update', 'approve', 'export'];

  if (dangerousActions.includes(action)) return 'bg-red-100 text-red-800';
  if (warningActions.includes(action)) return 'bg-orange-100 text-orange-800';
  if (infoActions.includes(action)) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
}

export function getModuleColor(module: SystemModule): string {
  const colors = {
    pos: 'bg-green-100 text-green-800',
    inventory: 'bg-blue-100 text-blue-800',
    warehouse: 'bg-purple-100 text-purple-800',
    accounting: 'bg-yellow-100 text-yellow-800',
    claims: 'bg-orange-100 text-orange-800',
    installments: 'bg-indigo-100 text-indigo-800',
    reports: 'bg-pink-100 text-pink-800',
    settings: 'bg-gray-100 text-gray-800',
    users: 'bg-teal-100 text-teal-800',
    system: 'bg-red-100 text-red-800',
    auth: 'bg-cyan-100 text-cyan-800'
  };
  return colors[module] || 'bg-gray-100 text-gray-800';
}

// Risk assessment
export function calculateRiskScore(log: AuditLog): number {
  let score = 0;

  // Base score by severity
  const severityScores = { low: 1, medium: 3, high: 6, critical: 10 };
  score += severityScores[log.severity];

  // Action risk
  const highRiskActions = ['delete', 'config_change', 'permission_change', 'void'];
  const mediumRiskActions = ['create', 'update', 'backup', 'restore'];
  
  if (highRiskActions.includes(log.action)) score += 3;
  else if (mediumRiskActions.includes(log.action)) score += 1;

  // Status impact
  if (log.status === 'failed' || log.status === 'error') score += 2;

  // Time-based risk (recent actions are riskier)
  const hoursSinceAction = (Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60);
  if (hoursSinceAction < 1) score += 1;

  return Math.min(score, 10); // Cap at 10
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

// Export functions
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  const headers = [
    'วันที่เวลา',
    'ผู้ใช้',
    'การกระทำ',
    'ทรัพยากร',
    'โมดูล',
    'คำอธิบาย',
    'ระดับความสำคัญ',
    'สถานะ',
    'IP Address',
    'Session ID'
  ];
  
  const rows = logs.map(log => [
    formatDateTime(log.timestamp),
    log.user.fullName,
    auditActionLabels[log.action],
    auditResourceLabels[log.resource],
    systemModuleLabels[log.module],
    log.description,
    auditSeverityLabels[log.severity],
    auditStatusLabels[log.status],
    log.ipAddress,
    log.sessionId
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportSecurityEventsToCSV(events: SecurityEvent[]): string {
  const headers = [
    'วันที่เวลา',
    'ประเภท',
    'ระดับความสำคัญ',
    'คำอธิบาย',
    'IP Address',
    'สถานะ',
    'ผู้แก้ไข',
    'วันที่แก้ไข'
  ];
  
  const rows = events.map(event => [
    formatDateTime(event.timestamp),
    securityEventTypeLabels[event.type as keyof typeof securityEventTypeLabels] || event.type,
    auditSeverityLabels[event.severity],
    event.description,
    event.ipAddress,
    event.resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข',
    event.resolvedBy || '',
    event.resolvedAt ? formatDateTime(event.resolvedAt) : ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportUsersToCSV(users: User[]): string {
  const headers = [
    'ชื่อผู้ใช้',
    'อีเมล',
    'ชื่อเต็ม',
    'บทบาท',
    'แผนก'
  ];
  
  const rows = users.map(user => [
    user.username,
    user.email,
    user.fullName,
    userRoleLabels[user.role],
    user.department || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Search and filter helpers
export function searchAuditLogs(logs: AuditLog[], searchTerm: string): AuditLog[] {
  if (!searchTerm.trim()) return logs;
  
  const term = searchTerm.toLowerCase();
  return logs.filter(log =>
    log.description.toLowerCase().includes(term) ||
    log.user.fullName.toLowerCase().includes(term) ||
    log.user.username.toLowerCase().includes(term) ||
    (log.resourceName && log.resourceName.toLowerCase().includes(term)) ||
    log.ipAddress.includes(term) ||
    auditActionLabels[log.action].toLowerCase().includes(term) ||
    auditResourceLabels[log.resource].toLowerCase().includes(term) ||
    systemModuleLabels[log.module].toLowerCase().includes(term)
  );
}

export function sortAuditLogs(logs: AuditLog[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): AuditLog[] {
  return [...logs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'timestamp':
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
        break;
      case 'user':
        aValue = a.user.fullName;
        bValue = b.user.fullName;
        break;
      case 'action':
        aValue = a.action;
        bValue = b.action;
        break;
      case 'severity':
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        aValue = severityOrder[a.severity];
        bValue = severityOrder[b.severity];
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'module':
        aValue = a.module;
        bValue = b.module;
        break;
      default:
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// Analytics helpers
export function groupLogsByHour(logs: AuditLog[]): { hour: number; count: number }[] {
  const hourCounts = new Array(24).fill(0);
  
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour]++;
  });

  return hourCounts.map((count, hour) => ({ hour, count }));
}

export function groupLogsByDay(logs: AuditLog[], days: number = 7): { date: string; count: number }[] {
  const dayCounts: Record<string, number> = {};
  
  // Initialize with zeros
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dayCounts[dateStr] = 0;
  }

  // Count logs
  logs.forEach(log => {
    const dateStr = log.timestamp.split('T')[0];
    if (dayCounts.hasOwnProperty(dateStr)) {
      dayCounts[dateStr]++;
    }
  });

  return Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateUserActivityScore(logs: AuditLog[], userId: string): number {
  const userLogs = logs.filter(log => log.userId === userId);
  if (userLogs.length === 0) return 0;

  let score = 0;
  const now = Date.now();

  userLogs.forEach(log => {
    const logTime = new Date(log.timestamp).getTime();
    const hoursAgo = (now - logTime) / (1000 * 60 * 60);
    
    // Recent activity gets higher score
    let timeScore = Math.max(0, 10 - hoursAgo / 24);
    
    // Action importance
    const actionScores = {
      create: 2, update: 2, delete: 5, login: 1, logout: 1,
      config_change: 8, permission_change: 8, backup: 3, restore: 5
    };
    const actionScore = actionScores[log.action as keyof typeof actionScores] || 1;
    
    // Severity impact
    const severityScores = { low: 1, medium: 2, high: 4, critical: 8 };
    const severityScore = severityScores[log.severity];
    
    score += timeScore * actionScore * severityScore;
  });

  return Math.min(score / userLogs.length, 100); // Normalize to 0-100
}

// Compliance helpers
export function checkComplianceViolations(logs: AuditLog[]): {
  violations: string[];
  riskScore: number;
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Check for multiple failed logins
  const failedLogins = logs.filter(log => log.action === 'login_failed');
  if (failedLogins.length > 5) {
    violations.push(`พบความพยายามเข้าสู่ระบบล้มเหลว ${failedLogins.length} ครั้ง`);
    recommendations.push('ปรับปรุงระบบการตรวจสอบสิทธิ์และเพิ่ม 2FA');
    riskScore += 3;
  }

  // Check for unauthorized access patterns
  const highRiskActions = logs.filter(log => 
    ['delete', 'config_change', 'permission_change'].includes(log.action)
  );
  if (highRiskActions.length > 10) {
    violations.push(`พบการกระทำเสี่ยงสูง ${highRiskActions.length} ครั้ง`);
    recommendations.push('ตรวจสอบและจำกัดสิทธิ์การเข้าถึงข้อมูลสำคัญ');
    riskScore += 2;
  }

  // Check for unusual activity patterns
  const nightTimeActions = logs.filter(log => {
    const hour = new Date(log.timestamp).getHours();
    return hour < 6 || hour > 22;
  });
  if (nightTimeActions.length > 5) {
    violations.push(`พบกิจกรรมนอกเวลาทำการ ${nightTimeActions.length} ครั้ง`);
    recommendations.push('ตั้งค่าการแจ้งเตือนสำหรับกิจกรรมนอกเวลา');
    riskScore += 1;
  }

  return { violations, riskScore, recommendations };
}

// IP address helpers
export function isInternalIP(ipAddress: string): boolean {
  const internalRanges = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^127\./,
    /^localhost$/
  ];
  
  return internalRanges.some(range => range.test(ipAddress));
}

export function getIPLocation(ipAddress: string): string {
  if (isInternalIP(ipAddress)) {
    return 'เครือข่ายภายใน';
  }
  return 'เครือข่ายภายนอก'; // In real app, use IP geolocation service
}

// Session helpers
export function detectConcurrentSessions(logs: AuditLog[], userId: string): boolean {
  const userLogins = logs.filter(log => 
    log.userId === userId && log.action === 'login'
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (userLogins.length < 2) return false;

  // Check if there are multiple active sessions
  const sessionIds = new Set(userLogins.slice(0, 5).map(log => log.sessionId));
  return sessionIds.size > 1;
}

export function getSessionDuration(logs: AuditLog[], sessionId: string): number {
  const sessionLogs = logs.filter(log => log.sessionId === sessionId);
  if (sessionLogs.length === 0) return 0;

  const timestamps = sessionLogs.map(log => new Date(log.timestamp).getTime());
  const earliest = Math.min(...timestamps);
  const latest = Math.max(...timestamps);

  return latest - earliest;
}