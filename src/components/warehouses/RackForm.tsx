import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageRack } from '@/types/warehouse';
import {
  Grid,
  List,
  Package,
  MapPin,
  Activity
} from 'lucide-react';

interface RackFormData {
  code: string;
  type: StorageRack['type'];
  width: number;
  height: number;
  depth: number;
  levels: number;
  capacity: number;
}

interface RackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: RackFormData;
  onFormDataChange: (data: RackFormData) => void;
  editingRack: StorageRack | null;
  loading: boolean;
  onSubmit: () => void;
}

const RACK_TYPES = [
  { value: 'pallet', label: 'พาเลท', icon: Grid },
  { value: 'shelf', label: 'ชั้นวาง', icon: List },
  { value: 'bin', label: 'ถัง/กล่อง', icon: Package },
  { value: 'floor', label: 'พื้น', icon: MapPin },
  { value: 'hanging', label: 'แขวน', icon: Activity }
] as const;

export function RackForm({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  editingRack,
  loading,
  onSubmit
}: RackFormProps) {
  const updateFormData = (updates: Partial<RackFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingRack ? 'แก้ไขชั้นวาง' : 'เพิ่มชั้นวางใหม่'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rack-code">รหัสชั้นวาง</Label>
              <Input
                id="rack-code"
                value={formData.code}
                onChange={(e) => updateFormData({ code: e.target.value })}
                placeholder="รหัสชั้นวาง"
              />
            </div>
            <div>
              <Label htmlFor="rack-type">ประเภทชั้นวาง</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: StorageRack['type']) => updateFormData({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RACK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>ขนาด (เมตร)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rack-width">กว้าง</Label>
                <Input
                  id="rack-width"
                  type="number"
                  step="0.1"
                  value={formData.width}
                  onChange={(e) => updateFormData({ width: Number(e.target.value) })}
                  placeholder="กว้าง"
                />
              </div>
              <div>
                <Label htmlFor="rack-height">สูง</Label>
                <Input
                  id="rack-height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => updateFormData({ height: Number(e.target.value) })}
                  placeholder="สูง"
                />
              </div>
              <div>
                <Label htmlFor="rack-depth">ลึก</Label>
                <Input
                  id="rack-depth"
                  type="number"
                  step="0.1"
                  value={formData.depth}
                  onChange={(e) => updateFormData({ depth: Number(e.target.value) })}
                  placeholder="ลึก"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rack-levels">จำนวนชั้น</Label>
              <Input
                id="rack-levels"
                type="number"
                min="1"
                value={formData.levels}
                onChange={(e) => updateFormData({ levels: Number(e.target.value) })}
                placeholder="จำนวนชั้น"
              />
            </div>
            <div>
              <Label htmlFor="rack-capacity">ความจุ</Label>
              <Input
                id="rack-capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => updateFormData({ capacity: Number(e.target.value) })}
                placeholder="ความจุ"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {editingRack ? 'อัปเดต' : 'สร้าง'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RackForm;
export type { RackFormData };