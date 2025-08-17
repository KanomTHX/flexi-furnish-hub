import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WarehouseZone } from '@/types/warehouse';
import {
  Truck,
  Package,
  Users,
  Archive,
  RefreshCw,
  Shield,
  Settings
} from 'lucide-react';

interface ZoneFormData {
  name: string;
  code: string;
  type: WarehouseZone['type'];
  description: string;
  area: number;
  capacity: number;
  maxWeight: number;
  maxHeight: number;
  hazardousAllowed: boolean;
  fragileOnly: boolean;
  climateControlled: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  humidityMin?: number;
  humidityMax?: number;
}

interface ZoneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ZoneFormData;
  onFormDataChange: (data: ZoneFormData) => void;
  editingZone: WarehouseZone | null;
  loading: boolean;
  onSubmit: () => void;
}

const ZONE_TYPES = [
  { value: 'receiving', label: 'รับสินค้า', color: 'bg-blue-500', icon: Truck },
  { value: 'storage', label: 'เก็บสินค้า', color: 'bg-green-500', icon: Package },
  { value: 'picking', label: 'คัดสินค้า', color: 'bg-yellow-500', icon: Users },
  { value: 'packing', label: 'แพ็คสินค้า', color: 'bg-purple-500', icon: Archive },
  { value: 'shipping', label: 'จัดส่ง', color: 'bg-orange-500', icon: Truck },
  { value: 'returns', label: 'รับคืน', color: 'bg-red-500', icon: RefreshCw },
  { value: 'quarantine', label: 'กักกัน', color: 'bg-gray-500', icon: Shield },
  { value: 'office', label: 'สำนักงาน', color: 'bg-indigo-500', icon: Settings }
] as const;

export function ZoneForm({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  editingZone,
  loading,
  onSubmit
}: ZoneFormProps) {
  const updateFormData = (updates: Partial<ZoneFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zone-name">ชื่อโซน</Label>
              <Input
                id="zone-name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="ชื่อโซน"
              />
            </div>
            <div>
              <Label htmlFor="zone-code">รหัสโซน</Label>
              <Input
                id="zone-code"
                value={formData.code}
                onChange={(e) => updateFormData({ code: e.target.value })}
                placeholder="รหัสโซน"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="zone-type">ประเภทโซน</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: WarehouseZone['type']) => updateFormData({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="zone-description">คำอธิบาย</Label>
            <Textarea
              id="zone-description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="คำอธิบายโซน"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zone-area">พื้นที่ (ตร.ม.)</Label>
              <Input
                id="zone-area"
                type="number"
                value={formData.area}
                onChange={(e) => updateFormData({ area: Number(e.target.value) })}
                placeholder="พื้นที่"
              />
            </div>
            <div>
              <Label htmlFor="zone-capacity">ความจุ</Label>
              <Input
                id="zone-capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => updateFormData({ capacity: Number(e.target.value) })}
                placeholder="ความจุ"
              />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-3">ข้อจำกัด</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone-max-weight">น้ำหนักสูงสุด (กก.)</Label>
                <Input
                  id="zone-max-weight"
                  type="number"
                  value={formData.maxWeight}
                  onChange={(e) => updateFormData({ maxWeight: Number(e.target.value) })}
                  placeholder="น้ำหนักสูงสุด"
                />
              </div>
              <div>
                <Label htmlFor="zone-max-height">ความสูงสูงสุด (ม.)</Label>
                <Input
                  id="zone-max-height"
                  type="number"
                  step="0.1"
                  value={formData.maxHeight}
                  onChange={(e) => updateFormData({ maxHeight: Number(e.target.value) })}
                  placeholder="ความสูงสูงสุด"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="zone-hazardous">อนุญาตสินค้าอันตราย</Label>
                <Switch
                  id="zone-hazardous"
                  checked={formData.hazardousAllowed}
                  onCheckedChange={(checked) => updateFormData({ hazardousAllowed: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="zone-fragile">สินค้าเปราะบางเท่านั้น</Label>
                <Switch
                  id="zone-fragile"
                  checked={formData.fragileOnly}
                  onCheckedChange={(checked) => updateFormData({ fragileOnly: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="zone-climate">ควบคุมสภาพแวดล้อม</Label>
                <Switch
                  id="zone-climate"
                  checked={formData.climateControlled}
                  onCheckedChange={(checked) => updateFormData({ climateControlled: checked })}
                />
              </div>
            </div>
          </div>
          
          {formData.climateControlled && (
            <div>
              <h5 className="text-sm font-medium mb-3 mt-4">การควบคุมสภาพแวดล้อม</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zone-temp-min">อุณหภูมิต่ำสุด (°C)</Label>
                  <Input
                    id="zone-temp-min"
                    type="number"
                    value={formData.temperatureMin || ''}
                    onChange={(e) => updateFormData({ temperatureMin: Number(e.target.value) })}
                    placeholder="อุณหภูมิต่ำสุด"
                  />
                </div>
                <div>
                  <Label htmlFor="zone-temp-max">อุณหภูมิสูงสุด (°C)</Label>
                  <Input
                    id="zone-temp-max"
                    type="number"
                    value={formData.temperatureMax || ''}
                    onChange={(e) => updateFormData({ temperatureMax: Number(e.target.value) })}
                    placeholder="อุณหภูมิสูงสุด"
                  />
                </div>
                <div>
                  <Label htmlFor="zone-humidity-min">ความชื้นต่ำสุด (%)</Label>
                  <Input
                    id="zone-humidity-min"
                    type="number"
                    value={formData.humidityMin || ''}
                    onChange={(e) => updateFormData({ humidityMin: Number(e.target.value) })}
                    placeholder="ความชื้นต่ำสุด"
                  />
                </div>
                <div>
                  <Label htmlFor="zone-humidity-max">ความชื้นสูงสุด (%)</Label>
                  <Input
                    id="zone-humidity-max"
                    type="number"
                    value={formData.humidityMax || ''}
                    onChange={(e) => updateFormData({ humidityMax: Number(e.target.value) })}
                    placeholder="ความชื้นสูงสุด"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {editingZone ? 'อัปเดต' : 'สร้าง'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ZoneForm;
export type { ZoneFormData };