import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Package,
  Truck,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Printer,
  Share2,
  Settings,
  Target,
  Zap,
  Gauge,
  Building,
  MapPin,
  Box,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Search,
  MoreHorizontal,
  Star,
  Award,
  ThumbsUp,
  ThumbsDown,
  Info,
  HelpCircle,
  ExternalLink,
  LineChart,
  AreaChart,
  Layers,
  Grid,
  List,
  Calendar as CalendarDays,
  Clock3,
  Timer,
  Stopwatch,
  PlayCircle,
  PauseCircle,
  Square,
  RotateCcw,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { th } from 'date-fns/locale';

// Type Definitions
interface AnalyticsMetrics {
  // Inventory Metrics
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
  stockTurnoverRate: number;
  
  // Movement Metrics
  totalInbound: number;
  totalOutbound: number;
  totalTransfers: number;
  averageProcessingTime: number;
  
  // Performance Metrics
  warehouseUtilization: number;
  orderFulfillmentRate: number;
  accuracyRate: number;
  onTimeDeliveryRate: number;
  
  // Financial Metrics
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  costPerUnit: number;
  
  // Quality Metrics
  defectRate: number;
  returnRate: number;
  customerSatisfaction: number;
  warrantyClaimRate: number;
  
  // Efficiency Metrics
  pickingEfficiency: number;
  packingEfficiency: number;
  shippingEfficiency: number;
  overallEfficiency: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface PerformanceData {
  metric: string;
  current: number;
  target: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'inventory' | 'movement' | 'performance' | 'financial' | 'quality' | 'efficiency';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  isActive: boolean;
  lastGenerated?: Date;
  nextScheduled?: Date;
}

interface WarehouseZoneMetrics {
  zoneId: string;
  zoneName: string;
  utilization: number;
  capacity: number;
  currentStock: number;
  efficiency: number;
  temperature?: number;
  humidity?: number;
  status: 'optimal' | 'warning' | 'critical';
}

type DateRange = {
  from: Date;
  to: Date;
};

type MetricPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// Default empty metrics
const defaultMetrics: AnalyticsMetrics = {
  totalProducts: 0,
  totalValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  averageStockLevel: 0,
  stockTurnoverRate: 0,
  totalInbound: 0,
  totalOutbound: 0,
  totalTransfers: 0,
  averageProcessingTime: 0,
  warehouseUtilization: 0,
  orderFulfillmentRate: 0,
  accuracyRate: 0,
  onTimeDeliveryRate: 0,
  totalRevenue: 0,
  totalCosts: 0,
  profitMargin: 0,
  costPerUnit: 0,
  defectRate: 0,
  returnRate: 0,
  customerSatisfaction: 0,
  warrantyClaimRate: 0,
  pickingEfficiency: 0,
  packingEfficiency: 0,
  shippingEfficiency: 0,
  overallEfficiency: 0
};

const defaultTimeSeriesData: TimeSeriesData[] = [];

const defaultCategoryData: CategoryData[] = [];

const defaultPerformanceData: PerformanceData[] = [];

const defaultZoneMetrics: WarehouseZoneMetrics[] = [];

const defaultReports: ReportConfig[] = [];

interface WarehouseAnalyticsProps {
  warehouseId?: string;
}

export function WarehouseAnalytics({ warehouseId }: WarehouseAnalyticsProps) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(defaultMetrics);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>(defaultTimeSeriesData);
  const [categoryData, setCategoryData] = useState<CategoryData[]>(defaultCategoryData);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>(defaultPerformanceData);
  const [zoneMetrics, setZoneMetrics] = useState<WarehouseZoneMetrics[]>(defaultZoneMetrics);
  const [reports, setReports] = useState<ReportConfig[]>(defaultReports);
  const [selectedPeriod, setSelectedPeriod] = useState<MetricPeriod>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Helper Functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd MMM yyyy', { locale: th });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical'): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  const getZoneStatusColor = (status: 'optimal' | 'warning' | 'critical'): string => {
    switch (status) {
      case 'optimal': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
    }
  };

  const handlePeriodChange = (period: MetricPeriod) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case 'today':
        setDateRange({ from: now, to: now });
        break;
      case 'week':
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'quarter':
        setDateRange({ from: subMonths(now, 3), to: now });
        break;
      case 'year':
        setDateRange({ from: subMonths(now, 12), to: now });
        break;
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Simulate export functionality
    console.log(`Exporting report in ${format} format`);
  };

  const handleGenerateReport = (reportId: string) => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          lastGenerated: new Date()
        };
      }
      return report;
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Analytics & Reports</h1>
          <p className="text-muted-foreground">รายงานและการวิเคราะห์ประสิทธิภาพคลังสินค้า</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: MetricPeriod) => handlePeriodChange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
              <SelectItem value="custom">กำหนดเอง</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="inventory">สินค้าคงคลัง</TabsTrigger>
          <TabsTrigger value="performance">ประสิทธิภาพ</TabsTrigger>
          <TabsTrigger value="financial">การเงิน</TabsTrigger>
          <TabsTrigger value="zones">โซนคลังสินค้า</TabsTrigger>
          <TabsTrigger value="reports">รายงาน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">มูลค่าสินค้าคงคลัง</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.5% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">จำนวนสินค้า</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</p>
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {metrics.lowStockItems} รายการใกล้หมด
                    </p>
                  </div>
                  <Box className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">อัตราการหมุนเวียน</p>
                    <p className="text-2xl font-bold">{metrics.stockTurnoverRate.toFixed(1)}x</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +0.3 จากเดือนที่แล้ว
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ประสิทธิภาพรวม</p>
                    <p className="text-2xl font-bold">{formatPercentage(metrics.overallEfficiency)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +2.1% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <Gauge className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  ประสิทธิภาพตามเป้าหมาย
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.slice(0, 4).map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend)}
                          <span className={`text-sm px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                            {formatPercentage(item.current)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(item.current / item.target) * 100} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs text-muted-foreground">
                          เป้า: {formatPercentage(item.target)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  การเคลื่อนไหวสินค้า (7 วันล่าสุด)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2" />
                    <p>กราฟแสดงการเคลื่อนไหวสินค้า</p>
                    <p className="text-sm">เข้า: {formatNumber(metrics.totalInbound)} | ออก: {formatNumber(metrics.totalOutbound)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  เวลาประมวลผลเฉลี่ย
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{metrics.averageProcessingTime}</p>
                  <p className="text-sm text-muted-foreground">ชั่วโมง</p>
                  <p className="text-xs text-green-600 mt-2">ลดลง 15 นาที</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  อัตราความแม่นยำ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{formatPercentage(metrics.accuracyRate)}</p>
                  <p className="text-sm text-muted-foreground">ความแม่นยำ</p>
                  <p className="text-xs text-green-600 mt-2">เพิ่มขึ้น 0.3%</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  ความพึงพอใจลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{metrics.customerSatisfaction.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">จาก 5.0</p>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${
                          star <= Math.floor(metrics.customerSatisfaction) 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">สินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">สินค้าใกล้หมด</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics.lowStockItems}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">สินค้าหมด</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.outOfStockItems}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ระดับสต็อกเฉลี่ย</p>
                    <p className="text-2xl font-bold">{formatPercentage(metrics.averageStockLevel)}</p>
                  </div>
                  <Gauge className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  การแจกแจงตามหมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatNumber(category.value)}</p>
                        <p className="text-sm text-muted-foreground">{formatPercentage(category.percentage)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  แนวโน้มสินค้าคงคลัง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <AreaChart className="w-12 h-12 mx-auto mb-2" />
                    <p>กราฟแสดงแนวโน้มสินค้าคงคลัง</p>
                    <p className="text-sm">อัตราการหมุนเวียน: {metrics.stockTurnoverRate.toFixed(1)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceData.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{item.metric}</h3>
                      {getTrendIcon(item.trend)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{formatPercentage(item.current)}</span>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'good' ? 'ดี' : item.status === 'warning' ? 'ระวัง' : 'วิกฤต'}
                        </Badge>
                      </div>
                      
                      <Progress 
                        value={(item.current / item.target) * 100} 
                        className="h-2" 
                      />
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>เป้าหมาย: {formatPercentage(item.target)}</span>
                        <span>ก่อนหน้า: {formatPercentage(item.previous)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Efficiency Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ประสิทธิภาพการทำงาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">การหยิบสินค้า</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.pickingEfficiency)}</p>
                  <Progress value={metrics.pickingEfficiency} className="mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">การแพ็ค</p>
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(metrics.packingEfficiency)}</p>
                  <Progress value={metrics.packingEfficiency} className="mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">การจัดส่ง</p>
                  <p className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.shippingEfficiency)}</p>
                  <Progress value={metrics.shippingEfficiency} className="mt-2" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">รวมทั้งหมด</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.overallEfficiency)}</p>
                  <Progress value={metrics.overallEfficiency} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">รายได้รวม</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8.2% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ต้นทุนรวม</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalCosts)}</p>
                    <p className="text-xs text-red-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +3.1% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">อัตรากำไร</p>
                    <p className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.profitMargin)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +1.8% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ต้นทุนต่อหน่วย</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.costPerUnit)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      -2.5% จากเดือนที่แล้ว
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  รายได้และต้นทุนรายเดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>กราฟแสดงรายได้และต้นทุนรายเดือน</p>
                    <p className="text-sm">กำไรสุทธิ: {formatCurrency(metrics.totalRevenue - metrics.totalCosts)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  แนวโน้มอัตรากำไร
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2" />
                    <p>กราฟแสดงแนวโน้มอัตรากำไร</p>
                    <p className="text-sm">เป้าหมาย: 30% | ปัจจุบัน: {formatPercentage(metrics.profitMargin)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {zoneMetrics.map((zone) => (
              <Card key={zone.zoneId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      {zone.zoneName}
                    </CardTitle>
                    <Badge className={getZoneStatusColor(zone.status)}>
                      {zone.status === 'optimal' ? 'ปกติ' : zone.status === 'warning' ? 'ระวัง' : 'วิกฤต'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">การใช้งาน</p>
                      <p className="text-xl font-bold">{formatPercentage(zone.utilization)}</p>
                      <Progress value={zone.utilization} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ประสิทธิภาพ</p>
                      <p className="text-xl font-bold">{formatPercentage(zone.efficiency)}</p>
                      <Progress value={zone.efficiency} className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ความจุ</p>
                      <p className="font-medium">{formatNumber(zone.currentStock)} / {formatNumber(zone.capacity)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">สภาพแวดล้อม</p>
                      <p className="font-medium">{zone.temperature}°C, {zone.humidity}% RH</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">รายงานอัตโนมัติ</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              สร้างรายงานใหม่
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold">{report.name}</h3>
                        <Badge variant={report.isActive ? 'default' : 'secondary'}>
                          {report.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">ประเภท</p>
                          <p className="capitalize">{report.type}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">ความถี่</p>
                          <p className="capitalize">{report.frequency}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">สร้างล่าสุด</p>
                          <p>{report.lastGenerated ? formatDate(report.lastGenerated) : '-'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">กำหนดการถัดไป</p>
                          <p>{report.nextScheduled ? formatDate(report.nextScheduled) : '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Quick Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                ส่งออกรายงานด่วน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => handleExportReport('pdf')}
                >
                  <FileText className="w-8 h-8 mb-2" />
                  ส่งออก PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => handleExportReport('excel')}
                >
                  <Grid className="w-8 h-8 mb-2" />
                  ส่งออก Excel
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => handleExportReport('csv')}
                >
                  <List className="w-8 h-8 mb-2" />
                  ส่งออก CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}