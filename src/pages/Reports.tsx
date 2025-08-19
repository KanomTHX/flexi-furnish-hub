import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useReports } from '@/hooks/useReports';
import { useBranchData } from '@/hooks/useBranchData';
import { BranchSelector } from '@/components/branch/BranchSelector';
import { ReportsOverview } from '@/components/reports/ReportsOverview';
import { SalesReports } from '@/components/reports/SalesReports';
import { InventoryReports } from '@/components/reports/InventoryReports';
import FinancialReports from '@/components/reports/FinancialReports';
import { EmployeeReport } from '@/components/reports/EmployeeReport';
import { TransactionReports } from '@/components/accounting/TransactionReports';
import { SerialNumberReports } from '@/components/warehouses/SerialNumberReports';
import { WarehouseAnalytics } from '@/components/warehouses/WarehouseAnalytics';
import { ComplianceReportDialog } from '@/components/audit/ComplianceReportDialog';
import { ClaimsReport } from '@/components/reports/ClaimsReport';
import { WarehouseReport } from '@/components/reports/WarehouseReport';
import { AuditReport } from '@/components/reports/AuditReport';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  Building, 
  Shield, 
  Truck,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Eye,
  Printer,
  Share2,
  FileDown,
  FilePlus
} from 'lucide-react';
import {
  exportSalesReportToCSV,
  exportInventoryReportToCSV,
  exportFinancialReportToCSV
} from '@/utils/reportHelpers';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';

