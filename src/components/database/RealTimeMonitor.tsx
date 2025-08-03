import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Database, Users, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Wifi, Cpu, HardDrive, Zap } from 'lucide-react';

export const RealTimeMonitor = () => {
  const [metrics, setMetrics] = useState({
    activeConnections: 12,
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 23,
    queryCount: 1250,
    slowQueries: 3,
    errors: 0,
    responseTime: 120
  });

  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setMetrics(prev => ({
        activeConnections: prev.activeConnections + Math.floor(Math.random() * 3) - 1,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + Math.floor(Math.random() * 10) - 5)),
        memoryUsage: Math.max(20, Math.min(95, prev.memoryUsage + Math.floor(Math.random() * 6) - 3)),
        diskUsage: Math.max(15, Math.min(80, prev.diskUsage + Math.floor(Math.random() * 4) - 2)),
        queryCount: prev.queryCount + Math.floor(Math.random() * 50),
        slowQueries: Math.max(0, Math.min(10, prev.slowQueries + Math.floor(Math.random() * 3) - 1)),
        errors: Math.max(0, Math.min(5, prev.errors + Math.floor(Math.random() * 2) - 1)),
        responseTime: Math.max(50, Math.min(500, prev.responseTime + Math.floor(Math.random() * 50) - 25))
      }));
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive';
    if (value >= thresholds.warning) return 'secondary';
    return 'default';
  };

  const getConnectionStatus = () => {
    return isConnected ? (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">เชื่อมต่อ</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">ไม่เชื่อมต่อ</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การติดตามแบบเรียลไทม์</h2>
          <p className="text-muted-foreground">
            ติดตามประสิทธิภาพและสถานะของฐานข้อมูลแบบเรียลไทม์
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getConnectionStatus()}
          <div className="text-sm text-muted-foreground">
            อัปเดตล่าสุด: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Connection Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเชื่อมต่อที่ใช้งาน</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              การเชื่อมต่อที่ใช้งานอยู่
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวลาตอบสนอง</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              เวลาตอบสนองเฉลี่ย
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนคำสั่ง</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.queryCount}</div>
            <p className="text-xs text-muted-foreground">
              คำสั่งที่ประมวลผลวันนี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ข้อผิดพลาด</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errors}</div>
            <p className="text-xs text-muted-foreground">
              ข้อผิดพลาดในวันนี้
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              การใช้งาน CPU
            </CardTitle>
            <CardDescription>
              การใช้งาน CPU ของเซิร์ฟเวอร์ฐานข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">การใช้งาน</span>
              <Badge variant={getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}>
                {metrics.cpuUsage}%
              </Badge>
            </div>
            <Progress value={metrics.cpuUsage} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.cpuUsage > 70 ? (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span>
                {metrics.cpuUsage > 70 ? 'สูงกว่าปกติ' : 'อยู่ในเกณฑ์ปกติ'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              การใช้งานหน่วยความจำ
            </CardTitle>
            <CardDescription>
              การใช้งาน RAM ของเซิร์ฟเวอร์ฐานข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">การใช้งาน</span>
              <Badge variant={getStatusColor(metrics.memoryUsage, { warning: 80, critical: 95 })}>
                {metrics.memoryUsage}%
              </Badge>
            </div>
            <Progress value={metrics.memoryUsage} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.memoryUsage > 80 ? (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span>
                {metrics.memoryUsage > 80 ? 'สูงกว่าปกติ' : 'อยู่ในเกณฑ์ปกติ'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              การใช้งานดิสก์
            </CardTitle>
            <CardDescription>
              การใช้งานพื้นที่จัดเก็บข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">การใช้งาน</span>
              <Badge variant={getStatusColor(metrics.diskUsage, { warning: 70, critical: 90 })}>
                {metrics.diskUsage}%
              </Badge>
            </div>
            <Progress value={metrics.diskUsage} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.diskUsage > 70 ? (
                <TrendingUp className="h-4 w-4 text-orange-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span>
                {metrics.diskUsage > 70 ? 'สูงกว่าปกติ' : 'อยู่ในเกณฑ์ปกติ'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            การแจ้งเตือนและข้อผิดพลาด
          </CardTitle>
          <CardDescription>
            รายการการแจ้งเตือนและข้อผิดพลาดล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.slowQueries > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-800">
                    คำสั่งช้า
                  </div>
                  <div className="text-xs text-yellow-600">
                    พบคำสั่งที่ใช้เวลาประมวลผลนาน {metrics.slowQueries} คำสั่ง
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  ดูรายละเอียด
                </Button>
              </div>
            )}

            {metrics.errors > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">
                    ข้อผิดพลาด
                  </div>
                  <div className="text-xs text-red-600">
                    พบข้อผิดพลาด {metrics.errors} รายการ
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  ดูรายละเอียด
                </Button>
              </div>
            )}

            {metrics.cpuUsage > 70 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Cpu className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-orange-800">
                    การใช้งาน CPU สูง
                  </div>
                  <div className="text-xs text-orange-600">
                    การใช้งาน CPU อยู่ที่ {metrics.cpuUsage}%
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  ดูรายละเอียด
                </Button>
              </div>
            )}

            {metrics.memoryUsage > 80 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <HardDrive className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-orange-800">
                    การใช้งานหน่วยความจำสูง
                  </div>
                  <div className="text-xs text-orange-600">
                    การใช้งาน RAM อยู่ที่ {metrics.memoryUsage}%
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  ดูรายละเอียด
                </Button>
              </div>
            )}

            {metrics.slowQueries === 0 && metrics.errors === 0 && 
             metrics.cpuUsage <= 70 && metrics.memoryUsage <= 80 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800">
                    ระบบทำงานปกติ
                  </div>
                  <div className="text-xs text-green-600">
                    ไม่พบปัญหาหรือการแจ้งเตือน
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              แนวโน้มการใช้งาน
            </CardTitle>
            <CardDescription>
              แนวโน้มการใช้งานในช่วง 24 ชั่วโมง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              กราฟแนวโน้มการใช้งาน
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              ประสิทธิภาพการตอบสนอง
            </CardTitle>
            <CardDescription>
              เวลาตอบสนองเฉลี่ยในช่วง 24 ชั่วโมง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              กราฟเวลาตอบสนอง
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 