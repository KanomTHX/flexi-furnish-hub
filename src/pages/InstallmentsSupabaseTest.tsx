import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database,
  Users,
  CreditCard,
  DollarSign,
  RefreshCw,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSupabaseInstallments } from '@/hooks/useSupabaseInstallments';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function InstallmentsSupabaseTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  
  const { contracts, summary, loading: contractsLoading, actions: contractActions } = useSupabaseInstallments();
  const { customers, customerStats, loading: customersLoading, actions: customerActions } = useSupabaseCustomers();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test 1: ตรวจสอบการเชื่อมต่อ Supabase
      try {
        const { data, error } = await supabase.from('customers').select('count').limit(1);
        if (error) throw error;
        results.push({
          name: 'การเชื่อมต่อ Supabase',
          status: 'success',
          message: 'เชื่อมต่อสำเร็จ'
        });
      } catch (error) {
        results.push({
          name: 'การเชื่อมต่อ Supabase',
          status: 'error',
          message: `เชื่อมต่อไม่สำเร็จ: ${error}`
        });
      }

      // Test 2: ตรวจสอบตาราง customers
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, phone, email')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง customers',
          status: 'success',
          message: `พบลูกค้า ${data?.length || 0} คน`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง customers',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 3: ตรวจสอบตาราง installment_plans
      try {
        const { data, error } = await supabase
          .from('installment_plans')
          .select('id, plan_number, total_amount, status')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง installment_plans',
          status: 'success',
          message: `พบแผนผ่อนชำระ ${data?.length || 0} แผน`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง installment_plans',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 4: ตรวจสอบตาราง installment_payments
      try {
        const { data, error } = await supabase
          .from('installment_payments')
          .select('id, payment_number, amount, status')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง installment_payments',
          status: 'success',
          message: `พบการชำระเงิน ${data?.length || 0} รายการ`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง installment_payments',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 5: ทดสอบ useSupabaseCustomers hook
      try {
        await customerActions.loadCustomers();
        results.push({
          name: 'useSupabaseCustomers Hook',
          status: 'success',
          message: `โหลดลูกค้าสำเร็จ ${customers.length} คน`
        });
      } catch (error) {
        results.push({
          name: 'useSupabaseCustomers Hook',
          status: 'error',
          message: `ไม่สามารถโหลดลูกค้าได้: ${error}`
        });
      }

      // Test 6: ทดสอบ useSupabaseInstallments hook
      try {
        await contractActions.loadContracts();
        results.push({
          name: 'useSupabaseInstallments Hook',
          status: 'success',
          message: `โหลดสัญญาสำเร็จ ${contracts.length} สัญญา`
        });
      } catch (error) {
        results.push({
          name: 'useSupabaseInstallments Hook',
          status: 'error',
          message: `ไม่สามารถโหลดสัญญาได้: ${error}`
        });
      }

      // Test 7: ทดสอบการสร้างลูกค้าใหม่
      try {
        const testCustomer = {
          name: 'ลูกค้าทดสอบ',
          phone: '081-234-5678',
          email: 'test@example.com',
          address: '123 ถนนทดสอบ',
          idCard: '1-2345-67890-12-3',
          occupation: 'พนักงานบริษัท',
          monthlyIncome: 30000,
          notes: 'สร้างจากการทดสอบระบบ'
        };

        const newCustomer = await customerActions.createCustomer(testCustomer);
        
        // ลบลูกค้าทดสอบทันที
        await customerActions.deleteCustomer(newCustomer.id);
        
        results.push({
          name: 'การสร้างลูกค้าใหม่',
          status: 'success',
          message: 'สร้างและลบลูกค้าทดสอบสำเร็จ'
        });
      } catch (error) {
        results.push({
          name: 'การสร้างลูกค้าใหม่',
          status: 'error',
          message: `ไม่สามารถสร้างลูกค้าได้: ${error}`
        });
      }

    } catch (error) {
      results.push({
        name: 'การทดสอบทั่วไป',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);

    // แสดงผลสรุป
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    toast({
      title: "การทดสอบเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} การทดสอบ`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">สำเร็จ</Badge>;
      case 'error':
        return <Badge variant="destructive">ผิดพลาด</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">คำเตือน</Badge>;
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ทดสอบระบบ Installments + Supabase</h1>
          <p className="text-muted-foreground">
            ทดสอบการเชื่อมต่อและการทำงานของระบบผ่อนชำระกับฐานข้อมูล Supabase
          </p>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              ทดสอบใหม่
            </>
          )}
        </Button>
      </div>

      {/* สถิติรวม */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {customerStats.active} คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาทั้งหมด</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {summary.activeContracts} สัญญา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดให้เครดิต</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary.totalFinanced.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              เก็บแล้ว ฿{summary.totalCollected.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค้างชำระ</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ฿{summary.overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.overdueContracts} สัญญา
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ผลการทดสอบ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            ผลการทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">กำลังทดสอบ...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.name}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">ดูรายละเอียด</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
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
                  {testResults.filter(r => r.status === 'warning').length}
                </div>
                <p className="text-sm text-muted-foreground">คำเตือน</p>
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