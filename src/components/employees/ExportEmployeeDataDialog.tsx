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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Users,
  Calendar,
  DollarSign,
  Clock,
  GraduationCap,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface ExportEmployeeDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportType = 'employees' | 'attendance' | 'payroll' | 'leaves' | 'training';
type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  count: number;
  formats: ExportFormat[];
}

export const ExportEmployeeDataDialog: React.FC<ExportEmployeeDataDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { 
    employees, 
    attendance, 
    payrolls, 
    leaves, 
    trainings,
    departments,
    positions,
    exportEmployees,
    exportAttendance
  } = useEmployees();
  const { toast } = useToast();

  const [selectedExports, setSelectedExports] = useState<ExportType[]>(['employees']);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      id: 'employees',
      name: 'ข้อมูลพนักงาน',
      description: 'ข้อมูลส่วนตัว ตำแหน่ง แผนก เงินเดือน',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: employees.length,
      formats: ['csv', 'excel', 'pdf']
    },
    {
      id: 'attendance',
      name: 'การเข้าทำงาน',
      description: 'บันทึกเวลาเข้า-ออก ชั่วโมงทำงาน',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: attendance.length,
      formats: ['csv', 'excel']
    },
    {
      id: 'payroll',
      name: 'เงินเดือน',
      description: 'รายการจ่ายเงินเดือน โบนัส หักเงิน',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: payrolls.length,
      formats: ['csv', 'excel', 'pdf']
    },
    {
      id: 'leaves',
      name: 'การลา',
      description: 'คำขอลา วันลา สถานะอนุมัติ',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: leaves.length,
      formats: ['csv', 'excel']
    },
    {
      id: 'training',
      name: 'การอบรม',
      description: 'หลักสูตรอบรม ผู้เข้าร่วม ผลการอบรม',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      count: trainings.length,
      formats: ['csv', 'excel', 'pdf']
    }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText, description: 'ไฟล์ข้อความที่แยกด้วยจุลภาค' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'ไฟล์ Microsoft Excel' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'เอกสาร PDF พร้อมรูปแบบ' },
    { value: 'json', label: 'JSON', icon: Database, description: 'ข้อมูลในรูปแบบ JSON' }
  ];

  const handleExportToggle = (exportType: ExportType) => {
    setSelectedExports(prev => 
      prev.includes(exportType)
        ? prev.filter(type => type !== exportType)
        : [...prev, exportType]
    );
  };

  const getAvailableFormats = () => {
    if (selectedExports.length === 0) return [];
    
    const allFormats = selectedExports.map(exportType => {
      const option = exportOptions.find(opt => opt.id === exportType);
      return option?.formats || [];
    });
    
    // Find common formats
    return allFormats.reduce((common, formats) => 
      common.filter(format => formats.includes(format))
    );
  };

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      toast({
        title: "กรุณาเลือกข้อมูลที่ต้องการส่งออก",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const exportType of selectedExports) {
        switch (exportType) {
          case 'employees':
            exportEmployees();
            break;
          case 'attendance':
            exportAttendance();
            break;
          // Add other export functions as needed
        }
      }

      toast({
        title: "ส่งออกข้อมูลสำเร็จ! 🎉",
        description: `ส่งออกข้อมูล ${selectedExports.length} ประเภทเรียบร้อยแล้ว`
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาดในการส่งออกข้อมูล",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTotalRecords = () => {
    return selectedExports.reduce((total, exportType) => {
      const option = exportOptions.find(opt => opt.id === exportType);
      return total + (option?.count || 0);
    }, 0);
  };

  const getEstimatedFileSize = () => {
    const totalRecords = getTotalRecords();
    const avgRecordSize = exportFormat === 'pdf' ? 2 : exportFormat === 'excel' ? 1.5 : 0.5;
    return Math.round(totalRecords * avgRecordSize);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            ส่งออกข้อมูลพนักงาน
          </DialogTitle>
          <DialogDescription>
            เลือกประเภทข้อมูลและรูปแบบไฟล์ที่ต้องการส่งออก
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">เลือกข้อมูล</TabsTrigger>
            <TabsTrigger value="format">รูปแบบไฟล์</TabsTrigger>
            <TabsTrigger value="filters">ตัวกรอง</TabsTrigger>
          </TabsList>

          {/* Data Selection Tab */}
          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-3">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedExports.includes(option.id);
                
                return (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleExportToggle(option.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleExportToggle(option.id)}
                        />
                        <div className={`p-2 rounded-lg ${option.bgColor}`}>
                          <Icon className={`h-5 w-5 ${option.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{option.name}</h3>
                            <Badge variant="secondary">
                              {option.count.toLocaleString()} รายการ
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {option.formats.map(format => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedExports.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">สรุปการเลือก</span>
                  </div>
                  <div className="mt-2 text-sm text-blue-600">
                    เลือกข้อมูล {selectedExports.length} ประเภท • 
                    รวม {getTotalRecords().toLocaleString()} รายการ
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Format Selection Tab */}
          <TabsContent value="format" className="space-y-4">
            <div className="grid gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                const isAvailable = getAvailableFormats().includes(format.value as ExportFormat);
                const isSelected = exportFormat === format.value;
                
                return (
                  <Card 
                    key={format.value}
                    className={`cursor-pointer transition-all ${
                      !isAvailable 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isSelected 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => isAvailable && setExportFormat(format.value as ExportFormat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{format.label}</h3>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                            {!isAvailable && (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedExports.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">ข้อมูลไฟล์</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-green-600">
                    <div>รูปแบบ: {exportFormat.toUpperCase()}</div>
                    <div>ขนาดโดยประมาณ: {getEstimatedFileSize()} KB</div>
                    <div>จำนวนไฟล์: {selectedExports.length} ไฟล์</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>แผนก</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกแผนก</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>สถานะพนักงาน</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ทำงานอยู่</SelectItem>
                    <SelectItem value="inactive">ไม่ทำงาน</SelectItem>
                    <SelectItem value="on-leave">ลาพัก</SelectItem>
                    <SelectItem value="terminated">ออกจากงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ช่วงวันที่ (สำหรับข้อมูลที่มีวันที่)</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="เลือกช่วงวันที่"
              />
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-700">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">ตัวกรองที่ใช้</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-yellow-600">
                  <div>แผนก: {selectedDepartment === 'all' ? 'ทุกแผนก' : departments.find(d => d.id === selectedDepartment)?.name}</div>
                  <div>สถานะ: {selectedStatus === 'all' ? 'ทุกสถานะ' : selectedStatus}</div>
                  <div>ช่วงวันที่: {dateRange ? `${dateRange.from?.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}` : 'ไม่ระบุ'}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedExports.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedExports.length} ประเภท
                </Badge>
                <Badge variant="secondary">
                  {getTotalRecords().toLocaleString()} รายการ
                </Badge>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedExports.length === 0 || isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  กำลังส่งออก...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออกข้อมูล
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};