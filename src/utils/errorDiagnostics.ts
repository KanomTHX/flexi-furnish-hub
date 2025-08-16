// Error Diagnostics and Common Issue Detection
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  fix?: string;
}

export class ErrorDiagnostics {
  static async runAllDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Environment checks
    results.push(...await this.checkEnvironment());
    
    // Database checks
    results.push(...await this.checkDatabase());
    
    // Authentication checks
    results.push(...await this.checkAuthentication());
    
    // Network checks
    results.push(...await this.checkNetwork());
    
    // Browser compatibility checks
    results.push(...this.checkBrowserCompatibility());
    
    // Performance checks
    results.push(...this.checkPerformance());

    return results;
  }

  private static async checkEnvironment(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check environment variables
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      const value = import.meta.env[envVar];
      results.push({
        category: 'Environment',
        test: `${envVar} exists`,
        status: value ? 'pass' : 'fail',
        message: value ? 'Environment variable is set' : 'Environment variable is missing',
        fix: value ? undefined : `Add ${envVar} to your .env file`
      });
    }

    // Check if in development mode
    results.push({
      category: 'Environment',
      test: 'Development mode',
      status: import.meta.env.DEV ? 'pass' : 'warning',
      message: import.meta.env.DEV ? 'Running in development mode' : 'Running in production mode',
      details: {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        prod: import.meta.env.PROD
      }
    });

    return results;
  }

  private static async checkDatabase(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // Test basic connection
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('branches')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;

      results.push({
        category: 'Database',
        test: 'Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : `Connected successfully (${responseTime}ms)`,
        details: { responseTime, error },
        fix: error ? 'Check your Supabase URL and API key' : undefined
      });

      if (!error) {
        // Test core tables
        const coreTables = ['branches', 'employees', 'customers', 'products', 'warehouses'];
        
        for (const table of coreTables) {
          try {
            const { data: tableData, error: tableError } = await supabase
              .from(table)
              .select('count')
              .limit(1);

            results.push({
              category: 'Database',
              test: `Table: ${table}`,
              status: tableError ? 'fail' : 'pass',
              message: tableError ? `Table access failed: ${tableError.message}` : 'Table accessible',
              fix: tableError ? 'Check table permissions and RLS policies' : undefined
            });
          } catch (tableError) {
            results.push({
              category: 'Database',
              test: `Table: ${table}`,
              status: 'fail',
              message: `Table check failed: ${tableError}`,
              fix: 'Check if table exists and has proper permissions'
            });
          }
        }
      }
    } catch (connectionError) {
      results.push({
        category: 'Database',
        test: 'Connection',
        status: 'fail',
        message: `Connection error: ${connectionError}`,
        fix: 'Check network connection and Supabase configuration'
      });
    }

    return results;
  }

  private static async checkAuthentication(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      // Check session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      results.push({
        category: 'Authentication',
        test: 'Session check',
        status: error ? 'fail' : (session ? 'pass' : 'warning'),
        message: error ? `Session error: ${error.message}` : 
                session ? 'User authenticated' : 'No active session (anonymous access)',
        details: { session: session ? { user: session.user.email } : null }
      });

      // Check auth configuration
      const authConfig = supabase.auth;
      results.push({
        category: 'Authentication',
        test: 'Auth configuration',
        status: 'pass',
        message: 'Auth client configured',
        details: {
          storage: typeof authConfig.storage,
          autoRefresh: 'enabled'
        }
      });

    } catch (authError) {
      results.push({
        category: 'Authentication',
        test: 'Auth system',
        status: 'fail',
        message: `Auth error: ${authError}`,
        fix: 'Check authentication configuration'
      });
    }

    return results;
  }

  private static async checkNetwork(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Check online status
    results.push({
      category: 'Network',
      test: 'Online status',
      status: navigator.onLine ? 'pass' : 'fail',
      message: navigator.onLine ? 'Browser is online' : 'Browser is offline',
      fix: navigator.onLine ? undefined : 'Check your internet connection'
    });

    // Check Supabase URL accessibility
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const startTime = Date.now();
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        const responseTime = Date.now() - startTime;

        results.push({
          category: 'Network',
          test: 'Supabase API accessibility',
          status: response.ok ? 'pass' : 'fail',
          message: response.ok ? 
            `Supabase API accessible (${responseTime}ms)` : 
            `Supabase API not accessible (${response.status})`,
          details: { 
            status: response.status, 
            statusText: response.statusText,
            responseTime 
          },
          fix: response.ok ? undefined : 'Check Supabase URL and network connectivity'
        });
      }
    } catch (networkError) {
      results.push({
        category: 'Network',
        test: 'Supabase API accessibility',
        status: 'fail',
        message: `Network error: ${networkError}`,
        fix: 'Check network connection and firewall settings'
      });
    }

    return results;
  }

  private static checkBrowserCompatibility(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Check required APIs
    const requiredAPIs = [
      { name: 'fetch', available: typeof fetch !== 'undefined' },
      { name: 'localStorage', available: typeof localStorage !== 'undefined' },
      { name: 'sessionStorage', available: typeof sessionStorage !== 'undefined' },
      { name: 'WebSocket', available: typeof WebSocket !== 'undefined' },
      { name: 'Promise', available: typeof Promise !== 'undefined' },
      { name: 'async/await', available: true }, // If we're running, it's supported
    ];

    for (const api of requiredAPIs) {
      results.push({
        category: 'Browser Compatibility',
        test: `${api.name} API`,
        status: api.available ? 'pass' : 'fail',
        message: api.available ? `${api.name} is supported` : `${api.name} is not supported`,
        fix: api.available ? undefined : `Update your browser to support ${api.name}`
      });
    }

    // Check user agent
    results.push({
      category: 'Browser Compatibility',
      test: 'User Agent',
      status: 'pass',
      message: 'Browser information collected',
      details: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled
      }
    });

    return results;
  }

  private static checkPerformance(): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Check memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      
      results.push({
        category: 'Performance',
        test: 'Memory usage',
        status: memoryUsage > 0.8 ? 'warning' : 'pass',
        message: `Memory usage: ${Math.round(memoryUsage * 100)}%`,
        details: {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        },
        fix: memoryUsage > 0.8 ? 'Consider refreshing the page to free up memory' : undefined
      });
    }

    // Check connection type (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      results.push({
        category: 'Performance',
        test: 'Connection type',
        status: 'pass',
        message: `Connection: ${connection.effectiveType || 'unknown'}`,
        details: {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }
      });
    }

    // Check if service worker is available
    results.push({
      category: 'Performance',
      test: 'Service Worker support',
      status: 'serviceWorker' in navigator ? 'pass' : 'warning',
      message: 'serviceWorker' in navigator ? 
        'Service Worker supported' : 
        'Service Worker not supported',
      fix: 'serviceWorker' in navigator ? undefined : 'Update browser for offline support'
    });

    return results;
  }

  // Common error patterns and solutions
  static getCommonErrorSolutions(errorMessage: string): string[] {
    const solutions: string[] = [];
    const message = errorMessage.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      solutions.push('Check your internet connection');
      solutions.push('Verify Supabase URL is correct');
      solutions.push('Check if Supabase service is running');
    }

    if (message.includes('cors')) {
      solutions.push('Check CORS settings in Supabase');
      solutions.push('Verify domain is allowed in Supabase settings');
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      solutions.push('Check API key is correct');
      solutions.push('Verify user authentication');
      solutions.push('Check RLS policies');
    }

    if (message.includes('forbidden') || message.includes('403')) {
      solutions.push('Check user permissions');
      solutions.push('Verify RLS policies allow access');
      solutions.push('Check if user has required role');
    }

    if (message.includes('not found') || message.includes('404')) {
      solutions.push('Check if table/endpoint exists');
      solutions.push('Verify URL is correct');
      solutions.push('Check if resource was deleted');
    }

    if (message.includes('timeout')) {
      solutions.push('Check network connection speed');
      solutions.push('Increase timeout settings');
      solutions.push('Check server performance');
    }

    if (message.includes('jwt') || message.includes('token')) {
      solutions.push('Refresh authentication token');
      solutions.push('Check token expiration');
      solutions.push('Re-authenticate user');
    }

    if (message.includes('rls') || message.includes('row level security')) {
      solutions.push('Check RLS policies');
      solutions.push('Verify user has access to data');
      solutions.push('Check if RLS is properly configured');
    }

    return solutions;
  }
}