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
  Package,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  User,
  FileText,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  QrCode,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseService } from '@/services/warehouseService';
import type { SerialNumber, StockLevel, Warehouse } from '@/types/warehouse';

interface WithdrawDispatchProps {
  warehouses: Warehouse[];
}

interface WithdrawItem {
  serialNumber: SerialNumber;
  quantity: number;
  notes?: string;
}

interface WithdrawForm {
  warehouseId: string;
  items: WithdrawItem[];
  reason: string;
  referenceType: 'sale' | 'transfer' | 'return' | 'adjustment' | 'claim' | 'other';
  referenceNumber?: string;
  soldTo?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  performedBy: string;
}

export default function WithdrawDispatch({ warehouses }: WithdrawDispatchProps) {
  // State management
  const [activeTab, setActiveTab] = useState('withdraw');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  // Form state
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({
    warehouseId: '',
    items: [],
    reason: '',
    referenceType: 'sale',
    performedBy: 'current-user' // Should come from auth context
  });

  // Modal states
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showSerialNumberModal, setShowSerialNumberModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [showWithdrawPreview, setShowWithdrawPreview] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (selectedWarehouse) {
      loadStockLevels();
      loadWithdrawHistory();
    }
  }, [selectedWarehouse, searchTerm]);

  // Load stock levels
  const loadStockLevels = async () => {
    try {
      setLoading(true);
      const response = await WarehouseService.getStockLevels({
        warehouseId: selectedWarehouse,
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
        warehouseId: selectedWarehouse,
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

  // Load withdraw history
  const loadWithdrawHistory = async () => {
    try {
      const response = await WarehouseService.getStockMovements({
        warehouseId: selectedWarehouse,
        movementType: 'withdraw',
        limit: 20
      });
      setWithdrawHistory(response.data);
    } catch (error) {
      console.error('Error loading withdraw history:', error);
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
    const existingItem = withdrawForm.items.find(
      item => item.serialNumber.id === serialNumber.id
    );

    if (existingItem) {
      toast.warning('สินค้าชิ้นนี้ถูกเลือกแล้ว');
      return;
    }

    setWithdrawForm(prev => ({
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

  // Remove item from withdraw list
  const handleRemoveItem = (serialNumberId: string) => {
    setWithdrawForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.serialNumber.id !== serialNumberId)
    }));
    toast.success('ลบรายการแล้ว');
  };

  // Handle form submission
  const handleSubmitWithdraw = async () => {
    try {
      // Validation
      if (!withdrawForm.warehouseId) {
        toast.error('กรุณาเลือกคลังสินค้า');
        return;
      }

      if (withdrawForm.items.length === 0) {
        toast.error('กรุณาเลือกสินค้าที่ต้องการจ่าย');
        return;
      }

      if (!withdrawForm.reason.trim()) {
        toast.error('กรุณาระบุเหตุผลการจ่ายสินค้า');
        return;
      }

      if (withdrawForm.referenceType === 'sale' && !withdrawForm.customerName?.trim()) {
        toast.error('กรุณาระบุชื่อลูกค้า');
        return;
      }

      setLoading(true);

      // Process withdrawal using the service
      const result = await processWithdrawal();

      toast.success(`จ่ายสินค้าสำเร็จ ${withdrawForm.items.length} รายการ`);

      // Reset form
      setWithdrawForm({
        warehouseId: selectedWarehouse,
        items: [],
        reason: '',
        referenceType: 'sale',
        performedBy: 'current-user'
      });

      // Reload data
      loadStockLevels();
      loadWithdrawHistory();

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('เกิดข้อผิดพลาดในการจ่ายสินค้า');
    } finally {
      setLoading(false);
    }
  };

  // Process withdrawal using WarehouseService
  const processWithdrawal = async () => {
    const serialNumberIds = withdrawForm.items.map(item => item.serialNumber.id);

    return await WarehouseService.withdrawGoods({
      warehouseId: withdrawForm.warehouseId,
      serialNumberIds,
      reason: withdrawForm.reason,
      referenceType: withdrawForm.referenceType,
      referenceNumber: withdrawForm.referenceNumber,
      customerName: withdrawForm.customerName,
      customerPhone: withdrawForm.customerPhone,
      customerAddress: withdrawForm.customerAddress,
      notes: withdrawForm.notes,
      performedBy: withdrawForm.performedBy
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalItems = withdrawForm.items.length;
    const totalValue = withdrawForm.items.reduce(
      (sum, item) => sum + (item.serialNumber.unitCost * item.quantity),
      0
    );
    return { totalItems, totalValue };
  };

  const { totalItems, totalValue } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            จ่ายสินค้า
          </h2>
          <p className="text-muted-foreground">จัดการการจ่ายสินค้าออกจากคลัง</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowWithdrawPreview(true)} disabled={withdrawForm.items.length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            ดูตัวอย่าง
          </Button>
          <Button onClick={handleSubmitWithdraw} disabled={loading || withdrawForm.items.length === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'กำลังดำเนินการ...' : 'ยืนยันจ่ายสินค้า'}
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
              setWithdrawForm(prev => ({ ...prev, warehouseId: value }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกคลังสินค้า" />
            </SelectTrigger>
            <SelectContent>
              {warehouses?.map((warehouse) => (
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
            <TabsTrigger value="withdraw">จ่ายสินค้า</TabsTrigger>
            <TabsTrigger value="cart">รายการที่เลือก ({withdrawForm.items.length})</TabsTrigger>
            <TabsTrigger value="history">ประวัติการจ่าย</TabsTrigger>
          </TabsList>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-6">
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
                      {stockLevels?.map((stock) => (
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
          </TabsContent>

          {/* Cart Tab */}
          <TabsContent value="cart" className="space-y-6">
            {/* Withdraw Form */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลการจ่ายสินค้า</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referenceType">ประเภทการจ่าย</Label>
                    <Select
                      value={withdrawForm.referenceType}
                      onValueChange={(value: any) => setWithdrawForm(prev => ({ ...prev, referenceType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">ขาย</SelectItem>
                        <SelectItem value="transfer">โอนย้าย</SelectItem>
                        <SelectItem value="return">คืนสินค้า</SelectItem>
                        <SelectItem value="adjustment">ปรับปรุงสต็อก</SelectItem>
                        <SelectItem value="claim">เคลม</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="referenceNumber">เลขที่อ้างอิง</Label>
                    <Input
                      id="referenceNumber"
                      value={withdrawForm.referenceNumber || ''}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                      placeholder="เลขที่ใบสั่งขาย/โอนย้าย"
                    />
                  </div>
                </div>

                {withdrawForm.referenceType === 'sale' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">ชื่อลูกค้า *</Label>
                      <Input
                        id="customerName"
                        value={withdrawForm.customerName || ''}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="ชื่อลูกค้า"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">เบอร์โทรศัพท์</Label>
                      <Input
                        id="customerPhone"
                        value={withdrawForm.customerPhone || ''}
                        onChange={(e) => setWithdrawForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="เบอร์โทรศัพท์"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="reason">เหตุผลการจ่ายสินค้า *</Label>
                  <Input
                    id="reason"
                    value={withdrawForm.reason}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="ระบุเหตุผล"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">หมายเหตุ</Label>
                  <Textarea
                    id="notes"
                    value={withdrawForm.notes || ''}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, notes: e.target.value }))}
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
                {withdrawForm.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีสินค้าที่เลือก</p>
                    <p className="text-sm">กลับไปที่แท็บ "จ่ายสินค้า" เพื่อเลือกสินค้า</p>
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
                        {withdrawForm.items?.map((item) => (
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
                <CardTitle>ประวัติการจ่ายสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีประวัติการจ่ายสินค้า</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>วันที่</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>เหตุผล</TableHead>
                        <TableHead>ผู้ดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawHistory?.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {new Date(movement.createdAt).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{movement.product?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {movement.product?.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {movement.serialNumber?.serialNumber || '-'}
                          </TableCell>
                          <TableCell>{movement.notes || '-'}</TableCell>
                          <TableCell>{movement.performedByName || movement.performedBy}</TableCell>
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
              ) : !serialNumbers || serialNumbers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มี Serial Number ที่พร้อมจ่าย
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
                    {serialNumbers?.map((sn) => (
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

      {/* Withdraw Preview Modal */}
      {showWithdrawPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ตัวอย่างใบจ่ายสินค้า</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWithdrawPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">ใบจ่ายสินค้า</h3>
                <p className="text-sm text-muted-foreground">
                  วันที่: {new Date().toLocaleDateString('th-TH')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>คลังสินค้า:</strong> {warehouses.find(w => w.id === selectedWarehouse)?.name}</p>
                  <p><strong>ประเภท:</strong> {withdrawForm.referenceType}</p>
                  <p><strong>เลขที่อ้างอิง:</strong> {withdrawForm.referenceNumber || '-'}</p>
                </div>
                <div>
                  {withdrawForm.referenceType === 'sale' && (
                    <>
                      <p><strong>ลูกค้า:</strong> {withdrawForm.customerName}</p>
                      <p><strong>เบอร์โทร:</strong> {withdrawForm.customerPhone || '-'}</p>
                    </>
                  )}
                  <p><strong>เหตุผล:</strong> {withdrawForm.reason}</p>
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
                    {withdrawForm.items?.map((item) => (
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
                  <Printer className="h-4 w-4 mr-2" />
                  พิมพ์
                </Button>
                <Button onClick={handleSubmitWithdraw} className="flex-1" disabled={loading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ยืนยันจ่ายสินค้า
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}