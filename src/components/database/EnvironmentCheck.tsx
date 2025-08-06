import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react'

export function EnvironmentCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const useServiceRole = import.meta.env.VITE_USE_SERVICE_ROLE === 'true'

  const checks = [
    {
      name: 'VITE_SUPABASE_URL',
      value: supabaseUrl,
      required: true,
      valid: supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl.includes('supabase.co')
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      value: supabaseAnonKey,
      required: true,
      valid: supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && supabaseAnonKey.length > 100
    },
    {
      name: 'VITE_SUPABASE_SERVICE_ROLE_KEY',
      value: supabaseServiceRoleKey,
      required: useServiceRole,
      valid: supabaseServiceRoleKey && supabaseServiceRoleKey !== 'YOUR_SERVICE_ROLE_KEY' && supabaseServiceRoleKey.length > 100
    },
    {
      name: 'VITE_USE_SERVICE_ROLE',
      value: import.meta.env.VITE_USE_SERVICE_ROLE,
      required: false,
      valid: true
    }
  ]

  const allValid = checks.filter(c => c.required).every(c => c.valid)
  const hasIssues = checks.some(c => c.required && !c.valid)

  if (allValid) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ Environment Variables OK:</strong> ทุกการตั้งค่าถูกต้อง
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          ปัญหาการตั้งค่า Environment Variables
        </CardTitle>
        <CardDescription>
          กรุณาตรวจสอบและแก้ไขการตั้งค่าต่อไปนี้
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasIssues && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>❌ การตั้งค่าไม่ถูกต้อง:</strong> ไม่สามารถเชื่อมต่อฐานข้อมูลได้
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {check.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-mono text-sm">{check.name}</span>
                {check.required && <Badge variant="outline" className="text-xs">Required</Badge>}
              </div>
              <div className="text-right">
                {check.valid ? (
                  <Badge className="bg-green-600">OK</Badge>
                ) : check.required ? (
                  <Badge variant="destructive">Missing</Badge>
                ) : (
                  <Badge variant="outline">Optional</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>วิธีแก้ไข:</strong>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
              <li>สร้างไฟล์ <code>.env.local</code> ในโฟลเดอร์หลักของโปรเจกต์</li>
              <li>คัดลอกเนื้อหาจากไฟล์ <code>.env.example</code></li>
              <li>แทนที่ค่าต่างๆ ด้วยค่าจริงจาก Supabase Dashboard</li>
              <li>รีสตาร์ทเซิร์ฟเวอร์ด้วย <code>npm run dev</code></li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">ตัวอย่างไฟล์ .env.local:</h4>
          <pre className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_USE_SERVICE_ROLE=true`}
          </pre>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>หาค่าเหล่านี้ได้ที่:</strong> Supabase Dashboard → Settings → API
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}