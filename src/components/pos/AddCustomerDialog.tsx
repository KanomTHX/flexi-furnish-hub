import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThaiAddressSelector } from '@/components/common/ThaiAddressSelector';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Save,
  X
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerType: 'individual' | 'business';
  taxId?: string;
  address: {
    street: string;
    province: string;
    amphure: string;
    tambon: string;
    zipCode: string;
    fullAddress: string;
  };
  notes?: string;
  createdAt: string;
}

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customer: Customer) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    customerType: 'individual' as 'individual' | 'business',
    taxId: '',
    street: '',
    notes: ''
  });

  const [addressData, setAddressData] = useState<{
    province: string;
    amphure: string;
    tambon: string;
    zipCode: string;
    fullAddress: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (address: typeof addressData) => {
    setAddressData(address);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('กรุณากรอกชื่อลูกค้า');
    }

    if (!formData.phone.trim()) {
      errors.push('กรุณากรอกเบอร์โทรศัพท์');
    } else if (!/^[0-9-+().\s]+$/.test(formData.phone)) {
      errors.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    }

    if (formData.customerType === 'business' && !formData.taxId.trim()) {
      errors.push('กรุณากรอกเลขประจำตัวผู้เสียภาษี');
    }

    if (!addressData) {
      errors.push('กรุณาเลือกที่อยู่');
    }

    if (!formData.street.trim()) {
      errors.push('กรุณากรอกที่อยู่ (บ้านเลขที่/ถนน)');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        customerType: formData.customerType,
        taxId: formData.customerType === 'business' ? formData.taxId : undefined,
        address: {
          street: formData.street,
          province: addressData!.province,
          amphure: addressData!.amphure,
          tambon: addressData!.tambon,
          zipCode: addressData!.zipCode,
          fullAddress: `${formData.street} ${addressData!.fullAddress}`
        },
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage (in real app, this would be an API call)
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      existingCustomers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(existingCustomers));

      onCustomerAdded(newCustomer);
      
      toast({
        title: "เพิ่มลูกค้าสำเร็จ",
        description: `ลูกค้า ${newCustomer.name} ถูกเพิ่มในระบบแล้ว`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        customerType: 'individual',
        taxId: '',
        street: '',
        notes: ''
      });
      setAddressData(null);
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มลูกค้าได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      customerType: 'individual',
      taxId: '',
      street: '',
      notes: ''
    });
    setAddressData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            เพิ่มลูกค้าใหม่
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลลูกค้าใหม่เพื่อเพิ่มในระบบ
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              ข้อมูลพื้นฐาน
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              ที่อยู่
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              ข้อมูลเพิ่มเติม
            </TabsTrigger>
          </TabsList>

          {/* ข้อมูลพื้นฐาน */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerType">
                  ประเภทลูกค้า <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(value: 'individual' | 'business') => handleInputChange('customerType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        บุคคลธรรมดา
                      </div>
                    </SelectItem>
                    <SelectItem value="business">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        นิติบุคคล
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {formData.customerType === 'business' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={formData.customerType === 'business' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {formData.customerType === 'business' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="taxId">
                    เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    maxLength={13}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* ที่อยู่ */}
          <TabsContent value="address" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">
                ที่อยู่ (บ้านเลขที่/ถนน) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="เช่น 123/45 ถนนสุขุมวิท"
              />
            </div>

            <ThaiAddressSelector
              onAddressChange={handleAddressChange}
              required={true}
            />
          </TabsContent>

          {/* ข้อมูลเพิ่มเติม */}
          <TabsContent value="additional" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับลูกค้า..."
                rows={4}
              />
            </div>

            {/* แสดงสรุปข้อมูล */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">สรุปข้อมูลลูกค้า</h4>
              <div className="space-y-2 text-sm">
                <div><strong>ประเภท:</strong> {formData.customerType === 'individual' ? 'บุคคลธรรมดา' : 'นิติบุคคล'}</div>
                <div><strong>ชื่อ:</strong> {formData.name || '-'}</div>
                <div><strong>เบอร์โทร:</strong> {formData.phone || '-'}</div>
                <div><strong>อีเมล:</strong> {formData.email || '-'}</div>
                {formData.customerType === 'business' && (
                  <div><strong>เลขประจำตัวผู้เสียภาษี:</strong> {formData.taxId || '-'}</div>
                )}
                <div><strong>ที่อยู่:</strong> {
                  addressData && formData.street 
                    ? `${formData.street} ${addressData.fullAddress}`
                    : '-'
                }</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกลูกค้า'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}