import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StockSummary, StockAlert } from '@/types/stock';
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  BarChart3,
  Zap,
  Clock
} from 'lucide-react';

interface StockOverviewProps {
  summary: StockSummary;
  alerts: StockAlert[];
}

export function StockOverview({ summary, alerts }: StockOverviewProps) {
  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockHealthPercentage = () => {
    const totalIssues = summary.lowStockItems + summary.outOfStockItems + summary.overstockItems;
    const healthyItems = summary.totalProducts - totalIssues;
    return summary.totalProducts > 0 ? (healthyItems / summary.totalProducts) * 100 : 100;
  };

  return (
    <div className="space-y-6">
      {/* สรุปข้อมูลหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              รายการสินค้าในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่าสต็อก</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              มูลค่าสต็อกรวม
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเคลื่อนไหววันนี้</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMovementsToday}</div>
            <p className="text-xs text-muted-foreground">
              เดือนนี้ {summary.totalMovementsThisMonth} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แจ้งเตือน</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unreadAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              วิกฤต {criticalAlerts.length} รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* สถานะสต็อกและการวิเคราะห์ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* สถานะสต็อก */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              สถานะสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>สุขภาพสต็อกโดยรวม</span>
                <span>{Math.round(getStockHealthPercentage())}%</span>
              </div>
              <Progress value={getStockHealthPercentage()} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">สต็อกต่ำ</span>
                  <Badge variant="destructive" className="text-xs">
                    {summary.lowStockItems}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">หมดสต็อก</span>
                  <Badge variant="destructive" className="text-xs">
                    {summary.outOfStockItems}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">สต็อกเกิน</span>
                  <Badge variant="secondary" className="text-xs">
                    {summary.overstockItems}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ปกติ</span>
                  <Badge variant="default" className="text-xs">
                    {summary.totalProducts - summary.lowStockItems - summary.outOfStockItems - summary.overstockItems}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* การวิเคราะห์การเคลื่อนไหว */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              การวิเคราะห์การเคลื่อนไหว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {summary.fastMovingItems}
                </div>
                <div className="text-xs text-green-600">สินค้าเคลื่อนไหวเร็ว</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">
                  {summary.slowMovingItems}
                </div>
                <div className="text-xs text-orange-600">สินค้าเคลื่อนไหวช้า</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">อัตราการหมุนเวียนเฉลี่ย</span>
                <span className="font-medium">{summary.averageTurnover.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">การเคลื่อนไหวเดือนนี้</span>
                <span className="font-medium">{summary.totalMovementsThisMonth} รายการ</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* แจ้งเตือนล่าสุด */}
      {unreadAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              แจ้งเตือนล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadAlerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50"
                >
                  <div className="flex-shrink-0">
                    {alert.severity === 'critical' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : alert.type === 'low_stock' ? (
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.severity === 'critical' ? 'วิกฤต' : 
                         alert.severity === 'high' ? 'สูง' : 
                         alert.severity === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
              ))}
              
              {unreadAlerts.length > 5 && (
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    และอีก {unreadAlerts.length - 5} รายการ
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}