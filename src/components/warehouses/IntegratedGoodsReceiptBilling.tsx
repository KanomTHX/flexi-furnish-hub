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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  Receipt, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  DollarSign,
  Building2,
  X,
  Printer,
  FileText,
  User,
  Calendar,
  Truck,
  QrCode,
  Tag,
  ArrowRight,
  Save,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddNewProduct } from './AddNewProduct';
import { useBranchData } from '@/hooks/useBranchData';

// Types
interface Product {
  id: string;
  name: string;
  product_code: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  status: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
}

interface ReceiveItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
  serialNumbers: string[];
}

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface IntegratedGoodsReceiptBillingProps {
  onComplete?: (data: any) => void;
  defaultBranchId?: string;
  branchId?: string;
}

export function IntegratedGoodsReceiptBilling({ onComplete, defaultBranchId, branchId }: IntegratedGoodsReceiptBillingProps) {
  const { toast } = useToast();
  const { branches } = useBranchData();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Workflow steps
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { id: 1, title: 'รับสินค้า', description: 'เลือกสาขาและข้อมูลพื้นฐาน', completed: false, active: true },
    { id: 2, title: 'เลือก/เพิ่มสินค้า', description: 'เลือกสินค้าที่มีอยู่หรือเพิ่มสินค้าใหม่', completed: false, active: false },
    { id: 3, title: 'ระบุจำนวน/ราคา', description: 'กำหนดจำนวนและราคาต่อชิ้น', completed: false, active: false },
    { id: 4, title: 'สร้าง SN อัตโนมัติ', description: 'ระบบสร้าง Serial Number และเก็บข้อมูล', completed: false, active: false },
    { id: 5, title: 'ผูกกับ Supplier', description: 'เชื่อมโยงกับซัพพลายเออร์และสร้างใบวางบิล', completed: false, active: false },
    { id: 6, title: 'พิมพ์เอกสาร', description: 'พิมพ์ใบรับสินค้าและ Sticker SN', completed: false, active: false }
  ]);
  
  // Form state
  const [selectedBranchId, setSelectedBranchId] = useState<string>(defaultBranchId || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<ReceiveItem[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptData, setReceiptData] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [branchId]);

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
      // Branches are loaded via useBranchData hook

      // Load products
      let productsQuery = supabase
        .from('products')
        .select('*, branch_id')
        .eq('status', 'active');
      
      if (branchId) {
        productsQuery = productsQuery.eq('branch_id', branchId);
      }
      
      const { data: productsData, error: productsError } = await productsQuery;
      
      if (productsError) throw productsError;
      setProducts(productsData || []);
      setFilteredProducts(productsData || []);

      // Load suppliers
      let suppliersQuery = supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active');
      
      if (branchId) {
        suppliersQuery = suppliersQuery.eq('branch_id', branchId);
      }
      
      const { data: suppliersData, error: suppliersError } = await suppliersQuery;
      
      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลเริ่มต้นได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSerialNumber = (productCode: string, index: number): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${productCode}-${timestamp}-${String(index + 1).padStart(3, '0')}-${randomSuffix}`;
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
        unitCost: product.cost_price || product.selling_price || 1000,
        totalCost: product.cost_price || product.selling_price || 1000,
        serialNumbers: []
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
    
    // Generate serial numbers for the new quantity
    const serialNumbers = [];
    for (let i = 0; i < quantity; i++) {
      serialNumbers.push(generateSerialNumber(updatedItems[index].product?.product_code || 'PROD', i));
    }
    updatedItems[index].serialNumbers = serialNumbers;
    
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!selectedBranchId) {
          newErrors.branch = 'กรุณาเลือกสาขา';
        }
        break;
      case 2:
        if (items.length === 0) {
          newErrors.items = 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ';
        }
        break;
      case 3:
        items.forEach((item, index) => {
          if (item.quantity <= 0) {
            newErrors[`quantity_${index}`] = 'จำนวนต้องมากกว่า 0';
          }
          if (item.unitCost <= 0) {
            newErrors[`unitCost_${index}`] = 'ราคาต่อหน่วยต้องมากกว่า 0';
          }
        });
        break;
      case 5:
        if (!selectedSupplierId) {
          newErrors.supplier = 'กรุณาเลือกซัพพลายเออร์';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลและแก้ไขข้อผิดพลาด",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < 6) {
      // Mark current step as completed
      const updatedSteps = workflowSteps.map(step => {
        if (step.id === currentStep) {
          return { ...step, completed: true, active: false };
        }
        if (step.id === currentStep + 1) {
          return { ...step, active: true };
        }
        return step;
      });
      setWorkflowSteps(updatedSteps);
      setCurrentStep(currentStep + 1);

      // Auto-generate serial numbers when moving to step 4
      if (currentStep === 3) {
        generateAllSerialNumbers();
      }

      // Auto-generate invoice number when moving to step 5
      if (currentStep === 4 && !invoiceNumber) {
        setInvoiceNumber(`INV-${Date.now()}`);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const updatedSteps = workflowSteps.map(step => {
        if (step.id === currentStep) {
          return { ...step, active: false };
        }
        if (step.id === currentStep - 1) {
          return { ...step, completed: false, active: true };
        }
        return step;
      });
      setWorkflowSteps(updatedSteps);
      setCurrentStep(currentStep - 1);
    }
  };

  const generateAllSerialNumbers = () => {
    const updatedItems = items.map(item => {
      const serialNumbers = [];
      for (let i = 0; i < item.quantity; i++) {
        serialNumbers.push(generateSerialNumber(item.product?.product_code || 'PROD', i));
      }
      return { ...item, serialNumbers };
    });
    setItems(updatedItems);
  };

  const completeWorkflow = async () => {
    if (!validateCurrentStep()) {
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

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}`;

      // Create stock movements and serial numbers
      const movements = [];
      const serialNumberRecords = [];
      
      for (const item of items) {
        if (!item.product) continue;

        // Create stock movement
        const movement = {
          product_id: item.productId,
          branch_id: selectedBranchId,
          movement_type: 'in',
          quantity: item.quantity,
          notes: `${receiptNumber} - ${suppliers.find(s => s.id === selectedSupplierId)?.supplierName || 'Unknown Supplier'}${invoiceNumber ? ` - Invoice: ${invoiceNumber}` : ''}${notes ? ` - ${notes}` : ''}`
        };
        movements.push(movement);

        // Create serial number records
        item.serialNumbers.forEach(sn => {
          serialNumberRecords.push({
            serial_number: sn,
            product_id: item.productId,
            branch_id: selectedBranchId,
            supplier_id: selectedSupplierId,
            unit_cost: item.unitCost,
            status: 'in_stock',
            received_date: deliveryDate,
            invoice_number: invoiceNumber || null,
            notes: notes || null
          });
        });
      }

      // Insert movements
      const { data: insertedMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movements)
        .select();

      if (movementsError) throw movementsError;

      // Insert serial numbers
      const { data: insertedSerialNumbers, error: serialNumbersError } = await supabase
        .from('serial_numbers')
        .insert(serialNumberRecords)
        .select();

      if (serialNumbersError) throw serialNumbersError;

      // Create supplier invoice if supplier is selected
      let supplierInvoice = null;
      if (selectedSupplierId && invoiceNumber) {
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('supplier_invoices')
          .insert({
            supplier_id: selectedSupplierId,
            invoice_number: invoiceNumber,
            invoice_date: deliveryDate,
            total_amount: totalCost,
            status: 'pending',
            notes: notes || null
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        supplierInvoice = invoiceData;
      }

      // Prepare receipt data
      const receiptDataObj = {
        receiptNumber,
        warehouseId: selectedWarehouseId,
        warehouse: warehouses.find(w => w.id === selectedWarehouseId),
        supplierId: selectedSupplierId,
        supplier: suppliers.find(s => s.id === selectedSupplierId),
        invoiceNumber,
        deliveryDate,
        items,
        totalItems,
        totalCost,
        notes,
        movements: insertedMovements,
        serialNumbers: insertedSerialNumbers,
        supplierInvoice
      };

      setReceiptData(receiptDataObj);

      // Mark final step as completed
      const updatedSteps = workflowSteps.map(step => {
        if (step.id === 6) {
          return { ...step, completed: true, active: false };
        }
        return step;
      });
      setWorkflowSteps(updatedSteps);

      // Call completion callback
      if (onComplete) {
        onComplete(receiptDataObj);
      }

      toast({
        title: "รับสินค้าสำเร็จ",
        description: `รับสินค้าทั้งหมด ${totalItems} ชิ้น สร้าง Serial Number ${insertedSerialNumbers.length} รายการ`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error completing workflow:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductAdded = (newProduct: any) => {
    const product: Product = {
      id: newProduct.id,
      name: newProduct.name,
      product_code: newProduct.product_code,
      description: newProduct.description,
      cost_price: newProduct.cost_price,
      selling_price: newProduct.selling_price,
      status: newProduct.status
    };
    
    setProducts(prev => [...prev, product]);
    setFilteredProducts(prev => [...prev, product]);
    addItem(product);
    setShowAddProduct(false);
    
    toast({
      title: "เพิ่มสินค้าสำเร็จ",
      description: `เพิ่มสินค้า "${product.name}" และเพิ่มเข้ารายการรับสินค้าแล้ว`,
    });
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setWorkflowSteps([
      { id: 1, title: 'รับสินค้า', description: 'เลือกสาขาและข้อมูลพื้นฐาน', completed: false, active: true },
      { id: 2, title: 'เลือก/เพิ่มสินค้า', description: 'เลือกสินค้าที่มีอยู่หรือเพิ่มสินค้าใหม่', completed: false, active: false },
      { id: 3, title: 'ระบุจำนวน/ราคา', description: 'กำหนดจำนวนและราคาต่อชิ้น', completed: false, active: false },
      { id: 4, title: 'สร้าง SN อัตโนมัติ', description: 'ระบบสร้าง Serial Number และเก็บข้อมูล', completed: false, active: false },
      { id: 5, title: 'ผูกกับ Supplier', description: 'เชื่อมโยงกับซัพพลายเออร์และสร้างใบวางบิล', completed: false, active: false },
      { id: 6, title: 'พิมพ์เอกสาร', description: 'พิมพ์ใบรับสินค้าและ Sticker SN', completed: false, active: false }
    ]);
    setSelectedBranchId(defaultBranchId || '');
    setSelectedSupplierId('');
    setInvoiceNumber('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
    setErrors({});
    setReceiptData(null);
    setProductSearchTerm('');
    setShowProductSearch(false);
    setShowAddProduct(false);
    setShowAddSupplier(false);
  };

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSerialNumbers = items.reduce((sum, item) => sum + item.serialNumbers.length, 0);

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
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ระบบรับสินค้าและเรียกเก็บเงินแบบบูรณาการ
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Workflow Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">ขั้นตอนการดำเนินงาน</h3>
            <Badge variant="outline">
              ขั้นตอน {currentStep} จาก 6
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className={`flex flex-col items-center min-w-[120px] p-3 rounded-lg border-2 transition-all ${
                  step.completed 
                    ? 'border-green-500 bg-green-50' 
                    : step.active 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : step.active 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{step.id}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                  </div>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">ข้อมูลพื้นฐานการรับสินค้า</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branch">สาขา *</Label>
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {branch.name} ({branch.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branch && (
                    <p className="text-sm text-red-500">{errors.branch}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">วันที่รับสินค้า</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Product Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">เลือกหรือเพิ่มสินค้า</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    ค้นหาสินค้า
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddProduct(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มสินค้าใหม่
                  </Button>
                </div>
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
                            placeholder="ค้นหาสินค้าด้วยชื่อ รหัส หรือคำอธิบาย..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowProductSearch(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.slice(0, 10).map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => addItem(product)}
                            >
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  รหัส: {product.product_code} • ราคา: ฿{product.cost_price?.toLocaleString() || product.selling_price?.toLocaleString()}
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>ไม่พบสินค้าที่ตรงกับการค้นหา</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowAddProduct(true);
                                setShowProductSearch(false);
                              }}
                              className="mx-auto mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              เพิ่มสินค้าใหม่
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Items Preview */}
              {items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">สินค้าที่เลือก ({items.length} รายการ)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              รหัส: {item.product?.product_code}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {item.quantity} ชิ้น
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Quantity and Price */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">ระบุจำนวนและราคาต่อชิ้น</h3>
              </div>
              
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={`${item.productId}-${index}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              รหัส: {item.product?.product_code}
                              {item.product?.description && ` • ${item.product.description}`}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                                className="w-20 text-center"
                                min="1"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">฿</span>
                              <Input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => updateItemUnitCost(index, parseFloat(e.target.value) || 0)}
                                className="w-32"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            <div className="text-right min-w-[100px]">
                              <div className="font-medium">฿{item.totalCost.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">รวม</div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {(errors[`quantity_${index}`] || errors[`unitCost_${index}`]) && (
                          <div className="mt-2 text-sm text-red-500">
                            {errors[`quantity_${index}`] || errors[`unitCost_${index}`]}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold">สรุปรายการ</div>
                        <div className="text-right">
                          <div className="text-lg font-bold">฿{totalCost.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{totalItems} ชิ้น</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    กรุณากลับไปขั้นตอนที่ 2 เพื่อเลือกสินค้า
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 4: Serial Number Generation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">สร้าง Serial Number อัตโนมัติ</h3>
              </div>
              
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={`${item.productId}-${index}`}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{item.product?.name}</span>
                          <Badge variant="outline">
                            {item.serialNumbers.length} Serial Numbers
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {item.serialNumbers.map((sn, snIndex) => (
                            <div key={snIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                              <QrCode className="h-4 w-4 text-gray-500" />
                              <span className="font-mono text-sm">{sn}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      สร้าง Serial Number สำเร็จ! ทั้งหมด {totalSerialNumbers} รายการ
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ไม่มีสินค้าให้สร้าง Serial Number
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 5: Supplier Binding */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">ผูกกับซัพพลายเออร์และสร้างใบวางบิล</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="supplier">ซัพพลายเออร์ *</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกซัพพลายเออร์" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {supplier.supplierName} ({supplier.supplierCode})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier && (
                    <p className="text-sm text-red-500">{errors.supplier}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">เลขที่ใบวางบิล</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="ระบุเลขที่ใบวางบิล"
                  />
                </div>
              </div>

              {selectedSupplierId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ข้อมูลซัพพลายเออร์</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const supplier = suppliers.find(s => s.id === selectedSupplierId);
                      return supplier ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">ชื่อบริษัท</div>
                            <div className="font-medium">{supplier.supplierName}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">รหัสซัพพลายเออร์</div>
                            <div className="font-medium">{supplier.supplierCode}</div>
                          </div>
                          {supplier.contactPerson && (
                            <div>
                              <div className="text-sm text-muted-foreground">ผู้ติดต่อ</div>
                              <div className="font-medium">{supplier.contactPerson}</div>
                            </div>
                          )}
                          {supplier.phone && (
                            <div>
                              <div className="text-sm text-muted-foreground">เบอร์โทร</div>
                              <div className="font-medium">{supplier.phone}</div>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()} 
                  </CardContent>
                </Card>
              )}

              {/* Invoice Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ตัวอย่างใบวางบิล</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">เลขที่ใบวางบิล</div>
                        <div className="font-medium">{invoiceNumber || 'ยังไม่ระบุ'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">วันที่</div>
                        <div className="font-medium">{new Date(deliveryDate).toLocaleDateString('th-TH')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">จำนวนรายการ</div>
                        <div className="font-medium">{totalItems} ชิ้น</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">มูลค่ารวม</div>
                        <div className="font-medium text-lg">฿{totalCost.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 6: Print Documents */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Printer className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">พิมพ์ใบรับสินค้าและ Sticker SN</h3>
              </div>
              
              {receiptData ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ดำเนินการรับสินค้าเรียบร้อยแล้ว! พร้อมพิมพ์เอกสาร
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          ใบรับสินค้า
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>เลขที่ใบรับ:</span>
                            <span className="font-medium">{receiptData.receiptNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>คลังสินค้า:</span>
                            <span className="font-medium">{receiptData.warehouse?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ซัพพลายเออร์:</span>
                            <span className="font-medium">{receiptData.supplier?.supplierName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>จำนวนรายการ:</span>
                            <span className="font-medium">{receiptData.totalItems} ชิ้น</span>
                          </div>
                          <div className="flex justify-between">
                            <span>มูลค่ารวม:</span>
                            <span className="font-medium">฿{receiptData.totalCost.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          <Printer className="h-4 w-4 mr-2" />
                          พิมพ์ใบรับสินค้า
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Sticker Serial Number
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>จำนวน SN:</span>
                            <span className="font-medium">{totalSerialNumbers} รายการ</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ขนาด Sticker:</span>
                            <span className="font-medium">3.2 x 2.5 cm</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            รูปแบบ: QR Code + Serial Number
                          </div>
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          <QrCode className="h-4 w-4 mr-2" />
                          พิมพ์ Sticker SN
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">สรุปการดำเนินงาน</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{receiptData.totalItems}</div>
                          <div className="text-sm text-muted-foreground">ชิ้นสินค้า</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{totalSerialNumbers}</div>
                          <div className="text-sm text-muted-foreground">Serial Numbers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">฿{receiptData.totalCost.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">มูลค่ารวม</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    กรุณาดำเนินการขั้นตอนก่อนหน้าให้เสร็จสิ้นก่อน
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              ขั้นตอนก่อนหน้า
            </Button>
            
            <div className="flex gap-2">
              {currentStep < 6 ? (
                <Button onClick={nextStep}>
                  ขั้นตอนถัดไป
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  {!receiptData && (
                    <Button 
                      onClick={completeWorkflow}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          กำลังดำเนินการ...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          เสร็จสิ้นการรับสินค้า
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={resetWorkflow}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    เริ่มใหม่
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddNewProduct
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
}

export default IntegratedGoodsReceiptBilling;