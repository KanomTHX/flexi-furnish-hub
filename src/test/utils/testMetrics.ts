#!/usr/bin/env tsx

/**
 * Test Metrics Analyzer
 * Analyzes test results and provides insights
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface TestMetrics {
  totalTestFiles: number;
  totalTests: number;
  testsByType: Record<string, number>;
  coverageByModule: Record<string, number>;
  testExecutionTimes: Record<string, number>;
  codeComplexity: Record<string, number>;
  recommendations: string[];
}

class TestMetricsAnalyzer {
  private testDirectory = 'src/tests';
  private sourceDirectory = 'src';

  async analyzeMetrics(): Promise<TestMetrics> {
    console.log('📊 Analyzing Test Metrics...\n');

    const metrics: TestMetrics = {
      totalTestFiles: 0,
      totalTests: 0,
      testsByType: {},
      coverageByModule: {},
      testExecutionTimes: {},
      codeComplexity: {},
      recommendations: []
    };

    await this.analyzeTestFiles(metrics);
    await this.analyzeCoverage(metrics);
    await this.analyzeComplexity(metrics);
    this.generateRecommendations(metrics);

    return metrics;
  }

  private async analyzeTestFiles(metrics: TestMetrics): Promise<void> {
    if (!existsSync(this.testDirectory)) {
      console.log('⚠️  Test directory not found');
      return;
    }

    const testFiles = readdirSync(this.testDirectory, { recursive: true })
      .filter(file => typeof file === 'string' && file.endsWith('.test.ts'))
      .map(file => join(this.testDirectory, file as string));

    metrics.totalTestFiles = testFiles.length;

    for (const testFile of testFiles) {
      await this.analyzeTestFile(testFile, metrics);
    }

    console.log(`📁 Found ${metrics.totalTestFiles} test files`);
    console.log(`🧪 Total tests: ${metrics.totalTests}`);
  }

  private async analyzeTestFile(filePath: string, metrics: TestMetrics): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf8');
      
      // Count test cases
      const testMatches = content.match(/\b(it|test)\s*\(/g) || [];
      const describeMatches = content.match(/\bdescribe\s*\(/g) || [];
      
      metrics.totalTests += testMatches.length;

      // Categorize by test type
      const fileName = filePath.split('/').pop() || '';
      let testType = 'unit';
      
      if (fileName.includes('integration')) testType = 'integration';
      else if (fileName.includes('e2e')) testType = 'e2e';
      else if (fileName.includes('performance')) testType = 'performance';

      metrics.testsByType[testType] = (metrics.testsByType[testType] || 0) + testMatches.length;

      // Analyze test quality
      const hasBeforeEach = content.includes('beforeEach');
      const hasAfterEach = content.includes('afterEach');
      const hasMocks = content.includes('vi.mock') || content.includes('jest.mock');
      const hasAssertions = content.includes('expect(');

      if (!hasBeforeEach && testMatches.length > 3) {
        metrics.recommendations.push(`${fileName}: Consider using beforeEach for test setup`);
      }

      if (!hasMocks && content.includes('Service')) {
        metrics.recommendations.push(`${fileName}: Consider mocking external dependencies`);
      }

    } catch (error) {
      console.log(`⚠️  Error analyzing ${filePath}: ${error}`);
    }
  }

  private async analyzeCoverage(metrics: TestMetrics): Promise<void> {
    const coverageFile = 'coverage/coverage-summary.json';
    
    if (!existsSync(coverageFile)) {
      console.log('⚠️  Coverage report not found. Run tests with coverage first.');
      return;
    }

    try {
      const coverageData = JSON.parse(readFileSync(coverageFile, 'utf8'));
      
      for (const [filePath, coverage] of Object.entries(coverageData)) {
        if (filePath === 'total') continue;
        
        const moduleName = this.getModuleName(filePath as string);
        const coverageInfo = coverage as any;
        
        metrics.coverageByModule[moduleName] = coverageInfo.lines?.pct || 0;
      }

      console.log('📊 Coverage analysis completed');
      
      // Identify low coverage modules
      for (const [module, coverage] of Object.entries(metrics.coverageByModule)) {
        if (coverage < 70) {
          metrics.recommendations.push(`${module}: Low test coverage (${coverage}%). Target: 80%+`);
        }
      }

    } catch (error) {
      console.log(`⚠️  Error reading coverage data: ${error}`);
    }
  }

  private async analyzeComplexity(metrics: TestMetrics): Promise<void> {
    const sourceFiles = await this.getSourceFiles();
    
    for (const file of sourceFiles) {
      const complexity = await this.calculateComplexity(file);
      const moduleName = this.getModuleName(file);
      metrics.codeComplexity[moduleName] = complexity;
      
      if (complexity > 10) {
        metrics.recommendations.push(`${moduleName}: High complexity (${complexity}). Consider refactoring.`);
      }
    }

    console.log('🔍 Complexity analysis completed');
  }

  private async getSourceFiles(): Promise<string[]> {
    try {
      const pattern = join(this.sourceDirectory, '**/*.{ts,tsx}');
      const files = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/coverage/**',
          '**/*.test.*',
          '**/*.spec.*'
        ]
      });
      return files;
    } catch (error) {
      console.log(`⚠️  Error finding source files: ${error}`);
      return [];
    }
  }

  private async calculateComplexity(filePath: string): Promise<number> {
    try {
      const content = readFileSync(filePath, 'utf8');
      
      // Simple complexity calculation based on control structures
      const complexityPatterns = [
        /\bif\s*\(/g,
        /\belse\s+if\s*\(/g,
        /\bwhile\s*\(/g,
        /\bfor\s*\(/g,
        /\bswitch\s*\(/g,
        /\bcatch\s*\(/g,
        /\?\s*.*\s*:/g, // ternary operators
        /&&|\|\|/g // logical operators
      ];

      let complexity = 1; // Base complexity
      
      for (const pattern of complexityPatterns) {
        const matches = content.match(pattern) || [];
        complexity += matches.length;
      }

      return complexity;
    } catch (error) {
      return 0;
    }
  }

  private getModuleName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
  }

  private generateRecommendations(metrics: TestMetrics): void {
    // Test coverage recommendations
    const totalCoverage = Object.values(metrics.coverageByModule);
    const avgCoverage = totalCoverage.length > 0 
      ? totalCoverage.reduce((sum, cov) => sum + cov, 0) / totalCoverage.length 
      : 0;

    if (avgCoverage < 80) {
      metrics.recommendations.push(`Overall coverage is ${avgCoverage.toFixed(1)}%. Aim for 80%+ coverage.`);
    }

    // Test distribution recommendations
    const unitTests = metrics.testsByType.unit || 0;
    const integrationTests = metrics.testsByType.integration || 0;
    const totalTests = metrics.totalTests;

    if (totalTests > 0) {
      const unitRatio = unitTests / totalTests;
      const integrationRatio = integrationTests / totalTests;

      if (unitRatio < 0.7) {
        metrics.recommendations.push('Consider adding more unit tests. Target: 70% unit tests.');
      }

      if (integrationRatio < 0.2) {
        metrics.recommendations.push('Consider adding more integration tests. Target: 20% integration tests.');
      }
    }

    // Test file organization
    if (metrics.totalTestFiles < 10) {
      metrics.recommendations.push('Consider organizing tests into more focused test files.');
    }

    if (metrics.recommendations.length === 0) {
      metrics.recommendations.push('Test suite looks great! Keep up the good work! 🎉');
    }
  }

  printMetrics(metrics: TestMetrics): void {
    console.log('\n📊 Test Metrics Report');
    console.log('======================');
    
    console.log('\n📁 Test Files:');
    console.log(`   Total: ${metrics.totalTestFiles}`);
    console.log(`   Total Tests: ${metrics.totalTests}`);
    
    console.log('\n🧪 Tests by Type:');
    for (const [type, count] of Object.entries(metrics.testsByType)) {
      const percentage = ((count / metrics.totalTests) * 100).toFixed(1);
      console.log(`   ${type}: ${count} (${percentage}%)`);
    }

    console.log('\n📊 Coverage by Module:');
    const sortedCoverage = Object.entries(metrics.coverageByModule)
      .sort(([,a], [,b]) => a - b);
    
    for (const [module, coverage] of sortedCoverage) {
      const status = coverage >= 80 ? '✅' : coverage >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${module}: ${coverage.toFixed(1)}%`);
    }

    console.log('\n🔍 Code Complexity:');
    const sortedComplexity = Object.entries(metrics.codeComplexity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 most complex
    
    for (const [module, complexity] of sortedComplexity) {
      const status = complexity <= 5 ? '✅' : complexity <= 10 ? '⚠️' : '❌';
      console.log(`   ${status} ${module}: ${complexity}`);
    }

    console.log('\n💡 Recommendations:');
    for (const recommendation of metrics.recommendations) {
      console.log(`   • ${recommendation}`);
    }
  }
}

// Run metrics analysis
if (require.main === module) {
  const analyzer = new TestMetricsAnalyzer();
  analyzer.analyzeMetrics()
    .then(metrics => {
      analyzer.printMetrics(metrics);
    })
    .catch(error => {
      console.error('Metrics analysis failed:', error);
      process.exit(1);
    });
}

export { TestMetricsAnalyzer };