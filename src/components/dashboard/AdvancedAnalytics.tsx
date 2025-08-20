import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Star,
  Award
} from "lucide-react";
import { cn } from '@/lib/utils';

interface AnalyticsData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  growth: {
    revenue: number;
    orders: number;
    customers: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  salesTrends: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  performance: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    inventoryTurnover: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon, format = 'number', trend }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `฿${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
            </div>
          </div>
          
          <div className={cn("flex items-center space-x-1", getTrendColor())}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopProductsTable({ products }: { products: AnalyticsData['topProducts'] }) {
  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
            </div>
            <div>
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.sales} ยอดขาย</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold">฿{product.revenue.toLocaleString()}</p>
            <div className={cn(
              "flex items-center space-x-1 text-sm",
              product.growth >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {product.growth >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{product.growth > 0 ? '+' : ''}{product.growth}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerSegmentChart({ segments }: { segments: AnalyticsData['customerSegments'] }) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  
  return (
    <div className="space-y-4">
      {segments.map((segment, index) => (
        <div key={segment.segment} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn("w-3 h-3 rounded-full", colors[index % colors.length])} />
              <span className="font-medium">{segment.segment}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{segment.count.toLocaleString()}</span>
              <span className="text-sm text-gray-600 ml-2">({segment.percentage}%)</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Progress value={segment.percentage} className="h-2" />
            <p className="text-xs text-gray-600">รายได้: ฿{segment.revenue.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceMetrics({ performance }: { performance: AnalyticsData['performance'] }) {
  const metrics = [
    {
      label: 'อัตราการแปลง',
      value: performance.conversionRate,
      target: 15,
      format: 'percentage',
      icon: <Target className="h-4 w-4" />
    },
    {
      label: 'มูลค่าเฉลี่ยต่อออเดอร์',
      value: performance.averageOrderValue,
      target: 5000,
      format: 'currency',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'การกลับมาของลูกค้า',
      value: performance.customerRetention,
      target: 80,
      format: 'percentage',
      icon: <Users className="h-4 w-4" />
    },
    {
      label: 'การหมุนเวียนสินค้า',
      value: performance.inventoryTurnover,
      target: 12,
      format: 'number',
      icon: <Package className="h-4 w-4" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((metric) => {
        const percentage = (metric.value / metric.target) * 100;
        const isGood = percentage >= 80;
        
        return (
          <Card key={metric.label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gray-100 rounded">
                  {metric.icon}
                </div>
                <span className="font-medium text-sm">{metric.label}</span>
              </div>
              
              <Badge variant={isGood ? 'default' : 'secondary'}>
                {isGood ? 'ดี' : 'ต้องปรับปรุง'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metric.format === 'currency' && '฿'}
                  {metric.value.toLocaleString()}
                  {metric.format === 'percentage' && '%'}
                </span>
                <span className="text-sm text-gray-600">
                  เป้าหมาย: {metric.format === 'currency' && '฿'}{metric.target.toLocaleString()}{metric.format === 'percentage' && '%'}
                </span>
              </div>
              
              <Progress value={Math.min(percentage, 100)} className="h-2" />
              
              <p className="text-xs text-gray-600">
                {percentage.toFixed(1)}% ของเป้าหมาย
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // TODO: Fetch real analytics data from Supabase
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      // TODO: Replace with real API call to fetch analytics data
      const emptyData: AnalyticsData = {
        period: period,
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
        growth: {
          revenue: 0,
          orders: 0,
          customers: 0
        },
        topProducts: [],
        customerSegments: [],
        salesTrends: [],
        performance: {
          conversionRate: 0,
          averageOrderValue: 0,
          customerRetention: 0,
          inventoryTurnover: 0
        }
      };
      
      setAnalyticsData(emptyData);
    };
    
    fetchAnalyticsData();
  }, [period]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log('Exporting analytics data...');
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>กำลังโหลดข้อมูลการวิเคราะห์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การวิเคราะห์ขั้นสูง</h2>
          <p className="text-gray-600">ข้อมูลเชิงลึกและแนวโน้มทางธุรกิจ</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">วันนี้</SelectItem>
              <SelectItem value="7d">7 วันที่แล้ว</SelectItem>
              <SelectItem value="30d">30 วันที่แล้ว</SelectItem>
              <SelectItem value="90d">90 วันที่แล้ว</SelectItem>
              <SelectItem value="1y">1 ปีที่แล้ว</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="รายได้รวม"
          value={analyticsData.revenue}
          change={analyticsData.growth.revenue}
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          format="currency"
          trend={analyticsData.growth.revenue >= 0 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="จำนวนออเดอร์"
          value={analyticsData.orders}
          change={analyticsData.growth.orders}
          icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
          trend={analyticsData.growth.orders >= 0 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="ลูกค้าใหม่"
          value={analyticsData.customers}
          change={analyticsData.growth.customers}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          trend={analyticsData.growth.customers >= 0 ? 'up' : 'down'}
        />
        
        <MetricCard
          title="สินค้าที่ขาย"
          value={analyticsData.products}
          change={5.2}
          icon={<Package className="h-5 w-5 text-orange-600" />}
          trend="up"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="products">สินค้า</TabsTrigger>
          <TabsTrigger value="customers">ลูกค้า</TabsTrigger>
          <TabsTrigger value="performance">ประสิทธิภาพ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>แนวโน้มยอดขาย</span>
                </CardTitle>
                <CardDescription>ยอดขายรายวันใน 7 วันที่ผ่านมา</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>กราฟแนวโน้มยอดขาย</p>
                    <p className="text-sm">(ต้องการ Chart Library)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>กลุ่มลูกค้า</span>
                </CardTitle>
                <CardDescription>การแบ่งกลุ่มลูกค้าตามประเภท</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerSegmentChart segments={analyticsData.customerSegments} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>สินค้าขายดี</span>
              </CardTitle>
              <CardDescription>สินค้าที่มียอดขายสูงสุดในช่วงเวลาที่เลือก</CardDescription>
            </CardHeader>
            <CardContent>
              <TopProductsTable products={analyticsData.topProducts} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>การแบ่งกลุ่มลูกค้า</CardTitle>
                <CardDescription>การกระจายตัวของลูกค้าตามประเภท</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerSegmentChart segments={analyticsData.customerSegments} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>พฤติกรรมลูกค้า</CardTitle>
                <CardDescription>ข้อมูลเชิงลึกเกี่ยวกับพฤติกรรมการซื้อ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>ความถี่ในการซื้อเฉลี่ย</span>
                    <span className="font-semibold">2.3 ครั้ง/เดือน</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>เวลาเฉลี่ยในการตัดสินใจ</span>
                    <span className="font-semibold">3.5 วัน</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>ช่องทางที่นิยม</span>
                    <span className="font-semibold">หน้าร้าน (68%)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>ความพึงพอใจเฉลี่ย</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">4.6/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ตัวชี้วัดประสิทธิภาพ</CardTitle>
                <CardDescription>ตัวชี้วัดหลักของธุรกิจเปรียบเทียบกับเป้าหมาย</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics performance={analyticsData.performance} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="flex items-center justify-center text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-2" />
        อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}
      </div>
    </div>
  );
}

export default AdvancedAnalytics;