import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Warehouse,
  BarChart3,
  Building
} from 'lucide-react';
import { useSupabaseWarehouses } from '@/hooks/useSupabaseWarehouses';
import { supabase } from '@/lib/supabase';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

interface WarehouseTestData {
  code: string;
  name: string;
  location: string;
  capacity: number;
}

export default function WarehouseCreationTest() {
  const { warehouses, actions, loading } = useSupabaseWarehouses();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdWarehouses, setCreatedWarehouses] = useState<string[]>([]);
  
  // Form data for creating warehouse
  const [warehouseData, setWarehouseData] = useState<WarehouseTestData>({
    code: `WH${Date.now().toString().slice(-6)}`,
    name: 'คลังสินค้าทดสอบ',
    location: '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10100',
    capacity: 1000
  });

  const runWarehouseCreationTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCreatedWarehouses([]);
    const results: TestResult[] = [];
    const createdIds: string[] = [];

    try {
      // Step 1: ตรวจสอบข้อมูลที่จะสร้าง
      results.push({
        step: 'ตรวจสอบข้อมูลที่จะสร้าง',
        status: 'pending',
        message: 'กำลังตรวจสอบข้อมูลคลังสินค้า...'
      });
      setTestResults([...results]);

      // Validate data
      const validationErrors = [];
      if (!warehouseData.code) validationErrors.push('รหัสคลัง');
      if (!warehouseData.name) validationErrors.push('ชื่อคลัง');
      if (!warehouseData.location) validationErrors.push('ที่ตั้ง');
      if (warehouseData.capacity <= 0) validationErrors.push('ความจุ');

      if (validationErrors.length > 0) {
        results[results.length - 1] = {
          step: 'ตรวจสอบข้อมูลที่จะสร้าง',
          status: 'error',
          message: `ข้อมูลไม่ครบถ้วน: ${validationErrors.join(', ')}`
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      // คำนวณอัตราการใช้งาน (mock)
      const utilizationPercentage = Math.floor(Math.random() * 80) + 10; // Random 10-90%

      results[results.length - 1] = {
        step: 'ตรวจสอบข้อมูลที่จะสร้าง',
        status: 'success',
        message: 'ข้อมูลครบถ้วนและถูกต้อง',
        data: {
          ...warehouseData,
          utilizationPercentage
        }
      };
      setTestResults([...results]);

      // Step 2: ตรวจสอบรหัสคลังซ้ำ
      results.push({
        step: 'ตรวจสอบรหัสคลังซ้ำ',
        status: 'pending',
        message: 'กำลังตรวจสอบรหัสคลังในระบบ...'
      });
      setTestResults([...results]);

      try {
        await actions.loadWarehouses();
        const existingWarehouse = warehouses.find(w => w.code === warehouseData.code);
        
        if (existingWarehouse) {
          // สร้างรหัสใหม่
          const newCode = `WH${Date.now().toString().slice(-6)}`;
          setWarehouseData(prev => ({ ...prev, code: newCode }));
          
          results[results.length - 1] = {
            step: 'ตรวจสอบรหัสคลังซ้ำ',
            status: 'success',
            message: `พบรหัสซ้ำ สร้างรหัสใหม่: ${newCode}`,
            data: { oldCode: warehouseData.code, newCode }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบรหัสคลังซ้ำ',
            status: 'success',
            message: 'รหัสคลังไม่ซ้ำ สามารถใช้งานได้',
            data: { code: warehouseData.code }
          };
        }
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ตรวจสอบรหัสคลังซ้ำ',
          status: 'error',
          message: `ไม่สามารถตรวจสอบรหัสคลังได้: ${error}`
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      // Step 3: สร้างคลังสินค้าใหม่
      results.push({
        step: 'สร้างคลังสินค้าใหม่',
        status: 'pending',
        message: 'กำลังสร้างคลังสินค้าในฐานข้อมูล...'
      });
      setTestResults([...results]);

      try {
        const newWarehouse = await actions.createWarehouse({
          ...warehouseData,
          status: 'active'
        });
        
        createdIds.push(newWarehouse.id);
        setCreatedWarehouses(createdIds);
        
        results[results.length - 1] = {
          step: 'สร้างคลังสินค้าใหม่',
          status: 'success',
          message: `สร้างคลัง "${newWarehouse.name}" สำเร็จ`,
          data: {
            id: newWarehouse.id,
            code: newWarehouse.code,
            name: newWarehouse.name,
            utilizationPercentage: newWarehouse.utilizationPercentage
          }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'สร้างคลังสินค้าใหม่',
          status: 'error',
          message: `ไม่สามารถสร้างคลังสินค้าได้: ${error}`
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      // Step 4: ตรวจสอบข้อมูลในฐานข้อมูล
      results.push({
        step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
        status: 'pending',
        message: 'กำลังตรวจสอบข้อมูลที่บันทึกแล้ว...'
      });
      setTestResults([...results]);

      try {
        await actions.loadWarehouses();
        const createdWarehouse = warehouses.find(w => w.id === createdIds[0]);
        
        if (createdWarehouse) {
          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'success',
            message: 'พบข้อมูลคลังสินค้าในฐานข้อมูลแล้ว',
            data: {
              id: createdWarehouse.id,
              code: createdWarehouse.code,
              name: createdWarehouse.name,
              status: createdWarehouse.status
            }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'error',
            message: 'ไม่พบข้อมูลคลังสินค้าในฐานข้อมูล'
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

      // Step 5: ทดสอบการอัปเดตข้อมูล
      results.push({
        step: 'ทดสอบการอัปเดตข้อมูล',
        status: 'pending',
        message: 'กำลังทดสอบการอัปเดตข้อมูลคลัง...'
      });
      setTestResults([...results]);

      if (createdIds.length > 0) {
        try {
          const updateData = {
            name: 'คลังสินค้าทดสอบ (อัปเดต)',
            location: 'ที่ตั้งใหม่',
            capacity: 1500
          };

          await actions.updateWarehouse(createdIds[0], updateData);
          
          results[results.length - 1] = {
            step: 'ทดสอบการอัปเดตข้อมูล',
            status: 'success',
            message: 'อัปเดตข้อมูลคลังสินค้าสำเร็จ',
            data: updateData
          };
        } catch (error) {
          results[results.length - 1] = {
            step: 'ทดสอบการอัปเดตข้อมูล',
            status: 'error',
            message: `ไม่สามารถอัปเดตข้อมูลได้: ${error}`
          };
        }
      } else {
        results[results.length - 1] = {
          step: 'ทดสอบการอัปเดตข้อมูล',
          status: 'error',
          message: 'ไม่มีคลังสินค้าให้ทดสอบการอัปเดต'
        };
      }
      setTestResults([...results]);

      // Step 6: ทดสอบการค้นหา
      results.push({
        step: 'ทดสอบการค้นหา',
        status: 'pending',
        message: 'กำลังทดสอบการค้นหาคลังสินค้า...'
      });
      setTestResults([...results]);

      try {
        const searchResults = actions.searchWarehouses('ทดสอบ');
        
        results[results.length - 1] = {
          step: 'ทดสอบการค้นหา',
          status: 'success',
          message: `พบผลการค้นหา ${searchResults.length} รายการ`,
          data: { searchTerm: 'ทดสอบ', resultsCount: searchResults.length }
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการค้นหา',
          status: 'error',
          message: `ไม่สามารถค้นหาได้: ${error}`
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
      title: "การทดสอบสร้างคลังสินค้าเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} ขั้นตอน`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const cleanupTestData = async () => {
    if (createdWarehouses.length === 0) {
      toast({
        title: "ไม่มีข้อมูลทดสอบให้ลบ",
        description: "ไม่พบคลังสินค้าทดสอบในระบบ"
      });
      return;
    }

    try {
      // ใช้ Supabase โดยตรงเพื่อลบข้อมูล
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .in('id', createdWarehouses);

      if (error) throw error;
      
      setCreatedWarehouses([]);
      setTestResults([]);
      
      toast({
        title: "ลบข้อมูลทดสอบแล้ว",
        description: `ลบคลังสินค้าทดสอบ ${createdWarehouses.length} คลัง เรียบร้อยแล้ว`
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
          <h1 className="text-3xl font-bold text-foreground">ทดสอบการสร้างคลังสินค้า</h1>
          <p className="text-muted-foreground">
            ทดสอบกระบวนการสร้างคลังสินค้าใหม่และการจัดการข้อมูลในฐานข้อมูล Supabase
          </p>
        </div>
        <div className="flex gap-3">
          {createdWarehouses.length > 0 && (
            <Button 
              onClick={cleanupTestData}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              ลบข้อมูลทดสอบ
            </Button>
          )}
          <Button 
            onClick={runWarehouseCreationTest} 
            disabled={isRunning || loading}
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
        {/* ฟอร์มข้อมูลคลังสินค้า */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              ข้อมูลคลังสินค้าทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouseCode">รหัสคลัง</Label>
              <Input
                id="warehouseCode"
                value={warehouseData.code}
                onChange={(e) => setWarehouseData({...warehouseData, code: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="warehouseName">ชื่อคลัง</Label>
              <Input
                id="warehouseName"
                value={warehouseData.name}
                onChange={(e) => setWarehouseData({...warehouseData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="warehouseLocation">ที่ตั้ง</Label>
              <Input
                id="warehouseLocation"
                value={warehouseData.location}
                onChange={(e) => setWarehouseData({...warehouseData, location: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="warehouseCapacity">ความจุ</Label>
              <Input
                id="warehouseCapacity"
                type="number"
                value={warehouseData.capacity}
                onChange={(e) => setWarehouseData({...warehouseData, capacity: parseInt(e.target.value)})}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">ข้อมูลที่จะทดสอบ</span>
              </div>
              <div className="text-sm text-blue-600 space-y-1">
                <div>• สร้างคลัง: {warehouseData.name}</div>
                <div>• รหัส: {warehouseData.code}</div>
                <div>• ความจุ: {warehouseData.capacity} หน่วย</div>
                <div>• ที่ตั้ง: {warehouseData.location}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ผลการทดสอบ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              ผลการทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                คลิก "เริ่มทดสอบ" เพื่อเริ่มการทดสอบการสร้างคลังสินค้า
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
      </div>

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