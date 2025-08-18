import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAccounting } from '@/hooks/useAccounting';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { useBranchData } from '@/hooks/useBranchData';
import { AccountingSummary } from '@/types/accounting';
import { formatCurrency } from '@/utils/accountingHelpers';
import { ExportDialog } from './ExportDialog';
import { MultiBranchExportDialog } from './MultiBranchExportDialog';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Activity,
  AlertTriangle,
  BarChart3,
  Calculator,
  PieChart,
  Download,
  Calendar,
  Building2,
  Eye,
  RefreshCw
} from 'lucide-react';

interface FinancialDashboardProps {
  summary: AccountingSummary;
}

export function FinancialDashboard({ summary }: FinancialDashboardProps) {
  const { toast } = useToast();
  const { getTrialBalance } = useAccounting();
  const {
    generateProfitLossReport,
    generateBalanceSheetReport,
    generateCashFlowReport,
    loading: reportsLoading
  } = useFinancialReports();
  const { currentBranch, selectedBranchesAnalytics } = useBranchData();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [exportDialog, setExportDialog] = useState({
    open: false,
    type: 'profit_loss' as 'chart_of_accounts' | 'journal_entries' | 'transactions' | 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'consolidated',
    data: null,
    title: ''
  });
  const [multiBranchExportDialog, setMultiBranchExportDialog] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    profitLoss: null,
    balanceSheet: null,
    cashFlow: null,
    trialBalance: []
  });
  const [refreshing, setRefreshing] = useState(false);

  // คำนวณอัตราส่วนทางการเงิน
  const equityRatio = summary.totalAssets > 0 ? (summary.totalEquity / summary.totalAssets) * 100 : 0;
  const profitMargin = summary.totalRevenues > 0 ? (summary.netIncome / summary.totalRevenues) * 100 : 0;
  const debtToEquityRatio = summary.totalEquity > 0 ? (summary.totalLiabilities / summary.totalEquity) * 100 : 0;
  const currentRatio = summary.totalLiabilities > 0 ? (summary.totalAssets / summary.totalLiabilities) : 0;

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      const trialBalance = getTrialBalance();
      setDashboardData(prev => ({
        ...prev,
        trialBalance
      }));
      
      toast({
        title: "รีเฟรชข้อมูลสำเร็จ",
        description: "ข้อมูล Dashboard ได้รับการอัปเดตแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถรีเฟรชข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ฟังก์ชันสำหรับสร้างรายงาน
  const generateReport = async (reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow') => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const periodStart = startOfMonth.toISOString().split('T')[0];
      const periodEnd = endOfMonth.toISOString().split('T')[0];
      const branchId = currentBranch?.id;

      let report;
      switch (reportType) {
        case 'profit_loss':
          report = await generateProfitLossReport(periodStart, periodEnd, branchId);
          setDashboardData(prev => ({ ...prev, profitLoss: report }));
          break;
        case 'balance_sheet':
          report = await generateBalanceSheetReport(periodEnd, branchId);
          setDashboardData(prev => ({ ...prev, balanceSheet: report }));
          break;
        case 'cash_flow':
          report = await generateCashFlowReport(periodStart, periodEnd, branchId);
          setDashboardData(prev => ({ ...prev, cashFlow: report }));
          break;
      }
      
      toast({
        title: "สร้างรายงานสำเร็จ",
        description: `รายงาน${reportType === 'profit_loss' ? 'กำไรขาดทุน' : reportType === 'balance_sheet' ? 'งบดุล' : 'กระแสเงินสด'}ถูกสร้างแล้ว`
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const trialBalance = getTrialBalance();
    setDashboardData(prev => ({
      ...prev,
      trialBalance
    }));
  }, [getTrialBalance]);

  return (
    <div className="space-y-6">
      {/* Header with Branch Info and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard บัญชี</h2>
            <p className="text-muted-foreground">
              ภาพรวมการเงินและรายงานทางการเงิน
            </p>
          </div>
          {currentBranch && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินทรัพย์รวม</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(summary.totalAssets)}
            </div>
            <p className="text-xs text-green-600">
              จากบัญชี {summary.accountsCount} บัญชี
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หนี้สินรวม</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(summary.totalLiabilities)}
            </div>
            <p className="text-xs text-red-600">
              อัตราส่วนหนี้ต่อทุน {debtToEquityRatio.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ส่วนของเจ้าของ</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(summary.totalEquity)}
            </div>
            <p className="text-xs text-blue-600">
              อัตราส่วนทุน {equityRatio.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className={summary.netIncome >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <TrendingUp className={summary.netIncome >= 0 ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-red-600'} />
          </CardHeader>
          <CardContent>
            <div className={summary.netIncome >= 0 ? 'text-2xl font-bold text-green-700' : 'text-2xl font-bold text-red-700'}>
              {formatCurrency(summary.netIncome)}
            </div>
            <p className={summary.netIncome >= 0 ? 'text-xs text-green-600' : 'text-xs text-red-600'}>
              อัตรากำไร {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            อัตราส่วนทางการเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">อัตราส่วนทุน</span>
                <span className="text-sm font-bold">{equityRatio.toFixed(1)}%</span>
              </div>
              <Progress value={equityRatio} className="h-2" />
              <p className="text-xs text-muted-foreground">เป้าหมาย: 40-60%</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">อัตรากำไร</span>
                <span className="text-sm font-bold">{profitMargin.toFixed(1)}%</span>
              </div>
              <Progress value={Math.abs(profitMargin)} className="h-2" />
              <p className="text-xs text-muted-foreground">เป้าหมาย: 15-25%</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">อัตราส่วนหนี้ต่อทุน</span>
                <span className="text-sm font-bold">{debtToEquityRatio.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(debtToEquityRatio, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">เป้าหมาย: &lt; 100%</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">อัตราส่วนสภาพคล่อง</span>
                <span className="text-sm font-bold">{currentRatio.toFixed(2)}</span>
              </div>
              <Progress value={Math.min(currentRatio * 50, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">เป้าหมาย: &gt; 1.5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="profit-loss">กำไรขาดทุน</TabsTrigger>
          <TabsTrigger value="balance-sheet">งบดุล</TabsTrigger>
          <TabsTrigger value="cash-flow">กระแสเงินสด</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('profit_loss')}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-medium mb-2">งบกำไรขาดทุน</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  แสดงรายได้ ค่าใช้จ่าย และกำไรสุทธิ
                </p>
                <Button size="sm" disabled={reportsLoading}>
                  {reportsLoading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('balance_sheet')}>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-medium mb-2">งบดุล</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  แสดงสินทรัพย์ หนี้สิน และส่วนของเจ้าของ
                </p>
                <Button size="sm" disabled={reportsLoading}>
                  {reportsLoading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('cash_flow')}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-medium mb-2">งบกระแสเงินสด</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  แสดงการเคลื่อนไหวของเงินสด
                </p>
                <Button size="sm" disabled={reportsLoading}>
                  {reportsLoading ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Trial Balance Summary */}
          {dashboardData.trialBalance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  งบทดลอง (สรุป)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.trialBalance.slice(0, 5).map((account) => (
                    <div key={account.accountId} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="font-medium">{account.accountCode}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{account.accountName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(account.balance)}</div>
                      </div>
                    </div>
                  ))}
                  {dashboardData.trialBalance.length > 5 && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      และอีก {dashboardData.trialBalance.length - 5} บัญชี
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <CardTitle>งบกำไรขาดทุน</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.profitLoss ? (
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    รายงานกำไรขาดทุนจะแสดงที่นี่
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">ยังไม่มีรายงานกำไรขาดทุน</p>
                  <Button onClick={() => generateReport('profit_loss')} disabled={reportsLoading}>
                    สร้างรายงาน
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle>งบดุล</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.balanceSheet ? (
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    งบดุลจะแสดงที่นี่
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">ยังไม่มีงบดุล</p>
                  <Button onClick={() => generateReport('balance_sheet')} disabled={reportsLoading}>
                    สร้างรายงาน
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle>งบกระแสเงินสด</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.cashFlow ? (
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    งบกระแสเงินสดจะแสดงที่นี่
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">ยังไม่มีงบกระแสเงินสด</p>
                  <Button onClick={() => generateReport('cash_flow')} disabled={reportsLoading}>
                    สร้างรายงาน
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการรออนุมัติ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.pendingEntries}
            </div>
            <p className="text-xs text-muted-foreground">
              รายการบัญชีที่รออนุมัติ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ธุรกรรมล่าสุด</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.recentTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              ธุรกรรมใน 7 วันที่ผ่านมา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บัญชีทั้งหมด</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summary.accountsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              บัญชีในผังบัญชี
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              ส่งออกข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => setExportDialog({
                  open: true,
                  type: 'profit_loss',
                  data: dashboardData.profitLoss,
                  title: 'รายงานกำไรขาดทุน'
                })}
                disabled={!dashboardData.profitLoss}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">กำไรขาดทุน</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setExportDialog({
                  open: true,
                  type: 'balance_sheet',
                  data: dashboardData.balanceSheet,
                  title: 'งบดุล'
                })}
                disabled={!dashboardData.balanceSheet}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">งบดุล</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setExportDialog({
                  open: true,
                  type: 'cash_flow',
                  data: dashboardData.cashFlow,
                  title: 'งบกระแสเงินสด'
                })}
                disabled={!dashboardData.cashFlow}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Activity className="h-6 w-6" />
                <span className="text-sm">กระแสเงินสด</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setExportDialog({
                  open: true,
                  type: 'chart_of_accounts',
                  data: dashboardData.trialBalance,
                  title: 'ผังบัญชี'
                })}
                disabled={dashboardData.trialBalance.length === 0}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Calculator className="h-6 w-6" />
                <span className="text-sm">ผังบัญชี</span>
              </Button>

              <Button
                variant="default"
                onClick={() => setMultiBranchExportDialog(true)}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Building2 className="h-6 w-6" />
                <span className="text-sm">รายงานรวมหลายสาขา</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialog.open}
        onOpenChange={(open) => setExportDialog(prev => ({ ...prev, open }))}
        exportType={exportDialog.type}
        data={exportDialog.data}
        title={exportDialog.title}
      />
      
      <MultiBranchExportDialog
        open={multiBranchExportDialog}
        onOpenChange={setMultiBranchExportDialog}
      />
    </div>
  );
}