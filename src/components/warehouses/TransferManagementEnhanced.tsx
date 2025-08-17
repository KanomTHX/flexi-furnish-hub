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
  Package, 
  MapPin, 
  Calendar, 
  User, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Route,
  Scan,
  QrCode,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Settings,
  Bell,
  History,
  Users,
  Building,
  Tag,
  Box,
  Zap,
  Activity,
  Timer,
  Target,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';

// Type Definitions
interface TransferRequest {
  id: string;
  requestNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatus;
  priority: TransferPriority;
  requestedBy: string;
  requestDate: Date;
  requiredDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
  completedDate?: Date;
  items: TransferItem[];
  notes?: string;
  reason: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  approvalWorkflow: ApprovalStep[];
  documents: TransferDocument[];
  totalValue: number;
  shippingCost: number;
  insurance: boolean;
  urgentDelivery: boolean;
}

interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  serialNumber?: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  transferredQuantity: number;
  unitCost: number;
  totalCost: number;
  condition: string;
  notes?: string;
  scannedAt?: Date;
  receivedAt?: Date;
}

interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: string;
  approverName?: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedDate?: Date;
  comments?: string;
  required: boolean;
}

interface TransferDocument {
  id: string;
  name: string;
  type: 'invoice' | 'packing_list' | 'shipping_label' | 'receipt' | 'photo' | 'other';
  url: string;
  uploadedBy: string;
  uploadedDate: Date;
  size: number;
}

interface TrackingEvent {
  id: string;
  transferId: string;
  eventType: 'created' | 'approved' | 'shipped' | 'in_transit' | 'delivered' | 'received' | 'completed' | 'cancelled';
  description: string;
  location?: string;
  timestamp: Date;
  performedBy: string;
  notes?: string;
}

interface TransferMetrics {
  totalRequests: number;
  pendingApproval: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  averageProcessingTime: number;
  onTimeDeliveryRate: number;
  totalValue: number;
  costSavings: number;
}

type TransferStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'shipped' | 'in_transit' | 'delivered' | 'received' | 'completed' | 'cancelled';
type TransferPriority = 'low' | 'medium' | 'high' | 'urgent';

// Mock Data
const mockWarehouses = [
  { id: '1', name: 'คลังสินค้าหลัก', code: 'WH001', location: 'กรุงเทพฯ' },
  { id: '2', name: 'คลังสินค้าภาคเหนือ', code: 'WH002', location: 'เชียงใหม่' },
  { id: '3', name: 'คลังสินค้าภาคใต้', code: 'WH003', location: 'หาดใหญ่' },
  { id: '4', name: 'คลังสินค้าภาคตะวันออก', code: 'WH004', location: 'ชลบุรี' }
];

const mockTransferRequests: TransferRequest[] = [
  {
    id: '1',
    requestNumber: 'TR-2024-001',
    sourceWarehouseId: '1',
    destinationWarehouseId: '2',
    status: 'in_transit',
    priority: 'high',
    requestedBy: 'สมชาย ใจดี',
    requestDate: new Date('2024-01-15'),
    requiredDate: new Date('2024-01-20'),
    approvedBy: 'วิชัย ผู้จัดการ',
    approvedDate: new Date('2024-01-16'),
    items: [
      {
        id: '1',
        productId: 'P001',
        productName: 'โซฟา 3 ที่นั่ง',
        productCode: 'SF-001',
        serialNumber: 'SF001-2024-001',
        requestedQuantity: 2,
        approvedQuantity: 2,
        transferredQuantity: 2,
        unitCost: 15000,
        totalCost: 30000,
        condition: 'ใหม่',
        scannedAt: new Date('2024-01-16T10:30:00')
      },
      {
        id: '2',
        productId: 'P002',
        productName: 'โต๊ะกาแฟ',
        productCode: 'TB-001',
        requestedQuantity: 1,
        approvedQuantity: 1,
        transferredQuantity: 1,
        unitCost: 8000,
        totalCost: 8000,
        condition: 'ใหม่',
        scannedAt: new Date('2024-01-16T10:35:00')
      }
    ],
    notes: 'ขนส่งด่วน สำหรับลูกค้า VIP',
    reason: 'เติมสต็อกสาขา',
    trackingNumber: 'TH123456789',
    estimatedDelivery: new Date('2024-01-18'),
    approvalWorkflow: [
      {
        id: '1',
        stepNumber: 1,
        approverRole: 'Warehouse Manager',
        approverName: 'วิชัย ผู้จัดการ',
        approverId: 'U001',
        status: 'approved',
        approvedDate: new Date('2024-01-16'),
        comments: 'อนุมัติ - จำเป็นต้องใช้งานด่วน',
        required: true
      },
      {
        id: '2',
        stepNumber: 2,
        approverRole: 'Regional Manager',
        status: 'pending',
        required: false
      }
    ],
    documents: [
      {
        id: '1',
        name: 'ใบขนส่ง',
        type: 'shipping_label',
        url: '/documents/shipping-label-001.pdf',
        uploadedBy: 'สมชาย ใจดี',
        uploadedDate: new Date('2024-01-16'),
        size: 245760
      }
    ],
    totalValue: 38000,
    shippingCost: 500,
    insurance: true,
    urgentDelivery: true
  },
  {
    id: '2',
    requestNumber: 'TR-2024-002',
    sourceWarehouseId: '2',
    destinationWarehouseId: '3',
    status: 'pending',
    priority: 'medium',
    requestedBy: 'สุดา ขยัน',
    requestDate: new Date('2024-01-16'),
    requiredDate: new Date('2024-01-25'),
    items: [
      {
        id: '3',
        productId: 'P003',
        productName: 'ตู้เสื้อผ้า',
        productCode: 'WD-001',
        requestedQuantity: 3,
        transferredQuantity: 0,
        unitCost: 12000,
        totalCost: 36000,
        condition: 'ใหม่'
      }
    ],
    notes: 'โอนย้ายตามแผนการกระจายสินค้า',
    reason: 'จัดสรรสต็อก',
    approvalWorkflow: [
      {
        id: '3',
        stepNumber: 1,
        approverRole: 'Warehouse Manager',
        status: 'pending',
        required: true
      }
    ],
    documents: [],
    totalValue: 36000,
    shippingCost: 800,
    insurance: false,
    urgentDelivery: false
  }
];

