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
  Calendar,
  Plus,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Download,
  RefreshCw,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { LeaveFilters, Leave } from '@/types/employees';

export const LeaveManagement: React.FC = () => {
  const {
    employees,
    leaves,
    getFilteredLeaves,
    approveLeave,
    rejectLeave,
    loading
  } = useEmployees();

  const [filters, setFilters] = useState<LeaveFilters>({});
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filteredLeaves = getFilteredLeaves(filters);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      type: value === 'all' ? undefined : value as any
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

  const getLeaveTypeBadge = (type: string) => {
    const typeConfig = {
      annual: { label: 'ลาพักร้อน', variant: 'default' as const },
      sick: { label: 'ลาป่วย', variant: 'secondary' as const },
      maternity: { label: 'ลาคลอด', variant: 'outline' as const },
      paternity: { label: 'ลาบิดา', variant: 'outline' as const },
      emergency: { label: 'ลาฉุกเฉิน', variant: 'destructive' as const },
      unpaid: { label: 'ลาไม่รับเงิน', variant: 'secondary' as const },
      study: { label: 'ลาเรียน', variant: 'outline' as const },
      other: { label: 'อื่นๆ', variant: 'secondary' as const }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'รอพิจารณา', variant: 'secondary' as const },
      approved: { label: 'อนุมัติ', variant: 'default' as const },
      rejected: { label: 'ไม่อนุมัติ', variant: 'destructive' as const },
      cancelled: { label: 'ยกเลิก', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'ไม่พบข้อมูล';
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const handleApprove = (leaveId: string) => {
    approveLeave(leaveId, 'current-user'); // In real app, get current user ID
  };

  const handleReject = (leaveId: string, reason: string) => {
    rejectLeave(leaveId, reason);
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Calculate summary statistics
  const totalLeaves = filteredLeaves.length;
  const pendingLeaves = filteredLeaves.filter(leave => leave.status === 'pending').length;
  const approvedLeaves = filteredLeaves.filter(leave => leave.status === 'approved').length;
  const rejectedLeaves = filteredLeaves.filter(leave => leave.status === 'rejected').length;
  const totalDays = filteredLeaves.reduce((sum, leave) => sum + leave.days, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการการลา</h2>
          <p className="text-muted-foreground">
            จัดการคำขอลาและอนุมัติการลาของพนักงาน ({filteredLeaves.length} รายการ)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                ขอลา
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ขอลา</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการขอลาของพนักงาน
                </DialogDescription>
              </DialogHeader>
              {/* Add LeaveForm component here */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                <p className="text-xl font-bold">{totalLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">รอพิจารณา</p>
                <p className="text-xl font-bold">{pendingLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">อนุมัติ</p>
                <p className="text-xl font-bold">{approvedLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-50">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">ไม่อนุมัติ</p>
                <p className="text-xl font-bold">{rejectedLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">รวมวันลา</p>
                <p className="text-xl font-bold">{totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาพนักงาน"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filters.type || 'all'} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ประเภทการลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="annual">ลาพักร้อน</SelectItem>
                <SelectItem value="sick">ลาป่วย</SelectItem>
                <SelectItem value="maternity">ลาคลอด</SelectItem>
                <SelectItem value="paternity">ลาบิดา</SelectItem>
                <SelectItem value="emergency">ลาฉุกเฉิน</SelectItem>
                <SelectItem value="unpaid">ลาไม่รับเงิน</SelectItem>
                <SelectItem value="study">ลาเรียน</SelectItem>
                <SelectItem value="other">อื่นๆ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอพิจารณา</SelectItem>
                <SelectItem value="approved">อนุมัติ</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={filters.date?.start || ''}
                onChange={(e) => handleDateFilter('start', e.target.value)}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">ถึง</span>
              <Input
                type="date"
                value={filters.date?.end || ''}
                onChange={(e) => handleDateFilter('end', e.target.value)}
                className="w-[140px]"
              />
            </div>

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

      {/* Leave Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการขอลา</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลการลา</h3>
              <p>ไม่มีข้อมูลการลาที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภทการลา</TableHead>
                    <TableHead>วันที่เริ่ม</TableHead>
                    <TableHead>วันที่สิ้นสุด</TableHead>
                    <TableHead>จำนวนวัน</TableHead>
                    <TableHead>เหตุผล</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่ขอ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => {
                    const employee = getEmployeeById(leave.employeeId);
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee?.avatar} />
                              <AvatarFallback>
                                {employee?.firstName.charAt(0)}{employee?.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getEmployeeName(leave.employeeId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee?.employeeId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getLeaveTypeBadge(leave.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {new Date(leave.startDate).toLocaleDateString('th-TH')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {new Date(leave.endDate).toLocaleDateString('th-TH')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{leave.days} วัน</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" title={leave.reason}>
                            {leave.reason.length > 30 
                              ? `${leave.reason.substring(0, 30)}...` 
                              : leave.reason
                            }
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(leave.appliedAt).toLocaleDateString('th-TH')}
                          </span>
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
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                ดูรายละเอียด
                              </DropdownMenuItem>
                              {leave.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleApprove(leave.id)}
                                    className="text-green-600"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    อนุมัติ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติ:');
                                      if (reason) {
                                        handleReject(leave.id, reason);
                                      }
                                    }}
                                    className="text-red-600"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    ไม่อนุมัติ
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการลา</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">พนักงาน</label>
                  <p className="font-medium">{getEmployeeName(selectedLeave.employeeId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ประเภทการลา</label>
                  <div className="mt-1">{getLeaveTypeBadge(selectedLeave.type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">วันที่เริ่ม</label>
                  <p className="font-medium">{new Date(selectedLeave.startDate).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">วันที่สิ้นสุด</label>
                  <p className="font-medium">{new Date(selectedLeave.endDate).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">จำนวนวัน</label>
                  <p className="font-medium">{selectedLeave.days} วัน</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                  <div className="mt-1">{getStatusBadge(selectedLeave.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">เหตุผลการลา</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLeave.reason}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">วันที่ขอลา</label>
                <p className="font-medium">{new Date(selectedLeave.appliedAt).toLocaleDateString('th-TH')}</p>
              </div>

              {selectedLeave.approvedBy && selectedLeave.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">อนุมัติโดย</label>
                  <p className="font-medium">
                    {selectedLeave.approvedBy} - {new Date(selectedLeave.approvedAt).toLocaleDateString('th-TH')}
                  </p>
                </div>
              )}

              {selectedLeave.rejectedReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">เหตุผลที่ไม่อนุมัติ</label>
                  <p className="mt-1 p-3 bg-red-50 rounded-lg text-red-800">{selectedLeave.rejectedReason}</p>
                </div>
              )}

              {selectedLeave.status === 'pending' && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      handleApprove(selectedLeave.id);
                      setShowDetailDialog(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    อนุมัติ
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติ:');
                      if (reason) {
                        handleReject(selectedLeave.id, reason);
                        setShowDetailDialog(false);
                      }
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};