import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  Calendar,
  Users,
  TrendingUp,
  MapPin,
  Phone
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'on-break';
  location?: string;
  profileImage?: string;
}

interface EmployeeCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeCheckDialog({ open, onOpenChange }: EmployeeCheckDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock employee data
  const [employees] = useState<Employee[]>([
    {
      id: '1',
      name: 'สมชาย ใจดี',
      position: 'Sales Manager',
      department: 'Sales',
      phone: '081-234-5678',
      checkInTime: '08:30',
      status: 'present',
      location: 'Floor 1 - Sales Area'
    },
    {
      id: '2',
      name: 'สมหญิง รักงาน',
      position: 'Cashier',
      department: 'POS',
      phone: '081-345-6789',
      checkInTime: '08:45',
      status: 'present',
      location: 'Floor 1 - Cashier Counter'
    },
    {
      id: '3',
      name: 'วิชัย ขยัน',
      position: 'Stock Manager',
      department: 'Warehouse',
      phone: '081-456-7890',
      checkInTime: '09:15',
      status: 'late',
      location: 'Warehouse'
    },
    {
      id: '4',
      name: 'มาลี สวยงาม',
      position: 'Customer Service',
      department: 'Service',
      phone: '081-567-8901',
      checkInTime: '08:25',
      checkOutTime: '12:00',
      status: 'on-break',
      location: 'Floor 2 - Service Desk'
    },
    {
      id: '5',
      name: 'สุรชัย มาสาย',
      position: 'Delivery',
      department: 'Logistics',
      phone: '081-678-9012',
      status: 'absent'
    },
    {
      id: '6',
      name: 'นิดา ตั้งใจ',
      position: 'Accountant',
      department: 'Finance',
      phone: '081-789-0123',
      checkInTime: '08:00',
      status: 'present',
      location: 'Floor 2 - Finance Office'
    }
  ]);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">มาแล้ว</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">มาสาย</Badge>;
      case 'on-break':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">พักเบรก</Badge>;
      case 'absent':
        return <Badge variant="destructive">ขาดงาน</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getStatusIcon = (status: Employee['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'on-break':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const stats = {
    total: employees.length,
    present: employees.filter(e => e.status === 'present').length,
    late: employees.filter(e => e.status === 'late').length,
    absent: employees.filter(e => e.status === 'absent').length,
    onBreak: employees.filter(e => e.status === 'on-break').length
  };

  const handleMarkAttendance = (employeeId: string, status: Employee['status']) => {
    toast({
      title: "อัปเดตการเข้างาน",
      description: `อัปเดตสถานะการเข้างานของพนักงานแล้ว`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Employee Check - การตรวจสอบพนักงาน
          </DialogTitle>
          <DialogDescription>
            ตรวจสอบการเข้างาน สถานะ และตำแหน่งของพนักงานวันนี้
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ภาพรวม
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              รายชื่อพนักงาน
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              ตารางงาน
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">พนักงานทั้งหมด</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-muted-foreground">มาแล้ว</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                  <div className="text-sm text-muted-foreground">มาสาย</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.onBreak}</div>
                  <div className="text-sm text-muted-foreground">พักเบรก</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <div className="text-sm text-muted-foreground">ขาดงาน</div>
                </CardContent>
              </Card>
            </div>

            {/* Department Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สรุปตามแผนก</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Sales', 'POS', 'Warehouse', 'Service', 'Logistics', 'Finance'].map(dept => {
                    const deptEmployees = employees.filter(e => e.department === dept);
                    const presentCount = deptEmployees.filter(e => e.status === 'present').length;
                    return (
                      <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{dept}</div>
                          <div className="text-sm text-muted-foreground">
                            {presentCount}/{deptEmployees.length} คน
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {deptEmployees.length > 0 ? Math.round((presentCount / deptEmployees.length) * 100) : 0}%
                          </div>
                          <div className="text-xs text-muted-foreground">เข้างาน</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาพนักงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Employee List */}
            <div className="space-y-3">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-lg">
                            {employee.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-lg">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.position} • {employee.department}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {employee.phone}
                            </span>
                            {employee.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {employee.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(employee.status)}
                          {getStatusBadge(employee.status)}
                        </div>
                        
                        {employee.checkInTime && (
                          <div className="text-sm text-muted-foreground">
                            เข้างาน: {employee.checkInTime}
                          </div>
                        )}
                        
                        {employee.checkOutTime && (
                          <div className="text-sm text-muted-foreground">
                            ออกงาน: {employee.checkOutTime}
                          </div>
                        )}
                        
                        {employee.status === 'absent' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAttendance(employee.id, 'present')}
                            className="mt-2"
                          >
                            ทำเครื่องหมายมา
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ตารางงานวันนี้</CardTitle>
                <div className="text-sm text-muted-foreground">
                  วันที่: {new Date().toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">กะเช้า (08:00 - 16:00)</h4>
                      <div className="space-y-1">
                        {employees.filter(e => ['1', '2', '4', '6'].includes(e.id)).map(emp => (
                          <div key={emp.id} className="flex items-center justify-between text-sm">
                            <span>{emp.name}</span>
                            {getStatusIcon(emp.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">กะบ่าย (16:00 - 24:00)</h4>
                      <div className="space-y-1">
                        {employees.filter(e => ['3', '5'].includes(e.id)).map(emp => (
                          <div key={emp.id} className="flex items-center justify-between text-sm">
                            <span>{emp.name}</span>
                            {getStatusIcon(emp.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">การแจ้งเตือน</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span>วิชัย ขยัน มาสาย 15 นาที</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>สุรชัย มาสาย ยังไม่เข้างาน</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}