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
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Archive
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
  const inventoryStats = {
    totalProducts: 150,
    totalValue: 2500000,
    lowStockItems: 5,
    outOfStockItems: 2,
    slowMovingItems: 8
  };

  const stockByCategory = [
    { category: 'โซฟา', stock: 45, value: 450000, percentage: 30 },
    { category: 'เตียง', stock: 32, value: 320000, percentage: 21 },
    { category: 'ตู้', stock: 28, value: 280000, percentage: 19 },
    { category: 'โต๊ะ', stock: 35, value: 175000, percentage: 23 },
    { category: 'เก้าอี้', stock: 60, value: 180000, percentage: 40 }
  ];

  const lowStockItems = [
    { 
      id: 'prod-001', 
      name: 'เก้าอี้ทำงาน Ergonomic', 
      currentStock: 3, 
      minStock: 10, 
      category: 'เก้าอี้',
      lastOrder: '2024-01-15',
      supplier: 'ABC Furniture'
    },
    { 
      id: 'prod-002', 
      name: 'โต๊ะกาแฟ Glass Top', 
      currentStock: 2, 
      minStock: 8, 
      category: 'โต๊ะ',
      lastOrder: '2024-01-10',
      supplier: 'Modern Living'
    },
    { 
      id: 'prod-003', 
      name: 'โซฟา 2 ที่นั่ง Compact', 
      currentStock: 1, 
      minStock: 5, 
      category: 'โซฟา',
      lastOrder: '2024-01-08',
      supplier: 'Comfort Zone'
    }
  ];

  const slowMovingItems = [
    {
      id: 'prod-004',
      name: 'ตู้โชว์ Vintage',
      currentStock: 5,
      lastSaleDate: '2023-11-15',
      daysWithoutSale: 47,
      category: 'ตู้',
      value: 25000
    },
    {
      id: 'prod-005',
      name: 'โคมไฟตั้งพื้น Classic',
      currentStock: 8,
      lastSaleDate: '2023-12-01',
      daysWithoutSale: 31,
      category: 'อุปกรณ์ตแต่ง',
      value: 12000
    }
  ];

  const stockMovements = [
    {
      date: '2024-01-01',
      product: 'โซฟา 3 ที่นั่ง Modern',
      type: 'OUT',
      quantity: 2,
      reason: 'ขายให้ลูกค้า',
      reference: 'SO-001'
    },
    {
      date: '2024-01-01',
      product: 'เตียงเด็ก Safety',
      type: 'IN',
      quantity: 10,
      reason: 'รับสินค้าใหม่',
      reference: 'PO-001'
    },
    {
      date: '2024-01-01',
      product: 'ตู้เสื้อผ้า 4 บาน',
      type: 'ADJUSTMENT',
      quantity: -1,
      reason: 'สินค้าเสียหาย',
      reference: 'ADJ-001'
    }
  ];

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
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                <SelectItem value="sofa">โซฟา</SelectItem>
                <SelectItem value="bed">เตียง</SelectItem>
                <SelectItem value="cabinet">ตู้</SelectItem>
                <SelectItem value="table">โต๊ะ</SelectItem>
                <SelectItem value="chair">เก้าอี้</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะสต็อก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="normal">ปกติ</SelectItem>
                <SelectItem value="low">ใกล้หมด</SelectItem>
                <SelectItem value="out">หมด</SelectItem>
                <SelectItem value="slow">ไม่เคลื่อนไหว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  สินค้าทั้งหมด
                </p>
                <p className="text-2xl font-bold">{formatNumber(inventoryStats.totalProducts)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
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
                <p className="text-2xl font-bold">{formatCurrency(inventoryStats.totalValue)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  สินค้าใกล้หมด
                </p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  สินค้าหมด
                </p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <Archive className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ไม่เคลื่อนไหว
                </p>
                <p className="text-2xl font-bold text-purple-600">{inventoryStats.slowMovingItems}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <Card>
          <CardHeader>
            <CardTitle>สต็อกตามหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockByCategory.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.stock} ชิ้น
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(category.stock / 60) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    มูลค่า: {formatCurrency(category.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              สินค้าใกล้หมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • ผู้จำหน่าย: {item.supplier}
                    </p>
                    <p className="text-sm text-orange-600">
                      เหลือ {item.currentStock} ชิ้น (ขั้นต่ำ {item.minStock} ชิ้น)
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-2">
                      ต้องสั่งซื้อ
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      สั่งล่าสุด: {item.lastOrder}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slow Moving Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-purple-600" />
            สินค้าไม่เคลื่อนไหว
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">สินค้า</th>
                  <th className="text-left py-2">หมวดหมู่</th>
                  <th className="text-right py-2">สต็อกปัจจุบัน</th>
                  <th className="text-right py-2">ขายล่าสุด</th>
                  <th className="text-right py-2">วันที่ไม่ขาย</th>
                  <th className="text-right py-2">มูลค่า</th>
                </tr>
              </thead>
              <tbody>
                {slowMovingItems.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">#{item.id}</div>
                    </td>
                    <td className="py-3">{item.category}</td>
                    <td className="text-right py-3">{item.currentStock}</td>
                    <td className="text-right py-3">
                      {new Date(item.lastSaleDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="text-right py-3">
                      <Badge variant="secondary">
                        {item.daysWithoutSale} วัน
                      </Badge>
                    </td>
                    <td className="text-right py-3">
                      {formatCurrency(item.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>การเคลื่อนไหวสต็อกล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockMovements.map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    movement.type === 'IN' ? 'bg-green-100 text-green-600' :
                    movement.type === 'OUT' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{movement.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {movement.reason} • {movement.reference}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      movement.type === 'IN' ? 'default' :
                      movement.type === 'OUT' ? 'secondary' : 'destructive'
                    }>
                      {movement.type === 'IN' ? 'เข้า' :
                       movement.type === 'OUT' ? 'ออก' : 'ปรับปรุง'}
                    </Badge>
                    <span className="font-medium">
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(movement.date).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};