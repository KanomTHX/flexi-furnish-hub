import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  RotateCcw, 
  Filter,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ClaimFilter {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

interface ClearClaimsFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilter: ClaimFilter;
  onClearFilter: () => void;
}

export function ClearClaimsFiltersDialog({ 
  open, 
  onOpenChange, 
  currentFilter,
  onClearFilter
}: ClearClaimsFiltersDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (currentFilter.status && currentFilter.status !== 'all') count++;
    if (currentFilter.priority && currentFilter.priority !== 'all') count++;
    if (currentFilter.category && currentFilter.category !== 'all') count++;
    if (currentFilter.assignedTo && currentFilter.assignedTo !== 'all') count++;
    if (currentFilter.dateRange?.from || currentFilter.dateRange?.to) count++;
    if (currentFilter.search && currentFilter.search.trim()) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getFilterDetails = () => {
    const details: string[] = [];
    
    if (currentFilter.status && currentFilter.status !== 'all') {
      const statusText = {
        'pending': 'รอดำเนินการ',
        'in-progress': 'กำลังดำเนินการ',
        'resolved': 'แก้ไขแล้ว',
        'closed': 'ปิดแล้ว'
      }[currentFilter.status] || currentFilter.status;
      details.push(`สถานะ: ${statusText}`);
    }
    
    if (currentFilter.priority && currentFilter.priority !== 'all') {
      const priorityText = {
        'high': 'สูง',
        'medium': 'ปานกลาง',
        'low': 'ต่ำ'
      }[currentFilter.priority] || currentFilter.priority;
      details.push(`ความสำคัญ: ${priorityText}`);
    }
    
    if (currentFilter.category && currentFilter.category !== 'all') {
      const categoryText = {
        'defect': 'ของเสีย',
        'damage': 'ชำรุด',
        'warranty': 'การรับประกัน',
        'service': 'บริการ',
        'installation': 'การติดตั้ง',
        'other': 'อื่นๆ'
      }[currentFilter.category] || currentFilter.category;
      details.push(`หมวดหมู่: ${categoryText}`);
    }
    
    if (currentFilter.assignedTo && currentFilter.assignedTo !== 'all') {
      details.push(`ผู้รับผิดชอบ: ${currentFilter.assignedTo}`);
    }
    
    if (currentFilter.dateRange?.from || currentFilter.dateRange?.to) {
      const from = currentFilter.dateRange.from ? new Date(currentFilter.dateRange.from).toLocaleDateString('th-TH') : '';
      const to = currentFilter.dateRange.to ? new Date(currentFilter.dateRange.to).toLocaleDateString('th-TH') : '';
      if (from && to) {
        details.push(`ช่วงวันที่: ${from} - ${to}`);
      } else if (from) {
        details.push(`ตั้งแต่วันที่: ${from}`);
      } else if (to) {
        details.push(`ถึงวันที่: ${to}`);
      }
    }
    
    if (currentFilter.search && currentFilter.search.trim()) {
      details.push(`ค้นหา: "${currentFilter.search}"`);
    }
    
    return details;
  };

  const handleClearFilters = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onClearFilter();
      toast({
        title: "ล้างตัวกรองสำเร็จ",
        description: "ตัวกรองเคลมทั้งหมดถูกล้างแล้ว",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถล้างตัวกรองได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (activeFiltersCount === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ล้างตัวกรองเคลม
            </DialogTitle>
            <DialogDescription>
              จัดการตัวกรองข้อมูลเคลมและการรับประกัน
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-medium mb-2">ไม่มีตัวกรองที่ใช้งาน</h3>
            <p className="text-muted-foreground">
              ขณะนี้ไม่มีตัวกรองใดที่กำลังใช้งานอยู่ในระบบเคลม
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const filterDetails = getFilterDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ล้างตัวกรองเคลม
          </DialogTitle>
          <DialogDescription>
            จัดการตัวกรองข้อมูลเคลมและการรับประกัน ({activeFiltersCount} ตัวกรองที่ใช้งาน)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    ตัวกรองที่ใช้งานทั้งหมด
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {activeFiltersCount} ตัวกรอง
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Filter Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                รายละเอียดตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filterDetails.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Impact Information */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 mb-1">ผลกระทบของการล้างตัวกรอง</div>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>• ข้อมูลเคลมทั้งหมดจะแสดงขึ้นมา</div>
                    <div>• การค้นหาและการกรองจะถูกรีเซ็ต</div>
                    <div>• คุณจะต้องตั้งค่าตัวกรองใหม่หากต้องการกรองข้อมูล</div>
                    <div>• การแสดงผลอาจช้าลงหากมีข้อมูลจำนวนมาก</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-2">สถิติการใช้งานตัวกรอง:</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">ตัวกรองที่ใช้งาน:</span>
                    <span className="ml-2 font-medium">{activeFiltersCount} ตัวกรอง</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ประเภทตัวกรอง:</span>
                    <span className="ml-2 font-medium">
                      {filterDetails.length > 0 ? `${filterDetails.length} ประเภท` : 'ไม่มี'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleClearFilters} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {loading ? 'กำลังล้าง...' : 'ล้างตัวกรองทั้งหมด'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}