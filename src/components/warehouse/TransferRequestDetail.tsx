import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  TransferRequest, 
  TransferRequestStatus, 
  TransferRequestPriority 
} from '../../types/transfer';
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
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface TransferRequestDetailProps {
  transferRequest: TransferRequest;
  warehouses: Array<{ id: string; name: string; code: string }>;
  onStatusUpdate?: (id: string, status: TransferRequestStatus) => void;
  onClose?: () => void;
}

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
      return 'bg-red-100 text-red-800 border-red-200';
    case 'rejected':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

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

const getPriorityIcon = (priority: TransferRequestPriority) => {
  switch (priority) {
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <Clock className="h-4 w-4" />;
    case 'low':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
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

export function TransferRequestDetail({ 
  transferRequest, 
  warehouses, 
  onStatusUpdate,
  onClose 
}: TransferRequestDetailProps) {
  const sourceWarehouse = warehouses.find(w => w.id === transferRequest.sourceWarehouseId);
  const destinationWarehouse = warehouses.find(w => w.id === transferRequest.destinationWarehouseId);

  const handleStatusUpdate = (newStatus: TransferRequestStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(transferRequest.id, newStatus);
    }
  };

  const canApprove = transferRequest.status === 'pending';
  const canReject = transferRequest.status === 'pending';
  const canStartTransit = transferRequest.status === 'approved';
  const canComplete = transferRequest.status === 'in_transit';
  const canCancel = ['pending', 'approved'].includes(transferRequest.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{transferRequest.requestNumber}</h2>
          <p className="text-muted-foreground">รายละเอียดคำขอโอนย้ายสินค้า</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(transferRequest.status)} flex items-center gap-1`}>
            {getStatusIcon(transferRequest.status)}
            {getStatusText(transferRequest.status)}
          </Badge>
          <Badge className={`${getPriorityColor(transferRequest.priority)} flex items-center gap-1`}>
            {getPriorityIcon(transferRequest.priority)}
            {getPriorityText(transferRequest.priority)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ข้อมูลพื้นฐาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">คลังสินค้าต้นทาง</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{sourceWarehouse?.name || 'ไม่พบข้อมูล'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">คลังสินค้าปลายทาง</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{destinationWarehouse?.name || 'ไม่พบข้อมูล'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">วันที่สร้างคำขอ</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(transferRequest.requestedDate, 'dd MMMM yyyy', { locale: th })}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">วันที่ต้องการ</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(transferRequest.requiredDate, 'dd MMMM yyyy', { locale: th })}</span>
                  </div>
                </div>
              </div>
              {transferRequest.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">หมายเหตุ</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{transferRequest.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                รายการสินค้า ({transferRequest.items.length} รายการ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transferRequest.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">รหัส: {item.productCode}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>จำนวนที่ขอ: <strong>{item.requestedQuantity.toLocaleString()} {item.unit}</strong></span>
                          <span>จำนวนที่มี: <strong>{item.availableQuantity.toLocaleString()} {item.unit}</strong></span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            หมายเหตุ: {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant={item.requestedQuantity <= item.availableQuantity ? 'default' : 'destructive'}>
                        {item.requestedQuantity <= item.availableQuantity ? 'เพียงพอ' : 'ไม่เพียงพอ'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Timeline */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canApprove && (
                <Button 
                  onClick={() => handleStatusUpdate('approved')}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  อนุมัติคำขอ
                </Button>
              )}
              {canReject && (
                <Button 
                  onClick={() => handleStatusUpdate('rejected')}
                  className="w-full"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  ปฏิเสธคำขอ
                </Button>
              )}
              {canStartTransit && (
                <Button 
                  onClick={() => handleStatusUpdate('in_transit')}
                  className="w-full"
                  variant="default"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  เริ่มขนส่ง
                </Button>
              )}
              {canComplete && (
                <Button 
                  onClick={() => handleStatusUpdate('completed')}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  เสร็จสิ้น
                </Button>
              )}
              {canCancel && (
                <Button 
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="w-full"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  ยกเลิกคำขอ
                </Button>
              )}
              <Separator />
              {onClose && (
                <Button onClick={onClose} variant="outline" className="w-full">
                  ปิด
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">สร้างโดย</label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{transferRequest.createdBy}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">วันที่สร้าง</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{format(transferRequest.createdAt, 'dd/MM/yyyy HH:mm', { locale: th })}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">อัปเดตล่าสุด</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{format(transferRequest.updatedAt, 'dd/MM/yyyy HH:mm', { locale: th })}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">อัปเดตโดย</label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{transferRequest.updatedBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TransferRequestDetail;