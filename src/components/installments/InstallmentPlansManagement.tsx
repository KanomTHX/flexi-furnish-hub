import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InstallmentPlan {
  id: string;
  name: string;
  number_of_installments: number;
  interest_rate: number;
  down_payment_percent: number;
  processing_fee: number;
  min_amount: number;
  max_amount: number;
  requires_guarantor: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface InstallmentPlansManagementProps {
  branchId?: string;
}

export function InstallmentPlansManagement({ branchId }: InstallmentPlansManagementProps) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InstallmentPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number_of_installments: 12,
    interest_rate: 0,
    down_payment_percent: 0,
    processing_fee: 0,
    min_amount: 0,
    max_amount: 0,
    requires_guarantor: false,
    is_active: true,
    description: ''
  });
  const { toast } = useToast();

  // โหลดข้อมูลแผนผ่อนชำระ
  const loadPlans = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('installment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลแผนผ่อนชำระได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [branchId]);

  // กรองข้อมูลตามคำค้นหา
  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setFormData({
      name: '',
      number_of_installments: 12,
      interest_rate: 0,
      down_payment_percent: 0,
      processing_fee: 0,
      min_amount: 0,
      max_amount: 0,
      requires_guarantor: false,
      is_active: true,
      description: ''
    });
    setEditingPlan(null);
  };

  // เปิดฟอร์มแก้ไข
  const openEditForm = (plan: InstallmentPlan) => {
    setFormData({
      name: plan.name,
      number_of_installments: plan.number_of_installments,
      interest_rate: plan.interest_rate,
      down_payment_percent: plan.down_payment_percent,
      processing_fee: plan.processing_fee,
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
      requires_guarantor: plan.requires_guarantor,
      is_active: plan.is_active,
      description: plan.description || ''
    });
    setEditingPlan(plan);
    setIsCreateDialogOpen(true);
  };

  // บันทึกแผนใหม่หรือแก้ไข
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'ข้อมูลไม่ครบถ้วน',
          description: 'กรุณากรอกชื่อแผน',
          variant: 'destructive'
        });
        return;
      }

      const planData = {
        ...formData,
        branch_id: branchId || null,
        updated_at: new Date().toISOString()
      };

      if (editingPlan) {
        // แก้ไขแผน - คำนวณ installment_amount ใหม่
        const totalAmount = formData.max_amount || 100000;
        const downPayment = (totalAmount * formData.down_payment_percent) / 100;
        const loanAmount = totalAmount - downPayment;
        const monthlyInterestRate = formData.interest_rate / 100 / 12;
        
        let installmentAmount;
        if (formData.interest_rate === 0) {
          installmentAmount = loanAmount / formData.number_of_installments;
        } else {
          installmentAmount = loanAmount * 
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, formData.number_of_installments)) /
            (Math.pow(1 + monthlyInterestRate, formData.number_of_installments) - 1);
        }
        
        const updatedPlanData = {
          ...planData,
          total_amount: totalAmount,
          installment_amount: Math.round(installmentAmount * 100) / 100,
          number_of_installments: formData.number_of_installments
        };
        
        const { error } = await supabase
          .from('installment_plans')
          .update(updatedPlanData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: 'สำเร็จ',
          description: 'แก้ไขแผนผ่อนชำระเรียบร้อยแล้ว'
        });
      } else {
        // สร้างแผนใหม่
        // คำนวณ installment_amount (ยอดผ่อนต่องวด)
        const totalAmount = formData.max_amount || 100000; // ใช้ max_amount เป็นยอดเริ่มต้น
        const downPayment = (totalAmount * formData.down_payment_percent) / 100;
        const loanAmount = totalAmount - downPayment;
        const monthlyInterestRate = formData.interest_rate / 100 / 12;
        
        let installmentAmount;
        if (formData.interest_rate === 0) {
          // ไม่มีดอกเบี้ย
          installmentAmount = loanAmount / formData.number_of_installments;
        } else {
          // มีดอกเบี้ย - ใช้สูตรการคำนวณผ่อนชำระ
          installmentAmount = loanAmount * 
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, formData.number_of_installments)) /
            (Math.pow(1 + monthlyInterestRate, formData.number_of_installments) - 1);
        }
        
        const { error } = await supabase
          .from('installment_plans')
          .insert([{
            ...planData,
            plan_number: `PLAN-${Date.now()}`,
            total_amount: totalAmount,
            installment_amount: Math.round(installmentAmount * 100) / 100, // ปัดเศษ 2 ตำแหน่ง
            number_of_installments: formData.number_of_installments,
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast({
          title: 'สำเร็จ',
          description: 'สร้างแผนผ่อนชำระใหม่เรียบร้อยแล้ว'
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive'
      });
    }
  };

  // ลบแผน
  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('installment_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: 'ลบแผนผ่อนชำระเรียบร้อยแล้ว'
      });

      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบแผนได้',
        variant: 'destructive'
      });
    }
  };

  // เปลี่ยนสถานะการใช้งาน
  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('installment_plans')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'สำเร็จ',
        description: `${isActive ? 'เปิด' : 'ปิด'}การใช้งานแผนเรียบร้อยแล้ว`
      });

      loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเปลี่ยนสถานะได้',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">จัดการแผนผ่อนชำระ</h2>
          <p className="text-muted-foreground">
            สร้าง แก้ไข และจัดการแผนผ่อนชำระสำหรับลูกค้า
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadPlans}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                สร้างแผนใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'แก้ไขแผนผ่อนชำระ' : 'สร้างแผนผ่อนชำระใหม่'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label htmlFor="name">ชื่อแผน *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น แผนพิเศษ 12 งวด"
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_installments">จำนวนงวด *</Label>
                  <Input
                    id="number_of_installments"
                    type="number"
                    value={formData.number_of_installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, number_of_installments: parseInt(e.target.value) || 12 }))}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <Label htmlFor="interest_rate">ดอกเบี้ย (% ต่อปี)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="down_payment_percent">เงินดาวน์ (%)</Label>
                  <Input
                    id="down_payment_percent"
                    type="number"
                    step="0.01"
                    value={formData.down_payment_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, down_payment_percent: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="processing_fee">ค่าธรรมเนียม (บาท)</Label>
                  <Input
                    id="processing_fee"
                    type="number"
                    value={formData.processing_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, processing_fee: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="min_amount">ยอดขั้นต่ำ (บาท)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max_amount">ยอดสูงสุด (บาท)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    value={formData.max_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="รายละเอียดเพิ่มเติมของแผน"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_guarantor"
                    checked={formData.requires_guarantor}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_guarantor: checked }))}
                  />
                  <Label htmlFor="requires_guarantor">ต้องมีผู้ค้ำประกัน</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">เปิดใช้งาน</Label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleSave}>
                  {editingPlan ? 'บันทึกการแก้ไข' : 'สร้างแผน'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ค้นหาแผนผ่อนชำระ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          ทั้งหมด {filteredPlans.length} แผน
        </Badge>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            รายการแผนผ่อนชำระ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'ไม่พบแผนที่ค้นหา' : 'ยังไม่มีแผนผ่อนชำระ'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อแผน</TableHead>
                    <TableHead>จำนวนงวด</TableHead>
                    <TableHead>ดอกเบี้ย (%)</TableHead>
                    <TableHead>เงินดาวน์ (%)</TableHead>
                    <TableHead>ค่าธรรมเนียม</TableHead>
                    <TableHead>ยอดขั้นต่ำ-สูงสุด</TableHead>
                    <TableHead>ผู้ค้ำ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          {plan.description && (
                            <div className="text-sm text-muted-foreground">
                              {plan.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{plan.number_of_installments} งวด</TableCell>
                      <TableCell>{plan.interest_rate}%</TableCell>
                      <TableCell>{plan.down_payment_percent}%</TableCell>
                      <TableCell>฿{plan.processing_fee?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        ฿{plan.min_amount?.toLocaleString() || 0} - ฿{plan.max_amount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        {plan.requires_guarantor ? (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ต้องมี
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ไม่ต้องมี
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                            size="sm"
                          />
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />เปิดใช้งาน</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />ปิดใช้งาน</>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                                <AlertDialogDescription>
                                  คุณแน่ใจหรือไม่ที่จะลบแผน "{plan.name}"? 
                                  การดำเนินการนี้ไม่สามารถยกเลิกได้
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(plan.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  ลบแผน
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}