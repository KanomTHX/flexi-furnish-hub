import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Calendar,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { useSupabaseInstallments } from '@/hooks/useSupabaseInstallments';
import { InstallmentContract } from '@/types/pos';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

interface PaymentTest {
  contractId: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
}

export default function InstallmentPaymentTest() {
  const { contracts, actions: contractActions, loading } = useSupabaseInstallments();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedContract, setSelectedContract] = useState<InstallmentContract | null>(null);
  const [paymentTests, setPaymentTests] = useState<PaymentTest[]>([]);

  // โหลดข้อมูลสัญญาเมื่อ component mount
  useEffect(() => {
    contractActions.loadContracts();
  }, []);

  // หาสัญญาที่มีการชำระค้างอยู่
  const getContractsWithPendingPayments = () => {
    return contracts.filter(contract => 
      contract.status === 'active' && 
      contract.payments.some(payment => payment.status === 'pending')
    );
  };

  const runPaymentTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Step 1: ตรวจสอบสัญญาที่มีการชำระค้างอยู่
      results.push({
        step: 'ตรวจสอบสัญญาที่มีการชำระค้างอยู่',
        status: 'pending',
        message: 'กำลังค้นหาสัญญาที่มีการชำระค้างอยู่...'
      });
      setTestResults([...results]);

      const contractsWithPending = getContractsWithPendingPayments();
      
      if (contractsWithPending.length === 0) {
        results[results.length - 1] = {
          step: 'ตรวจสอบสัญญาที่มีการชำระค้างอยู่',
          status: 'error',
          message: 'ไม่พบสัญญาที่มีการชำระค้างอยู่ กรุณาสร้างสัญญาใหม่ก่อน'
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      const testContract = contractsWithPending[0];
      setSelectedContract(testContract);

      results[results.length - 1] = {
        step: 'ตรวจสอบสัญญาที่มีการชำระค้างอยู่',
        status: 'success',
        message: `พบสัญญา ${testContract.contractNumber} ที่มีการชำระค้างอยู่`,
        data: {
          contractNumber: testContract.contractNumber,
          customerName: testContract.customer.name,
          pendingPayments: testContract.payments.filter(p => p.status === 'pending').length
        }
      };
      setTestResults([...results]);

      // Step 2: เลือกงวดที่จะทดสอบการชำระ
      results.push({
        step: 'เลือกงวดที่จะทดสอบการชำระ',
        status: 'pending',
        message: 'กำลังเลือกงวดที่จะทดสอบ...'
      });
      setTestResults([...results]);

      const pendingPayments = testContract.payments.filter(p => p.status === 'pending');
      const testPayments = pendingPayments.slice(0, Math.min(3, pendingPayments.length)); // ทดสอบสูงสุด 3 งวด

      const paymentTestData: PaymentTest[] = testPayments.map(payment => ({
        contractId: testContract.id,
        paymentId: payment.id,
        amount: payment.amount,
        paymentMethod: 'cash'
      }));

      setPaymentTests(paymentTestData);

      results[results.length - 1] = {
        step: 'เลือกงวดที่จะทดสอบการชำระ',
        status: 'success',
        message: `เลือกงวดที่จะทดสอบ ${testPayments.length} งวด`,
        data: {
          testPaymentsCount: testPayments.length,
          totalAmount: testPayments.reduce((sum, p) => sum + p.amount, 0)
        }
      };
      setTestResults([...results]);

      // Step 3: ทดสอบการชำระเงินแต่ละงวด
      for (let i = 0; i < paymentTestData.length; i++) {
        const paymentTest = paymentTestData[i];
        const payment = testPayments[i];

        results.push({
          step: `ทดสอบการชำระงวดที่ ${payment.installmentNumber}`,
          status: 'pending',
          message: `กำลังบันทึกการชำระงวดที่ ${payment.installmentNumber}...`
        });
        setTestResults([...results]);

        try {
          await contractActions.recordPayment(
            paymentTest.contractId,
            paymentTest.paymentId,
            paymentTest.amount
          );

          results[results.length - 1] = {
            step: `ทดสอบการชำระงวดที่ ${payment.installmentNumber}`,
            status: 'success',
            message: `บันทึกการชำระงวดที่ ${payment.installmentNumber} สำเร็จ`,
            data: {
              installmentNumber: payment.installmentNumber,
              amount: paymentTest.amount,
              dueDate: payment.dueDate
            }
          };
          setTestResults([...results]);

          // รอสักครู่ก่อนทดสอบงวดต่อไป
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          results[results.length - 1] = {
            step: `ทดสอบการชำระงวดที่ ${payment.installmentNumber}`,
            status: 'error',
            message: `ไม่สามารถบันทึกการชำระงวดที่ ${payment.installmentNumber} ได้: ${error}`
          };
          setTestResults([...results]);
        }
      }

      // Step 4: ตรวจสอบการอัปเดตข้อมูลในฐานข้อมูล
      results.push({
        step: 'ตรวจสอบการอัปเดตข้อมูลในฐานข้อมูล',
        status: 'pending',
        message: 'กำลังตรวจสอบการอัปเดตข้อมูล...'
      });
      setTestResults([...results]);

      try {
        await contractActions.loadContracts();
        const updatedContract = contracts.find(c => c.id === testContract.id);

        if (updatedContract) {
          const paidPayments = updatedContract.payments.filter(p => p.status === 'paid');
          const originalPaidCount = testContract.payments.filter(p => p.status === 'paid').length;
          const newPaidCount = paidPayments.length - originalPaidCount;

          results[results.length - 1] = {
            step: 'ตรวจสอบการอัปเดตข้อมูลในฐานข้อมูล',
            status: 'success',
            message: `ข้อมูลได้รับการอัปเดตแล้ว มีการชำระเพิ่ม ${newPaidCount} งวด`,
            data: {
              totalPaidBefore: testContract.totalPaid,
              totalPaidAfter: updatedContract.totalPaid,
              paidInstallmentsBefore: testContract.paidInstallments,
              paidInstallmentsAfter: updatedContract.paidInstallments
            }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบการอัปเดตข้อมูลในฐานข้อมูล',
            status: 'error',
            message: 'ไม่พบข้อมูลสัญญาที่อัปเดตแล้ว'
          };
        }
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ตรวจสอบการอัปเดตข้อมูลในฐานข้อมูล',
          status: 'error',
          message: `ไม่สามารถตรวจสอบข้อมูลได้: ${error}`
        };
        setTestResults([...results]);
      }

      // Step 5: ตรวจสอบการคำนวณยอดคงเหลือ
      results.push({
        step: 'ตรวจสอบการคำนวณยอดคงเหลือ',
        status: 'pending',
        message: 'กำลังตรวจสอบการคำนวณยอดคงเหลือ...'
      });
      setTestResults([...results]);

      const updatedContract = contracts.find(c => c.id === testContract.id);
      if (updatedContract) {
        const expectedRemainingBalance = updatedContract.totalPayable - updatedContract.totalPaid;
        const actualRemainingBalance = updatedContract.remainingBalance;

        if (Math.abs(expectedRemainingBalance - actualRemainingBalance) < 1) {
          results[results.length - 1] = {
            step: 'ตรวจสอบการคำนวณยอดคงเหลือ',
            status: 'success',
            message: 'การคำนวณยอดคงเหลือถูกต้อง',
            data: {
              expectedBalance: expectedRemainingBalance,
              actualBalance: actualRemainingBalance,
              difference: Math.abs(expectedRemainingBalance - actualRemainingBalance)
            }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบการคำนวณยอดคงเหลือ',
            status: 'error',
            message: 'การคำนวณยอดคงเหลือไม่ถูกต้อง',
            data: {
              expectedBalance: expectedRemainingBalance,
              actualBalance: actualRemainingBalance,
              difference: Math.abs(expectedRemainingBalance - actualRemainingBalance)
            }
          };
        }
      } else {
        results[results.length - 1] = {
          step: 'ตรวจสอบการคำนวณยอดคงเหลือ',
          status: 'error',
          message: 'ไม่พบข้อมูลสัญญาสำหรับตรวจสอบ'
        };
      }
      setTestResults([...results]);

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
      title: "การทดสอบการชำระเงินเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} ขั้นตอน`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
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

  const contractsWithPending = getContractsWithPendingPayments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ทดสอบการบันทึกการชำระเงิน</h1>
          <p className="text-muted-foreground">
            ทดสอบกระบวนการบันทึกการชำระเงินงวดต่างๆ และการอัปเดตข้อมูลในฐานข้อมูล
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => contractActions.loadContracts()}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </Button>
          <Button 
            onClick={runPaymentTest} 
            disabled={isRunning || loading || contractsWithPending.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                เริ่มทดสอบ
              </>
            )}
          </Button>
        </div>
      </div>

      {/* สถานะสัญญา */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาทั้งหมด</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {contracts.filter(c => c.status === 'active').length} สัญญา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาที่มีการชำระค้างอยู่</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractsWithPending.length}</div>
            <p className="text-xs text-muted-foreground">
              พร้อมทดสอบการชำระเงิน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งวดที่ค้างชำระ</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contractsWithPending.reduce((sum, contract) => 
                sum + contract.payments.filter(p => p.status === 'pending').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              งวดทั้งหมดที่ค้างชำระ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* รายการสัญญาที่พร้อมทดสอบ */}
      {contractsWithPending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สัญญาที่พร้อมทดสอบการชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contractsWithPending.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{contract.contractNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {contract.customer.name} • งวดค้างชำระ: {contract.payments.filter(p => p.status === 'pending').length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ฿{contract.payments.filter(p => p.status === 'pending')[0]?.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ครบกำหนด: {contract.payments.filter(p => p.status === 'pending')[0]?.dueDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ผลการทดสอบ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            ผลการทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {contractsWithPending.length === 0 ? (
                <div>
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p>ไม่พบสัญญาที่มีการชำระค้างอยู่</p>
                  <p className="text-sm">กรุณาสร้างสัญญาใหม่ก่อนทดสอบการชำระเงิน</p>
                </div>
              ) : (
                <p>คลิก "เริ่มทดสอบ" เพื่อเริ่มการทดสอบการบันทึกการชำระเงิน</p>
              )}
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