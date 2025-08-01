import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuditStatistics } from '@/types/audit';
import { 
  auditActionLabels, 
  systemModuleLabels, 
  formatDateTime,
  getSeverityColor 
} from '@/utils/auditHelpers';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Users,
  Clock,
  TrendingUp,
  FileText,
  Eye,
  Server,
  BarChart3
} from 'lucide-react';

interface AuditOverviewProps {
  statistics: AuditStatistics;
}

export function AuditOverview({ statistics }: AuditOverviewProps) {
  const successRate = statistics.totalLogs > 0 
    ? ((statistics.totalLogs - statistics.failedActions) / statistics.totalLogs) * 100 
    : 100;

  const criticalRate = statistics.totalLogs > 0 
    ? (statistics.criticalEvents / statistics.totalLogs) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บันทึกทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalLogs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              วันนี้ {statistics.todayLogs} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เหตุการณ์วิกฤต</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.criticalEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalRate.toFixed(1)}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การกระทำล้มเหลว</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.failedActions}
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราสำเร็จ {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้ที่ใช้งาน</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.uniqueUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              ผู้ใช้ที่มีกิจกรรม
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              แนวโน้มกิจกรรม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">วันนี้</span>
                <span className="text-sm font-bold text-blue-600">
                  {statistics.todayLogs} รายการ
                </span>
              </div>
              <Progress value={(statistics.todayLogs / Math.max(statistics.weekLogs, 1)) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">สัปดาห์นี้</span>
                <span className="text-sm font-bold text-green-600">
                  {statistics.weekLogs} รายการ
                </span>
              </div>
              <Progress value={(statistics.weekLogs / Math.max(statistics.monthLogs, 1)) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">เดือนนี้</span>
                <span className="text-sm font-bold text-purple-600">
                  {statistics.monthLogs} รายการ
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ความปลอดภัยระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  successRate >= 95 ? 'text-green-600' :
                  successRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  อัตราความสำเร็จ
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {statistics.totalLogs - statistics.failedActions}
                  </div>
                  <div className="text-xs text-muted-foreground">สำเร็จ</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {statistics.failedActions}
                  </div>
                  <div className="text-xs text-muted-foreground">ล้มเหลว</div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">สถานะระบบ</span>
                  <Badge className={
                    criticalRate === 0 ? 'bg-green-100 text-green-800' :
                    criticalRate < 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }>
                    {criticalRate === 0 ? 'ปกติ' : criticalRate < 1 ? 'เฝ้าระวัง' : 'เสี่ยง'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              การกระทำยอดนิยม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topActions.map((action, index) => (
                <div key={action.action} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{auditActionLabels[action.action]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{action.count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${action.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              โมดูลที่ใช้งานมาก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topModules.map((module, index) => (
                <div key={module.module} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{systemModuleLabels[module.module]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{module.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {module.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              ผู้ใช้ที่ใช้งานมาก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground">@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{user.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(user.lastActivity).split(' ')[1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            กิจกรรมตามชั่วโมง (24 ชั่วโมงที่ผ่านมา)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1 h-32">
            {statistics.hourlyActivity.map((activity) => (
              <div key={activity.hour} className="flex flex-col items-center">
                <div className="flex-1 flex items-end">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ 
                      height: `${Math.max((activity.count / Math.max(...statistics.hourlyActivity.map(a => a.count))) * 100, 5)}%` 
                    }}
                    title={`${activity.hour}:00 - ${activity.count} รายการ`}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {activity.hour.toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            ชั่วโมง (00:00 - 23:00)
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            แนวโน้มรายวัน (7 วันที่ผ่านมา)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statistics.dailyTrends.map((trend) => (
              <div key={trend.date} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-2 text-sm font-medium">
                  {new Date(trend.date).toLocaleDateString('th-TH', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="col-span-6">
                  <div className="flex gap-1 h-4">
                    <div 
                      className="bg-green-500 rounded"
                      style={{ width: `${(trend.successCount / trend.totalLogs) * 100}%` }}
                      title={`สำเร็จ: ${trend.successCount}`}
                    ></div>
                    <div 
                      className="bg-red-500 rounded"
                      style={{ width: `${(trend.failedCount / trend.totalLogs) * 100}%` }}
                      title={`ล้มเหลว: ${trend.failedCount}`}
                    ></div>
                    <div 
                      className="bg-orange-500 rounded"
                      style={{ width: `${(trend.criticalCount / trend.totalLogs) * 100}%` }}
                      title={`วิกฤต: ${trend.criticalCount}`}
                    ></div>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-right">
                  {trend.totalLogs} รายการ
                </div>
                <div className="col-span-2 text-right">
                  <Badge className={getSeverityColor(
                    trend.criticalCount > 0 ? 'critical' :
                    trend.failedCount > 5 ? 'high' :
                    trend.failedCount > 0 ? 'medium' : 'low'
                  )}>
                    {trend.criticalCount > 0 ? 'วิกฤต' :
                     trend.failedCount > 5 ? 'สูง' :
                     trend.failedCount > 0 ? 'ปานกลาง' : 'ปกติ'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>สำเร็จ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>ล้มเหลว</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>วิกฤต</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">ดูบันทึกล่าสุด</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <div className="text-sm font-medium">เหตุการณ์ความปลอดภัย</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">รายงานการปฏิบัติตาม</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">กิจกรรมผู้ใช้</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}