// Database Connection Utilities
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  latency?: number;
  timestamp: Date;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'down';
  checks: {
    connection: boolean;
    authentication: boolean;
    tables: boolean;
    realtime: boolean;
  };
  details: {
    tablesCount: number;
    lastSync: Date;
    version: string;
  };
}

// Test database connection
export const testConnection = async (): Promise<ConnectionStatus> => {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('employee_profiles')
      .select('count')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        connected: false,
        error: error.message,
        latency,
        timestamp: new Date()
      };
    }
    
    return {
      connected: true,
      latency,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - startTime,
      timestamp: new Date()
    };
  }
};

// Comprehensive health check
export const checkDatabaseHealth = async (): Promise<DatabaseHealth> => {
  const health: DatabaseHealth = {
    status: 'down',
    checks: {
      connection: false,
      authentication: false,
      tables: false,
      realtime: false
    },
    details: {
      tablesCount: 0,
      lastSync: new Date(),
      version: 'unknown'
    }
  };

  try {
    // Test basic connection
    const connectionTest = await testConnection();
    health.checks.connection = connectionTest.connected;

    if (!connectionTest.connected) {
      return health;
    }

    // Test authentication
    try {
      const { data: authData } = await supabase.auth.getSession();
      health.checks.authentication = true;
    } catch {
      health.checks.authentication = false;
    }

    // Test table access
    try {
      const tables = [
        'branches',
        'employees', 
        'customers',
        'products',
        'sales_transactions',
        'warehouses',
        'chart_of_accounts',
        'claims',
        'installment_contracts'
      ];

      let accessibleTables = 0;
      for (const table of tables) {
        try {
          await supabase.from(table).select('count').limit(1);
          accessibleTables++;
        } catch {
          // Table not accessible
        }
      }

      health.checks.tables = accessibleTables > 0;
      health.details.tablesCount = accessibleTables;
    } catch {
      health.checks.tables = false;
    }

    // Test realtime
    try {
      const channel = supabase.channel('health-check');
      health.checks.realtime = true;
      channel.unsubscribe();
    } catch {
      health.checks.realtime = false;
    }

    // Determine overall status
    const checksCount = Object.values(health.checks).filter(Boolean).length;
    if (checksCount === 4) {
      health.status = 'healthy';
    } else if (checksCount >= 2) {
      health.status = 'degraded';
    } else {
      health.status = 'down';
    }

    health.details.lastSync = new Date();
    health.details.version = 'Supabase PostgreSQL 15';

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return health;
};

// Initialize database with sample data
export const initializeDatabase = async () => {
  try {
    // Check if we already have data
    const { data: branches } = await supabase
      .from('branches')
      .select('count')
      .limit(1);

    if (branches && branches.length > 0) {
      console.log('Database already initialized');
      return { success: true, message: 'Database already has data' };
    }

    // Insert sample branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .insert([
        {
          name: 'สาขาหลัก',
          code: 'MAIN001',
          address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
          phone: '02-123-4567',
          manager_name: 'คุณสมชาย ใจดี',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (branchError) {
      throw branchError;
    }

    // Insert sample employee profile
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase
        .from('employee_profiles')
        .insert([
          {
            user_id: userData.user.id,
            employee_code: 'EMP001',
            full_name: 'ผู้ดูแลระบบ',
            role: 'admin',
            branch_id: branchData.id,
            is_active: true
          }
        ]);
    }

    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    const stats = {
      branches: 0,
      employees: 0,
      customers: 0,
      products: 0,
      sales: 0,
      warehouses: 0,
      claims: 0,
      contracts: 0
    };

    // Get counts for each table
    const tables = [
      { key: 'branches', table: 'branches' },
      { key: 'employees', table: 'employees' },
      { key: 'customers', table: 'customers' },
      { key: 'products', table: 'products' },
      { key: 'sales', table: 'sales_transactions' },
      { key: 'warehouses', table: 'warehouses' },
      { key: 'claims', table: 'claims' },
      { key: 'contracts', table: 'installment_contracts' }
    ];

    for (const { key, table } of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        stats[key as keyof typeof stats] = count || 0;
      } catch {
        // Table might not exist or no access
        stats[key as keyof typeof stats] = 0;
      }
    }

    return stats;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
};

// Real-time connection monitor
export class ConnectionMonitor {
  private callbacks: ((status: ConnectionStatus) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private lastStatus: ConnectionStatus | null = null;

  start(intervalMs: number = 30000) {
    this.stop(); // Stop existing monitor
    
    this.intervalId = setInterval(async () => {
      const status = await testConnection();
      
      // Only notify if status changed
      if (!this.lastStatus || 
          this.lastStatus.connected !== status.connected ||
          this.lastStatus.error !== status.error) {
        this.lastStatus = status;
        this.callbacks.forEach(callback => callback(status));
      }
    }, intervalMs);

    // Initial check
    this.checkNow();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkNow() {
    const status = await testConnection();
    this.lastStatus = status;
    this.callbacks.forEach(callback => callback(status));
    return status;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  getLastStatus() {
    return this.lastStatus;
  }
}

// Export singleton instance
export const connectionMonitor = new ConnectionMonitor();