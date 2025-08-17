import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Minus, ShoppingCart, Receipt, Percent, Calculator } from 'lucide-react';
import { Product } from '@/types/pos';
import { SerialNumber } from '@/types/serialNumber';
import { useToast } from '@/hooks/use-toast';

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

interface POSShoppingCartProps {
  items: CartItemWithSN[];
  onUpdateItem: (itemId: string, updates: Partial<CartItemWithSN>) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: (cartData: CheckoutData) => void;
  vatRate?: number;
  withholdingTaxRate?: number;
  loading?: boolean;
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

export function POSShoppingCart({ 
  items, 
  onUpdateItem, 
  onRemoveItem, 
  onClearCart, 
  onCheckout,
  vatRate = 7,
  withholdingTaxRate = 3,
  loading = false
}: POSShoppingCartProps) {
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'amount'>('percent');
  const [includeVAT, setIncludeVAT] = useState(true);
  const [includeWithholdingTax, setIncludeWithholdingTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    taxId: '',
    address: ''
  });
  
  const { toast } = useToast();

  // คำนวณยอดรวม
  const calculations = {
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    itemDiscount: items.reduce((sum, item) => {
      if (item.discountType === 'percent') {
        return sum + (item.unitPrice * item.quantity * item.discount / 100);
      }
      return sum + item.discount;
    }, 0),
    globalDiscountAmount: 0,
    vatAmount: 0,
    withholdingTaxAmount: 0,
    grandTotal: 0
  };

  // คำนวณส่วนลดรวม
  const subtotalAfterItemDiscount = calculations.subtotal - calculations.itemDiscount;
  
  if (globalDiscountType === 'percent') {
    calculations.globalDiscountAmount = subtotalAfterItemDiscount * globalDiscount / 100;
  } else {
    calculations.globalDiscountAmount = globalDiscount;
  }

  const subtotalAfterAllDiscounts = subtotalAfterItemDiscount - calculations.globalDiscountAmount;

  // คำนวณ VAT
  if (includeVAT) {
    calculations.vatAmount = subtotalAfterAllDiscounts * vatRate / 100;
  }

  // คำนวณภาษีหัก ณ ที่จ่าย
  if (includeWithholdingTax) {
    calculations.withholdingTaxAmount = subtotalAfterAllDiscounts * withholdingTaxRate / 100;
  }

  calculations.grandTotal = subtotalAfterAllDiscounts + calculations.vatAmount - calculations.withholdingTaxAmount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // ตรวจสอบว่าจำนวนไม่เกิน Serial Numbers ที่มี
    if (item.serialNumbers.length > 0 && newQuantity > item.serialNumbers.length) {
      toast({
        title: "จำนวนเกินที่มี",
        description: `สินค้านี้มี Serial Number เพียง ${item.serialNumbers.length} ชิ้น`,
        variant: "destructive"
      });
      return;
    }

    const subtotal = (item.unitPrice * newQuantity) - 
      (item.discountType === 'percent' 
        ? (item.unitPrice * newQuantity * item.discount / 100)
        : item.discount
      );

