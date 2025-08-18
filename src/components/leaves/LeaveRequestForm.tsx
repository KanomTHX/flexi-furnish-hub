import React, { useState } from 'react';
import { Calendar, FileText, Clock, User } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { LeaveType } from '@/types/employees';

interface LeaveRequestFormProps {
  // No props needed as we'll use the current user context
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = () => {
  const [formData, setFormData] = useState({
    type: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
    notes: ''
  });
  
  const { submitLeaveRequest, loading, error } = useEmployees();

  const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
    { value: 'sick', label: 'ลาป่วย', description: 'ลาเนื่องจากเจ็บป่วย' },
    { value: 'personal', label: 'ลากิจ', description: 'ลาเพื่อธุระส่วนตัว' },
    { value: 'vacation', label: 'ลาพักร้อน', description: 'ลาเพื่อพักผ่อน' },
    { value: 'maternity', label: 'ลาคลอด', description: 'ลาคลอดบุตร' },
    { value: 'emergency', label: 'ลาฉุกเฉิน', description: 'ลาเนื่องจากเหตุฉุกเฉิน' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.startDate || !formData.endDate || !formData.reason) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      return;
    }

    try {
      await submitLeaveRequest({
        type: formData.type as LeaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });
      
      // รีเซ็ตฟอร์ม
      setFormData({
        type: '',
        startDate: '',
        endDate: '',
        reason: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to submit leave request:', error);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ขอลา
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">


          {/* ประเภทการลา */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">ประเภทการลา *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as LeaveType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทการลา" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* วันที่ลา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
          </div>

          {/* จำนวนวันลา */}
          {formData.startDate && formData.endDate && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                จำนวนวันลา: <span className="font-semibold">{calculateDays()} วัน</span>
              </span>
            </div>
          )}

          {/* เหตุผลการลา */}
          <div className="space-y-2">
            <Label htmlFor="reason">เหตุผลการลา *</Label>
            <Textarea
              id="reason"
              placeholder="กรุณาระบุเหตุผลการลา"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* หมายเหตุเพิ่มเติม */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
            <Textarea
              id="notes"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ปุ่มดำเนินการ */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอลา'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};