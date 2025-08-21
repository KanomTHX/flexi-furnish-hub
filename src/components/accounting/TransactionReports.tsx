import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Transaction, TransactionType } from '@/types/accounting';
// Simple chart components (replacing recharts)
const SimpleBarChart = ({ data, dataKey }: { data: any[], dataKey: string }) => (
  <div className="h-80 flex items-end justify-center space-x-2 p-4">
    {data.map((item, index) => {
      const maxValue = Math.max(...data.map(d => d[dataKey]));
      const height = (item[dataKey] / maxValue) * 250;
      return (
        <div key={index} className="flex flex-col items-center">
          <div 
            className="bg-blue-500 w-8 rounded-t"
            style={{ height: `${height}px` }}
            title={`${item.date}: ${item[dataKey].toLocaleString()}`}
          />
          <span className="text-xs mt-1 transform -rotate-45 origin-left">
            {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      );
    })}
  </div>
);

const SimplePieChart = ({ data }: { data: any[] }) => (
  <div className="h-80 flex items-center justify-center">
    <div className="relative w-64 h-64">
      {data.map((item, index) => {
        const total = data.reduce((sum, d) => sum + d.amount, 0);
        const percentage = (item.amount / total) * 100;
        return (
          <div key={index} className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-2 border rounded-lg bg-white shadow-sm">
              <div className="font-medium">{item.type}</div>
              <div className="text-sm text-muted-foreground">
                {percentage.toFixed(1)}%
              </div>
              <div className="text-sm font-bold">
                {item.amount.toLocaleString()} ฿
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface TransactionReportsProps {
  transactions: Transaction[];
}

export function TransactionReports({ transactions }: TransactionReportsProps) {
  const [reportType, setReportType] = useState<'summary' | 'trend' | 'breakdown'>('summary');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          return transactions.filter(txn => 
            txn.date >= customDateFrom && txn.date <= customDateTo
          );
        }
        return transactions;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return transactions.filter(txn => new Date(txn.date) >= startDate);
  }, [transactions, dateRange, customDateFrom, customDateTo]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    const salesTransactions = filteredTransactions.filter(txn => txn.type === 'sale' || txn.type === 'receipt');
    const totalIncome = salesTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    const expenseTransactions = filteredTransactions.filter(txn => txn.type === 'purchase' || txn.type === 'payment');
    const totalExpense = expenseTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    const netAmount = totalIncome - totalExpense;
    
    const pendingTransactions = filteredTransactions.filter(txn => txn.status === 'pending').length;
    const processedTransactions = filteredTransactions.filter(txn => txn.status === 'processed').length;
    
    return {
      totalTransactions,
      totalAmount,
      totalIncome,
      totalExpense,
      netAmount,
      pendingTransactions,
      processedTransactions,
      averageTransaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0
    };
  }, [filteredTransactions]);

  // Transaction type breakdown
  const typeBreakdown = useMemo(() => {
    const breakdown = filteredTransactions.reduce((acc, txn) => {
      if (!acc[txn.type]) {
        acc[txn.type] = { count: 0, amount: 0 };
      }
      acc[txn.type].count += 1;
      acc[txn.type].amount += txn.amount;
      return acc;
    }, {} as Record<TransactionType, { count: number; amount: number }>);

    return Object.entries(breakdown).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.amount,
      percentage: (data.amount / summaryStats.totalAmount) * 100
    }));
  }, [filteredTransactions, summaryStats.totalAmount]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
    const dailyData = filteredTransactions.reduce((acc, txn) => {
      const date = txn.date;
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, count: 0 };
      }
      
      if (txn.type === 'sale' || txn.type === 'receipt') {
        acc[date].income += txn.amount;
      } else if (txn.type === 'purchase' || txn.type === 'payment') {
        acc[date].expense += txn.amount;
      }
      acc[date].count += 1;
      
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number; count: number }>);

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Source module breakdown
  const moduleBreakdown = useMemo(() => {
    const breakdown = filteredTransactions.reduce((acc, txn) => {
      if (!acc[txn.sourceModule]) {
        acc[txn.sourceModule] = { count: 0, amount: 0 };
      }
      acc[txn.sourceModule].count += 1;
      acc[txn.sourceModule].amount += txn.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return Object.entries(breakdown).map(([module, data]) => ({
      module,
      count: data.count,
      amount: data.amount
    }));
  }, [filteredTransactions]);

  const typeColors = {
    sale: '#10b981',
    purchase: '#ef4444',
    payment: '#f59e0b',
    receipt: '#3b82f6',
    adjustment: '#8b5cf6',
    transfer: '#06b6d4'
  };

  const typeLabels = {
    sale: 'การขาย',
    purchase: 'การซื้อ',
    payment: 'การจ่าย',
    receipt: 'การรับ',
    adjustment: 'ปรับปรุง',
    transfer: 'โอนย้าย'
  };

  const moduleLabels = {
    pos: 'ระบบขาย (POS)',
    inventory: 'ระบบคลังสินค้า',
    accounting: 'ระบบบัญชี',
    warehouse: 'ระบบคลัง',
    claims: 'ระบบเคลม',
    installments: 'ระบบผ่อนชำระ'
  };

  const handleExportReport = () => {
    const reportData = {
      summary: summaryStats,
      typeBreakdown,
      dailyTrend,
      moduleBreakdown,
      transactions: filteredTransactions
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    console.log('Transaction report data prepared for export:', dataStr);
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              รายงานธุรกรรม
            </CardTitle>
            <Button onClick={handleExportReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              ส่งออกรายงาน
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>ประเภทรายงาน</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">สรุปภาพรวม</SelectItem>
                  <SelectItem value="trend">แนวโน้ม</SelectItem>
                  <SelectItem value="breakdown">การแบ่งประเภท</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ช่วงเวลา</Label>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="30d">30 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="90d">90 วันที่ผ่านมา</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div>
                  <Label>วันที่เริ่มต้น</Label>
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>วันที่สิ้นสุด</Label>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {summaryStats.totalTransactions}
                </div>
                <div className="text-sm text-blue-600">ธุรกรรมทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {(summaryStats.totalIncome / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-green-600">รายได้รวม (บาท)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {(summaryStats.totalExpense / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-red-600">ค่าใช้จ่ายรวม (บาท)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className={`h-8 w-8 ${summaryStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className={`text-2xl font-bold ${summaryStats.netAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {summaryStats.netAmount >= 0 ? '+' : ''}{(summaryStats.netAmount / 1000).toFixed(0)}K
                </div>
                <div className={`text-sm ${summaryStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  กำไร/ขาดทุนสุทธิ (บาท)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportType === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Status */}
          <Card>
            <CardHeader>
              <CardTitle>สถานะธุรกรรม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>ดำเนินการแล้ว</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {summaryStats.processedTransactions}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({summaryStats.totalTransactions > 0 ? ((summaryStats.processedTransactions / summaryStats.totalTransactions) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>รอดำเนินการ</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {summaryStats.pendingTransactions}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({summaryStats.totalTransactions > 0 ? ((summaryStats.pendingTransactions / summaryStats.totalTransactions) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ค่าเฉลี่ยต่อธุรกรรม</span>
                    <span className="font-bold">
                      {summaryStats.averageTransaction.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>การแบ่งตามโมดูล</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {moduleBreakdown.map((item) => (
                  <div key={item.module} className="flex items-center justify-between">
                    <span className="text-sm">{moduleLabels[item.module as keyof typeof moduleLabels] || item.module}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.count}</Badge>
                      <span className="text-sm font-medium">
                        {(item.amount / 1000).toFixed(0)}K ฿
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'trend' && (
        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>รายได้</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>ค่าใช้จ่าย</span>
                </div>
              </div>
              <div className="h-80 flex items-end justify-center space-x-2 p-4 border rounded-lg">
                {dailyTrend.map((item, index) => {
                  const maxValue = Math.max(...dailyTrend.map(d => Math.max(d.income, d.expense)));
                  const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 250 : 0;
                  const expenseHeight = maxValue > 0 ? (item.expense / maxValue) * 250 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      <div className="flex items-end space-x-1">
                        <div 
                          className="bg-green-500 w-4 rounded-t"
                          style={{ height: `${incomeHeight}px` }}
                          title={`รายได้: ${item.income.toLocaleString()} บาท`}
                        />
                        <div 
                          className="bg-red-500 w-4 rounded-t"
                          style={{ height: `${expenseHeight}px` }}
                          title={`ค่าใช้จ่าย: ${item.expense.toLocaleString()} บาท`}
                        />
                      </div>
                      <span className="text-xs transform -rotate-45 origin-left">
                        {new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              {dailyTrend.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Type Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>การแบ่งตามประเภท</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeBreakdown.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {typeBreakdown.map((item) => (
                      <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: typeColors[item.type as keyof typeof typeColors] }}
                          />
                          <span className="font-medium">
                            {typeLabels[item.type as keyof typeof typeLabels]}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {item.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.count} รายการ
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Type Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดตามประเภท</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeBreakdown.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: typeColors[item.type as keyof typeof typeColors] }}
                      />
                      <span className="font-medium">
                        {typeLabels[item.type as keyof typeof typeLabels]}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {item.amount.toLocaleString()} บาท
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.count} รายการ ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}