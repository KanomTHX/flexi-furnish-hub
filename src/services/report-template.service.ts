import { supabase } from '../integrations/supabase/client';
import { ReportType, Report, ReportParams } from '../types/reports';
import { ReportingError } from '../errors/reporting';

/**
 * Service for managing report templates and dynamic report generation
 */
export class ReportTemplateService {
  private readonly TEMPLATE_CACHE = new Map<string, ReportTemplate>();

  /**
   * Get report template by type
   */
  async getReportTemplate(reportType: ReportType): Promise<ReportTemplate> {
    try {
      // Check cache first
      const cached = this.TEMPLATE_CACHE.get(reportType);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('report_definitions')
        .select('*')
        .eq('type', reportType)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const template = this.mapToReportTemplate(data);
      
      // Cache the template
      this.TEMPLATE_CACHE.set(reportType, template);

      return template;
    } catch (error) {
      throw new ReportingError(
        `Failed to get report template for ${reportType}`,
        'TEMPLATE_FETCH_ERROR',
        { reportType, error: error.message }
      );
    }
  }

  /**
   * Create a new report template
   */
  async createReportTemplate(template: CreateReportTemplateRequest): Promise<ReportTemplate> {
    try {
      const templateData = {
        name: template.name,
        type: template.type,
        description: template.description,
        sql_query: template.sqlQuery,
        parameters: template.parameters || {},
        default_parameters: template.defaultParameters || {},
        required_parameters: template.requiredParameters || [],
        output_formats: template.outputFormats || ['pdf', 'excel', 'csv'],
        estimated_run_time: template.estimatedRunTime || 30,
        is_public: template.isPublic || false,
        tags: template.tags || [],
        category: template.category || 'general',
        created_by: template.createdBy,
        is_active: true
      };

      const { data, error } = await supabase
        .from('report_definitions')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;

      const newTemplate = this.mapToReportTemplate(data);
      
      // Cache the new template
      this.TEMPLATE_CACHE.set(newTemplate.type, newTemplate);

      return newTemplate;
    } catch (error) {
      throw new ReportingError(
        'Failed to create report template',
        'TEMPLATE_CREATE_ERROR',
        { template, error: error.message }
      );
    }
  }

