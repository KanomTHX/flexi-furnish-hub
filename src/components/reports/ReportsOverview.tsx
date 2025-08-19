import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Users,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { ReportStats } from '@/types/reports';
import { formatCurrency, formatNumber } from '@/utils/reportHelpers';
import { useDashboardData } from '@/hooks/useDashboardData';

interface ReportsOverviewProps {
  stats: ReportStats | null;
  onRefresh: () => void;
  onGenerateReport: (type: string) => void;
}

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  stats,
  onRefresh,
  onGenerateReport
}) => {
  const dashboardData = useDashboardData();
  
  const quickStats = [
    {
      title: 'ยอดขายวันนี้',
      value: formatCurrency(dashboardData.stats?.todaySales?.revenue || 0),
      change: `${dashboardData.stats?.todaySales?.growth >= 0 ? '+' : ''}${dashboardData.stats?.todaySales?.growth?.toFixed(1) || '0'}%`,
      trend: (dashboardData.stats?.todaySales?.growth || 0) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'จำนวนออเดอร์',
      value: formatNumber(dashboardData.stats?.todaySales?.count || 0),
      change: `${dashboardData.stats?.todaySales?.growth >= 0 ? '+' : ''}${dashboardData.stats?.todaySales?.growth?.toFixed(1) || '0'}%`,
      trend: (dashboardData.stats?.todaySales?.growth || 0) >= 0 ? 'up' : 'down',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'สินค้าในสต็อก',
      value: formatNumber(dashboardData.stats?.products?.total || 0),
      change: `${dashboardData.stats?.products?.lowStock || 0} รายการใกล้หมด`,
      trend: (dashboardData.stats?.products?.lowStock || 0) > 0 ? 'down' : 'up',
      icon: Package,
      color: 'text-orange-600'
    },
    {
      title: 'ลูกค้าใหม่วันนี้',
      value: formatNumber(dashboardData.stats?.customers?.newToday || 0),
      change: `${dashboardData.stats?.customers?.growth >= 0 ? '+' : ''}${dashboardData.stats?.customers?.growth?.toFixed(1) || '0'}%`,
      trend: (dashboardData.stats?.customers?.growth || 0) >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  const reportTypes = [
    {
      id: 'sales',
      title: 'รายงานยอดขาย',
      description: 'รายงานยอดขายและประสิทธิภาพการขาย',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      id: 'inventory',
      title: 'รายงานสต็อกสินค้า',
      description: 'รายงานสต็อกและการเคลื่อนไหวสินค้า',
      icon: Package,
      color: 'bg-green-500'
    },
    {
      id: 'financial',
      title: 'รายงานการเงิน',
      description: 'รายงานกำไรขาดทุนและกระแสเงินสด',
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      id: 'custom',
      title: 'รายงานแบบกำหนดเอง',
      description: 'สร้างรายงานตามความต้องการ',
      icon: FileText,
      color: 'bg-purple-500'
    }
  ];

  if (dashboardData.loading && !dashboardData.stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm text-muted-foreground mt-1">{dashboardData.error}</p>
              <Button 
                onClick={() => dashboardData.refresh()} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ภาพรวมรายงาน</h2>
          <p className="text-muted-foreground">
            สรุปข้อมูลสำคัญและรายงานต่างๆ
            {dashboardData.lastUpdated && (
              <span className="block text-xs mt-1">
                อัปเดตล่าสุด: {dashboardData.lastUpdated.toLocaleTimeString('th-TH')}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => {
            dashboardData.refresh();
            onRefresh();
          }} 
          variant="outline" 
          size="sm"
          disabled={dashboardData.loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${dashboardData.loading ? 'animate-spin' : ''}`} />
          {dashboardData.loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendIcon className={`h-4 w-4 mr-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className={`text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dashboard Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>สถิติระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(dashboardData.stats?.customers?.total || 0)}
              </p>
              <p className="text-sm text-muted-foreground">ลูกค้าทั้งหมด</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(dashboardData.stats?.employees?.total || 0)}
              </p>
              <p className="text-sm text-muted-foreground">พนักงานทั้งหมด</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(dashboardData.stats?.products?.lowStock || 0)}
              </p>
              <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(dashboardData.stats?.inventory?.totalValue || 0)}
              </p>
              <p className="text-sm text-muted-foreground">มูลค่าสต็อกรวม</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>สถิติรายงาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalReports}
                </p>
                <p className="text-sm text-muted-foreground">รายงานทั้งหมด</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.reportsThisMonth}
                </p>
                <p className="text-sm text-muted-foreground">รายงานเดือนนี้</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  {stats.mostUsedReportType === 'sales' ? 'ยอดขาย' :
                   stats.mostUsedReportType === 'inventory' ? 'สต็อก' :
                   stats.mostUsedReportType === 'financial' ? 'การเงิน' : 'อื่นๆ'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">รายงานยอดนิยม</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.averageGenerationTime}s
                </p>
                <p className="text-sm text-muted-foreground">เวลาเฉลี่ยในการสร้าง</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>สร้างรายงานด่วน</CardTitle>
          <p className="text-sm text-muted-foreground">
            เลือกประเภทรายงานที่ต้องการสร้าง
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              
              return (
                <div
                  key={type.id}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onGenerateReport(type.id)}
                >
                  <div className={`p-3 rounded-full ${type.color} text-white mr-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{type.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: 'สร้างรายงานยอดขาย',
                time: '10 นาทีที่แล้ว',
                user: 'สมชาย ใจดี',
                status: 'สำเร็จ'
              },
              {
                action: 'ส่งออกรายงานสต็อก',
                time: '25 นาทีที่แล้ว',
                user: 'สมหญิง รักงาน',
                status: 'สำเร็จ'
              },
              {
                action: 'สร้างรายงานการเงิน',
                time: '1 ชั่วโมงที่แล้ว',
                user: 'วิชัย ขยัน',
                status: 'กำลังประมวลผล'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      โดย {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={activity.status === 'สำเร็จ' ? 'default' : 'secondary'}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};