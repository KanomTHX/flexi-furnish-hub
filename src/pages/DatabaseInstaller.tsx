import React from 'react'
import { AdminDatabaseManager } from '@/components/database/AdminDatabaseManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Server, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react'

export default function DatabaseInstaller() {
  const requiredTables = [
    'branches', 'employees', 'customers', 'product_categories', 'products', 
    'product_inventory', 'sales_transactions', 'sales_transaction_items',
    'warehouses', 'stock_movements', 'purchase_orders', 'purchase_order_items',
    'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 
    'accounting_transactions', 'claims', 'installment_plans', 'installment_payments'
  ]

  const systemModules = [
    { name: 'ระบบหลัก', tables: ['branches', 'employees'], color: 'bg-blue-500' },
    { name: 'ระบบ POS', tables: ['customers', 'product_categories', 'products', 'product_inventory', 'sales_transactions', 'sales_transaction_items'], color: 'bg-green-500' },
    { name: 'ระบบคลัง', tables: ['warehouses', 'stock_movements', 'purchase_orders', 'purchase_order_items'], color: 'bg-orange-500' },
    { name: 'ระบบบัญชี', tables: ['chart_of_accounts', 'journal_entries', 'journal_entry_lines', 'accounting_transactions'], color: 'bg-purple-500' },
    { name: 'ระบบเคลม', tables: ['claims'], color: 'bg-red-500' },
    { name: 'ระบบผ่อนชำระ', tables: ['installment_plans', 'installment_payments'], color: 'bg-indigo-500' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          ติดตั้งฐานข้อมูลระบบ POS
        </h1>
        <p className="text-muted-foreground">
          ติดตั้งและจัดการตารางฐานข้อมูลสำหรับระบบ POS ครบถ้วน 19 ตาราง
        </p>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            ภาพรวมระบบ
          </CardTitle>
          <CardDescription>
            ระบบ POS ประกอบด้วย 6 โมดูลหลัก รวม {requiredTables.length} ตาราง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemModules.map((module) => (
              <div key={module.name} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${module.color}`}></div>
                  <h3 className="font-semibold">{module.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {module.tables.length} ตาราง
                </p>
                <div className="flex flex-wrap gap-1">
                  {module.tables.map((table) => (
                    <Badge key={table} variant="outline" className="text-xs">
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>📋 ข้อมูลที่จะติดตั้ง:</strong>
            <ul className="mt-2 list-disc list-inside text-sm space-y-1">
              <li>ตารางฐานข้อมูล 19 ตาราง</li>
              <li>Indexes สำหรับประสิทธิภาพ</li>
              <li>Triggers สำหรับ auto-update</li>
              <li>ข้อมูลตัวอย่างพื้นฐาน</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>⚠️ คำเตือนสำคัญ:</strong>
            <ul className="mt-2 list-disc list-inside text-sm space-y-1">
              <li>การติดตั้งจะลบข้อมูลเก่าทั้งหมด</li>
              <li>ต้องใช้ Service Role Key</li>
              <li>ไม่สามารถย้อนกลับได้</li>
              <li>สำรองข้อมูลก่อนติดตั้ง</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ข้อกำหนดเบื้องต้น
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">โปรเจกต์ Supabase ที่พร้อมใช้งาน</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Service Role Key ที่ถูกต้อง</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Environment Variables ที่ตั้งค่าแล้ว</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">การเชื่อมต่ออินเทอร์เน็ตที่เสถียร</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Manager */}
      <AdminDatabaseManager />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>คำแนะนำการใช้งาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. การติดตั้งครั้งแรก</h4>
            <p className="text-sm text-muted-foreground">
              คลิกปุ่ม "ติดตั้งฐานข้อมูล" เพื่อสร้างตารางทั้งหมดพร้อมข้อมูลตัวอย่าง
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. การตรวจสอบสถานะ</h4>
            <p className="text-sm text-muted-foreground">
              คลิกปุ่ม "ตรวจสอบตาราง" เพื่อดูรายชื่อตารางที่มีอยู่ในฐานข้อมูล
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">3. การรีเซ็ต</h4>
            <p className="text-sm text-muted-foreground">
              คลิกปุ่ม "รีเซ็ต" เพื่อลบตารางทั้งหมด (ใช้ความระมัดระวัง)
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">4. การรัน SQL กำหนดเอง</h4>
            <p className="text-sm text-muted-foreground">
              ใช้ช่อง "รัน SQL แบบกำหนดเอง" สำหรับคำสั่ง SQL เฉพาะ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}