import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Plus,
  Trash2,
  CalendarIcon,
  Package,
  Search,
  AlertCircle,
} from 'lucide-react';
import {
  CreateTransferRequestData,
  TransferRequestPriority,
  Warehouse,
  Product,
} from '@/types/transfer';
import { useTransferRequests } from '@/hooks/useTransfer';

// Mock data - replace with actual API calls
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'คลังสินค้าหลัก',
    code: 'WH001',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    phone: '02-123-4567',
    email: 'main@warehouse.com',
    manager_name: 'สมชาย ใจดี',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'คลังสินค้าสาขา 1',
    code: 'WH002',
    address: '456 ถนนพหลโยธิน กรุงเทพฯ 10400',
    phone: '02-234-5678',
    email: 'branch1@warehouse.com',
    manager_name: 'สมหญิง รักดี',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'คลังสินค้าสาขา 2',
    code: 'WH003',
    address: '789 ถนนรัชดาภิเษก กรุงเทพฯ 10310',
    phone: '02-345-6789',
    email: 'branch2@warehouse.com',
    manager_name: 'สมศักดิ์ มีใจ',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
    sku: 'SF-COM-001',
    description: 'โซฟา 3 ที่นั่ง หุ้มผ้า สีเทา',
    category: 'โซฟา',
    brand: 'ComfortHome',
    unit: 'ตัว',
    weight: 45.5,
    dimensions: '200x90x85',
    cost_price: 15000,
    selling_price: 25000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'โต๊ะทำงาน รุ่น Executive',
    sku: 'TB-EXE-001',
    description: 'โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.',
    category: 'โต๊ะ',
    brand: 'OfficePro',
    unit: 'ตัว',
    weight: 25.0,
    dimensions: '120x60x75',
    cost_price: 8000,
    selling_price: 15000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'เก้าอี้สำนักงาน รุ่น Ergonomic',
    sku: 'CH-ERG-001',
    description: 'เก้าอี้สำนักงาน ปรับระดับได้ มีพนักพิง',
    category: 'เก้าอี้',
    brand: 'ErgoChair',
    unit: 'ตัว',
    weight: 12.5,
    dimensions: '60x60x110',
    cost_price: 3500,
    selling_price: 7000,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const transferRequestSchema = z.object({
  from_warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้าต้นทาง'),
  to_warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้าปลายทาง'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  required_date: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
      requested_quantity: z.number().min(1, 'จำนวนต้องมากกว่า 0'),
      unit_price: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
      notes: z.string().optional(),
    })
  ).min(1, 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'),
}).refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
  message: 'คลังสินค้าต้นทางและปลายทางต้องไม่เหมือนกัน',
  path: ['to_warehouse_id'],
});

type TransferRequestFormData = z.infer<typeof transferRequestSchema>;

interface CreateTransferRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreated?: () => void;
}

const getPriorityColor = (priority: TransferRequestPriority) => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'urgent':
      return 'bg-red-200 text-red-900 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityText = (priority: TransferRequestPriority) => {
  switch (priority) {
    case 'low':
      return 'ต่ำ';
    case 'medium':
      return 'ปานกลาง';
    case 'high':
      return 'สูง';
    case 'urgent':
      return 'เร่งด่วน';
    default:
      return priority;
  }
};

