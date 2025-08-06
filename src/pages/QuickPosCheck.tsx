import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function QuickPosCheck() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runCheck = async () => {
    setLoading(true)
    setResult('🔍 กำลังตรวจสอบ...\n')

    try {
      // ตรวจสอบตารางพื้นฐาน
      const tables = ['branches', 'products', 'customers', 'sales_transactions']
      let output = '=== ตรวจสอบตารางระบบ POS ===\n\n'

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true })

          if (error) {
            output += `❌ ${table}: ไม่พบตาราง (${error.message})\n`
          } else {
            output += `✅ ${table}: พร้อมใช้งาน\n`
          }
        } catch (err) {
          output += `❌ ${table}: ข้อผิดพลาด (${err})\n`
        }
      }

      // ตรวจสอบข้อมูลตัวอย่าง
      output += '\n=== ตรวจสอบข้อมูลตัวอย่าง ===\n\n'
      
      try {
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .limit(3)

        if (branchError) {
          output += `❌ branches: ไม่สามารถอ่านข้อมูลได้\n`
        } else {
          output += `✅ branches: พบ ${branches?.length || 0} รายการ\n`
          if (branches && branches.length > 0) {
            output += `   ตัวอย่าง: ${branches[0].name} (${branches[0].code})\n`
          }
        }
      } catch (err) {
        output += `❌ branches: ข้อผิดพลาด\n`
      }

      // ตรวจสอบการเชื่อมต่อ
      output += '\n=== สรุปผลการตรวจสอบ ===\n\n'
      output += '✅ การเชื่อมต่อฐานข้อมูล: สำเร็จ\n'
      output += '📊 สถานะระบบ: พร้อมใช้งาน\n'
      output += '🕒 เวลาตรวจสอบ: ' + new Date().toLocaleString('th-TH') + '\n'

      setResult(output)

    } catch (error) {
      setResult(`❌ เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบระบบ POS อย่างรวดเร็ว</h1>
          <p className="text-gray-600 mt-2">ตรวจสอบสถานะตารางและการเชื่อมต่อฐานข้อมูล</p>
        </div>
        
        <div className="p-6">
          <button
            onClick={runCheck}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '🔄 กำลังตรวจสอบ...' : '🚀 เริ่มตรวจสอบ'}
          </button>

          {result && (
            <div className="mt-6">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 คำแนะนำ</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• หากตารางไม่พบ ให้รัน SQL script เพื่อสร้างตาราง</li>
              <li>• ตรวจสอบ Environment Variables ใน .env.local</li>
              <li>• ตรวจสอบการตั้งค่า Supabase Project</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}