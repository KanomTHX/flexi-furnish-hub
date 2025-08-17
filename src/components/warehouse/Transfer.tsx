import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  TransferRequest,
  TransferRequestStatus,
  TransferRequestPriority,
  TransferRequestFilters,
} from '@/types/transfer';
import { useTransferRequests } from '@/hooks/useTransfer';
import { CreateTransferRequest } from './CreateTransferRequest';
import { TransferRequestDetail } from './TransferRequestDetail';

// Helper functions for status and priority display
const getStatusColor = (status: TransferRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: TransferRequestStatus) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />;
    case 'approved':
      return <CheckCircle className="h-3 w-3" />;
    case 'rejected':
      return <XCircle className="h-3 w-3" />;
    case 'in_transit':
      return <Truck className="h-3 w-3" />;
    case 'completed':
      return <Package className="h-3 w-3" />;
    case 'cancelled':
      return <XCircle className="h-3 w-3" />;
    default:
      return <AlertTriangle className="h-3 w-3" />;
  }
};

const getStatusText = (status: TransferRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'รอดำเนินการ';
    case 'approved':
      return 'อนุมัติแล้ว';
    case 'rejected':
      return 'ปฏิเสธ';
    case 'in_transit':
      return 'กำลังขนส่ง';
    case 'completed':
      return 'เสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิก';
    default:
      return 'ไม่ทราบสถานะ';
  }
};

const getPriorityColor = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityText = (priority: TransferRequestPriority): string => {
  switch (priority) {
    case 'low':
      return 'ต่ำ';
    case 'medium':
      return 'ปกติ';
    case 'high':
      return 'สูง';
    case 'urgent':
      return 'ด่วน';
    default:
      return 'ไม่ระบุ';
  }
};

export const Transfer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Build filters for the hook
  const filters: TransferRequestFilters = {
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TransferRequestStatus) : undefined,
    priority: priorityFilter !== 'all' ? (priorityFilter as TransferRequestPriority) : undefined,
  };

  const {
    requests: filteredRequests,
    loading,
    error,
    pagination,
    applyFilters,
    loadMore,
    refresh,
  } = useTransferRequests(filters);

  // Apply filters when search or filter values change
  React.useEffect(() => {
    applyFilters(filters);
  }, [searchTerm, statusFilter, priorityFilter]);

  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowDetailDialog(true);
  };

  const handleRequestCreated = () => {
    refresh();
  };

  const handleRequestUpdated = () => {
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ระบบโอนย้ายสินค้า</h2>
          <p className="text-muted-foreground">
            จัดการคำขอโอนย้ายสินค้าระหว่างคลังสินค้า
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            สร้างคำขอโอนย้าย
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาเลขที่คำขอ, คลังสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                <SelectItem value="in_transit">กำลังขนส่ง</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ลำดับความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">ปกติ</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="urgent">ด่วน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายการคำขอโอนย้าย ({pagination.total})
          </CardTitle>
          <CardDescription>
            รายการคำขอโอนย้ายสินค้าทั้งหมดในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                เกิดข้อผิดพลาด
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่
              </Button>
            </div>
          )}
          
          {!error && filteredRequests.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่พบคำขอโอนย้าย
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'ไม่พบคำขอโอนย้ายที่ตรงกับเงื่อนไขการค้นหา'
                  : 'ยังไม่มีคำขอโอนย้ายในระบบ'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                สร้างคำขอโอนย้ายแรก
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่คำขอ</TableHead>
                    <TableHead>จาก</TableHead>
                    <TableHead>ไปยัง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ลำดับความสำคัญ</TableHead>
                    <TableHead>ยอดรวม</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.request_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.from_warehouse?.name}</p>
                          <p className="text-sm text-gray-500">{request.from_warehouse?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.to_warehouse?.name}</p>
                          <p className="text-sm text-gray-500">{request.to_warehouse?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {getPriorityText(request.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.total_amount?.toLocaleString('th-TH', {
                          style: 'currency',
                          currency: 'THB',
                        })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: th })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(request.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">กำลังโหลด...</span>
                </div>
              )}
              
              {/* Load more button */}
              {pagination.hasMore && !loading && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore}>
                    โหลดเพิ่มเติม
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Create Transfer Request Dialog */}
      <CreateTransferRequest
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRequestCreated={handleRequestCreated}
      />
      
      {/* Transfer Request Detail Dialog */}
      <TransferRequestDetail
        requestId={selectedRequestId}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onRequestUpdated={handleRequestUpdated}
      />
    </div>
  );
};

export default Transfer;