export const CreateTransferRequest: React.FC<CreateTransferRequestProps> = ({
  open,
  onOpenChange,
  onRequestCreated,
}) => {
  const { createRequest } = useTransferRequests();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  const form = useForm<TransferRequestFormData>({
    resolver: zodResolver(transferRequestSchema),
    defaultValues: {
      from_warehouse_id: '',
      to_warehouse_id: '',
      priority: 'medium',
      required_date: undefined,
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + (item.requested_quantity || 0) * (item.unit_price || 0),
    0
  );

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProduct = (product: Product) => {
    const existingIndex = fields.findIndex((field) => field.product_id === product.id);
    
    if (existingIndex >= 0) {
      // If product already exists, increase quantity
      const currentQuantity = form.getValues(`items.${existingIndex}.requested_quantity`) || 0;
      form.setValue(`items.${existingIndex}.requested_quantity`, currentQuantity + 1);
    } else {
      // Add new product
      append({
        product_id: product.id,
        requested_quantity: 1,
        unit_price: product.selling_price || 0,
        notes: '',
      });
    }
    
    setProductSearch('');
    setShowProductSearch(false);
  };

  const getProductById = (id: string) => {
    return mockProducts.find((product) => product.id === id);
  };

  const onSubmit = async (data: TransferRequestFormData) => {
    try {
      setIsSubmitting(true);
      
      const requestData: CreateTransferRequestData = {
        from_warehouse_id: data.from_warehouse_id,
        to_warehouse_id: data.to_warehouse_id,
        priority: data.priority,
        required_date: data.required_date?.toISOString(),
        notes: data.notes,
        items: data.items.map((item) => ({
          product_id: item.product_id,
          requested_quantity: item.requested_quantity,
          unit_price: item.unit_price,
          notes: item.notes,
        })),
      };

      await createRequest(requestData);
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      onRequestCreated?.();
    } catch (error) {
      console.error('Error creating transfer request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            สร้างคำขอโอนย้ายสินค้า
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
                <CardDescription>
                  กรุณากรอกข้อมูลพื้นฐานของคำขอโอนย้ายสินค้า
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>คลังสินค้าต้นทาง *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกคลังสินค้าต้นทาง" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockWarehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} ({warehouse.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="to_warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>คลังสินค้าปลายทาง *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกคลังสินค้าปลายทาง" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockWarehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} ({warehouse.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ลำดับความสำคัญ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกลำดับความสำคัญ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor('low')}>
                                  {getPriorityText('low')}
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor('medium')}>
                                  {getPriorityText('medium')}
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor('high')}>
                                  {getPriorityText('high')}
                                </Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="urgent">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor('urgent')}>
                                  {getPriorityText('urgent')}
                                </Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="required_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>วันที่ต้องการ</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'dd MMM yyyy', { locale: th })
                                ) : (
                                  <span>เลือกวันที่</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมายเหตุ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="หมายเหตุเพิ่มเติม..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>รายการสินค้า</span>
                  <div className="text-sm font-normal text-gray-600">
                    ยอดรวม: {totalAmount.toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    })}
                  </div>
                </CardTitle>
                <CardDescription>
                  เพิ่มสินค้าที่ต้องการโอนย้าย
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Search */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="ค้นหาสินค้า (ชื่อ หรือ SKU)..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductSearch(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowProductSearch(productSearch.length > 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Product Search Results */}
                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => addProduct(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                              <p className="text-xs text-gray-500">{product.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {product.selling_price?.toLocaleString('th-TH', {
                                  style: 'currency',
                                  currency: 'THB',
                                })}
                              </p>
                              <p className="text-xs text-gray-500">{product.unit}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items Table */}
                {fields.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="w-32">จำนวน</TableHead>
                        <TableHead className="w-32">ราคาต่อหน่วย</TableHead>
                        <TableHead className="w-32">ยอดรวม</TableHead>
                        <TableHead className="w-20">ลบ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const product = getProductById(field.product_id);
                        const quantity = form.watch(`items.${index}.requested_quantity`) || 0;
                        const unitPrice = form.watch(`items.${index}.unit_price`) || 0;
                        const itemTotal = quantity * unitPrice;

                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {product?.name || 'ไม่พบสินค้า'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {product?.sku || 'N/A'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.requested_quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.unit_price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {itemTotal.toLocaleString('th-TH', {
                                  style: 'currency',
                                  currency: 'THB',
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>ยังไม่มีสินค้าในรายการ</p>
                    <p className="text-sm">ใช้ช่องค้นหาด้านบนเพื่อเพิ่มสินค้า</p>
                  </div>
                )}

                {form.formState.errors.items && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{form.formState.errors.items.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างคำขอ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};