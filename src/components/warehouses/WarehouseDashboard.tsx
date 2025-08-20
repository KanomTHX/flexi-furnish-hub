import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Alert,
  AlertDescription,
  Separator,
  ScrollArea,
} from '@/components/ui/ui';
import {
  Package,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Activity,
  Thermometer,
  Droplets,
  Zap,
  MapPin,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Bell,
  Calendar,
  DollarSign,
  Truck,
  ShoppingCart,
  FileText,
  XCircle,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Target,
  Layers,
  Grid,
  List,
} from 'lucide-react';
import { SerialNumberManagement } from './SerialNumberManagement';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useBranchData } from '@/hooks/useBranch';
import { useSerialNumberStats } from '@/hooks/useSerialNumber';
import { useToast } from '@/hooks/use-toast';
import type { Branch as BranchType } from '@/types/branch';

interface WarehouseDashboardProps {
  branchId?: string;
}

interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  pendingTasks: number;
  todayMovements: number;
  occupancyRate: number;
  temperature: number;
  humidity: number;
  alerts: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

interface RecentActivity {
  id: string;
  type: 'receive' | 'ship' | 'transfer' | 'adjust' | 'claim';
  description: string;
  timestamp: Date;
  user: string;
  status: 'completed' | 'pending' | 'failed';
}

