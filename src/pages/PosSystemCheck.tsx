import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PosSystemCheck() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkTables = async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      console.log('🔍 เริ่มตรวจสอบตารางระบบ POS...')

      // ตารางที่ต้องการตรวจสอบ
      const requiredTables = [
        'branches',
        'employees', 
        'customers',
        'product_categories',
        'products',
        'product_inventory',
        'sales_transactions',
        'sales_transaction_items',
        'warehouses',
        'stock_movements',
        'purchase_orders',
        'purchase_order_items',
        'chart_of_accounts',
        'journal_entries',
        'journal_entry_lines',
        'accounting_transactions',
        'claims',
        'installment_plans',
        'installment_payments'
      ]

      const tableResults = []

      for (const tableName of requiredTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count', { count: 'exact', head: true })

          if (error) {
            console.log(`❌ ตาราง '${tableName}' ไม่พบ:`, error.message)
            tableResults.push({
              table: tableName,
              status: '❌ ไม่พบตาราง',
              error: error.message
            })
          } else {
            console.log(`✅ ตาราง '${tableName}' พร้อมใช้งาน`)
            tableResults.push({
              table: tableName,
              status: '✅ พร้อมใช้งาน'
            })
          }
        } catch (err) {
          console.log(`❌ ข้อผิดพลาดในการตรวจสอบตาราง '${tableName}':`, err)
          tableResults.push({
            table: tableName,
            status: '❌ ข้อผิดพลาด',
            error: String(err)
          })
        }
      }

      setResults(tableResults)

    } catch (error) {
      console.error('💥 การตรวจสอบระบบ POS ล้มเหลว:', error)
      setError(error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ')
    } finally {
      setLoading(false)
    }
  }

  const checkSampleData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('📊 ตรวจสอบข้อมูลตัวอย่าง...')

      const sampleTables = ['branches', 'product_categories', 'chart_of_accounts']
      const sampleResults = []

      for (const tableName of sampleTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(5)

          if (error) {
            sampleResults.push({
              table: tableName,
              status: '⚠️ ไม่สามารถอ่านข้อมูลได้',
              error: error.message,
              count: 0
            })
          } else {
            const count = data?.length || 0
            sampleResults.push({
              table: tableName,
              status: count > 0 ? '✅ มีข้อมูลตัวอย่าง' : '⚠️ ไม่มีข้อมูลตัวอย่าง',
              count,
              data: data?.slice(0, 2) // แสดงข้อมูล 2 รายการแรก
            })
          }
        } catch (err) {
          sampleResults.push({
            table: tableName,
            status: '❌ ข้อผิดพลาด',
            error: String(err),
            count: 0
          })
        }
      }

      setResults(sampleResults)

    } catch (error) {
      console.error('💥 การตรวจสอบข้อมูลตัวอย่างล้มเหลว:', error)
      setError(error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ตรวจสอบระบบ POS</h1>
          <p className="text-gray-600 mt-2">
            ตรวจสอบสถานะตารางและข้อมูลของระบบ POS
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={checkTables}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '🔄 กำลังตรวจสอบ...' : '🔍 ตรวจสอบตาราง'}
          </button>
          <button
            onClick={checkSampleData}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '🔄 กำลังตรวจสอบ...' : '📊 ตรวจสอบข้อมูล'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>ข้อผิดพลาด:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">ผลการตรวจสอบ</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {result.table}
                      </code>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.status.includes('✅') ? 'bg-green-100 text-green-800' :
                        result.status.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                      {result.count !== undefined && (
                        <span className="text-sm text-gray-600">
                          ({result.count} รายการ)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      ข้อผิดพลาด: {result.error}
                    </div>
                  )}
                  
                  {result.data && result.data.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        ตัวอย่างข้อมูล:
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 คำแนะนำ</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• หากตารางไม่พบ ให้รัน SQL script เพื่อสร้างตาราง</li>
          <li>• หากไม่มีข้อมูลตัวอย่าง ให้เพิ่มข้อมูลพื้นฐาน</li>
          <li>• ตรวจสอบการเชื่อมต่อฐานข้อมูล Supabase</li>
          <li>• ตรวจสอบ Environment Variables</li>
        </ul>
      </div>
    </div>
  )
}