import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationConfig {
  enabled: boolean;
  types: {
    sales: boolean;
    inventory: boolean;
    employees: boolean;
    system: boolean;
  };
  sound: boolean;
  desktop: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export function usePushNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [config, setConfig] = useState<NotificationConfig>({
    enabled: true,
    types: {
      sales: true,
      inventory: true,
      employees: true,
      system: true,
    },
    sound: true,
    desktop: false,
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setConfig(prev => ({ ...prev, desktop: true }));
        toast({
          title: "การแจ้งเตือนเปิดใช้งานแล้ว",
          description: "คุณจะได้รับการแจ้งเตือนบนเดสก์ท็อป",
        });
      }
    }
  }, [toast]);

  // Initialize notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Add notification
  const addNotification = useCallback((notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50

    // Show toast notification
    if (config.enabled) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    }

    // Show desktop notification
    if (config.desktop && permission === 'granted' && 'Notification' in window) {
      const desktopNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: newNotification.id,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        desktopNotif.close();
      }, 5000);

      // Handle click
      desktopNotif.onclick = () => {
        window.focus();
        if (notification.action?.url) {
          window.location.href = notification.action.url;
        }
        desktopNotif.close();
      };
    }

    // Play sound
    if (config.sound && config.enabled) {
      playNotificationSound(notification.type);
    }

    return newNotification.id;
  }, [config, permission, toast]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // Clear notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update config
  const updateConfig = useCallback((updates: Partial<NotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    
    // Save to localStorage
    localStorage.setItem('notification-config', JSON.stringify({ ...config, ...updates }));
  }, [config]);

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-config');
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading notification config:', error);
      }
    }
  }, []);

  // Real-time notification listeners
  useEffect(() => {
    if (!config.enabled) return;

    const channels: any[] = [];

    // Sales notifications
    if (config.types.sales) {
      const salesChannel = supabase
        .channel('sales-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sales_transactions',
          },
          (payload) => {
            addNotification({
              title: 'การขายใหม่',
              message: `มีการขายใหม่ รหัส ${payload.new.transaction_number}`,
              type: 'success',
              action: {
                label: 'ดูรายละเอียด',
                url: '/pos'
              }
            });
          }
        )
        .subscribe();
      
      channels.push(salesChannel);
    }

    // Inventory notifications
    if (config.types.inventory) {
      const inventoryChannel = supabase
        .channel('inventory-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'product_inventory',
          },
          (payload) => {
            if (payload.new.status === 'sold' && payload.old.status === 'available') {
              addNotification({
                title: 'สินค้าถูกขาย',
                message: `สินค้า ID ${payload.new.product_id} ถูกขายแล้ว`,
                type: 'info',
                action: {
                  label: 'ดูสต็อก',
                  url: '/stock'
                }
              });
            }
          }
        )
        .subscribe();
      
      channels.push(inventoryChannel);
    }

    // Employee notifications
    if (config.types.employees) {
      const employeeChannel = supabase
        .channel('employee-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance',
          },
          (payload) => {
            if (payload.new.status === 'absent') {
              addNotification({
                title: 'พนักงานขาดงาน',
                message: `มีพนักงานขาดงานวันนี้`,
                type: 'warning',
                action: {
                  label: 'ดูรายละเอียด',
                  url: '/employees'
                }
              });
            }
          }
        )
        .subscribe();
      
      channels.push(employeeChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [config, addNotification]);

  // Unread count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return {
    notifications,
    unreadCount,
    config,
    permission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    updateConfig,
    requestPermission,
  };
}

// Helper function to play notification sounds
function playNotificationSound(type: 'info' | 'success' | 'warning' | 'error') {
  // Create audio context for better browser support
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Generate different tones for different notification types
    const frequencies = {
      info: 800,
      success: 1000,
      warning: 600,
      error: 400,
    };

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  lowStock: (productName: string, quantity: number) => ({
    title: 'สต็อกใกล้หมด',
    message: `${productName} เหลือเพียง ${quantity} ชิ้น`,
    type: 'warning' as const,
    action: {
      label: 'เติมสต็อก',
      url: '/stock'
    }
  }),

  newSale: (amount: number, customerName?: string) => ({
    title: 'การขายใหม่',
    message: `ขายสำเร็จ ${amount.toLocaleString()} บาท${customerName ? ` ให้ ${customerName}` : ''}`,
    type: 'success' as const,
    action: {
      label: 'ดูรายละเอียด',
      url: '/pos'
    }
  }),

  employeeAbsent: (employeeName: string) => ({
    title: 'พนักงานขาดงาน',
    message: `${employeeName} ไม่ได้เข้างานวันนี้`,
    type: 'warning' as const,
    action: {
      label: 'ดูการเข้างาน',
      url: '/employees'
    }
  }),

  systemError: (error: string) => ({
    title: 'ข้อผิดพลาดระบบ',
    message: error,
    type: 'error' as const,
  }),

  paymentOverdue: (customerName: string, amount: number) => ({
    title: 'การชำระเงินค้างชำระ',
    message: `${customerName} ค้างชำระ ${amount.toLocaleString()} บาท`,
    type: 'warning' as const,
    action: {
      label: 'ดูรายละเอียด',
      url: '/installments'
    }
  }),
};