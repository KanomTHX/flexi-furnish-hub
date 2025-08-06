import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function SimpleConnectionTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🔍 Testing basic Supabase connection...')
      
      // ทดสอบการเชื่อมต่อพื้นฐาน
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('relation "branches" does not exist')) {
          setResult({
            success: false,
            error: 'ตาราง branches ยังไม่ได้สร้าง',
            needsSetup: true,
            connectionOk: true
          })
        } else {
          setResult({
            success: false,
            error: error.message,
            connectionOk: false
          })
        }
      } else {
        setResult({
          success: true,
          message: 'เชื่อมต่อสำเร็จ',
          data: data,
          connectionOk: true,
          tablesExist: true
        })
      }
      
    } catch (error) {
      console.error('Connection test error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionOk: false
      })
    } finally {
      setLoading(false)
    }
  }

  const testEnvironment = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const useServiceRole = import.meta.env.VITE_USE_SERVICE_ROLE === 'true'
    
    return {
      hasUrl: supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL',
      hasAnonKey: supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY',
      hasServiceRoleKey: supabaseServiceRoleKey && supabaseServiceRoleKey !== 'YOUR_SERVICE_ROLE_KEY',
      useServiceRole,
      url: supabaseUrl,
      anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not set',
      serviceRoleKey: supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : 'Not set'
    }
  }

  const env = testEnvironment()
  const envOk = env.hasUrl && env.hasAnonKey && env.hasServiceRoleKey

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          ทดสอบการเชื่อมต่อ Supabase
        </h1>
        <p className="text-muted-foreground">
          ตรวจสอบการเชื่อมต่อและสถานะฐานข้อมูล
        </p>
      </div>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {envOk ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            Environment Variables
          </CardTitle>
          <CardDescription>
            ตรวจสอบการตั้งค่า Environment Variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={env.hasUrl ? "default" : "destructive"}>
                  {env.hasUrl ? "✅" : "❌"}
                </Badge>
                <span className="text-sm font-medium">VITE_SUPABASE_URL</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {env.url || 'Not configured'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={env.hasAnonKey ? "default" : "destructive"}>
                  {env.hasAnonKey ? "✅" : "❌"}
                </Badge>
                <span className="text-sm font-medium">VITE_SUPABASE_ANON_KEY</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {env.anonKey}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={env.hasServiceRoleKey ? "default" : "destructive"}>
                  {env.hasServiceRoleKey ? "✅" : "❌"}
                </Badge>
                <span className="text-sm font-medium">VITE_SUPABASE_SERVICE_ROLE_KEY</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {env.serviceRoleKey}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={env.useServiceRole ? "default" : "secondary"}>
                  {env.useServiceRole ? "✅" : "⚠️"}
                </Badge>
                <span className="text-sm font-medium">VITE_USE_SERVICE_ROLE</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {env.useServiceRole ? 'true (Admin Mode)' : 'false (User Mode)'}
              </p>
            </div>
          </div>

          {!envOk && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>❌ Environment Variables ไม่ครบ:</strong> กรุณาตั้งค่าให้ถูกต้องใน .env.local
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>ทดสอบการเชื่อมต่อ</CardTitle>
          <CardDescription>
            ทดสอบการเชื่อมต่อกับฐานข้อมูล Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection}
            disabled={loading || !envOk}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            ทดสอบการเชื่อมต่อ
          </Button>

          {result && (
            <div className="space-y-2">
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ สำเร็จ:</strong> {result.message}
                    {result.data && (
                      <div className="mt-2">
                        <p className="text-sm">พบข้อมูล: {result.data.length} รายการ</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ ล้มเหลว:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}

              {result.needsSetup && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>💡 ต้องติดตั้งฐานข้อมูล:</strong> การเชื่อมต่อสำเร็จแต่ยังไม่มีตาราง
                    <div className="mt-2 space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('/manual-database-setup', '_blank')}
                      >
                        ติดตั้งแบบ Manual
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('/database-installer', '_blank')}
                      >
                        ติดตั้งอัตโนมัติ
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.tablesExist && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>🎉 พร้อมใช้งาน:</strong> ฐานข้อมูลพร้อมใช้งานแล้ว
                    <div className="mt-2 space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('/pos', '_blank')}
                      >
                        ไปที่ระบบ POS
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('/pos-supabase-test', '_blank')}
                      >
                        ทดสอบ POS
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>ลิงก์ด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/manual-database-setup', '_blank')}
            >
              ติดตั้ง Manual
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/database-installer', '_blank')}
            >
              ติดตั้งอัตโนมัติ
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/pos-supabase-test', '_blank')}
            >
              ทดสอบ POS
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              Supabase Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}