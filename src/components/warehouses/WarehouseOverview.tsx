import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WarehouseSummary, WarehouseAlert } from '@/types/warehouse';
import { 
  Warehouse, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Package,
  Activity,
  MapPin,
  Clock,
  Award,
  TrendingDown
} from 'lucide-react';

interface WarehouseOverviewProps {
  summary: WarehouseSummary;
  alerts: WarehouseAlert[];
}

export function WarehouseOverview({ summary, alerts }: WarehouseOverviewProps) {
  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 75) return 'text-orange-600';
    if (rate >= 50) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* สรุปข้อมูลหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คลังสินค้าทั้งหมด</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalWarehouses}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {summary.activeWarehouses} คลัง
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความจุรวม</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalCapacity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ใช้แล้ว {summary.totalUtilization.toLocaleString()} ชิ้น
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงานทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              ทำงานในคลังสินค้า
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

      {/* การใช้งานและประสิทธิภาพ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* การใช้งานโดยรวม */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              การใช้งานโดยรวม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>อัตราการใช้งานเฉลี่ย</span>
                <span className={getUtilizationColor(summary.averageUtilizationRate)}>
                  {summary.averageUtilizationRate}%
                </span>
              </div>
              <Progress value={summary.averageUtilizationRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-700">
                  {summary.activeTransfers}
                </div>
                <div className="text-xs text-blue-600">การโอนย้ายที่ดำเนินการ</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-lg font-bold text-orange-700">
                  {summary.pendingTasks}
                </div>
                <div className="text-xs text-orange-600">งานที่รอดำเนินการ</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">มูลค่าสินค้าในคลัง</span>
                <span className="font-medium">{formatCurrency(summary.totalValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ประสิทธิภาพคลัง */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              ประสิทธิภาพคลัง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* คลังที่มีประสิทธิภาพสูงสุด */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">ประสิทธิภาพสูงสุด</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{summary.topPerformingWarehouse.name}</div>
                <div className="flex justify-between text-xs text-green-600 mt-1">
                  <span>การใช้งาน: {summary.topPerformingWarehouse.utilizationRate}%</span>
                  <span>คะแนน: {summary.topPerformingWarehouse.productivityScore}</span>
                </div>
              </div>
            </div>

            {/* คลังที่มีประสิทธิภาพต่ำสุด */}
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">ต้องปรับปรุง</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">{summary.lowPerformingWarehouse.name}</div>
                <div className="flex justify-between text-xs text-red-600 mt-1">
                  <span>การใช้งาน: {summary.lowPerformingWarehouse.utilizationRate}%</span>
                  <span>คะแนน: {summary.lowPerformingWarehouse.productivityScore}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              ประเมินจากการใช้งานพื้นที่และประสิทธิภาพการทำงาน
            </div>
          </CardContent>
        </Card>
      </div>

      {/* กิจกรรมล่าสุด */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* แจ้งเตือนล่าสุด */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              แจ้งเตือนล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadAlerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                </div>
              ) : (
                unreadAlerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'critical' 
                        ? 'bg-red-50 border-red-200' 
                        : alert.severity === 'error'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {alert.severity === 'critical' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {alert.severity === 'critical' ? 'วิกฤต' : 
                             alert.severity === 'error' ? 'ข้อผิดพลาด' : 
                             alert.severity === 'warning' ? 'คำเตือน' : 'ข้อมูล'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.warehouse.name}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
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

        {/* สถิติเพิ่มเติม */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              ข้อมูลเพิ่มเติม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-lg font-bold text-purple-700">
                    {Math.round((summary.totalUtilization / summary.totalCapacity) * 100)}%
                  </div>
                  <div className="text-xs text-purple-600">อัตราการใช้งานรวม</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="text-lg font-bold text-indigo-700">
                    {(summary.totalCapacity - summary.totalUtilization).toLocaleString()}
                  </div>
                  <div className="text-xs text-indigo-600">ความจุที่เหลือ</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">คลังที่ใช้งาน</span>
                  <span className="font-medium">
                    {summary.activeWarehouses} / {summary.totalWarehouses}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">พนักงานเฉลี่ยต่อคลัง</span>
                  <span className="font-medium">
                    {Math.round(summary.totalStaff / summary.activeWarehouses)} คน
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">การโอนย้ายที่ดำเนินการ</span>
                  <span className="font-medium">{summary.activeTransfers} รายการ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">งานที่รอดำเนินการ</span>
                  <span className="font-medium">{summary.pendingTasks} งาน</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}