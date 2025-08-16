// Database Status Component
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Clock,
  Server,
  Users,
  Package,
  ShoppingCart,
  Warehouse,
  FileText,
  CreditCard
} from 'lucide-react';
import { useDatabaseConnection } from '@/hooks/useDatabaseConnection';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export const DatabaseStatus: React.FC = () => {
  const {
    connectionStatus,
    health,
    stats,
    loading,
    initializing,
    isConnected,
    isHealthy,
    hasData,
    checkConnection,
    checkHealth,
    refreshStats,
    initialize,
    getConnectionLatency,
    getLastCheck,
    getHealthScore
  } = useDatabaseConnection();

  const handleRefresh = async () => {
    await Promise.all([
      checkConnection(),
      checkHealth(),
      refreshStats()
    ]);
  };

  const getStatusColor = () => {
    if (!isConnected) return 'destructive';
    if (!isHealthy) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4" />;
    if (!isHealthy) return <AlertTriangle className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'ไม่เชื่อมต่อ';
    if (!isHealthy) return 'เชื่อมต่อแต่มีปัญหา';
    return 'เชื่อมต่อปกติ';
  };

  const healthScore = getHealthScore();
  const latency = getConnectionLatency();
  const lastCheck = getLastCheck();

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <CardTitle>สถานะการเชื่อมต่อฐานข้อมูล</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
          <CardDescription>
            ตรวจสอบสถานะการเชื่อมต่อและความสมบูรณ์ของฐานข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{getStatusText()}</p>
                {connectionStatus?.error && (
                  <p className="text-sm text-muted-foreground text-red-600">
                    {connectionStatus.error}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
            </Badge>
          </div>

          {/* Connection Details */}
          {isConnected && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>ความเร็ว: {latency ? `${latency}ms` : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  ตรวจสอบล่าสุด: {lastCheck ? formatDistanceToNow(lastCheck, { 
                    addSuffix: true, 
                    locale: th 
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Health Score */}
          {health && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">คะแนนสุขภาพระบบ</span>
                <span className="text-sm text-muted-foreground">{healthScore.toFixed(0)}%</span>
              </div>
              <Progress value={healthScore} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Checks Card */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>การตรวจสอบระบบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4" />
                  <span>การเชื่อมต่อ</span>
                </div>
                {health.checks.connection ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>การยืนยันตัวตน</span>
                </div>
                {health.checks.authentication ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>ตารางข้อมูล</span>
                </div>
                {health.checks.tables ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Real-time</span>
                </div>
                {health.checks.realtime ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground">
              <p>ตารางที่เข้าถึงได้: {health.details.tablesCount} ตาราง</p>
              <p>เวอร์ชัน: {health.details.version}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Statistics Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>สถิติข้อมูล</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Server className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{stats.branches}</p>
                <p className="text-sm text-muted-foreground">สาขา</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{stats.employees}</p>
                <p className="text-sm text-muted-foreground">พนักงาน</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{stats.customers}</p>
                <p className="text-sm text-muted-foreground">ลูกค้า</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{stats.products}</p>
                <p className="text-sm text-muted-foreground">สินค้า</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ShoppingCart className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-2xl font-bold">{stats.sales}</p>
                <p className="text-sm text-muted-foreground">การขาย</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Warehouse className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold">{stats.warehouses}</p>
                <p className="text-sm text-muted-foreground">คลัง</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{stats.claims}</p>
                <p className="text-sm text-muted-foreground">เคลม</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CreditCard className="h-8 w-8 text-pink-600" />
                </div>
                <p className="text-2xl font-bold">{stats.contracts}</p>
                <p className="text-sm text-muted-foreground">สัญญา</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initialize Database Card */}
      {isConnected && !hasData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>ฐานข้อมูลยังไม่มีข้อมูล</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              ฐานข้อมูลเชื่อมต่อได้แต่ยังไม่มีข้อมูลเริ่มต้น คลิกปุ่มด้านล่างเพื่อสร้างข้อมูลตัวอย่าง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={initialize}
              disabled={initializing}
              className="w-full"
            >
              {initializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  กำลังสร้างข้อมูล...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  สร้างข้อมูลเริ่มต้น
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};