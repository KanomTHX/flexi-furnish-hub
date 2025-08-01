import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClaimStatistics } from '@/types/claims';
import { formatCurrency, claimTypeLabels, claimStatusLabels, claimPriorityLabels } from '@/utils/claimsHelpers';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  FileText,
  Wrench
} from 'lucide-react';

interface ClaimsOverviewProps {
  statistics: ClaimStatistics;
}

export function ClaimsOverview({ statistics }: ClaimsOverviewProps) {
  const completionRate = statistics.totalClaims > 0 
    ? (statistics.completedClaims / statistics.totalClaims) * 100 
    : 0;

  const pendingRate = statistics.totalClaims > 0 
    ? (statistics.pendingClaims / statistics.totalClaims) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เคลมทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalClaims}
            </div>
            <p className="text-xs text-muted-foreground">
              รอดำเนินการ {statistics.pendingClaims} รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้นแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.completedClaims}
            </div>
            <p className="text-xs text-muted-foreground">
              อัตราเสร็จสิ้น {completionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวลาแก้ไขเฉลี่ย</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.averageResolutionTime.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              วัน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความพึงพอใจ</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.customerSatisfactionAverage.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              จาก 5 ดาว
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ความคืบหน้าการเคลม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">เสร็จสิ้นแล้ว</span>
                <span className="text-sm font-bold text-green-600">
                  {statistics.completedClaims} / {statistics.totalClaims}
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">รอดำเนินการ</span>
                <span className="text-sm font-bold text-orange-600">
                  {statistics.pendingClaims} / {statistics.totalClaims}
                </span>
              </div>
              <Progress value={pendingRate} className="h-2" />
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">อัตราความสำเร็จ</span>
                <span className="font-bold text-green-600">
                  {completionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              ค่าใช้จ่ายการเคลม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {formatCurrency(statistics.totalClaimsCost)}
                </div>
                <div className="text-sm text-muted-foreground">
                  ค่าใช้จ่ายรวมทั้งหมด
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(statistics.totalClaimsCost / Math.max(statistics.totalClaims, 1))}
                  </div>
                  <div className="text-xs text-muted-foreground">เฉลี่ยต่อเคลม</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {formatCurrency(statistics.totalClaimsCost / Math.max(statistics.completedClaims, 1))}
                  </div>
                  <div className="text-xs text-muted-foreground">เฉลี่ยที่เสร็จสิ้น</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims by Type and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              ประเภทการเคลม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.claimsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{claimTypeLabels[type as keyof typeof claimTypeLabels]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / statistics.totalClaims) * 100}%` }}
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
              <Shield className="h-4 w-4" />
              สถานะการเคลม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.claimsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm">{claimStatusLabels[status as keyof typeof claimStatusLabels]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <Badge variant="outline" className="text-xs">
                      {((count / statistics.totalClaims) * 100).toFixed(0)}%
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
              <AlertTriangle className="h-4 w-4" />
              ระดับความสำคัญ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.claimsByPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="text-sm">{claimPriorityLabels[priority as keyof typeof claimPriorityLabels]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      priority === 'urgent' ? 'bg-red-500' :
                      priority === 'high' ? 'bg-orange-500' :
                      priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            แนวโน้มรายเดือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statistics.monthlyTrends.length > 0 ? (
            <div className="space-y-4">
              {statistics.monthlyTrends.map((trend, index) => (
                <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{trend.totalClaims}</div>
                    <div className="text-xs text-muted-foreground">เคลมทั้งหมด</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{trend.completedClaims}</div>
                    <div className="text-xs text-muted-foreground">เสร็จสิ้น</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(trend.averageCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">ค่าใช้จ่ายเฉลี่ย</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">
                      {trend.satisfactionRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">ความพึงพอใจ</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีข้อมูลแนวโน้ม</p>
            </div>
          )}
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
              <div className="text-sm font-medium">สร้างเคลมใหม่</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">ตรวจสอบการรับประกัน</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">จัดการลูกค้า</div>
            </div>
            <div className="text-center p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-sm font-medium">รายงานสถิติ</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}