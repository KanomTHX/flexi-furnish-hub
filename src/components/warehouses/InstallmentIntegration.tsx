// ===================================================================
// INSTALLMENT INTEGRATION COMPONENT
// คอมโพเนนต์สำหรับจัดการการเชื่อมโยงระบบเช่าซื้อ
// ===================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ShoppingCart, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  AlertTriangle,
  FileText,
  History
} from 'lucide-react';
import { useInstallmentIntegration, useInstallmentSNs, useInstallmentSNHistory } from '@/hooks/useInstallmentIntegration';
import { InstallmentStockItem, ContractStockData } from '@/services/installmentIntegrationService';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface InstallmentIntegrationProps {
  className?: string;
}

export function InstallmentIntegration({ className }: InstallmentIntegrationProps) {
  const [activeTab, setActiveTab] = useState('reserve');
  const [contractId, setContractId] = useState('');
  const [searchSN, setSearchSN] = useState('');
  const [contractData, setContractData] = useState<Partial<ContractStockData>>({
    contractNumber: '',
    customerId: '',
    branchId: '',
    items: []
  });
  const [newItem, setNewItem] = useState<Partial<InstallmentStockItem>>({
    productId: '',
    quantity: 1,
    warehouseId: '',
    unitPrice: 0
  });

  const {
    isLoading,
    error,
    reservations,
    reserveStock,
    confirmSale,
    releaseStock,
    trackSNs,
    getSNHistory
  } = useInstallmentIntegration();

  // Handle stock reservation
  const handleReserveStock = async () => {
    if (!contractData.contractNumber || !contractData.items?.length) {
      return;
    }

    try {
      const fullContractData: ContractStockData = {
        contractId: contractData.contractId || crypto.randomUUID(),
        contractNumber: contractData.contractNumber,
        customerId: contractData.customerId || '',
        branchId: contractData.branchId || '',
        items: contractData.items as InstallmentStockItem[]
      };

      await reserveStock(fullContractData);
      
      // Reset form
      setContractData({
        contractNumber: '',
        customerId: '',
        branchId: '',
        items: []
      });
    } catch (error) {
      console.error('Error reserving stock:', error);
    }
  };

  // Handle sale confirmation
  const handleConfirmSale = async () => {
    if (!contractId) return;

    try {
      await confirmSale(contractId, {
        soldTo: 'ลูกค้าผ่านสัญญาเช่าซื้อ',
        saleDate: new Date(),
        receiptNumber: `RECEIPT-${Date.now()}`
      });
      setContractId('');
    } catch (error) {
      console.error('Error confirming sale:', error);
    }
  };

  // Handle stock release
  const handleReleaseStock = async () => {
    if (!contractId) return;

    try {
      await releaseStock(contractId, 'ยกเลิกสัญญาผ่านระบบ');
      setContractId('');
    } catch (error) {
      console.error('Error releasing stock:', error);
    }
  };

  // Add item to contract
  const handleAddItem = () => {
    if (!newItem.productId || !newItem.warehouseId || !newItem.quantity) {
      return;
    }

    const item: InstallmentStockItem = {
      productId: newItem.productId,
      quantity: newItem.quantity,
      warehouseId: newItem.warehouseId,
      unitPrice: newItem.unitPrice || 0
    };

    setContractData(prev => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));

    // Reset new item form
    setNewItem({
      productId: '',
      quantity: 1,
      warehouseId: '',
      unitPrice: 0
    });
  };

  // Remove item from contract
  const handleRemoveItem = (index: number) => {
    setContractData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            การเชื่อมโยงระบบเช่าซื้อ
          </CardTitle>
          <CardDescription>
            จัดการการจองสต็อก ยืนยันการขาย และปลดปล่อยสต็อกสำหรับระบบเช่าซื้อ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reserve">จองสต็อก</TabsTrigger>
              <TabsTrigger value="confirm">ยืนยันการขาย</TabsTrigger>
              <TabsTrigger value="release">ปลดปล่อยสต็อก</TabsTrigger>
              <TabsTrigger value="track">ติดตาม SN</TabsTrigger>
            </TabsList>

            {/* Stock Reservation Tab */}
            <TabsContent value="reserve" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contractNumber">เลขที่สัญญา</Label>
                    <Input
                      id="contractNumber"
                      value={contractData.contractNumber || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        contractNumber: e.target.value
                      }))}
                      placeholder="CONTRACT-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerId">รหัสลูกค้า</Label>
                    <Input
                      id="customerId"
                      value={contractData.customerId || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        customerId: e.target.value
                      }))}
                      placeholder="CUST-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchId">รหัสสาขา</Label>
                    <Input
                      id="branchId"
                      value={contractData.branchId || ''}
                      onChange={(e) => setContractData(prev => ({
                        ...prev,
                        branchId: e.target.value
                      }))}
                      placeholder="BRANCH-001"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">เพิ่มสินค้า</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="productId">รหัสสินค้า</Label>
                      <Input
                        id="productId"
                        value={newItem.productId || ''}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          productId: e.target.value
                        }))}
                        placeholder="PROD-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warehouseId">รหัสคลัง</Label>
                      <Input
                        id="warehouseId"
                        value={newItem.warehouseId || ''}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          warehouseId: e.target.value
                        }))}
                        placeholder="WH-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">จำนวน</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newItem.quantity || 1}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitPrice">ราคาต่อหน่วย</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.unitPrice || 0}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          unitPrice: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddItem} size="sm">
                    เพิ่มสินค้า
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {contractData.items && contractData.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">รายการสินค้าที่จะจอง</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัสสินค้า</TableHead>
                        <TableHead>คลัง</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>ราคา</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productId}</TableCell>
                          <TableCell>{item.warehouseId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button 
                onClick={handleReserveStock} 
                disabled={isLoading || !contractData.contractNumber || !contractData.items?.length}
                className="w-full"
              >
                {isLoading ? 'กำลังจองสต็อก...' : 'จองสต็อกสำหรับสัญญา'}
              </Button>
            </TabsContent>

            {/* Sale Confirmation Tab */}
            <TabsContent value="confirm" className="space-y-4">
              <div>
                <Label htmlFor="confirmContractId">เลขที่สัญญาที่ต้องการยืนยันการขาย</Label>
                <Input
                  id="confirmContractId"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder="contract-123"
                />
              </div>
              <Button 
                onClick={handleConfirmSale} 
                disabled={isLoading || !contractId}
                className="w-full"
              >
                {isLoading ? 'กำลังยืนยัน...' : 'ยืนยันการขาย'}
              </Button>
            </TabsContent>

            {/* Stock Release Tab */}
            <TabsContent value="release" className="space-y-4">
              <div>
                <Label htmlFor="releaseContractId">เลขที่สัญญาที่ต้องการปลดปล่อยสต็อก</Label>
                <Input
                  id="releaseContractId"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder="contract-123"
                />
              </div>
              <Button 
                onClick={handleReleaseStock} 
                disabled={isLoading || !contractId}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? 'กำลังปลดปล่อย...' : 'ปลดปล่อยสต็อก'}
              </Button>
            </TabsContent>

            {/* SN Tracking Tab */}
            <TabsContent value="track" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trackContractId">เลขที่สัญญา</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trackContractId"
                      value={contractId}
                      onChange={(e) => setContractId(e.target.value)}
                      placeholder="contract-123"
                    />
                    <SNTrackingDialog contractId={contractId} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="searchSN">Serial Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="searchSN"
                      value={searchSN}
                      onChange={(e) => setSearchSN(e.target.value)}
                      placeholder="SN001"
                    />
                    <SNHistoryDialog serialNumber={searchSN} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Current Reservations */}
          {reservations.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h4 className="font-medium mb-2">การจองล่าสุด</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((reservation) => (
                  <Card key={reservation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {reservation.status === 'reserved' ? 'จองแล้ว' : reservation.status}
                        </Badge>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div><strong>สัญญา:</strong> {reservation.contractNumber}</div>
                        <div><strong>SN:</strong> {reservation.serialNumber}</div>
                        <div><strong>สินค้า:</strong> {reservation.productId}</div>
                        <div><strong>คลัง:</strong> {reservation.warehouseId}</div>
                        <div><strong>จองเมื่อ:</strong> {format(reservation.reservedAt, 'dd/MM/yyyy HH:mm', { locale: th })}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// SN Tracking Dialog Component
function SNTrackingDialog({ contractId }: { contractId: string }) {
  const { data: sns, isLoading, error } = useInstallmentSNs(contractId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" disabled={!contractId}>
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>ติดตาม Serial Numbers</DialogTitle>
          <DialogDescription>
            Serial Numbers ที่เกี่ยวข้องกับสัญญา {contractId}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && <div>กำลังโหลด...</div>}
        {error && <Alert><AlertDescription>เกิดข้อผิดพลาด: {error.message}</AlertDescription></Alert>}
        
        {sns && sns.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>คลัง</TableHead>
                <TableHead>ขายเมื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sns.map((sn: any) => (
                <TableRow key={sn.id}>
                  <TableCell className="font-mono">{sn.serial_number}</TableCell>
                  <TableCell>
                    <Badge variant={sn.status === 'sold' ? 'default' : 'secondary'}>
                      {sn.status === 'sold' ? 'ขายแล้ว' : 
                       sn.status === 'reserved' ? 'จองแล้ว' : sn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sn.product_id}</TableCell>
                  <TableCell>{sn.warehouse_id}</TableCell>
                  <TableCell>
                    {sn.sold_at ? format(new Date(sn.sold_at), 'dd/MM/yyyy HH:mm', { locale: th }) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {sns && sns.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            ไม่พบ Serial Numbers สำหรับสัญญานี้
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// SN History Dialog Component
function SNHistoryDialog({ serialNumber }: { serialNumber: string }) {
  const { data: history, isLoading, error } = useInstallmentSNHistory(serialNumber);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" disabled={!serialNumber}>
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>ประวัติการเคลื่อนไหว</DialogTitle>
          <DialogDescription>
            ประวัติการเคลื่อนไหวของ Serial Number {serialNumber}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && <div>กำลังโหลด...</div>}
        {error && <Alert><AlertDescription>เกิดข้อผิดพลาด: {error.message}</AlertDescription></Alert>}
        
        {history && history.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((movement: any) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: th })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {movement.movement_type === 'reserve' ? 'จอง' :
                       movement.movement_type === 'withdraw' ? 'เบิก' :
                       movement.movement_type === 'release' ? 'ปลดปล่อย' :
                       movement.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.reference_number || '-'}</TableCell>
                  <TableCell>{movement.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {history && history.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            ไม่พบประวัติการเคลื่อนไหวสำหรับ Serial Number นี้
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InstallmentIntegration;