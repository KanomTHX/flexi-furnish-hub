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
  X,
  Shield
} from 'lucide-react';

interface GuarantorData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  idCard: string;
  occupation: string;
  monthlyIncome: number;
  relationship: string;
  workplace?: string;
  workAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

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
  guarantor?: GuarantorData;
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

  // Guarantor form state
  const [guarantorData, setGuarantorData] = useState<GuarantorData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    idCard: '',
    occupation: '',
    monthlyIncome: 0,
    relationship: '',
    workplace: '',
    workAddress: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [guarantorAddressData, setGuarantorAddressData] = useState<{
    province: string;
    amphure: string;
    tambon: string;
    zipCode: string;
    fullAddress: string;
  } | null>(null);

  const [hasGuarantor, setHasGuarantor] = useState(false);

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

  const handleGuarantorChange = (field: string, value: string | number) => {
    setGuarantorData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGuarantorAddressChange = (address: typeof guarantorAddressData) => {
    setGuarantorAddressData(address);
  };

  const handleGuarantorEmergencyContactChange = (field: string, value: string) => {
    setGuarantorData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [field]: value
      }
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

    // Validate guarantor data if provided
    if (hasGuarantor) {
      if (!guarantorData.name.trim()) {
        errors.push('กรุณากรอกชื่อผู้ค้ำประกัน');
      }
      if (!guarantorData.phone.trim()) {
        errors.push('กรุณากรอกเบอร์โทรศัพท์ผู้ค้ำประกัน');
      }
      if (!guarantorData.idCard.trim()) {
        errors.push('กรุณากรอกเลขบัตรประชาชนผู้ค้ำประกัน');
      }
      if (!guarantorData.address.trim()) {
        errors.push('กรุณากรอกที่อยู่ผู้ค้ำประกัน');
      }
      if (!guarantorAddressData || !guarantorAddressData.province || !guarantorAddressData.amphure || !guarantorAddressData.tambon) {
        errors.push('กรุณาเลือกจังหวัด อำเภอ และตำบลของผู้ค้ำประกัน');
      }
      if (!guarantorData.occupation.trim()) {
        errors.push('กรุณากรอกอาชีพผู้ค้ำประกัน');
      }
      if (!guarantorData.relationship.trim()) {
        errors.push('กรุณากรอกความสัมพันธ์กับผู้ค้ำประกัน');
      }
      if (guarantorData.monthlyIncome <= 0) {
        errors.push('กรุณากรอกรายได้ต่อเดือนของผู้ค้ำประกัน');
      }
      if (guarantorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guarantorData.email)) {
        errors.push('รูปแบบอีเมลผู้ค้ำประกันไม่ถูกต้อง');
      }
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
        guarantor: hasGuarantor ? {
        ...guarantorData,
        fullAddress: guarantorAddressData ? 
          `${guarantorData.address} ${guarantorAddressData.fullAddress}` : 
          guarantorData.address
      } : undefined,
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
      setGuarantorData({
        name: '',
        phone: '',
        email: '',
        address: '',
        idCard: '',
        occupation: '',
        monthlyIncome: 0,
        relationship: '',
        workplace: '',
        workAddress: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      });
      setHasGuarantor(false);
      setAddressData(null);
      setGuarantorAddressData(null);
      
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
    setGuarantorData({
      name: '',
      phone: '',
      email: '',
      address: '',
      idCard: '',
      occupation: '',
      monthlyIncome: 0,
      relationship: '',
      workplace: '',
      workAddress: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setHasGuarantor(false);
    setAddressData(null);
    setGuarantorAddressData(null);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              ข้อมูลพื้นฐาน
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              ที่อยู่
            </TabsTrigger>
            <TabsTrigger value="guarantor" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              ผู้ค้ำประกัน
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

          {/* ผู้ค้ำประกัน */}
          <TabsContent value="guarantor" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="hasGuarantor"
                checked={hasGuarantor}
                onChange={(e) => setHasGuarantor(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="hasGuarantor" className="text-sm font-medium">
                มีผู้ค้ำประกัน
              </Label>
            </div>

            {hasGuarantor && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorName">
                      ชื่อ-นามสกุลผู้ค้ำประกัน <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guarantorName"
                      value={guarantorData.name}
                      onChange={(e) => handleGuarantorChange('name', e.target.value)}
                      placeholder="ชื่อ-นามสกุลผู้ค้ำประกัน"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorPhone">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="guarantorPhone"
                        value={guarantorData.phone}
                        onChange={(e) => handleGuarantorChange('phone', e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorEmail">อีเมล</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="guarantorEmail"
                        type="email"
                        value={guarantorData.email}
                        onChange={(e) => handleGuarantorChange('email', e.target.value)}
                        placeholder="example@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorIdCard">
                      เลขบัตรประชาชน <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guarantorIdCard"
                      value={guarantorData.idCard}
                      onChange={(e) => handleGuarantorChange('idCard', e.target.value)}
                      placeholder="X-XXXX-XXXXX-XX-X"
                      maxLength={17}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorOccupation">
                      อาชีพ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guarantorOccupation"
                      value={guarantorData.occupation}
                      onChange={(e) => handleGuarantorChange('occupation', e.target.value)}
                      placeholder="อาชีพ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorIncome">
                      รายได้ต่อเดือน (บาท) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guarantorIncome"
                      type="number"
                      value={guarantorData.monthlyIncome}
                      onChange={(e) => handleGuarantorChange('monthlyIncome', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorRelationship">
                      ความสัมพันธ์กับลูกค้า <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={guarantorData.relationship}
                      onValueChange={(value) => handleGuarantorChange('relationship', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกความสัมพันธ์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">คู่สมรส</SelectItem>
                        <SelectItem value="parent">บิดา/มารดา</SelectItem>
                        <SelectItem value="child">บุตร</SelectItem>
                        <SelectItem value="sibling">พี่น้อง</SelectItem>
                        <SelectItem value="relative">ญาติ</SelectItem>
                        <SelectItem value="friend">เพื่อน</SelectItem>
                        <SelectItem value="colleague">เพื่อนร่วมงาน</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guarantorWorkplace">สถานที่ทำงาน</Label>
                    <Input
                      id="guarantorWorkplace"
                      value={guarantorData.workplace}
                      onChange={(e) => handleGuarantorChange('workplace', e.target.value)}
                      placeholder="ชื่อบริษัท/หน่วยงาน"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guarantorStreet">
                      ที่อยู่ (บ้านเลขที่/ถนน) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guarantorStreet"
                      value={guarantorData.address}
                      onChange={(e) => handleGuarantorChange('address', e.target.value)}
                      placeholder="เช่น 123/45 ถนนสุขุมวิท"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      จังหวัด/อำเภอ/ตำบล <span className="text-red-500">*</span>
                    </Label>
                    <ThaiAddressSelector
                       onAddressChange={handleGuarantorAddressChange}
                       required={true}
                     />

                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guarantorWorkAddress">ที่อยู่ที่ทำงาน</Label>
                  <Textarea
                    id="guarantorWorkAddress"
                    value={guarantorData.workAddress}
                    onChange={(e) => handleGuarantorChange('workAddress', e.target.value)}
                    placeholder="ที่อยู่ที่ทำงาน"
                    rows={2}
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    ผู้ติดต่อฉุกเฉิน
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">ชื่อ-นามสกุล</Label>
                      <Input
                        id="emergencyName"
                        value={guarantorData.emergencyContact?.name || ''}
                        onChange={(e) => handleGuarantorEmergencyContactChange('name', e.target.value)}
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">เบอร์โทรศัพท์</Label>
                      <Input
                        id="emergencyPhone"
                        value={guarantorData.emergencyContact?.phone || ''}
                        onChange={(e) => handleGuarantorEmergencyContactChange('phone', e.target.value)}
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">ความสัมพันธ์</Label>
                      <Input
                        id="emergencyRelationship"
                        value={guarantorData.emergencyContact?.relationship || ''}
                        onChange={(e) => handleGuarantorEmergencyContactChange('relationship', e.target.value)}
                        placeholder="ความสัมพันธ์"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default AddCustomerDialog;