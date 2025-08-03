import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemSettingsDialog } from '@/components/settings/SystemSettingsDialog';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Database,
  Link,
  User,
  Palette,
  Globe,
  Clock,
  Key,
  Server,
  Wifi,
  HardDrive,
  Mail,
  Smartphone,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3
} from 'lucide-react';

export default function Settings() {
  const { settings, hasChanges } = useSystemSettings();
  const { toast } = useToast();
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'users' | 'monitoring'>('overview');

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (enabled: boolean) => {
    return (
      <Badge variant={enabled ? 'default' : 'secondary'}>
        {enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">การตั้งค่าระบบ</h1>
          <p className="text-muted-foreground">
            จัดการการตั้งค่าระบบ ความปลอดภัย และการกำหนดค่าต่างๆ
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </Badge>
          )}
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSystemSettings(true)}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            ตั้งค่าระบบ
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            ระบบ
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            ผู้ใช้งาน
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            การติดตาม
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-700">
                      {settings.general.companyName ? 'กำหนดแล้ว' : 'ยังไม่กำหนด'}
                    </div>
                    <div className="text-sm text-blue-600">การตั้งค่าทั่วไป</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {settings.security.twoFactorAuth ? 'เปิด' : 'ปิด'}
                    </div>
                    <div className="text-sm text-green-600">2FA</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-700">
                      {settings.backup.enabled ? 'เปิด' : 'ปิด'}
                    </div>
                    <div className="text-sm text-purple-600">สำรองข้อมูล</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {settings.notifications.email.enabled ? 'เปิด' : 'ปิด'}
                    </div>
                    <div className="text-sm text-orange-600">การแจ้งเตือน</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Settings Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  การตั้งค่าหลัก
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span>ภาษา</span>
                  </div>
                  <Badge variant="outline">
                    {settings.general.language === 'th' ? 'ไทย' : 'English'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>เขตเวลา</span>
                  </div>
                  <Badge variant="outline">{settings.general.timezone}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-gray-500" />
                    <span>ธีม</span>
                  </div>
                  <Badge variant="outline">
                    {settings.general.theme === 'light' ? 'สว่าง' : 
                     settings.general.theme === 'dark' ? 'มืด' : 'อัตโนมัติ'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ความปลอดภัย
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span>ความยาวรหัสผ่านขั้นต่ำ</span>
                  </div>
                  <Badge variant="outline">{settings.security.passwordPolicy.minLength} ตัวอักษร</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>หมดเวลาเซสชัน</span>
                  </div>
                  <Badge variant="outline">{settings.security.sessionTimeout} นาที</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gray-500" />
                    <span>2FA</span>
                  </div>
                  {getStatusBadge(settings.security.twoFactorAuth)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  การสำรองข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settings.backup.enabled)}
                    <span>สถานะ</span>
                  </div>
                  {getStatusBadge(settings.backup.enabled)}
                </div>

                {settings.backup.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>ความถี่</span>
                      <Badge variant="outline">
                        {settings.backup.frequency === 'daily' ? 'รายวัน' :
                         settings.backup.frequency === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>เวลา</span>
                      <Badge variant="outline">{settings.backup.time}</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>ตำแหน่งเก็บ</span>
                      <Badge variant="outline">
                        {settings.backup.location === 'local' ? 'ในเครื่อง' :
                         settings.backup.location === 'cloud' ? 'คลาวด์' : 'ทั้งสองแบบ'}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  การตรวจสอบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settings.audit.enableAuditLogging)}
                    <span>การบันทึก</span>
                  </div>
                  {getStatusBadge(settings.audit.enableAuditLogging)}
                </div>

                {settings.audit.enableAuditLogging && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>ระดับการบันทึก</span>
                      <Badge variant="outline">
                        {settings.audit.logLevel === 'basic' ? 'พื้นฐาน' :
                         settings.audit.logLevel === 'detailed' ? 'รายละเอียด' : 'ครบถ้วน'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>เก็บบันทึก</span>
                      <Badge variant="outline">{settings.audit.logRetentionDays} วัน</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>การติดตามเรียลไทม์</span>
                      {getStatusBadge(settings.audit.realTimeMonitoring)}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  การเชื่อมต่อ LDAP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settings.integrations.ldap.enabled)}
                    <span>สถานะ</span>
                  </div>
                  {getStatusBadge(settings.integrations.ldap.enabled)}
                </div>

                {settings.integrations.ldap.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>เซิร์ฟเวอร์</span>
                      <Badge variant="outline">
                        {settings.integrations.ldap.server || 'ยังไม่กำหนด'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>พอร์ต</span>
                      <Badge variant="outline">{settings.integrations.ldap.port}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Single Sign-On
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settings.integrations.sso.enabled)}
                    <span>สถานะ</span>
                  </div>
                  {getStatusBadge(settings.integrations.sso.enabled)}
                </div>

                {settings.integrations.sso.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>ผู้ให้บริการ</span>
                      <Badge variant="outline">
                        {settings.integrations.sso.provider.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  การแจ้งเตือนทางอีเมล
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settings.notifications.email.enabled)}
                    <span>สถานะ</span>
                  </div>
                  {getStatusBadge(settings.notifications.email.enabled)}
                </div>

                {settings.notifications.email.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>SMTP Server</span>
                      <Badge variant="outline">
                        {settings.notifications.email.smtpServer || 'ยังไม่กำหนด'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>การเข้ารหัส</span>
                      <Badge variant="outline">
                        {settings.notifications.email.encryption.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  ประเภทการแจ้งเตือน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>เหตุการณ์ความปลอดภัย</span>
                  {getStatusBadge(settings.notifications.alerts.securityIncidents)}
                </div>

                <div className="flex items-center justify-between">
                  <span>ข้อผิดพลาดระบบ</span>
                  {getStatusBadge(settings.notifications.alerts.systemErrors)}
                </div>

                <div className="flex items-center justify-between">
                  <span>ปัญหาประสิทธิภาพ</span>
                  {getStatusBadge(settings.notifications.alerts.performanceIssues)}
                </div>

                <div className="flex items-center justify-between">
                  <span>การละเมิดการปฏิบัติตาม</span>
                  {getStatusBadge(settings.notifications.alerts.complianceViolations)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* System Settings Dialog */}
      <SystemSettingsDialog
        open={showSystemSettings}
        onOpenChange={setShowSystemSettings}
      />
    </div>
  );
}