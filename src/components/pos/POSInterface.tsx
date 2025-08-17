import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store, Receipt, History, Settings, Scan, Search, Package, Star } from 'lucide-react';
import { Product } from '@/types/pos';
import { SerialNumber } from '@/types/serialNumber';
import { EnhancedProductSearch } from './EnhancedProductSearch';
import { CategorySearch } from './CategorySearch';
import { POSShoppingCart } from './POSShoppingCart';
import { BarcodeScanner } from './BarcodeScanner';
import { SalesHistory } from './SalesHistory';
import { POSSettings } from './POSSettings';
import { useBranchData } from '@/hooks/useBranchData';
import { useToast } from '@/hooks/use-toast';
import { usePOSIntegration } from '@/hooks/usePOSIntegration';
import { generateId } from '@/lib/utils';

interface CartItemWithSN {
  id: string;
  product: Product;
  quantity: number;
  serialNumbers: SerialNumber[];
  unitPrice: number;
  discount: number;
  discountType: 'percent' | 'amount';
  subtotal: number;
}

interface CheckoutData {
  items: CartItemWithSN[];
  subtotal: number;
  totalDiscount: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  customerInfo?: {
    name?: string;
    taxId?: string;
    address?: string;
  };
}

export function POSInterface() {
  const [cartItems, setCartItems] = useState<CartItemWithSN[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const { currentBranch } = useBranchData();
  const { toast } = useToast();
  const { 
    loading: posLoading, 
    error: posError, 
    checkStockAvailability, 
    handleSaleCompletion 
  } = usePOSIntegration();

  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = useCallback((product: Product, serialNumbers?: SerialNumber[]) => {
    const existingItemIndex = cartItems.findIndex(item => 
      item.product.id === product.id && 
      JSON.stringify(item.serialNumbers.map(sn => sn.id).sort()) === 
      JSON.stringify((serialNumbers || []).map(sn => sn.id).sort())
    );

    if (existingItemIndex >= 0) {
      // อัปเดตจำนวนสินค้าที่มีอยู่แล้ว
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + (serialNumbers?.length || 1);
      
      // ตรวจสอบสต็อก
      if (newQuantity > product.stock) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: `สินค้า ${product.name} มีสต็อกเพียง ${product.stock} ชิ้น`,
          variant: "destructive"
        });
        return;
      }

      existingItem.quantity = newQuantity;
      existingItem.subtotal = existingItem.unitPrice * newQuantity;
      
      if (serialNumbers) {
        existingItem.serialNumbers = [...existingItem.serialNumbers, ...serialNumbers];
      }
      
      setCartItems(updatedItems);
    } else {
      // เพิ่มสินค้าใหม่
      const quantity = serialNumbers?.length || 1;
      
      if (quantity > product.stock) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: `สินค้า ${product.name} มีสต็อกเพียง ${product.stock} ชิ้น`,
          variant: "destructive"
        });
        return;
      }

      const newItem: CartItemWithSN = {
        id: generateId(),
        product,
        quantity,
        serialNumbers: serialNumbers || [],
        unitPrice: product.price,
        discount: 0,
        discountType: 'percent',
        subtotal: product.price * quantity
      };
      
      setCartItems(prev => [...prev, newItem]);
    }

    // เปลี่ยนไปที่แท็บตะกร้าหลังเพิ่มสินค้า
    setActiveTab('cart');
  }, [cartItems, toast]);

  // อัปเดตรายการในตะกร้า
  const handleUpdateCartItem = useCallback((itemId: string, updates: Partial<CartItemWithSN>) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  // ลบรายการจากตะกร้า
  const handleRemoveCartItem = useCallback((itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    
    toast({
      title: "ลบรายการแล้ว",
      description: "รายการถูกลบออกจากตะกร้าแล้ว"
    });
  }, [toast]);

  // ล้างตะกร้า
  const handleClearCart = useCallback(() => {
    setCartItems([]);
    
    toast({
      title: "ล้างตะกร้าแล้ว",
      description: "รายการทั้งหมดถูกลบออกจากตะกร้าแล้ว"
    });
  }, [toast]);

  // จัดการการชำระเงิน
  const handleCheckout = useCallback(async (checkoutData: CheckoutData) => {
    try {
      // ตรวจสอบสต็อกก่อนชำระเงิน
      const stockCheckRequest = {
        items: checkoutData.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          warehouseId: currentBranch.warehouse_id
        }))
      };

      const stockCheck = await checkStockAvailability(stockCheckRequest);
      
      if (!stockCheck.success) {
        toast({
          title: "ตรวจสอบสต็อกไม่สำเร็จ",
          description: stockCheck.message,
          variant: "destructive"
        });
        return;
      }

      // ตรวจสอบว่าสินค้าทุกรายการมีสต็อกเพียงพอ
      const insufficientStock = stockCheck.availability.find(item => !item.isAvailable);
      if (insufficientStock) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: `สินค้า ID: ${insufficientStock.productId} มีสต็อกเพียง ${insufficientStock.available} ชิ้น แต่ต้องการ ${insufficientStock.requested} ชิ้น`,
          variant: "destructive"
        });
        return;
      }

      // สร้างข้อมูลการขาย
      const saleData = {
        id: generateId(),
        transactionNumber: `POS-${Date.now()}`,
        branchId: currentBranch.id,
        warehouseId: currentBranch.warehouse_id,
        items: checkoutData.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          subtotal: item.subtotal,
          serialNumbers: item.serialNumbers.map(sn => sn.serial_number)
        })),
        subtotal: checkoutData.subtotal,
        totalDiscount: checkoutData.totalDiscount,
        vatAmount: checkoutData.vatAmount,
        withholdingTaxAmount: checkoutData.withholdingTaxAmount,
        grandTotal: checkoutData.grandTotal,
        paymentMethod: checkoutData.paymentMethod,
        customerInfo: checkoutData.customerInfo,
        performedBy: 'current-user', // TODO: ใช้ข้อมูลผู้ใช้จริง
        createdAt: new Date(),
        status: 'completed'
      };

      // ดำเนินการขายและตัดสต็อก
      const saleResult = await handleSaleCompletion(saleData);
      
      if (saleResult.success) {
        toast({
          title: "ชำระเงินสำเร็จ",
          description: `ธุรกรรม ${saleData.transactionNumber} เสร็จสิ้น สต็อกได้รับการอัปเดตแล้ว`
        });
        
        // ล้างตะกร้าหลังชำระเงินสำเร็จ
        handleClearCart();
      } else {
        toast({
          title: "ชำระเงินไม่สำเร็จ",
          description: saleResult.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดำเนินการชำระเงินได้",
        variant: "destructive"
      });
    }
  }, [currentBranch, checkStockAvailability, handleSaleCompletion, handleClearCart, toast]);

  // จัดการการสแกนบาร์โค้ด
  const handleBarcodeFound = useCallback((product: Product) => {
    handleAddToCart(product);
    setShowBarcodeScanner(false);
    
    toast({
      title: "เพิ่มสินค้าสำเร็จ",
      description: `เพิ่ม ${product.name} ลงในตะกร้าแล้ว`
    });
  }, [handleAddToCart, toast]);

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  };

  if (!currentBranch) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">เลือกสาขา</h3>
            <p className="text-muted-foreground text-center">
              กรุณาเลือกสาขาก่อนใช้งานระบบ POS
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // แสดง SalesHistory หากเปิดใช้งาน
  if (showSalesHistory) {
    return (
      <SalesHistory onBack={() => setShowSalesHistory(false)} />
    );
  }

  // แสดง POSSettings หากเปิดใช้งาน
  if (showSettings) {
    return (
      <POSSettings onBack={() => setShowSettings(false)} />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-6 h-6" />
                ระบบขายหน้าร้าน (POS)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                สาขา: {currentBranch.name}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Cart Summary */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {getTotalItems()} รายการ
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB'
                  }).format(getTotalAmount())}
                </Badge>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBarcodeScanner(true)}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  สแกน
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSalesHistory(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  ประวัติ
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  ตั้งค่า
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Product Search */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                ค้นหาสินค้า
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                หมวดหมู่
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                รายการโปรด
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="mt-4 h-full">
              <EnhancedProductSearch 
                onAddToCart={handleAddToCart}
              />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-4 h-full">
              <CategorySearch 
                onAddToCart={handleAddToCart}
              />
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-4">
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>รายการสินค้าโปรด</p>
                    <p className="text-sm">ฟีเจอร์นี้จะพัฒนาในเวอร์ชันถัดไป</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Shopping Cart */}
        <div className="lg:col-span-1">
          <POSShoppingCart
            items={cartItems}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            vatRate={7}
            withholdingTaxRate={3}
            loading={posLoading}
          />
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สแกนบาร์โค้ด</DialogTitle>
          </DialogHeader>
          <BarcodeScanner
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onProductFound={handleBarcodeFound}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}