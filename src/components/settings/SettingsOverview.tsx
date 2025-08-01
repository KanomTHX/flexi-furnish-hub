import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  Server, 
  Building, 
  Shield, 
  Link,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface SettingsOverviewProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
    totalPermissions: number;
    recentChanges: number;
  };
  onRefresh: () => void;
  onNavigateToCategory: (category: string) => void;
}

export const SettingsOverview: React.FC<SettingsOverviewProps> = ({
  stats,
  onRefresh,
  onNavigateToCategory
}) => {
  const quickStats = [
    {
      title: 'ผู้ใช้งานทั้งหมด',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} คนใช้งานอยู่`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'บทบาทผู้ใช้',
      value: stats.totalRoles,
      subtitle: `${stats.totalPermissions} สิทธิ์`,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'การเปลี่ยนแปลงล่าสุด',
      value: stats.recentChanges,
      subtitle: 'ใน 24 ชั่วโมงที่ผ่านมา',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'สถานะระบบ',
      value: 'ปกติ',
      subtitle: 'ทุกระบบทำงานได้ดี',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  const settingsCategories = [
    {
      id: 'general',
      title: 'การตั้งค่าทั่วไป',
      description: 'ข้อมูลบริษัท ภาษา และการตั้งค่าพื้นฐาน',
      icon: Settings,
      color: 'bg-blue-500',
      status: 'configured'
    },
    {
      id: 'users',
      title: 'จัดการผู้ใช้งาน',
      description: 'ผู้ใช้งาน บทบาท และสิทธิ์การเข้าถึง',
      icon: Users,
      color: 'bg-green-500',
      status: 'configured'
    },
    {
      id: 'system',
      title: 'การตั้งค่าระบบ',
      description: 'ฐานข้อมูล การสำรองข้อมูล และการแจ้งเตือน',
      icon: Server,
      color: 'bg-purple-500',
      status: 'needs_attention'
    },
    {
      id: 'business',
      title: 'การตั้งค่าธุรกิจ',
      description: 'ภาษี การชำระเงิน และการจัดส่ง',
      icon: Building,
      color: 'bg-yellow-500',
      status: 'configured'
    },
    {
      id: 'security',
      title: 'ความปลอดภัย',
      description: 'รหัสผ่าน การเข้าสู่ระบบ และการเข้ารหัส',
      icon: Shield,
      color: 'bg-red-500',
      status: 'configured'
    },
    {
      id: 'integration',
      title: 'การเชื่อมต่อ',
      description: 'ระบบภายนอก API และการซิงค์ข้อมูล',
      icon: Link,
      color: 'bg-indigo-500',
      status: 'not_configured'
    }
  ];

  const recentActivities = [
    {
      action: 'อัปเดตข้อมูลบริษัท',
      user: 'ผู้ดูแลระบบ',
      time: '10 นาทีที่แล้ว',
      type: 'update'
    },
    {
      action: 'เพิ่มผู้ใช้ใหม่: สมหญิง รักงาน',
      user: 'ผู้จัดการ',
      time: '1 ชั่วโมงที่แล้ว',
      type: 'create'
    },
    {
      action: 'เปลี่ยนการตั้งค่าความปลอดภัย',
      user: 'ผู้ดูแลระบบ',
      time: '2 ชั่วโมงที่แล้ว',
      type: 'security'
    },
    {
      action: 'อัปเดตอัตราภาษี',
      user: 'ผู้จัดการ',
      time: '3 ชั่วโมงที่แล้ว',
      type: 'business'
    }
  ];

  const systemAlerts = [
    {
      type: 'warning',
      message: 'การสำรองข้อมูลอัตโนมัติต้องการการตั้งค่า',
      action: 'ตั้งค่า',
      category: 'system'
    },
    {
      type: 'info',
      message: 'มีการอัปเดตความปลอดภัยใหม่',
      action: 'ดูรายละเอียด',
      category: 'security'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="default" className="bg-green-100 text-green-800">ตั้งค่าแล้ว</Badge>;
      case 'needs_attention':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">ต้องตรวจสอบ</Badge>;
      case 'not_configured':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">ยังไม่ตั้งค่า</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ภาพรวมการตั้งค่า</h2>
          <p className="text-muted-foreground">
            จัดการและตรวจสอบการตั้งค่าระบบทั้งหมด
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              การแจ้งเตือนระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <span>{alert.message}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onNavigateToCategory(alert.category)}
                  >
                    {alert.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Categories */}
      <Card>
        <CardHeader>
          <CardTitle>หมวดหมู่การตั้งค่า</CardTitle>
          <p className="text-sm text-muted-foreground">
            เลือกหมวดหมู่ที่ต้องการจัดการ
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsCategories.map((category) => {
              const Icon = category.icon;
              
              return (
                <div
                  key={category.id}
                  className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onNavigateToCategory(category.id)}
                >
                  <div className={`p-3 rounded-full ${category.color} text-white mr-4 flex-shrink-0`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{category.title}</h3>
                      {getStatusBadge(category.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            กิจกรรมล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'create' ? 'bg-green-500' :
                    activity.type === 'update' ? 'bg-blue-500' :
                    activity.type === 'security' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      โดย {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type === 'create' ? 'สร้าง' :
                   activity.type === 'update' ? 'อัปเดต' :
                   activity.type === 'security' ? 'ความปลอดภัย' :
                   'ธุรกิจ'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigateToCategory('users')}
            >
              <Users className="h-6 w-6" />
              <span>เพิ่มผู้ใช้ใหม่</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigateToCategory('system')}
            >
              <Server className="h-6 w-6" />
              <span>สำรองข้อมูล</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => onNavigateToCategory('security')}
            >
              <Shield className="h-6 w-6" />
              <span>ตรวจสอบความปลอดภัย</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};