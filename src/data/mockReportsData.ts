import { 
  SalesReport, 
  InventoryReport, 
  FinancialReport, 
  CustomReportConfig,
  ReportStats,
  ProductSales,
  CategorySales,
  EmployeeSales,
  LowStockItem,
  SlowMovingItem,
  StockMovement,
  CashFlowData
} from '@/types/reports';

// Mock Sales Data
export const mockSalesReports: SalesReport[] = [
  {
    id: 'sales-001',
    date: new Date('2024-01-01'),
    totalSales: 125000,
    totalOrders: 45,
    averageOrderValue: 2777.78,
    topProducts: [
      {
        productId: 'prod-001',
        productName: 'โซฟา 3 ที่นั่ง Modern',
        quantity: 8,
        revenue: 32000,
        profit: 8000
      },
      {
        productId: 'prod-002',
        productName: 'เตียงนอน King Size',
        quantity: 5,
        revenue: 25000,
        profit: 7500
      },
      {
        productId: 'prod-003',
        productName: 'ตู้เสื้อผ้า 4 บาน',
        quantity: 6,
        revenue: 18000,
        profit: 5400
      }
    ],
    salesByCategory: [
      { category: 'โซฟา', quantity: 12, revenue: 45000, percentage: 36 },
      { category: 'เตียง', quantity: 8, revenue: 35000, percentage: 28 },
      { category: 'ตู้', quantity: 10, revenue: 25000, percentage: 20 },
      { category: 'โต๊ะ', quantity: 15, revenue: 20000, percentage: 16 }
    ],
    salesByEmployee: [
      {
        employeeId: 'emp-001',
        employeeName: 'สมชาย ใจดี',
        totalSales: 45000,
        totalOrders: 15,
        commission: 2250
      },
      {
        employeeId: 'emp-002',
        employeeName: 'สมหญิง รักงาน',
        totalSales: 38000,
        totalOrders: 12,
        commission: 1900
      },
      {
        employeeId: 'emp-003',
        employeeName: 'วิชัย ขยัน',
        totalSales: 42000,
        totalOrders: 18,
        commission: 2100
      }
    ]
  }
];

// Mock Inventory Data
export const mockInventoryReports: InventoryReport[] = [
  {
    id: 'inv-001',
    date: new Date('2024-01-01'),
    totalProducts: 150,
    totalValue: 2500000,
    lowStockItems: [
      {
        productId: 'prod-004',
        productName: 'เก้าอี้ทำงาน Ergonomic',
        currentStock: 3,
        minimumStock: 10,
        reorderLevel: 15
      },
      {
        productId: 'prod-005',
        productName: 'โต๊ะกาแฟ Glass Top',
        currentStock: 2,
        minimumStock: 8,
        reorderLevel: 12
      }
    ],
    slowMovingItems: [
      {
        productId: 'prod-006',
        productName: 'ตู้โชว์ Vintage',
        lastSaleDate: new Date('2023-11-15'),
        currentStock: 5,
        daysWithoutSale: 47
      },
      {
        productId: 'prod-007',
        productName: 'โคมไฟตั้งพื้น Classic',
        lastSaleDate: new Date('2023-12-01'),
        currentStock: 8,
        daysWithoutSale: 31
      }
    ],
    stockMovements: [
      {
        productId: 'prod-001',
        productName: 'โซฟา 3 ที่นั่ง Modern',
        movementType: 'OUT',
        quantity: 2,
        date: new Date('2024-01-01'),
        reason: 'ขายให้ลูกค้า'
      },
      {
        productId: 'prod-008',
        productName: 'เตียงเด็ก Safety',
        movementType: 'IN',
        quantity: 10,
        date: new Date('2024-01-01'),
        reason: 'รับสินค้าใหม่'
      }
    ]
  }
];

// Mock Financial Data
export const mockFinancialReports: FinancialReport[] = [
  {
    id: 'fin-001',
    period: 'มกราคม 2024',
    revenue: 125000,
    expenses: 85000,
    profit: 40000,
    profitMargin: 32,
    cashFlow: [
      {
        date: new Date('2024-01-01'),
        inflow: 125000,
        outflow: 85000,
        netFlow: 40000,
        balance: 240000
      },
      {
        date: new Date('2024-01-02'),
        inflow: 95000,
        outflow: 65000,
        netFlow: 30000,
        balance: 270000
      }
    ],
    accountsReceivable: 45000,
    accountsPayable: 32000
  }
];

// Mock Custom Report Configs
export const mockCustomReportConfigs: CustomReportConfig[] = [
  {
    id: 'custom-001',
    name: 'รายงานสินค้าขายดีประจำเดือน',
    description: 'รายงานแสดงสินค้าที่ขายดีที่สุดในแต่ละเดือน',
    fields: [
      { name: 'productName', label: 'ชื่อสินค้า', type: 'string' },
      { name: 'quantity', label: 'จำนวนที่ขาย', type: 'number', aggregation: 'sum' },
      { name: 'revenue', label: 'รายได้', type: 'number', aggregation: 'sum' }
    ],
    filters: [
      { field: 'date', operator: 'between', value: ['2024-01-01', '2024-01-31'] }
    ],
    groupBy: ['productName'],
    sortBy: [{ field: 'quantity', direction: 'desc' }],
    chartType: 'bar'
  },
  {
    id: 'custom-002',
    name: 'รายงานประสิทธิภาพพนักงาน',
    description: 'รายงานแสดงประสิทธิภาพการขายของพนักงานแต่ละคน',
    fields: [
      { name: 'employeeName', label: 'ชื่อพนักงาน', type: 'string' },
      { name: 'totalSales', label: 'ยอดขายรวม', type: 'number', aggregation: 'sum' },
      { name: 'totalOrders', label: 'จำนวนออเดอร์', type: 'number', aggregation: 'count' }
    ],
    filters: [],
    groupBy: ['employeeName'],
    sortBy: [{ field: 'totalSales', direction: 'desc' }],
    chartType: 'pie'
  }
];

// Mock Report Stats
export const mockReportStats: ReportStats = {
  totalReports: 156,
  reportsThisMonth: 23,
  mostUsedReportType: 'sales',
  averageGenerationTime: 2.5
};

// Helper functions for generating mock data
export const generateMockSalesData = (days: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 50000) + 20000,
      orders: Math.floor(Math.random() * 30) + 10
    });
  }
  return data.reverse();
};

export const generateMockInventoryData = () => {
  return [
    { category: 'โซฟา', stock: 45, value: 450000 },
    { category: 'เตียง', stock: 32, value: 320000 },
    { category: 'ตู้', stock: 28, value: 280000 },
    { category: 'โต๊ะ', stock: 35, value: 175000 },
    { category: 'เก้าอี้', stock: 60, value: 180000 }
  ];
};

export const generateMockFinancialData = (months: number) => {
  const data = [];
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const revenue = Math.floor(Math.random() * 100000) + 80000;
    const expenses = Math.floor(revenue * 0.7);
    data.push({
      month: date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }),
      revenue,
      expenses,
      profit: revenue - expenses
    });
  }
  return data.reverse();
};