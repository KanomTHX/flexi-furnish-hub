import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Shield, 
  Package, 
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

// Types for warehouse alerts
interface WarehouseAlert {
  id: string;
  warehouseId: string;
  warehouseName: string;
  type: 'capacity' | 'temperature' | 'humidity' | 'security' | 'equipment' | 'stock' | 'power';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  unit?: string;
  location?: string;
  createdAt: Date;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  autoResolve?: boolean;
  estimatedResolutionTime?: number; // minutes
}

interface AlertSettings {
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  severityFilter: string[];
  typeFilter: string[];
  showResolved: boolean;
}

interface WarehouseAlertSystemProps {
  warehouseId?: string;
  onAlertAction?: (alertId: string, action: 'read' | 'resolve' | 'escalate') => void;
}

export function WarehouseAlertSystem({ warehouseId, onAlertAction }: WarehouseAlertSystemProps) {
  const [alerts, setAlerts] = useState<WarehouseAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    soundEnabled: true,
    autoRefresh: true,
    refreshInterval: 30,
    severityFilter: ['critical', 'high', 'medium', 'low'],
    typeFilter: ['capacity', 'temperature', 'humidity', 'security', 'equipment', 'stock', 'power'],
    showResolved: false
  });
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockAlerts: WarehouseAlert[] = [
    {
      id: 'alert-001',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'temperature',
      severity: 'critical',
      title: 'อุณหภูมิสูงเกินกำหนด',
      message: 'อุณหภูมิในโซน A เพิ่มขึ้นเป็น 28°C เกินเกณฑ์ที่กำหนด',
      value: 28,
      threshold: 25,
      unit: '°C',
      location: 'โซน A - ชั้น 2',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      isResolved: false,
      estimatedResolutionTime: 30
    },
    {
      id: 'alert-002',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'capacity',
      severity: 'high',
      title: 'ความจุใกล้เต็ม',
      message: 'พื้นที่เก็บสินค้าใช้งานแล้ว 85% ควรจัดการสต็อกหรือขยายพื้นที่',
      value: 85,
      threshold: 80,
      unit: '%',
      location: 'โซน B - ทั้งหมด',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      isRead: true,
      isResolved: false,
      estimatedResolutionTime: 120
    },
    {
      id: 'alert-003',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'humidity',
      severity: 'medium',
      title: 'ความชื้นสูง',
      message: 'ความชื้นในโซน C อยู่ที่ 75% อาจส่งผลต่อคุณภาพสินค้า',
      value: 75,
      threshold: 70,
      unit: '%',
      location: 'โซน C - ชั้น 1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
      isResolved: false,
      estimatedResolutionTime: 60
    },
    {
      id: 'alert-004',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'security',
      severity: 'high',
      title: 'การเข้าออกผิดปกติ',
      message: 'ตรวจพบการเข้าออกนอกเวลาทำการที่ประตูหลัก',
      location: 'ประตูหลัก - ด้านทิศเหนือ',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      isResolved: false,
      estimatedResolutionTime: 15
    },
    {
      id: 'alert-005',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'equipment',
      severity: 'medium',
      title: 'อุปกรณ์ต้องการบำรุงรักษา',
      message: 'รถยกของหมายเลข FT-003 ใกล้ถึงกำหนดบำรุงรักษา',
      location: 'โซน A - จุดจอดรถยก',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: true,
      isResolved: false,
      estimatedResolutionTime: 240
    },
    {
      id: 'alert-006',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      type: 'power',
      severity: 'low',
      title: 'การใช้ไฟฟ้าสูง',
      message: 'การใช้ไฟฟ้าในช่วงเวลานี้สูงกว่าปกติ 15%',
      value: 115,
      threshold: 100,
      unit: '%',
      location: 'ระบบไฟฟ้าหลัก',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: true,
      isResolved: true,
      resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      resolvedBy: 'ช่างไฟฟ้า',
      resolution: 'ปรับการใช้งานอุปกรณ์ในช่วงเวลาเร่งด่วน'
    }
  ];

  useEffect(() => {
    setAlerts(mockAlerts);
  }, []);

  // Auto refresh alerts
  useEffect(() => {
    if (!settings.autoRefresh) return;

    const interval = setInterval(() => {
      // In real implementation, this would fetch from API
      console.log('Auto refreshing alerts...');
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval]);

  // Play sound for new critical alerts
  useEffect(() => {
    if (!settings.soundEnabled) return;

    const newCriticalAlerts = alerts.filter(
      alert => !alert.isRead && alert.severity === 'critical'
    );

    if (newCriticalAlerts.length > 0) {
      // In real implementation, play alert sound
      console.log('Playing alert sound for critical alerts');
    }
  }, [alerts, settings.soundEnabled]);

  const getAlertIcon = (type: WarehouseAlert['type']) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4 text-red-500" />;
      case 'humidity':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'capacity':
        return <Gauge className="w-4 h-4 text-orange-500" />;
      case 'security':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'equipment':
        return <Settings className="w-4 h-4 text-gray-500" />;
      case 'stock':
        return <Package className="w-4 h-4 text-green-500" />;
      case 'power':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: WarehouseAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500 text-white hover:bg-red-600">วิกฤต</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">สูง</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">ปานกลาง</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">ต่ำ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getTypeName = (type: WarehouseAlert['type']) => {
    switch (type) {
      case 'temperature': return 'อุณหภูมิ';
      case 'humidity': return 'ความชื้น';
      case 'capacity': return 'ความจุ';
      case 'security': return 'ความปลอดภัย';
      case 'equipment': return 'อุปกรณ์';
      case 'stock': return 'สต็อก';
      case 'power': return 'ไฟฟ้า';
      default: return 'อื่นๆ';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!settings.showResolved && alert.isResolved) return false;
    if (!settings.severityFilter.includes(alert.severity)) return false;
    if (!settings.typeFilter.includes(alert.type)) return false;
    if (warehouseId && alert.warehouseId !== warehouseId) return false;
    
    if (activeTab !== 'all') {
      if (activeTab === 'unread' && alert.isRead) return false;
      if (activeTab === 'critical' && alert.severity !== 'critical') return false;
      if (activeTab === 'resolved' && !alert.isResolved) return false;
    }
    
    return true;
  });

  const alertStats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.isRead).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    resolved: alerts.filter(a => a.isResolved).length,
    byType: {
      temperature: alerts.filter(a => a.type === 'temperature').length,
      humidity: alerts.filter(a => a.type === 'humidity').length,
      capacity: alerts.filter(a => a.type === 'capacity').length,
      security: alerts.filter(a => a.type === 'security').length,
      equipment: alerts.filter(a => a.type === 'equipment').length,
      stock: alerts.filter(a => a.type === 'stock').length,
      power: alerts.filter(a => a.type === 'power').length
    }
  };

  const handleAlertAction = (alertId: string, action: 'read' | 'resolve' | 'escalate') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        switch (action) {
          case 'read':
            return { ...alert, isRead: true };
          case 'resolve':
            return { 
              ...alert, 
              isResolved: true, 
              resolvedAt: new Date(),
              resolvedBy: 'ผู้ใช้ปัจจุบัน',
              resolution: 'แก้ไขปัญหาแล้ว'
            };
          case 'escalate':
            // In real implementation, escalate to higher authority
            console.log('Escalating alert:', alertId);
            return alert;
          default:
            return alert;
        }
      }
      return alert;
    }));

    onAlertAction?.(alertId, action);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            ระบบแจ้งเตือนคลังสินค้า
          </h2>
          <p className="text-muted-foreground">
            ติดตามและจัดการการแจ้งเตือนทั้งหมดในคลังสินค้า
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, showResolved: !prev.showResolved }))}
          >
            {settings.showResolved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {settings.showResolved ? 'ซ่อนที่แก้ไขแล้ว' : 'แสดงที่แก้ไขแล้ว'}
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
                <div className="text-sm text-muted-foreground">วิกฤต</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{alertStats.unread}</div>
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
                <div className="text-2xl font-bold text-green-600">{alertStats.resolved}</div>
                <div className="text-sm text-muted-foreground">แก้ไขแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{alertStats.total}</div>
                <div className="text-sm text-muted-foreground">ทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(alertStats.byType).map(([type, count]) => (
          <Card key={type} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                {getAlertIcon(type as WarehouseAlert['type'])}
                <div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {getTypeName(type as WarehouseAlert['type'])}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">ทั้งหมด ({alertStats.total})</TabsTrigger>
          <TabsTrigger value="unread">ยังไม่อ่าน ({alertStats.unread})</TabsTrigger>
          <TabsTrigger value="critical">วิกฤต ({alertStats.critical})</TabsTrigger>
          <TabsTrigger value="resolved">แก้ไขแล้ว ({alertStats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>รายการแจ้งเตือน</span>
                <div className="flex items-center gap-2">
                  {filteredAlerts.filter(a => !a.isRead).length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        filteredAlerts.filter(a => !a.isRead).forEach(alert => {
                          handleAlertAction(alert.id, 'read');
                        });
                      }}
                    >
                      อ่านทั้งหมด
                    </Button>
                  )}
                  <Badge variant="outline">
                    {filteredAlerts.length} รายการ
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีการแจ้งเตือน</p>
                    <p className="text-sm">ระบบทำงานปกติ</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border transition-all ${
                        alert.isResolved
                          ? 'bg-gray-50 border-gray-200 opacity-75'
                          : alert.isRead
                          ? 'bg-white border-gray-200'
                          : alert.severity === 'critical'
                          ? 'bg-red-50 border-red-200 shadow-md'
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
                              {alert.warehouseName}
                            </span>
                            {alert.location && (
                              <span className="text-xs text-muted-foreground">
                                • {alert.location}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              • {formatTimeAgo(alert.createdAt)}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>

                          <h4 className={`font-medium mb-1 ${
                            alert.isResolved ? 'text-muted-foreground line-through' : ''
                          }`}>
                            {alert.title}
                          </h4>

                          <p className={`text-sm mb-2 ${
                            alert.isResolved ? 'text-muted-foreground' : ''
                          }`}>
                            {alert.message}
                          </p>

                          {(alert.value !== undefined || alert.threshold !== undefined) && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              {alert.value !== undefined && (
                                <span>ค่าปัจจุบัน: {alert.value}{alert.unit}</span>
                              )}
                              {alert.threshold !== undefined && (
                                <span>เกณฑ์: {alert.threshold}{alert.unit}</span>
                              )}
                              {alert.estimatedResolutionTime && (
                                <span>เวลาแก้ไขโดยประมาณ: {alert.estimatedResolutionTime} นาที</span>
                              )}
                            </div>
                          )}

                          {alert.isResolved && alert.resolution && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <div className="font-medium text-green-800">แก้ไขแล้ว:</div>
                              <div className="text-green-700">{alert.resolution}</div>
                              <div className="text-xs text-green-600 mt-1">
                                โดย {alert.resolvedBy} เมื่อ {alert.resolvedAt && formatTimeAgo(alert.resolvedAt)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {!alert.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAlertAction(alert.id, 'read')}
                            >
                              อ่านแล้ว
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAlertAction(alert.id, 'resolve')}
                              >
                                แก้ไข
                              </Button>
                              {alert.severity === 'critical' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleAlertAction(alert.id, 'escalate')}
                                >
                                  ส่งต่อ
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}