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

export type ExportFormat = 'pdf' | 'excel';

export interface ReportStats {
  totalReports: number;
  reportsThisMonth: number;
  mostUsedReportType: ReportType;
  averageGenerationTime: number;
}

// Advanced Reporting Types
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  parameters: ReportParams;
  data: any[];
  metadata: ReportMetadata;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  generatedAt?: string;
  generatedBy: string;
  scheduledReportId?: string;
  exportFormats: ExportFormat[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportParams {
  dateRange: DateRange;
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: SortConfig[];
  includeSubtotals?: boolean;
  includeCharts?: boolean;
  chartTypes?: ChartType[];
  customFields?: string[];
  aggregations?: ReportAggregation[];
}

export interface ReportAggregation {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  label?: string;
}

export interface ReportMetadata {
  totalRecords: number;
  generationTime: number; // in milliseconds
  dataSource: string;
  lastRefreshed: string;
  cacheExpiry?: string;
  version: string;
  permissions: ReportPermission[];
}

export interface ReportPermission {
  userId: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canSchedule: boolean;
}

export interface SupplierPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  period: import('./accounting').AccountingPeriod;
  
  // Financial Metrics
  totalSpend: number;
  invoiceCount: number;
  averageInvoiceAmount: number;
  totalPaid: number;
  outstandingAmount: number;
  
  // Payment Performance
  averagePaymentDays: number;
  onTimePaymentRate: number; // percentage
  earlyPaymentRate: number; // percentage
  latePaymentRate: number; // percentage
  averageLateDays: number;
  
  // Delivery Performance
  onTimeDeliveryRate: number; // percentage
  averageDeliveryDays: number;
  deliveryReliabilityScore: number; // 0-100
  
  // Quality Metrics
  qualityScore: number; // 0-100
  defectRate: number; // percentage
  returnRate: number; // percentage
  complaintCount: number;
  
  // Overall Performance
  reliabilityScore: number; // 0-100
  costEfficiencyRating: number; // 0-100
  overallRating: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Trends
  performanceTrend: 'improving' | 'stable' | 'declining';
  spendTrend: 'increasing' | 'stable' | 'decreasing';
  
  // Recommendations
  recommendations: string[];
  alerts: PerformanceAlert[];
  
  calculatedAt: string;
}

export interface PerformanceAlert {
  type: 'payment_delay' | 'quality_issue' | 'delivery_delay' | 'cost_increase' | 'risk_increase';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  createdAt: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportDefinitionId: string;
  reportDefinition?: ReportDefinition;
  schedule: ReportSchedule;
  recipients: ReportRecipient[];
  parameters: ReportParams;
  lastRunAt?: string;
  nextRunAt: string;
  status: 'active' | 'paused' | 'failed' | 'completed';
  runCount: number;
  failureCount: number;
  lastError?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  sqlQuery?: string;
  dataSource: string;
  defaultParameters: ReportParams;
  requiredParameters: string[];
  outputFormats: ExportFormat[];
  estimatedRunTime: number; // in seconds
  isPublic: boolean;
  tags: string[];
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  cronExpression?: string; // for custom frequency
  timezone: string;
  startDate: string;
  endDate?: string;
  runTime: string; // HH:mm format
  weekdays?: number[]; // 0-6, Sunday = 0
  monthDay?: number; // 1-31
  quarterMonth?: number; // 1-3
}

export interface ReportRecipient {
  id: string;
  email: string;
  name?: string;
  role?: string;
  deliveryFormat: ExportFormat;
  includeAttachment: boolean;
  includeInlineData: boolean;
  isActive: boolean;
}

export interface ReportExecution {
  id: string;
  scheduledReportId?: string;
  reportDefinitionId: string;
  parameters: ReportParams;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  executionTime?: number; // in milliseconds
  recordCount?: number;
  fileSize?: number; // in bytes
  outputFiles: ReportOutputFile[];
  error?: string;
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'api';
}

export interface ReportOutputFile {
  id: string;
  filename: string;
  format: ExportFormat;
  size: number; // in bytes
  url: string;
  expiresAt?: string;
  downloadCount: number;
  createdAt: string;
}
// Export error types for easy importing
export * from './errors';