export function WarehouseDashboard({ branchId }: WarehouseDashboardProps) {
  const { toast } = useToast();
  const { branches, loading: branchLoading } = useBranchData();
  const { stats: snStats, loading: snLoading } = useSerialNumberStats({ branchId });
  
  // State
  const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    pendingTasks: 0,
    todayMovements: 0,
    occupancyRate: 0,
    temperature: 22,
    humidity: 45,
    alerts: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'receive',
      description: 'รับสินค้าเข้าคลัง - โซฟา 3 ที่นั่ง (SN: SF001234)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: 'สมชาย ใจดี',
      status: 'completed',
    },
    {
      id: '2',
      type: 'ship',
      description: 'จัดส่งสินค้า - เตียงนอน King Size (SN: BD005678)',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      user: 'สมหญิง รักงาน',
      status: 'completed',
    },
    {
      id: '3',
      type: 'transfer',
      description: 'โอนย้ายสินค้า - โต๊ะทำงาน (SN: TB009876) ไปคลัง B',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      user: 'สมศักดิ์ ขยัน',
      status: 'pending',
    },
  ]);

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'receive',
      title: 'รับสินค้าเข้า',
      description: 'บันทึกสินค้าใหม่เข้าคลัง',
      icon: Package,
      color: 'bg-green-500',
      action: () => toast({ title: 'เปิดหน้ารับสินค้า', description: 'ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป' }),
    },
    {
      id: 'ship',
      title: 'จัดส่งสินค้า',
      description: 'บันทึกการจัดส่งสินค้า',
      icon: Truck,
      color: 'bg-blue-500',
      action: () => toast({ title: 'เปิดหน้าจัดส่ง', description: 'ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป' }),
    },
    {
      id: 'transfer',
      title: 'โอนย้ายสินค้า',
      description: 'โอนสินค้าระหว่างคลัง',
      icon: RefreshCw,
      color: 'bg-purple-500',
      action: () => toast({ title: 'เปิดหน้าโอนย้าย', description: 'ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป' }),
    },
    {
      id: 'adjust',
      title: 'ปรับปรุงสต็อก',
      description: 'ปรับแก้ยอดสต็อกสินค้า',
      icon: Edit,
      color: 'bg-orange-500',
      action: () => toast({ title: 'เปิดหน้าปรับสต็อก', description: 'ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป' }),
    },
    {
      id: 'scan',
      title: 'สแกน QR Code',
      description: 'สแกนเพื่อค้นหาสินค้า',
      icon: QrCode,
      color: 'bg-indigo-500',
      action: () => setActiveTab('serial-numbers'),
    },
    {
      id: 'report',
      title: 'รายงาน',
      description: 'ดูรายงานและสถิติ',
      icon: BarChart3,
      color: 'bg-pink-500',
      action: () => setActiveTab('analytics'),
    },
  ];

  // Update dashboard stats when serial number stats change
  useEffect(() => {
    if (snStats) {
      setDashboardStats(prev => ({
        ...prev,
        totalProducts: snStats.total,
        lowStockItems: snStats.damaged + snStats.claimed,
        alerts: snStats.damaged + snStats.claimed,
      }));
    }
  }, [snStats]);

  // Set selected branch
  useEffect(() => {
    if (branchId && branches.length > 0) {
      const branch = branches.find(b => b.id === branchId);
      setSelectedBranch(branch || null);
    } else if (branches.length > 0) {
      setSelectedBranch(branches[0]);
    }
  }, [branchId, branches]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'receive': return <Package className="w-4 h-4 text-green-500" />;
      case 'ship': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'transfer': return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case 'adjust': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'claim': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: RecentActivity['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />เสร็จสิ้น</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />รอดำเนินการ</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />ล้มเหลว</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedBranch ? `สาขา: ${selectedBranch.name}` : 'ภาพรวมระบบคลังสินค้า'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedBranch?.id || ''}
            onValueChange={(value) => {
              const branch = branches.find(b => b.id === value);
              setSelectedBranch(branch || null);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            ตั้งค่า
          </Button>
          
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            แจ้งเตือน
            {dashboardStats.alerts > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{dashboardStats.alerts}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="serial-numbers">Serial Numbers</TabsTrigger>
          <TabsTrigger value="inventory">คลังสินค้า</TabsTrigger>
          <TabsTrigger value="tasks">งาน</TabsTrigger>
          <TabsTrigger value="analytics">รายงาน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">สินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold">{dashboardStats.totalProducts.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +5.2%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">มูลค่ารวม</p>
                    <p className="text-2xl font-bold">{(dashboardStats.totalValue / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.8%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">สต็อกต่ำ</p>
                    <p className="text-2xl font-bold">{dashboardStats.lowStockItems}</p>
                    <p className="text-xs text-red-600 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -2.1%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">งานรอ</p>
                    <p className="text-2xl font-bold">{dashboardStats.pendingTasks}</p>
                    <p className="text-xs text-yellow-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      รอดำเนินการ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">เคลื่อนไหววันนี้</p>
                    <p className="text-2xl font-bold">{dashboardStats.todayMovements}</p>
                    <p className="text-xs text-blue-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8.5%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-pink-500" />
                  <div>
                    <p className="text-sm font-medium">อัตราการใช้</p>
                    <p className="text-2xl font-bold">{dashboardStats.occupancyRate}%</p>
                    <Progress value={dashboardStats.occupancyRate} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">อุณหภูมิ</p>
                    <p className="text-2xl font-bold">{dashboardStats.temperature}°C</p>
                    <p className="text-xs text-green-600">ปกติ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-cyan-500" />
                  <div>
                    <p className="text-sm font-medium">ความชื้น</p>
                    <p className="text-2xl font-bold">{dashboardStats.humidity}%</p>
                    <p className="text-xs text-green-600">ปกติ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการด่วน</CardTitle>
              <CardDescription>
                เลือกการดำเนินการที่ต้องการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={action.action}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>กิจกรรมล่าสุด</CardTitle>
                <CardDescription>
                  การเคลื่อนไหวในคลังสินค้า
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {activity.user} • {activity.timestamp.toLocaleTimeString('th-TH')}
                            </p>
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>การแจ้งเตือน</CardTitle>
                <CardDescription>
                  ปัญหาและข้อควรระวัง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      มีสินค้า 3 รายการที่สต็อกต่ำกว่าเกณฑ์ที่กำหนด
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      มีงาน 5 รายการที่รอการดำเนินการมากกว่า 2 ชั่วโมง
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ระบบทำงานปกติ - ไม่มีปัญหาด้านเทคนิค
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Serial Numbers Tab */}
        <TabsContent value="serial-numbers">
          <SerialNumberManagement branchId={selectedBranch?.id} />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>การจัดการคลังสินค้า</CardTitle>
              <CardDescription>
                จัดการสินค้า โซน และตำแหน่งเก็บ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Layers className="h-4 w-4" />
                <AlertDescription>
                  ฟีเจอร์การจัดการคลังสินค้าจะพัฒนาในขั้นตอนถัดไป
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>การจัดการงาน</CardTitle>
              <CardDescription>
                มอบหมายและติดตามงานในคลัง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  ฟีเจอร์การจัดการงานจะพัฒนาในขั้นตอนถัดไป
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>รายงานและสถิติ</CardTitle>
              <CardDescription>
                วิเคราะห์ประสิทธิภาพและแนวโน้ม
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  ฟีเจอร์รายงานและสถิติจะพัฒนาในขั้นตอนถัดไป
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ตั้งค่า Dashboard</DialogTitle>
            <DialogDescription>
              ปรับแต่งการแสดงผลและการแจ้งเตือน
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                ฟีเจอร์การตั้งค่าจะพัฒนาในขั้นตอนถัดไป
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}