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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  DollarSign,
  Building2,
  X,
  Barcode,
  Eye,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Types for the component
interface Product {
  id: string;
  name: string;
  product_code: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  status: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface SerialNumberItem {
  serialNumber: string;
  costPrice: number;
  sellingPrice: number;
  supplierPrice?: number;
  notes?: string;
}

interface ReceiveItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  serialNumbers: SerialNumberItem[];
  generateSN: boolean;
}

interface EnhancedReceiveGoodsProps {
  onReceiveComplete?: (data: any) => void;
  defaultWarehouseId?: string;
}

export function EnhancedReceiveGoods({ onReceiveComplete, defaultWarehouseId }: EnhancedReceiveGoodsProps) {
  const { toast } = useToast();
  
  // State management
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Form state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWarehouseId || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ReceiveItem[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showSNDialog, setShowSNDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-generate batch number
  useEffect(() => {
    if (!batchNumber) {
      setBatchNumber(`BATCH-${Date.now().toString().slice(-6)}`);
    }
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(productSearchTerm.toLowerCase())
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
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('id, code, name, status')
        .eq('status', 'active')
        .order('name');

      if (warehousesError) throw warehousesError;
      setWarehouses(warehousesData || []);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, product_code, name, description, cost_price, selling_price, status')
        .eq('status', 'active')
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

  const generateSerialNumber = (product: Product, index: number): string => {
    const warehouse = warehouses.find(w => w.id === selectedWarehouseId);
    const timestamp = Date.now().toString().slice(-6);
    return `${product.product_code}-${warehouse?.code || 'WH'}-${timestamp}${String(index + 1).padStart(2, '0')}`;
  };

  const addItem = (product: Product) => {
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...items];
      const item = updatedItems[existingItemIndex];
      item.quantity += 1;
      item.totalCost = item.quantity * item.unitCost;
      
      // Add new serial number if auto-generate is enabled
      if (item.generateSN) {
        const newSN: SerialNumberItem = {
          serialNumber: generateSerialNumber(product, item.serialNumbers.length),
          costPrice: item.unitCost,
          sellingPrice: product.selling_price || item.unitCost * 1.3,
          supplierPrice: item.unitCost * 0.95,
          notes: `Auto-generated for ${product.name}`
        };
        item.serialNumbers.push(newSN);
      }
      
      setItems(updatedItems);
    } else {
      // Add new item
      const unitCost = product.cost_price || product.selling_price || 1000;
      const newItem: ReceiveItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitCost,
        totalCost: unitCost,
        serialNumbers: [],
        generateSN: true
      };

      // Generate initial serial number
      const initialSN: SerialNumberItem = {
        serialNumber: generateSerialNumber(product, 0),
        costPrice: unitCost,
        sellingPrice: product.selling_price || unitCost * 1.3,
        supplierPrice: unitCost * 0.95,
        notes: `Auto-generated for ${product.name}`
      };
      newItem.serialNumbers.push(initialSN);
      
      setItems([...items, newItem]);
    }
    
    setShowProductSearch(false);
    setProductSearchTerm('');
  };  const
 updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...items];
    const item = updatedItems[index];
    const oldQuantity = item.quantity;
    
    item.quantity = quantity;
    item.totalCost = quantity * item.unitCost;

    // Adjust serial numbers based on quantity change
    if (item.generateSN) {
      if (quantity > oldQuantity) {
        // Add more serial numbers
        for (let i = oldQuantity; i < quantity; i++) {
          const newSN: SerialNumberItem = {
            serialNumber: generateSerialNumber(item.product!, i),
            costPrice: item.unitCost,
            sellingPrice: item.product?.selling_price || item.unitCost * 1.3,
            supplierPrice: item.unitCost * 0.95,
            notes: `Auto-generated for ${item.product?.name}`
          };
          item.serialNumbers.push(newSN);
        }
      } else if (quantity < oldQuantity) {
        // Remove excess serial numbers
        item.serialNumbers = item.serialNumbers.slice(0, quantity);
      }
    }
    
    setItems(updatedItems);
  };

  const updateItemUnitCost = (index: number, unitCost: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    item.unitCost = unitCost;
    item.totalCost = item.quantity * unitCost;
    
    // Update all serial number prices
    item.serialNumbers.forEach(sn => {
      sn.costPrice = unitCost;
      sn.supplierPrice = unitCost * 0.95;
      if (!sn.sellingPrice || sn.sellingPrice === item.product?.selling_price) {
        sn.sellingPrice = unitCost * 1.3; // Default 30% markup
      }
    });
    
    setItems(updatedItems);
  };

  const toggleSNGeneration = (index: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    item.generateSN = !item.generateSN;
    
    if (item.generateSN && item.serialNumbers.length === 0) {
      // Generate serial numbers for current quantity
      for (let i = 0; i < item.quantity; i++) {
        const newSN: SerialNumberItem = {
          serialNumber: generateSerialNumber(item.product!, i),
          costPrice: item.unitCost,
          sellingPrice: item.product?.selling_price || item.unitCost * 1.3,
          supplierPrice: item.unitCost * 0.95,
          notes: `Auto-generated for ${item.product?.name}`
        };
        item.serialNumbers.push(newSN);
      }
    } else if (!item.generateSN) {
      // Clear serial numbers
      item.serialNumbers = [];
    }
    
    setItems(updatedItems);
  };

  const openSNDialog = (index: number) => {
    setSelectedItemIndex(index);
    setShowSNDialog(true);
  };

  const updateSerialNumber = (itemIndex: number, snIndex: number, field: keyof SerialNumberItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].serialNumbers[snIndex] = {
      ...updatedItems[itemIndex].serialNumbers[snIndex],
      [field]: value
    };
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
      
      // Validate serial numbers if enabled
      if (item.generateSN) {
        if (item.serialNumbers.length !== item.quantity) {
          newErrors[`sn_${index}`] = `จำนวน Serial Number ต้องตรงกับจำนวนสินค้า (${item.quantity})`;
        }
        
        item.serialNumbers.forEach((sn, snIndex) => {
          if (!sn.serialNumber.trim()) {
            newErrors[`sn_${index}_${snIndex}`] = 'Serial Number ไม่สามารถเป็นค่าว่างได้';
          }
          if (sn.costPrice <= 0) {
            newErrors[`sn_cost_${index}_${snIndex}`] = 'ราคาทุนต้องมากกว่า 0';
          }
          if (sn.sellingPrice <= 0) {
            newErrors[`sn_sell_${index}_${snIndex}`] = 'ราคาขายต้องมากกว่า 0';
          }
        });
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
      const totalSNs = items.reduce((sum, item) => sum + item.serialNumbers.length, 0);

      // Generate receive number
      const receiveNumber = `RCV-${Date.now()}`;

      // Process each item
      const movements = [];
      const serialNumbersToInsert = [];
      
      for (const item of items) {
        if (!item.product) continue;

        // Create stock movement
        const movement = {
          product_id: item.productId,
          warehouse_id: selectedWarehouseId,
          movement_type: 'in',
          quantity: item.quantity,
          notes: `${receiveNumber}${supplierName ? ` - ${supplierName}` : ''}${invoiceNumber ? ` - Invoice: ${invoiceNumber}` : ''}${batchNumber ? ` - Batch: ${batchNumber}` : ''}${notes ? ` - ${notes}` : ''}`
        };
        movements.push(movement);

        // Prepare serial numbers for insertion
        if (item.generateSN && item.serialNumbers.length > 0) {
          item.serialNumbers.forEach(sn => {
            serialNumbersToInsert.push({
              serial_number: sn.serialNumber,
              product_id: item.productId,
              warehouse_id: selectedWarehouseId,
              cost_price: sn.costPrice,
              selling_price: sn.sellingPrice,
              supplier_price: sn.supplierPrice || sn.costPrice * 0.95,
              status: 'available',
              received_date: new Date().toISOString(),
              invoice_number: invoiceNumber || null,
              batch_number: batchNumber || null,
              notes: sn.notes || `Received via ${receiveNumber}`
            });
          });
        }
      }

      // Insert stock movements
      const { data: insertedMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movements)
        .select();

      if (movementsError) throw movementsError;

      // Insert serial numbers if any
      let insertedSNs = [];
      if (serialNumbersToInsert.length > 0) {
        const { data: snData, error: snError } = await supabase
          .from('product_serial_numbers')
          .insert(serialNumbersToInsert)
          .select();

        if (snError) {
          console.warn('Serial numbers insertion failed:', snError);
          toast({
            title: "คำเตือน",
            description: "รับสินค้าสำเร็จ แต่ไม่สามารถสร้าง Serial Number ได้ (ตารางอาจยังไม่มี)",
            variant: "default",
          });
        } else {
          insertedSNs = snData || [];
        }
      }

      // Prepare response data
      const receiveData = {
        warehouseId: selectedWarehouseId,
        supplierName: supplierName || undefined,
        invoiceNumber: invoiceNumber || undefined,
        batchNumber: batchNumber || undefined,
        items,
        notes: notes || undefined,
        totalItems,
        totalCost,
        totalSNs,
        receiveNumber,
        movements: insertedMovements,
        serialNumbers: insertedSNs
      };

      // Call completion callback
      if (onReceiveComplete) {
        onReceiveComplete(receiveData);
      }

      // Show success message
      toast({
        title: "รับสินค้าสำเร็จ",
        description: `รับสินค้าทั้งหมด ${totalItems} ชิ้น สร้าง Serial Number ${insertedSNs.length} รายการ`,
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
    setInvoiceNumber('');
    setSupplierName('');
    setBatchNumber(`BATCH-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setItems([]);
    setErrors({});
    setProductSearchTerm('');
    setShowProductSearch(false);
    setShowSNDialog(false);
    setSelectedItemIndex(null);
  };

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSNs = items.reduce((sum, item) => sum + item.serialNumbers.length, 0);

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
            รับสินค้าเข้าคลัง (พร้อม Serial Number)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warehouse Selection */}
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

          {/* Supplier, Invoice, and Batch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">ชื่อผู้จำหน่าย</Label>
              <Input
                id="supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="ระบุชื่อผู้จำหน่าย (ไม่บังคับ)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">เลขที่ใบวางบิล</Label>
              <Input
                id="invoice"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="ระบุเลขที่ใบวางบิล (ไม่บังคับ)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">เลขที่ Batch</Label>
              <Input
                id="batch"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="เลขที่ Batch"
              />
            </div>
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
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาสินค้า (ชื่อ, รหัส, คำอธิบาย)"
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProductSearch(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                              รหัส: {product.product_code}
                              {product.description && ` • ${product.description}`}
                            </div>
                            <div className="text-sm text-green-600">
                              ราคาทุน: ฿{product.cost_price?.toLocaleString() || 'ไม่ระบุ'}
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-center">จำนวน</TableHead>
                        <TableHead className="text-right">ราคา/หน่วย</TableHead>
                        <TableHead className="text-right">รวม</TableHead>
                        <TableHead className="text-center">SN</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={`${item.productId}-${index}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                รหัส: {item.product?.product_code}
                                {item.product?.description && ` • ${item.product.description}`}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
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
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => updateItemUnitCost(index, parseFloat(e.target.value) || 0)}
                                className="w-28 text-right"
                                min="0"
                                step="0.01"
                                placeholder="ราคา/หน่วย"
                              />
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right font-medium">
                            ฿{item.totalCost.toLocaleString()}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant={item.generateSN ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSNGeneration(index)}
                              >
                                <Barcode className="h-4 w-4" />
                              </Button>
                              
                              {item.generateSN && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSNDialog(index)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="ml-1 text-xs">
                                    {item.serialNumbers.length}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">จำนวนรวม:</span>
                    <Badge variant="secondary">{totalItems} ชิ้น</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Serial Numbers:</span>
                    <Badge variant="secondary">{totalSNs} รายการ</Badge>
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
     {/* Serial Numbers Dialog */}
      <Dialog open={showSNDialog} onOpenChange={setShowSNDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>จัดการ Serial Numbers</DialogTitle>
            <DialogDescription>
              {selectedItemIndex !== null && items[selectedItemIndex]?.product?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItemIndex !== null && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  จำนวนสินค้า: {items[selectedItemIndex].quantity} ชิ้น
                </span>
                <span className="text-sm text-muted-foreground">
                  Serial Numbers: {items[selectedItemIndex].serialNumbers.length} รายการ
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead className="text-right">ราคาทุน</TableHead>
                    <TableHead className="text-right">ราคาขาย</TableHead>
                    <TableHead className="text-right">ราคาซัพพลายเออร์</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items[selectedItemIndex].serialNumbers.map((sn, snIndex) => (
                    <TableRow key={snIndex}>
                      <TableCell>
                        <Input
                          value={sn.serialNumber}
                          onChange={(e) => updateSerialNumber(selectedItemIndex, snIndex, 'serialNumber', e.target.value)}
                          className="font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={sn.costPrice}
                          onChange={(e) => updateSerialNumber(selectedItemIndex, snIndex, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="text-right"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={sn.sellingPrice}
                          onChange={(e) => updateSerialNumber(selectedItemIndex, snIndex, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="text-right"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={sn.supplierPrice || 0}
                          onChange={(e) => updateSerialNumber(selectedItemIndex, snIndex, 'supplierPrice', parseFloat(e.target.value) || 0)}
                          className="text-right"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={sn.notes || ''}
                          onChange={(e) => updateSerialNumber(selectedItemIndex, snIndex, 'notes', e.target.value)}
                          placeholder="หมายเหตุ"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button onClick={() => setShowSNDialog(false)}>
                  ปิด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}