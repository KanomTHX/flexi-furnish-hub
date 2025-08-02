import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Package,
  Calendar,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';
import { Sale } from '@/types/pos';

interface SalesAnalyticsProps {
  sales: Sale[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ sales }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate analytics
  const analytics = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    averageOrderValue: sales.length > 0 
      ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
      : 0,
    totalItems: sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    ),
    uniqueCustomers: new Set(sales.filter(s => s.customerId).map(s => s.customerId)).size,
    totalDiscount: sales.reduce((sum, sale) => sum + sale.discount, 0),
    totalTax: sales.reduce((sum, sale) => sum + sale.tax, 0)
  };

  // Sales by payment method
  const paymentMethodStats = sales.reduce((acc, sale) => {
    const method = sale.paymentMethod?.name || 'ไม่ระบุ';
    acc[method] = (acc[method] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  // Sales by time period (last 7 days)
  const dailySales = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const daySales = sales.filter(sale => 
      sale.createdAt.split('T')[0] === dateStr
    );
    
    dailySales.push({
      date: date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }),
      sales: daySales.length,
      revenue: daySales.reduce((sum, sale) => sum + sale.total, 0)
    });
  }

  // Top selling products
  const productStats = sales.flatMap(sale => sale.items).reduce((acc, item) => {
    const productId = item.product.id;
    if (!acc[productId]) {
      acc[productId] = {
        product: item.product,
        quantity: 0,
        revenue: 0
      };
    }
    acc[productId].quantity += item.quantity;
    acc[productId].revenue += item.totalPrice;
    return acc;
  }, {} as Record<string, { product: any, quantity: number, revenue: number }>);

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Sales by hour (for today)
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => sale.createdAt.split('T')[0] === today);
  
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
    const hourSales = todaySales.filter(sale => {
      const saleHour = new Date(sale.createdAt).getHours();
      return saleHour === hour;
    });
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sales: hourSales.length,
      revenue: hourSales.reduce((sum, sale) => sum + sale.total, 0)
    };
  }).filter(stat => stat.sales > 0);

  // Customer analysis
  const customerSales = sales.filter(s => s.customer).reduce((acc, sale) => {
    const customerId = sale.customerId!;
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: sale.customer!,
        totalSpent: 0,
        orderCount: 0,
        lastOrder: sale.createdAt
      };
    }
    acc[customerId].totalSpent += sale.total;
    acc[customerId].orderCount += 1;
    if (new Date(sale.createdAt) > new Date(acc[customerId].lastOrder)) {
      acc[customerId].lastOrder = sale.createdAt;
    }
    return acc;
  }, {} as Record<string, any>);

  const topCustomers = Object.values(customerSales)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ยอดขายรวม</p>
                <p className="text-2xl font-bold">{analytics.totalSales}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalItems} รายการ
                </p>
              </div>
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ภาษี {formatCurrency(analytics.totalTax)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ค่าเฉลี่ยต่อบิล</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.averageOrderValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ส่วนลด {formatCurrency(analytics.totalDiscount)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าเฉพาะ</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.uniqueCustomers}</p>
                <p className="text-xs text-muted-foreground">
                  จาก {analytics.totalSales} บิล
                </p>
              </div>
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ยอดขายรายวัน (7 วันล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {dailySales.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-blue-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${Math.max(20, (data.revenue / Math.max(...dailySales.map(d => d.revenue), 1)) * 120)}px`
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium">{data.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.sales} บิล
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(data.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              วิธีการชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(paymentMethodStats)
                .sort(([,a], [,b]) => b - a)
                .map(([method, amount], index) => {
                  const percentage = (amount / analytics.totalRevenue) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{method}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              สินค้าขายดี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-xs">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ขาย {item.quantity} ชิ้น
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ลูกค้าอันดับต้น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer: any, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.orderCount} ออเดอร์
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ไม่มีข้อมูลลูกค้า</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Sales (Today) */}
      {hourlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              ยอดขายตามช่วงเวลา (วันนี้)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-start gap-1 overflow-x-auto">
              {hourlyStats.map((data, index) => (
                <div key={index} className="flex flex-col items-center min-w-[40px]">
                  <div className="w-8 bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-green-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${Math.max(10, (data.revenue / Math.max(...hourlyStats.map(d => d.revenue), 1)) * 80)}px`
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    <p className="text-xs font-medium">{data.hour}</p>
                    <p className="text-xs text-muted-foreground">{data.sales}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปข้อมูลการขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {analytics.totalItems}
              </p>
              <p className="text-sm text-muted-foreground">สินค้าที่ขายทั้งหมด</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalTax)}
              </p>
              <p className="text-sm text-muted-foreground">ภาษีที่เก็บได้</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(analytics.totalDiscount)}
              </p>
              <p className="text-sm text-muted-foreground">ส่วนลดที่ให้</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};