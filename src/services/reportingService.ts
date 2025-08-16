import { supabase } from '../integrations/supabase/client';
import { 
  Report, 
  ReportParams, 
  ReportDefinition, 
  ReportExecution,
  ReportType,
  ExportFormat,
  SupplierPerformanceMetrics,
  ReportPermission
} from '../types/reports';
import { ReportingError, ReportGenerationError, ReportExportError } from '../errors/reporting';
import { ErrorHandlerService } from './error-handler.service';
import { ReportCacheService } from './report-cache.service';
import { ReportAccessControlService } from './report-access-control.service';
import { ReportTemplateService } from './report-template.service';

/**
 * Core reporting service that provides dynamic query generation,
 * parameter validation, caching, and access control for reports
 */
export class ReportingService {
  private errorHandler: ErrorHandlerService;
  private cacheService: ReportCacheService;
  private accessControl: ReportAccessControlService;
  private templateService: ReportTemplateService;

  constructor() {
    this.errorHandler = new ErrorHandlerService();
    this.cacheService = new ReportCacheService();
    this.accessControl = new ReportAccessControlService();
    this.templateService = new ReportTemplateService();
  }

  /**
   * Generate a report based on type and parameters
   */
  async generateReport(
    reportType: ReportType,
    parameters: ReportParams,
    userId: string
  ): Promise<Report> {
    try {
      // Validate access permissions
      await this.accessControl.validateReportAccess(userId, reportType, 'view');

      // Validate parameters
      const validatedParams = await this.validateReportParameters(reportType, parameters);

      // Check cache first
      const cacheKey = this.generateCacheKey(reportType, validatedParams);
      const cachedReport = await this.cacheService.getReport(cacheKey);
      
      if (cachedReport && !this.isCacheExpired(cachedReport)) {
        return cachedReport;
      }

      // Generate new report
      const report = await this.executeReportGeneration(reportType, validatedParams, userId);

      // Cache the result
      await this.cacheService.setReport(cacheKey, report);

      return report;
    } catch (error) {
      await this.errorHandler.handleServiceError(error, 'ReportingService.generateReport');
      throw new ReportGenerationError(
        `Failed to generate ${reportType} report: ${error.message}`,
        reportType,
        { parameters, userId }
      );
    }
  }

  /**
   * Get supplier performance report with comprehensive metrics
   */
  async generateSupplierPerformanceReport(params: ReportParams): Promise<Report> {
    try {
      const query = this.buildSupplierPerformanceQuery(params);
      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query.sql,
        query_params: query.params
      });

      if (error) throw error;

      const metrics: SupplierPerformanceMetrics[] = data.map(this.mapSupplierPerformanceData);

      return {
        id: this.generateReportId(),
        name: 'Supplier Performance Report',
        type: 'supplier_performance',
        parameters: params,
        data: metrics,
        metadata: {
          totalRecords: metrics.length,
          generationTime: Date.now(),
          dataSource: 'supplier_performance_metrics',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        exportFormats: ['pdf', 'excel', 'csv'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate supplier performance report',
        'supplier_performance',
        { parameters: params }
      );
    }
  }

  /**
   * Generate spending analysis report with trends
   */
  async generateSpendingAnalysisReport(params: ReportParams): Promise<Report> {
    try {
      const query = this.buildSpendingAnalysisQuery(params);
      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query.sql,
        query_params: query.params
      });

      if (error) throw error;

      return {
        id: this.generateReportId(),
        name: 'Spending Analysis Report',
        type: 'spending_analysis',
        parameters: params,
        data: data,
        metadata: {
          totalRecords: data.length,
          generationTime: Date.now(),
          dataSource: 'supplier_invoices',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        exportFormats: ['pdf', 'excel', 'csv'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate spending analysis report',
        'spending_analysis',
        { parameters: params }
      );
    }
  }

  /**
   * Generate aging report for outstanding invoices
   */
  async generateAgingReport(params: ReportParams): Promise<Report> {
    try {
      const query = this.buildAgingReportQuery(params);
      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query.sql,
        query_params: query.params
      });

      if (error) throw error;

      return {
        id: this.generateReportId(),
        name: 'Aging Report',
        type: 'aging_report',
        parameters: params,
        data: data,
        metadata: {
          totalRecords: data.length,
          generationTime: Date.now(),
          dataSource: 'supplier_invoices',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        exportFormats: ['pdf', 'excel', 'csv'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate aging report',
        'aging_report',
        { parameters: params }
      );
    }
  }

  /**
   * Generate cash flow projection report
   */
  async generateCashFlowProjection(params: ReportParams): Promise<Report> {
    try {
      const query = this.buildCashFlowProjectionQuery(params);
      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query.sql,
        query_params: query.params
      });

      if (error) throw error;

