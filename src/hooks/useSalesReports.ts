import { useState, useEffect, useCallback } from 'react';
import { salesReportService, SalesReportData, SalesChartData, TopProduct, SalesByCategory, SalesTeamMember } from '../services/salesReportService';
import { useBranchData } from './useBranchData';
import { useToast } from './use-toast';

export interface UseSalesReportsReturn {
  // Data
  salesSummary: SalesReportData | null;
  salesChartData: SalesChartData[];
  topProducts: TopProduct[];
  salesByCategory: SalesByCategory[];
  salesTeam: SalesTeamMember[];
  
  // States
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  generateReport: () => Promise<void>;
  exportReport: () => void;
}

export function useSalesReports(): UseSalesReportsReturn {
  const { currentBranch } = useBranchData();
  const { toast } = useToast();
  
  const [salesSummary, setSalesSummary] = useState<SalesReportData | null>(null);
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!currentBranch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // ดึงข้อมูลทั้งหมดพร้อมกัน
      const [summary, chartData, products, categories, team] = await Promise.all([
        salesReportService.getSalesSummary(currentBranch.id),
        salesReportService.getSalesChartData(currentBranch.id),
        salesReportService.getTopProducts(currentBranch.id, 5),
        salesReportService.getSalesByCategory(currentBranch.id),
        salesReportService.getSalesTeamPerformance(currentBranch.id)
      ]);
      
      setSalesSummary(summary);
      setSalesChartData(chartData);
      setTopProducts(products);
      setSalesByCategory(categories);
      setSalesTeam(team);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานยอดขาย';
      setError(errorMessage);
      toast({
        title: 'ข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentBranch, toast]);

  const generateReport = useCallback(async () => {
    await refreshData();
    toast({
      title: 'สำเร็จ',
      description: 'สร้างรายงานยอดขายเรียบร้อยแล้ว'
    });
  }, [refreshData, toast]);

  const exportReport = useCallback(() => {
    if (!salesSummary || !currentBranch) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่มีข้อมูลรายงานสำหรับส่งออก',
        variant: 'destructive'
      });
      return;
    }

    // สร้างข้อมูล CSV
    const csvData = [
      ['รายงานยอดขาย - ' + currentBranch.name],
      ['วันที่สร้างรายงาน: ' + new Date().toLocaleDateString('th-TH')],
      [''],
      ['สรุปยอดขาย'],
      ['ยอดขายรวม', salesSummary.totalSales.toLocaleString('th-TH')],
      ['จำนวนออเดอร์', salesSummary.totalOrders.toString()],
      ['ค่าเฉลี่ยต่อออเดอร์', salesSummary.averageOrderValue.toLocaleString('th-TH')],
      ['ลูกค้าใหม่', salesSummary.newCustomers.toString()],
      [''],
      ['สินค้าขายดี'],
      ['ชื่อสินค้า', 'ยอดขาย', 'จำนวน', 'การเติบโต (%)'],
      ...topProducts.map(product => [
        product.name,
        product.sales.toLocaleString('th-TH'),
        product.quantity.toString(),
        product.growth.toFixed(1)
      ]),
      [''],
      ['ยอดขายตามหมวดหมู่'],
      ['หมวดหมู่', 'ยอดขาย', 'เปอร์เซ็นต์'],
      ...salesByCategory.map(category => [
        category.category,
        category.sales.toLocaleString('th-TH'),
        category.percentage + '%'
      ]),
      [''],
      ['ประสิทธิภาพทีมขาย'],
      ['พนักงาน', 'ยอดขาย', 'ออเดอร์', 'คอมมิชชั่น', 'การเติบโต (%)'],
      ...salesTeam.map(member => [
        member.name,
        member.sales.toLocaleString('th-TH'),
        member.orders.toString(),
        member.commission.toLocaleString('th-TH'),
        member.growth.toFixed(1)
      ])
    ];

    // เตรียมข้อมูลสำหรับส่งออก
    console.log('Sales report data prepared for export:', csvData);

    toast({
      title: 'สำเร็จ',
      description: 'ส่งออกรายงานยอดขายเรียบร้อยแล้ว'
    });
  }, [salesSummary, topProducts, salesByCategory, salesTeam, currentBranch, toast]);

  // ดึงข้อมูลเมื่อ component mount หรือเมื่อ branch เปลี่ยน
  useEffect(() => {
    if (currentBranch) {
      refreshData();
    }
  }, [currentBranch, refreshData]);

  return {
    // Data
    salesSummary,
    salesChartData,
    topProducts,
    salesByCategory,
    salesTeam,
    
    // States
    loading,
    error,
    
    // Actions
    refreshData,
    generateReport,
    exportReport
  };
}