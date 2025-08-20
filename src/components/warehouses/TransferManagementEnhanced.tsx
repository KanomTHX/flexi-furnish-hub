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
import { useTransferData } from '@/hooks/useTransferData';
import { useBranchSerialNumbers } from '@/hooks/useWarehouseSerialNumbers';
import { useBranchData } from '@/hooks/useBranchData';
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

// Import types from the hook
import type {
  TransferRequest,
  TransferItem,
  StockTransfer,
  Warehouse,
  TransferMetrics
} from '@/hooks/useTransferData';

// Additional types for the component
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

type TransferStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'shipped' | 'in_transit' | 'delivered' | 'received' | 'completed' | 'cancelled';
type TransferPriority = 'low' | 'medium' | 'high' | 'urgent';

interface CreateTransferForm {
  sourceBranchId: string;
  targetBranchId: string;
  priority: TransferPriority;
  notes: string;
  requestedBy: string;
  items: {
    productId: string;
    serialNumberIds: string[];
    unitCost: number;
    notes?: string;
  }[];
}

interface SelectedSerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  unitCost: number;
}



export function TransferManagementEnhanced() {
  const {
    transferRequests,
    transferItems,
    stockTransfers,
    warehouses,
    metrics,
    loading,
    error,
    createTransferRequest,
    updateTransferRequestStatus,
    addTransferItems,
    refreshData
  } = useTransferData();
  
  const { branches } = useBranchData();
  
  const {
    serialNumbers,
    loading: serialNumbersLoading,
    error: serialNumbersError,
    fetchSerialNumbers
  } = useBranchSerialNumbers();
  
  // Generate tracking events from transfer data
  const trackingEvents: TrackingEvent[] = transferRequests.flatMap(transfer => {
    const events: TrackingEvent[] = [];
    
    // Add created event
    if (transfer.created_at) {
      events.push({
        id: `${transfer.id}-created`,
        transferId: transfer.id,
        eventType: 'created',
        description: 'คำขอโอนย้ายถูกสร้าง',
        timestamp: new Date(transfer.created_at),
        performedBy: transfer.requested_by || 'ระบบ'
      });
    }
    
    // Add status-based events
    if (transfer.status === 'approved' || transfer.status === 'shipped' || transfer.status === 'in_transit' || transfer.status === 'delivered' || transfer.status === 'completed') {
      events.push({
        id: `${transfer.id}-approved`,
        transferId: transfer.id,
        eventType: 'approved',
        description: 'คำขอได้รับการอนุมัติ',
        timestamp: new Date(transfer.updated_at || transfer.created_at),
        performedBy: 'ผู้จัดการ'
      });
    }
    
    if (transfer.status === 'shipped' || transfer.status === 'in_transit' || transfer.status === 'delivered' || transfer.status === 'completed') {
      events.push({
        id: `${transfer.id}-shipped`,
        transferId: transfer.id,
        eventType: 'shipped',
        description: 'สินค้าถูกจัดส่งแล้ว',
        timestamp: new Date(transfer.updated_at || transfer.created_at),
        performedBy: 'พนักงานคลังสินค้า'
      });
    }
    
    if (transfer.status === 'completed') {
      events.push({
        id: `${transfer.id}-completed`,
        transferId: transfer.id,
        eventType: 'completed',
        description: 'การโอนย้ายเสร็จสิ้น',
        timestamp: new Date(transfer.updated_at || transfer.created_at),
        performedBy: 'พนักงานคลังปลายทาง'
      });
    }
    
    return events;
  });
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TransferPriority | 'all'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Create transfer form state
  const [createForm, setCreateForm] = useState<CreateTransferForm>({
    sourceBranchId: '',
    targetBranchId: '',
    priority: 'medium' as TransferPriority,
    notes: '',
    requestedBy: 'current_user',
    items: []
  });
  
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<SelectedSerialNumber[]>([]);
  const [showSerialNumberDialog, setShowSerialNumberDialog] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string>('');

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

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getWarehouseName = (id: string): string => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'ไม่พบข้อมูล';
  };

  const filteredTransfers = transferRequests.filter(transfer => {
    const matchesSearch = transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getWarehouseName(transfer.source_warehouse_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWarehouseName(transfer.target_warehouse_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || transfer.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleApproveTransfer = async (transferId: string, comments?: string) => {
    try {
      await updateTransferRequestStatus(transferId, 'approved', 'current_user');
    } catch (error) {
      console.error('Error approving transfer:', error);
    }
  };

  const handleRejectTransfer = async (transferId: string, reason: string) => {
    try {
      await updateTransferRequestStatus(transferId, 'rejected');
    } catch (error) {
      console.error('Error rejecting transfer:', error);
    }
  };

  const handleUpdateStatus = async (transferId: string, newStatus: TransferStatus) => {
    try {
      await updateTransferRequestStatus(transferId, newStatus as any);
    } catch (error) {
      console.error('Error updating transfer status:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshData} variant="outline">
              ลองใหม่
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                    <p className="text-2xl font-bold text-yellow-600">{metrics?.pendingRequests || 0}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{metrics?.inTransitRequests || 0}</p>
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
                    <p className="text-2xl font-bold text-green-600">{metrics?.completedRequests || 0}</p>
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
                  <span className="text-sm font-bold">{metrics?.averageProcessingTime?.toFixed(1) || 0} วัน</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">อัตราการส่งตรงเวลา</span>
                  <span className="text-sm font-bold text-green-600">95%</span>
                </div>
                <Progress value={95} className="h-2" />
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
                  <span className="text-sm font-bold">{formatCurrency(metrics?.totalValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ประหยัดค่าใช้จ่าย</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(0)}</span>
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
                {transferRequests.slice(0, 5).map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(transfer.status)}`}>
                        {getStatusIcon(transfer.status)}
                      </div>
                      <div>
                        <p className="font-medium">TR-{transfer.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {getWarehouseName(transfer.source_warehouse_id)} → {getWarehouseName(transfer.target_warehouse_id)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPriorityColor(transfer.priority)}>
                        {getPriorityText(transfer.priority)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(transfer.request_date)}
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
                          <h3 className="font-semibold">TR-{transfer.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            โดย {transfer.requested_by} • {formatDate(transfer.request_date)}
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
                        <p>{getWarehouseName(transfer.source_warehouse_id)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">คลังปลายทาง</p>
                        <p>{getWarehouseName(transfer.target_warehouse_id)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">วันที่สร้าง</p>
                        <p>{formatDate(transfer.created_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{transfer.items?.length || 0} รายการ</span>
                        <span className="text-muted-foreground"> • มูลค่า {formatCurrency(transfer.total_value || 0)}</span>
                        {transfer.tracking_number && (
                          <span className="text-muted-foreground"> • Tracking: {transfer.tracking_number}</span>
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
                {transferRequests.filter(t => t.status === 'in_transit' || t.status === 'shipped').map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">TR-{transfer.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getWarehouseName(transfer.source_warehouse_id)} → {getWarehouseName(transfer.target_warehouse_id)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(transfer.status)}>
                        {getStatusText(transfer.status)}
                      </Badge>
                    </div>
                    
                    {transfer.tracking_number && (
                      <div className="bg-muted p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">หมายเลขติดตาม: {transfer.tracking_number}</p>
                        {transfer.estimated_delivery && (
                          <p className="text-sm text-muted-foreground">
                            คาดว่าจะถึง: {formatDate(new Date(transfer.estimated_delivery))}
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
                
                {transferRequests.filter(t => t.status === 'in_transit' || t.status === 'shipped').length === 0 && (
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
                  <p className="font-medium">TR-{selectedTransfer.id}</p>
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
                  <p>{getWarehouseName(selectedTransfer.source_warehouse_id)}</p>
                </div>
                <div>
                  <Label>คลังปลายทาง</Label>
                  <p>{getWarehouseName(selectedTransfer.target_warehouse_id)}</p>
                </div>
              </div>
              
              <div>
                <Label>รายการสินค้า</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  {selectedTransfer.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.product_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} ชิ้น</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.unit_cost * item.quantity)}</p>
                      </div>
                    </div>
                  )) || []}
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
                <p className="font-medium">TR-{selectedTransfer.id}</p>
              </div>
              
              <div>
                <Label>รายละเอียด</Label>
                <p className="text-sm">
                  {getWarehouseName(selectedTransfer.source_warehouse_id)} → {getWarehouseName(selectedTransfer.target_warehouse_id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransfer.items?.length || 0} รายการ • มูลค่า {formatCurrency(selectedTransfer.total_value || 0)}
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

      {/* Create Transfer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างคำขอโอนย้ายใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>สาขาต้นทาง</Label>
                <Select 
                  value={createForm.sourceBranchId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, sourceBranchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขาต้นทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>สาขาปลายทาง</Label>
                <Select 
                  value={createForm.targetBranchId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, targetBranchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขาปลายทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.id !== createForm.sourceBranchId).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>ระดับความสำคัญ</Label>
              <Select 
                value={createForm.priority} 
                onValueChange={(value: TransferPriority) => setCreateForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="urgent">เร่งด่วน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>รายการสินค้า</Label>
              <div className="border rounded-lg p-4 space-y-4">
                {selectedSerialNumbers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSerialNumbers.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">S/N: {item.serialNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatCurrency(item.unitCost)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSerialNumbers(prev => prev.filter(s => s.id !== item.id));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">ยังไม่ได้เลือกสินค้า</p>
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (createForm.sourceBranchId) {
                      fetchSerialNumbers(createForm.sourceBranchId);
                      setShowSerialNumberDialog(true);
                    }
                  }}
                  disabled={!createForm.sourceBranchId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มสินค้า
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea 
                placeholder="หมายเหตุเพิ่มเติม..."
                value={createForm.notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCreateDialog(false);
                  setCreateForm({
                    sourceBranchId: '',
                    targetBranchId: '',
                    priority: 'medium',
                    notes: '',
                    requestedBy: 'current_user',
                    items: []
                  });
                  setSelectedSerialNumbers([]);
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                className="flex-1"
                onClick={async () => {
                  try {
                    // Group serial numbers by product
                    const itemsMap = new Map<string, SelectedSerialNumber[]>();
                    selectedSerialNumbers.forEach(sn => {
                      if (!itemsMap.has(sn.productId)) {
                        itemsMap.set(sn.productId, []);
                      }
                      itemsMap.get(sn.productId)!.push(sn);
                    });
                    
                    const items = Array.from(itemsMap.entries()).map(([productId, sns]) => ({
                      productId,
                      serialNumberIds: sns.map(sn => sn.id),
                      unitCost: sns[0].unitCost,
                      notes: ''
                    }));
                    
                    await createTransferRequest({
                      source_warehouse_id: createForm.sourceBranchId,
                      destination_warehouse_id: createForm.targetBranchId,
                      priority: createForm.priority,
                      notes: createForm.notes,
                      requested_by: createForm.requestedBy,
                      status: 'draft',
                      items
                    });
                    
                    setShowCreateDialog(false);
                    setCreateForm({
                      sourceBranchId: '',
                      targetBranchId: '',
                      priority: 'medium',
                      notes: '',
                      requestedBy: 'current_user',
                      items: []
                    });
                    setSelectedSerialNumbers([]);
                  } catch (error) {
                    console.error('Error creating transfer request:', error);
                  }
                }}
                disabled={!createForm.sourceBranchId || !createForm.targetBranchId || selectedSerialNumbers.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                สร้างคำขอ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Serial Number Selection Dialog */}
      <Dialog open={showSerialNumberDialog} onOpenChange={setShowSerialNumberDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>เลือกสินค้าและ Serial Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {serialNumbersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : serialNumbersError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{serialNumbersError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {serialNumbers
                    .filter(sn => !selectedSerialNumbers.some(selected => selected.id === sn.id))
                    .map((sn) => (
                    <div key={sn.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSerialNumbers(prev => [...prev, {
                                id: sn.id,
                                serialNumber: sn.serial_number,
                                productId: sn.product_id,
                                productName: sn.product_name || 'ไม่ระบุ',
                                unitCost: sn.unit_cost || 0
                              }]);
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{sn.product_name || 'ไม่ระบุ'}</p>
                          <p className="text-sm text-muted-foreground">S/N: {sn.serial_number}</p>
                          <p className="text-sm text-muted-foreground">รหัส: {sn.product_code || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sn.unit_cost || 0)}</p>
                        <Badge className={sn.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {sn.status === 'available' ? 'พร้อมใช้' : sn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {serialNumbers.filter(sn => !selectedSerialNumbers.some(selected => selected.id === sn.id)).length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">ไม่มีสินค้าที่สามารถเลือกได้</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSerialNumberDialog(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setShowSerialNumberDialog(false)}
                  >
                    เสร็จสิ้น
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}