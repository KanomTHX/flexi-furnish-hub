// Simple Database Test Page
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ConnectionTest } from '@/components/database/ConnectionTest';
import { useDatabaseConnection } from '@/hooks/useDatabaseConnection';

const DatabaseTest = () => {
  const { 
    connectionStatus, 
    health, 
    stats, 
    loading, 
    isConnected, 
    isHealthy, 
    hasData 
  } = useDatabaseConnection();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">ทดสอบการเชื่อมต่อฐานข้อมูล</h1>
          <p className="text-muted-foreground">
            ตรวจสอบสถานะการเชื่อมต่อและความพร้อมใช้งานของระบบ
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Test */}
        <ConnectionTest />

        {/* Quick Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              สถานะด่วน
            </CardTitle>
            <CardDescription>
              ภาพรวมสถานะระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>การเชื่อมต่อ</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>สุขภาพระบบ</span>
              <Badge variant={isHealthy ? "default" : "secondary"}>
                {isHealthy ? 'ปกติ' : 'ตรวจสอบ'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>ข้อมูลในระบบ</span>
              <Badge variant={hasData ? "default" : "outline"}>
                {hasData ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
              </Badge>
            </div>

            <Separator />

            {connectionStatus && (
              <div className="text-sm text-muted-foreground">
                <p>ความเร็ว: {connectionStatus.latency}ms</p>
                <p>ตรวจสอบล่าสุด: {connectionStatus.timestamp.toLocaleString('th-TH')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่าสภาพแวดล้อม</CardTitle>
          <CardDescription>
            ตรวจสอบ Environment Variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>VITE_SUPABASE_URL</span>
              <Badge variant={import.meta.env.VITE_SUPABASE_URL ? "default" : "destructive"}>
                {import.meta.env.VITE_SUPABASE_URL ? 'ตั้งค่าแล้ว' : 'ไม่ได้ตั้งค่า'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>VITE_SUPABASE_ANON_KEY</span>
              <Badge variant={import.meta.env.VITE_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'ตั้งค่าแล้ว' : 'ไม่ได้ตั้งค่า'}
              </Badge>
            </div>
          </div>

          {import.meta.env.VITE_SUPABASE_URL && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Supabase URL:</p>
              <p className="text-sm text-muted-foreground font-mono">
                {import.meta.env.VITE_SUPABASE_URL}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>สถิติฐานข้อมูล</CardTitle>
            <CardDescription>
              จำนวนข้อมูลในแต่ละตาราง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.branches}</div>
                <div className="text-sm text-muted-foreground">สาขา</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.employees}</div>
                <div className="text-sm text-muted-foreground">พนักงาน</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.customers}</div>
                <div className="text-sm text-muted-foreground">ลูกค้า</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.products}</div>
                <div className="text-sm text-muted-foreground">สินค้า</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Details */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดสุขภาพระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>การเชื่อมต่อ</span>
                {health.checks.connection ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>การยืนยันตัวตน</span>
                {health.checks.authentication ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>ตารางข้อมูล</span>
                {health.checks.tables ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Real-time</span>
                {health.checks.realtime ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground">
              <p>ตารางที่เข้าถึงได้: {health.details.tablesCount}</p>
              <p>เวอร์ชัน: {health.details.version}</p>
              <p>สถานะ: {health.status}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseTest;