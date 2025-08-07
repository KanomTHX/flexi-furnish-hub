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
import { Customer, InstallmentPlan, InstallmentContract } from '@/types/pos';
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
import { AlertTriangle, Calculator, CreditCard, FileText, User } from 'lucide-react';

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
  const [step, setStep] = useState<'customer' | 'plan' | 'guarantor' | 'details' | 'review'>('customer');

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
          name: plan.plan_name,
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
      const contract = await createContract({
        customer: { ...customerData, id: customerId },
        plan: selectedPlan,
        totalAmount: contractAmount,
        downPayment: Math.round(contractAmount * (selectedPlan.downPaymentPercent / 100) * 100) / 100,
        guarantorId: guarantorId,
        collateral: collateral || undefined,
        terms: terms || undefined,
        notes: notes || undefined
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
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            ข้อมูลลูกค้า
          </CardTitle>
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
              const downPayment = Math.round(contractAmount * (plan.downPaymentPercent / 100) * 100) / 100;
              const financedAmount = contractAmount - downPayment;
              const monthlyPayment = calculateMonthlyPayment(financedAmount, plan.interestRate, plan.months);

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-colors ${selectedPlan?.id === plan.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  onClick={() => {
                    setSelectedPlan(plan);
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
                        <Badge variant={plan.interestRate === 0 ? 'secondary' : 'default'}>
                          {plan.interestRate === 0 ? 'ไม่มีดอกเบี้ย' : `${plan.interestRate}% ต่อปี`}
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
          onClick={() => setStep(requireGuarantor ? 'guarantor' : 'details')}
          disabled={!selectedPlan}
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
        <Button variant="outline" onClick={() => setStep(requireGuarantor ? 'guarantor' : 'plan')}>
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

  return (
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
        {step === 'guarantor' && renderGuarantorStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'review' && renderReviewStep()}
      </DialogContent>
    </Dialog>
  );
}