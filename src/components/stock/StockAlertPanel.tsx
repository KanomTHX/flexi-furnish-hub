import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Eye
} from 'lucide-react';
import { StockAlert } from '@/types/stock';
import { useBranchData } from '../../hooks/useBranchData';
import { BranchSelector } from '../branch/BranchSelector';

interface StockAlertPanelProps {
  alerts: StockAlert[];
  onMarkAsRead: (alertId: string) => void;
  onResolve: (alertId: string, resolution: string) => void;
}

export function StockAlertPanel({ alerts, onMarkAsRead, onResolve }: StockAlertPanelProps) {
  const { currentBranch, currentBranchAlerts } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const getAlertIcon = (type: StockAlert['type']) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case 'out_of_stock':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'overstock':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'expiring':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'reorder_point':
        return <Package className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">วิกฤต</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">สูง</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">ปานกลาง</Badge>;
      case 'low':
        return <Badge variant="secondary">ต่ำ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getTypeName = (type: StockAlert['type']) => {
    switch (type) {
      case 'low_stock':
        return 'สต็อกต่ำ';
      case 'out_of_stock':
        return 'หมดสต็อก';
      case 'overstock':
        return 'สต็อกเกิน';
      case 'expiring':
        return 'ใกล้หมดอายุ';
      case 'expired':
        return 'หมดอายุ';
      case 'reorder_point':
        return 'ถึงจุดสั่งซื้อ';
      default:
        return 'อื่นๆ';
    }
  };

  // Use branch-specific alerts if available, otherwise use all alerts
  const displayAlerts = currentBranch && currentBranchAlerts.length > 0 ? currentBranchAlerts : alerts;
  const safeAlerts = displayAlerts?.filter(a => a && typeof a === 'object' && 'id' in a) || [];
  const unreadAlerts = safeAlerts.filter(a => a && !a.isRead);
  const criticalAlerts = safeAlerts.filter(a => a && a.severity === 'critical');
  const resolvedAlerts = safeAlerts.filter(a => a && a.isResolved);

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">แจ้งเตือนสต็อก</h2>
            <p className="text-muted-foreground">
              การแจ้งเตือนและปัญหาเกี่ยวกับสต็อกสินค้า
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <span className="text-xs text-blue-600">({safeAlerts.length} แจ้งเตือน)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>
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

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
                <div className="text-sm text-muted-foreground">วิกฤต</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{unreadAlerts.length}</div>
                <div className="text-sm text-muted-foreground">ยังไม่อ่าน</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
                <div className="text-sm text-muted-foreground">แก้ไขแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{safeAlerts.length}</div>
                <div className="text-sm text-muted-foreground">ทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Original Header Content */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การแจ้งเตือนสต็อก</h2>
          <p className="text-muted-foreground">
            ติดตามและจัดการการแจ้งเตือนเกี่ยวกับสต็อก
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadAlerts.length > 0 && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {unreadAlerts.length} ใหม่
            </Badge>
          )}
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {criticalAlerts.length} วิกฤต
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ทั้งหมด
                </p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ยังไม่อ่าน
                </p>
                <p className="text-2xl font-bold text-blue-600">{unreadAlerts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  วิกฤต
                </p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  แก้ไขแล้ว
                </p>
                <p className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              รายการแจ้งเตือน
            </CardTitle>
            {unreadAlerts.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  unreadAlerts.forEach(alert => {
                    if ('id' in alert) onMarkAsRead(alert.id);
                  });
                }}
              >
                อ่านทั้งหมด
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่มีการแจ้งเตือน</p>
                <p className="text-sm">สต็อกทั้งหมดอยู่ในสภาพปกติ</p>
              </div>
            ) : (
              safeAlerts.map((alert) => {
                if (!('id' in alert)) return null;
                return (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getAlertIcon(alert.type)}
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline" className="text-xs">
                          {getTypeName(alert.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.warehouse.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <h4 className={`font-medium mb-1 ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                        {alert.title}
                      </h4>
                      
                      <p className={`text-sm mb-2 ${alert.isRead ? 'text-muted-foreground' : ''}`}>
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>สต็อกปัจจุบัน: {alert.currentStock}</span>
                        {alert.threshold && (
                          <span>เกณฑ์: {alert.threshold}</span>
                        )}
                      </div>

                      {alert.recommendedAction && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="font-medium text-blue-800">แนะนำ:</div>
                          <div className="text-blue-700">{alert.recommendedAction}</div>
                        </div>
                      )}

                      {alert.isResolved && alert.resolution && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="font-medium text-green-800">แก้ไขแล้ว:</div>
                          <div className="text-green-700">{alert.resolution}</div>
                          <div className="text-xs text-green-600 mt-1">
                            โดย {alert.resolvedBy} เมื่อ {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleString('th-TH')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsRead(alert.id)}
                        >
                          อ่านแล้ว
                        </Button>
                      )}
                      {!alert.isResolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const resolution = alert.recommendedAction || 'แก้ไขปัญหาแล้ว';
                            onResolve(alert.id, resolution);
                          }}
                        >
                          แก้ไข
                        </Button>
                      )}
                    </div>
                  </div>
                 </div>
                 );
               })
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}