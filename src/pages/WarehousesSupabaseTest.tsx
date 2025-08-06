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
  Warehouse,
  Package,
  Truck,
  ShoppingCart,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSupabaseWarehouses } from '@/hooks/useSupabaseWarehouses';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function WarehousesSupabaseTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  
  const { 
    warehouses, 
    stockMovements, 
    purchaseOrders, 
    productInventory, 
    summary, 
    loading, 
    actions 
  } = useSupabaseWarehouses();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test 1: ตรวจสอบการเชื่อมต่อ Supabase
      try {
        const { data, error } = await supabase.from('warehouses').select('count').limit(1);
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

      // Test 2: ตรวจสอบตาราง warehouses
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('id, code, name, type, status')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง warehouses',
          status: 'success',
          message: `พบคลังสินค้า ${data?.length || 0} คลัง`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง warehouses',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 3: ตรวจสอบตาราง stock_movements
      try {
        const { data, error } = await supabase
          .from('stock_movements')
          .select('id, movement_type, quantity, created_at')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง stock_movements',
          status: 'success',
          message: `พบการเคลื่อนไหวสต็อก ${data?.length || 0} รายการ`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง stock_movements',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 4: ตรวจสอบตาราง purchase_orders
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select('id, order_number, total_amount, status')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง purchase_orders',
          status: 'success',
          message: `พบใบสั่งซื้อ ${data?.length || 0} ใบ`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง purchase_orders',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 5: ตรวจสอบตาราง product_inventory
      try {
        const { data, error } = await supabase
          .from('product_inventory')
          .select('id, quantity, available_quantity, status')
          .limit(5);
        
        if (error) throw error;
        
        results.push({
          name: 'ตาราง product_inventory',
          status: 'success',
          message: `พบสต็อกสินค้า ${data?.length || 0} รายการ`,
          details: data
        });
      } catch (error) {
        results.push({
          name: 'ตาราง product_inventory',
          status: 'error',
          message: `ไม่สามารถเข้าถึงตารางได้: ${error}`
        });
      }

      // Test 6: ทดสอบ useSupabaseWarehouses hook
      try {
        await actions.loadAllData();
        results.push({
          name: 'useSupabaseWarehouses Hook',
          status: 'success',
          message: `โหลดข้อมูลสำเร็จ - คลัง: ${warehouses.length}, การเคลื่อนไหว: ${stockMovements.length}`
        });
      } catch (error) {
        results.push({
          name: 'useSupabaseWarehouses Hook',
          status: 'error',
          message: `ไม่สามารถโหลดข้อมูลได้: ${error}`
        });
      }

      // Test 7: ทดสอบการสร้างคลังสินค้าใหม่
      try {
        const testWarehouse = {
          code: `WH${Date.now().toString().slice(-6)}`,
          name: 'คลังทดสอบ',
          type: 'main',
          address: '123 ถนนทดสอบ กรุงเทพฯ 10100',
          phone: '02-123-4567',
          email: 'test@warehouse.com',
          managerName: 'ผู้จัดการทดสอบ',
          totalArea: 1000,
          storageCapacity: 500,
          currentUtilization: 100,
          status: 'active'
        };

        const newWarehouse = await actions.createWarehouse(testWarehouse);
        
        // ลบคลังทดสอบทันที
        await supabase
          .from('warehouses')
          .delete()
          .eq('id', newWarehouse.id);
        
        results.push({
          name: 'การสร้างคลังสินค้าใหม่',
          status: 'success',
          message: 'สร้างและลบคลังทดสอบสำเร็จ'
        });
      } catch (error) {
        results.push({
          name: 'การสร้างคลังสินค้าใหม่',
          status: 'error',
          message: `ไม่สามารถสร้างคลังสินค้าได้: ${error}`
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
          <h1 className="text-3xl font-bold text-foreground">ทดสอบระบบ Warehouses + Supabase</h1>
          <p className="text-muted-foreground">
            ทดสอบการเชื่อมต่อและการทำงานของระบบคลังสินค้าและสต็อกกับฐานข้อมูล Supabase
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
            <CardTitle className="text-sm font-medium">คลังสินค้าทั้งหมด</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalWarehouses}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {summary.activeWarehouses} คลัง
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกสินค้า</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              มูลค่า ฿{summary.totalStockValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเคลื่อนไหวสต็อก</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMovements}</div>
            <p className="text-xs text-muted-foreground">
              รายการทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใบสั่งซื้อ</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPurchaseOrders}</div>
            <p className="text-xs text-muted-foreground">
              รอดำเนินการ {summary.pendingOrders} ใบ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* สถิติเพิ่มเติม */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความจุรวม</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCapacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {summary.totalUtilization.toLocaleString()} หน่วย
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการใช้งานเฉลี่ย</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summary.averageUtilizationRate)}%</div>
            <p className="text-xs text-muted-foreground">
              จากคลังทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะระบบ</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? 'กำลังโหลด' : 'พร้อมใช้งาน'}
            </div>
            <p className="text-xs text-muted-foreground">
              เชื่อมต่อฐานข้อมูล
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