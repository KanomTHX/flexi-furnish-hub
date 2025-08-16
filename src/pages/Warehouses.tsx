import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Import warehouse components - using placeholders
import { SimpleStockInquiry } from '@/components/warehouses/SimpleStockInquiry';
import { SimpleReceiveGoods } from '@/components/warehouses/SimpleReceiveGoods';
import SupplierBillingFixed2 from '@/components/warehouses/SupplierBillingFixed2';
import { IntegrationDashboard } from '@/components/integration/IntegrationDashboard';
import {
  WithdrawDispatch,
  BarcodeScanner,
  StockAdjustment
} from '@/components/warehouses/WarehousePlaceholders';
import SimpleBatchOperations from '@/components/warehouses/SimpleBatchOperations';
import SimpleTransfer from '@/components/warehouses/SimpleTransfer';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalProducts: 1247,
    totalValue: 2850000,
    lowStockItems: 23,
    recentTransactions: 156,
    systemHealth: 98,
    totalWarehouses: 12,
    activeOperations: 8
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
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-primary p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <WarehouseIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">ระบบคลังสินค้า</h1>
                    <p className="text-lg text-white/80 mt-1">
                      จัดการสต็อกและคลังสินค้าแบบอัจฉริยะ
                    </p>
                  </div>
                </div>
                {currentBranch && (
                  <div className="flex items-center gap-2 mt-4">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{currentBranch.name}</span>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Activity className="h-3 w-3 mr-1" />
                      เชื่อมต่อแล้ว
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="ค้นหาสินค้า คลัง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 w-80"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={loadSystemStats}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
              </div>
            </div>
          </div>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white"></div>
            <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-white"></div>
          </div>
        </div>

        {/* Modern Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">สินค้าทั้งหมด</p>
                  <p className="text-3xl font-bold text-primary">
                    {systemStats.totalProducts.toLocaleString()}
                  </p>
                  <div className="flex items-center text-sm text-success">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12.5% จากเดือนที่แล้ว
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">มูลค่าสต็อก</p>
                  <p className="text-3xl font-bold text-success">
                    ฿{(systemStats.totalValue / 1000000).toFixed(1)}M
                  </p>
                  <div className="flex items-center text-sm text-success">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8.3% จากเดือนที่แล้ว
                  </div>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">คลังสินค้า</p>
                  <p className="text-3xl font-bold text-info">
                    {systemStats.totalWarehouses}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 mr-1" />
                    {systemStats.activeOperations} กำลังดำเนินการ
                  </div>
                </div>
                <div className="p-3 bg-info/10 rounded-xl">
                  <WarehouseIcon className="h-8 w-8 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">แจ้งเตือน</p>
                  <p className="text-3xl font-bold text-warning">
                    {systemStats.lowStockItems}
                  </p>
                  <div className="flex items-center text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    ต้องเติมสต็อก
                  </div>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: Search, label: 'ตรวจสอบสต็อก', tab: 'inquiry' },
            { icon: Download, label: 'รับสินค้า', tab: 'receive' },
            { icon: Receipt, label: 'ใบวางบิล', tab: 'billing' },
            { icon: Upload, label: 'จ่ายสินค้า', tab: 'withdraw' },
            { icon: ArrowUpDown, label: 'โอนย้าย', tab: 'transfer' },
            { icon: QrCode, label: 'สแกนบาร์โค้ด', tab: 'barcode' },
            { icon: Layers, label: 'จัดการกลุ่ม', tab: 'batch' },
            { icon: Edit, label: 'ปรับปรุงสต็อก', tab: 'adjust' },
            { icon: History, label: 'ประวัติ', tab: 'audit' },
            { icon: Settings, label: 'Integration', tab: 'integration' }
          ].map(({ icon: Icon, label, tab }) => (
            <Card 
              key={tab}
              className={`group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-card ${
                activeTab === tab ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Real-time Stock Monitor */}
        <RealTimeStockMonitor />

        {/* Modern Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white rounded-xl shadow-sm border-0 overflow-hidden">
            <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0">
              {[
                { value: 'overview', icon: BarChart3, label: 'ภาพรวม' },
                { value: 'inquiry', icon: Search, label: 'ตรวจสอบ' },
                { value: 'receive', icon: Download, label: 'รับสินค้า' },
                { value: 'billing', icon: Receipt, label: 'ใบวางบิล' },
                { value: 'withdraw', icon: Upload, label: 'จ่ายสินค้า' },
                { value: 'transfer', icon: ArrowUpDown, label: 'โอนย้าย' },
                { value: 'barcode', icon: QrCode, label: 'บาร์โค้ด' },
                { value: 'batch', icon: Layers, label: 'กลุ่ม' },
                { value: 'adjust', icon: Edit, label: 'ปรับปรุง' },
                { value: 'audit', icon: History, label: 'ประวัติ' },
                { value: 'integration', icon: Settings, label: 'Integration' }
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-shrink-0 px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 hover:bg-muted/50 transition-all duration-200"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="font-medium">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="p-8 space-y-8">
              {/* Enhanced Performance Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-gradient-card border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Activity className="h-6 w-6 text-primary" />
                      ประสิทธิภาพระบบ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">สถานะระบบโดยรวม</p>
                        <p className="text-3xl font-bold text-primary">{systemStats.systemHealth}%</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-xl">
                        <Shield className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <Progress value={systemStats.systemHealth} className="h-3 bg-muted" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 bg-success/5 rounded-xl border border-success/20">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium">ความปลอดภัย</span>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">เป็นปกติ</Badge>
                      </div>
                      <div className="space-y-2 p-4 bg-info/5 rounded-xl border border-info/20">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-info" />
                          <span className="text-sm font-medium">การเชื่อมต่อ</span>
                        </div>
                        <Badge variant="secondary" className="bg-info/10 text-info border-info/20">เสถียร</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-info" />
                      ผู้ใช้งานออนไลน์
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <p className="text-4xl font-bold text-info mb-2">12</p>
                      <p className="text-sm text-muted-foreground">ผู้ใช้งานในระบบ</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { role: 'Admin', count: 3, color: 'primary' },
                        { role: 'Manager', count: 4, color: 'success' },
                        { role: 'Staff', count: 5, color: 'info' }
                      ].map(({ role, count, color }) => (
                        <div key={role} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-sm font-medium">{role}</span>
                          <Badge variant="secondary" className={`bg-${color}/10 text-${color} border-${color}/20`}>
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Modern Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'ระบบสต็อกอัจฉริยะ',
                    description: 'ตรวจสอบและจัดการสต็อกแบบเรียลไทม์',
                    icon: Package,
                    color: 'primary',
                    features: ['ตรวจสอบสต็อกแบบเรียลไทม์', 'แจ้งเตือนสต็อกต่ำ', 'วิเคราะห์แนวโน้ม']
                  },
                  {
                    title: 'การรับ-จ่ายสินค้า',
                    description: 'จัดการการรับและจ่ายสินค้าอย่างมีประสิทธิภาพ',
                    icon: ArrowUpDown,
                    color: 'success',
                    features: ['รับสินค้าเข้าคลัง', 'จ่ายสินค้าออกจากคลัง', 'โอนย้ายระหว่างคลัง']
                  },
                  {
                    title: 'เทคโนโลยีขั้นสูง',
                    description: 'ใช้เทคโนโลยีล้ำสมัยในการจัดการ',
                    icon: QrCode,
                    color: 'info',
                    features: ['สแกนบาร์โค้ด/QR Code', 'จัดการเป็นกลุ่ม', 'ประวัติการใช้งาน']
                  }
                ].map((section) => (
                  <Card key={section.title} className="group bg-gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className={`p-3 bg-${section.color}/10 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <section.icon className={`h-6 w-6 text-${section.color}`} />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {section.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {section.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${section.color}`}></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inquiry" className="p-6 bg-gradient-surface">
              <SimpleStockInquiry />
            </TabsContent>

            <TabsContent value="receive" className="p-6 bg-gradient-surface">
              <SimpleReceiveGoods />
            </TabsContent>

            <TabsContent value="billing" className="p-6 bg-gradient-surface">
              <SupplierBillingFixed2 />
            </TabsContent>

            <TabsContent value="withdraw" className="p-6 bg-gradient-surface">
              <WithdrawDispatch warehouses={warehouses} />
            </TabsContent>

            <TabsContent value="transfer" className="p-6 bg-gradient-surface">
              <SimpleTransfer warehouses={warehouses} currentWarehouseId={warehouses[0]?.id || ''} />
            </TabsContent>

            <TabsContent value="barcode" className="p-6 bg-gradient-surface">
              <BarcodeScanner onScan={() => { }} warehouses={warehouses} />
            </TabsContent>

            <TabsContent value="batch" className="p-6 bg-gradient-surface">
              <SimpleBatchOperations onBatchProcess={() => { }} availableOperations={[]} warehouses={warehouses} />
            </TabsContent>

            <TabsContent value="adjust" className="p-6 bg-gradient-surface">
              <StockAdjustment warehouseId={warehouses[0]?.id || ''} onAdjustmentComplete={() => { }} warehouses={warehouses} />
            </TabsContent>

            <TabsContent value="audit" className="p-6 bg-gradient-surface">
              <AuditTrail />
            </TabsContent>

            <TabsContent value="integration" className="p-6 bg-gradient-surface">
              <IntegrationDashboard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}