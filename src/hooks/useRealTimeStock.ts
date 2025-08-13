import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { realTimeStockService } from '@/services/realTimeStockServicePlaceholder';
import type { StockLevel, StockAlert, StockMovement, SerialNumber } from '@/types/warehouseStock';

export interface UseRealTimeStockOptions {
  warehouseId?: string;
  productId?: string;
  enabled?: boolean;
  showNotifications?: boolean;
  notificationTypes?: ('stock_level_changed' | 'movement_logged' | 'serial_number_updated' | 'alert_triggered')[];
}

export interface UseRealTimeStockReturn {
  // Connection status
  isConnected: boolean;
  connectionStatus: string;
  
  // Real-time data
  recentUpdates: any[];
  activeAlerts: StockAlert[];
  
  // Statistics
  updateCount: number;
  lastUpdateTime: Date | null;
  
  // Controls
  connect: () => void;
  disconnect: () => void;
  clearUpdates: () => void;
  markAlertAsRead: (alertId: string) => void;
  
  // Event handlers
  onStockLevelChange: (callback: (data: any) => void) => () => void;
  onMovementLogged: (callback: (data: StockMovement) => void) => () => void;
  onSerialNumberUpdate: (callback: (data: SerialNumber) => void) => () => void;
  onAlertTriggered: (callback: (data: StockAlert) => void) => () => void;
}

