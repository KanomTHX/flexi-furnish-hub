import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Download, 
  AlertTriangle,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { InventoryReport } from '@/types/reports';
import { formatCurrency, formatNumber } from '@/utils/reportHelpers';

interface InventoryReportsProps {
  inventoryReports: InventoryReport[];
  onGenerateReport: () => void;
  onExportReport: () => void;
  loading: boolean;
}

export const InventoryReports: React.FC<InventoryReportsProps> = ({
  inventoryReports,
  onGenerateReport,
  onExportReport,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock inventory data
  const inventorySummary = {
    totalProducts: 1250,
    totalValue: 2850000,
    lowStockItems: 45,
    outOfStockItems: 12,
    slowMovingItems: 28,
    fastMovingItems: 156
  };

  const lowStockItems = [
    { name: 'โซฟา 2 ที่นั่ง Classic', currentStock: 2, minStock: 5, reorderLevel: 10, value: 45000 },
    { name: 'เตียงนอน Queen Size', currentStock: 1, minStock: 3, reorderLevel: 8, value: 28000 },
    { name: 'ตู้เสื้อผ้า 3 บาน', currentStock: 3, minStock: 5, reorderLevel: 12, value: 36000 },
    { name: 'โต๊ะกาแฟ Glass Top', currentStock: 4, minStock: 8, reorderLevel: 15, value: 18000 },
    { name: 'เก้าอี้ผู้บริหาร', currentStock: 2, minStock: 6, reorderLevel: 10, value: 25000 }
  ];

  const slowMovingItems = [
    { name: 'ตู้โชว์ไม้สัก', lastSaleDate: '2024-01-15', daysWithoutSale: 45, currentStock: 8, value: 120000 },
    { name: 'โซฟาหนัง 3 ที่นั่ง', lastSaleDate: '2024-01-20', daysWithoutSale: 40, currentStock: 5, value: 85000 },
    { name: 'เตียงไม้แท้ King Size', lastSaleDate: '2024-01-25', daysWithoutSale: 35, currentStock: 3, value: 95000 },
    { name: 'โต๊ะทำงานไม้โอ๊ค', lastSaleDate: '2024-02-01', daysWithoutSale: 28, currentStock: 6, value: 45000 }
  ];

  const stockMovements = [
    { product: 'โซฟา Modern 3 ที่นั่ง', type: 'IN', quantity: 10, date: '2024-02-28', reason: 'รับสินค้าจากผู้จัดจำหน่าย' },
    { product: 'เตียงนอน King Size', type: 'OUT', quantity: 2, date: '2024-02-28', reason: 'ขายให้ลูกค้า' },
    { product: 'ตู้เสื้อผ้า 4 บาน', type: 'OUT', quantity: 1, date: '2024-02-27', reason: 'ขายให้ลูกค้า' },
    { product: 'โต๊ะกาแฟ Marble', type: 'ADJUSTMENT', quantity: -1, date: '2024-02-27', reason: 'สินค้าชำรุด' },
    { product: 'เก้าอี้ทำงาน Ergonomic', type: 'IN', quantity: 15, date: '2024-02-26', reason: 'รับสินค้าจากผู้จัดจำหน่าย' }
  ];

  const categoryBreakdown = [
    { category: 'โซฟา', products: 45, value: 850000, percentage: 30, trend: 5.2 },
    { category: 'เตียง', products: 32, value: 720000, percentage: 25, trend: 8.1 },
    { category: 'ตู้', products: 28, value: 680000, percentage: 24, trend: -2.3 },
    { category: 'โต๊ะ', products: 38, value: 420000, percentage: 15, trend: 12.5 },
    { category: 'เก้าอี้', products: 25, value: 180000, percentage: 6, trend: 3.8 }
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800';
      case 'OUT':
        return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">รายงานสต็อกสินค้า</h2>
          <p className="text-muted-foreground">
            รายงานและวิเคราะห์สต็อกสินค้าทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={onGenerateReport} size="sm" disabled={loading}>
            <Package className="h-4 w-4 mr-2" />
            {loading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="sofa">โซฟา</SelectItem>
                <SelectItem value="bed">เตียง</SelectItem>
                <SelectItem value="cabinet">ตู้</SelectItem>
                <SelectItem value="table">โต๊ะ</SelectItem>
                <SelectItem value="chair">เก้าอี้</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="สถานะสต็อก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="in_stock">มีสต็อก</SelectItem>
                <SelectItem value="low_stock">สต็อกต่ำ</SelectItem>
                <SelectItem value="out_of_stock">หมดสต็อก</SelectItem>
                <SelectItem value="slow_moving">เคลื่อนไหวช้า</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  สินค้าทั้งหมด
                </p>
                <p className="text-2xl font-bold">{formatNumber(inventorySummary.totalProducts)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  มูลค่ารวม
                </p>
                <p className="text-2xl font-bold">{formatCurrency(inventorySummary.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  สต็อกต่ำ
                </p>
                <p className="text-2xl font-bold text-orange-600">{inventorySummary.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  หมดสต็อก
                </p>
                <p className="text-2xl font-bold text-red-600">{inventorySummary.outOfStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  เคลื่อนไหวช้า
                </p>
                <p className="text-2xl font-bold text-yellow-600">{inventorySummary.slowMovingItems}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  เคลื่อนไหวเร็ว
                </p>
                <p className="text-2xl font-bold text-purple-600">{inventorySummary.fastMovingItems}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            การกระจายตามหมวดหมู่
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.products} รายการ
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(category.value)}</span>
                    <div className="flex items-center">
                      {category.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      <span className={`text-xs ${
                        category.trend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.trend > 0 ? '+' : ''}{category.trend}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              สินค้าสต็อกต่ำ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      คงเหลือ: {item.currentStock} | ขั้นต่ำ: {item.minStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      ต้องสั่ง {item.reorderLevel - item.currentStock} ชิ้น
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Slow Moving Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-4 w-4" />
              สินค้าเคลื่อนไหวช้า
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slowMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ขายครั้งสุดท้าย: {new Date(item.lastSaleDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600">
                      {item.daysWithoutSale} วัน
                    </p>
                    <p className="text-sm text-muted-foreground">
                      คงเหลือ {item.currentStock} ชิ้น
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>การเคลื่อนไหวสต็อกล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stockMovements.map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getMovementIcon(movement.type)}
                  <div>
                    <p className="font-medium">{movement.product}</p>
                    <p className="text-sm text-muted-foreground">{movement.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getMovementColor(movement.type)}>
                    {movement.type === 'IN' ? 'รับเข้า' : 
                     movement.type === 'OUT' ? 'จ่ายออก' : 'ปรับปรุง'}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">
                      {movement.type === 'OUT' || (movement.type === 'ADJUSTMENT' && movement.quantity < 0) ? '-' : '+'}
                      {Math.abs(movement.quantity)} ชิ้น
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(movement.date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};