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
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  Stop, 
  Settings, 
  Activity, 
  Database, 
  Cloud, 
  Server, 
  Wifi, 
  WifiOff, 
  Signal, 
  Download, 
  Upload, 
  Sync, 
  Calendar, 
  Timer, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Package, 
  Tag, 
  Users, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Link, 
  Unlink, 
  Power, 
  PowerOff, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  HardDrive, 
  MemoryStick, 
  Cpu, 
  Gauge, 
  Thermometer, 
  Battery, 
  BatteryLow, 
  Bolt, 
  Flashlight, 
  Sun, 
  Moon, 
  Star, 
  Heart, 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Fingerprint, 
  Scan, 
  QrCode, 
  Barcode, 
  Camera, 
  Video, 
  Image, 
  File, 
  Folder, 
  Archive, 
  Inbox, 
  Outbox, 
  Send, 
  Receive, 
  Forward, 
  Reply, 
  Share, 
  Copy, 
  Cut, 
  Paste, 
  Save, 
  SaveAll, 
  Undo, 
  Redo, 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Move, 
  Resize, 
  Maximize, 
  Minimize, 
  Square, 
  Circle, 
  Triangle, 
  Hexagon, 
  Pentagon, 
  Octagon
} from 'lucide-react';

// Types for Supplier Sync
interface SyncConfiguration {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  description: string;
  syncType: 'realtime' | 'scheduled' | 'manual';
  dataTypes: ('products' | 'inventory' | 'orders' | 'pricing' | 'availability')[];
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    days?: number[]; // 0-6 (Sunday-Saturday)
    timezone: string;
  };
  endpoints: {
    products?: string;
    inventory?: string;
    orders?: string;
    pricing?: string;
    availability?: string;
  };
  authentication: {
    type: 'api_key' | 'oauth' | 'basic' | 'bearer';
    credentials: Record<string, string>;
  };
  mapping: {
    mappingId: string;
    mappingName: string;
  };
  filters?: {
    categories?: string[];
    brands?: string[];
    priceRange?: { min: number; max: number };
    dateRange?: { from: Date; to: Date };
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
    backoffMultiplier: number;
  };
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onWarning: boolean;
    recipients: string[];
  };
  isActive: boolean;
  lastSync?: Date;
  nextSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncSession {
  id: string;
  configId: string;
  configName: string;
  supplierId: string;
  supplierName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending';
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  progress: {
    current: number;
    total: number;
    percentage: number;
    stage: string;
  };
  statistics: {
    recordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    recordsSkipped: number;
    recordsFailed: number;
    dataTransferred: number; // bytes
  };
  errors: SyncError[];
  warnings: SyncWarning[];
  logs: SyncLog[];
}

interface SyncError {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  message: string;
  details?: string;
  recordId?: string;
  field?: string;
  suggestion?: string;
}

interface SyncWarning {
  id: string;
  timestamp: Date;
  code: string;
  message: string;
  details?: string;
  recordId?: string;
  field?: string;
}

interface SyncLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
  details?: any;
}

interface SyncMetrics {
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  averageDuration: number; // seconds
  totalRecordsProcessed: number;
  totalDataTransferred: number; // bytes
  lastSuccessfulSync?: Date;
  uptime: number; // percentage
  errorRate: number; // percentage
}

interface SupplierSyncProps {
  supplierId?: string;
  onSyncStarted?: (session: SyncSession) => void;
  onSyncCompleted?: (session: SyncSession) => void;
  onConfigurationCreated?: (config: SyncConfiguration) => void;
}

