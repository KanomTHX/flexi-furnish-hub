import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Rocket, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Play,
  Settings,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DatabaseQuickStart() {
  const navigate = useNavigate()
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const envExample = `VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_USE_SERVICE_ROLE=true`

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Rocket className="h-8 w-8 text-blue-600" />
          เริ่มต้นใช้งานฐานข้อมูล
        </h1>
        <p className="text-muted-foreground">
          ติดตั้งฐานข้อมูลระบบ POS ใน 3 ขั้นตอนง่ายๆ
        </p>
      </div>

      {/* Quick Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">1. ตั้งค่า Supabase</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              สร้างโปรเจกต์และรับ API Keys
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">2. ตั้งค่า Environment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              สร้างไฟล์ .env.local
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">3. ติดตั้งฐานข้อมูล</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              รันไฟล์ SQL และเริ่มใช้งาน
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Steps */}
      <Tabs defaultValue="step1" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step1">ขั้นตอนที่ 1</TabsTrigger>
          <TabsTrigger value="step2">ขั้นตอนที่ 2</TabsTrigger>
          <TabsTrigger value="step3">ขั้นตอนที่ 3</TabsTrigger>
        </TabsList>

        <TabsContent value="step1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ขั้นตอนที่ 1: ตั้งค่า Supabase
              </CardTitle>
              <CardDescription>
                สร้างโปรเจกต์ Supabase และรับ API Keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">ไปที่ Supabase</p>
                    <p className="text-sm text-muted-foreground">
                      เปิด <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        https://supabase.com <ExternalLink className="h-3 w-3" />
                      </a> และสร้างบัญชี
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">สร้างโปรเจกต์ใหม่</p>
                    <p className="text-sm text-muted-foreground">
                      คลิก "New Project" และกรอกข้อมูลโปรเจกต์
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">รับ API Keys</p>
                    <p className="text-sm text-muted-foreground">
                      ไปที่ Settings > API และคัดลอก:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
                      <li>Project URL</li>
                      <li>anon public key</li>
                      <li>service_role secret key ⚠️</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ สำคัญ:</strong> service_role key มีสิทธิ์เต็มในฐานข้อมูล เก็บเป็นความลับ
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ขั้นตอนที่ 2: ตั้งค่า Environment Variables
              </CardTitle>
              <CardDescription>
                สร้างไฟล์ .env.local และใส่ API Keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">สร้างไฟล์ .env.local</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      สร้างไฟล์ใหม่ชื่อ <code className="bg-muted px-1 rounded">.env.local</code> ในโฟลเดอร์หลักของโปรเจกต์
                    </p>
                    <div className="bg-muted p-3 rounded-md relative">
                      <pre className="text-sm overflow-x-auto">{envExample}</pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(envExample, 'env')}
                      >
                        {copiedStep === 'env' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">แทนที่ค่าต่างๆ</p>
                    <p className="text-sm text-muted-foreground">
                      แทนที่ <code className="bg-muted px-1 rounded">your-project-id</code> และ keys ต่างๆ ด้วยค่าจริงจาก Supabase
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">รีสตาร์ทเซิร์ฟเวอร์</p>
                    <p className="text-sm text-muted-foreground">
                      หยุดเซิร์ฟเวอร์ (Ctrl+C) และรันใหม่ด้วย <code className="bg-muted px-1 rounded">npm run dev</code>
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>💡 เคล็ดลับ:</strong> ตรวจสอบว่าไฟล์ .env.local อยู่ในโฟลเดอร์เดียวกับ package.json
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                ขั้นตอนที่ 3: ติดตั้งฐานข้อมูล
              </CardTitle>
              <CardDescription>
                รันไฟล์ SQL และเริ่มใช้งานระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium">ไปที่หน้าติดตั้งฐานข้อมูล</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      คลิกปุ่มด้านล่างเพื่อไปที่หน้าติดตั้ง
                    </p>
                    <Button 
                      onClick={() => navigate('/database-installer')}
                      className="flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      ไปที่หน้าติดตั้งฐานข้อมูล
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <p className="font-medium">คลิก "ติดตั้งฐานข้อมูล"</p>
                    <p className="text-sm text-muted-foreground">
                      รอให้กระบวนการเสร็จสิ้น (1-2 นาที) จะได้ตาราง 19 ตาราง
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="font-medium">เริ่มใช้งานระบบ</p>
                    <p className="text-sm text-muted-foreground">
                      หลังติดตั้งเสร็จ สามารถใช้งานระบบต่างๆ ได้ทันที
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/accounting')}
                  className="justify-start"
                >
                  ระบบบัญชี
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/pos')}
                  className="justify-start"
                >
                  ระบบ POS
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/warehouses')}
                  className="justify-start"
                >
                  ระบบคลัง
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/branches')}
                  className="justify-start"
                >
                  ระบบสาขา
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
          <CardDescription>
            ปุ่มลัดสำหรับการดำเนินการที่สำคัญ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              onClick={() => navigate('/database-installer')}
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Database className="h-6 w-6" />
              <span className="text-sm">ติดตั้งฐานข้อมูล</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => navigate('/test-connection')}
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <Play className="h-6 w-6" />
              <span className="text-sm">ทดสอบการเชื่อมต่อ</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => navigate('/accounting')}
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm">เริ่มใช้งาน</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => window.open('https://supabase.com/docs', '_blank')}
              className="flex items-center gap-2 h-auto p-4 flex-col"
            >
              <ExternalLink className="h-6 w-6" />
              <span className="text-sm">เอกสาร Supabase</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Check */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>🎯 เป้าหมาย:</strong> หลังจากทำตามขั้นตอนทั้ง 3 ขั้นตอน คุณจะได้ระบบ POS ที่พร้อมใช้งานครบถ้วน 
          พร้อมฐานข้อมูล 19 ตาราง และข้อมูลตัวอย่างสำหรับทดสอบ
        </AlertDescription>
      </Alert>
    </div>
  )
}