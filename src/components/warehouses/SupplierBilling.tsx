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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  Plus, 
  Search, 
  Building2,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Types
interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  status: string;
}

interface BillItem {
  id?: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface SupplierBill {
  id?: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  billDate: string;
  dueDate: string;
  items: BillItem[];
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'paid' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SupplierBillingProps {
  onBillCreated?: (bill: SupplierBill) => void;
  onBillUpdated?: (bill: SupplierBill) => void;
  defaultWarehouseId?: string;
}

export function SupplierBilling({ onBillCreated, onBillUpdated, defaultWarehouseId }: SupplierBillingProps) {
  const { toast } = useToast();
  
  // State management
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  
  // Form state
  const [currentBill, setCurrentBill] = useState<SupplierBill>({
    billNumber: '',
    supplierId: '',
    supplierName: '',
    warehouseId: defaultWarehouseId || '',
    warehouseName: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [],
    subtotal: 0,
    vatAmount: 0,
    vatRate: 7,
    totalAmount: 0,
    status: 'draft',
    notes: ''
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-generate bill number
  useEffect(() => {
    if (!currentBill.billNumber) {
      generateBillNumber();
    }
  }, [currentBill.supplierId]);

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [currentBill.items, currentBill.vatRate]);

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

      // Load suppliers (create mock data if table doesn't exist)
      await loadSuppliers();

      // Load existing bills
      await loadBills();

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

  const loadSuppliers = async () => {
    try {
      // Try to load from suppliers table
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (suppliersError && !suppliersError.message.includes('does not exist')) {
        throw suppliersError;
      }

      if (suppliersData && suppliersData.length > 0) {
        setSuppliers(suppliersData);
      } else {
        // Create mock suppliers if none exist
        const mockSuppliers: Supplier[] = [
          {
            id: 'supplier-1',
            name: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
            contact_person: 'คุณสมชาย ใจดี',
            phone: '02-123-4567',
            email: 'contact@furniture-thai.com',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
            tax_id: '0123456789012',
            status: 'active'
          },
          {
            id: 'supplier-2',
            name: 'ห้างหุ้นส่วน โฮมเดคอร์',
            contact_person: 'คุณสมหญิง รักงาน',
            phone: '02-234-5678',
            email: 'info@homedecor.co.th',
            address: '456 ถนนรัชดาภิเษก กรุงเทพฯ 10400',
            tax_id: '0234567890123',
            status: 'active'
          },
          {
            id: 'supplier-3',
            name: 'บริษัท คุณภาพเฟอร์นิเจอร์ จำกัด',
            contact_person: 'คุณประเสริฐ มั่นคง',
            phone: '02-345-6789',
            email: 'sales@quality-furniture.com',
            address: '789 ถนนพหลโยธิน กรุงเทพฯ 10900',
            tax_id: '0345678901234',
            status: 'active'
          }
        ];
        setSuppliers(mockSuppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // Use mock data as fallback
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          name: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
          contact_person: 'คุณสมชาย ใจดี',
          phone: '02-123-4567',
          status: 'active'
        }
      ];
      setSuppliers(mockSuppliers);
    }
  };

  const loadBills = async () => {
    // For now, use local storage to simulate database
    try {
      const savedBills = localStorage.getItem('supplier_bills');
      if (savedBills) {
        setBills(JSON.parse(savedBills));
      }
    } catch (error) {
      console.error('Error loading bills:', error);
    }
  };

  const saveBill = async (bill: SupplierBill) => {
    try {
      // For now, save to local storage
      const existingBills = JSON.parse(localStorage.getItem('supplier_bills') || '[]');
      
      if (bill.id) {
        // Update existing bill
        const updatedBills = existingBills.map((b: SupplierBill) => 
          b.id === bill.id ? { ...bill, updatedAt: new Date().toISOString() } : b
        );
        localStorage.setItem('supplier_bills', JSON.stringify(updatedBills));
        setBills(updatedBills);
      } else {
        // Create new bill
        const newBill = {
          ...bill,
          id: `bill-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updatedBills = [...existingBills, newBill];
        localStorage.setItem('supplier_bills', JSON.stringify(updatedBills));
        setBills(updatedBills);
        return newBill;
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    }
  };

  const generateBillNumber = () => {
    const supplier = suppliers.find(s => s.id === currentBill.supplierId);
    const supplierCode = supplier?.name.substring(0, 3).toUpperCase() || 'SUP';
    const timestamp = Date.now().toString().slice(-6);
    const billNumber = `BILL-${supplierCode}-${timestamp}`;
    
    setCurrentBill(prev => ({ ...prev, billNumber }));
  };

  const calculateTotals = () => {
    const subtotal = currentBill.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = subtotal * (currentBill.vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    setCurrentBill(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      totalAmount
    }));
  };

  const addProduct = (product: any) => {
    const existingItemIndex = currentBill.items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...currentBill.items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].totalPrice = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      
      setCurrentBill(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        productCode: product.product_code,
        quantity: 1,
        unitPrice: product.cost_price || product.selling_price || 1000,
        totalPrice: product.cost_price || product.selling_price || 1000,
        description: product.description
      };
      
      setCurrentBill(prev => ({ 
        ...prev, 
        items: [...prev.items, newItem] 
      }));
    }
    
    setShowProductSearch(false);
    setProductSearchTerm('');
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...currentBill.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price for quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setCurrentBill(prev => ({ ...prev, items: updatedItems }));
  };

  const removeItem = (index: number) => {
    const updatedItems = currentBill.items.filter((_, i) => i !== index);
    setCurrentBill(prev => ({ ...prev, items: updatedItems }));
  };

  const validateBill = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentBill.supplierId) {
      newErrors.supplier = 'กรุณาเลือกผู้จำหน่าย';
    }

    if (!currentBill.warehouseId) {
      newErrors.warehouse = 'กรุณาเลือกคลังสินค้า';
    }

    if (!currentBill.dueDate) {
      newErrors.dueDate = 'กรุณาระบุวันครบกำหนด';
    }

    if (currentBill.items.length === 0) {
      newErrors.items = 'กรุณาเพิ่มรายการสินค้า';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBill = async () => {
    if (!validateBill()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลและแก้ไขข้อผิดพลาด",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Add supplier and warehouse names
      const supplier = suppliers.find(s => s.id === currentBill.supplierId);
      const warehouse = warehouses.find(w => w.id === currentBill.warehouseId);
      
      const billToSave = {
        ...currentBill,
        supplierName: supplier?.name || '',
        warehouseName: warehouse?.name || ''
      };

      const savedBill = await saveBill(billToSave);
      
      if (currentBill.id) {
        onBillUpdated?.(billToSave);
        toast({
          title: "บันทึกสำเร็จ",
          description: "อัปเดตใบวางบิลเรียบร้อยแล้ว",
        });
      } else {
        onBillCreated?.(savedBill || billToSave);
        toast({
          title: "สร้างใบวางบิลสำเร็จ",
          description: `สร้างใบวางบิลเลขที่ ${billToSave.billNumber} เรียบร้อยแล้ว`,
        });
      }

      // Reset form
      resetForm();
      setActiveTab('list');

    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกใบวางบิลได้",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiveGoods = async (bill: SupplierBill) => {
    setIsProcessing(true);
    try {
      // Create stock movements for each item
      const movements = [];
      
      for (const item of bill.items) {
        const movement = {
          product_id: item.productId,
          warehouse_id: bill.warehouseId,
          movement_type: 'in',
          quantity: item.quantity,
          notes: `รับสินค้าจากใบวางบิล ${bill.billNumber} - ${bill.supplierName}`
        };
        movements.push(movement);
      }

      // Insert movements to database
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movements);

      if (movementsError) throw movementsError;

      // Update bill status
      const updatedBill = { ...bill, status: 'received' as const };
      await saveBill(updatedBill);

      toast({
        title: "รับสินค้าสำเร็จ",
        description: `รับสินค้าจากใบวางบิล ${bill.billNumber} เรียบร้อยแล้ว`,
      });

      // Refresh bills list
      await loadBills();

    } catch (error) {
      console.error('Error receiving goods:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถรับสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCurrentBill({
      billNumber: '',
      supplierId: '',
      supplierName: '',
      warehouseId: defaultWarehouseId || '',
      warehouseName: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      items: [],
      subtotal: 0,
      vatAmount: 0,
      vatRate: 7,
      totalAmount: 0,
      status: 'draft',
      notes: ''
    });
    setErrors({});
    setProductSearchTerm('');
    setShowProductSearch(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'ร่าง', variant: 'secondary' as const },
      pending: { label: 'รอดำเนินการ', variant: 'default' as const },
      approved: { label: 'อนุมัติแล้ว', variant: 'default' as const },
      received: { label: 'รับสินค้าแล้ว', variant: 'default' as const },
      paid: { label: 'จ่ายแล้ว', variant: 'default' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.product_code.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

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
            <Receipt className="h-5 w-5" />
            ระบบใบวางบิลจากซัพพลายเออร์
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">สร้างใบวางบิล</TabsTrigger>
              <TabsTrigger value="list">รายการใบวางบิล</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Bill Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เลขที่ใบวางบิล</Label>
                  <Input
                    value={currentBill.billNumber}
                    onChange={(e) => setCurrentBill(prev => ({ ...prev, billNumber: e.target.value }))}
                    placeholder="เลขที่ใบวางบิล"
                  />
                </div>

                <div className="space-y-2">
                  <Label>วันที่ใบวางบิล</Label>
                  <Input
                    type="date"
                    value={currentBill.billDate}
                    onChange={(e) => setCurrentBill(prev => ({ ...prev, billDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ผู้จำหน่าย *</Label>
                  <Select 
                    value={currentBill.supplierId} 
                    onValueChange={(value) => setCurrentBill(prev => ({ ...prev, supplierId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้จำหน่าย" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            {supplier.contact_person && (
                              <div className="text-sm text-muted-foreground">
                                ติดต่อ: {supplier.contact_person}
                              </div>
                            )}
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
                  <Label>คลังสินค้า *</Label>
                  <Select 
                    value={currentBill.warehouseId} 
                    onValueChange={(value) => setCurrentBill(prev => ({ ...prev, warehouseId: value }))}
                  >
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
                  <Label>วันครบกำหนด *</Label>
                  <Input
                    type="date"
                    value={currentBill.dueDate}
                    onChange={(e) => setCurrentBill(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-500">{errors.dueDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>อัตรา VAT (%)</Label>
                  <Input
                    type="number"
                    value={currentBill.vatRate}
                    onChange={(e) => setCurrentBill(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Items Section */}
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
                            placeholder="ค้นหาสินค้า"
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
                              onClick={() => addProduct(product)}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  รหัส: {product.product_code}
                                </div>
                                <div className="text-sm text-green-600">
                                  ราคา: ฿{product.cost_price?.toLocaleString() || 'ไม่ระบุ'}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Items Table */}
                {currentBill.items.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>สินค้า</TableHead>
                            <TableHead className="text-center">จำนวน</TableHead>
                            <TableHead className="text-right">ราคา/หน่วย</TableHead>
                            <TableHead className="text-right">รวม</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBill.items.map((item, index) => (
                            <TableRow key={`${item.productId}-${index}`}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    รหัส: {item.productCode}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-28 text-right"
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ฿{item.totalPrice.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={currentBill.notes}
                  onChange={(e) => setCurrentBill(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={3}
                />
              </div>

              {/* Summary */}
              {currentBill.items.length > 0 && (
                <>
                  <Separator />
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>ยอดรวมก่อน VAT:</span>
                      <span className="font-medium">฿{currentBill.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT {currentBill.vatRate}%:</span>
                      <span className="font-medium">฿{currentBill.vatAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>ยอดรวมทั้งสิ้น:</span>
                      <span>฿{currentBill.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveBill}
                  disabled={isProcessing || currentBill.items.length === 0}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      บันทึกใบวางบิล
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
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">รายการใบวางบิล</h3>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบวางบิลใหม่
                </Button>
              </div>

              {bills.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">ยังไม่มีใบวางบิล</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bills.map((bill) => (
                    <Card key={bill.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{bill.billNumber}</h4>
                              {getStatusBadge(bill.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">ผู้จำหน่าย:</span><br />
                                {bill.supplierName}
                              </div>
                              <div>
                                <span className="font-medium">คลัง:</span><br />
                                {bill.warehouseName}
                              </div>
                              <div>
                                <span className="font-medium">วันที่:</span><br />
                                {new Date(bill.billDate).toLocaleDateString('th-TH')}
                              </div>
                              <div>
                                <span className="font-medium">ยอดรวม:</span><br />
                                <span className="text-lg font-bold text-green-600">
                                  ฿{bill.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBill(bill)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {bill.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleReceiveGoods(bill)}
                                disabled={isProcessing}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                รับสินค้า
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบวางบิล</DialogTitle>
            <DialogDescription>
              {selectedBill?.billNumber} - {selectedBill?.supplierName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>เลขที่ใบวางบิล</Label>
                  <p className="font-medium">{selectedBill.billNumber}</p>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <div>{getStatusBadge(selectedBill.status)}</div>
                </div>
                <div>
                  <Label>ผู้จำหน่าย</Label>
                  <p className="font-medium">{selectedBill.supplierName}</p>
                </div>
                <div>
                  <Label>คลังสินค้า</Label>
                  <p className="font-medium">{selectedBill.warehouseName}</p>
                </div>
                <div>
                  <Label>วันที่ใบวางบิล</Label>
                  <p>{new Date(selectedBill.billDate).toLocaleDateString('th-TH')}</p>
                </div>
                <div>
                  <Label>วันครบกำหนด</Label>
                  <p>{new Date(selectedBill.dueDate).toLocaleDateString('th-TH')}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <Label>รายการสินค้า</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สินค้า</TableHead>
                      <TableHead className="text-center">จำนวน</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              รหัส: {item.productCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">฿{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{item.totalPrice.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>ยอดรวมก่อน VAT:</span>
                  <span className="font-medium">฿{selectedBill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT {selectedBill.vatRate}%:</span>
                  <span className="font-medium">฿{selectedBill.vatAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{selectedBill.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedBill.notes && (
                <div>
                  <Label>หมายเหตุ</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedBill.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}