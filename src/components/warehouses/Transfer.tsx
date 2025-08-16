import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpDown, 
  Search, 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  X,
  MapPin,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseService } from '@/services/warehouseService';
import type { SerialNumber, StockLevel, Warehouse } from '@/types/warehouse';

interface TransferProps {
  warehouses: Warehouse[];
  currentWarehouseId: string;
}

interface TransferItem {
  serialNumber: SerialNumber;
  quantity: number;
  notes?: string;
}

interface TransferForm {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: TransferItem[];
  reason: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledDate?: string;
  notes?: string;
  performedBy: string;
}

interface TransferRecord {
  id: string;
  transferNumber: string;
  sourceWarehouse: { id: string; name: string; code: string };
  targetWarehouse: { id: string; name: string; code: string };
  status: 'draft' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  totalItems: number;
  totalValue: number;
  reason: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export default function Transfer({ warehouses, currentWarehouseId }: TransferProps) {
  // State management
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  
  // Form state
  const [transferForm, setTransferForm] = useState<TransferForm>({
    sourceWarehouseId: currentWarehouseId || '',
    targetWarehouseId: '',
    items: [],
    reason: '',
    priority: 'normal',
    performedBy: 'current-user' // Should come from auth context
  });

  // Modal states
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showSerialNumberModal, setShowSerialNumberModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [showTransferPreview, setShowTransferPreview] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (transferForm.sourceWarehouseId) {
      loadStockLevels();
    }
    loadTransferHistory();
  }, [transferForm.sourceWarehouseId, searchTerm]);

  // Load stock levels for source warehouse
  const loadStockLevels = async () => {
    try {
      setLoading(true);
      const response = await WarehouseService.getStockLevels({
        warehouseId: transferForm.sourceWarehouseId,
        search: searchTerm,
        status: 'in_stock',
        limit: 50
      });
      setStockLevels(response.data);
    } catch (error) {
      console.error('Error loading stock levels:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสต็อกได้');
    } finally {
      setLoading(false);
    }
  };

  // Load serial numbers for selected product
  const loadSerialNumbers = async (productId: string) => {
    try {
      setLoading(true);
      const response = await WarehouseService.getSerialNumbers({
        warehouseId: transferForm.sourceWarehouseId,
        productId: productId,
        status: 'available',
        limit: 100
      });
      setSerialNumbers(response.data);
    } catch (error) {
      console.error('Error loading serial numbers:', error);
      toast.error('ไม่สามารถโหลดหมายเลขซีเรียลได้');
    } finally {
      setLoading(false);
    }
  };

  // Load transfer history
  const loadTransferHistory = async () => {
    try {
      const response = await WarehouseService.getStockMovements({
        movementType: 'transfer_out',
        limit: 20
      });
      
      // Transform movements to transfer records (simplified)
      const transfers: TransferRecord[] = response.data.map(movement => ({
        id: movement.id,
        transferNumber: movement.referenceNumber || `TRF-${movement.id.slice(-8)}`,
        sourceWarehouse: movement.warehouse || { id: '', name: 'Unknown', code: '' },
        targetWarehouse: { id: '', name: 'Target Warehouse', code: '' }, // Would need actual data
        status: 'delivered' as const,
        priority: 'normal' as const,
        totalItems: movement.quantity,
        totalValue: (movement.unitCost || 0) * movement.quantity,
        reason: movement.notes || 'Transfer',
        createdAt: movement.createdAt.toISOString(),
        createdBy: movement.performedBy,
        notes: movement.notes
      }));
      
      setTransferHistory(transfers);
    } catch (error) {
      console.error('Error loading transfer history:', error);
    }
  };

  // Handle product selection
  const handleProductSelect = async (stockLevel: StockLevel) => {
    setSelectedProduct(stockLevel);
    await loadSerialNumbers(stockLevel.productId);
    setShowSerialNumberModal(true);
  };

  // Handle serial number selection
  const handleSerialNumberSelect = (serialNumber: SerialNumber) => {
    const existingItem = transferForm.items.find(
      item => item.serialNumber.id === serialNumber.id
    );

    if (existingItem) {
      toast.warning('สินค้าชิ้นนี้ถูกเลือกแล้ว');
      return;
    }

    setTransferForm(prev => ({
      ...prev,
      items: [...prev.items, {
        serialNumber,
        quantity: 1,
        notes: ''
      }]
    }));

    toast.success(`เพิ่ม ${serialNumber.product?.name} (${serialNumber.serialNumber}) แล้ว`);
    setShowSerialNumberModal(false);
  };

  // Remove item from transfer list
  const handleRemoveItem = (serialNumberId: string) => {
    setTransferForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.serialNumber.id !== serialNumberId)
    }));
    toast.success('ลบรายการแล้ว');
  };

  // Handle form submission
  const handleSubmitTransfer = async () => {
    try {
      // Validation
      if (!transferForm.sourceWarehouseId) {
        toast.error('กรุณาเลือกคลังต้นทาง');
        return;
      }

      if (!transferForm.targetWarehouseId) {
        toast.error('กรุณาเลือกคลังปลายทาง');
        return;
      }

      if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
        toast.error('คลังต้นทางและปลายทางต้องไม่เหมือนกัน');
        return;
      }

      if (transferForm.items.length === 0) {
        toast.error('กรุณาเลือกสินค้าที่ต้องการโอนย้าย');
        return;
      }

      if (!transferForm.reason.trim()) {
        toast.error('กรุณาระบุเหตุผลการโอนย้าย');
        return;
      }

      setLoading(true);

      // Process transfer for each item
      for (const item of transferForm.items) {
        // Update serial number status to transferred
        await updateSerialNumberForTransfer(item.serialNumber.id, {
          targetWarehouseId: transferForm.targetWarehouseId,
          referenceNumber: `TRF-${Date.now()}`,
          notes: transferForm.notes
        });

        // Log transfer out movement
        await WarehouseService.logStockMovement({
          productId: item.serialNumber.productId,
          serialNumberId: item.serialNumber.id,
          warehouseId: transferForm.sourceWarehouseId,
          movementType: 'transfer_out',
          quantity: item.quantity,
          unitCost: item.serialNumber.unitCost,
          referenceType: 'transfer',
          referenceNumber: `TRF-${Date.now()}`,
          notes: `Transfer to ${warehouses.find(w => w.id === transferForm.targetWarehouseId)?.name} - ${transferForm.reason}`,
          performedBy: transferForm.performedBy
        });

        // Log transfer in movement
        await WarehouseService.logStockMovement({
          productId: item.serialNumber.productId,
          serialNumberId: item.serialNumber.id,
          warehouseId: transferForm.targetWarehouseId,
          movementType: 'transfer_in',
          quantity: item.quantity,
          unitCost: item.serialNumber.unitCost,
          referenceType: 'transfer',
          referenceNumber: `TRF-${Date.now()}`,
          notes: `Transfer from ${warehouses.find(w => w.id === transferForm.sourceWarehouseId)?.name} - ${transferForm.reason}`,
          performedBy: transferForm.performedBy
        });
      }

      toast.success(`โอนย้ายสินค้าสำเร็จ ${transferForm.items.length} รายการ`);
      
      // Reset form
      setTransferForm({
        sourceWarehouseId: currentWarehouseId || '',
        targetWarehouseId: '',
        items: [],
        reason: '',
        priority: 'normal',
        performedBy: 'current-user'
      });

      // Reload data
      loadStockLevels();
      loadTransferHistory();

    } catch (error) {
      console.error('Error processing transfer:', error);
      toast.error('เกิดข้อผิดพลาดในการโอนย้ายสินค้า');
    } finally {
      setLoading(false);
    }
  };

  // Update serial number for transfer
  const updateSerialNumberForTransfer = async (
    serialNumberId: string, 
    updates: any
  ) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('product_serial_numbers')
      .update({
        status: 'transferred',
        warehouse_id: updates.targetWarehouseId,
        reference_number: updates.referenceNumber,
        notes: updates.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalItems = transferForm.items.length;
    const totalValue = transferForm.items.reduce(
      (sum, item) => sum + (item.serialNumber.unitCost * item.quantity), 
      0
    );
    return { totalItems, totalValue };
  };

  const { totalItems, totalValue } = calculateTotals();

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">ด่วนมาก</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">สูง</Badge>;
      case 'normal':
        return <Badge variant="secondary">ปกติ</Badge>;
      case 'low':
        return <Badge variant="outline">ต่ำ</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">ร่าง</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">รอดำเนินการ</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">กำลังขนส่ง</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">ส่งแล้ว</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ยกเลิก</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpDown className="h-6 w-6" />
            โอนย้ายสินค้า
          </h2>
          <p className="text-muted-foreground">จัดการการโอนย้ายสินค้าระหว่างคลัง</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransferPreview(true)} disabled={transferForm.items.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            ดูตัวอย่าง
          </Button>
          <Button onClick={handleSubmitTransfer} disabled={loading || transferForm.items.length === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'กำลังดำเนินการ...' : 'ยืนยันโอนย้าย'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">สร้างการโอนย้าย</TabsTrigger>
          <TabsTrigger value="items">รายการที่เลือก ({transferForm.items.length})</TabsTrigger>
          <TabsTrigger value="history">ประวัติการโอนย้าย</TabsTrigger>
        </TabsList>

        {/* Create Transfer Tab */}
        <TabsContent value="create" className="space-y-6">
          {/* Warehouse Selection */}
          <Card>
            <CardHeader>
              <CardTitle>เลือกคลังต้นทางและปลายทาง</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceWarehouse">คลังต้นทาง</Label>
                  <Select 
                    value={transferForm.sourceWarehouseId} 
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, sourceWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกคลังต้นทาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {warehouse.name} ({warehouse.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetWarehouse">คลังปลายทาง</Label>
                  <Select 
                    value={transferForm.targetWarehouseId} 
                    onValueChange={(value) => setTransferForm(prev => ({ ...prev, targetWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกคลังปลายทาง" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter(w => w.id !== transferForm.sourceWarehouseId)
                        .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {warehouse.name} ({warehouse.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {transferForm.sourceWarehouseId && (
            <>
              {/* Search Products */}
              <Card>
                <CardHeader>
                  <CardTitle>ค้นหาสินค้า</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="ค้นหาสินค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button onClick={loadStockLevels} disabled={loading}>
                      <Search className="h-4 w-4 mr-2" />
                      ค้นหา
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Levels */}
              <Card>
                <CardHeader>
                  <CardTitle>สินค้าในคลังต้นทาง</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">กำลังโหลด...</div>
                  ) : stockLevels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      ไม่พบสินค้าในคลัง
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สินค้า</TableHead>
                          <TableHead>รหัส</TableHead>
                          <TableHead>จำนวนคงเหลือ</TableHead>
                          <TableHead>มูลค่า</TableHead>
                          <TableHead>การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockLevels.map((stock) => (
                          <TableRow key={`${stock.productId}-${stock.warehouseId}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{stock.productName}</p>
                                {stock.brand && (
                                  <p className="text-sm text-muted-foreground">{stock.brand}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{stock.productCode}</TableCell>
                            <TableCell>
                              <Badge variant={stock.availableQuantity > 5 ? 'default' : 'destructive'}>
                                {stock.availableQuantity} ชิ้น
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ฿{stock.availableValue.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleProductSelect(stock)}
                                disabled={stock.availableQuantity === 0}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                เลือก
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลการโอนย้าย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">ความสำคัญ</Label>
                  <Select 
                    value={transferForm.priority} 
                    onValueChange={(value: any) => setTransferForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">ต่ำ</SelectItem>
                      <SelectItem value="normal">ปกติ</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                      <SelectItem value="urgent">ด่วนมาก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledDate">วันที่กำหนดส่ง</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={transferForm.scheduledDate || ''}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">เหตุผลการโอนย้าย *</Label>
                <Input
                  id="reason"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="ระบุเหตุผล"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={transferForm.notes || ''}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>รายการสินค้าที่เลือก</span>
                <Badge variant="secondary">{totalItems} รายการ</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transferForm.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีสินค้าที่เลือก</p>
                  <p className="text-sm">กลับไปที่แท็บ "สร้างการโอนย้าย" เพื่อเลือกสินค้า</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>ราคาทุน</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferForm.items.map((item) => (
                        <TableRow key={item.serialNumber.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.serialNumber.product?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.serialNumber.product?.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {item.serialNumber.serialNumber}
                          </TableCell>
                          <TableCell>
                            ฿{item.serialNumber.unitCost.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.serialNumber.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Summary */}
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">รวมทั้งหมด:</span>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {totalItems} รายการ
                        </p>
                        <p className="text-sm text-muted-foreground">
                          มูลค่า ฿{totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการโอนย้ายสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              {transferHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีประวัติการโอนย้ายสินค้า</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่โอนย้าย</TableHead>
                      <TableHead>คลังต้นทาง</TableHead>
                      <TableHead>คลังปลายทาง</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ความสำคัญ</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>วันที่</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferHistory.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono">
                          {transfer.transferNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transfer.sourceWarehouse.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {transfer.sourceWarehouse.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transfer.targetWarehouse.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {transfer.targetWarehouse.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>{getPriorityBadge(transfer.priority)}</TableCell>
                        <TableCell>
                          <div>
                            <p>{transfer.totalItems} รายการ</p>
                            <p className="text-sm text-muted-foreground">
                              ฿{transfer.totalValue.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(transfer.createdAt).toLocaleDateString('th-TH')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Serial Number Selection Modal */}
      {showSerialNumberModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>เลือก Serial Number - {selectedProduct.productName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSerialNumberModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">กำลังโหลด...</div>
              ) : serialNumbers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มี Serial Number ที่พร้อมโอนย้าย
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>ราคาทุน</TableHead>
                      <TableHead>ซัพพลายเออร์</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serialNumbers.map((sn) => (
                      <TableRow key={sn.id}>
                        <TableCell className="font-mono">{sn.serialNumber}</TableCell>
                        <TableCell>฿{sn.unitCost.toLocaleString()}</TableCell>
                        <TableCell>{sn.supplier?.name || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSerialNumberSelect(sn)}
                          >
                            เลือก
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Preview Modal */}
      {showTransferPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ตัวอย่างใบโอนย้ายสินค้า</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTransferPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">ใบโอนย้ายสินค้า</h3>
                <p className="text-sm text-muted-foreground">
                  วันที่: {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>คลังต้นทาง:</strong> {warehouses.find(w => w.id === transferForm.sourceWarehouseId)?.name}</p>
                  <p><strong>คลังปลายทาง:</strong> {warehouses.find(w => w.id === transferForm.targetWarehouseId)?.name}</p>
                  <p><strong>ความสำคัญ:</strong> {transferForm.priority}</p>
                </div>
                <div>
                  <p><strong>เหตุผล:</strong> {transferForm.reason}</p>
                  {transferForm.scheduledDate && (
                    <p><strong>วันที่กำหนดส่ง:</strong> {new Date(transferForm.scheduledDate).toLocaleDateString('th-TH')}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">รายการสินค้า:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>ราคา</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferForm.items.map((item) => (
                      <TableRow key={item.serialNumber.id}>
                        <TableCell className="text-sm">
                          {item.serialNumber.product?.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.serialNumber.serialNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          ฿{item.serialNumber.unitCost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>รวมทั้งหมด:</span>
                  <span>{totalItems} รายการ (฿{totalValue.toLocaleString()})</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Truck className="h-4 w-4 mr-2" />
                  พิมพ์ใบโอนย้าย
                </Button>
                <Button onClick={handleSubmitTransfer} className="flex-1" disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ยืนยันโอนย้าย
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}