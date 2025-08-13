import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, Database, User, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export const AuthConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests: TestResult[] = [
      { name: 'การเชื่อมต่อ Supabase', status: 'pending', message: 'กำลังทดสอบ...' },
      { name: 'การตรวจสอบ Authentication', status: 'pending', message: 'กำลังทดสอบ...' },
      { name: 'การทดสอบ Session', status: 'pending', message: 'กำลังทดสอบ...' },
      { name: 'การทดสอบ Storage', status: 'pending', message: 'กำลังทดสอบ...' }
    ];

    setResults(tests);

    // Test 1: Supabase Connection
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('employees').select('count').limit(1);
      const duration = Date.now() - start;
      
      tests[0] = {
        name: 'การเชื่อมต่อ Supabase',
        status: error ? 'error' : 'success',
        message: error ? `เชื่อมต่อไม่สำเร็จ: ${error.message}` : `เชื่อมต่อสำเร็จ (${duration}ms)`,
        duration
      };
    } catch (error) {
      tests[0] = {
        name: 'การเชื่อมต่อ Supabase',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setResults([...tests]);

    // Test 2: Authentication
    try {
      const start = Date.now();
      const { data: { session } } = await supabase.auth.getSession();
      const duration = Date.now() - start;
      
      tests[1] = {
        name: 'การตรวจสอบ Authentication',
        status: 'success',
        message: session 
          ? `มี Session อยู่: ${session.user?.email} (${duration}ms)`
          : `ไม่มี Session (${duration}ms)`,
        duration
      };
    } catch (error) {
      tests[1] = {
        name: 'การตรวจสอบ Authentication',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setResults([...tests]);

    // Test 3: Session Management
    try {
      const start = Date.now();
      const { data: { user } } = await supabase.auth.getUser();
      const duration = Date.now() - start;
      
      tests[2] = {
        name: 'การทดสอบ Session',
        status: 'success',
        message: user 
          ? `User ถูกต้อง: ${user.email} (${duration}ms)`
          : `ไม่มี User (${duration}ms)`,
        duration
      };
    } catch (error) {
      tests[2] = {
        name: 'การทดสอบ Session',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setResults([...tests]);

    // Test 4: Storage
    try {
      const start = Date.now();
      const { data, error } = await supabase.storage.listBuckets();
      const duration = Date.now() - start;
      
      tests[3] = {
        name: 'การทดสอบ Storage',
        status: error ? 'error' : 'success',
        message: error 
          ? `Storage ไม่พร้อมใช้งาน: ${error.message}`
          : `Storage พร้อมใช้งาน (${data?.length || 0} buckets, ${duration}ms)`,
        duration
      };
    } catch (error) {
      tests[3] = {
        name: 'การทดสอบ Storage',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setResults([...tests]);

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getTestIcon = (index: number) => {
    const icons = [Database, User, Globe, Database];
    const Icon = icons[index];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          ทดสอบการเชื่อมต่อ Authentication
        </CardTitle>
        <CardDescription>
          ทดสอบการเชื่อมต่อกับ Supabase และระบบ Authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            'เริ่มทดสอบ'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">ผลการทดสอบ:</h3>
            {results.map((result, index) => (
              <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-center gap-2">
                  {getTestIcon(index)}
                  {getStatusIcon(result.status)}
                </div>
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.name}</span>
                    {result.duration && (
                      <span className="text-xs text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1">{result.message}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {results.length > 0 && !testing && (
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              การทดสอบเสร็จสิ้น - ระบบพร้อมใช้งาน
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};