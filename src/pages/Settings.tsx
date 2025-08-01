import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { SettingsOverview } from '@/components/settings/SettingsOverview';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { 
  Settings as SettingsIcon, 
  Users, 
  Server, 
  Building, 
  Shield, 
  Link,
  Plus
} from 'lucide-react';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const {
    generalSettings,
    users,
    userRoles,
    permissions,
    systemConfiguration,
    businessSettings,
    securitySettings,
    integrationSettings,
    auditLogs,
    loading,
    error,
    updateGeneralSettings,
    createUser,
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    updateSystemConfiguration,
    updateBusinessSettings,
    updateSecuritySettings,
    updateIntegrationSettings,
    loadSettingsData,
    getSettingsStats
  } = useSettings();

  const [activeTab, setActiveTab] = useState('overview');

  const handleNavigateToCategory = (category: string) => {
    setActiveTab(category);
  };

  const handleUpdateGeneralSettings = async (newSettings: any) => {
    try {
      await updateGeneralSettings(newSettings);
      toast({
        title: "สำเร็จ",
        description: "อัปเดตการตั้งค่าทั่วไปเรียบร้อยแล้ว",
      });
    } catch (err) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตการตั้งค่าได้",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      toast({
        title: "สำเร็จ",
        description: "สร้างผู้ใช้ใหม่เรียบร้อยแล้ว",
      });
    } catch (err) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadSettingsData}>ลองใหม่</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getSettingsStats();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">การตั้งค่า</h1>
          <p className="text-muted-foreground">
            จัดการการตั้งค่าระบบและข้อมูลบริษัท
          </p>
        </div>
        <Button onClick={loadSettingsData} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          รีเฟรชข้อมูล
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            ทั่วไป
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            ผู้ใช้งาน
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            ระบบ
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            ธุรกิจ
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            ความปลอดภัย
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SettingsOverview
            stats={stats}
            onRefresh={loadSettingsData}
            onNavigateToCategory={handleNavigateToCategory}
          />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings
            settings={generalSettings}
            onSave={handleUpdateGeneralSettings}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement
            users={users}
            roles={userRoles}
            onCreateUser={handleCreateUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                การตั้งค่าระบบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">การตั้งค่าระบบ</h3>
                <p className="text-muted-foreground mb-4">
                  จัดการการตั้งค่าฐานข้อมูล การสำรองข้อมูล และการแจ้งเตือน
                </p>
                <Button>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  เข้าสู่การตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                การตั้งค่าธุรกิจ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">การตั้งค่าธุรกิจ</h3>
                <p className="text-muted-foreground mb-4">
                  จัดการการตั้งค่าภาษี การชำระเงิน และการจัดส่ง
                </p>
                <Button>
                  <Building className="h-4 w-4 mr-2" />
                  เข้าสู่การตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                การตั้งค่าความปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">การตั้งค่าความปลอดภัย</h3>
                <p className="text-muted-foreground mb-4">
                  จัดการรหัสผ่าน การเข้าสู่ระบบ และการเข้ารหัส
                </p>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  เข้าสู่การตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;