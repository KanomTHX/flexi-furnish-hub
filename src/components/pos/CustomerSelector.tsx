import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Check,
  Star,
  CreditCard
} from 'lucide-react';
import { Customer } from '@/types/pos';
import { useCustomers } from '@/hooks/useCustomers';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer
}) => {
  const { customers, loading, actions } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idCard: '',
    occupation: 'พนักงานบริษัท',
    monthlyIncome: 30000
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCustomer = async () => {
    const validationErrors = validateCustomerData(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const newCustomer = await actions.createCustomer({
        ...formData,
        creditScore: calculateCreditScore(formData.monthlyIncome, formData.occupation),
        totalContracts: 0,
        activeContracts: 0,
        totalFinanced: 0,
        totalPaid: 0,
        overdueAmount: 0,
        lastPaymentDate: new Date(),
        riskLevel: 'low',
        notes: ''
      });

      // Convert to POS Customer format
      const posCustomer: Customer = {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        idCard: newCustomer.idCard,
        occupation: newCustomer.occupation,
        monthlyIncome: newCustomer.monthlyIncome
      };

      onSelectCustomer(posCustomer);
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      setErrors(['เกิดข้อผิดพลาดในการสร้างลูกค้า']);
    }
  };

  const handleSelectCustomer = (customer: any) => {
    // Convert to POS Customer format
    const posCustomer: Customer = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      idCard: customer.idCard,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome
    };

    onSelectCustomer(posCustomer);
    setShowSelectDialog(false);
  };

  const validateCustomerData = (data: any): string[] => {
    const errors = [];
    if (!data.name.trim()) errors.push('ชื่อลูกค้าไม่สามารถเว้นว่างได้');
    if (!data.phone.trim()) errors.push('เบอร์โทรศัพท์ไม่สามารถเว้นว่างได้');
    if (data.monthlyIncome <= 0) errors.push('รายได้ต่อเดือนต้องมากกว่า 0');
    return errors;
  };

  const calculateCreditScore = (income: number, occupation: string): number => {
    let score = 500;
    if (income >= 50000) score += 150;
    else if (income >= 30000) score += 100;
    else if (income >= 20000) score += 50;
    
    const highRiskOccupations = ['ค้าขาย', 'อิสระ'];
    if (!highRiskOccupations.includes(occupation)) score += 50;
    
    return Math.min(850, Math.max(300, score));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      idCard: '',
      occupation: 'พนักงานบริษัท',
      monthlyIncome: 30000
    });
    setErrors([]);
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">ต่ำ</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">ปานกลาง</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">สูง</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Customer Display */}
      {selectedCustomer ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {selectedCustomer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  เลือกแล้ว
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCustomer(null)}
                >
                  เปลี่ยน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">ยังไม่ได้เลือกลูกค้า</p>
              <div className="flex gap-2 justify-center">
                <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      เลือกลูกค้า
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>เลือกลูกค้า</DialogTitle>
                      <DialogDescription>
                        ค้นหาและเลือกลูกค้าจากรายชื่อที่มีอยู่
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาลูกค้า..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-medium text-sm">
                                      {customer.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{customer.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className={`h-3 w-3 ${getCreditScoreColor(customer.creditScore)}`} />
                                    <span className={`text-xs font-medium ${getCreditScoreColor(customer.creditScore)}`}>
                                      {customer.creditScore}
                                    </span>
                                  </div>
                                  {getRiskBadge(customer.riskLevel)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {filteredCustomers.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>ไม่พบลูกค้าที่ค้นหา</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => resetForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มลูกค้าใหม่
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
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
                          <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
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
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="ที่อยู่ลูกค้า"
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
                          <Label htmlFor="monthlyIncome">รายได้ต่อเดือน (บาท)</Label>
                          <Input
                            id="monthlyIncome"
                            type="number"
                            value={formData.monthlyIncome}
                            onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                            placeholder="30000"
                          />
                        </div>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};