import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReportingService } from '../services/reportingService';
import { ReportCacheService } from '../services/report-cache.service';
import { ReportAccessControlService } from '../services/report-access-control.service';
import { ReportTemplateService } from '../services/report-template.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { ReportType, ReportParams } from '../types/reports';
import { ReportGenerationError, ReportExportError } from '../errors/reporting';

// Mock the dependencies
vi.mock('../services/report-cache.service');
vi.mock('../services/report-access-control.service');
vi.mock('../services/report-template.service');
vi.mock('../services/error-handler.service');
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('ReportingService', () => {
  let reportingService: ReportingService;
  let mockCacheService: vi.Mocked<ReportCacheService>;
  let mockAccessControl: vi.Mocked<ReportAccessControlService>;
  let mockTemplateService: vi.Mocked<ReportTemplateService>;
  let mockErrorHandler: vi.Mocked<ErrorHandlerService>;

  const mockReportParams: ReportParams = {
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    filters: [],
    groupBy: [],
    sortBy: []
  };

  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mocked instances
    mockCacheService = {
      getReport: vi.fn(),
      setReport: vi.fn(),
      removeReport: vi.fn(),
      clearCache: vi.fn(),
      getCacheStats: vi.fn(),
      getCachedReportKeys: vi.fn(),
      invalidatePattern: vi.fn(),
      preloadReports: vi.fn(),
      cleanupExpiredEntries: vi.fn()
    } as any;

    mockAccessControl = {
      validateReportAccess: vi.fn(),
      getReportPermissions: vi.fn(),
      grantReportPermission: vi.fn(),
      revokeReportPermission: vi.fn(),
      getReportUsers: vi.fn(),
      getUserReportAccess: vi.fn(),
      logAccessAttempt: vi.fn()
    } as any;

    mockTemplateService = {
      getReportTemplate: vi.fn(),
      createReportTemplate: vi.fn(),
      updateReportTemplate: vi.fn(),
      deleteReportTemplate: vi.fn(),
      getAllReportTemplates: vi.fn(),
      generateReportFromTemplate: vi.fn(),
      validateTemplateQuery: vi.fn(),
      getTemplateUsageStats: vi.fn(),
      cloneReportTemplate: vi.fn()
    } as any;

    mockErrorHandler = {
      handleServiceError: vi.fn(),
      handleIntegrationError: vi.fn(),
      logError: vi.fn(),
      notifyAdministrators: vi.fn()
    } as any;

    // Mock the constructors
    vi.mocked(ReportCacheService).mockImplementation(() => mockCacheService);
    vi.mocked(ReportAccessControlService).mockImplementation(() => mockAccessControl);
    vi.mocked(ReportTemplateService).mockImplementation(() => mockTemplateService);
    vi.mocked(ErrorHandlerService).mockImplementation(() => mockErrorHandler);

    reportingService = new ReportingService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a supplier performance report successfully', async () => {
      // Arrange
      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);
      
      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            supplier_id: 'supplier-1',
            supplier_name: 'Test Supplier',
            supplier_code: 'TS001',
            total_spend: 10000,
            invoice_count: 5,
            average_payment_days: 30,
            on_time_delivery_rate: 95,
            quality_score: 4.5,
            reliability_score: 90,
            cost_efficiency_rating: 85,
            calculated_at: '2024-01-01T00:00:00Z'
          }
        ],
        error: null
      });

      // Act
      const result = await reportingService.generateReport(
        'supplier_performance',
        mockReportParams,
        mockUserId
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe('supplier_performance');
      expect(result.data).toHaveLength(1);
      expect(result.status).toBe('completed');
      expect(mockAccessControl.validateReportAccess).toHaveBeenCalledWith(
        mockUserId,
        'supplier_performance',
        'view'
      );
      expect(mockCacheService.setReport).toHaveBeenCalled();
    });

    it('should return cached report if available and not expired', async () => {
      // Arrange
      const cachedReport = {
        id: 'cached-report-1',
        name: 'Cached Report',
        type: 'supplier_performance' as ReportType,
        parameters: mockReportParams,
        data: [],
        metadata: {
          totalRecords: 0,
          generationTime: 1000,
          dataSource: 'cache',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: [],
          cacheExpiry: new Date(Date.now() + 60000).toISOString() // 1 minute from now
        },
        status: 'completed' as const,
        generatedAt: new Date().toISOString(),
        generatedBy: mockUserId,
        exportFormats: ['pdf', 'excel', 'csv'] as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(cachedReport);

      // Act
      const result = await reportingService.generateReport(
        'supplier_performance',
        mockReportParams,
        mockUserId
      );

      // Assert
      expect(result).toEqual(cachedReport);
      expect(mockCacheService.getReport).toHaveBeenCalled();
      expect(mockCacheService.setReport).not.toHaveBeenCalled();
    });

    it('should throw ReportGenerationError when access is denied', async () => {
      // Arrange
      mockAccessControl.validateReportAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', mockReportParams, mockUserId)
      ).rejects.toThrow(ReportGenerationError);

      expect(mockErrorHandler.handleServiceError).toHaveBeenCalled();
    });

    it('should validate report parameters before generation', async () => {
      // Arrange
      const invalidParams = {
        ...mockReportParams,
        dateRange: {
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01') // End date before start date
        }
      };

      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', invalidParams, mockUserId)
      ).rejects.toThrow(ReportGenerationError);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', mockReportParams, mockUserId)
      ).rejects.toThrow(ReportGenerationError);

      expect(mockErrorHandler.handleServiceError).toHaveBeenCalled();
    });
  });

  describe('generateSupplierPerformanceReport', () => {
    it('should generate supplier performance report with correct data mapping', async () => {
      // Arrange
      const mockSupplierData = [
        {
          supplier_id: 'supplier-1',
          supplier_name: 'Test Supplier 1',
          supplier_code: 'TS001',
          total_spend: 15000,
          invoice_count: 8,
          average_payment_days: 25,
          on_time_delivery_rate: 98,
          quality_score: 4.8,
          reliability_score: 95,
          cost_efficiency_rating: 90,
          calculated_at: '2024-01-15T10:00:00Z'
        },
        {
          supplier_id: 'supplier-2',
          supplier_name: 'Test Supplier 2',
          supplier_code: 'TS002',
          total_spend: 8000,
          invoice_count: 4,
          average_payment_days: 35,
          on_time_delivery_rate: 85,
          quality_score: 4.2,
          reliability_score: 80,
          cost_efficiency_rating: 75,
          calculated_at: '2024-01-15T10:00:00Z'
        }
      ];

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockSupplierData,
        error: null
      });

      // Act
      const result = await reportingService.generateSupplierPerformanceReport(mockReportParams);

      // Assert
      expect(result.type).toBe('supplier_performance');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        supplierId: 'supplier-1',
        supplierName: 'Test Supplier 1',
        totalSpend: 15000,
        invoiceCount: 8,
        averagePaymentDays: 25,
        reliabilityScore: 95
      });
    });

    it('should handle empty data gracefully', async () => {
      // Arrange
      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      const result = await reportingService.generateSupplierPerformanceReport(mockReportParams);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.metadata.totalRecords).toBe(0);
    });
  });

  describe('generateSpendingAnalysisReport', () => {
    it('should generate spending analysis report with aggregated data', async () => {
      // Arrange
      const mockSpendingData = [
        {
          supplier_name: 'Supplier A',
          supplier_code: 'SA001',
          invoice_count: 10,
          total_spend: 25000,
          average_invoice_amount: 2500,
          first_invoice_date: '2024-01-01',
          last_invoice_date: '2024-12-31',
          paid_amount: 20000,
          outstanding_amount: 5000
        }
      ];

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockSpendingData,
        error: null
      });

      // Act
      const result = await reportingService.generateSpendingAnalysisReport(mockReportParams);

      // Assert
      expect(result.type).toBe('spending_analysis');
      expect(result.data).toEqual(mockSpendingData);
      expect(result.metadata.totalRecords).toBe(1);
    });
  });

  describe('generateAgingReport', () => {
    it('should generate aging report with proper categorization', async () => {
      // Arrange
      const mockAgingData = [
        {
          supplier_name: 'Supplier A',
          supplier_code: 'SA001',
          invoice_number: 'INV-001',
          invoice_date: '2024-01-01',
          due_date: '2024-01-31',
          total_amount: 1000,
          remaining_amount: 1000,
          aging_bucket: '1-30 Days',
          days_overdue: 15
        }
      ];

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockAgingData,
        error: null
      });

      // Act
      const result = await reportingService.generateAgingReport(mockReportParams);

      // Assert
      expect(result.type).toBe('aging_report');
      expect(result.data).toEqual(mockAgingData);
    });
  });

  describe('generateCashFlowProjection', () => {
    it('should generate cash flow projection with future payments', async () => {
      // Arrange
      const mockCashFlowData = [
        {
          payment_date: '2024-02-01',
          projected_payment: 5000,
          invoice_count: 3,
          suppliers: 'Supplier A, Supplier B'
        }
      ];

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockCashFlowData,
        error: null
      });

      // Act
      const result = await reportingService.generateCashFlowProjection(mockReportParams);

      // Assert
      expect(result.type).toBe('cash_flow_projection');
      expect(result.data).toEqual(mockCashFlowData);
    });
  });

  describe('exportReport', () => {
    it('should export report successfully with valid permissions', async () => {
      // Arrange
      const reportId = 'report-123';
      const format = 'pdf';
      const expectedUrl = `https://example.com/exports/${reportId}.${format}`;

      mockAccessControl.validateReportAccess.mockResolvedValue(true);

      // Mock getReportById to return a valid report
      const mockReport = {
        id: reportId,
        name: 'Test Report',
        type: 'supplier_performance' as ReportType,
        parameters: mockReportParams,
        data: [],
        metadata: {
          totalRecords: 0,
          generationTime: 1000,
          dataSource: 'test',
          lastRefreshed: new Date().toISOString(),
          version: '1.0',
          permissions: []
        },
        status: 'completed' as const,
        generatedAt: new Date().toISOString(),
        generatedBy: mockUserId,
        exportFormats: ['pdf', 'excel', 'csv'] as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Mock the private method by spying on the service
      const getReportByIdSpy = vi.spyOn(reportingService as any, 'getReportById');
      getReportByIdSpy.mockResolvedValue(mockReport);

      const generateExportFileSpy = vi.spyOn(reportingService as any, 'generateExportFile');
      generateExportFileSpy.mockResolvedValue(expectedUrl);

      // Act
      const result = await reportingService.exportReport(reportId, format, mockUserId);

      // Assert
      expect(result).toBe(expectedUrl);
      expect(mockAccessControl.validateReportAccess).toHaveBeenCalledWith(
        mockUserId,
        'custom_report',
        'export'
      );
    });

    it('should throw ReportExportError when report not found', async () => {
      // Arrange
      const reportId = 'non-existent-report';
      const format = 'pdf';

      mockAccessControl.validateReportAccess.mockResolvedValue(true);

      const getReportByIdSpy = vi.spyOn(reportingService as any, 'getReportById');
      getReportByIdSpy.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportingService.exportReport(reportId, format, mockUserId)
      ).rejects.toThrow(ReportExportError);
    });

    it('should throw ReportExportError when user lacks export permissions', async () => {
      // Arrange
      const reportId = 'report-123';
      const format = 'pdf';

      mockAccessControl.validateReportAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(
        reportingService.exportReport(reportId, format, mockUserId)
      ).rejects.toThrow(ReportExportError);
    });
  });

  describe('getReportDefinitions', () => {
    it('should return filtered report definitions based on user permissions', async () => {
      // Arrange
      const mockDefinitions = [
        {
          id: 'def-1',
          name: 'Supplier Performance',
          type: 'supplier_performance',
          description: 'Performance metrics',
          is_active: true
        },
        {
          id: 'def-2',
          name: 'Spending Analysis',
          type: 'spending_analysis',
          description: 'Spending trends',
          is_active: true
        }
      ];

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDefinitions,
              error: null
            })
          })
        })
      } as any);

      // Mock access control to allow first definition only
      mockAccessControl.validateReportAccess
        .mockResolvedValueOnce(true)  // First definition allowed
        .mockResolvedValueOnce(false); // Second definition denied

      // Act
      const result = await reportingService.getReportDefinitions(mockUserId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('def-1');
    });

    it('should handle database errors when fetching definitions', async () => {
      // Arrange
      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(
        reportingService.getReportDefinitions(mockUserId)
      ).rejects.toThrow('Failed to get report definitions');
    });
  });

  describe('parameter validation', () => {
    it('should validate required date range', async () => {
      // Arrange
      const invalidParams = {
        filters: [],
        groupBy: [],
        sortBy: []
      } as ReportParams; // Missing dateRange

      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', invalidParams, mockUserId)
      ).rejects.toThrow('Date range is required');
    });

    it('should validate date range order', async () => {
      // Arrange
      const invalidParams = {
        dateRange: {
          startDate: new Date('2024-12-31'),
          endDate: new Date('2024-01-01')
        },
        filters: [],
        groupBy: [],
        sortBy: []
      };

      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', invalidParams, mockUserId)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should validate filter configuration', async () => {
      // Arrange
      const invalidParams = {
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        filters: [
          { field: '', operator: 'equals', value: 'test' } // Empty field
        ],
        groupBy: [],
        sortBy: []
      };

      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reportingService.generateReport('supplier_performance', invalidParams, mockUserId)
      ).rejects.toThrow('Invalid filter configuration');
    });
  });

  describe('cache integration', () => {
    it('should generate cache key correctly', async () => {
      // Arrange
      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockResolvedValue(null);

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      await reportingService.generateReport('supplier_performance', mockReportParams, mockUserId);

      // Assert
      expect(mockCacheService.getReport).toHaveBeenCalledWith(
        expect.stringMatching(/^report:supplier_performance:/)
      );
      expect(mockCacheService.setReport).toHaveBeenCalled();
    });

    it('should handle cache service errors gracefully', async () => {
      // Arrange
      mockAccessControl.validateReportAccess.mockResolvedValue(true);
      mockCacheService.getReport.mockRejectedValue(new Error('Cache error'));

      const { supabase } = await import('../integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      });

      // Act & Assert
      await expect(
        reportingService.generateReport(
          'supplier_performance',
          mockReportParams,
          mockUserId
        )
      ).rejects.toThrow(ReportGenerationError);

      expect(mockErrorHandler.handleServiceError).toHaveBeenCalled();
    });
  });
});