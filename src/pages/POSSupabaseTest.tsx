import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Package, 
  ShoppingCart, 
  CheckCircle, 
  AlertTriangle,
  Play,
  RotateCcw,
  Loader2,
  Eye
} from 'lucide-react'
import { useSupabasePOS } from '@/hooks/useSupabasePOS'
import { useBranchData } from '@/hooks/useBranchData'
import { useToast } from '@/hooks/use-toast'

export default function POSSupabaseTest() {
  const { 
    products, 
    categories, 
    loading, 
    error,
    fetchProducts, 
    fetchCategories,
    createSalesTransaction,
    getProductStock,
    fetchSalesTransactions
  } = useSupabasePOS()
  
  const { currentBranch } = useBranchData()
  const { toast } = useToast()
  
  const [testResults, setTestResults] = useState<any[]>([])
  const [salesTransactions, setSalesTransactions] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [productStock, setProductStock] = useState<any>(null)

  const runTest = async (testName: string, testFn: () => Promise<boolean>, description: string) => {
    try {
      const result = await testFn()
      const testResult = {
        name: testName,
        description,
        passed: result,
        timestamp: new Date().toLocaleTimeString()
      }
      setTestResults(prev => [...prev, testResult])
      
      if (result) {
        toast({
          title: `✅ ${testName}`,
          description: "ทดสอบผ่าน",
        })
      } else {
        toast({
          title: `❌ ${testName}`,
          description: "ทดสอบไม่ผ่าน",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      const testResult = {
        name: testName,
        description,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      }
      setTestResults(prev => [...prev, testResult])
      
      toast({
        title: `❌ ${testName}`,
        description: `Error: ${testResult.error}`,
        variant: "destructive"
      })
      
      return false
    }
  }

  const testFetchCategories = async () => {
    const result = await fetchCategories()
    return result.length > 0
  }

  const testFetchProducts = async () => {
    if (!currentBranch) return false
    const result = await fetchProducts(currentBranch.id)
    return result.length > 0
  }

  const testGetProductStock = async () => {
    if (!currentBranch || products.length === 0) return false
    const firstProduct = products[0]
    const stock = await getProductStock(firstProduct.id, currentBranch.id)
    setProductStock(stock)
    return stock !== null
  }

  const testCreateSalesTransaction = async () => {
    if (!currentBranch || products.length === 0) return false
    
    const testProduct = products[0]
    const transactionData = {
      branch_id: currentBranch.id,
      employee_id: 'test-employee',
      items: [{
        product_id: testProduct.id,
        quantity: 1,
        unit_price: testProduct.selling_price,
        discount_amount: 0
      }],
      total_amount: testProduct.selling_price,
      discount_amount: 0,
      tax_amount: testProduct.selling_price * 0.07,
      payment_method: 'cash' as const,
      notes: 'ทดสอบการขาย'
    }

    try {
      const result = await createSalesTransaction(transactionData)
      return result !== null
    } catch (error) {
      console.error('Test transaction error:', error)
      return false
    }
  }

  const testFetchSalesTransactions = async () => {
    if (!currentBranch) return false
    const result = await fetchSalesTransactions(currentBranch.id, 10)
    setSalesTransactions(result)
    return Array.isArray(result)
  }

  const runAllTests = async () => {
    setTestResults([])
    
    await runTest('ดึงข้อมูลหมวดหมู่สินค้า', testFetchCategories, 'ทดสอบการดึงข้อมูลหมวดหมู่สินค้าจาก Supabase')
    await runTest('ดึงข้อมูลสินค้า', testFetchProducts, 'ทดสอบการดึงข้อมูลสินค้าจาก Supabase')
    await runTest('ตรวจสอบสต็อกสินค้า', testGetProductStock, 'ทดสอบการดึงข้อมูลสต็อกสินค้า')
    await runTest('สร้างธุรกรรมการขาย', testCreateSalesTransaction, 'ทดสอบการสร้างธุรกรรมการขายใหม่')
    await runTest('ดึงข้อมูลการขาย', testFetchSalesTransactions, 'ทดสอบการดึงข้อมูลประวัติการขาย')
  }

  const clearResults = () => {
    setTestResults([])
    setSalesTransactions([])
    setProductStock(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price)
  }

  const passedTests = testResults.filter(test => test.passed).length
  const totalTests = testResults.length

  // Auto-load data on mount
  useEffect(() => {
    if (currentBranch) {
      fetchCategories()
      fetchProducts(currentBranch.id)
    }
  }, [currentBranch, fetchCategories, fetchProducts])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          ทดสอบการเชื่อมต่อ POS กับ Supabase
        </h1>
        <p className="text-muted-foreground">
          ทดสอบการทำงานของระบบ POS กับฐานข้อมูล Supabase
        </p>
      </div>

      {/* Branch Info */}
      {currentBranch ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>สาขาปัจจุบัน:</strong> {currentBranch.name} ({currentBranch.code})
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ไม่พบข้อมูลสาขา:</strong> กรุณาเลือกสาขาก่อนทดสอบ
          </AlertDescription>
        </Alert>
      )}

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            การควบคุมการทดสอบ
          </CardTitle>
          <CardDescription>
            รันการทดสอบเพื่อตรวจสอบการเชื่อมต่อกับ Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={runAllTests} 
              disabled={loading || !currentBranch}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              รันการทดสอบทั้งหมด
            </Button>
            <Button variant="outline" onClick={clearResults} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              ล้างผลลัพธ์
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {passedTests === totalTests ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-medium">
                  ผลการทดสอบ: {passedTests}/{totalTests} ผ่าน
                </span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ข้อผิดพลาด:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="status">สถานะ</TabsTrigger>
          <TabsTrigger value="categories">หมวดหมู่</TabsTrigger>
          <TabsTrigger value="products">สินค้า</TabsTrigger>
          <TabsTrigger value="sales">การขาย</TabsTrigger>
          <TabsTrigger value="results">ผลทดสอบ</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">หมวดหมู่สินค้า</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">หมวดหมู่</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การขาย</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesTransactions.length}</div>
                <p className="text-xs text-muted-foreground">ธุรกรรม</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สถานะ</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : error ? (
                    <span className="text-red-600">Error</span>
                  ) : (
                    <span className="text-green-600">OK</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">การเชื่อมต่อ</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>หมวดหมู่สินค้า</CardTitle>
              <CardDescription>
                รายการหมวดหมู่สินค้าจาก Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบหมวดหมู่สินค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-muted-foreground">รหัส: {category.code}</p>
                        <Badge variant="outline">{category.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สินค้าในระบบ</CardTitle>
              <CardDescription>
                รายการสินค้าจาก Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบสินค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">รหัส: {product.product_code}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600">
                            {formatPrice(product.selling_price)}
                          </span>
                          <Badge variant="outline">
                            {product.category?.name || 'ไม่ระบุ'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (currentBranch) {
                              const stock = await getProductStock(product.id, currentBranch.id)
                              setSelectedProduct(product)
                              setProductStock(stock)
                            }
                          }}
                          className="w-full"
                        >
                          ตรวจสอบสต็อก
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct && productStock && (
                <Alert className="mt-4">
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    <strong>สต็อก {selectedProduct.name}:</strong> {productStock.available_quantity} ชิ้น 
                    (สถานะ: {productStock.status})
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการขาย</CardTitle>
              <CardDescription>
                รายการการขายจาก Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบประวัติการขาย</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{transaction.transaction_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            {formatPrice(transaction.net_amount)}
                          </p>
                          <Badge variant="outline">
                            {transaction.payment_method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ผลการทดสอบ</CardTitle>
              <CardDescription>
                รายละเอียดผลการทดสอบแต่ละข้อ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีผลการทดสอบ</p>
                  <p className="text-sm">คลิก "รันการทดสอบทั้งหมด" เพื่อเริ่มต้น</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((test, index) => (
                    <Alert key={index} variant={test.passed ? "default" : "destructive"}>
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>{test.name}</strong>
                                <p className="text-sm mt-1">{test.description}</p>
                                {test.error && (
                                  <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant={test.passed ? "default" : "destructive"}>
                                  {test.passed ? "ผ่าน" : "ไม่ผ่าน"}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">{test.timestamp}</p>
                              </div>
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}