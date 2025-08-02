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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeFilters, Employee } from '@/types/employees';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDetail } from './EmployeeDetail';

export const EmployeeManagement: React.FC = () => {
  const {
    employees,
    departments,
    positions,
    getFilteredEmployees,
    deleteEmployee,
    exportEmployees,
    loading
  } = useEmployees();

  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filteredEmployees = getFilteredEmployees(filters);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDepartmentFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      department: value === 'all' ? undefined : value 
    }));
  };

  const handlePositionFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      position: value === 'all' ? undefined : value 
    }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: value === 'all' ? undefined : value as any
    }));
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailDialog(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditDialog(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (confirm(`คุณต้องการลบพนักงาน ${employee.firstName} ${employee.lastName} หรือไม่?`)) {
      deleteEmployee(employee.id);
    }
  };

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

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการพนักงาน</h2>
          <p className="text-muted-foreground">
            จัดการข้อมูลพนักงานทั้งหมด ({filteredEmployees.length} คน)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportEmployees}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                เพิ่มพนักงาน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลพนักงานใหม่ให้ครบถ้วน
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm
                onSuccess={() => setShowAddDialog(false)}
                onCancel={() => setShowAddDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาพนักงาน (ชื่อ, รหัส, อีเมล)"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filters.department || 'all'} onValueChange={handleDepartmentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="แผนก" />
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

            <Select value={filters.position || 'all'} onValueChange={handlePositionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกตำแหน่ง</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos.id} value={pos.id}>
                    {pos.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ทำงาน</SelectItem>
                <SelectItem value="inactive">ไม่ทำงาน</SelectItem>
                <SelectItem value="terminated">ออกจากงาน</SelectItem>
                <SelectItem value="on-leave">ลาพัก</SelectItem>
                <SelectItem value="probation">ทดลองงาน</SelectItem>
              </SelectContent>
            </Select>

            {Object.keys(filters).length > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
            )}

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงาน</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลพนักงาน</h3>
              <p>ไม่มีพนักงานที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>รหัสพนักงาน</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>เงินเดือน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่เข้าทำงาน</TableHead>
                    <TableHead className=\"text-right\">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback>
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.employeeId}</Badge>
                      </TableCell>
                      <TableCell>{employee.department.name}</TableCell>
                      <TableCell>{employee.position.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                          {employee.salary.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(employee.hireDate).toLocaleDateString('th-TH')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              ดูรายละเอียด
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                              <Edit className="mr-2 h-4 w-4" />
                              แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEmployee(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className=\"max-w-4xl max-h-[90vh] overflow-y-auto\">
          <DialogHeader>
            <DialogTitle>รายละเอียดพนักงาน</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeDetail 
              employee={selectedEmployee} 
              onClose={() => setShowDetailDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className=\"max-w-4xl max-h-[90vh] overflow-y-auto\">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลพนักงาน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลพนักงาน {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeForm
              employee={selectedEmployee}
              onSuccess={() => setShowEditDialog(false)}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};