const mockTrackingEvents: TrackingEvent[] = [
  {
    id: '1',
    transferId: '1',
    eventType: 'created',
    description: 'สร้างคำขอโอนย้าย',
    timestamp: new Date('2024-01-15T09:00:00'),
    performedBy: 'สมชาย ใจดี'
  },
  {
    id: '2',
    transferId: '1',
    eventType: 'approved',
    description: 'อนุมัติคำขอโอนย้าย',
    timestamp: new Date('2024-01-16T08:30:00'),
    performedBy: 'วิชัย ผู้จัดการ',
    notes: 'อนุมัติ - จำเป็นต้องใช้งานด่วน'
  },
  {
    id: '3',
    transferId: '1',
    eventType: 'shipped',
    description: 'จัดส่งสินค้าออกจากคลังต้นทาง',
    location: 'คลังสินค้าหลัก - กรุงเทพฯ',
    timestamp: new Date('2024-01-16T14:00:00'),
    performedBy: 'พนักงานขนส่ง'
  },
  {
    id: '4',
    transferId: '1',
    eventType: 'in_transit',
    description: 'สินค้าอยู่ระหว่างการขนส่ง',
    location: 'ระหว่างทาง กรุงเทพฯ - เชียงใหม่',
    timestamp: new Date('2024-01-17T10:00:00'),
    performedBy: 'ระบบติดตาม'
  }
];

const mockMetrics: TransferMetrics = {
  totalRequests: 156,
  pendingApproval: 12,
  inTransit: 8,
  completed: 134,
  cancelled: 2,
  averageProcessingTime: 2.5,
  onTimeDeliveryRate: 94.2,
  totalValue: 2450000,
  costSavings: 125000
};

