import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { checkPosSystemTables, checkPosSystemColumns } from '@/utils/checkPosSystem'
import { testDatabaseConnection } from '@/utils/testConnection'

interface TableResult {
  table: string
  exists: boolean
  status: string
  error?: string
  count?: number
}

interface SampleDataResult {
  table: string
  count: number
  status: string
  error?: string
  data?: any[]
}

interface RelationshipResult {
  relationship: string
  status: string
  error?: string
}

interface CheckResult {
  success: boolean
  summary?: {
    tablesFound: number
    totalTables: number
    status: string
  }
  tableResults?: TableResult[]
  sampleDataResults?: SampleDataResult[]
  relationshipResults?: RelationshipResult[]
  recommendations?: string[]
  error?: string
}

export default function CheckPosSystem() {
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'tables' | 'data' | 'relationships'>('tables')

  const runSystemCheck = async () => {
    setLoading(true)
    try {
      console.log('🚀 เริ่มตรวจสอบระบบ POS...')
      
      // ตรวจสอบการเชื่อมต่อก่อน
      const connResult = await testDatabaseConnection()
      setConnectionResult(connResult)
      
      if (!connResult.success) {
        setCheckResult({
          success: false,
          error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ' + connResult.error
        })
        return
      }
      
      // ตรวจสอบระบบ POS
      const result = await checkPosSystemTables()
      setCheckResult(result)
      
    } catch (error) {
      console.error('Error checking POS system:', error)
      setCheckResult({
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runSystemCheck()
  }, [])

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'bg-green-100 text-green-800'
    if (status.includes('⚠️')) return 'bg-yellow-100 text-yellow-800'
    if (status.includes('❌')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ตรวจสอบระบบ POS</h1>
          <p className="text-gray-600 mt-2">
            ตรวจสอบสถานะตาราง คอลัมน์ และความสัมพันธ์ของระบบ POS
          </p>
        </div>
        <Button onClick={runSystemCheck} disabled={loading}>
          {loading ? '🔄 กำลังตรวจสอบ...' : '🔍 ตรวจสอบใหม่'}
        </Button>
      </div>

      {/* Connection Status */}
      {connectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔌 สถานะการเชื่อมต่อฐานข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={connectionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {connectionResult.success ? '✅ เชื่อมต่อสำเร็จ' : '❌ เชื่อมต่อล้มเหลว'}
              </Badge>
              <span className="text-sm text-gray-600">
                {connectionResult.message || connectionResult.error}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {checkResult?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 สรุปผลการตรวจสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {checkResult.summary.tablesFound}
                </div>
                <div className="text-sm text-gray-600">ตารางที่พบ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {checkResult.summary.totalTables}
                </div>
                <div className="text-sm text-gray-600">ตารางที่ต้องการ</div>
              </div>
              <div className="text-center">
                <Badge className={getStatusColor(checkResult.summary.status)} variant="outline">
                  {checkResult.summary.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {checkResult?.error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">❌ ข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{checkResult.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {checkResult?.success && (
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tables'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 ตารางฐานข้อมูล
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 ข้อมูลตัวอย่าง
            </button>
            <button
              onClick={() => setActiveTab('relationships')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'relationships'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔗 ความสัมพันธ์
            </button>
          </div>

          {/* Tables Tab */}
          {activeTab === 'tables' && checkResult.tableResults && (
            <Card>
              <CardHeader>
                <CardTitle>📋 สถานะตารางฐานข้อมูล</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checkResult.tableResults.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {table.table}
                        </code>
                        <Badge className={getStatusColor(table.status)} variant="outline">
                          {table.status}
                        </Badge>
                      </div>
                      {table.error && (
                        <span className="text-sm text-red-600 max-w-md truncate">
                          {table.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Data Tab */}
          {activeTab === 'data' && checkResult.sampleDataResults && (
            <Card>
              <CardHeader>
                <CardTitle>📊 ข้อมูลตัวอย่าง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checkResult.sampleDataResults.map((sample, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {sample.table}
                          </code>
                          <Badge className={getStatusColor(sample.status)} variant="outline">
                            {sample.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            ({sample.count} รายการ)
                          </span>
                        </div>
                      </div>
                      
                      {sample.data && sample.data.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            ตัวอย่างข้อมูล:
                          </div>
                          <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                            <pre>{JSON.stringify(sample.data, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      
                      {sample.error && (
                        <div className="mt-2 text-sm text-red-600">
                          ข้อผิดพลาด: {sample.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relationships Tab */}
          {activeTab === 'relationships' && checkResult.relationshipResults && (
            <Card>
              <CardHeader>
                <CardTitle>🔗 ความสัมพันธ์ระหว่างตาราง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {checkResult.relationshipResults.map((rel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {rel.relationship}
                        </code>
                        <Badge className={getStatusColor(rel.status)} variant="outline">
                          {rel.status}
                        </Badge>
                      </div>
                      {rel.error && (
                        <span className="text-sm text-red-600 max-w-md truncate">
                          {rel.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recommendations */}
      {checkResult?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 คำแนะนำ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {checkResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}