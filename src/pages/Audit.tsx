import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAudit } from '@/hooks/useAudit';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';
import { AuditOverview } from '@/components/audit/AuditOverview';
import { AuditLogsList } from '@/components/audit/AuditLogsList';
import { ComplianceOverview } from '@/components/audit/ComplianceOverview';
import { SecurityIncidentsDialog } from '@/components/audit/SecurityIncidentsDialog';
import { AuditFilterDialog } from '@/components/audit/AuditFilterDialog';
import { GenerateAuditReportDialog } from '@/components/audit/GenerateAuditReportDialog';
import { ComplianceReportDialog } from '@/components/audit/ComplianceReportDialog';
import { exportAuditLogsToCSV, exportSecurityEventsToCSV, exportUsersToCSV } from '@/utils/auditHelpers';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  Users,
  Settings,
  Download,
  Activity,
  Clock,
  Eye,
  Server,
  BarChart3,
  Building2,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Calendar,
  Globe,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Audit() {
  const {
    auditLogs,
    users,
    securityEvents,
    statistics,
    auditFilter,
    securityEventFilter,
    setAuditFilter,
    setSecurityEventFilter,
    clearAuditFilter,
    clearSecurityEventFilter,
    getCriticalEvents,
    getRecentActivity,
    getFailedActions,
    getUnresolvedSecurityEvents,
    resolveSecurityEvent,
    generateComplianceReport
  } = useAudit();

  const { currentBranch, currentBranchEmployees } = useBranchData();
  const { toast } = useToast();

  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showComplianceReportDialog, setShowComplianceReportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExportAuditLogs = () => {
    try {
      const csv = exportAuditLogsToCSV(auditLogs);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ไฟล์บันทึกการตรวจสอบถูกดาวน์โหลดแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleExportSecurityEvents = () => {
    try {
      const csvData = securityEvents.map(event => ({
        'วันที่-เวลา': new Date(event.timestamp).toLocaleString('th-TH'),
        'ประเภท': event.type || 'ไม่ระบุ',
        'รายละเอียด': event.description,
        'ความรุนแรง': event.severity === 'critical' ? 'วิกฤต' :
                     event.severity === 'high' ? 'สูง' :
                     event.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ',
        'สถานะ': event.resolved ? 'แก้ไขแล้ว' : 'รอดำเนินการ',
        'ผู้ใช้': event.userId || '-',
        'ที่อยู่ IP': event.ipAddress || '-',
        'User Agent': event.userAgent || '-'
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `security_events_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "ส่งออกสำเร็จ",
        description: "รายงานเหตุการณ์ความปลอดภัยถูกส่งออกเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกรายงานได้",
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = () => {
    try {
      const csv = exportUsersToCSV(users);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ไฟล์ข้อมูลผู้ใช้ถูกดาวน์โหลดแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleResolveSecurityEvent = (eventId: string) => {
    resolveSecurityEvent(eventId, 'current-user', 'แก้ไขโดยผู้ดูแลระบบ');
    toast({
      title: "แก้ไขเหตุการณ์สำเร็จ",
      description: "เหตุการณ์ความปลอดภัยได้รับการแก้ไขแล้ว",
    });
  };

  const handleGenerateComplianceReport = () => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    generateComplianceReport(
      'access_control',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    toast({
      title: "กำลังสร้างรายงาน",
      description: "รายงานการปฏิบัติตามกำลังถูกสร้าง กรุณารอสักครู่",
    });
  };

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto refresh every 30 seconds
      if (!isRefreshing) {
        handleRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isRefreshing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "ข้อมูลอัปเดตแล้ว",
        description: "ข้อมูลการตรวจสอบได้รับการอัปเดตล่าสุด",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const criticalEvents = getCriticalEvents();
  const recentActivity = getRecentActivity(24);
  const failedActions = getFailedActions();
  const unresolvedSecurityEvents = getUnresolvedSecurityEvents();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">การตรวจสอบระบบ</h1>
                <p className="text-sm text-gray-600">ติดตามและวิเคราะห์กิจกรรมระบบแบบเรียลไทม์</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                สด
              </Badge>
              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                อัปเดตอัตโนมัติ
              </Badge>
              {currentBranch && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
                  <span className="text-xs text-blue-600">({currentBranchEmployees.length} ผู้ใช้)</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'กำลังอัปเดต...' : 'รีเฟรช'}
            </Button>
            
            <Button 
              variant="outline" 
              className={`relative bg-white hover:bg-gray-50 ${unresolvedSecurityEvents.length > 0 ? 'border-red-200 text-red-700 hover:bg-red-50' : ''}`}
              onClick={() => setShowSecurityDialog(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              เหตุการณ์ความปลอดภัย
              {unresolvedSecurityEvents.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unresolvedSecurityEvents.length}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Search and Quick Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาบันทึกการตรวจสอบ..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (value.trim()) {
                    setAuditFilter(prev => ({ ...prev, search: value.trim() }));
                    setSecurityEventFilter(prev => ({ ...prev, search: value.trim() }));
                  } else {
                    setAuditFilter(prev => {
                      const { search, ...rest } = prev;
                      return rest;
                    });
                    setSecurityEventFilter(prev => {
                      const { search, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className="pl-10 bg-white"
              />
            </div>
          </div>
          
          <Select value={quickFilter} onValueChange={(value) => {
            setQuickFilter(value);
            
            if (value === 'all') {
              setAuditFilter({});
              setSecurityEventFilter({});
            } else if (value === 'failed') {
              setAuditFilter(prev => ({ ...prev, status: 'failed' }));
              setSecurityEventFilter({});
            } else if (value === 'critical') {
              setAuditFilter({});
              setSecurityEventFilter(prev => ({ ...prev, severity: 'critical' }));
            } else if (value === 'security') {
              setAuditFilter({});
              setSecurityEventFilter(prev => ({ ...prev, type: 'security' }));
            } else if (value === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              setAuditFilter(prev => ({ ...prev, dateRange: { start: today, end: tomorrow } }));
              setSecurityEventFilter(prev => ({ ...prev, dateRange: { start: today, end: tomorrow } }));
            } else if (value === 'week') {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              setAuditFilter(prev => ({ ...prev, dateRange: { start: weekAgo, end: new Date() } }));
              setSecurityEventFilter(prev => ({ ...prev, dateRange: { start: weekAgo, end: new Date() } }));
            }
          }}>
            <SelectTrigger className="w-48 bg-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="กรองด่วน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="critical">เหตุการณ์วิกฤต</SelectItem>
              <SelectItem value="failed">การกระทำล้มเหลว</SelectItem>
              <SelectItem value="security">ความปลอดภัย</SelectItem>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setShowFilterDialog(true)}
            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900"
          >
            <Settings className="w-4 h-4 mr-2" />
            ตัวกรองขั้นสูง
          </Button>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setShowReportDialog(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            สร้างรายงาน
          </Button>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Critical Events Alert */}
      {criticalEvents.criticalLogs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">เหตุการณ์วิกฤต ({criticalEvents.criticalLogs.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {criticalEvents.criticalLogs.slice(0, 3).map((log) => (
              <div 
                key={log.id}
                className="text-sm text-red-600"
              >
                • {log.user.fullName}: {log.description}
              </div>
            ))}
            {criticalEvents.criticalLogs.length > 3 && (
              <div className="text-sm text-red-600">
                และอีก {criticalEvents.criticalLogs.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Events Alert */}
      {unresolvedSecurityEvents.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">เหตุการณ์ความปลอดภัยที่ยังไม่แก้ไข ({unresolvedSecurityEvents.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {unresolvedSecurityEvents.slice(0, 3).map((event) => (
              <div 
                key={event.id}
                className="text-sm text-orange-600 flex justify-between items-center"
              >
                <span>• {event.description}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleResolveSecurityEvent(event.id)}
                >
                  แก้ไข
                </Button>
              </div>
            ))}
            {unresolvedSecurityEvents.length > 3 && (
              <div className="text-sm text-orange-600">
                และอีก {unresolvedSecurityEvents.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">บันทึกทั้งหมด</p>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-blue-600">{statistics.totalLogs.toLocaleString()}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-green-600 font-medium">
                    +{recentActivity.length} ใน 24 ชม.
                  </p>
                  <div className="h-1 w-16 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">กิจกรรม 24 ชม.</p>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    <Activity className="h-3 w-3 mr-1" />
                    สด
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-green-600">{recentActivity.length}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-green-600 font-medium">
                    อัปเดตล่าสุด
                  </p>
                  <div className="h-1 w-16 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <Activity className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">เหตุการณ์วิกฤต</p>
                  {statistics.criticalEvents > 0 && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      <Zap className="h-3 w-3 mr-1" />
                      ด่วน
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold text-red-600">{statistics.criticalEvents}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-red-600 font-medium">
                    {statistics.criticalEvents > 0 ? 'ต้องดำเนินการ' : 'ปกติ'}
                  </p>
                  <div className="h-1 w-16 bg-red-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-red-500 rounded-full ${statistics.criticalEvents > 5 ? 'w-full' : statistics.criticalEvents > 2 ? 'w-2/3' : 'w-1/3'}`}></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-sm font-medium text-muted-foreground">ผู้ใช้ที่ใช้งาน</p>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    <Globe className="h-3 w-3 mr-1" />
                    ออนไลน์
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-purple-600">{statistics.uniqueUsers}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-purple-600 font-medium">
                    จาก {currentBranchEmployees.length} คน
                  </p>
                  <div className="h-1 w-16 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-1">
          <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border border-transparent rounded-md transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              <span>ภาพรวม</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="flex items-center space-x-2 
                data-[state=active]:bg-green-50 
                data-[state=active]:text-green-700 
                data-[state=active]:border-green-200 
                border border-transparent 
                rounded-md 
                transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              <span>บันทึกการตรวจสอบ ({auditLogs.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center space-x-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200 border border-transparent rounded-md transition-all duration-200"
            >
              <Shield className="h-4 w-4" />
              <span>ความปลอดภัย ({securityEvents.length})</span>
              {unresolvedSecurityEvents.length > 0 && (
                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                  {unresolvedSecurityEvents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border border-transparent rounded-md transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span>ผู้ใช้งาน ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="compliance" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 border border-transparent rounded-md transition-all duration-200"
            >
              <Eye className="h-4 w-4" />
              <span>การปฏิบัติตาม</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border">
            <AuditOverview statistics={statistics} />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6 mt-6">
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">บันทึกการตรวจสอบ</h3>
                  <p className="text-sm text-gray-600">รายการบันทึกกิจกรรมทั้งหมดในระบบ</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleExportAuditLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออก CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowFilterDialog(true)}>
                    <Filter className="h-4 w-4 mr-2" />
                    กรองข้อมูล
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AuditLogsList
                logs={auditLogs}
                users={users}
                filter={auditFilter}
                onFilterChange={setAuditFilter}
                onExport={handleExportAuditLogs}
                searchQuery={searchQuery}
                quickFilter={quickFilter}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Security Overview Cards */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-red-200">
                <CardHeader className="bg-red-50 border-b border-red-200">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      <span>เหตุการณ์ความปลอดภัย</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {unresolvedSecurityEvents.length} รอดำเนินการ
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {securityEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ไม่พบเหตุการณ์ความปลอดภัย</p>
                      </div>
                    ) : (
                      securityEvents.slice(0, 6).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              event.severity === 'critical' ? 'bg-red-100 text-red-600' :
                              event.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                              event.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{event.type || event.description}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(event.timestamp).toLocaleString('th-TH')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={event.resolved ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {event.resolved ? 'แก้ไขแล้ว' : 'รอดำเนินการ'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                event.severity === 'critical' ? 'border-red-200 text-red-700' :
                                event.severity === 'high' ? 'border-orange-200 text-orange-700' :
                                event.severity === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                'border-blue-200 text-blue-700'
                              }`}
                            >
                              {event.severity === 'critical' ? 'วิกฤต' :
                               event.severity === 'high' ? 'สูง' :
                               event.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {securityEvents.length > 6 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => setShowSecurityDialog(true)}>
                        ดูทั้งหมด ({securityEvents.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>กิจกรรมล่าสุด</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {recentActivity.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 text-sm p-2 rounded hover:bg-gray-50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 truncate">{log.user?.fullName || log.user_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                            </span>
                          </div>
                          <p className="text-gray-600 truncate">{log.action}</p>
                          {log.resource && (
                            <p className="text-xs text-gray-500 truncate">{log.resource}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span>การดำเนินการด่วน</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setShowSecurityDialog(true)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    จัดการเหตุการณ์ความปลอดภัย
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleExportSecurityEvents}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกรายงานความปลอดภัย
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    รีเฟรชข้อมูล
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Users Overview */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="bg-purple-50 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span>ผู้ใช้งานในระบบ</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {users.length} ผู้ใช้
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleExportUsers}>
                        <Download className="w-4 h-4 mr-2" />
                        ส่งออก CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ไม่พบข้อมูลผู้ใช้</p>
                      </div>
                    ) : (
                      users.map((user) => {
                        const userLogs = auditLogs.filter(log => log.userId === user.id);
                        const lastActivity = userLogs[0];
                        const isActive = lastActivity && new Date(lastActivity.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                        
                        return (
                          <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold text-lg">
                                      {user.fullName.charAt(0)}
                                    </span>
                                  </div>
                                  {isActive && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                                    {isActive && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        ออนไลน์
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                                       user.role === 'manager' ? 'ผู้จัดการ' : 
                                       user.role === 'employee' ? 'พนักงาน' : user.role}
                                    </Badge>
                                    {user.department && (
                                      <span className="text-xs text-gray-500">{user.department}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-purple-600">
                                  {userLogs.length}
                                </div>
                                <div className="text-xs text-gray-500">กิจกรรม</div>
                                {lastActivity && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    ล่าสุด: {new Date(lastActivity.timestamp).toLocaleDateString('th-TH')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Statistics Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>สถิติผู้ใช้</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.uniqueUsers}</div>
                    <div className="text-sm text-gray-600">ผู้ใช้ที่ใช้งาน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {users.filter(u => {
                        const userLogs = auditLogs.filter(log => log.userId === u.id);
                        const lastActivity = userLogs[0];
                        return lastActivity && new Date(lastActivity.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">ออนไลน์ 24 ชม.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{users.length}</div>
                    <div className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span>ผู้ใช้ที่ใช้งานมาก</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {users
                      .map(user => ({
                        ...user,
                        activityCount: auditLogs.filter(log => log.userId === user.id).length
                      }))
                      .sort((a, b) => b.activityCount - a.activityCount)
                      .slice(0, 5)
                      .map((user, index) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.activityCount} กิจกรรม
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6 mt-6">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">การปฏิบัติตามกฎระเบียบ</h3>
                <p className="text-sm text-gray-600">ตรวจสอบและรายงานการปฏิบัติตามมาตรฐานต่างๆ</p>
              </div>
              <div className="ml-auto">
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => setShowComplianceReportDialog(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  สร้างรายงานการปฏิบัติตาม
                </Button>
              </div>
            </div>
          </div>
          
          <ComplianceOverview statistics={statistics} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SecurityIncidentsDialog
        open={showSecurityDialog}
        onOpenChange={setShowSecurityDialog}
      />
      
      <AuditFilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
      />
      
      <GenerateAuditReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
      
      <ComplianceReportDialog
        open={showComplianceReportDialog}
        onOpenChange={setShowComplianceReportDialog}
      />
    </div>
  );
}