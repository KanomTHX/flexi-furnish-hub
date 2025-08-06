import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { useSupabaseInstallments } from '@/hooks/useSupabaseInstallments';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

interface CustomerTestData {
  name: string;
  phone: string;
  email: string;
  address: string;
  idCard: string;
  occupation: string;
  monthlyIncome: number;
}

export default function InstallmentCustomerTest() {
  const { customers, customerStats, actions: customerActions, loading: customersLoading } = useSupabaseCustomers();
  const { contracts, actions: contractActions } = useSupabaseInstallments();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdCustomers, setCreatedCustomers] = useState<string[]>([]);

  // ข้อมูลลูกค้าทดสอบ
  const testCustomersData: CustomerTestData[] = [
    {
      name: 'สมชาย ทดสอบระบบ',
      phone: '081-111-1111',
      email: 'somchai.test@example.com',
      address: '111 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10111',
      idCard: '1-1111-11111-11-1',
      occupation: 'พนักงานบริษัท',
      monthlyIncome: 35000
    },
    {
      name: 'สมหญิง ทดสอบระบบ',
      phone: '082-222-2222',
      email: 'somying.test@example.com',
      address: '222 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10222',
      idCard: '2-2222-22222-22-2',
      occupation: 'ข้าราชการ',
      monthlyIncome: 45000
    },
    {
      name: 'วิชัย ทดสอบระบบ',
      phone: '083-333-3333',
      email: 'wichai.test@example.com',
      address: '333 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10333',
      idCard: '3-3333-33333-33-3',
      occupation: 'ค้าขาย',
      monthlyIncome: 25000
    }
  ];

  useEffect(() => {
    customerActions.loadCustomers();
    contractActions.loadContracts();
  }, []);

  const runCustomerManagementTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCreatedCustomers([]);
    const results: TestResult[] = [];
    const createdIds: string[] = [];

    try {
      // Step 1: ทดสอบการสร้างลูกค้าใหม่
      results.push({
        step: 'ทดสอบการสร้างลูกค้าใหม่',
        status: 'pending',
        message: 'กำลังสร้างลูกค้าทดสอบ...'
      });
      setTestResults([...results]);

      let createdCount = 0;
      for (const customerData of testCustomersData) {
        try {
          const newCustomer = await customerActions.createCustomer(customerData);
          createdIds.push(newCustomer.id);
          createdCount++;
          
          // รอสักครู่ระหว่างการสร้าง
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`ไม่สามารถสร้างลูกค้า ${customerData.name} ได้:`, error);
        }
      }

      setCreatedCustomers(createdIds);

      results[results.length - 1] = {
        step: 'ทดสอบการสร้างลูกค้าใหม่',
        status: createdCount === testCustomersData.length ? 'success' : 'error',
        message: `สร้างลูกค้าสำเร็จ ${createdCount}/${testCustomersData.length} คน`,
        data: { createdCount, totalAttempted: testCustomersData.length }
      };
      setTestResults([...results]);

      // Step 2: ทดสอบการค้นหาลูกค้า
      results.push({
        step: 'ทดสอบการค้นหาลูกค้า',
        status: 'pending',
        message: 'กำลังทดสอบการค้นหาลูกค้า...'
      });
      setTestResults([...results]);

      try {
        // ค้นหาด้วยชื่อ
        const searchByName = customerActions.searchCustomers('ทดสอบระบบ');
        const searchByPhone = customerActions.searchCustomers('081-111');
        const searchByEmail = customerActions.searchCustomers('test@example.com');

        results[results.length - 1] = {
          step: 'ทดสอบการค้นหาลูกค้า',
          status: 'success',
          message: 'การค้นหาลูกค้าทำงานได้ปกติ',
          data: {
            searchByNameResults: searchByName.length,
            searchByPhoneResults: searchByPhone.length,
            searchByEmailResults: searchByEmail.length
          }
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการค้นหาลูกค้า',
          status: 'error',
          message: `การค้นหาลูกค้าไม่สำเร็จ: ${error}`
        };
      }
      setTestResults([...results]);

      // Step 3: ทดสอบการอัปเดตข้อมูลลูกค้า
      results.push({
        step: 'ทดสอบการอัปเดตข้อมูลลูกค้า',
        status: 'pending',
        message: 'กำลังทดสอบการอัปเดตข้อมูลลูกค้า...'
      });
      setTestResults([...results]);

      if (createdIds.length > 0) {
        try {
          const testCustomerId = createdIds[0];
          const updateData = {
            monthlyIncome: 40000,
            notes: 'อัปเดตจากการทดสอบระบบ'
          };

          await customerActions.updateCustomer(testCustomerId, updateData);

          results[results.length - 1] = {
            step: 'ทดสอบการอัปเดตข้อมูลลูกค้า',
            status: 'success',
            message: 'อัปเดตข้อมูลลูกค้าสำเร็จ',
            data: { customerId: testCustomerId, updatedFields: Object.keys(updateData) }
          };
        } catch (error) {
          results[results.length - 1] = {
            step: 'ทดสอบการอัปเดตข้อมูลลูกค้า',
            status: 'error',
            message: `ไม่สามารถอัปเดตข้อมูลลูกค้าได้: ${error}`
          };
        }
      } else {
        results[results.length - 1] = {
          step: 'ทดสอบการอัปเดตข้อมูลลูกค้า',
          status: 'error',
          message: 'ไม่มีลูกค้าให้ทดสอบการอัปเดต'
        };
      }
      setTestResults([...results]);

      // Step 4: ทดสอบการกรองลูกค้าตามความเสี่ยง
      results.push({
        step: 'ทดสอบการกรองลูกค้าตามความเสี่ยง',
        status: 'pending',
        message: 'กำลังทดสอบการกรองลูกค้า...'
      });
      setTestResults([...results]);

      try {
        const lowRiskCustomers = customerActions.filterCustomersByRisk('low');
        const mediumRiskCustomers = customerActions.filterCustomersByRisk('medium');
        const highRiskCustomers = customerActions.filterCustomersByRisk('high');

        results[results.length - 1] = {
          step: 'ทดสอบการกรองลูกค้าตามความเสี่ยง',
          status: 'success',
          message: 'การกรองลูกค้าตามความเสี่ยงทำงานได้ปกติ',
          data: {
            lowRisk: lowRiskCustomers.length,
            mediumRisk: mediumRiskCustomers.length,
            highRisk: highRiskCustomers.length
          }
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการกรองลูกค้าตามความเสี่ยง',
          status: 'error',
          message: `การกรองลูกค้าไม่สำเร็จ: ${error}`
        };
      }
      setTestResults([...results]);

      // Step 5: ทดสอบการคำนวณสถิติลูกค้า
      results.push({
        step: 'ทดสอบการคำนวณสถิติลูกค้า',
        status: 'pending',
        message: 'กำลังทดสอบการคำนวณสถิติ...'
      });
      setTestResults([...results]);

      try {
        await customerActions.loadCustomers();
        
        const stats = customerStats;
        const isValidStats = stats.total >= 0 && 
                           stats.averageCreditScore >= 0 && 
                           stats.totalFinanced >= 0;

        results[results.length - 1] = {
          step: 'ทดสอบการคำนวณสถิติลูกค้า',
          status: isValidStats ? 'success' : 'error',
          message: isValidStats ? 'การคำนวณสถิติลูกค้าถูกต้อง' : 'การคำนวณสถิติลูกค้าไม่ถูกต้อง',
          data: {
            totalCustomers: stats.total,
            activeCustomers: stats.active,
            averageCreditScore: Math.round(stats.averageCreditScore),
            totalFinanced: stats.totalFinanced
          }
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการคำนวณสถิติลูกค้า',
          status: 'error',
          message: `ไม่สามารถคำนวณสถิติได้: ${error}`
        };
      }
      setTestResults([...results]);

      // Step 6: ทดสอบการอัปเดตข้อมูลลูกค้าจากสัญญา
      results.push({
        step: 'ทดสอบการอัปเดตข้อมูลลูกค้าจากสัญญา',
        status: 'pending',
        message: 'กำลังทดสอบการอัปเดตข้อมูลจากสัญญา...'
      });
      setTestResults([...results]);

      try {
        customerActions.updateCustomerFromContracts(contracts);
        
        results[results.length - 1] = {
          step: 'ทดสอบการอัปเดตข้อมูลลูกค้าจากสัญญา',
          status: 'success',
          message: 'อัปเดตข้อมูลลูกค้าจากสัญญาสำเร็จ',
          data: { contractsProcessed: contracts.length }
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการอัปเดตข้อมูลลูกค้าจากสัญญา',
          status: 'error',
          message: `ไม่สามารถอัปเดตข้อมูลจากสัญญาได้: ${error}`
        };
      }
      setTestResults([...results]);

      // Step 7: ทดสอบการคำนวณคะแนนเครดิต
      results.push({
        step: 'ทดสอบการคำนวณคะแนนเครดิต',
        status: 'pending',
        message: 'กำลังทดสอบการคำนวณคะแนนเครดิต...'
      });
      setTestResults([...results]);

      if (createdIds.length > 0) {
        try {
          const testCustomerId = createdIds[0];
          await customerActions.recalculateCreditScore(testCustomerId, contracts);

          results[results.length - 1] = {
            step: 'ทดสอบการคำนวณคะแนนเครดิต',
            status: 'success',
            message: 'คำนวณคะแนนเครดิตสำเร็จ',
            data: { customerId: testCustomerId }
          };
        } catch (error) {
          results[results.length - 1] = {
            step: 'ทดสอบการคำนวณคะแนนเครดิต',
            status: 'error',
            message: `ไม่สามารถคำนวณคะแนนเครดิตได้: ${error}`
          };
        }
      } else {
        results[results.length - 1] = {
          step: 'ทดสอบการคำนวณคะแนนเครดิต',
          status: 'error',
          message: 'ไม่มีลูกค้าให้ทดสอบการคำนวณคะแนนเครดิต'
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
      title: "การทดสอบระบบจัดการลูกค้าเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} ขั้นตอน`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const cleanupTestData = async () => {
    if (createdCustomers.length === 0) {
      toast({
        title: "ไม่มีข้อมูลทดสอบให้ลบ",
        description: "ไม่พบลูกค้าทดสอบในระบบ"
      });
      return;
    }

    try {
      for (const customerId of createdCustomers) {
        await customerActions.deleteCustomer(customerId);
      }
      
      setCreatedCustomers([]);
      setTestResults([]);
      
      toast({
        title: "ลบข้อมูลทดสอบแล้ว",
        description: `ลบลูกค้าทดสอบ ${createdCustomers.length} คน เรียบร้อยแล้ว`
      });
    } catch (error) {
      toast({
        title: "ไม่สามารถลบข้อมูลทดสอบได้",
        description: `${error}`,
        variant: "destructive"
      });
    }
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
          <h1 className="text-3xl font-bold text-foreground">ทดสอบระบบจัดการลูกค้า</h1>
          <p className="text-muted-foreground">
            ทดสอบการสร้าง อัปเดต ค้นหา และจัดการข้อมูลลูกค้าในฐานข้อมูล Supabase
          </p>
        </div>
        <div className="flex gap-3">
          {createdCustomers.length > 0 && (
            <Button 
              onClick={cleanupTestData}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <UserX className="w-4 h-4 mr-2" />
              ลบข้อมูลทดสอบ
            </Button>
          )}
          <Button 
            onClick={() => customerActions.loadCustomers()}
            variant="outline"
            disabled={customersLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${customersLoading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </Button>
          <Button 
            onClick={runCustomerManagementTest} 
            disabled={isRunning || customersLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                เริ่มทดสอบ
              </>
            )}
          </Button>
        </div>
      </div>

      {/* สถิติลูกค้า */}
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
            <CardTitle className="text-sm font-medium">คะแนนเครดิตเฉลี่ย</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(customerStats.averageCreditScore)}</div>
            <p className="text-xs text-muted-foreground">
              จากลูกค้าทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าค้างชำระ</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{customerStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              ความเสี่ยงสูง {customerStats.highRisk} คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดให้เครดิตรวม</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{customerStats.totalFinanced.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ค้างชำระ ฿{customerStats.totalOverdue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ข้อมูลลูกค้าทดสอบ */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลลูกค้าที่จะใช้ทดสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testCustomersData.map((customer, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📞 {customer.phone}</div>
                  <div>📧 {customer.email}</div>
                  <div>💼 {customer.occupation}</div>
                  <div>💰 ฿{customer.monthlyIncome.toLocaleString()}/เดือน</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ผลการทดสอบ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            ผลการทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              คลิก "เริ่มทดสอบ" เพื่อเริ่มการทดสอบระบบจัดการลูกค้า
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