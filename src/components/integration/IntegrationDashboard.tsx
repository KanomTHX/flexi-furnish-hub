// Integration Dashboard - แสดงสถานะการเชื่อมต่อระบบต่างๆ
import React, { useState, useEffect } from 'react';
import { 
  Activity,
  Database,
  ShoppingCart,
  Warehouse,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  FileText,
  CreditCard,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSimpleIntegration } from '@/hooks/useSimpleIntegration';
import { useSupplierBilling } from '@/hooks/useSupplierBilling';
import { useWarehouseStock } from '@/hooks/useWarehouseStock';

export function IntegrationDashboard() {
  const {
    loading,
    error,
    journalEntries,
    purchaseOrders,
    analytics,
    generateSupplierAnalytics,
    generateSupplierPerformanceReport,
    isIntegrationEnabled
  } = useSimpleIntegration();

  const { summary: supplierSummary } = useSupplierBilling();
  const { summary: warehouseSummary } = useWarehouseStock();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Integration status
  const integrationStatus = {
    accounting: {
      name: 'ระบบบัญชี',
      enabled: isIntegrationEnabled.journalEntries,
      status: journalEntries.length > 0 ? 'active' : 'ready',
      lastSync: new Date(),
      entries: journalEntries.length
    },
    pos: {
      name: 'ระบบ POS',
      enabled: isIntegrationEnabled.posIntegration,
      status: purchaseOrders.length > 0 ? 'active' : 'ready',
      lastSync: new Date(),
      orders: purchaseOrders.length
    },
    warehouse: {
      name: 'ระบบคลังสินค้า',
      enabled: isIntegrationEnabled.warehouseIntegration,
      status: warehouseSummary.totalProducts > 0 ? 'active' : 'ready',
      lastSync: new Date(),
      products: warehouseSummary.totalProducts
    },
    reporting: {
      name: 'ระบบรายงาน',
      enabled: isIntegrationEnabled.reporting,
      status: analytics ? 'active' : 'ready',
      lastSync: new Date(),
      reports: analytics ? Object.keys(analytics).length : 0
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await generateSupplierAnalytics();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, enabled: boolean) => {
    if (!enabled) return <XCircle className="h-5 w-5 text-gray-400" />;
    
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ready':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return <Badge variant="secondary">ปิดใช้งาน</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">ใช้งานอยู่</Badge>;
      case 'ready':
        return <Badge variant="secondary">พร้อมใช้งาน</Badge>;
      case 'error':
        return <Badge variant="destructive">ข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบสถานะ</Badge>;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  useEffect(() => {
    // Auto-refresh analytics on mount
    generateSupplierAnalytics();
  }, [generateSupplierAnalytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Dashboard</h2>
          <p className="text-muted-foreground">สถานะการเชื่อมต่อระบบต่างๆ</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            ตั้งค่า
          </Button>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(integrationStatus).map(([key, system]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {key === 'accounting' && <Database className="h-5 w-5 text-blue-600" />}
                  {key === 'pos' && <ShoppingCart className="h-5 w-5 text-green-600" />}
                  {key === 'warehouse' && <Warehouse className="h-5 w-5 text-orange-600" />}
                  {key === 'reporting' && <BarChart3 className="h-5 w-5 text-purple-600" />}
                  <span className="font-medium text-sm">{system.name}</span>
                </div>
                {getStatusIcon(system.status, system.enabled)}
              </div>
              
              <div className="space-y-2">
                {getStatusBadge(system.status, system.enabled)}
                
                {system.enabled && (
                  <div className="text-xs text-muted-foreground">
                    <p>อัปเดตล่าสุด: {formatDate(system.lastSync)}</p>
                    {key === 'accounting' && 'entries' in system && <p>Journal Entries: {system.entries}</p>}
                    {key === 'pos' && 'orders' in system && <p>Purchase Orders: {system.orders}</p>}
                    {key === 'warehouse' && 'products' in system && <p>สินค้า: {system.products} รายการ</p>}
                    {key === 'reporting' && 'reports' in system && <p>รายงาน: {system.reports} ประเภท</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="accounting">บัญชี</TabsTrigger>
          <TabsTrigger value="operations">การดำเนินงาน</TabsTrigger>
          <TabsTrigger value="analytics">วิเคราะห์</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  สุขภาพระบบ
                </CardTitle>
                <CardDescription>สถานะการทำงานของระบบต่างๆ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(integrationStatus).map(([key, system]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(system.status, system.enabled)}
                      <span className="text-sm">{system.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {system.enabled && (
                        <Progress 
                          value={system.status === 'active' ? 100 : system.status === 'ready' ? 75 : 25} 
                          className="w-20 h-2"
                        />
                      )}
                      {getStatusBadge(system.status, system.enabled)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  กิจกรรมล่าสุด
                </CardTitle>
                <CardDescription>การทำงานของระบบในช่วงที่ผ่านมา</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">กำลังโหลด...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {journalEntries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{entry.entryNumber}</p>
                            <p className="text-xs text-muted-foreground">{entry.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(entry.totalDebit)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    
                    {journalEntries.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ยังไม่มีกิจกรรม</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ซัพพลายเออร์</p>
                    <p className="text-2xl font-bold">{supplierSummary.totalSuppliers}</p>
                    <p className="text-xs text-green-600">ใช้งาน: {supplierSummary.activeSuppliers}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">สินค้าในคลัง</p>
                    <p className="text-2xl font-bold">{warehouseSummary.totalProducts}</p>
                    <p className="text-xs text-orange-600">พร้อมจำหน่าย: {warehouseSummary.availableQuantity}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ยอดค้างชำระ</p>
                    <p className="text-2xl font-bold">{formatCurrency(supplierSummary.totalOutstanding)}</p>
                    <p className="text-xs text-red-600">เกินกำหนด: {formatCurrency(supplierSummary.overdueAmount)}</p>
                  </div>
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>รายการบัญชีที่สร้างโดยระบบอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">กำลังโหลด...</p>
                </div>
              ) : journalEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มี Journal Entries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{entry.entryNumber}</h4>
                          <p className="text-sm text-muted-foreground">{entry.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(entry.totalDebit)}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(entry.entryDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">{entry.referenceType}</Badge>
                        <span className="text-muted-foreground">อ้างอิง: {entry.referenceNumber}</span>
                        <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                          {entry.status === 'posted' ? 'บันทึกแล้ว' : 'ร่าง'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>ใบสั่งซื้อจากระบบ POS</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มี Purchase Orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchaseOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} รายการ
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          <Badge variant={
                            order.status === 'received' ? 'default' :
                            order.status === 'approved' ? 'secondary' : 'outline'
                          }>
                            {order.status === 'received' ? 'รับแล้ว' :
                             order.status === 'approved' ? 'อนุมัติแล้ว' : 'รอดำเนินการ'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warehouse Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Activities</CardTitle>
                <CardDescription>กิจกรรมในคลังสินค้า</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">สินค้าพร้อมจำหน่าย</p>
                        <p className="text-sm text-muted-foreground">จำนวนสินค้าที่พร้อมขาย</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {warehouseSummary.availableQuantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">สินค้าเหลือน้อย</p>
                        <p className="text-sm text-muted-foreground">ต้องสั่งซื้อเพิ่ม</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">
                      {warehouseSummary.lowStockItems}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">สินค้าหมด</p>
                        <p className="text-sm text-muted-foreground">ต้องสั่งซื้อด่วน</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {warehouseSummary.outOfStockItems}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>การวิเคราะห์ข้อมูลจากระบบต่างๆ</CardDescription>
            </CardHeader>
            <CardContent>
              {!analytics ? (
                <div className="text-center py-8">
                  <Button onClick={() => generateSupplierAnalytics()}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    สร้างรายงานวิเคราะห์
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Supplier Performance</h4>
                    <div className="space-y-2">
                      {analytics.supplierPerformance.slice(0, 5).map((supplier: any, index: number) => (
                        <div key={supplier.supplier_id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{supplier.supplier_name}</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(supplier.outstanding_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Payment Trends</h4>
                    <div className="space-y-2">
                      {analytics.paymentTrends.slice(0, 5).map((payment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{payment.supplier?.supplier_name}</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(payment.payment_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}