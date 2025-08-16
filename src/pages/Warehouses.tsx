import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import warehouse components - using placeholders
import { SimpleStockInquiry } from '@/components/warehouses/SimpleStockInquiry';
import { SimpleReceiveGoods } from '@/components/warehouses/SimpleReceiveGoods';
import SupplierBillingFixed2 from '@/components/warehouses/SupplierBillingFixed2';
import { IntegrationDashboard } from '@/components/integration/IntegrationDashboard';
import {
  WithdrawDispatch,
  Transfer,
  BarcodeScanner,
  BatchOperations,
  StockAdjustment
} from '@/components/warehouses/WarehousePlaceholders';
import { RealTimeStockMonitor } from '@/components/warehouses/RealTimeStockMonitor';
import AuditTrail from '@/components/warehouses/AuditTrail';
import PrintButton from '@/components/warehouses/PrintButton';

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
  Eye,
  Search,
  Download,
  Upload,
  QrCode,
  Layers,
  Edit,
  History,
  Printer,
  Receipt,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';

export default function Warehouses() {
  const { currentBranch } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    systemHealth: 98
  });
  const { toast } = useToast();

  // Load warehouses and stats on component mount
  useEffect(() => {
    loadWarehouses();
    loadSystemStats();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const { WarehouseService } = await import('@/services/warehouseService');
      const warehousesData = await WarehouseService.getWarehouses();
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลคลังสินค้าได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Mock data for demonstration - in real app, fetch from API
      setSystemStats({
        totalProducts: 1247,
        totalValue: 2850000,
        lowStockItems: 23,
        recentTransactions: 156,
        systemHealth: 98
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    toast({
      title: "ดำเนินการ",
      description: `เปิดหน้า${action}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Branch Info and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <WarehouseIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">คลัง & สต็อก</h1>
              <p className="text-muted-foreground">
                จัดการคลังสินค้าและระบบสต็อกแบบครบวงจร
              </p>
            </div>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <Badge variant="secondary" className="ml-2">
                <Activity className="h-3 w-3 mr-1" />
                ออนไลน์
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadSystemStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            ตั้งค่า
          </Button>
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

      

      {/* Real-time Stock Monitor */}
      <RealTimeStockMonitor />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-2">
          <TabsTrigger value="overview" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">ภาพรวม</span>
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Search className="w-5 h-5" />
            <span className="font-semibold">ตรวจสอบ</span>
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Download className="w-5 h-5" />
            <span className="font-semibold">รับสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Receipt className="w-5 h-5" />
            <span className="font-semibold">ใบวางบิล</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Upload className="w-5 h-5" />
            <span className="font-semibold">จ่ายสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <ArrowUpDown className="w-5 h-5" />
            <span className="font-semibold">โอนย้าย</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold">บาร์โค้ด</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Layers className="w-5 h-5" />
            <span className="font-semibold">กลุ่ม</span>
          </TabsTrigger>
          <TabsTrigger value="adjust" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <Edit className="w-5 h-5" />
            <span className="font-semibold">ปรับปรุง</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <History className="w-5 h-5" />
            <span className="font-semibold">ประวัติ</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex-1 min-w-[120px] h-16 flex-col gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">Integration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {systemStats.totalProducts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +12% จากเดือนที่แล้ว
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่าสต็อก</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ฿{(systemStats.totalValue / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +8.2% จากเดือนที่แล้ว
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สต็อกต่ำ</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {systemStats.lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  รายการที่ต้องเติมสต็อก
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ธุรกรรมวันนี้</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {systemStats.recentTransactions}
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  อัปเดตล่าสุด 5 นาทีที่แล้ว
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Health and Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  สถานะระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ประสิทธิภาพระบบ</span>
                  <span className="text-sm text-muted-foreground">{systemStats.systemHealth}%</span>
                </div>
                <Progress value={systemStats.systemHealth} className="h-2" />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">ระบบปลอดภัย</span>
                    <Badge variant="secondary" className="ml-auto">ปกติ</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">การเชื่อมต่อ</span>
                    <Badge variant="secondary" className="ml-auto">เสถียร</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  ผู้ใช้งานออนไลน์
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600 mb-2">12</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Admin</span>
                    <span className="text-muted-foreground">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Manager</span>
                    <span className="text-muted-foreground">4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Staff</span>
                    <span className="text-muted-foreground">5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  ฟีเจอร์หลัก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">ตรวจสอบสต็อกแบบเรียลไทม์</span>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="h-4 w-4 text-green-600" />
                  <span className="text-sm">รับสินค้าเข้าคลัง</span>
                </div>
                <div className="flex items-center gap-3">
                  <Upload className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">จ่ายสินค้าออกจากคลัง</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">โอนย้ายระหว่างคลัง</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  ฟีเจอร์ขั้นสูง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm">สแกนบาร์โค้ดและ QR Code</span>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-teal-600" />
                  <span className="text-sm">จัดการสินค้าเป็นกลุ่ม</span>
                </div>
                <div className="flex items-center gap-3">
                  <Edit className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">ปรับปรุงสต็อกและแก้ไข</span>
                </div>
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">ติดตามประวัติการใช้งาน</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inquiry" className="space-y-6 mt-4">
          <SimpleStockInquiry />
        </TabsContent>

        <TabsContent value="receive" className="space-y-6 mt-4">
          <SimpleReceiveGoods />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-4">
          <SupplierBillingFixed2 />
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-6 mt-4">
          <WithdrawDispatch warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6 mt-4">
          <Transfer warehouses={warehouses} currentWarehouseId={warehouses[0]?.id || ''} />
        </TabsContent>

        <TabsContent value="barcode" className="space-y-6 mt-4">
          <BarcodeScanner onScan={() => { }} warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="batch" className="space-y-6 mt-4">
          <BatchOperations onBatchProcess={() => { }} availableOperations={[]} warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="adjust" className="space-y-6 mt-4">
          <StockAdjustment warehouseId={warehouses[0]?.id || ''} onAdjustmentComplete={() => { }} warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 mt-4">
          <AuditTrail />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6 mt-4">
          <IntegrationDashboard />
        </TabsContent>


      </Tabs>
    </div>
  );
}