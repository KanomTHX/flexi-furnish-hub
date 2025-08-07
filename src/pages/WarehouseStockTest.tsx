import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Truck
} from 'lucide-react';
import { useSupabaseWarehouses } from '@/hooks/useSupabaseWarehouses';
import { supabase } from '@/lib/supabase';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

interface StockMovementTestData {
  warehouseId: string;
  productId: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  reason: string;
  notes: string;
}

export default function WarehouseStockTest() {
  const { warehouses, stockMovements, actions, loading } = useSupabaseWarehouses();
  const { toast } = useToast();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdMovements, setCreatedMovements] = useState<string[]>([]);
  
  // Form data for creating stock movement
  const [movementData, setMovementData] = useState<StockMovementTestData>({
    warehouseId: '',
    productId: `product-${Date.now().toString().slice(-6)}`,
    movementType: 'in',
    quantity: 100,
    unitCost: 50,
    reason: 'การทดสอบระบบ',
    notes: 'สร้างจากการทดสอบการเคลื่อนไหวสต็อก'
  });

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    actions.loadWarehouses();
    actions.loadStockMovements();
  }, []);

  // ตั้งค่าคลังแรกเป็นค่าเริ่มต้น
  useEffect(() => {
    if (warehouses.length > 0 && !movementData.warehouseId) {
      setMovementData(prev => ({ ...prev, warehouseId: warehouses[0].id }));
    }
  }, [warehouses, movementData.warehouseId]);

  const runStockMovementTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCreatedMovements([]);
    const results: TestResult[] = [];
    const createdIds: string[] = [];

    try {
      // Step 1: ตรวจสอบคลังสินค้าที่มีอยู่
      results.push({
        step: 'ตรวจสอบคลังสินค้าที่มีอยู่',
        status: 'pending',
        message: 'กำลังตรวจสอบคลังสินค้าในระบบ...'
      });
      setTestResults([...results]);

      if (warehouses.length === 0) {
        results[results.length - 1] = {
          step: 'ตรวจสอบคลังสินค้าที่มีอยู่',
          status: 'error',
          message: 'ไม่พบคลังสินค้าในระบบ กรุณาสร้างคลังสินค้าก่อน'
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      const selectedWarehouse = warehouses.find(w => w.id === movementData.warehouseId);
      if (!selectedWarehouse) {
        results[results.length - 1] = {
          step: 'ตรวจสอบคลังสินค้าที่มีอยู่',
          status: 'error',
          message: 'ไม่พบคลังสินค้าที่เลือก'
        };
        setTestResults([...results]);
        setIsRunning(false);
        return;
      }

      results[results.length - 1] = {
        step: 'ตรวจสอบคลังสินค้าที่มีอยู่',
        status: 'success',
        message: `พบคลังสินค้า "${selectedWarehouse.name}" พร้อมทดสอบ`,
        data: {
          warehouseId: selectedWarehouse.id,
          warehouseName: selectedWarehouse.name,
          warehouseCode: selectedWarehouse.code
        }
      };
      setTestResults([...results]);

      // Step 2: ทดสอบการสร้างการเคลื่อนไหวสต็อกเข้า
      results.push({
        step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกเข้า',
        status: 'pending',
        message: 'กำลังสร้างการเคลื่อนไหวสต็อกเข้า...'
      });
      setTestResults([...results]);

      try {
        const inMovement = await actions.createStockMovement({
          warehouseId: movementData.warehouseId,
          productId: movementData.productId,
          movementType: 'in',
          quantity: movementData.quantity,
          unitCost: movementData.unitCost,
          referenceType: 'manual',
          reason: 'รับสินค้าเข้าคลัง - ทดสอบ',
          notes: movementData.notes,
          createdBy: 'test-user'
        });

        createdIds.push(inMovement.id);
        setCreatedMovements(createdIds);

        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกเข้า',
          status: 'success',
          message: `สร้างการเคลื่อนไหวสต็อกเข้า ${movementData.quantity} หน่วย สำเร็จ`,
          data: {
            id: inMovement.id,
            movementType: inMovement.movementType,
            quantity: inMovement.quantity,
            unitCost: inMovement.unitCost
          }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกเข้า',
          status: 'error',
          message: `ไม่สามารถสร้างการเคลื่อนไหวสต็อกเข้าได้: ${error}`
        };
        setTestResults([...results]);
      }

      // Step 3: ทดสอบการสร้างการเคลื่อนไหวสต็อกออก
      results.push({
        step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกออก',
        status: 'pending',
        message: 'กำลังสร้างการเคลื่อนไหวสต็อกออก...'
      });
      setTestResults([...results]);

      try {
        const outQuantity = Math.floor(movementData.quantity / 2);
        const outMovement = await actions.createStockMovement({
          warehouseId: movementData.warehouseId,
          productId: movementData.productId,
          movementType: 'out',
          quantity: -outQuantity, // ติดลบสำหรับสต็อกออก
          unitCost: movementData.unitCost,
          referenceType: 'sale',
          reason: 'จำหน่ายสินค้า - ทดสอบ',
          notes: 'การขายสินค้าทดสอบ',
          createdBy: 'test-user'
        });

        createdIds.push(outMovement.id);
        setCreatedMovements(createdIds);

        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกออก',
          status: 'success',
          message: `สร้างการเคลื่อนไหวสต็อกออก ${outQuantity} หน่วย สำเร็จ`,
          data: {
            id: outMovement.id,
            movementType: outMovement.movementType,
            quantity: Math.abs(outMovement.quantity),
            unitCost: outMovement.unitCost
          }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการเคลื่อนไหวสต็อกออก',
          status: 'error',
          message: `ไม่สามารถสร้างการเคลื่อนไหวสต็อกออกได้: ${error}`
        };
        setTestResults([...results]);
      }

      // Step 4: ทดสอบการสร้างการปรับปรุงสต็อก
      results.push({
        step: 'ทดสอบการสร้างการปรับปรุงสต็อก',
        status: 'pending',
        message: 'กำลังสร้างการปรับปรุงสต็อก...'
      });
      setTestResults([...results]);

      try {
        const adjustmentQuantity = 10;
        const adjustmentMovement = await actions.createStockMovement({
          warehouseId: movementData.warehouseId,
          productId: movementData.productId,
          movementType: 'adjustment',
          quantity: adjustmentQuantity,
          unitCost: movementData.unitCost,
          referenceType: 'adjustment',
          reason: 'ปรับปรุงสต็อกจากการตรวจนับ',
          notes: 'พบสต็อกเพิ่มจากการตรวจนับ',
          createdBy: 'test-user'
        });

        createdIds.push(adjustmentMovement.id);
        setCreatedMovements(createdIds);

        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการปรับปรุงสต็อก',
          status: 'success',
          message: `สร้างการปรับปรุงสต็อก +${adjustmentQuantity} หน่วย สำเร็จ`,
          data: {
            id: adjustmentMovement.id,
            movementType: adjustmentMovement.movementType,
            quantity: adjustmentMovement.quantity,
            reason: adjustmentMovement.reason
          }
        };
        setTestResults([...results]);
      } catch (error) {
        results[results.length - 1] = {
          step: 'ทดสอบการสร้างการปรับปรุงสต็อก',
          status: 'error',
          message: `ไม่สามารถสร้างการปรับปรุงสต็อกได้: ${error}`
        };
        setTestResults([...results]);
      }

      // Step 5: ตรวจสอบข้อมูลในฐานข้อมูล
      results.push({
        step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
        status: 'pending',
        message: 'กำลังตรวจสอบข้อมูลที่บันทึกแล้ว...'
      });
      setTestResults([...results]);

      try {
        await actions.loadStockMovements();
        const createdMovementsInDb = stockMovements.filter(m => createdIds.includes(m.id));
        
        if (createdMovementsInDb.length === createdIds.length) {
          const totalIn = createdMovementsInDb
            .filter(m => m.movementType === 'in' || (m.movementType === 'adjustment' && m.quantity > 0))
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
          
          const totalOut = createdMovementsInDb
            .filter(m => m.movementType === 'out')
            .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

          const netQuantity = totalIn - totalOut;

          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'success',
            message: `พบข้อมูลการเคลื่อนไหวสต็อก ${createdMovementsInDb.length} รายการในฐานข้อมูล`,
            data: {
              totalMovements: createdMovementsInDb.length,
              totalIn,
              totalOut,
              netQuantity
            }
          };
        } else {
          results[results.length - 1] = {
            step: 'ตรวจสอบข้อมูลในฐานข้อมูล',
            status: 'error',
            message: `พบข้อมูลไม่ครบ: สร้าง ${createdIds.length} รายการ แต่พบ ${createdMovementsInDb.length} รายการ`
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

      // Step 6: ทดสอบการโอนย้ายสต็อก
      results.push({
        step: 'ทดสอบการโอนย้ายสต็อก',
        status: 'pending',
        message: 'กำลังทดสอบการโอนย้ายสต็อกระหว่างคลัง...'
      });
      setTestResults([...results]);

      if (warehouses.length >= 2) {
        try {
          const fromWarehouse = warehouses[0];
          const toWarehouse = warehouses[1];
          const transferQuantity = 20;

          // สร้างการเคลื่อนไหวออกจากคลังต้นทาง
          const transferOutMovement = await actions.createStockMovement({
            warehouseId: fromWarehouse.id,
            productId: movementData.productId,
            movementType: 'transfer',
            quantity: -transferQuantity,
            unitCost: movementData.unitCost,
            referenceType: 'transfer',
            referenceId: `transfer-${Date.now()}`,
            reason: `โอนย้ายไปยัง ${toWarehouse.name}`,
            notes: 'การโอนย้ายสต็อกทดสอบ',
            createdBy: 'test-user'
          });

          // สร้างการเคลื่อนไหวเข้าคลังปลายทาง
          const transferInMovement = await actions.createStockMovement({
            warehouseId: toWarehouse.id,
            productId: movementData.productId,
            movementType: 'transfer',
            quantity: transferQuantity,
            unitCost: movementData.unitCost,
            referenceType: 'transfer',
            referenceId: transferOutMovement.referenceId,
            reason: `รับโอนย้ายจาก ${fromWarehouse.name}`,
            notes: 'การรับโอนย้ายสต็อกทดสอบ',
            createdBy: 'test-user'
          });

          createdIds.push(transferOutMovement.id, transferInMovement.id);
          setCreatedMovements(createdIds);

          results[results.length - 1] = {
            step: 'ทดสอบการโอนย้ายสต็อก',
            status: 'success',
            message: `โอนย้ายสต็อก ${transferQuantity} หน่วย จาก ${fromWarehouse.name} ไป ${toWarehouse.name} สำเร็จ`,
            data: {
              fromWarehouse: fromWarehouse.name,
              toWarehouse: toWarehouse.name,
              quantity: transferQuantity,
              outMovementId: transferOutMovement.id,
              inMovementId: transferInMovement.id
            }
          };
        } catch (error) {
          results[results.length - 1] = {
            step: 'ทดสอบการโอนย้ายสต็อก',
            status: 'error',
            message: `ไม่สามารถโอนย้ายสต็อกได้: ${error}`
          };
        }
      } else {
        results[results.length - 1] = {
          step: 'ทดสอบการโอนย้ายสต็อก',
          status: 'error',
          message: 'ต้องมีคลังสินค้าอย่างน้อย 2 คลัง เพื่อทดสอบการโอนย้าย'
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
      title: "การทดสอบการเคลื่อนไหวสต็อกเสร็จสิ้น",
      description: `ผ่าน ${successCount}/${totalCount} ขั้นตอน`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const cleanupTestData = async () => {
    if (createdMovements.length === 0) {
      toast({
        title: "ไม่มีข้อมูลทดสอบให้ลบ",
        description: "ไม่พบการเคลื่อนไหวสต็อกทดสอบในระบบ"
      });
      return;
    }

    try {
      // ใช้ Supabase โดยตรงเพื่อลบข้อมูล
      const { error } = await supabase
        .from('stock_movements')
        .delete()
        .in('id', createdMovements);

      if (error) throw error;
      
      setCreatedMovements([]);
      setTestResults([]);
      
      toast({
        title: "ลบข้อมูลทดสอบแล้ว",
        description: `ลบการเคลื่อนไหวสต็อกทดสอบ ${createdMovements.length} รายการ เรียบร้อยแล้ว`
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
          <h1 className="text-3xl font-bold text-foreground">ทดสอบการเคลื่อนไหวสต็อก</h1>
          <p className="text-muted-foreground">
            ทดสอบการสร้างและจัดการการเคลื่อนไหวสต็อกในระบบคลังสินค้า
          </p>
        </div>
        <div className="flex gap-3">
          {createdMovements.length > 0 && (
            <Button 
              onClick={cleanupTestData}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              ลบข้อมูลทดสอบ
            </Button>
          )}
          <Button 
            onClick={() => actions.loadWarehouses()}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </Button>
          <Button 
            onClick={runStockMovementTest} 
            disabled={isRunning || loading || warehouses.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                กำลังทดสอบ...
              </>
            ) : (
              <>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                เริ่มทดสอบ
              </>
            )}
          </Button>
        </div>
      </div>

      {/* สถานะคลังสินค้า */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คลังสินค้าทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">
              พร้อมทดสอบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเคลื่อนไหวทั้งหมด</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockMovements.length}</div>
            <p className="text-xs text-muted-foreground">
              รายการในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกเข้า</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stockMovements.filter(m => m.movementType === 'in' || (m.movementType === 'adjustment' && m.quantity > 0)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกออก</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stockMovements.filter(m => m.movementType === 'out').length}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ฟอร์มข้อมูลการเคลื่อนไหว */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              ข้อมูลการเคลื่อนไหวทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="warehouseSelect">เลือกคลังสินค้า</Label>
              <Select 
                value={movementData.warehouseId} 
                onValueChange={(value) => setMovementData({...movementData, warehouseId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} - {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="productId">รหัสสินค้า</Label>
              <Input
                id="productId"
                value={movementData.productId}
                onChange={(e) => setMovementData({...movementData, productId: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">จำนวน</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({...movementData, quantity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="unitCost">ต้นทุนต่อหน่วย</Label>
                <Input
                  id="unitCost"
                  type="number"
                  value={movementData.unitCost}
                  onChange={(e) => setMovementData({...movementData, unitCost: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">เหตุผล</Label>
              <Input
                id="reason"
                value={movementData.reason}
                onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Input
                id="notes"
                value={movementData.notes}
                onChange={(e) => setMovementData({...movementData, notes: e.target.value})}
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Truck className="h-4 w-4" />
                <span className="font-medium">การทดสอบที่จะดำเนินการ</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• สร้างการเคลื่อนไหวสต็อกเข้า {movementData.quantity} หน่วย</li>
                <li>• สร้างการเคลื่อนไหวสต็อกออก {Math.floor(movementData.quantity / 2)} หน่วย</li>
                <li>• สร้างการปรับปรุงสต็อก +10 หน่วย</li>
                <li>• ทดสอบการโอนย้ายระหว่างคลัง (ถ้ามีคลัง ≥ 2)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* ผลการทดสอบ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              ผลการทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <p>ไม่พบคลังสินค้าในระบบ</p>
                <p className="text-sm">กรุณาสร้างคลังสินค้าก่อนทดสอบการเคลื่อนไหวสต็อก</p>
              </div>
            ) : testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                คลิก "เริ่มทดสอบ" เพื่อเริ่มการทดสอบการเคลื่อนไหวสต็อก
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