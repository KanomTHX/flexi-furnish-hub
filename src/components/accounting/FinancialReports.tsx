import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Account, JournalEntry, Transaction } from '@/types/accounting';
import { 
  Calculator, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react';

interface FinancialReportsProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  transactions: Transaction[];
}

interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
}

interface IncomeStatementItem {
  accountCode: string;
  accountName: string;
  amount: number;
  category: string;
}

interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  amount: number;
  category: string;
}

export function FinancialReports({ accounts, journalEntries, transactions }: FinancialReportsProps) {
  const { toast } = useToast();
  const [reportPeriod, setReportPeriod] = useState<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');

  // Calculate date range based on period selection
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (reportPeriod) {
      case 'monthly':
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
        startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        break;
      case 'quarterly':
        const qYear = parseInt(selectedYear);
        const quarter = parseInt(selectedQuarter);
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = quarter * 3;
        startDate = `${qYear}-${startMonth.toString().padStart(2, '0')}-01`;
        const qLastDay = new Date(qYear, endMonth, 0).getDate();
        endDate = `${qYear}-${endMonth.toString().padStart(2, '0')}-${qLastDay.toString().padStart(2, '0')}`;
        break;
      case 'yearly':
        const yYear = parseInt(selectedYear);
        startDate = `${yYear}-01-01`;
        endDate = `${yYear}-12-31`;
        break;
      case 'custom':
        startDate = customDateFrom || now.toISOString().split('T')[0];
        endDate = customDateTo || now.toISOString().split('T')[0];
        break;
      default:
        startDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        endDate = now.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  }, [reportPeriod, selectedYear, selectedMonth, selectedQuarter, customDateFrom, customDateTo]);

  // Filter journal entries by date range
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter(entry => 
      entry.status === 'approved' &&
      entry.date >= dateRange.startDate && 
      entry.date <= dateRange.endDate
    );
  }, [journalEntries, dateRange]);

  // Calculate Trial Balance
  const trialBalance = useMemo(() => {
    const balanceMap = new Map<string, TrialBalanceItem>();

    // Initialize with all accounts
    accounts.forEach(account => {
      balanceMap.set(account.id, {
        accountCode: account.code,
        accountName: account.name,
        debitAmount: 0,
        creditAmount: 0,
        balance: account.balance
      });
    });

    // Add journal entry amounts
    filteredJournalEntries.forEach(entry => {
      entry.entries.forEach(line => {
        const existing = balanceMap.get(line.accountId);
        if (existing) {
          existing.debitAmount += line.debitAmount;
          existing.creditAmount += line.creditAmount;
        }
      });
    });

    return Array.from(balanceMap.values()).filter(item => 
      item.debitAmount > 0 || item.creditAmount > 0 || item.balance > 0
    );
  }, [accounts, filteredJournalEntries]);

  // Calculate Income Statement
  const incomeStatement = useMemo(() => {
    const revenues: IncomeStatementItem[] = [];
    const expenses: IncomeStatementItem[] = [];

    accounts.forEach(account => {
      if (account.type === 'revenue') {
        const totalCredit = filteredJournalEntries.reduce((sum, entry) => {
          return sum + entry.entries
            .filter(line => line.accountId === account.id)
            .reduce((lineSum, line) => lineSum + line.creditAmount, 0);
        }, 0);

        if (totalCredit > 0) {
          revenues.push({
            accountCode: account.code,
            accountName: account.name,
            amount: totalCredit,
            category: account.category
          });
        }
      } else if (account.type === 'expense') {
        const totalDebit = filteredJournalEntries.reduce((sum, entry) => {
          return sum + entry.entries
            .filter(line => line.accountId === account.id)
            .reduce((lineSum, line) => lineSum + line.debitAmount, 0);
        }, 0);

        if (totalDebit > 0) {
          expenses.push({
            accountCode: account.code,
            accountName: account.name,
            amount: totalDebit,
            category: account.category
          });
        }
      }
    });

    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpense;

    return { revenues, expenses, totalRevenue, totalExpense, netIncome };
  }, [accounts, filteredJournalEntries]);

  // Calculate Balance Sheet
  const balanceSheet = useMemo(() => {
    const assets: BalanceSheetItem[] = [];
    const liabilities: BalanceSheetItem[] = [];
    const equity: BalanceSheetItem[] = [];

    accounts.forEach(account => {
      let amount = account.balance;

      // Add journal entry effects
      filteredJournalEntries.forEach(entry => {
        entry.entries.forEach(line => {
          if (line.accountId === account.id) {
            if (account.type === 'asset' || account.type === 'expense') {
              amount += line.debitAmount - line.creditAmount;
            } else {
              amount += line.creditAmount - line.debitAmount;
            }
          }
        });
      });

      if (amount !== 0) {
        const item = {
          accountCode: account.code,
          accountName: account.name,
          amount: Math.abs(amount),
          category: account.category
        };

        if (account.type === 'asset') {
          assets.push(item);
        } else if (account.type === 'liability') {
          liabilities.push(item);
        } else if (account.type === 'equity') {
          equity.push(item);
        }
      }
    });

    // Add net income to equity
    if (incomeStatement.netIncome !== 0) {
      equity.push({
        accountCode: '3999',
        accountName: 'กำไร(ขาดทุน)สุทธิ',
        amount: Math.abs(incomeStatement.netIncome),
        category: 'retained_earnings'
      });
    }

    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
  }, [accounts, filteredJournalEntries, incomeStatement.netIncome]);

  // Export functions
  const exportTrialBalance = () => {
    const headers = ['รหัสบัญชี', 'ชื่อบัญชี', 'เดบิต', 'เครดิต', 'ยอดคงเหลือ'];
    const rows = trialBalance.map(item => [
      item.accountCode,
      item.accountName,
      item.debitAmount.toLocaleString(),
      item.creditAmount.toLocaleString(),
      item.balance.toLocaleString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, `trial-balance-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  };

  const exportIncomeStatement = () => {
    const data = [
      ['รายได้'],
      ...incomeStatement.revenues.map(item => [item.accountCode, item.accountName, item.amount.toLocaleString()]),
      ['', 'รวมรายได้', incomeStatement.totalRevenue.toLocaleString()],
      [''],
      ['ค่าใช้จ่าย'],
      ...incomeStatement.expenses.map(item => [item.accountCode, item.accountName, item.amount.toLocaleString()]),
      ['', 'รวมค่าใช้จ่าย', incomeStatement.totalExpense.toLocaleString()],
      [''],
      ['', 'กำไร(ขาดทุน)สุทธิ', incomeStatement.netIncome.toLocaleString()]
    ];

    const csvContent = data
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, `income-statement-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  };

  const exportBalanceSheet = () => {
    const data = [
      ['สินทรัพย์'],
      ...balanceSheet.assets.map(item => [item.accountCode, item.accountName, item.amount.toLocaleString()]),
      ['', 'รวมสินทรัพย์', balanceSheet.totalAssets.toLocaleString()],
      [''],
      ['หนี้สิน'],
      ...balanceSheet.liabilities.map(item => [item.accountCode, item.accountName, item.amount.toLocaleString()]),
      ['', 'รวมหนี้สิน', balanceSheet.totalLiabilities.toLocaleString()],
      [''],
      ['ส่วนของเจ้าของ'],
      ...balanceSheet.equity.map(item => [item.accountCode, item.accountName, item.amount.toLocaleString()]),
      ['', 'รวมส่วนของเจ้าของ', balanceSheet.totalEquity.toLocaleString()],
      [''],
      ['', 'รวมหนี้สินและส่วนของเจ้าของ', (balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString()]
    ];

    const csvContent = data
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, `balance-sheet-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "ส่งออกรายงานสำเร็จ",
      description: `ไฟล์ ${filename} ถูกดาวน์โหลดแล้ว`,
    });
  };

  const formatPeriodLabel = () => {
    switch (reportPeriod) {
      case 'monthly':
        return `เดือน ${selectedMonth}/${selectedYear}`;
      case 'quarterly':
        return `ไตรมาส ${selectedQuarter}/${selectedYear}`;
      case 'yearly':
        return `ปี ${selectedYear}`;
      case 'custom':
        return `${new Date(dateRange.startDate).toLocaleDateString('th-TH')} - ${new Date(dateRange.endDate).toLocaleDateString('th-TH')}`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            รายงานทางการเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>ช่วงเวลา</Label>
              <Select value={reportPeriod} onValueChange={(value: any) => setReportPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportPeriod === 'monthly' && (
              <>
                <div>
                  <Label>ปี</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year + 543}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>เดือน</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2024, month - 1).toLocaleDateString('th-TH', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportPeriod === 'quarterly' && (
              <>
                <div>
                  <Label>ปี</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year + 543}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ไตรมาส</Label>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ไตรมาส 1 (ม.ค.-มี.ค.)</SelectItem>
                      <SelectItem value="2">ไตรมาส 2 (เม.ย.-มิ.ย.)</SelectItem>
                      <SelectItem value="3">ไตรมาส 3 (ก.ค.-ก.ย.)</SelectItem>
                      <SelectItem value="4">ไตรมาส 4 (ต.ค.-ธ.ค.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportPeriod === 'yearly' && (
              <div>
                <Label>ปี</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year + 543}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportPeriod === 'custom' && (
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

          <div className="mt-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              ช่วงเวลารายงาน: {formatPeriodLabel()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports Tabs */}
      <Tabs defaultValue="trial-balance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            งบทดลอง
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            งบกำไรขาดทุน
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            งบดุล
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>งบทดลอง</CardTitle>
                <Button onClick={exportTrialBalance} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">รหัสบัญชี</th>
                      <th className="text-left p-3 font-medium">ชื่อบัญชี</th>
                      <th className="text-right p-3 font-medium">เดบิต</th>
                      <th className="text-right p-3 font-medium">เครดิต</th>
                      <th className="text-right p-3 font-medium">ยอดคงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono">{item.accountCode}</td>
                        <td className="p-3">{item.accountName}</td>
                        <td className="p-3 text-right font-mono">
                          {item.debitAmount > 0 ? item.debitAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {item.creditAmount > 0 ? item.creditAmount.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-medium">
                          {item.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold bg-muted">
                      <td className="p-3" colSpan={2}>รวม</td>
                      <td className="p-3 text-right">
                        {trialBalance.reduce((sum, item) => sum + item.debitAmount, 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {trialBalance.reduce((sum, item) => sum + item.creditAmount, 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {trialBalance.reduce((sum, item) => sum + item.balance, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>งบกำไรขาดทุน</CardTitle>
                <Button onClick={exportIncomeStatement} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700">รายได้</h3>
                  <div className="space-y-2">
                    {incomeStatement.revenues.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="font-mono font-medium text-green-600">
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-green-700">
                      <span>รวมรายได้</span>
                      <span className="font-mono">
                        {incomeStatement.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-700">ค่าใช้จ่าย</h3>
                  <div className="space-y-2">
                    {incomeStatement.expenses.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="font-mono font-medium text-red-600">
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-red-700">
                      <span>รวมค่าใช้จ่าย</span>
                      <span className="font-mono">
                        {incomeStatement.totalExpense.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className="border-t-4 pt-4">
                  <div className={`flex justify-between items-center py-4 text-xl font-bold ${
                    incomeStatement.netIncome >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>กำไร(ขาดทุน)สุทธิ</span>
                    <span className="font-mono">
                      {incomeStatement.netIncome >= 0 ? '+' : ''}
                      {incomeStatement.netIncome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>งบดุล</CardTitle>
                <Button onClick={exportBalanceSheet} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออก CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">สินทรัพย์</h3>
                  <div className="space-y-2">
                    {balanceSheet.assets.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="font-mono font-medium">
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-blue-700">
                      <span>รวมสินทรัพย์</span>
                      <span className="font-mono">
                        {balanceSheet.totalAssets.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  {/* Liabilities */}
                  <h3 className="text-lg font-semibold mb-3 text-red-700">หนี้สิน</h3>
                  <div className="space-y-2 mb-6">
                    {balanceSheet.liabilities.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="font-mono font-medium">
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-red-700">
                      <span>รวมหนี้สิน</span>
                      <span className="font-mono">
                        {balanceSheet.totalLiabilities.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Equity */}
                  <h3 className="text-lg font-semibold mb-3 text-purple-700">ส่วนของเจ้าของ</h3>
                  <div className="space-y-2">
                    {balanceSheet.equity.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground mr-2">
                            {item.accountCode}
                          </span>
                          <span>{item.accountName}</span>
                        </div>
                        <span className="font-mono font-medium">
                          {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3 border-t-2 font-bold text-purple-700">
                      <span>รวมส่วนของเจ้าของ</span>
                      <span className="font-mono">
                        {balanceSheet.totalEquity.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="mt-6 pt-4 border-t-4">
                    <div className="flex justify-between items-center py-3 text-lg font-bold">
                      <span>รวมหนี้สินและส่วนของเจ้าของ</span>
                      <span className="font-mono">
                        {(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}