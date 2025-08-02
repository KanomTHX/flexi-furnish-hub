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
import { Product } from "@/types/pos";
import { generateSaleNumber } from "@/utils/posHelpers";

export default function POS() {
  const { state, actions } = usePOS();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [customerManagementOpen, setCustomerManagementOpen] = useState(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false);
  const [currentSaleNumber] = useState(() => generateSaleNumber());

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    actions.addToCart(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleCheckout = () => {
    if (state.cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout.",
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
        title: "Sale Completed!",
        description: `Sale ${sale.saleNumber} has been completed successfully.`,
      });
      setCheckoutOpen(false);
    }
  };

  const handleClearCart = () => {
    if (state.cart.length > 0) {
      actions.clearCart();
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from cart.",
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

  const handleProductFoundByBarcode = (product: Product) => {
    handleAddToCart(product);
    toast({
      title: "Product Found!",
      description: `${product.name} added to cart via barcode scan.`,
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
          <h1 className="text-3xl font-bold text-foreground">POS Sales</h1>
          <p className="text-muted-foreground">Point of Sale - Cash transactions and receipt generation</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBarcodeScanner}>
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
          <Button variant="outline" onClick={handleClearCart} disabled={state.cart.length === 0}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear Cart
          </Button>
          <Button variant="admin" onClick={handleCheckout}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Checkout ({state.cart.length})
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onClearCart={handleClearCart}
        onShowCustomers={handleShowCustomers}
        onShowHistory={handleShowHistory}
        onBarcodeScanner={handleBarcodeScanner}
        cartItemCount={state.cart.length}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Product Selection */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Product Selection</CardTitle>
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
    </div>
  );
}