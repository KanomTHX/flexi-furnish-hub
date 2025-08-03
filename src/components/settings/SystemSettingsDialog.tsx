import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Link,
  Save,
  RotateCcw,
  Download,
  Upload,
  TestTube,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemSettingsDialog: React.FC<SystemSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    settings,
    isLoading,
    hasChanges,
    updateSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    testConnection,
    validateSettings
  } = useSystemSettings();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'audit' | 'notifications' | 'backup' | 'integrations'>('general');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const handleSave = async () => {
    const errors = validateSettings();
    if (errors.length > 0) {
      toast({
        title: "การตั้งค่าไม่ถูกต้อง",
        description: errors[0],
        variant: "destructive"
      });
      return;
    }
    
    await saveSettings();
  };

  const handleTestConnection = async (type: 'email' | 'ldap' | 'sso') => {
    setTestingConnection(type);
    await testConnection(type);
    setTestingConnection(null);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importSettings(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            การตั้งค่าระบบ
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                มีการเปลี่ยนแปลง
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            จัดการการตั้งค่าระบบทั้งหมด รวมถึงความปลอดภัย การตรวจสอบ และการแจ้งเตือน
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              ทั่วไป
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ความปลอดภัย
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              การตรวจสอบ
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              การแจ้งเตือน
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              สำรองข้อมูล
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              การเชื่อมต่อ
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การตั้งค่าทั่วไป</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">ชื่อบริษัท</Label>
                    <Input
                      id="companyName"
                      value={settings.general.companyName}
                      onChange={(e) => updateSettings('general', { companyName: e.target.value })}
                      placeholder="ชื่อบริษัท"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">เขตเวลา</Label>
                    <Select
                      value={settings.general.timezone}
                      onValueChange={(value) => updateSettings('general', { timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">รูปแบบวันที่</Label>
                    <Select
                      value={settings.general.dateFormat}
                      onValueChange={(value) => updateSettings('general', { dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">สกุลเงิน</Label>
                    <Select
                      value={settings.general.currency}
                      onValueChange={(value) => updateSettings('general', { currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">THB - บาทไทย</SelectItem>
                        <SelectItem value="USD">USD - ดอลลาร์สหรัฐ</SelectItem>
                        <SelectItem value="EUR">EUR - ยูโร</SelectItem>
                        <SelectItem value="JPY">JPY - เยนญี่ปุ่น</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">ภาษา</Label>
                    <Select
                      value={settings.general.language}
                      onValueChange={(value) => updateSettings('general', { language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="th">ไทย</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">ธีม</Label>
                    <Select
                      value={settings.general.theme}
                      onValueChange={(value) => updateSettings('general', { theme: value as 'light' | 'dark' | 'auto' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">สว่าง</SelectItem>
                        <SelectItem value="dark">มืด</SelectItem>
                        <SelectItem value="auto">อัตโนมัติ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">นโยบายรหัสผ่าน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">ความยาวขั้นต่ำ</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.passwordPolicy.minLength}
                      onChange={(e) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          minLength: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expirationDays">วันหมดอายุ</Label>
                    <Input
                      id="expirationDays"
                      type="number"
                      min="30"
                      max="365"
                      value={settings.security.passwordPolicy.expirationDays}
                      onChange={(e) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          expirationDays: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireUppercase"
                      checked={settings.security.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          requireUppercase: checked as boolean
                        }
                      })}
                    />
                    <Label htmlFor="requireUppercase">ต้องมีตัวพิมพ์ใหญ่</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireLowercase"
                      checked={settings.security.passwordPolicy.requireLowercase}
                      onCheckedChange={(checked) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          requireLowercase: checked as boolean
                        }
                      })}
                    />
                    <Label htmlFor="requireLowercase">ต้องมีตัวพิมพ์เล็ก</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireNumbers"
                      checked={settings.security.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          requireNumbers: checked as boolean
                        }
                      })}
                    />
                    <Label htmlFor="requireNumbers">ต้องมีตัวเลข</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requireSpecialChars"
                      checked={settings.security.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) => updateSettings('security', {
                        passwordPolicy: {
                          ...settings.security.passwordPolicy,
                          requireSpecialChars: checked as boolean
                        }
                      })}
                    />
                    <Label htmlFor="requireSpecialChars">ต้องมีอักขระพิเศษ</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การรักษาความปลอดภัย</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">หมดเวลาเซสชัน (นาที)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="480"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">ความพยายามเข้าสู่ระบบสูงสุด</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSettings('security', { maxLoginAttempts: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">ระยะเวลาล็อค (นาที)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      min="5"
                      max="60"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => updateSettings('security', { lockoutDuration: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="twoFactorAuth"
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSettings('security', { twoFactorAuth: checked })}
                    />
                    <Label htmlFor="twoFactorAuth">การยืนยันตัวตนสองขั้นตอน</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Settings */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การตั้งค่าการตรวจสอบ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAuditLogging"
                    checked={settings.audit.enableAuditLogging}
                    onCheckedChange={(checked) => updateSettings('audit', { enableAuditLogging: checked })}
                  />
                  <Label htmlFor="enableAuditLogging">เปิดใช้งานการบันทึกการตรวจสอบ</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logRetentionDays">เก็บบันทึก (วัน)</Label>
                    <Input
                      id="logRetentionDays"
                      type="number"
                      min="30"
                      max="3650"
                      value={settings.audit.logRetentionDays}
                      onChange={(e) => updateSettings('audit', { logRetentionDays: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logLevel">ระดับการบันทึก</Label>
                    <Select
                      value={settings.audit.logLevel}
                      onValueChange={(value) => updateSettings('audit', { logLevel: value as 'basic' | 'detailed' | 'verbose' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">พื้นฐาน</SelectItem>
                        <SelectItem value="detailed">รายละเอียด</SelectItem>
                        <SelectItem value="verbose">ครบถ้วน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="realTimeMonitoring"
                      checked={settings.audit.realTimeMonitoring}
                      onCheckedChange={(checked) => updateSettings('audit', { realTimeMonitoring: checked })}
                    />
                    <Label htmlFor="realTimeMonitoring">การติดตามแบบเรียลไทม์</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoArchive"
                      checked={settings.audit.autoArchive}
                      onCheckedChange={(checked) => updateSettings('audit', { autoArchive: checked })}
                    />
                    <Label htmlFor="autoArchive">เก็บถาวรอัตโนมัติ</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  การตั้งค่าอีเมล
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('email')}
                    disabled={testingConnection === 'email'}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingConnection === 'email' ? 'กำลังทดสอบ...' : 'ทดสอบ'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailEnabled"
                    checked={settings.notifications.email.enabled}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      email: { ...settings.notifications.email, enabled: checked }
                    })}
                  />
                  <Label htmlFor="emailEnabled">เปิดใช้งานการแจ้งเตือนทางอีเมล</Label>
                </div>

                {settings.notifications.email.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpServer">SMTP Server</Label>
                      <Input
                        id="smtpServer"
                        value={settings.notifications.email.smtpServer}
                        onChange={(e) => updateSettings('notifications', {
                          email: { ...settings.notifications.email, smtpServer: e.target.value }
                        })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.notifications.email.smtpPort}
                        onChange={(e) => updateSettings('notifications', {
                          email: { ...settings.notifications.email, smtpPort: parseInt(e.target.value) }
                        })}
                        placeholder="587"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailUsername">ชื่อผู้ใช้</Label>
                      <Input
                        id="emailUsername"
                        value={settings.notifications.email.username}
                        onChange={(e) => updateSettings('notifications', {
                          email: { ...settings.notifications.email, username: e.target.value }
                        })}
                        placeholder="user@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPassword">รหัสผ่าน</Label>
                      <div className="relative">
                        <Input
                          id="emailPassword"
                          type={showPasswords ? "text" : "password"}
                          value={settings.notifications.email.password}
                          onChange={(e) => updateSettings('notifications', {
                            email: { ...settings.notifications.email, password: e.target.value }
                          })}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromAddress">From Address</Label>
                      <Input
                        id="fromAddress"
                        value={settings.notifications.email.fromAddress}
                        onChange={(e) => updateSettings('notifications', {
                          email: { ...settings.notifications.email, fromAddress: e.target.value }
                        })}
                        placeholder="noreply@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="encryption">การเข้ารหัส</Label>
                      <Select
                        value={settings.notifications.email.encryption}
                        onValueChange={(value) => updateSettings('notifications', {
                          email: { ...settings.notifications.email, encryption: value as 'none' | 'tls' | 'ssl' }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ไม่มี</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ประเภทการแจ้งเตือน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="securityIncidents"
                    checked={settings.notifications.alerts.securityIncidents}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      alerts: { ...settings.notifications.alerts, securityIncidents: checked as boolean }
                    })}
                  />
                  <Label htmlFor="securityIncidents">เหตุการณ์ความปลอดภัย</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="systemErrors"
                    checked={settings.notifications.alerts.systemErrors}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      alerts: { ...settings.notifications.alerts, systemErrors: checked as boolean }
                    })}
                  />
                  <Label htmlFor="systemErrors">ข้อผิดพลาดของระบบ</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="performanceIssues"
                    checked={settings.notifications.alerts.performanceIssues}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      alerts: { ...settings.notifications.alerts, performanceIssues: checked as boolean }
                    })}
                  />
                  <Label htmlFor="performanceIssues">ปัญหาประสิทธิภาพ</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="complianceViolations"
                    checked={settings.notifications.alerts.complianceViolations}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      alerts: { ...settings.notifications.alerts, complianceViolations: checked as boolean }
                    })}
                  />
                  <Label htmlFor="complianceViolations">การละเมิดการปฏิบัติตาม</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintenanceReminders"
                    checked={settings.notifications.alerts.maintenanceReminders}
                    onCheckedChange={(checked) => updateSettings('notifications', {
                      alerts: { ...settings.notifications.alerts, maintenanceReminders: checked as boolean }
                    })}
                  />
                  <Label htmlFor="maintenanceReminders">การแจ้งเตือนการบำรุงรักษา</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การตั้งค่าสำรองข้อมูล</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backupEnabled"
                    checked={settings.backup.enabled}
                    onCheckedChange={(checked) => updateSettings('backup', { enabled: checked })}
                  />
                  <Label htmlFor="backupEnabled">เปิดใช้งานการสำรองข้อมูลอัตโนมัติ</Label>
                </div>

                {settings.backup.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">ความถี่</Label>
                      <Select
                        value={settings.backup.frequency}
                        onValueChange={(value) => updateSettings('backup', { frequency: value as 'daily' | 'weekly' | 'monthly' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">รายวัน</SelectItem>
                          <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                          <SelectItem value="monthly">รายเดือน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupTime">เวลา</Label>
                      <Input
                        id="backupTime"
                        type="time"
                        value={settings.backup.time}
                        onChange={(e) => updateSettings('backup', { time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">ตำแหน่งเก็บข้อมูล</Label>
                      <Select
                        value={settings.backup.location}
                        onValueChange={(value) => updateSettings('backup', { location: value as 'local' | 'cloud' | 'both' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">ในเครื่อง</SelectItem>
                          <SelectItem value="cloud">คลาวด์</SelectItem>
                          <SelectItem value="both">ทั้งสองแบบ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention">เก็บไว้ (วัน)</Label>
                      <Input
                        id="retention"
                        type="number"
                        min="7"
                        max="365"
                        value={settings.backup.retention}
                        onChange={(e) => updateSettings('backup', { retention: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="encryption"
                      checked={settings.backup.encryption}
                      onCheckedChange={(checked) => updateSettings('backup', { encryption: checked as boolean })}
                    />
                    <Label htmlFor="encryption">เข้ารหัสข้อมูลสำรอง</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={settings.backup.compression}
                      onCheckedChange={(checked) => updateSettings('backup', { compression: checked as boolean })}
                    />
                    <Label htmlFor="compression">บีบอัดข้อมูล</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  LDAP Integration
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection('ldap')}
                    disabled={testingConnection === 'ldap'}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingConnection === 'ldap' ? 'กำลังทดสอบ...' : 'ทดสอบ'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ldapEnabled"
                    checked={settings.integrations.ldap.enabled}
                    onCheckedChange={(checked) => updateSettings('integrations', {
                      ldap: { ...settings.integrations.ldap, enabled: checked }
                    })}
                  />
                  <Label htmlFor="ldapEnabled">เปิดใช้งาน LDAP</Label>
                </div>

                {settings.integrations.ldap.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ldapServer">LDAP Server</Label>
                      <Input
                        id="ldapServer"
                        value={settings.integrations.ldap.server}
                        onChange={(e) => updateSettings('integrations', {
                          ldap: { ...settings.integrations.ldap, server: e.target.value }
                        })}
                        placeholder="ldap.company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ldapPort">Port</Label>
                      <Input
                        id="ldapPort"
                        type="number"
                        value={settings.integrations.ldap.port}
                        onChange={(e) => updateSettings('integrations', {
                          ldap: { ...settings.integrations.ldap, port: parseInt(e.target.value) }
                        })}
                        placeholder="389"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baseDN">Base DN</Label>
                      <Input
                        id="baseDN"
                        value={settings.integrations.ldap.baseDN}
                        onChange={(e) => updateSettings('integrations', {
                          ldap: { ...settings.integrations.ldap, baseDN: e.target.value }
                        })}
                        placeholder="dc=company,dc=com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bindDN">Bind DN</Label>
                      <Input
                        id="bindDN"
                        value={settings.integrations.ldap.bindDN}
                        onChange={(e) => updateSettings('integrations', {
                          ldap: { ...settings.integrations.ldap, bindDN: e.target.value }
                        })}
                        placeholder="cn=admin,dc=company,dc=com"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="apiEnabled"
                    checked={settings.integrations.api.enabled}
                    onCheckedChange={(checked) => updateSettings('integrations', {
                      api: { ...settings.integrations.api, enabled: checked }
                    })}
                  />
                  <Label htmlFor="apiEnabled">เปิดใช้งาน API</Label>
                </div>

                {settings.integrations.api.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit (ต่อชั่วโมง)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        min="100"
                        max="10000"
                        value={settings.integrations.api.rateLimit}
                        onChange={(e) => updateSettings('integrations', {
                          api: { ...settings.integrations.api, rateLimit: parseInt(e.target.value) }
                        })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireApiKey"
                        checked={settings.integrations.api.requireApiKey}
                        onCheckedChange={(checked) => updateSettings('integrations', {
                          api: { ...settings.integrations.api, requireApiKey: checked }
                        })}
                      />
                      <Label htmlFor="requireApiKey">ต้องใช้ API Key</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="import-settings"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-settings')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              นำเข้า
            </Button>
            
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              รีเซ็ต
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};