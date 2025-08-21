import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThaiAddressSelector } from '@/components/ui/thai-address-selector';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer, InstallmentPlan, InstallmentContract } from '@/types/pos';
import {
  Calculator,
  CreditCard,
  FileText,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Calendar,
  Percent,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface EnhancedInstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  totalAmount: number;
  onConfirm: (contract: InstallmentContract) => void;
}

type FormStep = 'customer' | 'plan' | 'guarantor' | 'review';

export function EnhancedInstallmentDialog({
  open,
  onOpenChange,
  customer,
  totalAmount,
  onConfirm
}: EnhancedInstallmentDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<FormStep>('customer');
  const [customerData, setCustomerData] = useState<Customer>(customer);
  const [contractAmount, setContractAmount] = useState<number>(totalAmount);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [guarantorData, setGuarantorData] = useState<Partial<Customer>>({});
  const [requireGuarantor, setRequireGuarantor] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<InstallmentPlan[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Progress calculation
  const stepProgress = {
    customer: 25,
    plan: 50,
    guarantor: 75,
    review: 100
  };

  // Fallback installment plans
  const fallbackPlans: InstallmentPlan[] = [
    {
      id: 'plan-3',
      name: 'แผน 3 เดือน',
      planNumber: 'P003',
      months: 3,
      interestRate: 12,
      downPaymentPercent: 30,
      processingFee: 500,
      minAmount: 5000,
      maxAmount: 50000,
      requiresGuarantor: false,
      isActive: true
    },
    {
      id: 'plan-6',
      name: 'แผน 6 เดือน',
      planNumber: 'P006',
      months: 6,
      interestRate: 15,
      downPaymentPercent: 25,
      processingFee: 800,
      minAmount: 10000,
      maxAmount: 100000,
      requiresGuarantor: false,
      isActive: true
    },
    {
      id: 'plan-12',
      name: 'แผน 12 เดือน',
      planNumber: 'P012',
      months: 12,
      interestRate: 18,
      downPaymentPercent: 20,
      processingFee: 1200,
      minAmount: 20000,
      maxAmount: 200000,
      requiresGuarantor: true,
      isActive: true
    },
    {
      id: 'plan-24',
      name: 'แผน 24 เดือน',
      planNumber: 'P024',
      months: 24,
      interestRate: 22,
      downPaymentPercent: 15,
      processingFee: 2000,
      minAmount: 50000,
      maxAmount: 500000,
      requiresGuarantor: true,
      isActive: true
    }
  ];

  // Load installment plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: plans, error } = await supabase
          .from('installment_plans')
          .select('*')
          .eq('is_active', true)
          .order('number_of_installments');

        if (error) throw error;
        
        const mappedPlans = plans.map(plan => ({
          id: plan.id,
          name: plan.name, // แก้ไขจาก plan.plan_name เป็น plan.name
          planNumber: plan.plan_number,
          months: plan.number_of_installments,
          interestRate: plan.interest_rate,
          downPaymentPercent: plan.down_payment_percent,
          processingFee: plan.processing_fee,
          minAmount: plan.min_amount,
          maxAmount: plan.max_amount,
          requiresGuarantor: plan.requires_guarantor,
          isActive: plan.is_active
        }));

        setAvailablePlans(mappedPlans.length > 0 ? mappedPlans : fallbackPlans);
      } catch (error) {
        console.error('Error fetching installment plans:', error);
        // Use fallback plans when database is not available
        setAvailablePlans(fallbackPlans);
        toast({
          title: "แจ้งเตือน",
          description: "ใช้แผนผ่อนชำระแบบออฟไลน์",
          variant: "default",
        });
      }
    };

    if (open) {
      fetchPlans();
      setCustomerData(customer);
      setContractAmount(totalAmount);
    }
  }, [open, customer, totalAmount, toast]);

  // Calculate installment details
  const calculateInstallment = () => {
    if (!selectedPlan) return null;

    const downPayment = Math.round(contractAmount * (selectedPlan.downPaymentPercent / 100));
    const financedAmount = contractAmount - downPayment;
    const monthlyInterestRate = selectedPlan.interestRate / 100 / 12;
    const monthlyPayment = Math.round(
      (financedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, selectedPlan.months)) /
      (Math.pow(1 + monthlyInterestRate, selectedPlan.months) - 1)
    );
    const totalPayable = (monthlyPayment * selectedPlan.months) + downPayment + selectedPlan.processingFee;
    const totalInterest = totalPayable - contractAmount - selectedPlan.processingFee;

    return {
      downPayment,
      financedAmount,
      monthlyPayment,
      totalPayable,
      totalInterest
    };
  };

  const installmentDetails = calculateInstallment();

  // Validation functions
  const validateCustomer = () => {
    const errors: Record<string, string> = {};
    
    // ตรวจสอบชื่อ
    if (!customerData.name?.trim()) {
      errors.name = 'กรุณากรอกชื่อลูกค้า';
    } else if (customerData.name.trim().length < 2) {
      errors.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }
    
    // ตรวจสอบเบอร์โทรศัพท์
    if (!customerData.phone?.trim()) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else {
      const phoneRegex = /^[0-9]{9,10}$/;
      const cleanPhone = customerData.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)';
      }
    }
    
    // ตรวจสอบอีเมล (ถ้ามี)
    if (customerData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    }
    
    // ตรวจสอบเลขบัตรประชาชน
    if (!customerData.idCard?.trim()) {
      errors.idCard = 'กรุณากรอกเลขบัตรประชาชน';
    } else {
      const idCardRegex = /^[0-9]{13}$/;
      const cleanIdCard = customerData.idCard.replace(/[-\s]/g, '');
      if (!idCardRegex.test(cleanIdCard)) {
        errors.idCard = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
      }
    }
    
    // ตรวจสอบที่อยู่
    if (!customerData.address?.trim()) {
      errors.address = 'กรุณากรอกที่อยู่';
    } else if (customerData.address.trim().length < 10) {
      errors.address = 'ที่อยู่ต้องมีรายละเอียดอย่างน้อย 10 ตัวอักษร';
    }
    
    // ตรวจสอบอาชีพ
    if (!customerData.occupation?.trim()) {
      errors.occupation = 'กรุณากรอกอาชีพ';
    }
    
    // ตรวจสอบรายได้
    if (!customerData.monthlyIncome || customerData.monthlyIncome <= 0) {
      errors.monthlyIncome = 'กรุณากรอกรายได้รายเดือน';
    } else if (customerData.monthlyIncome < 8000) {
      errors.monthlyIncome = 'รายได้รายเดือนต้องไม่น้อยกว่า 8,000 บาท';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePlan = () => {
    const errors: Record<string, string> = {};
    
    if (!selectedPlan) {
      errors.plan = 'กรุณาเลือกแผนผ่อนชำระ';
    }
    
    if (contractAmount <= 0) {
      errors.amount = 'กรุณากรอกยอดเงินที่ถูกต้อง';
    } else if (contractAmount < 1000) {
      errors.amount = 'ยอดเงินต้องไม่น้อยกว่า 1,000 บาท';
    }
    
    if (selectedPlan) {
      if (contractAmount < selectedPlan.minAmount) {
        errors.amount = `ยอดเงินต้องไม่น้อยกว่า ${selectedPlan.minAmount.toLocaleString()} บาท`;
      }
      if (contractAmount > selectedPlan.maxAmount) {
        errors.amount = `ยอดเงินต้องไม่เกิน ${selectedPlan.maxAmount.toLocaleString()} บาท`;
      }
      
      // ตรวจสอบความสามารถในการชำระ
      if (installmentDetails && customerData.monthlyIncome) {
        const debtToIncomeRatio = (installmentDetails.monthlyPayment / customerData.monthlyIncome) * 100;
        if (debtToIncomeRatio > 40) {
          errors.amount = `ยอดผ่อนต่อเดือนเกิน 40% ของรายได้ (${debtToIncomeRatio.toFixed(1)}%) กรุณาลดยอดเงินหรือเลือกแผนผ่อนระยะยาว`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGuarantor = () => {
    if (!requireGuarantor) return true;
    
    const errors: Record<string, string> = {};
    
    // ตรวจสอบชื่อผู้ค้ำประกัน
    if (!guarantorData.name?.trim()) {
      errors.guarantorName = 'กรุณากรอกชื่อผู้ค้ำประกัน';
    } else if (guarantorData.name.trim().length < 2) {
      errors.guarantorName = 'ชื่อผู้ค้ำประกันต้องมีอย่างน้อย 2 ตัวอักษร';
    }
    
    // ตรวจสอบเบอร์โทรศัพท์ผู้ค้ำประกัน
    if (!guarantorData.phone?.trim()) {
      errors.guarantorPhone = 'กรุณากรอกเบอร์โทรศัพท์ผู้ค้ำประกัน';
    } else {
      const phoneRegex = /^[0-9]{9,10}$/;
      const cleanPhone = guarantorData.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.guarantorPhone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)';
      }
    }
    
    // ตรวจสอบเลขบัตรประชาชนผู้ค้ำประกัน
    if (!guarantorData.idCard?.trim()) {
      errors.guarantorIdCard = 'กรุณากรอกเลขบัตรประชาชนผู้ค้ำประกัน';
    } else {
      const idCardRegex = /^[0-9]{13}$/;
      const cleanIdCard = guarantorData.idCard.replace(/[-\s]/g, '');
      if (!idCardRegex.test(cleanIdCard)) {
        errors.guarantorIdCard = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
      }
      
      // ตรวจสอบว่าเลขบัตรประชาชนผู้ค้ำประกันไม่ซ้ำกับลูกค้า
      const customerIdCard = customerData.idCard?.replace(/[-\s]/g, '');
      if (cleanIdCard === customerIdCard) {
        errors.guarantorIdCard = 'เลขบัตรประชาชนผู้ค้ำประกันต้องไม่ซ้ำกับลูกค้า';
      }
    }
    
    // ตรวจสอบที่อยู่ผู้ค้ำประกัน
    if (!guarantorData.address?.trim()) {
      errors.guarantorAddress = 'กรุณากรอกที่อยู่ผู้ค้ำประกัน';
    }
    
    // ตรวจสอบอาชีพผู้ค้ำประกัน
    if (!guarantorData.occupation?.trim()) {
      errors.guarantorOccupation = 'กรุณากรอกอาชีพผู้ค้ำประกัน';
    }
    
    // ตรวจสอบรายได้ผู้ค้ำประกัน
    if (!guarantorData.monthlyIncome || guarantorData.monthlyIncome <= 0) {
      errors.guarantorIncome = 'กรุณากรอกรายได้รายเดือนผู้ค้ำประกัน';
    } else if (guarantorData.monthlyIncome < 10000) {
      errors.guarantorIncome = 'รายได้รายเดือนผู้ค้ำประกันต้องไม่น้อยกว่า 10,000 บาท';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation functions
  const nextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 'customer':
        isValid = validateCustomer();
        if (isValid) setCurrentStep('plan');
        break;
      case 'plan':
        isValid = validatePlan();
        if (isValid) {
          if (selectedPlan?.requiresGuarantor) {
            setRequireGuarantor(true);
            setCurrentStep('guarantor');
          } else {
            setCurrentStep('review');
          }
        }
        break;
      case 'guarantor':
        isValid = validateGuarantor();
        if (isValid) setCurrentStep('review');
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'plan':
        setCurrentStep('customer');
        break;
      case 'guarantor':
        setCurrentStep('plan');
        break;
      case 'review':
        if (requireGuarantor) {
          setCurrentStep('guarantor');
        } else {
          setCurrentStep('plan');
        }
        break;
    }
  };

  // Submit function
  const handleSubmit = async () => {
    if (!selectedPlan || !installmentDetails) return;

    setLoading(true);
    try {
      const contractNumber = `CT${Date.now()}`;
      
      const contract: InstallmentContract = {
        id: `contract-${Date.now()}`,
        contractNumber,
        customerId: customerData.id,
        customerName: customerData.name,
        planId: selectedPlan.id,
        totalAmount: contractAmount,
        downPayment: installmentDetails.downPayment,
        financedAmount: installmentDetails.financedAmount,
        monthlyPayment: installmentDetails.monthlyPayment,
        remainingBalance: installmentDetails.financedAmount,
        interestRate: selectedPlan.interestRate,
        numberOfInstallments: selectedPlan.months,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
        payments: [],
        notes,
        guarantorId: requireGuarantor ? guarantorData.id : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onConfirm(contract);
      onOpenChange(false);
      
      toast({
        title: "สร้างสัญญาสำเร็จ!",
        description: `สัญญาเลขที่ ${contractNumber} ถูกสร้างเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างสัญญาได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'customer':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">ข้อมูลลูกค้า</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                <Input
                  id="name"
                  value={customerData.name || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={customerData.phone || ''}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0xx-xxx-xxxx"
                    className={`pl-10 ${validationErrors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-sm text-red-500">{validationErrors.phone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email || ''}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idCard">เลขบัตรประชาชน *</Label>
                <Input
                  id="idCard"
                  value={customerData.idCard || ''}
                  onChange={(e) => setCustomerData(prev => ({ ...prev, idCard: e.target.value }))}
                  placeholder="x-xxxx-xxxxx-xx-x"
                  className={validationErrors.idCard ? 'border-red-500' : ''}
                />
                {validationErrors.idCard && (
                  <p className="text-sm text-red-500">{validationErrors.idCard}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occupation">อาชีพ *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="occupation"
                    value={customerData.occupation || ''}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder="กรอกอาชีพ"
                    className={`pl-10 ${validationErrors.occupation ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.occupation && (
                  <p className="text-sm text-red-500">{validationErrors.occupation}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">รายได้รายเดือน (บาท) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={customerData.monthlyIncome || ''}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                    placeholder="0"
                    className={`pl-10 ${validationErrors.monthlyIncome ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.monthlyIncome && (
                  <p className="text-sm text-red-500">{validationErrors.monthlyIncome}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <ThaiAddressSelector
                label="ที่อยู่"
                required={true}
                value={{
                  houseNumber: customerData.houseNumber,
                  province: customerData.province,
                  district: customerData.district,
                  subdistrict: customerData.subdistrict,
                  zipCode: customerData.zipCode
                }}
                onChange={(address) => {
                  setCustomerData(prev => ({
                    ...prev,
                    address: address.fullAddress,
                    houseNumber: address.houseNumber,
                    province: address.province,
                    district: address.district,
                    subdistrict: address.subdistrict,
                    zipCode: address.zipCode
                  }));
                }}
                error={validationErrors.address}
              />
            </div>
          </div>
        );
        
      case 'plan':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">เลือกแผนผ่อนชำระ</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">ยอดเงินรวม (บาท) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(Number(e.target.value))}
                    placeholder="0"
                    className={`pl-10 text-lg font-semibold ${validationErrors.amount ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.amount && (
                  <p className="text-sm text-red-500">{validationErrors.amount}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isEligible = contractAmount >= plan.minAmount && contractAmount <= plan.maxAmount;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : isEligible 
                            ? 'hover:border-gray-400' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => isEligible && setSelectedPlan(plan)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>ระยะเวลา:</span>
                          <span className="font-medium">{plan.months} เดือน</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>อัตราดอกเบิ้ย:</span>
                          <span className="font-medium">{plan.interestRate}% ต่อปี</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>เงินดาวน์:</span>
                          <span className="font-medium">{plan.downPaymentPercent}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ค่าธรรมเนียม:</span>
                          <span className="font-medium">฿{plan.processingFee.toLocaleString()}</span>
                        </div>
                        {plan.requiresGuarantor && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            ต้องมีผู้ค้ำประกัน
                          </Badge>
                        )}
                        {!isEligible && (
                          <div className="text-xs text-red-500">
                            ยอดเงินต้องอยู่ระหว่าง ฿{plan.minAmount.toLocaleString()} - ฿{plan.maxAmount.toLocaleString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {validationErrors.plan && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationErrors.plan}</AlertDescription>
                </Alert>
              )}
              
              {selectedPlan && installmentDetails && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-900">สรุปการคำนวณ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>เงินดาวน์:</span>
                        <span className="font-medium">฿{installmentDetails.downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ยอดผ่อน:</span>
                        <span className="font-medium">฿{installmentDetails.financedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ผ่อนต่อเดือน:</span>
                        <span className="font-medium text-green-600">฿{installmentDetails.monthlyPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ดอกเบิ้ยรวม:</span>
                        <span className="font-medium">฿{installmentDetails.totalInterest.toLocaleString()}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>ยอดรวมทั้งสิ้น:</span>
                      <span className="text-lg text-blue-600">฿{installmentDetails.totalPayable.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
        
      case 'guarantor':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">ข้อมูลผู้ค้ำประกัน</h3>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                แผนผ่อนชำระนี้ต้องมีผู้ค้ำประกัน กรุณากรอกข้อมูลผู้ค้ำประกันให้ครบถ้วน
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guarantorName">ชื่อ-นามสกุล ผู้ค้ำประกัน *</Label>
                <Input
                  id="guarantorName"
                  value={guarantorData.name || ''}
                  onChange={(e) => setGuarantorData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="กรอกชื่อ-นามสกุล ผู้ค้ำประกัน"
                  className={validationErrors.guarantorName ? 'border-red-500' : ''}
                />
                {validationErrors.guarantorName && (
                  <p className="text-sm text-red-500">{validationErrors.guarantorName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guarantorPhone">เบอร์โทรศัพท์ *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="guarantorPhone"
                    value={guarantorData.phone || ''}
                    onChange={(e) => setGuarantorData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0xx-xxx-xxxx"
                    className={`pl-10 ${validationErrors.guarantorPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.guarantorPhone && (
                  <p className="text-sm text-red-500">{validationErrors.guarantorPhone}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guarantorIdCard">เลขบัตรประชาชน *</Label>
                <Input
                  id="guarantorIdCard"
                  value={guarantorData.idCard || ''}
                  onChange={(e) => setGuarantorData(prev => ({ ...prev, idCard: e.target.value }))}
                  placeholder="x-xxxx-xxxxx-xx-x"
                  className={validationErrors.guarantorIdCard ? 'border-red-500' : ''}
                />
                {validationErrors.guarantorIdCard && (
                  <p className="text-sm text-red-500">{validationErrors.guarantorIdCard}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guarantorOccupation">อาชีพ</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="guarantorOccupation"
                    value={guarantorData.occupation || ''}
                    onChange={(e) => setGuarantorData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder="กรอกอาชีพ"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guarantorAddress">ที่อยู่ผู้ค้ำประกัน</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="guarantorAddress"
                  value={guarantorData.address || ''}
                  onChange={(e) => setGuarantorData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="กรอกที่อยู่ผู้ค้ำประกัน"
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">ตรวจสอบข้อมูลสัญญา</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    ข้อมูลลูกค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ชื่อ:</span>
                    <span className="font-medium">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>โทรศัพท์:</span>
                    <span className="font-medium">{customerData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>อาชีพ:</span>
                    <span className="font-medium">{customerData.occupation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>รายได้:</span>
                    <span className="font-medium">฿{customerData.monthlyIncome?.toLocaleString()}/เดือน</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Plan Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    แผนผ่อนชำระ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>แผน:</span>
                    <span className="font-medium">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ระยะเวลา:</span>
                    <span className="font-medium">{selectedPlan?.months} เดือน</span>
                  </div>
                  <div className="flex justify-between">
                    <span>อัตราดอกเบิ้ย:</span>
                    <span className="font-medium">{selectedPlan?.interestRate}% ต่อปี</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ยอดเงิน:</span>
                    <span className="font-medium">฿{contractAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Payment Summary */}
            {installmentDetails && (
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    สรุปการชำระเงิน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">เงินดาวน์</p>
                      <p className="text-lg font-bold text-blue-600">฿{installmentDetails.downPayment.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ผ่อนต่อเดือน</p>
                      <p className="text-lg font-bold text-green-600">฿{installmentDetails.monthlyPayment.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ดอกเบิ้ยรวม</p>
                      <p className="text-lg font-bold text-orange-600">฿{installmentDetails.totalInterest.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ยอดรวมทั้งสิ้น</p>
                      <p className="text-lg font-bold text-purple-600">฿{installmentDetails.totalPayable.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Guarantor Info */}
            {requireGuarantor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    ข้อมูลผู้ค้ำประกัน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ชื่อ:</span>
                    <span className="font-medium">{guarantorData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>โทรศัพท์:</span>
                    <span className="font-medium">{guarantorData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เลขบัตรประชาชน:</span>
                    <span className="font-medium">{guarantorData.idCard}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                rows={3}
              />
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
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            สร้างสัญญาผ่อนชำระใหม่
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>ขั้นตอนที่ {Object.keys(stepProgress).indexOf(currentStep) + 1} จาก 4</span>
            <span>{stepProgress[currentStep]}%</span>
          </div>
          <Progress value={stepProgress[currentStep]} className="h-2" />
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {[
            { key: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
            { key: 'plan', label: 'เลือกแผน', icon: Calculator },
            { key: 'guarantor', label: 'ผู้ค้ำประกัน', icon: Shield },
            { key: 'review', label: 'ตรวจสอบ', icon: FileText }
          ].map(({ key, label, icon: Icon }, index) => {
            const isActive = currentStep === key;
            const isCompleted = Object.keys(stepProgress).indexOf(currentStep) > index;
            const isGuarantorStep = key === 'guarantor';
            const shouldShowGuarantor = requireGuarantor || selectedPlan?.requiresGuarantor;
            
            if (isGuarantorStep && !shouldShowGuarantor) {
              return null;
            }
            
            return (
              <div key={key} className={`flex flex-col items-center space-y-1 ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-blue-100 border-2 border-blue-600' : 
                  isCompleted ? 'bg-green-100 border-2 border-green-600' : 
                  'bg-gray-100 border-2 border-gray-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            );
          })}
        </div>
        
        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 'customer'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังสร้างสัญญา...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    สร้างสัญญา
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                ถัดไป
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}