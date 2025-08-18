import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, DollarSign, TrendingUp, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranchData } from '@/hooks/useBranchData';
import AttendanceTracker from '@/components/attendance/AttendanceTracker';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { LeaveRequestList } from '@/components/leaves/LeaveRequestList';
import { EmployeeReport } from '@/components/reports/EmployeeReport';

interface EmployeeDashboardProps {
  employeeId?: string;
  isManager?: boolean;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  employeeId, 
  isManager = false 
}) => {
  const { employees, attendance, leaves, commissions } = useEmployees();
  const { branches } = useBranchData();
  const [selectedView, setSelectedView] = useState<'overview' | 'attendance' | 'leaves' | 'reports'>('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employeeId || '');

  // Get current employee data
  const currentEmployee = employees.find(emp => emp.id === selectedEmployee);
  const currentBranch = branches.find(branch => branch.id === currentEmployee?.branchId);

  // Calculate current month data
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const monthlyAttendance = attendance.filter(att => {
    const attDate = new Date(att.date);
    return att.employeeId === selectedEmployee && 
           attDate >= firstDayOfMonth && 
           attDate <= lastDayOfMonth;
  });

  const monthlyLeaves = leaves.filter(leave => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    return leave.employeeId === selectedEmployee &&
           ((leaveStart >= firstDayOfMonth && leaveStart <= lastDayOfMonth) ||
            (leaveEnd >= firstDayOfMonth && leaveEnd <= lastDayOfMonth) ||
            (leaveStart <= firstDayOfMonth && leaveEnd >= lastDayOfMonth));
  });

  const monthlyCommissions = commissions.filter(comm => {
    const commDate = new Date(comm.createdAt);
    return comm.employeeId === selectedEmployee &&
           commDate >= firstDayOfMonth &&
           commDate <= lastDayOfMonth;
  });

  // Calculate statistics
  const workingDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const presentDays = monthlyAttendance.filter(att => att.checkIn).length;
  const lateDays = monthlyAttendance.filter(att => {
    if (!att.checkIn) return false;
    const checkIn = new Date(`${att.date}T${att.checkIn}`);
    return checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 0);
  }).length;
  const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
  const approvedLeaves = monthlyLeaves.filter(leave => leave.status === 'approved').length;
  const pendingLeaves = monthlyLeaves.filter(leave => leave.status === 'pending').length;
  const totalCommission = monthlyCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Employee Info Card */}
      {currentEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ข้อมูลพนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                <p className="font-medium">{currentEmployee.firstName} {currentEmployee.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ตำแหน่ง</p>
                <p className="font-medium">
                  {typeof currentEmployee.position === 'string' 
                    ? currentEmployee.position 
                    : currentEmployee.position.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">สาขา</p>
                <p className="font-medium">{currentBranch?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเข้างานเดือนนี้</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentDays}/{workingDays}</div>
            <p className="text-xs text-muted-foreground">
              อัตราการเข้างาน {attendanceRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มาสาย</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lateDays}</div>
            <p className="text-xs text-muted-foreground">วันในเดือนนี้</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การลา</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {pendingLeaves > 0 && `รออนุมัติ ${pendingLeaves} รายการ`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าคอมมิชชั่น</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totalCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">เดือนนี้</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leaves */}
        <Card>
          <CardHeader>
            <CardTitle>การลาล่าสุด</CardTitle>
            <CardDescription>รายการลาในเดือนนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(leave.status)}>
                        {getStatusIcon(leave.status)}
                        {leave.status === 'approved' ? 'อนุมัติ' :
                         leave.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {leave.type === 'sick' ? 'ลาป่วย' :
                         leave.type === 'personal' ? 'ลากิจ' :
                         leave.type === 'vacation' ? 'ลาพักร้อน' :
                         leave.type === 'maternity' ? 'ลาคลอด' :
                         leave.type === 'emergency' ? 'ลาฉุกเฉิน' : leave.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(leave.startDate).toLocaleDateString('th-TH')} - 
                      {new Date(leave.endDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              ))}
              {monthlyLeaves.length === 0 && (
                <p className="text-center text-gray-500 py-4">ไม่มีการลาในเดือนนี้</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>ค่าคอมมิชชั่นล่าสุด</CardTitle>
            <CardDescription>รายการค่าคอมมิชชั่นในเดือนนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyCommissions.slice(0, 5).map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {commission.transactionType === 'pos' ? 'ขาย POS' :
                         commission.transactionType === 'installment' ? 'ขายเช่าซื้อ' : 'อื่นๆ'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ยอดขาย: ฿{commission.saleAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      ฿{commission.commissionAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(commission.commissionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              {monthlyCommissions.length === 0 && (
                <p className="text-center text-gray-500 py-4">ไม่มีค่าคอมมิชชั่นในเดือนนี้</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard พนักงาน</h1>
          <p className="text-gray-600">ภาพรวมการทำงาน การลา และค่าคอมมิชชั่น</p>
        </div>
        
        <div className="flex gap-2">
          {isManager && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="เลือกพนักงาน" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">ภาพรวม</SelectItem>
              <SelectItem value="attendance">การเข้างาน</SelectItem>
              <SelectItem value="leaves">การลา</SelectItem>
              {isManager && <SelectItem value="reports">รายงาน</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'overview' && renderOverview()}
      
      {selectedView === 'attendance' && (
        <div className="space-y-6">
          {!isManager && <AttendanceTracker />}
          <AttendanceSummary employeeId={selectedEmployee} />
        </div>
      )}
      
      {selectedView === 'leaves' && (
        <div className="space-y-6">
          {!isManager && <LeaveRequestForm />}
          <LeaveRequestList employeeId={isManager ? selectedEmployee : undefined} />
        </div>
      )}
      
      {selectedView === 'reports' && isManager && (
        <EmployeeReport />
      )}
    </div>
  );
};