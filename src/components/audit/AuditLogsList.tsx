import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuditLog, AuditFilter, User, AuditAction, AuditResource, SystemModule, AuditSeverity, AuditStatus } from '@/types/audit';
import { 
  formatDateTime, 
  auditActionLabels, 
  auditResourceLabels, 
  systemModuleLabels,
  getSeverityColor,
  getStatusColor
} from '@/utils/auditHelpers';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User as UserIcon,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Shield
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
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: AuditStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <UserIcon className="w-4 h-4 text-blue-600" />;
      case 'create':
      case 'update':
      case 'delete':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'export':
      case 'import':
        return <Download className="w-4 h-4 text-green-600" />;
      case 'system_start':
      case 'system_stop':
        return <Server className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter.userId && log.userId !== filter.userId) return false;
    if (filter.action && log.action !== filter.action) return false;
    if (filter.resource && log.resource !== filter.resource) return false;
    if (filter.module && log.module !== filter.module) return false;
    if (filter.severity && log.severity !== filter.severity) return false;
    if (filter.status && log.status !== filter.status) return false;
    if (filter.ipAddress && !log.ipAddress.includes(filter.ipAddress)) return false;
    if (filter.dateFrom && log.timestamp < filter.dateFrom) return false;
    if (filter.dateTo && log.timestamp > filter.dateTo) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return log.description.toLowerCase().includes(searchLower) ||
             log.user.fullName.toLowerCase().includes(searchLower) ||
             log.resourceName?.toLowerCase().includes(searchLower) ||
             log.ipAddress.includes(searchLower);
    }
    return true;
  });

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">บันทึกการตรวจสอบ</h2>
          <p className="text-sm text-muted-foreground">
            ติดตามกิจกรรมทั้งหมดในระบบ ({filteredLogs.length} รายการ)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาบันทึก..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={filter.userId || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, userId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ผู้ใช้" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filter.action || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, action: value === 'all' ? undefined : value as AuditAction })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="การกระทำ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                <SelectItem value="logout">ออกจากระบบ</SelectItem>
                <SelectItem value="create">สร้าง</SelectItem>
                <SelectItem value="update">แก้ไข</SelectItem>
                <SelectItem value="delete">ลบ</SelectItem>
                <SelectItem value="export">ส่งออก</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filter.module || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, module: value === 'all' ? undefined : value as SystemModule })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="โมดูล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="inventory">สต็อก</SelectItem>
                <SelectItem value="accounting">บัญชี</SelectItem>
                <SelectItem value="claims">เคลม</SelectItem>
                <SelectItem value="system">ระบบ</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filter.severity || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, severity: value === 'all' ? undefined : value as AuditSeverity })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="critical">วิกฤต</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="วันที่เริ่มต้น"
              value={filter.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
            />

            <Button 
              variant="outline" 
              onClick={() => onFilterChange({})}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>การกระทำ</TableHead>
                <TableHead>ทรัพยากร</TableHead>
                <TableHead>โมดูล</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <div className="text-sm">
                        <div>{formatDateTime(log.timestamp).split(' ')[0]}</div>
                        <div className="text-muted-foreground">
                          {formatDateTime(log.timestamp).split(' ')[1]}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3 h-3 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{log.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          @{log.user.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span className="text-sm">{auditActionLabels[log.action]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{auditResourceLabels[log.resource]}</div>
                      {log.resourceName && (
                        <div className="text-xs text-muted-foreground">
                          {log.resourceName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {systemModuleLabels[log.module]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge className={getStatusColor(log.status)}>
                        {log.status === 'success' ? 'สำเร็จ' :
                         log.status === 'failed' ? 'ล้มเหลว' :
                         log.status === 'warning' ? 'เตือน' : 'ข้อผิดพลาด'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(log.severity)}
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity === 'critical' ? 'วิกฤต' :
                         log.severity === 'high' ? 'สูง' :
                         log.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.ipAddress}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDialog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบบันทึกที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดบันทึกการตรวจสอบ</DialogTitle>
            <DialogDescription>
              ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">เวลา</label>
                  <div className="text-lg">{formatDateTime(selectedLog.timestamp)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">ผู้ใช้</label>
                  <div className="text-lg">{selectedLog.user.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    @{selectedLog.user.username} ({selectedLog.user.role})
                  </div>
                </div>
              </div>

              {/* Action and Resource */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">การกระทำ</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActionIcon(selectedLog.action)}
                    <span>{auditActionLabels[selectedLog.action]}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">ทรัพยากร</label>
                  <div className="mt-1">
                    <div>{auditResourceLabels[selectedLog.resource]}</div>
                    {selectedLog.resourceName && (
                      <div className="text-sm text-muted-foreground">
                        {selectedLog.resourceName}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">โมดูล</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {systemModuleLabels[selectedLog.module]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status and Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">สถานะ</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedLog.status)}
                    <Badge className={getStatusColor(selectedLog.status)}>
                      {selectedLog.status === 'success' ? 'สำเร็จ' :
                       selectedLog.status === 'failed' ? 'ล้มเหลว' :
                       selectedLog.status === 'warning' ? 'เตือน' : 'ข้อผิดพลาด'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">ความสำคัญ</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getSeverityIcon(selectedLog.severity)}
                    <Badge className={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity === 'critical' ? 'วิกฤต' :
                       selectedLog.severity === 'high' ? 'สูง' :
                       selectedLog.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">คำอธิบาย</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedLog.description}
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Session ID</label>
                  <div className="font-mono text-sm">{selectedLog.sessionId}</div>
                </div>
              </div>

              {/* User Agent */}
              <div>
                <label className="text-sm font-medium">User Agent</label>
                <div className="text-sm text-muted-foreground break-all">
                  {selectedLog.userAgent}
                </div>
              </div>

              {/* Details */}
              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium">รายละเอียดเพิ่มเติม</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {/* Old Values */}
                    {selectedLog.details.oldValues && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-red-600 mb-1">ค่าเดิม:</div>
                        <pre className="text-xs bg-red-50 p-2 rounded border">
                          {JSON.stringify(selectedLog.details.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {/* New Values */}
                    {selectedLog.details.newValues && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-green-600 mb-1">ค่าใหม่:</div>
                        <pre className="text-xs bg-green-50 p-2 rounded border">
                          {JSON.stringify(selectedLog.details.newValues, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Changed Fields */}
                    {selectedLog.details.changedFields && selectedLog.details.changedFields.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-1">ฟิลด์ที่เปลี่ยนแปลง:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedLog.details.changedFields.map((field, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {selectedLog.details.errorMessage && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-red-600 mb-1">ข้อผิดพลาด:</div>
                        <div className="text-sm bg-red-50 p-2 rounded border text-red-800">
                          {selectedLog.details.errorMessage}
                        </div>
                      </div>
                    )}

                    {/* Affected Records */}
                    {selectedLog.details.affectedRecords && (
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-1">จำนวนระเบียนที่ได้รับผลกระทบ:</div>
                        <div className="text-sm font-semibold text-blue-600">
                          {selectedLog.details.affectedRecords} ระเบียน
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {selectedLog.details.additionalInfo && (
                      <div>
                        <div className="text-sm font-medium mb-1">ข้อมูลเพิ่มเติม:</div>
                        <pre className="text-xs bg-gray-50 p-2 rounded border">
                          {JSON.stringify(selectedLog.details.additionalInfo, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}