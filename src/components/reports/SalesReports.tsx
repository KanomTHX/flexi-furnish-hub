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
  TrendingUp, 
  Download, 
  Calendar,
  Search,
  Filter,
  DollarSign,
  ShoppingCart,
  Users,
  Package
} from 'lucide-react';
import { SalesReport } from '@/types/reports';
import { formatCurrency, formatNumber } from '@/utils/reportHelpers';

interface SalesReportsProps {
  salesReports: SalesReport[];
  onGenerateReport: () => void;
  onExportReport: () => void;
  loading: boolean;
}

export const SalesReports: React.FC<SalesReportsProps> = ({
  salesReports,
  onGenerateReport,
  onExportReport,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Mock chart data
  const salesChartData = [
    { date: '01/01', sales: 125000, orders: 45 },
    { date: '02/01', sales: 135000, orders: 52 },
    { date: '03/01', sales: 115000, orders: 38 },
    { date: '04/01', sales: 145000, orders: 58 },
    { date: '05/01', sales: 155000, orders: 62 },
    { date: '06/01', sales: 140000, orders: 48 },
    { date: '07/01', sales: 165000, orders: 65 }
  ];

  const topProducts = [
    { name: 'โซฟา 3 ที่นั่ง Modern', sales: 32000, quantity: 8, growth: 12.5 },
    { name: 'เตียงนอน King Size', sales: 25000, quantity: 5, growth: 8.3 },
    { name: 'ตู้เสื้อผ้า 4 บาน', sales: 18000, quantity: 6, growth: -2.1 },
    { name: 'โต๊ะทำงาน Executive', sales: 15000, quantity: 10, growth: 15.7 },
    { name: 'เก้าอี้ทำงาน Ergonomic', sales: 12000, quantity: 15, growth: 5.2 }
  ];

  const salesByCategory = [
    { category: 'โซฟา', sales: 45000, percentage: 36, color: 'bg-blue-500' },
    { category: 'เตียง', sales: 35000, percentage: 28, color: 'bg-green-500' },
    { category: 'ตู้', sales: 25000, percentage: 20, color: 'bg-yellow-500' },
    { category: 'โต๊ะ', sales: 20000, percentage: 16, color: 'bg-purple-500' }
  ];

  const salesTeam = [
    { name: 'สมชาย ใจดี', sales: 45000, orders: 15, commission: 2250, growth: 18.5 },
    { name: 'สมหญิง รักงาน', sales: 38000, orders: 12, commission: 1900, growth: 12.3 },
    { name: 'วิชัย ขยัน', sales: 42000, orders: 18, commission: 2100, growth: 8.7 },
    { name: 'มาลี ขยัน', sales: 35000, orders: 14, commission: 1750, growth: 15.2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">รายงานยอดขาย</h2>
          <p className="text-muted-foreground">
            รายงานและวิเคราะห์ยอดขายทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={onGenerateReport} size="sm" disabled={loading}>
            <TrendingUp className="h-4 w-4 mr-2" />
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
                  placeholder="ค้นหารายงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="today">วันนี้</SelectItem>
                <SelectItem value="week">สัปดาห์นี้</SelectItem>
                <SelectItem value="month">เดือนนี้</SelectItem>
                <SelectItem value="year">ปีนี้</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="เรียงตาม" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">วันที่</SelectItem>
                <SelectItem value="sales">ยอดขาย</SelectItem>
                <SelectItem value="orders">จำนวนออเดอร์</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ยอดขายรวม
                </p>
                <p className="text-2xl font-bold">{formatCurrency(125000)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  จำนวนออเดอร์
                </p>
                <p className="text-2xl font-bold">45</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+8.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ค่าเฉลี่ยต่อออเดอร์
                </p>
                <p className="text-2xl font-bold">{formatCurrency(2778)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+3.8%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
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
                  ลูกค้าใหม่
                </p>
                <p className="text-2xl font-bold">23</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+15.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>แนวโน้มยอดขาย (7 วันล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {salesChartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative">
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-500"
                    style={{ 
                      height: `${(data.sales / 165000) * 200}px`,
                      minHeight: '20px'
                    }}
                  ></div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs font-medium">{data.date}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(data.sales)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>สินค้าขายดี</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ขาย {product.quantity} ชิ้น
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(product.sales)}</p>
                    <div className="flex items-center">
                      <TrendingUp className={`h-3 w-3 mr-1 ${
                        product.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className={`text-xs ${
                        product.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายตามหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesByCategory.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(category.sales)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>ประสิทธิภาพทีมขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">พนักงาน</th>
                  <th className="text-right py-2">ยอดขาย</th>
                  <th className="text-right py-2">ออเดอร์</th>
                  <th className="text-right py-2">คอมมิชชั่น</th>
                  <th className="text-right py-2">เติบโต</th>
                </tr>
              </thead>
              <tbody>
                {salesTeam.map((member, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{member.name}</div>
                    </td>
                    <td className="text-right py-3">
                      {formatCurrency(member.sales)}
                    </td>
                    <td className="text-right py-3">
                      {member.orders}
                    </td>
                    <td className="text-right py-3">
                      {formatCurrency(member.commission)}
                    </td>
                    <td className="text-right py-3">
                      <Badge variant={member.growth > 0 ? 'default' : 'secondary'}>
                        {member.growth > 0 ? '+' : ''}{member.growth}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};