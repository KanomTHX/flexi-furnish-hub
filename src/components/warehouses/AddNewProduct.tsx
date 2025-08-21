import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Hash,
  DollarSign,
  Tag,
  FileText,
  Upload,
  X,
  Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBranchData } from '@/hooks/useBranchData';

// Types
interface NewProduct {
  product_code: string;
  name: string;
  description?: string;
  brand?: string;
  color?: string;
  model?: string;
  category?: string;
  min_stock_level: number;
  max_stock_level: number;
  unit: string;
  status: string;
  image_url?: string;
  branch_id?: string;
}

interface AddNewProductProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (product: any) => void;
  defaultData?: Partial<NewProduct>;
}

export function AddNewProduct({ isOpen, onClose, onProductAdded, defaultData }: AddNewProductProps) {
  const { toast } = useToast();
  const { currentBranch } = useBranchData();
  
  // Form state
  const [formData, setFormData] = useState<NewProduct>({
    product_code: defaultData?.product_code || '',
    name: defaultData?.name || '',
    description: defaultData?.description || '',
    brand: defaultData?.brand || '',
    color: defaultData?.color || '',
    model: defaultData?.model || '',
    category: defaultData?.category || 'เฟอร์นิเจอร์',
    min_stock_level: defaultData?.min_stock_level || 5,
    max_stock_level: defaultData?.max_stock_level || 1000,
    unit: defaultData?.unit || 'piece',
    status: 'active',
    image_url: defaultData?.image_url || ''
  });
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Categories
  const categories = [
    'เฟอร์นิเจอร์',
    'เครื่องใช้ไฟฟ้า',
    'เครื่องใช้ในบ้าน',
    'อุปกรณ์แต่งบ้าน',
    'เครื่องมือ',
    'อื่นๆ'
  ];

  // Units
  const units = [
    { value: 'piece', label: 'ชิ้น' },
    { value: 'set', label: 'ชุด' },
    { value: 'pair', label: 'คู่' },
    { value: 'box', label: 'กล่อง' },
    { value: 'pack', label: 'แพ็ค' },
    { value: 'meter', label: 'เมตร' },
    { value: 'kg', label: 'กิโลกรัม' },
    { value: 'liter', label: 'ลิตร' }
  ];

  const handleInputChange = (field: keyof NewProduct, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "ไฟล์ไม่ถูกต้อง",
          description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const uploadImage = async (file: File, productCode: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productCode}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const generateProductCode = () => {
    // Generate random 8-character code with letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setFormData(prev => ({ ...prev, product_code: code }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.product_code.trim()) {
      newErrors.product_code = 'กรุณาระบุรหัสสินค้า';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อสินค้า';
    }

    if (!formData.category) {
      newErrors.category = 'กรุณาเลือกหมวดหมู่';
    }

    if (!formData.unit) {
      newErrors.unit = 'กรุณาเลือกหน่วยนับ';
    }

    // Numeric validations

    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'สต็อกขั้นต่ำต้องไม่ติดลบ';
    }

    if (formData.max_stock_level <= formData.min_stock_level) {
      newErrors.max_stock_level = 'สต็อกสูงสุดต้องมากกว่าสต็อกขั้นต่ำ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkProductCodeExists = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('product_code', code)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking product code:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
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
      // Check if product code already exists
      const codeExists = await checkProductCodeExists(formData.product_code);
      if (codeExists) {
        setErrors({ product_code: 'รหัสสินค้านี้มีอยู่แล้ว กรุณาใช้รหัสอื่น' });
        toast({
          title: "รหัสสินค้าซ้ำ",
          description: "รหัสสินค้านี้มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น",
          variant: "destructive",
        });
        return;
      }

      let productData = { 
        ...formData,
        branch_id: currentBranch?.id || null
      };

      // Upload image if selected
      if (selectedImage) {
        const imageUrl = await uploadImage(selectedImage, formData.product_code);
        if (imageUrl) {
          productData.image_url = imageUrl;
        } else {
          toast({
            title: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
            description: "ระบบจะบันทึกข้อมูลสินค้าโดยไม่มีรูปภาพ",
            variant: "destructive",
          });
        }
      }

      // Insert new product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Success
      toast({
        title: "เพิ่มสินค้าสำเร็จ",
        description: `เพิ่มสินค้า "${formData.name}" เรียบร้อยแล้ว`,
        variant: "default",
      });

      // Call callback with new product
      if (onProductAdded) {
        onProductAdded(newProduct);
      }

      // Reset form and close
      resetForm();
      onClose();

    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเพิ่มสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_code: '',
      name: '',
      description: '',
      brand: '',
      color: '',
      model: '',
      category: 'เฟอร์นิเจอร์',
      min_stock_level: 5,
      max_stock_level: 1000,
      unit: 'piece',
      status: 'active',
      image_url: ''
    });
    setErrors({});
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            เพิ่มสินค้าใหม่
          </DialogTitle>
          <DialogDescription>
            เพิ่มข้อมูลสินค้าใหม่เข้าสู่ระบบ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_code">รหัสสินค้า *</Label>
              <div className="flex gap-2">
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => handleInputChange('product_code', e.target.value)}
                  placeholder="เช่น SOFA-001"
                  className={errors.product_code ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateProductCode}
                  title="สุ่มรหัสสินค้า"
                >
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
              {errors.product_code && (
                <p className="text-sm text-red-500">{errors.product_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="เช่น โซฟา 3 ที่นั่ง สีน้ำตาล"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบายสินค้า</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า"
              rows={3}
            />
          </div>

          {/* Brand, Color, and Model */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">ยี่ห้อ</Label>
              <Input
                id="brand"
                value={formData.brand || ''}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="เช่น IKEA, Index Living Mall"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">สี</Label>
              <Input
                id="color"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="เช่น น้ำตาล, ขาว, ดำ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">รุ่น</Label>
              <Input
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="เช่น Classic, Modern, Vintage"
              />
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-2">
            <Label>รูปภาพสินค้า</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                        <Upload className="h-4 w-4" />
                        คลิกเพื่อเลือกรูปภาพ
                      </div>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>หมวดหมู่ *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>หน่วยนับ *</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => handleInputChange('unit', value)}
              >
                <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                  <SelectValue placeholder="เลือกหน่วยนับ" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit}</p>
              )}
            </div>
          </div>



          {/* Stock Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">สต็อกขั้นต่ำ</Label>
              <Input
                id="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                placeholder="5"
                className={errors.min_stock_level ? 'border-red-500' : ''}
                min="0"
              />
              {errors.min_stock_level && (
                <p className="text-sm text-red-500">{errors.min_stock_level}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level">สต็อกสูงสุด</Label>
              <Input
                id="max_stock_level"
                type="number"
                value={formData.max_stock_level}
                onChange={(e) => handleInputChange('max_stock_level', parseInt(e.target.value) || 0)}
                placeholder="1000"
                className={errors.max_stock_level ? 'border-red-500' : ''}
                min="1"
              />
              {errors.max_stock_level && (
                <p className="text-sm text-red-500">{errors.max_stock_level}</p>
              )}
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังเพิ่มสินค้า...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  เพิ่มสินค้า
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}