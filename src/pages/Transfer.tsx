import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useTransferRequests } from '../hooks/useTransferRequests';
import { TransferRequestStats } from '../components/warehouse/TransferRequestStats';
import { TransferRequestDetail } from '../components/warehouse/TransferRequestDetail';
import { TransferRequestForm } from '../components/warehouse/TransferRequestForm';
import { 
  TransferRequest, 
  TransferRequestStatus, 
  TransferRequestPriority,
  CreateTransferRequestData 
} from '../types/transfer';

const getStatusIcon = (status: TransferRequestStatus) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_transit':
      return <Truck className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: TransferRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: TransferRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'รอดำเนินการ';
    case 'approved':
      return 'อนุมัติแล้ว';
    case 'in_transit':
      return 'กำลังขนส่ง';
    case 'completed':
      return 'เสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิก';
    case 'rejected':
      return 'ปฏิเสธ';
    default:
      return status;
  }
};

const getPriorityColor = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityText = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'high':
      return 'สูง';
    case 'medium':
      return 'ปานกลาง';
    case 'low':
      return 'ต่ำ';
    default:
      return priority;
  }
};

export function Transfer() {
  const {
    transferRequests,
    warehouses,
    products,
    loading,
    error,
    getFilteredRequests,
    getStats,
    createTransferRequest,
    updateTransferRequestStatus,
    getTransferRequestById,
    deleteTransferRequest
  } = useTransferRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferRequestStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TransferRequestPriority | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredRequests = getFilteredRequests({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter
  });

  const stats = getStats();

  const handleCreateRequest = async (data: CreateTransferRequestData) => {
    try {
      await createTransferRequest(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating transfer request:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: TransferRequestStatus) => {
    try {
      await updateTransferRequestStatus(id, status);
      // Refresh selected request if it's the one being updated
      if (selectedRequest && selectedRequest.id === id) {
        const updatedRequest = getTransferRequestById(id);
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error('Error updating transfer request status:', error);
    }
  };

  const handleViewRequest = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอนี้?')) {
      try {
        await deleteTransferRequest(id);
      } catch (error) {
        console.error('Error deleting transfer request:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container-responsive">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>เกิดข้อผิดพลาด: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive space-modern">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ระบบโอนย้ายสินค้า</h1>
          <p className="text-muted-foreground">จัดการคำขอโอนย้ายสินค้าระหว่างคลังสินค้า</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างคำขอใหม่
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="requests">คำขอโอนย้าย</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TransferRequestStats stats={stats} loading={loading} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                ตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ค้นหา</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาเลขที่คำขอ, คลังสินค้า..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">สถานะ</label>
                  <Select value={statusFilter} onValueChange={(value: TransferRequestStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="pending">รอดำเนินการ</SelectItem>
                      <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                      <SelectItem value="in_transit">กำลังขนส่ง</SelectItem>
                      <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                      <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ลำดับความสำคัญ</label>
                  <Select value={priorityFilter} onValueChange={(value: TransferRequestPriority | 'all') => setPriorityFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                      <SelectItem value="medium">ปานกลาง</SelectItem>
                      <SelectItem value="low">ต่ำ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    รีเซ็ต
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  คำขอโอนย้าย ({filteredRequests.length} รายการ)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่คำขอ</TableHead>
                      <TableHead>คลังต้นทาง</TableHead>
                      <TableHead>คลังปลายทาง</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ลำดับความสำคัญ</TableHead>
                      <TableHead>วันที่ต้องการ</TableHead>
                      <TableHead>จำนวนสินค้า</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const sourceWarehouse = warehouses.find(w => w.id === request.sourceWarehouseId);
                      const destinationWarehouse = warehouses.find(w => w.id === request.destinationWarehouseId);
                      
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requestNumber}</TableCell>
                          <TableCell>{sourceWarehouse?.name || 'ไม่พบข้อมูล'}</TableCell>
                          <TableCell>{destinationWarehouse?.name || 'ไม่พบข้อมูล'}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(request.status)}
                              {getStatusText(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(request.priority)} variant="outline">
                              {getPriorityText(request.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(request.requiredDate, 'dd MMM yyyy', { locale: th })}
                          </TableCell>
                          <TableCell>{request.items.length} รายการ</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">ไม่พบคำขอโอนย้าย</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transfer Request Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้างคำขอโอนย้ายสินค้า</DialogTitle>
          </DialogHeader>
          <TransferRequestForm
            warehouses={warehouses}
            products={products}
            onSubmit={handleCreateRequest}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำขอโอนย้าย</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <TransferRequestDetail
              transferRequest={selectedRequest}
              warehouses={warehouses}
              onStatusUpdate={handleStatusUpdate}
              onClose={() => setShowDetailDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Transfer;