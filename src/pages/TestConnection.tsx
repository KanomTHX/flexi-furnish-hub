import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, CheckCircle, XCircle, Play, FileText } from 'lucide-react'
import { testDatabaseConnection, testEnvironmentVariables } from '@/utils/testConnection'

interface TestResult {
  success: boolean
  message?: string
  error?: string
  details?: any
  tablesFound?: number
  totalTables?: number
  tableResults?: Array<{
    table: string
    exists: boolean
    error?: string
  }>
}

export default function TestConnection() {
  const [testing, setTesting] = useState(false)
  const [envResult, setEnvResult] = useState<TestResult | null>(null)
  const [dbResult, setDbResult] = useState<TestResult | null>(null)

  const runTests = async () => {
    setTesting(true)
    setEnvResult(null)
    setDbResult(null)

    try {
      // Test 1: Environment Variables
      console.log('🔧 Testing environment variables...')
      const envTest = await testEnvironmentVariables()
      setEnvResult(envTest)

      if (!envTest.success) {
        setTesting(false)
        return
      }

      // Test 2: Database Connection
      console.log('📡 Testing database connection...')
      const dbTest = await testDatabaseConnection()
      setDbResult(dbTest)

    } catch (error) {
      console.error('Test failed:', error)
      setDbResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined) return null
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (success?: boolean) => {
    if (success === undefined) return <Badge variant="outline">รอทดสอบ</Badge>
    return success ? 
      <Badge variant="default" className="bg-green-600">ผ่าน</Badge> : 
      <Badge variant="destructive">ไม่ผ่าน</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">ทดสอบการเชื่อมต่อฐานข้อมูล</h1>
          <p className="text-muted-foreground">
            ตรวจสอบการตั้งค่าและการเชื่อมต่อกับ Supabase
          </p>
        </div>
      </div>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>เริ่มการทดสอบ</CardTitle>
          <CardDescription>
            คลิกปุ่มด้านล่างเพื่อทดสอบการเชื่อมต่อฐานข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={testing}
            size="lg"
            className="w-full"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {testing ? 'กำลังทดสอบ...' : 'เริ่มทดสอบการเชื่อมต่อ'}
          </Button>
        </CardContent>
      </Card>

      {/* Environment Variables Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(envResult?.success)}
            1. ตรวจสอบ Environment Variables
            {getStatusBadge(envResult?.success)}
          </CardTitle>
          <CardDescription>
            ตรวจสอบว่าไฟล์ .env.local มีการตั้งค่าที่ถูกต้อง
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envResult && (
            <div className="space-y-3">
              {envResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ ผ่าน:</strong> {envResult.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ ไม่ผ่าน:</strong> {envResult.error}
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
            {getStatusIcon(dbResult?.success)}
            2. ตรวจสอบการเชื่อมต่อฐานข้อมูล
            {getStatusBadge(dbResult?.success)}
          </CardTitle>
          <CardDescription>
            ทดสอบการเชื่อมต่อกับ Supabase และตรวจสอบตาราง
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbResult && (
            <div className="space-y-4">
              {dbResult.success ? (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>✅ ผ่าน:</strong> {dbResult.message}
                    </AlertDescription>
                  </Alert>

                  {dbResult.tablesFound !== undefined && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ตารางที่พบ:</span>
                        <span className="ml-2 font-medium">{dbResult.tablesFound}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ตารางทั้งหมด:</span>
                        <span className="ml-2 font-medium">{dbResult.totalTables}</span>
                      </div>
                    </div>
                  )}

                  {dbResult.tableResults && (
                    <div className="space-y-2">
                      <h4 className="font-medium">สถานะตาราง:</h4>
                      <div className="grid gap-2">
                        {dbResult.tableResults.map((table) => (
                          <div key={table.table} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-mono text-sm">{table.table}</span>
                            {table.exists ? (
                              <Badge variant="default" className="bg-green-600">มีอยู่</Badge>
                            ) : (
                              <Badge variant="destructive">ไม่พบ</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ ไม่ผ่าน:</strong> {dbResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {(envResult || dbResult) && (
        <Card>
          <CardHeader>
            <CardTitle>ขั้นตอนต่อไป</CardTitle>
          </CardHeader>
          <CardContent>
            {!envResult?.success ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>สร้างไฟล์ .env.local:</strong>
                  <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                    <li>สร้างไฟล์ .env.local ในโฟลเดอร์หลักของโปรเจกต์</li>
                    <li>เพิ่ม NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>รีสตาร์ทเซิร์ฟเวอร์ (npm run dev)</li>
                  </ol>
                </AlertDescription>
              </Alert>
            ) : !dbResult?.success ? (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>ตั้งค่าฐานข้อมูล:</strong>
                  <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                    <li>เปิด Supabase Dashboard</li>
                    <li>ไปที่ SQL Editor</li>
                    <li>รันไฟล์ CREATE_POS_SYSTEM_TABLES.sql</li>
                    <li>ทดสอบการเชื่อมต่ออีกครั้ง</li>
                  </ol>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>🎉 เรียบร้อย!</strong> ระบบพร้อมใช้งานแล้ว คุณสามารถไปที่หน้า "ระบบบัญชี" เพื่อทดสอบการทำงานได้
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}