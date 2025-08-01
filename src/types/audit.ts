// Audit Logs Types
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  user: User;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  resourceName?: string;
  module: SystemModule;
  description: string;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: AuditSeverity;
  status: AuditStatus;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'login_failed'
  | 'export' | 'import' | 'backup' | 'restore'
  | 'approve' | 'reject' | 'assign' | 'complete'
  | 'payment' | 'refund' | 'void'
  | 'config_change' | 'permission_change'
  | 'system_start' | 'system_stop' | 'system_error';

export type AuditResource = 
  | 'user' | 'product' | 'customer' | 'order' | 'payment'
  | 'inventory' | 'warehouse' | 'transfer' | 'claim'
  | 'account' | 'journal_entry' | 'report'
  | 'system' | 'config' | 'permission' | 'role'
  | 'file' | 'backup' | 'session';

export type SystemModule = 
  | 'pos' | 'inventory' | 'warehouse' | 'accounting'
  | 'claims' | 'installments' | 'reports' | 'settings'
  | 'users' | 'system' | 'auth';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditStatus = 'success' | 'failed' | 'warning' | 'error';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse' | 'accountant' | 'viewer';

export interface AuditDetails {
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  affectedRecords?: number;
  errorMessage?: string;
  additionalInfo?: Record<string, any>;
}

export interface AuditStatistics {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  criticalEvents: number;
  failedActions: number;
  uniqueUsers: number;
  topActions: ActionCount[];
  topModules: ModuleCount[];
  topUsers: UserActivityCount[];
  hourlyActivity: HourlyActivity[];
  dailyTrends: DailyTrend[];
}

export interface ActionCount {
  action: AuditAction;
  count: number;
  percentage: number;
}

export interface ModuleCount {
  module: SystemModule;
  count: number;
  percentage: number;
}

export interface UserActivityCount {
  userId: string;
  username: string;
  fullName: string;
  count: number;
  lastActivity: string;
}

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  totalLogs: number;
  successCount: number;
  failedCount: number;
  criticalCount: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: AuditSeverity;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  details: SecurityEventDetails;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export type SecurityEventType = 
  | 'multiple_failed_logins'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'privilege_escalation'
  | 'data_breach_attempt'
  | 'unusual_data_access'
  | 'system_intrusion'
  | 'malware_detected';

export interface SecurityEventDetails {
  attemptCount?: number;
  timeWindow?: string;
  affectedResources?: string[];
  riskScore?: number;
  mitigationActions?: string[];
  additionalContext?: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  reportType: ComplianceReportType;
  period: ReportPeriod;
  generatedAt: string;
  generatedBy: string;
  status: ReportStatus;
  summary: ComplianceSummary;
  findings: ComplianceFinding[];
  recommendations: string[];
  filePath?: string;
}

export type ComplianceReportType = 
  | 'access_control'
  | 'data_integrity'
  | 'change_management'
  | 'user_activity'
  | 'security_events'
  | 'system_performance';

export interface ReportPeriod {
  startDate: string;
  endDate: string;
  description: string;
}

export type ReportStatus = 'generating' | 'completed' | 'failed' | 'archived';

export interface ComplianceSummary {
  totalEvents: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyMetrics: Record<string, number>;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  severity: AuditSeverity;
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

// Filter interfaces
export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  module?: SystemModule;
  severity?: AuditSeverity;
  status?: AuditStatus;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  search?: string;
}

export interface SecurityEventFilter {
  type?: SecurityEventType;
  severity?: AuditSeverity;
  resolved?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Configuration interfaces
export interface AuditConfiguration {
  enabled: boolean;
  retentionPeriod: number; // days
  logLevel: AuditSeverity;
  enabledModules: SystemModule[];
  enabledActions: AuditAction[];
  realTimeAlerts: boolean;
  alertThresholds: AlertThresholds;
  archiveSettings: ArchiveSettings;
  complianceSettings: ComplianceSettings;
}

export interface AlertThresholds {
  failedLoginAttempts: number;
  criticalEventsPerHour: number;
  unusualActivityScore: number;
  dataAccessVolume: number;
}

export interface ArchiveSettings {
  enabled: boolean;
  archiveAfterDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface ComplianceSettings {
  enabledReports: ComplianceReportType[];
  automaticGeneration: boolean;
  reportSchedule: string; // cron expression
  retentionPeriod: number; // days
}

// API Response interfaces
export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuditStatisticsResponse {
  statistics: AuditStatistics;
  success: boolean;
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
  total: number;
  unresolved: number;
}

// Real-time interfaces
export interface AuditLogEvent {
  type: 'new_log' | 'security_alert' | 'system_event';
  data: AuditLog | SecurityEvent;
  timestamp: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  metrics: SystemMetrics;
  alerts: SystemAlert[];
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'error' | 'warning';
  message: string;
  timestamp: string;
  resolved: boolean;
}