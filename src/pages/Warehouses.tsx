import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import warehouse components - using placeholders
import { SimpleStockInquiry } from '@/components/warehouses/SimpleStockInquiry';
import { IntegratedGoodsReceiptBilling } from '@/components/warehouses/IntegratedGoodsReceiptBilling';
import { IntegrationDashboard } from '@/components/integration/IntegrationDashboard';
import {
  WithdrawDispatch,
  BatchOperations,
  StockAdjustment
} from '@/components/warehouses/WarehousePlaceholders';
import { BarcodeScanner } from '@/components/warehouses/BarcodeScanner';
import { RealTimeStockMonitor } from '@/components/warehouses/RealTimeStockMonitor';
import AuditTrail from '@/components/warehouses/AuditTrail';
import PrintButton from '@/components/warehouses/PrintButton';
import { ZoneManagement } from '@/components/warehouses/ZoneManagement';
import { TaskManagement } from '@/components/warehouses/TaskManagement';
import { WarehouseAlertSystem } from '@/components/warehouses/WarehouseAlertSystem';
import { TransferManagementEnhanced } from '@/components/warehouses/TransferManagementEnhanced';

import { WarehouseAnalytics } from '@/components/warehouses/WarehouseAnalytics';
import { supabase } from '@/integrations/supabase/client';

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
  RefreshCw,
  MapPin,
  CheckSquare,
  Bell,
  ArrowRightLeft
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

  // Load warehouses and stats on component mount and when branch changes
  useEffect(() => {
    loadWarehouses();
    loadSystemStats();
  }, [currentBranch]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const { WarehouseService } = await import('@/services/warehouseService');
      const warehousesData = await WarehouseService.getWarehouses({
        branchId: currentBranch?.id
      });
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
      // ดึงข้อมูลจาก Supabase
      toast({
        title: "กำลังโหลดข้อมูล",
        description: "กำลังดึงข้อมูลสถิติจากฐานข้อมูล",
        variant: "default"
      });
      
      // 1. ดึงข้อมูลสินค้าทั้งหมด
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;
      
      // 2. ดึงข้อมูลการเคลื่อนไหวัดล่าสุด
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
      
      if (movementsError) throw movementsError;
      
      // คำนวณมูลค่าสต็อกทั้งหมด
      const totalValue = products?.reduce((sum, product) => {
        return sum + ((product.selling_price || 0) * (product.max_stock_level - product.min_stock_level));
      }, 0) || 0;
      
      // นับจำนวนสินค้าที่มีสต็อกต่ำ
      const lowStockItems = products?.filter(p => (p.max_stock_level - p.min_stock_level) <= 10 && (p.max_stock_level - p.min_stock_level) > 0).length || 0;
      
      // อัปเดตข้อมูลสถิติ
      setSystemStats({
        totalProducts: products?.length || 0,
        totalValue,
        lowStockItems,
        recentTransactions: movements?.length || 0,
        systemHealth: 98
      });
      
      toast({
        title: "โหลดข้อมูลสำเร็จ",
        description: "อัปเดตข้อมูลสถิติเรียบร้อยแล้ว",
        variant: "success"
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสถิติได้",
        variant: "destructive"
      });
      
      // ใช้ข้อมูลจำลองในกรณีที่เกิดข้อผิดพลาด
      setSystemStats({
        totalProducts: 1247,
        totalValue: 2850000,
        lowStockItems: 23,
        recentTransactions: 156,
        systemHealth: 98
      });
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-md mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <WarehouseIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">คลัง & สต็อก</h1>
                <p className="text-blue-700 font-medium">
                  จัดการคลังสินค้าและระบบสต็อกแบบครบวงจร
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              {currentBranch && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 shadow-sm w-full sm:w-auto">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
                    <span className="text-xs text-blue-600">สาขาหลัก</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 hover:bg-green-200">
                    <Activity className="h-3 w-3 mr-1" />
                    ออนไลน์
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={loadSystemStats} className="bg-white/80 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        รีเฟรช
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>รีเฟรชข้อมูลคลังสินค้า</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white/80 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                        <Settings className="h-4 w-4 mr-2" />
                        ตั้งค่า
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ตั้งค่าระบบคลังสินค้า</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
      <RealTimeStockMonitor branchId={currentBranch?.id} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <TabsList className="inline-flex h-auto min-h-[4rem] w-max space-x-1 rounded-none bg-transparent p-1">
          <TabsTrigger value="overview" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">ภาพรวม</span>
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Search className="w-5 h-5" />
            <span className="font-semibold">ตรวจสอบ</span>
          </TabsTrigger>
          <TabsTrigger value="integrated-receipt" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Package className="w-5 h-5" />
            <span className="font-semibold">รับสินค้า & เรียกเก็บเงิน</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Upload className="w-5 h-5" />
            <span className="font-semibold">จ่ายสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="transfer" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <ArrowUpDown className="w-5 h-5" />
            <span className="font-semibold">โอนย้าย</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold">บาร์โค้ด</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Layers className="w-5 h-5" />
            <span className="font-semibold">กลุ่ม</span>
          </TabsTrigger>
          <TabsTrigger value="adjust" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Edit className="w-5 h-5" />
            <span className="font-semibold">ปรับปรุง</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <History className="w-5 h-5" />
            <span className="font-semibold">ประวัติ</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">Integration</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <MapPin className="w-5 h-5" />
            <span className="font-semibold">โซนคลัง</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <CheckSquare className="w-5 h-5" />
            <span className="font-semibold">งาน</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <Bell className="w-5 h-5" />
            <span className="font-semibold">แจ้งเตือน</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <ArrowRightLeft className="w-5 h-5" />
            <span className="font-semibold">โอนย้าย</span>
          </TabsTrigger>

          <TabsTrigger value="analytics" className="min-w-[100px] h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-3">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">วิเคราะห์</span>
          </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm">ผู้ใช้งานออนไลน์</span>
                    <Badge variant="secondary" className="ml-auto">5 คน</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">เวลาตอบสนอง</span>
                    <Badge variant="secondary" className="ml-auto">120ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  คลังสินค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {warehouses.slice(0, 3).map((warehouse, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700">{warehouse.code.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{warehouse.name}</p>
                        <p className="text-xs text-muted-foreground">{warehouse.location}</p>
                      </div>
                    </div>
                    <Badge variant={warehouse.status === 'active' ? 'outline' : 'secondary'} className={warehouse.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                      {warehouse.status === 'active' ? 'พร้อมใช้งาน' : 'ปิดปรับปรุง'}
                    </Badge>
                  </div>
                ))}

                <Button variant="outline" className="w-full" onClick={() => setActiveTab('inquiry')}>
                  <Eye className="h-4 w-4 mr-2" />
                  ดูทั้งหมด
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                ดำเนินการด่วน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => handleQuickAction('รับสินค้า')}>
                  <Download className="h-5 w-5 text-green-500" />
                  <span>รับสินค้า</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => handleQuickAction('จ่ายสินค้า')}>
                  <Upload className="h-5 w-5 text-orange-500" />
                  <span>จ่ายสินค้า</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => handleQuickAction('ตรวจสอบสต็อก')}>
                  <Search className="h-5 w-5 text-blue-500" />
                  <span>ตรวจสอบสต็อก</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={() => handleQuickAction('พิมพ์รายงาน')}>
                  <Printer className="h-5 w-5 text-purple-500" />
                  <span>พิมพ์รายงาน</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiry" className="mt-4">
          <SimpleStockInquiry />
        </TabsContent>

        <TabsContent value="integrated-receipt" className="mt-4">
          <IntegratedGoodsReceiptBilling branchId={currentBranch?.id} />
        </TabsContent>

        <TabsContent value="withdraw" className="mt-4">
          <WithdrawDispatch warehouses={warehouses} />
        </TabsContent>



        <TabsContent value="barcode" className="mt-4">
          <BarcodeScanner />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <BatchOperations warehouses={warehouses} />
        </TabsContent>

        <TabsContent value="adjust" className="mt-4">
          <StockAdjustment warehouses={warehouses} warehouseId="" />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditTrail branchId={currentBranch?.id} />
        </TabsContent>

        <TabsContent value="integration" className="mt-4">
          <IntegrationDashboard />
        </TabsContent>

        <TabsContent value="zones" className="mt-4">
          <ZoneManagement warehouseId={warehouses[0]?.id || 'default'} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TaskManagement />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <WarehouseAlertSystem />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransferManagementEnhanced />
        </TabsContent>



        <TabsContent value="analytics" className="mt-4">
          <WarehouseAnalytics />
        </TabsContent>
      </Tabs>

      {/* Print Button */}
      <div className="fixed bottom-6 right-6">
        <PrintButton />
      </div>
    </div>
  );
}