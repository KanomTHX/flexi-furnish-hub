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
  DollarSign, 
  Download, 
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Calculator,
  CreditCard,
  Wallet
} from 'lucide-react';
import { FinancialReport } from '@/types/reports';
import { formatCurrency, formatNumber } from '@/utils/reportHelpers';

interface FinancialReportsProps {
  financialReports: FinancialReport[];
  onGenerateReport: () => void;
  onExportReport: () => void;
  loading: boolean;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  financialReports,
  onGenerateReport,
  onExportReport,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('month');
  const [reportType, setReportType] = useState('summary');

  // Mock financial data
  const financialSummary = {
    revenue: 2850000,
    expenses: 1950000,
    profit: 900000,
    profitMargin: 31.6,
    accountsReceivable: 450000,
    accountsPayable: 320000,
    cashFlow: 580000
  };

  const monthlyTrends = [
    { month: 'ม.ค.', revenue: 2200000, expenses: 1800000, profit: 400000 },
    { month: 'ก.พ.', revenue: 2450000, expenses: 1850000, profit: 600000 },
    { month: 'มี.ค.', revenue: 2850000, expenses: 1950000, profit: 900000 },
    { month: 'เม.ย.', revenue: 2650000, expenses: 1900000, profit: 750000 },
    { month: 'พ.ค.', revenue: 2950000, expenses: 2000000, profit: 950000 },
    { month: 'มิ.ย.', revenue: 3100000, expenses: 2100000, profit: 1000000 }
  ];

  const expenseBreakdown = [
    { category: 'ต้นทุนสินค้า', amount: 1200000, percentage: 61.5, color: 'bg-red-500' },
    { category: 'เงินเดือนพนักงาน', amount: 350000, percentage: 17.9, color: 'bg-blue-500' },
    { category: 'ค่าเช่าและสาธารณูปโภค', amount: 180000, percentage: 9.2, color: 'bg-green-500' },
    { category: 'การตลาดและโฆษณา', amount: 120000, percentage: 6.2, color: 'bg-yellow-500' },
    { category: 'อื่นๆ', amount: 100000, percentage: 5.1, color: 'bg-purple-500' }
  ];

  const revenueStreams = [
    { source: 'ขายหน้าร้าน', amount: 1850000, percentage: 64.9, growth: 12.5 },
    { source: 'ขายออนไลน์', amount: 650000, percentage: 22.8, growth: 25.3 },
    { source: 'ขายส่ง', amount: 250000, percentage: 8.8, growth: -5.2 },
    { source: 'บริการติดตั้ง', amount: 100000, percentage: 3.5, growth: 18.7 }
  ];

  const cashFlowData = [
    { date: '01/03', inflow: 450000, outflow: 380000, netFlow: 70000, balance: 1250000 },
    { date: '08/03', inflow: 520000, outflow: 420000, netFlow: 100000, balance: 1350000 },
    { date: '15/03', inflow: 480000, outflow: 450000, netFlow: 30000, balance: 1380000 },
    { date: '22/03', inflow: 650000, outflow: 520000, netFlow: 130000, balance: 1510000 },
    { date: '29/03', inflow: 580000, outflow: 480000, netFlow: 100000, balance: 1610000 }
  ];

