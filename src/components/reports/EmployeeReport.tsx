import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, Calendar, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranchData } from '@/hooks/useBranchData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Employee, Attendance, Leave, Commission } from '@/types/employees';

interface EmployeeReportProps {
  branchId?: string;
}

export const EmployeeReport: React.FC<EmployeeReportProps> = ({ branchId }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || 'all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    employees, 
    attendanceRecords, 
    leaveRequests, 
    commissions
  } = useEmployees();
  
  // Helper functions for date range filtering
  const getAttendanceByDateRange = (start: Date, end: Date) => {
    return attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= start && attDate <= end;
    });
  };
  
  const getLeavesByDateRange = (start: Date, end: Date) => {
    return leaves.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return (leaveStart <= end && leaveEnd >= start);
    });
  };
  
  const getCommissionsByDateRange = (start: Date, end: Date) => {
    return commissions.filter(comm => {
      const commDate = new Date(comm.calculatedAt);
      return commDate >= start && commDate <= end;
    });
  };
  
  const { branches } = useBranchData();
  
  const reportMonth = new Date(selectedMonth + '-01');
  const monthStart = startOfMonth(reportMonth);
  const monthEnd = endOfMonth(reportMonth);
  const workingDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    .filter(day => !isWeekend(day)).length;

  // กรองข้อมูลตามสาขาและคำค้นหา
  const filteredEmployees = useMemo(() => {
    let filtered = employees;
    
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(emp => emp.branchId === selectedBranch);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        (emp.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof emp.position === 'string' ? emp.position : emp.position?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [employees, selectedBranch, searchTerm]);

  // คำนวณข้อมูลรายงาน
  const reportData = useMemo(() => {
    const monthlyAttendance = attendanceRecords.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= monthStart && attDate <= monthEnd;
    });
    const monthlyLeaves = leaveRequests.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return (leaveStart <= monthEnd && leaveEnd >= monthStart);
    });
    const monthlyCommissions = commissions.filter(comm => {
      const commDate = new Date(comm.calculatedAt);
      return commDate >= monthStart && commDate <= monthEnd;
    });
    
    return filteredEmployees.map(employee => {
      const empAttendance = monthlyAttendance.filter(att => att.employeeId === employee.id);
      const empLeaves = monthlyLeaves.filter(leave => leave.employeeId === employee.id);
      const empCommissions = monthlyCommissions.filter(comm => comm.employeeId === employee.id);
      
      const presentDays = empAttendance.filter(att => att.checkIn).length;
      const lateDays = empAttendance.filter(att => {
        if (!att.checkIn) return false;
        const checkIn = new Date(att.checkIn);
        const lateThreshold = new Date(checkIn);
        lateThreshold.setHours(9, 0, 0, 0);
        return checkIn > lateThreshold;
      }).length;
      
      const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
      const approvedLeaves = empLeaves.filter(leave => leave.status === 'approved').length;
      const totalCommission = empCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
      
      return {
        employee,
        presentDays,
        lateDays,
        attendanceRate,
        approvedLeaves,
        totalCommission,
        attendance: empAttendance,
        leaves: empLeaves,
        commissions: empCommissions
      };
    });
  }, [filteredEmployees, monthStart, monthEnd, workingDays, attendanceRecords, leaveRequests, commissions]);

  // สรุปภาพรวม
  const summary = useMemo(() => {
    const totalEmployees = reportData.length;
    const totalPresentDays = reportData.reduce((sum, data) => sum + data.presentDays, 0);
    const totalLateDays = reportData.reduce((sum, data) => sum + data.lateDays, 0);
    const totalLeaves = reportData.reduce((sum, data) => sum + data.approvedLeaves, 0);
    const totalCommissions = reportData.reduce((sum, data) => sum + data.totalCommission, 0);
    const avgAttendanceRate = totalEmployees > 0 ? 
      reportData.reduce((sum, data) => sum + data.attendanceRate, 0) / totalEmployees : 0;
    
    return {
      totalEmployees,
      totalPresentDays,
      totalLateDays,
      totalLeaves,
      totalCommissions,
      avgAttendanceRate
    };
  }, [reportData]);

  const exportToExcel = () => {
    const exportData = reportData.map(data => ({
      'ชื่อ-นามสกุล': `${data.employee.firstName} ${data.employee.lastName}`,
      'ตำแหน่ง': data.employee.position,
      'สาขา': branches.find(b => b.id === data.employee.branchId)?.name || '-',
      'วันเข้างาน': data.presentDays,
      'วันมาสาย': data.lateDays,
      'อัตราเข้างาน (%)': data.attendanceRate.toFixed(1),
      'วันลา': data.approvedLeaves,
      'ค่าคอมมิชชั่น (บาท)': data.totalCommission.toLocaleString()
    }));
    
    // This would use exportToExcel from reportHelpers
    console.log('Export to Excel:', `employee-report-${selectedMonth}`, exportData);
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวและตัวกรอง */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายงานพนักงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>สาขา</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสาขา</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>เดือน</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>ค้นหาพนักงาน</Label>
              <Input
                placeholder="ชื่อ หรือ ตำแหน่ง"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={exportToExcel} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                ส่งออก Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* สรุปภาพรวม */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <div className="text-sm text-muted-foreground">พนักงาน</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold">{summary.totalPresentDays}</div>
            <div className="text-sm text-muted-foreground">วันเข้างาน</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <div className="text-2xl font-bold">{summary.totalLateDays}</div>
            <div className="text-sm text-muted-foreground">วันมาสาย</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold">{summary.totalLeaves}</div>
            <div className="text-sm text-muted-foreground">วันลา</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <div className="text-2xl font-bold">{summary.totalCommissions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">คอมมิชชั่น (บาท)</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-indigo-600 mb-2" />
            <div className="text-2xl font-bold">{summary.avgAttendanceRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">อัตราเข้างานเฉลี่ย</div>
          </CardContent>
        </Card>
      </div>

      {/* รายละเอียดข้อมูล */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
              <TabsTrigger value="attendance">การเข้างาน</TabsTrigger>
              <TabsTrigger value="leaves">การลา</TabsTrigger>
              <TabsTrigger value="commissions">คอมมิชชั่น</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>สาขา</TableHead>
                    <TableHead className="text-center">เข้างาน</TableHead>
                    <TableHead className="text-center">มาสาย</TableHead>
                    <TableHead className="text-center">อัตรา (%)</TableHead>
                    <TableHead className="text-center">ลา</TableHead>
                    <TableHead className="text-right">คอมมิชชั่น</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((data) => {
                    const branch = branches.find(b => b.id === data.employee.branchId);
                    return (
                      <TableRow key={data.employee.id}>
                        <TableCell className="font-medium">
                          {data.employee.firstName} {data.employee.lastName}
                        </TableCell>
                        <TableCell>{typeof data.employee.position === 'string' ? data.employee.position : data.employee.position.name}</TableCell>
                        <TableCell>{branch?.name || '-'}</TableCell>
                        <TableCell className="text-center">{data.presentDays}</TableCell>
                        <TableCell className="text-center">
                          {data.lateDays > 0 ? (
                            <Badge variant="destructive">{data.lateDays}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={data.attendanceRate >= 90 ? "default" : 
                                   data.attendanceRate >= 80 ? "secondary" : "destructive"}
                          >
                            {data.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{data.approvedLeaves}</TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{data.totalCommission.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="attendance" className="p-6">
              <div className="text-sm text-muted-foreground mb-4">
                รายละเอียดการเข้างานประจำเดือน {format(reportMonth, 'MMMM yyyy', { locale: th })}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead className="text-center">วันทำงาน</TableHead>
                    <TableHead className="text-center">เข้างาน</TableHead>
                    <TableHead className="text-center">มาสาย</TableHead>
                    <TableHead className="text-center">ขาดงาน</TableHead>
                    <TableHead className="text-center">อัตราเข้างาน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((data) => {
                    const absentDays = workingDays - data.presentDays;
                    return (
                      <TableRow key={data.employee.id}>
                        <TableCell className="font-medium">
                          {data.employee.firstName} {data.employee.lastName}
                        </TableCell>
                        <TableCell className="text-center">{workingDays}</TableCell>
                        <TableCell className="text-center">{data.presentDays}</TableCell>
                        <TableCell className="text-center">
                          {data.lateDays > 0 ? (
                            <Badge variant="destructive">{data.lateDays}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {absentDays > 0 ? (
                            <Badge variant="destructive">{absentDays}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={data.attendanceRate >= 90 ? "default" : 
                                   data.attendanceRate >= 80 ? "secondary" : "destructive"}
                          >
                            {data.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="leaves" className="p-6">
              <div className="text-sm text-muted-foreground mb-4">
                รายละเอียดการลาประจำเดือน {format(reportMonth, 'MMMM yyyy', { locale: th })}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>จำนวนวัน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เหตุผล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.flatMap(data => 
                    data.leaves.map(leave => ({
                      ...leave,
                      employee: data.employee
                    }))
                  ).map((leave) => {
                    const days = Math.ceil(
                      (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) 
                      / (1000 * 60 * 60 * 24)
                    ) + 1;
                    
                    return (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {leave.employee.firstName} {leave.employee.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {leave.type === 'sick' ? 'ลาป่วย' :
                             leave.type === 'personal' ? 'ลากิจ' :
                             leave.type === 'vacation' ? 'ลาพักร้อน' :
                             leave.type === 'maternity' ? 'ลาคลอด' :
                             leave.type === 'emergency' ? 'ลาฉุกเฉิน' : leave.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(leave.startDate), 'd MMM', { locale: th })} - 
                          {format(new Date(leave.endDate), 'd MMM', { locale: th })}
                        </TableCell>
                        <TableCell className="text-center">{days}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={leave.status === 'approved' ? 'default' :
                                   leave.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {leave.status === 'approved' ? 'อนุมัติ' :
                             leave.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="commissions" className="p-6">
              <div className="text-sm text-muted-foreground mb-4">
                รายละเอียดค่าคอมมิชชั่นประจำเดือน {format(reportMonth, 'MMMM yyyy', { locale: th })}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead className="text-right">ยอดขาย</TableHead>
                    <TableHead className="text-center">อัตรา (%)</TableHead>
                    <TableHead className="text-right">คอมมิชชั่น</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.flatMap(data => 
                    data.commissions.map(commission => ({
                      ...commission,
                      employee: data.employee
                    }))
                  ).map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.employee.firstName} {commission.employee.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {commission.transactionType === 'pos' ? 'POS' :
                           commission.transactionType === 'installment' ? 'เช่าซื้อ' : commission.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(commission.calculatedAt), 'd MMM yyyy', { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">
                        ฿{commission.saleAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {commission.commissionRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{commission.commissionAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};