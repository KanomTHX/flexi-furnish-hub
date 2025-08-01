import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar
} from 'lucide-react';
import { Customer } from '@/types/pos';

interface CustomerData extends Customer {
  creditScore: number;
  totalContracts: number;
  activeContracts: number;
  totalFinanced: number;
  totalPaid: number;
  overdueAmount: number;
  lastPaymentDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  customerSince: Date;
  notes: string;
}

interface CustomerManagementProps {
  customers: CustomerData[];
  onCreateCustomer: (customer: Omit<CustomerData, 'id' | 'customerSince'>) => Promise<void>;
  onUpdateCustomer: (customerId: string, customer: Partial<CustomerData>) => Promise<void>;
  onViewCustomer: (customerId: string) => void;
  loading: boolean;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onCreateCustomer,
  onUpdateCustomer,
  onViewCustomer,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idCard: '',
    occupation: '',
    monthlyIncome: 0,
    notes: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.idCard.includes(searchTerm);
    
    const matchesRisk = riskFilter === 'all' || customer.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && customer.activeContracts > 0) ||
      (statusFilter === 'inactive' && customer.activeContracts === 0) ||
      (statusFilter === 'overdue' && customer.overdueAmount > 0);
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const handleCreateCustomer = async () => {
    const validationErrors = validateCustomerData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onCreateCustomer({
        ...formData,
        creditScore: calculateCreditScore(formData.monthlyIncome, formData.occupation),
        totalContracts: 0,
        activeContracts: 0,
        totalFinanced: 0,
        totalPaid: 0,
        overdueAmount: 0,
        lastPaymentDate: new Date(),
        riskLevel: 'low'
      });
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      setErrors(['เกิดข้อผิดพลาดในการสร้างลูกค้า']);
    }
  };

  const handleEditCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      idCard: customer.idCard,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome,
      notes: customer.notes
    });
    setShowEditDialog(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    const validationErrors = validateCustomerData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onUpdateCustomer(selectedCustomer.id, {
        ...formData,
        creditScore: calculateCreditScore(formData.monthlyIncome, formData.occupation)
      });
      setShowEditDialog(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (error) {
      setErrors(['เกิดข้อผิดพลาดในการอัปเดตลูกค้า']);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      idCard: '',
      occupation: '',
      monthlyIncome: 0,
      notes: ''
    });
    setErrors([]);
  };

  const validateCustomerData = (data: any): string[] => {
    const errors = [];
    if (!data.name.trim()) errors.push('ชื่อลูกค้าไม่สามารถเว้นว่างได้');
    if (!data.phone.trim()) errors.push('เบอร์โทรศัพท์ไม่สามารถเว้นว่างได้');
    if (!data.idCard.trim()) errors.push('เลขบัตรประชาชนไม่สามารถเว้นว่างได้');
    if (data.monthlyIncome <= 0) errors.push('รายได้ต่อเดือนต้องมากกว่า 0');
    return errors;
  };

  const calculateCreditScore = (income: number, occupation: string): number => {
    let score = 500; // Base score
    
    // Income factor
    if (income >= 50000) score += 150;
    else if (income >= 30000) score += 100;
    else if (income >= 20000) score += 50;
    
    // Occupation factor
    const highRiskOccupations = ['ค้าขาย', 'อิสระ'];
    if (!highRiskOccupations.includes(occupation)) score += 50;
    
    return Math.min(850, Math.max(300, score));
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800">ความเสี่ยงต่ำ</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ความเสี่ยงปานกลาง</Badge>;
      case 'high':
        return <Badge variant="destructive">ความเสี่ยงสูง</Badge>;
      default:
        return null;
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.activeContracts > 0).length,
    overdue: customers.filter(c => c.overdueAmount > 0).length,
    highRisk: customers.filter(c => c.riskLevel === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">จัดการลูกค้า</h2>
          <p className="text-muted-foreground">
            จัดการข้อมูลลูกค้า ประเมินความเสี่ยง และติดตามประวัติการชำระ
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลลูกค้าใหม่ที่ต้องการเพิ่มเข้าระบบ
              </DialogDescription>
            </DialogHeader>
            
            {errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <ul className="text-sm text-red-800 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="081-234-5678"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="idCard">เลขบัตรประชาชน *</Label>
                  <Input
                    id="idCard"
                    value={formData.idCard}
                    onChange={(e) => setFormData(prev => ({ ...prev, idCard: e.target.value }))}
                    placeholder="1-2345-67890-12-3"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ที่อยู่ลูกค้า"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupation">อาชีพ</Label>
                  <Select value={formData.occupation} onValueChange={(value) => setFormData(prev => ({ ...prev, occupation: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกอาชีพ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="พนักงานบริษัท">พนักงานบริษัท</SelectItem>
                      <SelectItem value="ข้าราชการ">ข้าราชการ</SelectItem>
                      <SelectItem value="ค้าขาย">ค้าขาย</SelectItem>
                      <SelectItem value="อิสระ">อิสระ</SelectItem>
                      <SelectItem value="เกษตรกร">เกษตรกร</SelectItem>
                      <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monthlyIncome">รายได้ต่อเดือน (บาท) *</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={formData.monthlyIncome}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                    placeholder="30000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreateCustomer} disabled={loading}>
                {loading ? 'กำลังสร้าง...' : 'สร้างลูกค้า'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{customerStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">มีสัญญาใช้งาน</p>
                <p className="text-2xl font-bold text-green-600">{customerStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ค้างชำระ</p>
                <p className="text-2xl font-bold text-red-600">{customerStats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ความเสี่ยงสูง</p>
                <p className="text-2xl font-bold text-orange-600">{customerStats.highRisk}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ความเสี่ยง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="low">ความเสี่ยงต่ำ</SelectItem>
                <SelectItem value="medium">ความเสี่ยงปานกลาง</SelectItem>
                <SelectItem value="high">ความเสี่ยงสูง</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">มีสัญญาใช้งาน</SelectItem>
                <SelectItem value="inactive">ไม่มีสัญญา</SelectItem>
                <SelectItem value="overdue">ค้างชำระ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อลูกค้า ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">ลูกค้า</th>
                  <th className="text-left py-3 px-4">คะแนนเครดิต</th>
                  <th className="text-left py-3 px-4">สัญญา</th>
                  <th className="text-left py-3 px-4">ยอดรวม</th>
                  <th className="text-left py-3 px-4">ความเสี่ยง</th>
                  <th className="text-right py-3 px-4">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Star className={`h-4 w-4 ${getCreditScoreColor(customer.creditScore)}`} />
                        <span className={`font-medium ${getCreditScoreColor(customer.creditScore)}`}>
                          {customer.creditScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="font-medium">{customer.activeContracts} ใช้งาน</p>
                        <p className="text-muted-foreground">
                          รวม {customer.totalContracts} สัญญา
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="font-medium">
                          ฿{customer.totalFinanced.toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">
                          จ่ายแล้ว ฿{customer.totalPaid.toLocaleString()}
                        </p>
                        {customer.overdueAmount > 0 && (
                          <p className="text-red-600">
                            ค้าง ฿{customer.overdueAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getRiskBadge(customer.riskLevel)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewCustomer(customer.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลลูกค้า {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">ชื่อ-นามสกุล *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPhone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editEmail">อีเมล</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editIdCard">เลขบัตรประชาชน *</Label>
                <Input
                  id="editIdCard"
                  value={formData.idCard}
                  onChange={(e) => setFormData(prev => ({ ...prev, idCard: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editAddress">ที่อยู่</Label>
              <Textarea
                id="editAddress"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editOccupation">อาชีพ</Label>
                <Select value={formData.occupation} onValueChange={(value) => setFormData(prev => ({ ...prev, occupation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกอาชีพ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="พนักงานบริษัท">พนักงานบริษัท</SelectItem>
                    <SelectItem value="ข้าราชการ">ข้าราชการ</SelectItem>
                    <SelectItem value="ค้าขาย">ค้าขาย</SelectItem>
                    <SelectItem value="อิสระ">อิสระ</SelectItem>
                    <SelectItem value="เกษตรกร">เกษตรกร</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editMonthlyIncome">รายได้ต่อเดือน (บาท) *</Label>
                <Input
                  id="editMonthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editNotes">หมายเหตุ</Label>
              <Textarea
                id="editNotes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={loading}>
              {loading ? 'กำลังอัปเดต...' : 'อัปเดต'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};