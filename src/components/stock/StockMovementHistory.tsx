import React from 'react';
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
import { Label } from '@/components/ui/label';
import { 
  ArrowUpDown, 
  Search, 
  Download, 
  TrendingUp, 
  TrendingDown,
  RotateCcw,
  Truck,
  ShoppingCart,
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { StockMovement, MovementFilter } from '@/types/stock';
import { Warehouse } from '@/types/warehouse';

interface StockMovementHistoryProps {
  movements: StockMovement[];
  warehouses: Warehouse[];
  filter: MovementFilter;
  onFilterChange: (filter: MovementFilter) => void;
  onExport: () => void;
}

export function StockMovementHistory({ 
  movements, 
  warehouses, 
  filter, 
  onFilterChange, 
  onExport 
}: StockMovementHistoryProps) {
  
  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <RotateCcw className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <Truck className="w-4 h-4 text-purple-600" />;
      case 'return':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">รับเข้า</Badge>;
      case 'out':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">จ่ายออก</Badge>;
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">ปรับปรุง</Badge>;
      case 'transfer':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">โอนย้าย</Badge>;
      case 'return':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">คืน</Badge>;
      default:
        return <Badge variant="secondary">อื่นๆ</Badge>;
    }
  };

  const getSubTypeName = (subType?: StockMovement['subType']) => {
    switch (subType) {
      case 'purchase':
        return 'ซื้อสินค้า';
      case 'sale':
        return 'ขายสินค้า';
      case 'production':
        return 'ผลิต';
      case 'count_adjustment':
        return 'ปรับจากตรวจนับ';
      case 'warehouse_transfer':
        return 'โอนระหว่างคลัง';
      case 'customer_return':
        return 'ลูกค้าคืน';
      case 'supplier_return':
        return 'คืนผู้จัดจำหน่าย';
      default:
        return subType || '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ประวัติการเคลื่อนไหว</h2>
          <p className="text-muted-foreground">
            ติดตามการเคลื่อนไหวสต็อกทั้งหมด
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ชื่อสินค้า, SKU, เหตุผล..."
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
              <Label>ประเภท</Label>
              <Select 
                value={filter.type || 'all'} 
                onValueChange={(value) => onFilterChange({ 
                  ...filter, 
                  type: value === 'all' ? undefined : value as any
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="in">รับเข้า</SelectItem>
                  <SelectItem value="out">จ่ายออก</SelectItem>
                  <SelectItem value="adjustment">ปรับปรุง</SelectItem>
                  <SelectItem value="transfer">โอนย้าย</SelectItem>
                  <SelectItem value="return">คืน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>วันที่เริ่ม</Label>
              <Input
                type="date"
                value={filter.dateFrom || ''}
                onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>วันที่สิ้นสุด</Label>
              <Input
                type="date"
                value={filter.dateTo || ''}
                onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movement Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            รายการเคลื่อนไหว ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>คลัง/โซน</TableHead>
                  <TableHead className="text-center">ประเภท</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">สต็อกก่อน</TableHead>
                  <TableHead className="text-right">สต็อกหลัง</TableHead>
                  <TableHead className="text-right">มูลค่า</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>ผู้ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่พบข้อมูลการเคลื่อนไหว</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (movements || []).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(movement.createdAt).toLocaleDateString('th-TH')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleTimeString('th-TH')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {movement.product.sku} • {movement.product.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{movement.warehouse.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.zone.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            {getMovementIcon(movement.type)}
                            {getMovementBadge(movement.type)}
                          </div>
                          {movement.subType && (
                            <div className="text-xs text-muted-foreground">
                              {getSubTypeName(movement.subType)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-muted-foreground">
                          {movement.previousStock.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {movement.newStock.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${
                          movement.totalCost > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ฿{Math.abs(movement.totalCost).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @฿{movement.unitCost.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm">{movement.reason}</div>
                          {movement.referenceNumber && (
                            <div className="text-xs text-muted-foreground">
                              อ้างอิง: {movement.referenceNumber}
                            </div>
                          )}
                          {movement.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {movement.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">{movement.employeeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.createdBy}
                          </div>
                          {movement.approvedBy && (
                            <div className="text-xs text-green-600 mt-1">
                              อนุมัติแล้ว
                            </div>
                          )}
                        </div>
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