// Simple Database Connection Test Component
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { testConnection } from '@/utils/databaseConnection';

export const ConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    try {
      const connectionResult = await testConnection();
      setResult(connectionResult);
    } catch (error) {
      setResult({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return <Database className="h-5 w-5" />;
    return result.connected ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (!result) return null;
    return (
      <Badge variant={result.connected ? "default" : "destructive"}>
        {result.connected ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่สำเร็จ'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          ทดสอบการเชื่อมต่อฐานข้อมูล
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          ทดสอบการเชื่อมต่อกับ Supabase Database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              ทดสอบการเชื่อมต่อ
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.connected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <AlertDescription>
              {result.connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-800">
                    <Wifi className="h-4 w-4" />
                    <strong>เชื่อมต่อสำเร็จ!</strong>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>ความเร็ว: {result.latency}ms</p>
                    <p>เวลา: {result.timestamp.toLocaleString('th-TH')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-800">
                    <WifiOff className="h-4 w-4" />
                    <strong>เชื่อมต่อไม่สำเร็จ</strong>
                  </div>
                  <div className="text-sm text-red-700">
                    <p>ข้อผิดพลาด: {result.error}</p>
                    <p>เวลา: {result.timestamp.toLocaleString('th-TH')}</p>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};