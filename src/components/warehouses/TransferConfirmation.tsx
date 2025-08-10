import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  AlertCircle,
  Eye,
  Loader2,
  ArrowRight,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { StockTransfer, TransferStatus } from '@/types/warehouse';
import { transferService } from '@/lib/transferService';
import { notificationService } from '@/lib/notificationService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TransferConfirmationProps {
  warehouseId: string;
  onTransferConfirmed?: (transfer: StockTransfer) => void;
}

export function TransferConfirmation({ warehouseId, onTransferConfirmed }: TransferConfirmationProps) {
  const [pendingTransfers, setPendingTransfers] = useState<StockTransfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // โหลดรายการโอนที่รอยืนยัน
  const loadPendingTransfers = async () => {
    setIsLoading(true);
    try {
      const transfers = await transferService.getTransfers({
        targetWarehouseId: warehouseId,
        status: 'pending'
      });
      setPendingTransfers(transfers);
    } catch (error) {
      console.error('Error loading pending transfers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการโอนได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTransfers();
  }, [warehouseId]);

  // ยืนยันการรับสินค้า
  const handleConfirmTransfer = async () => {
    if (!selectedTransfer) return;

    setIsConfirming(true);
    try {
      const confirmedTransfer = await transferService.confirmTransfer({
        transferId: selectedTransfer.id,
        confirmedBy: user?.id || 'anonymous',
        notes: confirmationNotes || undefined
      });

      toast({
        title: "ยืนยันการรับสินค้าสำเร็จ",
        description: `ยืนยันการรับสินค้า ${confirmedTransfer.transferNumber} เรียบร้อยแล้ว`,
      });

      // ส่งการแจ้งเตือน
      await notificationService.notifyTransferConfirmed(
        confirmedTransfer.id,
        confirmedTransfer.sourceWarehouseId,
        confirmedTransfer.transferNumber,
        confirmedTransfer.targetWarehouse?.name || 'คลังปลายทาง',
        user?.name || 'ผู้ใช้'
      );

      // รีเซ็ตและโหลดข้อมูลใหม่
      setShowConfirmDialog(false);
      setSelectedTransfer(null);
      setConfirmationNotes('');
      loadPendingTransfers();

      // เรียก callback
      onTransferConfirmed?.(confirmedTransfer);

    } catch (error) {
      console.error('Error confirming transfer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถยืนยันการรับสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ยกเลิกการโอน
  const handleCancelTransfer = async () => {
    if (!selectedTransfer || !cancelReason.trim()) return;

    setIsConfirming(true);
    try {
      await transferService.cancelTransfer(
        selectedTransfer.id,
        cancelReason,
        user?.id || 'anonymous'
      );

      toast({
        title: "ยกเลิกการโอนสำเร็จ",
        description: `ยกเลิกการโอน ${selectedTransfer.transferNumber} เรียบร้อยแล้ว`,
      });

      // ส่งการแจ้งเตือน
      await notificationService.notifyTransferCancelled(
        selectedTransfer.id,
        selectedTransfer.sourceWarehouseId,
        selectedTransfer.targetWarehouseId,
        selectedTransfer.transferNumber,
        cancelReason
      );

      // รีเซ็ตและโหลดข้อมูลใหม่
      setShowCancelDialog(false);
      setSelectedTransfer(null);
      setCancelReason('');
      loadPendingTransfers();

    } catch (error) {
      console.error('Error cancelling transfer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถยกเลิกการโอนได้",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ดูรายละเอียดการโอน
  const handleViewDetails = async (transferId: string) => {
    try {
      const transfer = await transferService.getTransferById(transferId);
      setSelectedTransfer(transfer);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error loading transfer details:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายละเอียดการโอนได้",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: TransferStatus) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, text: 'รอยืนยัน' },
      in_transit: { variant: 'default' as const, icon: Truck, text: 'กำลังขนส่ง' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'เสร็จสิ้น' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, text: 'ยกเลิก' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            การโอนที่รอยืนยัน
            {pendingTransfers.length > 0 && (
              <Badge variant="secondary">{pendingTransfers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">กำลังโหลด...</span>
            </div>
          ) : pendingTransfers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่โอน</TableHead>
                    <TableHead>จาก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">รายการ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transfer.transferNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {transfer.initiatedByName || transfer.initiatedBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{transfer.sourceWarehouse?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {transfer.sourceWarehouse?.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transfer.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.totalItems} รายการ
                      </TableCell>
                      <TableCell>
                        {new Date(transfer.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(transfer.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowConfirmDialog(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            รับสินค้า
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowCancelDialog(true);
                            }}
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่มีการโอนที่รอยืนยัน</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog รายละเอียดการโอน */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดการโอน {selectedTransfer?.transferNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">ข้อมูลการโอน</TabsTrigger>
                <TabsTrigger value="items">รายการสินค้า</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        ข้อมูลการโอน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">เลขที่โอน</label>
                          <p className="font-mono">{selectedTransfer.transferNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
                          <div className="mt-1">
                            {getStatusBadge(selectedTransfer.status)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">จำนวนรายการ</label>
                          <p>{selectedTransfer.totalItems} รายการ</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">ผู้สร้าง</label>
                          <p>{selectedTransfer.initiatedByName || selectedTransfer.initiatedBy}</p>
                        </div>
                      </div>
                      {selectedTransfer.notes && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">หมายเหตุ</label>
                          <p className="text-sm bg-muted p-2 rounded">{selectedTransfer.notes}</p>
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
                        <label className="text-sm font-medium text-muted-foreground">วันที่สร้าง</label>
                        <p>{new Date(selectedTransfer.createdAt).toLocaleString('th-TH')}</p>
                      </div>
                      {selectedTransfer.confirmedAt && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">วันที่ยืนยัน</label>
                          <p>{new Date(selectedTransfer.confirmedAt).toLocaleString('th-TH')}</p>
                        </div>
                      )}
                      {selectedTransfer.confirmedByName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">ผู้ยืนยัน</label>
                          <p>{selectedTransfer.confirmedByName}</p>
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
                        <p className="font-medium">{selectedTransfer.sourceWarehouse?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedTransfer.sourceWarehouse?.code}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">คลังปลายทาง</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium">{selectedTransfer.targetWarehouse?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedTransfer.targetWarehouse?.code}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-right">ราคา</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransfer.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.serialNumber?.serialNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.serialNumber?.product?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.serialNumber?.product?.code}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{item.unitCost.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยืนยันการรับสินค้า */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ยืนยันการรับสินค้า
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                คุณต้องการยืนยันการรับสินค้าโอน {selectedTransfer?.transferNumber} 
                จำนวน {selectedTransfer?.totalItems} รายการ ใช่หรือไม่?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>หมายเหตุเพิ่มเติม (ไม่บังคับ)</Label>
              <Textarea
                placeholder="ระบุหมายเหตุเพิ่มเติม..."
                value={confirmationNotes}
                onChange={(e) => setConfirmationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isConfirming}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConfirmTransfer}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังยืนยัน...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ยืนยันการรับสินค้า
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยกเลิกการโอน */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              ยกเลิกการโอน
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                คุณต้องการยกเลิกการโอน {selectedTransfer?.transferNumber} ใช่หรือไม่?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>เหตุผลในการยกเลิก *</Label>
              <Textarea
                placeholder="ระบุเหตุผลในการยกเลิก..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isConfirming}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelTransfer}
              disabled={isConfirming || !cancelReason.trim()}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังยกเลิก...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  ยืนยันการยกเลิก
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}