    onUpdateItem(itemId, { quantity: newQuantity, subtotal });
  };

  const handleDiscountChange = (itemId: string, discount: number, discountType: 'percent' | 'amount') => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const subtotal = (item.unitPrice * item.quantity) - 
      (discountType === 'percent' 
        ? (item.unitPrice * item.quantity * discount / 100)
        : discount
      );

    onUpdateItem(itemId, { discount, discountType, subtotal });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "ตะกร้าว่าง",
        description: "กรุณาเพิ่มสินค้าลงในตะกร้าก่อนชำระเงิน",
        variant: "destructive"
      });
      return;
    }

    const checkoutData: CheckoutData = {
      items,
      subtotal: calculations.subtotal,
      totalDiscount: calculations.itemDiscount + calculations.globalDiscountAmount,
      vatAmount: calculations.vatAmount,
      withholdingTaxAmount: calculations.withholdingTaxAmount,
      grandTotal: calculations.grandTotal,
      paymentMethod,
      customerInfo: customerInfo.name ? customerInfo : undefined
    };

    onCheckout(checkoutData);
  };

  return (
    <div className="space-y-4">
      {/* Cart Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              ตะกร้าสินค้า ({items.length} รายการ)
            </div>
            {items.length > 0 && (
              <Button variant="outline" size="sm" onClick={onClearCart}>
                <Trash2 className="w-4 h-4 mr-2" />
                ล้างตะกร้า
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Cart Items */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ตะกร้าสินค้าว่าง</p>
              <p className="text-sm">เพิ่มสินค้าจากการค้นหาด้านซ้าย</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item, index) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                      
                      {/* Serial Numbers */}
                      {item.serialNumbers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Serial Numbers:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.serialNumbers.map(sn => (
                              <Badge key={sn.id} variant="secondary" className="text-xs font-mono">
                                {sn.serialNumber}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quantity Controls */}
                    <div>
                      <label className="text-xs text-muted-foreground">จำนวน</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Discount Controls */}
                    <div>
                      <label className="text-xs text-muted-foreground">ส่วนลด</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0, item.discountType)}
                          className="flex-1"
                          min="0"
                        />
                        <Select
                          value={item.discountType}
                          onValueChange={(value: 'percent' | 'amount') => 
                            handleDiscountChange(item.id, item.discount, value)
                          }
                        >
                          <SelectTrigger className="w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="amount">฿</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-muted-foreground">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Discount & Tax Settings */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              การคำนวณและภาษี
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Global Discount */}
            <div>
              <label className="text-sm font-medium">ส่วนลดรวม</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                  min="0"
                  placeholder="0"
                />
                <Select value={globalDiscountType} onValueChange={(value: 'percent' | 'amount') => setGlobalDiscountType(value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="amount">฿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tax Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="vat"
                  checked={includeVAT}
                  onChange={(e) => setIncludeVAT(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="vat" className="text-sm">VAT {vatRate}%</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="withholding"
                  checked={includeWithholdingTax}
                  onChange={(e) => setIncludeWithholdingTax(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="withholding" className="text-sm">หัก ณ ที่จ่าย {withholdingTaxRate}%</label>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium">วิธีการชำระเงิน</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="transfer">โอนเงิน</SelectItem>
                  <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                  <SelectItem value="debit_card">บัตรเดบิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า (ไม่บังคับ)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="ชื่อลูกค้า"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="เลขประจำตัวผู้เสียภาษี"
              value={customerInfo.taxId}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, taxId: e.target.value }))}
            />
            <Input
              placeholder="ที่อยู่"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>สรุปการชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>ยอดรวมสินค้า:</span>
              <span>{formatPrice(calculations.subtotal)}</span>
            </div>
            
            {calculations.itemDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>ส่วนลดรายการ:</span>
                <span>-{formatPrice(calculations.itemDiscount)}</span>
              </div>
            )}
            
            {calculations.globalDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>ส่วนลดรวม:</span>
                <span>-{formatPrice(calculations.globalDiscountAmount)}</span>
              </div>
            )}
            
            {includeVAT && (
              <div className="flex justify-between text-sm">
                <span>VAT {vatRate}%:</span>
                <span>{formatPrice(calculations.vatAmount)}</span>
              </div>
            )}
            
            {includeWithholdingTax && (
              <div className="flex justify-between text-sm text-red-600">
                <span>หัก ณ ที่จ่าย {withholdingTaxRate}%:</span>
                <span>-{formatPrice(calculations.withholdingTaxAmount)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>ยอดชำระ:</span>
              <span>{formatPrice(calculations.grandTotal)}</span>
            </div>
            
            <Button 
              onClick={handleCheckout} 
              className="w-full mt-4" 
              size="lg"
              disabled={items.length === 0 || loading}
            >
              <Receipt className="w-5 h-5 mr-2" />
              {loading ? 'กำลังประมวลผล...' : 'ชำระเงิน'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}