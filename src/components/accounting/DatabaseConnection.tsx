import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { supabase, dbHelpers } from '@/lib/supabase'
import { testDatabaseConnection, testEnvironmentVariables } from '@/utils/testConnection'

interface ConnectionStatus {
  connected: boolean
  tablesCount: number
  lastChecked: Date
  error?: string
}

export function DatabaseConnection() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    tablesCount: 0,
    lastChecked: new Date()
  })
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setLoading(true)
      setStatus(prev => ({ ...prev, error: undefined }))

      // Test environment variables first
      const envTest = await testEnvironmentVariables()
      if (!envTest.success) {
        throw new Error(envTest.error)
      }

      // Test database connection
      const connectionTest = await testDatabaseConnection()
      if (!connectionTest.success) {
        throw new Error(connectionTest.error)
      }

      setStatus({
        connected: true,
        tablesCount: connectionTest.tablesFound || 0,
        lastChecked: new Date(),
        error: undefined
      })

    } catch (error) {
      console.error('Database connection error:', error)
      setStatus({
        connected: false,
        tablesCount: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    await checkConnection()
    setTesting(false)
  }

  const getStatusColor = () => {
    if (loading || testing) return 'default'
    return status.connected ? 'success' : 'destructive'
  }

  const getStatusText = () => {
    if (loading) return 'กำลังตรวจสอบ...'
    if (testing) return 'กำลังทดสอบ...'
    return status.connected ? 'เชื่อมต่อแล้ว' : 'ไม่สามารถเชื่อมต่อได้'
  }

  const getStatusIcon = () => {
    if (loading || testing) return <Loader2 className="h-4 w-4 animate-spin" />
    return status.connected ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          สถานะการเชื่อมต่อฐานข้อมูล
        </CardTitle>
        <CardDescription>
          ตรวจสอบการเชื่อมต่อกับ Supabase Database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">สถานะการเชื่อมต่อ:</span>
          </div>
          <Badge variant={getStatusColor() as any}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Connection Details */}
        {status.connected && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">จำนวนตาราง:</span>
              <span className="ml-2 font-medium">{status.tablesCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ตรวจสอบล่าสุด:</span>
              <span className="ml-2 font-medium">
                {status.lastChecked.toLocaleTimeString('th-TH')}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>ข้อผิดพลาด:</strong> {status.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Help */}
        {!status.connected && !loading && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>วิธีแก้ไข:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>ตรวจสอบไฟล์ .env.local ว่ามี SUPABASE_URL และ SUPABASE_ANON_KEY</li>
                <li>ตรวจสอบว่าได้รันไฟล์ CREATE_POS_SYSTEM_TABLES.sql ใน Supabase แล้ว</li>
                <li>ตรวจสอบการตั้งค่า RLS (Row Level Security) ใน Supabase</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={testing || loading}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            ทดสอบการเชื่อมต่อ
          </Button>

          {status.connected && (
            <Button 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              variant="outline"
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              เปิด Supabase Dashboard
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {status.connected && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">ข้อมูลเบื้องต้น</h4>
            <QuickStats />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickStats() {
  const [stats, setStats] = useState<{
    branches: number
    transactions: number
    loading: boolean
  }>({
    branches: 0,
    transactions: 0,
    loading: true
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [branches, transactions] = await Promise.all([
        dbHelpers.getBranches(),
        dbHelpers.getAccountingTransactions()
      ])

      setStats({
        branches: branches.length,
        transactions: transactions.length,
        loading: false
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  if (stats.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดสถิติ...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">สาขา:</span>
        <span className="font-medium">{stats.branches}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">ธุรกรรม:</span>
        <span className="font-medium">{stats.transactions}</span>
      </div>
    </div>
  )
}