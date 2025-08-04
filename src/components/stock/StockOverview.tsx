import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Boxes,
  Building2,
  Eye
} from 'lucide-react';
import { StockSummary, StockAlert } from '@/types/stock';
import { useBranchData } from '../../hooks/useBranchData';
import { BranchSelector } from '../branch/BranchSelector';

interface StockOverviewProps {
  summary: StockSummary;
  alerts: StockAlert[];
}

export function StockOverview({ summary, alerts }: StockOverviewProps) {
  const { currentBranch, currentBranchStock } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  
  const unreadAlerts = alerts.filter(a => !a.isRead);
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">ภาพรวมสต็อก</h2>
            <p className="text-muted-foreground">
              สรุปข้อมูลสต็อกสินค้าทั้งหมด
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>
          <Badge variant="outline" className="text-green-600 border-green-200">
            ความแม่นยำ {summary.stockAccuracy}%
          </Badge>
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalAlerts.length} วิกฤต
            </Badge>
          )}
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

      {/* Branch Stock Summary */}
      {currentBranch && currentBranchStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>สต็อกสาขา {currentBranch.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentBranchStock.length}
                </div>
                <div className="text-sm text-muted-foreground">สินค้าทั้งหมด</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentBranchStock.filter(s => s.status === 'in_stock').length}
                </div>
                <div className="text-sm text-muted-foreground">มีสต็อก</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {currentBranchStock.filter(s => s.status === 'low_stock').length}
                </div>
                <div className="text-sm text-muted-foreground">สต็อกต่ำ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {currentBranchStock.filter(s => s.status === 'out_of_stock').length}
                </div>
                <div className="text-sm text-muted-foreground">หมดสต็อก</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  จำนวนสินค้า
                </p>
                <p className="text-2xl font-bold">
                  {summary.totalProducts.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  รายการ
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  มูลค่าสต็อก
                </p>
                <p className="text-2xl font-bold">
                  ฿{(summary.totalStockValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-muted-foreground">
                  บาท
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  การเคลื่อนไหววันนี้
                </p>
                <p className="text-2xl font-bold">
                  {summary.todayMovements}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.round((summary.todayMovements / summary.weekMovements) * 100)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  อัตราหมุนเวียน
                </p>
                <p className="text-2xl font-bold">
                  {summary.averageTurnoverRate}x
                </p>
                <p className="text-xs text-muted-foreground">
                  ต่อปี
                </p>
              </div>
              <Boxes className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* สถานะสต็อก */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              สถานะสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">สต็อกปกติ</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{summary.inStockItems}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((summary.inStockItems / summary.totalProducts) * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">สต็อกต่ำ</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-yellow-600">{summary.lowStockItems}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((summary.lowStockItems / summary.totalProducts) * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">หมดสต็อก</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">{summary.outOfStockItems}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((summary.outOfStockItems / summary.totalProducts) * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">สต็อกเกิน</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-600">{summary.overstockItems}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((summary.overstockItems / summary.totalProducts) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>ความแม่นยำสต็อก</span>
                <span className="font-medium">{summary.stockAccuracy}%</span>
              </div>
              <Progress value={summary.stockAccuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              สินค้าขายดี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(summary.topMovingProducts || []).slice(0, 5).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{product.productName}</div>
                      <div className="text-xs text-muted-foreground">{product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{product.movementCount}</div>
                    <div className="text-xs text-muted-foreground">ครั้ง</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* การแจ้งเตือนล่าสุด */}
      {unreadAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              การแจ้งเตือนล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(unreadAlerts || []).slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge 
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.severity === 'critical' ? 'วิกฤต' : 
                       alert.severity === 'high' ? 'สูง' : 'ปานกลาง'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="font-medium text-sm mb-1">{alert.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {alert.warehouse.name} • สต็อก: {alert.currentStock}
                  </div>
                </div>
              ))}
              {unreadAlerts.length > 3 && (
                <div className="text-center text-sm text-muted-foreground">
                  และอีก {unreadAlerts.length - 3} รายการ
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}