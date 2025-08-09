// Comprehensive test runner with reporting and metrics
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  command: string;
  timeout: number;
  required: boolean;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
  warnings?: string[];
}

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageDuration: number;
  coveragePercentage: number;
  memoryUsage: number;
  flakyTests: string[];
  slowTests: string[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(private config: {
    outputDir: string;
    parallel: boolean;
    failFast: boolean;
    coverage: boolean;
    verbose: boolean;
  }) {
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting comprehensive test suite...\n');
    this.startTime = Date.now();

    const testSuites: TestSuite[] = [
      {
        name: 'Unit Tests',
        command: 'npm run test:unit',
        timeout: 60000,
        required: true
      },
      {
        name: 'Integration Tests',
        command: 'npm run test:integration',
        timeout: 120000,
        required: true
      },
      {
        name: 'End-to-End Tests',
        command: 'npm run test:e2e',
        timeout: 300000,
        required: false
      },
      {
        name: 'Performance Tests',
        command: 'npm run test:performance',
        timeout: 180000,
        required: false
      }
    ];

    let allPassed = true;

    if (this.config.parallel) {
      allPassed = await this.runTestsInParallel(testSuites);
    } else {
      allPassed = await this.runTestsSequentially(testSuites);
    }

    this.endTime = Date.now();
    await this.generateReports();
    
    return allPassed;
  }

  private async runTestsSequentially(testSuites: TestSuite[]): Promise<boolean> {
    let allPassed = true;

    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name}...`);
      const result = await this.runTestSuite(suite);
      this.results.push(result);

      if (!result.passed) {
        allPassed = false;
        console.log(`❌ ${suite.name} failed`);
        
        if (suite.required && this.config.failFast) {
          console.log('🛑 Stopping due to required test failure (fail-fast mode)');
          break;
        }
      } else {
        console.log(`✅ ${suite.name} passed (${result.duration}ms)`);
      }
    }

    return allPassed;
  }

  private async runTestsInParallel(testSuites: TestSuite[]): Promise<boolean> {
    console.log('🔄 Running tests in parallel...\n');

    const promises = testSuites.map(suite => this.runTestSuite(suite));
    const results = await Promise.allSettled(promises);

    let allPassed = true;

    results.forEach((result, index) => {
      const suite = testSuites[index];
      
      if (result.status === 'fulfilled') {
        this.results.push(result.value);
        
        if (!result.value.passed) {
          allPassed = false;
          console.log(`❌ ${suite.name} failed`);
        } else {
          console.log(`✅ ${suite.name} passed (${result.value.duration}ms)`);
        }
      } else {
        allPassed = false;
        console.log(`💥 ${suite.name} crashed: ${result.reason}`);
        
        this.results.push({
          suite: suite.name,
          passed: false,
          duration: 0,
          errors: [result.reason.toString()]
        });
      }
    });

    return allPassed;
  }

  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout,
        stdio: this.config.verbose ? 'inherit' : 'pipe'
      });

      const duration = Date.now() - startTime;
      const coverage = this.extractCoverage(output);

      return {
        suite: suite.name,
        passed: true,
        duration,
        coverage,
        warnings: this.extractWarnings(output)
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        suite: suite.name,
        passed: false,
        duration,
        errors: [error.message],
        warnings: error.stdout ? this.extractWarnings(error.stdout) : []
      };
    }
  }

  private extractCoverage(output: string): number | undefined {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : undefined;
  }

  private extractWarnings(output: string): string[] {
    const warnings: string[] = [];
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.includes('WARN') || line.includes('WARNING')) {
        warnings.push(line.trim());
      }
    });

    return warnings;
  }

  private calculateMetrics(): TestMetrics {
    const totalDuration = this.endTime - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const totalTests = this.results.length;
    
    const averageDuration = totalTests > 0 
      ? this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;

    const coverageValues = this.results
      .map(r => r.coverage)
      .filter((c): c is number => c !== undefined);
    
    const averageCoverage = coverageValues.length > 0
      ? coverageValues.reduce((sum, c) => sum + c, 0) / coverageValues.length
      : 0;

    // Identify slow tests (> 30 seconds)
    const slowTests = this.results
      .filter(r => r.duration > 30000)
      .map(r => r.suite);

    // Mock flaky tests detection (would need historical data in real implementation)
    const flakyTests: string[] = [];

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests: 0,
      totalDuration,
      averageDuration,
      coveragePercentage: averageCoverage,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      flakyTests,
      slowTests
    };
  }

  private async generateReports(): Promise<void> {
    const metrics = this.calculateMetrics();
    
    // Generate JSON report
    await this.generateJSONReport(metrics);
    
    // Generate HTML report
    await this.generateHTMLReport(metrics);
    
    // Generate console summary
    this.printSummary(metrics);
    
    // Generate CI-friendly output
    if (process.env.CI) {
      await this.generateCIReport(metrics);
    }
  }

  private async generateJSONReport(metrics: TestMetrics): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      configuration: this.config,
      results: this.results,
      metrics,
      summary: {
        success: metrics.failedTests === 0,
        duration: metrics.totalDuration,
        coverage: metrics.coveragePercentage
      }
    };

    const reportPath = join(this.config.outputDir, 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report generated: ${reportPath}`);
  }

  private async generateHTMLReport(metrics: TestMetrics): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Warehouse Stock System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .results { margin-top: 30px; }
        .result { margin-bottom: 15px; padding: 15px; border-radius: 6px; }
        .result.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .result.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .result-header { font-weight: bold; margin-bottom: 10px; }
        .result-details { font-size: 0.9em; color: #666; }
        .coverage-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); transition: width 0.3s ease; }
        .errors { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; }
        .error { color: #dc3545; font-family: monospace; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Report</h1>
            <p>Warehouse Stock System - ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${metrics.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745">${metrics.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545">${metrics.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(metrics.coveragePercentage)}%</div>
                <div class="metric-label">Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(metrics.totalDuration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(metrics.memoryUsage)}MB</div>
                <div class="metric-label">Memory</div>
            </div>
        </div>

        <div class="coverage-bar">
            <div class="coverage-fill" style="width: ${metrics.coveragePercentage}%"></div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${this.results.map(result => `
                <div class="result ${result.passed ? 'passed' : 'failed'}">
                    <div class="result-header">
                        ${result.passed ? '✅' : '❌'} ${result.suite}
                    </div>
                    <div class="result-details">
                        Duration: ${result.duration}ms
                        ${result.coverage ? `| Coverage: ${result.coverage}%` : ''}
                    </div>
                    ${result.errors && result.errors.length > 0 ? `
                        <div class="errors">
                            <strong>Errors:</strong>
                            ${result.errors.map(error => `<div class="error">${error}</div>`).join('')}
                        </div>
                    ` : ''}
                    ${result.warnings && result.warnings.length > 0 ? `
                        <div class="errors">
                            <strong>Warnings:</strong>
                            ${result.warnings.map(warning => `<div class="error" style="color: #ffc107">${warning}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        ${metrics.slowTests.length > 0 ? `
            <div class="results">
                <h2>⚠️ Slow Tests</h2>
                <p>The following tests took longer than 30 seconds:</p>
                <ul>
                    ${metrics.slowTests.map(test => `<li>${test}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;

    const reportPath = join(this.config.outputDir, 'test-report.html');
    writeFileSync(reportPath, html);
    console.log(`📊 HTML report generated: ${reportPath}`);
  }

  private async generateCIReport(metrics: TestMetrics): Promise<void> {
    // GitHub Actions output
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::set-output name=tests-total::${metrics.totalTests}`);
      console.log(`::set-output name=tests-passed::${metrics.passedTests}`);
      console.log(`::set-output name=tests-failed::${metrics.failedTests}`);
      console.log(`::set-output name=coverage::${Math.round(metrics.coveragePercentage)}`);
      console.log(`::set-output name=duration::${Math.round(metrics.totalDuration / 1000)}`);
    }

    // Generate badge data
    const badgeData = {
      schemaVersion: 1,
      label: 'tests',
      message: `${metrics.passedTests}/${metrics.totalTests} passing`,
      color: metrics.failedTests === 0 ? 'brightgreen' : 'red'
    };

    const badgePath = join(this.config.outputDir, 'badge.json');
    writeFileSync(badgePath, JSON.stringify(badgeData));
  }

  private printSummary(metrics: TestMetrics): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${metrics.totalTests}`);
    console.log(`Passed: ${metrics.passedTests} ✅`);
    console.log(`Failed: ${metrics.failedTests} ${metrics.failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Coverage: ${Math.round(metrics.coveragePercentage)}%`);
    console.log(`Duration: ${Math.round(metrics.totalDuration / 1000)}s`);
    console.log(`Memory: ${Math.round(metrics.memoryUsage)}MB`);
    
    if (metrics.slowTests.length > 0) {
      console.log(`\n⚠️  Slow Tests: ${metrics.slowTests.join(', ')}`);
    }
    
    console.log('='.repeat(60));
    
    if (metrics.failedTests === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`💥 ${metrics.failedTests} test suite(s) failed`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  const config = {
    outputDir: args.includes('--output-dir') 
      ? args[args.indexOf('--output-dir') + 1] 
      : './test-results',
    parallel: args.includes('--parallel'),
    failFast: args.includes('--fail-fast'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose')
  };

  const runner = new TestRunner(config);
  const success = await runner.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

export { TestRunner };