export function SupplierSync({ supplierId, onSyncStarted, onSyncCompleted, onConfigurationCreated }: SupplierSyncProps) {
  const [configurations, setConfigurations] = useState<SyncConfiguration[]>([]);
  const [sessions, setSessions] = useState<SyncSession[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SyncConfiguration | null>(null);
  const [selectedSession, setSelectedSession] = useState<SyncSession | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('configurations');
  const [isStartingSync, setIsStartingSync] = useState<string | null>(null);
  const [runningSession, setRunningSession] = useState<SyncSession | null>(null);

  // New configuration form state
  const [newConfig, setNewConfig] = useState<Partial<SyncConfiguration>>({
    name: '',
    description: '',
    syncType: 'scheduled',
    dataTypes: ['products'],
    schedule: {
      frequency: 'daily',
      time: '02:00',
      timezone: 'Asia/Bangkok'
    },
    endpoints: {},
    authentication: {
      type: 'api_key',
      credentials: {}
    },
    mapping: {
      mappingId: '',
      mappingName: ''
    },
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 30,
      backoffMultiplier: 2
    },
    notifications: {
      onSuccess: true,
      onError: true,
      onWarning: false,
      recipients: []
    },
    isActive: true
  });

  // Mock data for configurations
  const mockConfigurations: SyncConfiguration[] = [
    {
      id: 'config-001',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      name: 'Product & Inventory Sync',
      description: 'ซิงค์ข้อมูลสินค้าและสต็อกทุก 4 ชั่วโมง',
      syncType: 'scheduled',
      dataTypes: ['products', 'inventory', 'pricing'],
      schedule: {
        frequency: 'hourly',
        timezone: 'Asia/Bangkok'
      },
      endpoints: {
        products: 'https://api.furniturethai.com/v1/products',
        inventory: 'https://api.furniturethai.com/v1/inventory',
        pricing: 'https://api.furniturethai.com/v1/pricing'
      },
      authentication: {
        type: 'api_key',
        credentials: {
          api_key: 'ft_api_key_***'
        }
      },
      mapping: {
        mappingId: 'mapping-001',
        mappingName: 'Product Data Mapping'
      },
      filters: {
        categories: ['SOFA', 'TABLE', 'CHAIR'],
        priceRange: { min: 1000, max: 100000 }
      },
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 30,
        backoffMultiplier: 2
      },
      notifications: {
        onSuccess: true,
        onError: true,
        onWarning: false,
        recipients: ['admin@flexifurnish.com']
      },
      isActive: true,
      lastSync: new Date('2024-01-25T10:00:00'),
      nextSync: new Date('2024-01-25T14:00:00'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'config-002',
      supplierId: 'supplier-002',
      supplierName: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      name: 'Real-time Order Sync',
      description: 'ซิงค์คำสั่งซื้อแบบ real-time',
      syncType: 'realtime',
      dataTypes: ['orders', 'availability'],
      endpoints: {
        orders: 'wss://api.electronicsplus.com/orders',
        availability: 'https://api.electronicsplus.com/v1/availability'
      },
      authentication: {
        type: 'oauth',
        credentials: {
          client_id: 'ep_client_***',
          client_secret: 'ep_secret_***'
        }
      },
      mapping: {
        mappingId: 'mapping-002',
        mappingName: 'Order Data Mapping'
      },
      retryPolicy: {
        maxRetries: 5,
        retryDelay: 15,
        backoffMultiplier: 1.5
      },
      notifications: {
        onSuccess: false,
        onError: true,
        onWarning: true,
        recipients: ['orders@flexifurnish.com', 'admin@flexifurnish.com']
      },
      isActive: true,
      lastSync: new Date('2024-01-25T11:30:00'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'config-003',
      supplierId: 'supplier-003',
      supplierName: 'บริษัท โฮมดีไซน์ จำกัด',
      name: 'Weekly Report Sync',
      description: 'ซิงค์รายงานสินค้าทุกสัปดาห์',
      syncType: 'scheduled',
      dataTypes: ['products', 'inventory'],
      schedule: {
        frequency: 'weekly',
        time: '01:00',
        days: [1], // Monday
        timezone: 'Asia/Bangkok'
      },
      endpoints: {
        products: 'https://api.homedesign.com/v2/products',
        inventory: 'https://api.homedesign.com/v2/stock'
      },
      authentication: {
        type: 'bearer',
        credentials: {
          token: 'hd_bearer_***'
        }
      },
      mapping: {
        mappingId: 'mapping-003',
        mappingName: 'Home Design Mapping'
      },
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 60,
        backoffMultiplier: 2
      },
      notifications: {
        onSuccess: true,
        onError: true,
        onWarning: false,
        recipients: ['reports@flexifurnish.com']
      },
      isActive: false,
      lastSync: new Date('2024-01-22T01:00:00'),
      nextSync: new Date('2024-01-29T01:00:00'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-22')
    }
  ];

  // Mock data for sessions
  const mockSessions: SyncSession[] = [
    {
      id: 'session-001',
      configId: 'config-001',
      configName: 'Product & Inventory Sync',
      supplierId: 'supplier-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      status: 'completed',
      startTime: new Date('2024-01-25T10:00:00'),
      endTime: new Date('2024-01-25T10:05:30'),
      duration: 330,
      progress: {
        current: 1250,
        total: 1250,
        percentage: 100,
        stage: 'Completed'
      },
      statistics: {
        recordsProcessed: 1250,
        recordsCreated: 45,
        recordsUpdated: 1180,
        recordsSkipped: 20,
        recordsFailed: 5,
        dataTransferred: 2048576 // 2MB
      },
      errors: [
        {
          id: 'error-001',
          timestamp: new Date('2024-01-25T10:03:15'),
          severity: 'medium',
          code: 'VALIDATION_ERROR',
          message: 'Invalid price format for product SF-001',
          details: 'Price value "invalid" cannot be converted to number',
          recordId: 'SF-001',
          field: 'price',
          suggestion: 'Check price format in source data'
        }
      ],
      warnings: [
        {
          id: 'warning-001',
          timestamp: new Date('2024-01-25T10:02:30'),
          code: 'MISSING_FIELD',
          message: 'Optional field "description" is missing',
          recordId: 'SF-002',
          field: 'description'
        }
      ],
      logs: [
        {
          id: 'log-001',
          timestamp: new Date('2024-01-25T10:00:00'),
          level: 'info',
          message: 'Sync session started',
          details: { configId: 'config-001' }
        },
        {
          id: 'log-002',
          timestamp: new Date('2024-01-25T10:00:15'),
          level: 'info',
          message: 'Connected to supplier API',
          details: { endpoint: 'https://api.furniturethai.com/v1/products' }
        },
        {
          id: 'log-003',
          timestamp: new Date('2024-01-25T10:05:30'),
          level: 'info',
          message: 'Sync session completed successfully',
          details: { duration: 330, recordsProcessed: 1250 }
        }
      ]
    },
    {
      id: 'session-002',
      configId: 'config-002',
      configName: 'Real-time Order Sync',
      supplierId: 'supplier-002',
      supplierName: 'บริษัท อิเล็กทรอนิกส์ พลัส จำกัด',
      status: 'running',
      startTime: new Date('2024-01-25T11:30:00'),
      progress: {
        current: 75,
        total: 100,
        percentage: 75,
        stage: 'Processing orders'
      },
      statistics: {
        recordsProcessed: 75,
        recordsCreated: 15,
        recordsUpdated: 55,
        recordsSkipped: 3,
        recordsFailed: 2,
        dataTransferred: 512000 // 500KB
      },
      errors: [],
      warnings: [],
      logs: [
        {
          id: 'log-004',
          timestamp: new Date('2024-01-25T11:30:00'),
          level: 'info',
          message: 'Real-time sync session started',
          details: { configId: 'config-002' }
        }
      ]
    }
  ];

  // Mock metrics
  const mockMetrics: SyncMetrics = {
    totalSessions: 156,
    successfulSessions: 142,
    failedSessions: 14,
    averageDuration: 245, // seconds
    totalRecordsProcessed: 125000,
    totalDataTransferred: 52428800, // 50MB
    lastSuccessfulSync: new Date('2024-01-25T10:05:30'),
    uptime: 95.2,
    errorRate: 3.8
  };

  useEffect(() => {
    setConfigurations(supplierId ? mockConfigurations.filter(c => c.supplierId === supplierId) : mockConfigurations);
    setSessions(mockSessions);
    setMetrics(mockMetrics);
    
    // Find running session
    const running = mockSessions.find(s => s.status === 'running');
    if (running) {
      setRunningSession(running);
    }
  }, [supplierId]);

  const startSync = async (configId: string) => {
    setIsStartingSync(configId);
    
    // Simulate starting sync
    setTimeout(() => {
      const config = configurations.find(c => c.id === configId);
      if (!config) return;
      
      const session: SyncSession = {
        id: `session-${Date.now()}`,
        configId,
        configName: config.name,
        supplierId: config.supplierId,
        supplierName: config.supplierName,
        status: 'running',
        startTime: new Date(),
        progress: {
          current: 0,
          total: 100,
          percentage: 0,
          stage: 'Initializing'
        },
        statistics: {
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          recordsFailed: 0,
          dataTransferred: 0
        },
        errors: [],
        warnings: [],
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            level: 'info',
            message: 'Sync session started',
            details: { configId }
          }
        ]
      };
      
      setSessions(prev => [session, ...prev]);
      setRunningSession(session);
      setIsStartingSync(null);
      
      if (onSyncStarted) {
        onSyncStarted(session);
      }
      
      // Simulate sync progress
      simulateSyncProgress(session);
    }, 1000);
  };

  const simulateSyncProgress = (session: SyncSession) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        const completedSession: SyncSession = {
          ...session,
          status: 'completed',
          endTime: new Date(),
          duration: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000),
          progress: {
            current: 100,
            total: 100,
            percentage: 100,
            stage: 'Completed'
          },
          statistics: {
            recordsProcessed: 100,
            recordsCreated: 10,
            recordsUpdated: 85,
            recordsSkipped: 3,
            recordsFailed: 2,
            dataTransferred: 1024000
          }
        };
        
        setSessions(prev => prev.map(s => s.id === session.id ? completedSession : s));
        setRunningSession(null);
        
        if (onSyncCompleted) {
          onSyncCompleted(completedSession);
        }
      } else {
        const updatedSession: SyncSession = {
          ...session,
          progress: {
            current: Math.floor(progress),
            total: 100,
            percentage: Math.floor(progress),
            stage: progress < 30 ? 'Connecting' : progress < 70 ? 'Processing' : 'Finalizing'
          },
          statistics: {
            recordsProcessed: Math.floor(progress),
            recordsCreated: Math.floor(progress * 0.1),
            recordsUpdated: Math.floor(progress * 0.8),
            recordsSkipped: Math.floor(progress * 0.05),
            recordsFailed: Math.floor(progress * 0.02),
            dataTransferred: Math.floor(progress * 10240)
          }
        };
        
        setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));
        setRunningSession(updatedSession);
      }
    }, 1000);
  };

  const stopSync = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const stoppedSession: SyncSession = {
      ...session,
      status: 'cancelled',
      endTime: new Date(),
      duration: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)
    };
    
    setSessions(prev => prev.map(s => s.id === sessionId ? stoppedSession : s));
    setRunningSession(null);
  };

  const getStatusBadge = (status: SyncSession['status']) => {
    const colors = {
      running: 'bg-blue-500',
      completed: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-500',
      pending: 'bg-yellow-500'
    };
    
    const labels = {
      running: 'กำลังทำงาน',
      completed: 'สำเร็จ',
      failed: 'ล้มเหลว',
      cancelled: 'ยกเลิก',
      pending: 'รอดำเนินการ'
    };
    
    return (
      <Badge className={`${colors[status]} text-white`}>
        {labels[status]}
      </Badge>
    );
  };

  const getSyncTypeBadge = (syncType: SyncConfiguration['syncType']) => {
    const colors = {
      realtime: 'bg-green-500',
      scheduled: 'bg-blue-500',
      manual: 'bg-gray-500'
    };
    
    const labels = {
      realtime: 'Real-time',
      scheduled: 'ตามกำหนด',
      manual: 'ด้วยตนเอง'
    };
    
    return (
      <Badge className={`${colors[syncType]} text-white`}>
        {labels[syncType]}
      </Badge>
    );
  };

  const getStatusIcon = (status: SyncSession['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Stop className="w-4 h-4 text-gray-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = searchTerm === '' || 
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && config.isActive) ||
      (filterStatus === 'inactive' && !config.isActive);
    
    const matchesType = filterType === 'all' || config.syncType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.configName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sync className="w-6 h-6" />
            Supplier Sync Management
          </h2>
          <p className="text-muted-foreground">
            จัดการการซิงค์ข้อมูลกับ Supplier แบบ Real-time และตามกำหนดเวลา
          </p>
        </div>
        <div className="flex items-center gap-2">
          {metrics && (
            <Button variant="outline" onClick={() => setShowMetricsDialog(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              สถิติ
            </Button>
          )}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Sync Configuration ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ชื่อ Configuration</Label>
                    <Input 
                      value={newConfig.name || ''}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ป้อนชื่อ Configuration"
                    />
                  </div>
                  <div>
                    <Label>ประเภทการซิงค์</Label>
                    <Select 
                      value={newConfig.syncType} 
                      onValueChange={(value: SyncConfiguration['syncType']) => 
                        setNewConfig(prev => ({ ...prev, syncType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="scheduled">ตามกำหนดเวลา</SelectItem>
                        <SelectItem value="manual">ด้วยตนเอง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>คำอธิบาย</Label>
                  <Textarea 
                    value={newConfig.description || ''}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="อธิบายการใช้งาน Configuration นี้"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newConfig.isActive}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>เปิดใช้งาน</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={() => {
                      const config: SyncConfiguration = {
                        id: `config-${Date.now()}`,
                        supplierId: supplierId || 'default',
                        supplierName: 'Default Supplier',
                        name: newConfig.name || '',
                        description: newConfig.description || '',
                        syncType: newConfig.syncType || 'scheduled',
                        dataTypes: newConfig.dataTypes || ['products'],
                        schedule: newConfig.schedule,
                        endpoints: newConfig.endpoints || {},
                        authentication: newConfig.authentication!,
                        mapping: newConfig.mapping!,
                        retryPolicy: newConfig.retryPolicy!,
                        notifications: newConfig.notifications!,
                        isActive: newConfig.isActive !== false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      setConfigurations(prev => [config, ...prev]);
                      setShowConfigDialog(false);
                      setNewConfig({
                        name: '',
                        description: '',
                        syncType: 'scheduled',
                        dataTypes: ['products'],
                        schedule: {
                          frequency: 'daily',
                          time: '02:00',
                          timezone: 'Asia/Bangkok'
                        },
                        endpoints: {},
                        authentication: {
                          type: 'api_key',
                          credentials: {}
                        },
                        mapping: {
                          mappingId: '',
                          mappingName: ''
                        },
                        retryPolicy: {
                          maxRetries: 3,
                          retryDelay: 30,
                          backoffMultiplier: 2
                        },
                        notifications: {
                          onSuccess: true,
                          onError: true,
                          onWarning: false,
                          recipients: []
                        },
                        isActive: true
                      });
                      
                      if (onConfigurationCreated) {
                        onConfigurationCreated(config);
                      }
                    }}
                    disabled={!newConfig.name}
                  >
                    เพิ่ม Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Running Session Alert */}
      {runningSession && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <h3 className="font-medium text-blue-700">
                  {runningSession.configName} กำลังทำงาน
                </h3>
                <Badge className="bg-blue-500 text-white">
                  {runningSession.progress.stage}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => stopSync(runningSession.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Stop className="w-4 h-4 mr-2" />
                หยุด
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>ความคืบหน้า</span>
                <span>{runningSession.progress.percentage}%</span>
              </div>
              <Progress value={runningSession.progress.percentage} className="h-2" />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{runningSession.statistics.recordsProcessed}</div>
                  <div className="text-muted-foreground">ประมวลผล</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{runningSession.statistics.recordsCreated}</div>
                  <div className="text-muted-foreground">สร้างใหม่</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{runningSession.statistics.recordsUpdated}</div>
                  <div className="text-muted-foreground">อัปเดต</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatBytes(runningSession.statistics.dataTransferred)}</div>
                  <div className="text-muted-foreground">ข้อมูล</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="ค้นหา Configuration..."
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
                    <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="ประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="scheduled">ตามกำหนด</SelectItem>
                    <SelectItem value="manual">ด้วยตนเอง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configurations List */}
          <div className="space-y-4">
            {filteredConfigurations.length === 0 ? (
              <div className="text-center py-12">
                <Sync className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">ไม่มี Configuration</h3>
                <p className="text-muted-foreground mb-4">ไม่พบ Configuration ที่ตรงกับเงื่อนไขการค้นหา</p>
                <Button onClick={() => setShowConfigDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่ม Configuration แรก
                </Button>
              </div>
            ) : (
              filteredConfigurations.map((config) => (
                <Card key={config.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sync className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          {getSyncTypeBadge(config.syncType)}
                          <Badge className={config.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                            {config.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {config.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supplier: {config.supplierName}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Data Types */}
                      <div>
                        <h5 className="font-medium mb-2">ประเภทข้อมูล</h5>
                        <div className="flex flex-wrap gap-1">
                          {config.dataTypes.map((type) => (
                            <Badge key={type} variant="outline">
                              {type === 'products' ? 'สินค้า' :
                               type === 'inventory' ? 'คลังสินค้า' :
                               type === 'orders' ? 'คำสั่งซื้อ' :
                               type === 'pricing' ? 'ราคา' :
                               type === 'availability' ? 'ความพร้อม' : type}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Schedule */}
                      {config.schedule && (
                        <div>
                          <h5 className="font-medium mb-2">กำหนดการ</h5>
                          <p className="text-sm text-muted-foreground">
                            {config.schedule.frequency === 'hourly' ? 'ทุกชั่วโมง' :
                             config.schedule.frequency === 'daily' ? `ทุกวัน เวลา ${config.schedule.time}` :
                             config.schedule.frequency === 'weekly' ? `ทุกสัปดาห์ เวลา ${config.schedule.time}` :
                             config.schedule.frequency === 'monthly' ? `ทุกเดือน เวลา ${config.schedule.time}` :
                             config.schedule.frequency}
                          </p>
                        </div>
                      )}

                      {/* Last Sync */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {config.lastSync && (
                          <div>
                            <span className="text-muted-foreground">ซิงค์ล่าสุด:</span>
                            <br />
                            <span>{formatDate(config.lastSync)}</span>
                          </div>
                        )}
                        {config.nextSync && (
                          <div>
                            <span className="text-muted-foreground">ซิงค์ครั้งถัดไป:</span>
                            <br />
                            <span>{formatDate(config.nextSync)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startSync(config.id)}
                          disabled={isStartingSync === config.id || !config.isActive || !!runningSession}
                        >
                          {isStartingSync === config.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {isStartingSync === config.id ? 'กำลังเริ่ม...' : 'เริ่มซิงค์'}
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
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">ไม่มี Session</h3>
                <p className="text-muted-foreground">ยังไม่มีการซิงค์ข้อมูล</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(session.status)}
                          <CardTitle className="text-lg">{session.configName}</CardTitle>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.supplierName}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      {session.status === 'running' && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>{session.progress.stage}</span>
                            <span>{session.progress.percentage}%</span>
                          </div>
                          <Progress value={session.progress.percentage} className="h-2" />
                        </div>
                      )}

                      {/* Statistics */}
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">{session.statistics.recordsProcessed}</div>
                          <div className="text-xs text-muted-foreground">ประมวลผล</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-medium">{session.statistics.recordsCreated}</div>
                          <div className="text-xs text-muted-foreground">สร้างใหม่</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-medium">{session.statistics.recordsUpdated}</div>
                          <div className="text-xs text-muted-foreground">อัปเดต</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-medium">{session.statistics.recordsSkipped}</div>
                          <div className="text-xs text-muted-foreground">ข้าม</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-medium">{session.statistics.recordsFailed}</div>
                          <div className="text-xs text-muted-foreground">ล้มเหลว</div>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">เริ่ม:</span>
                          <br />
                          <span>{formatDate(session.startTime)}</span>
                        </div>
                        {session.endTime && (
                          <div>
                            <span className="text-muted-foreground">สิ้นสุด:</span>
                            <br />
                            <span>{formatDate(session.endTime)}</span>
                          </div>
                        )}
                        {session.duration && (
                          <div>
                            <span className="text-muted-foreground">ระยะเวลา:</span>
                            <br />
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        )}
                      </div>

                      {/* Errors and Warnings */}
                      {(session.errors.length > 0 || session.warnings.length > 0) && (
                        <div className="flex items-center gap-4 text-sm">
                          {session.errors.length > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span>{session.errors.length} ข้อผิดพลาด</span>
                            </div>
                          )}
                          {session.warnings.length > 0 && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{session.warnings.length} คำเตือน</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session);
                            setShowSessionDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
                        </Button>
                        {session.status === 'running' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => stopSync(session.id)}
                            className="text-red-600"
                          >
                            <Stop className="w-4 h-4 mr-2" />
                            หยุด
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียด Sync Session</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
                <TabsTrigger value="errors">ข้อผิดพลาด</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Configuration</Label>
                    <p className="text-sm">{selectedSession.configName}</p>
                  </div>
                  <div>
                    <Label>Supplier</Label>
                    <p className="text-sm">{selectedSession.supplierName}</p>
                  </div>
                  <div>
                    <Label>สถานะ</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedSession.status)}
                      {getStatusBadge(selectedSession.status)}
                    </div>
                  </div>
                  <div>
                    <Label>ระยะเวลา</Label>
                    <p className="text-sm">
                      {selectedSession.duration ? formatDuration(selectedSession.duration) : 'กำลังทำงาน'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>สถิติการประมวลผล</Label>
                  <div className="grid grid-cols-5 gap-4 mt-2">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{selectedSession.statistics.recordsProcessed}</div>
                      <div className="text-xs text-muted-foreground">ประมวลผล</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-lg font-bold">{selectedSession.statistics.recordsCreated}</div>
                      <div className="text-xs text-muted-foreground">สร้างใหม่</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-lg font-bold">{selectedSession.statistics.recordsUpdated}</div>
                      <div className="text-xs text-muted-foreground">อัปเดต</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-lg font-bold">{selectedSession.statistics.recordsSkipped}</div>
                      <div className="text-xs text-muted-foreground">ข้าม</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-lg font-bold">{selectedSession.statistics.recordsFailed}</div>
                      <div className="text-xs text-muted-foreground">ล้มเหลว</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>ข้อมูลที่ถ่ายโอน</Label>
                  <p className="text-sm">{formatBytes(selectedSession.statistics.dataTransferred)}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="errors" className="space-y-4">
                {selectedSession.errors.length === 0 && selectedSession.warnings.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-muted-foreground">ไม่มีข้อผิดพลาดหรือคำเตือน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedSession.errors.map((error) => (
                      <div key={error.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-red-700">{error.message}</span>
                              <Badge className="bg-red-500 text-white text-xs">
                                {error.severity}
                              </Badge>
                            </div>
                            {error.details && (
                              <p className="text-sm text-red-600 mb-2">{error.details}</p>
                            )}
                            {error.suggestion && (
                              <p className="text-sm text-red-600 italic">
                                แนะนำ: {error.suggestion}
                              </p>
                            )}
                            <div className="text-xs text-red-500 mt-2">
                              {formatDate(error.timestamp)} • Code: {error.code}
                              {error.recordId && ` • Record: ${error.recordId}`}
                              {error.field && ` • Field: ${error.field}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedSession.warnings.map((warning) => (
                      <div key={warning.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-yellow-700 mb-1">{warning.message}</div>
                            {warning.details && (
                              <p className="text-sm text-yellow-600 mb-2">{warning.details}</p>
                            )}
                            <div className="text-xs text-yellow-500">
                              {formatDate(warning.timestamp)} • Code: {warning.code}
                              {warning.recordId && ` • Record: ${warning.recordId}`}
                              {warning.field && ` • Field: ${warning.field}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-2">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {selectedSession.logs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          className={`text-xs ${
                            log.level === 'error' ? 'bg-red-500 text-white' :
                            log.level === 'warn' ? 'bg-yellow-500 text-white' :
                            log.level === 'info' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="mb-1">{log.message}</p>
                      {log.details && (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สถิติการซิงค์ข้อมูล</DialogTitle>
          </DialogHeader>
          {metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{metrics.totalSessions}</div>
                  <div className="text-sm text-blue-600">รวม Sessions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{metrics.successfulSessions}</div>
                  <div className="text-sm text-green-600">สำเร็จ</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{metrics.failedSessions}</div>
                  <div className="text-sm text-red-600">ล้มเหลว</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">{formatDuration(metrics.averageDuration)}</div>
                  <div className="text-sm text-gray-600">เวลาเฉลี่ย</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">
                    {metrics.totalRecordsProcessed.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">Records ทั้งหมด</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-700">
                    {formatBytes(metrics.totalDataTransferred)}
                  </div>
                  <div className="text-sm text-indigo-600">ข้อมูลทั้งหมด</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-700">Uptime</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{metrics.uptime}%</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-orange-700">Error Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700">{metrics.errorRate}%</div>
                </div>
              </div>
              
              {metrics.lastSuccessfulSync && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700 mb-1">ซิงค์สำเร็จล่าสุด</div>
                  <div className="text-sm text-gray-600">
                    {formatDate(metrics.lastSuccessfulSync)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}