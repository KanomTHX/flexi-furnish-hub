import { BaseError, ErrorCategory } from './base';

/**
 * Base class for all reporting errors
 */
export abstract class ReportingError extends BaseError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message, code, statusCode, true, {
      ...context,
      category: ErrorCategory.BUSINESS_LOGIC,
      module: 'reporting'
    });
  }
}

/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends ReportingError {
  public readonly reportType: string;

  constructor(message: string, reportType: string, context?: Record<string, any>) {
    super(message, 'REPORT_GENERATION_FAILED', 422, {
      ...context,
      reportType
    });
    this.reportType = reportType;
  }
}

/**
 * Error thrown when report parameters are invalid
 */
export class ReportParameterError extends ReportingError {
  public readonly invalidParameters: string[];

  constructor(message: string, invalidParameters: string[], context?: Record<string, any>) {
    super(message, 'INVALID_REPORT_PARAMETERS', 400, {
      ...context,
      invalidParameters
    });
    this.invalidParameters = invalidParameters;
  }
}

/**
 * Error thrown when report export fails
 */
export class ReportExportError extends ReportingError {
  public readonly exportFormat: string;

  constructor(message: string, exportFormat: string, context?: Record<string, any>) {
    super(message, 'REPORT_EXPORT_FAILED', 422, {
      ...context,
      exportFormat
    });
    this.exportFormat = exportFormat;
  }
}

/**
 * Error thrown when report scheduling fails
 */
export class ReportSchedulingError extends ReportingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'REPORT_SCHEDULING_FAILED', 422, context);
  }
}

/**
 * Error thrown when report data is too large
 */
export class ReportDataTooLargeError extends ReportingError {
  public readonly recordCount: number;
  public readonly maxRecords: number;

  constructor(recordCount: number, maxRecords: number, context?: Record<string, any>) {
    super(
      `Report data too large: ${recordCount} records exceeds maximum of ${maxRecords}`,
      'REPORT_DATA_TOO_LARGE',
      413,
      {
        ...context,
        recordCount,
        maxRecords
      }
    );
    this.recordCount = recordCount;
    this.maxRecords = maxRecords;
  }
}

/**
 * Error thrown when report template is not found or invalid
 */
export class ReportTemplateError extends ReportingError {
  public readonly templateId: string;

  constructor(message: string, templateId: string, context?: Record<string, any>) {
    super(message, 'REPORT_TEMPLATE_ERROR', 404, {
      ...context,
      templateId
    });
    this.templateId = templateId;
  }
}

/**
 * Error thrown when analytics calculation fails
 */
export class AnalyticsCalculationError extends ReportingError {
  public readonly calculationType: string;

  constructor(message: string, calculationType: string, context?: Record<string, any>) {
    super(message, 'ANALYTICS_CALCULATION_FAILED', 422, {
      ...context,
      calculationType
    });
    this.calculationType = calculationType;
  }
}