import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useReports } from '@/hooks/useReports';
import { ReportsOverview } from '@/components/reports/ReportsOverview';
import { SalesReports } from '@/components/reports/SalesReports';
import { InventoryReports } from '@/components/reports/InventoryReports';
import { FinancialReports } from '@/components/reports/FinancialReports';
import { 
  exportSalesReportToCSV, 
  exportInventoryReportToCSV, 
  exportFinancialReportToCSV 
} from '@/utils/reportHelpers';
import { 
  FileText, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Settings,
  Download,
  Plus
} from 'lucide-react';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const {
    salesReports,
    inventoryReports,
    financialReports,
    customReportConfigs,
    reportStats,
    loading,
    error,
    generateSalesReport,
    generateInventoryReport,
    generateFinancialReport,
    loadReportsData,
    getSalesData,
    getInventoryData,
    getFinancialData
  } = useReports();

  const [activeTab, setActiveTab] = useState('overview');

  const handleGenerateReport = async (type: string) => {
    try {
      switch (type) {
        case 'sales':
          await generateSalesReport({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          });
          toast({
            title: "สำเร็จ",
            description: "สร้างรายงานยอดขายเรียบร้อยแล้ว",
          });
          break;
        case 'inventory':
          await generateInventoryReport();
          toast({
            title: "สำเร็จ",
            description: "สร้างรายงานสต็อกเรียบร้อยแล้ว",
          });
          break;
        case 'financial':
          await generateFinancialReport('มกราคม 2024');
          toast({
            title: "สำเร็จ",
            description: "สร้างรายงานการเงินเรียบร้อยแล้ว",
          });
          break;
        case 'custom':
          setActiveTab('custom');
          break;
        default:
          toast({
            title: "ข้อผิดพลาด",
            description: "ประเภทรายงานไม่ถูกต้อง",
            variant: "destructive",
          });
      }
    } catch (err) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive",
      });
    }
  };

  const handleExportSalesReport = () => {
    exportSalesReportToCSV(salesReports);
    toast({
      title: "สำเร็จ",
      description: "ส่งออกรายงานยอดขายเรียบร้อยแล้ว",
    });
  };

  const handleExportInventoryReport = () => {
    exportInventoryReportToCSV(inventoryReports);
    toast({
      title: "สำเร็จ",
      description: "ส่งออกรายงานสต็อกเรียบร้อยแล้ว",
    });
  };

  const handleExportFinancialReport = () => {
    exportFinancialReportToCSV(financialReports);
    toast({
      title: "สำเร็จ",
      description: "ส่งออกรายงานการเงินเรียบร้อยแล้ว",
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadReportsData}>ลองใหม่</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">รายงาน</h1>
          <p className="text-muted-foreground">
            จัดการและสร้างรายงานต่างๆ สำหรับธุรกิจ
          </p>
        </div>
        <Button onClick={() => handleGenerateReport('sales')} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างรายงานใหม่
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
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
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            กำหนดเอง
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ReportsOverview
            stats={reportStats}
            onRefresh={loadReportsData}
            onGenerateReport={handleGenerateReport}
          />
        </TabsContent>

        <TabsContent value="sales">
          <SalesReports
            salesReports={salesReports}
            onGenerateReport={() => handleGenerateReport('sales')}
            onExportReport={handleExportSalesReport}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryReports
            inventoryReports={inventoryReports}
            onGenerateReport={() => handleGenerateReport('inventory')}
            onExportReport={handleExportInventoryReport}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialReports
            financialReports={financialReports}
            onGenerateReport={() => handleGenerateReport('financial')}
            onExportReport={handleExportFinancialReport}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                รายงานแบบกำหนดเอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">สร้างรายงานแบบกำหนดเอง</h3>
                <p className="text-muted-foreground mb-4">
                  เลือกฟิลด์และเงื่อนไขที่ต้องการสำหรับรายงานของคุณ
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  เริ่มสร้างรายงาน
                </Button>
              </div>

              {customReportConfigs.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">รายงานที่บันทึกไว้</h3>
                  <div className="space-y-3">
                    {customReportConfigs.map((config, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{config.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {config.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            แก้ไข
                          </Button>
                          <Button size="sm">
                            สร้าง
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;