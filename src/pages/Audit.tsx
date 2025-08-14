import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Building2
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

  const handleExportAuditLogs = () => {
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
  };

  const handleExportSecurityEvents = () => {
    const csv = exportSecurityEventsToCSV(securityEvents);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `security-events-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์เหตุการณ์ความปลอดภัยถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportUsers = () => {
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

  const criticalEvents = getCriticalEvents();
  const recentActivity = getRecentActivity(24);
  const failedActions = getFailedActions();
  const unresolvedSecurityEvents = getUnresolvedSecurityEvents();

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">บันทึกการตรวจสอบ</h1>
            <p className="text-muted-foreground">
              ติดตามและตรวจสอบกิจกรรมทั้งหมดในระบบ
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <span className="text-xs text-blue-600">({currentBranchEmployees.length} ผู้ใช้)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className={`relative ${unresolvedSecurityEvents.length > 0 ? 'border-red-200 text-red-700 hover:bg-red-50' : ''}`}
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
          
          <Button 
            variant="outline"
            onClick={() => setShowFilterDialog(true)}
            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900"
          >
            <Settings className="w-4 h-4 mr-2" />
            สำคัดกรอง
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {statistics.totalLogs.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">บันทึกทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {recentActivity.length}
                </div>
                <div className="text-sm text-green-600">กิจกรรม 24 ชม.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {statistics.criticalEvents}
                </div>
                <div className="text-sm text-red-600">เหตุการณ์วิกฤต</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  {statistics.uniqueUsers}
                </div>
                <div className="text-sm text-purple-600">ผู้ใช้ที่ใช้งาน</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            บันทึกการตรวจสอบ ({auditLogs.length})
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ความปลอดภัย ({securityEvents.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ผู้ใช้งาน ({users.length})
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            การปฏิบัติตาม
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AuditOverview statistics={statistics} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <AuditLogsList
            logs={auditLogs}
            users={users}
            filter={auditFilter}
            onFilterChange={setAuditFilter}
            onExport={handleExportAuditLogs}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  เหตุการณ์ความปลอดภัย
                </CardTitle>
                <Button variant="outline" onClick={handleExportSecurityEvents}>
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่พบเหตุการณ์ความปลอดภัย</p>
                  </div>
                ) : (
                  securityEvents.map((event) => (
                    <div key={event.id} className={`p-4 border rounded-lg ${
                      !event.resolved ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {event.severity}
                            </Badge>
                            <Badge variant={event.resolved ? 'default' : 'destructive'}>
                              {event.resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข'}
                            </Badge>
                          </div>
                          <h3 className="font-medium mb-1">{event.description}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>IP: {event.ipAddress}</div>
                            <div>เวลา: {new Date(event.timestamp).toLocaleString('th-TH')}</div>
                            {event.userId && (
                              <div>ผู้ใช้: {users.find(u => u.id === event.userId)?.fullName}</div>
                            )}
                            {event.resolved && event.resolvedBy && (
                              <div className="text-green-600">
                                แก้ไขโดย: {users.find(u => u.id === event.resolvedBy)?.fullName} 
                                เมื่อ {event.resolvedAt && new Date(event.resolvedAt).toLocaleString('th-TH')}
                              </div>
                            )}
                          </div>
                        </div>
                        {!event.resolved && (
                          <Button 
                            size="sm"
                            onClick={() => handleResolveSecurityEvent(event.id)}
                          >
                            แก้ไข
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  ผู้ใช้งานระบบ
                </CardTitle>
                <Button variant="outline" onClick={handleExportUsers}>
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => {
                  const userLogs = auditLogs.filter(log => log.userId === user.id);
                  const lastActivity = userLogs.length > 0 ? userLogs[0].timestamp : null;
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{user.fullName}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>ชื่อผู้ใช้: {user.username}</div>
                          <div>อีเมล: {user.email}</div>
                          <div>บทบาท: {user.role}</div>
                          {user.department && <div>แผนก: {user.department}</div>}
                          {lastActivity && (
                            <div>กิจกรรมล่าสุด: {new Date(lastActivity).toLocaleString('th-TH')}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {userLogs.length}
                        </div>
                        <div className="text-sm text-muted-foreground">กิจกรรม</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">การปฏิบัติตามมาตรฐาน</h2>
              <p className="text-muted-foreground">
                ติดตามและประเมินการปฏิบัติตามข้อกำหนดและมาตรฐานต่างๆ
              </p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowComplianceReportDialog(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              สร้างรายงานการปฏิบัติตาม
            </Button>
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