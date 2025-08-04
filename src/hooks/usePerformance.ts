import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  isSlowConnection: boolean;
}

export function usePerformance(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const startTime = startTimeRef.current;
    const renderStart = renderStartRef.current;
    
    // Measure load time
    const loadTime = Date.now() - startTime;
    
    // Measure render time
    const renderTime = Date.now() - renderStart;
    
    // Check connection speed
    const connection = (navigator as any).connection;
    const isSlowConnection = connection ? 
      connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : 
      false;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    const performanceMetrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage,
      isSlowConnection
    };

    setMetrics(performanceMetrics);

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && componentName) {
      console.group(`🚀 Performance Metrics: ${componentName}`);
      console.log(`Load Time: ${loadTime}ms`);
      console.log(`Render Time: ${renderTime}ms`);
      if (memoryUsage) {
        console.log(`Memory Usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
      console.log(`Slow Connection: ${isSlowConnection}`);
      console.groupEnd();
    }

    // Warn about slow performance
    if (loadTime > 3000) {
      console.warn(`⚠️ Slow load time detected: ${loadTime}ms for ${componentName || 'component'}`);
    }

    if (renderTime > 100) {
      console.warn(`⚠️ Slow render time detected: ${renderTime}ms for ${componentName || 'component'}`);
    }

  }, [componentName]);

  return metrics;
}

// Hook for measuring specific operations
export function useOperationTimer() {
  const timerRef = useRef<{ [key: string]: number }>({});

  const startTimer = (operationName: string) => {
    timerRef.current[operationName] = Date.now();
  };

  const endTimer = (operationName: string) => {
    const startTime = timerRef.current[operationName];
    if (!startTime) {
      console.warn(`Timer "${operationName}" was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    delete timerRef.current[operationName];

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${operationName}: ${duration}ms`);
    }

    return duration;
  };

  return { startTimer, endTimer };
}

// Hook for monitoring bundle size impact
export function useBundleAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor bundle loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.group('📦 Bundle Analytics');
            console.log(`DOM Content Loaded: ${navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart}ms`);
            console.log(`Load Complete: ${navEntry.loadEventEnd - navEntry.loadEventStart}ms`);
            console.log(`Total Load Time: ${navEntry.loadEventEnd - navEntry.navigationStart}ms`);
            console.groupEnd();
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);
}