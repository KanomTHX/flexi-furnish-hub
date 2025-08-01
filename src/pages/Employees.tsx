import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  Phone,
  User,
  UserCheck,
  UserX
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  branch_id: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  branch_name?: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    employee_code: "",
    full_name: "",
    role: "staff" as const,
    branch_id: "",
    phone: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('employee_profiles')
        .select(`
          *,
          branches(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employeesWithBranch = (data || []).map((emp: any) => ({
        ...emp,
        branch_name: emp.branches?.name || 'ไม่ระบุสาขา'
      }));

      setEmployees(employeesWithBranch);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลพนักงานได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสาขาได้",
        variant: "destructive",
      });
    }
  };

  const handleAddEmployee = async () => {
    try {
      // Check if employee code already exists
      const { data: existing } = await (supabase as any)
        .from('employee_profiles')
        .select('employee_code')
        .eq('employee_code', formData.employee_code)
        .maybeSingle();

      if (existing) {
        toast({
          title: "รหัสพนักงานซ้ำ",
          description: "รหัสพนักงานนี้มีอยู่ในระบบแล้ว",
          variant: "destructive",
        });
        return;
      }

      // Since we don't have user_id for new employees, we'll use a placeholder
      // In a real system, this would be handled during the auth signup process
      const { data, error } = await (supabase as any)
        .from('employee_profiles')
        .insert([{
          user_id: user?.id || '', // This should be handled differently in production
          ...formData,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "เพิ่มพนักงานใหม่เรียบร้อยแล้ว",
      });

      setShowAddDialog(false);
      setFormData({
        employee_code: "",
        full_name: "",
        role: "staff",
        branch_id: "",
        phone: "",
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('employee_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: `${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}พนักงานเรียบร้อยแล้ว`,
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">ผู้ดูแลระบบ</Badge>;
      case 'manager':
        return <Badge variant="secondary">ผู้จัดการ</Badge>;
      default:
        return <Badge variant="outline">พนักงาน</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-success text-success-foreground">
        <UserCheck className="w-3 h-3 mr-1" />
        ใช้งาน
      </Badge>
    ) : (
      <Badge variant="secondary">
        <UserX className="w-3 h-3 mr-1" />
        ปิดใช้งาน
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการพนักงาน</h1>
          <p className="text-muted-foreground">จัดการข้อมูลพนักงานและสิทธิการเข้าถึง</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="admin">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มพนักงาน
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
              <DialogDescription>
                กรุณากรอกข้อมูลพนักงานใหม่
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_code">รหัสพนักงาน</Label>
                <Input
                  id="employee_code"
                  placeholder="EMP001"
                  value={formData.employee_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                <Input
                  id="full_name"
                  placeholder="ชื่อ นามสกุล"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">ตำแหน่ง</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">พนักงาน</SelectItem>
                    <SelectItem value="manager">ผู้จัดการ</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_id">สาขา</Label>
                <Select value={formData.branch_id} onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  placeholder="081-234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddEmployee} className="w-full" variant="admin">
                เพิ่มพนักงาน
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 border-0 shadow-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาพนักงาน รหัส หรือสาขา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">พนักงานทั้งหมด</p>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">พนักงานใช้งาน</p>
                <p className="text-2xl font-bold text-foreground">
                  {employees.filter(emp => emp.is_active).length}
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>รายชื่อพนักงาน</CardTitle>
          <CardDescription>
            พนักงานทั้งหมด {filteredEmployees.length} คน
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{employee.full_name}</h3>
                      {getRoleBadge(employee.role)}
                      {getStatusBadge(employee.is_active)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <span>รหัส: {employee.employee_code}</span>
                        {employee.branch_name && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {employee.branch_name}
                          </span>
                        )}
                        {employee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleEmployeeStatus(employee.id, employee.is_active)}
                    className={employee.is_active ? "text-destructive hover:text-destructive" : "text-success hover:text-success"}
                  >
                    {employee.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบข้อมูลพนักงาน</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}