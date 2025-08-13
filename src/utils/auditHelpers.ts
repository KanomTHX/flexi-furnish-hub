// Audit helpers placeholder
export const formatAuditLog = (log: any) => log;
export const exportAuditLogs = (logs: any[]) => Promise.resolve();
export const exportAuditLogsToCSV = (logs: any[]) => 'audit,logs';
export const exportSecurityEventsToCSV = (events: any[]) => 'security,events';
export const exportUsersToCSV = (users: any[]) => 'user,data';
export const formatDateTime = (date: string | Date) => new Date(date).toLocaleString('th-TH');

export const auditActionLabels = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ'
};

export const auditResourceLabels = {
  user: 'ผู้ใช้',
  product: 'สินค้า',
  order: 'คำสั่งซื้อ',
  inventory: 'คลังสินค้า'
};

export const systemModuleLabels = {
  pos: 'ระบบขายหน้าร้าน',
  inventory: 'ระบบคลังสินค้า',
  accounting: 'ระบบบัญชี',
  reports: 'ระบบรายงาน'
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600';
    case 'error': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

export default { 
  formatAuditLog, 
  exportAuditLogs, 
  formatDateTime,
  auditActionLabels,
  auditResourceLabels,
  systemModuleLabels,
  getSeverityColor,
  getStatusColor
};