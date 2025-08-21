import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    allowDataCollection: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
    passwordExpiry: number;
  };
  system: {
    autoSave: boolean;
    soundEnabled: boolean;
    animationsEnabled: boolean;
    debugMode: boolean;
  };
}

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
      allowDataCollection: true
    },
    appearance: {
      theme: 'system',
      language: 'th',
      fontSize: 'medium',
      compactMode: false
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
      passwordExpiry: 90
    },
    system: {
      autoSave: true,
      soundEnabled: true,
      animationsEnabled: true,
      debugMode: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Load settings from localStorage or API
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      // Save to localStorage and/or API
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Apply theme change
      if (settings.appearance.theme !== theme) {
        setTheme(settings.appearance.theme);
      }
      
      setHasChanges(false);
      toast({
        title: "บันทึกสำเร็จ",
        description: "การตั้งค่าได้รับการบันทึกแล้ว"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: true,
        showPhone: false,
        allowDataCollection: true
      },
      appearance: {
        theme: 'system',
        language: 'th',
        fontSize: 'medium',
        compactMode: false
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        loginNotifications: true,
        passwordExpiry: 90
      },
      system: {
        autoSave: true,
        soundEnabled: true,
        animationsEnabled: true,
        debugMode: false
      }
    });
    setHasChanges(true);
  };

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings(importedSettings);
          setHasChanges(true);
          toast({
            title: "นำเข้าสำเร็จ",
            description: "การตั้งค่าได้รับการนำเข้าแล้ว"
          });
        } catch (error) {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไฟล์การตั้งค่าไม่ถูกต้อง",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            การตั้งค่า
          </h1>
          <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบและความปลอดภัย</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              มีการเปลี่ยนแปลง
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเซ็ต
          </Button>
          <Button
            onClick={saveSettings}
            disabled={isLoading || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">รูปลักษณ์</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">การแจ้งเตือน</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">ความเป็นส่วนตัว</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">ความปลอดภัย</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">ระบบ</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                การตั้งค่ารูปลักษณ์
              </CardTitle>
              <CardDescription>
                ปรับแต่งรูปลักษณ์และการแสดงผลของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>ธีม</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value) => updateSettings('appearance', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          สว่าง
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          มืด
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          ตามระบบ
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ภาษา</Label>
                  <Select
                    value={settings.appearance.language}
                    onValueChange={(value) => updateSettings('appearance', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="th">ไทย</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ขนาดตัวอักษร</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value) => updateSettings('appearance', 'fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">เล็ก</SelectItem>
                      <SelectItem value="medium">กลาง</SelectItem>
                      <SelectItem value="large">ใหญ่</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>โหมดกะทัดรัด</Label>
                  <p className="text-sm text-gray-600">แสดงข้อมูลในพื้นที่น้อยลง</p>
                </div>
                <Switch
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) => updateSettings('appearance', 'compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                การตั้งค่าการแจ้งเตือน
              </CardTitle>
              <CardDescription>
                จัดการการรับการแจ้งเตือนจากระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การแจ้งเตือนทางอีเมล</Label>
                    <p className="text-sm text-gray-600">รับการแจ้งเตือนสำคัญทางอีเมล</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSettings('notifications', 'email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การแจ้งเตือนแบบ Push</Label>
                    <p className="text-sm text-gray-600">รับการแจ้งเตือนบนเบราว์เซอร์</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateSettings('notifications', 'push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การแจ้งเตือนทาง SMS</Label>
                    <p className="text-sm text-gray-600">รับการแจ้งเตือนทางข้อความ</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(checked) => updateSettings('notifications', 'sms', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การแจ้งเตือนการตลาด</Label>
                    <p className="text-sm text-gray-600">รับข้อมูลข่าวสารและโปรโมชั่น</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => updateSettings('notifications', 'marketing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                การตั้งค่าความเป็นส่วนตัว
              </CardTitle>
              <CardDescription>
                ควบคุมการแสดงข้อมูลส่วนตัวและความเป็นส่วนตัว
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>การมองเห็นโปรไฟล์</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => updateSettings('privacy', 'profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">สาธารณะ</SelectItem>
                      <SelectItem value="private">ส่วนตัว</SelectItem>
                      <SelectItem value="friends">เฉพาะเพื่อน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>แสดงอีเมล</Label>
                    <p className="text-sm text-gray-600">อนุญาตให้ผู้อื่นเห็นอีเมลของคุณ</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showEmail}
                    onCheckedChange={(checked) => updateSettings('privacy', 'showEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>แสดงเบอร์โทรศัพท์</Label>
                    <p className="text-sm text-gray-600">อนุญาตให้ผู้อื่นเห็นเบอร์โทรศัพท์ของคุณ</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showPhone}
                    onCheckedChange={(checked) => updateSettings('privacy', 'showPhone', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>อนุญาตการเก็บข้อมูล</Label>
                    <p className="text-sm text-gray-600">อนุญาตให้ระบบเก็บข้อมูลการใช้งานเพื่อปรับปรุงบริการ</p>
                  </div>
                  <Switch
                    checked={settings.privacy.allowDataCollection}
                    onCheckedChange={(checked) => updateSettings('privacy', 'allowDataCollection', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                การตั้งค่าความปลอดภัย
              </CardTitle>
              <CardDescription>
                จัดการการรักษาความปลอดภัยของบัญชี
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      การยืนยันตัวตนสองขั้นตอน
                    </Label>
                    <p className="text-sm text-gray-600">เพิ่มความปลอดภัยด้วยการยืนยันตัวตนสองขั้นตอน</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSettings('security', 'twoFactorEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>หมดเวลาเซสชัน (นาที)</Label>
                  <Select
                    value={settings.security.sessionTimeout.toString()}
                    onValueChange={(value) => updateSettings('security', 'sessionTimeout', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 นาที</SelectItem>
                      <SelectItem value="30">30 นาที</SelectItem>
                      <SelectItem value="60">1 ชั่วโมง</SelectItem>
                      <SelectItem value="120">2 ชั่วโมง</SelectItem>
                      <SelectItem value="480">8 ชั่วโมง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การแจ้งเตือนการเข้าสู่ระบบ</Label>
                    <p className="text-sm text-gray-600">แจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่</p>
                  </div>
                  <Switch
                    checked={settings.security.loginNotifications}
                    onCheckedChange={(checked) => updateSettings('security', 'loginNotifications', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>การหมดอายุรหัสผ่าน (วัน)</Label>
                  <Select
                    value={settings.security.passwordExpiry.toString()}
                    onValueChange={(value) => updateSettings('security', 'passwordExpiry', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 วัน</SelectItem>
                      <SelectItem value="60">60 วัน</SelectItem>
                      <SelectItem value="90">90 วัน</SelectItem>
                      <SelectItem value="180">180 วัน</SelectItem>
                      <SelectItem value="365">1 ปี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  การจัดการบัญชี
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Key className="h-4 w-4 mr-2" />
                    เปลี่ยนรหัสผ่าน
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    ดาวน์โหลดข้อมูล
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                การตั้งค่าระบบ
              </CardTitle>
              <CardDescription>
                จัดการการตั้งค่าระบบและประสิทธิภาพ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>บันทึกอัตโนมัติ</Label>
                    <p className="text-sm text-gray-600">บันทึกการเปลี่ยนแปลงโดยอัตโนมัติ</p>
                  </div>
                  <Switch
                    checked={settings.system.autoSave}
                    onCheckedChange={(checked) => updateSettings('system', 'autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {settings.system.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      เสียงแจ้งเตือน
                    </Label>
                    <p className="text-sm text-gray-600">เปิดเสียงแจ้งเตือนของระบบ</p>
                  </div>
                  <Switch
                    checked={settings.system.soundEnabled}
                    onCheckedChange={(checked) => updateSettings('system', 'soundEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>แอนิเมชั่น</Label>
                    <p className="text-sm text-gray-600">เปิดใช้งานแอนิเมชั่นของระบบ</p>
                  </div>
                  <Switch
                    checked={settings.system.animationsEnabled}
                    onCheckedChange={(checked) => updateSettings('system', 'animationsEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      โหมดดีบัก
                    </Label>
                    <p className="text-sm text-gray-600">เปิดใช้งานโหมดดีบักสำหรับนักพัฒนา</p>
                  </div>
                  <Switch
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) => updateSettings('system', 'debugMode', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  การจัดการข้อมูล
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={exportSettings} className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกการตั้งค่า
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-settings')?.click()}
                      className="justify-start w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      นำเข้าการตั้งค่า
                    </Button>
                  </div>
                  <Button variant="destructive" onClick={resetSettings} className="justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    ล้างข้อมูลทั้งหมด
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;