import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, RotateCcw, Scan } from "lucide-react";
import { usePOS } from "@/hooks/usePOS";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSidebar } from "@/components/pos/CartSidebar";
import { ReceiptPreview } from "@/components/pos/ReceiptPreview";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { QuickActions } from "@/components/pos/QuickActions";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { CustomerManagementDialog } from "@/components/pos/CustomerManagementDialog";
import { SalesHistoryDialog } from "@/components/pos/SalesHistoryDialog";
import { CalculatorDialog } from "@/components/pos/CalculatorDialog";
import { SettingsDialog } from "@/components/pos/SettingsDialog";
import { Product } from "@/types/pos";
import { generateSaleNumber } from "@/utils/posHelpers";

export default function POS() {
  const { state, actions } = usePOS();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [customerManagementOpen, setCustomerManagementOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentSaleNumber] = useState(() => generateSaleNumber());

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "สินค้าหมด",
        description: `${product.name} ไม่มีสต็อกในขณะนี้`,
        variant: "destructive"
      });
      return;
    }

    actions.addToCart(product);
    toast({
      title: "เพิ่มลงตะกร้าแล้ว",
      description: `${product.name} ได้ถูกเพิ่มลงในตะกร้าของคุณแล้ว`,
    });
  };

  const handleCheckout = () => {
    if (state.cart.length === 0) {
      toast({
        title: "ตะกร้าว่าง",
        description: "กรุณาเพิ่มสินค้าลงตะกร้าก่อนชำระเงิน",
        variant: "destructive"
      });
      return;
    }
    setCheckoutOpen(true);
  };

  const handleCompleteSale = () => {
    const sale = actions.completeCashSale();
    if (sale) {
      toast({
        title: "ขายสำเร็จ!",
        description: `การขาย ${sale.saleNumber} เสร็จสิ้นเรียบร้อยแล้ว`,
      });
      setCheckoutOpen(false);
    }
  };

  const handleClearCart = () => {
    if (state.cart.length > 0) {
      actions.clearCart();
      toast({
        title: "ล้างตะกร้าแล้ว",
        description: "สินค้าทั้งหมดถูกลบออกจากตะกร้าแล้ว",
      });
    }
  };

  const handleShowCustomers = () => {
    setCustomerManagementOpen(true);
  };

  const handleShowHistory = () => {
    setSalesHistoryOpen(true);
  };

  const handleBarcodeScanner = () => {
    setScannerOpen(true);
  };

  const handleShowCalculator = () => {
    setCalculatorOpen(true);
  };

  const handleShowSettings = () => {
    setSettingsOpen(true);
  };

  const handleProductFoundByBarcode = (product: Product) => {
    handleAddToCart(product);
    toast({
      title: "พบสินค้าแล้ว!",
      description: `${product.name} ถูกเพิ่มลงตะกร้าผ่านการสแกนบาร์โค้ด`,
    });
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNewSale: () => actions.clearCart(),
    onCheckout: handleCheckout,
    onClearCart: handleClearCart,
    onBarcodeScanner: handleBarcodeScanner,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ระบบขาย POS</h1>
          <p className="text-muted-foreground">จุดขาย - ธุรกรรมเงินสดและการออกใบเสร็จ</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBarcodeScanner}>
            <Scan className="w-4 h-4 mr-2" />
            สแกนบาร์โค้ด
          </Button>
          <Button variant="outline" onClick={handleClearCart} disabled={state.cart.length === 0}>
            <RotateCcw className="w-4 h-4 mr-2" />
            ล้างตะกร้า
          </Button>
          <Button variant="admin" onClick={handleCheckout}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            ชำระเงิน ({state.cart.length})
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onClearCart={handleClearCart}
        onShowCustomers={handleShowCustomers}
        onShowHistory={handleShowHistory}
        onBarcodeScanner={handleBarcodeScanner}
        onShowCalculator={handleShowCalculator}
        onShowSettings={handleShowSettings}
        cartItemCount={state.cart.length}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Product Selection */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>เลือกสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductGrid onAddToCart={handleAddToCart} />
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="xl:col-span-1">
          <CartSidebar
            state={state}
            onUpdateQuantity={actions.updateQuantity}
            onRemoveItem={actions.removeFromCart}
            onApplyDiscount={actions.applyDiscount}
            onCheckout={handleCheckout}
          />
        </div>

        {/* Receipt Preview */}
        <div className="xl:col-span-1">
          <ReceiptPreview 
            state={state} 
            saleNumber={currentSaleNumber}
          />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        state={state}
        onSetCustomer={actions.setCustomer}
        onSetPaymentMethod={actions.setPaymentMethod}
        onCompleteSale={handleCompleteSale}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onProductFound={handleProductFoundByBarcode}
      />

      {/* Customer Management Dialog */}
      <CustomerManagementDialog
        open={customerManagementOpen}
        onOpenChange={setCustomerManagementOpen}
      />

      {/* Sales History Dialog */}
      <SalesHistoryDialog
        open={salesHistoryOpen}
        onOpenChange={setSalesHistoryOpen}
        sales={state.sales}
        onRefresh={() => {
          // Refresh sales data if needed
          toast({
            title: "รีเฟรชข้อมูล",
            description: "ข้อมูลการขายได้รับการอัปเดตแล้ว",
          });
        }}
      />

      {/* Calculator Dialog */}
      <CalculatorDialog
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}