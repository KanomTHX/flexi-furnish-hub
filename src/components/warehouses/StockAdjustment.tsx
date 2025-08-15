import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Plus, 
  Minus, 
  Save, 
  X, 
  Search,
  Edit,
  CheckCircle,
  Clock,
  Eye,
  QrCode,
  Package,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseService } from '@/services/warehouseService';
import type { SerialNumber, StockLevel, Warehouse } from '@/types/warehouse';

interface StockAdjustmentProps {
  warehouseId: string;
  warehouses: Warehouse[];
}

export interface StockAdjustmentData {
  adjustmentNumber: string;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  items: AdjustmentItem[];
  reason: string;
  notes?: string;
  totalItems: number;
  performedBy: string;
}

export interface AdjustmentItem {
  serialNumber: SerialNumber;
  adjustmentType: 'add' | 'remove' | 'status_change' | 'correction';
  reason: string;
  newStatus?: string;
  quantityChange?: number;
}

export interface AdjustmentRecord {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouseName: string;
  adjustmentType: AdjustmentType;
  totalItems: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type AdjustmentType = 'count' | 'damage' | 'loss' | 'found' | 'correction';

export const StockAdjustment: React.FC<StockAdjustmentProps> = ({
  warehouseId: initialWarehouseId,
  warehouses
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWarehouseId);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentRecord[]>([]);
  
  // Form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    warehouseId: initialWarehouseId,
    adjustmentType: 'correction' as AdjustmentType,
    reason: '',
    notes: '',
    items: [] as AdjustmentItem[],
    performedBy: 'current-user' // Should come from auth context
  });

  // Modal states
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showSerialNumberModal, setShowSerialNumberModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [showAdjustmentPreview, setShowAdjustmentPreview] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (selectedWarehouse) {
      loadStockLevels();
    }
    loadAdjustmentHistory();
  }, [selectedWarehouse, searchTerm]);

  // Load stock levels
  const loadStockLevels = async () => {
    try {
      setLoading(true);
      const response = await WarehouseService.getStockLevels({
        warehouseId: selectedWarehouse,
        search: searchTerm,
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
        warehouseId: selectedWarehouse,
        productId: productId,
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

  // Load adjustment history
  const loadAdjustmentHistory = async () => {
    try {
      const response = await WarehouseService.getStockMovements({
        warehouseId: selectedWarehouse,
        movementType: 'adjustment',
        limit: 20
      });
      
      // Transform movements to adjustment records (simplified)
      const adjustments: AdjustmentRecord[] = response.data.map(movement => ({
        id: movement.id,
        adjustmentNumber: movement.referenceNumber || `ADJ-${movement.id.slice(-8)}`,
        warehouseId: movement.warehouseId,
        warehouseName: movement.warehouse?.name || 'Unknown',
        adjustmentType: 'correction' as AdjustmentType,
        totalItems: movement.quantity,
        reason: movement.notes || 'Stock adjustment',
        status: 'approved' as const,
        createdAt: movement.createdAt.toISOString(),
        createdBy: movement.performedBy
      }));
      
      setAdjustmentHistory(adjustments);
    } catch (error) {
      console.error('Error loading adjustment history:', error);
    }
  };

  // Handle product selection
  const handleProductSelect = async (stockLevel: StockLevel) => {
    setSelectedProduct(stockLevel);
    await loadSerialNumbers(stockLevel.productId);
    setShowSerialNumberModal(true);
  };

  // Handle serial number selection
  const handleSerialNumberSelect = (serialNumber: SerialNumber, adjustmentType: 'add' | 'remove' | 'status_change' | 'correction') => {
    const existingItem = adjustmentForm.items.find(
      item => item.serialNumber.id === serialNumber.id
    );

    if (existingItem) {
      toast.warning('สินค้าชิ้นนี้ถูกเลือกแล้ว');
      return;
    }

    setAdjustmentForm(prev => ({
      ...prev,
      items: [...prev.items, {
        serialNumber,
        adjustmentType,
        reason: '',
        quantityChange: adjustmentType === 'add' ? 1 : adjustmentType === 'remove' ? -1 : 0
      }]
    }));

    toast.success(`เพิ่ม ${serialNumber.product?.name} (${serialNumber.serialNumber}) แล้ว`);
    setShowSerialNumberModal(false);
  };

  // Remove item from adjustment list
  const handleRemoveItem = (serialNumberId: string) => {
    setAdjustmentForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.serialNumber.id !== serialNumberId)
    }));
    toast.success('ลบรายการแล้ว');
  };

  // Handle form submission
  const handleSubmitAdjustment = async () => {
    try {
      // Validation
      if (!adjustmentForm.warehouseId) {
        toast.error('กรุณาเลือกคลังสินค้า');
        return;
      }

      if (adjustmentForm.items.length === 0) {
        toast.error('กรุณาเลือกสินค้าที่ต้องการปรับปรุง');
        return;
      }

      if (!adjustmentForm.reason.trim()) {
        toast.error('กรุณาระบุเหตุผลการปรับปรุงสต็อก');
        return;
      }

      setLoading(true);

      // Process adjustment for each item
      for (const item of adjustmentForm.items) {
        // Update serial number status if needed
        if (item.adjustmentType === 'status_change' && item.newStatus) {
          await updateSerialNumberStatus(item.serialNumber.id, item.newStatus, {
            referenceNumber: `ADJ-${Date.now()}`,
            notes: `${adjustmentForm.reason} - ${item.reason}`
          });
        }

        // Log stock movement
        await WarehouseService.logStockMovement({
          productId: item.serialNumber.productId,
          serialNumberId: item.serialNumber.id,
          warehouseId: adjustmentForm.warehouseId,
          movementType: 'adjustment',
          quantity: item.quantityChange || 1,
          unitCost: item.serialNumber.unitCost,
          referenceType: 'adjustment',
          referenceNumber: `ADJ-${Date.now()}`,
          notes: `${adjustmentForm.adjustmentType}: ${adjustmentForm.reason} - ${item.reason}`,
          performedBy: adjustmentForm.performedBy
        });
      }

      toast.success(`ปรับปรุงสต็อกสำเร็จ ${adjustmentForm.items.length} รายการ`);
      
      // Reset form
      setAdjustmentForm({
        warehouseId: selectedWarehouse,
        adjustmentType: 'correction',
        reason: '',
        notes: '',
        items: [],
        performedBy: 'current-user'
      });

      // Reload data
      loadStockLevels();
      loadAdjustmentHistory();

    } catch (error) {
      console.error('Error processing adjustment:', error);
      toast.error('เกิดข้อผิดพลาดในการปรับปรุงสต็อก');
    } finally {
      setLoading(false);
    }
  };

  // Update serial number status
  const updateSerialNumberStatus = async (
    serialNumberId: string, 
    status: string, 
    updates: any
  ) => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('product_serial_numbers')
      .update({
        status,
        reference_number: updates.referenceNumber,
        notes: updates.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', serialNumberId);

    if (error) throw error;
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalItems = adjustmentForm.items.length;
    const totalValue = adjustmentForm.items.reduce(
      (sum, item) => sum + item.serialNumber.unitCost, 
      0
    );
    return { totalItems, totalValue };
  };

  const { totalItems, totalValue } = calculateTotals();

  // Get adjustment type badge color
  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case 'add':
        return <Badge className="bg-green-100 text-green-800">เพิ่มสต็อก</Badge>;
      case 'remove':
        return <Badge className="bg-red-100 text-red-800">ลดสต็อก</Badge>;
      case 'status_change':
        return <Badge className="bg-blue-100 text-blue-800">เปลี่ยนสถานะ</Badge>;
      case 'correction':
        return <Badge className="bg-yellow-100 text-yellow-800">แก้ไขข้อมูล</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">รอดำเนินการ</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ปฏิเสธ</Badge>;
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
            <Edit className="h-6 w-6" />
            ปรับปรุงสต็อก
          </h2>
          <p className="text-muted-foreground">จัดการการปรับปรุงและแก้ไขสต็อกสินค้า</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdjustmentPreview(true)} disabled={adjustmentForm.items.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            ดูตัวอย่าง
          </Button>
          <Button onClick={handleSubmitAdjustment} disabled={loading || adjustmentForm.items.length === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'กำลังดำเนินการ...' : 'ยืนยันการปรับปรุง'}
          </Button>
        </div>
      </div>

      {/* Warehouse Selection */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกคลังสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedWarehouse} 
            onValueChange={(value) => {
              setSelectedWarehouse(value);
              setAdjustmentForm(prev => ({ ...prev, warehouseId: value }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกคลังสินค้า" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedWarehouse && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">สร้างการปรับปรุง</TabsTrigger>
            <TabsTrigger value="items">รายการที่เลือก ({adjustmentForm.items.length})</TabsTrigger>
            <TabsTrigger value="history">ประวัติการปรับปรุง</TabsTrigger>
          </TabsList>

          {/* Create Adjustment Tab */}
          <TabsContent value="create" className="space-y-6">
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
                <CardTitle>สินค้าในคลัง</CardTitle>
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
                              {stock.totalQuantity} ชิ้น
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              พร้อมใช้: {stock.availableQuantity}
                            </div>
                          </TableCell>
                          <TableCell>
                            ฿{stock.availableValue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleProductSelect(stock)}
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
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            {/* Adjustment Form */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลการปรับปรุง</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adjustmentType">ประเภทการปรับปรุง</Label>
                    <Select 
                      value={adjustmentForm.adjustmentType} 
                      onValueChange={(value: AdjustmentType) => setAdjustmentForm(prev => ({ ...prev, adjustmentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">นับสต็อก</SelectItem>
                        <SelectItem value="damage">สินค้าเสียหาย</SelectItem>
                        <SelectItem value="loss">สินค้าสูญหาย</SelectItem>
                        <SelectItem value="found">พบสินค้าเพิ่ม</SelectItem>
                        <SelectItem value="correction">แก้ไขข้อมูล</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">เหตุผลการปรับปรุง *</Label>
                  <Input
                    id="reason"
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="ระบุเหตุผล"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    value={adjustmentForm.notes}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
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
                {adjustmentForm.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีสินค้าที่เลือก</p>
                    <p className="text-sm">กลับไปที่แท็บ "สร้างการปรับปรุง" เพื่อเลือกสินค้า</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สินค้า</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>สถานะปัจจุบัน</TableHead>
                          <TableHead>การปรับปรุง</TableHead>
                          <TableHead>การดำเนินการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adjustmentForm.items.map((item) => (
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
                              <Badge variant="outline">{item.serialNumber.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {getAdjustmentTypeBadge(item.adjustmentType)}
                              {item.newStatus && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  → {item.newStatus}
                                </div>
                              )}
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
                <CardTitle>ประวัติการปรับปรุงสต็อก</CardTitle>
              </CardHeader>
              <CardContent>
                {adjustmentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีประวัติการปรับปรุงสต็อก</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เลขที่การปรับปรุง</TableHead>
                        <TableHead>คลัง</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>ผู้ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjustmentHistory.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell className="font-mono">
                            {adjustment.adjustmentNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{adjustment.warehouseName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{adjustment.adjustmentType}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                          <TableCell>
                            {adjustment.totalItems} รายการ
                          </TableCell>
                          <TableCell>
                            {new Date(adjustment.createdAt).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>{adjustment.createdBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

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
                  ไม่มี Serial Number ในคลังนี้
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ราคาทุน</TableHead>
                      <TableHead>การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serialNumbers.map((sn) => (
                      <TableRow key={sn.id}>
                        <TableCell className="font-mono">{sn.serialNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sn.status}</Badge>
                        </TableCell>
                        <TableCell>฿{sn.unitCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSerialNumberSelect(sn, 'status_change')}
                            >
                              เปลี่ยนสถานะ
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSerialNumberSelect(sn, 'correction')}
                            >
                              แก้ไขข้อมูล
                            </Button>
                          </div>
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

      {/* Adjustment Preview Modal */}
      {showAdjustmentPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ตัวอย่างการปรับปรุงสต็อก</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdjustmentPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">ใบปรับปรุงสต็อก</h3>
                <p className="text-sm text-muted-foreground">
                  วันที่: {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>คลังสินค้า:</strong> {warehouses.find(w => w.id === selectedWarehouse)?.name}</p>
                  <p><strong>ประเภท:</strong> {adjustmentForm.adjustmentType}</p>
                </div>
                <div>
                  <p><strong>เหตุผล:</strong> {adjustmentForm.reason}</p>
                  <p><strong>จำนวนรายการ:</strong> {totalItems}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">รายการสินค้า:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>การปรับปรุง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentForm.items.map((item) => (
                      <TableRow key={item.serialNumber.id}>
                        <TableCell className="text-sm">
                          {item.serialNumber.product?.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.serialNumber.serialNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getAdjustmentTypeBadge(item.adjustmentType)}
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
                  <Save className="h-4 w-4 mr-2" />
                  พิมพ์
                </Button>
                <Button onClick={handleSubmitAdjustment} className="flex-1" disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ยืนยันการปรับปรุง
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;