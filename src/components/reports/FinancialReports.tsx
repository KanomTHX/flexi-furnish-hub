import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useFinancialReports } from '../../hooks/useFinancialReports';
import { useSettings } from '../../hooks/useSettings';
import { useBranchData } from '../../hooks/useBranchData';
import { Loader2, Download, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Utility function for formatting currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface ReportFilters {
  startDate: string;
  endDate: string;
  branchId?: string;
  reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow';
}

const FinancialReports: React.FC = () => {
  const {
    loading,
    reports,
    currentReport,
    fetchReports,
    generateProfitLossReport,
    generateBalanceSheetReport,
    generateCashFlowReport,
    exportReport
  } = useFinancialReports();
  
  const { branches } = useBranchData();
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'profit_loss'
  });
  
  const [activeTab, setActiveTab] = useState('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      let report;
      
      switch (filters.reportType) {
        case 'profit_loss':
          report = await generateProfitLossReport(filters.startDate, filters.endDate, filters.branchId);
          break;
        case 'balance_sheet':
          report = await generateBalanceSheetReport(filters.endDate, filters.branchId);
          break;
        case 'cash_flow':
          report = await generateCashFlowReport(filters.startDate, filters.endDate, filters.branchId);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setGeneratedReport(report);
      setActiveTab('view');
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    if (!generatedReport) return;
    
    try {
      await exportReport(generatedReport, {
          format,
          includeDetails: true,
          includeSummary: true
        });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const renderProfitLossReport = (report: any) => {
    if (!report) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">รายงานกำไรขาดทุน</h2>
          <p className="text-muted-foreground">
            ระหว่างวันที่ {new Date(report.period.startDate).toLocaleDateString('th-TH')} 
            ถึง {new Date(report.period.endDate).toLocaleDateString('th-TH')}
          </p>
          {report.branchId && (
            <p className="text-sm text-muted-foreground">
              สาขา: {branches.find(b => b.id === report.branchId)?.name || 'ไม่ระบุ'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(report.revenues?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ค่าใช้จ่ายรวม</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  (report.costOfGoodsSold?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0) +
                  (report.operatingExpenses?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0)
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(report.netIncome || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รายการ</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* รายได้ */}
            <TableRow className="bg-green-50">
              <TableCell className="font-semibold">รายได้</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {report.revenues?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="pl-8">{item.accountName}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
            
            {/* ต้นทุนขาย */}
            <TableRow className="bg-red-50">
              <TableCell className="font-semibold">ต้นทุนขาย</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {report.costOfGoodsSold?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="pl-8">{item.accountName}</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
            
            {/* กำไรขั้นต้น */}
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">กำไรขั้นต้น</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(report.grossProfit || 0)}
              </TableCell>
            </TableRow>
            
            {/* ค่าใช้จ่ายในการดำเนินงาน */}
            <TableRow className="bg-orange-50">
              <TableCell className="font-semibold">ค่าใช้จ่ายในการดำเนินงาน</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {report.operatingExpenses?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="pl-8">{item.accountName}</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
            
            {/* กำไรจากการดำเนินงาน */}
            <TableRow className="border-t-2">
              <TableCell className="font-semibold">กำไรจากการดำเนินงาน</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(report.operatingIncome || 0)}
              </TableCell>
            </TableRow>
            
            {/* กำไรสุทธิ */}
            <TableRow className="border-t-4 bg-blue-50">
              <TableCell className="font-bold text-lg">กำไรสุทธิ</TableCell>
              <TableCell className={`text-right font-bold text-lg ${
                report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(report.netIncome || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderBalanceSheetReport = (report: any) => {
    if (!report) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">งบดุล</h2>
          <p className="text-muted-foreground">
            ณ วันที่ {new Date(report.asOfDate).toLocaleDateString('th-TH')}
          </p>
          {report.branchId && (
            <p className="text-sm text-muted-foreground">
              สาขา: {branches.find(b => b.id === report.branchId)?.name || 'ไม่ระบุ'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* สินทรัพย์ */}
          <Card>
            <CardHeader>
              <CardTitle>สินทรัพย์</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-semibold">สินทรัพย์หมุนเวียน</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(report.assets?.currentAssets?.totalCurrentAssets || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-semibold">สินทรัพย์ไม่หมุนเวียน</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(report.assets?.nonCurrentAssets?.totalNonCurrentAssets || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-4 bg-blue-100">
                    <TableCell className="font-bold">รวมสินทรัพย์</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(report.assets?.totalAssets || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* หนี้สินและส่วนของเจ้าของ */}
          <Card>
            <CardHeader>
              <CardTitle>หนี้สินและส่วนของเจ้าของ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow className="bg-red-50">
                    <TableCell className="font-semibold">หนี้สินหมุนเวียน</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(report.liabilities?.currentLiabilities?.totalCurrentLiabilities || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-red-50">
                    <TableCell className="font-semibold">หนี้สินไม่หมุนเวียน</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(report.liabilities?.nonCurrentLiabilities?.totalNonCurrentLiabilities || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-semibold">ส่วนของเจ้าของ</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(report.equity?.totalEquity || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-4 bg-gray-100">
                    <TableCell className="font-bold">รวมหนี้สินและส่วนของเจ้าของ</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        (report.liabilities?.totalLiabilities || 0) + (report.equity?.totalEquity || 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCashFlowReport = (report: any) => {
    if (!report) return null;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">งบกระแสเงินสด</h2>
          <p className="text-muted-foreground">
            ระหว่างวันที่ {new Date(report.period.startDate).toLocaleDateString('th-TH')} 
            ถึง {new Date(report.period.endDate).toLocaleDateString('th-TH')}
          </p>
          {report.branchId && (
            <p className="text-sm text-muted-foreground">
              สาขา: {branches.find(b => b.id === report.branchId)?.name || 'ไม่ระบุ'}
            </p>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รายการ</TableHead>
              <TableHead className="text-right">จำนวนเงิน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* กิจกรรมดำเนินงาน */}
            <TableRow className="bg-blue-50">
              <TableCell className="font-semibold">กระแสเงินสดจากกิจกรรมดำเนินงาน</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">เงินสดสุทธิจากกิจกรรมดำเนินงาน</TableCell>
              <TableCell className="text-right">
                {formatCurrency(report.operatingActivities?.netOperatingCashFlow || 0)}
              </TableCell>
            </TableRow>
            
            {/* กิจกรรมลงทุน */}
            <TableRow className="bg-green-50">
              <TableCell className="font-semibold">กระแสเงินสดจากกิจกรรมลงทุน</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">เงินสดสุทธิจากกิจกรรมลงทุน</TableCell>
              <TableCell className="text-right">
                {formatCurrency(report.investingActivities?.netInvestingCashFlow || 0)}
              </TableCell>
            </TableRow>
            
            {/* กิจกรรมจัดหาเงิน */}
            <TableRow className="bg-orange-50">
              <TableCell className="font-semibold">กระแสเงินสดจากกิจกรรมจัดหาเงิน</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-8">เงินสดสุทธิจากกิจกรรมจัดหาเงิน</TableCell>
              <TableCell className="text-right">
                {formatCurrency(report.financingActivities?.netFinancingCashFlow || 0)}
              </TableCell>
            </TableRow>
            
            {/* เงินสดสุทธิ */}
            <TableRow className="border-t-4 bg-blue-100">
              <TableCell className="font-bold">เงินสดสุทธิเพิ่มขึ้น (ลดลง)</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(report.netCashFlow || 0)}
              </TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell>เงินสดต้นงวด</TableCell>
              <TableCell className="text-right">
                {formatCurrency(report.beginningCashBalance || 0)}
              </TableCell>
            </TableRow>
            
            <TableRow className="border-t-2 bg-gray-100">
              <TableCell className="font-bold">เงินสดปลายงวด</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(report.endingCashBalance || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderReport = () => {
    if (!generatedReport) return null;
    
    switch (filters.reportType) {
      case 'profit_loss':
        return renderProfitLossReport(generatedReport);
      case 'balance_sheet':
        return renderBalanceSheetReport(generatedReport);
      case 'cash_flow':
        return renderCashFlowReport(generatedReport);
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">รายงานทางการเงิน</h1>
          <p className="text-muted-foreground">สร้างและจัดการรายงานทางการเงินแยกตามสาขา</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">สร้างรายงาน</TabsTrigger>
          <TabsTrigger value="view">ดูรายงาน</TabsTrigger>
          <TabsTrigger value="history">ประวัติรายงาน</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สร้างรายงานใหม่</CardTitle>
              <CardDescription>
                เลือกประเภทรายงานและช่วงเวลาที่ต้องการสร้างรายงาน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">ประเภทรายงาน</Label>
                  <Select
                    value={filters.reportType}
                    onValueChange={(value: any) => setFilters(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทรายงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit_loss">รายงานกำไรขาดทุน</SelectItem>
                      <SelectItem value="balance_sheet">งบดุล</SelectItem>
                      <SelectItem value="cash_flow">งบกระแสเงินสด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">สาขา</Label>
                  <Select
                    value={filters.branchId || ''}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, branchId: value || undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ทุกสาขา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกสาขา</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[120px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      สร้างรายงาน
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          {generatedReport ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>รายงานที่สร้าง</CardTitle>
                    <CardDescription>
                      สร้างเมื่อ {new Date(generatedReport.generatedAt).toLocaleString('th-TH')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport('pdf')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport('excel')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderReport()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายงาน</h3>
                <p className="text-muted-foreground text-center mb-4">
                  กรุณาสร้างรายงานใหม่ในแท็บ "สร้างรายงาน"
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  สร้างรายงานใหม่
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติรายงาน</CardTitle>
              <CardDescription>
                รายงานที่สร้างไว้ทั้งหมด
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อรายงาน</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>ช่วงเวลา</TableHead>
                      <TableHead>สาขา</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>วันที่สร้าง</TableHead>
                      <TableHead className="text-right">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.report_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.report_type === 'profit_loss' && 'กำไรขาดทุน'}
                            {report.report_type === 'balance_sheet' && 'งบดุล'}
                            {report.report_type === 'cash_flow' && 'กระแสเงินสด'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.period_start).toLocaleDateString('th-TH')} - 
                          {new Date(report.period_end).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          {report.branch_id 
                            ? branches.find(b => b.id === report.branch_id)?.name || 'ไม่ระบุ'
                            : 'ทุกสาขา'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={report.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {report.status === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGeneratedReport(report.data);
                              setActiveTab('view');
                            }}
                          >
                            ดูรายงาน
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายงาน</h3>
                  <p className="text-muted-foreground">
                    ยังไม่มีรายงานที่สร้างไว้
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;