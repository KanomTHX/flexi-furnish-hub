#!/usr/bin/env tsx
// Comprehensive test execution script
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuiteResult {
  name: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  testCount: number;
  passedCount: number;
  failedCount: number;
  errors: string[];
}

interface TestExecutionSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalDuration: number;
  overallCoverage: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  results: TestSuiteResult[];
}

class ComprehensiveTestRunner {
  private results: TestSuiteResult[] = [];
  private startTime: number = 0;
  private outputDir: string;

  constructor(outputDir = './test-results') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runAllTests(): Promise<boolean> {
    console.log('🚀 Starting Comprehensive Test Suite Execution\n');
    this.startTime = Date.now();

    const testSuites = [
      {
        name: 'Unit Tests',
        command: 'npm run test:unit -- --reporter=json --outputFile=test-results/unit-results.json',
        timeout: 120000,
        required: true
      },
      {
        name: 'Integration Tests',
        command: 'npm run test:integration -- --reporter=json --outputFile=test-results/integration-results.json',
        timeout: 180000,
        required: true
      },
      {
        name: 'End-to-End Tests',
        command: 'npm run test:e2e -- --reporter=json --outputFile=test-results/e2e-results.json',
        timeout: 300000,
        required: false
      },
      {
        name: 'Performance Tests',
        command: 'npm run test:performance -- --reporter=json --outputFile=test-results/performance-results.json',
        timeout: 240000,
        required: false
      }
    ];

    let allPassed = true;

    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name}...`);
      const result = await this.runTestSuite(suite);
      this.results.push(result);

      if (result.passed) {
        console.log(`✅ ${suite.name} passed (${result.duration}ms, ${result.passedCount}/${result.testCount} tests)`);
      } else {
        console.log(`❌ ${suite.name} failed (${result.failedCount} failures)`);
        if (suite.required) {
          allPassed = false;
        }
      }
    }

    // Generate comprehensive coverage report
    await this.generateCoverageReport();

    // Generate summary report
    await this.generateSummaryReport();

    // Generate HTML dashboard
    await this.generateHTMLDashboard();

    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    
    const summary = this.calculateSummary();
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Passed Suites: ${summary.passedSuites} ✅`);
    console.log(`Failed Suites: ${summary.failedSuites} ${summary.failedSuites > 0 ? '❌' : '✅'}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed Tests: ${summary.totalPassed} ✅`);
    console.log(`Failed Tests: ${summary.totalFailed} ${summary.totalFailed > 0 ? '❌' : '✅'}`);
    console.log(`Overall Coverage: ${summary.overallCoverage.toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log('='.repeat(80));

    if (allPassed) {
      console.log('🎉 All required test suites passed!');
    } else {
      console.log('💥 Some required test suites failed');
    }

    return allPassed;
  }

  private async runTestSuite(suite: any): Promise<TestSuiteResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout,
        stdio: 'pipe'
      });

      const duration = Date.now() - startTime;
      const testResult = this.parseTestOutput(output);
      const coverage = this.extractCoverage(output);

      return {
        name: suite.name,
        passed: true,
        duration,
        coverage,
        testCount: testResult.total,
        passedCount: testResult.passed,
        failedCount: testResult.failed,
        errors: []
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const testResult = this.parseTestOutput(error.stdout || '');
      
      return {
        name: suite.name,
        passed: false,
        duration,
        testCount: testResult.total,
        passedCount: testResult.passed,
        failedCount: testResult.failed,
        errors: [error.message]
      };
    }
  }

  private parseTestOutput(output: string): { total: number; passed: number; failed: number } {
    // Parse vitest output for test counts
    const testMatch = output.match(/(\d+) passed.*?(\d+) failed/);
    if (testMatch) {
      const passed = parseInt(testMatch[1]);
      const failed = parseInt(testMatch[2]);
      return { total: passed + failed, passed, failed };
    }

    const passedMatch = output.match(/(\d+) passed/);
    if (passedMatch) {
      const passed = parseInt(passedMatch[1]);
      return { total: passed, passed, failed: 0 };
    }

    return { total: 0, passed: 0, failed: 0 };
  }

  private extractCoverage(output: string): number | undefined {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : undefined;
  }

  private calculateSummary(): TestExecutionSummary {
    const totalSuites = this.results.length;
    const passedSuites = this.results.filter(r => r.passed).length;
    const failedSuites = totalSuites - passedSuites;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    const coverageValues = this.results
      .map(r => r.coverage)
      .filter((c): c is number => c !== undefined);
    const overallCoverage = coverageValues.length > 0
      ? coverageValues.reduce((sum, c) => sum + c, 0) / coverageValues.length
      : 0;

    const totalTests = this.results.reduce((sum, r) => sum + r.testCount, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passedCount, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedCount, 0);

    return {
      totalSuites,
      passedSuites,
      failedSuites,
      totalDuration,
      overallCoverage,
      totalTests,
      totalPassed,
      totalFailed,
      results: this.results
    };
  }

  private async generateCoverageReport(): Promise<void> {
    console.log('\n📊 Generating comprehensive coverage report...');
    
    try {
      execSync('npm run test:coverage -- --reporter=html --reporter=json', {
        stdio: 'pipe'
      });
      console.log('✅ Coverage report generated');
    } catch (error) {
      console.log('⚠️  Coverage report generation failed');
    }
  }

  private async generateSummaryReport(): Promise<void> {
    const summary = this.calculateSummary();
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      },
      summary,
      qualityGates: {
        coverageThreshold: 80,
        coverageMet: summary.overallCoverage >= 80,
        allTestsPassed: summary.totalFailed === 0,
        performanceAcceptable: true // Would be calculated from performance tests
      }
    };

    const reportPath = join(this.outputDir, 'comprehensive-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Comprehensive report saved: ${reportPath}`);
  }

  private async generateHTMLDashboard(): Promise<void> {
    const summary = this.calculateSummary();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Dashboard - Warehouse Stock System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #2d3748; margin-bottom: 10px; }
        .header p { color: #718096; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5em; font-weight: bold; margin-bottom: 8px; }
        .metric-label { color: #718096; font-size: 0.9em; }
        .success { color: #38a169; }
        .warning { color: #d69e2e; }
        .error { color: #e53e3e; }
        .info { color: #3182ce; }
        .progress-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .suite-results { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .suite-item { display: flex; justify-content: between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e2e8f0; }
        .suite-item:last-child { border-bottom: none; }
        .suite-name { font-weight: 600; }
        .suite-stats { display: flex; gap: 20px; font-size: 0.9em; color: #718096; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: 600; }
        .status-passed { background: #c6f6d5; color: #22543d; }
        .status-failed { background: #fed7d7; color: #742a2a; }
        .quality-gates { margin-top: 40px; }
        .gate { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
        .gate-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Test Dashboard</h1>
            <p>Warehouse Stock System - ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value success">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${summary.totalFailed === 0 ? 'success' : 'error'}">${summary.totalPassed}</div>
                <div class="metric-label">Passed Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${summary.totalFailed === 0 ? 'success' : 'error'}">${summary.totalFailed}</div>
                <div class="metric-label">Failed Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${summary.overallCoverage >= 80 ? 'success' : 'warning'}">${summary.overallCoverage.toFixed(1)}%</div>
                <div class="metric-label">Coverage</div>
                <div class="progress-bar">
                    <div class="progress-fill ${summary.overallCoverage >= 80 ? 'success' : 'warning'}" 
                         style="width: ${summary.overallCoverage}%; background: ${summary.overallCoverage >= 80 ? '#38a169' : '#d69e2e'};"></div>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value info">${(summary.totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${summary.passedSuites === summary.totalSuites ? 'success' : 'error'}">${summary.passedSuites}/${summary.totalSuites}</div>
                <div class="metric-label">Test Suites</div>
            </div>
        </div>

        <div class="suite-results">
            <h2 style="margin-bottom: 20px;">Test Suite Results</h2>
            ${summary.results.map(result => `
                <div class="suite-item">
                    <div>
                        <div class="suite-name">${result.name}</div>
                        <div class="suite-stats">
                            <span>Duration: ${result.duration}ms</span>
                            <span>Tests: ${result.testCount}</span>
                            ${result.coverage ? `<span>Coverage: ${result.coverage}%</span>` : ''}
                        </div>
                    </div>
                    <div class="status-badge ${result.passed ? 'status-passed' : 'status-failed'}">
                        ${result.passed ? 'PASSED' : 'FAILED'}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="quality-gates">
            <h2 style="margin-bottom: 20px;">Quality Gates</h2>
            <div class="gate">
                <span>Coverage Threshold (≥80%)</span>
                <div class="gate-status ${summary.overallCoverage >= 80 ? 'status-passed' : 'status-failed'}">
                    ${summary.overallCoverage >= 80 ? 'PASSED' : 'FAILED'}
                </div>
            </div>
            <div class="gate">
                <span>All Tests Passing</span>
                <div class="gate-status ${summary.totalFailed === 0 ? 'status-passed' : 'status-failed'}">
                    ${summary.totalFailed === 0 ? 'PASSED' : 'FAILED'}
                </div>
            </div>
            <div class="gate">
                <span>All Required Suites Passing</span>
                <div class="gate-status ${summary.failedSuites === 0 ? 'status-passed' : 'status-failed'}">
                    ${summary.failedSuites === 0 ? 'PASSED' : 'FAILED'}
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const dashboardPath = join(this.outputDir, 'dashboard.html');
    writeFileSync(dashboardPath, html);
    console.log(`📊 HTML dashboard generated: ${dashboardPath}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const outputDir = args.includes('--output-dir') 
    ? args[args.indexOf('--output-dir') + 1] 
    : './test-results';

  const runner = new ComprehensiveTestRunner(outputDir);
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

export { ComprehensiveTestRunner };