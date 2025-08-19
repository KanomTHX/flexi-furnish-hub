import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  BarChart3,
  RefreshCw,
  Building2,
  Briefcase,
  Eye
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';
import { EmployeeManagement } from '@/components/employees/EmployeeManagement';
import { AttendanceManagement } from '@/components/employees/AttendanceManagement';
import { LeaveManagement } from '@/components/employees/LeaveManagement';
import { PayrollManagement } from '@/components/employees/PayrollManagement';
import { TrainingManagement } from '@/components/employees/TrainingManagement';
import { EmployeeAnalytics } from '@/components/employees/EmployeeAnalytics';
import { ExportEmployeeDataDialog } from '@/components/employees/ExportEmployeeDataDialog';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { EmployeeDashboard } from '@/components/employees/EmployeeDashboard';
import { EmployeeReport } from '@/components/reports/EmployeeReport';

const Employees: React.FC = () => {
  const {
    employees,
    departments,
    positions,
    attendance,
    leaves,
    payrolls,
    trainings,
    analytics,
    loading
  } = useEmployees();

  const { currentBranch, currentBranchEmployees } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);

  const currentAnalytics = analytics;

  // Quick Stats
  const quickStats = [
    {
      title: 'พนักงานทั้งหมด',
      value: currentAnalytics.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `+${currentAnalytics.newHires} คนใหม่`
    },
    {
      title: 'พนักงานที่ทำงาน',
      value: currentAnalytics.activeEmployees,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${((currentAnalytics.activeEmployees / currentAnalytics.totalEmployees) * 100).toFixed(1)}%`
    },
    {
      title: 'เงินเดือนเฉลี่ย',
      value: `฿${currentAnalytics.averageSalary.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'ต่อเดือน'
    },
    {
      title: 'อัตราการมาทำงาน',
      value: `${currentAnalytics.attendanceRate}%`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '7 วันล่าสุด'
    }
  ];

  // Recent Activities - Generate from real data
  const recentActivities = useMemo(() => {
    const activities = [];
    
    // Add recent new hires (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentHires = employees.filter(emp => 
      emp.hireDate && new Date(emp.hireDate) >= sevenDaysAgo
    ).slice(0, 2);
    
    recentHires.forEach(emp => {
      const hireDate = new Date(emp.hireDate!);
      const daysAgo = Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'วันนี้' : daysAgo === 1 ? 'เมื่อวาน' : `${daysAgo} วันที่แล้ว`;
      
      activities.push({
        type: 'new_hire',
        message: `พนักงานใหม่เข้าทำงาน: ${emp.firstName} ${emp.lastName}`,
        time: timeText,
        icon: UserPlus,
        color: 'text-green-600'
      });
    });
    
    // Add recent leave requests (last 7 days)
    const recentLeaves = leaves.filter(leave => {
      const requestDate = new Date(leave.appliedAt || leave.startDate);
      return requestDate >= sevenDaysAgo;
    }).slice(0, 2);
    
    recentLeaves.forEach(leave => {
      const requestDate = new Date(leave.appliedAt || leave.startDate);
      const daysAgo = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'วันนี้' : daysAgo === 1 ? 'เมื่อวาน' : `${daysAgo} วันที่แล้ว`;
      
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Find employee by ID
      const employee = employees.find(emp => emp.id === leave.employeeId);
      
      activities.push({
        type: 'leave_request',
        message: `คำขอลา${leave.type}: ${employee?.firstName || 'ไม่ระบุ'} ${employee?.lastName || ''} (${duration} วัน)`,
        time: timeText,
        icon: Calendar,
        color: 'text-blue-600'
      });
    });
    
    // Add recent attendance records (today)
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => 
      record.date === today && record.status === 'present'
    ).slice(0, 2);
    
    todayAttendance.forEach(record => {
      // Find employee by ID
      const employee = employees.find(emp => emp.id === record.employeeId);
      
      activities.push({
        type: 'attendance',
        message: `เข้าทำงาน: ${employee?.firstName || 'ไม่ระบุ'} ${employee?.lastName || ''}`,
        time: record.checkIn ? `เวลา ${record.checkIn}` : 'วันนี้',
        icon: Clock,
        color: 'text-green-600'
      });
    });
    
    // If no real activities, show placeholder
    if (activities.length === 0) {
      activities.push(
        {
          type: 'info',
          message: 'ไม่มีกิจกรรมล่าสุด',
          time: 'วันนี้',
          icon: BarChart3,
          color: 'text-gray-600'
        }
      );
    }
    
    // Sort by most recent and limit to 4 items
    return activities.slice(0, 4);
  }, [employees, leaves, attendance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>กำลังโหลดข้อมูลพนักงาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">จัดการพนักงาน</h1>
            <p className="text-muted-foreground">
              จัดการข้อมูลพนักงาน การเข้าทำงาน การลา เงินเดือน และการอบรม
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <span className="text-xs text-blue-600">({currentBranchEmployees.length} คน)</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900"
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออกข้อมูล
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowAddEmployeeDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            เพิ่มพนักงาน
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">พนักงาน</TabsTrigger>
          <TabsTrigger value="attendance">การเข้าทำงาน</TabsTrigger>
          <TabsTrigger value="leaves">การลา</TabsTrigger>
          <TabsTrigger value="payroll">เงินเดือน</TabsTrigger>
          <TabsTrigger value="training">การอบรม</TabsTrigger>
          <TabsTrigger value="reports">รายงาน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Department Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">แผนกทั้งหมด</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.length}</div>
                <div className="space-y-2 mt-4">
                  {departments.slice(0, 3).map((dept) => {
                    const deptEmployees = employees.filter(emp => emp.department.id === dept.id);
                    return (
                      <div key={dept.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{dept.name}</span>
                        <Badge variant="secondary">{deptEmployees.length} คน</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Position Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ตำแหน่งงาน</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{positions.length}</div>
                <div className="space-y-2 mt-4">
                  {positions.slice(0, 3).map((pos) => {
                    const posEmployees = employees.filter(emp => emp.position.id === pos.id);
                    return (
                      <div key={pos.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{pos.name}</span>
                        <Badge variant="secondary">{posEmployees.length} คน</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">กิจกรรมล่าสุด</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="p-1 rounded-full bg-gray-100">
                          <Icon className={`h-3 w-3 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {activity.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <EmployeeAnalytics analytics={currentAnalytics} />
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <EmployeeDashboard isManager={true} />
        </TabsContent>

        {/* Employee Management Tab */}
        <TabsContent value="employees">
          <EmployeeManagement />
        </TabsContent>

        {/* Attendance Management Tab */}
        <TabsContent value="attendance">
          <AttendanceManagement />
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leaves">
          <LeaveManagement />
        </TabsContent>

        {/* Payroll Management Tab */}
        <TabsContent value="payroll">
          <PayrollManagement />
        </TabsContent>

        {/* Training Management Tab */}
        <TabsContent value="training">
          <TrainingManagement />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <EmployeeReport />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ExportEmployeeDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
      
      <AddEmployeeDialog
        open={showAddEmployeeDialog}
        onOpenChange={setShowAddEmployeeDialog}
      />
    </div>
  );
};

export default Employees;