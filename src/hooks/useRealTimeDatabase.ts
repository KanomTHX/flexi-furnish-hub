// Real-time Database Hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeStatus {
  connected: boolean;
  subscriptions: number;
  lastActivity: Date | null;
  error: string | null;
}

interface TableSubscription {
  table: string;
  channel: RealtimeChannel | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  updateCount: number;
}

export const useRealTimeDatabase = () => {
  const [status, setStatus] = useState<RealtimeStatus>({
    connected: false,
    subscriptions: 0,
    lastActivity: null,
    error: null
  });

  const [subscriptions, setSubscriptions] = useState<Map<string, TableSubscription>>(new Map());

  // Subscribe to table changes
  const subscribeToTable = useCallback((
    tableName: string,
    callback: (payload: any) => void,
    filter?: string
  ) => {
    try {
      const channel = supabase
        .channel(`${tableName}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter
          },
          (payload) => {
            // Update subscription status
            setSubscriptions(prev => {
              const newMap = new Map(prev);
              const sub = newMap.get(tableName);
              if (sub) {
                sub.lastUpdate = new Date();
                sub.updateCount += 1;
                sub.status = 'connected';
              }
              return newMap;
            });

            // Update global status
            setStatus(prev => ({
              ...prev,
              lastActivity: new Date(),
              connected: true,
              error: null
            }));

            // Call the provided callback
            callback(payload);
          }
        )
        .subscribe((status) => {
          setSubscriptions(prev => {
            const newMap = new Map(prev);
            newMap.set(tableName, {
              table: tableName,
              channel,
              status: status === 'SUBSCRIBED' ? 'connected' : 
                     status === 'CHANNEL_ERROR' ? 'error' : 'connecting',
              lastUpdate: null,
              updateCount: 0
            });
            return newMap;
          });

          // Update global status
          setStatus(prev => ({
            ...prev,
            subscriptions: prev.subscriptions + (status === 'SUBSCRIBED' ? 1 : 0),
            connected: status === 'SUBSCRIBED',
            error: status === 'CHANNEL_ERROR' ? 'Subscription failed' : null
          }));
        });

      return () => {
        channel.unsubscribe();
        setSubscriptions(prev => {
          const newMap = new Map(prev);
          newMap.delete(tableName);
          return newMap;
        });
        setStatus(prev => ({
          ...prev,
          subscriptions: Math.max(0, prev.subscriptions - 1)
        }));
      };
    } catch (error) {
      console.error(`Failed to subscribe to ${tableName}:`, error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return () => {};
    }
  }, []);

  // Unsubscribe from table
  const unsubscribeFromTable = useCallback((tableName: string) => {
    const subscription = subscriptions.get(tableName);
    if (subscription?.channel) {
      subscription.channel.unsubscribe();
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(tableName);
        return newMap;
      });
      setStatus(prev => ({
        ...prev,
        subscriptions: Math.max(0, prev.subscriptions - 1)
      }));
    }
  }, [subscriptions]);

  // Unsubscribe from all tables
  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach((subscription) => {
      if (subscription.channel) {
        subscription.channel.unsubscribe();
      }
    });
    setSubscriptions(new Map());
    setStatus(prev => ({
      ...prev,
      subscriptions: 0,
      connected: false
    }));
  }, [subscriptions]);

  // Test real-time connection
  const testRealTimeConnection = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, error: null }));

      // Create a test channel
      const testChannel = supabase
        .channel('connection-test')
        .on('broadcast', { event: 'test' }, () => {
          setStatus(prev => ({
            ...prev,
            connected: true,
            lastActivity: new Date(),
            error: null
          }));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Send a test broadcast
            testChannel.send({
              type: 'broadcast',
              event: 'test',
              payload: { message: 'Connection test' }
            });
            
            // Clean up after test
            setTimeout(() => {
              testChannel.unsubscribe();
            }, 1000);
          } else if (status === 'CHANNEL_ERROR') {
            setStatus(prev => ({
              ...prev,
              connected: false,
              error: 'Real-time connection failed'
            }));
          }
        });

      return true;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // Get subscription details
  const getSubscriptionDetails = useCallback(() => {
    return Array.from(subscriptions.values());
  }, [subscriptions]);

  // Check if table is subscribed
  const isTableSubscribed = useCallback((tableName: string) => {
    return subscriptions.has(tableName);
  }, [subscriptions]);

  // Get table subscription status
  const getTableStatus = useCallback((tableName: string) => {
    return subscriptions.get(tableName)?.status || 'disconnected';
  }, [subscriptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    // Status
    status,
    subscriptions: getSubscriptionDetails(),
    
    // Actions
    subscribeToTable,
    unsubscribeFromTable,
    unsubscribeAll,
    testRealTimeConnection,
    
    // Helpers
    isTableSubscribed,
    getTableStatus,
    
    // Computed values
    isConnected: status.connected,
    hasActiveSubscriptions: status.subscriptions > 0,
    totalSubscriptions: status.subscriptions,
    lastActivity: status.lastActivity,
    error: status.error
  };
};

// Hook for specific table real-time data
export const useTableRealTime = <T = any>(
  tableName: string,
  initialData: T[] = [],
  filter?: string
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToTable } = useRealTimeDatabase();

  // Handle real-time updates
  const handleUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setData(currentData => {
      switch (eventType) {
        case 'INSERT':
          return [...currentData, newRecord as T];
        
        case 'UPDATE':
          return currentData.map(item => 
            (item as any).id === newRecord.id ? newRecord as T : item
          );
        
        case 'DELETE':
          return currentData.filter(item => 
            (item as any).id !== oldRecord.id
          );
        
        default:
          return currentData;
      }
    });
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: tableData, error: fetchError } = await supabase
        .from(tableName as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setData(tableData as T[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Failed to load ${tableName} data:`, err);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTable(tableName, handleUpdate, filter);
    
    // Load initial data
    loadData();
    
    return unsubscribe;
  }, [tableName, filter, subscribeToTable, handleUpdate, loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData
  };
};