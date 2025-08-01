import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductStock, StockFilter, Location, Supplier } from '@/types/stock';
import { getStockStatusText } from '@/utils/stockHelpers';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ProductStockTableProps {
  products: ProductStock[];
  locations: Location[];
  suppliers: Supplier[];
  filter: StockFilter;
  onFilterChange: (filter: Partial<StockFilter>) => void;
  onExport: () => void;
  onEditProduct?: (product: ProductStock) => void;
}

export function ProductStockTable({
  products,
  locations,
  suppliers,
  filter,
  onFilterChange,
  onExport,
  onEditProduct
}: ProductStockTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatusBadge = (status: ProductStock['stockStatus']) => {
    const variants = {
      in_stock: 'default',
      low_stock: 'destructive',
      out_of_stock: 'destructive',
      overstock: 'secondary'
    } as const;

    const icons = {
      in_stock: <Package className="w-3 h-3 mr-1" />,
      low_stock: <TrendingDown className="w-3 h-3 mr-1" />,
      out_of_stock: <AlertTriangle className="w-3 h-3 mr-1" />,
      overstock: <TrendingUp className="w-3 h-3 mr-1" />
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {icons[status]}
        {getStockStatusText(status)}
      </Badge>
    );
  };

  const handleViewDetails = (product: ProductStock) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-4">
      {/* ตัวกรองและการค้นหา */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              รายการสินค้าและสต็อก
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* ค้นหา */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา SKU, ชื่อสินค้า, barcode..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* หมวดหมู่ */}
            <Select 
              value={filter.category || 'all'} 
              onValueChange={(value) => onFilterChange({ category: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* สถานะสต็อก */}
            <Select 
              value={filter.stockStatus || 'all'} 
              onValueChange={(value) => onFilterChange({ stockStatus: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะสต็อก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="in_stock">ปกติ</SelectItem>
                <SelectItem value="low_stock">สต็อกต่ำ</SelectItem>
                <SelectItem value="out_of_stock">หมดสต็อก</SelectItem>
                <SelectItem value="overstock">สต็อกเกิน</SelectItem>
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
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ตารางสินค้า */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead className="text-right">สต็อกปัจจุบัน</TableHead>
                  <TableHead className="text-right">พร้อมขาย</TableHead>
                  <TableHead className="text-right">ขั้นต่ำ/สูงสุด</TableHead>
                  <TableHead className="text-right">มูลค่า</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ผู้จัดจำหน่าย</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.barcode && (
                          <div className="text-xs text-muted-foreground">
                            {product.barcode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{product.currentStock}</div>
                        {product.reservedStock > 0 && (
                          <div className="text-xs text-muted-foreground">
                            จอง {product.reservedStock}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.availableStock}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-xs">
                        <div>{product.minStock} / {product.maxStock}</div>
                        <div className="text-muted-foreground">
                          สั่งซื้อที่ {product.reorderPoint}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">
                          {formatCurrency(product.totalValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{formatCurrency(product.averageCost)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStockStatusBadge(product.stockStatus)}
                    </TableCell>
                    <TableCell>
                      {product.supplier?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(product)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {onEditProduct && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditProduct(product)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog รายละเอียดสินค้า */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดสินค้า {selectedProduct?.sku}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ชื่อสินค้า</label>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">หมวดหมู่</label>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="font-mono">{selectedProduct.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                  <p className="font-mono">{selectedProduct.barcode || '-'}</p>
                </div>
              </div>

              {/* ข้อมูลสต็อก */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedProduct.currentStock}
                  </div>
                  <div className="text-sm text-blue-600">สต็อกปัจจุบัน</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {selectedProduct.reservedStock}
                  </div>
                  <div className="text-sm text-orange-600">สต็อกจอง</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {selectedProduct.availableStock}
                  </div>
                  <div className="text-sm text-green-600">พร้อมขาย</div>
                </div>
              </div>

              {/* การตั้งค่าสต็อก */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">สต็อกขั้นต่ำ</label>
                  <p>{selectedProduct.minStock}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">สต็อกสูงสุด</label>
                  <p>{selectedProduct.maxStock}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">จุดสั่งซื้อใหม่</label>
                  <p>{selectedProduct.reorderPoint}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">จำนวนสั่งซื้อ</label>
                  <p>{selectedProduct.reorderQuantity}</p>
                </div>
              </div>

              {/* ข้อมูลต้นทุน */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ต้นทุนเฉลี่ย</label>
                  <p className="font-medium">{formatCurrency(selectedProduct.averageCost)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">มูลค่ารวม</label>
                  <p className="font-medium">{formatCurrency(selectedProduct.totalValue)}</p>
                </div>
              </div>

              {/* สถานที่เก็บ */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  สถานที่เก็บ
                </label>
                <div className="space-y-2">
                  {selectedProduct.locations.map((location) => (
                    <div 
                      key={location.locationId}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span>{location.locationName}</span>
                      <Badge variant="outline">{location.quantity} ชิ้น</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* ผู้จัดจำหน่าย */}
              {selectedProduct.supplier && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ผู้จัดจำหน่าย</label>
                  <p>{selectedProduct.supplier.name}</p>
                </div>
              )}

              {/* การเคลื่อนไหวล่าสุด */}
              {selectedProduct.lastMovementDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">การเคลื่อนไหวล่าสุด</label>
                  <p>{new Date(selectedProduct.lastMovementDate).toLocaleDateString('th-TH')}</p>
                </div>
              )}

              {/* สถานะ */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">สถานะสต็อก</label>
                <div className="mt-1">
                  {getStockStatusBadge(selectedProduct.stockStatus)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}