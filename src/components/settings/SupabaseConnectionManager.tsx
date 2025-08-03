import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Shield,
  Wifi,
  HardDrive,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupabaseConnectionManagerProps {
  settings: any;
  onUpdate: (updates: any) => void;
  onTestConnection: () => Promise<boolean>;
  isTesting: boolean;
}

export const SupabaseConnectionManager: React.FC<SupabaseConnectionManagerProps> = ({
  settings,
  onUpdate,
  onTestConnection,
  isTesting
}) => {
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'error'>('unknown');
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const supabaseConfig = settings.integrations.supabase;

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">เชื่อมต่อแล้ว</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">ไม่เชื่อมต่อ</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">มีข้อผิดพลาด</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบสถานะ</Badge>;
    }
  };

  const handleTestConnection = async () => {
    const success = await onTestConnection();
    setConnectionStatus(success ? 'connected' : 'error');
    setLastTestTime(new Date());
  };

  const handleUpdate = (field: string, value: any) => {
    onUpdate({
      supabase: {
        ...supabaseConfig,
        [field]: value
      }
    });
  };

  const handleRealtimeUpdate = (field: string, value: any) => {
    onUpdate({
      supabase: {
        ...supabaseConfig,
        realtime: {
          ...supabaseConfig.realtime,
          [field]: value
        }
      }
    });
  };

  const handleRealtimeParamsUpdate = (field: string, value: any) => {
    onUpdate({
      supabase: {
        ...supabaseConfig,
        realtime: {
          ...supabaseConfig.realtime,
          params: {
            ...supabaseConfig.realtime.params,
            [field]: value
          }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            สถานะการเชื่อมต่อ Supabase
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>สถานะการเชื่อมต่อ</span>
            </div>
            {getStatusBadge()}
          </div>
          
          {lastTestTime && (
            <div className="mt-2 text-sm text-muted-foreground">
              ทดสอบล่าสุด: {lastTestTime.toLocaleString('th-TH')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            การตั้งค่าพื้นฐาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="supabaseEnabled"
              checked={supabaseConfig.enabled}
              onCheckedChange={(checked) => handleUpdate('enabled', checked)}
            />
            <Label htmlFor="supabaseEnabled">เปิดใช้งาน Supabase</Label>
          </div>

          {supabaseConfig.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">URL</Label>
                <Input
                  id="supabaseUrl"
                  value={supabaseConfig.url}
                  onChange={(e) => handleUpdate('url', e.target.value)}
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anonKey">Anonymous Key</Label>
                <div className="relative">
                  <Input
                    id="anonKey"
                    type={showPasswords ? "text" : "password"}
                    value={supabaseConfig.anonKey}
                    onChange={(e) => handleUpdate('anonKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                <Label htmlFor="serviceRoleKey">Service Role Key (ไม่บังคับ)</Label>
                <div className="relative">
                  <Input
                    id="serviceRoleKey"
                    type={showPasswords ? "text" : "password"}
                    value={supabaseConfig.serviceRoleKey}
                    onChange={(e) => handleUpdate('serviceRoleKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            การตั้งค่าการยืนยันตัวตน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoRefreshToken"
                checked={supabaseConfig.autoRefreshToken}
                onCheckedChange={(checked) => handleUpdate('autoRefreshToken', checked)}
              />
              <Label htmlFor="autoRefreshToken">รีเฟรชโทเค็นอัตโนมัติ</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="persistSession"
                checked={supabaseConfig.persistSession}
                onCheckedChange={(checked) => handleUpdate('persistSession', checked)}
              />
              <Label htmlFor="persistSession">เก็บเซสชันไว้</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage">ที่เก็บข้อมูล</Label>
              <Select
                value={supabaseConfig.storage}
                onValueChange={(value) => handleUpdate('storage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="localStorage">Local Storage</SelectItem>
                  <SelectItem value="sessionStorage">Session Storage</SelectItem>
                  <SelectItem value="memory">Memory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="debug"
                checked={supabaseConfig.debug}
                onCheckedChange={(checked) => handleUpdate('debug', checked)}
              />
              <Label htmlFor="debug">โหมด Debug</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Realtime Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            การตั้งค่า Realtime
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="realtimeEnabled"
              checked={supabaseConfig.realtime.enabled}
              onCheckedChange={(checked) => handleRealtimeUpdate('enabled', checked)}
            />
            <Label htmlFor="realtimeEnabled">เปิดใช้งาน Realtime</Label>
          </div>

          {supabaseConfig.realtime.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventsPerSecond">Events ต่อวินาที</Label>
                <Input
                  id="eventsPerSecond"
                  type="number"
                  min="1"
                  max="100"
                  value={supabaseConfig.realtime.params.eventsPerSecond}
                  onChange={(e) => handleRealtimeParamsUpdate('eventsPerSecond', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            ข้อมูลการเชื่อมต่อ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                {supabaseConfig.url || 'ยังไม่กำหนด'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anonymous Key</Label>
              <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                {supabaseConfig.anonKey ? 
                  `${supabaseConfig.anonKey.substring(0, 20)}...` : 
                  'ยังไม่กำหนด'
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Role Key</Label>
              <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                {supabaseConfig.serviceRoleKey ? 
                  `${supabaseConfig.serviceRoleKey.substring(0, 20)}...` : 
                  'ยังไม่กำหนด'
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label>Storage</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {supabaseConfig.storage}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 