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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { branchService, type CreateBranchData } from '@/services/branchService';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';

interface AddBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBranchAdded?: () => void;
}

interface FormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface FormErrors {
  [key: string]: string;
}

export function AddBranchDialog({ open, onOpenChange, onBranchAdded }: AddBranchDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อสาขา';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'กรุณากรอกที่อยู่';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (formData.phone && !/^[0-9-+()\s]+$/.test(formData.phone)) {
      newErrors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const branchData: CreateBranchData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        manager_name: formData.manager_name.trim() || undefined,
        status: formData.status
      };

      await branchService.createBranch(branchData);
      
      toast({
        title: 'สำเร็จ',
        description: 'เพิ่มสาขาใหม่เรียบร้อยแล้ว',
      });

      // Reset form
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager_name: '',
        status: 'active'
      });
      setErrors({});
      
      onBranchAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถเพิ่มสาขาได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            เพิ่มสาขาใหม่
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลสาขาใหม่ที่ต้องการเพิ่มเข้าสู่ระบบ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Branch Name */}
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อสาขา *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="ชื่อสาขา"
                  className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Branch Code */}
            <div className="space-y-2">
              <Label htmlFor="code">รหัสสาขา</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => updateFormData('code', e.target.value)}
                placeholder="รหัสสาขา (ถ้าไม่กรอกจะสร้างอัตโนมัติ)"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">ที่อยู่ *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="ที่อยู่สาขา"
                className={`pl-10 ${errors.address ? 'border-red-500' : ''}`}
                rows={3}
              />
            </div>
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                  className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="อีเมล"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Manager Name */}
            <div className="space-y-2">
              <Label htmlFor="manager_name">ชื่อผู้จัดการ</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => updateFormData('manager_name', e.target.value)}
                  placeholder="ชื่อผู้จัดการสาขา"
                  className={`pl-10 ${errors.manager_name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.manager_name && (
                <p className="text-sm text-red-500">{errors.manager_name}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'maintenance') => updateFormData('status', value)}>
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                  <SelectItem value="maintenance">ปรับปรุง</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  กำลังเพิ่ม...
                </>
              ) : (
                'เพิ่มสาขา'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}