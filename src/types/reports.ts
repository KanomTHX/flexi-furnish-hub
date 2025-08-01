export interface ReportData {
  id: string;
  name: string;
  type: ReportType;
  dateRange: DateRange;
  data: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SalesReport {
  id: string;
  date: Date;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: ProductSales[];
  salesByCategory: CategorySales[];
  salesByEmployee: EmployeeSales[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface CategorySales {
  category: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface EmployeeSales {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  totalOrders: number;
  commission: number;
}

export interface InventoryReport {
  id: string;
  date: Date;
  totalProducts: number;
  totalValue: number;
  lowStockItems: LowStockItem[];
  slowMovingItems: SlowMovingItem[];
  stockMovements: StockMovement[];
}

export interface LowStockItem {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
}

export interface SlowMovingItem {
  productId: string;
  productName: string;
  lastSaleDate: Date;
  currentStock: number;
  daysWithoutSale: number;
}

export interface StockMovement {
  productId: string;
  productName: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: Date;
  reason: string;
}

export interface FinancialReport {
  id: string;
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  cashFlow: CashFlowData[];
  accountsReceivable: number;
  accountsPayable: number;
}

export interface CashFlowData {
  date: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
  balance: number;
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description: string;
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: SortConfig[];
  chartType?: ChartType;
}

export interface ReportField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export type ReportType = 
  | 'sales' 
  | 'inventory' 
  | 'financial' 
  | 'customer' 
  | 'employee' 
  | 'custom';

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'area' 
  | 'scatter';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportStats {
  totalReports: number;
  reportsThisMonth: number;
  mostUsedReportType: ReportType;
  averageGenerationTime: number;
}