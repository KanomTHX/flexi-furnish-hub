import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Camera,
  Clock,
  Building,
  UserCheck
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

const Profile = () => {
  const { user, refetchProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          bio: data.bio || '',
          department: data.department || '',
          position: data.position || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      toast({
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลโปรไฟล์ได้รับการอัปเดตแล้ว"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        toast({
          title: "ไฟล์ไม่ถูกต้อง",
          description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
          variant: "destructive"
        });
        return;
      }

      // ตรวจสอบขนาดไฟล์ (จำกัดที่ 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
          variant: "destructive"
        });
        return;
      }

      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // อัปโหลดไฟล์ไปยัง Supabase Storage โดยใช้ service role
      const { createClient } = await import('@supabase/supabase-js');
      const serviceSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { error: uploadError } = await serviceSupabase.storage
        .from('Picprofile')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // ดึง URL สาธารณะของไฟล์
      const { data: { publicUrl } } = serviceSupabase.storage
        .from('Picprofile')
        .getPublicUrl(filePath);

      // อัปเดต avatar_url ในฐานข้อมูล
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // รีเฟรชข้อมูลโปรไฟล์
      await fetchProfile();
      await refetchProfile(); // อัปเดต profile ใน AuthContext ด้วย
      
      toast({
        title: "อัปโหลดสำเร็จ",
        description: "รูปโปรไฟล์ได้รับการอัปเดตแล้ว"
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดรูปภาพได้",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        department: profile.department || '',
        position: profile.position || ''
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลโปรไฟล์</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                ยกเลิก
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              แก้ไขโปรไฟล์
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold">{profile.full_name || 'ไม่ระบุชื่อ'}</h3>
                <p className="text-gray-600">{profile.email}</p>
                <div className="flex justify-center mt-2">
                  <Badge className={getRoleColor(profile.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                     profile.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>เข้าร่วมเมื่อ {formatDate(profile.created_at)}</span>
              </div>
              {profile.last_login && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>เข้าสู่ระบบล่าสุด {formatDate(profile.last_login)}</span>
                </div>
              )}
              {profile.department && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{profile.department}</span>
                </div>
              )}
              {profile.position && (
                <div className="flex items-center text-sm text-gray-600">
                  <UserCheck className="h-4 w-4 mr-2" />
                  <span>{profile.position}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>
                จัดการข้อมูลส่วนตัวและข้อมูลติดต่อของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="กรอกชื่อ-นามสกุล"
                    />
                  ) : (
                    <div className="flex items-center p-2 bg-gray-50 rounded-md">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profile.full_name || 'ไม่ระบุ'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  ) : (
                    <div className="flex items-center p-2 bg-gray-50 rounded-md">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profile.phone || 'ไม่ระบุ'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">แผนก</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={editForm.department}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="กรอกแผนก"
                    />
                  ) : (
                    <div className="flex items-center p-2 bg-gray-50 rounded-md">
                      <Building className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profile.department || 'ไม่ระบุ'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="position">ตำแหน่ง</Label>
                  {isEditing ? (
                    <Input
                      id="position"
                      value={editForm.position}
                      onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="กรอกตำแหน่ง"
                    />
                  ) : (
                    <div className="flex items-center p-2 bg-gray-50 rounded-md">
                      <UserCheck className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{profile.position || 'ไม่ระบุ'}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="กรอกที่อยู่"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start p-2 bg-gray-50 rounded-md min-h-[80px]">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                    <span>{profile.address || 'ไม่ระบุ'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">เกี่ยวกับฉัน</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="เขียนเกี่ยวกับตัวคุณ"
                    rows={4}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md min-h-[100px]">
                    <span>{profile.bio || 'ไม่มีข้อมูล'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;