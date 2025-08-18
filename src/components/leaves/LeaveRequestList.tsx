import React, { useState, useMemo } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Eye, FileText } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Leave, LeaveStatus } from '@/types/employees';

interface LeaveRequestListProps {
  employeeId?: string; // ถ้าไม่ระบุจะแสดงทั้งหมด
  showActions?: boolean; // แสดงปุ่มอนุมัติ/ปฏิเสธ
  status?: LeaveStatus; // กรองตามสถานะ
}

interface Filters {
  search?: string;
  status?: string;
  type?: string;
}

export const LeaveRequestList: React.FC<LeaveRequestListProps> = ({ 
  employeeId, 
  showActions = false,
  status 
}) => {
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: status || 'all',
    type: 'all'
  });
  
  const { 
    getLeaveRequests, 
    approveLeaveRequest, 
    rejectLeaveRequest, 
    isLoading, 
    error,
    employees 
  } = useEmployees();
  
  const getEmployeeById = (id: string) => employees.find(emp => emp.id === id);
  
  // ข้อมูลคำขอลาที่กรองแล้ว
  const filteredRequests = useMemo(() => {
    let requests = getLeaveRequests();
    
    if (employeeId) {
      requests = requests.filter(req => req.employeeId === employeeId);
    }
    
    if (filters.search) {
      requests = requests.filter(req => {
        const employee = employees.find(emp => emp.id === req.employeeId);
        const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';
        return employeeName.toLowerCase().includes(filters.search!.toLowerCase()) ||
               req.reason.toLowerCase().includes(filters.search!.toLowerCase());
      });
    }
    
    if (filters.status && filters.status !== 'all') {
      requests = requests.filter(req => req.status === filters.status);
    }
    
    if (filters.type && filters.type !== 'all') {
      requests = requests.filter(req => req.type === filters.type);
    }
    
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getLeaveRequests, employeeId, filters, employees]);

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />รอพิจารณา</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />อนุมัติ</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />ปฏิเสธ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      sick: 'ลาป่วย',
      personal: 'ลากิจ',
      vacation: 'ลาพักร้อน',
      maternity: 'ลาคลอด',
      emergency: 'ลาฉุกเฉิน'
    };
    return types[type] || type;
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await approveLeaveRequest(leaveId, approvalNote || undefined);
      setIsDialogOpen(false);
      setApprovalNote('');
      setSelectedLeave(null);
    } catch (error) {
      console.error('Failed to approve leave request:', error);
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await rejectLeaveRequest(leaveId, approvalNote || undefined);
      setIsDialogOpen(false);
      setApprovalNote('');
      setSelectedLeave(null);
    } catch (error) {
      console.error('Failed to reject leave request:', error);
    }
  };

  const openApprovalDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setApprovalNote('');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ไม่มีคำขอลา</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ตัวกรองข้อมูล */}
      {!employeeId && (
        <Card>
          <CardHeader>
            <CardTitle>ตัวกรองข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="ค้นหาชื่อพนักงานหรือเหตุผล..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <div>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="pending">รอพิจารณา</SelectItem>
                    <SelectItem value="approved">อนุมัติ</SelectItem>
                    <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ประเภทการลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="sick">ลาป่วย</SelectItem>
                    <SelectItem value="personal">ลากิจ</SelectItem>
                    <SelectItem value="vacation">ลาพักร้อน</SelectItem>
                    <SelectItem value="maternity">ลาคลอด</SelectItem>
                    <SelectItem value="emergency">ลาฉุกเฉิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {filteredRequests.map((leave) => {
        const employee = getEmployeeById(leave.employeeId);
        const days = calculateDays(leave.startDate, leave.endDate);
        
        return (
          <Card key={leave.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  {/* ข้อมูลพนักงาน */}
                  {!employeeId && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {employee?.firstName} {employee?.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({employee?.position})
                      </span>
                    </div>
                  )}
                  
                  {/* ประเภทและวันที่ลา */}
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {getLeaveTypeLabel(leave.type)}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(leave.startDate), 'd MMM', { locale: th })} - 
                      {format(new Date(leave.endDate), 'd MMM yyyy', { locale: th })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {days} วัน
                    </div>
                  </div>
                  
                  {/* เหตุผล */}
                  <p className="text-sm">{leave.reason}</p>
                  
                  {/* หมายเหตุ */}
                  {leave.description && (
                    <p className="text-xs text-muted-foreground">
                      หมายเหตุ: {leave.description}
                    </p>
                  )}
                  
                  {/* หมายเหตุการอนุมัติ */}
                  {leave.approvalNotes && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <strong>หมายเหตุจากผู้อนุมัติ:</strong> {leave.approvalNotes}
                    </div>
                  )}
                  
                  {/* วันที่ส่งคำขอ */}
                  <p className="text-xs text-muted-foreground">
                    ส่งคำขอเมื่อ: {format(new Date(leave.createdAt), 'd MMM yyyy HH:mm', { locale: th })}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {/* สถานะ */}
                  {getStatusBadge(leave.status)}
                  
                  {/* ปุ่มดำเนินการ */}
                  {showActions && leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openApprovalDialog(leave)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        พิจารณา
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Dialog สำหรับอนุมัติ/ปฏิเสธ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>พิจารณาคำขอลา</DialogTitle>
          </DialogHeader>
          
          {selectedLeave && (
            <div className="space-y-4">
              {/* ข้อมูลคำขอ */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="font-medium">
                  {getEmployeeById(selectedLeave.employeeId)?.firstName} {getEmployeeById(selectedLeave.employeeId)?.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getLeaveTypeLabel(selectedLeave.type)} • 
                  {format(new Date(selectedLeave.startDate), 'd MMM', { locale: th })} - 
                  {format(new Date(selectedLeave.endDate), 'd MMM yyyy', { locale: th })} • 
                  {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} วัน
                </div>
                <div className="text-sm">
                  <strong>เหตุผล:</strong> {selectedLeave.reason}
                </div>
                {selectedLeave.description && (
                  <div className="text-sm">
                    <strong>หมายเหตุ:</strong> {selectedLeave.description}
                  </div>
                )}
              </div>
              
              {/* หมายเหตุการอนุมัติ */}
              <div className="space-y-2">
                <Label htmlFor="approvalNote">หมายเหตุ (ถ้ามี)</Label>
                <Textarea
                  id="approvalNote"
                  placeholder="หมายเหตุเพิ่มเติมสำหรับการอนุมัติหรือปฏิเสธ"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  rows={3}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* ปุ่มดำเนินการ */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(selectedLeave.id)}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </Button>
                <Button
                  onClick={() => handleReject(selectedLeave.id)}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};