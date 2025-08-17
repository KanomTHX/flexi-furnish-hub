import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  User, 
  Building2, 
  Tag, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Layers, 
  Database, 
  FileSpreadsheet, 
  Scan, 
  QrCode, 
  Hash, 
  List, 
  Grid, 
  ArrowRight, 
  Copy, 
  Settings, 
  Save, 
  X
} from 'lucide-react';

// Types for Batch Management
interface SerialNumberBatch {
  id: string;
  batchNumber: string;
  productSku: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  totalQuantity: number;
  processedQuantity: number;
  validQuantity: number;
  invalidQuantity: number;
  duplicateQuantity: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  serialNumbers: BatchSerialNumber[];
  validationRules: ValidationRule[];
  errors: BatchError[];
  metadata?: Record<string, any>;
}

interface BatchSerialNumber {
  id: string;
  serialNumber: string;
  status: 'valid' | 'invalid' | 'duplicate' | 'pending';
  validationErrors: string[];
  warehouseLocation?: {
    warehouseId: string;
    zoneId?: string;
    shelfId?: string;
    position?: string;
  };
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  processedAt?: Date;
}

interface ValidationRule {
  id: string;
  name: string;
  type: 'format' | 'length' | 'prefix' | 'suffix' | 'pattern' | 'uniqueness' | 'custom';
  rule: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning';
}

interface BatchError {
  id: string;
  type: 'validation' | 'duplicate' | 'format' | 'system';
  severity: 'error' | 'warning' | 'info';
  message: string;
  serialNumber?: string;
  lineNumber?: number;
  timestamp: Date;
}

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  format: 'csv' | 'excel' | 'json' | 'xml';
  columns: TemplateColumn[];
  validationRules: ValidationRule[];
  isDefault: boolean;
  createdAt: Date;
}

interface TemplateColumn {
  id: string;
  name: string;
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  validation?: string;
}

interface SerialNumberBatchProps {
  warehouseId?: string;
  onBatchComplete?: (batch: SerialNumberBatch) => void;
  onSerialNumbersGenerated?: (serialNumbers: string[]) => void;
}

