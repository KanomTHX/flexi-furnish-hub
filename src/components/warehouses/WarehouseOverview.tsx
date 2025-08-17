import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WarehouseSummary, WarehouseAlert, Warehouse as WarehouseType } from '@/types/warehouse';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useSerialNumberStats } from '@/hooks/useSerialNumber';
import { useToast } from '@/hooks/use-toast';
import { 
  Warehouse, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Package,
  Activity,
  MapPin,
  Clock,
  Award,
  Eye,
  Info,
  ArrowLeftRight,
  ClipboardList,
  FileBarChart,
  Database,
  RefreshCw,
  BarChart,
  Filter,
  Download,
  ArrowUpDown,
  DollarSign,
  Thermometer,
  Droplets,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  Truck,
  ShoppingCart
} from 'lucide-react';

interface WarehouseOverviewProps {
  warehouseId?: string;
  summary?: WarehouseSummary;
  alerts?: WarehouseAlert[];
  onRefresh?: () => void;
}

interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  temperature: number;
  humidity: number;
  power: number;
  connectivity: 'online' | 'offline' | 'unstable';
  lastUpdate: Date;
}

export function WarehouseOverview({ 
  warehouseId, 
  summary, 
  alerts = [], 
  onRefresh 
}: WarehouseOverviewProps) {
  const { toast } = useToast();
  const { warehouses, loading: warehouseLoading } = useWarehouse();
  const { stats: snStats, loading: snLoading } = useSerialNumberStats({ warehouseId });
  
  // State
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    temperature: 22,
    humidity: 45,
    power: 98,
    connectivity: 'online',
    lastUpdate: new Date(),
  });
  
  const [refreshing, setRefreshing] = useState(false);

  // Set selected warehouse
  useEffect(() => {
    if (warehouseId && warehouses.length > 0) {
      const warehouse = warehouses.find(w => w.id === warehouseId);
      setSelectedWarehouse(warehouse || null);
    } else if (warehouses.length > 0) {
      setSelectedWarehouse(warehouses[0]);
    }
  }, [warehouseId, warehouses]);

  // Generate KPI metrics
  const kpiMetrics: KPIMetric[] = [
    {
      id: 'total-products',
      title: 'สินค้าทั้งหมด',
      value: snStats?.total || summary?.totalProducts || 0,
      change: 5.2,
      changeType: 'increase',
      icon: Package,
      color: 'text-blue-600',
      description: 'จำนวนสินค้าทั้งหมดในคลัง',
    },
    {
      id: 'total-value',
      title: 'มูลค่ารวม',
      value: `${((summary?.totalStockValue || 0) / 1000000).toFixed(1)}M`,
      change: 12.8,
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600',
      description: 'มูลค่าสินค้าทั้งหมด',
    },
    {
      id: 'available-stock',
      title: 'สินค้าพร้อมขาย',
      value: snStats?.available || 0,
      change: -2.1,
      changeType: 'decrease',
      icon: CheckCircle,
      color: 'text-emerald-600',
      description: 'สินค้าที่พร้อมขาย',
    },
    {
      id: 'sold-items',
      title: 'สินค้าที่ขายแล้ว',
      value: snStats?.sold || 0,
      change: 8.5,
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'text-purple-600',
      description: 'สินค้าที่ขายไปแล้ว',
    },
    {
      id: 'damaged-items',
      title: 'สินค้าเสียหาย',
      value: snStats?.damaged || 0,
      change: 0,
      changeType: 'neutral',
      icon: XCircle,
      color: 'text-red-600',
      description: 'สินค้าที่เสียหาย',
    },
    {
      id: 'occupancy-rate',
      title: 'อัตราการใช้พื้นที่',
      value: `${summary?.averageUtilizationRate || 75}%`,
      change: 3.2,
      changeType: 'increase',
      icon: Target,
      color: 'text-indigo-600',
      description: 'อัตราการใช้พื้นที่คลัง',
    },
    {
      id: 'movements-today',
      title: 'เคลื่อนไหววันนี้',
      value: summary?.totalMovements || 0,
      change: 15.3,
      changeType: 'increase',
      icon: Activity,
      color: 'text-orange-600',
      description: 'การเคลื่อนไหวสินค้าวันนี้',
    },
    {
      id: 'pending-orders',
      title: 'คำสั่งซื้อรอ',
      value: summary?.pendingOrders || 0,
      change: -5.7,
      changeType: 'decrease',
      icon: Clock,
      color: 'text-yellow-600',
      description: 'คำสั่งซื้อที่รอดำเนินการ',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
      }));
      
      if (onRefresh) {
        onRefresh();
      }
      
      toast({
        title: 'รีเฟรชข้อมูลสำเร็จ',
        description: 'ข้อมูลได้รับการอัปเดตแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถรีเฟรชข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getChangeIcon = (changeType: KPIMetric['changeType']) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Activity className="w-3 h-3 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: KPIMetric['changeType']) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSystemStatusColor = (status: SystemStatus['overall']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConnectivityIcon = (connectivity: SystemStatus['connectivity']) => {
    switch (connectivity) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'unstable':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (warehouseLoading || snLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ภาพรวมคลังสินค้า</h2>
          <p className="text-muted-foreground">
            {selectedWarehouse ? `คลัง: ${selectedWarehouse.name}` : 'ข้อมูลรวมทุกคลัง'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {kpiMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <TooltipProvider key={metric.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-5 h-5 ${metric.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 truncate">
                            {metric.title}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                          </p>
                          {metric.change !== 0 && (
                            <p className={`text-xs flex items-center ${getChangeColor(metric.changeType)}`}>
                              {getChangeIcon(metric.changeType)}
                              <span className="ml-1">
                                {metric.changeType === 'increase' ? '+' : ''}{metric.change}%
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* System Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>สถานะระบบ</span>
            </CardTitle>
            <CardDescription>
              สถานะการทำงานของระบบคลังสินค้า
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Status */}
            <div className={`p-3 rounded-lg border ${getSystemStatusColor(systemStatus.overall)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">สถานะรวม</span>
                </div>
                <Badge className={systemStatus.overall === 'healthy' ? 'bg-green-500' : systemStatus.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}>
                  {systemStatus.overall === 'healthy' ? 'ปกติ' : systemStatus.overall === 'warning' ? 'เตือน' : 'วิกฤต'}
                </Badge>
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">อุณหภูมิ</span>
                </div>
                <span className="text-sm font-bold">{systemStatus.temperature}°C</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">ความชื้น</span>
                </div>
                <span className="text-sm font-bold">{systemStatus.humidity}%</span>
              </div>
            </div>

            {/* Power and Connectivity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">ไฟฟ้า</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={systemStatus.power} className="w-20" />
                  <span className="text-sm font-bold">{systemStatus.power}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">การเชื่อมต่อ</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getConnectivityIcon(systemStatus.connectivity)}
                  <span className="text-sm font-bold capitalize">
                    {systemStatus.connectivity === 'online' ? 'ออนไลน์' : 
                     systemStatus.connectivity === 'offline' ? 'ออฟไลน์' : 'ไม่เสถียร'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="text-xs text-muted-foreground">
              อัปเดตล่าสุด: {systemStatus.lastUpdate.toLocaleString('th-TH')}
            </div>
          </CardContent>
        </Card>

        {/* Alerts and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>การแจ้งเตือน</span>
              {alerts.length > 0 && (
                <Badge className="bg-red-500 text-white">{alerts.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              ปัญหาและข้อควรระวังในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <Alert key={index} className={alert.severity === 'high' ? 'border-red-200 bg-red-50' : 
                                                   alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
                                                   'border-blue-200 bg-blue-50'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                          </div>
                          <Badge className={alert.severity === 'high' ? 'bg-red-500' : 
                                           alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}>
                            {alert.severity === 'high' ? 'สูง' : 
                             alert.severity === 'medium' ? 'กลาง' : 'ต่ำ'}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        มีสินค้า {snStats?.damaged || 0} รายการที่เสียหาย
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        มีคำสั่งซื้อ {summary?.pendingOrders || 0} รายการที่รอดำเนินการ
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        ระบบทำงานปกติ - ไม่มีปัญหาด้านเทคนิค
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="w-5 h-5" />
            <span>สรุปสถิติด่วน</span>
          </CardTitle>
          <CardDescription>
            ข้อมูลสำคัญในการตัดสินใจ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{snStats?.total || 0}</p>
              <p className="text-sm text-blue-600">สินค้าทั้งหมด</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{snStats?.available || 0}</p>
              <p className="text-sm text-green-600">พร้อมขาย</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{snStats?.sold || 0}</p>
              <p className="text-sm text-purple-600">ขายแล้ว</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{summary?.averageUtilizationRate || 75}%</p>
              <p className="text-sm text-orange-600">อัตราการใช้</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}