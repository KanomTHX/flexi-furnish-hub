import { useState, useEffect } from 'react';
import { 
  SalesReport, 
  InventoryReport, 
  FinancialReport, 
  CustomReportConfig,
  ReportStats,
  DateRange,
  ReportType
} from '@/types/reports';
import { 
  mockSalesReports, 
  mockInventoryReports, 
  mockFinancialReports,
  mockCustomReportConfigs,
  mockReportStats,
  generateMockSalesData,
  generateMockInventoryData,
  generateMockFinancialData
} from '@/data/mockReportsData';

export const useReports = () => {
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [inventoryReports, setInventoryReports] = useState<InventoryReport[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [customReportConfigs, setCustomReportConfigs] = useState<CustomReportConfig[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSalesReports(mockSalesReports);
      setInventoryReports(mockInventoryReports);
      setFinancialReports(mockFinancialReports);
      setCustomReportConfigs(mockCustomReportConfigs);
      setReportStats(mockReportStats);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน');
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sales Reports
  const generateSalesReport = async (dateRange: DateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newReport: SalesReport = {
        id: `sales-${Date.now()}`,
        date: new Date(),
        totalSales: Math.floor(Math.random() * 100000) + 50000,
        totalOrders: Math.floor(Math.random() * 50) + 20,
        averageOrderValue: 0,
        topProducts: [
          {
            productId: 'prod-001',
            productName: 'โซฟา 3 ที่นั่ง Modern',
            quantity: Math.floor(Math.random() * 10) + 5,
            revenue: Math.floor(Math.random() * 30000) + 20000,
            profit: Math.floor(Math.random() * 8000) + 5000
          }
        ],
        salesByCategory: [
          { category: 'โซฟา', quantity: 12, revenue: 45000, percentage: 36 },
          { category: 'เตียง', quantity: 8, revenue: 35000, percentage: 28 }
        ],
        salesByEmployee: [
          {
            employeeId: 'emp-001',
            employeeName: 'สมชาย ใจดี',
            totalSales: 45000,
            totalOrders: 15,
            commission: 2250
          }
        ]
      };
      
      newReport.averageOrderValue = newReport.totalSales / newReport.totalOrders;
      setSalesReports(prev => [newReport, ...prev]);
      
      return newReport;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างรายงานยอดขาย');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSalesData = (days: number = 30) => {
    return generateMockSalesData(days);
  };

  // Inventory Reports
  const generateInventoryReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newReport: InventoryReport = {
        id: `inv-${Date.now()}`,
        date: new Date(),
        totalProducts: Math.floor(Math.random() * 50) + 100,
        totalValue: Math.floor(Math.random() * 1000000) + 2000000,
        lowStockItems: [
          {
            productId: 'prod-004',
            productName: 'เก้าอี้ทำงาน Ergonomic',
            currentStock: Math.floor(Math.random() * 5) + 1,
            minimumStock: 10,
            reorderLevel: 15
          }
        ],
        slowMovingItems: [
          {
            productId: 'prod-006',
            productName: 'ตู้โชว์ Vintage',
            lastSaleDate: new Date('2023-11-15'),
            currentStock: 5,
            daysWithoutSale: Math.floor(Math.random() * 60) + 30
          }
        ],
        stockMovements: []
      };
      
      setInventoryReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างรายงานสต็อก');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInventoryData = () => {
    return generateMockInventoryData();
  };

  // Financial Reports
  const generateFinancialReport = async (period: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const revenue = Math.floor(Math.random() * 100000) + 80000;
      const expenses = Math.floor(revenue * 0.7);
      const profit = revenue - expenses;
      
      const newReport: FinancialReport = {
        id: `fin-${Date.now()}`,
        period,
        revenue,
        expenses,
        profit,
        profitMargin: (profit / revenue) * 100,
        cashFlow: [
          {
            date: new Date(),
            inflow: revenue,
            outflow: expenses,
            netFlow: profit,
            balance: Math.floor(Math.random() * 500000) + 200000
          }
        ],
        accountsReceivable: Math.floor(Math.random() * 50000) + 30000,
        accountsPayable: Math.floor(Math.random() * 40000) + 25000
      };
      
      setFinancialReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสร้างรายงานการเงิน');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFinancialData = (months: number = 12) => {
    return generateMockFinancialData(months);
  };

  // Custom Reports
  const saveCustomReportConfig = async (config: CustomReportConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newConfig = {
        ...config,
        id: config.id || `custom-${Date.now()}`
      };
      
      setCustomReportConfigs(prev => {
        const existing = prev.find(c => c.id === newConfig.id);
        if (existing) {
          return prev.map(c => c.id === newConfig.id ? newConfig : c);
        }
        return [newConfig, ...prev];
      });
      
      return newConfig;
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกการตั้งค่ารายงาน');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomReportConfig = async (configId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCustomReportConfigs(prev => prev.filter(c => c.id !== configId));
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบการตั้งค่ารายงาน');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Report Statistics
  const updateReportStats = () => {
    const totalReports = salesReports.length + inventoryReports.length + financialReports.length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const reportsThisMonth = [
      ...salesReports.filter(r => r.date >= thisMonth),
      ...inventoryReports.filter(r => r.date >= thisMonth),
      ...financialReports.filter(r => new Date(r.period) >= thisMonth)
    ].length;
    
    setReportStats({
      totalReports,
      reportsThisMonth,
      mostUsedReportType: 'sales' as ReportType,
      averageGenerationTime: 2.5
    });
  };

  // Search and Filter
  const searchReports = (query: string, type?: ReportType) => {
    const results = [];
    
    if (!type || type === 'sales') {
      const salesResults = salesReports.filter(report => 
        report.id.toLowerCase().includes(query.toLowerCase()) ||
        report.topProducts.some(product => 
          product.productName.toLowerCase().includes(query.toLowerCase())
        )
      );
      results.push(...salesResults.map(r => ({ ...r, type: 'sales' as ReportType })));
    }
    
    if (!type || type === 'inventory') {
      const inventoryResults = inventoryReports.filter(report =>
        report.id.toLowerCase().includes(query.toLowerCase()) ||
        report.lowStockItems.some(item =>
          item.productName.toLowerCase().includes(query.toLowerCase())
        )
      );
      results.push(...inventoryResults.map(r => ({ ...r, type: 'inventory' as ReportType })));
    }
    
    if (!type || type === 'financial') {
      const financialResults = financialReports.filter(report =>
        report.id.toLowerCase().includes(query.toLowerCase()) ||
        report.period.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...financialResults.map(r => ({ ...r, type: 'financial' as ReportType })));
    }
    
    return results;
  };

  return {
    // Data
    salesReports,
    inventoryReports,
    financialReports,
    customReportConfigs,
    reportStats,
    
    // State
    loading,
    error,
    
    // Actions
    loadReportsData,
    generateSalesReport,
    generateInventoryReport,
    generateFinancialReport,
    saveCustomReportConfig,
    deleteCustomReportConfig,
    updateReportStats,
    searchReports,
    
    // Data generators
    getSalesData,
    getInventoryData,
    getFinancialData
  };
};