import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  Truck, 
  Receipt, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  DollarSign,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { serialNumberService } from '@/lib/serialNumberService';
import { WarehouseService } from '@/lib/warehouseService';

// Types for the component
interface Product {
  id: string;
  name: string;
  code: string;
  sku?: string;
  brand?: string;
  model?: string;
  category?: string;
  unit_cost: number;
  selling_price: number;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface ReceiveItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface ReceiveGoodsData {
  warehouseId: string;
  supplierId?: string;
  invoiceNumber?: string;
  items: ReceiveItem[];
  notes?: string;
  totalItems: number;
  totalCost: number;
}

interface ReceiveGoodsProps {
  onReceiveComplete?: (data: ReceiveGoodsData) => void;
  defaultWarehouseId?: string;
}

export function ReceiveGoods({ onReceiveComplete, defaultWarehouseId }: ReceiveGoodsProps) {
  const { toast } = useToast();
  
  // State management
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Form state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWarehouseId || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ReceiveItem[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearchTerm, products]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load warehouses
      const warehousesData = await WarehouseService.getWarehouses({ status: 'active' });
      setWarehouses(warehousesData);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
      setFilteredProducts(productsData || []);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลเริ่มต้นได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (product: Product) => {
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].totalCost = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitCost;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: ReceiveItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitCost: product.unit_cost,
        totalCost: product.unit_cost
      };
      setItems([...items, newItem]);
    }
    
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].totalCost = quantity * updatedItems[index].unitCost;
    setItems(updatedItems);
  };

  const updateItemUnitCost = (index: number, unitCost: number) => {
    const updatedItems = [...items];
    updatedItems[index].unitCost = unitCost;
    updatedItems[index].totalCost = updatedItems[index].quantity * unitCost;
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedWarehouseId) {
      newErrors.warehouse = 'กรุณาเลือกคลังสินค้า';
    }

    if (items.length === 0) {
      newErrors.items = 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ';
    }

    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'จำนวนต้องมากกว่า 0';
      }
      if (item.unitCost <= 0) {
        newErrors[`unitCost_${index}`] = 'ราคาต่อหน่วยต้องมากกว่า 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReceiveGoods = async () => {
    if (!validateForm()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลและแก้ไขข้อผิดพลาด",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Calculate totals
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

      // Generate receive number
      const receiveNumber = `RCV-${Date.now()}`;

      // Create receive log
      const { data: receiveLog, error: receiveError } = await supabase
        .from('receive_logs')
        .insert({
          receive_number: receiveNumber,
          supplier_id: selectedSupplierId || null,
          warehouse_id: selectedWarehouseId,
          invoice_number: invoiceNumber || null,
          total_items: totalItems,
          total_cost: totalCost,
          received_by: 'current_user', // This should be replaced with actual user ID
          status: 'completed',
          notes: notes || null
        })
        .select()
        .single();

      if (receiveError) throw receiveError;

      // Process each item - generate serial numbers and create records
      const allGeneratedSNs: any[] = [];
      
      for (const item of items) {
        if (!item.product) continue;

        // Generate and create serial numbers for this item
        const generatedSNs = await serialNumberService.generateAndCreateSNs({
          productId: item.productId,
          productCode: item.product.code,
          warehouseId: selectedWarehouseId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          supplierId: selectedSupplierId || undefined,
          invoiceNumber: invoiceNumber || undefined,
          notes: `Received via ${receiveNumber}`
        });

        allGeneratedSNs.push(...generatedSNs);
      }

      // Prepare response data
      const receiveData: ReceiveGoodsData = {
        warehouseId: selectedWarehouseId,
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        items,
        notes: notes || undefined,
        totalItems,
        totalCost
      };

      // Call completion callback
      if (onReceiveComplete) {
        onReceiveComplete(receiveData);
      }

      // Show success message
      toast({
        title: "รับสินค้าสำเร็จ",
        description: `รับสินค้าทั้งหมด ${totalItems} ชิ้น สร้าง Serial Number ${allGeneratedSNs.length} รายการ`,
        variant: "default",
      });

      // Reset form
      resetForm();

    } catch (error) {
      console.error('Error receiving goods:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถรับสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setInvoiceNumber('');
    setNotes('');
    setItems([]);
    setErrors({});
    setProductSearchTerm('');
    setShowProductSearch(false);
  };

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">กำลังโหลดข้อมูล...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รับสินค้าเข้าคลัง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warehouse and Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">คลังสินค้า *</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {warehouse.name} ({warehouse.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse && (
                <p className="text-sm text-red-500">{errors.warehouse}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">ผู้จำหน่าย</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้จำหน่าย (ไม่บังคับ)" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {supplier.name} ({supplier.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoice">เลขที่ใบวางบิล</Label>
            <Input
              id="invoice"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="ระบุเลขที่ใบวางบิล (ไม่บังคับ)"
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>รายการสินค้า</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProductSearch(!showProductSearch)}
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้า
              </Button>
            </div>

            {errors.items && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.items}</AlertDescription>
              </Alert>
            )}

            {/* Product Search */}
            {showProductSearch && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ค้นหาสินค้า (ชื่อ, รหัส, SKU, แบรนด์, รุ่น)"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addItem(product)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.code} {product.sku && `• ${product.sku}`}
                              {product.brand && ` • ${product.brand}`}
                              {product.model && ` • ${product.model}`}
                            </div>
                            <div className="text-sm text-green-600">
                              ฿{product.unit_cost.toLocaleString()}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                      
                      {filteredProducts.length === 0 && productSearchTerm && (
                        <div className="text-center py-4 text-muted-foreground">
                          ไม่พบสินค้าที่ตรงกับการค้นหา
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Items */}
            {items.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {items.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="p-4 border-b last:border-b-0">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.product?.code} {item.product?.sku && `• ${item.product.sku}`}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                              min="1"
                            />
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => updateItemUnitCost(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <div className="font-medium">
                              ฿{item.totalCost.toLocaleString()}
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {(errors[`quantity_${index}`] || errors[`unitCost_${index}`]) && (
                          <div className="mt-2 text-sm text-red-500">
                            {errors[`quantity_${index}`] || errors[`unitCost_${index}`]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
              rows={3}
            />
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <>
              <Separator />
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">จำนวนรวม:</span>
                    <Badge variant="secondary">{totalItems} ชิ้น</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">มูลค่ารวม:</span>
                    <Badge variant="secondary">฿{totalCost.toLocaleString()}</Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleReceiveGoods}
              disabled={isProcessing || items.length === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  รับสินค้าเข้าคลัง
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isProcessing}
            >
              ล้างข้อมูล
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}