export function SerialNumberBatch({ warehouseId, onBatchComplete, onSerialNumbersGenerated }: SerialNumberBatchProps) {
  const [batches, setBatches] = useState<SerialNumberBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<SerialNumberBatch[]>([]);
  const [templates, setTemplates] = useState<BatchTemplate[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SerialNumberBatch | null>(null);
  const [activeTab, setActiveTab] = useState('batches');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for batches
  const mockBatches: SerialNumberBatch[] = [
    {
      id: 'batch-001',
      batchNumber: 'BATCH-2024-001',
      productSku: 'SOFA-CP-3S-BRN',
      productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort Plus',
      supplierId: 'sup-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ พลัส จำกัด',
      purchaseOrderId: 'po-001',
      purchaseOrderNumber: 'PO-2024-001',
      totalQuantity: 50,
      processedQuantity: 50,
      validQuantity: 48,
      invalidQuantity: 1,
      duplicateQuantity: 1,
      status: 'completed',
      createdAt: new Date('2024-01-15T09:00:00'),
      processedAt: new Date('2024-01-15T09:15:00'),
      completedAt: new Date('2024-01-15T09:30:00'),
      createdBy: {
        id: 'emp-001',
        name: 'สมชาย ใจดี',
        role: 'พนักงานรับสินค้า'
      },
      serialNumbers: [],
      validationRules: [
        {
          id: 'rule-001',
          name: 'รูปแบบ Serial Number',
          type: 'pattern',
          rule: '^SN[0-9]{10}$',
          description: 'ต้องขึ้นต้นด้วย SN ตามด้วยตัวเลข 10 หลัก',
          enabled: true,
          severity: 'error'
        },
        {
          id: 'rule-002',
          name: 'ความยาว',
          type: 'length',
          rule: '12',
          description: 'ความยาวต้องเป็น 12 ตัวอักษร',
          enabled: true,
          severity: 'error'
        }
      ],
      errors: [
        {
          id: 'error-001',
          type: 'validation',
          severity: 'error',
          message: 'Serial Number ไม่ตรงตามรูปแบบที่กำหนด',
          serialNumber: 'SN202400100X',
          lineNumber: 25,
          timestamp: new Date('2024-01-15T09:20:00')
        },
        {
          id: 'error-002',
          type: 'duplicate',
          severity: 'warning',
          message: 'Serial Number ซ้ำกับข้อมูลที่มีอยู่',
          serialNumber: 'SN2024001001',
          lineNumber: 35,
          timestamp: new Date('2024-01-15T09:25:00')
        }
      ]
    },
    {
      id: 'batch-002',
      batchNumber: 'BATCH-2024-002',
      productSku: 'WARD-CL-4D-WHT',
      productName: 'ตู้เสื้อผ้า 4 บาน รุ่น Classic',
      supplierId: 'sup-002',
      supplierName: 'บริษัท คลาสสิค เฟอร์นิเจอร์ จำกัด',
      purchaseOrderId: 'po-002',
      purchaseOrderNumber: 'PO-2024-002',
      totalQuantity: 30,
      processedQuantity: 15,
      validQuantity: 15,
      invalidQuantity: 0,
      duplicateQuantity: 0,
      status: 'processing',
      createdAt: new Date('2024-01-20T10:00:00'),
      processedAt: new Date('2024-01-20T10:05:00'),
      createdBy: {
        id: 'emp-002',
        name: 'สมหญิง รักงาน',
        role: 'พนักงานจัดเก็บ'
      },
      serialNumbers: [],
      validationRules: [],
      errors: []
    },
    {
      id: 'batch-003',
      batchNumber: 'BATCH-2024-003',
      productSku: 'BED-LX-6F-BLK',
      productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
      supplierId: 'sup-003',
      supplierName: 'บริษัท ลักซ์ชัวรี่ เฟอร์นิเจอร์ จำกัด',
      purchaseOrderId: 'po-003',
      purchaseOrderNumber: 'PO-2024-003',
      totalQuantity: 25,
      processedQuantity: 0,
      validQuantity: 0,
      invalidQuantity: 0,
      duplicateQuantity: 0,
      status: 'pending',
      createdAt: new Date('2024-01-25T14:00:00'),
      createdBy: {
        id: 'emp-003',
        name: 'สมปอง ขยัน',
        role: 'พนักงานขาย'
      },
      serialNumbers: [],
      validationRules: [],
      errors: []
    }
  ];

  // Mock templates
  const mockTemplates: BatchTemplate[] = [
    {
      id: 'template-001',
      name: 'เทมเพลตมาตรฐาน',
      description: 'เทมเพลตสำหรับนำเข้า Serial Number ทั่วไป',
      format: 'csv',
      columns: [
        {
          id: 'col-001',
          name: 'Serial Number',
          field: 'serialNumber',
          type: 'string',
          required: true
        },
        {
          id: 'col-002',
          name: 'Product SKU',
          field: 'productSku',
          type: 'string',
          required: true
        },
        {
          id: 'col-003',
          name: 'Condition',
          field: 'condition',
          type: 'string',
          required: false,
          defaultValue: 'excellent'
        }
      ],
      validationRules: [],
      isDefault: true,
      createdAt: new Date('2024-01-01T00:00:00')
    }
  ];

  React.useEffect(() => {
    setBatches(mockBatches);
    setTemplates(mockTemplates);
  }, []);

  // Filter batches
  React.useEffect(() => {
    let filtered = batches;

    if (searchTerm) {
      filtered = filtered.filter(batch => 
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(batch => batch.status === filterStatus);
    }

    setFilteredBatches(filtered);
  }, [batches, searchTerm, filterStatus]);

  const getStatusBadge = (status: SerialNumberBatch['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-gray-500 text-white">รอดำเนินการ</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 text-white">กำลังประมวลผล</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">เสร็จสิ้น</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">ล้มเหลว</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-500 text-white">ยกเลิก</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getProgressPercentage = (batch: SerialNumberBatch) => {
    if (batch.totalQuantity === 0) return 0;
    return Math.round((batch.processedQuantity / batch.totalQuantity) * 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate file processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setShowImportDialog(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleGenerateSerialNumbers = (count: number, prefix: string, pattern: string) => {
    const generated: string[] = [];
    for (let i = 1; i <= count; i++) {
      const number = i.toString().padStart(6, '0');
      generated.push(`${prefix}${number}`);
    }
    
    if (onSerialNumbersGenerated) {
      onSerialNumbersGenerated(generated);
    }
    
    setShowGenerateDialog(false);
  };

  const handleBatchAction = (batchId: string, action: 'process' | 'cancel' | 'retry' | 'delete') => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    switch (action) {
      case 'process':
        // Start processing
        setBatches(prev => prev.map(b => 
          b.id === batchId ? { ...b, status: 'processing' as const, processedAt: new Date() } : b
        ));
        break;
      case 'cancel':
        setBatches(prev => prev.map(b => 
          b.id === batchId ? { ...b, status: 'cancelled' as const } : b
        ));
        break;
      case 'retry':
        setBatches(prev => prev.map(b => 
          b.id === batchId ? { ...b, status: 'pending' as const, errors: [] } : b
        ));
        break;
      case 'delete':
        setBatches(prev => prev.filter(b => b.id !== batchId));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            จัดการ Serial Number แบบกลุ่ม
          </h2>
          <p className="text-muted-foreground">
            นำเข้า สร้าง และจัดการ Serial Number จำนวนมากพร้อมกัน
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Hash className="w-4 h-4 mr-2" />
                สร้าง SN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้าง Serial Number อัตโนมัติ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="100" min="1" max="10000" />
                  </div>
                  <div>
                    <Label>คำนำหน้า</Label>
                    <Input placeholder="SN2024" />
                  </div>
                </div>
                <div>
                  <Label>รูปแบบ</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกรูปแบบ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">ลำดับต่อเนื่อง (001, 002, 003...)</SelectItem>
                      <SelectItem value="random">สุ่ม</SelectItem>
                      <SelectItem value="date">รวมวันที่</SelectItem>
                      <SelectItem value="custom">กำหนดเอง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ตัวอย่าง</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm font-mono">
                    SN2024000001, SN2024000002, SN2024000003...
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => handleGenerateSerialNumbers(100, 'SN2024', 'sequential')}>
                    สร้าง
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                นำเข้าไฟล์
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>นำเข้า Serial Number จากไฟล์</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>เลือกเทมเพลต</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเทมเพลต" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.format.toUpperCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ไฟล์ข้อมูล</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.json,.xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      ลากไฟล์มาวางที่นี่ หรือ
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      เลือกไฟล์
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      รองรับ CSV, Excel, JSON, XML (ขนาดไม่เกิน 10MB)
                    </p>
                  </div>
                </div>
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>กำลังประมวลผล...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button disabled={isProcessing}>
                    นำเข้า
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                สร้างแบทช์ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>สร้างแบทช์ Serial Number ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>หมายเลขแบทช์</Label>
                    <Input placeholder="BATCH-2024-XXX" />
                  </div>
                  <div>
                    <Label>Purchase Order</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก PO" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="po-001">PO-2024-001</SelectItem>
                        <SelectItem value="po-002">PO-2024-002</SelectItem>
                        <SelectItem value="po-003">PO-2024-003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>สินค้า</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOFA-CP-3S-BRN">โซฟา 3 ที่นั่ง รุ่น Comfort Plus</SelectItem>
                        <SelectItem value="WARD-CL-4D-WHT">ตู้เสื้อผ้า 4 บาน รุ่น Classic</SelectItem>
                        <SelectItem value="BED-LX-6F-BLK">เตียงนอน 6 ฟุต รุ่น Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="50" min="1" />
                  </div>
                </div>
                <div>
                  <Label>ซัพพลายเออร์</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกซัพพลายเออร์" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sup-001">บริษัท เฟอร์นิเจอร์ พลัส จำกัด</SelectItem>
                      <SelectItem value="sup-002">บริษัท คลาสสิค เฟอร์นิเจอร์ จำกัด</SelectItem>
                      <SelectItem value="sup-003">บริษัท ลักซ์ชัวรี่ เฟอร์นิเจอร์ จำกัด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea placeholder="รายละเอียดเพิ่มเติม..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setShowCreateDialog(false)}>
                    สร้างแบทช์
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{batches.length}</div>
                <div className="text-sm text-muted-foreground">แบทช์ทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {batches.filter(b => b.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">รอดำเนินการ</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {batches.filter(b => b.status === 'processing').length}
                </div>
                <div className="text-sm text-muted-foreground">กำลังประมวลผล</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {batches.filter(b => b.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">เสร็จสิ้น</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {batches.filter(b => b.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">ล้มเหลว</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {batches.reduce((sum, b) => sum + b.validQuantity, 0)}
                </div>
                <div className="text-sm text-muted-foreground">SN ที่ถูกต้อง</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="ค้นหาแบทช์, สินค้า, ซัพพลายเออร์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="processing">กำลังประมวลผล</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="failed">ล้มเหลว</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batches">แบทช์</TabsTrigger>
          <TabsTrigger value="templates">เทมเพลต</TabsTrigger>
          <TabsTrigger value="validation">กฎการตรวจสอบ</TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>แบทช์ Serial Number</span>
                <Badge variant="outline">
                  {filteredBatches.length} แบทช์
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีแบทช์</p>
                    <p className="text-sm">ไม่พบแบทช์ที่ตรงกับเงื่อนไขที่เลือก</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                    {filteredBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${
                          viewMode === 'list' ? 'flex items-center gap-4' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{batch.batchNumber}</h4>
                            {getStatusBadge(batch.status)}
                            {batch.errors.length > 0 && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                {batch.errors.length} ข้อผิดพลาด
                              </Badge>
                            )}
                          </div>

                          <div className={`text-sm space-y-2 ${
                            viewMode === 'list' ? 'grid grid-cols-4 gap-4' : ''
                          }`}>
                            <div>
                              <span className="text-muted-foreground">สินค้า:</span>
                              <p className="font-medium">{batch.productName}</p>
                              <p className="text-xs text-muted-foreground">{batch.productSku}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">ซัพพลายเออร์:</span>
                              <p className="font-medium">{batch.supplierName}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">จำนวน:</span>
                              <p className="font-medium">
                                {batch.processedQuantity}/{batch.totalQuantity}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">สร้างเมื่อ:</span>
                              <p className="font-medium">{formatDate(batch.createdAt)}</p>
                            </div>
                          </div>

                          {/* Progress */}
                          {batch.status === 'processing' && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>ความคืบหน้า</span>
                                <span>{getProgressPercentage(batch)}%</span>
                              </div>
                              <Progress value={getProgressPercentage(batch)} className="w-full" />
                            </div>
                          )}

                          {/* Summary */}
                          {batch.status === 'completed' && (
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="font-medium text-green-700">{batch.validQuantity}</div>
                                <div className="text-green-600">ถูกต้อง</div>
                              </div>
                              <div className="text-center p-2 bg-red-50 rounded">
                                <div className="font-medium text-red-700">{batch.invalidQuantity}</div>
                                <div className="text-red-600">ผิดพลาด</div>
                              </div>
                              <div className="text-center p-2 bg-yellow-50 rounded">
                                <div className="font-medium text-yellow-700">{batch.duplicateQuantity}</div>
                                <div className="text-yellow-600">ซ้ำ</div>
                              </div>
                            </div>
                          )}

                          {/* Errors */}
                          {batch.errors.length > 0 && (
                            <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                              <div className="flex items-center gap-2 text-red-700 mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-medium">ข้อผิดพลาดล่าสุด:</span>
                              </div>
                              <p className="text-red-600">{batch.errors[0].message}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className={`flex gap-2 ${
                          viewMode === 'list' ? 'flex-col' : 'flex-row mt-4'
                        }`}>
                          {batch.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleBatchAction(batch.id, 'process')}
                            >
                              เริ่มประมวลผล
                            </Button>
                          )}
                          {batch.status === 'processing' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleBatchAction(batch.id, 'cancel')}
                            >
                              ยกเลิก
                            </Button>
                          )}
                          {batch.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleBatchAction(batch.id, 'retry')}
                            >
                              ลองใหม่
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleBatchAction(batch.id, 'delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>เทมเพลตการนำเข้า</span>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างเทมเพลต
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{template.name}</h4>
                          <Badge className={`text-xs ${
                            template.format === 'csv' ? 'bg-green-100 text-green-800' :
                            template.format === 'excel' ? 'bg-blue-100 text-blue-800' :
                            template.format === 'json' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {template.format.toUpperCase()}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline">ค่าเริ่มต้น</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="text-sm">
                          <span className="text-muted-foreground">คอลัมน์: </span>
                          <span className="font-medium">
                            {template.columns.map(col => col.name).join(', ')}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">สร้างเมื่อ: </span>
                          <span className="font-medium">{formatDate(template.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>กฎการตรวจสอบ</span>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มกฎ
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีกฎการตรวจสอบ</p>
                  <p className="text-sm">สร้างกฎเพื่อตรวจสอบความถูกต้องของ Serial Number</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}