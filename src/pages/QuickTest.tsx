import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Database, Play, Loader2 } from 'lucide-react'
import { checkEnvironmentVariables } from '@/utils/envCheck'
import { testDatabaseConnection } from '@/utils/testConnection'

export default function QuickTest() {
  const [envCheck, setEnvCheck] = useState<any>(null)
  const [dbTest, setDbTest] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    // ตรวจสอบ environment variables ทันที
    const envResult = checkEnvironmentVariables()
    setEnvCheck(envResult)
  }, [])

  const runDatabaseTest = async () => {
    setTesting(true)
    setDbTest(null)

    try {
      const result = await testDatabaseConnection()
      setDbTest(result)
    } catch (error) {
      setDbTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">การตรวจสอบด่วน</h1>
          <p className="text-muted-foreground">
            ตรวจสอบการตั้งค่าและการเชื่อมต่อฐานข้อมูล
          </p>
        </div>
      </div>

      {/* Environment Variables Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {envCheck?.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Environment Variables
            {envCheck?.isValid ? (
              <Badge className="bg-green-600">OK</Badge>
            ) : (
              <Badge variant="destructive">Error</Badge>
            )}
          </CardTitle>
          <CardDescription>
            ตรวจสอบการตั้งค่า .env.local
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envCheck && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Supabase URL:</span>
                  <span>{envCheck.checks.hasUrl ? '✅ Valid' : '❌ Invalid'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Anon Key:</span>
                  <span>{envCheck.checks.hasAnonKey ? '✅ Valid' : '❌ Invalid'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Key:</span>
                  <span>{envCheck.checks.hasServiceKey ? '✅ Valid' : '❌ Invalid'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span>{envCheck.keyType}</span>
                </div>
              </div>

              {envCheck.isValid ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ การตั้งค่าถูกต้อง:</strong> ใช้ {envCheck.keyType} สำหรับการเชื่อมต่อ
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ การตั้งค่าไม่ถูกต้อง:</strong> กรุณาตรวจสอบไฟล์ .env.local
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {dbTest?.success === true ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : dbTest?.success === false ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <Database className="h-5 w-5" />
            )}
            การเชื่อมต่อฐานข้อมูล
            {dbTest?.success === true ? (
              <Badge className="bg-green-600">Connected</Badge>
            ) : dbTest?.success === false ? (
              <Badge variant="destructive">Failed</Badge>
            ) : (
              <Badge variant="outline">Not Tested</Badge>
            )}
          </CardTitle>
          <CardDescription>
            ทดสอบการเชื่อมต่อกับ Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDatabaseTest}
            disabled={testing || !envCheck?.isValid}
            className="w-full"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </Button>

          {dbTest && (
            <div className="space-y-3">
              {dbTest.success ? (
                <div className="space-y-2">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>✅ เชื่อมต่อสำเร็จ:</strong> {dbTest.message}
                    </AlertDescription>
                  </Alert>

                  {dbTest.tablesFound !== undefined && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>ตารางที่พบ:</span>
                        <span className="font-medium">{dbTest.tablesFound}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ตารางทั้งหมด:</span>
                        <span className="font-medium">{dbTest.totalTables}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ เชื่อมต่อล้มเหลว:</strong> {dbTest.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {envCheck?.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>ขั้นตอนต่อไป</CardTitle>
          </CardHeader>
          <CardContent>
            {dbTest?.success ? (
              <div className="space-y-2">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>🎉 พร้อมใช้งาน!</strong> คุณสามารถไปที่หน้า "ฐานข้อมูล" เพื่อติดตั้งตารางได้แล้ว
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.open('/database', '_blank')}
                    variant="outline"
                  >
                    เปิดหน้าจัดการฐานข้อมูล
                  </Button>
                  <Button 
                    onClick={() => window.open('/test-connection', '_blank')}
                    variant="outline"
                  >
                    ทดสอบแบบละเอียด
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>ขั้นตอนต่อไป:</strong> ทดสอบการเชื่อมต่อฐานข้อมูลก่อน
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการ Debug</CardTitle>
          <CardDescription>
            ข้อมูลสำหรับการแก้ไขปัญหา (เปิด Console เพื่อดูรายละเอียด)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-muted p-3 rounded">
            <div>URL: {envCheck?.env.VITE_SUPABASE_URL?.substring(0, 50)}...</div>
            <div>Key Type: {envCheck?.keyType}</div>
            <div>Key Length: {envCheck?.selectedKey?.length || 0} chars</div>
            <div>Service Role Mode: {envCheck?.checks.useServiceRole ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}