#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner
 * Runs all test suites and generates detailed reports
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
  output?: string;
}

class ComprehensiveTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'npm run test:unit',
      description: 'Run all unit tests for services and utilities',
      required: true
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:integration',
      description: 'Run integration tests for database and external services',
      required: true
    },
    {
      name: 'Coverage Report',
      command: 'npm run test:coverage',
      description: 'Generate code coverage report',
      required: true
    },
    {
      name: 'E2E Tests',
      command: 'npm run test:e2e',
      description: 'Run end-to-end tests',
      required: false
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      description: 'Run performance and load tests',
      required: false
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================\n');

    // Ensure test results directory exists
    this.ensureDirectoryExists('test-results');
    this.ensureDirectoryExists('coverage');

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.generateReport();
    this.printSummary();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);

    const startTime = Date.now();
    let result: TestResult;

    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });

      const duration = Date.now() - startTime;
      const coverage = this.extractCoverage(output);

      result = {
        suite: suite.name,
        success: true,
        duration,
        coverage,
        output
      };

      console.log(`   ✅ ${suite.name} completed in ${duration}ms`);
      if (coverage) {
        console.log(`   📊 Coverage: ${coverage}%`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      result = {
        suite: suite.name,
        success: false,
        duration,
        errors: [error.message],
        output: error.stdout || error.stderr
      };

      if (suite.required) {
        console.log(`   ❌ ${suite.name} failed (REQUIRED)`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`   ⚠️  ${suite.name} failed (OPTIONAL)`);
      }
    }

    this.results.push(result);
    console.log('');
  }

  private extractCoverage(output: string): number | undefined {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : undefined;
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const totalTests = this.results.length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successful: successfulTests,
        failed: failedTests,
        totalDuration,
        overallSuccess: failedTests === 0
      },
      results: this.results,
      coverage: this.calculateOverallCoverage(),
      recommendations: this.generateRecommendations()
    };

    // Write JSON report
    writeFileSync(
      join('test-results', 'comprehensive-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Write HTML report
    this.generateHTMLReport(report);

    console.log('📄 Test reports generated:');
    console.log('   - test-results/comprehensive-test-report.json');
    console.log('   - test-results/comprehensive-test-report.html');
  }

  private calculateOverallCoverage(): number | undefined {
    const coverageResults = this.results
      .filter(r => r.coverage !== undefined)
      .map(r => r.coverage!);

    if (coverageResults.length === 0) return undefined;

    return coverageResults.reduce((sum, coverage) => sum + coverage, 0) / coverageResults.length;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedRequired = this.results.filter(r => !r.success && this.isRequired(r.suite));
    const lowCoverage = this.results.filter(r => r.coverage && r.coverage < 80);

    if (failedRequired.length > 0) {
      recommendations.push('Fix failing required test suites before deployment');
    }

    if (lowCoverage.length > 0) {
      recommendations.push('Improve test coverage for better code quality');
    }

    const overallCoverage = this.calculateOverallCoverage();
    if (overallCoverage && overallCoverage < 85) {
      recommendations.push(`Overall coverage is ${overallCoverage.toFixed(1)}%. Target: 85%+`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passing! Great job! 🎉');
    }

    return recommendations;
  }

  private isRequired(suiteName: string): boolean {
    const suite = this.testSuites.find(s => s.name === suiteName);
    return suite?.required ?? false;
  }

  private generateHTMLReport(report: any): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-results { margin-bottom: 30px; }
        .test-result { margin-bottom: 15px; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .test-success { background: #d4edda; border-color: #28a745; }
        .test-failure { background: #f8d7da; border-color: #dc3545; }
        .recommendations { background: #e7f3ff; padding: 20px; border-radius: 6px; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprehensive Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${report.summary.overallSuccess ? 'success' : 'failure'}">
                    ${report.summary.overallSuccess ? '✅' : '❌'}
                </div>
                <div>Overall Status</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.successful}</div>
                <div>Successful Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value ${report.summary.failed > 0 ? 'failure' : 'success'}">
                    ${report.summary.failed}
                </div>
                <div>Failed Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(report.summary.totalDuration / 1000).toFixed(1)}s</div>
                <div>Total Duration</div>
            </div>
            ${report.coverage ? `
            <div class="metric">
                <div class="metric-value ${report.coverage >= 85 ? 'success' : report.coverage >= 70 ? 'warning' : 'failure'}">
                    ${report.coverage.toFixed(1)}%
                </div>
                <div>Overall Coverage</div>
            </div>
            ` : ''}
        </div>

        <div class="test-results">
            <h2>Test Results</h2>
            ${report.results.map((result: any) => `
                <div class="test-result ${result.success ? 'test-success' : 'test-failure'}">
                    <h3>${result.success ? '✅' : '❌'} ${result.suite}</h3>
                    <p><strong>Duration:</strong> ${result.duration}ms</p>
                    ${result.coverage ? `<p><strong>Coverage:</strong> ${result.coverage}%</p>` : ''}
                    ${result.errors ? `
                        <p><strong>Errors:</strong></p>
                        <ul>
                            ${result.errors.map((error: string) => `<li>${error}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
                ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    writeFileSync(join('test-results', 'comprehensive-test-report.html'), html);
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const overallCoverage = this.calculateOverallCoverage();

    console.log('\n🏁 Test Suite Summary');
    console.log('====================');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    
    if (overallCoverage) {
      console.log(`Coverage: ${overallCoverage.toFixed(1)}%`);
    }

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix before deployment.');
    }

    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveTestRunner };