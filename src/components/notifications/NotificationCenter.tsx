import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Volume2, 
  VolumeX,
  Monitor,
  Smartphone,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from "lucide-react";
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    config,
    permission,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    updateConfig,
    requestPermission,
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} วันที่แล้ว`;
    if (hours > 0) return `${hours} ชั่วโมงที่แล้ว`;
    if (minutes > 0) return `${minutes} นาทีที่แล้ว`;
    return 'เมื่อสักครู่';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle className="text-lg">การแจ้งเตือน</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {showSettings ? (
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">เปิดการแจ้งเตือน</Label>
                <Switch
                  id="notifications-enabled"
                  checked={config.enabled}
                  onCheckedChange={(enabled) => updateConfig({ enabled })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">ประเภทการแจ้งเตือน</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sales-notifications">การขาย</Label>
                  <Switch
                    id="sales-notifications"
                    checked={config.types.sales}
                    onCheckedChange={(sales) => 
                      updateConfig({ types: { ...config.types, sales } })
                    }
                    disabled={!config.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="inventory-notifications">สต็อกสินค้า</Label>
                  <Switch
                    id="inventory-notifications"
                    checked={config.types.inventory}
                    onCheckedChange={(inventory) => 
                      updateConfig({ types: { ...config.types, inventory } })
                    }
                    disabled={!config.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="employee-notifications">พนักงาน</Label>
                  <Switch
                    id="employee-notifications"
                    checked={config.types.employees}
                    onCheckedChange={(employees) => 
                      updateConfig({ types: { ...config.types, employees } })
                    }
                    disabled={!config.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="system-notifications">ระบบ</Label>
                  <Switch
                    id="system-notifications"
                    checked={config.types.system}
                    onCheckedChange={(system) => 
                      updateConfig({ types: { ...config.types, system } })
                    }
                    disabled={!config.enabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">การแจ้งเตือน</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {config.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <Label htmlFor="sound-notifications">เสียงแจ้งเตือน</Label>
                  </div>
                  <Switch
                    id="sound-notifications"
                    checked={config.sound}
                    onCheckedChange={(sound) => updateConfig({ sound })}
                    disabled={!config.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <Label htmlFor="desktop-notifications">แจ้งเตือนบนเดสก์ท็อป</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permission !== 'granted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestPermission}
                      >
                        อนุญาต
                      </Button>
                    )}
                    <Switch
                      id="desktop-notifications"
                      checked={config.desktop && permission === 'granted'}
                      onCheckedChange={(desktop) => updateConfig({ desktop })}
                      disabled={!config.enabled || permission !== 'granted'}
                    />
                  </div>
                </div>
              </div>

              {permission === 'denied' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    การแจ้งเตือนบนเดสก์ท็อปถูกปิดใช้งาน กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        ) : (
          <>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between">
                <CardDescription>
                  {notifications.length === 0 
                    ? 'ไม่มีการแจ้งเตือน' 
                    : `${notifications.length} การแจ้งเตือน`
                  }
                </CardDescription>
                {notifications.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        อ่านทั้งหมด
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      ลบทั้งหมด
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border rounded-lg transition-colors",
                      notification.read 
                        ? "bg-gray-50 border-gray-200" 
                        : "bg-white border-blue-200 shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={cn(
                              "text-sm font-medium",
                              !notification.read && "text-blue-900"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  window.location.href = notification.action!.url;
                                  markAsRead(notification.id);
                                }}
                              >
                                {notification.action.label}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => clearNotification(notification.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">ไม่มีการแจ้งเตือน</p>
                    <p className="text-sm text-gray-400 mt-1">
                      การแจ้งเตือนใหม่จะแสดงที่นี่
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </Card>
    </div>
  );
}