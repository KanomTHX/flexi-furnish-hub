import React from 'react';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Attendance } from '@/types/employees';

interface AttendanceSummaryProps {
  employeeId?: string; // ถ้าไม่ระบุจะแสดงสรุปทั้งหมด
  month?: Date; // เดือนที่ต้องการดู (default: เดือนปัจจุบัน)
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ 
  employeeId, 
  month = new Date() 
}) => {
  const { employees, getAttendanceByEmployee, getAttendanceByDateRange, loading } = useEmployees();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const workingDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    .filter(day => !isWeekend(day)).length;

  // ถ้าระบุ employeeId จะแสดงข้อมูลของพนักงานคนนั้น
  if (employeeId) {
    const employee = employees.find(emp => emp.id === employeeId);
    const attendance = getAttendanceByEmployee(employeeId);
    
    if (!employee) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">ไม่พบข้อมูลพนักงาน</p>
          </CardContent>
        </Card>
      );
    }

    const monthlyAttendance = attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= monthStart && attDate <= monthEnd;
    });

    const presentDays = monthlyAttendance.filter(att => att.checkIn).length;
    const lateDays = monthlyAttendance.filter(att => {
      if (!att.checkIn) return false;
      const checkIn = new Date(`${att.date}T${att.checkIn}`);
      const lateThreshold = new Date(checkIn);
      lateThreshold.setHours(9, 0, 0, 0); // 09:00 เป็นเวลามาตรฐาน
      return checkIn > lateThreshold;
    }).length;

    const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

    return (
      <div className="space-y-4">
        {/* ข้อมูลพนักงาน */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              สรุปการเข้างาน - {employee.firstName} {employee.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              {format(month, 'MMMM yyyy', { locale: th })}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{presentDays}</div>
                <div className="text-sm text-muted-foreground">วันที่เข้างาน</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{workingDays}</div>
                <div className="text-sm text-muted-foreground">วันทำงาน</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{lateDays}</div>
                <div className="text-sm text-muted-foreground">วันมาสาย</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{attendanceRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">อัตราเข้างาน</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>อัตราการเข้างาน</span>
                <span>{attendanceRate.toFixed(1)}%</span>
              </div>
              <Progress value={attendanceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* รายละเอียดการเข้างานรายวัน */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              รายละเอียดการเข้างาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {monthlyAttendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  ไม่มีข้อมูลการเข้างานในเดือนนี้
                </p>
              ) : (
                monthlyAttendance.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {format(new Date(att.date), 'EEE d MMM', { locale: th })}
                      </div>
                      {att.checkIn ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      {att.checkIn && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(`${att.date}T${att.checkIn}`), 'HH:mm')}</span>
                          {(() => {
                            const checkIn = new Date(`${att.date}T${att.checkIn}`);
                            const lateThreshold = new Date(checkIn);
                            lateThreshold.setHours(9, 0, 0, 0);
                            return checkIn > lateThreshold ? (
                              <Badge variant="destructive" className="ml-1 text-xs">สาย</Badge>
                            ) : null;
                          })()}
                        </div>
                      )}
                      
                      {att.checkOut && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(`${att.date}T${att.checkOut}`), 'HH:mm')}</span>
                        </div>
                      )}
                      
                      {!att.checkIn && (
                        <Badge variant="outline">ขาดงาน</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // แสดงสรุปของทุกคน
  const allAttendance = getAttendanceByDateRange(monthStart, monthEnd);
  const employeeStats = employees.map(employee => {
    const empAttendance = allAttendance.filter(att => att.employeeId === employee.id);
    const presentDays = empAttendance.filter(att => att.checkIn).length;
    const lateDays = empAttendance.filter(att => {
      if (!att.checkIn) return false;
      const checkIn = new Date(`${att.date}T${att.checkIn}`);
      const lateThreshold = new Date(checkIn);
      lateThreshold.setHours(9, 0, 0, 0);
      return checkIn > lateThreshold;
    }).length;
    const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
    
    return {
      employee,
      presentDays,
      lateDays,
      attendanceRate
    };
  });

  const totalEmployees = employees.length;
  const avgAttendanceRate = employeeStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / totalEmployees;
  const totalPresentDays = employeeStats.reduce((sum, stat) => sum + stat.presentDays, 0);
  const totalLateDays = employeeStats.reduce((sum, stat) => sum + stat.lateDays, 0);

  return (
    <div className="space-y-4">
      {/* สรุปภาพรวม */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            สรุปการเข้างานทั้งหมด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {format(month, 'MMMM yyyy', { locale: th })}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
              <div className="text-sm text-muted-foreground">พนักงานทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalPresentDays}</div>
              <div className="text-sm text-muted-foreground">วันเข้างานรวม</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalLateDays}</div>
              <div className="text-sm text-muted-foreground">วันมาสายรวม</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{avgAttendanceRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">อัตราเข้างานเฉลี่ย</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* รายละเอียดแต่ละคน */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            รายละเอียดการเข้างานรายบุคคล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeeStats.map(({ employee, presentDays, lateDays, attendanceRate }) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                    <div className="text-sm text-muted-foreground">{typeof employee.position === 'string' ? employee.position : employee.position.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-green-600">{presentDays}</div>
                    <div className="text-xs text-muted-foreground">เข้างาน</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">{lateDays}</div>
                    <div className="text-xs text-muted-foreground">มาสาย</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div className="font-medium text-purple-600">{attendanceRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">อัตรา</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};