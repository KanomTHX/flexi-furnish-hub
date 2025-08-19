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
  DollarSign,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Check,
  Download,
  RefreshCw,
  Calculator,
  CreditCard,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { PayrollFilters, Payroll } from '@/types/employees';

export const PayrollManagement: React.FC = () => {
  const {
    employees,
    departments,
    payrolls,
    getFilteredPayrolls,
    updatePayroll,
    loading
  } = useEmployees();

  const [filters, setFilters] = useState<PayrollFilters>({});
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const filteredPayrolls = getFilteredPayrolls(filters);

  const handleSearch = (value: string) => {
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

  const handleYearFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      period: {
        ...prev.period,
        year: value === 'all' ? undefined : Number(value)
      }
    }));
  };

  const handleMonthFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      period: {
        ...prev.period,
        month: value === 'all' ? undefined : Number(value)
      }
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'ร่าง', variant: 'secondary' as const },
      calculated: { label: 'คำนวณแล้ว', variant: 'outline' as const },
      approved: { label: 'อนุมัติแล้ว', variant: 'default' as const },
      paid: { label: 'จ่ายแล้ว', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'ไม่พบข้อมูล';
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const handleApprovePayroll = (payrollId: string) => {
    updatePayroll(payrollId, { status: 'approved' });
  };

  const handlePayPayroll = (payrollId: string) => {
    updatePayroll(payrollId, { 
      status: 'paid',
      paidAt: new Date().toISOString()
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getMonthName = (month: number) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month - 1] || '';
  };

  // Calculate summary statistics
  const totalPayrolls = filteredPayrolls.length;
  const draftPayrolls = filteredPayrolls.filter(p => p.status === 'draft').length;
  const approvedPayrolls = filteredPayrolls.filter(p => p.status === 'approved').length;
  const paidPayrolls = filteredPayrolls.filter(p => p.status === 'paid').length;
  const totalAmount = filteredPayrolls.reduce((sum, p) => sum + p.netPay, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">จัดการเงินเดือน</h2>
          <p className="text-muted-foreground">
            จัดการการคำนวณและจ่ายเงินเดือนพนักงาน ({filteredPayrolls.length} รายการ)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button variant="outline" size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            คำนวณเงินเดือน
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                สร้างเงินเดือน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>สร้างเงินเดือน</DialogTitle>
                <DialogDescription>
                  สร้างและคำนวณเงินเดือนสำหรับพนักงาน
                </DialogDescription>
              </DialogHeader>
              {/* Add PayrollForm component here */}
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
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                <p className="text-xl font-bold">{totalPayrolls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-gray-50">
                <Edit className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">ร่าง</p>
                <p className="text-xl font-bold">{draftPayrolls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Check className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">อนุมัติแล้ว</p>
                <p className="text-xl font-bold">{approvedPayrolls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">จ่ายแล้ว</p>
                <p className="text-xl font-bold">{paidPayrolls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">ยอดรวม</p>
                <p className="text-xl font-bold">฿{totalAmount.toLocaleString()}</p>
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

            <Select value={filters.period?.year?.toString() || 'all'} onValueChange={handleYearFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="ปี" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกปี</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.period?.month?.toString() || 'all'} onValueChange={handleMonthFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="เดือน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกเดือน</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
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
                <SelectItem value="draft">ร่าง</SelectItem>
                <SelectItem value="calculated">คำนวณแล้ว</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
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

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการเงินเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลเงินเดือน</h3>
              <p>ไม่มีข้อมูลเงินเดือนที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>งวด</TableHead>
                    <TableHead>เงินเดือนพื้นฐาน</TableHead>
                    <TableHead>ล่วงเวลา</TableHead>
                    <TableHead>โบนัส</TableHead>
                    <TableHead>เงินได้รวม</TableHead>
                    <TableHead>หักภาษี</TableHead>
                    <TableHead>เงินสุทธิ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((payroll) => {
                    const employee = getEmployeeById(payroll.employeeId);
                    return (
                      <TableRow key={payroll.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee?.avatar} />
                              <AvatarFallback>
                                {employee?.firstName?.charAt(0) || ''}{employee?.lastName?.charAt(0) || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getEmployeeName(payroll.employeeId)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee?.employeeId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {getMonthName(payroll.period.month)} {payroll.period.year}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ฿{payroll.baseSalary.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {payroll.overtime > 0 ? (
                            <span className="text-green-600 font-medium">
                              +฿{payroll.overtime.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payroll.bonus > 0 ? (
                            <span className="text-blue-600 font-medium">
                              +฿{payroll.bonus.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ฿{payroll.grossPay.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            -฿{(payroll.tax + payroll.socialSecurity).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-600">
                            ฿{payroll.netPay.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(payroll.status)}</TableCell>
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
                                  setSelectedPayroll(payroll);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                ดูรายละเอียด
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedPayroll(payroll);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                แก้ไข
                              </DropdownMenuItem>
                              {payroll.status === 'calculated' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleApprovePayroll(payroll.id)}
                                    className="text-green-600"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    อนุมัติ
                                  </DropdownMenuItem>
                                </>
                              )}
                              {payroll.status === 'approved' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handlePayPayroll(payroll.id)}
                                    className="text-blue-600"
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    จ่ายเงิน
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

      {/* Payroll Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดเงินเดือน</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getEmployeeById(selectedPayroll.employeeId)?.avatar} />
                  <AvatarFallback>
                    {getEmployeeById(selectedPayroll.employeeId)?.firstName?.charAt(0) || ''}
                    {getEmployeeById(selectedPayroll.employeeId)?.lastName?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {getEmployeeName(selectedPayroll.employeeId)}
                  </h3>
                  <p className="text-muted-foreground">
                    งวด {getMonthName(selectedPayroll.period.month)} {selectedPayroll.period.year}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedPayroll.status)}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Income */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">รายได้</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>เงินเดือนพื้นฐาน</span>
                      <span className="font-medium">฿{selectedPayroll.baseSalary.toLocaleString()}</span>
                    </div>
                    {selectedPayroll.overtime > 0 && (
                      <div className="flex justify-between">
                        <span>ค่าล่วงเวลา</span>
                        <span className="font-medium text-green-600">+฿{selectedPayroll.overtime.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPayroll.bonus > 0 && (
                      <div className="flex justify-between">
                        <span>โบนัส</span>
                        <span className="font-medium text-green-600">+฿{selectedPayroll.bonus.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedPayroll.allowances.map((allowance, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{allowance.name}</span>
                        <span className="font-medium text-green-600">+฿{allowance.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>รวมรายได้</span>
                      <span className="text-green-600">฿{selectedPayroll.grossPay.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Deductions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">รายการหัก</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>ภาษีเงินได้</span>
                      <span className="font-medium text-red-600">-฿{selectedPayroll.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ประกันสังคม</span>
                      <span className="font-medium text-red-600">-฿{selectedPayroll.socialSecurity.toLocaleString()}</span>
                    </div>
                    {selectedPayroll.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{deduction.name}</span>
                        <span className="font-medium text-red-600">-฿{deduction.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>รวมรายการหัก</span>
                      <span className="text-red-600">
                        -฿{(selectedPayroll.tax + selectedPayroll.socialSecurity + 
                          selectedPayroll.deductions.reduce((sum, d) => sum + d.amount, 0)).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Pay */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">เงินสุทธิที่ได้รับ</span>
                    <span className="text-3xl font-bold text-blue-600">
                      ฿{selectedPayroll.netPay.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {selectedPayroll.status === 'calculated' && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      handleApprovePayroll(selectedPayroll.id);
                      setShowDetailDialog(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    อนุมัติเงินเดือน
                  </Button>
                </div>
              )}

              {selectedPayroll.status === 'approved' && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      handlePayPayroll(selectedPayroll.id);
                      setShowDetailDialog(false);
                    }}
                    className="flex-1"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    จ่ายเงินเดือน
                  </Button>
                </div>
              )}

              {selectedPayroll.paidAt && (
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  จ่ายเงินเมื่อ: {new Date(selectedPayroll.paidAt).toLocaleDateString('th-TH')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};