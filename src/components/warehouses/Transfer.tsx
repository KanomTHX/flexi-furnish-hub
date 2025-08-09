import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Loader2,
  X,
  Plus
} from 'lucide-react';
import { SerialNumber, StockTransfer, Warehouse } from '@/types/warehouse';
import { transferService } from '@/lib/transferService';
import { useToast } from '@/hooks/use-toast';

interface TransferProps {
  warehouses: Warehouse[];
  currentWarehouseId: string;
  onTransferComplete?: (transfer: StockTransfer) => void;
}

interface SelectedSN {
  id: string;
  serialNumber: string;
  productName: string;
  productCode: string;
  unitCost: number;
}

export function Transfer({ warehouses, currentWarehouseId, onTransferComplete }: TransferProps) {
  const [sourceWarehouseId, setSourceWarehouseId] = useState(currentWarehouseId);
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<SerialNumber[]>([]);
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState<SelectedSN[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSN, setIsLoadingSN] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSNDialog, setShowSNDialog] = useState(false);
  const { toast } = useToast();

  // โหลด Serial Numbers ที่พร้อมโอน
  const loadAvailableSerialNumbers = async () => {
    if (!sourceWarehouseId) return;
    
    setIsLoadingSN(true);
    try {
      const serialNumbers = await transferService.getAvailableSerialNumbers(
        sourceWarehouseId, 
        searchTerm || undefined
      );
      setAvailableSerialNumbers(serialNumbers);
    } catch (error) {
      console.error('Error loading serial numbers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการ Serial Number ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSN(false);
    }
  };

  useEffect(() => {
    loadAvailableSerialNumbers();
  }, [sourceWarehouseId, searchTerm]);

  // เลือก/ยกเลิกเลือก Serial Number
  const handleSelectSN = (sn: SerialNumber, selected: boolean) => {
    if (selected) {
      const newSN: SelectedSN = {
        id: sn.id,
        serialNumber: sn.serialNumber,
        productName: sn.product?.name || '',
        productCode: sn.product?.code || '',
        unitCost: sn.unitCost
      };
      setSelectedSerialNumbers(prev => [...prev, newSN]);
    } else {
      setSelectedSerialNumbers(prev => prev.filter(item => item.id !== sn.id));
    }
  };

  // เลือกทั้งหมด/ยกเลิกทั้งหมด
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const newSNs: SelectedSN[] = availableSerialNumbers
        .filter(sn => !selectedSerialNumbers.some(selected => selected.id === sn.id))
        .map(sn => ({
          id: sn.id,
          serialNumber: sn.serialNumber,
          productName: sn.product?.name || '',
          productCode: sn.product?.code || '',
          unitCost: sn.unitCost
        }));
      setSelectedSerialNumbers(prev => [...prev, ...newSNs]);
    } else {
      setSelectedSerialNumbers([]);
    }
  };

  // ลบ Serial Number ที่เลือก
  const handleRemoveSelected = (snId: string) => {
    setSelectedSerialNumbers(prev => prev.filter(item => item.id !== snId));
  };

  // ยืนยันการโอน
  const handleConfirmTransfer = async () => {
    if (!targetWarehouseId || selectedSerialNumbers.length === 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกคลังปลายทางและ Serial Number ที่ต้องการโอน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const transfer = await transferService.initiateTransfer({
        sourceWarehouseId,
        targetWarehouseId,
        serialNumbers: selectedSerialNumbers.map(sn => sn.id),
        notes: notes || undefined
      }, 'current-user'); // TODO: ใช้ user ID จริง

      toast({
        title: "สร้างการโอนสำเร็จ",
        description: `สร้างการโอน ${transfer.transferNumber} เรียบร้อยแล้ว`,
      });

      // รีเซ็ตฟอร์ม
      setTargetWarehouseId('');
      setSelectedSerialNumbers([]);
      setNotes('');
      setShowConfirmDialog(false);

      // โหลดข้อมูลใหม่
      loadAvailableSerialNumbers();

      // เรียก callback
      onTransferComplete?.(transfer);

    } catch (error) {
      console.error('Error creating transfer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถสร้างการโอนได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sourceWarehouse = warehouses.find(w => w.id === sourceWarehouseId);
  const targetWarehouse = warehouses.find(w => w.id === targetWarehouseId);
  const totalValue = selectedSerialNumbers.reduce((sum, sn) => sum + sn.unitCost, 0);

  return (
    <div className="space-y-6">
      {/* ส่วนเลือกคลัง */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            โอนสินค้าระหว่างคลัง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* คลังต้นทาง */}
            <div className="space-y-2">
              <Label>คลังต้นทาง</Label>
              <Select value={sourceWarehouseId} onValueChange={setSourceWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังต้นทาง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* คลังปลายทาง */}
            <div className="space-y-2">
              <Label>คลังปลายทาง</Label>
              <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังปลายทาง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter(w => w.id !== sourceWarehouseId)
                    .map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* แสดงเส้นทางการโอน */}
          {sourceWarehouse && targetWarehouse && (
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-medium">{sourceWarehouse.name}</div>
                  <div className="text-sm text-muted-foreground">{sourceWarehouse.code}</div>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="font-medium">{targetWarehouse.name}</div>
                  <div className="text-sm text-muted-foreground">{targetWarehouse.code}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ส่วนเลือก Serial Numbers */}
      {sourceWarehouseId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                เลือกสินค้าที่ต้องการโอน
              </CardTitle>
              <Button 
                variant="outline" 
                onClick={() => setShowSNDialog(true)}
                disabled={!sourceWarehouseId}
              >
                <Plus className="h-4 w-4 mr-2" />
                เลือกสินค้า
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSerialNumbers.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    เลือกแล้ว {selectedSerialNumbers.length} รายการ
                  </div>
                  <div className="text-sm font-medium">
                    มูลค่ารวม: ฿{totalValue.toLocaleString()}
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-right">ราคา</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSerialNumbers.map((sn) => (
                        <TableRow key={sn.id}>
                          <TableCell className="font-mono text-sm">
                            {sn.serialNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sn.productName}</div>
                              <div className="text-sm text-muted-foreground">{sn.productCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{sn.unitCost.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSelected(sn.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่ได้เลือกสินค้าที่ต้องการโอน</p>
                <p className="text-sm">คลิกปุ่ม "เลือกสินค้า" เพื่อเริ่มต้น</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ส่วนหมายเหตุและปุ่มดำเนินการ */}
      {selectedSerialNumbers.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                placeholder="ระบุหมายเหตุเพิ่มเติม..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSerialNumbers([]);
                  setNotes('');
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!targetWarehouseId || selectedSerialNumbers.length === 0}
              >
                <Truck className="h-4 w-4 mr-2" />
                สร้างการโอน
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog เลือก Serial Numbers */}
      <Dialog open={showSNDialog} onOpenChange={setShowSNDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>เลือกสินค้าที่ต้องการโอน</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* ค้นหา */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Serial Number, ชื่อสินค้า, รหัสสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* ตัวเลือกเลือกทั้งหมด */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={availableSerialNumbers.length > 0 && 
                  availableSerialNumbers.every(sn => 
                    selectedSerialNumbers.some(selected => selected.id === sn.id)
                  )}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">เลือกทั้งหมด</Label>
              <span className="text-sm text-muted-foreground">
                ({availableSerialNumbers.length} รายการ)
              </span>
            </div>

            {/* รายการ Serial Numbers */}
            <ScrollArea className="h-[400px]">
              {isLoadingSN ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">กำลังโหลด...</span>
                </div>
              ) : availableSerialNumbers.length > 0 ? (
                <div className="space-y-2">
                  {availableSerialNumbers.map((sn) => {
                    const isSelected = selectedSerialNumbers.some(selected => selected.id === sn.id);
                    return (
                      <div
                        key={sn.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => handleSelectSN(sn, !isSelected)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-mono text-sm font-medium">
                                  {sn.serialNumber}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {sn.product?.name} ({sn.product?.code})
                                </div>
                                {sn.product?.brand && (
                                  <div className="text-xs text-muted-foreground">
                                    {sn.product.brand} {sn.product.model}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  ฿{sn.unitCost.toLocaleString()}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {sn.status === 'available' ? 'พร้อมโอน' : sn.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบสินค้าที่พร้อมโอน</p>
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSNDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยืนยันการโอน */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              ยืนยันการโอนสินค้า
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                คุณต้องการโอนสินค้า {selectedSerialNumbers.length} รายการ 
                จาก {sourceWarehouse?.name} ไปยัง {targetWarehouse?.name} ใช่หรือไม่?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>จำนวนรายการ:</span>
                <span className="font-medium">{selectedSerialNumbers.length} รายการ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>มูลค่ารวม:</span>
                <span className="font-medium">฿{totalValue.toLocaleString()}</span>
              </div>
            </div>

            {notes && (
              <div className="space-y-2">
                <Label>หมายเหตุ:</Label>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {notes}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConfirmTransfer}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ยืนยันการโอน
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}