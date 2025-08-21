import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { SupplierService } from '@/services/supplierService';
import { WarehouseService } from '@/services/warehouseService';

interface Product {
  id: string;
  productName: string;
  productCode: string;
  category?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
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
  taxId?: string;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  status: string;
  notes?: string;
}

interface ReceiveItem {
  id: string;
  product: Product;
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

interface UseGoodsReceiptBillingProps {
  branchId?: string;
}

export function useGoodsReceiptBilling({ branchId }: UseGoodsReceiptBillingProps) {
  const { toast } = useToast();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptData, setReceiptData] = useState<any>(null);

  // Workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: 'เชื่อมโยงซัพพลายเออร์',
      description: 'เลือกซัพพลายเออร์และกรอกข้อมูลใบวางบิล',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 2,
      title: 'เลือกสินค้า',
      description: 'เลือกสินค้าที่ต้องการรับเข้า',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 3,
      title: 'ระบุจำนวนและราคา',
      description: 'กำหนดจำนวนและราคาต่อหน่วยของสินค้า',
      completed: currentStep > 3,
      active: currentStep === 3
    },
    {
      id: 4,
      title: 'สร้าง Serial Number',
      description: 'สร้าง Serial Number อัตโนมัติสำหรับสินค้า',
      completed: currentStep > 4,
      active: currentStep === 4
    }
  ];

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!branchId) return;
    
    setIsLoading(true);
    try {
      // Try to load from Supabase first
      const [productsResult, suppliersData] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('branch_id', branchId)
          .eq('status', 'active'),
        SupplierService.getSuppliers({ status: 'active' })
      ]);

      if (productsResult.error) throw productsResult.error;

      // Map database fields to interface
      const mappedProducts = (productsResult.data || []).map(product => ({
        ...product,
        productName: product.name,
        productCode: product.product_code,
        imageUrl: product.image_url
      }));

      setProducts(mappedProducts);
      setSuppliers(suppliersData || []);
      setFilteredProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading initial data:', error);
      
      // Fallback to sample data when Supabase is not available
      const sampleSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          supplierName: 'บริษัท เฟอร์นิเจอร์ ดีไซน์ จำกัด',
          supplierCode: 'FD001',
          contactPerson: 'คุณสมชาย ใจดี',
          phone: '02-123-4567',
          email: 'contact@furnituredesign.co.th',
          address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
          taxId: '0123456789012',
          paymentTerms: 30,
          creditLimit: 500000,
          currentBalance: 125000,
          status: 'active',
          notes: 'ซัพพลายเออร์หลักสำหรับเฟอร์นิเจอร์ไม้'
        },
        {
          id: 'supplier-2',
          supplierName: 'บริษัท โมเดิร์น ลิฟวิ่ง จำกัด',
          supplierCode: 'ML002',
          contactPerson: 'คุณสุดา สวยงาม',
          phone: '02-987-6543',
          email: 'info@modernliving.co.th',
          address: '456 ถนนพระราม 4 แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
          taxId: '0987654321098',
          paymentTerms: 45,
          creditLimit: 750000,
          currentBalance: 0,
          status: 'active',
          notes: 'ผู้จำหน่ายเฟอร์นิเจอร์โมเดิร์น'
        },
        {
          id: 'supplier-3',
          supplierName: 'ห้างหุ้นส่วนจำกัด คลาสสิค ฟอร์นิเจอร์',
          supplierCode: 'CF003',
          contactPerson: 'คุณประยุทธ มั่นคง',
          phone: '02-555-1234',
          email: 'sales@classicfurniture.co.th',
          address: '789 ถนนลาดพร้าว แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
          taxId: '0555123456789',
          paymentTerms: 60,
          creditLimit: 1000000,
          currentBalance: 250000,
          status: 'active',
          notes: 'ผู้เชี่ยวชาญเฟอร์นิเจอร์คลาสสิค'
        }
      ];
      
      const sampleProducts: Product[] = [
         {
           id: 'product-1',
           productName: 'โซฟา 3 ที่นั่ง รุ่น คอมฟอร์ต',
           productCode: 'SF-COM-001',
           category: 'โซฟา',
           unit: 'ตัว',
           description: 'โซฟา 3 ที่นั่ง หุ้มผ้า สีเทา สไตล์โมเดิร์น',
           imageUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Sofa',
           status: 'active'
         },
         {
           id: 'product-2',
           productName: 'โต๊ะทำงาน รุ่น เอ็กเซ็กคิวทีฟ',
           productCode: 'TB-EXE-001',
           category: 'โต๊ะ',
           unit: 'ตัว',
           description: 'โต๊ะทำงานไม้สัก ขนาด 120x60 ซม. พร้อมลิ้นชัก',
           imageUrl: 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Desk',
           status: 'active'
         },
         {
           id: 'product-3',
           productName: 'เก้าอี้สำนักงาน รุ่น เอ็กเซ็กคิวทีฟ',
           productCode: 'CH-EXE-001',
           category: 'เก้าอี้',
           unit: 'ตัว',
           description: 'เก้าอี้สำนักงานหนังแท้ ปรับระดับได้',
           imageUrl: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Chair',
           status: 'active'
         },
         {
           id: 'product-4',
           productName: 'ตู้เสื้อผ้า 3 บาน รุ่น คลาสสิค',
           productCode: 'WD-CLA-001',
           category: 'ตู้',
           unit: 'ตัว',
           description: 'ตู้เสื้อผ้าไม้สัก 3 บาน พร้อมกระจก',
           imageUrl: 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Wardrobe',
           status: 'active'
         },
         {
           id: 'product-5',
           productName: 'เตียงนอน รุ่น ลักซ์ชัวรี่',
           productCode: 'BD-LUX-001',
           category: 'เตียง',
           unit: 'ตัว',
           description: 'เตียงนอนขนาด 6 ฟุต หัวเตียงหุ้มหนัง',
           imageUrl: 'https://via.placeholder.com/400x300/EA580C/FFFFFF?text=Bed',
           status: 'active'
         },
         {
           id: 'product-6',
           productName: 'โต๊ะกาแฟ รุ่น โมเดิร์น',
           productCode: 'CT-MOD-001',
           category: 'โต๊ะ',
           unit: 'ตัว',
           description: 'โต๊ะกาแฟกระจกใส ขาสแตนเลส',
           imageUrl: 'https://via.placeholder.com/400x300/0891B2/FFFFFF?text=Coffee+Table',
           status: 'active'
         }
       ];
      
      setSuppliers(sampleSuppliers);
      setProducts(sampleProducts);
      setFilteredProducts(sampleProducts);
      
      toast({
        title: 'ใช้ข้อมูลตัวอย่าง',
        description: 'เชื่อมต่อฐานข้อมูลไม่ได้ กำลังใช้ข้อมูลตัวอย่าง',
        variant: 'default'
      });
    } finally {
      setIsLoading(false);
    }
  }, [branchId, toast]);

  // Filter products based on search term
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [products, productSearchTerm]);

  // Generate serial number
  const generateSerialNumber = useCallback(() => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SN${timestamp.slice(-6)}${random}`;
  }, []);

  // Item management functions
  const addItem = useCallback((product: Product) => {
    const existingItem = items.find(item => item.product.id === product.id);
    if (existingItem) {
      toast({
        title: 'สินค้าถูกเลือกแล้ว',
        description: 'สินค้านี้อยู่ในรายการแล้ว',
        variant: 'destructive'
      });
      return;
    }

    const newItem: ReceiveItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      product,
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      serialNumbers: []
    };

    setItems(prev => [...prev, newItem]);
    toast({
      title: 'เพิ่มสินค้าสำเร็จ',
      description: `เพิ่ม ${product.productName} ลงในรายการแล้ว`
    });
  }, [items, toast]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const totalCost = quantity * item.unitCost;
        return { ...item, quantity, totalCost };
      }
      return item;
    }));
  }, []);

  const updateItemUnitCost = useCallback((itemId: string, unitCost: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const totalCost = item.quantity * unitCost;
        return { ...item, unitCost, totalCost };
      }
      return item;
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: 'ลบสินค้าสำเร็จ',
      description: 'ลบสินค้าออกจากรายการแล้ว'
    });
  }, [toast]);

  // Validation functions
  const validateCurrentStep = useCallback(() => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!selectedSupplierId) {
          newErrors.supplier = 'กรุณาเลือกซัพพลายเออร์';
        }
        break;
      case 2:
        if (items.length === 0) {
          newErrors.items = 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ';
        }
        break;
      case 3:
        items.forEach(item => {
          if (item.quantity <= 0) {
            newErrors[`quantity-${item.id}`] = 'จำนวนต้องมากกว่า 0';
          }
          if (item.unitCost <= 0) {
            newErrors[`unitCost-${item.id}`] = 'ราคาต่อหน่วยต้องมากกว่า 0';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, selectedSupplierId, items]);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Generate serial numbers for all items
  const generateAllSerialNumbers = useCallback(() => {
    setItems(prev => prev.map(item => {
      const serialNumbers = Array.from({ length: item.quantity }, () => generateSerialNumber());
      return { ...item, serialNumbers };
    }));
  }, [generateSerialNumber]);

  // Complete workflow
  const completeWorkflow = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsProcessing(true);
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
      const receiptNumber = `GR-${Date.now()}`;

      // บันทึกข้อมูลการรับสินค้าลงฐานข้อมูล
      const receiveData = {
        warehouseId: branchId, // ใช้ branchId เป็น warehouseId
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitCost: item.unitCost
        })),
        notes: notes || undefined,
        receivedBy: 'current-user' // TODO: ใช้ user ID จริงจาก auth
      };

      // เรียกใช้ WarehouseService เพื่อบันทึกข้อมูล
      const result = await WarehouseService.receiveGoods(receiveData);

      const receiptData = {
        receiptNumber: result.receiveLog.receiveNumber,
        supplierId: selectedSupplierId,
        invoiceNumber,
        deliveryDate,
        notes,
        items,
        totalAmount,
        branchId,
        createdAt: new Date().toISOString(),
        receiveLogId: result.receiveLog.id
      };

      setReceiptData(receiptData);
      
      toast({
        title: 'รับสินค้าสำเร็จ',
        description: `หมายเลขใบรับ: ${result.receiveLog.receiveNumber} - บันทึกลงฐานข้อมูลแล้ว`
      });
    } catch (error) {
      console.error('Error completing workflow:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถบันทึกการรับสินค้าได้',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [validateCurrentStep, items, selectedSupplierId, invoiceNumber, deliveryDate, notes, branchId, toast]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setSelectedSupplierId('');
    setInvoiceNumber('');
    setDeliveryDate('');
    setNotes('');
    setItems([]);
    setProductSearchTerm('');
    setShowProductSearch(false);
    setErrors({});
    setReceiptData(null);
  }, []);

  return {
    // State
    products,
    suppliers,
    filteredProducts,
    currentStep,
    workflowSteps,
    selectedSupplierId,
    invoiceNumber,
    deliveryDate,
    notes,
    items,
    isLoading,
    isProcessing,
    productSearchTerm,
    showProductSearch,
    errors,
    receiptData,
    
    // Actions
    setSelectedSupplierId,
    setInvoiceNumber,
    setDeliveryDate,
    setNotes,
    setProductSearchTerm,
    setShowProductSearch: () => setShowProductSearch(prev => !prev),
    loadInitialData,
    addItem,
    updateItemQuantity,
    updateItemUnitCost,
    removeItem,
    nextStep,
    prevStep,
    generateAllSerialNumbers,
    completeWorkflow,
    resetForm
  };
}