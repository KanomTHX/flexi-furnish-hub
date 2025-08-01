import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseTransfer, TransferFilter, Warehouse } from '@/types/warehouse';
import { 
  getTransferStatusText, 
  getPriorityText,
  exportTransfersToCSV
} from '@/utils/warehouseHelpers';
import { 
  Search, 
  Download, 
  Eye, 
  Truck,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface TransferManagementProps {
  transfers: WarehouseTransfer[];
  warehouses: Warehouse[];
  filter: TransferFilter;
  onFilterChange: (filter: Partial<TransferFilter>) => void;
  onExport: () => void;
  onApproveTransfer?: (transferId: string) => void;
  onShipTransfer?: (transferId: string) => void;
  onReceiveTransfer?: (transferId: string) => void;
  onCancelTransfer?: (transferId: string) => void;
}

export function TransferManagement({
  transfers,
  warehouses,
  filter,
  onFilterChange,
  onExport,
  onApproveTransfer,
  onShipTransfer,
  onReceiveTransfer,
  onCancelTransfer
}: TransferManagementProps) {
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: WarehouseTransfer['status']) => {
    const variants = {
      draft: 'outline',
      pending: 'secondary',
      in_transit: 'default',
      delivered: 'default',
      cancelled: 'destructive'
    } as const;

    const icons = {
      draft: <AlertCircle className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />,
      in_transit: <Truck className="w-3 h-3 mr-1" />,
      delivered: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <XCircle className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {icons[status]}
        {getTransferStatusText(status)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: WarehouseTransfer['priority']) => {
    const variants = {
      low: 'outline',
      normal: 'secondary',
      high: 'destructive',
      urgent: 'destructive'
    } as const;

    return (
      <Badge variant={variants[priority]} className="text-xs">
        {getPriorityText(priority)}
      </Badge>
    );
  };

  const handleViewDetails = (transfer: WarehouseTransfer) => {
    setSelectedTransfer(transfer);
    setDetailDialogOpen(true);
  };

  const getActionButtons = (transfer: WarehouseTransfer) => {
    const buttons = [];

    if (transfer.status === 'draft' && onApproveTransfer) {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          onClick={() => onApproveTransfer(transfer.id)}
          className="bg-green-600 hover:bg-green-700"
        >
          อนุมัติ
        </Button>
      );
    }

    if (transfer.status === 'pending' && onShipTransfer) {
      buttons.push(
        <Button
          key="ship"
          size="sm"
          onClick={() => onShipTransfer(transfer.id)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          ส่งสินค้า
        </Button>
      );
    }

    if (transfer.status === 'in_transit' && onReceiveTransfer) {
      buttons.push(
        <Button
          key="receive"
          size="sm"
          onClick={() => onReceiveTransfer(transfer.id)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          รับสินค้า
        </Button>
      );
    }

    if ((transfer.status === 'draft' || transfer.status === 'pending') && onCancelTransfer) {
      buttons.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => onCancelTransfer(transfer.id)}
        >
          ยกเลิก
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              การโอนย้ายสินค้า
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ตัวกรอง */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* ค้นหา */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลขที่โอนย้าย, เหตุผล..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* สถานะ */}
            <Select 
              value={filter.status || 'all'} 
              onValueChange={(value) => onFilterChange({ status: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="draft">ร่าง</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="in_transit">กำลังขนส่ง</SelectItem>
                <SelectItem value="delivered">ส่งแล้ว</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>

            {/* ความสำคัญ */}
            <Select 
              value={filter.priority || 'all'} 
              onValueChange={(value) => onFilterChange({ priority: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="normal">ปกติ</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="urgent">ด่วนมาก</SelectItem>
              </SelectContent>
            </Select>

            {/* คลังต้นทาง */}
            <Select 
              value={filter.fromWarehouse || 'all'} 
              onValueChange={(value) => onFilterChange({ fromWarehouse: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="คลังต้นทาง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคลัง</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* วันที่ */}
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="จากวันที่"
                value={filter.dateFrom || ''}
                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* ตารางการโอนย้าย */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่โอนย้าย</TableHead>
                  <TableHead>เส้นทาง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความสำคัญ</TableHead>
                  <TableHead className="text-right">รายการ</TableHead>
                  <TableHead className="text-right">มูลค่า</TableHead>
                  <TableHead>วันที่ขอ</TableHead>
                  <TableHead>วันที่กำหนด</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.transferNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {transfer.createdBy}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          <div className="font-medium">{transfer.fromWarehouse.name}</div>
                          <div className="text-xs text-muted-foreground">{transfer.fromWarehouse.code}</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{transfer.toWarehouse.name}</div>
                          <div className="text-xs text-muted-foreground">{transfer.toWarehouse.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transfer.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(transfer.priority)}
                    </TableCell>
                    <TableCell className="text-right">
                      {transfer.totalItems}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transfer.totalValue)}
                    </TableCell>
                    <TableCell>
                      {new Date(transfer.requestedDate).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      {transfer.scheduledDate 
                        ? new Date(transfer.scheduledDate).toLocaleDateString('th-TH')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(transfer)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {getActionButtons(transfer)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {transfers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบการโอนย้ายที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog รายละเอียดการโอนย้าย */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดการโอนย้าย {selectedTransfer?.transferNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">ข้อมูลการโอนย้าย</TabsTrigger>
                <TabsTrigger value="items">รายการสินค้า</TabsTrigger>
                <TabsTrigger value="tracking">ติดตามสถานะ</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        ข้อมูลการโอนย้าย
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">เลขที่โอนย้าย</label>
                          <p className="font-mono">{selectedTransfer.transferNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                          <div className="mt-1">
                            {getStatusBadge(selectedTransfer.status)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">ความสำคัญ</label>
                          <div className="mt-1">
                            {getPriorityBadge(selectedTransfer.priority)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">จำนวนรายการ</label>
                          <p>{selectedTransfer.totalItems} รายการ</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">มูลค่ารวม</label>
                        <p className="text-lg font-bold">{formatCurrency(selectedTransfer.totalValue)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">เหตุผล</label>
                        <p>{selectedTransfer.reason}</p>
                      </div>
                      {selectedTransfer.notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">หมายเหตุ</label>
                          <p>{selectedTransfer.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        ข้อมูลวันที่
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">วันที่ขอโอนย้าย</label>
                        <p>{new Date(selectedTransfer.requestedDate).toLocaleDateString('th-TH')}</p>
                      </div>
                      {selectedTransfer.scheduledDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันที่กำหนดส่ง</label>
                          <p>{new Date(selectedTransfer.scheduledDate).toLocaleDateString('th-TH')}</p>
                        </div>
                      )}
                      {selectedTransfer.shippedDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันที่ส่งจริง</label>
                          <p>{new Date(selectedTransfer.shippedDate).toLocaleDateString('th-TH')}</p>
                        </div>
                      )}
                      {selectedTransfer.deliveredDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันที่รับสินค้า</label>
                          <p>{new Date(selectedTransfer.deliveredDate).toLocaleDateString('th-TH')}</p>
                        </div>
                      )}
                      {selectedTransfer.estimatedDelivery && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">กำหนดส่งถึง</label>
                          <p>{new Date(selectedTransfer.estimatedDelivery).toLocaleDateString('th-TH')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* ข้อมูลคลัง */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">คลังต้นทาง</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{selectedTransfer.fromWarehouse.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedTransfer.fromWarehouse.code}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">คลังปลายทาง</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{selectedTransfer.toWarehouse.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedTransfer.toWarehouse.code}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ข้อมูลการขนส่ง */}
                {selectedTransfer.carrier && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        ข้อมูลการขนส่ง
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">บริษัทขนส่ง</label>
                          <p>{selectedTransfer.carrier.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">เลขติดตาม</label>
                          <p className="font-mono">{selectedTransfer.carrier.trackingNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">ติดต่อ</label>
                          <p>{selectedTransfer.carrier.contact}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead className="text-right">ขอโอน</TableHead>
                        <TableHead className="text-right">ส่งแล้ว</TableHead>
                        <TableHead className="text-right">รับแล้ว</TableHead>
                        <TableHead className="text-right">ต้นทุน/หน่วย</TableHead>
                        <TableHead className="text-right">รวม</TableHead>
                        <TableHead>สภาพ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransfer.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.product.sku}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.product.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.requestedQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.shippedQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.receivedQuantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.totalCost)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.condition === 'new' ? 'ใหม่' :
                               item.condition === 'used' ? 'ใช้แล้ว' :
                               item.condition === 'damaged' ? 'ชำรุด' : 'ปรับปรุงแล้ว'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      selectedTransfer.status !== 'draft' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">สร้างคำขอโอนย้าย</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedTransfer.createdAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>

                  {selectedTransfer.approvedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="font-medium">อนุมัติการโอนย้าย</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(selectedTransfer.approvedAt).toLocaleString('th-TH')}
                          {selectedTransfer.approvedBy && ` โดย ${selectedTransfer.approvedBy}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTransfer.shippedDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="font-medium">ส่งสินค้าแล้ว</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(selectedTransfer.shippedDate).toLocaleString('th-TH')}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTransfer.deliveredDate && (
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="font-medium">รับสินค้าแล้ว</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(selectedTransfer.deliveredDate).toLocaleString('th-TH')}
                          {selectedTransfer.receivedBy && ` โดย ${selectedTransfer.receivedBy}`}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      selectedTransfer.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">เสร็จสิ้น</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedTransfer.status === 'delivered' ? 'การโอนย้ายเสร็จสมบูรณ์' : 'รอดำเนินการ'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}