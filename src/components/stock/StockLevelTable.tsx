import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Minus,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Eye
} from 'lucide-react';
import { StockLevel, StockFilter } from '@/types/stock';
import { Warehouse } from '@/types/warehouse';
import { useBranchData } from '../../hooks/useBranchData';
import { BranchSelector } from '../branch/BranchSelector';

interface StockLevelTableProps {
  stockLevels: StockLevel[];
  warehouses: Warehouse[];
  filter: StockFilter;
  onFilterChange: (filter: StockFilter) => void;
  onExport: () => void;
  onAdjustStock: (productId: string, warehouseId: string, quantity: number, reason: string) => void;
}

export function StockLevelTable({ 
  stockLevels, 
  warehouses, 
  filter, 
  onFilterChange, 
  onExport,
  onAdjustStock 
}: StockLevelTableProps) {
  const { currentBranch, currentBranchStock } = useBranchData();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState<{
    isOpen: boolean;
    stock?: StockLevel;
    quantity: number;
    reason: string;
  }>({
    isOpen: false,
    quantity: 0,
    reason: ''
  });

  const getStatusBadge = (status: StockLevel['status']) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">ปกติ</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">ต่ำ</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">หมด</Badge>;
      case 'overstock':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">เกิน</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getStatusIcon = (status: StockLevel['status']) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'out_of_stock':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'overstock':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleAdjustStock = () => {
    if (adjustDialog.stock && adjustDialog.quantity !== 0 && adjustDialog.reason) {
      onAdjustStock(
        adjustDialog.stock.productId,
        adjustDialog.stock.warehouseId,
        adjustDialog.quantity,
        adjustDialog.reason
      );
      setAdjustDialog({ isOpen: false, quantity: 0, reason: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">ระดับสต็อก</h2>
            <p className="text-muted-foreground">
              จัดการและติดตามระดับสต็อกสินค้า
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
              <span className="text-xs text-blue-600">({currentBranchStock.length} รายการ)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ชื่อสินค้า, SKU..."
                  value={filter.search || ''}
                  onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>คลังสินค้า</Label>
              <Select 
                value={filter.warehouseId || 'all'} 
                onValueChange={(value) => onFilterChange({ 
                  ...filter, 
                  warehouseId: value === 'all' ? undefined : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลัง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคลัง</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>สถานะสต็อก</Label>
              <Select 
                value={filter.stockLevel || 'all'} 
                onValueChange={(value) => onFilterChange({ 
                  ...filter, 
                  stockLevel: value === 'all' ? undefined : value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="in_stock">ปกติ</SelectItem>
                  <SelectItem value="low_stock">ต่ำ</SelectItem>
                  <SelectItem value="out_of_stock">หมด</SelectItem>
                  <SelectItem value="overstock">เกิน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>เรียงตาม</Label>
              <Select 
                value={filter.sortBy || 'name'} 
                onValueChange={(value) => onFilterChange({ 
                  ...filter, 
                  sortBy: value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เรียงตาม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">ชื่อสินค้า</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="quantity">จำนวน</SelectItem>
                  <SelectItem value="value">มูลค่า</SelectItem>
                  <SelectItem value="lastMovement">การเคลื่อนไหวล่าสุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            รายการสต็อก ({stockLevels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>คลัง/โซน</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">พร้อมขาย</TableHead>
                  <TableHead className="text-right">จอง</TableHead>
                  <TableHead className="text-right">ขั้นต่ำ</TableHead>
                  <TableHead className="text-right">มูลค่า</TableHead>
                  <TableHead className="text-center">การเคลื่อนไหว</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่พบข้อมูลสต็อก</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (stockLevels || []).map((stock) => (
                    <TableRow key={`${stock.productId}-${stock.warehouseId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{stock.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stock.product.sku} • {stock.product.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{stock.warehouse.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stock.zone.name} ({stock.zone.code})
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(stock.status)}
                          {getStatusBadge(stock.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{stock.quantity.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-green-600">
                          {stock.availableQuantity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-orange-600">
                          {stock.reservedQuantity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-muted-foreground">
                          {stock.minStock.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          ฿{stock.totalValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @฿{stock.averageCost.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-xs text-muted-foreground">
                          {new Date(stock.lastMovementDate).toLocaleDateString('th-TH')}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog 
                          open={adjustDialog.isOpen && adjustDialog.stock?.productId === stock.productId}
                          onOpenChange={(open) => {
                            if (open) {
                              setAdjustDialog({
                                isOpen: true,
                                stock,
                                quantity: 0,
                                reason: ''
                              });
                            } else {
                              setAdjustDialog({ isOpen: false, quantity: 0, reason: '' });
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>ปรับปรุงสต็อก</DialogTitle>
                              <DialogDescription>
                                ปรับปรุงจำนวนสต็อกสำหรับ {stock.product.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>สต็อกปัจจุบัน</Label>
                                  <div className="text-2xl font-bold">{stock.quantity}</div>
                                </div>
                                <div>
                                  <Label>สต็อกใหม่</Label>
                                  <div className="text-2xl font-bold text-blue-600">
                                    {stock.quantity + adjustDialog.quantity}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>จำนวนที่ปรับ</Label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdjustDialog(prev => ({
                                      ...prev,
                                      quantity: prev.quantity - 1
                                    }))}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={adjustDialog.quantity}
                                    onChange={(e) => setAdjustDialog(prev => ({
                                      ...prev,
                                      quantity: parseInt(e.target.value) || 0
                                    }))}
                                    className="text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdjustDialog(prev => ({
                                      ...prev,
                                      quantity: prev.quantity + 1
                                    }))}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>เหตุผล</Label>
                                <Textarea
                                  placeholder="ระบุเหตุผลในการปรับปรุงสต็อก..."
                                  value={adjustDialog.reason}
                                  onChange={(e) => setAdjustDialog(prev => ({
                                    ...prev,
                                    reason: e.target.value
                                  }))}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setAdjustDialog({ isOpen: false, quantity: 0, reason: '' })}
                              >
                                ยกเลิก
                              </Button>
                              <Button 
                                onClick={handleAdjustStock}
                                disabled={adjustDialog.quantity === 0 || !adjustDialog.reason}
                              >
                                ปรับปรุงสต็อก
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}