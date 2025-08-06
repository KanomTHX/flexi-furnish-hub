import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Play,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SupabaseTableCreator, tableDefinitions } from '@/utils/supabaseTableCreator'

export default function ManualDatabaseSetup() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [checkResult, setCheckResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    
    toast({
      title: "คัดลอกแล้ว",
      description: "SQL ได้ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    })
  }

  const copyAllSQL = () => {
    const allSQL = tableDefinitions.map(table => table.sql).join(';\n\n')
    navigator.clipboard.writeText(allSQL)
    
    toast({
      title: "คัดลอกทั้งหมดแล้ว",
      description: "SQL ทั้งหมดได้ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    })
  }

  const checkTables = async () => {
    setLoading(true)
    try {
      const tableCreator = new SupabaseTableCreator()
      const result = await tableCreator.checkTablesExist()
      setCheckResult(result)
      
      if (result.success) {
        toast({
          title: "ตรวจสอบเสร็จสิ้น",
          description: `พบตาราง ${result.totalExisting}/${result.totalRequired} ตาราง`,
        })
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบตารางได้",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          การติดตั้งฐานข้อมูลแบบ Manual
        </h1>
        <p className="text-muted-foreground">
          คำแนะนำการสร้างตารางฐานข้อมูลผ่าน Supabase SQL Editor
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>📋 วิธีการติดตั้ง:</strong> เนื่องจาก Supabase ไม่อนุญาตให้สร้างตารางผ่าน API โดยตรง 
          คุณจะต้องคัดลอก SQL และรันใน Supabase SQL Editor
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            การดำเนินการด่วน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={copyAllSQL} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              คัดลอก SQL ทั้งหมด
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              เปิด Supabase Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={checkTables}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              ตรวจสอบตาราง
            </Button>
          </div>

          {checkResult && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {checkResult.totalExisting === checkResult.totalRequired ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  สถานะ: {checkResult.totalExisting}/{checkResult.totalRequired} ตาราง
                </span>
              </div>
              {checkResult.missingTables && checkResult.missingTables.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">ตารางที่ยังไม่มี:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {checkResult.missingTables.map((table: string) => (
                      <Badge key={table} variant="destructive" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="steps">ขั้นตอน</TabsTrigger>
          <TabsTrigger value="tables">ตาราง SQL</TabsTrigger>
          <TabsTrigger value="complete">SQL ทั้งหมด</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ขั้นตอนการติดตั้ง</CardTitle>
              <CardDescription>
                ทำตามขั้นตอนเหล่านี้เพื่อสร้างตารางฐานข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">เปิด Supabase Dashboard</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      ไปที่ <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        https://supabase.com/dashboard
                      </a> และเลือกโปรเจกต์ของคุณ
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">ไปที่ SQL Editor</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      คลิกที่เมนู "SQL Editor" ในแถบด้านซ้าย
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">คัดลอก SQL</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      คลิกปุ่ม "คัดลอก SQL ทั้งหมด" ด้านบน หรือคัดลอกทีละตารางจากแท็บ "ตาราง SQL"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">รัน SQL</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      วาง SQL ใน Editor และคลิก "Run" เพื่อสร้างตาราง
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">ตรวจสอบผลลัพธ์</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      คลิกปุ่ม "ตรวจสอบตาราง" เพื่อยืนยันว่าตารางถูกสร้างเรียบร้อยแล้ว
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>💡 เคล็ดลับ:</strong> หากเกิดข้อผิดพลาด ให้รัน SQL ทีละตารางตามลำดับใน "ตาราง SQL"
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ตาราง SQL แยกตามลำดับ</CardTitle>
              <CardDescription>
                คัดลอกและรัน SQL ทีละตารางตามลำดับ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tableDefinitions.map((table, index) => (
                  <div key={table.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h4 className="font-medium">{table.name}</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(table.sql, index)}
                        className="flex items-center gap-2"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        คัดลอก
                      </Button>
                    </div>
                    <Textarea
                      value={table.sql}
                      readOnly
                      className="font-mono text-xs h-32 resize-none"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SQL ทั้งหมด
              </CardTitle>
              <CardDescription>
                SQL สำหรับสร้างตารางทั้งหมด 19 ตาราง
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    รวม {tableDefinitions.length} ตาราง
                  </span>
                  <Button
                    onClick={copyAllSQL}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    คัดลอกทั้งหมด
                  </Button>
                </div>
                
                <Textarea
                  value={tableDefinitions.map(table => table.sql).join(';\n\n')}
                  readOnly
                  className="font-mono text-xs h-96 resize-none"
                />
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ หมายเหตุ:</strong> SQL นี้จะสร้างตารางทั้งหมดพร้อมกัน 
                    หากเกิดข้อผิดพลาด ให้รันทีละตารางในแท็บ "ตาราง SQL"
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status */}
      {checkResult && (
        <Card>
          <CardHeader>
            <CardTitle>สถานะการติดตั้ง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {checkResult.totalRequired}
                </div>
                <p className="text-sm text-muted-foreground">ตารางทั้งหมด</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {checkResult.totalExisting}
                </div>
                <p className="text-sm text-muted-foreground">ตารางที่มีอยู่</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {checkResult.totalRequired - checkResult.totalExisting}
                </div>
                <p className="text-sm text-muted-foreground">ตารางที่ขาด</p>
              </div>
            </div>

            {checkResult.totalExisting === checkResult.totalRequired && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>🎉 เสร็จสมบูรณ์!</strong> ตารางทั้งหมดถูกสร้างเรียบร้อยแล้ว 
                  คุณสามารถเริ่มใช้งานระบบ POS ได้แล้ว
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}