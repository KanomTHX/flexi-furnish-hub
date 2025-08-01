import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AuditLog, AuditFilter, User } from '@/types/audit';
import { 
  formatDateTime, 
  getRelativeTime,
  auditActionLabels, 
  auditResourceLabels,
  systemModuleLabels,
  auditSeverityLabels,
  auditStatusLabels,
  getSeverityColor,
  getStatusColor,
  getActionColor,
  getModuleColor,
  calculateRiskScore,
  getRiskLevel
} from '@/utils/auditHelpers';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Clock,
  User as UserIcon,
  Shield,
  Activity,
  AlertTriangle,
  Info,
  Server,
  Globe
} from 'lucide-react';

interface AuditLogsListProps {
  logs: AuditLog[];
  users: User[];
  filter: AuditFilter;
  onFilterChange: (filter: AuditFilter) => void;
  onExport: () => void;
}

export function AuditLogsList({
  logs,
  users,
  filter,
  onFilterChange,
  onExport
}: AuditLogsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.resourceName && log.resourceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         log.ipAddress.includes(searchTerm);
    return matchesSearch;
  });

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">บันทึกการตรวจสอบ</h2>
          <p className="text-muted-foreground">
            ติดตามและตรวจสอบกิจกรรมทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ตัวกรองและค้นหา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาบันทึก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.userId || ''}
              onValueChange={(value) => onFilterChange({ ...filter, userId: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ผู้ใช้" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} (@{user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.action || ''}
              onValueChange={(value) => onFilterChange({ ...filter, action: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="การกระทำ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {Object.entries(auditActionLabels).map(([action, label]) => (
                  <SelectItem key={action} value={action}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.module || ''}
              onValueChange={(value) => onFilterChange({ ...filter, module: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="โมดูล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {Object.entries(systemModuleLabels).map(([module, label]) => (
                  <SelectItem key={module} value={module}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.severity || ''}
              onValueChange={(value) => onFilterChange({ ...filter, severity: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {Object.entries(auditSeverityLabels).map(([severity, label]) => (
                  <SelectItem key={severity} value={severity}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                onFilterChange({});
                setSearchTerm('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              type="date"
              placeholder="วันที่เริ่มต้น"
              value={filter.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
            />
            <Input
              type="date"
              placeholder="วันที่สิ้นสุด"
              value={filter.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value || undefined })}
            />
            <Select
              value={filter.status || ''}
              onValueChange={(value) => onFilterChange({ ...filter, status: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {Object.entries(auditStatusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหา</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const riskScore = calculateRiskScore(log);
            const riskLevel = getRiskLevel(riskScore);
            
            return (
              <Card key={log.id} className={`hover:shadow-md transition-shadow ${
                log.severity === 'critical' ? 'border-red-200 bg-red-50' :
                log.severity === 'high' ? 'border-orange-200 bg-orange-50' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {getRelativeTime(log.timestamp)}
                          </span>
                        </div>
                        <Badge className={getSeverityColor(log.severity)}>
                          {auditSeverityLabels[log.severity]}
                        </Badge>
                        <Badge className={getStatusColor(log.status)}>
                          {auditStatusLabels[log.status]}
                        </Badge>
                        {riskLevel === 'high' || riskLevel === 'critical' && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            เสี่ยงสูง
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{log.description}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{log.user.fullName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <Badge className={getActionColor(log.action)} variant="outline">
                            {auditActionLabels[log.action]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <Badge className={getModuleColor(log.module)} variant="outline">
                            {systemModuleLabels[log.module]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{log.ipAddress}</span>
                        </div>
                      </div>

                      {log.resourceName && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>ทรัพยากร:</strong> {auditResourceLabels[log.resource]} - {log.resourceName}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        <strong>เซสชัน:</strong> {log.sessionId} | 
                        <strong> เวลาที่แน่นอน:</strong> {formatDateTime(log.timestamp)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        รายละเอียด
                      </Button>
                      
                      {riskScore > 5 && (
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Risk Score</div>
                          <div className={`text-sm font-bold ${
                            riskLevel === 'critical' ? 'text-red-600' :
                            riskLevel === 'high' ? 'text-orange-600' :
                            riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {riskScore.toFixed(1)}/10
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปบันทึกการตรวจสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">สำเร็จ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.status === 'failed' || l.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">ล้มเหลว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {logs.filter(l => l.severity === 'critical' || l.severity === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">ความสำคัญสูง</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(logs.map(l => l.userId)).size}
              </div>
              <div className="text-sm text-muted-foreground">ผู้ใช้ที่มีกิจกรรม</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      {selectedLog && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดบันทึกการตรวจสอบ</DialogTitle>
            </DialogHeader>
            <LogDetailView log={selectedLog} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Log Detail View Component
function LogDetailView({ log }: { log: AuditLog }) {
  const riskScore = calculateRiskScore(log);
  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">ID</label>
          <div className="text-lg font-mono">{log.id}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">เวลา</label>
          <div className="text-lg">{formatDateTime(log.timestamp)}</div>
        </div>
      </div>

      {/* User & Action Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">ข้อมูลผู้ใช้</h3>
          <div className="space-y-1 text-sm">
            <div><strong>ชื่อ:</strong> {log.user.fullName}</div>
            <div><strong>ชื่อผู้ใช้:</strong> {log.user.username}</div>
            <div><strong>อีเมล:</strong> {log.user.email}</div>
            <div><strong>บทบาท:</strong> {log.user.role}</div>
            {log.user.department && (
              <div><strong>แผนก:</strong> {log.user.department}</div>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">ข้อมูลการกระทำ</h3>
          <div className="space-y-1 text-sm">
            <div><strong>การกระทำ:</strong> 
              <Badge className={getActionColor(log.action)} size="sm" className="ml-2">
                {auditActionLabels[log.action]}
              </Badge>
            </div>
            <div><strong>ทรัพยากร:</strong> {auditResourceLabels[log.resource]}</div>
            <div><strong>โมดูล:</strong> 
              <Badge className={getModuleColor(log.module)} size="sm" className="ml-2">
                {systemModuleLabels[log.module]}
              </Badge>
            </div>
            <div><strong>ความสำคัญ:</strong> 
              <Badge className={getSeverityColor(log.severity)} size="sm" className="ml-2">
                {auditSeverityLabels[log.severity]}
              </Badge>
            </div>
            <div><strong>สถานะ:</strong> 
              <Badge className={getStatusColor(log.status)} size="sm" className="ml-2">
                {auditStatusLabels[log.status]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-medium mb-2">คำอธิบาย</h3>
        <div className="p-3 bg-muted rounded-lg text-sm">
          {log.description}
        </div>
      </div>

      {/* Resource Info */}
      {log.resourceName && (
        <div>
          <h3 className="font-medium mb-2">ข้อมูลทรัพยากร</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>ID:</strong> {log.resourceId}</div>
            <div><strong>ชื่อ:</strong> {log.resourceName}</div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div>
        <h3 className="font-medium mb-2">ข้อมูลทางเทคนิค</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>IP Address:</strong> {log.ipAddress}</div>
          <div><strong>Session ID:</strong> {log.sessionId}</div>
          <div><strong>User Agent:</strong> 
            <div className="text-xs text-muted-foreground mt-1 break-all">
              {log.userAgent}
            </div>
          </div>
          <div><strong>Risk Score:</strong> 
            <span className={`ml-2 font-bold ${
              riskLevel === 'critical' ? 'text-red-600' :
              riskLevel === 'high' ? 'text-orange-600' :
              riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {riskScore.toFixed(1)}/10 ({riskLevel})
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      {log.details && Object.keys(log.details).length > 0 && (
        <div>
          <h3 className="font-medium mb-2">รายละเอียดเพิ่มเติม</h3>
          <div className="space-y-3">
            {log.details.oldValues && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">ค่าเดิม:</h4>
                <pre className="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.details.oldValues, null, 2)}
                </pre>
              </div>
            )}
            {log.details.newValues && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">ค่าใหม่:</h4>
                <pre className="text-xs bg-green-50 border border-green-200 rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.details.newValues, null, 2)}
                </pre>
              </div>
            )}
            {log.details.changedFields && log.details.changedFields.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">ฟิลด์ที่เปลี่ยนแปลง:</h4>
                <div className="flex flex-wrap gap-1">
                  {log.details.changedFields.map((field, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {log.details.errorMessage && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">ข้อความข้อผิดพลาด:</h4>
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {log.details.errorMessage}
                </div>
              </div>
            )}
            {log.details.additionalInfo && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">ข้อมูลเพิ่มเติม:</h4>
                <pre className="text-xs bg-blue-50 border border-blue-200 rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.details.additionalInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Metadata</h3>
          <pre className="text-xs bg-gray-50 border rounded p-2 overflow-x-auto">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}