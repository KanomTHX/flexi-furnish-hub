import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity as ActivityIcon,
  Clock,
  User,
  ShoppingCart,
  Package,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Eye,
  Search,
  Filter,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  ExternalLink,
  FileText,
  Database,
  Shield,
  Smartphone
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'download' | 'upload' | 'settings' | 'security';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    ip?: string;
    device?: string;
    location?: string;
    resource?: string;
    resourceId?: string;
  };
  status: 'success' | 'warning' | 'error' | 'info';
}

const Activity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  useEffect(() => {
    fetchActivities();
  }, [dateRange]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, filterType, filterStatus]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      // Get activities from Local Storage
      const storedActivities = localStorage.getItem('flexi-furnish-activities');
      const activities: ActivityItem[] = storedActivities ? JSON.parse(storedActivities) : [];
      
      // Filter by date range if specified
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= filterDate;
      });
      
      setActivities(filteredActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลกิจกรรมได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add new activity to Local Storage
  const addActivity = (newActivity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    try {
      const activity: ActivityItem = {
        ...newActivity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };
      
      const storedActivities = localStorage.getItem('flexi-furnish-activities');
      const activities: ActivityItem[] = storedActivities ? JSON.parse(storedActivities) : [];
      
      activities.unshift(activity); // Add to beginning of array
      
      // Keep only last 1000 activities to prevent storage overflow
      const limitedActivities = activities.slice(0, 1000);
      
      localStorage.setItem('flexi-furnish-activities', JSON.stringify(limitedActivities));
      
      // Refresh the activities list
      fetchActivities();
      
      return activity;
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกกิจกรรมได้",
        variant: "destructive"
      });
      return null;
    }
  };

  // Function to clear all activities
  const clearAllActivities = () => {
    try {
      localStorage.removeItem('flexi-furnish-activities');
      setActivities([]);
      toast({
        title: "สำเร็จ",
        description: "ลบข้อมูลกิจกรรมทั้งหมดแล้ว",
      });
    } catch (error) {
      console.error('Error clearing activities:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลกิจกรรมได้",
        variant: "destructive"
      });
    }
  };

  // Function to export activities to JSON file
  const exportActivities = () => {
    try {
      const storedActivities = localStorage.getItem('flexi-furnish-activities');
      const activities = storedActivities ? JSON.parse(storedActivities) : [];
      
      const dataStr = JSON.stringify(activities, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activities-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "สำเร็จ",
        description: "ส่งออกข้อมูลกิจกรรมแล้ว",
      });
    } catch (error) {
      console.error('Error exporting activities:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  // Function to import activities from JSON file
  const importActivities = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (Array.isArray(importedData)) {
          localStorage.setItem('flexi-furnish-activities', JSON.stringify(importedData));
          fetchActivities();
          toast({
            title: "สำเร็จ",
            description: `นำเข้าข้อมูลกิจกรรม ${importedData.length} รายการแล้ว`,
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Error importing activities:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไฟล์ไม่ถูกต้องหรือเสียหาย",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input value
    event.target.value = '';
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4" />;
      case 'logout': return <LogOut className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityStats = () => {
    const total = filteredActivities.length;
    const success = filteredActivities.filter(a => a.status === 'success').length;
    const warning = filteredActivities.filter(a => a.status === 'warning').length;
    const error = filteredActivities.filter(a => a.status === 'error').length;
    const info = filteredActivities.filter(a => a.status === 'info').length;
    
    return { total, success, warning, error, info };
  };

  const stats = getActivityStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ActivityIcon className="h-8 w-8" />
            กิจกรรมล่าสุด
          </h1>
          <p className="text-gray-600 mt-1">ติดตามกิจกรรมและการเปลี่ยนแปลงในระบบ (เก็บใน Local Storage)</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => addActivity({
              type: 'create',
              title: 'ทดสอบเพิ่มกิจกรรม',
              description: 'นี่คือกิจกรรมทดสอบที่เพิ่มผ่าน Local Storage',
              user: {
                id: 'test-user',
                name: 'ผู้ใช้ทดสอบ'
              },
              status: 'success',
              metadata: {
                device: 'Web Browser',
                location: 'Local'
              }
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มทดสอบ
          </Button>
          <Button 
            variant="outline" 
            onClick={exportActivities}
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('import-file')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            นำเข้า
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importActivities}
            style={{ display: 'none' }}
          />
          <Button 
            variant="destructive" 
            onClick={clearAllActivities}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบทั้งหมด
          </Button>
          <Button onClick={fetchActivities} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ActivityIcon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">สำเร็จ</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">คำเตือน</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">ข้อผิดพลาด</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">ข้อมูล</p>
                <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
              </div>
              <Info className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหากิจกรรม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ประเภท</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                  <SelectItem value="create">สร้าง</SelectItem>
                  <SelectItem value="update">อัปเดต</SelectItem>
                  <SelectItem value="delete">ลบ</SelectItem>
                  <SelectItem value="view">ดู</SelectItem>
                  <SelectItem value="settings">การตั้งค่า</SelectItem>
                  <SelectItem value="security">ความปลอดภัย</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="success">สำเร็จ</SelectItem>
                  <SelectItem value="warning">คำเตือน</SelectItem>
                  <SelectItem value="error">ข้อผิดพลาด</SelectItem>
                  <SelectItem value="info">ข้อมูล</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ช่วงเวลา</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">วันนี้</SelectItem>
                  <SelectItem value="7">7 วันที่แล้ว</SelectItem>
                  <SelectItem value="30">30 วันที่แล้ว</SelectItem>
                  <SelectItem value="90">90 วันที่แล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการกิจกรรม</CardTitle>
          <CardDescription>
            แสดงกิจกรรม {filteredActivities.length} รายการจากทั้งหมด {activities.length} รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบกิจกรรมที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status === 'success' && 'สำเร็จ'}
                            {activity.status === 'warning' && 'คำเตือน'}
                            {activity.status === 'error' && 'ข้อผิดพลาด'}
                            {activity.status === 'info' && 'ข้อมูล'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.user.name}
                        </div>
                        
                        {activity.metadata?.ip && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.metadata.ip}
                          </div>
                        )}
                        
                        {activity.metadata?.device && (
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {activity.metadata.device}
                          </div>
                        )}
                        
                        {activity.metadata?.resource && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {activity.metadata.resource}
                            {activity.metadata.resourceId && (
                              <span className="font-mono">#{activity.metadata.resourceId}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.status)}
                    </div>
                  </div>
                  
                  {index < filteredActivities.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Activity;