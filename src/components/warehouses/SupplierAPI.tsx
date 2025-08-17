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
  Code, 
  Server, 
  Key, 
  Lock, 
  Unlock, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Database, 
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
  FileText, 
  Package, 
  Truck, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Tag, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
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
  Rewind
} from 'lucide-react';

// Types for Supplier API Management
interface APIEndpoint {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  parameters: APIParameter[];
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth';
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      clientId?: string;
      clientSecret?: string;
    };
  };
  requestBody?: {
    type: 'json' | 'xml' | 'form' | 'raw';
    schema?: string;
    example?: string;
  };
  responseFormat: {
    type: 'json' | 'xml' | 'csv' | 'text';
    schema?: string;
    example?: string;
  };
  rateLimit: {
    requests: number;
    period: 'second' | 'minute' | 'hour' | 'day';
  };
  timeout: number; // seconds
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    initialDelay: number; // seconds
  };
  isActive: boolean;
  lastTested?: Date;
  testResult?: {
    status: 'success' | 'error' | 'timeout';
    responseTime: number; // milliseconds
    statusCode?: number;
    errorMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    enum?: any[];
  };
}

interface APICall {
  id: string;
  endpointId: string;
  endpointName: string;
  supplierId: string;
  supplierName: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  responseTime: number; // milliseconds
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  userId: string;
  userName: string;
}

