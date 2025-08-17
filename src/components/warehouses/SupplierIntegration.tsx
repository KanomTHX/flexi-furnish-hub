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
  Building2, 
  Link, 
  Unlink, 
  Wifi, 
  WifiOff, 
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
  Satellite
} from 'lucide-react';

// Types for Supplier Integration
interface Supplier {
  id: string;
  name: string;
  code: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  integration: {
    isConnected: boolean;
    connectionType: 'api' | 'ftp' | 'sftp' | 'email' | 'manual';
    apiEndpoint?: string;
    apiKey?: string;
    ftpHost?: string;
    ftpUsername?: string;
    lastSync?: Date;
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
    dataFormat: 'json' | 'xml' | 'csv' | 'excel' | 'edi';
    encryption: boolean;
    authentication: 'basic' | 'oauth' | 'token' | 'certificate';
  };
  capabilities: {
    serialNumberTracking: boolean;
    realTimeInventory: boolean;
    orderManagement: boolean;
    invoiceIntegration: boolean;
    shippingTracking: boolean;
    qualityReports: boolean;
    warrantyData: boolean;
    returnManagement: boolean;
  };
  metrics: {
    totalProducts: number;
    totalSerialNumbers: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncDuration: number; // seconds
    dataAccuracy: number; // percentage
    uptime: number; // percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IntegrationLog {
  id: string;
  supplierId: string;
  supplierName: string;
  action: 'sync' | 'connect' | 'disconnect' | 'update' | 'error';
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  duration?: number; // seconds
  recordsProcessed?: number;
  recordsSuccessful?: number;
  recordsFailed?: number;
  errorCode?: string;
  userId: string;
  userName: string;
}

interface SyncConfiguration {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  isActive: boolean;
  schedule: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
  };
  dataMapping: {
    serialNumberField: string;
    productSkuField: string;
    productNameField: string;
    categoryField: string;
    priceField: string;
    quantityField: string;
    statusField: string;
    dateField: string;
    customFields: Record<string, string>;
  };
  filters: {
    categories?: string[];
    statuses?: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
    customFilters?: Record<string, any>;
  };
  validation: {
    requiredFields: string[];
    dataTypes: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
    customValidation?: string; // JavaScript code
  };
  errorHandling: {
    retryAttempts: number;
    retryDelay: number; // seconds
    skipInvalidRecords: boolean;
    notifyOnError: boolean;
    emailNotifications: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SupplierIntegrationProps {
  warehouseId?: string;
  onSupplierConnected?: (supplier: Supplier) => void;
  onSyncCompleted?: (log: IntegrationLog) => void;
}

export function SupplierIntegration({ warehouseId, onSupplierConnected, onSyncCompleted }: SupplierIntegrationProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [syncConfigurations, setSyncConfigurations] = useState<SyncConfiguration[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    code: '',
    type: 'manufacturer',
    status: 'pending',
    contactInfo: {
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Thailand'
      }
    },
    integration: {
      isConnected: false,
      connectionType: 'api',
      syncFrequency: 'daily',
      dataFormat: 'json',
      encryption: true,
      authentication: 'token'
    },
    capabilities: {
      serialNumberTracking: true,
      realTimeInventory: false,
      orderManagement: false,
      invoiceIntegration: false,
      shippingTracking: false,
      qualityReports: false,
      warrantyData: false,
      returnManagement: false
    }
  });

