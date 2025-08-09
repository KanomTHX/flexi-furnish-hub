import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Eye, Package, Warehouse, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useStock } from '@/hooks/useStock';
import { useWarehouses } from '@/hooks/useWarehousesEnhanced';
import type { StockLevel, SerialNumber, StockMovement, StockSearchFilters } from '@/types/warehouseStock';
import { StockCard } from './StockCard';
import { MovementLog } from './MovementLog';
import { SNList } from './SNList';
import { DatabaseConnectionTest } from './DatabaseConnectionTest';

interface StockInquiryProps {
  searchFilters?: StockSearchFilters;
  onFilterChange?: (filters: StockSearchFilters) => void;
  onSerialNumberSelect?: (serialNumber: SerialNumber) => void;
}

export function StockInquiry({ 
  searchFilters = {}, 
  onFilterChange,
  onSerialNumberSelect 
}: StockInquiryProps) {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState(searchFilters.searchTerm || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(searchFilters.warehouseId || '');
  const [selectedCategory, setSelectedCategory] = useState(searchFilters.category || '');
  const [selectedStatus, setSelectedStatus] = useState(searchFilters.status || '');
  const [searchType, setSearchType] = useState<'all' | 'name' | 'brand' | 'model' | 'sn'>('all');
  
  // State for selected item details
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [showSerialNumbers, setShowSerialNumbers] = useState(false);

  // Hooks
  const { warehouses, loading: warehousesLoading } = useWarehouses();
  
  // Build filters for useStock hook
  const stockFilters = useMemo(() => ({
    ...searchFilters,
    searchTerm: searchTerm.trim() || undefined,
    warehouseId: selectedWarehouse && selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
    category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined
  }), [searchFilters, searchTerm, selectedWarehouse, selectedCategory, selectedStatus]);

  const {
    stockLevels,
    serialNumbers,
    movements,
    loading,
    error,
    setFilters,
    refetch,
    getSerialNumbersByProduct,
    summary
  } = useStock({ autoFetch: true });

  // Update filters when they change
  useEffect(() => {
    setFilters(stockFilters);
    onFilterChange?.(stockFilters);
  }, [stockFilters, setFilters, onFilterChange]);

  // Filter stock levels based on search criteria
  const filteredStockLevels = useMemo(() => {
    let filtered = stockLevels;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(stock => {
        switch (searchType) {
          case 'name':
            return stock.productName.toLowerCase().includes(term);
          case 'brand':
            // Assuming brand is part of product name or we have brand field
            return stock.productName.toLowerCase().includes(term);
          case 'model':
            // Assuming model is part of product name or we have model field
            return stock.productName.toLowerCase().includes(term);
          case 'sn':
            // For SN search, we need to check if any serial numbers match
            const productSNs = getSerialNumbersByProduct(stock.productId, stock.warehouseId);
            return productSNs.some(sn => sn.serialNumber.toLowerCase().includes(term));
          default:
            return (
              stock.productName.toLowerCase().includes(term) ||
              stock.productCode.toLowerCase().includes(term) ||
              stock.warehouseName.toLowerCase().includes(term)
            );
        }
      });
    }

    return filtered;
  }, [stockLevels, searchTerm, searchType, getSerialNumbersByProduct]);

  // Group stock levels by product for better display
  const groupedStock = useMemo(() => {
    const groups = new Map<string, StockLevel[]>();
    
    filteredStockLevels.forEach(stock => {
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
      totalQuantity: stocks.reduce((sum, s) => sum + s.totalQuantity, 0),
      totalAvailable: stocks.reduce((sum, s) => sum + s.availableQuantity, 0),
      totalValue: stocks.reduce((sum, s) => sum + s.availableValue, 0)
    }));
  }, [filteredStockLevels]);

  const handleProductSelect = (stockLevel: StockLevel) => {
    setSelectedProduct(stockLevel);
  };

  const handleSerialNumberSelect = (serialNumber: SerialNumber) => {
    onSerialNumberSelect?.(serialNumber);
  };

  const getStockStatusBadge = (available: number, total: number) => {
    if (available === 0) {
      return <Badge variant="destructive">หมด</Badge>;
    } else if (available <= 5) {
      return <Badge variant="secondary">เหลือน้อย</Badge>;
    } else {
      return <Badge variant="default">พร้อมจำหน่าย</Badge>;
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
            ค้นหาสินค้าจากชื่อ แบรนด์ รุ่น หรือ Serial Number
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
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="name">ชื่อสินค้า</SelectItem>
                <SelectItem value="brand">แบรนด์</SelectItem>
                <SelectItem value="model">รุ่น</SelectItem>
                <SelectItem value="sn">Serial Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                <SelectItem value="furniture">เฟอร์นิเจอร์</SelectItem>
                <SelectItem value="electronics">เครื่องใช้ไฟฟ้า</SelectItem>
                <SelectItem value="appliances">เครื่องใช้ในบ้าน</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะสต็อก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="available">พร้อมจำหน่าย</SelectItem>
                <SelectItem value="low">เหลือน้อย</SelectItem>
                <SelectItem value="out">หมด</SelectItem>
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
                <p className="text-2xl font-bold">{groupedStock.length}</p>
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
          <CardTitle>ผลการค้นหา ({groupedStock.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">กำลังโหลด...</p>
            </div>
          ) : groupedStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
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
                            className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleProductSelect(stock)}
                          >
                            <div>
                              <p className="font-medium text-sm">{stock.warehouseName}</p>
                              <p className="text-xs text-muted-foreground">
                                {stock.availableQuantity}/{stock.totalQuantity} ชิ้น
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStockStatusBadge(stock.availableQuantity, stock.totalQuantity)}
                              <Button size="sm" variant="ghost" onClick={() => handleProductSelect(stock)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>รายละเอียดสินค้า</DialogTitle>
            <DialogDescription>
              {selectedProduct?.productName} - {selectedProduct?.warehouseName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
                <TabsTrigger value="serial-numbers">Serial Numbers</TabsTrigger>
                <TabsTrigger value="movements">ประวัติการเคลื่อนไหว</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <StockCard 
                  stockLevel={selectedProduct} 
                  onClick={() => {}} 
                  showDetails={true}
                />
              </TabsContent>
              
              <TabsContent value="serial-numbers">
                <SNList
                  serialNumbers={getSerialNumbersByProduct(selectedProduct.productId, selectedProduct.warehouseId)}
                  onSelect={handleSerialNumberSelect}
                  selectable={true}
                />
              </TabsContent>
              
              <TabsContent value="movements">
                <MovementLog
                  movements={movements.filter(m => 
                    m.productId === selectedProduct.productId && 
                    m.warehouseId === selectedProduct.warehouseId
                  )}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}