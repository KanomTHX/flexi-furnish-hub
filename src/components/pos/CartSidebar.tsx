import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart, Receipt } from 'lucide-react';
import { CartItem, POSState } from '@/types/pos';

interface CartSidebarProps {
  state: POSState;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (discount: number) => void;
  onCheckout: () => void;
}

export function CartSidebar({ 
  state, 
  onUpdateQuantity, 
  onRemoveItem, 
  onApplyDiscount,
  onCheckout 
}: CartSidebarProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleDiscountChange = (value: string) => {
    const discount = parseFloat(value) || 0;
    onApplyDiscount(discount);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          ตะกร้า ({state.cart.length} รายการ)
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {state.cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ตะกร้าของคุณว่างเปล่า</p>
              <p className="text-sm">เพิ่มสินค้าเพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.cart.map((item: CartItem) => (
                <div key={item.product.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.product.sku}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {state.cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            {/* Discount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ส่วนลด</label>
              <Input
                type="number"
                placeholder="ใส่จำนวนส่วนลด"
                value={state.discount || ''}
                onChange={(e) => handleDiscountChange(e.target.value)}
                min="0"
                max={state.subtotal}
              />
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ยอดรวมย่อย:</span>
                <span>{formatPrice(state.subtotal)}</span>
              </div>
              
              {state.discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>ส่วนลด:</span>
                  <span>-{formatPrice(state.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>ภาษี (7%):</span>
                <span>{formatPrice(state.tax)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span className="text-primary">{formatPrice(state.total)}</span>
              </div>
            </div>

            {/* Customer Info */}
            {state.customer && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">ลูกค้า:</p>
                <p className="text-sm">{state.customer.name}</p>
                {state.customer.phone && (
                  <p className="text-xs text-muted-foreground">{state.customer.phone}</p>
                )}
              </div>
            )}

            {/* Payment Method */}
            {state.paymentMethod && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {state.paymentMethod.icon} {state.paymentMethod.name}
                </Badge>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              onClick={onCheckout}
              className="w-full"
              size="lg"
              disabled={state.cart.length === 0}
            >
              <Receipt className="w-4 h-4 mr-2" />
              ดำเนินการชำระเงิน
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}