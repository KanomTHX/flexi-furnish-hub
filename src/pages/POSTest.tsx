import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard,
  CheckCircle, 
  AlertTriangle,
  Play,
  RotateCcw,
  Eye
} from 'lucide-react'
import { usePOS } from '@/hooks/usePOS'
import { mockProducts } from '@/data/mockProducts'
import { useToast } from '@/hooks/use-toast'

export default function POSTest() {
  const { state, actions } = usePOS()
  const { toast } = useToast()
  const [testResults, setTestResults] = useState<any[]>([])

  const runTest = (testName: string, testFn: () => boolean, description: string) => {
    try {
      const result = testFn()
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

  const testAddToCart = () => {
    const initialCartLength = state.cart.length
    const testProduct = mockProducts[0]
    actions.addToCart(testProduct)
    return state.cart.length === initialCartLength + 1
  }

  const testUpdateQuantity = () => {
    if (state.cart.length === 0) {
      actions.addToCart(mockProducts[0])
    }
    const productId = state.cart[0].product.id
    const initialQuantity = state.cart[0].quantity
    actions.updateQuantity(productId, initialQuantity + 1)
    const updatedItem = state.cart.find(item => item.product.id === productId)
    return updatedItem ? updatedItem.quantity === initialQuantity + 1 : false
  }

  const testRemoveFromCart = () => {
    if (state.cart.length === 0) {
      actions.addToCart(mockProducts[0])
    }
    const initialCartLength = state.cart.length
    const productId = state.cart[0].product.id
    actions.removeFromCart(productId)
    return state.cart.length === initialCartLength - 1
  }

  const testApplyDiscount = () => {
    if (state.cart.length === 0) {
      actions.addToCart(mockProducts[0])
    }
    const discountAmount = 100
    actions.applyDiscount(discountAmount)
    return state.discount === discountAmount
  }

  const testCalculateTotals = () => {
    actions.clearCart()
    actions.addToCart(mockProducts[0], 2) // เพิ่มสินค้า 2 ชิ้น
    
    const expectedSubtotal = mockProducts[0].price * 2
    const expectedTax = (expectedSubtotal - state.discount) * 0.07
    const expectedTotal = expectedSubtotal - state.discount + expectedTax
    
    return Math.abs(state.subtotal - expectedSubtotal) < 0.01 &&
           Math.abs(state.total - expectedTotal) < 0.01
  }

  const testSetCustomer = () => {
    const testCustomer = {
      id: 'test-customer',
      name: 'ลูกค้าทดสอบ',
      phone: '081-234-5678'
    }
    actions.setCustomer(testCustomer)
    return state.customer?.id === testCustomer.id
  }

  const testSetPaymentMethod = () => {
    const testPaymentMethod = {
      id: 'cash',
      name: 'เงินสด',
      type: 'cash' as const,
      icon: '💵'
    }
    actions.setPaymentMethod(testPaymentMethod)
    return state.paymentMethod?.id === testPaymentMethod.id
  }

  const testClearCart = () => {
    // เพิ่มสินค้าก่อน
    actions.addToCart(mockProducts[0])
    actions.setCustomer({ id: 'test', name: 'Test Customer' })
    actions.applyDiscount(50)
    
    // ล้างตะกร้า
    actions.clearCart()
    
    return state.cart.length === 0 && 
           state.customer === undefined && 
           state.discount === 0
  }

  const runAllTests = () => {
    setTestResults([])
    
    // รันทดสอบทีละข้อ
    setTimeout(() => runTest('เพิ่มสินค้าลงตะกร้า', testAddToCart, 'ทดสอบการเพิ่มสินค้าลงในตะกร้า'), 100)
    setTimeout(() => runTest('อัปเดตจำนวนสินค้า', testUpdateQuantity, 'ทดสอบการเปลี่ยนจำนวนสินค้าในตะกร้า'), 200)
    setTimeout(() => runTest('ลบสินค้าจากตะกร้า', testRemoveFromCart, 'ทดสอบการลบสินค้าออกจากตะกร้า'), 300)
    setTimeout(() => runTest('ใช้ส่วนลด', testApplyDiscount, 'ทดสอบการใช้ส่วนลดกับสินค้า'), 400)
    setTimeout(() => runTest('คำนวณยอดรวม', testCalculateTotals, 'ทดสอบการคำนวณยอดรวม ภาษี และยอดสุทธิ'), 500)
    setTimeout(() => runTest('ตั้งค่าลูกค้า', testSetCustomer, 'ทดสอบการเลือกลูกค้าสำหรับการขาย'), 600)
    setTimeout(() => runTest('ตั้งค่าวิธีชำระเงิน', testSetPaymentMethod, 'ทดสอบการเลือกวิธีการชำระเงิน'), 700)
    setTimeout(() => runTest('ล้างตะกร้า', testClearCart, 'ทดสอบการล้างข้อมูลตะกร้าทั้งหมด'), 800)
  }

  const clearResults = () => {
    setTestResults([])
    actions.clearCart()
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <ShoppingCart className="h-8 w-8 text-blue-600" />
          ทดสอบระบบ POS
        </h1>
        <p className="text-muted-foreground">
          ทดสอบการทำงานของระบบจุดขายและการจัดการตะกร้าสินค้า
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            การควบคุมการทดสอบ
          </CardTitle>
          <CardDescription>
            รันการทดสอบเพื่อตรวจสอบการทำงานของระบบ POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={runAllTests} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              รันการทดสอบทั้งหมด
            </Button>
            <Button variant="outline" onClick={clearResults} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              ล้างผลลัพธ์
            </Button>
            <Button variant="outline" onClick={() => actions.clearCart()} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              ล้างตะกร้า
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
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">สถานะปัจจุบัน</TabsTrigger>
          <TabsTrigger value="cart">ตะกร้าสินค้า</TabsTrigger>
          <TabsTrigger value="products">สินค้า</TabsTrigger>
          <TabsTrigger value="results">ผลการทดสอบ</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าในตะกร้า</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{state.cart.length}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดรวมย่อย</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(state.subtotal)}</div>
                <p className="text-xs text-muted-foreground">ก่อนภาษีและส่วนลด</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ส่วนลด</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatPrice(state.discount)}</div>
                <p className="text-xs text-muted-foreground">ส่วนลดที่ใช้</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดสุทธิ</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatPrice(state.total)}</div>
                <p className="text-xs text-muted-foreground">รวมภาษี 7%</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer and Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.customer ? (
                  <div className="space-y-2">
                    <p><strong>ชื่อ:</strong> {state.customer.name}</p>
                    {state.customer.phone && <p><strong>เบอร์:</strong> {state.customer.phone}</p>}
                    {state.customer.email && <p><strong>อีเมล:</strong> {state.customer.email}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">ยังไม่ได้เลือกลูกค้า</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  วิธีชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.paymentMethod ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{state.paymentMethod.icon}</span>
                    <span>{state.paymentMethod.name}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">ยังไม่ได้เลือกวิธีชำระเงิน</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายการสินค้าในตะกร้า</CardTitle>
              <CardDescription>
                สินค้าที่เลือกไว้สำหรับการขาย
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ตะกร้าว่างเปล่า</p>
                  <p className="text-sm">รันการทดสอบเพื่อเพิ่มสินค้า</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.cart.map((item, index) => (
                    <div key={item.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                        <p className="text-sm">ราคา: {formatPrice(item.unitPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">จำนวน: {item.quantity}</p>
                        <p className="font-bold text-blue-600">{formatPrice(item.totalPrice)}</p>
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
              <CardTitle>สินค้าที่มีในระบบ</CardTitle>
              <CardDescription>
                รายการสินค้าทั้งหมดที่สามารถขายได้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600">{formatPrice(product.price)}</span>
                        <Badge variant={product.stock > 10 ? "default" : "secondary"}>
                          สต็อก: {product.stock}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => actions.addToCart(product)}
                        className="w-full"
                      >
                        เพิ่มลงตะกร้า
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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