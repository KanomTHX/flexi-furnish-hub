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
  Calendar,
  Search,
  Filter,
  CreditCard,
  Wallet,
  PieChart
} from 'lucide-react';
import { FinancialReport } from '@/types/reports';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/reportHelpers';

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
    totalRevenue: 125000,
    totalExpenses: 85000,
    netProfit: 40000,
    profitMargin: 32,
    accountsReceivable: 45000,
    accountsPayable: 32000,
    cashFlow: 13000,
    roi: 18.5
  };

  const monthlyData = [
    { month: 'ม.ค.', revenue: 125000, expenses: 85000, profit: 40000 },
    { month: 'ก.พ.', revenue: 135000, expenses: 92000, profit: 43000 },
    { month: 'มี.ค.', revenue: 115000, expenses: 78000, profit: 37000 },
    { month: 'เม.ย.', revenue: 145000, expenses: 98000, profit: 47000 },
    { month: 'พ.ค.', revenue: 155000, expenses: 105000, profit: 50000 },
    { month: 'มิ.ย.', revenue: 140000, expenses: 95000, profit: 45000 }
  ];

  const expenseCategories = [
    { category: 'ต้นทุนสินค้า', amount: 45000, percentage: 53, color: 'bg-blue-500' },
    { category: 'เงินเดือนพนักงาน', amount: 25000, percentage: 29, color: 'bg-green-500' },
    { category: 'ค่าเช่าและสาธารณูปโภค', amount: 8000, percentage: 9, color: 'bg-yellow-500' },
    { category: 'การตลาดและโฆษณา', amount: 4000, percentage: 5, color: 'bg-purple-500' },
    { category: 'อื่นๆ', amount: 3000, percentage: 4, color: 'bg-gray-500' }
  ];

  const revenueStreams = [
    { source: 'ขายหน้าร้าน', amount: 75000, percentage: 60, growth: 12.5 },
    { source: 'ออนไลน์', amount: 35000, percentage: 28, growth: 25.3 },
    { source: 'ขายส่ง', amount: 15000, percentage: 12, growth: -5.2 }
  ];

  const cashFlowData = [
    { date: '01/01', inflow: 125000, outflow: 85000, balance: 240000 },
    { date: '02/01', inflow: 95000, outflow: 65000, balance: 270000 },
    { date: '03/01', inflow: 110000, outflow: 75000, balance: 305000 },
    { date: '04/01', inflow: 135000, outflow: 90000, balance: 350000 },
    { date: '05/01', inflow: 120000, outflow: 80000, balance: 390000 },
    { date: '06/01', inflow: 140000, outflow: 95000, balance: 435000 },
    { date: '07/01', inflow: 155000, outflow: 105000, balance: 485000 }
  ];

  const accountsData = [
    {
      type: 'receivable',
      customer: 'บริษัท ABC จำกัด',
      amount: 15000,
      dueDate: '2024-02-15',
      overdue: false
    },
    {
      type: 'receivable',
      customer: 'ร้าน XYZ',
      amount: 8500,
      dueDate: '2024-02-20',
      overdue: false
    },
    {
      type: 'receivable',
      customer: 'คุณสมชาย',
      amount: 3200,
      dueDate: '2024-01-30',
      overdue: true
    },
    {
      type: 'payable',
      supplier: 'โรงงานเฟอร์นิเจอร์',
      amount: 25000,
      dueDate: '2024-02-10',
      overdue: false
    },
    {
      type: 'payable',
      supplier: 'บริษัทขนส่ง',
      amount: 4500,
      dueDate: '2024-02-05',
      overdue: false
    }
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
            <DollarSign className="h-4 w-4 mr-2" />
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
                <SelectItem value="day">รายวัน</SelectItem>
                <SelectItem value="week">รายสัปดาห์</SelectItem>
                <SelectItem value="month">รายเดือน</SelectItem>
                <SelectItem value="quarter">รายไตรมาส</SelectItem>
                <SelectItem value="year">รายปี</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ประเภทรายงาน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">สรุปภาพรวม</SelectItem>
                <SelectItem value="profit-loss">กำไรขาดทุน</SelectItem>
                <SelectItem value="cash-flow">กระแสเงินสด</SelectItem>
                <SelectItem value="balance-sheet">งบดุล</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  รายได้รวม
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialSummary.totalRevenue)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
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
                  ค่าใช้จ่าย
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialSummary.totalExpenses)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-red-600" />
                  <span className="text-sm text-red-600">+8.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <CreditCard className="h-6 w-6" />
              </div>
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
                  {formatCurrency(financialSummary.netProfit)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+15.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
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
                  {formatPercentage(financialSummary.profitMargin)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+2.1%</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <PieChart className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Profit & Loss Chart */}
      <Card>
        <CardHeader>
          <CardTitle>กำไรขาดทุนรายเดือน (6 เดือนล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1">
                  {/* Revenue Bar */}
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-green-500 rounded-t transition-all duration-500"
                      style={{ 
                        height: `${(data.revenue / 155000) * 120}px`,
                        minHeight: '20px'
                      }}
                    ></div>
                  </div>
                  {/* Expense Bar */}
                  <div className="w-full bg-gray-200 relative">
                    <div 
                      className="bg-red-500 transition-all duration-500"
                      style={{ 
                        height: `${(data.expenses / 155000) * 120}px`,
                        minHeight: '15px'
                      }}
                    ></div>
                  </div>
                  {/* Profit Bar */}
                  <div className="w-full bg-gray-200 rounded-b relative">
                    <div 
                      className="bg-blue-500 rounded-b transition-all duration-500"
                      style={{ 
                        height: `${(data.profit / 155000) * 120}px`,
                        minHeight: '10px'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs font-medium">{data.month}</p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(data.revenue)}
                  </p>
                  <p className="text-xs text-red-600">
                    -{formatCurrency(data.expenses)}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {formatCurrency(data.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">รายได้</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">ค่าใช้จ่าย</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">กำไร</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <Card>
          <CardHeader>
            <CardTitle>แหล่งรายได้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueStreams.map((stream, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stream.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {stream.percentage}%
                      </span>
                      <div className="flex items-center">
                        <TrendingUp className={`h-3 w-3 mr-1 ${
                          stream.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`} />
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
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${stream.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stream.amount)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>หมวดค่าใช้จ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((category, index) => (
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
                    {formatCurrency(category.amount)}
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
          <CardTitle>กระแสเงินสด (7 วันล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {cashFlowData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t relative">
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-500"
                    style={{ 
                      height: `${(data.balance / 485000) * 200}px`,
                      minHeight: '20px'
                    }}
                  ></div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs font-medium">{data.date}</p>
                  <p className="text-xs text-green-600">
                    +{formatCurrency(data.inflow)}
                  </p>
                  <p className="text-xs text-red-600">
                    -{formatCurrency(data.outflow)}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {formatCurrency(data.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Receivable & Payable */}
      <Card>
        <CardHeader>
          <CardTitle>ลูกหนี้ - เจ้าหนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accounts Receivable */}
            <div>
              <h3 className="font-semibold mb-4 text-green-600">ลูกหนี้ ({formatCurrency(45000)})</h3>
              <div className="space-y-3">
                {accountsData.filter(acc => acc.type === 'receivable').map((account, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.customer}</p>
                      <p className="text-sm text-muted-foreground">
                        ครบกำหนด: {new Date(account.dueDate).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(account.amount)}</p>
                      <Badge variant={account.overdue ? 'destructive' : 'default'}>
                        {account.overdue ? 'เกินกำหนด' : 'ปกติ'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accounts Payable */}
            <div>
              <h3 className="font-semibold mb-4 text-red-600">เจ้าหนี้ ({formatCurrency(32000)})</h3>
              <div className="space-y-3">
                {accountsData.filter(acc => acc.type === 'payable').map((account, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.supplier}</p>
                      <p className="text-sm text-muted-foreground">
                        ครบกำหนด: {new Date(account.dueDate).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(account.amount)}</p>
                      <Badge variant={account.overdue ? 'destructive' : 'secondary'}>
                        {account.overdue ? 'เกินกำหนด' : 'ปกติ'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};