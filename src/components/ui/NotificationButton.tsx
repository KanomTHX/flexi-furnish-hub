import { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationDisplay {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  actionUrl?: string;
}

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications: rawNotifications, isLoading, markAsRead, deleteNotification, clearAllNotifications } = useNotifications();
  
  // Helper functions to convert raw notifications to display format
  const getNotificationType = (type: string): 'info' | 'warning' | 'error' | 'success' => {
    switch (type) {
      case 'low_stock': return 'warning';
      case 'transfer_completed': return 'success';
      case 'transfer_failed': return 'error';
      case 'transfer_pending': return 'info';
      default: return 'info';
    }
  };
  
  const getNotificationCategory = (type: string): string => {
    switch (type) {
      case 'low_stock': return 'สต็อก';
      case 'transfer_completed': return 'การโอนสินค้า';
      case 'transfer_failed': return 'การโอนสินค้า';
      case 'transfer_pending': return 'การโอนสินค้า';
      default: return 'ทั่วไป';
    }
  };
  
  const getActionUrl = (type: string, data: any): string => {
    switch (type) {
      case 'low_stock': return '/inventory';
      case 'transfer_completed':
      case 'transfer_failed':
      case 'transfer_pending':
        return `/transfers/${data?.transfer_id || ''}`;
      default: return '#';
    }
  };
  
  // Convert raw notifications to display format
  const notifications: NotificationDisplay[] = rawNotifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: getNotificationType(notification.type),
    timestamp: new Date(notification.created_at),
    read: notification.read,
    priority: 'medium', // Default priority
    category: getNotificationCategory(notification.type),
    actionUrl: getActionUrl(notification.type, notification.data)
  }));

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationDisplay['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: NotificationDisplay['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50/50';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'success':
        return 'border-l-green-500 bg-green-50/50';
      default:
        return 'border-l-blue-500 bg-blue-50/50';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return timestamp.toLocaleDateString('th-TH');
  };

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      for (const notification of notifications.filter(n => !n.read)) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Remove notification
  const handleRemoveNotification = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative notification-dropdown">
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`แจ้งเตือน ${unreadCount > 0 ? `มี ${unreadCount} รายการใหม่` : 'ไม่มีรายการใหม่'}`}
      >
        <Bell className="w-6 h-6 text-gray-600" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-bold animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] z-50">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  การแจ้งเตือน
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      อ่านทั้งหมด
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>กำลังโหลดการแจ้งเตือน...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications
                    .sort((a, b) => {
                      // Sort by read status first (unread first), then by timestamp
                      if (a.read !== b.read) return a.read ? 1 : -1;
                      return b.timestamp.getTime() - a.timestamp.getTime();
                    })
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          getNotificationColor(notification.type)
                        } ${!notification.read ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNotification(notification.id);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}