  /**
   * Update an existing report template
   */
  async updateReportTemplate(
    templateId: string,
    updates: Partial<CreateReportTemplateRequest>
  ): Promise<ReportTemplate> {
    try {
      const { data, error } = await supabase
        .from('report_definitions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      const updatedTemplate = this.mapToReportTemplate(data);
      
      // Update cache
      this.TEMPLATE_CACHE.set(updatedTemplate.type, updatedTemplate);

      return updatedTemplate;
    } catch (error) {
      throw new ReportingError(
        'Failed to update report template',
        'TEMPLATE_UPDATE_ERROR',
        { templateId, updates, error: error.message }
      );
    }
  }

  /**
   * Delete a report template
   */
  async deleteReportTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('report_definitions')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      // Remove from cache
      for (const [key, template] of this.TEMPLATE_CACHE.entries()) {
        if (template.id === templateId) {
          this.TEMPLATE_CACHE.delete(key);
          break;
        }
      }

      return true;
    } catch (error) {
      throw new ReportingError(
        'Failed to delete report template',
        'TEMPLATE_DELETE_ERROR',
        { templateId, error: error.message }
      );
    }
  }

  /**
   * Get all available report templates
   */
  async getAllReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('report_definitions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return data.map(this.mapToReportTemplate);
    } catch (error) {
      throw new ReportingError(
        'Failed to get all report templates',
        'TEMPLATES_FETCH_ERROR',
        { error: error.message }
      );
    }
  }

  /**
   * Generate report from template
   */
  async generateReportFromTemplate(
    templateId: string,
    parameters: ReportParams,
    userId: string
  ): Promise<Report> {
    try {
      const template = await this.getReportTemplateById(templateId);
      
      // Validate required parameters
      this.validateTemplateParameters(template, parameters);

      // Merge with default parameters
      const mergedParams = this.mergeParameters(template.defaultParameters, parameters);

      // Execute the template query
      const data = await this.executeTemplateQuery(template, mergedParams);

      // Create report object
      const report: Report = {
        id: this.generateReportId(),
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.type,
        description: template.description,
        parameters: mergedParams,
        data: data,
        metadata: {
          totalRecords: data.length,
          generationTime: 0, // Will be set by calling service
          dataSource: template.dataSource,
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed',
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        exportFormats: template.outputFormats,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      throw new ReportingError(
        'Failed to generate report from template',
        'TEMPLATE_GENERATION_ERROR',
        { templateId, parameters, error: error.message }
      );
    }
  }

  /**
   * Validate template SQL query
   */
  async validateTemplateQuery(sqlQuery: string, parameters: any = {}): Promise<QueryValidationResult> {
    try {
      // Basic SQL injection protection
      const dangerousPatterns = [
        /;\s*(drop|delete|truncate|alter|create|insert|update)\s+/i,
        /union\s+select/i,
        /exec\s*\(/i,
        /xp_cmdshell/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sqlQuery)) {
          return {
            isValid: false,
            error: 'Query contains potentially dangerous SQL statements',
            suggestions: ['Remove dangerous SQL statements', 'Use parameterized queries']
          };
        }
      }

      // Try to explain the query (dry run)
      const explainQuery = `EXPLAIN (FORMAT JSON) ${sqlQuery}`;
      
      try {
        const { data, error } = await supabase.rpc('validate_query', {
          query_text: explainQuery,
          query_params: parameters
        });

        if (error) {
          return {
            isValid: false,
            error: error.message,
            suggestions: ['Check SQL syntax', 'Verify table and column names']
          };
        }

        return {
          isValid: true,
          estimatedCost: this.extractQueryCost(data),
          estimatedRows: this.extractEstimatedRows(data)
        };
      } catch (explainError) {
        return {
          isValid: false,
          error: explainError.message,
          suggestions: ['Check SQL syntax', 'Verify table and column names']
        };
      }
    } catch (error) {
      throw new ReportingError(
        'Failed to validate template query',
        'QUERY_VALIDATION_ERROR',
        { sqlQuery, error: error.message }
      );
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateUsageStats(templateId: string): Promise<TemplateUsageStats> {
    try {
      const { data, error } = await supabase
        .from('report_execution_history')
        .select('*')
        .eq('report_definition_id', templateId)
        .order('execution_start', { ascending: false });

      if (error) throw error;

      const stats: TemplateUsageStats = {
        totalExecutions: data.length,
        successfulExecutions: data.filter(r => r.status === 'completed').length,
        failedExecutions: data.filter(r => r.status === 'failed').length,
        averageExecutionTime: 0,
        lastExecuted: null,
        mostCommonParameters: {},
        errorPatterns: []
      };

      if (data.length > 0) {
        // Calculate average execution time
        const completedRuns = data.filter(r => r.status === 'completed' && r.execution_end);
        if (completedRuns.length > 0) {
          const totalTime = completedRuns.reduce((sum, run) => {
            const start = new Date(run.execution_start).getTime();
            const end = new Date(run.execution_end).getTime();
            return sum + (end - start);
          }, 0);
          stats.averageExecutionTime = totalTime / completedRuns.length;
        }

        stats.lastExecuted = data[0].execution_start;

        // Analyze error patterns
        const failedRuns = data.filter(r => r.status === 'failed' && r.error_message);
        const errorCounts = new Map<string, number>();
        
        failedRuns.forEach(run => {
          const errorType = this.categorizeError(run.error_message);
          errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
        });

        stats.errorPatterns = Array.from(errorCounts.entries())
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count);
      }

      return stats;
    } catch (error) {
      throw new ReportingError(
        'Failed to get template usage stats',
        'USAGE_STATS_ERROR',
        { templateId, error: error.message }
      );
    }
  }

  /**
   * Clone an existing template
   */
  async cloneReportTemplate(
    templateId: string,
    newName: string,
    userId: string
  ): Promise<ReportTemplate> {
    try {
      const originalTemplate = await this.getReportTemplateById(templateId);
      
      const cloneRequest: CreateReportTemplateRequest = {
        name: newName,
        type: originalTemplate.type,
        description: `Cloned from: ${originalTemplate.name}`,
        sqlQuery: originalTemplate.sqlQuery,
        parameters: originalTemplate.parameters,
        defaultParameters: originalTemplate.defaultParameters,
        requiredParameters: originalTemplate.requiredParameters,
        outputFormats: originalTemplate.outputFormats,
        estimatedRunTime: originalTemplate.estimatedRunTime,
        isPublic: false, // Cloned templates are private by default
        tags: [...originalTemplate.tags, 'cloned'],
        category: originalTemplate.category,
        createdBy: userId
      };

      return await this.createReportTemplate(cloneRequest);
    } catch (error) {
      throw new ReportingError(
        'Failed to clone report template',
        'TEMPLATE_CLONE_ERROR',
        { templateId, newName, error: error.message }
      );
    }
  }

  // Private helper methods

  private async getReportTemplateById(templateId: string): Promise<ReportTemplate> {
    const { data, error } = await supabase
      .from('report_definitions')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    return this.mapToReportTemplate(data);
  }

  private mapToReportTemplate(data: any): ReportTemplate {
    return {
      id: data.id,
      name: data.name,
      type: data.type as ReportType,
      description: data.description,
      sqlQuery: data.sql_query,
      dataSource: data.data_source || 'default',
      parameters: data.parameters || {},
      defaultParameters: data.default_parameters || {},
      requiredParameters: data.required_parameters || [],
      outputFormats: data.output_formats || ['pdf', 'excel', 'csv'],
      estimatedRunTime: data.estimated_run_time || 30,
      isPublic: data.is_public || false,
      tags: data.tags || [],
      category: data.category || 'general',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private validateTemplateParameters(template: ReportTemplate, parameters: ReportParams): void {
    for (const requiredParam of template.requiredParameters) {
      if (!this.hasParameter(parameters, requiredParam)) {
        throw new ReportingError(
          `Missing required parameter: ${requiredParam}`,
          'MISSING_REQUIRED_PARAMETER',
          { requiredParam, providedParameters: Object.keys(parameters) }
        );
      }
    }
  }

  private hasParameter(parameters: ReportParams, paramName: string): boolean {
    // Check if parameter exists in any of the parameter objects
    return !!(
      parameters[paramName] ||
      parameters.dateRange ||
      parameters.filters?.some(f => f.field === paramName) ||
      parameters.customFields?.includes(paramName)
    );
  }

  private mergeParameters(defaultParams: any, providedParams: ReportParams): ReportParams {
    return {
      ...defaultParams,
      ...providedParams,
      dateRange: providedParams.dateRange || defaultParams.dateRange,
      filters: providedParams.filters || defaultParams.filters || [],
      groupBy: providedParams.groupBy || defaultParams.groupBy,
      sortBy: providedParams.sortBy || defaultParams.sortBy
    };
  }

  private async executeTemplateQuery(template: ReportTemplate, parameters: ReportParams): Promise<any[]> {
    // Replace parameter placeholders in SQL query
    let query = template.sqlQuery || '';
    const queryParams: any[] = [];

    // Handle date range parameters
    if (parameters.dateRange) {
      query = query.replace(/\$startDate/g, `$${queryParams.length + 1}`);
      queryParams.push(parameters.dateRange.startDate);
      query = query.replace(/\$endDate/g, `$${queryParams.length + 1}`);
      queryParams.push(parameters.dateRange.endDate);
    }

    // Execute the query
    const { data, error } = await supabase.rpc('execute_dynamic_query', {
      query_text: query,
      query_params: queryParams
    });

    if (error) throw error;

    return data || [];
  }

  private extractQueryCost(explainData: any): number {
    try {
      if (Array.isArray(explainData) && explainData[0]?.Plan) {
        return explainData[0].Plan['Total Cost'] || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private extractEstimatedRows(explainData: any): number {
    try {
      if (Array.isArray(explainData) && explainData[0]?.Plan) {
        return explainData[0].Plan['Plan Rows'] || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'Timeout';
    if (errorMessage.includes('permission')) return 'Permission Denied';
    if (errorMessage.includes('syntax')) return 'SQL Syntax Error';
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) return 'Table Not Found';
    if (errorMessage.includes('column') && errorMessage.includes('does not exist')) return 'Column Not Found';
    return 'Other';
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  sqlQuery?: string;
  dataSource: string;
  parameters: any;
  defaultParameters: ReportParams;
  requiredParameters: string[];
  outputFormats: string[];
  estimatedRunTime: number;
  isPublic: boolean;
  tags: string[];
  category: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateReportTemplateRequest {
  name: string;
  type: ReportType;
  description?: string;
  sqlQuery?: string;
  parameters?: any;
  defaultParameters?: ReportParams;
  requiredParameters?: string[];
  outputFormats?: string[];
  estimatedRunTime?: number;
  isPublic?: boolean;
  tags?: string[];
  category?: string;
  createdBy: string;
}

interface QueryValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
  estimatedCost?: number;
  estimatedRows?: number;
}

interface TemplateUsageStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted: string | null;
  mostCommonParameters: Record<string, any>;
  errorPatterns: Array<{ error: string; count: number }>;
}

export default ReportTemplateService;