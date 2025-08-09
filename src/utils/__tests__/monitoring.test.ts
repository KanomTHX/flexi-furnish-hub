/**
 * Monitoring Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitor, recordMetric, measureOperation, getSystemHealth, getSystemMetrics } from '../monitoring';

// Mock fetch
const mockFetch = vi.fn();

// Mock performance
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntries: vi.fn(() => []),
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
  }
};

// Mock navigator
const mockNavigator = {
  onLine: true,
};

describe('Monitoring', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.fetch = mockFetch as any;
    global.performance = mockPerformance as any;
    global.navigator = mockNavigator as any;
    
    // Mock window events
    global.window = {
      addEventListener: vi.fn(),
      setInterval: vi.fn(),
      clearInterval: vi.fn(),
    } as any;
    
    // Mock import.meta.env
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('recordMetric', () => {
    it('should record performance metrics', () => {
      recordMetric('test_metric', 100, { tag: 'test' });
      
      const metrics = monitor.getMetrics('test_metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_metric',
        value: 100,
        tags: { tag: 'test' },
        timestamp: expect.any(Date)
      });
    });

    it('should limit metrics history', () => {
      // Record more than max metrics
      for (let i = 0; i < 1005; i++) {
        recordMetric('bulk_metric', i);
      }
      
      const metrics = monitor.getMetrics('bulk_metric');
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });

    it('should log slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      recordMetric('slow_operation_time', 3000);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('measureOperation', () => {
    it('should measure synchronous operations', () => {
      const operation = vi.fn(() => 'result');
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      const result = monitor.measureOperation('sync_test', operation);
      
      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
      expect(mockPerformance.mark).toHaveBeenCalledWith('sync_test_start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('sync_test_end');
      expect(mockPerformance.measure).toHaveBeenCalledWith('sync_test_duration', 'sync_test_start', 'sync_test_end');
    });

    it('should measure asynchronous operations', async () => {
      const operation = vi.fn(async () => 'async_result');
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200);
      
      const result = await monitor.measureOperation('async_test', operation);
      
      expect(result).toBe('async_result');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle operation errors', () => {
      const error = new Error('Operation failed');
      const operation = vi.fn(() => { throw error; });
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      expect(() => monitor.measureOperation('error_test', operation)).toThrow('Operation failed');
      
      const metrics = monitor.getMetrics('error_test_duration_error');
      expect(metrics).toHaveLength(1);
    });

    it('should handle async operation errors', async () => {
      const error = new Error('Async operation failed');
      const operation = vi.fn(async () => { throw error; });
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
      
      await expect(monitor.measureOperation('async_error_test', operation)).rejects.toThrow('Async operation failed');
      
      const metrics = monitor.getMetrics('async_error_test_duration_error');
      expect(metrics).toHaveLength(1);
    });
  });

  describe('Health Checks', () => {
    it('should record health check results', () => {
      monitor.recordHealthCheck('test_service', 'healthy', 100);
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.test_service).toMatchObject({
        service: 'test_service',
        status: 'healthy',
        responseTime: 100,
        timestamp: expect.any(Date)
      });
    });

    it('should keep latest health check per service', () => {
      monitor.recordHealthCheck('test_service', 'healthy', 100);
      monitor.recordHealthCheck('test_service', 'degraded', 200);
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.test_service.status).toBe('degraded');
      expect(healthStatus.test_service.responseTime).toBe(200);
    });

    it('should log unhealthy services', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      monitor.recordHealthCheck('failing_service', 'unhealthy', undefined, 'Service is down');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log degraded services', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.recordHealthCheck('slow_service', 'degraded', 5000, 'Service is slow');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('System Metrics', () => {
    it('should return system metrics', () => {
      recordMetric('memory_usage_percent', 75);
      recordMetric('error_rate_5min', 2);
      
      const metrics = getSystemMetrics();
      
      expect(metrics).toMatchObject({
        memoryUsage: 75,
        performanceEntries: expect.any(Array),
        connectionStatus: 'online',
        lastHealthCheck: expect.any(Date),
        errorRate: 2
      });
    });

    it('should handle offline status', () => {
      mockNavigator.onLine = false;
      
      const metrics = getSystemMetrics();
      
      expect(metrics.connectionStatus).toBe('offline');
    });

    it('should return default values when no metrics exist', () => {
      const metrics = getSystemMetrics();
      
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('Metric Filtering', () => {
    it('should filter metrics by name', () => {
      recordMetric('metric_a', 100);
      recordMetric('metric_b', 200);
      recordMetric('metric_a', 150);
      
      const metricsA = monitor.getMetrics('metric_a');
      expect(metricsA).toHaveLength(2);
      expect(metricsA.every(m => m.name === 'metric_a')).toBe(true);
    });

    it('should filter metrics by date', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      recordMetric('time_metric', 100);
      
      const recentMetrics = monitor.getMetrics('time_metric', oneHourAgo);
      expect(recentMetrics).toHaveLength(1);
      
      const futureMetrics = monitor.getMetrics('time_metric', new Date(now.getTime() + 60 * 60 * 1000));
      expect(futureMetrics).toHaveLength(0);
    });

    it('should return all metrics when no filters applied', () => {
      recordMetric('metric_1', 100);
      recordMetric('metric_2', 200);
      
      const allMetrics = monitor.getMetrics();
      expect(allMetrics.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Supabase Health Check', () => {
    it('should check Supabase connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });
      
      // Trigger health check manually
      await monitor['checkSupabaseConnection']();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/rest/v1/',
        expect.objectContaining({
          method: 'HEAD',
          headers: expect.objectContaining({
            'apikey': 'test-key'
          })
        })
      );
    });

    it('should handle Supabase connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));
      
      await monitor['checkSupabaseConnection']();
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.supabase?.status).toBe('unhealthy');
    });

    it('should handle Supabase degraded response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await monitor['checkSupabaseConnection']();
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.supabase?.status).toBe('degraded');
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage', async () => {
      await monitor['checkMemoryUsage']();
      
      const metrics = monitor.getMetrics('memory_usage_percent');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(50); // 50MB / 100MB = 50%
    });

    it('should detect high memory usage', async () => {
      mockPerformance.memory.usedJSHeapSize = 95000000; // 95MB
      
      await monitor['checkMemoryUsage']();
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.memory?.status).toBe('unhealthy');
    });

    it('should detect elevated memory usage', async () => {
      mockPerformance.memory.usedJSHeapSize = 80000000; // 80MB
      
      await monitor['checkMemoryUsage']();
      
      const healthStatus = getSystemHealth();
      expect(healthStatus.memory?.status).toBe('degraded');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      monitor.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});