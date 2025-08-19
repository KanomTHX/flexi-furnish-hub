import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  UserPlus,
  User,
  Briefcase,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Save
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranchData } from '@/hooks/useBranchData';
import { useToast } from '@/hooks/use-toast';
import { EmployeeFormData } from '@/types/employees';
import { ThaiAddressSelector } from '@/components/common/ThaiAddressSelector';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormStep = 'personal' | 'position' | 'contact' | 'work' | 'review';

interface FormErrors {
  [key: string]: string;
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { departments, positions, addEmployee } = useEmployees();
  const { branches } = useBranchData();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    positionId: '',
    departmentId: '',
    branchId: '',
    salary: 0,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: ''
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branchName: ''
    },
    workSchedule: {
      type: 'full-time',
      workDays: [
        { day: 'monday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'tuesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'wednesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'thursday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'friday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
        { day: 'saturday', startTime: '08:00', endTime: '12:00', breakTime: 0, isWorkingDay: true },
        { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
      ],
      overtimeRate: 1.5,
      vacationDays: 12,
      sickDays: 8
    }
  });

  const steps = [
    {
      id: 'personal' as FormStep,
      title: 'ข้อมูลส่วนตัว',
      description: 'ชื่อ-นามสกุล วันเกิด',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'position' as FormStep,
      title: 'ตำแหน่งงาน',
      description: 'แผนก ตำแหน่ง เงินเดือน',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'contact' as FormStep,
      title: 'ข้อมูลติดต่อ',
      description: 'ที่อยู่ เบอร์โทร อีเมล',
      icon: Phone,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'work' as FormStep,
      title: 'ข้อมูลการทำงาน',
      description: 'ตารางงาน บัญชีธนาคาร',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'review' as FormStep,
      title: 'ตรวจสอบข้อมูล',
      description: 'ยืนยันข้อมูลก่อนบันทึก',
      icon: CheckCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const bankOptions = [
    'ธนาคารกสิกรไทย',
    'ธนาคารไทยพาณิชย์',
    'ธนาคารกรุงเทพ',
    'ธนาคารกรุงศรีอยุธยา',
    'ธนาคารทหารไทยธนชาต',
    'ธนาคารกรุงไทย',
    'ธนาคารออมสิน',
    'ธนาคารอาคารสงเคราะห์',
    'ธนาคารเกียรตินาคิน',
    'ธนาคารซีไอเอ็มบี ไทย'
  ];

  const relationshipOptions = [
    'บิดา', 'มารดา', 'สามี', 'ภรรยา', 'บุตร', 'บุตรี',
    'พี่ชาย', 'พี่สาว', 'น้องชาย', 'น้องสาว', 'ปู่', 'ย่า',
    'ตา', 'ยาย', 'ลุง', 'ป้า', 'น้า', 'อา', 'เพื่อน', 'อื่นๆ'
  ];

  const validateStep = (step: FormStep): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 'personal':
        if (!formData.firstName.trim()) newErrors.firstName = 'กรุณากรอกชื่อ';
        if (!formData.lastName.trim()) newErrors.lastName = 'กรุณากรอกนามสกุล';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'กรุณาเลือกวันเกิด';
        if (!formData.hireDate) newErrors.hireDate = 'กรุณาเลือกวันเริ่มงาน';
        break;

      case 'position':
        if (!formData.departmentId) newErrors.departmentId = 'กรุณาเลือกแผนก';
        if (!formData.positionId) newErrors.positionId = 'กรุณาเลือกตำแหน่ง';
        if (!formData.branchId) newErrors.branchId = 'กรุณาเลือกสาขา';
        if (!formData.salary || formData.salary <= 0) newErrors.salary = 'กรุณากรอกเงินเดือน';
        break;

      case 'contact':
        if (!formData.email.trim()) newErrors.email = 'กรุณากรอกอีเมล';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        if (!formData.phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
        if (!formData.address.trim()) newErrors.address = 'กรุณากรอกที่อยู่';
        if (!formData.emergencyContact.name.trim()) {
          newErrors['emergencyContact.name'] = 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
        }
        if (!formData.emergencyContact.phone.trim()) {
          newErrors['emergencyContact.phone'] = 'กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉิน';
        }
        if (!formData.emergencyContact.relationship.trim()) {
          newErrors['emergencyContact.relationship'] = 'กรุณาเลือกความสัมพันธ์';
        }
        break;

      case 'work':
        if (!formData.bankAccount.bankName) newErrors['bankAccount.bankName'] = 'กรุณาเลือกธนาคาร';
        if (!formData.bankAccount.accountNumber.trim()) {
          newErrors['bankAccount.accountNumber'] = 'กรุณากรอกเลขบัญชี';
        }
        if (!formData.bankAccount.accountName.trim()) {
          newErrors['bankAccount.accountName'] = 'กรุณากรอกชื่อบัญชี';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const stepIndex = steps.findIndex(step => step.id === currentStep);
      if (stepIndex < steps.length - 1) {
        setCurrentStep(steps[stepIndex + 1].id);
      }
    }
  };

  const handlePrevious = () => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('work')) return;

    setIsSubmitting(true);

    try {
      // Auto-generate account name if not provided
      if (!formData.bankAccount.accountName.trim()) {
        formData.bankAccount.accountName = `${formData.firstName} ${formData.lastName}`;
      }

      await addEmployee(formData);

      toast({
        title: "เพิ่มพนักงานสำเร็จ! 🎉",
        description: `เพิ่ม ${formData.firstName} ${formData.lastName} เข้าระบบเรียบร้อยแล้ว`
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        hireDate: new Date().toISOString().split('T')[0],
        positionId: '',
        departmentId: '',
        branchId: '',
        salary: 0,
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: '',
          address: ''
        },
        bankAccount: {
          bankName: '',
          accountNumber: '',
          accountName: '',
          branchName: ''
        },
        workSchedule: {
          type: 'full-time',
          workDays: [
            { day: 'monday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
            { day: 'tuesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
            { day: 'wednesday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
            { day: 'thursday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
            { day: 'friday', startTime: '08:00', endTime: '17:00', breakTime: 60, isWorkingDay: true },
            { day: 'saturday', startTime: '08:00', endTime: '12:00', breakTime: 0, isWorkingDay: true },
            { day: 'sunday', startTime: '00:00', endTime: '00:00', breakTime: 0, isWorkingDay: false }
          ],
          overtimeRate: 1.5,
          vacationDays: 12,
          sickDays: 8
        }
      });
      setCurrentStep('personal');
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มพนักงานได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev[keys[0] as keyof EmployeeFormData] as any || {}),
            [keys[1]]: value
          }
        };
      }
      return prev;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อ *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="กรอกชื่อ"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="กรอกนามสกุล"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">วันเกิด *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">วันเริ่มงาน *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => updateFormData('hireDate', e.target.value)}
                  className={errors.hireDate ? 'border-red-500' : ''}
                />
                {errors.hireDate && (
                  <p className="text-sm text-red-500">{errors.hireDate}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'position':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>แผนก *</Label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={(value) => updateFormData('departmentId', value)}
                >
                  <SelectTrigger className={errors.departmentId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-sm text-red-500">{errors.departmentId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>ตำแหน่ง *</Label>
                <Select 
                  value={formData.positionId} 
                  onValueChange={(value) => updateFormData('positionId', value)}
                >
                  <SelectTrigger className={errors.positionId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="เลือกตำแหน่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos.id} value={pos.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{pos.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            ฿{pos.baseSalary.toLocaleString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.positionId && (
                  <p className="text-sm text-red-500">{errors.positionId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>สาขา *</Label>
                <Select 
                  value={formData.branchId} 
                  onValueChange={(value) => updateFormData('branchId', value)}
                >
                  <SelectTrigger className={errors.branchId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {branch.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && (
                  <p className="text-sm text-red-500">{errors.branchId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">เงินเดือน (บาท) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => updateFormData('salary', parseInt(e.target.value) || 0)}
                  placeholder="กรอกเงินเดือน"
                  className={`pl-10 ${errors.salary ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.salary && (
                <p className="text-sm text-red-500">{errors.salary}</p>
              )}
              {formData.positionId && (
                <p className="text-sm text-muted-foreground">
                  เงินเดือนพื้นฐานของตำแหน่ง: ฿{positions.find(p => p.id === formData.positionId)?.baseSalary.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">ข้อมูลติดต่อส่วนตัว</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="example@company.com"
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="081-234-5678"
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">ที่อยู่ *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="กรอกที่อยู่ที่สามารถติดต่อได้"
                      className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                      rows={3}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">ผู้ติดต่อฉุกเฉิน</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyContact.name}
                      onChange={(e) => updateFormData('emergencyContact.name', e.target.value)}
                      placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                      className={errors['emergencyContact.name'] ? 'border-red-500' : ''}
                    />
                    {errors['emergencyContact.name'] && (
                      <p className="text-sm text-red-500">{errors['emergencyContact.name']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>ความสัมพันธ์ *</Label>
                    <Select 
                      value={formData.emergencyContact.relationship} 
                      onValueChange={(value) => updateFormData('emergencyContact.relationship', value)}
                    >
                      <SelectTrigger className={errors['emergencyContact.relationship'] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="เลือกความสัมพันธ์" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map(rel => (
                          <SelectItem key={rel} value={rel}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors['emergencyContact.relationship'] && (
                      <p className="text-sm text-red-500">{errors['emergencyContact.relationship']}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">เบอร์โทรศัพท์ *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => updateFormData('emergencyContact.phone', e.target.value)}
                        placeholder="081-234-5678"
                        className={`pl-10 ${errors['emergencyContact.phone'] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors['emergencyContact.phone'] && (
                      <p className="text-sm text-red-500">{errors['emergencyContact.phone']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyEmail">อีเมล</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="emergencyEmail"
                        type="email"
                        value={formData.emergencyContact.email || ''}
                        onChange={(e) => updateFormData('emergencyContact.email', e.target.value)}
                        placeholder="อีเมล (ไม่บังคับ)"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'work':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">ข้อมูลบัญชีธนาคาร</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ธนาคาร *</Label>
                    <Select 
                      value={formData.bankAccount.bankName} 
                      onValueChange={(value) => updateFormData('bankAccount.bankName', value)}
                    >
                      <SelectTrigger className={errors['bankAccount.bankName'] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="เลือกธนาคาร" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankOptions.map(bank => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors['bankAccount.bankName'] && (
                      <p className="text-sm text-red-500">{errors['bankAccount.bankName']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchName">สาขา</Label>
                    <Input
                      id="branchName"
                      value={formData.bankAccount.branchName}
                      onChange={(e) => updateFormData('bankAccount.branchName', e.target.value)}
                      placeholder="ชื่อสาขา"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">เลขบัญชี *</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="accountNumber"
                        value={formData.bankAccount.accountNumber}
                        onChange={(e) => updateFormData('bankAccount.accountNumber', e.target.value)}
                        placeholder="123-4-56789-0"
                        className={`pl-10 ${errors['bankAccount.accountNumber'] ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors['bankAccount.accountNumber'] && (
                      <p className="text-sm text-red-500">{errors['bankAccount.accountNumber']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">ชื่อบัญชี *</Label>
                    <Input
                      id="accountName"
                      value={formData.bankAccount.accountName}
                      onChange={(e) => updateFormData('bankAccount.accountName', e.target.value)}
                      placeholder="ชื่อเจ้าของบัญชี"
                      className={errors['bankAccount.accountName'] ? 'border-red-500' : ''}
                    />
                    {errors['bankAccount.accountName'] && (
                      <p className="text-sm text-red-500">{errors['bankAccount.accountName']}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      หากไม่กรอก จะใช้ชื่อ-นามสกุลของพนักงานโดยอัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">ตารางการทำงาน</h3>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>ประเภทการจ้าง</Label>
                    <Select 
                      value={formData.workSchedule.type} 
                      onValueChange={(value) => updateFormData('workSchedule.type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">เต็มเวลา</SelectItem>
                        <SelectItem value="part-time">ไม่เต็มเวลา</SelectItem>
                        <SelectItem value="contract">สัญญาจ้าง</SelectItem>
                        <SelectItem value="intern">ฝึกงาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vacationDays">วันลาพักร้อน</Label>
                    <Input
                      id="vacationDays"
                      type="number"
                      value={formData.workSchedule.vacationDays}
                      onChange={(e) => updateFormData('workSchedule.vacationDays', parseInt(e.target.value) || 0)}
                      placeholder="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sickDays">วันลาป่วย</Label>
                    <Input
                      id="sickDays"
                      type="number"
                      value={formData.workSchedule.sickDays}
                      onChange={(e) => updateFormData('workSchedule.sickDays', parseInt(e.target.value) || 0)}
                      placeholder="8"
                    />
                  </div>
                </div>

                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      ตารางการทำงานมาตรฐาน: จันทร์-ศุกร์ 08:00-17:00, เสาร์ 08:00-12:00
                      <br />
                      สามารถปรับแต่งได้ภายหลังในหน้าจัดการพนักงาน
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 'review':
        const selectedDepartment = departments.find(d => d.id === formData.departmentId);
        const selectedPosition = positions.find(p => p.id === formData.positionId);

        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">ตรวจสอบข้อมูลก่อนบันทึก</h3>
              <p className="text-muted-foreground">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนเพิ่มพนักงานเข้าระบบ
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ข้อมูลส่วนตัว
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                    <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันเกิด:</span>
                    <span>{new Date(formData.dateOfBirth).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วันเริ่มงาน:</span>
                    <span>{new Date(formData.hireDate).toLocaleDateString('th-TH')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    ตำแหน่งงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">แผนก:</span>
                    <span className="font-medium">{selectedDepartment?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ตำแหน่ง:</span>
                    <span className="font-medium">{selectedPosition?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เงินเดือน:</span>
                    <span className="font-medium text-green-600">
                      ฿{formData.salary.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    ข้อมูลติดต่อ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">อีเมล:</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">โทรศัพท์:</span>
                    <span>{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ผู้ติดต่อฉุกเฉิน:</span>
                    <span>{formData.emergencyContact.name}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    บัญชีธนาคาร
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ธนาคาร:</span>
                    <span>{formData.bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เลขบัญชี:</span>
                    <span>{formData.bankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ชื่อบัญชี:</span>
                    <span>{formData.bankAccount.accountName || `${formData.firstName} ${formData.lastName}`}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            เพิ่มพนักงานใหม่
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลพนักงานใหม่ทีละขั้นตอน
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`p-2 rounded-full ${
                    isActive ? step.bgColor : isCompleted ? 'bg-green-50' : 'bg-gray-100'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="hidden md:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              ขั้นตอน {getCurrentStepIndex() + 1} จาก {steps.length}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            
            {getCurrentStepIndex() > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                ก่อนหน้า
              </Button>
            )}
            
            {currentStep !== 'review' ? (
              <Button onClick={handleNext}>
                ถัดไป
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    เพิ่มพนักงาน
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};