  // Mock data for suppliers
  const mockSuppliers: Supplier[] = [
    {
      id: 'supplier-001',
      name: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      code: 'FTH001',
      type: 'manufacturer',
      status: 'active',
      contactInfo: {
        email: 'contact@furnithai.com',
        phone: '+66-2-123-4567',
        website: 'https://www.furnithai.com',
        address: {
          street: '123 ถนนสุขุมวิท',
          city: 'กรุงเทพมหานคร',
          state: 'กรุงเทพมหานคร',
          zipCode: '10110',
          country: 'Thailand'
        }
      },
      integration: {
        isConnected: true,
        connectionType: 'api',
        apiEndpoint: 'https://api.furnithai.com/v1',
        apiKey: 'ft_api_key_***',
        lastSync: new Date('2024-01-25T08:30:00'),
        syncFrequency: 'daily',
        dataFormat: 'json',
        encryption: true,
        authentication: 'token'
      },
      capabilities: {
        serialNumberTracking: true,
        realTimeInventory: true,
        orderManagement: true,
        invoiceIntegration: true,
        shippingTracking: true,
        qualityReports: true,
        warrantyData: true,
        returnManagement: false
      },
      metrics: {
        totalProducts: 1250,
        totalSerialNumbers: 8500,
        successfulSyncs: 145,
        failedSyncs: 3,
        lastSyncDuration: 45,
        dataAccuracy: 98.5,
        uptime: 99.2
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'supplier-002',
      name: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      code: 'ELP002',
      type: 'distributor',
      status: 'active',
      contactInfo: {
        email: 'info@electronicsplus.co.th',
        phone: '+66-2-987-6543',
        website: 'https://www.electronicsplus.co.th',
        address: {
          street: '456 ถนนรัชดาภิเษก',
          city: 'กรุงเทพมหานคร',
          state: 'กรุงเทพมหานคร',
          zipCode: '10400',
          country: 'Thailand'
        }
      },
      integration: {
        isConnected: true,
        connectionType: 'ftp',
        ftpHost: 'ftp.electronicsplus.co.th',
        ftpUsername: 'flexi_user',
        lastSync: new Date('2024-01-25T06:00:00'),
        syncFrequency: 'daily',
        dataFormat: 'csv',
        encryption: true,
        authentication: 'basic'
      },
      capabilities: {
        serialNumberTracking: true,
        realTimeInventory: false,
        orderManagement: true,
        invoiceIntegration: false,
        shippingTracking: true,
        qualityReports: false,
        warrantyData: true,
        returnManagement: true
      },
      metrics: {
        totalProducts: 850,
        totalSerialNumbers: 4200,
        successfulSyncs: 89,
        failedSyncs: 7,
        lastSyncDuration: 120,
        dataAccuracy: 96.8,
        uptime: 97.5
      },
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'supplier-003',
      name: 'บริษัท โฮมดีไซน์ จำกัด',
      code: 'HDG003',
      type: 'wholesaler',
      status: 'inactive',
      contactInfo: {
        email: 'sales@homedesign.com',
        phone: '+66-2-555-1234',
        address: {
          street: '789 ถนนพระราม 4',
          city: 'กรุงเทพมหานคร',
          state: 'กรุงเทพมหานคร',
          zipCode: '10500',
          country: 'Thailand'
        }
      },
      integration: {
        isConnected: false,
        connectionType: 'email',
        syncFrequency: 'weekly',
        dataFormat: 'excel',
        encryption: false,
        authentication: 'basic'
      },
      capabilities: {
        serialNumberTracking: false,
        realTimeInventory: false,
        orderManagement: false,
        invoiceIntegration: false,
        shippingTracking: false,
        qualityReports: false,
        warrantyData: false,
        returnManagement: false
      },
      metrics: {
        totalProducts: 320,
        totalSerialNumbers: 0,
        successfulSyncs: 12,
        failedSyncs: 15,
        lastSyncDuration: 0,
        dataAccuracy: 0,
        uptime: 0
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15')
    }
  ];

  // Mock integration logs
  const mockIntegrationLogs: IntegrationLog[] = [
    {
      id: 'log-001',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      action: 'sync',
      status: 'success',
      message: 'ซิงค์ข้อมูลสำเร็จ',
      details: 'ประมวลผล 125 รายการ สำเร็จ 125 รายการ',
      timestamp: new Date('2024-01-25T08:30:00'),
      duration: 45,
      recordsProcessed: 125,
      recordsSuccessful: 125,
      recordsFailed: 0,
      userId: 'user-001',
      userName: 'ระบบอัตโนมัติ'
    },
    {
      id: 'log-002',
      supplierId: 'supplier-002',
      supplierName: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      action: 'sync',
      status: 'warning',
      message: 'ซิงค์ข้อมูลเสร็จสิ้นแต่มีข้อผิดพลาดบางส่วน',
      details: 'ประมวลผล 89 รายการ สำเร็จ 85 รายการ ล้มเหลว 4 รายการ',
      timestamp: new Date('2024-01-25T06:00:00'),
      duration: 120,
      recordsProcessed: 89,
      recordsSuccessful: 85,
      recordsFailed: 4,
      userId: 'user-001',
      userName: 'ระบบอัตโนมัติ'
    },
    {
      id: 'log-003',
      supplierId: 'supplier-003',
      supplierName: 'บริษัท โฮมดีไซน์ จำกัด',
      action: 'connect',
      status: 'error',
      message: 'ไม่สามารถเชื่อมต่อได้',
      details: 'Connection timeout after 30 seconds',
      timestamp: new Date('2024-01-24T14:15:00'),
      errorCode: 'CONN_TIMEOUT',
      userId: 'user-002',
      userName: 'สมชาย ใจดี'
    }
  ];

  useEffect(() => {
    setSuppliers(mockSuppliers);
    setIntegrationLogs(mockIntegrationLogs);
  }, []);

  const connectSupplier = async (supplierId: string) => {
    setIsConnecting(supplierId);
    
    // Simulate connection process
    setTimeout(() => {
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === supplierId 
          ? { 
              ...supplier, 
              integration: { 
                ...supplier.integration, 
                isConnected: true,
                lastSync: new Date()
              },
              status: 'active'
            }
          : supplier
      ));
      
      const newLog: IntegrationLog = {
        id: `log-${Date.now()}`,
        supplierId,
        supplierName: suppliers.find(s => s.id === supplierId)?.name || '',
        action: 'connect',
        status: 'success',
        message: 'เชื่อมต่อสำเร็จ',
        timestamp: new Date(),
        userId: 'current-user',
        userName: 'ผู้ใช้ปัจจุบัน'
      };
      
      setIntegrationLogs(prev => [newLog, ...prev]);
      setIsConnecting(null);
      
      if (onSupplierConnected) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
          onSupplierConnected(supplier);
        }
      }
    }, 2000);
  };

  const syncSupplier = async (supplierId: string) => {
    setIsSyncing(supplierId);
    
    // Simulate sync process
    setTimeout(() => {
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === supplierId 
          ? { 
              ...supplier, 
              integration: { 
                ...supplier.integration, 
                lastSync: new Date()
              },
              metrics: {
                ...supplier.metrics,
                successfulSyncs: supplier.metrics.successfulSyncs + 1
              }
            }
          : supplier
      ));
      
      const newLog: IntegrationLog = {
        id: `log-${Date.now()}`,
        supplierId,
        supplierName: suppliers.find(s => s.id === supplierId)?.name || '',
        action: 'sync',
        status: 'success',
        message: 'ซิงค์ข้อมูลสำเร็จ',
        details: 'ประมวลผล 95 รายการ สำเร็จ 95 รายการ',
        timestamp: new Date(),
        duration: 60,
        recordsProcessed: 95,
        recordsSuccessful: 95,
        recordsFailed: 0,
        userId: 'current-user',
        userName: 'ผู้ใช้ปัจจุบัน'
      };
      
      setIntegrationLogs(prev => [newLog, ...prev]);
      setIsSyncing(null);
      
      if (onSyncCompleted) {
        onSyncCompleted(newLog);
      }
    }, 3000);
  };

  const getStatusBadge = (status: Supplier['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">ใช้งาน</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white">ไม่ใช้งาน</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500 text-white">ระงับ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">รอดำเนินการ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getConnectionBadge = (isConnected: boolean) => {
    return isConnected ? (
      <Badge className="bg-green-500 text-white flex items-center gap-1">
        <Wifi className="w-3 h-3" />
        เชื่อมต่อ
      </Badge>
    ) : (
      <Badge className="bg-red-500 text-white flex items-center gap-1">
        <WifiOff className="w-3 h-3" />
        ไม่เชื่อมต่อ
      </Badge>
    );
  };

  const getLogStatusIcon = (status: IntegrationLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Clock className="w-4 h-4 text-blue-500" />;
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

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = searchTerm === '' || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    const matchesType = filterType === 'all' || supplier.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            การเชื่อมต่อ Supplier
          </h2>
          <p className="text-muted-foreground">
            จัดการการเชื่อมต่อและซิงค์ข้อมูลกับ Supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                ประวัติ ({integrationLogs.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>ประวัติการเชื่อมต่อ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {integrationLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getLogStatusIcon(log.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{log.supplierName}</h4>
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {log.message}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {log.details}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(log.timestamp)}</span>
                            {log.duration && <span>ระยะเวลา: {log.duration}s</span>}
                            {log.recordsProcessed && (
                              <span>ประมวลผล: {log.recordsProcessed} รายการ</span>
                            )}
                            <span>โดย: {log.userName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Supplier ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ชื่อ Supplier</Label>
                    <Input 
                      value={newSupplier.name || ''}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ป้อนชื่อ Supplier"
                    />
                  </div>
                  <div>
                    <Label>รหัส Supplier</Label>
                    <Input 
                      value={newSupplier.code || ''}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="ป้อนรหัส Supplier"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ประเภท</Label>
                    <Select 
                      value={newSupplier.type} 
                      onValueChange={(value: Supplier['type']) => 
                        setNewSupplier(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">ผู้ผลิต</SelectItem>
                        <SelectItem value="distributor">ผู้จัดจำหน่าย</SelectItem>
                        <SelectItem value="wholesaler">ผู้ค้าส่ง</SelectItem>
                        <SelectItem value="retailer">ผู้ค้าปลีก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>สถานะ</Label>
                    <Select 
                      value={newSupplier.status} 
                      onValueChange={(value: Supplier['status']) => 
                        setNewSupplier(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">ใช้งาน</SelectItem>
                        <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>อีเมล</Label>
                    <Input 
                      type="email"
                      value={newSupplier.contactInfo?.email || ''}
                      onChange={(e) => setNewSupplier(prev => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo!,
                          email: e.target.value
                        }
                      }))}
                      placeholder="ป้อนอีเมล"
                    />
                  </div>
                  <div>
                    <Label>เบอร์โทรศัพท์</Label>
                    <Input 
                      value={newSupplier.contactInfo?.phone || ''}
                      onChange={(e) => setNewSupplier(prev => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo!,
                          phone: e.target.value
                        }
                      }))}
                      placeholder="ป้อนเบอร์โทรศัพท์"
                    />
                  </div>
                </div>
                <div>
                  <Label>เว็บไซต์</Label>
                  <Input 
                    value={newSupplier.contactInfo?.website || ''}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contactInfo: {
                        ...prev.contactInfo!,
                        website: e.target.value
                      }
                    }))}
                    placeholder="ป้อน URL เว็บไซต์"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={() => {
                      const supplier: Supplier = {
                        id: `supplier-${Date.now()}`,
                        name: newSupplier.name || '',
                        code: newSupplier.code || '',
                        type: newSupplier.type || 'manufacturer',
                        status: newSupplier.status || 'pending',
                        contactInfo: newSupplier.contactInfo!,
                        integration: newSupplier.integration!,
                        capabilities: newSupplier.capabilities!,
                        metrics: {
                          totalProducts: 0,
                          totalSerialNumbers: 0,
                          successfulSyncs: 0,
                          failedSyncs: 0,
                          lastSyncDuration: 0,
                          dataAccuracy: 0,
                          uptime: 0
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      setSuppliers(prev => [supplier, ...prev]);
                      setShowAddDialog(false);
                      setNewSupplier({
                        name: '',
                        code: '',
                        type: 'manufacturer',
                        status: 'pending',
                        contactInfo: {
                          email: '',
                          phone: '',
                          website: '',
                          address: {
                            street: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: 'Thailand'
                          }
                        },
                        integration: {
                          isConnected: false,
                          connectionType: 'api',
                          syncFrequency: 'daily',
                          dataFormat: 'json',
                          encryption: true,
                          authentication: 'token'
                        },
                        capabilities: {
                          serialNumberTracking: true,
                          realTimeInventory: false,
                          orderManagement: false,
                          invoiceIntegration: false,
                          shippingTracking: false,
                          qualityReports: false,
                          warrantyData: false,
                          returnManagement: false
                        }
                      });
                    }}
                    disabled={!newSupplier.name || !newSupplier.code}
                  >
                    เพิ่ม Supplier
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
                placeholder="ค้นหา Supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                <SelectItem value="suspended">ระงับ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="manufacturer">ผู้ผลิต</SelectItem>
                <SelectItem value="distributor">ผู้จัดจำหน่าย</SelectItem>
                <SelectItem value="wholesaler">ผู้ค้าส่ง</SelectItem>
                <SelectItem value="retailer">ผู้ค้าปลีก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">ไม่มี Supplier</h3>
            <p className="text-muted-foreground mb-4">ไม่พบ Supplier ที่ตรงกับเงื่อนไขการค้นหา</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่ม Supplier แรก
            </Button>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(supplier.status)}
                      {getConnectionBadge(supplier.integration.isConnected)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      รหัส: {supplier.code} • {supplier.type}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {supplier.contactInfo.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {supplier.contactInfo.phone}
                      </span>
                    </div>
                    {supplier.contactInfo.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {supplier.contactInfo.website}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Integration Info */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">ประเภทการเชื่อมต่อ:</span>
                        <p className="font-medium uppercase">{supplier.integration.connectionType}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ความถี่ซิงค์:</span>
                        <p className="font-medium">{supplier.integration.syncFrequency}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">รูปแบบข้อมูล:</span>
                        <p className="font-medium uppercase">{supplier.integration.dataFormat}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">การเข้ารหัส:</span>
                        <p className="font-medium">
                          {supplier.integration.encryption ? 'เปิด' : 'ปิด'}
                        </p>
                      </div>
                    </div>
                    {supplier.integration.lastSync && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        ซิงค์ล่าสุด: {formatDate(supplier.integration.lastSync)}
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  {supplier.integration.isConnected && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-700">
                          {supplier.metrics.totalProducts.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">สินค้า</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-700">
                          {supplier.metrics.totalSerialNumbers.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">Serial Number</div>
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">ความสามารถ</h5>
                    <div className="flex flex-wrap gap-1">
                      {supplier.capabilities.serialNumberTracking && (
                        <Badge variant="outline" className="text-xs">Serial Number</Badge>
                      )}
                      {supplier.capabilities.realTimeInventory && (
                        <Badge variant="outline" className="text-xs">Real-time</Badge>
                      )}
                      {supplier.capabilities.orderManagement && (
                        <Badge variant="outline" className="text-xs">คำสั่งซื้อ</Badge>
                      )}
                      {supplier.capabilities.shippingTracking && (
                        <Badge variant="outline" className="text-xs">ติดตามการส่ง</Badge>
                      )}
                      {supplier.capabilities.warrantyData && (
                        <Badge variant="outline" className="text-xs">การรับประกัน</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!supplier.integration.isConnected ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => connectSupplier(supplier.id)}
                        disabled={isConnecting === supplier.id}
                        className="flex-1"
                      >
                        {isConnecting === supplier.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Link className="w-4 h-4 mr-2" />
                        )}
                        {isConnecting === supplier.id ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => syncSupplier(supplier.id)}
                        disabled={isSyncing === supplier.id}
                        className="flex-1"
                      >
                        {isSyncing === supplier.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {isSyncing === supplier.id ? 'กำลังซิงค์...' : 'ซิงค์'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}