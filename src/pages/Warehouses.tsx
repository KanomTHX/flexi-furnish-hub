import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseWarehouses } from '@/hooks/useSupabaseWarehouses';

import { 
  Warehouse as WarehouseIcon, 
  Truck, 
  AlertTriangle,
  BarChart3,
  Settings,
  Plus,
  Package,
  ArrowUpDown,
  Building2,
  Eye
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';

export default function Warehouses() {
  const { currentBranch } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  
  const {
    warehouses,
    stockMovements,
    purchaseOrders,
    productInventory,
    summary,
    loading,
    actions
  } = useSupabaseWarehouses();

  const { toast } = useToast();

  const handleExportWarehouses = () => {
    // Export warehouses data
    const csvData = warehouses.map(warehouse => ({
      รหัสคลัง: warehouse.code,
      ชื่อคลัง: warehouse.name,
      สถานะ: warehouse.status,
      ที่ตั้ง: warehouse.location || '',
      ความจุ: warehouse.capacity || 0,
      'การใช้งาน (%)': warehouse.utilizationPercentage
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `warehouses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานคลังสินค้าถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportStock = () => {
    // Export stock movements data
    const csvData = stockMovements.map(movement => ({
      รหัสการเคลื่อนไหว: movement.id,
      คลังสินค้า: movement.warehouseName,
      รหัสสินค้า: movement.productId,
      ประเภท: movement.movementType,
      จำนวน: movement.quantity,
      ต้นทุนต่อหน่วย: movement.unitCost || 0,
      เหตุผล: movement.reason || '',
      วันที่: new Date(movement.createdAt).toLocaleDateString('th-TH')
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานสต็อกถูกดาวน์โหลดแล้ว",
    });
  };

  const handleCreateWarehouse = async () => {
    try {
      const newWarehouse = await actions.createWarehouse({
        code: `WH${Date.now().toString().slice(-6)}`,
        name: 'คลังสินค้าใหม่',
        location: 'ที่ตั้งคลังสินค้า',
        capacity: 1000,
        status: 'active'
      });
      
      toast({
        title: "สร้างคลังสินค้าสำเร็จ",
        description: `สร้างคลัง "${newWarehouse.name}" เรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "ไม่สามารถสร้างคลังสินค้าได้",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateStockMovement = async (warehouseId: string, productId: string, quantity: number, reason: string) => {
    try {
      await actions.createStockMovement({
        warehouseId,
        productId,
        movementType: quantity > 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        unitCost: 100, // Mock unit cost
        reason,
        notes: 'สร้างจากหน้าจัดการคลังสินค้า',
        createdBy: 'current-user'
      });

      toast({
        title: "บันทึกการเคลื่อนไหวสต็อกแล้ว",
        description: `${quantity > 0 ? 'เพิ่ม' : 'ลด'}สต็อก ${Math.abs(quantity)} หน่วย`,
      });
    } catch (error) {
      toast({
        title: "ไม่สามารถบันทึกการเคลื่อนไหวสต็อกได้",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  // Mock data for UI compatibility
  const mockAlerts = [];
  const mockTasks = [];
  const mockTransfers = [];
  
  const unreadAlerts = mockAlerts;
  const criticalAlerts = mockAlerts;
  const pendingTasks = mockTasks;
  const activeTransfers = mockTransfers;
  const overdueTasks = mockTasks;

  // แสดง loading state เมื่อเริ่มต้น
  if (loading && warehouses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูลคลังสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold">คลัง & สต็อก</h1>
            <p className="text-muted-foreground">
              จัดการคลังสินค้าและระบบสต็อก
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Original Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การจัดการคลังสินค้าและสต็อก</h1>
          <p className="text-muted-foreground">
            จัดการคลังสินค้า สต็อก การโอนย้าย งาน และการแจ้งเตือนแบบครบวงจร
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadAlerts.length > 0 && (
            <Button 
              variant="outline" 
              className="relative"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              แจ้งเตือน
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            </Button>
          )}
          <Button onClick={() => actions.loadAllData()} variant="outline" disabled={loading}>
            <Settings className="w-4 h-4 mr-2" />
            รีเฟรชข้อมูล
          </Button>
          <Button onClick={handleCreateWarehouse} className="bg-green-600 hover:bg-green-700" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มคลังใหม่
          </Button>
        </div>
      </div>

      {/* แจ้งเตือนวิกฤต */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">แจ้งเตือนวิกฤต ({criticalAlerts.length} รายการ)</span>
          </div>
          <div className="space-y-1">
            {criticalAlerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className="text-sm text-red-600 cursor-pointer hover:underline"
                onClick={() => handleAlertClick(alert.id, 'warehouse' in alert)}
              >
                • {alert.warehouse.name}: {alert.message}
              </div>
            ))}
            {criticalAlerts.length > 3 && (
              <div className="text-sm text-red-600">
                และอีก {criticalAlerts.length - 3} รายการ
              </div>
            )}
          </div>
        </div>
      )}

      {/* สถิติด่วน */}
      {(pendingTasks.length > 0 || activeTransfers.length > 0 || overdueTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingTasks.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {pendingTasks.length}
                    </div>
                    <div className="text-sm text-orange-600">งานที่รอดำเนินการ</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTransfers.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-700">
                      {activeTransfers.length}
                    </div>
                    <div className="text-sm text-blue-600">การโอนย้ายที่ดำเนินการ</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {overdueTasks.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-700">
                      {overdueTasks.length}
                    </div>
                    <div className="text-sm text-red-600">งานที่เกินกำหนด</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* เนื้อหาหลัก */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4" />
            คลังสินค้า ({warehouses.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            การเคลื่อนไหว ({stockMovements.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            ใบสั่งซื้อ ({purchaseOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">คลังสินค้าทั้งหมด</CardTitle>
                <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle className="text-sm font-medium">ความจุรวม</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalCapacity.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ใช้งาน {Math.round(summary.averageUtilizationRate)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การเคลื่อนไหวสต็อก</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
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
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalPurchaseOrders}</div>
                <p className="text-xs text-muted-foreground">
                  รอดำเนินการ {summary.pendingOrders} ใบ
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <WarehouseIcon className="h-4 w-4" />
                  รายการคลังสินค้า
                </CardTitle>
                <Button onClick={handleExportWarehouses} variant="outline" size="sm">
                  ส่งออกข้อมูล
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <WarehouseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีคลังสินค้า</p>
                    <p className="text-sm">คลิก "เพิ่มคลังใหม่" เพื่อเริ่มต้น</p>
                  </div>
                ) : (
                  warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <WarehouseIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {warehouse.code}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {warehouse.utilizationPercentage}% ใช้งาน
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ความจุ: {warehouse.capacity || 0}
                          </div>
                        </div>
                      </div>
                      {warehouse.location && (
                        <div className="text-sm text-muted-foreground">
                          📍 {warehouse.location}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  การเคลื่อนไหวสต็อก
                </CardTitle>
                <Button onClick={handleExportStock} variant="outline" size="sm">
                  ส่งออกข้อมูล
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : stockMovements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีการเคลื่อนไหวสต็อก</p>
                  </div>
                ) : (
                  stockMovements.slice(0, 10).map((movement) => (
                    <div key={movement.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            movement.movementType === 'in' 
                              ? 'bg-green-100 text-green-600'
                              : movement.movementType === 'out'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {movement.movementType === 'in' ? '📥' : 
                             movement.movementType === 'out' ? '📤' : '🔄'}
                          </div>
                          <div>
                            <div className="font-medium">
                              {movement.movementType === 'in' ? 'รับเข้า' : 
                               movement.movementType === 'out' ? 'จ่ายออก' : 'ปรับปรุง'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {movement.warehouseName} • {movement.productId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            movement.movementType === 'in' ? 'text-green-600' : 
                            movement.movementType === 'out' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {movement.movementType === 'out' ? '-' : '+'}
                            {Math.abs(movement.quantity)} หน่วย
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </div>
                      {movement.reason && (
                        <div className="text-sm text-muted-foreground">
                          💭 {movement.reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ใบสั่งซื้อ
                </CardTitle>
                <Button onClick={() => {}} variant="outline" size="sm">
                  สร้างใบสั่งซื้อ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีใบสั่งซื้อ</p>
                  </div>
                ) : (
                  purchaseOrders.slice(0, 10).map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.supplierName || 'ไม่ระบุผู้จำหน่าย'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ฿{order.totalAmount.toLocaleString()}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'completed' ? 'เสร็จสิ้น' : 
                             order.status === 'pending' ? 'รอดำเนินการ' : 'ร่าง'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        📅 วันที่สั่ง: {new Date(order.orderDate).toLocaleDateString('th-TH')}
                      </div>
                      {order.expectedDeliveryDate && (
                        <div className="text-sm text-muted-foreground">
                          🚚 กำหนดส่ง: {new Date(order.expectedDeliveryDate).toLocaleDateString('th-TH')}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        📦 รายการ: {order.items.length} รายการ
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}