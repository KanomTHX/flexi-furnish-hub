import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  TransferRequestStatus, 
  TransferRequestPriority,
  CreateTransferRequestData,
  TransferRequestItem
} from '../../types/transfer';
import { 
  Plus, 
  Trash2, 
  Package, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TransferRequestFormProps {
  warehouses: Array<{ id: string; name: string; code: string }>;
  products: Array<{ id: string; name: string; code: string; unit: string; stock: number }>;
  onSubmit: (data: CreateTransferRequestData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

interface FormItem {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  requestedQuantity: number;
  availableQuantity: number;
  notes?: string;
}

const getPriorityText = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'high':
      return 'สูง';
    case 'medium':
      return 'ปานกลาง';
    case 'low':
      return 'ต่ำ';
    default:
      return priority;
  }
};

const getPriorityColor = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function TransferRequestForm({ 
  warehouses, 
  products, 
  onSubmit, 
  onCancel,
  loading = false 
}: TransferRequestFormProps) {
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    priority: 'medium',
    requiredDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 7 days from now
    notes: ''
  });

  const [items, setItems] = useState<FormItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product: typeof products[0]) => {
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      setErrors({ ...errors, products: 'สินค้านี้ถูกเพิ่มแล้ว' });
      return;
    }

    const newItem: FormItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unit: product.unit,
      requestedQuantity: 1,
      availableQuantity: product.stock,
      notes: ''
    };

    setItems([...items, newItem]);
    setSearchTerm('');
    setShowProductSearch(false);
    setErrors({ ...errors, products: '' });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sourceWarehouseId) {
      newErrors.sourceWarehouse = 'กรุณาเลือกคลังสินค้าต้นทาง';
    }

    if (!formData.destinationWarehouseId) {
      newErrors.destinationWarehouse = 'กรุณาเลือกคลังสินค้าปลายทาง';
    }

    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      newErrors.destinationWarehouse = 'คลังสินค้าต้นทางและปลายทางต้องไม่เหมือนกัน';
    }

    if (!formData.requiredDate) {
      newErrors.requiredDate = 'กรุณาเลือกวันที่ต้องการ';
    } else {
      const requiredDate = new Date(formData.requiredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (requiredDate < today) {
        newErrors.requiredDate = 'วันที่ต้องการต้องไม่เป็นวันที่ผ่านมาแล้ว';
      }
    }

    if (items.length === 0) {
      newErrors.products = 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ';
    }

    // Validate items
    items.forEach((item, index) => {
      if (item.requestedQuantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'จำนวนต้องมากกว่า 0';
      }
      if (item.requestedQuantity > item.availableQuantity) {
        newErrors[`item_${index}_quantity`] = 'จำนวนที่ขอเกินจำนวนที่มีในสต็อก';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const transferItems: TransferRequestItem[] = items.map(item => ({
      id: `temp_${Date.now()}_${Math.random()}`,
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      requestedQuantity: item.requestedQuantity,
      availableQuantity: item.availableQuantity,
      unit: item.unit,
      notes: item.notes
    }));

    const submitData: CreateTransferRequestData = {
      sourceWarehouseId: formData.sourceWarehouseId,
      destinationWarehouseId: formData.destinationWarehouseId,
      priority: formData.priority,
      requiredDate: new Date(formData.requiredDate),
      notes: formData.notes,
      items: transferItems
    };

    onSubmit(submitData);
  };

  const sourceWarehouse = warehouses.find(w => w.id === formData.sourceWarehouseId);
  const destinationWarehouse = warehouses.find(w => w.id === formData.destinationWarehouseId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">สร้างคำขอโอนย้ายสินค้า</h2>
        <p className="text-muted-foreground">กรอกข้อมูลเพื่อสร้างคำขอโอนย้ายสินค้าใหม่</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                ข้อมูลพื้นฐาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceWarehouse">คลังสินค้าต้นทาง *</Label>
                  <Select 
                    value={formData.sourceWarehouseId} 
                    onValueChange={(value) => setFormData({ ...formData, sourceWarehouseId: value })}
                  >
                    <SelectTrigger className={errors.sourceWarehouse ? 'border-red-500' : ''}>
                      <SelectValue placeholder="เลือกคลังสินค้าต้นทาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sourceWarehouse && (
                    <p className="text-sm text-red-500">{errors.sourceWarehouse}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationWarehouse">คลังสินค้าปลายทาง *</Label>
                  <Select 
                    value={formData.destinationWarehouseId} 
                    onValueChange={(value) => setFormData({ ...formData, destinationWarehouseId: value })}
                  >
                    <SelectTrigger className={errors.destinationWarehouse ? 'border-red-500' : ''}>
                      <SelectValue placeholder="เลือกคลังสินค้าปลายทาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destinationWarehouse && (
                    <p className="text-sm text-red-500">{errors.destinationWarehouse}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">ลำดับความสำคัญ</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: TransferRequestPriority) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['high', 'medium', 'low'] as TransferRequestPriority[]).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(priority)} variant="outline">
                              {getPriorityText(priority)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredDate">วันที่ต้องการ *</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    className={errors.requiredDate ? 'border-red-500' : ''}
                  />
                  {errors.requiredDate && (
                    <p className="text-sm text-red-500">{errors.requiredDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                รายการสินค้า ({items.length} รายการ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Product */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาสินค้า..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowProductSearch(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowProductSearch(searchTerm.length > 0)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มสินค้า
                  </Button>
                </div>

                {showProductSearch && (
                  <Card className="max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      {filteredProducts.length > 0 ? (
                        <div className="space-y-1">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => handleAddProduct(product)}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  รหัส: {product.code} | สต็อก: {product.stock.toLocaleString()} {product.unit}
                                </p>
                              </div>
                              <Plus className="h-4 w-4" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">ไม่พบสินค้า</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {errors.products && (
                  <p className="text-sm text-red-500">{errors.products}</p>
                )}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${item.productId}_${index}`} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">รหัส: {item.productCode}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>จำนวนที่ขอ *</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max={item.availableQuantity}
                              value={item.requestedQuantity}
                              onChange={(e) => handleItemChange(index, 'requestedQuantity', parseInt(e.target.value) || 0)}
                              className={errors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                            />
                            <span className="text-sm text-muted-foreground">{item.unit}</span>
                          </div>
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-sm text-red-500">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>จำนวนที่มี</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={`${item.availableQuantity.toLocaleString()} ${item.unit}`}
                              disabled
                              className="bg-muted"
                            />
                            <Badge variant={item.requestedQuantity <= item.availableQuantity ? 'default' : 'destructive'}>
                              {item.requestedQuantity <= item.availableQuantity ? 'เพียงพอ' : 'ไม่เพียงพอ'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <Label>หมายเหตุ</Label>
                        <Textarea
                          value={item.notes || ''}
                          onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                          placeholder="หมายเหตุสำหรับสินค้านี้ (ถ้ามี)"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สรุปคำขอ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">คลังสินค้าต้นทาง</Label>
                  <p className="text-sm">{sourceWarehouse?.name || 'ยังไม่ได้เลือก'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">คลังสินค้าปลายทาง</Label>
                  <p className="text-sm">{destinationWarehouse?.name || 'ยังไม่ได้เลือก'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ลำดับความสำคัญ</Label>
                  <Badge className={getPriorityColor(formData.priority)} variant="outline">
                    {getPriorityText(formData.priority)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">วันที่ต้องการ</Label>
                  <p className="text-sm">
                    {formData.requiredDate ? format(new Date(formData.requiredDate), 'dd MMMM yyyy', { locale: th }) : 'ยังไม่ได้เลือก'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">จำนวนสินค้า</Label>
                  <p className="text-sm">{items.length} รายการ</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'กำลังสร้างคำขอ...' : 'สร้างคำขอโอนย้าย'}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
                    ยกเลิก
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  ข้อผิดพลาด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-red-600 space-y-1">
                  {Object.values(errors).filter(Boolean).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}

export default TransferRequestForm;