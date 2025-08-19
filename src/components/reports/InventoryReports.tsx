import React, { useState, useEffect } from 'react';
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
import { 
  InventoryReportService, 
  InventorySummary, 
  LowStockItem, 
  SlowMovingItem, 
  StockMovement, 
  CategoryBreakdown 
} from '@/services/inventoryReportService';
import { useToast } from '@/hooks/use-toast';

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
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  // Real inventory data from database
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    slowMovingItems: 0,
    fastMovingItems: 0
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [slowMovingItems, setSlowMovingItems] = useState<SlowMovingItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);

  // Load inventory data from database
  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setDataLoading(true);
      const [
        summary,
        lowStock,
        slowMoving,
        movements,
        categories
      ] = await Promise.all([
        InventoryReportService.getInventorySummary(),
        InventoryReportService.getLowStockItems(),
        InventoryReportService.getSlowMovingItems(),
        InventoryReportService.getRecentStockMovements(),
        InventoryReportService.getCategoryBreakdown()
      ]);

      setInventorySummary(summary);
      setLowStockItems(lowStock);
      setSlowMovingItems(slowMoving);
      setStockMovements(movements);
      setCategoryBreakdown(categories);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลรายงานสต็อกได้',
        variant: 'destructive'
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      await loadInventoryData();
      onGenerateReport();
      toast({
        title: 'สำเร็จ',
        description: 'สร้างรายงานสต็อกสินค้าเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายงานได้',
        variant: 'destructive'
      });
    }
  };

  // Handle report export
  const handleExportReport = async () => {
    try {
      await InventoryReportService.exportInventoryReport();
      onExportReport();
      toast({
        title: 'สำเร็จ',
        description: 'ส่งออกรายงานสต็อกสินค้าเรียบร้อยแล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกรายงานได้',
        variant: 'destructive'
      });
    }
  };

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
          <Button onClick={handleExportReport} variant="outline" size="sm" disabled={dataLoading}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={handleGenerateReport} size="sm" disabled={loading || dataLoading}>
            <Package className="h-4 w-4 mr-2" />
            {loading || dataLoading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
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