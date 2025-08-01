import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductStock, Location, StockMovement } from '@/types/stock';
import { getStockStatusText } from '@/utils/stockHelpers';
import { 
  Package, 
  Plus, 
  Minus, 
  RotateCcw,
  AlertTriangle,
  Calculator
} from 'lucide-react';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductStock | null;
  locations: Location[];
  onConfirm: (
    productId: string,
    type: StockMovement['type'],
    quantity: number,
    reason: string,
    options: {
      reference?: string;
      cost?: number;
      location?: string;
      employeeId: string;
      employeeName: string;
      notes?: string;
    }
  ) => void;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  locations,
  onConfirm
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('adjustment');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [cost, setCost] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!product || !quantity || !reason) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) return;

    onConfirm(
      product.id,
      adjustmentType,
      quantityNum,
      reason,
      {
        reference: reference || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        location: location || undefined,
        employeeId: 'current-user', // TODO: ใช้ user ID จริง
        employeeName: 'ผู้ใช้ปัจจุบัน', // TODO: ใช้ชื่อผู้ใช้จริง
        notes: notes || undefined
      }
    );

    // Reset form
    setQuantity('');
    setReason('');
    setReference('');
    setCost('');
    setLocation('');
    setNotes('');
    onOpenChange(false);
  };

  const getNewStock = () => {
    if (!product || !quantity) return product?.currentStock || 0;
    
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum)) return product.currentStock;

    switch (adjustmentType) {
      case 'in':
        return product.currentStock + quantityNum;
      case 'out':
        return Math.max(0, product.currentStock - quantityNum);
      case 'adjustment':
        // สำหรับ adjustment ให้ quantity เป็นค่าที่ต้องการปรับ (+ หรือ -)
        return Math.max(0, product.currentStock + quantityNum);
      default:
        return product.currentStock;
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'in': return <Plus className="w-4 h-4 text-green-600" />;
      case 'out': return <Minus className="w-4 h-4 text-red-600" />;
      case 'adjustment': return <RotateCcw className="w-4 h-4 text-blue-600" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getAdjustmentTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'เพิ่มสต็อก';
      case 'out': return 'ลดสต็อก';
      case 'adjustment': return 'ปรับปรุงสต็อก';
      default: return type;
    }
  };

  const commonReasons = {
    in: [
      'รับสินค้าเพิ่มเติม',
      'สินค้าคืนจากลูกค้า',
      'ผลิตเพิ่ม',
      'โอนเข้าจากสาขาอื่น'
    ],
    out: [
      'สินค้าชำรุด',
      'สินค้าหมดอายุ',
      'สินค้าสูญหาย',
      'โอนออกไปสาขาอื่น',
      'ใช้ภายในบริษัท'
    ],
    adjustment: [
      'ปรับปรุงจากการตรวจนับ',
      'แก้ไขข้อผิดพลาดการบันทึก',
      'ปรับปรุงระบบ',
      'อื่นๆ'
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            ปรับปรุงสต็อกสินค้า
          </DialogTitle>
        </DialogHeader>

        {product && (
          <div className="space-y-6">
            {/* ข้อมูลสินค้า */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ข้อมูลสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">SKU</Label>
                    <p className="font-mono font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">ชื่อสินค้า</Label>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">สต็อกปัจจุบัน</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{product.currentStock}</span>
                      <Badge variant="outline">
                        {getStockStatusText(product.stockStatus)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">พร้อมขาย</Label>
                    <p className="text-lg font-bold text-green-600">{product.availableStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ประเภทการปรับปรุง */}
            <div className="space-y-3">
              <Label>ประเภทการปรับปรุง</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['in', 'out', 'adjustment'] as const).map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-colors ${
                      adjustmentType === type 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setAdjustmentType(type)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {getAdjustmentIcon(type)}
                        <span className="text-sm font-medium">
                          {getAdjustmentTypeText(type)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* จำนวนและการคำนวณ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  จำนวน {adjustmentType === 'adjustment' ? '(+/-)' : ''}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="กรอกจำนวน"
                  min={adjustmentType === 'adjustment' ? undefined : 1}
                />
              </div>
              <div className="space-y-2">
                <Label>สต็อกหลังปรับปรุง</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-lg">
                    {getNewStock()}
                  </span>
                  {getNewStock() < product.minStock && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>
            </div>

            {/* เหตุผล */}
            <div className="space-y-2">
              <Label htmlFor="reason">เหตุผล *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกเหตุผล" />
                </SelectTrigger>
                <SelectContent>
                  {commonReasons[adjustmentType].map((reasonOption) => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ข้อมูลเพิ่มเติม */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="เช่น PO-001, ADJ-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">สถานที่</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานที่" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ต้นทุน (สำหรับการรับเข้า) */}
            {adjustmentType === 'in' && (
              <div className="space-y-2">
                <Label htmlFor="cost">ต้นทุนต่อหน่วย (บาท)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            )}

            {/* หมายเหตุ */}
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={3}
              />
            </div>

            {/* คำเตือน */}
            {getNewStock() < product.minStock && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">คำเตือน</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  สต็อกหลังปรับปรุงจะต่ำกว่าระดับขั้นต่ำ ({product.minStock} ชิ้น)
                </p>
              </div>
            )}

            {/* ปุ่มดำเนินการ */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!quantity || !reason}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {getAdjustmentIcon(adjustmentType)}
                <span className="ml-2">ยืนยันการปรับปรุง</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}