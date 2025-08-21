import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Package, Calculator, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  productName: string;
  productCode: string;
  category?: string;
  unit?: string;
  description?: string;
  status: string;
}

interface ReceiveItem {
  id: string;
  product: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  serialNumbers: string[];
}

interface ReceiptItemsManagementProps {
  items: ReceiveItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateUnitCost: (itemId: string, unitCost: number) => void;
  onRemoveItem: (itemId: string) => void;
  errors?: Record<string, string>;
}

export function ReceiptItemsManagement({
  items,
  onUpdateQuantity,
  onUpdateUnitCost,
  onRemoveItem,
  errors = {}
}: ReceiptItemsManagementProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">ระบุจำนวนและราคาต่อชิ้น</h3>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            กรุณาเลือกสินค้าก่อนดำเนินการขั้นตอนนี้
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">ระบุจำนวนและราคาต่อชิ้น</h3>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" />
            สรุปรายการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              <div className="text-sm text-gray-500">รายการสินค้า</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalItems}</div>
              <div className="text-sm text-gray-500">จำนวนรวม</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-500">มูลค่ารวม</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span>{item.product.productName}</span>
                  <span className="text-sm text-gray-500">({item.product.productCode})</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`quantity-${item.id}`}>จำนวน *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className={errors[`quantity-${item.id}`] ? 'border-red-500' : ''}
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {item.product.unit || 'ชิ้น'}
                    </span>
                  </div>
                  {errors[`quantity-${item.id}`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {errors[`quantity-${item.id}`]}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor={`unitCost-${item.id}`}>ราคาต่อหน่วย *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">฿</span>
                    <Input
                      id={`unitCost-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => onUpdateUnitCost(item.id, parseFloat(e.target.value) || 0)}
                      className={errors[`unitCost-${item.id}`] ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors[`unitCost-${item.id}`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {errors[`unitCost-${item.id}`]}
                    </div>
                  )}
                </div>

                <div>
                  <Label>ราคารวม</Label>
                  <div className="flex items-center h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                    <span className="text-sm text-gray-500 mr-2">฿</span>
                    <span className="font-medium">
                      {item.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {item.product.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">หมวดหมู่:</span>
                  <Badge variant="secondary">{item.product.category}</Badge>
                </div>
              )}

              {item.product.description && (
                <div>
                  <span className="text-sm text-gray-500">รายละเอียด:</span>
                  <p className="text-sm text-gray-700 mt-1">{item.product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).some(key => key === 'items') && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.items}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}