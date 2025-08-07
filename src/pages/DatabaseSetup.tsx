import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Download
} from 'lucide-react'
import { DatabaseConnection } from '@/components/accounting/DatabaseConnection'
import { AdminDatabaseManager } from '@/components/database/AdminDatabaseManager'
import { EnvironmentCheck } from '@/components/database/EnvironmentCheck'

export default function DatabaseSetup() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(stepId)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const setupSteps = [
    {
      id: 'create-project',
      title: '1. สร้างโปรเจกต์ Supabase',
      description: 'สร้างโปรเจกต์ใหม่ใน Supabase',
      status: 'pending',
      actions: [
        'ไปที่ https://supabase.com',
        'คลิก "New Project"',
        'ใส่ชื่อโปรเจกต์และรหัสผ่าน',
        'เลือก Region ที่ใกล้ที่สุด',
        'คลิก "Create new project"'
      ]
    },
    {
      id: 'get-credentials',
      title: '2. รับ API Keys',
      description: 'คัดลอก URL และ API Key จาก Supabase',
      status: 'pending',
      actions: [
        'ไปที่ Settings > API',
        'คัดลอก Project URL',
        'คัดลอก anon public key',
        'เก็บข้อมูลเหล่านี้ไว้ใช้ในขั้นตอนถัดไป'
      ]
    },
    {
      id: 'setup-env',
      title: '3. ตั้งค่า Environment Variables',
      description: 'สร้างไฟล์ .env.local',
      status: 'pending',
      code: `# สร้างไฟล์ .env.local ในโฟลเดอร์หลักของโปรเจกต์
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`
    },
    {
      id: 'run-sql',
      title: '4. รันไฟล์ SQL',
      description: 'สร้างตารางในฐานข้อมูล',
      status: 'pending',
      actions: [
        'เปิด Supabase Dashboard',
        'ไปที่ SQL Editor',
        'คลิก "New Query"',
        'คัดลอกเนื้อหาจากไฟล์ CREATE_POS_SYSTEM_TABLES.sql',
        'วางในหน้า SQL Editor',
        'คลิก "Run" เพื่อรันคำสั่ง'
      ]
    },
    {
      id: 'test-connection',
      title: '5. ทดสอบการเชื่อมต่อ',
      description: 'ตรวจสอบว่าทุกอย่างทำงานได้ถูกต้อง',
      status: 'pending'
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">การตั้งค่าฐานข้อมูล</h1>
          <p className="text-muted-foreground">
            ตั้งค่าและเชื่อมต่อกับ Supabase Database
          </p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">การติดตั้ง</TabsTrigger>
          <TabsTrigger value="admin">Admin Mode</TabsTrigger>
          <TabsTrigger value="connection">การเชื่อมต่อ</TabsTrigger>
          <TabsTrigger value="files">ไฟล์ที่จำเป็น</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <EnvironmentCheck />
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>สำคัญ:</strong> ทำตามขั้นตอนเหล่านี้เพื่อเชื่อมต่อระบบกับฐานข้อมูลจริง
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {setupSteps.map((step, index) => (
              <Card key={step.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                      {index + 1}
                    </div>
                    {step.title}
                    <Badge variant="outline">{step.status}</Badge>
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {step.actions && (
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      {step.actions.map((action, actionIndex) => (
                        <li key={actionIndex}>{action}</li>
                      ))}
                    </ol>
                  )}
                  
                  {step.code && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ไฟล์ .env.local</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(step.code!, step.id)}
                        >
                          {copiedStep === step.id ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          {copiedStep === step.id ? 'คัดลอกแล้ว' : 'คัดลอก'}
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}

                  {step.id === 'create-project' && (
                    <div className="mt-4">
                      <Button
                        onClick={() => window.open('https://supabase.com', '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        เปิด Supabase
                      </Button>
                    </div>
                  )}

                  {step.id === 'test-connection' && (
                    <div className="mt-4 space-y-4">
                      <DatabaseConnection />
                      <Button
                        onClick={() => window.open('/test-connection', '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        เปิดหน้าทดสอบการเชื่อมต่อแบบละเอียด
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="space-y-6">
          <AdminDatabaseManager />
        </TabsContent>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-6">
          <DatabaseConnection />
          
          <Card>
            <CardHeader>
              <CardTitle>การแก้ไขปัญหาที่พบบ่อย</CardTitle>
              <CardDescription>
                วิธีแก้ไขปัญหาการเชื่อมต่อที่พบบ่อย
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">❌ ไม่สามารถเชื่อมต่อได้</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>ตรวจสอบไฟล์ .env.local ว่ามี URL และ API Key ถูกต้อง</li>
                  <li>ตรวจสอบว่าโปรเจกต์ Supabase ยังทำงานอยู่</li>
                  <li>ลองรีสตาร์ทเซิร์ฟเวอร์ (npm run dev)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">❌ ไม่พบตาราง</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>ตรวจสอบว่าได้รันไฟล์ CREATE_POS_SYSTEM_TABLES.sql แล้ว</li>
                  <li>ตรวจสอบใน Supabase Dashboard {'>'} Table Editor</li>
                  <li>ลองรันไฟล์ SQL อีกครั้ง</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">❌ Permission Denied</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>ตรวจสอบการตั้งค่า RLS (Row Level Security)</li>
                  <li>ตรวจสอบ API Key ว่าใช้ anon key ที่ถูกต้อง</li>
                  <li>ตรวจสอบ Policies ในตาราง</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CREATE_POS_SYSTEM_TABLES.sql
                </CardTitle>
                <CardDescription>
                  ไฟล์ SQL สำหรับสร้างตารางทั้งหมด
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ไฟล์นี้ประกอบด้วยคำสั่ง SQL สำหรับสร้างตาราง 19 ตาราง พร้อมข้อมูลตัวอย่าง
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Open file in editor (if available)
                      console.log('Opening CREATE_POS_SYSTEM_TABLES.sql')
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    ดูไฟล์
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Download file
                      const element = document.createElement('a')
                      element.setAttribute('href', '/CREATE_POS_SYSTEM_TABLES.sql')
                      element.setAttribute('download', 'CREATE_POS_SYSTEM_TABLES.sql')
                      element.style.display = 'none'
                      document.body.appendChild(element)
                      element.click()
                      document.body.removeChild(element)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ดาวน์โหลด
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  .env.example
                </CardTitle>
                <CardDescription>
                  ตัวอย่างไฟล์ Environment Variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  คัดลอกไฟล์นี้เป็น .env.local และใส่ค่าจริงจาก Supabase
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`
                      copyToClipboard(envContent, 'env-example')
                    }}
                  >
                    {copiedStep === 'env-example' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedStep === 'env-example' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ไฟล์ที่สร้างขึ้นใหม่</CardTitle>
              <CardDescription>
                ไฟล์เหล่านี้ถูกสร้างขึ้นเพื่อรองรับการเชื่อมต่อฐานข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">src/lib/supabase.ts</div>
                    <div className="text-sm text-muted-foreground">
                      ไฟล์การเชื่อมต่อและ helper functions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">src/hooks/useSupabaseAccounting.ts</div>
                    <div className="text-sm text-muted-foreground">
                      React Hook สำหรับจัดการข้อมูลบัญชี
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">src/components/accounting/DatabaseConnection.tsx</div>
                    <div className="text-sm text-muted-foreground">
                      คอมโพเนนต์ตรวจสอบสถานะการเชื่อมต่อ
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}