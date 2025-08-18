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
import { formatCurrency, formatNumber } from '@/utils/reportHelpers';
import { useSalesReports } from '@/hooks/useSalesReports';

export const SalesReports: React.FC = () => {
  const {
    salesSummary,
    salesChartData,
    topProducts,
    salesByCategory,
    salesTeam,
    loading,
    error,
    generateReport,
    exportReport
  } = useSalesReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // แสดงข้อความเมื่อไม่มีข้อมูล
  if (!salesSummary && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">ไม่มีข้อมูลรายงานยอดขาย</p>
      </div>
    );
  }

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
          <Button onClick={exportReport} variant="outline" size="sm" disabled={!salesSummary}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={generateReport} size="sm" disabled={loading}>
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
                <p className="text-2xl font-bold">{formatCurrency(salesSummary?.totalSales || 0)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    (salesSummary?.salesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    (salesSummary?.salesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(salesSummary?.salesGrowth || 0) >= 0 ? '+' : ''}{(salesSummary?.salesGrowth || 0).toFixed(1)}%
                  </span>
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
                <p className="text-2xl font-bold">{salesSummary?.totalOrders || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    (salesSummary?.ordersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    (salesSummary?.ordersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(salesSummary?.ordersGrowth || 0) >= 0 ? '+' : ''}{(salesSummary?.ordersGrowth || 0).toFixed(1)}%
                  </span>
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
                <p className="text-2xl font-bold">{formatCurrency(salesSummary?.averageOrderValue || 0)}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    (salesSummary?.avgOrderGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    (salesSummary?.avgOrderGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(salesSummary?.avgOrderGrowth || 0) >= 0 ? '+' : ''}{(salesSummary?.avgOrderGrowth || 0).toFixed(1)}%
                  </span>
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
                <p className="text-2xl font-bold">{salesSummary?.newCustomers || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    (salesSummary?.newCustomersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm ${
                    (salesSummary?.newCustomersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(salesSummary?.newCustomersGrowth || 0) >= 0 ? '+' : ''}{(salesSummary?.newCustomersGrowth || 0).toFixed(1)}%
                  </span>
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
            {salesChartData.length > 0 ? salesChartData.map((data, index) => {
              const maxSales = Math.max(...salesChartData.map(d => d.sales));
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-blue-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${maxSales > 0 ? (data.sales / maxSales) * 200 : 20}px`,
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
              );
            }) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-muted-foreground">ไม่มีข้อมูลแนวโน้มยอดขาย</p>
              </div>
            )}
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