export function useRealTimeStock(
  subscriptionId: string,
  options: UseRealTimeStockOptions = {}
): UseRealTimeStockReturn {
  const {
    enabled = true,
    showNotifications = true,
    notificationTypes = ['alert_triggered', 'stock_level_changed'],
    ...subscriptionOptions
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Refs for event handlers
  const eventHandlers = useRef<{
    stockLevelChange: ((data: any) => void)[];
    movementLogged: ((data: StockMovement) => void)[];
    serialNumberUpdate: ((data: SerialNumber) => void)[];
    alertTriggered: ((data: StockAlert) => void)[];
  }>({
    stockLevelChange: [],
    movementLogged: [],
    serialNumberUpdate: [],
    alertTriggered: []
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();

  // Handle stock updates
  const handleStockUpdate = useCallback((event: any) => {
    // Update statistics
    setUpdateCount(prev => prev + 1);
    setLastUpdateTime(new Date());

    // Add to recent updates (keep last 50)
    setRecentUpdates(prev => [event, ...prev].slice(0, 50));

    // Handle alerts
    if (event.type === 'alert_triggered') {
      const alert = event.data as StockAlert;
      setActiveAlerts(prev => {
        // Remove existing alert for same product/warehouse if any
        const filtered = prev.filter(a => 
          !(a.productId === alert.productId && a.warehouseId === alert.warehouseId && a.type === alert.type)
        );
        return [alert, ...filtered];
      });

      // Show notification for critical alerts
      if (showNotifications && alert.severity === 'critical') {
        toast({
          title: 'Critical Stock Alert',
          description: alert.message,
          variant: 'destructive',
        });
      } else if (showNotifications && alert.severity === 'warning') {
        toast({
          title: 'Stock Warning',
          description: alert.message,
          variant: 'default',
        });
      }
    }

    // Show notifications for other events if enabled
    if (showNotifications && notificationTypes.includes(event.type)) {
      let title = '';
      let description = '';

      switch (event.type) {
        case 'stock_level_changed':
          title = 'Stock Level Updated';
          description = `Stock levels have been updated for ${event.productId}`;
          break;
        case 'movement_logged':
          title = 'Stock Movement';
          description = `New stock movement recorded`;
          break;
        case 'serial_number_updated':
          title = 'Serial Number Updated';
          description = `Serial number status changed`;
          break;
      }

      if (title && event.type !== 'alert_triggered') {
        toast({
          title,
          description,
          variant: 'default',
        });
      }
    }

    // Call registered event handlers
    switch (event.type) {
      case 'stock_level_changed':
        eventHandlers.current.stockLevelChange.forEach(handler => {
          try {
            handler(event.data);
          } catch (error) {
            console.error('Error in stock level change handler:', error);
          }
        });
        break;
      case 'movement_logged':
        eventHandlers.current.movementLogged.forEach(handler => {
          try {
            handler(event.data);
          } catch (error) {
            console.error('Error in movement logged handler:', error);
          }
        });
        break;
      case 'serial_number_updated':
        eventHandlers.current.serialNumberUpdate.forEach(handler => {
          try {
            handler(event.data);
          } catch (error) {
            console.error('Error in serial number update handler:', error);
          }
        });
        break;
      case 'alert_triggered':
        eventHandlers.current.alertTriggered.forEach(handler => {
          try {
            handler(event.data);
          } catch (error) {
            console.error('Error in alert triggered handler:', error);
          }
        });
        break;
    }
  }, [showNotifications, notificationTypes, toast]);

  // Connect to real-time updates
  const connect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    setConnectionStatus('connecting');
    
    try {
      const unsubscribe = realTimeStockService.subscribe(
        subscriptionId,
        subscriptionOptions,
        handleStockUpdate
      );
      
      unsubscribeRef.current = unsubscribe;
      setIsConnected(true);
      setConnectionStatus('connected');
      
      console.log(`Connected to real-time stock updates: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to connect to real-time stock updates:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      
      if (showNotifications) {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to real-time stock updates',
          variant: 'destructive',
        });
      }
    }
  }, [subscriptionId, subscriptionOptions, handleStockUpdate, showNotifications, toast]);

  // Disconnect from real-time updates
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    console.log(`Disconnected from real-time stock updates: ${subscriptionId}`);
  }, [subscriptionId]);

  // Clear recent updates
  const clearUpdates = useCallback(() => {
    setRecentUpdates([]);
    setUpdateCount(0);
    setLastUpdateTime(null);
  }, []);

  // Mark alert as read
  const markAlertAsRead = useCallback((alertId: string) => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }, []);

  // Event handler registration functions
  const onStockLevelChange = useCallback((callback: (data: any) => void) => {
    eventHandlers.current.stockLevelChange.push(callback);
    
    return () => {
      const index = eventHandlers.current.stockLevelChange.indexOf(callback);
      if (index > -1) {
        eventHandlers.current.stockLevelChange.splice(index, 1);
      }
    };
  }, []);

  const onMovementLogged = useCallback((callback: (data: StockMovement) => void) => {
    eventHandlers.current.movementLogged.push(callback);
    
    return () => {
      const index = eventHandlers.current.movementLogged.indexOf(callback);
      if (index > -1) {
        eventHandlers.current.movementLogged.splice(index, 1);
      }
    };
  }, []);

  const onSerialNumberUpdate = useCallback((callback: (data: SerialNumber) => void) => {
    eventHandlers.current.serialNumberUpdate.push(callback);
    
    return () => {
      const index = eventHandlers.current.serialNumberUpdate.indexOf(callback);
      if (index > -1) {
        eventHandlers.current.serialNumberUpdate.splice(index, 1);
      }
    };
  }, []);

  const onAlertTriggered = useCallback((callback: (data: StockAlert) => void) => {
    eventHandlers.current.alertTriggered.push(callback);
    
    return () => {
      const index = eventHandlers.current.alertTriggered.indexOf(callback);
      if (index > -1) {
        eventHandlers.current.alertTriggered.splice(index, 1);
      }
    };
  }, []);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = realTimeStockService.getConnectionStatus();
      const currentStatus = status[subscriptionId];
      
      if (currentStatus && currentStatus !== connectionStatus) {
        setConnectionStatus(currentStatus);
        setIsConnected(currentStatus === 'joined');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [subscriptionId, connectionStatus]);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Real-time data
    recentUpdates,
    activeAlerts,
    
    // Statistics
    updateCount,
    lastUpdateTime,
    
    // Controls
    connect,
    disconnect,
    clearUpdates,
    markAlertAsRead,
    
    // Event handlers
    onStockLevelChange,
    onMovementLogged,
    onSerialNumberUpdate,
    onAlertTriggered
  };
}