import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, User, Clock } from 'lucide-react';
import { auditTrailService, AuditLogEntry, AuditFilter } from '@/services/auditTrailService';
import { format } from 'date-fns';

interface AuditTrailProps {
  recordId?: string;
  tableName?: string;
  userId?: string;
  branchId?: string;
  showFilters?: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  recordId,
  tableName,
  userId,
  branchId,
  showFilters = true
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AuditFilter>({
    record_id: recordId,
    table_name: tableName,
    user_id: userId,
    branch_id: branchId,
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [filter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const logs = await auditTrailService.getAuditLogs(filter);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilter({
      record_id: recordId,
      table_name: tableName,
      user_id: userId,
      branch_id: branchId,
      limit: 50
    });
  };

  const exportAuditLogs = async () => {
    try {
      const allLogs = await auditTrailService.getAuditLogs({
        ...filter,
        limit: 10000 // Get more records for export
      });
      
      const csvContent = convertToCSV(allLogs);
      console.log('Audit logs data prepared for export:', csvContent);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const convertToCSV = (logs: AuditLogEntry[]): string => {
    const headers = [
      'Timestamp',
      'Operation Type',
      'Table Name',
      'Record ID',
      'User',
      'Description',
      'IP Address'
    ];

    const rows = logs.map(log => [
      log.timestamp,
      log.operation_type,
      log.table_name,
      log.record_id,
      log.user_name || 'System',
      log.description || '',
      log.ip_address || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    console.log('Audit trail data prepared for export:', { content, filename });
  };

  const getOperationTypeColor = (operationType: string) => {
    switch (operationType) {
      case 'STOCK_RECEIVE':
        return 'bg-green-100 text-green-800';
      case 'STOCK_WITHDRAW':
        return 'bg-red-100 text-red-800';
      case 'STOCK_TRANSFER':
        return 'bg-blue-100 text-blue-800';
      case 'STOCK_ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'SN_STATUS_CHANGE':
        return 'bg-purple-100 text-purple-800';
      case 'BATCH_OPERATION':
        return 'bg-orange-100 text-orange-800';
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return 'bg-gray-100 text-gray-800';
      case 'SYSTEM_ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>ตัวกรองประวัติการใช้งาน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">ประเภทการดำเนินการ</label>
                <Select
                  value={filter.operation_type || 'ALL'}
                  onValueChange={(value) => handleFilterChange('operation_type', value === 'ALL' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="การดำเนินการทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">การดำเนินการทั้งหมด</SelectItem>
                    <SelectItem value="STOCK_RECEIVE">รับสินค้าเข้าคลัง</SelectItem>
                    <SelectItem value="STOCK_WITHDRAW">เบิกสินค้าออก</SelectItem>
                    <SelectItem value="STOCK_TRANSFER">โอนย้ายสินค้า</SelectItem>
                    <SelectItem value="STOCK_ADJUSTMENT">ปรับปรุงสต็อก</SelectItem>
                    <SelectItem value="SN_STATUS_CHANGE">เปลี่ยนสถานะ</SelectItem>
                    <SelectItem value="BATCH_OPERATION">Batch Operation</SelectItem>
                    <SelectItem value="USER_LOGIN">User Login</SelectItem>
                    <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">ชื่อตาราง</label>
                <Input
                  value={filter.table_name || ''}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  placeholder="ชื่อตาราง"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">รหัสเรคคอร์ด</label>
                <Input
                  value={filter.record_id || ''}
                  onChange={(e) => handleFilterChange('record_id', e.target.value)}
                  placeholder="รหัสเรคคอร์ด"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">วันที่เริ่มต้น</label>
                <Input
                  type="date"
                  value={filter.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">วันที่สิ้นสุด</label>
                <Input
                  type="date"
                  value={filter.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={clearFilters}>
                  ล้างตัวกรอง
                </Button>
                <Button onClick={loadAuditLogs} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
                </Button>
              </div>
              <Button variant="outline" onClick={exportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>ประวัติการใช้งาน ({auditLogs.length} รายการ)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">กำลังโหลดประวัติการใช้งาน...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบประวัติการใช้งานที่ตรงกับตัวกรองปัจจุบัน
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                  <TableHead>ตาราง</TableHead>
                  <TableHead>รหัสเรคคอร์ด</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getOperationTypeColor(log.operation_type)}>
                        {log.operation_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.table_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {log.record_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{log.user_name || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audit Log Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <div className="font-mono text-sm">
                    {formatTimestamp(selectedLog.timestamp)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Operation Type</label>
                  <div>
                    <Badge className={getOperationTypeColor(selectedLog.operation_type)}>
                      {selectedLog.operation_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Table Name</label>
                  <div className="font-mono text-sm">{selectedLog.table_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Record ID</label>
                  <div className="font-mono text-sm">{selectedLog.record_id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <div>{selectedLog.user_name || 'System'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <div className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</div>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className="text-sm">{selectedLog.description}</div>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <label className="text-sm font-medium">Old Values</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <label className="text-sm font-medium">New Values</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;