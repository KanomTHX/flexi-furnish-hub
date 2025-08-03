import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  User, 
  Package, 
  FileText,
  Calendar,
  AlertTriangle,
  Save,
  X,
  Search
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  warrantyPeriod: number;
}

interface CreateClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  products: Product[];
  onCreateClaim: (claim: any) => void;
}

export function CreateClaimDialog({ 
  open, 
  onOpenChange, 
  customers,
  products,
  onCreateClaim
}: CreateClaimDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    issueDescription: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    purchaseDate: '',
    serialNumber: '',
    attachments: [] as File[],
    customerNotes: ''
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Filter customers and products
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.model.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number) => {
    const errors: string[] = [];
    
    switch (step) {
      case 0: // Customer selection
        if (!formData.customerId) {
          errors.push('กรุณาเลือกลูกค้า');
        }
        break;
      case 1: // Product selection
        if (!formData.productId) {
          errors.push('กรุณาเลือกสินค้า');
        }
        if (!formData.purchaseDate) {
          errors.push('กรุณาระบุวันที่ซื้อ');
        }
        break;
      case 2: // Issue details
        if (!formData.issueDescription.trim()) {
          errors.push('กรุณาอธิบายปัญหา');
        }
        if (!formData.category) {
          errors.push('กรุณาเลือกหมวดหมู่ปัญหา');
        }
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors([]);
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const allErrors = validateStep(2);
    
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newClaim = {
        id: `claim-${Date.now()}`,
        claimNumber: `CL${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
        customerId: formData.customerId,
        customer: selectedCustomer,
        productId: formData.productId,
        product: {
          ...selectedProduct,
          serialNumber: formData.serialNumber
        },
        issueDescription: formData.issueDescription,
        category: formData.category,
        priority: formData.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        purchaseDate: formData.purchaseDate,
        customerNotes: formData.customerNotes,
        assignedTo: null,
        resolution: null,
        customerSatisfaction: null
      };

      onCreateClaim(newClaim);
      
      toast({
        title: "สร้างเคลมสำเร็จ",
        description: `เคลม ${newClaim.claimNumber} ถูกสร้างและรอการดำเนินการ`,
      });

      // Reset form
      setFormData({
        customerId: '',
        productId: '',
        issueDescription: '',
        category: '',
        priority: 'medium',
        purchaseDate: '',
        serialNumber: '',
        attachments: [],
        customerNotes: ''
      });
      setCurrentStep(0);
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างเคลมได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      customerId: '',
      productId: '',
      issueDescription: '',
      category: '',
      priority: 'medium',
      purchaseDate: '',
      serialNumber: '',
      attachments: [],
      customerNotes: ''
    });
    setCurrentStep(0);
    setErrors([]);
    onOpenChange(false);
  };

  const steps = [
    { title: 'เลือกลูกค้า', icon: User },
    { title: 'เลือกสินค้า', icon: Package },
    { title: 'รายละเอียดปัญหา', icon: FileText }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            สร้างเคลมใหม่
          </DialogTitle>
          <DialogDescription>
            สร้างเคลมใหม่สำหรับลูกค้าและสินค้า
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className={`ml-2 text-sm font-medium ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">กรุณาแก้ไขข้อผิดพลาดต่อไปนี้:</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Step 0: Customer Selection */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  เลือกลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาลูกค้า..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.customerId === customer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('customerId', customer.id)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.phone} • {customer.email}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedCustomer && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">ลูกค้าที่เลือก:</div>
                    <div className="text-blue-800">{selectedCustomer.name}</div>
                    <div className="text-sm text-blue-700">
                      {selectedCustomer.phone} • {selectedCustomer.email}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Product Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  เลือกสินค้าและข้อมูลการซื้อ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาสินค้า..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.productId === product.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('productId', product.id)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.brand} • {product.model} • รับประกัน {product.warrantyPeriod} เดือน
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedProduct && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-900">สินค้าที่เลือก:</div>
                      <div className="text-blue-800">{selectedProduct.name}</div>
                      <div className="text-sm text-blue-700">
                        {selectedProduct.brand} • {selectedProduct.model}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchaseDate">
                          วันที่ซื้อ <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">หมายเลขเครื่อง/ซีเรียล</Label>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                          placeholder="เช่น SN123456789"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Issue Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  รายละเอียดปัญหา
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      หมวดหมู่ปัญหา <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defect">ของเสีย/บกพร่อง</SelectItem>
                        <SelectItem value="damage">ชำรุด/เสียหาย</SelectItem>
                        <SelectItem value="warranty">การรับประกัน</SelectItem>
                        <SelectItem value="service">บริการหลังการขาย</SelectItem>
                        <SelectItem value="installation">การติดตั้ง</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">ความสำคัญ</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">ต่ำ</SelectItem>
                        <SelectItem value="medium">ปานกลาง</SelectItem>
                        <SelectItem value="high">สูง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="issueDescription">
                    อธิบายปัญหา <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="issueDescription"
                    value={formData.issueDescription}
                    onChange={(e) => handleInputChange('issueDescription', e.target.value)}
                    placeholder="อธิบายปัญหาที่เกิดขึ้นอย่างละเอียด..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerNotes">หมายเหตุเพิ่มเติม</Label>
                  <Textarea
                    id="customerNotes"
                    value={formData.customerNotes}
                    onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                    placeholder="ข้อมูลเพิ่มเติมจากลูกค้า..."
                    rows={2}
                  />
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">สรุปข้อมูลเคลม</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>ลูกค้า:</strong> {selectedCustomer?.name}</div>
                    <div><strong>สินค้า:</strong> {selectedProduct?.name} ({selectedProduct?.model})</div>
                    <div><strong>วันที่ซื้อ:</strong> {formData.purchaseDate ? new Date(formData.purchaseDate).toLocaleDateString('th-TH') : '-'}</div>
                    <div><strong>หมวดหมู่:</strong> {formData.category || '-'}</div>
                    <div><strong>ความสำคัญ:</strong> {
                      formData.priority === 'high' ? 'สูง' :
                      formData.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'
                    }</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                ย้อนกลับ
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            
            {currentStep < 2 ? (
              <Button onClick={handleNext}>
                ถัดไป
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'กำลังสร้าง...' : 'สร้างเคลม'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}