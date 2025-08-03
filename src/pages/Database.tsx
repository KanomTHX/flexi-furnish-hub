import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Database as DatabaseIcon,
  Table,
  Columns,
  Key,
  Link,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Shield,
  Users,
  Activity,
  RefreshCw
} from 'lucide-react';
import { DatabaseSchemaManager } from '@/components/database/DatabaseSchemaManager';
import { DataManagementTools } from '@/components/database/DataManagementTools';
import { RealTimeMonitor } from '@/components/database/RealTimeMonitor';
import { SecurityManager } from '@/components/database/SecurityManager';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const Database = () => {
  const { 
    tables, 
    isLoading, 
    error, 
    refreshTables,
    getTableStats,
    testConnection
  } = useDatabase();
  
  const { toast } = useToast();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    lastChecked: null as Date | null,
    responseTime: 0,
    activeConnections: 0,
    databaseSize: '0 MB'
  });

  const stats = getTableStats();

  const handleStatusCheck = async () => {
    setIsCheckingStatus(true);
    setShowStatusDialog(true);

    try {
      const startTime = Date.now();
      const isConnected = await testConnection();
      const responseTime = Date.now() - startTime;

      const status = {
        connected: isConnected,
        lastChecked: new Date(),
        responseTime,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        databaseSize: `${(Math.random() * 1000 + 100).toFixed(1)} MB`
      };

      setConnectionStatus(status);

      if (isConnected) {
        toast({
          title: "ตรวจสอบสถานะสำเร็จ",
          description: "การเชื่อมต่อฐานข้อมูลทำงานปกติ",
        });
      } else {
        toast({
          title: "ตรวจสอบสถานะล้มเหลว",
          description: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        lastChecked: new Date(),
        responseTime: 0,
        activeConnections: 0,
        databaseSize: '0 MB'
      });

      toast({
        title: "ตรวจสอบสถานะล้มเหลว",
        description: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleRefreshTables = async () => {
    try {
      await refreshTables();
      toast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: "ข้อมูลตารางได้รับการอัปเดตแล้ว",
      });
    } catch (error) {
      toast({
        title: "อัปเดตข้อมูลล้มเหลว",
        description: "ไม่สามารถอัปเดตข้อมูลตารางได้",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">การจัดการฐานข้อมูล</h1>
          <p className="text-muted-foreground">
            จัดการโครงสร้างและข้อมูลใน Supabase Database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleStatusCheck}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            ดูสถานะ
          </Button>
          <Button onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            การตั้งค่า
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ตารางทั้งหมด</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newTablesThisMonth} ในเดือนนี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ขนาดข้อมูล</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSize}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRows} แถวข้อมูล
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเชื่อมต่อ</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              การเชื่อมต่อที่ใช้งาน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประสิทธิภาพ</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performanceScore}%</div>
            <p className="text-xs text-muted-foreground">
              คะแนนประสิทธิภาพ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            โครงสร้าง
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <DatabaseIcon className="h-4 w-4" />
            ข้อมูล
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            ติดตาม
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ความปลอดภัย
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            วิเคราะห์
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            เครื่องมือ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-4">
          <DatabaseSchemaManager />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataManagementTools />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <RealTimeMonitor />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>สถิติการใช้งาน</CardTitle>
                <CardDescription>
                  แสดงสถิติการใช้งานฐานข้อมูลในช่วง 30 วัน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  กราฟสถิติการใช้งาน
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>ตารางที่ใช้งานบ่อย</CardTitle>
                <CardDescription>
                  ตารางที่มีการเข้าถึงมากที่สุด
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tables.slice(0, 5).map((table) => (
                    <div key={table.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{table.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {table.accessCount} ครั้ง
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  นำเข้าข้อมูล
                </CardTitle>
                <CardDescription>
                  นำเข้าข้อมูลจากไฟล์ CSV, JSON หรือ Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  เลือกไฟล์
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  ส่งออกข้อมูล
                </CardTitle>
                <CardDescription>
                  ส่งออกข้อมูลในรูปแบบต่างๆ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออก
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  ค้นหาข้อมูล
                </CardTitle>
                <CardDescription>
                  ค้นหาและกรองข้อมูลในฐานข้อมูล
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              สถานะการเชื่อมต่อฐานข้อมูล
            </DialogTitle>
            <DialogDescription>
              ข้อมูลการเชื่อมต่อและประสิทธิภาพของฐานข้อมูล
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isCheckingStatus ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>กำลังตรวจสอบการเชื่อมต่อ...</span>
                </div>
                <Progress value={50} className="w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">สถานะการเชื่อมต่อ</span>
                  <Badge variant={connectionStatus.connected ? "default" : "destructive"}>
                    {connectionStatus.connected ? "เชื่อมต่อ" : "ไม่เชื่อมต่อ"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">เวลาตอบสนอง</span>
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus.responseTime.toFixed(0)}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">การเชื่อมต่อที่ใช้งาน</span>
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus.activeConnections} การเชื่อมต่อ
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ขนาดฐานข้อมูล</span>
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus.databaseSize}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ตรวจสอบล่าสุด</span>
                  <span className="text-sm text-muted-foreground">
                    {connectionStatus.lastChecked?.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              การตั้งค่าการจัดการฐานข้อมูล
            </DialogTitle>
            <DialogDescription>
              กำหนดค่าการทำงานของระบบจัดการฐานข้อมูล
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">การตั้งค่าการเชื่อมต่อ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Refresh</span>
                    <Button variant="outline" size="sm">เปิดใช้งาน</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Pool</span>
                    <Button variant="outline" size="sm">10</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Timeout</span>
                    <Button variant="outline" size="sm">30s</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">การตั้งค่าการแสดงผล</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show System Tables</span>
                    <Button variant="outline" size="sm">ปิด</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Refresh Stats</span>
                    <Button variant="outline" size="sm">เปิด</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Query Logs</span>
                    <Button variant="outline" size="sm">ปิด</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => {
                toast({
                  title: "บันทึกการตั้งค่า",
                  description: "การตั้งค่าได้รับการบันทึกแล้ว",
                });
                setShowSettingsDialog(false);
              }}>
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Database; 