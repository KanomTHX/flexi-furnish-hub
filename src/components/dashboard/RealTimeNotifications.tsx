import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Clock,
  Package,
  Users,
  ShoppingCart,
  TrendingDown,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

// ฟังก์ชันช่วยเหลือสำหรับแปลงประเภทการแจ้งเตือน
function getNotificationType(type: string): 'success' | 'warning' | 'error' | 'info' {
  switch (type) {
    case 'transfer_confirmed':
      return 'success';
    case 'transfer_cancelled':
      return 'error';
    case 'transfer_created':
    case 'transfer_received':
      return 'info';
    default:
      return 'info';
  }
}

function getNotificationCategory(type: string): 'sales' | 'inventory' | 'customer' | 'system' {
  switch (type) {
    case 'transfer_created':
    case 'transfer_received':
    case 'transfer_confirmed':
    case 'transfer_cancelled':
      return 'inventory';
    default:
      return 'system';
  }
}

function getActionUrl(type: string): string | undefined {
  switch (type) {
    case 'transfer_created':
    case 'transfer_received':
    case 'transfer_confirmed':
    case 'transfer_cancelled':
      return '/transfers';
    default:
      return undefined;
  }
}

interface NotificationDisplay {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'sales' | 'inventory' | 'customer' | 'system';
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

interface RealTimeNotificationsProps {
  onNavigate?: (path: string) => void;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconMap = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    error: <AlertTriangle className="h-4 w-4 text-red-600" />,
    info: <Info className="h-4 w-4 text-blue-600" />
  };
  
  return iconMap[type];
}

function CategoryIcon({ category }: { category: Notification['category'] }) {
  const iconMap = {
    sales: <ShoppingCart className="h-4 w-4" />,
    inventory: <Package className="h-4 w-4" />,
    system: <Zap className="h-4 w-4" />,
    customer: <Users className="h-4 w-4" />
  };
  
  return iconMap[category];
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDismiss, 
  onNavigate 
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate?: (path: string) => void;
}) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    return `${days} วันที่แล้ว`;
  };

  const typeColors = {
    success: 'border-l-green-500 bg-green-50',
    warning: 'border-l-yellow-500 bg-yellow-50',
    error: 'border-l-red-500 bg-red-50',
    info: 'border-l-blue-500 bg-blue-50'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className={cn(
      "border-l-4 p-4 rounded-r-lg transition-all duration-300 hover:shadow-md",
      typeColors[notification.type],
      !notification.read && "ring-2 ring-blue-200"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <NotificationIcon type={notification.type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={cn(
                "text-sm font-medium",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              
              <Badge 
                variant="secondary" 
                className={cn("text-xs", priorityColors[notification.priority])}
              >
                {notification.priority === 'high' && 'สำคัญ'}
                {notification.priority === 'medium' && 'ปานกลาง'}
                {notification.priority === 'low' && 'ทั่วไป'}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <CategoryIcon category={notification.category} />
                  <span className="capitalize">{notification.category}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(notification.timestamp)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {notification.actionUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onNavigate?.(notification.actionUrl!)}
                  >
                    ดูรายละเอียด
                  </Button>
                )}
                
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => onDismiss(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RealTimeNotifications({ onNavigate }: RealTimeNotificationsProps) {
  const {
    notifications: rawNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  // แปลงข้อมูลจาก hook ให้เป็นรูปแบบที่ใช้ในคอมโพเนนต์
  const notifications: NotificationDisplay[] = rawNotifications.map(notification => ({
    id: notification.id,
    type: getNotificationType(notification.type),
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt,
    read: notification.isRead,
    category: getNotificationCategory(notification.type),
    priority: 'medium', // ค่าเริ่มต้น
    actionUrl: getActionUrl(notification.type)
  }));
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [isConnected, setIsConnected] = useState(true);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high') return notification.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDismiss = async (id: string) => {
    await deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    // ลบการแจ้งเตือนทั้งหมดทีละรายการ
    await Promise.all(notifications.map(n => deleteNotification(n.id)));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">การแจ้งเตือน</CardTitle>
              <CardDescription className="text-sm">
                อัปเดตแบบเรียลไทม์
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
            </span>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs"
            >
              ทั้งหมด ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="text-xs"
            >
              ยังไม่อ่าน ({unreadCount})
            </Button>
            <Button
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high')}
              className="text-xs"
            >
              สำคัญ ({highPriorityCount})
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                อ่านทั้งหมด
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              ลบทั้งหมด
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p>กำลังโหลดการแจ้งเตือน...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RealTimeNotifications;