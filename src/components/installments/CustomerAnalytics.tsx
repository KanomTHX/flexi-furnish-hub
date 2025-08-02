import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types/pos';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Star,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';

interface CustomerData extends Customer {
  creditScore?: number;
  totalContracts?: number;
  activeContracts?: number;
  totalFinanced?: number;
  totalPaid?: number;
  overdueAmount?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  lastPaymentDate?: Date;
  customerSince?: Date;
  monthlyIncome?: number;
  occupation?: string;
}

interface CustomerAnalyticsProps {
  customers: CustomerData[];
}

export const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  customers
}) => {
  // คำนวณสถิติต่างๆ
  const analytics = {
    total: customers.length,
    active: customers.filter(c => (c.activeContracts || 0) > 0).length,
    overdue: customers.filter(c => (c.overdueAmount || 0) > 0).length,
    highRisk: customers.filter(c => c.riskLevel === 'high').length,
    averageCreditScore: customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.creditScore || 0), 0) / customers.length) : 0,
    totalFinanced: customers.reduce((sum, c) => sum + (c.totalFinanced || 0), 0),
    totalPaid: customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0),
    totalOverdue: customers.reduce((sum, c) => sum + (c.overdueAmount || 0), 0),
    averageIncome: customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.monthlyIncome || 0), 0) / customers.length) : 0
  };

  // การกระจายตามคะแนนเครดิต
  const creditScoreDistribution = [
    { range: '750-850', count: customers.filter(c => (c.creditScore || 0) >= 750).length, color: 'bg-green-500', label: 'ดีเยี่ยม' },
    { range: '650-749', count: customers.filter(c => (c.creditScore || 0) >= 650 && (c.creditScore || 0) < 750).length, color: 'bg-yellow-500', label: 'ดี' },
    { range: '550-649', count: customers.filter(c => (c.creditScore || 0) >= 550 && (c.creditScore || 0) < 650).length, color: 'bg-orange-500', label: 'พอใช้' },
    { range: '300-549', count: customers.filter(c => (c.creditScore || 0) < 550).length, color: 'bg-red-500', label: 'ต้องปรับปรุง' }
  ];

  // การกระจายตามความเสี่ยง
  const riskDistribution = [
    { level: 'low', count: customers.filter(c => c.riskLevel === 'low').length, color: 'bg-green-500', label: 'ต่ำ' },
    { level: 'medium', count: customers.filter(c => c.riskLevel === 'medium').length, color: 'bg-yellow-500', label: 'ปานกลาง' },
    { level: 'high', count: customers.filter(c => c.riskLevel === 'high').length, color: 'bg-red-500', label: 'สูง' }
  ];

  // การกระจายตามอาชีพ
  const occupationDistribution = customers.reduce((acc, customer) => {
    const occupation = customer.occupation || 'ไม่ระบุ';
    acc[occupation] = (acc[occupation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ลูกค้าใหม่ในแต่ละเดือน (6 เดือนล่าสุด)
  const monthlyNewCustomers = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = customers.filter(c => 
      c.customerSince && c.customerSince >= monthStart && c.customerSince <= monthEnd
    ).length;
    
    monthlyNewCustomers.push({
      month: date.toLocaleDateString('th-TH', { month: 'short' }),
      count
    });
  }

  // Top 5 ลูกค้าตามยอดให้เครดิต
  const topCustomers = customers
    .sort((a, b) => (b.totalFinanced || 0) - (a.totalFinanced || 0))
    .slice(0, 5);

  // ลูกค้าเสี่ยงสูงที่ต้องติดตาม
  const highRiskCustomers = customers
    .filter(c => c.riskLevel === 'high' || (c.overdueAmount || 0) > 0)
    .sort((a, b) => (b.overdueAmount || 0) - (a.overdueAmount || 0))
    .slice(0, 5);

  const paymentRate = analytics.totalFinanced > 0 
    ? Math.round((analytics.totalPaid / analytics.totalFinanced) * 100) 
    : 0;

  const overdueRate = analytics.totalFinanced > 0 
    ? Math.round((analytics.totalOverdue / analytics.totalFinanced) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">การวิเคราะห์ลูกค้า</h2>
        <p className="text-muted-foreground">
          สถิติและการวิเคราะห์ข้อมูลลูกค้าผ่อนชำระ
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
                <p className="text-xs text-green-600">
                  {analytics.active} คนมีสัญญาใช้งาน
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">คะแนนเครดิตเฉลี่ย</p>
                <p className="text-2xl font-bold">{analytics.averageCreditScore}</p>
                <p className="text-xs text-muted-foreground">
                  จาก 850 คะแนน
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">อัตราการชำระ</p>
                <p className="text-2xl font-bold text-green-600">{paymentRate}%</p>
                <p className="text-xs text-muted-foreground">
                  จากยอดให้เครดิตรวม
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">อัตราค้างชำระ</p>
                <p className="text-2xl font-bold text-red-600">{overdueRate}%</p>
                <p className="text-xs text-red-600">
                  {analytics.overdue} คนค้างชำระ
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              การกระจายคะแนนเครดิต
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditScoreDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.range} ({item.label})</span>
                    <span className="text-sm text-muted-foreground">{item.count} คน</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${analytics.total > 0 ? (item.count / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              การกระจายความเสี่ยง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ความเสี่ยง{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.count} คน</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${analytics.total > 0 ? (item.count / analytics.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly New Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ลูกค้าใหม่รายเดือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {monthlyNewCustomers.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-blue-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${Math.max(20, (data.count / Math.max(...monthlyNewCustomers.map(d => d.count), 1)) * 160)}px`
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium">{data.month}</p>
                    <p className="text-xs text-muted-foreground">{data.count} คน</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Occupation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>การกระจายตามอาชีพ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(occupationDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([occupation, count], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{occupation}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{count} คน</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(count / analytics.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ลูกค้าอันดับต้น (ตามยอดให้เครดิต)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        คะแนน {customer.creditScore || 0} • {customer.activeContracts || 0} สัญญา
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ฿{(customer.totalFinanced || 0).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {customer.riskLevel === 'low' ? 'เสี่ยงต่ำ' :
                       customer.riskLevel === 'medium' ? 'เสี่ยงปานกลาง' : 'เสี่ยงสูง'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              ลูกค้าเสี่ยงสูงที่ต้องติดตาม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskCustomers.length > 0 ? (
                highRiskCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          คะแนน {customer.creditScore || 0} • {customer.activeContracts || 0} สัญญา
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        ฿{(customer.overdueAmount || 0).toLocaleString()}
                      </p>
                      <Badge variant="destructive" className="text-xs">
                        ค้างชำระ
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีลูกค้าเสี่ยงสูงในขณะนี้</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            สรุปข้อมูลทางการเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                ฿{analytics.totalFinanced.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">ยอดให้เครดิตรวม</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                ฿{analytics.totalPaid.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">ยอดที่ชำระแล้ว</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                ฿{analytics.totalOverdue.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">ยอดค้างชำระ</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                ฿{analytics.averageIncome.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">รายได้เฉลี่ย/เดือน</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};