import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase, checkSupabaseConnection } from '@/integrations/supabase/client';

interface ConnectionStatus {
  connected: boolean;
  error?: any;
  latency?: number;
  timestamp?: Date;
}

export function DatabaseConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [testing, setTesting] = useState(false);
  const [autoTest, setAutoTest] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    const startTime = Date.now();
    
    try {
      const result = await checkSupabaseConnection();
      const latency = Date.now() - startTime;
      
      setStatus({
        connected: result.connected,
        error: result.error,
        latency,
        timestamp: new Date()
      });
    } catch (error) {
      setStatus({
        connected: false,
        error,
        timestamp: new Date()
      });
    } finally {
      setTesting(false);
    }
  };

  const testDatabaseTables = async () => {
    setTesting(true);
    
    try {
      // Test basic tables
      const tests = [
        { name: 'products', query: () => supabase.from('products').select('count').limit(1) },
        { name: 'warehouses', query: () => supabase.from('warehouses').select('count').limit(1) },
        { name: 'product_serial_numbers', query: () => supabase.from('product_serial_numbers').select('count').limit(1) },
        { name: 'stock_movements', query: () => supabase.from('stock_movements').select('count').limit(1) }
      ];

      const results = await Promise.allSettled(
        tests.map(async (test) => {
          const { data, error } = await test.query();
          return { name: test.name, success: !error, error };
        })
      );

      console.log('Database table tests:', results);
      
      const allSuccess = results.every(result => 
        result.status === 'fulfilled' && result.value.success
      );

      setStatus({
        connected: allSuccess,
        error: allSuccess ? null : 'Some tables are not accessible',
        timestamp: new Date()
      });
    } catch (error) {
      setStatus({
        connected: false,
        error,
        timestamp: new Date()
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Test connection on mount
    testConnection();
  }, []);

  useEffect(() => {
    if (autoTest) {
      const interval = setInterval(testConnection, 10000); // Test every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoTest]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          การเชื่อมต่อฐานข้อมูล
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.connected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">
              สถานะการเชื่อมต่อ
            </span>
          </div>
          <Badge variant={status.connected ? "default" : "destructive"}>
            {status.connected ? "เชื่อมต่อแล้ว" : "ไม่สามารถเชื่อมต่อได้"}
          </Badge>
        </div>

        {/* Connection Details */}
        {status.timestamp && (
          <div className="text-sm text-muted-foreground">
            ตรวจสอบล่าสุด: {status.timestamp.toLocaleString('th-TH')}
            {status.latency && (
              <span className="ml-2">
                ({status.latency}ms)
              </span>
            )}
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {typeof status.error === 'string' 
                ? status.error 
                : status.error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}
            </AlertDescription>
          </Alert>
        )}

        {/* Database Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Supabase URL:</div>
            <div className="text-muted-foreground break-all">
              {import.meta.env.VITE_SUPABASE_URL || 'ไม่ได้กำหนด'}
            </div>
          </div>
          <div>
            <div className="font-medium">Environment:</div>
            <div className="text-muted-foreground">
              {import.meta.env.VITE_APP_ENV || 'development'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            ทดสอบการเชื่อมต่อ
          </Button>
          
          <Button 
            onClick={testDatabaseTables} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            ทดสอบตาราง
          </Button>

          <Button
            onClick={() => setAutoTest(!autoTest)}
            variant={autoTest ? "default" : "outline"}
            size="sm"
          >
            {autoTest ? "หยุดทดสอบอัตโนมัติ" : "ทดสอบอัตโนมัติ"}
          </Button>
        </div>

        {/* Connection Tips */}
        {!status.connected && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">เคล็ดลับการแก้ไขปัญหา:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>ตรวจสอบ environment variables ใน .env.local</li>
                  <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                  <li>ตรวจสอบสถานะ Supabase service</li>
                  <li>ตรวจสอบ API keys และ permissions</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}