export function TransferManagementEnhanced() {
  const [transfers, setTransfers] = useState<TransferRequest[]>(mockTransferRequests);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>(mockTrackingEvents);
  const [metrics, setMetrics] = useState<TransferMetrics>(mockMetrics);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TransferPriority | 'all'>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Helper Functions
  const getStatusColor = (status: TransferStatus): string => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-teal-100 text-teal-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'shipped': return <Send className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'received': return <CheckSquare className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: TransferPriority): string => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TransferStatus): string => {
    switch (status) {
      case 'draft': return 'ร่าง';
      case 'pending': return 'รอดำเนินการ';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ปฏิเสธ';
      case 'shipped': return 'จัดส่งแล้ว';
      case 'in_transit': return 'กำลังขนส่ง';
      case 'delivered': return 'ส่งถึงแล้ว';
      case 'received': return 'รับสินค้าแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const getPriorityText = (priority: TransferPriority): string => {
    switch (priority) {
      case 'low': return 'ต่ำ';
      case 'medium': return 'ปานกลาง';
      case 'high': return 'สูง';
      case 'urgent': return 'ด่วนมาก';
      default: return priority;
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getWarehouseName = (id: string): string => {
    const warehouse = mockWarehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'ไม่พบข้อมูล';
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getWarehouseName(transfer.sourceWarehouseId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getWarehouseName(transfer.destinationWarehouseId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || transfer.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleApproveTransfer = (transferId: string, comments?: string) => {
    setTransfers(prev => prev.map(transfer => {
      if (transfer.id === transferId) {
        const updatedWorkflow = transfer.approvalWorkflow.map(step => {
          if (step.status === 'pending' && step.required) {
            return {
              ...step,
              status: 'approved' as const,
              approvedDate: new Date(),
              comments: comments || 'อนุมัติ'
            };
          }
          return step;
        });
        
        return {
          ...transfer,
          status: 'approved' as TransferStatus,
          approvedBy: 'ผู้อนุมัติ',
          approvedDate: new Date(),
          approvalWorkflow: updatedWorkflow
        };
      }
      return transfer;
    }));
  };

  const handleRejectTransfer = (transferId: string, reason: string) => {
    setTransfers(prev => prev.map(transfer => {
      if (transfer.id === transferId) {
        const updatedWorkflow = transfer.approvalWorkflow.map(step => {
          if (step.status === 'pending' && step.required) {
            return {
              ...step,
              status: 'rejected' as const,
              approvedDate: new Date(),
              comments: reason
            };
          }
          return step;
        });
        
        return {
          ...transfer,
          status: 'rejected' as TransferStatus,
          approvalWorkflow: updatedWorkflow
        };
      }
      return transfer;
    }));
  };

  const handleUpdateStatus = (transferId: string, newStatus: TransferStatus) => {
    setTransfers(prev => prev.map(transfer => {
      if (transfer.id === transferId) {
        return {
          ...transfer,
          status: newStatus,
          ...(newStatus === 'completed' && { completedDate: new Date() })
        };
      }
      return transfer;
    }));

    // Add tracking event
    const newEvent: TrackingEvent = {
      id: Date.now().toString(),
      transferId,
      eventType: newStatus as any,
      description: `อัปเดตสถานะเป็น ${getStatusText(newStatus)}`,
      timestamp: new Date(),
      performedBy: 'ผู้ใช้ปัจจุบัน'
    };
    
    setTrackingEvents(prev => [...prev, newEvent]);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ระบบจัดการโอนย้ายสินค้า</h1>
          <p className="text-muted-foreground">จัดการคำขอโอนย้าย ติดตาม และอนุมัติการโอนย้ายสินค้า</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          สร้างคำขอใหม่
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="requests">คำขอโอนย้าย</TabsTrigger>
          <TabsTrigger value="tracking">ติดตามสินค้า</TabsTrigger>
          <TabsTrigger value="analytics">รายงาน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">คำขอทั้งหมด</p>
                    <p className="text-2xl font-bold">{metrics.totalRequests}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">รออนุมัติ</p>
                    <p className="text-2xl font-bold text-yellow-600">{metrics.pendingApproval}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">กำลังขนส่ง</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.inTransit}</p>
                  </div>
                  <Truck className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เสร็จสิ้น</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  ประสิทธิภาพการดำเนินงาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">เวลาดำเนินการเฉลี่ย</span>
                  <span className="text-sm font-bold">{metrics.averageProcessingTime} วัน</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">อัตราการส่งตรงเวลา</span>
                  <span className="text-sm font-bold text-green-600">{metrics.onTimeDeliveryRate}%</span>
                </div>
                <Progress value={metrics.onTimeDeliveryRate} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  มูลค่าการโอนย้าย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">มูลค่ารวม</span>
                  <span className="text-sm font-bold">{formatCurrency(metrics.totalValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ประหยัดค่าใช้จ่าย</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(metrics.costSavings)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                คำขอล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfers.slice(0, 5).map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(transfer.status)}`}>
                        {getStatusIcon(transfer.status)}
                      </div>
                      <div>
                        <p className="font-medium">{transfer.requestNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {getWarehouseName(transfer.sourceWarehouseId)} → {getWarehouseName(transfer.destinationWarehouseId)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(transfer.priority)}>
                        {getPriorityText(transfer.priority)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(transfer.requestDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                ตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>ค้นหา</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาเลขที่คำขอ, คลัง..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <Select value={statusFilter} onValueChange={(value: TransferStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="draft">ร่าง</SelectItem>
                      <SelectItem value="pending">รอดำเนินการ</SelectItem>
                      <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                      <SelectItem value="shipped">จัดส่งแล้ว</SelectItem>
                      <SelectItem value="in_transit">กำลังขนส่ง</SelectItem>
                      <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ลำดับความสำคัญ</Label>
                  <Select value={priorityFilter} onValueChange={(value: TransferPriority | 'all') => setPriorityFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="low">ต่ำ</SelectItem>
                      <SelectItem value="medium">ปานกลาง</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                      <SelectItem value="urgent">ด่วนมาก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเซ็ต
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Requests List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  คำขอโอนย้าย ({filteredTransfers.length} รายการ)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransfers.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getStatusColor(transfer.status)}`}>
                          {getStatusIcon(transfer.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{transfer.requestNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            โดย {transfer.requestedBy} • {formatDate(transfer.requestDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(transfer.priority)}>
                          {getPriorityText(transfer.priority)}
                        </Badge>
                        <Badge className={getStatusColor(transfer.status)}>
                          {getStatusText(transfer.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">คลังต้นทาง</p>
                        <p>{getWarehouseName(transfer.sourceWarehouseId)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">คลังปลายทาง</p>
                        <p>{getWarehouseName(transfer.destinationWarehouseId)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">วันที่ต้องการ</p>
                        <p>{formatDate(transfer.requiredDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{transfer.items.length} รายการ</span>
                        <span className="text-muted-foreground"> • มูลค่า {formatCurrency(transfer.totalValue)}</span>
                        {transfer.trackingNumber && (
                          <span className="text-muted-foreground"> • Tracking: {transfer.trackingNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setShowTrackingDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {transfer.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransfer(transfer)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {transfer.notes && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{transfer.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredTransfers.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">ไม่พบคำขอโอนย้าย</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                ติดตามการโอนย้าย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {transfers.filter(t => t.status === 'in_transit' || t.status === 'shipped').map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{transfer.requestNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getWarehouseName(transfer.sourceWarehouseId)} → {getWarehouseName(transfer.destinationWarehouseId)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(transfer.status)}>
                        {getStatusText(transfer.status)}
                      </Badge>
                    </div>
                    
                    {transfer.trackingNumber && (
                      <div className="bg-muted p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">หมายเลขติดตาม: {transfer.trackingNumber}</p>
                        {transfer.estimatedDelivery && (
                          <p className="text-sm text-muted-foreground">
                            คาดว่าจะถึง: {formatDate(transfer.estimatedDelivery)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {trackingEvents
                        .filter(event => event.transferId === transfer.id)
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((event) => (
                          <div key={event.id} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="font-medium">{event.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(event.timestamp)} • {event.performedBy}
                              </p>
                              {event.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              )}
                              {event.notes && (
                                <p className="text-sm text-muted-foreground italic">{event.notes}</p>
                              )}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
                
                {transfers.filter(t => t.status === 'in_transit' || t.status === 'shipped').length === 0 && (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">ไม่มีการโอนย้ายที่กำลังดำเนินการ</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สถิติการโอนย้ายรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mr-2" />
                  กราฟแสดงสถิติการโอนย้าย
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>อัตราการส่งตรงเวลา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mr-2" />
                  กราฟแสดงอัตราการส่งตรงเวลา
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tracking Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการโอนย้าย</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>เลขที่คำขอ</Label>
                  <p className="font-medium">{selectedTransfer.requestNumber}</p>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <Badge className={getStatusColor(selectedTransfer.status)}>
                    {getStatusText(selectedTransfer.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>คลังต้นทาง</Label>
                  <p>{getWarehouseName(selectedTransfer.sourceWarehouseId)}</p>
                </div>
                <div>
                  <Label>คลังปลายทาง</Label>
                  <p>{getWarehouseName(selectedTransfer.destinationWarehouseId)}</p>
                </div>
              </div>
              
              <div>
                <Label>รายการสินค้า</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  {selectedTransfer.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">{item.productCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.requestedQuantity} ชิ้น</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.totalCost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>ประวัติการติดตาม</Label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {trackingEvents
                    .filter(event => event.transferId === selectedTransfer.id)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.timestamp)} • {event.performedBy}
                          </p>
                          {event.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อนุมัติการโอนย้าย</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div>
                <Label>เลขที่คำขอ</Label>
                <p className="font-medium">{selectedTransfer.requestNumber}</p>
              </div>
              
              <div>
                <Label>รายละเอียด</Label>
                <p className="text-sm">
                  {getWarehouseName(selectedTransfer.sourceWarehouseId)} → {getWarehouseName(selectedTransfer.destinationWarehouseId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransfer.items.length} รายการ • มูลค่า {formatCurrency(selectedTransfer.totalValue)}
                </p>
              </div>
              
              <div>
                <Label>เหตุผล</Label>
                <p className="text-sm">{selectedTransfer.reason}</p>
              </div>
              
              {selectedTransfer.notes && (
                <div>
                  <Label>หมายเหตุ</Label>
                  <p className="text-sm">{selectedTransfer.notes}</p>
                </div>
              )}
              
              <div>
                <Label>ความเห็น</Label>
                <Textarea placeholder="ระบุความเห็นเพิ่มเติม (ไม่บังคับ)" />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    handleApproveTransfer(selectedTransfer.id);
                    setShowApprovalDialog(false);
                  }}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  อนุมัติ
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    handleRejectTransfer(selectedTransfer.id, 'ปฏิเสธโดยผู้อนุมัติ');
                    setShowApprovalDialog(false);
                  }}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  ปฏิเสธ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}