import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Receipt, Printer, Download } from 'lucide-react';
import { POSState } from '@/types/pos';
import { printReceipt, exportCartToCSV } from '@/utils/exportHelpers';

interface ReceiptPreviewProps {
  state: POSState;
  saleNumber?: string;
}

export function ReceiptPreview({ state, saleNumber = "INV-001" }: ReceiptPreviewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const currentDate = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    if (state.cart.length > 0) {
      printReceipt(
        {
          saleNumber,
          customer: state.customer,
          paymentMethod: state.paymentMethod,
          discount: state.discount,
          tax: state.tax
        },
        state.cart
      );
    }
  };

  const handleDownload = () => {
    if (state.cart.length > 0) {
      exportCartToCSV(state.cart);
    }
  };

  if (state.cart.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            ตัวอย่างใบเสร็จ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ตัวอย่างใบเสร็จจะแสดงที่นี่</p>
            <p className="text-sm">เพิ่มสินค้าลงตะกร้าเพื่อดูตัวอย่าง</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            ตัวอย่างใบเสร็จ
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {/* Receipt Content */}
          <div className="p-6 bg-white text-black font-mono text-sm" id="receipt-content">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-bold">FURNITURE STORE</h1>
              <p className="text-xs">123 Main Street, Bangkok 10110</p>
              <p className="text-xs">Tel: 02-123-4567</p>
              <p className="text-xs">Tax ID: 1234567890123</p>
            </div>

            <Separator className="my-4" />

            {/* Sale Info */}
            <div className="mb-4 space-y-1">
              <div className="flex justify-between">
                <span>เลขที่ใบเสร็จ:</span>
                <span className="font-bold">{saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่:</span>
                <span>{currentDate}</span>
              </div>
              {state.customer && (
                <>
                  <div className="flex justify-between">
                    <span>ลูกค้า:</span>
                    <span>{state.customer.name}</span>
                  </div>
                  {state.customer.phone && (
                    <div className="flex justify-between">
                      <span>โทรศัพท์:</span>
                      <span>{state.customer.phone}</span>
                    </div>
                  )}
                </>
              )}
              {state.paymentMethod && (
                <div className="flex justify-between">
                  <span>การชำระเงิน:</span>
                  <span>{state.paymentMethod.name}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Items */}
            <div className="mb-4">
              <div className="grid grid-cols-12 gap-1 font-bold border-b pb-1 mb-2">
                <div className="col-span-6">รายการ</div>
                <div className="col-span-2 text-center">จำนวน</div>
                <div className="col-span-2 text-right">ราคา</div>
                <div className="col-span-2 text-right">รวม</div>
              </div>

              {state.cart.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="grid grid-cols-12 gap-1">
                    <div className="col-span-6 text-xs">
                      {item.product.name}
                    </div>
                    <div className="col-span-2 text-center">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-xs">
                      {formatPrice(item.unitPrice)}
                    </div>
                    <div className="col-span-2 text-right text-xs">
                      {formatPrice(item.totalPrice)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 ml-0">
                    SKU: {item.product.sku}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>ยอดรวมย่อย:</span>
                <span>{formatPrice(state.subtotal)}</span>
              </div>
              
              {state.discount > 0 && (
                <div className="flex justify-between">
                  <span>ส่วนลด:</span>
                  <span>-{formatPrice(state.discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                <span>{formatPrice(state.tax)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold text-lg">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span>{formatPrice(state.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-xs">
              <p>ขอบคุณที่ใช้บริการ!</p>
              <p>กรุณาเก็บใบเสร็จนี้ไว้สำหรับการรับประกัน</p>
              <p className="mt-2">นโยบายการคืนสินค้า: 7 วัน พร้อมใบเสร็จ</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}