interface APITemplate {
  id: string;
  name: string;
  description: string;
  category: 'inventory' | 'orders' | 'products' | 'shipping' | 'returns' | 'reports';
  endpoints: Partial<APIEndpoint>[];
  documentation: string;
  version: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierAPIProps {
  supplierId?: string;
  onEndpointTested?: (endpoint: APIEndpoint, result: APICall) => void;
  onEndpointCreated?: (endpoint: APIEndpoint) => void;
}

export function SupplierAPI({ supplierId, onEndpointTested, onEndpointCreated }: SupplierAPIProps) {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [apiCalls, setApiCalls] = useState<APICall[]>([]);
  const [templates, setTemplates] = useState<APITemplate[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('endpoints');
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // New endpoint form state
  const [newEndpoint, setNewEndpoint] = useState<Partial<APIEndpoint>>({
    name: '',
    description: '',
    method: 'GET',
    url: '',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    parameters: [],
    authentication: {
      type: 'none'
    },
    responseFormat: {
      type: 'json'
    },
    rateLimit: {
      requests: 100,
      period: 'minute'
    },
    timeout: 30,
    retryPolicy: {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      initialDelay: 1
    },
    isActive: true
  });

  // Mock data for API endpoints
  const mockEndpoints: APIEndpoint[] = [
    {
      id: 'endpoint-001',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      name: 'Get Products',
      description: 'ดึงข้อมูลสินค้าทั้งหมด',
      method: 'GET',
      url: 'https://api.furnithai.com/v1/products',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {token}',
        'X-API-Version': '1.0'
      },
      parameters: [
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'หมายเลขหน้า',
          defaultValue: 1,
          validation: { minimum: 1 }
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'จำนวนรายการต่อหน้า',
          defaultValue: 50,
          validation: { minimum: 1, maximum: 100 }
        },
        {
          name: 'category',
          type: 'string',
          required: false,
          description: 'หมวดหมู่สินค้า',
          validation: { enum: ['furniture', 'electronics', 'appliances'] }
        }
      ],
      authentication: {
        type: 'bearer',
        credentials: {
          token: 'ft_api_token_***'
        }
      },
      responseFormat: {
        type: 'json',
        schema: '{ "products": [{ "id": "string", "name": "string", "sku": "string", "serialNumbers": ["string"] }] }',
        example: '{ "products": [{ "id": "prod-001", "name": "โซฟา 3 ที่นั่ง", "sku": "SF-001", "serialNumbers": ["SF001-001", "SF001-002"] }] }'
      },
      rateLimit: {
        requests: 1000,
        period: 'hour'
      },
      timeout: 30,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1
      },
      isActive: true,
      lastTested: new Date('2024-01-25T08:30:00'),
      testResult: {
        status: 'success',
        responseTime: 245,
        statusCode: 200
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'endpoint-002',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      name: 'Create Serial Number',
      description: 'สร้าง Serial Number ใหม่',
      method: 'POST',
      url: 'https://api.furnithai.com/v1/serial-numbers',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {token}'
      },
      parameters: [],
      authentication: {
        type: 'bearer',
        credentials: {
          token: 'ft_api_token_***'
        }
      },
      requestBody: {
        type: 'json',
        schema: '{ "productId": "string", "serialNumber": "string", "status": "string" }',
        example: '{ "productId": "prod-001", "serialNumber": "SF001-003", "status": "available" }'
      },
      responseFormat: {
        type: 'json',
        schema: '{ "id": "string", "serialNumber": "string", "status": "string", "createdAt": "string" }',
        example: '{ "id": "sn-001", "serialNumber": "SF001-003", "status": "available", "createdAt": "2024-01-25T08:30:00Z" }'
      },
      rateLimit: {
        requests: 500,
        period: 'hour'
      },
      timeout: 15,
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: 'linear',
        initialDelay: 2
      },
      isActive: true,
      lastTested: new Date('2024-01-25T09:15:00'),
      testResult: {
        status: 'success',
        responseTime: 180,
        statusCode: 201
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'endpoint-003',
      supplierId: 'supplier-002',
      supplierName: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      name: 'Get Inventory Status',
      description: 'ตรวจสอบสถานะสินค้าคงคลัง',
      method: 'GET',
      url: 'https://api.electronicsplus.co.th/inventory/status',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '{apiKey}'
      },
      parameters: [
        {
          name: 'sku',
          type: 'string',
          required: true,
          description: 'รหัสสินค้า',
          validation: { pattern: '^[A-Z]{2}-\\d{3}$' }
        }
      ],
      authentication: {
        type: 'api_key',
        credentials: {
          apiKey: 'elp_api_key_***'
        }
      },
      responseFormat: {
        type: 'json',
        schema: '{ "sku": "string", "quantity": "number", "available": "number", "reserved": "number" }',
        example: '{ "sku": "TV-001", "quantity": 25, "available": 20, "reserved": 5 }'
      },
      rateLimit: {
        requests: 200,
        period: 'minute'
      },
      timeout: 10,
      retryPolicy: {
        maxRetries: 5,
        backoffStrategy: 'exponential',
        initialDelay: 0.5
      },
      isActive: false,
      lastTested: new Date('2024-01-24T16:45:00'),
      testResult: {
        status: 'error',
        responseTime: 10000,
        statusCode: 500,
        errorMessage: 'Internal Server Error'
      },
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-24')
    }
  ];

  // Mock API call history
  const mockApiCalls: APICall[] = [
    {
      id: 'call-001',
      endpointId: 'endpoint-001',
      endpointName: 'Get Products',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      method: 'GET',
      url: 'https://api.furnithai.com/v1/products?page=1&limit=50',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ft_api_token_***'
      },
      responseStatus: 200,
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '999'
      },
      responseBody: '{ "products": [{ "id": "prod-001", "name": "โซฟา 3 ที่นั่ง", "sku": "SF-001" }] }',
      responseTime: 245,
      timestamp: new Date('2024-01-25T08:30:00'),
      success: true,
      userId: 'user-001',
      userName: 'ระบบอัตโนมัติ'
    },
    {
      id: 'call-002',
      endpointId: 'endpoint-003',
      endpointName: 'Get Inventory Status',
      supplierId: 'supplier-002',
      supplierName: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      method: 'GET',
      url: 'https://api.electronicsplus.co.th/inventory/status?sku=TV-001',
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-API-Key': 'elp_api_key_***'
      },
      responseStatus: 500,
      responseHeaders: {
        'Content-Type': 'application/json'
      },
      responseBody: '{ "error": "Internal Server Error" }',
      responseTime: 10000,
      timestamp: new Date('2024-01-24T16:45:00'),
      success: false,
      errorMessage: 'Internal Server Error',
      userId: 'user-002',
      userName: 'สมชาย ใจดี'
    }
  ];

  // Mock API templates
  const mockTemplates: APITemplate[] = [
    {
      id: 'template-001',
      name: 'Standard Inventory API',
      description: 'เทมเพลตมาตรฐานสำหรับ API การจัดการสินค้าคงคลัง',
      category: 'inventory',
      endpoints: [
        {
          name: 'Get Products',
          method: 'GET',
          url: '/products',
          description: 'ดึงข้อมูลสินค้าทั้งหมด'
        },
        {
          name: 'Get Product by ID',
          method: 'GET',
          url: '/products/{id}',
          description: 'ดึงข้อมูลสินค้าตาม ID'
        },
        {
          name: 'Update Stock',
          method: 'PUT',
          url: '/products/{id}/stock',
          description: 'อัปเดตจำนวนสินค้าคงคลัง'
        }
      ],
      documentation: 'เทมเพลตนี้ประกอบด้วย API endpoints พื้นฐานสำหรับการจัดการสินค้าคงคลัง',
      version: '1.0.0',
      isPublic: true,
      createdBy: 'system',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  useEffect(() => {
    setEndpoints(supplierId ? mockEndpoints.filter(e => e.supplierId === supplierId) : mockEndpoints);
    setApiCalls(supplierId ? mockApiCalls.filter(c => c.supplierId === supplierId) : mockApiCalls);
    setTemplates(mockTemplates);
  }, [supplierId]);

  const testEndpoint = async (endpointId: string) => {
    setIsTesting(endpointId);
    setTestResult(null);
    
    // Simulate API test
    setTimeout(() => {
      const endpoint = endpoints.find(e => e.id === endpointId);
      if (!endpoint) return;
      
      const success = Math.random() > 0.3; // 70% success rate
      const responseTime = Math.floor(Math.random() * 1000) + 100;
      
      const result: APICall = {
        id: `call-${Date.now()}`,
        endpointId,
        endpointName: endpoint.name,
        supplierId: endpoint.supplierId,
        supplierName: endpoint.supplierName,
        method: endpoint.method,
        url: endpoint.url,
        requestHeaders: endpoint.headers,
        responseStatus: success ? 200 : 500,
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        responseBody: success ? 
          '{ "status": "success", "data": [...] }' : 
          '{ "error": "Internal Server Error" }',
        responseTime,
        timestamp: new Date(),
        success,
        errorMessage: success ? undefined : 'Internal Server Error',
        userId: 'current-user',
        userName: 'ผู้ใช้ปัจจุบัน'
      };
      
      setApiCalls(prev => [result, ...prev]);
      setTestResult(result);
      
      // Update endpoint test result
      setEndpoints(prev => prev.map(e => 
        e.id === endpointId 
          ? {
              ...e,
              lastTested: new Date(),
              testResult: {
                status: success ? 'success' : 'error',
                responseTime,
                statusCode: result.responseStatus,
                errorMessage: result.errorMessage
              }
            }
          : e
      ));
      
      setIsTesting(null);
      
      if (onEndpointTested && endpoint) {
        onEndpointTested(endpoint, result);
      }
    }, 2000);
  };

  const copyEndpointUrl = (url: string, endpointId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(endpointId);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-green-500',
      POST: 'bg-blue-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500'
    };
    
    return (
      <Badge className={`${colors[method as keyof typeof colors] || 'bg-gray-500'} text-white`}>
        {method}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean, testResult?: APIEndpoint['testResult']) => {
    if (!isActive) {
      return <Badge className="bg-gray-500 text-white">ปิดใช้งาน</Badge>;
    }
    
    if (!testResult) {
      return <Badge className="bg-yellow-500 text-white">ยังไม่ทดสอบ</Badge>;
    }
    
    switch (testResult.status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">ใช้งานได้</Badge>;
      case 'error':
        return <Badge className="bg-red-500 text-white">ข้อผิดพลาด</Badge>;
      case 'timeout':
        return <Badge className="bg-orange-500 text-white">หมดเวลา</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">ไม่ทราบ</Badge>;
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

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = searchTerm === '' || 
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'all' || endpoint.method === filterMethod;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && endpoint.isActive) ||
      (filterStatus === 'inactive' && !endpoint.isActive) ||
      (filterStatus === 'success' && endpoint.testResult?.status === 'success') ||
      (filterStatus === 'error' && endpoint.testResult?.status === 'error');
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6" />
            Supplier API Management
          </h2>
          <p className="text-muted-foreground">
            จัดการ API endpoints และการเชื่อมต่อกับ Supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                เทมเพลต ({templates.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>เทมเพลต API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h5 className="font-medium">Endpoints ({template.endpoints.length})</h5>
                        <div className="space-y-1">
                          {template.endpoints.map((endpoint, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {getMethodBadge(endpoint.method || 'GET')}
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {endpoint.url}
                              </code>
                              <span className="text-muted-foreground">
                                {endpoint.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม API Endpoint ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ชื่อ Endpoint</Label>
                    <Input 
                      value={newEndpoint.name || ''}
                      onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ป้อนชื่อ Endpoint"
                    />
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select 
                      value={newEndpoint.method} 
                      onValueChange={(value: APIEndpoint['method']) => 
                        setNewEndpoint(prev => ({ ...prev, method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input 
                    value={newEndpoint.url || ''}
                    onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://api.example.com/v1/endpoint"
                  />
                </div>
                <div>
                  <Label>คำอธิบาย</Label>
                  <Textarea 
                    value={newEndpoint.description || ''}
                    onChange={(e) => setNewEndpoint(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="อธิบายการใช้งาน Endpoint นี้"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Timeout (วินาที)</Label>
                    <Input 
                      type="number"
                      value={newEndpoint.timeout || 30}
                      onChange={(e) => setNewEndpoint(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                      min={1}
                      max={300}
                    />
                  </div>
                  <div>
                    <Label>Max Retries</Label>
                    <Input 
                      type="number"
                      value={newEndpoint.retryPolicy?.maxRetries || 3}
                      onChange={(e) => setNewEndpoint(prev => ({
                        ...prev,
                        retryPolicy: {
                          ...prev.retryPolicy!,
                          maxRetries: parseInt(e.target.value)
                        }
                      }))}
                      min={0}
                      max={10}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newEndpoint.isActive}
                    onCheckedChange={(checked) => setNewEndpoint(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>เปิดใช้งาน</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={() => {
                      const endpoint: APIEndpoint = {
                        id: `endpoint-${Date.now()}`,
                        supplierId: supplierId || 'default',
                        supplierName: 'Default Supplier',
                        name: newEndpoint.name || '',
                        description: newEndpoint.description || '',
                        method: newEndpoint.method || 'GET',
                        url: newEndpoint.url || '',
                        headers: newEndpoint.headers || {},
                        parameters: newEndpoint.parameters || [],
                        authentication: newEndpoint.authentication!,
                        responseFormat: newEndpoint.responseFormat!,
                        rateLimit: newEndpoint.rateLimit!,
                        timeout: newEndpoint.timeout || 30,
                        retryPolicy: newEndpoint.retryPolicy!,
                        isActive: newEndpoint.isActive !== false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      setEndpoints(prev => [endpoint, ...prev]);
                      setShowAddDialog(false);
                      setNewEndpoint({
                        name: '',
                        description: '',
                        method: 'GET',
                        url: '',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        },
                        parameters: [],
                        authentication: {
                          type: 'none'
                        },
                        responseFormat: {
                          type: 'json'
                        },
                        rateLimit: {
                          requests: 100,
                          period: 'minute'
                        },
                        timeout: 30,
                        retryPolicy: {
                          maxRetries: 3,
                          backoffStrategy: 'exponential',
                          initialDelay: 1
                        },
                        isActive: true
                      });
                      
                      if (onEndpointCreated) {
                        onEndpointCreated(endpoint);
                      }
                    }}
                    disabled={!newEndpoint.name || !newEndpoint.url}
                  >
                    เพิ่ม Endpoint
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
                placeholder="ค้นหา Endpoint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุก Method</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                <SelectItem value="success">ทำงานได้</SelectItem>
                <SelectItem value="error">ข้อผิดพลาด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="text-center py-12">
            <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">ไม่มี API Endpoint</h3>
            <p className="text-muted-foreground mb-4">ไม่พบ Endpoint ที่ตรงกับเงื่อนไขการค้นหา</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Endpoint แรก
            </Button>
          </div>
        ) : (
          filteredEndpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getMethodBadge(endpoint.method)}
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                      {getStatusBadge(endpoint.isActive, endpoint.testResult)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {endpoint.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {endpoint.url}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyEndpointUrl(endpoint.url, endpoint.id)}
                      >
                        {copiedEndpoint === endpoint.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Endpoint Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Authentication:</span>
                      <p className="font-medium capitalize">{endpoint.authentication.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Response Format:</span>
                      <p className="font-medium uppercase">{endpoint.responseFormat.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeout:</span>
                      <p className="font-medium">{endpoint.timeout}s</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate Limit:</span>
                      <p className="font-medium">
                        {endpoint.rateLimit.requests}/{endpoint.rateLimit.period}
                      </p>
                    </div>
                  </div>

                  {/* Test Results */}
                  {endpoint.testResult && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">ผลการทดสอบล่าสุด</h5>
                        <span className="text-xs text-muted-foreground">
                          {endpoint.lastTested && formatDate(endpoint.lastTested)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status Code:</span>
                          <p className="font-medium">{endpoint.testResult.statusCode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Response Time:</span>
                          <p className="font-medium">{endpoint.testResult.responseTime}ms</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Result:</span>
                          <p className={`font-medium ${
                            endpoint.testResult.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {endpoint.testResult.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                          </p>
                        </div>
                      </div>
                      {endpoint.testResult.errorMessage && (
                        <div className="mt-2">
                          <span className="text-muted-foreground text-xs">Error:</span>
                          <p className="text-red-600 text-sm">{endpoint.testResult.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Parameters */}
                  {endpoint.parameters.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Parameters ({endpoint.parameters.length})</h5>
                      <div className="space-y-1">
                        {endpoint.parameters.slice(0, 3).map((param, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {param.type}
                            </Badge>
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {param.name}
                            </code>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">required</Badge>
                            )}
                            <span className="text-muted-foreground truncate">
                              {param.description}
                            </span>
                          </div>
                        ))}
                        {endpoint.parameters.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            และอีก {endpoint.parameters.length - 3} parameters
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => testEndpoint(endpoint.id)}
                      disabled={isTesting === endpoint.id || !endpoint.isActive}
                    >
                      {isTesting === endpoint.id ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isTesting === endpoint.id ? 'กำลังทดสอบ...' : 'ทดสอบ'}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      ดูรายละเอียด
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

      {/* Test Result Dialog */}
      {testResult && (
        <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ผลการทดสอบ API</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Endpoint</Label>
                  <p className="font-medium">{testResult.endpointName}</p>
                </div>
                <div>
                  <Label>Method</Label>
                  <p className="font-medium">{testResult.method}</p>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <p className={`font-medium ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.responseStatus}
                  </p>
                </div>
                <div>
                  <Label>Response Time</Label>
                  <p className="font-medium">{testResult.responseTime}ms</p>
                </div>
              </div>
              <div>
                <Label>URL</Label>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {testResult.url}
                </code>
              </div>
              <div>
                <Label>Response Body</Label>
                <Textarea 
                  value={testResult.responseBody}
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              {testResult.errorMessage && (
                <div>
                  <Label>Error Message</Label>
                  <p className="text-red-600 text-sm">{testResult.errorMessage}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}