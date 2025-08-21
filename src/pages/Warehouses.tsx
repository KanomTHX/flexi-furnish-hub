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
  ArrowRightLeft
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { useBranches } from '../hooks/useBranches';
import { BranchSelector } from '../components/branch/BranchSelector';

export default function Warehouses() {
  const { currentBranch } = useBranchData();
  const { branches, loading: branchesLoading, refreshBranches } = useBranches();
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
        description: "ไม่สามารถโหลดข้อมูลคลังสาขาได้",
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
                  จัดการคลังสาขาและระบบสต็อกแบบครบวงจร
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
                      <p>รีเฟรชข้อมูลคลังสาขา</p>
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
                      <p>ตั้งค่าระบบคลังสาขา</p>
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
        <div className="w-full rounded-md border bg-background p-2">
          <TabsList className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12 gap-2 h-auto bg-transparent p-0">
          <TabsTrigger value="overview" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">ภาพรวม</span>
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <Search className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">ตรวจสอบ</span>
          </TabsTrigger>
          <TabsTrigger value="integrated-receipt" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <Package className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">รับสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">จ่ายสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="transfers" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <ArrowRightLeft className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">โอนย้าย</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <QrCode className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">บาร์โค้ด</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">กลุ่ม</span>
          </TabsTrigger>
          <TabsTrigger value="adjust" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <Edit className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">ปรับปรุง</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <History className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">ประวัติ</span>
          </TabsTrigger>

          <TabsTrigger value="zones" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">โซนคลัง</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <CheckSquare className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">งาน</span>
          </TabsTrigger>


          <TabsTrigger value="analytics" className="h-16 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all px-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold text-center leading-tight">วิเคราะห์</span>
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* สถิติหลัก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {systemStats.totalProducts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่าสต็อก</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ฿{(systemStats.totalValue / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">ล้านบาท</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สต็อกต่ำ</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {systemStats.lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ธุรกรรมวันนี้</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {systemStats.recentTransactions}
                </div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
          </div>

          {/* ข้อมูลสำคัญ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* กิจกรรมล่าสุด */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  กิจกรรมล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Download className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">รับสินค้าเข้าคลัง</p>
                        <p className="text-xs text-muted-foreground">5 นาทีที่แล้ว</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      +50 ชิ้น
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Upload className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">จ่ายสินค้าออกคลัง</p>
                        <p className="text-xs text-muted-foreground">15 นาทีที่แล้ว</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      -25 ชิ้น
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">โอนย้ายระหว่างสาขา</p>
                        <p className="text-xs text-muted-foreground">30 นาทีที่แล้ว</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800">
                      10 ชิ้น
                    </Badge>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-3" onClick={() => setActiveTab('audit')}>
                  <History className="h-4 w-4 mr-2" />
                  ดูประวัติทั้งหมด
                </Button>
              </CardContent>
            </Card>

            {/* คลังสาขา */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  คลังสาขา
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouses.length > 0 ? (
                  warehouses.slice(0, 3).map((warehouse, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{warehouse.code?.substring(0, 2) || 'WH'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{warehouse.name || 'คลังหลัก'}</p>
                          <p className="text-xs text-muted-foreground">{warehouse.location || 'สาขาหลัก'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        พร้อมใช้งาน
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ไม่พบข้อมูลคลังสาขา</p>
                  </div>
                )}
                
                <Button variant="outline" className="w-full mt-3" onClick={() => setActiveTab('inquiry')}>
                  <Eye className="h-4 w-4 mr-2" />
                  ดูรายละเอียดทั้งหมด
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* เมนูด่วน */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                เมนูด่วน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300" 
                  onClick={() => setActiveTab('integrated-receipt')}
                >
                  <Download className="h-5 w-5 text-green-500" />
                  <span className="text-sm">รับสินค้า</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300" 
                  onClick={() => setActiveTab('withdraw')}
                >
                  <Upload className="h-5 w-5 text-orange-500" />
                  <span className="text-sm">จ่ายสินค้า</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300" 
                  onClick={() => setActiveTab('inquiry')}
                >
                  <Search className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">ตรวจสอบสต็อก</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300" 
                  onClick={() => setActiveTab('transfers')}
                >
                  <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">โอนย้าย</span>
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



        <TabsContent value="zones" className="mt-4">
          <ZoneManagement warehouseId={currentBranch?.id || 'default'} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <TaskManagement warehouseId={currentBranch?.id || 'default'} />
        </TabsContent>



        <TabsContent value="transfers" className="mt-4">
          <TransferManagementEnhanced />
        </TabsContent>



        <TabsContent value="analytics" className="mt-4">
          <WarehouseAnalytics warehouseId={currentBranch?.id} />
        </TabsContent>
      </Tabs>

      {/* Print Button */}
      <div className="fixed bottom-6 right-6">
        <PrintButton />
      </div>
    </div>
  );
}