import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWarehouseStock } from '@/hooks/useWarehouseStock';
import { WarehouseOverview } from '@/components/warehouses/WarehouseOverview';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { TransferManagement } from '@/components/warehouses/TransferManagement';
import { TaskManagement } from '@/components/warehouses/TaskManagement';
import { StockOverview } from '@/components/stock/StockOverview';
import { StockLevelTable } from '@/components/stock/StockLevelTable';
import { StockMovementHistory } from '@/components/stock/StockMovementHistory';
import { StockAlertPanel } from '@/components/stock/StockAlertPanel';
import { 
  Warehouse as WarehouseIcon, 
  Truck, 
  CheckSquare, 
  AlertTriangle,
  BarChart3,
  Settings,
  Plus,
  Package,
  ArrowUpDown,
  Bell,
  Boxes,
  Building2,
  Eye
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';

export default function Warehouses() {
  const { currentBranch } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  
  const {
    // Warehouse Data
    warehouses,
    transfers,
    warehouseTasks,
    warehouseAlerts,
    
    // Stock Data
    stockLevels,
    stockMovements,
    stockAlerts,
    stockAdjustments,
    stockCounts,
    
    // Combined Summary
    summary,
    
    // Filters
    warehouseFilter,
    transferFilter,
    taskFilter,
    stockFilter,
    movementFilter,
    alertFilter,
    setWarehouseFilter,
    setTransferFilter,
    setTaskFilter,
    setStockFilter,
    setMovementFilter,
    setAlertFilter,
    
    // States
    isLoading,
    isUpdating,
    
    // Actions
    updateWarehouse,
    createTransfer,
    approveTransfer,
    adjustStock,
    assignTask,
    startTask,
    completeTask,
    markAlertAsRead,
    resolveAlert,
    exportWarehouseData,
    exportStockData
  } = useWarehouseStock();

  const { toast } = useToast();

  const handleExportWarehouses = () => {
    exportWarehouseData();
    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานคลังสินค้าถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportStock = () => {
    exportStockData();
    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานสต็อกถูกดาวน์โหลดแล้ว",
    });
  };

  const handleApproveTransfer = (transferId: string) => {
    approveTransfer(transferId, 'current-user');
    toast({
      title: "อนุมัติการโอนย้ายแล้ว",
      description: "การโอนย้ายได้รับการอนุมัติและพร้อมดำเนินการ",
    });
  };

  const handleAdjustStock = (productId: string, warehouseId: string, quantity: number, reason: string) => {
    const adjustment = {
      adjustmentNumber: `ADJ-${Date.now()}`,
      warehouseId,
      warehouse: warehouses.find(w => w.id === warehouseId) || { id: warehouseId, name: 'Unknown', code: 'UNK' },
      type: quantity > 0 ? 'increase' as const : 'decrease' as const,
      reason: 'other' as const,
      status: 'completed' as const,
      items: [{
        id: `item-${Date.now()}`,
        productId,
        product: stockLevels.find(s => s.productId === productId)?.product || { id: productId, name: 'Unknown', sku: 'UNK', category: 'Unknown' },
        zoneId: 'default-zone',
        systemQuantity: stockLevels.find(s => s.productId === productId && s.warehouseId === warehouseId)?.quantity || 0,
        adjustedQuantity: (stockLevels.find(s => s.productId === productId && s.warehouseId === warehouseId)?.quantity || 0) + quantity,
        variance: quantity,
        unitCost: stockLevels.find(s => s.productId === productId && s.warehouseId === warehouseId)?.averageCost || 0,
        totalCost: quantity * (stockLevels.find(s => s.productId === productId && s.warehouseId === warehouseId)?.averageCost || 0),
        reason,
        notes: `ปรับปรุงโดยผู้ใช้: ${reason}`
      }],
      totalItems: 1,
      totalVariance: quantity,
      totalValue: quantity * (stockLevels.find(s => s.productId === productId && s.warehouseId === warehouseId)?.averageCost || 0),
      requiresApproval: false,
      description: reason,
      createdBy: 'current-user'
    };

    adjustStock(adjustment);
    toast({
      title: "ปรับปรุงสต็อกแล้ว",
      description: `${quantity > 0 ? 'เพิ่ม' : 'ลด'}สต็อก ${Math.abs(quantity)} ชิ้น`,
    });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId, 120, 'งานเสร็จสมบูรณ์');
    toast({
      title: "งานเสร็จสิ้น",
      description: "งานได้ถูกทำเครื่องหมายว่าเสร็จสิ้นแล้ว",
    });
  };

  const handleAlertClick = (alertId: string, isWarehouseAlert: boolean = true) => {
    markAlertAsRead(alertId, isWarehouseAlert);
  };

  // Combined alerts
  const safeWarehouseAlerts = warehouseAlerts || [];
  const safeStockAlerts = stockAlerts || [];
  const safeWarehouseTasks = warehouseTasks || [];
  const safeTransfers = transfers || [];
  
  const allAlerts = [...safeWarehouseAlerts, ...safeStockAlerts];
  const unreadAlerts = allAlerts.filter(a => a && !a.isRead);
  const criticalAlerts = allAlerts.filter(a => a && a.severity === 'critical');
  const pendingTasks = safeWarehouseTasks.filter(t => t && t.status === 'pending');
  const activeTransfers = safeTransfers.filter(t => t && t.status === 'in_transit');
  const overdueTasks = safeWarehouseTasks.filter(t => {
    if (!t || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    const now = new Date();
    return t.status !== 'completed' && dueDate < now;
  });

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
          <Button onClick={() => setWarehouseFilter({})} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4" />
            คลังสินค้า ({warehouses.length})
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            สต็อก ({stockLevels.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            การเคลื่อนไหว ({stockMovements.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            การโอนย้าย ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            งาน ({warehouseTasks.length})
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <Boxes className="w-4 h-4" />
            ปรับปรุง ({stockAdjustments.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            แจ้งเตือน ({unreadAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarehouseOverview summary={summary} alerts={warehouseAlerts} />
            <StockOverview summary={summary} alerts={stockAlerts} />
          </div>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-6">
          <WarehouseList
            warehouses={warehouses}
            filter={warehouseFilter}
            onFilterChange={setWarehouseFilter}
            onExport={handleExportWarehouses}
          />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <StockLevelTable
            stockLevels={stockLevels}
            warehouses={warehouses}
            filter={stockFilter}
            onFilterChange={setStockFilter}
            onExport={handleExportStock}
            onAdjustStock={handleAdjustStock}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <StockMovementHistory
            movements={stockMovements}
            warehouses={warehouses}
            filter={movementFilter}
            onFilterChange={setMovementFilter}
            onExport={handleExportStock}
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <TransferManagement
            transfers={transfers}
            warehouses={warehouses}
            filter={transferFilter}
            onFilterChange={setTransferFilter}
            onExport={handleExportWarehouses}
            onApproveTransfer={handleApproveTransfer}
            onShipTransfer={() => {}}
            onReceiveTransfer={() => {}}
            onCancelTransfer={() => {}}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManagement
            tasks={warehouseTasks}
            filter={taskFilter}
            onFilterChange={setTaskFilter}
            onExport={handleExportWarehouses}
            onAssignTask={assignTask}
            onStartTask={startTask}
            onCompleteTask={handleCompleteTask}
            onCancelTask={() => {}}
          />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                การปรับปรุงสต็อก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAdjustments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Boxes className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีการปรับปรุงสต็อก</p>
                  </div>
                ) : (
                  stockAdjustments.map((adjustment) => (
                    <div key={adjustment.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{adjustment.adjustmentNumber}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            adjustment.status === 'completed' 
                              ? 'bg-green-100 text-green-700'
                              : adjustment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {adjustment.status === 'completed' ? 'เสร็จสิ้น' : 
                             adjustment.status === 'pending' ? 'รอดำเนินการ' : 'ร่าง'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(adjustment.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {adjustment.warehouse.name} • {adjustment.description}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>รายการ: {adjustment.totalItems}</span>
                        <span className={adjustment.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ผลต่าง: {adjustment.totalVariance > 0 ? '+' : ''}{adjustment.totalVariance}
                        </span>
                        <span>มูลค่า: ฿{adjustment.totalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <WarehouseIcon className="h-4 w-4" />
                    แจ้งเตือนคลังสินค้า
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {warehouseAlerts.filter(a => !a.isRead).length} ใหม่
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {warehouseAlerts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <WarehouseIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                    </div>
                  ) : (
                    warehouseAlerts.slice(0, 5).map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg border text-sm ${
                          alert.isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : alert.severity === 'critical'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'critical' 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.severity === 'critical' ? 'วิกฤต' : 'คำเตือน'}
                          </span>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="font-medium mb-1">{alert.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {alert.warehouse.name} • {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    แจ้งเตือนสต็อก
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {stockAlerts.filter(a => !a.isRead).length} ใหม่
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockAlerts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                    </div>
                  ) : (
                    stockAlerts.slice(0, 5).map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-lg border text-sm ${
                          alert.isRead 
                            ? 'bg-gray-50 border-gray-200' 
                            : alert.severity === 'critical'
                            ? 'bg-red-50 border-red-200'
                            : alert.severity === 'high'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alert.severity === 'critical' 
                              ? 'bg-red-100 text-red-700'
                              : alert.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.severity === 'critical' ? 'วิกฤต' : 
                             alert.severity === 'high' ? 'สูง' : 'ปานกลาง'}
                          </span>
                          {!alert.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="font-medium mb-1">{alert.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {alert.warehouse.name} • สต็อก: {alert.currentStock} • {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Alert Actions */}
          {unreadAlerts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    มีการแจ้งเตือนที่ยังไม่ได้อ่าน {unreadAlerts.length} รายการ
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      unreadAlerts.forEach(alert => {
                        const isWarehouseAlert = 'warehouse' in alert;
                        markAlertAsRead(alert.id, isWarehouseAlert);
                      });
                      toast({
                        title: "อ่านแจ้งเตือนทั้งหมดแล้ว",
                        description: `อ่านแจ้งเตือน ${unreadAlerts.length} รายการแล้ว`,
                      });
                    }}
                  >
                    อ่านทั้งหมด
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}