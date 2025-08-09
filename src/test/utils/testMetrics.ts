// Test metrics collection and analysis
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TestMetric {
  testName: string;
  suiteName: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  memoryUsage: number;
  timestamp: string;
  retries: number;
  error?: string;
}

interface TestSuiteMetrics {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageDuration: number;
  memoryUsage: number;
  flakyTests: string[];
  slowTests: string[];
  coverage?: number;
}

interface TestRunMetrics {
  runId: string;
  timestamp: string;
  environment: {
    node: string;
    platform: string;
    ci: boolean;
  };
  suites: TestSuiteMetrics[];
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    averageDuration: number;
    overallCoverage: number;
    passRate: number;
    flakinessRate: number;
  };
}

export class TestMetricsCollector {
  private metrics: TestMetric[] = [];
  private runId: string;
  private metricsDir: string;

  constructor(metricsDir = './test-results/metrics') {
    this.runId = `run-${Date.now()}`;
    this.metricsDir = metricsDir;
    this.ensureMetricsDir();
  }

  private ensureMetricsDir(): void {
    const fs = require('fs');
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  recordTest(metric: Omit<TestMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date().toISOString()
    });
  }

  recordTestStart(testName: string, suiteName: string): () => void {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    return (status: 'passed' | 'failed' | 'skipped' = 'passed', error?: string) => {
      const duration = performance.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed - startMemory;

      this.recordTest({
        testName,
        suiteName,
        duration,
        status,
        memoryUsage,
        retries: 0,
        error
      });
    };
  }

  calculateSuiteMetrics(suiteName: string): TestSuiteMetrics {
    const suiteTests = this.metrics.filter(m => m.suiteName === suiteName);
    
    const totalTests = suiteTests.length;
    const passedTests = suiteTests.filter(t => t.status === 'passed').length;
    const failedTests = suiteTests.filter(t => t.status === 'failed').length;
    const skippedTests = suiteTests.filter(t => t.status === 'skipped').length;
    
    const totalDuration = suiteTests.reduce((sum, t) => sum + t.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
    const memoryUsage = suiteTests.reduce((sum, t) => sum + t.memoryUsage, 0);
    
    // Identify slow tests (> 5 seconds)
    const slowTests = suiteTests
      .filter(t => t.duration > 5000)
      .map(t => t.testName);
    
    // Identify flaky tests (would need historical data)
    const flakyTests: string[] = [];

    return {
      suiteName,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      averageDuration,
      memoryUsage,
      flakyTests,
      slowTests
    };
  }

  generateRunMetrics(): TestRunMetrics {
    const suiteNames = [...new Set(this.metrics.map(m => m.suiteName))];
    const suites = suiteNames.map(name => this.calculateSuiteMetrics(name));
    
    const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
    const passedTests = suites.reduce((sum, s) => sum + s.passedTests, 0);
    const failedTests = suites.reduce((sum, s) => sum + s.failedTests, 0);
    const skippedTests = suites.reduce((sum, s) => sum + s.skippedTests, 0);
    const totalDuration = suites.reduce((sum, s) => sum + s.totalDuration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
    
    const coverageValues = suites
      .map(s => s.coverage)
      .filter((c): c is number => c !== undefined);
    const overallCoverage = coverageValues.length > 0
      ? coverageValues.reduce((sum, c) => sum + c, 0) / coverageValues.length
      : 0;
    
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const flakyTestCount = suites.reduce((sum, s) => sum + s.flakyTests.length, 0);
    const flakinessRate = totalTests > 0 ? (flakyTestCount / totalTests) * 100 : 0;

    return {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      suites,
      overall: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        totalDuration,
        averageDuration,
        overallCoverage,
        passRate,
        flakinessRate
      }
    };
  }

  saveMetrics(): void {
    const runMetrics = this.generateRunMetrics();
    
    // Save current run metrics
    const runFile = join(this.metricsDir, `${this.runId}.json`);
    writeFileSync(runFile, JSON.stringify(runMetrics, null, 2));
    
    // Update historical metrics
    this.updateHistoricalMetrics(runMetrics);
    
    console.log(`📊 Test metrics saved: ${runFile}`);
  }

  private updateHistoricalMetrics(runMetrics: TestRunMetrics): void {
    const historyFile = join(this.metricsDir, 'history.json');
    let history: TestRunMetrics[] = [];
    
    if (existsSync(historyFile)) {
      try {
        history = JSON.parse(readFileSync(historyFile, 'utf8'));
      } catch (error) {
        console.warn('Failed to read historical metrics, starting fresh');
      }
    }
    
    history.push(runMetrics);
    
    // Keep only last 100 runs
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }

  generateTrendReport(): any {
    const historyFile = join(this.metricsDir, 'history.json');
    
    if (!existsSync(historyFile)) {
      return { message: 'No historical data available' };
    }
    
    const history: TestRunMetrics[] = JSON.parse(readFileSync(historyFile, 'utf8'));
    
    if (history.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }
    
    const recent = history.slice(-10); // Last 10 runs
    const older = history.slice(-20, -10); // Previous 10 runs
    
    const recentAvg = {
      passRate: recent.reduce((sum, r) => sum + r.overall.passRate, 0) / recent.length,
      coverage: recent.reduce((sum, r) => sum + r.overall.overallCoverage, 0) / recent.length,
      duration: recent.reduce((sum, r) => sum + r.overall.averageDuration, 0) / recent.length,
      flakiness: recent.reduce((sum, r) => sum + r.overall.flakinessRate, 0) / recent.length
    };
    
    const olderAvg = older.length > 0 ? {
      passRate: older.reduce((sum, r) => sum + r.overall.passRate, 0) / older.length,
      coverage: older.reduce((sum, r) => sum + r.overall.overallCoverage, 0) / older.length,
      duration: older.reduce((sum, r) => sum + r.overall.averageDuration, 0) / older.length,
      flakiness: older.reduce((sum, r) => sum + r.overall.flakinessRate, 0) / older.length
    } : recentAvg;
    
    return {
      trends: {
        passRate: {
          current: recentAvg.passRate,
          previous: olderAvg.passRate,
          trend: recentAvg.passRate > olderAvg.passRate ? 'improving' : 'declining',
          change: recentAvg.passRate - olderAvg.passRate
        },
        coverage: {
          current: recentAvg.coverage,
          previous: olderAvg.coverage,
          trend: recentAvg.coverage > olderAvg.coverage ? 'improving' : 'declining',
          change: recentAvg.coverage - olderAvg.coverage
        },
        performance: {
          current: recentAvg.duration,
          previous: olderAvg.duration,
          trend: recentAvg.duration < olderAvg.duration ? 'improving' : 'declining',
          change: recentAvg.duration - olderAvg.duration
        },
        stability: {
          current: recentAvg.flakiness,
          previous: olderAvg.flakiness,
          trend: recentAvg.flakiness < olderAvg.flakiness ? 'improving' : 'declining',
          change: recentAvg.flakiness - olderAvg.flakiness
        }
      },
      recommendations: this.generateRecommendations(recentAvg, olderAvg)
    };
  }

  private generateRecommendations(recent: any, older: any): string[] {
    const recommendations: string[] = [];
    
    if (recent.passRate < 95) {
      recommendations.push('Consider investigating failing tests to improve pass rate');
    }
    
    if (recent.coverage < 80) {
      recommendations.push('Increase test coverage to meet the 80% threshold');
    }
    
    if (recent.duration > older.duration * 1.2) {
      recommendations.push('Test execution time has increased significantly, consider optimization');
    }
    
    if (recent.flakiness > 5) {
      recommendations.push('High flakiness rate detected, investigate unstable tests');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Test suite is performing well, maintain current practices');
    }
    
    return recommendations;
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
    
    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
    
    return result;
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return null;
    }
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  reset(): void {
    this.measurements.clear();
  }
}

// Memory monitoring utilities
export class MemoryMonitor {
  private snapshots: Array<{ timestamp: string; usage: NodeJS.MemoryUsage }> = [];

  takeSnapshot(): NodeJS.MemoryUsage {
    const usage = process.memoryUsage();
    this.snapshots.push({
      timestamp: new Date().toISOString(),
      usage
    });
    return usage;
  }

  getMemoryTrend() {
    if (this.snapshots.length < 2) {
      return null;
    }
    
    const first = this.snapshots[0].usage;
    const last = this.snapshots[this.snapshots.length - 1].usage;
    
    return {
      heapUsedChange: last.heapUsed - first.heapUsed,
      heapTotalChange: last.heapTotal - first.heapTotal,
      externalChange: last.external - first.external,
      snapshots: this.snapshots.length
    };
  }

  checkMemoryLeak(threshold = 50 * 1024 * 1024): boolean { // 50MB threshold
    const trend = this.getMemoryTrend();
    return trend ? trend.heapUsedChange > threshold : false;
  }

  reset(): void {
    this.snapshots = [];
  }
}

// Global instances
export const testMetrics = new TestMetricsCollector();
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();