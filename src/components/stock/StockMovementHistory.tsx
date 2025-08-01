import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockMovement, StockFilter, Location, Supplier } from '@/types/stock';
import { getMovementTypeText } from '@/utils/stockHelpers';
import { 
  Search, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ArrowRightLeft,
  Package,
  Filter
} from 'lucide-react';

interface StockMovementHistoryProps {
  movements: StockMovement[];
  locations: Location[];
  suppliers: Supplier[];
  filter: StockFilter;
  onFilterChange: (filter: Partial<StockFilter>) => void;
  onExport: () => void;
}

export function StockMovementHistory({
  movements,
  locations,
  suppliers,
  filter,
  onFilterChange,
  onExport
}: StockMovementHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMovementIcon = (type: StockMovement['type']) => {
    const icons = {
      in: <TrendingUp className="w-4 h-4 text-green-600" />,
      out: <TrendingDown className="w-4 h-4 text-red-600" />,
      adjustment: <RotateCcw className="w-4 h-4 text-blue-600" />,
      transfer: <ArrowRightLeft className="w-4 h-4 text-purple-600" />
    };
    return icons[type];
  };

  const getMovementBadge = (type: StockMovement['type']) => {
    const variants = {
      in: 'default',
      out: 'destructive',
      adjustment: 'secondary',
      transfer: 'outline'
    } as const;

    return (
      <Badge variant={variants[type]} className="text-xs">
        {getMovementIcon(type)}
        <span className="ml-1">{getMovementTypeText(type)}</span>
      </Badge>
    );
  };

  const getQuantityDisplay = (movement: StockMovement) => {
    const isNegative = movement.type === 'out' || 
      (movement.type === 'adjustment' && movement.newStock < movement.previousStock);
    
    return (
      <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
        {isNegative ? '-' : '+'}{movement.quantity}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              ประวัติการเคลื่อนไหวสต็อก
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
                placeholder="ค้นหา SKU, ชื่อสินค้า, เลขที่อ้างอิง..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* ประเภทการเคลื่อนไหว */}
            <Select 
              value={filter.movementType || 'all'} 
              onValueChange={(value) => onFilterChange({ movementType: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="in">รับเข้า</SelectItem>
                <SelectItem value="out">จ่ายออก</SelectItem>
                <SelectItem value="adjustment">ปรับปรุง</SelectItem>
                <SelectItem value="transfer">โอนย้าย</SelectItem>
              </SelectContent>
            </Select>

            {/* สถานที่ */}
            <Select 
              value={filter.location || 'all'} 
              onValueChange={(value) => onFilterChange({ location: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานที่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานที่</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ผู้จัดจำหน่าย */}
            <Select 
              value={filter.supplier || 'all'} 
              onValueChange={(value) => onFilterChange({ supplier: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ผู้จัดจำหน่าย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกผู้จัดจำหน่าย</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
              <Input
                type="date"
                placeholder="ถึงวันที่"
                value={filter.dateTo || ''}
                onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* ตารางการเคลื่อนไหว */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่/เวลา</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">สต็อกก่อน</TableHead>
                  <TableHead className="text-right">สต็อกหลัง</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>เลขที่อ้างอิง</TableHead>
                  <TableHead className="text-right">ต้นทุน</TableHead>
                  <TableHead>สถานที่</TableHead>
                  <TableHead>ผู้ดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(movement.createdAt).toLocaleDateString('th-TH')}</div>
                        <div className="text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.product.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {movement.product.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMovementBadge(movement.type)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {getQuantityDisplay(movement)}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.previousStock}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.newStock}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate" title={movement.reason}>
                        {movement.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.reference && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {movement.reference}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.cost && (
                        <div className="text-sm">
                          <div>{formatCurrency(movement.cost)}</div>
                          {movement.totalCost && (
                            <div className="text-muted-foreground">
                              รวม {formatCurrency(movement.totalCost)}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {movement.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{movement.employeeName}</div>
                        {movement.supplier && (
                          <div className="text-muted-foreground">
                            {movement.supplier.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {movements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบประวัติการเคลื่อนไหวที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}

          {/* สรุปข้อมูล */}
          {movements.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-lg font-bold text-green-700">
                  {movements.filter(m => m.type === 'in').length}
                </div>
                <div className="text-sm text-green-600">รับเข้า</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-lg font-bold text-red-700">
                  {movements.filter(m => m.type === 'out').length}
                </div>
                <div className="text-sm text-red-600">จ่ายออก</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-700">
                  {movements.filter(m => m.type === 'adjustment').length}
                </div>
                <div className="text-sm text-blue-600">ปรับปรุง</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-700">
                  {movements.filter(m => m.type === 'transfer').length}
                </div>
                <div className="text-sm text-purple-600">โอนย้าย</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}