      return {
        id: this.generateReportId(),
        name: 'Cash Flow Projection',
        type: 'cash_flow_projection',
        parameters: params,
        data: data,
        metadata: {
          totalRecords: data.length,
          generationTime: Date.now(),
          dataSource: 'supplier_invoices',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        exportFormats: ['pdf', 'excel', 'csv'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate cash flow projection',
        'cash_flow_projection',
        { parameters: params }
      );
    }
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId: string, format: ExportFormat, userId: string): Promise<string> {
    try {
      // Validate export permissions
      await this.accessControl.validateReportAccess(userId, 'custom_report', 'export');

      // Get report data
      const report = await this.getReportById(reportId);
      if (!report) {
        throw new ReportingError('Report not found', 'REPORT_NOT_FOUND', { reportId });
      }

      // Generate export file
      const exportUrl = await this.generateExportFile(report, format);
      
      return exportUrl;
    } catch (error) {
      throw new ReportExportError(
        `Failed to export report to ${format}`,
        format,
        { reportId, userId }
      );
    }
  }

  /**
   * Get available report definitions
   */
  async getReportDefinitions(userId: string): Promise<ReportDefinition[]> {
    try {
      const { data, error } = await supabase
        .from('report_definitions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Filter by user permissions
      const filteredDefinitions = await Promise.all(
        data.map(async (def) => {
          const hasAccess = await this.accessControl.validateReportAccess(
            userId, 
            def.type as ReportType, 
            'view'
          );
          return hasAccess ? def : null;
        })
      );

      return filteredDefinitions.filter(Boolean) as ReportDefinition[];
    } catch (error) {
      throw new ReportingError(
        'Failed to get report definitions',
        'REPORT_DEFINITIONS_FETCH_FAILED',
        { userId }
      );
    }
  }

  // Private helper methods

  private async validateReportParameters(
    reportType: ReportType,
    parameters: ReportParams
  ): Promise<ReportParams> {
    // Validate date range
    if (!parameters.dateRange || !parameters.dateRange.startDate || !parameters.dateRange.endDate) {
      throw new ReportingError(
        'Date range is required',
        'INVALID_PARAMETERS',
        { reportType, parameters }
      );
    }

    const startDate = new Date(parameters.dateRange.startDate);
    const endDate = new Date(parameters.dateRange.endDate);

    if (startDate >= endDate) {
      throw new ReportingError(
        'Start date must be before end date',
        'INVALID_DATE_RANGE',
        { startDate, endDate }
      );
    }

    // Validate filters
    if (parameters.filters) {
      for (const filter of parameters.filters) {
        if (!filter.field || !filter.operator || filter.value === undefined) {
          throw new ReportingError(
            'Invalid filter configuration',
            'INVALID_FILTER',
            { filter }
          );
        }
      }
    }

    return parameters;
  }

  private generateCacheKey(reportType: ReportType, parameters: ReportParams): string {
    const paramString = JSON.stringify(parameters);
    return `report:${reportType}:${Buffer.from(paramString).toString('base64')}`;
  }

  private isCacheExpired(report: Report): boolean {
    if (!report.metadata.cacheExpiry) return false;
    return new Date() > new Date(report.metadata.cacheExpiry);
  }

  private async executeReportGeneration(
    reportType: ReportType,
    parameters: ReportParams,
    userId: string
  ): Promise<Report> {
    const startTime = Date.now();

    try {
      let report: Report;

      switch (reportType) {
        case 'supplier_performance':
          report = await this.generateSupplierPerformanceReport(parameters);
          break;
        case 'spending_analysis':
          report = await this.generateSpendingAnalysisReport(parameters);
          break;
        case 'aging_report':
          report = await this.generateAgingReport(parameters);
          break;
        case 'cash_flow_projection':
          report = await this.generateCashFlowProjection(parameters);
          break;
        default:
          throw new ReportingError(
            `Unsupported report type: ${reportType}`,
            'UNSUPPORTED_REPORT_TYPE',
            { reportType }
          );
      }

      // Update generation time
      report.metadata.generationTime = Date.now() - startTime;
      report.generatedBy = userId;

      return report;
    } catch (error) {
      throw new ReportGenerationError(
        `Report generation failed: ${error.message}`,
        reportType,
        { parameters, userId, executionTime: Date.now() - startTime }
      );
    }
  }

  private buildSupplierPerformanceQuery(params: ReportParams): { sql: string; params: any[] } {
    let sql = `
      SELECT 
        s.id as supplier_id,
        s.supplier_name,
        s.supplier_code,
        spm.total_spend,
        spm.invoice_count,
        spm.average_payment_days,
        spm.on_time_delivery_rate,
        spm.quality_score,
        spm.reliability_score,
        spm.cost_efficiency_rating,
        spm.calculated_at
      FROM suppliers s
      LEFT JOIN supplier_performance_metrics spm ON s.id = spm.supplier_id
      WHERE s.status = 'active'
        AND spm.period_start >= $1
        AND spm.period_end <= $2
    `;

    const queryParams = [params.dateRange.startDate, params.dateRange.endDate];

    // Add filters
    if (params.filters) {
      params.filters.forEach((filter, index) => {
        const paramIndex = queryParams.length + 1;
        switch (filter.operator) {
          case 'equals':
            sql += ` AND ${filter.field} = $${paramIndex}`;
            break;
          case 'greater':
            sql += ` AND ${filter.field} > $${paramIndex}`;
            break;
          case 'less':
            sql += ` AND ${filter.field} < $${paramIndex}`;
            break;
          case 'contains':
            sql += ` AND ${filter.field} ILIKE $${paramIndex}`;
            queryParams.push(`%${filter.value}%`);
            return;
        }
        queryParams.push(filter.value);
      });
    }

    // Add sorting
    if (params.sortBy && params.sortBy.length > 0) {
      const sortClauses = params.sortBy.map(sort => `${sort.field} ${sort.direction}`);
      sql += ` ORDER BY ${sortClauses.join(', ')}`;
    } else {
      sql += ` ORDER BY s.supplier_name`;
    }

    return { sql, params: queryParams };
  }

  private buildSpendingAnalysisQuery(params: ReportParams): { sql: string; params: any[] } {
    const sql = `
      SELECT 
        s.supplier_name,
        s.supplier_code,
        COUNT(si.id) as invoice_count,
        SUM(si.total_amount) as total_spend,
        AVG(si.total_amount) as average_invoice_amount,
        MIN(si.invoice_date) as first_invoice_date,
        MAX(si.invoice_date) as last_invoice_date,
        SUM(CASE WHEN si.status = 'paid' THEN si.total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN si.status != 'paid' THEN si.remaining_amount ELSE 0 END) as outstanding_amount
      FROM suppliers s
      INNER JOIN supplier_invoices si ON s.id = si.supplier_id
      WHERE si.invoice_date >= $1 AND si.invoice_date <= $2
      GROUP BY s.id, s.supplier_name, s.supplier_code
      ORDER BY total_spend DESC
    `;

    return {
      sql,
      params: [params.dateRange.startDate, params.dateRange.endDate]
    };
  }

  private buildAgingReportQuery(params: ReportParams): { sql: string; params: any[] } {
    const sql = `
      SELECT 
        s.supplier_name,
        s.supplier_code,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.total_amount,
        si.remaining_amount,
        CASE 
          WHEN si.due_date >= CURRENT_DATE THEN 'Current'
          WHEN si.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 Days'
          WHEN si.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 Days'
          WHEN si.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 Days'
          ELSE '90+ Days'
        END as aging_bucket,
        CURRENT_DATE - si.due_date as days_overdue
      FROM suppliers s
      INNER JOIN supplier_invoices si ON s.id = si.supplier_id
      WHERE si.remaining_amount > 0
        AND si.invoice_date >= $1 
        AND si.invoice_date <= $2
      ORDER BY s.supplier_name, si.due_date
    `;

    return {
      sql,
      params: [params.dateRange.startDate, params.dateRange.endDate]
    };
  }

  private buildCashFlowProjectionQuery(params: ReportParams): { sql: string; params: any[] } {
    const sql = `
      SELECT 
        si.due_date as payment_date,
        SUM(si.remaining_amount) as projected_payment,
        COUNT(si.id) as invoice_count,
        STRING_AGG(s.supplier_name, ', ') as suppliers
      FROM supplier_invoices si
      INNER JOIN suppliers s ON si.supplier_id = s.id
      WHERE si.remaining_amount > 0
        AND si.due_date >= $1
        AND si.due_date <= $2
      GROUP BY si.due_date
      ORDER BY si.due_date
    `;

    return {
      sql,
      params: [params.dateRange.startDate, params.dateRange.endDate]
    };
  }

  private mapSupplierPerformanceData(row: any): SupplierPerformanceMetrics {
    return {
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      supplierCode: row.supplier_code,
      period: {
        startDate: row.period_start,
        endDate: row.period_end
      },
      totalSpend: row.total_spend || 0,
      invoiceCount: row.invoice_count || 0,
      averageInvoiceAmount: row.total_spend / (row.invoice_count || 1),
      totalPaid: row.total_spend || 0,
      outstandingAmount: 0,
      averagePaymentDays: row.average_payment_days || 0,
      onTimePaymentRate: 0,
      earlyPaymentRate: 0,
      latePaymentRate: 0,
      averageLateDays: 0,
      onTimeDeliveryRate: row.on_time_delivery_rate || 0,
      averageDeliveryDays: 0,
      deliveryReliabilityScore: 0,
      qualityScore: row.quality_score || 0,
      defectRate: 0,
      returnRate: 0,
      complaintCount: 0,
      reliabilityScore: row.reliability_score || 0,
      costEfficiencyRating: row.cost_efficiency_rating || 0,
      overallRating: (row.reliability_score + row.quality_score + row.cost_efficiency_rating) / 3 || 0,
      riskLevel: 'low',
      performanceTrend: 'stable',
      spendTrend: 'stable',
      recommendations: [],
      alerts: [],
      calculatedAt: row.calculated_at || new Date().toISOString()
    };
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getReportById(reportId: string): Promise<Report | null> {
    // This would typically fetch from a reports table or cache
    // For now, return null as this is a placeholder
    return null;
  }

  private async generateExportFile(report: Report, format: ExportFormat): Promise<string> {
    // This would generate the actual export file
    // For now, return a placeholder URL
    return `https://example.com/exports/${report.id}.${format}`;
  }
}

export default ReportingService;