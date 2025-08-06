import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  User,
  Calculator,
  Calendar
} from 'lucide-react';
import { useSupabaseInstallments } from '@/hooks/useSupabaseInstallments';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { InstallmentContract, Customer } from '@/types/pos';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function InstallmentContractTest() {
  const { contracts, actions: contractActions, loading: contractsLoading } = useSupabaseInstallments();
  const { customers, actions: customerActions, loading: customersLoading } = useSupabaseCustomers();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Form data for creating contract
  const [customerData, setCustomerData] = useState({
    name: 'ลูกค้าทดสอบ สัญญาผ่อน',
    phone: '081-999-8888',
    email: 'contract-test@example.com',
    address: '999 ถนนทดสอบสัญญา แขวงทดสอบ เขททดสอบ กรุงเทพฯ 10999',
    idCard: '9-9999-99999-99-9',
    occupation: 'พนักงานทดสอบ',
    monthlyIncome: 45000
  });

  const [contractData, setContractData] = useState({
    totalAmount: 120000,
    downPayment: 20000,
    months: 12,
    interestRate: 2.5
  });

  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [createdContract, setCreatedContract] = useState<InstallmentContract | null>(null);

  const runContractCreationTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Step 1: สร้างลูกค้าใหม่
      results.push({
        step: 'สร้างลูกค้าใหม่',
        status: 'pending',
        message: 'กำลังสร้างลูกค้าทดสอบ...'
      });
      setTestResults([...results]);

      try {
        const newCustomer = await customerActions.createCustomer(customerData);
        setCreatedCustomer(newCustomer);
        
        results[results.length - 1] = {
          step: 'สร้างลูกค้าใหม่',
          status: 'success',
          message: `สร้างลูกค้า "${newCustomer.name}" สำเร็จ`,
          data: { customerId: newCustomer.id, name: newCustomer.name }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'สร้างลูกค้าใหม่',
          status: 'error',
          message: `ไม่สามารถสร้างลูกค้าได้: ${error}`
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      // Step 2: คำนวณข้อมูลสัญญา
      results.push({
        step: 'คำนวณข้อมูลสัญญา',
        status: 'pending',
        message: 'กำลังคำนวณข้อมูลสัญญา...'
      });
      setTestResults([...results]);

      const financedAmount = contractData.totalAmount - contractData.downPayment;
      const monthlyInterest = contractData.interestRate / 100 / 12;
      const monthlyPayment = Math.round(
        (financedAmount * monthlyInterest * Math.pow(1 + monthlyInterest, contractData.months)) /
        (Math.pow(1 + monthlyInterest, contractData.months) - 1)
      );
      const totalPayable = contractData.downPayment + (monthlyPayment * contractData.months);

      results[results.length - 1] = {
        step: 'คำนวณข้อมูลสัญญา',
        status: 'success',
        message: 'คำนวณข้อมูลสัญญาเสร็จสิ้น',
        data: {
          financedAmount,
          monthlyPayment,
          totalPayable,
          totalInterest: totalPayable - contractData.totalAmount
        }
      };
      setTestResults([...results]);

      // Step 3: สร้างรายการชำระเงิน
      results.push({
        step: 'สร้างรายการชำระเงิน',
        status: 'pending',
        message: 'กำลังสร้างรายการชำระเงิน...'
      });
      setTestResults([...results]);

      const payments = [];
      const startDate = new Date();
      
      for (let i = 1; i <= contractData.months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        payments.push({
          id: `payment-${i}`,
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          amount: monthlyPayment,
          status: 'pending' as const
        });
      }

      results[results.length - 1] = {
        step: 'สร้างรายการชำระเงิน',
        status: 'success',
        message: `สร้างรายการชำระเงิน ${payments.length} งวด`,
        data: { paymentsCount: payments.length, firstDue: payments[0].dueDate }
      };
      setTestResults([...results]);

      // Step 4: สร้างสัญญาผ่อนชำระ
      results.push({
        step: 'สร้างสัญญาผ่อนชำระ',
        status: 'pending',
        message: 'กำลังสร้างสัญญาผ่อนชำระ...'
      });
      setTestResults([...results]);

      const contractNumber = `CT${Date.now().toString().slice(-8)}`;
      const newContract: InstallmentContract = {
        id: `contract-${Date.now()}`,
        contractNumber,
        customerId: createdCustomer!.id,
        customer: createdCustomer!,
        totalAmount: contractData.totalAmount,
        downPayment: contractData.downPayment,
        financedAmount,
        totalPayable,
        monthlyPayment,
        plan: {
          months: contractData.months,
          interestRate: contractData.interestRate,
          monthlyPayment
        },
        payments,
        totalPaid: contractData.downPayment,
        remainingBalance: totalPayable - contractData.downPayment,
        paidInstallments: 0,
        remainingInstallments: contractData.months,
        status: 'active',
        startDate: startDate.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'สร้างจากการทดสอบระบบ'
      };

      try {
        await contractActions.addContract(newContract);
        setCreatedContract(newContract);
        
        results[results.length - 1] = {
          step: 'สร้างสัญญาผ่อนชำระ',
          status: 'success',
          message: `สร้างสัญญา "${contractNumber}" สำเร็จ`,
          data: { 
            contractNumber, 
            totalAmount: contractData.totalAmount,
            monthlyPayment,
            months: contractData.months
          }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'สร้างสัญญาผ่อนชำระ',
          status: 'error',
          message: `ไม่สามารถสร้างสัญญาได้: ${error}`
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      // Step 5: ตรวจสอบข้อมูลในฐานข้อมูล
      results.push({
        step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
        status: 'pending',
        message: 'กำลังตรวจสอบข้อมูลในฐานข้อมูล...'
      });
      setTestResults([...results]);

      try {
        await contractActions.loadContracts();
        const foundContract = contracts.find(c => c.contractNumber === contractNumber);
        
        if (foundContract) {
          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'success',
            message: 'พบข้อมูลสัญญาในฐานข้อมูลแล้ว',
            data: { 
              contractId: foundContract.id,
              paymentsCount: foundContract.payments.length
            }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'error',
            message: 'ไม่พบข้อมูลสัญญาในฐานข้อมูล'
          };
        }
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
          status: 'error',
          message: `ไม่สามารถตรวจสอบข้อมูลได้: ${error}`
        };
        setTestResults([...results]);
      }

    } catch (error) {
      results.push({
        step: 'การทดสอบทั่วไป',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error}`
      });
      setTestResults([...results]);
    }

    setIsRunning(false);

    // แสดงผลสรุป
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    toast({
      title: "การทดสอบสร้างสัญญาเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} ขั้นตอน`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const cleanupTestData = async () => {
    if (createdContract) {
      try {
        await contractActions.removeContract(createdContract.id);
        toast({
          title: "ลบสัญญาทดสอบแล้ว",
          description: `ลบสัญญา ${createdContract.contractNumber} เรียบร้อยแล้ว`
        });
      } catch (error) {
        toast({
          title: "ไม่สามารถลบสัญญาได้",
          description: `${error}`,
          variant: "destructive"
        });
      }
    }

    if (createdCustomer) {
      try {
        await customerActions.deleteCustomer(createdCustomer.id);
        toast({
          title: "ลบลูกค้าทดสอบแล้ว",
          description: `ลบลูกค้า ${createdCustomer.name} เรียบร้อยแล้ว`
        });
      } catch (error) {
        toast({
          title: "ไม่สามารถลบลูกค้าได้",
          description: `${error}`,
          variant: "destructive"
        });
      }
    }

    setCreatedCustomer(null);
    setCreatedContract(null);
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">สำเร็จ</Badge>;
      case 'error':
        return <Badge variant="destructive">ผิดพลาด</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">กำลังดำเนินการ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ทดสอบการสร้างสัญญาผ่อนชำระ</h1>
          <p className="text-muted-foreground">
            ทดสอบกระบวนการสร้างลูกค้าใหม่และสัญญาผ่อนชำระในฐานข้อมูล Supabase
          </p>
        </div>
        <div className="flex gap-3">
          {(createdCustomer || createdContract) && (
            <Button 
              onClick={cleanupTestData}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              ลบข้อมูลทดสอบ
            </Button>
          )}
          <Button 
            onClick={runContractCreationTest} 
            disabled={isRunning || contractsLoading || customersLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                เริ่มทดสอบ
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ฟอร์มข้อมูลลูกค้า */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ข้อมูลลูกค้าทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">ชื่อลูกค้า</Label>
              <Input
                id="customerName"
                value={customerData.name}
                onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">เบอร์โทรศัพท์</Label>
              <Input
                id="customerPhone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">อีเมล</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="customerIncome">รายได้ต่อเดือน</Label>
              <Input
                id="customerIncome"
                type="number"
                value={customerData.monthlyIncome}
                onChange={(e) => setCustomerData({...customerData, monthlyIncome: parseInt(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>

        {/* ฟอร์มข้อมูลสัญญา */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              ข้อมูลสัญญาทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="totalAmount">ยอดรวม (บาท)</Label>
              <Input
                id="totalAmount"
                type="number"
                value={contractData.totalAmount}
                onChange={(e) => setContractData({...contractData, totalAmount: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="downPayment">เงินดาวน์ (บาท)</Label>
              <Input
                id="downPayment"
                type="number"
                value={contractData.downPayment}
                onChange={(e) => setContractData({...contractData, downPayment: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="months">จำนวนงวด (เดือน)</Label>
              <Select value={contractData.months.toString()} onValueChange={(value) => setContractData({...contractData, months: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 เดือน</SelectItem>
                  <SelectItem value="12">12 เดือน</SelectItem>
                  <SelectItem value="18">18 เดือน</SelectItem>
                  <SelectItem value="24">24 เดือน</SelectItem>
                  <SelectItem value="36">36 เดือน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="interestRate">อัตราดอกเบี้ย (% ต่อปี)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={contractData.interestRate}
                onChange={(e) => setContractData({...contractData, interestRate: parseFloat(e.target.value)})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ผลการทดสอบ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            ผลการทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              คลิก "เริ่มทดสอบ" เพื่อเริ่มการทดสอบการสร้างสัญญาผ่อนชำระ
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.step}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">ดูรายละเอียด</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* สรุปผลการทดสอบ */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สรุปผลการทดสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'success').length}
                </div>
                <p className="text-sm text-muted-foreground">สำเร็จ</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.filter(r => r.status === 'pending').length}
                </div>
                <p className="text-sm text-muted-foreground">กำลังดำเนินการ</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'error').length}
                </div>
                <p className="text-sm text-muted-foreground">ผิดพลาด</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}