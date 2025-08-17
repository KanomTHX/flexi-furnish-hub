import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Settings, 
  Mail, 
  MessageSquare, 
  Phone,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Clock,
  Filter,
  Search,
  Download,
  Trash2,
  Archive,
  Star,
  StarOff,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Users,
  Building2
} from 'lucide-react';

// Types for notifications
interface Notification {
  id: string;
  type: 'alert' | 'system' | 'task' | 'reminder' | 'update';
  category: 'warehouse' | 'stock' | 'order' | 'maintenance' | 'security' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  details?: string;
  source: string;
  targetUsers: string[];
  channels: NotificationChannel[];
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  variant?: 'default' | 'destructive' | 'outline';
}

type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';

interface NotificationSettings {
  channels: {
    email: {
      enabled: boolean;
      address: string;
      categories: string[];
      priorities: string[];
      quietHours: { start: string; end: string; enabled: boolean };
    };
    sms: {
      enabled: boolean;
      number: string;
      categories: string[];
      priorities: string[];
      emergencyOnly: boolean;
    };
    push: {
      enabled: boolean;
      categories: string[];
      priorities: string[];
      sound: boolean;
      vibration: boolean;
    };
    in_app: {
      enabled: boolean;
      categories: string[];
      priorities: string[];
      autoMarkRead: boolean;
      showPreview: boolean;
    };
  };
  general: {
    language: string;
    timezone: string;
    batchNotifications: boolean;
    maxNotificationsPerHour: number;
  };
}

interface NotificationCenterProps {
  warehouseId?: string;
  userId?: string;
  onNotificationAction?: (notificationId: string, action: string) => void;
}

