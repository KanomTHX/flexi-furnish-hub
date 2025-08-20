import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRightLeft, 
  Database, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Tag, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Server, 
  Cloud, 
  HardDrive, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Router, 
  Cable, 
  Plug, 
  Power, 
  Signal, 
  Antenna, 
  Satellite, 
  Link, 
  Unlink, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Stop, 
  SkipForward, 
  SkipBack, 
  FastForward, 
  Rewind, 
  Code, 
  GitBranch, 
  GitMerge, 
  GitPullRequest, 
  Workflow, 
  Layers, 
  Map, 
  Navigation, 
  Compass, 
  Route, 
  MapPin
} from 'lucide-react';

// Types for Data Mapping
interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  required: boolean;
  format?: string;
  example?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
  };
}

interface DataMapping {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  description: string;
  category: 'products' | 'inventory' | 'orders' | 'shipping' | 'returns' | 'reports';
  sourceSchema: {
    name: string;
    version: string;
    fields: DataField[];
  };
  targetSchema: {
    name: string;
    version: string;
    fields: DataField[];
  };
  mappingRules: MappingRule[];
  transformations: DataTransformation[];
  validation: {
    enabled: boolean;
    rules: ValidationRule[];
    onError: 'skip' | 'stop' | 'log';
  };
  isActive: boolean;
  lastUsed?: Date;
  usageStats: {
    totalRecords: number;
    successfulMappings: number;
    failedMappings: number;
    averageProcessingTime: number; // milliseconds
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MappingRule {
  id: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: any;
  condition?: string;
  priority: number;
  isActive: boolean;
}

interface DataTransformation {
  id: string;
  name: string;
  type: 'format' | 'calculate' | 'lookup' | 'conditional' | 'custom';
  description: string;
  inputFields: string[];
  outputField: string;
  logic: string; // JavaScript code or formula
  parameters?: Record<string, any>;
  isActive: boolean;
}

interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  description: string;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  isActive: boolean;
}

interface MappingTest {
  id: string;
  mappingId: string;
  testName: string;
  sampleData: any;
  expectedOutput: any;
  actualOutput?: any;
  status: 'pending' | 'passed' | 'failed';
  errors?: string[];
  executionTime?: number; // milliseconds
  timestamp: Date;
}

interface SupplierDataMappingProps {
  supplierId?: string;
  onMappingCreated?: (mapping: DataMapping) => void;
  onMappingTested?: (test: MappingTest) => void;
}

export function SupplierDataMapping({ supplierId, onMappingCreated, onMappingTested }: SupplierDataMappingProps) {
  const [mappings, setMappings] = useState<DataMapping[]>([]);
  const [mappingTests, setMappingTests] = useState<MappingTest[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<DataMapping | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('mappings');
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<MappingTest | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // New mapping form state
  const [newMapping, setNewMapping] = useState<Partial<DataMapping>>({
    name: '',
    description: '',
    category: 'products',
    sourceSchema: {
      name: 'Supplier Schema',
      version: '1.0',
      fields: []
    },
    targetSchema: {
      name: 'System Schema',
      version: '1.0',
      fields: []
    },
    mappingRules: [],
    transformations: [],
    validation: {
      enabled: true,
      rules: [],
      onError: 'log'
    },
    isActive: true
  });

  // Default empty data for mappings
  const defaultMappings: DataMapping[] = [];

  // Default empty mapping tests
  const defaultMappingTests: MappingTest[] = [];

  useEffect(() => {
    setMappings(supplierId ? defaultMappings.filter(m => m.supplierId === supplierId) : defaultMappings);
    setMappingTests(defaultMappingTests);
  }, [supplierId]);

  const testMapping = async (mappingId: string) => {
    setIsTesting(mappingId);
    setTestResult(null);
    
    // Simulate mapping test
    setTimeout(() => {
      const mapping = mappings.find(m => m.id === mappingId);
      if (!mapping) return;
      
      const success = Math.random() > 0.2; // 80% success rate
      const executionTime = Math.floor(Math.random() * 100) + 20;
      
      const test: MappingTest = {
        id: `test-${Date.now()}`,
        mappingId,
        testName: `${mapping.name} Test`,
        sampleData: {
          product_id: 'FT-TEST-001',
          product_name: 'Test Product',
          category_code: 'TEST',
          price_baht: 1000
        },
        expectedOutput: {
          sku: 'TEST-001',
          name: 'Test Product',
          category: 'test',
          price: 1000
        },
        actualOutput: success ? {
          sku: 'TEST-001',
          name: 'Test Product',
          category: 'test',
          price: 1000
        } : {
          sku: 'TEST-001',
          name: 'Test Product',
          category: null,
          price: 1000
        },
        status: success ? 'passed' : 'failed',
        errors: success ? undefined : ['Category mapping failed'],
        executionTime,
        timestamp: new Date()
      };
      
      setMappingTests(prev => [test, ...prev]);
      setTestResult(test);
      setIsTesting(null);
      
      if (onMappingTested) {
        onMappingTested(test);
      }
    }, 2000);
  };

  const previewMapping = (mapping: DataMapping) => {
    const sampleInput = {
      product_id: 'FT-PREVIEW-001',
      product_name: 'Preview Product',
      category_code: 'SOFA',
      price_baht: 15000,
      serial_numbers: ['PREV-001', 'PREV-002']
    };
    
    const sampleOutput = {
      sku: 'PREVIEW-001',
      name: 'Preview Product',
      category: 'furniture',
      price: 15000,
      serialNumbers: ['PREV-001', 'PREV-002']
    };
    
    setPreviewData({ input: sampleInput, output: sampleOutput });
    setSelectedMapping(mapping);
    setShowPreviewDialog(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 text-white">ใช้งาน</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">ปิดใช้งาน</Badge>
    );
  };

  const getCategoryBadge = (category: DataMapping['category']) => {
    const colors = {
      products: 'bg-blue-500',
      inventory: 'bg-green-500',
      orders: 'bg-purple-500',
      shipping: 'bg-orange-500',
      returns: 'bg-red-500',
      reports: 'bg-gray-500'
    };
    
    const labels = {
      products: 'สินค้า',
      inventory: 'คลังสินค้า',
      orders: 'คำสั่งซื้อ',
      shipping: 'การจัดส่ง',
      returns: 'การคืนสินค้า',
      reports: 'รายงาน'
    };
    
    return (
      <Badge className={`${colors[category]} text-white`}>
        {labels[category]}
      </Badge>
    );
  };

  const getTestStatusIcon = (status: MappingTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
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

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = searchTerm === '' || 
      mapping.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || mapping.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && mapping.isActive) ||
      (filterStatus === 'inactive' && !mapping.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6" />
            Data Mapping Management
          </h2>
          <p className="text-muted-foreground">
            จัดการการแมปข้อมูลระหว่างระบบและ Supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Mapping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Data Mapping ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ชื่อ Mapping</Label>
                    <Input 
                      value={newMapping.name || ''}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ป้อนชื่อ Mapping"
                    />
                  </div>
                  <div>
                    <Label>หมวดหมู่</Label>
                    <Select 
                      value={newMapping.category} 
                      onValueChange={(value: DataMapping['category']) => 
                        setNewMapping(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="products">สินค้า</SelectItem>
                        <SelectItem value="inventory">คลังสินค้า</SelectItem>
                        <SelectItem value="orders">คำสั่งซื้อ</SelectItem>
                        <SelectItem value="shipping">การจัดส่ง</SelectItem>
                        <SelectItem value="returns">การคืนสินค้า</SelectItem>
                        <SelectItem value="reports">รายงาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>คำอธิบาย</Label>
                  <Textarea 
                    value={newMapping.description || ''}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="อธิบายการใช้งาน Mapping นี้"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newMapping.isActive}
                    onCheckedChange={(checked) => setNewMapping(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>เปิดใช้งาน</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={() => {
                      const mapping: DataMapping = {
                        id: `mapping-${Date.now()}`,
                        supplierId: supplierId || 'default',
                        supplierName: 'Default Supplier',
                        name: newMapping.name || '',
                        description: newMapping.description || '',
                        category: newMapping.category || 'products',
                        sourceSchema: newMapping.sourceSchema!,
                        targetSchema: newMapping.targetSchema!,
                        mappingRules: newMapping.mappingRules || [],
                        transformations: newMapping.transformations || [],
                        validation: newMapping.validation!,
                        isActive: newMapping.isActive !== false,
                        usageStats: {
                          totalRecords: 0,
                          successfulMappings: 0,
                          failedMappings: 0,
                          averageProcessingTime: 0
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      setMappings(prev => [mapping, ...prev]);
                      setShowAddDialog(false);
                      setNewMapping({
                        name: '',
                        description: '',
                        category: 'products',
                        sourceSchema: {
                          name: 'Supplier Schema',
                          version: '1.0',
                          fields: []
                        },
                        targetSchema: {
                          name: 'System Schema',
                          version: '1.0',
                          fields: []
                        },
                        mappingRules: [],
                        transformations: [],
                        validation: {
                          enabled: true,
                          rules: [],
                          onError: 'log'
                        },
                        isActive: true
                      });
                      
                      if (onMappingCreated) {
                        onMappingCreated(mapping);
                      }
                    }}
                    disabled={!newMapping.name}
                  >
                    เพิ่ม Mapping
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="ค้นหา Mapping..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                <SelectItem value="products">สินค้า</SelectItem>
                <SelectItem value="inventory">คลังสินค้า</SelectItem>
                <SelectItem value="orders">คำสั่งซื้อ</SelectItem>
                <SelectItem value="shipping">การจัดส่ง</SelectItem>
                <SelectItem value="returns">การคืนสินค้า</SelectItem>
                <SelectItem value="reports">รายงาน</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mappings List */}
      <div className="space-y-4">
        {filteredMappings.length === 0 ? (
          <div className="text-center py-12">
            <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">ไม่มี Data Mapping</h3>
            <p className="text-muted-foreground mb-4">ไม่พบ Mapping ที่ตรงกับเงื่อนไขการค้นหา</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Mapping แรก
            </Button>
          </div>
        ) : (
          filteredMappings.map((mapping) => (
            <Card key={mapping.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-lg">{mapping.name}</CardTitle>
                      {getCategoryBadge(mapping.category)}
                      {getStatusBadge(mapping.isActive)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {mapping.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supplier: {mapping.supplierName}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Schema Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Source Schema
                      </h5>
                      <p className="text-sm text-blue-600 mb-1">
                        {mapping.sourceSchema.name} v{mapping.sourceSchema.version}
                      </p>
                      <p className="text-xs text-blue-500">
                        {mapping.sourceSchema.fields.length} fields
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Target Schema
                      </h5>
                      <p className="text-sm text-green-600 mb-1">
                        {mapping.targetSchema.name} v{mapping.targetSchema.version}
                      </p>
                      <p className="text-xs text-green-500">
                        {mapping.targetSchema.fields.length} fields
                      </p>
                    </div>
                  </div>

                  {/* Mapping Rules */}
                  <div>
                    <h5 className="font-medium mb-2">Mapping Rules ({mapping.mappingRules.length})</h5>
                    <div className="space-y-1">
                      {mapping.mappingRules.slice(0, 3).map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2 text-sm">
                          <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                            {rule.sourceField}
                          </code>
                          <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                          <code className="bg-green-100 px-2 py-1 rounded text-xs">
                            {rule.targetField}
                          </code>
                          {rule.transformation && (
                            <Badge variant="outline" className="text-xs">
                              {rule.transformation}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {mapping.mappingRules.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          และอีก {mapping.mappingRules.length - 3} rules
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-700">
                        {mapping.usageStats.totalRecords.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">รวม</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-700">
                        {mapping.usageStats.successfulMappings.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">สำเร็จ</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-700">
                        {mapping.usageStats.failedMappings.toLocaleString()}
                      </div>
                      <div className="text-xs text-red-600">ล้มเหลว</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-700">
                        {mapping.usageStats.averageProcessingTime}ms
                      </div>
                      <div className="text-xs text-blue-600">เฉลี่ย</div>
                    </div>
                  </div>

                  {/* Last Used */}
                  {mapping.lastUsed && (
                    <div className="text-xs text-muted-foreground">
                      ใช้งานล่าสุด: {formatDate(mapping.lastUsed)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => testMapping(mapping.id)}
                      disabled={isTesting === mapping.id || !mapping.isActive}
                    >
                      {isTesting === mapping.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isTesting === mapping.id ? 'กำลังทดสอบ...' : 'ทดสอบ'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => previewMapping(mapping)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      ดูตัวอย่าง
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไข
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      ลบ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ตัวอย่างการแมปข้อมูล</DialogTitle>
          </DialogHeader>
          {previewData && selectedMapping && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ข้อมูลต้นทาง (Source)</Label>
                  <Textarea 
                    value={JSON.stringify(previewData.input, null, 2)}
                    readOnly
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>ข้อมูลปลายทาง (Target)</Label>
                  <Textarea 
                    value={JSON.stringify(previewData.output, null, 2)}
                    readOnly
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Mapping Rules ที่ใช้</h5>
                <div className="space-y-2">
                  {selectedMapping.mappingRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                      <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                        {rule.sourceField}
                      </code>
                      <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                      <code className="bg-green-100 px-2 py-1 rounded text-xs">
                        {rule.targetField}
                      </code>
                      {rule.transformation && (
                        <Badge variant="outline" className="text-xs">
                          {rule.transformation}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Result Dialog */}
      {testResult && (
        <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ผลการทดสอบ Mapping</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTestStatusIcon(testResult.status)}
                <span className={`font-medium ${
                  testResult.status === 'passed' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult.status === 'passed' ? 'ทดสอบผ่าน' : 'ทดสอบล้มเหลว'}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({testResult.executionTime}ms)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ข้อมูลทดสอบ</Label>
                  <Textarea 
                    value={JSON.stringify(testResult.sampleData, null, 2)}
                    readOnly
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>ผลลัพธ์ที่ได้</Label>
                  <Textarea 
                    value={JSON.stringify(testResult.actualOutput, null, 2)}
                    readOnly
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              {testResult.errors && testResult.errors.length > 0 && (
                <div>
                  <Label>ข้อผิดพลาด</Label>
                  <div className="space-y-1">
                    {testResult.errors.map((error, index) => (
                      <p key={index} className="text-red-600 text-sm">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}