// PDF Export library (you'll need to install this)
// npm install jspdf html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const { 
    salesReports, 
    inventoryReports, 
    financialReports, 
    reportStats,
    loading, 
    generateSalesReport,
    generateInventoryReport,
    generateFinancialReport,
    loadReportsData
  } = useReports();
  const { branches, currentBranch, branchSummary } = useBranchData();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);

  // รวบรวมข้อมูลสาขา
  const totalBranches = branches.length;
  const totalRevenue = branchSummary?.totalRevenue || 0;
  const averageProfit = branchSummary?.averageProfitMargin || 0;
  const criticalAlerts = branchSummary?.totalCriticalAlerts || 5;

  const handleGenerateReport = async (type: string) => {
    try {
      switch (type) {
        case 'sales':
          await generateSalesReport({
            startDate: dateRange?.from || subDays(new Date(), 30),
            endDate: dateRange?.to || new Date()
          });
          break;
        case 'inventory':
          await generateInventoryReport();
          break;
        case 'financial':
          await generateFinancialReport('มกราคม 2024');
          break;
        default:
          break;
      }
      toast({
        title: "สร้างรายงานสำเร็จ",
        description: `รายงาน${type}ถูกสร้างเรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive",
      });
    }
  };

  // Export functions
  const handleExportSalesReport = () => {
    exportSalesReportToCSV(salesReports);
    toast({
      title: "ส่งออกสำเร็จ",
      description: "รายงานยอดขายถูกส่งออกเป็น CSV แล้ว",
    });
  };

  const handleExportInventoryReport = () => {
    exportInventoryReportToCSV(inventoryReports);
    toast({
      title: "ส่งออกสำเร็จ",
      description: "รายงานสต็อกถูกส่งออกเป็น CSV แล้ว",
    });
  };

  const handleExportFinancialReport = () => {
    exportFinancialReportToCSV(financialReports);
    toast({
      title: "ส่งออกสำเร็จ",
      description: "รายงานการเงินถูกส่งออกเป็น CSV แล้ว",
    });
  };

  // PDF Export function
  const handleExportToPDF = async (reportType: string) => {
    setIsExporting(true);
    try {
      const element = document.getElementById(`${reportType}-report-content`);
      if (!element) {
        throw new Error('ไม่พบเนื้อหารายงาน');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "ส่งออก PDF สำเร็จ",
        description: `รายงาน${reportType}ถูกส่งออกเป็น PDF แล้ว`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออก PDF ได้",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Generate comprehensive report
  const handleGenerateComprehensiveReport = async () => {
    try {
      await Promise.all([
        generateSalesReport({
          startDate: dateRange?.from || subDays(new Date(), 30),
          endDate: dateRange?.to || new Date()
        }),
        generateInventoryReport(),
        generateFinancialReport('มกราคม 2024')
      ]);
      
      toast({
        title: "สร้างรายงานครบถ้วนสำเร็จ",
        description: "รายงานจากทุกระบบถูกสร้างเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานครบถ้วนได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ระบบรายงานครบถ้วน</h1>
          <p className="text-muted-foreground">
            รายงานและวิเคราะห์ข้อมูลจากทุกระบบในองค์กร
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateComprehensiveReport} 
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <FilePlus className="h-4 w-4 mr-2" />
            {loading ? 'กำลังสร้าง...' : 'สร้างรายงานครบถ้วน'}
          </Button>
          <Button 
            onClick={() => handleExportToPDF('comprehensive')} 
            disabled={isExporting}
            variant="outline"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? 'กำลังส่งออก...' : 'ส่งออก PDF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองรายงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารายงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ประเภทรายงาน</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="sales">ยอดขาย</SelectItem>
                  <SelectItem value="inventory">สต็อก</SelectItem>
                  <SelectItem value="financial">การเงิน</SelectItem>
                  <SelectItem value="employee">พนักงาน</SelectItem>
                  <SelectItem value="warehouse">คลังสินค้า</SelectItem>
                  <SelectItem value="audit">ตรวจสอบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ช่วงวันที่</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">สาขา</label>
              <BranchSelector />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">จำนวนสาขา</p>
                <p className="text-2xl font-bold">{totalBranches}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">รายได้รวม</p>
                <p className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">กำไรเฉลี่ย</p>
                <p className="text-2xl font-bold">{averageProfit.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">แจ้งเตือนสำคัญ</p>
                <p className="text-2xl font-bold">{criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <div id="comprehensive-report-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ภาพรวม
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ยอดขาย
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              สต็อก
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              การเงิน
            </TabsTrigger>
            <TabsTrigger value="employee" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              พนักงาน
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              คลังสินค้า
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              เคลม
            </TabsTrigger>
            <TabsTrigger value="transaction" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              ธุรกรรม
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ตรวจสอบ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div id="overview-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">ภาพรวมรายงานทั้งหมด</h2>
                <Button 
                  onClick={() => handleExportToPDF('overview')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <ReportsOverview 
                stats={reportStats}
                onRefresh={loadReportsData}
                onGenerateReport={handleGenerateReport}
              />
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div id="sales-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานยอดขาย</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportSalesReport} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออก CSV
                  </Button>
                  <Button 
                    onClick={() => handleExportToPDF('sales')} 
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    ส่งออก PDF
                  </Button>
                </div>
              </div>
              <SalesReports />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div id="inventory-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานสต็อกสินค้า</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportInventoryReport} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออก CSV
                  </Button>
                  <Button 
                    onClick={() => handleExportToPDF('inventory')} 
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    ส่งออก PDF
                  </Button>
                </div>
              </div>
              <InventoryReports
                inventoryReports={inventoryReports}
                onGenerateReport={() => handleGenerateReport('inventory')}
                onExportReport={handleExportInventoryReport}
                loading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div id="financial-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานการเงิน</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportFinancialReport} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออก CSV
                  </Button>
                  <Button 
                    onClick={() => handleExportToPDF('financial')} 
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    ส่งออก PDF
                  </Button>
                </div>
              </div>
              <FinancialReports />
            </div>
          </TabsContent>

          <TabsContent value="employee" className="space-y-4">
            <div id="employee-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานพนักงาน</h2>
                <Button 
                  onClick={() => handleExportToPDF('employee')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <EmployeeReport branchId={currentBranch?.id} />
            </div>
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-4">
            <div id="warehouse-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานคลังสินค้า</h2>
                <Button 
                  onClick={() => handleExportToPDF('warehouse')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <div className="space-y-6">
                <WarehouseAnalytics />
                <SerialNumberReports warehouseId={currentBranch?.id} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-4">
            <div id="warehouse-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานคลังสินค้า</h2>
                <Button 
                  onClick={() => handleExportToPDF('warehouse')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <WarehouseReport />
            </div>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <div id="claims-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานเคลม</h2>
                <Button 
                  onClick={() => handleExportToPDF('claims')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <ClaimsReport />
            </div>
          </TabsContent>

          <TabsContent value="transaction" className="space-y-4">
            <div id="transaction-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานธุรกรรม</h2>
                <Button 
                  onClick={() => handleExportToPDF('transaction')} 
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  ส่งออก PDF
                </Button>
              </div>
              <TransactionReports transactions={[]} />
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div id="audit-report-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">รายงานตรวจสอบ</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowComplianceDialog(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    สร้างรายงานตรวจสอบ
                  </Button>
                  <Button 
                    onClick={() => handleExportToPDF('audit')} 
                    disabled={isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    ส่งออก PDF
                  </Button>
                </div>
              </div>
              <AuditReport />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compliance Report Dialog */}
      <ComplianceReportDialog
        open={showComplianceDialog}
        onOpenChange={setShowComplianceDialog}
      />
    </div>
  );
};

export default Reports;