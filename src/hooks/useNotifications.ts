import { useState, useEffect } from 'react';
import { notificationService, Notification } from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // โหลดการแจ้งเตือน
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id)
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ทำเครื่องหมายว่าอ่านแล้ว
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // อัปเดต state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำเครื่องหมายการแจ้งเตือนได้",
        variant: "destructive",
      });
    }
  };

  // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      
      // อัปเดต state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำเครื่องหมายการแจ้งเตือนได้",
        variant: "destructive",
      });
    }
  };

  // ลบการแจ้งเตือน
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // อัปเดต state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบการแจ้งเตือนได้",
        variant: "destructive",
      });
    }
  };

  // รีเฟรชข้อมูล
  const refresh = async () => {
    await loadNotifications();
  };

  // โหลดข้อมูลเมื่อ user เปลี่ยน
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [user?.id]);

  // ตั้งค่า real-time subscription
  useEffect(() => {
    if (!user?.warehouseId) return;

    const channel = supabase.channel(`warehouse_${user.warehouseId}`);
    
    channel
      .on('broadcast', { event: 'notification' }, (payload) => {
        const { type, title, message } = payload.payload;
        
        // แสดง toast notification
        toast({
          title,
          description: message,
          duration: 5000,
        });

        // รีเฟรชการแจ้งเตือน
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.warehouseId, toast]);

  // ตั้งค่า database subscription สำหรับการแจ้งเตือนใหม่
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = notificationService['mapNotification'](payload.new);
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // แสดง toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, toast]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  };
}