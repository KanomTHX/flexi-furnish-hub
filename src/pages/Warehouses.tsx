import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { WarehouseOverview } from '@/components/warehouses/WarehouseOverview';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { TransferManagement } from '@/components/warehouses/TransferManagement';
import { TaskManagement } from '@/components/warehouses/TaskManagement';
import { exportWarehousesToCSV, exportTransfersToCSV, exportTasksToCSV } from '@/utils/warehouseHelpers';
import { 
  Warehouse as WarehouseIcon, 
  Truck, 
  CheckSquare, 
  AlertTriangle,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

export default function Warehouses() {
  const {
    warehouses,
    transfers,
    tasks,
    alerts,
    summary,
    warehouseFilter,
    transferFilter,
    taskFilter,
    setWarehouseFilter,
    setTransferFilter,
    setTaskFilter,
    clearWarehouseFilter,
    clearTransferFilter,
    clearTaskFilter,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
    assignTask,
    startTask,
    completeTask,
    cancelTask,
    markAlertAsRead,
    resolveAlert,
    getUnreadAlerts,
    getCriticalAlerts,
    getPendingTasks,
    getActiveTransfers,
    getOverdueTasks
  } = useWarehouses();

  const { toast } = useToast();

  const handleExportWarehouses = () => {
    const csv = exportWarehousesToCSV(warehouses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานคลังสินค้าถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportTransfers = () => {
    const csv = exportTransfersToCSV(transfers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transfers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานการโอนย้ายถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportTasks = () => {
    const csv = exportTasksToCSV(tasks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานงานถูกดาวน์โหลดแล้ว",
    });
  };

  const handleApproveTransfer = (transferId: string) => {
    approveTransfer(transferId, 'current-user'); // TODO: ใช้ user ID จริง
    toast({
      title: "อนุมัติการโอนย้ายแล้ว",
      description: "การโอนย้ายได้รับการอนุมัติและพร้อมดำเนินการ",
    });
  };

  const handleShipTransfer = (transferId: string) => {
    shipTransfer(transferId, {
      carrier: {
        name: 'บริษัท ขนส่งดี จำกัด',
        trackingNumber: `TRK-${Date.now()}`,
        contact: '02-555-1234'
      },
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });
    toast({
      title: "ส่งสินค้าแล้ว",
      description: "สินค้าได้ถูกส่งออกและกำลังขนส่ง",
    });
  };

  const handleReceiveTransfer = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (transfer) {
      const receivedItems = transfer.items.map(item => ({
        itemId: item.id,
        receivedQuantity: item.shippedQuantity
      }));
      receiveTransfer(transferId, 'current-user', receivedItems);
      toast({
        title: "รับสินค้าแล้ว",
        description: "การโอนย้ายเสร็จสมบูรณ์",
      });
    }
  };

  const handleCancelTransfer = (transferId: string) => {
    cancelTransfer(transferId, 'ยกเลิกโดยผู้ใช้');
    toast({
      title: "ยกเลิกการโอนย้ายแล้ว",
      description: "การโอนย้ายถูกยกเลิก",
      variant: "destructive"
    });
  };

  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId, 'งานเสร็จสมบูรณ์');
    toast({
      title: "งานเสร็จสิ้น",
      description: "งานได้ถูกทำเครื่องหมายว่าเสร็จสิ้นแล้ว",
    });
  };

  const handleAlertClick = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const unreadAlerts = getUnreadAlerts();
  const criticalAlerts = getCriticalAlerts();
  const pendingTasks = getPendingTasks();
  const activeTransfers = getActiveTransfers();
  const overdueTasks = getOverdueTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การจัดการคลังสินค้า</h1>
          <p className="text-muted-foreground">
            จัดการคลังสินค้า การโอนย้าย งาน และการแจ้งเตือน
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
          <Button onClick={() => clearWarehouseFilter()} variant="outline">
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
                onClick={() => handleAlertClick(alert.id)}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4" />
            คลังสินค้า ({warehouses.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            การโอนย้าย ({transfers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            งาน ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            แจ้งเตือน ({unreadAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <WarehouseOverview summary={summary} alerts={alerts} />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-6">
          <WarehouseList
            warehouses={warehouses}
            filter={warehouseFilter}
            onFilterChange={setWarehouseFilter}
            onExport={handleExportWarehouses}
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <TransferManagement
            transfers={transfers}
            warehouses={warehouses}
            filter={transferFilter}
            onFilterChange={setTransferFilter}
            onExport={handleExportTransfers}
            onApproveTransfer={handleApproveTransfer}
            onShipTransfer={handleShipTransfer}
            onReceiveTransfer={handleReceiveTransfer}
            onCancelTransfer={handleCancelTransfer}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManagement
            tasks={tasks}
            filter={taskFilter}
            onFilterChange={setTaskFilter}
            onExport={handleExportTasks}
            onAssignTask={assignTask}
            onStartTask={startTask}
            onCompleteTask={handleCompleteTask}
            onCancelTask={cancelTask}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  การแจ้งเตือน
                </CardTitle>
                <div className="flex gap-2">
                  {unreadAlerts.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        unreadAlerts.forEach(alert => markAlertAsRead(alert.id));
                        toast({
                          title: "อ่านแจ้งเตือนทั้งหมดแล้ว",
                          description: `อ่านแจ้งเตือน ${unreadAlerts.length} รายการแล้ว`,
                        });
                      }}
                    >
                      อ่านทั้งหมด
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.isRead 
                          ? 'bg-gray-50 border-gray-200' 
                          : alert.severity === 'critical'
                          ? 'bg-red-50 border-red-200'
                          : alert.severity === 'error'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              alert.severity === 'critical' 
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'error'
                                ? 'bg-orange-100 text-orange-700'
                                : alert.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {alert.severity === 'critical' ? 'วิกฤต' : 
                               alert.severity === 'error' ? 'ข้อผิดพลาด' :
                               alert.severity === 'warning' ? 'คำเตือน' : 'ข้อมูล'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {alert.warehouse.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <h4 className={`font-medium mb-1 ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                            {alert.title}
                          </h4>
                          <p className={`text-sm ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                            {alert.message}
                          </p>
                          {alert.isResolved && alert.resolution && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <div className="font-medium text-green-800">แก้ไขแล้ว:</div>
                              <div className="text-green-700">{alert.resolution}</div>
                              <div className="text-xs text-green-600 mt-1">
                                โดย {alert.resolvedBy} เมื่อ {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleString('th-TH')}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAlertClick(alert.id)}
                            >
                              อ่านแล้ว
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                resolveAlert(alert.id, 'แก้ไขปัญหาแล้ว', 'current-user');
                                toast({
                                  title: "แก้ไขปัญหาแล้ว",
                                  description: "การแจ้งเตือนได้รับการแก้ไข",
                                });
                              }}
                            >
                              แก้ไข
                            </Button>
                          )}
                        </div>
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