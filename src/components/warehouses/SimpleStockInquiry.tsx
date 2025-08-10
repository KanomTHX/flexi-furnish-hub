import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Package, Warehouse, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSimpleStock } from '@/hooks/useSimpleStock';
import { useWarehouses } from '@/hooks/useWarehousesEnhanced';

export function SimpleStockInquiry() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Hooks
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  const { stockLevels, loading, error, filters, setFilters, refetch, summary } = useSimpleStock();

  // Update filters when they change
  React.useEffect(() => {
    setFilters({
      searchTerm: searchTerm.trim() || undefined,
      warehouseId: selectedWarehouse && selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined
    });
  }, [searchTerm, selectedWarehouse, selectedStatus, setFilters]);

  // Group stock levels by product for better display
  const groupedStock = useMemo(() => {
    const groups = new Map<string, typeof stockLevels>();
    
    stockLevels.forEach(stock => {
      const key = `${stock.productId}-${stock.productName}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(stock);
    });

    return Array.from(groups.entries()).map(([key, stocks]) => ({
      productId: stocks[0].productId,
      productName: stocks[0].productName,
      productCode: stocks[0].productCode,
      warehouses: stocks,
      totalQuantity: stocks.reduce((sum, s) => sum + s.quantity, 0),
      totalAvailable: stocks.reduce((sum, s) => sum + s.availableQuantity, 0),
      totalValue: stocks.reduce((sum, s) => sum + s.totalValue, 0)
    }));
  }, [stockLevels]);

  const getStockStatusBadge = (available: number, total: number) => {
    if (available === 0) {
      return <Badge variant="destructive">หมด</Badge>;
    } else if (available <= 5) {
      return <Badge variant="secondary">เหลือน้อย</Badge>;
    } else {
      return <Badge variant="default">พร้อมจำหน่าย</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'text-green-600';
      case 'low_stock':
        return 'text-yellow-600';
      case 'out_of_stock':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'พร้อมจำหน่าย';
      case 'low_stock':
        return 'เหลือน้อย';
      case 'out_of_stock':
        return 'หมด';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>เกิดข้อผิดพลาด: {error}</p>
            <Button onClick={refetch} className="mt-2">
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            ค้นหาและตรวจสอบสต็อก
          </CardTitle>
          <CardDescription>
            ค้นหาสินค้าจากชื่อ รหัสสินค้า หรือชื่อคลัง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={refetch} disabled={loading}>
              {loading ? 'กำลังโหลด...' : 'ค้นหา'}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกคลัง/สาขา" />
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะสต็อก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="in_stock">พร้อมจำหน่าย</SelectItem>
                <SelectItem value="low_stock">เหลือน้อย</SelectItem>
                <SelectItem value="out_of_stock">หมด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">รายการสินค้า</p>
                <p className="text-2xl font-bold">{summary.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">จำนวนทั้งหมด</p>
                <p className="text-2xl font-bold">{summary.totalQuantity}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">พร้อมจำหน่าย</p>
                <p className="text-2xl font-bold">{summary.availableQuantity}</p>
              </div>
              <Warehouse className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                <p className="text-2xl font-bold">
                  ฿{summary.totalValue.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>ผลการค้นหา ({stockLevels.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">กำลังโหลด...</p>
            </div>
          ) : stockLevels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>คลัง/สาขา</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">พร้อมจำหน่าย</TableHead>
                    <TableHead className="text-right">มูลค่า</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>อัปเดตล่าสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLevels.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.productCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{stock.productName}</p>
                          {stock.productDescription && (
                            <p className="text-sm text-muted-foreground">
                              {stock.productDescription}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{stock.warehouseName}</p>
                          <p className="text-sm text-muted-foreground">{stock.warehouseCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stock.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {stock.availableQuantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{stock.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={stock.status === 'in_stock' ? 'default' : 
                                  stock.status === 'low_stock' ? 'secondary' : 'destructive'}
                        >
                          {getStatusText(stock.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stock.lastUpdated.toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped View (Alternative) */}
      {groupedStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>มุมมองแบบกลุ่มสินค้า ({groupedStock.length} กลุ่ม)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedStock.map((group) => (
                <Card key={group.productId} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{group.productName}</h3>
                        <p className="text-sm text-muted-foreground">รหัส: {group.productCode}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            รวม: <span className="font-medium">{group.totalQuantity}</span> ชิ้น
                          </span>
                          <span className="text-sm">
                            พร้อมจำหน่าย: <span className="font-medium text-green-600">{group.totalAvailable}</span> ชิ้น
                          </span>
                          <span className="text-sm">
                            มูลค่า: <span className="font-medium">฿{group.totalValue.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                      {getStockStatusBadge(group.totalAvailable, group.totalQuantity)}
                    </div>

                    {/* Warehouse Breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">กระจายตามคลัง/สาขา:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {group.warehouses.map((stock) => (
                          <div
                            key={`${stock.productId}-${stock.warehouseId}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded"
                          >
                            <div>
                              <p className="font-medium text-sm">{stock.warehouseName}</p>
                              <p className="text-xs text-muted-foreground">
                                {stock.availableQuantity}/{stock.quantity} ชิ้น
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStockStatusBadge(stock.availableQuantity, stock.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}