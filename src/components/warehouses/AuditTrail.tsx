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
      downloadCSV(csvContent, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
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
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <span>Audit Trail Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Operation Type</label>
                <Select
                  value={filter.operation_type || 'ALL'}
                  onValueChange={(value) => handleFilterChange('operation_type', value === 'ALL' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All operations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Operations</SelectItem>
                    <SelectItem value="STOCK_RECEIVE">Stock Receive</SelectItem>
                    <SelectItem value="STOCK_WITHDRAW">Stock Withdraw</SelectItem>
                    <SelectItem value="STOCK_TRANSFER">Stock Transfer</SelectItem>
                    <SelectItem value="STOCK_ADJUSTMENT">Stock Adjustment</SelectItem>
                    <SelectItem value="SN_STATUS_CHANGE">Status Change</SelectItem>
                    <SelectItem value="BATCH_OPERATION">Batch Operation</SelectItem>
                    <SelectItem value="USER_LOGIN">User Login</SelectItem>
                    <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Table Name</label>
                <Input
                  value={filter.table_name || ''}
                  onChange={(e) => handleFilterChange('table_name', e.target.value)}
                  placeholder="Table name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Record ID</label>
                <Input
                  value={filter.record_id || ''}
                  onChange={(e) => handleFilterChange('record_id', e.target.value)}
                  placeholder="Record ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Date From</label>
                <Input
                  type="date"
                  value={filter.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Date To</label>
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
                  Clear Filters
                </Button>
                <Button onClick={loadAuditLogs} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              <Button variant="outline" onClick={exportAuditLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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
              <span>Audit Trail ({auditLogs.length} records)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found matching the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
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
                        <Eye className="h-4 w-4" />
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