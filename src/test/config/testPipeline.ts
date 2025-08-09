// Automated testing pipeline configuration
import { defineConfig } from 'vitest/config';

export const testPipelineConfig = defineConfig({
  test: {
    // Test execution configuration
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        '**/*.stories.*',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      include: [
        'src/**/*.{ts,tsx}',
        '!src/test/**',
        '!src/**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical modules
        'src/lib/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/utils/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    
    // Test execution settings
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/test/**/*.test.{ts,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      '**/*.d.ts'
    ],
    
    // Reporters
    reporter: [
      'default',
      'json',
      'html',
      'junit'
    ],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
      junit: './test-results/junit.xml'
    },
    
    // Watch mode configuration
    watch: false,
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key'
    }
  }
});

// Test suite configurations
export const testSuites = {
  unit: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/test/e2e/**', 'src/test/integration/**', 'src/test/performance/**'],
    coverage: {
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  },
  
  integration: {
    include: ['src/test/integration/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
    coverage: {
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  
  e2e: {
    include: ['src/test/e2e/**/*.test.{ts,tsx}'],
    testTimeout: 60000,
    coverage: {
      enabled: false // E2E tests don't need coverage
    }
  },
  
  performance: {
    include: ['src/test/performance/**/*.test.{ts,tsx}'],
    testTimeout: 120000,
    coverage: {
      enabled: false
    }
  }
};

// CI/CD Pipeline configuration
export const ciConfig = {
  // GitHub Actions workflow
  github: {
    workflow: {
      name: 'Test Pipeline',
      on: ['push', 'pull_request'],
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          strategy: {
            matrix: {
              'node-version': ['18.x', '20.x']
            }
          },
          steps: [
            {
              uses: 'actions/checkout@v3'
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v3',
              with: {
                'node-version': '${{ matrix.node-version }}',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Run linting',
              run: 'npm run lint'
            },
            {
              name: 'Run unit tests',
              run: 'npm run test:unit'
            },
            {
              name: 'Run integration tests',
              run: 'npm run test:integration'
            },
            {
              name: 'Run E2E tests',
              run: 'npm run test:e2e'
            },
            {
              name: 'Run performance tests',
              run: 'npm run test:performance'
            },
            {
              name: 'Generate coverage report',
              run: 'npm run test:coverage'
            },
            {
              name: 'Upload coverage to Codecov',
              uses: 'codecov/codecov-action@v3',
              with: {
                file: './coverage/lcov.info'
              }
            }
          ]
        }
      }
    }
  },
  
  // Pre-commit hooks
  preCommit: {
    hooks: [
      {
        name: 'lint-staged',
        command: 'npx lint-staged'
      },
      {
        name: 'test-changed',
        command: 'npm run test:changed'
      }
    ]
  },
  
  // Quality gates
  qualityGates: {
    coverage: {
      minimum: 80,
      fail: true
    },
    performance: {
      maxTestTime: 30000, // 30 seconds max for any single test
      maxSuiteTime: 300000 // 5 minutes max for entire suite
    },
    reliability: {
      maxFlakiness: 0.05, // 5% flaky test threshold
      minPassRate: 0.95 // 95% pass rate required
    }
  }
};

// Test data management
export const testDataConfig = {
  // Mock data generation
  factories: {
    warehouse: {
      count: 10,
      template: {
        name: 'Test Warehouse {{index}}',
        code: 'TW{{index:pad(3)}}',
        type: 'main',
        is_active: true
      }
    },
    product: {
      count: 50,
      template: {
        name: 'Test Product {{index}}',
        code: 'TP{{index:pad(3)}}',
        unit_cost: '{{random(500, 5000)}}',
        selling_price: '{{random(1000, 10000)}}'
      }
    },
    serialNumber: {
      count: 1000,
      template: {
        serial_number: 'TP{{random(1,50):pad(3)}}-2024-{{index:pad(4)}}',
        status: '{{random(["available", "sold", "reserved"])}}'
      }
    }
  },
  
  // Test database seeding
  seeding: {
    enabled: true,
    resetBetweenTests: true,
    seedFiles: [
      './src/test/fixtures/warehouses.json',
      './src/test/fixtures/products.json',
      './src/test/fixtures/suppliers.json'
    ]
  },
  
  // Snapshot testing
  snapshots: {
    enabled: true,
    updateOnFail: false,
    threshold: 0.2 // 20% difference threshold
  }
};

// Performance testing configuration
export const performanceConfig = {
  // Load testing
  load: {
    concurrent: 10,
    duration: 60000, // 1 minute
    rampUp: 10000 // 10 seconds
  },
  
  // Stress testing
  stress: {
    concurrent: 50,
    duration: 120000, // 2 minutes
    rampUp: 30000 // 30 seconds
  },
  
  // Memory testing
  memory: {
    maxHeapSize: '512MB',
    leakThreshold: 10, // 10MB
    gcThreshold: 5 // 5 collections
  },
  
  // Performance benchmarks
  benchmarks: {
    serialNumberGeneration: {
      operations: 1000,
      maxTime: 1000 // 1 second
    },
    stockCalculation: {
      dataSize: 10000,
      maxTime: 500 // 500ms
    },
    searchOperations: {
      dataSize: 5000,
      maxTime: 200 // 200ms
    }
  }
};

// Test reporting configuration
export const reportingConfig = {
  // HTML reports
  html: {
    enabled: true,
    outputDir: './test-results/html',
    template: 'detailed'
  },
  
  // JSON reports
  json: {
    enabled: true,
    outputFile: './test-results/results.json',
    includeConsoleOutput: true
  },
  
  // JUnit XML (for CI integration)
  junit: {
    enabled: true,
    outputFile: './test-results/junit.xml',
    suiteName: 'Warehouse Stock System Tests'
  },
  
  // Custom reporting
  custom: {
    enabled: true,
    reporters: [
      {
        name: 'slack',
        webhook: process.env.SLACK_WEBHOOK_URL,
        onFailure: true,
        onSuccess: false
      },
      {
        name: 'email',
        recipients: ['dev-team@company.com'],
        onFailure: true,
        onSuccess: false
      }
    ]
  },
  
  // Metrics collection
  metrics: {
    enabled: true,
    collect: [
      'testDuration',
      'memoryUsage',
      'cpuUsage',
      'coveragePercentage',
      'flakyTests',
      'slowTests'
    ],
    storage: {
      type: 'json',
      file: './test-results/metrics.json'
    }
  }
};

// Test environment configuration
export const environmentConfig = {
  // Development environment
  development: {
    database: 'test_dev',
    apiUrl: 'http://localhost:3000',
    logLevel: 'debug',
    mockExternalServices: true
  },
  
  // CI environment
  ci: {
    database: 'test_ci',
    apiUrl: 'http://test-api:3000',
    logLevel: 'error',
    mockExternalServices: true,
    parallelism: 4
  },
  
  // Staging environment
  staging: {
    database: 'test_staging',
    apiUrl: 'https://staging-api.company.com',
    logLevel: 'warn',
    mockExternalServices: false,
    realDataSubset: true
  }
};

// Export all configurations
export default {
  pipeline: testPipelineConfig,
  suites: testSuites,
  ci: ciConfig,
  testData: testDataConfig,
  performance: performanceConfig,
  reporting: reportingConfig,
  environment: environmentConfig
};