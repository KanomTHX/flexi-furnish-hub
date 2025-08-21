import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAudit } from '@/hooks/useAudit';
import { exportToExcel, exportToPDF } from '@/utils/reportHelpers';
import {
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Activity,
  Download,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface AuditReportProps {
  className?: string;
}

export function AuditReport({ className }: AuditReportProps) {
  const { toast } = useToast();
  const { auditLogs, statistics } = useAudit();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');



  const handleExportCSV = () => {
    try {
      const exportData = auditLogs.map(log => ({
        'วันที่': format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: th }),
        'ผู้ใช้': log.user?.fullName || 'ระบบ',
        'การกระทำ': log.action,
        'โมดูล': log.module,
        'รายละเอียด': log.description,
        'ความรุนแรง': log.severity,
        'สถานะ': log.status,
        'IP Address': log.ipAddress || '-'
      }));
      
      exportToExcel(exportData, `audit-report-${format(new Date(), 'yyyy-MM-dd')}`);
      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'รายงาน Audit ถูกส่งออกเป็นไฟล์ Excel แล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกรายงานได้',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesSearch = searchTerm === '' || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      const logDate = new Date(log.timestamp);
      matchesDate = logDate >= dateRange.from && logDate <= dateRange.to;
    }
    
    return matchesModule && matchesAction && matchesSeverity && matchesSearch && matchesDate;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };



  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            รายงาน Audit Trail
          </h2>
          <p className="text-muted-foreground">
            ติดตามและตรวจสอบการดำเนินการทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>ช่วงวันที่</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="เลือกช่วงวันที่"
              />
            </div>
            
            <div className="space-y-2">
              <Label>โมดูล</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโมดูล" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="inventory">สต็อก</SelectItem>
                  <SelectItem value="warehouse">สาขา</SelectItem>
                  <SelectItem value="accounting">บัญชี</SelectItem>
                  <SelectItem value="claims">เคลม</SelectItem>
                  <SelectItem value="users">ผู้ใช้</SelectItem>
                  <SelectItem value="system">ระบบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>การกระทำ</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกการกระทำ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="create">สร้าง</SelectItem>
                  <SelectItem value="read">อ่าน</SelectItem>
                  <SelectItem value="update">แก้ไข</SelectItem>
                  <SelectItem value="delete">ลบ</SelectItem>
                  <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                  <SelectItem value="logout">ออกจากระบบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>ความรุนแรง</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกความรุนแรง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">กลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="critical">วิกฤต</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Label>ค้นหา</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาจากรายละเอียดหรือชื่อผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="logs">บันทึก Audit</TabsTrigger>
          <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">บันทึกทั้งหมด</p>
                    <p className="text-2xl font-bold">{statistics.totalLogs.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เหตุการณ์วิกฤต</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.criticalEvents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ที่ใช้งาน</p>
                    <p className="text-2xl font-bold">{statistics.uniqueUsers}</p>
                  </div>
                  <User className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">การกระทำวันนี้</p>
                    <p className="text-2xl font-bold">{statistics.todayLogs}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                เหตุการณ์วิกฤตล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredLogs
                  .filter(log => log.severity === 'critical' || log.severity === 'high')
                  .slice(0, 5)
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(log.severity)}
                        <div>
                          <p className="font-medium">{log.description}</p>
                          <p className="text-sm text-muted-foreground">
                      {log.user?.fullName || 'ระบบ'} • {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: th })}
                    </p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  บันทึก Audit ({filteredLogs.length.toLocaleString()} รายการ)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่/เวลา</TableHead>
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>การกระทำ</TableHead>
                    <TableHead>โมดูล</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ความรุนแรง</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: th })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {log.user?.fullName || 'ระบบ'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.module}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>
                          {getSeverityIcon(log.severity)}
                          <span className="ml-1">{log.severity}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredLogs.length > 50 && (
                <div className="text-center mt-4 text-muted-foreground">
                  แสดง 50 รายการแรกจากทั้งหมด {filteredLogs.length.toLocaleString()} รายการ
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Module Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                การใช้งานตามโมดูล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.topModules.map((moduleData) => (
                  <div key={moduleData.module} className="flex items-center justify-between">
                    <span className="capitalize">{moduleData.module}</span>
                    <div className="flex items-center gap-2 w-1/2">
                      <Progress value={moduleData.percentage} className="flex-1" />
                      <span className="text-sm font-medium w-16 text-right">{moduleData.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                การกระทำที่พบบ่อย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.topActions.map((actionData) => (
                  <div key={actionData.action} className="flex items-center justify-between">
                    <span className="capitalize">{actionData.action}</span>
                    <div className="flex items-center gap-2 w-1/2">
                      <Progress value={actionData.percentage} className="flex-1" />
                      <span className="text-sm font-medium w-16 text-right">{actionData.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}