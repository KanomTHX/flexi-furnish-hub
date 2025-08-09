import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Import warehouse components
import { MockStockInquiry } from '@/components/warehouses/MockStockInquiry';
import { StockInquiry } from '@/components/warehouses/StockInquiry';
import { ReceiveGoods } from '@/components/warehouses/ReceiveGoods';
import { WithdrawDispatch } from '@/components/warehouses/WithdrawDispatch';
import { Transfer } from '@/components/warehouses/Transfer';
import { RealTimeStockMonitor } from '@/components/warehouses/RealTimeStockMonitor';
import { BarcodeScanner } from '@/components/warehouses/BarcodeScanner';
import { BatchOperations } from '@/components/warehouses/BatchOperations';
import { StockAdjustment } from '@/components/warehouses/StockAdjustment';
import { AuditTrail } from '@/components/warehouses/AuditTrail';
import { PrintButton } from '@/components/warehouses/PrintButton';

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
  Printer
} from 'lucide-react';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';

export default function Warehouses() {
  const { currentBranch } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    toast({
      title: "ดำเนินการ",
      description: `เปิดหน้า${action}`,
    });
  };

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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('inquiry')}
        >
          <Search className="h-6 w-6" />
          <span className="text-xs">ตรวจสอบสต็อก</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('receive')}
        >
          <Download className="h-6 w-6" />
          <span className="text-xs">รับสินค้า</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('withdraw')}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">จ่ายสินค้า</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('transfer')}
        >
          <ArrowUpDown className="h-6 w-6" />
          <span className="text-xs">โอนย้าย</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('barcode')}
        >
          <QrCode className="h-6 w-6" />
          <span className="text-xs">สแกนบาร์โค้ด</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('batch')}
        >
          <Layers className="h-6 w-6" />
          <span className="text-xs">จัดการกลุ่ม</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('adjust')}
        >
          <Edit className="h-6 w-6" />
          <span className="text-xs">ปรับปรุงสต็อก</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => setActiveTab('audit')}
        >
          <History className="h-6 w-6" />
          <span className="text-xs">ประวัติการใช้งาน</span>
        </Button>
      </div>

      {/* Real-time Stock Monitor */}
      <RealTimeStockMonitor />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">ภาพรวม</span>
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="flex items-center gap-1">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">ตรวจสอบ</span>
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">รับสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex items-center gap-1">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">จ่ายสินค้า</span>
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">โอนย้าย</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex items-center gap-1">
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">บาร์โค้ด</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">กลุ่ม</span>
          </TabsTrigger>
          <TabsTrigger value="adjust" className="flex items-center gap-1">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">ปรับปรุง</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">ประวัติ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ระบบคลังสินค้า</CardTitle>
                <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">พร้อมใช้งาน</div>
                <p className="text-xs text-muted-foreground">
                  ระบบจัดการคลังสินค้าครบครัน
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ฟีเจอร์หลัก</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  ฟีเจอร์ครบครัน
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การติดตาม</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">เรียลไทม์</div>
                <p className="text-xs text-muted-foreground">
                  ติดตามสต็อกแบบเรียลไทม์
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การพิมพ์</CardTitle>
                <Printer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">รองรับ</div>
                <p className="text-xs text-muted-foreground">
                  พิมพ์ป้ายและรายงาน
                </p>
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

        <TabsContent value="inquiry" className="space-y-6">
          <StockInquiry />
        </TabsContent>

        <TabsContent value="receive" className="space-y-6">
          <ReceiveGoods />
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-6">
          <WithdrawDispatch />
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6">
          <Transfer />
        </TabsContent>

        <TabsContent value="barcode" className="space-y-6">
          <BarcodeScanner />
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <BatchOperations />
        </TabsContent>

        <TabsContent value="adjust" className="space-y-6">
          <StockAdjustment />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditTrail />
        </TabsContent>


      </Tabs>
    </div>
  );
}