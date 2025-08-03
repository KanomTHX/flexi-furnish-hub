import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Lock, Users, Eye, EyeOff, Key, AlertTriangle, CheckCircle, Settings, Plus, Edit, Trash2, RefreshCw, Download, Upload, Database, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SecurityManager = () => {
  const { toast } = useToast();
  const [showRLSDialog, setShowRLSDialog] = useState(false);
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    rlsEnabled: true,
    encryptionEnabled: true,
    sslEnforced: true,
    auditLogging: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });

  const [rlsPolicies, setRlsPolicies] = useState([
    {
      id: 1,
      table: 'users',
      policy: 'Users can only see their own data',
      enabled: true,
      type: 'SELECT'
    },
    {
      id: 2,
      table: 'orders',
      policy: 'Users can only see orders from their company',
      enabled: true,
      type: 'SELECT'
    },
    {
      id: 3,
      table: 'products',
      policy: 'Public read access, admin write access',
      enabled: true,
      type: 'ALL'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      timestamp: new Date(),
      user: 'admin@example.com',
      action: 'LOGIN',
      table: 'users',
      details: 'Successful login from 192.168.1.100',
      status: 'SUCCESS'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 300000),
      user: 'user@example.com',
      action: 'SELECT',
      table: 'orders',
      details: 'Query: SELECT * FROM orders WHERE user_id = 123',
      status: 'SUCCESS'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 600000),
      user: 'admin@example.com',
      action: 'UPDATE',
      table: 'products',
      details: 'Updated product price for ID 456',
      status: 'SUCCESS'
    }
  ]);

  const handleToggleSetting = (setting: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
    
    toast({
      title: "อัปเดตการตั้งค่า",
      description: `การตั้งค่า ${setting} ได้รับการอัปเดตแล้ว`,
    });
  };

  const handleTogglePolicy = (policyId: number) => {
    setRlsPolicies(prev => 
      prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, enabled: !policy.enabled }
          : policy
      )
    );
    
    toast({
      title: "อัปเดตนโยบาย",
      description: "สถานะนโยบายได้รับการอัปเดตแล้ว",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การจัดการความปลอดภัย</h2>
          <p className="text-muted-foreground">
            จัดการการตั้งค่าความปลอดภัยและนโยบายการเข้าถึงฐานข้อมูล
          </p>
        </div>
        <Button onClick={() => setShowRLSDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มนโยบาย RLS
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RLS Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rlsPolicies.length}</div>
            <p className="text-xs text-muted-foreground">
              นโยบายที่ใช้งาน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเข้ารหัส</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securitySettings.encryptionEnabled ? 'เปิด' : 'ปิด'}
            </div>
            <p className="text-xs text-muted-foreground">
              การเข้ารหัสข้อมูล
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              บันทึกวันนี้
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSL</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securitySettings.sslEnforced ? 'บังคับ' : 'ไม่บังคับ'}
            </div>
            <p className="text-xs text-muted-foreground">
              การเชื่อมต่อที่ปลอดภัย
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Security Settings Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            การตั้งค่า
          </TabsTrigger>
          <TabsTrigger value="rls" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            RLS Policies
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            ผู้ใช้งาน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  การตั้งค่าความปลอดภัยพื้นฐาน
                </CardTitle>
                <CardDescription>
                  กำหนดค่าการตั้งค่าความปลอดภัยหลัก
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Row Level Security (RLS)</Label>
                    <p className="text-sm text-muted-foreground">
                      เปิดใช้งานการควบคุมการเข้าถึงระดับแถว
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.rlsEnabled}
                    onCheckedChange={() => handleToggleSetting('rlsEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>การเข้ารหัสข้อมูล</Label>
                    <p className="text-sm text-muted-foreground">
                      เข้ารหัสข้อมูลที่เก็บในฐานข้อมูล
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.encryptionEnabled}
                    onCheckedChange={() => handleToggleSetting('encryptionEnabled')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>บังคับใช้ SSL</Label>
                    <p className="text-sm text-muted-foreground">
                      บังคับให้ใช้การเชื่อมต่อที่ปลอดภัย
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.sslEnforced}
                    onCheckedChange={() => handleToggleSetting('sslEnforced')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      บันทึกการเข้าถึงและเปลี่ยนแปลงข้อมูล
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={() => handleToggleSetting('auditLogging')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  นโยบายรหัสผ่าน
                </CardTitle>
                <CardDescription>
                  กำหนดนโยบายความปลอดภัยของรหัสผ่าน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ความยาวขั้นต่ำ</Label>
                  <Input
                    type="number"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      passwordPolicy: {
                        ...prev.passwordPolicy,
                        minLength: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ข้อกำหนดรหัสผ่าน</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.passwordPolicy.requireUppercase}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            requireUppercase: checked
                          }
                        }))}
                      />
                      <Label>ต้องมีตัวพิมพ์ใหญ่</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.passwordPolicy.requireLowercase}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            requireLowercase: checked
                          }
                        }))}
                      />
                      <Label>ต้องมีตัวพิมพ์เล็ก</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.passwordPolicy.requireNumbers}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            requireNumbers: checked
                          }
                        }))}
                      />
                      <Label>ต้องมีตัวเลข</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.passwordPolicy.requireSpecialChars}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            requireSpecialChars: checked
                          }
                        }))}
                      />
                      <Label>ต้องมีอักขระพิเศษ</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (นาที)</Label>
                  <Input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      sessionTimeout: parseInt(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>จำนวนครั้งสูงสุดในการล็อกอิน</Label>
                  <Input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev,
                      maxLoginAttempts: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Row Level Security Policies
              </CardTitle>
              <CardDescription>
                จัดการนโยบายการควบคุมการเข้าถึงระดับแถว
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ตาราง</TableHead>
                    <TableHead>นโยบาย</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rlsPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.table}</TableCell>
                      <TableCell>{policy.policy}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.enabled ? "default" : "secondary"}>
                          {policy.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePolicy(policy.id)}
                          >
                            {policy.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                บันทึกการเข้าถึงและเปลี่ยนแปลงข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เวลา</TableHead>
                    <TableHead>ผู้ใช้งาน</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                    <TableHead>ตาราง</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.timestamp.toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.table}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'SUCCESS' ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                การจัดการผู้ใช้งาน
              </CardTitle>
              <CardDescription>
                จัดการสิทธิ์และบทบาทของผู้ใช้งาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">ผู้ใช้งานทั้งหมด</span>
                    </div>
                    <div className="text-2xl font-bold">24</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">ผู้ดูแลระบบ</span>
                    </div>
                    <div className="text-2xl font-bold">3</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">ผู้ใช้งานที่ใช้งาน</span>
                    </div>
                    <div className="text-2xl font-bold">18</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                      <SelectItem value="manager">ผู้จัดการ</SelectItem>
                      <SelectItem value="user">ผู้ใช้งาน</SelectItem>
                      <SelectItem value="viewer">ผู้ดูข้อมูล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ใช้งาน
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกรายงาน
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showRLSDialog} onOpenChange={setShowRLSDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มนโยบาย RLS</DialogTitle>
            <DialogDescription>
              สร้างนโยบายการควบคุมการเข้าถึงระดับแถวใหม่
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ตาราง</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตาราง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">users</SelectItem>
                  <SelectItem value="orders">orders</SelectItem>
                  <SelectItem value="products">products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>ประเภทการเข้าถึง</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELECT">SELECT</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>เงื่อนไข</Label>
              <Input placeholder="auth.uid() = user_id" />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRLSDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => {
                toast({
                  title: "เพิ่มนโยบายสำเร็จ",
                  description: "นโยบาย RLS ใหม่ถูกเพิ่มแล้ว",
                });
                setShowRLSDialog(false);
              }}>
                เพิ่มนโยบาย
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEncryptionDialog} onOpenChange={setShowEncryptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>การตั้งค่าการเข้ารหัส</DialogTitle>
            <DialogDescription>
              กำหนดค่าการเข้ารหัสข้อมูลในฐานข้อมูล
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>อัลกอริทึมการเข้ารหัส</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกอัลกอริทึม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aes-256">AES-256</SelectItem>
                  <SelectItem value="aes-128">AES-128</SelectItem>
                  <SelectItem value="3des">3DES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>คีย์การเข้ารหัส</Label>
              <Input type="password" placeholder="ป้อนคีย์การเข้ารหัส" />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEncryptionDialog(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => {
                toast({
                  title: "บันทึกการตั้งค่า",
                  description: "การตั้งค่าการเข้ารหัสได้รับการบันทึกแล้ว",
                });
                setShowEncryptionDialog(false);
              }}>
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 