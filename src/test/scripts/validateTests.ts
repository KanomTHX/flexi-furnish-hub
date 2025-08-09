#!/usr/bin/env tsx
// Test validation script to ensure comprehensive coverage
import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

interface ValidationResult {
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

class TestValidator {
  private results: ValidationResult[] = [];

  async validateTestSuite(): Promise<boolean> {
    console.log('🔍 Validating comprehensive test suite...\n');

    // Validate test file structure
    this.validateTestStructure();
    
    // Validate test coverage
    await this.validateTestCoverage();
    
    // Validate test naming conventions
    this.validateTestNaming();
    
    // Validate test dependencies
    this.validateTestDependencies();
    
    // Validate test configuration
    this.validateTestConfiguration();
    
    // Validate test utilities
    this.validateTestUtilities();
    
    // Generate validation report
    this.generateValidationReport();
    
    const passed = this.results.every(r => r.passed);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUITE VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.category}: ${result.message}`);
    });
    
    console.log('='.repeat(60));
    
    if (passed) {
      console.log('🎉 All validation checks passed!');
    } else {
      console.log('💥 Some validation checks failed');
    }
    
    return passed;
  }

  private validateTestStructure(): void {
    const requiredDirectories = [
      'src/test/unit',
      'src/test/integration',
      'src/test/e2e',
      'src/test/performance',
      'src/test/utils',
      'src/test/factories',
      'src/test/scripts'
    ];

    const requiredFiles = [
      'src/test/setup.ts',
      'src/test/README.md',
      'src/test/utils/testHelpers.ts',
      'src/test/factories/index.ts',
      'vitest.config.ts'
    ];

    let allDirectoriesExist = true;
    let allFilesExist = true;

    for (const dir of requiredDirectories) {
      try {
        const stat = statSync(dir);
        if (!stat.isDirectory()) {
          allDirectoriesExist = false;
        }
      } catch {
        allDirectoriesExist = false;
      }
    }

    for (const file of requiredFiles) {
      try {
        const stat = statSync(file);
        if (!stat.isFile()) {
          allFilesExist = false;
        }
      } catch {
        allFilesExist = false;
      }
    }

    this.results.push({
      category: 'Test Structure',
      passed: allDirectoriesExist && allFilesExist,
      message: allDirectoriesExist && allFilesExist 
        ? 'All required directories and files exist'
        : 'Missing required directories or files',
      details: {
        directories: requiredDirectories,
        files: requiredFiles
      }
    });
  }

  private async validateTestCoverage(): Promise<void> {
    try {
      // Run coverage analysis
      const output = execSync('npm run test:coverage', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse coverage output
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      const passed = coverage >= 80;
      
      this.results.push({
        category: 'Test Coverage',
        passed,
        message: `Overall coverage: ${coverage.toFixed(1)}% (threshold: 80%)`,
        details: { coverage, threshold: 80 }
      });
    } catch (error) {
      this.results.push({
        category: 'Test Coverage',
        passed: false,
        message: 'Failed to run coverage analysis',
        details: { error: error.message }
      });
    }
  }

  private validateTestNaming(): void {
    const testFiles = this.findTestFiles('src');
    let validNaming = true;
    const invalidFiles: string[] = [];

    for (const file of testFiles) {
      const fileName = file.split('/').pop() || '';
      
      // Check naming convention: *.test.{ts,tsx} or *.spec.{ts,tsx}
      if (!fileName.match(/\.(test|spec)\.(ts|tsx)$/)) {
        validNaming = false;
        invalidFiles.push(file);
      }
    }

    this.results.push({
      category: 'Test Naming',
      passed: validNaming,
      message: validNaming 
        ? `All ${testFiles.length} test files follow naming conventions`
        : `${invalidFiles.length} files don't follow naming conventions`,
      details: { totalFiles: testFiles.length, invalidFiles }
    });
  }

  private validateTestDependencies(): void {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const devDeps = packageJson.devDependencies || {};

      const requiredDeps = [
        'vitest',
        '@testing-library/react',
        '@testing-library/user-event',
        '@testing-library/jest-dom',
        'jsdom',
        '@vitest/ui'
      ];

      const missingDeps = requiredDeps.filter(dep => !devDeps[dep]);
      const passed = missingDeps.length === 0;

      this.results.push({
        category: 'Test Dependencies',
        passed,
        message: passed 
          ? 'All required test dependencies are installed'
          : `Missing dependencies: ${missingDeps.join(', ')}`,
        details: { required: requiredDeps, missing: missingDeps }
      });
    } catch (error) {
      this.results.push({
        category: 'Test Dependencies',
        passed: false,
        message: 'Failed to validate dependencies',
        details: { error: error.message }
      });
    }
  }

  private validateTestConfiguration(): void {
    try {
      const vitestConfig = readFileSync('vitest.config.ts', 'utf8');
      
      const hasSetupFiles = vitestConfig.includes('setupFiles');
      const hasEnvironment = vitestConfig.includes("environment: 'jsdom'");
      const hasCoverage = vitestConfig.includes('coverage:');
      const hasThresholds = vitestConfig.includes('thresholds:');

      const passed = hasSetupFiles && hasEnvironment && hasCoverage && hasThresholds;

      this.results.push({
        category: 'Test Configuration',
        passed,
        message: passed 
          ? 'Vitest configuration is properly set up'
          : 'Vitest configuration is missing required settings',
        details: {
          hasSetupFiles,
          hasEnvironment,
          hasCoverage,
          hasThresholds
        }
      });
    } catch (error) {
      this.results.push({
        category: 'Test Configuration',
        passed: false,
        message: 'Failed to validate test configuration',
        details: { error: error.message }
      });
    }
  }

  private validateTestUtilities(): void {
    const requiredUtilities = [
      'src/test/utils/testHelpers.ts',
      'src/test/utils/testSeeder.ts',
      'src/test/utils/testMetrics.ts',
      'src/test/factories/index.ts'
    ];

    let allUtilitiesExist = true;
    const missingUtilities: string[] = [];

    for (const utility of requiredUtilities) {
      try {
        statSync(utility);
      } catch {
        allUtilitiesExist = false;
        missingUtilities.push(utility);
      }
    }

    this.results.push({
      category: 'Test Utilities',
      passed: allUtilitiesExist,
      message: allUtilitiesExist 
        ? 'All test utilities are available'
        : `Missing utilities: ${missingUtilities.join(', ')}`,
      details: { required: requiredUtilities, missing: missingUtilities }
    });
  }

  private findTestFiles(dir: string): string[] {
    const testFiles: string[] = [];
    
    const traverse = (currentDir: string) => {
      const items = readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = join(currentDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile() && this.isTestFile(item)) {
          testFiles.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return testFiles;
  }

  private isTestFile(fileName: string): boolean {
    const ext = extname(fileName);
    return (ext === '.ts' || ext === '.tsx') && 
           (fileName.includes('.test.') || fileName.includes('.spec.'));
  }

  private generateValidationReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.results.length,
        passedChecks: this.results.filter(r => r.passed).length,
        failedChecks: this.results.filter(r => !r.passed).length,
        overallPassed: this.results.every(r => r.passed)
      },
      results: this.results
    };

    const fs = require('fs');
    if (!fs.existsSync('./test-results')) {
      fs.mkdirSync('./test-results', { recursive: true });
    }

    fs.writeFileSync('./test-results/validation-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Validation report saved: ./test-results/validation-report.json');
  }
}

// CLI interface
async function main() {
  const validator = new TestValidator();
  const success = await validator.validateTestSuite();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test validation crashed:', error);
    process.exit(1);
  });
}

export { TestValidator };