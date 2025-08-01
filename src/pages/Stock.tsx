import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useStock } from '@/hooks/useStock';
import { StockOverview } from '@/components/stock/StockOverview';
import { ProductStockTable } from '@/components/stock/ProductStockTable';
import { StockMovementHistory } from '@/components/stock/StockMovementHistory';
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog';
import { ProductStock } from '@/types/stock';
import { exportStockToCSV, exportMovementsToCSV } from '@/utils/stockHelpers';
import { 
  Package, 
  Activity, 
  AlertTriangle, 
  Plus,
  BarChart3,
  Settings,
  Download
} from 'lucide-react';

export default function Stock() {
  const {
    products,
    movements,
    alerts,
    suppliers,
    locations,
    summary,
    filter,
    addStockMovement,
    markAlertAsRead,
    markAllAlertsAsRead,
    setStockFilter,
    clearFilter
  } = useStock();

  const { toast } = useToast();
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);

  const handleStockAdjustment = (
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string,
    options: any
  ) => {
    const movement = addStockMovement(productId, type, quantity, reason, options);
    
    if (movement) {
      toast({
        title: "ปรับปรุงสต็อกสำเร็จ",
        description: `${movement.product.name} ${type === 'in' ? 'เพิ่ม' : type === 'out' ? 'ลด' : 'ปรับปรุง'} ${quantity} ชิ้น`,
      });
    }
  };

  const handleExportStock = () => {
    const csv = exportStockToCSV(products);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์รายงานสต็อกถูกดาวน์โหลดแล้ว",
    });
  };

  const handleExportMovements = () => {
    const csv = exportMovementsToCSV(movements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-movements-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ส่งออกข้อมูลสำเร็จ",
      description: "ไฟล์ประวัติการเคลื่อนไหวถูกดาวน์โหลดแล้ว",
    });
  };

  const handleQuickAdjustment = (product: ProductStock) => {
    setSelectedProduct(product);
    setAdjustmentDialogOpen(true);
  };

  const handleAlertClick = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การจัดการสต็อก</h1>
          <p className="text-muted-foreground">
            จัดการสต็อกสินค้า ติดตามการเคลื่อนไหว และรายงานสถิติ
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadAlerts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllAlertsAsRead()}
              className="relative"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              แจ้งเตือน
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            </Button>
          )}
          <Button onClick={() => clearFilter()} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
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
                • {alert.message}
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

      {/* เนื้อหาหลัก */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            รายการสินค้า ({products.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            ประวัติการเคลื่อนไหว
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            แจ้งเตือน ({unreadAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StockOverview summary={summary} alerts={alerts} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductStockTable
            products={products}
            locations={locations}
            suppliers={suppliers}
            filter={filter}
            onFilterChange={setStockFilter}
            onExport={handleExportStock}
            onEditProduct={handleQuickAdjustment}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <StockMovementHistory
            movements={movements}
            locations={locations}
            suppliers={suppliers}
            filter={filter}
            onFilterChange={setStockFilter}
            onExport={handleExportMovements}
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
                      onClick={() => markAllAlertsAsRead()}
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
                          : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              alert.severity === 'critical' 
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'high'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {alert.severity === 'critical' ? 'วิกฤต' : 
                               alert.severity === 'high' ? 'สูง' : 
                               alert.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className={`text-sm ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                            {alert.message}
                          </p>
                        </div>
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAlertClick(alert.id)}
                          >
                            อ่านแล้ว
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog ปรับปรุงสต็อก */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        product={selectedProduct}
        locations={locations}
        onConfirm={handleStockAdjustment}
      />
    </div>
  );
}