import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  Play, 
  Trash2, 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { adminOperations, setupDatabase } from '@/utils/supabaseAdmin'
import { SupabaseTableCreator } from '@/utils/supabaseTableCreator'

export function AdminDatabaseManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])
  const [customSQL, setCustomSQL] = useState('')

  // ตรวจสอบ environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const useServiceRole = import.meta.env.VITE_USE_SERVICE_ROLE === 'true'
  
  const hasValidConfig = supabaseUrl && 
    supabaseUrl !== 'YOUR_SUPABASE_URL' && 
    supabaseServiceRoleKey && 
    supabaseServiceRoleKey !== 'YOUR_SERVICE_ROLE_KEY'

  const handleSetupDatabase = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const tableCreator = new SupabaseTableCreator()
      
      // ตรวจสอบตารางที่มีอยู่
      console.log('🔍 Checking existing tables...')
      const checkResult = await tableCreator.checkTablesExist()
      
      if (checkResult.success) {
        console.log(`📊 Found ${checkResult.totalExisting}/${checkResult.totalRequired} tables`)
        
        if (checkResult.missingTables.length === 0) {
          // ถ้ามีตารางครบแล้ว ให้ insert ข้อมูลตัวอย่าง
          console.log('✅ All tables exist, inserting sample data...')
          const dataResult = await tableCreator.insertSampleData()
          
          setResult({
            success: true,
            message: `All tables exist. ${dataResult.summary}`,
            tables: checkResult.existingTables,
            dataInserted: dataResult.success
          })
          setTables(checkResult.existingTables)
        } else {
          // ถ้ายังไม่ครบ ให้สร้างตารางที่ขาด
          console.log(`📋 Creating ${checkResult.missingTables.length} missing tables...`)
          const createResult = await tableCreator.createAllTables()
          
          // หลังสร้างตารางแล้ว ให้ insert ข้อมูลตัวอย่าง
          let dataResult = null
          if (createResult.successCount > 0) {
            console.log('📝 Inserting sample data...')
            dataResult = await tableCreator.insertSampleData()
          }
          
          setResult({
            success: createResult.success,
            message: createResult.summary + (dataResult ? `. ${dataResult.summary}` : ''),
            results: createResult.results,
            manualCreationRequired: createResult.results.some((r: any) => r.requiresManualCreation)
          })
          
          // อัปเดตรายชื่อตาราง
          const updatedCheck = await tableCreator.checkTablesExist()
          if (updatedCheck.success) {
            setTables(updatedCheck.existingTables)
          }
        }
      } else {
        throw new Error(checkResult.error)
      }
      
    } catch (error) {
      console.error('Database setup error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup database'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleListTables = async () => {
    setLoading(true)
    
    try {
      const tablesResult = await adminOperations.listTables()
      setTables(tablesResult.success ? tablesResult.tables : [])
      setResult(tablesResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list tables'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetDatabase = async () => {
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้!')) {
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const resetResult = await adminOperations.resetDatabase()
      setResult(resetResult)
      setTables([])
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset database'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteCustomSQL = async () => {
    if (!customSQL.trim()) {
      setResult({
        success: false,
        error: 'Please enter SQL commands'
      })
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const sqlResult = await adminOperations.executeSQL(customSQL)
      setResult(sqlResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute SQL'
      })
    } finally {
      setLoading(false)
    }
  }

  const getResultIcon = () => {
    if (!result) return null
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  const getResultBadge = () => {
    if (!result) return null
    return result.success ? 
      <Badge className="bg-green-600">สำเร็จ</Badge> : 
      <Badge variant="destructive">ล้มเหลว</Badge>
  }

  // ถ้าไม่มีการตั้งค่าที่ถูกต้อง แสดงข้อความแจ้งเตือน
  if (!hasValidConfig) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>❌ ไม่สามารถใช้ Admin Mode ได้:</strong> กรุณาตั้งค่า Environment Variables ให้ถูกต้องก่อน
          <ul className="mt-2 list-disc list-inside text-sm">
            <li>ตรวจสอบ VITE_SUPABASE_URL</li>
            <li>ตรวจสอบ VITE_SUPABASE_SERVICE_ROLE_KEY</li>
            <li>ตั้งค่า VITE_USE_SERVICE_ROLE=true</li>
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ โหมด Admin:</strong> คุณกำลังใช้ Service Role Key ที่มีสิทธิ์เต็มในการจัดการฐานข้อมูล 
          ใช้ความระมัดระวังในการดำเนินการ
          {useServiceRole && <span className="block mt-1 text-green-600">✅ Service Role Mode เปิดใช้งานแล้ว</span>}
        </AlertDescription>
      </Alert>

      {/* Database Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            การติดตั้งฐานข้อมูล
          </CardTitle>
          <CardDescription>
            ติดตั้งตารางและข้อมูลเริ่มต้นสำหรับระบบ POS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleSetupDatabase}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              ติดตั้งฐานข้อมูล
            </Button>
            
            <Button 
              onClick={handleListTables}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              ตรวจสอบตาราง
            </Button>
            
            <Button 
              onClick={handleResetDatabase}
              disabled={loading}
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              รีเซ็ต
            </Button>
          </div>

          {/* Tables List */}
          {tables.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">ตารางที่มีอยู่ ({tables.length} ตาราง):</h4>
              <div className="grid grid-cols-3 gap-2">
                {tables.map((table) => (
                  <Badge key={table} variant="outline" className="justify-center">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom SQL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            รัน SQL แบบกำหนดเอง
          </CardTitle>
          <CardDescription>
            รันคำสั่ง SQL ด้วยสิทธิ์ Admin (ใช้ความระมัดระวัง)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="ใส่คำสั่ง SQL ที่ต้องการรัน..."
            value={customSQL}
            onChange={(e) => setCustomSQL(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          
          <Button 
            onClick={handleExecuteCustomSQL}
            disabled={loading || !customSQL.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            รัน SQL
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getResultIcon()}
              ผลลัพธ์
              {getResultBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-2">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ สำเร็จ:</strong> {result.message || result.summary || 'Operation completed successfully'}
                  </AlertDescription>
                </Alert>
                
                {result.results && (
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">รายละเอียด:</h4>
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                        {r.success ? '✅' : '❌'} {r.table || r.statement?.substring(0, 50)}
                        {r.error && <div className="text-red-600 mt-1">{r.error}</div>}
                        {r.requiresManualCreation && (
                          <div className="text-yellow-600 mt-1">⚠️ ต้องสร้างด้วยตนเอง</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.manualCreationRequired && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>⚠️ ต้องสร้างตารางด้วยตนเอง:</strong> บางตารางไม่สามารถสร้างอัตโนมัติได้
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open('/manual-database-setup', '_blank')}
                        >
                          ไปที่หน้าติดตั้งแบบ Manual
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ ล้มเหลว:</strong> {result.error}
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>💡 แนะนำ:</strong> ลองใช้วิธีการติดตั้งแบบ Manual
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('/manual-database-setup', '_blank')}
                      >
                        ไปที่หน้าติดตั้งแบบ Manual
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}