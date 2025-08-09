/**
 * Application Monitoring Utility
 * Handles performance monitoring, health checks, and system metrics
 */

import { errorLogger } from './errorLogger';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

export interface SystemMetrics {
  memoryUsage: number;
  performanceEntries: PerformanceEntry[];
  connectionStatus: 'online' | 'offline';
  lastHealthCheck: Date;
  errorRate: number;
}

class ApplicationMonitor {
  private metrics: PerformanceMetric[] = [];
  private healthChecks: HealthCheck[] = [];
  private maxMetricsHistory = 1000;
  private healthCheckInterval: number | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.setupPerformanceMonitoring();
    this.setupHealthChecks();
    this.setupNetworkMonitoring();
  }

  private setupPerformanceMonitoring(): void {
    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      navigationEntries.forEach(entry => {
        this.recordMetric('page_load_time', entry.loadEventEnd - entry.loadEventStart);
        this.recordMetric('dom_content_loaded', (entry as PerformanceNavigationTiming).domContentLoadedEventEnd - entry.startTime);
      });
    }

    // Setup performance observer for ongoing monitoring
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            switch (entry.entryType) {
              case 'measure':
                this.recordMetric(entry.name, entry.duration);
                break;
              case 'navigation':
                const navEntry = entry as PerformanceNavigationTiming;
                this.recordMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
                this.recordMetric('fcp', navEntry.loadEventEnd - navEntry.loadEventStart);
                break;
              case 'resource':
                if (entry.duration > 1000) { // Log slow resources
                  errorLogger.logWarning(`Slow resource load: ${entry.name}`, {
                    component: 'Monitor',
                    action: 'slow_resource',
                    metadata: { duration: entry.duration, resource: entry.name }
                  });
                }
                break;
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        errorLogger.logWarning('Failed to setup performance observer', {
          component: 'Monitor',
          action: 'setup_performance_observer',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }
  }

  private setupHealthChecks(): void {
    // Run health checks every 5 minutes
    this.healthCheckInterval = window.setInterval(() => {
      this.runHealthChecks();
    }, 5 * 60 * 1000);

    // Run initial health check
    setTimeout(() => this.runHealthChecks(), 1000);
  }

  private setupNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.recordHealthCheck('network', 'healthy');
      errorLogger.logInfo('Network connection restored', {
        component: 'Monitor',
        action: 'network_online'
      });
    });

    window.addEventListener('offline', () => {
      this.recordHealthCheck('network', 'unhealthy', undefined, 'Network offline');
      errorLogger.logWarning('Network connection lost', {
        component: 'Monitor',
        action: 'network_offline'
      });
    });
  }

  private async runHealthChecks(): Promise<void> {
    const checks = [
      this.checkSupabaseConnection(),
      this.checkLocalStorage(),
      this.checkMemoryUsage(),
      this.checkErrorRate()
    ];

    await Promise.allSettled(checks);
  }

  private async checkSupabaseConnection(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Simple health check query
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      const responseTime = performance.now() - startTime;
      
      if (response.ok) {
        this.recordHealthCheck('supabase', 'healthy', responseTime);
      } else {
        this.recordHealthCheck('supabase', 'degraded', responseTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.recordHealthCheck('supabase', 'unhealthy', responseTime, 
        error instanceof Error ? error.message : 'Connection failed');
    }
  }

  private async checkLocalStorage(): Promise<void> {
    try {
      const testKey = '__health_check__';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        this.recordHealthCheck('localStorage', 'healthy');
      } else {
        this.recordHealthCheck('localStorage', 'unhealthy', undefined, 'Data integrity check failed');
      }
    } catch (error) {
      this.recordHealthCheck('localStorage', 'unhealthy', undefined, 
        error instanceof Error ? error.message : 'LocalStorage access failed');
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      this.recordMetric('memory_usage_percent', memoryUsage);

      if (memoryUsage > 90) {
        this.recordHealthCheck('memory', 'unhealthy', undefined, `High memory usage: ${memoryUsage.toFixed(1)}%`);
      } else if (memoryUsage > 75) {
        this.recordHealthCheck('memory', 'degraded', undefined, `Elevated memory usage: ${memoryUsage.toFixed(1)}%`);
      } else {
        this.recordHealthCheck('memory', 'healthy');
      }
    }
  }

  private async checkErrorRate(): Promise<void> {
    const stats = errorLogger.getErrorStats();
    const recentErrors = stats.recentErrors.filter(
      error => Date.now() - error.context.timestamp!.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const errorRate = recentErrors.length;
    this.recordMetric('error_rate_5min', errorRate);

    if (errorRate > 10) {
      this.recordHealthCheck('errors', 'unhealthy', undefined, `High error rate: ${errorRate} errors in 5 minutes`);
    } else if (errorRate > 5) {
      this.recordHealthCheck('errors', 'degraded', undefined, `Elevated error rate: ${errorRate} errors in 5 minutes`);
    } else {
      this.recordHealthCheck('errors', 'healthy');
    }
  }

  // Public methods
  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow operations
    if ((name.includes('time') || name.includes('duration')) && value > 2000) {
      errorLogger.logWarning(`Slow operation detected: ${name}`, {
        component: 'Monitor',
        action: 'slow_operation',
        metadata: { metric: name, value, tags }
      });
    }
  }

  public recordHealthCheck(
    service: string, 
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number,
    error?: string
  ): void {
    const healthCheck: HealthCheck = {
      service,
      status,
      responseTime,
      error,
      timestamp: new Date()
    };

    this.healthChecks.push(healthCheck);

    // Keep only recent health checks (last 100)
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }

    // Log unhealthy services
    if (status === 'unhealthy') {
      errorLogger.logError(`Service unhealthy: ${service}`, {
        component: 'Monitor',
        action: 'health_check',
        metadata: { service, status, error, responseTime }
      });
    } else if (status === 'degraded') {
      errorLogger.logWarning(`Service degraded: ${service}`, {
        component: 'Monitor',
        action: 'health_check',
        metadata: { service, status, error, responseTime }
      });
    }
  }

  public getMetrics(name?: string, since?: Date): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === name);
    }

    if (since) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= since);
    }

    return filteredMetrics;
  }

  public getHealthStatus(): Record<string, HealthCheck> {
    const latestChecks: Record<string, HealthCheck> = {};

    // Get the latest health check for each service
    this.healthChecks.forEach(check => {
      if (!latestChecks[check.service] || 
          check.timestamp > latestChecks[check.service].timestamp) {
        latestChecks[check.service] = check;
      }
    });

    return latestChecks;
  }

  public getSystemMetrics(): SystemMetrics {
    const memoryMetrics = this.getMetrics('memory_usage_percent');
    const latestMemoryUsage = memoryMetrics.length > 0 ? 
      memoryMetrics[memoryMetrics.length - 1].value : 0;

    const errorRateMetrics = this.getMetrics('error_rate_5min');
    const latestErrorRate = errorRateMetrics.length > 0 ? 
      errorRateMetrics[errorRateMetrics.length - 1].value : 0;

    return {
      memoryUsage: latestMemoryUsage,
      performanceEntries: performance.getEntries().slice(-50), // Last 50 entries
      connectionStatus: navigator.onLine ? 'online' : 'offline',
      lastHealthCheck: this.healthChecks.length > 0 ? 
        this.healthChecks[this.healthChecks.length - 1].timestamp : new Date(),
      errorRate: latestErrorRate
    };
  }

  public measureOperation<T>(name: string, operation: () => T | Promise<T>): T | Promise<T> {
    const startTime = performance.now();
    const startMark = `${name}_start`;
    const endMark = `${name}_end`;
    const measureName = `${name}_duration`;

    performance.mark(startMark);

    const handleResult = (result: T) => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const duration = performance.now() - startTime;
      this.recordMetric(measureName, duration);
      
      return result;
    };

    const handleError = (error: any) => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      
      const duration = performance.now() - startTime;
      this.recordMetric(`${measureName}_error`, duration);
      
      throw error;
    };

    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.then(handleResult, handleError);
      } else {
        return handleResult(result);
      }
    } catch (error) {
      return handleError(error);
    }
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

// Create singleton instance
export const monitor = new ApplicationMonitor();

// Export convenience functions
export const recordMetric = (name: string, value: number, tags?: Record<string, string>) => 
  monitor.recordMetric(name, value, tags);

export const measureOperation = <T>(name: string, operation: () => T | Promise<T>) => 
  monitor.measureOperation(name, operation);

export const getSystemHealth = () => monitor.getHealthStatus();

export const getSystemMetrics = () => monitor.getSystemMetrics();