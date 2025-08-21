import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Customer, InstallmentPlan, InstallmentContract, Guarantor, SerialNumber } from '@/types/unified';
// import { installmentPlans, getActiveInstallmentPlans } from '@/data/constants';
import {
  createInstallmentContract,
  checkInstallmentEligibility,
  calculateMonthlyPayment,
  calculateTotalInterest
} from '@/utils/installmentHelpers';
import { createInstallmentContract as createContract } from '@/lib/supabase-installments';
import { createGuarantor } from '@/lib/supabase-guarantors';
import { supabase } from '@/lib/supabase';
import { ThaiAddressSelector } from '@/components/ui/thai-address-selector';
import { AlertTriangle, Calculator, CreditCard, FileText, User, Package } from 'lucide-react';
import SerialNumberSelector from '@/components/installments/SerialNumberSelector';

interface InstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  totalAmount: number;
  onConfirm: (contract: InstallmentContract) => void;
}

export function InstallmentDialog({
  open,
  onOpenChange,
  customer,
  totalAmount,
  onConfirm
}: InstallmentDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [customerData, setCustomerData] = useState<Customer>(customer);
  const [contractAmount, setContractAmount] = useState<number>(totalAmount);
  const [guarantor, setGuarantor] = useState<Partial<Customer>>({});
  const [collateral, setCollateral] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [requireGuarantor, setRequireGuarantor] = useState(false);
  const [step, setStep] = useState<'customer' | 'plan' | 'serials' | 'guarantor' | 'details' | 'review'>('customer');
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<SerialNumber[]>([]);
  
  // State สำหรับแก้ไขแผน
  const [customInterestRate, setCustomInterestRate] = useState<number | null>(null);
  const [customDownPaymentPercent, setCustomDownPaymentPercent] = useState<number | null>(null);
  
  // State สำหรับเลือกลูกค้าเก่า
  const [showExistingCustomer, setShowExistingCustomer] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [existingGuarantors, setExistingGuarantors] = useState<any[]>([]);
  
  // State สำหรับสร้างแผนใหม่
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    months: 12,
    interestRate: 0,
    downPaymentPercent: 20,
    processingFee: 500,
    description: ''
  });

  // อัปเดตข้อมูลเมื่อ props เปลี่ยน
  useEffect(() => {
    setCustomerData(customer);
    setContractAmount(totalAmount);
  }, [customer, totalAmount]);

  // ดึงแผนผ่อนชำระจากฐานข้อมูล
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: plans, error } = await supabase
          .from('installment_plans')
          .select('*')
          .eq('is_active', true)
          .order('number_of_installments');

        if (error) throw error;
        
        // แปลงข้อมูลจากฐานข้อมูลให้ตรงกับ InstallmentPlan type
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

        setActivePlans(mappedPlans);
      } catch (error) {
        console.error('Error fetching installment plans:', error);
      }
    };

    fetchPlans();
  }, []);

  // ดึงข้อมูลลูกค้าเก่าเมื่อเปิด dialog
  useEffect(() => {
    if (open) {
      fetchExistingCustomers();
    }
  }, [open]);

  const [activePlans, setActivePlans] = useState<InstallmentPlan[]>([]);
  const eligibility = checkInstallmentEligibility(customerData, contractAmount);

  // คำนวณข้อมูลการผ่อน
  const installmentCalculation = selectedPlan ? {
    downPayment: Math.round(contractAmount * (selectedPlan.downPaymentPercent / 100) * 100) / 100,
    financedAmount: contractAmount - Math.round(contractAmount * (selectedPlan.downPaymentPercent / 100) * 100) / 100,
    monthlyPayment: 0,
    totalInterest: 0,
    totalPayable: 0
  } : null;

  if (installmentCalculation && selectedPlan) {
    installmentCalculation.monthlyPayment = calculateMonthlyPayment(
      installmentCalculation.financedAmount,
      selectedPlan.interestRate,
      selectedPlan.months
    );
    installmentCalculation.totalInterest = calculateTotalInterest(
      installmentCalculation.financedAmount,
      installmentCalculation.monthlyPayment,
      selectedPlan.months
    );
    installmentCalculation.totalPayable = installmentCalculation.financedAmount +
      installmentCalculation.totalInterest + selectedPlan.processingFee;
  }

  const handleCustomerUpdate = (field: keyof Customer, value: any) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuarantorUpdate = (field: keyof Customer, value: any) => {
    setGuarantor(prev => ({ ...prev, [field]: value }));
  };

  // ฟังก์ชันสำหรับรีเซ็ตค่าแก้ไข
  const resetCustomValues = () => {
    setCustomInterestRate(null);
    setCustomDownPaymentPercent(null);
  };

  // ฟังก์ชันสำหรับคำนวณค่าต่างๆ ด้วยค่าที่แก้ไขได้
  const getEffectiveInterestRate = (plan: InstallmentPlan) => {
    return customInterestRate !== null ? customInterestRate : plan.interestRate;
  };

  const getEffectiveDownPaymentPercent = (plan: InstallmentPlan) => {
    return customDownPaymentPercent !== null ? customDownPaymentPercent : plan.downPaymentPercent;
  };

  // ฟังก์ชันสำหรับดึงลูกค้าเก่า
  const fetchExistingCustomers = async () => {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExistingCustomers(customers || []);
    } catch (error) {
      console.error('Error fetching existing customers:', error);
    }
  };

  // ฟังก์ชันสำหรับดึงประวัติลูกค้า
  const fetchCustomerHistory = async (customerId: string) => {
    try {
      const { data: contracts, error } = await supabase
        .from('installment_contracts')
        .select(`
          *,
          installment_plans (
            name,
            number_of_installments,
            interest_rate
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerHistory(contracts || []);
    } catch (error) {
      console.error('Error fetching customer history:', error);
    }
  };

  // ฟังก์ชันสำหรับดึงผู้ค้ำประกันเก่า
  const fetchExistingGuarantors = async (customerId: string) => {
    try {
      const { data: guarantors, error } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingGuarantors(guarantors || []);
      return guarantors || [];
    } catch (error) {
      console.error('Error fetching existing guarantors:', error);
      return [];
    }
  };

  // ฟังก์ชันสำหรับเลือกลูกค้าเก่า
  const handleSelectExistingCustomer = async (customer: Customer) => {
    setSelectedExistingCustomer(customer);
    
    // ดึงประวัติและผู้ค้ำประกัน
    await fetchCustomerHistory(customer.id);
    const guarantors = await fetchExistingGuarantors(customer.id);
    
    // ถ้ามีผู้ค้ำประกันเก่า ให้เลือกคนล่าสุด
    if (guarantors && guarantors.length > 0) {
      setGuarantor(guarantors[0]);
    }
  };

  // ฟังก์ชันสำหรับยืนยันการเลือกลูกค้าเก่า
  const confirmSelectExistingCustomer = () => {
    if (selectedExistingCustomer) {
      setCustomerData(selectedExistingCustomer);
      setShowExistingCustomer(false);
      setSelectedExistingCustomer(null);
      setCustomerHistory([]);
      setSearchTerm('');
    }
  };

  // ฟังก์ชันสำหรับกรองลูกค้า
  const filteredCustomers = existingCustomers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ฟังก์ชันสำหรับสร้างแผนใหม่
  const handleCreateNewPlan = async () => {
    try {
      const planData = {
        plan_number: `CUSTOM-${Date.now()}`,
        name: newPlan.name,
        description: newPlan.description || `แผนกำหนดเอง ${newPlan.months} งวด`,
        number_of_installments: newPlan.months,
        interest_rate: newPlan.interestRate,
        down_payment_percent: newPlan.downPaymentPercent,
        processing_fee: newPlan.processingFee,
        total_amount: 1000000, // ยอดสูงสุดเริ่มต้น
        installment_amount: 0, // จะคำนวณใหม่
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      };

      const { data: createdPlan, error } = await supabase
        .from('installment_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      // แปลงข้อมูลให้ตรงกับ InstallmentPlan type
      const mappedPlan = {
        id: createdPlan.id,
        name: createdPlan.name,
        planNumber: createdPlan.plan_number,
        months: createdPlan.number_of_installments,
        interestRate: createdPlan.interest_rate,
        downPaymentPercent: createdPlan.down_payment_percent,
        processingFee: createdPlan.processing_fee,
        minAmount: 0,
        maxAmount: createdPlan.total_amount,
        requiresGuarantor: false,
        isActive: createdPlan.is_active,
        description: createdPlan.description
      };

      // เพิ่มแผนใหม่เข้าไปใน activePlans
      setActivePlans(prev => [...prev, mappedPlan]);
      
      // เลือกแผนใหม่ทันที
      setSelectedPlan(mappedPlan);
      
      // ปิด dialog สร้างแผน
      setShowCreatePlan(false);
      
      // รีเซ็ตฟอร์ม
      setNewPlan({
        name: '',
        months: 12,
        interestRate: 0,
        downPaymentPercent: 20,
        processingFee: 500,
        description: ''
      });

    } catch (error) {
      console.error('Error creating new plan:', error);
      // TODO: แสดง error message ให้ผู้ใช้
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    try {
      let guarantorId = null;
      let customerId = null;

      // ตรวจสอบและสร้างลูกค้าในฐานข้อมูล (ถ้าจำเป็น)
      if (!customerData.id || typeof customerData.id === 'string' && !customerData.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // ลูกค้ายังไม่มีในฐานข้อมูล หรือ id ไม่ใช่ UUID format
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('id_card', customerData.idCard)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // สร้างลูกค้าใหม่
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert([{
              name: customerData.name,
              phone: customerData.phone,
              email: customerData.email,
              address: customerData.address,
              id_card: customerData.idCard,
              occupation: customerData.occupation,
              monthly_income: customerData.monthlyIncome,
              branch_id: customerData.branchId || null
            }])
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }
      } else {
        customerId = customerData.id;
      }
      
      // สร้างผู้ค้ำประกันก่อน (ถ้าจำเป็น)
      if (requireGuarantor && guarantor.name) {
        const guarantorData = {
          ...guarantor,
          // Required fields for Guarantor type
          name: guarantor.name,
          phone: guarantor.phone || '',
          address: guarantor.address || 'ไม่ระบุ',
          id_card: guarantor.idCard || '',
          occupation: guarantor.occupation || 'ไม่ระบุ',
          monthly_income: guarantor.monthlyIncome || 0,
          // แปลง emergencyContact ให้เป็น format ที่ถูกต้อง
          emergencyContact: {
            name: guarantor.emergencyContact?.name || '',
            phone: guarantor.emergencyContact?.phone || '',
            relationship: guarantor.emergencyContact?.relationship || ''
          },
          createdBy: null, // TODO: ใช้ user ID จริงเมื่อมีระบบ authentication
          branchId: customerData.branchId || null
        };
        
        const createdGuarantor = await createGuarantor(guarantorData);
        guarantorId = createdGuarantor.id;
      }

      // สร้างสัญญาในฐานข้อมูล
      const effectiveInterestRate = getEffectiveInterestRate(selectedPlan);
      const effectiveDownPaymentPercent = getEffectiveDownPaymentPercent(selectedPlan);
      
      const contract = await createContract({
        customer: { ...customerData, id: customerId },
        plan: {
          ...selectedPlan,
          interestRate: effectiveInterestRate,
          downPaymentPercent: effectiveDownPaymentPercent
        },
        totalAmount: contractAmount,
        downPayment: Math.round(contractAmount * (effectiveDownPaymentPercent / 100) * 100) / 100,
        guarantorId: guarantorId,
        collateral: collateral || undefined,
        terms: terms || undefined,
        notes: notes || undefined,
        // serialNumbers: selectedSerialNumbers // TODO: Add serialNumbers support to createContract function
      });

      onConfirm(contract);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating contract:', error);
      // TODO: แสดง error message ให้ผู้ใช้
    }
  };

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              ข้อมูลลูกค้า
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExistingCustomer(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <User className="h-4 w-4 mr-2" />
              เลือกลูกค้าเก่า
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => handleCustomerUpdate('name', e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>
            <div>
              <Label htmlFor="idCard">เลขบัตรประชาชน *</Label>
              <Input
                id="idCard"
                value={customerData.idCard || ''}
                onChange={(e) => handleCustomerUpdate('idCard', e.target.value)}
                placeholder="1-2345-67890-12-3"
              />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <Input
                id="phone"
                value={customerData.phone || ''}
                onChange={(e) => handleCustomerUpdate('phone', e.target.value)}
                placeholder="08X-XXX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email || ''}
                onChange={(e) => handleCustomerUpdate('email', e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <Label htmlFor="occupation">อาชีพ *</Label>
              <Input
                id="occupation"
                value={customerData.occupation || ''}
                onChange={(e) => handleCustomerUpdate('occupation', e.target.value)}
                placeholder="เช่น พนักงานบริษัท, ค้าขาย"
              />
            </div>
            <div>
              <Label htmlFor="monthlyIncome">รายได้ต่อเดือน (บาท) *</Label>
              <Input
                id="monthlyIncome"
                type="number"
                value={customerData.monthlyIncome || ''}
                onChange={(e) => handleCustomerUpdate('monthlyIncome', parseFloat(e.target.value) || 0)}
                placeholder="30000"
              />
              {(customerData.monthlyIncome || 0) < 15000 && (customerData.monthlyIncome || 0) > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  💡 รายได้น้อยกว่า 15,000 บาท จะต้องมีผู้ค้ำประกันในการทำสัญญา
                </p>
              )}
            </div>
          </div>

          <div>
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
                handleCustomerUpdate('address', address.fullAddress);
                handleCustomerUpdate('houseNumber', address.houseNumber);
                handleCustomerUpdate('province', address.province);
                handleCustomerUpdate('district', address.district);
                handleCustomerUpdate('subdistrict', address.subdistrict);
                handleCustomerUpdate('zipCode', address.zipCode);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workplace">สถานที่ทำงาน</Label>
              <Input
                id="workplace"
                value={customerData.workplace || ''}
                onChange={(e) => handleCustomerUpdate('workplace', e.target.value)}
                placeholder="ชื่อบริษัท/หน่วยงาน"
              />
            </div>
            <div>
              <Label htmlFor="workAddress">ที่อยู่ที่ทำงาน</Label>
              <Input
                id="workAddress"
                value={customerData.workAddress || ''}
                onChange={(e) => handleCustomerUpdate('workAddress', e.target.value)}
                placeholder="ที่อยู่ที่ทำงาน"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-medium">ผู้ติดต่อฉุกเฉิน</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="emergencyName">ชื่อ-นามสกุล</Label>
                <Input
                  id="emergencyName"
                  value={customerData.emergencyContact?.name || ''}
                  onChange={(e) => handleCustomerUpdate('emergencyContact', {
                    ...customerData.emergencyContact,
                    name: e.target.value
                  })}
                  placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">เบอร์โทรศัพท์</Label>
                <Input
                  id="emergencyPhone"
                  value={customerData.emergencyContact?.phone || ''}
                  onChange={(e) => handleCustomerUpdate('emergencyContact', {
                    ...customerData.emergencyContact,
                    phone: e.target.value
                  })}
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="emergencyRelation">ความสัมพันธ์</Label>
                <Select
                  value={customerData.emergencyContact?.relationship || ''}
                  onValueChange={(value) => handleCustomerUpdate('emergencyContact', {
                    ...customerData.emergencyContact,
                    relationship: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกความสัมพันธ์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="บิดา">บิดา</SelectItem>
                    <SelectItem value="มารดา">มารดา</SelectItem>
                    <SelectItem value="คู่สมรส">คู่สมรส</SelectItem>
                    <SelectItem value="พี่น้อง">พี่น้อง</SelectItem>
                    <SelectItem value="เพื่อน">เพื่อน</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            ข้อมูลสัญญา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="contractAmount">ยอดเงินที่ต้องการผ่อนชำระ (บาท) *</Label>
            <Input
              id="contractAmount"
              type="number"
              value={contractAmount || ''}
              onChange={(e) => setContractAmount(parseFloat(e.target.value) || 0)}
              placeholder="กรอกยอดเงิน"
              min="1000"
              step="1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ยอดเงินขั้นต่ำ 1,000 บาท
            </p>
          </div>
        </CardContent>
      </Card>

      {!eligibility.eligible && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">ไม่สามารถอนุมัติการผ่อนชำระได้:</div>
            <ul className="list-disc list-inside space-y-1">
              {eligibility.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          ยกเลิก
        </Button>
        <Button
          onClick={() => setStep('plan')}
          disabled={!eligibility.eligible || !customerData.name || !customerData.idCard || !customerData.phone || !customerData.address || !customerData.occupation || !customerData.monthlyIncome || !contractAmount || contractAmount < 1000}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderPlanStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            เลือกแผนผ่อนชำระ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {activePlans.map((plan) => {
              const effectiveInterestRate = getEffectiveInterestRate(plan);
              const effectiveDownPaymentPercent = getEffectiveDownPaymentPercent(plan);
              const downPayment = Math.round(contractAmount * (effectiveDownPaymentPercent / 100) * 100) / 100;
              const financedAmount = contractAmount - downPayment;
              const monthlyPayment = calculateMonthlyPayment(financedAmount, effectiveInterestRate, plan.months);

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-colors ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  onClick={() => {
                    setSelectedPlan(plan);
                    // รีเซ็ตค่าแก้ไขเมื่อเลือกแผนใหม่
                    if (selectedPlan?.id !== plan.id) {
                      resetCustomValues();
                    }
                    // ตรวจสอบว่าต้องมีผู้ค้ำประกันหรือไม่
                    const needsGuarantor = contractAmount > 100000 ||
                      plan.months > 24 ||
                      (customerData.monthlyIncome || 0) < 15000 ||
                      (customerData.monthlyIncome || 0) < monthlyPayment * 3;
                    setRequireGuarantor(needsGuarantor);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={effectiveInterestRate === 0 ? 'secondary' : 'default'}>
                          {effectiveInterestRate === 0 ? 'ไม่มีดอกเบี้ย' : `${effectiveInterestRate}% ต่อปี`}
                          {customInterestRate !== null && <span className="ml-1 text-xs">(แก้ไข)</span>}
                        </Badge>
                        {contractAmount > 100000 || plan.months > 24 || (customerData.monthlyIncome || 0) < 15000 ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            ต้องมีผู้ค้ำ
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">เงินดาวน์:</span>
                        <span className="ml-2 font-medium">{downPayment.toLocaleString()} บาท</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ค่างวด:</span>
                        <span className="ml-2 font-medium">{monthlyPayment.toLocaleString()} บาท</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">จำนวนงวด:</span>
                        <span className="ml-2 font-medium">{plan.months} งวด</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ค่าธรรมเนียม:</span>
                        <span className="ml-2 font-medium">{plan.processingFee.toLocaleString()} บาท</span>
                      </div>
                    </div>

                    {/* ส่วนแก้ไขแผน (แสดงเมื่อเลือกแผนนี้) */}
                    {selectedPlan?.id === plan.id && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3">ปรับแต่งแผน</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`interest-${plan.id}`} className="text-sm">
                              ดอกเบี้ย (% ต่อปี)
                            </Label>
                            <Input
                              id={`interest-${plan.id}`}
                              type="number"
                              value={customInterestRate !== null ? customInterestRate : plan.interestRate}
                              onChange={(e) => setCustomInterestRate(parseFloat(e.target.value) || 0)}
                              min="0"
                              max="50"
                              step="0.1"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`downpayment-${plan.id}`} className="text-sm">
                              เงินดาวน์ (%)
                            </Label>
                            <Input
                              id={`downpayment-${plan.id}`}
                              type="number"
                              value={customDownPaymentPercent !== null ? customDownPaymentPercent : plan.downPaymentPercent}
                              onChange={(e) => setCustomDownPaymentPercent(parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="1"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetCustomValues}
                            className="text-xs"
                          >
                            รีเซ็ต
                          </Button>
                          <div className="text-xs text-blue-700 flex items-center">
                            💡 การเปลี่ยนแปลงจะมีผลกับค่างวดและเงินดาวน์ทันที
                          </div>
                        </div>
                      </div>
                    )}

                    {/* แสดงคำเตือนถ้ารายได้ไม่เพียงพอ */}
                    {(customerData.monthlyIncome || 0) < monthlyPayment * 3 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          รายได้ต่อเดือนควรมากกว่า {(monthlyPayment * 3).toLocaleString()} บาท (3 เท่าของค่างวด)
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ส่วนสร้างแผนใหม่ */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">สร้างแผนใหม่</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreatePlan(!showCreatePlan)}
            >
              {showCreatePlan ? 'ยกเลิก' : '+ สร้างแผนใหม่'}
            </Button>
          </div>
        </CardHeader>
        
        {showCreatePlan && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planName">ชื่อแผน *</Label>
                <Input
                  id="planName"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น แผนพิเศษ 18 งวด"
                />
              </div>
              <div>
                <Label htmlFor="planMonths">จำนวนงวด *</Label>
                <Input
                  id="planMonths"
                  type="number"
                  value={newPlan.months}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, months: parseInt(e.target.value) || 12 }))}
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <Label htmlFor="planInterest">ดอกเบี้ย (% ต่อปี) *</Label>
                <Input
                  id="planInterest"
                  type="number"
                  value={newPlan.interestRate}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="planDownPayment">เงินดาวน์ (%) *</Label>
                <Input
                  id="planDownPayment"
                  type="number"
                  value={newPlan.downPaymentPercent}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, downPaymentPercent: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="planFee">ค่าธรรมเนียม (บาท)</Label>
                <Input
                  id="planFee"
                  type="number"
                  value={newPlan.processingFee}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, processingFee: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="planDescription">คำอธิบาย</Label>
              <Textarea
                id="planDescription"
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="คำอธิบายแผนผ่อนชำระ (ไม่บังคับ)"
                rows={2}
              />
            </div>

            {/* แสดงตัวอย่างการคำนวณ */}
            {newPlan.name && contractAmount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">ตัวอย่างการคำนวณ</h4>
                <div className="text-sm text-green-700 grid grid-cols-2 gap-2">
                  <p>ยอดสินค้า: ฿{contractAmount.toLocaleString()}</p>
                  <p>เงินดาวน์: ฿{Math.round(contractAmount * (newPlan.downPaymentPercent / 100)).toLocaleString()}</p>
                  <p>ยอดผ่อน: ฿{Math.round(contractAmount * (1 - newPlan.downPaymentPercent / 100)).toLocaleString()}</p>
                  <p>ค่างวด: ฿{calculateMonthlyPayment(
                    contractAmount * (1 - newPlan.downPaymentPercent / 100),
                    newPlan.interestRate,
                    newPlan.months
                  ).toLocaleString()}/เดือน</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreateNewPlan}
                disabled={!newPlan.name || newPlan.months < 1}
                className="bg-green-600 hover:bg-green-700"
              >
                สร้างแผน
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreatePlan(false);
                  setNewPlan({
                    name: '',
                    months: 12,
                    interestRate: 0,
                    downPaymentPercent: 20,
                    processingFee: 500,
                    description: ''
                  });
                }}
              >
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {selectedPlan && requireGuarantor && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">แผนนี้ต้องมีผู้ค้ำประกัน</div>
            <p className="text-sm">เนื่องจาก: {[
              contractAmount > 100000 && 'ยอดเงินสูงกว่า 100,000 บาท',
              selectedPlan?.months > 24 && 'ระยะเวลาผ่อนนานกว่า 24 งวด',
              (customerData.monthlyIncome || 0) < 15000 && 'รายได้ต่อเดือนน้อยกว่า 15,000 บาท',
              (customerData.monthlyIncome || 0) < (selectedPlan ? calculateMonthlyPayment(
                contractAmount - (contractAmount * selectedPlan.downPaymentPercent / 100),
                selectedPlan.interestRate,
                selectedPlan.months
              ) * 3 : 0) && 'รายได้น้อยกว่า 3 เท่าของค่างวด'
            ].filter(Boolean).join(', ')}</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('customer')}>
          ย้อนกลับ
        </Button>
        <Button
          onClick={() => setStep('serials')}
          disabled={!selectedPlan}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderSerialsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            เลือกหมายเลขเครื่อง (Serial Numbers)
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            เลือกหมายเลขเครื่องที่จะผูกกับสัญญาเช่าซื้อนี้
          </p>
        </CardHeader>
        <CardContent>
          <SerialNumberSelector
            branchId="main-branch"
            selectedProducts={[]}
            onSelectionChange={(selections) => {
              // แปลง SerialNumberSelection[] เป็น SerialNumber[]
              const serialNumbers = selections.flatMap(selection => 
                selection.selectedSerialNumbers.map(snId => ({
                  id: snId,
                  serialNumber: snId,
                  productId: selection.productId,
                  status: 'available' as const,
                  condition: 'new' as const,
                  warehouseId: 'main-warehouse',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }))
              );
              setSelectedSerialNumbers(serialNumbers);
            }}
            initialSelections={[]}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('plan')}>
          ย้อนกลับ
        </Button>
        <Button
          onClick={() => setStep(requireGuarantor ? 'guarantor' : 'details')}
          disabled={selectedSerialNumbers.length === 0}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderGuarantorStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            ข้อมูลผู้ค้ำประกัน
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            กรุณากรอกข้อมูลผู้ค้ำประกันให้ครบถ้วน เพื่อใช้ในการพิจารณาอนุมัติสัญญา
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guarantorName">ชื่อ-นามสกุล *</Label>
              <Input
                id="guarantorName"
                value={guarantor.name || ''}
                onChange={(e) => handleGuarantorUpdate('name', e.target.value)}
                placeholder="กรอกชื่อ-นามสกุลผู้ค้ำประกัน"
              />
            </div>
            <div>
              <Label htmlFor="guarantorIdCard">เลขบัตรประชาชน *</Label>
              <Input
                id="guarantorIdCard"
                value={guarantor.idCard || ''}
                onChange={(e) => handleGuarantorUpdate('idCard', e.target.value)}
                placeholder="1-2345-67890-12-3"
              />
            </div>
            <div>
              <Label htmlFor="guarantorPhone">เบอร์โทรศัพท์ *</Label>
              <Input
                id="guarantorPhone"
                value={guarantor.phone || ''}
                onChange={(e) => handleGuarantorUpdate('phone', e.target.value)}
                placeholder="08X-XXX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="guarantorEmail">อีเมล</Label>
              <Input
                id="guarantorEmail"
                type="email"
                value={guarantor.email || ''}
                onChange={(e) => handleGuarantorUpdate('email', e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <Label htmlFor="guarantorOccupation">อาชีพ *</Label>
              <Input
                id="guarantorOccupation"
                value={guarantor.occupation || ''}
                onChange={(e) => handleGuarantorUpdate('occupation', e.target.value)}
                placeholder="เช่น พนักงานบริษัท, ค้าขาย"
              />
            </div>
            <div>
              <Label htmlFor="guarantorIncome">รายได้ต่อเดือน (บาท) *</Label>
              <Input
                id="guarantorIncome"
                type="number"
                value={guarantor.monthlyIncome || ''}
                onChange={(e) => handleGuarantorUpdate('monthlyIncome', parseFloat(e.target.value) || 0)}
                placeholder="30000"
              />
            </div>
          </div>

          <div>
            <ThaiAddressSelector
              label="ที่อยู่ผู้ค้ำประกัน"
              required={true}
              value={{
                houseNumber: guarantor.houseNumber,
                province: guarantor.province,
                district: guarantor.district,
                subdistrict: guarantor.subdistrict,
                zipCode: guarantor.zipCode
              }}
              onChange={(address) => {
                handleGuarantorUpdate('address', address.fullAddress);
                handleGuarantorUpdate('houseNumber', address.houseNumber);
                handleGuarantorUpdate('province', address.province);
                handleGuarantorUpdate('district', address.district);
                handleGuarantorUpdate('subdistrict', address.subdistrict);
                handleGuarantorUpdate('zipCode', address.zipCode);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guarantorWorkplace">สถานที่ทำงาน</Label>
              <Input
                id="guarantorWorkplace"
                value={guarantor.workplace || ''}
                onChange={(e) => handleGuarantorUpdate('workplace', e.target.value)}
                placeholder="ชื่อบริษัท/หน่วยงาน"
              />
            </div>
            <div>
              <Label htmlFor="guarantorWorkAddress">ที่อยู่ที่ทำงาน</Label>
              <Input
                id="guarantorWorkAddress"
                value={guarantor.workAddress || ''}
                onChange={(e) => handleGuarantorUpdate('workAddress', e.target.value)}
                placeholder="ที่อยู่ที่ทำงาน"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-medium">ผู้ติดต่อฉุกเฉินของผู้ค้ำประกัน</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="guarantorEmergencyName">ชื่อ-นามสกุล</Label>
                <Input
                  id="guarantorEmergencyName"
                  value={guarantor.emergencyContact?.name || ''}
                  onChange={(e) => handleGuarantorUpdate('emergencyContact', {
                    ...guarantor.emergencyContact,
                    name: e.target.value
                  })}
                  placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                />
              </div>
              <div>
                <Label htmlFor="guarantorEmergencyPhone">เบอร์โทรศัพท์</Label>
                <Input
                  id="guarantorEmergencyPhone"
                  value={guarantor.emergencyContact?.phone || ''}
                  onChange={(e) => handleGuarantorUpdate('emergencyContact', {
                    ...guarantor.emergencyContact,
                    phone: e.target.value
                  })}
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div>
                <Label htmlFor="guarantorEmergencyRelation">ความสัมพันธ์</Label>
                <Select
                  value={guarantor.emergencyContact?.relationship || ''}
                  onValueChange={(value) => handleGuarantorUpdate('emergencyContact', {
                    ...guarantor.emergencyContact,
                    relationship: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกความสัมพันธ์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="บิดา">บิดา</SelectItem>
                    <SelectItem value="มารดา">มารดา</SelectItem>
                    <SelectItem value="คู่สมรส">คู่สมรส</SelectItem>
                    <SelectItem value="พี่น้อง">พี่น้อง</SelectItem>
                    <SelectItem value="เพื่อน">เพื่อน</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('plan')}>
          ย้อนกลับ
        </Button>
        <Button
          onClick={() => setStep('details')}
          disabled={!guarantor.name || !guarantor.idCard || !guarantor.phone || !guarantor.address || !guarantor.occupation || !guarantor.monthlyIncome}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ข้อมูลเพิ่มเติมและเงื่อนไข
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="collateral">หลักประกัน</Label>
            <Input
              id="collateral"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder="เช่น รถยนต์ ทะเบียน กข-1234, บ้าน เลขที่ 123/45"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ระบุรายละเอียดหลักประกัน (ถ้ามี) เช่น รถยนต์ บ้าน ที่ดิน เป็นต้น
            </p>
          </div>

          <div>
            <Label htmlFor="terms">เงื่อนไขพิเศษ</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              placeholder="เช่น ชำระล่วงหน้าได้โดยไม่มีค่าปรับ, ปรับอัตราดอกเบี้ยหากชำระล่าช้า"
            />
            <p className="text-xs text-muted-foreground mt-1">
              ระบุเงื่อนไขพิเศษของสัญญา (ถ้ามี)
            </p>
          </div>

          <div>
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับลูกค้าหรือสัญญา"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(requireGuarantor ? 'guarantor' : 'serials')}>
          ย้อนกลับ
        </Button>
        <Button onClick={() => setStep('review')}>
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      {selectedPlan && installmentCalculation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                สรุปการผ่อนชำระ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า:</span>
                    <span className="font-medium">{contractAmount.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เงินดาวน์ ({selectedPlan.downPaymentPercent}%):</span>
                    <span className="font-medium">{installmentCalculation.downPayment.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ยอดที่ผ่อน:</span>
                    <span className="font-medium">{installmentCalculation.financedAmount.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ดอกเบี้ยรวม:</span>
                    <span className="font-medium">{installmentCalculation.totalInterest.toLocaleString()} บาท</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>ค่าธรรมเนียม:</span>
                    <span className="font-medium">{selectedPlan.processingFee.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวนงวด:</span>
                    <span className="font-medium">{selectedPlan.months} งวด</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ค่างวดต่อเดือน:</span>
                    <span className="font-medium">{installmentCalculation.monthlyPayment.toLocaleString()} บาท</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>ยอดที่ต้องชำระรวม:</span>
                    <span>{installmentCalculation.totalPayable.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ชื่อ:</span>
                    <span className="font-medium">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เบอร์โทร:</span>
                    <span className="font-medium">{customerData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">บัตรประชาชน:</span>
                    <span className="font-medium">{customerData.idCard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">อาชีพ:</span>
                    <span className="font-medium">{customerData.occupation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รายได้:</span>
                    <span className="font-medium">{(customerData.monthlyIncome || 0).toLocaleString()} บาท/เดือน</span>
                  </div>
                  {customerData.emergencyContact?.name && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ติดต่อฉุกเฉิน:</span>
                        <span className="font-medium">{customerData.emergencyContact.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เบอร์:</span>
                        <span className="font-medium">{customerData.emergencyContact.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {requireGuarantor && guarantor.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ข้อมูลผู้ค้ำประกัน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ชื่อ:</span>
                      <span className="font-medium">{guarantor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เบอร์โทร:</span>
                      <span className="font-medium">{guarantor.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">บัตรประชาชน:</span>
                      <span className="font-medium">{guarantor.idCard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">อาชีพ:</span>
                      <span className="font-medium">{guarantor.occupation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">รายได้:</span>
                      <span className="font-medium">{(guarantor.monthlyIncome || 0).toLocaleString()} บาท/เดือน</span>
                    </div>
                    {guarantor.emergencyContact?.name && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ติดต่อฉุกเฉิน:</span>
                          <span className="font-medium">{guarantor.emergencyContact.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">เบอร์:</span>
                          <span className="font-medium">{guarantor.emergencyContact.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              )}
          </div>

          {/* แสดงรายการ Serial Numbers */}
          {selectedSerialNumbers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  หมายเลขเครื่องที่เลือก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedSerialNumbers.map((serial, index) => (
                    <div key={serial.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{serial.serial_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {serial.product_name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {serial.brand} | {serial.model}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">฿{serial.price?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{serial.status}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>รวม {selectedSerialNumbers.length} รายการ:</span>
                      <span>฿{selectedSerialNumbers.reduce((sum, serial) => sum + (serial.price || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(collateral || terms || notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ข้อมูลเพิ่มเติม
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {collateral && (
                    <div>
                      <span className="text-muted-foreground font-medium">หลักประกัน:</span>
                      <p className="mt-1">{collateral}</p>
                    </div>
                  )}
                  {terms && (
                    <div>
                      <span className="text-muted-foreground font-medium">เงื่อนไขพิเศษ:</span>
                      <p className="mt-1 whitespace-pre-wrap">{terms}</p>
                    </div>
                  )}
                  {notes && (
                    <div>
                      <span className="text-muted-foreground font-medium">หมายเหตุ:</span>
                      <p className="mt-1 whitespace-pre-wrap">{notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('details')}>
          ย้อนกลับ
        </Button>
        <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
          <CreditCard className="h-4 w-4 mr-2" />
          ยืนยันสัญญาผ่อนชำระ
        </Button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'customer': return 'ข้อมูลลูกค้า';
      case 'plan': return 'เลือกแผนผ่อนชำระ';
      case 'guarantor': return 'ข้อมูลผู้ค้ำประกัน';
      case 'details': return 'ข้อมูลเพิ่มเติม';
      case 'review': return 'ตรวจสอบข้อมูล';
      default: return 'สัญญาผ่อนชำระ';
    }
  };

  const renderMainDialog = () => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[
              { key: 'customer', label: 'ข้อมูลลูกค้า' },
              { key: 'plan', label: 'เลือกแผน' },
              { key: 'serials', label: 'เลือก SN' },
              { key: 'guarantor', label: 'ผู้ค้ำประกัน' },
              { key: 'details', label: 'ข้อมูลเพิ่มเติม' },
              { key: 'review', label: 'ตรวจสอบ' }
            ].map((stepInfo, index, array) => (
              <React.Fragment key={stepInfo.key}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === stepInfo.key ? 'bg-primary text-primary-foreground' :
                    array.findIndex(s => s.key === step) > index ? 'bg-green-500 text-white' :
                      stepInfo.key === 'guarantor' && !requireGuarantor ? 'bg-gray-300 text-gray-500' : 'bg-muted'
                    }`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-1 ${step === stepInfo.key ? 'text-primary font-medium' :
                    stepInfo.key === 'guarantor' && !requireGuarantor ? 'text-gray-400' : 'text-muted-foreground'
                    }`}>
                    {stepInfo.label}
                  </span>
                </div>
                {index < array.length - 1 && <div className="w-8 h-0.5 bg-muted mt-4" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 'customer' && renderCustomerStep()}
        {step === 'plan' && renderPlanStep()}
        {step === 'serials' && renderSerialsStep()}
        {step === 'guarantor' && renderGuarantorStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'review' && renderReviewStep()}
      </DialogContent>
    </Dialog>
  );

  // Dialog สำหรับเลือกลูกค้าเก่า
  const renderExistingCustomerDialog = () => (
    <Dialog open={showExistingCustomer} onOpenChange={setShowExistingCustomer}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            เลือกลูกค้าเก่า
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ช่องค้นหา */}
          <div>
            <Label htmlFor="search">ค้นหาลูกค้า</Label>
            <Input
              id="search"
              placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* รายการลูกค้า */}
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ไม่มีข้อมูลลูกค้า'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className={`cursor-pointer hover:bg-blue-50 border-2 transition-colors ${
                    selectedExistingCustomer?.id === customer.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-blue-200'
                  }`}
                  onClick={() => handleSelectExistingCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{customer.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            ID: {customer.id?.slice(-8)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <p><strong>เบอร์โทร:</strong> {customer.phone}</p>
                            <p><strong>อีเมล:</strong> {customer.email || 'ไม่ระบุ'}</p>
                            <p><strong>อาชีพ:</strong> {customer.occupation || 'ไม่ระบุ'}</p>
                          </div>
                          <div>
                            <p><strong>รายได้:</strong> ฿{customer.monthlyIncome?.toLocaleString() || 'ไม่ระบุ'}</p>
                            <p><strong>ที่อยู่:</strong> {customer.address || 'ไม่ระบุ'}</p>
                            <p><strong>วันที่สร้าง:</strong> {new Date(customer.created_at || '').toLocaleDateString('th-TH')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="ml-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectExistingCustomer(customer);
                        }}
                      >
                        เลือก
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* แสดงประวัติลูกค้าที่เลือก */}
          {selectedExistingCustomer && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ประวัติการทำสัญญาของ {selectedExistingCustomer.name}
              </h4>
              
              {customerHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">ไม่มีประวัติการทำสัญญา</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customerHistory.map((contract, index) => (
                    <div key={contract.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p><strong>สัญญาที่ {index + 1}:</strong> ฿{contract.total_amount?.toLocaleString()}</p>
                          <p><strong>แผน:</strong> {contract.installment_plans?.name} ({contract.installment_plans?.number_of_installments} งวด)</p>
                          <p><strong>สถานะ:</strong> 
                            <Badge 
                              variant={contract.status === 'active' ? 'default' : 'secondary'}
                              className="ml-1"
                            >
                              {contract.status}
                            </Badge>
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* แสดงผู้ค้ำประกันเก่า */}
              {existingGuarantors.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2 text-sm">ผู้ค้ำประกันเก่า:</h5>
                  <div className="space-y-2">
                    {existingGuarantors.map((guarantor, index) => (
                      <div key={guarantor.id} className="bg-green-50 p-2 rounded text-sm">
                        <p><strong>{guarantor.name}</strong> - {guarantor.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {guarantor.occupation} | รายได้: ฿{guarantor.monthly_income?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowExistingCustomer(false);
                setSelectedExistingCustomer(null);
                setCustomerHistory([]);
                setExistingGuarantors([]);
                setSearchTerm('');
              }}
            >
              ยกเลิก
            </Button>
            {selectedExistingCustomer && (
              <Button onClick={confirmSelectExistingCustomer}>
                ใช้ข้อมูลลูกค้านี้
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {renderMainDialog()}
      {renderExistingCustomerDialog()}
    </>
  );
}