  const keyRatios = [
    { name: 'อัตรากำไรขั้นต้น', value: 57.9, unit: '%', trend: 2.3, good: true },
    { name: 'อัตรากำไรสุทธิ', value: 31.6, unit: '%', trend: 1.8, good: true },
    { name: 'อัตราส่วนหนี้ต่อทุน', value: 0.71, unit: ':1', trend: -0.05, good: true },
    { name: 'อัตราหมุนเวียนสินค้า', value: 4.2, unit: 'ครั้ง', trend: 0.3, good: true },
    { name: 'ระยะเวลาเก็บหนี้', value: 28, unit: 'วัน', trend: -2, good: true },
    { name: 'ระยะเวลาจ่ายหนี้', value: 35, unit: 'วัน', trend: 1, good: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">รายงานการเงิน</h2>
          <p className="text-muted-foreground">
            รายงานและวิเคราะห์ข้อมูลทางการเงิน
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={onGenerateReport} size="sm" disabled={loading}>
            <Calculator className="h-4 w-4 mr-2" />
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
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">สัปดาห์นี้</SelectItem>
                <SelectItem value="month">เดือนนี้</SelectItem>
                <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
                <SelectItem value="year">ปีนี้</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ประเภทรายงาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">สรุปภาพรวม</SelectItem>
                <SelectItem value="profit_loss">กำไรขาดทุน</SelectItem>
                <SelectItem value="balance_sheet">งบดุล</SelectItem>
                <SelectItem value="cash_flow">กระแสเงินสด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  รายได้รวม
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialSummary.revenue)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+16.3%</span>
                </div>
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
                  ค่าใช้จ่ายรวม
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialSummary.expenses)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-red-600" />
                  <span className="text-sm text-red-600">+8.5%</span>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  กำไรสุทธิ
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialSummary.profit)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+50.0%</span>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  อัตรากำไร
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {financialSummary.profitMargin.toFixed(1)}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+2.8%</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            แนวโน้มรายได้และกำไร (6 เดือนล่าสุด)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyTrends.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1">
                  {/* Revenue Bar */}
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-green-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${(data.revenue / 3100000) * 120}px`,
                        minHeight: '20px'
                      }}
                    ></div>
                  </div>
                  {/* Profit Bar */}
                  <div className="w-full bg-gray-200 rounded-b relative">
                    <div 
                      className="bg-blue-500 rounded-b transition-all duration-500"
                      style={{ 
                        height: `${(data.profit / 1000000) * 80}px`,
                        minHeight: '15px'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs font-medium">{data.month}</p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(data.revenue)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {formatCurrency(data.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>รายได้</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>กำไร</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              แหล่งรายได้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stream.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(stream.amount)}</span>
                      <div className="flex items-center">
                        {stream.growth > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                        )}
                        <span className={`text-xs ${
                          stream.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stream.growth > 0 ? '+' : ''}{stream.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stream.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stream.percentage.toFixed(1)}% ของรายได้รวม
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              การแบ่งค่าใช้จ่าย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseBreakdown.map((expense, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{expense.category}</span>
                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${expense.color}`}
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {expense.percentage.toFixed(1)}% ของค่าใช้จ่ายรวม
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            กระแสเงินสด (5 สัปดาห์ล่าสุด)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">วันที่</th>
                  <th className="text-right py-2">เงินเข้า</th>
                  <th className="text-right py-2">เงินออก</th>
                  <th className="text-right py-2">กระแสเงินสุทธิ</th>
                  <th className="text-right py-2">ยอดคงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.map((flow, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium">{flow.date}</td>
                    <td className="text-right py-3 text-green-600">
                      {formatCurrency(flow.inflow)}
                    </td>
                    <td className="text-right py-3 text-red-600">
                      {formatCurrency(flow.outflow)}
                    </td>
                    <td className={`text-right py-3 font-semibold ${
                      flow.netFlow > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {flow.netFlow > 0 ? '+' : ''}{formatCurrency(flow.netFlow)}
                    </td>
                    <td className="text-right py-3 font-semibold">
                      {formatCurrency(flow.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            อัตราส่วนทางการเงินสำคัญ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyRatios.map((ratio, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{ratio.name}</h4>
                  <div className="flex items-center">
                    {ratio.trend > 0 ? (
                      <TrendingUp className={`h-3 w-3 mr-1 ${
                        ratio.good ? 'text-green-600' : 'text-red-600'
                      }`} />
                    ) : (
                      <TrendingDown className={`h-3 w-3 mr-1 ${
                        ratio.good ? 'text-red-600' : 'text-green-600'
                      }`} />
                    )}
                    <span className={`text-xs ${
                      (ratio.trend > 0 && ratio.good) || (ratio.trend < 0 && !ratio.good) 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ratio.trend > 0 ? '+' : ''}{ratio.trend}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {ratio.value}{ratio.unit}
                </div>
                <Badge 
                  variant={ratio.good ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  {ratio.good ? 'ดี' : 'ต้องปรับปรุง'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สินทรัพย์</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">เงินสดและเงินฝาก</span>
                <span className="font-semibold">{formatCurrency(1610000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">ลูกหนี้การค้า</span>
                <span className="font-semibold">{formatCurrency(financialSummary.accountsReceivable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">สินค้าคงเหลือ</span>
                <span className="font-semibold">{formatCurrency(2850000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">สินทรัพย์ถาวร</span>
                <span className="font-semibold">{formatCurrency(1200000)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>รวมสินทรัพย์</span>
                <span>{formatCurrency(6110000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">หนี้สิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">เจ้าหนี้การค้า</span>
                <span className="font-semibold">{formatCurrency(financialSummary.accountsPayable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">หนี้สินหมุนเวียนอื่น</span>
                <span className="font-semibold">{formatCurrency(180000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">หนี้สินระยะยาว</span>
                <span className="font-semibold">{formatCurrency(800000)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>รวมหนี้สิน</span>
                <span>{formatCurrency(1300000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ส่วนของเจ้าของ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">ทุนจดทะเบียน</span>
                <span className="font-semibold">{formatCurrency(2000000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">กำไรสะสม</span>
                <span className="font-semibold">{formatCurrency(2810000)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold">
                <span>รวมส่วนของเจ้าของ</span>
                <span>{formatCurrency(4810000)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>รวมหนี้สินและส่วนของเจ้าของ</span>
                <span>{formatCurrency(6110000)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};