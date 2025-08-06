import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, RotateCcw, Scan, Building2, Eye } from "lucide-react";
import { usePOS } from "@/hooks/usePOS";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useBranchData } from "../hooks/useBranchData";
import { BranchSelector } from "../components/branch/BranchSelector";
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
  const { state, actions, loading } = usePOS();
  const { toast } = useToast();
  const { currentBranch, currentBranchCustomers } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
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

  const handleCompleteSale = async () => {
    try {
      const sale = await actions.completeCashSale();
      if (sale) {
        toast({
          title: "ขายสำเร็จ!",
          description: `การขาย ${sale.saleNumber} เสร็จสิ้นเรียบร้อยแล้ว`,
        });
        setCheckoutOpen(false);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการขายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
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
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ระบบขาย POS</h1>
            <p className="text-muted-foreground">จุดขาย - ธุรกรรมเงินสดและการออกใบเสร็จ</p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <span className="text-xs text-blue-600">({currentBranchCustomers.length} ลูกค้า)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>
          <Button variant="outline" onClick={handleBarcodeScanner}>
            <Scan className="w-4 h-4 mr-2" />
            สแกนบาร์โค้ด
          </Button>
          <Button variant="outline" onClick={handleClearCart} disabled={state.cart.length === 0}>
            <RotateCcw className="w-4 h-4 mr-2" />
            ล้างตะกร้า
          </Button>
          <Button variant="admin" onClick={handleCheckout} disabled={loading}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {loading ? 'กำลังประมวลผล...' : `ชำระเงิน (${state.cart.length})`}
          </Button>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

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