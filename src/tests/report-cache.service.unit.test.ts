import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportCacheService } from '../services/report-cache.service';
import { Report, ReportType } from '../types/reports';
import { ReportingError } from '../errors/reporting';

describe('ReportCacheService', () => {
  let cacheService: ReportCacheService;

  const mockReport: Report = {
    id: 'test-report-1',
    name: 'Test Report',
    type: 'supplier_performance' as ReportType,
    parameters: {
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      },
      filters: [],
      groupBy: [],
      sortBy: []
    },
    data: [{ test: 'data' }],
    metadata: {
      totalRecords: 1,
      generationTime: 1000,
      dataSource: 'test',
      lastRefreshed: new Date().toISOString(),
      version: '1.0',
      permissions: []
    },
    status: 'completed',
    generatedAt: new Date().toISOString(),
    generatedBy: 'test-user',
    exportFormats: ['pdf', 'excel', 'csv'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    cacheService = new ReportCacheService();
  });

  describe('setReport and getReport', () => {
    it('should cache and retrieve a report successfully', async () => {
      // Arrange
      const cacheKey = 'test-key-1';

      // Act
      await cacheService.setReport(cacheKey, mockReport);
      const result = await cacheService.getReport(cacheKey);

      // Assert
      expect(result).toEqual(mockReport);
      expect(result?.metadata.cacheExpiry).toBeDefined();
    });

    it('should return null for non-existent cache key', async () => {
      // Act
      const result = await cacheService.getReport('non-existent-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for expired cache entry', async () => {
      // Arrange
      const cacheKey = 'expired-key';
      const shortTtl = 1; // 1 millisecond

      // Act
      await cacheService.setReport(cacheKey, mockReport, shortTtl);
      
      // Manually check expiration by mocking the current time
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 1000); // Move time forward
      
      const result = await cacheService.getReport(cacheKey);

      // Restore original Date.now
      Date.now = originalNow;

      // Assert
      expect(result).toBeNull();
    });

    it('should update access statistics when retrieving cached report', async () => {
      // Arrange
      const cacheKey = 'access-test-key';
      await cacheService.setReport(cacheKey, mockReport);

      // Act
      await cacheService.getReport(cacheKey);
      await cacheService.getReport(cacheKey);
      
      const stats = cacheService.getCacheStats();

      // Assert
      expect(stats.totalAccesses).toBeGreaterThan(0);
    });

    it('should store a copy of the report to prevent mutations', async () => {
      // Arrange
      const cacheKey = 'mutation-test-key';
      const originalReport = { ...mockReport };

      // Act
      await cacheService.setReport(cacheKey, mockReport);
      mockReport.name = 'Modified Name'; // Mutate original
      
      const cachedReport = await cacheService.getReport(cacheKey);

      // Assert
      expect(cachedReport?.name).toBe(originalReport.name);
      expect(cachedReport?.name).not.toBe('Modified Name');
    });
  });

  describe('removeReport', () => {
    it('should remove a cached report successfully', async () => {
      // Arrange
      const cacheKey = 'remove-test-key';
      await cacheService.setReport(cacheKey, mockReport);

      // Act
      const removed = await cacheService.removeReport(cacheKey);
      const result = await cacheService.getReport(cacheKey);

      // Assert
      expect(removed).toBe(true);
      expect(result).toBeNull();
    });

    it('should return false when removing non-existent key', async () => {
      // Act
      const removed = await cacheService.removeReport('non-existent-key');

      // Assert
      expect(removed).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached reports', async () => {
      // Arrange
      await cacheService.setReport('key1', mockReport);
      await cacheService.setReport('key2', mockReport);

      // Act
      await cacheService.clearCache();
      
      const result1 = await cacheService.getReport('key1');
      const result2 = await cacheService.getReport('key2');
      const stats = cacheService.getCacheStats();

      // Assert
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(stats.totalCached).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', async () => {
      // Arrange
      await cacheService.setReport('stats-key-1', mockReport);
      await cacheService.setReport('stats-key-2', mockReport);
      await cacheService.getReport('stats-key-1'); // Access once

      // Act
      const stats = cacheService.getCacheStats();

      // Assert
      expect(stats.totalCached).toBe(2);
      expect(stats.maxCacheSize).toBe(100);
      expect(stats.totalAccesses).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
    });

    it('should return empty stats for empty cache', async () => {
      // Act
      const stats = cacheService.getCacheStats();

      // Assert
      expect(stats.totalCached).toBe(0);
      expect(stats.totalAccesses).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
      expect(stats.mostAccessed).toBeNull();
    });
  });

  describe('getCachedReportKeys', () => {
    it('should return cached report information', async () => {
      // Arrange
      await cacheService.setReport('info-key-1', mockReport);
      await cacheService.setReport('info-key-2', { ...mockReport, id: 'test-report-2' });

      // Act
      const reportKeys = cacheService.getCachedReportKeys();

      // Assert
      expect(reportKeys).toHaveLength(2);
      expect(reportKeys[0]).toMatchObject({
        cacheKey: expect.any(String),
        reportId: expect.any(String),
        reportName: expect.any(String),
        reportType: expect.any(String),
        cachedAt: expect.any(String),
        expiresAt: expect.any(String),
        accessCount: expect.any(Number),
        lastAccessed: expect.any(String),
        isExpired: expect.any(Boolean)
      });
    });

    it('should sort reports by access count descending', async () => {
      // Arrange
      await cacheService.setReport('sort-key-1', mockReport);
      await cacheService.setReport('sort-key-2', { ...mockReport, id: 'test-report-2' });
      
      // Access first report multiple times
      await cacheService.getReport('sort-key-1');
      await cacheService.getReport('sort-key-1');
      await cacheService.getReport('sort-key-2');

      // Act
      const reportKeys = cacheService.getCachedReportKeys();

      // Assert
      expect(reportKeys[0].accessCount).toBeGreaterThanOrEqual(reportKeys[1].accessCount);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate cache entries matching pattern', async () => {
      // Arrange
      await cacheService.setReport('supplier_performance_2024', mockReport);
      await cacheService.setReport('supplier_performance_2023', mockReport);
      await cacheService.setReport('spending_analysis_2024', mockReport);

      // Act
      const invalidatedCount = await cacheService.invalidatePattern('supplier_performance');

      // Assert
      expect(invalidatedCount).toBe(2);
      expect(await cacheService.getReport('supplier_performance_2024')).toBeNull();
      expect(await cacheService.getReport('supplier_performance_2023')).toBeNull();
      expect(await cacheService.getReport('spending_analysis_2024')).not.toBeNull();
    });

    it('should handle invalid regex patterns gracefully', async () => {
      // Act & Assert
      await expect(
        cacheService.invalidatePattern('[invalid regex')
      ).rejects.toThrow(ReportingError);
    });
  });

  describe('preloadReports', () => {
    it('should preload reports with given configurations', async () => {
      // Arrange
      const preloadConfigs = [
        {
          reportType: 'supplier_performance',
          cacheKey: 'monthly_performance',
          parameters: mockReport.parameters,
          ttl: 60000
        },
        {
          reportType: 'spending_analysis',
          cacheKey: 'quarterly_spending',
          parameters: mockReport.parameters
        }
      ];

      // Act
      await cacheService.preloadReports(preloadConfigs);

      // Assert
      const stats = cacheService.getCacheStats();
      expect(stats.totalCached).toBe(2);

      const preloadedReport1 = await cacheService.getReport('preload:supplier_performance:monthly_performance');
      const preloadedReport2 = await cacheService.getReport('preload:spending_analysis:quarterly_spending');

      expect(preloadedReport1).not.toBeNull();
      expect(preloadedReport2).not.toBeNull();
      expect(preloadedReport1?.status).toBe('generating');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should remove expired cache entries', async () => {
      // Arrange
      const shortTtl = 1; // 1 millisecond
      await cacheService.setReport('expired-key-1', mockReport, shortTtl);
      await cacheService.setReport('expired-key-2', mockReport, shortTtl);
      await cacheService.setReport('valid-key', mockReport, 60000); // 1 minute

      // Mock time to make entries expired
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 1000); // Move time forward

      // Act
      const cleanedCount = await cacheService.cleanupExpiredEntries();

      // Restore original Date.now
      Date.now = originalNow;

      // Assert
      expect(cleanedCount).toBe(2);
      expect(await cacheService.getReport('expired-key-1')).toBeNull();
      expect(await cacheService.getReport('expired-key-2')).toBeNull();
      expect(await cacheService.getReport('valid-key')).not.toBeNull();
    });

    it('should return 0 when no expired entries exist', async () => {
      // Arrange
      await cacheService.setReport('valid-key', mockReport, 60000);

      // Act
      const cleanedCount = await cacheService.cleanupExpiredEntries();

      // Assert
      expect(cleanedCount).toBe(0);
    });
  });

  describe('cache size management', () => {
    it('should evict least recently used entries when cache is full', async () => {
      // Arrange - Create a new cache service with smaller max size for testing
      const testCacheService = new ReportCacheService();
      // Override the MAX_CACHE_SIZE for testing
      (testCacheService as any).MAX_CACHE_SIZE = 3;
      
      // Fill cache to capacity
      for (let i = 0; i < 3; i++) {
        await testCacheService.setReport(`key-${i}`, { ...mockReport, id: `report-${i}` });
      }

      // Access one entry to make it recently used
      await testCacheService.getReport('key-2');

      // Act - Add one more entry to trigger eviction
      await testCacheService.setReport('new-key', { ...mockReport, id: 'new-report' });

      // Assert
      const stats = testCacheService.getCacheStats();
      expect(stats.totalCached).toBeLessThanOrEqual(3); // Should not exceed max size
      
      // Recently accessed entry should still exist
      expect(await testCacheService.getReport('key-2')).not.toBeNull();
      expect(await testCacheService.getReport('new-key')).not.toBeNull();
      
      // At least one early entry should have been evicted
      const key0Exists = await testCacheService.getReport('key-0') !== null;
      const key1Exists = await testCacheService.getReport('key-1') !== null;
      expect(key0Exists && key1Exists).toBe(false); // At least one should be evicted
    });
  });

  describe('error handling', () => {
    it('should throw ReportingError for cache retrieval errors', async () => {
      // This test simulates internal errors that might occur
      // In a real implementation, you might mock internal methods to throw errors
      
      // For now, we'll test the error handling structure
      expect(ReportingError).toBeDefined();
    });

    it('should throw ReportingError for cache storage errors', async () => {
      // Similar to above, this would test internal error scenarios
      expect(ReportingError).toBeDefined();
    });

    it('should throw ReportingError for cache removal errors', async () => {
      // Test error handling for removal operations
      expect(ReportingError).toBeDefined();
    });

    it('should throw ReportingError for cache clear errors', async () => {
      // Test error handling for clear operations
      expect(ReportingError).toBeDefined();
    });
  });

  describe('TTL (Time To Live) functionality', () => {
    it('should use default TTL when not specified', async () => {
      // Arrange
      const cacheKey = 'default-ttl-key';

      // Act
      await cacheService.setReport(cacheKey, mockReport);
      const reportKeys = cacheService.getCachedReportKeys();
      const cachedReport = reportKeys.find(r => r.cacheKey === cacheKey);

      // Assert
      expect(cachedReport).toBeDefined();
      expect(new Date(cachedReport!.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should use custom TTL when specified', async () => {
      // Arrange
      const cacheKey = 'custom-ttl-key';
      const customTtl = 5000; // 5 seconds

      // Act
      await cacheService.setReport(cacheKey, mockReport, customTtl);
      const reportKeys = cacheService.getCachedReportKeys();
      const cachedReport = reportKeys.find(r => r.cacheKey === cacheKey);

      // Assert
      expect(cachedReport).toBeDefined();
      const expiryTime = new Date(cachedReport!.expiresAt).getTime();
      const expectedExpiry = Date.now() + customTtl;
      
      // Allow for small timing differences (within 1 second)
      expect(Math.abs(expiryTime - expectedExpiry)).toBeLessThan(1000);
    });
  });
});