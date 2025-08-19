import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  Clock,
  FileText,
  CreditCard,
  Shield,
  AlertCircle,
  Edit
} from 'lucide-react';
import { Employee } from '@/types/employees';

interface EmployeeDetailProps {
  employee: Employee;
  onClose: () => void;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee, onClose }) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'ทำงาน', variant: 'default' as const },
      inactive: { label: 'ไม่ทำงาน', variant: 'secondary' as const },
      terminated: { label: 'ออกจากงาน', variant: 'destructive' as const },
      'on-leave': { label: 'ลาพัก', variant: 'outline' as const },
      probation: { label: 'ทดลองงาน', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getWorkScheduleText = () => {
    const workDays = employee.workSchedule.workDays.filter(day => day.isWorkingDay);
    if (workDays.length === 0) return 'ไม่มีตารางการทำงาน';
    
    const firstDay = workDays[0];
    const allSameTime = workDays.every(day => 
      day.startTime === firstDay.startTime && day.endTime === firstDay.endTime
    );
    
    if (allSameTime) {
      return `${firstDay.startTime} - ${firstDay.endTime} (${workDays.length} days/week)`;
    }
    
    return 'ตารางการทำงานแบบผสม';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={employee.avatar} />
            <AvatarFallback className="text-lg">
              {employee.firstName?.charAt(0) || ''}{employee.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-bold">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-muted-foreground">{employee.position.name}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{employee.employeeId}</Badge>
              {getStatusBadge(employee.status)}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          แก้ไข
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">อีเมล</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">ที่อยู่</p>
                <p className="font-medium">{employee.address}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">วันเกิด</p>
                <p className="font-medium">
                  {new Date(employee.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              ข้อมูลการทำงาน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">แผนก</p>
                <p className="font-medium">{employee.department.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                <p className="font-medium">{employee.position.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">เงินเดือน</p>
                <p className="font-medium">฿{employee.salary.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">วันเริ่มงาน</p>
                <p className="font-medium">
                  {new Date(employee.hireDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              ผู้ติดต่อฉุกเฉิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
              <p className="font-medium">{employee.emergencyContact.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">ความสัมพันธ์</p>
              <p className="font-medium">{employee.emergencyContact.relationship}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
              <p className="font-medium">{employee.emergencyContact.phone}</p>
            </div>
            
            {employee.emergencyContact.email && (
              <div>
                <p className="text-sm text-muted-foreground">อีเมล</p>
                <p className="font-medium">{employee.emergencyContact.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              บัญชีธนาคาร
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">ธนาคาร</p>
              <p className="font-medium">{employee.bankAccount.bankName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">เลขบัญชี</p>
              <p className="font-medium font-mono">{employee.bankAccount.accountNumber}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">ชื่อบัญชี</p>
              <p className="font-medium">{employee.bankAccount.accountName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">สาขา</p>
              <p className="font-medium">{employee.bankAccount.branchName}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            ตารางการทำงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">ประเภท</p>
              <Badge variant="outline">{employee.workSchedule.type}</Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">เวลา</p>
              <p className="font-medium">{getWorkScheduleText()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">อัตราค่าล่วงเวลา</p>
              <p className="font-medium">{employee.workSchedule.overtimeRate}x</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">วันลาพักร้อน</p>
              <p className="font-medium">{employee.workSchedule.vacationDays} วัน/ปี</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <p className="text-sm text-muted-foreground mb-3">ตารางการทำงานรายสัปดาห์</p>
            <div className="grid gap-2 md:grid-cols-2">
              {employee.workSchedule.workDays.map((day) => (
                <div key={day.day} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="capitalize font-medium">{day.day}</span>
                  <span className="text-sm text-muted-foreground">
                    {day.isWorkingDay ? `${day.startTime} - ${day.endTime}` : 'หยุด'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {employee.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              เอกสาร
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        อัปโหลดเมื่อ {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.isRequired && (
                      <Badge variant="destructive" className="text-xs">จำเป็น</Badge>
                    )}
                    <Button variant="outline" size="sm">ดู</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions */}
      {employee.permissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              สิทธิ์การเข้าถึง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employee.permissions.map((permission, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{permission.module}</h4>
                    <Badge variant="outline">{permission.actions.length} สิทธิ์</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {permission.actions.map((action) => (
                      <Badge key={action} variant="secondary" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};