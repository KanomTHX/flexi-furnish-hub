import { Report } from '../types/reports';
import { ReportingError } from '../errors/reporting';

/**
 * Service for caching report results to improve performance
 */
interface CachedReport {
  report: Report;
  cachedAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class ReportCacheService {
  private cache: Map<string, CachedReport> = new Map();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached reports

  /**
   * Get a cached report by key
   */
  async getReport(cacheKey: string): Promise<Report | null> {
    try {
      const cached = this.cache.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      // Check if cache has expired
      if (this.isCacheExpired(cached)) {
        this.cache.delete(cacheKey);
        return null;
      }

      // Update access statistics
      cached.accessCount++;
      cached.lastAccessed = Date.now();

      return { ...cached.report }; // Return a copy to prevent mutations
    } catch (error) {
      throw new ReportingError(
        'Failed to retrieve cached report',
        'CACHE_RETRIEVAL_ERROR',
        { cacheKey, error: error.message }
      );
    }
  }

  /**
   * Cache a report with optional TTL
   */
  async setReport(cacheKey: string, report: Report, ttl?: number): Promise<void> {
    try {
      // Ensure cache size doesn't exceed limit
      while (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.evictLeastRecentlyUsed();
      }

      const cachedReport: CachedReport = {
        report: { ...report }, // Store a copy to prevent mutations
        cachedAt: Date.now(),
        ttl: ttl || this.DEFAULT_TTL,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      // Set cache expiry in report metadata
      cachedReport.report.metadata.cacheExpiry = new Date(
        Date.now() + cachedReport.ttl
      ).toISOString();

      this.cache.set(cacheKey, cachedReport);
    } catch (error) {
      throw new ReportingError(
        'Failed to cache report',
        'CACHE_STORAGE_ERROR',
        { cacheKey, error: error.message }
      );
    }
  }

  /**
   * Remove a specific report from cache
   */
  async removeReport(cacheKey: string): Promise<boolean> {
    try {
      return this.cache.delete(cacheKey);
    } catch (error) {
      throw new ReportingError(
        'Failed to remove cached report',
        'CACHE_REMOVAL_ERROR',
        { cacheKey, error: error.message }
      );
    }
  }

  /**
   * Clear all cached reports
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      throw new ReportingError(
        'Failed to clear report cache',
        'CACHE_CLEAR_ERROR',
        { error: error.message }
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const stats: CacheStats = {
      totalCached: this.cache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      defaultTtl: this.DEFAULT_TTL,
      hitRate: 0,
      totalAccesses: 0,
      oldestEntry: null,
      newestEntry: null,
      mostAccessed: null
    };

    if (this.cache.size === 0) {
      return stats;
    }

    let totalAccesses = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    let mostAccessedKey = '';
    let maxAccesses = 0;

    for (const [key, cached] of this.cache.entries()) {
      totalAccesses += cached.accessCount;
      
      if (cached.cachedAt < oldestTime) {
        oldestTime = cached.cachedAt;
        stats.oldestEntry = key;
      }
      
      if (cached.cachedAt > newestTime) {
        newestTime = cached.cachedAt;
        stats.newestEntry = key;
      }
      
      if (cached.accessCount > maxAccesses) {
        maxAccesses = cached.accessCount;
        mostAccessedKey = key;
        stats.mostAccessed = key;
      }
    }

    stats.totalAccesses = totalAccesses;
    stats.hitRate = totalAccesses > 0 ? (totalAccesses / this.cache.size) : 0;

    return stats;
  }

  /**
   * Get all cached report keys with metadata
   */
  getCachedReportKeys(): CachedReportInfo[] {
    const results: CachedReportInfo[] = [];

    for (const [key, cached] of this.cache.entries()) {
      results.push({
        cacheKey: key,
        reportId: cached.report.id,
        reportName: cached.report.name,
        reportType: cached.report.type,
        cachedAt: new Date(cached.cachedAt).toISOString(),
        expiresAt: new Date(cached.cachedAt + cached.ttl).toISOString(),
        accessCount: cached.accessCount,
        lastAccessed: new Date(cached.lastAccessed).toISOString(),
        isExpired: this.isCacheExpired(cached)
      });
    }

    return results.sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      let invalidatedCount = 0;
      const regex = new RegExp(pattern);

      for (const [key] of this.cache.entries()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          invalidatedCount++;
        }
      }

      return invalidatedCount;
    } catch (error) {
      throw new ReportingError(
        'Failed to invalidate cache pattern',
        'CACHE_INVALIDATION_ERROR',
        { pattern, error: error.message }
      );
    }
  }

  /**
   * Preload frequently used reports
   */
  async preloadReports(reportConfigs: PreloadConfig[]): Promise<void> {
    try {
      for (const config of reportConfigs) {
        // This would typically generate and cache the report
        // For now, we'll just reserve the cache key
        const cacheKey = `preload:${config.reportType}:${config.cacheKey}`;
        
        // Create a placeholder cached report
        const placeholderReport: Report = {
          id: `preload_${Date.now()}`,
          name: `Preloaded ${config.reportType}`,
          type: config.reportType,
          parameters: config.parameters,
          data: [],
          metadata: {
            totalRecords: 0,
            generationTime: 0,
            dataSource: 'preload',
            lastRefreshed: new Date().toISOString(),
            version: '1.0',
            permissions: []
          },
          status: 'generating',
          generatedBy: 'system',
          exportFormats: ['pdf', 'excel', 'csv'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await this.setReport(cacheKey, placeholderReport, config.ttl);
      }
    } catch (error) {
      throw new ReportingError(
        'Failed to preload reports',
        'CACHE_PRELOAD_ERROR',
        { error: error.message }
      );
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      let cleanedCount = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (this.isCacheExpired(cached)) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      throw new ReportingError(
        'Failed to cleanup expired cache entries',
        'CACHE_CLEANUP_ERROR',
        { error: error.message }
      );
    }
  }

  // Private helper methods

  private isCacheExpired(cached: CachedReport): boolean {
    return Date.now() > (cached.cachedAt + cached.ttl);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = '';
    let oldestAccess = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastAccessed < oldestAccess) {
        oldestAccess = cached.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Supporting interfaces
interface CacheStats {
  totalCached: number;
  maxCacheSize: number;
  defaultTtl: number;
  hitRate: number;
  totalAccesses: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  mostAccessed: string | null;
}

interface CachedReportInfo {
  cacheKey: string;
  reportId: string;
  reportName: string;
  reportType: string;
  cachedAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccessed: string;
  isExpired: boolean;
}

interface PreloadConfig {
  reportType: string;
  cacheKey: string;
  parameters: any;
  ttl?: number;
}

export default ReportCacheService;