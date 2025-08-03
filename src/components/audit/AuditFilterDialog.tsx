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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Filter,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCcw,
  Search,
  Eye
} from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';
import { useToast } from '@/hooks/use-toast';

interface AuditFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuditFilterDialog: React.FC<AuditFilterDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { 
    clearAuditFilter,
    clearSecurityEventFilter,
    statistics
  } = useAudit();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'audit' | 'security' | 'advanced'>('audit');
  const [searchTerm, setSearchTerm] = useState('');

  const applyFilters = () => {
    toast({
      title: "ใชตวกรองสำเรจ! ",
      description: "ตวกรองไดรบการปรบปรงแลว"
    });
    onOpenChange(false);
  };

  const clearAllFilters = () => {
    clearAuditFilter();
    clearSecurityEventFilter();
    setSearchTerm('');
    
    toast({
      title: "ลางตวกรองแลว",
      description: "ตวกรองทงหมดถกรเซตแลว"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            สำคดกรองขอมลการตรวจสอบ
          </DialogTitle>
          <DialogDescription>
            ตงคาตวกรองเพอคนหาขอมลการตรวจสอบทตองการ
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              บนทกการตรวจสอบ
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              เหตการณความปลอดภย
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              ตวกรองขนสง
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userFilter">ผใช</Label>
                  <Input
                    id="userFilter"
                    placeholder="คนหาผใช..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionFilter">การกระทำ</Label>
                  <Input
                    id="actionFilter"
                    placeholder="คนหาการกระทำ..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moduleFilter">โมดล</Label>
                  <Input
                    id="moduleFilter"
                    placeholder="คนหาโมดล..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">คนหาในรายละเอยด</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="คนหาในคำอธบาย, ชอผใช, ทรพยากร..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipFilter">IP Address</Label>
                  <Input
                    id="ipFilter"
                    placeholder="192.168.1.100"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFilter">วนท</Label>
                  <Input
                    id="dateFilter"
                    type="date"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ประเภทเหตการณ</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="เลอกประเภทเหตการณ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทกประเภท</SelectItem>
                      <SelectItem value="multiple_failed_logins">ความพยายามเขาสระบบลมเหลว</SelectItem>
                      <SelectItem value="suspicious_activity">กจกรรมทนาสงสย</SelectItem>
                      <SelectItem value="unauthorized_access">การเขาถงโดยไมไดรบอนญาต</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>สถานะการแกไข</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="เลอกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทกสถานะ</SelectItem>
                      <SelectItem value="false">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          ยงไมแกไข
                        </div>
                      </SelectItem>
                      <SelectItem value="true">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          แกไขแลว
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="securitySearch">คนหา</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="securitySearch"
                      placeholder="คนหาในคำอธบาย, IP Address..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  สถตปจจบน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>บนทกทงหมด:</span>
                  <Badge variant="secondary">{statistics.totalLogs.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>วนน:</span>
                  <Badge variant="secondary">{statistics.todayLogs}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>เหตการณวกฤต:</span>
                  <Badge variant="destructive">{statistics.criticalEvents}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>การกระทำลมเหลว:</span>
                  <Badge variant="destructive">{statistics.failedActions}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ผใชทใชงาน:</span>
                  <Badge variant="secondary">{statistics.uniqueUsers}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              ตวกรองขนสง
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ยกเลก
            </Button>
            
            <Button variant="outline" onClick={clearAllFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              ลางทงหมด
            </Button>
            
            <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
              <Filter className="h-4 w-4 mr-2" />
              ใชตวกรอง
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
