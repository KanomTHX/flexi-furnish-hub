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
import { mockInstallmentPlans, getActiveInstallmentPlans } from '@/data/mockInstallmentPlans';
import { 
  createInstallmentContract, 
  checkInstallmentEligibility,
  calculateMonthlyPayment,
  calculateTotalInterest
} from '@/utils/installmentHelpers';
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
  const [guarantor, setGuarantor] = useState<Partial<Customer>>({});
  const [collateral, setCollateral] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [step, setStep] = useState<'eligibility' | 'plan' | 'details' | 'review'>('eligibility');

  const activePlans = getActiveInstallmentPlans();
  const eligibility = checkInstallmentEligibility(customerData, totalAmount);

  // คำนวณข้อมูลการผ่อน
  const installmentCalculation = selectedPlan ? {
    downPayment: Math.round(totalAmount * (selectedPlan.downPaymentPercent / 100) * 100) / 100,
    financedAmount: totalAmount - Math.round(totalAmount * (selectedPlan.downPaymentPercent / 100) * 100) / 100,
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

  const handleConfirm = () => {
    if (!selectedPlan) return;

    const contract = createInstallmentContract(
      `sale-${Date.now()}`, // TODO: ใช้ sale ID จริง
      customerData,
      selectedPlan,
      totalAmount
    );

    // เพิ่มข้อมูลเพิ่มเติม
    if (guarantor.name) {
      contract.guarantor = guarantor as Customer;
    }
    if (collateral) {
      contract.collateral = collateral;
    }
    if (notes) {
      contract.notes = notes;
    }
    if (terms) {
      contract.terms = terms;
    }

    onConfirm(contract);
    onOpenChange(false);
  };

  const renderEligibilityStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
          <Input
            id="name"
            value={customerData.name}
            onChange={(e) => handleCustomerUpdate('name', e.target.value)}
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
          />
        </div>
        <div>
          <Label htmlFor="occupation">อาชีพ</Label>
          <Input
            id="occupation"
            value={customerData.occupation || ''}
            onChange={(e) => handleCustomerUpdate('occupation', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="monthlyIncome">รายได้ต่อเดือน (บาท)</Label>
          <Input
            id="monthlyIncome"
            type="number"
            value={customerData.monthlyIncome || ''}
            onChange={(e) => handleCustomerUpdate('monthlyIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">ที่อยู่ *</Label>
        <Textarea
          id="address"
          value={customerData.address || ''}
          onChange={(e) => handleCustomerUpdate('address', e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="workplace">สถานที่ทำงาน</Label>
        <Input
          id="workplace"
          value={customerData.workplace || ''}
          onChange={(e) => handleCustomerUpdate('workplace', e.target.value)}
        />
      </div>

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
          disabled={!eligibility.eligible}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderPlanStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        {activePlans.map((plan) => {
          const downPayment = Math.round(totalAmount * (plan.downPaymentPercent / 100) * 100) / 100;
          const financedAmount = totalAmount - downPayment;
          const monthlyPayment = calculateMonthlyPayment(financedAmount, plan.interestRate, plan.months);
          
          return (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-colors ${
                selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.interestRate === 0 ? 'secondary' : 'default'}>
                    {plan.interestRate === 0 ? 'ไม่มีดอกเบี้ย' : `${plan.interestRate}% ต่อปี`}
                  </Badge>
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('eligibility')}>
          ย้อนกลับ
        </Button>
        <Button 
          onClick={() => setStep('details')} 
          disabled={!selectedPlan}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              ผู้ค้ำประกัน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="guarantorName">ชื่อ-นามสกุล</Label>
              <Input
                id="guarantorName"
                value={guarantor.name || ''}
                onChange={(e) => handleGuarantorUpdate('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="guarantorPhone">เบอร์โทรศัพท์</Label>
              <Input
                id="guarantorPhone"
                value={guarantor.phone || ''}
                onChange={(e) => handleGuarantorUpdate('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="guarantorIdCard">เลขบัตรประชาชน</Label>
              <Input
                id="guarantorIdCard"
                value={guarantor.idCard || ''}
                onChange={(e) => handleGuarantorUpdate('idCard', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ข้อมูลเพิ่มเติม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="collateral">หลักประกัน</Label>
              <Input
                id="collateral"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                placeholder="เช่น รถยนต์, บ้าน, ที่ดิน"
              />
            </div>
            <div>
              <Label htmlFor="terms">เงื่อนไขพิเศษ</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep('plan')}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า:</span>
                    <span className="font-medium">{totalAmount.toLocaleString()} บาท</span>
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
                <div className="space-y-2">
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
                  <div className="flex justify-between text-lg font-bold">
                    <span>ยอดที่ต้องชำระรวม:</span>
                    <span>{installmentCalculation.totalPayable.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ชื่อ:</span>
                  <span className="ml-2">{customerData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">เบอร์โทร:</span>
                  <span className="ml-2">{customerData.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">บัตรประชาชน:</span>
                  <span className="ml-2">{customerData.idCard}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">อาชีพ:</span>
                  <span className="ml-2">{customerData.occupation}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
      case 'eligibility': return 'ตรวจสอบสิทธิ์';
      case 'plan': return 'เลือกแผนผ่อนชำระ';
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
          <div className="flex items-center space-x-2">
            {['eligibility', 'plan', 'details', 'review'].map((s, index) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-primary text-primary-foreground' : 
                  ['eligibility', 'plan', 'details', 'review'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-muted'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-0.5 bg-muted" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 'eligibility' && renderEligibilityStep()}
        {step === 'plan' && renderPlanStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'review' && renderReviewStep()}
      </DialogContent>
    </Dialog>
  );
}