export function NotificationCenter({ warehouseId, userId, onNotificationAction }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    channels: {
      email: {
        enabled: true,
        address: 'user@example.com',
        categories: ['warehouse', 'stock', 'order'],
        priorities: ['critical', 'high'],
        quietHours: { start: '22:00', end: '08:00', enabled: true }
      },
      sms: {
        enabled: true,
        number: '+66812345678',
        categories: ['warehouse', 'security'],
        priorities: ['critical'],
        emergencyOnly: true
      },
      push: {
        enabled: true,
        categories: ['warehouse', 'stock', 'order', 'maintenance'],
        priorities: ['critical', 'high', 'medium'],
        sound: true,
        vibration: true
      },
      in_app: {
        enabled: true,
        categories: ['warehouse', 'stock', 'order', 'maintenance', 'security', 'general'],
        priorities: ['critical', 'high', 'medium', 'low'],
        autoMarkRead: false,
        showPreview: true
      }
    },
    general: {
      language: 'th',
      timezone: 'Asia/Bangkok',
      batchNotifications: true,
      maxNotificationsPerHour: 10
    }
  });

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: 'notif-001',
      type: 'alert',
      category: 'warehouse',
      priority: 'critical',
      title: 'อุณหภูมิคลังสินค้าสูงเกินกำหนด',
      message: 'อุณหภูมิในคลังสินค้าหลักเพิ่มขึ้นเป็น 28°C เกินเกณฑ์ที่กำหนด',
      details: 'ตรวจพบอุณหภูมิสูงในโซน A ชั้น 2 ซึ่งอาจส่งผลต่อคุณภาพสินค้า ควรตรวจสอบระบบปรับอากาศและดำเนินการแก้ไขทันที',
      source: 'ระบบตรวจสอบอุณหภูมิ',
      targetUsers: ['warehouse-manager', 'maintenance-team'],
      channels: ['email', 'sms', 'push', 'in_app'],
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      isStarred: true,
      isArchived: false,
      actions: [
        { id: 'view-details', label: 'ดูรายละเอียด', type: 'button', action: 'view_temperature_details' },
        { id: 'contact-maintenance', label: 'ติดต่อช่างซ่อม', type: 'button', action: 'contact_maintenance', variant: 'destructive' }
      ]
    },
    {
      id: 'notif-002',
      type: 'system',
      category: 'stock',
      priority: 'high',
      title: 'สินค้าใกล้หมดสต็อก',
      message: 'มีสินค้า 15 รายการที่มีสต็อกเหลือน้อยกว่าเกณฑ์ที่กำหนด',
      source: 'ระบบจัดการสต็อก',
      targetUsers: ['stock-manager', 'purchasing-team'],
      channels: ['email', 'push', 'in_app'],
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      isRead: true,
      isStarred: false,
      isArchived: false,
      actions: [
        { id: 'view-stock', label: 'ดูรายการสต็อก', type: 'button', action: 'view_low_stock' },
        { id: 'create-order', label: 'สร้างใบสั่งซื้อ', type: 'button', action: 'create_purchase_order' }
      ]
    },
    {
      id: 'notif-003',
      type: 'task',
      category: 'maintenance',
      priority: 'medium',
      title: 'งานบำรุงรักษาประจำสัปดาห์',
      message: 'ถึงเวลาทำการบำรุงรักษาอุปกรณ์ในคลังสินค้า',
      source: 'ระบบจัดการงาน',
      targetUsers: ['maintenance-team'],
      channels: ['email', 'in_app'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRead: true,
      isStarred: false,
      isArchived: false,
      actions: [
        { id: 'view-checklist', label: 'ดูรายการตรวจสอบ', type: 'button', action: 'view_maintenance_checklist' },
        { id: 'schedule-task', label: 'กำหนดเวลา', type: 'button', action: 'schedule_maintenance' }
      ]
    },
    {
      id: 'notif-004',
      type: 'reminder',
      category: 'order',
      priority: 'medium',
      title: 'คำสั่งซื้อรอการอนุมัติ',
      message: 'มีคำสั่งซื้อ 3 รายการที่รอการอนุมัติจากผู้จัดการ',
      source: 'ระบบจัดซื้อ',
      targetUsers: ['purchasing-manager'],
      channels: ['email', 'in_app'],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: false,
      isStarred: false,
      isArchived: false,
      actions: [
        { id: 'review-orders', label: 'ตรวจสอบคำสั่งซื้อ', type: 'button', action: 'review_purchase_orders' }
      ]
    },
    {
      id: 'notif-005',
      type: 'update',
      category: 'general',
      priority: 'low',
      title: 'อัปเดตระบบเสร็จสิ้น',
      message: 'ระบบได้รับการอัปเดตเป็นเวอร์ชัน 2.1.0 เรียบร้อยแล้ว',
      details: 'ฟีเจอร์ใหม่: \n- ระบบแจ้งเตือนขั้นสูง\n- รายงานการวิเคราะห์แบบ Real-time\n- การจัดการ Serial Number ที่ปรับปรุงใหม่',
      source: 'ระบบอัปเดต',
      targetUsers: ['all-users'],
      channels: ['in_app'],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: true,
      isStarred: false,
      isArchived: true,
      actions: [
        { id: 'view-changelog', label: 'ดูรายการเปลี่ยนแปลง', type: 'link', action: 'view_changelog' }
      ]
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(notif => notif.category === filterCategory);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filterPriority);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'unread') {
        filtered = filtered.filter(notif => !notif.isRead);
      } else if (filterStatus === 'starred') {
        filtered = filtered.filter(notif => notif.isStarred);
      } else if (filterStatus === 'archived') {
        filtered = filtered.filter(notif => notif.isArchived);
      }
    }

    // Filter by active tab
    if (activeTab !== 'all') {
      if (activeTab === 'unread') {
        filtered = filtered.filter(notif => !notif.isRead);
      } else if (activeTab === 'starred') {
        filtered = filtered.filter(notif => notif.isStarred);
      } else if (activeTab === 'archived') {
        filtered = filtered.filter(notif => notif.isArchived);
      }
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterCategory, filterPriority, filterStatus, activeTab]);

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert': return <Bell className="w-4 h-4 text-red-500" />;
      case 'system': return <Monitor className="w-4 h-4 text-blue-500" />;
      case 'task': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'reminder': return <Clock className="w-4 h-4 text-purple-500" />;
      case 'update': return <RefreshCw className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500 text-white hover:bg-red-600">วิกฤต</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">สูง</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">ปานกลาง</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">ต่ำ</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getCategoryName = (category: Notification['category']) => {
    switch (category) {
      case 'warehouse': return 'คลังสินค้า';
      case 'stock': return 'สต็อก';
      case 'order': return 'คำสั่งซื้อ';
      case 'maintenance': return 'บำรุงรักษา';
      case 'security': return 'ความปลอดภัย';
      case 'general': return 'ทั่วไป';
      default: return 'อื่นๆ';
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'email': return <Mail className="w-3 h-3" />;
      case 'sms': return <MessageSquare className="w-3 h-3" />;
      case 'push': return <Smartphone className="w-3 h-3" />;
      case 'in_app': return <Monitor className="w-3 h-3" />;
      default: return <Bell className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  const handleNotificationAction = (notificationId: string, action: string) => {
    switch (action) {
      case 'mark_read':
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true, readAt: new Date() } : notif
        ));
        break;
      case 'mark_unread':
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: false, readAt: undefined } : notif
        ));
        break;
      case 'star':
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, isStarred: !notif.isStarred } : notif
        ));
        break;
      case 'archive':
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, isArchived: !notif.isArchived } : notif
        ));
        break;
      case 'delete':
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        break;
      default:
        onNotificationAction?.(notificationId, action);
    }
  };

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    starred: notifications.filter(n => n.isStarred).length,
    archived: notifications.filter(n => n.isArchived).length,
    critical: notifications.filter(n => n.priority === 'critical').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            ศูนย์การแจ้งเตือน
          </h2>
          <p className="text-muted-foreground">
            จัดการการแจ้งเตือนและการสื่อสารทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                ตั้งค่า
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ตั้งค่าการแจ้งเตือน</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Email Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <Label className="text-base font-medium">อีเมล</Label>
                    </div>
                    <Switch 
                      checked={settings.channels.email.enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            email: { ...prev.channels.email, enabled: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  {settings.channels.email.enabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label>ที่อยู่อีเมล</Label>
                        <Input 
                          value={settings.channels.email.address}
                          onChange={(e) => 
                            setSettings(prev => ({
                              ...prev,
                              channels: {
                                ...prev.channels,
                                email: { ...prev.channels.email, address: e.target.value }
                              }
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.channels.email.quietHours.enabled}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({
                              ...prev,
                              channels: {
                                ...prev.channels,
                                email: {
                                  ...prev.channels.email,
                                  quietHours: { ...prev.channels.email.quietHours, enabled: checked }
                                }
                              }
                            }))
                          }
                        />
                        <Label>เวลาเงียบ (22:00 - 08:00)</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <Label className="text-base font-medium">SMS</Label>
                    </div>
                    <Switch 
                      checked={settings.channels.sms.enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            sms: { ...prev.channels.sms, enabled: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  {settings.channels.sms.enabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label>หมายเลขโทรศัพท์</Label>
                        <Input 
                          value={settings.channels.sms.number}
                          onChange={(e) => 
                            setSettings(prev => ({
                              ...prev,
                              channels: {
                                ...prev.channels,
                                sms: { ...prev.channels.sms, number: e.target.value }
                              }
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.channels.sms.emergencyOnly}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({
                              ...prev,
                              channels: {
                                ...prev.channels,
                                sms: { ...prev.channels.sms, emergencyOnly: checked }
                              }
                            }))
                          }
                        />
                        <Label>เฉพาะกรณีฉุกเฉิน</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Push Notification Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <Label className="text-base font-medium">Push Notification</Label>
                    </div>
                    <Switch 
                      checked={settings.channels.push.enabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels,
                            push: { ...prev.channels.push, enabled: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  {settings.channels.push.enabled && (
                    <div className="ml-6 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={settings.channels.push.sound}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({
                                ...prev,
                                channels: {
                                  ...prev.channels,
                                  push: { ...prev.channels.push, sound: checked }
                                }
                              }))
                            }
                          />
                          <Label>เสียง</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={settings.channels.push.vibration}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({
                                ...prev,
                                channels: {
                                  ...prev.channels,
                                  push: { ...prev.channels.push, vibration: checked }
                                }
                              }))
                            }
                          />
                          <Label>การสั่น</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{notificationStats.total}</div>
                <div className="text-sm text-muted-foreground">ทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{notificationStats.unread}</div>
                <div className="text-sm text-muted-foreground">ยังไม่อ่าน</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{notificationStats.starred}</div>
                <div className="text-sm text-muted-foreground">ติดดาว</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{notificationStats.archived}</div>
                <div className="text-sm text-muted-foreground">เก็บถาวร</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{notificationStats.critical}</div>
                <div className="text-sm text-muted-foreground">วิกฤต</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="ค้นหาการแจ้งเตือน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                <SelectItem value="warehouse">คลังสินค้า</SelectItem>
                <SelectItem value="stock">สต็อก</SelectItem>
                <SelectItem value="order">คำสั่งซื้อ</SelectItem>
                <SelectItem value="maintenance">บำรุงรักษา</SelectItem>
                <SelectItem value="security">ความปลอดภัย</SelectItem>
                <SelectItem value="general">ทั่วไป</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="critical">วิกฤต</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
                <SelectItem value="starred">ติดดาว</SelectItem>
                <SelectItem value="archived">เก็บถาวร</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">ทั้งหมด ({notificationStats.total})</TabsTrigger>
          <TabsTrigger value="unread">ยังไม่อ่าน ({notificationStats.unread})</TabsTrigger>
          <TabsTrigger value="starred">ติดดาว ({notificationStats.starred})</TabsTrigger>
          <TabsTrigger value="archived">เก็บถาวร ({notificationStats.archived})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>การแจ้งเตือน</span>
                <div className="flex items-center gap-2">
                  {filteredNotifications.filter(n => !n.isRead).length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        filteredNotifications.filter(n => !n.isRead).forEach(notif => {
                          handleNotificationAction(notif.id, 'mark_read');
                        });
                      }}
                    >
                      อ่านทั้งหมด
                    </Button>
                  )}
                  <Badge variant="outline">
                    {filteredNotifications.length} รายการ
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีการแจ้งเตือน</p>
                    <p className="text-sm">ไม่พบการแจ้งเตือนที่ตรงกับเงื่อนไขที่เลือก</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        notification.isArchived
                          ? 'bg-gray-50 border-gray-200 opacity-75'
                          : notification.isRead
                          ? 'bg-white border-gray-200'
                          : notification.priority === 'critical'
                          ? 'bg-red-50 border-red-200 shadow-md'
                          : notification.priority === 'high'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(notification.type)}
                            {getPriorityBadge(notification.priority)}
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(notification.category)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notification.source}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                            {notification.isStarred && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            )}
                          </div>

                          <h4 className={`font-medium mb-1 ${
                            notification.isArchived ? 'text-muted-foreground line-through' : ''
                          }`}>
                            {notification.title}
                          </h4>

                          <p className={`text-sm mb-2 ${
                            notification.isArchived ? 'text-muted-foreground' : ''
                          }`}>
                            {notification.message}
                          </p>

                          {notification.details && (
                            <div className="text-xs text-muted-foreground mb-2 p-2 bg-gray-50 rounded">
                              {notification.details}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">ช่องทาง:</span>
                            {notification.channels.map((channel, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getChannelIcon(channel)}
                                <span>{channel}</span>
                              </div>
                            ))}
                          </div>

                          {notification.actions && notification.actions.length > 0 && (
                            <div className="flex items-center gap-2 mt-3">
                              {notification.actions.map((action) => (
                                <Button
                                  key={action.id}
                                  variant={action.variant || 'outline'}
                                  size="sm"
                                  onClick={() => handleNotificationAction(notification.id, action.action)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationAction(notification.id, 'star')}
                          >
                            {notification.isStarred ? 
                              <StarOff className="w-4 h-4" /> : 
                              <Star className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationAction(
                              notification.id, 
                              notification.isRead ? 'mark_unread' : 'mark_read'
                            )}
                          >
                            {notification.isRead ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationAction(notification.id, 'archive')}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotificationAction(notification.id, 'delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}