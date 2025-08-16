// Database Connection Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  testConnection, 
  checkDatabaseHealth, 
  initializeDatabase,
  getDatabaseStats,
  connectionMonitor,
  type ConnectionStatus,
  type DatabaseHealth 
} from '@/utils/databaseConnection';

export const useDatabaseConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  // Test connection
  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const status = await testConnection();
      setConnectionStatus(status);
      return status;
    } catch (error) {
      console.error('Connection test failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check database health
  const checkHealth = useCallback(async () => {
    try {
      const healthStatus = await checkDatabaseHealth();
      setHealth(healthStatus);
      return healthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }, []);

  // Get database statistics
  const refreshStats = useCallback(async () => {
    try {
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
      return dbStats;
    } catch (error) {
      console.error('Stats refresh failed:', error);
      return null;
    }
  }, []);

  // Initialize database
  const initialize = useCallback(async () => {
    setInitializing(true);
    try {
      const result = await initializeDatabase();
      if (result.success) {
        // Refresh all data after initialization
        await Promise.all([
          checkConnection(),
          checkHealth(),
          refreshStats()
        ]);
      }
      return result;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setInitializing(false);
    }
  }, [checkConnection, checkHealth, refreshStats]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    return connectionMonitor.onStatusChange((status) => {
      setConnectionStatus(status);
    });
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          checkConnection(),
          checkHealth(),
          refreshStats()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Start monitoring
    const unsubscribe = startMonitoring();
    connectionMonitor.start();

    return () => {
      unsubscribe();
      connectionMonitor.stop();
    };
  }, [checkConnection, checkHealth, refreshStats, startMonitoring]);

  return {
    // State
    connectionStatus,
    health,
    stats,
    loading,
    initializing,
    
    // Actions
    checkConnection,
    checkHealth,
    refreshStats,
    initialize,
    
    // Computed values
    isConnected: connectionStatus?.connected ?? false,
    isHealthy: health?.status === 'healthy',
    hasData: stats && Object.values(stats).some((count): count is number => typeof count === 'number' && count > 0),
    
    // Helper methods
    getConnectionLatency: () => connectionStatus?.latency,
    getLastCheck: () => connectionStatus?.timestamp,
    getHealthScore: () => {
      if (!health) return 0;
      const checksCount = Object.values(health.checks).filter(Boolean).length;
      return (checksCount / 4) * 100;
    }
  };
};

// Hook for specific table operations
export const useTableOperations = (tableName: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTableAccess = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error: tableError } = await supabase
        .from(tableName as any)
        .select('count')
        .limit(1);
      
      if (tableError) {
        setError(tableError.message);
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const getTableCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        setError(countError.message);
        return 0;
      }
      
      return count || 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  return {
    loading,
    error,
    testTableAccess,
    getTableCount
  };
};