import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { AttendanceFilters, Attendance } from '@/types/employees';

export const AttendanceManagement: React.FC = () => {
  const {
    employees,
    departments,
    attendance,
    getFilteredAttendance,
    addAttendance,
    updateAttendance,
    exportAttendance,
    loading
  } = useEmployees();

  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filteredAttendance = getFilteredAttendance(filters);

  const handleSearch = (value: string) => {
    // Search by employee name or ID
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDepartmentFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      department: value === 'all' ? undefined : value
    }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value === 'all' ? undefined : value as any
    }));
  };

  const handleDateFilter = (type: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      date: {
        ...prev.date,
        [type]: value || undefined
      }
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'มาทำงาน', variant: 'default' as const, icon: CheckCircle },
      absent: { label: 'ขาดงาน', variant: 'destructive' as const, icon: XCircle },
      late: { label: 'มาสาย', variant: 'secondary' as const, icon: AlertCircle },
      'half-day': { label: 'ครึ่งวัน', variant: 'outline' as const, icon: Clock },
      overtime: { label: 'ล่วงเวลา', variant: 'default' as const, icon: Clock },
      holiday: { label: 'วันหยุด', variant: 'secondary' as const, icon: Calendar }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'ไม่พบข้อมูล';
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleExport = () => {
    exportAttendance(filters);
  };

  // Calculate summary statistics
  const totalRecords = filteredAttendance.length;
  const presentCount = filteredAttendance.filter(att => att.status === 'present').length;
  const lateCount = filteredAttendance.filter(att => att.status === 'late').length;
  const absentCount = filteredAttendance.filter(att => att.status === 'absent').length;
  const averageHours = filteredAttendance.reduce((sum, att) => sum + att.totalHours, 0) / totalRecords || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการการเข้าทำงาน</h2>
          <p className="text-muted-foreground">
            ติดตามและจัดการการเข้าทำงานของพนักงาน ({filteredAttendance.length} รายการ)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                บันทึกการเข้าทำงาน
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>บันทึกการเข้าทำงาน</DialogTitle>
                <DialogDescription>
                  บันทึกข้อมูลการเข้าทำงานของพนักงาน
                </DialogDescription>
              </DialogHeader>
              {/* Add AttendanceForm component here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">มาทำงาน</p>
                <p className="text-2xl font-bold">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">มาสาย</p>
                <p className="text-2xl font-bold">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">ขาดงาน</p>
                <p className="text-2xl font-bold">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">ชั่วโมงเฉลี่ย</p>
                <p className="text-2xl font-bold">{averageHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ตัวกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ชื่อพนักงาน หรือ รหัส"
                  className="pl-8"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">แผนก</label>
              <Select value={filters.department || 'all'} onValueChange={handleDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแผนก</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="present">มาทำงาน</SelectItem>
                  <SelectItem value="absent">ขาดงาน</SelectItem>
                  <SelectItem value="late">มาสาย</SelectItem>
                  <SelectItem value="half-day">ครึ่งวัน</SelectItem>
                  <SelectItem value="overtime">ล่วงเวลา</SelectItem>
                  <SelectItem value="holiday">วันหยุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">วันที่</label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={filters.date?.start || ''}
                  onChange={(e) => handleDateFilter('start', e.target.value)}
                />
                <Input
                  type="date"
                  value={filters.date?.end || ''}
                  onChange={(e) => handleDateFilter('end', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <RefreshCw className="h-4 w-4 mr-2" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการการเข้าทำงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>เวลาเข้า</TableHead>
                <TableHead>เวลาออก</TableHead>
                <TableHead>ชั่วโมงทำงาน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => {
                const employee = getEmployeeById(record.employeeId);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee?.avatar} />
                          <AvatarFallback>
                            {employee?.firstName?.charAt(0) || ''}{employee?.lastName?.charAt(0) || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getEmployeeName(record.employeeId)}</p>
                          <p className="text-sm text-muted-foreground">{employee?.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>{record.checkIn || '-'}</TableCell>
                    <TableCell>{record.checkOut || '-'}</TableCell>
                    <TableCell>{record.totalHours.toFixed(1)} ชม.</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(record);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">ไม่พบข้อมูลการเข้าทำงาน</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};