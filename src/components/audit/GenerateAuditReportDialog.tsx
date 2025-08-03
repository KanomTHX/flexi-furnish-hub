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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Shield,
  Activity,
  Users,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  PieChart,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';
import { useToast } from '@/hooks/use-toast';
import { ComplianceReportType, SystemModule, AuditSeverity } from '@/types/audit';
import { DateRange } from 'react-day-picker';

interface GenerateAuditReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html';
type ReportScope = 'full' | 'summary' | 'critical_only' | 'custom';

interface ReportConfig {
  type: ComplianceReportType;
  title: string;
  description: string;
  scope: ReportScope;
  format: ReportFormat;
  dateRange: DateRange | undefined;
  includeCharts: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  modules: SystemModule[];
  severityFilter: AuditSeverity[];
  customFilters: Record<string, any>;
}

export const GenerateAuditReportDialog: React.FC<GenerateAuditReportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { statistics, generateComplianceReport } = useAudit();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'generate'>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'access_control',
    title: '',
    description: '',
    scope: 'full',
    format: 'pdf',
    dateRange: undefined,
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: true,
    modules: [],
    severityFilter: [],
    customFilters: {}
  });

  const reportTypes = [
    {
      value: 'access_control' as ComplianceReportType,
      label: 'การควบคุมการเข้าถึง',
      description: 'รายงานการเข้าสู่ระบบ สิทธิ์การใช้งาน และการยืนยันตัวตน',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      value: 'data_integrity' as ComplianceReportType,
      label: 'ความสมบูรณ์ของข้อมูล',
      description: 'รายงานการเปลี่ยนแปลงข้อมูล การสำรองข้อมูล และความถูกต้อง',
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      value: 'change_management' as ComplianceReportType,
      label: 'การจัดการการเปลี่ยนแปลง',
      description: 'รายงานการเปลี่ยนแปลงระบบ การอัปเดต และการกำหนดค่า',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      value: 'user_activity' as ComplianceReportType,
      label: 'กิจกรรมผู้ใช้',
      description: 'รายงานการใช้งานของผู้ใช้ รูปแบบการทำงาน และพฤติกรรม',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      value: 'security_events' as ComplianceReportType,
      label: 'เหตุการณ์ความปลอดภัย',
      description: 'รายงานเหตุการณ์ที่น่าสงสัย การบุกรุก และมาตรการป้องกัน',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      value: 'system_performance' as ComplianceReportType,
      label: 'ประสิทธิภาพระบบ',
      description: 'รายงานการทำงานของระบบ ข้อผิดพลาด และการใช้ทรัพยากร',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const formatOptions = [
    { value: 'pdf' as ReportFormat, label: 'PDF', icon: FileText, description: 'เอกสาร PDF พร้อมรูปแบบ' },
    { value: 'excel' as ReportFormat, label: 'Excel', icon: BarChart3, description: 'ไฟล์ Excel พร้อมกราฟ' },
    { value: 'csv' as ReportFormat, label: 'CSV', icon: Database, description: 'ข้อมูลดิบในรูปแบบ CSV' },
    { value: 'html' as ReportFormat, label: 'HTML', icon: Eye, description: 'รายงานเว็บไซต์' }
  ];

  const scopeOptions = [
    { value: 'full' as ReportScope, label: 'รายงานเต็ม', description: 'ข้อมูลครบถ้วนทุกรายการ' },
    { value: 'summary' as ReportScope, label: 'สรุปผลการดำเนินงาน', description: 'สรุปสถิติและแนวโน้ม' },
    { value: 'critical_only' as ReportScope, label: 'เฉพาะเหตุการณ์สำคัญ', description: 'เฉพาะเหตุการณ์วิกฤตและสำคัญ' },
    { value: 'custom' as ReportScope, label: 'กำหนดเอง', description: 'ตั้งค่าตัวกรองเอง' }
  ];

  const moduleOptions = [
    { value: 'pos' as SystemModule, label: 'ขายหน้าร้าน' },
    { value: 'inventory' as SystemModule, label: 'สินค้าคงคลัง' },
    { value: 'warehouse' as SystemModule, label: 'คลังสินค้า' },
    { value: 'accounting' as SystemModule, label: 'บัญชี' },
    { value: 'claims' as SystemModule, label: 'การเคลม' },
    { value: 'users' as SystemModule, label: 'ผู้ใช้' },
    { value: 'system' as SystemModule, label: 'ระบบ' },
    { value: 'auth' as SystemModule, label: 'การยืนยันตัวตน' }
  ];

  const severityOptions = [
    { value: 'low' as AuditSeverity, label: 'ต่ำ', color: 'text-gray-600' },
    { value: 'medium' as AuditSeverity, label: 'ปานกลาง', color: 'text-yellow-600' },
    { value: 'high' as AuditSeverity, label: 'สูง', color: 'text-orange-600' },
    { value: 'critical' as AuditSeverity, label: 'วิกฤต', color: 'text-red-600' }
  ];

  const updateConfig = (field: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    updateConfig('dateRange', range);
  };

  const toggleModule = (module: SystemModule) => {
    const currentModules = reportConfig.modules;
    const newModules = currentModules.includes(module)
      ? currentModules.filter(m => m !== module)
      : [...currentModules, module];
    updateConfig('modules', newModules);
  };

  const toggleSeverity = (severity: AuditSeverity) => {
    const currentSeverities = reportConfig.severityFilter;
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity];
    updateConfig('severityFilter', newSeverities);
  };

  const generateReport = async () => {
    if (!reportConfig.title.trim()) {
      toast({
        title: "กรุณากรอกชื่อรายงาน",
        variant: "destructive"
      });
      return;
    }

    if (!reportConfig.dateRange?.from || !reportConfig.dateRange?.to) {
      toast({
        title: "กรุณาเลือกช่วงวันที่",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setActiveTab('generate');

    const steps = [
      'กำลังรวบรวมข้อมูล...',
      'กำลังวิเคราะห์ข้อมูล...',
      'กำลังสร้างกราฟและแผนภูมิ...',
      'กำลังจัดรูปแบบรายงาน...',
      'กำลังสร้างไฟล์รายงาน...',
      'เสร็จสิ้น!'
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(steps[i]);
      setGenerationProgress((i + 1) / steps.length * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate the actual report
    const startDate = reportConfig.dateRange.from.toISOString().split('T')[0];
    const endDate = reportConfig.dateRange.to.toISOString().split('T')[0];
    
    generateComplianceReport(reportConfig.type, startDate, endDate);

    toast({
      title: "สร้างรายงานสำเร็จ! 🎉",
      description: `รายงาน "${reportConfig.title}" ถูกสร้างเรียบร้อยแล้ว`
    });

    setIsGenerating(false);
    onOpenChange(false);
    
    // Reset form
    setReportConfig({
      type: 'access_control',
      title: '',
      description: '',
      scope: 'full',
      format: 'pdf',
      dateRange: undefined,
      includeCharts: true,
      includeDetails: true,
      includeRecommendations: true,
      modules: [],
      severityFilter: [],
      customFilters: {}
    });
    setActiveTab('config');
    setGenerationProgress(0);
    setGenerationStep('');
  };

  const getEstimatedSize = () => {
    const baseSize = reportConfig.format === 'pdf' ? 2 : reportConfig.format === 'excel' ? 1.5 : 0.5;
    const multiplier = reportConfig.scope === 'full' ? 3 : reportConfig.scope === 'summary' ? 1 : 2;
    const chartMultiplier = reportConfig.includeCharts ? 1.5 : 1;
    return Math.round(baseSize * multiplier * chartMultiplier);
  };

  const getEstimatedTime = () => {
    const baseTime = reportConfig.scope === 'full' ? 3 : reportConfig.scope === 'summary' ? 1 : 2;
    const formatMultiplier = reportConfig.format === 'pdf' ? 1.5 : 1;
    return Math.round(baseTime * formatMultiplier);
  };

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="space-y-4">
        <h3 className="font-medium">ประเภทรายงาน</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = reportConfig.type === type.value;
            
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => updateConfig('type', type.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${type.bgColor}`}>
                      <Icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">ชื่อรายงาน *</Label>
          <Input
            id="title"
            value={reportConfig.title}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="กรอกชื่อรายงาน"
          />
        </div>

        <div className="space-y-2">
          <Label>รูปแบบไฟล์</Label>
          <Select 
            value={reportConfig.format} 
            onValueChange={(value) => updateConfig('format', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map(format => {
                const Icon = format.icon;
                return (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{format.label}</span>
                      <span className="text-xs text-muted-foreground">
                        - {format.description}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">คำอธิบายรายงาน</Label>
        <Textarea
          id="description"
          value={reportConfig.description}
          onChange={(e) => updateConfig('description', e.target.value)}
          placeholder="อธิบายวัตถุประสงค์และขอบเขตของรายงาน"
          rows={3}
        />
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>ช่วงวันที่ *</Label>
        <DatePickerWithRange
          date={reportConfig.dateRange}
          onDateChange={handleDateRangeChange}
          placeholder="เลือกช่วงวันที่สำหรับรายงาน"
        />
      </div>

      {/* Report Scope */}
      <div className="space-y-4">
        <Label>ขอบเขตรายงาน</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {scopeOptions.map(scope => (
            <Card 
              key={scope.value}
              className={`cursor-pointer transition-all ${
                reportConfig.scope === scope.value 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => updateConfig('scope', scope.value)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{scope.label}</h4>
                    <p className="text-xs text-muted-foreground">
                      {scope.description}
                    </p>
                  </div>
                  {reportConfig.scope === scope.value && (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-6">
      {/* Report Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            ตัวอย่างรายงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">ชื่อรายงาน</Label>
              <p className="text-sm text-muted-foreground">
                {reportConfig.title || 'ยังไม่ได้กรอกชื่อรายงาน'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">ประเภท</Label>
              <p className="text-sm text-muted-foreground">
                {reportTypes.find(t => t.value === reportConfig.type)?.label}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">ช่วงวันที่</Label>
              <p className="text-sm text-muted-foreground">
                {reportConfig.dateRange?.from && reportConfig.dateRange?.to
                  ? `${reportConfig.dateRange.from.toLocaleDateString('th-TH')} - ${reportConfig.dateRange.to.toLocaleDateString('th-TH')}`
                  : 'ยังไม่ได้เลือกช่วงวันที่'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">รูปแบบ</Label>
              <p className="text-sm text-muted-foreground">
                {formatOptions.find(f => f.value === reportConfig.format)?.label}
              </p>
            </div>
          </div>

          {reportConfig.description && (
            <div>
              <Label className="text-sm font-medium">คำอธิบาย</Label>
              <p className="text-sm text-muted-foreground">
                {reportConfig.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ตัวเลือกเนื้อหา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeCharts"
                checked={reportConfig.includeCharts}
                onCheckedChange={(checked) => updateConfig('includeCharts', checked)}
              />
              <Label htmlFor="includeCharts" className="text-sm">
                รวมกราฟและแผนภูมิ
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeDetails"
                checked={reportConfig.includeDetails}
                onCheckedChange={(checked) => updateConfig('includeDetails', checked)}
              />
              <Label htmlFor="includeDetails" className="text-sm">
                รวมรายละเอียดข้อมูล
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeRecommendations"
                checked={reportConfig.includeRecommendations}
                onCheckedChange={(checked) => updateConfig('includeRecommendations', checked)}
              />
              <Label htmlFor="includeRecommendations" className="text-sm">
                รวมข้อเสนอแนะ
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ข้อมูลประมาณการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>ขนาดไฟล์โดยประมาณ:</span>
              <Badge variant="secondary">{getEstimatedSize()} MB</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>เวลาในการสร้าง:</span>
              <Badge variant="secondary">{getEstimatedTime()} นาที</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>จำนวนบันทึกโดยประมาณ:</span>
              <Badge variant="secondary">{statistics.totalLogs.toLocaleString()}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters (if custom scope) */}
      {reportConfig.scope === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ตัวกรองขั้นสูง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>โมดูลที่ต้องการรวม</Label>
              <div className="grid grid-cols-2 gap-2">
                {moduleOptions.map(module => (
                  <div key={module.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`module-${module.value}`}
                      checked={reportConfig.modules.includes(module.value)}
                      onCheckedChange={() => toggleModule(module.value)}
                    />
                    <Label htmlFor={`module-${module.value}`} className="text-sm">
                      {module.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ระดับความสำคัญ</Label>
              <div className="grid grid-cols-2 gap-2">
                {severityOptions.map(severity => (
                  <div key={severity.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`severity-${severity.value}`}
                      checked={reportConfig.severityFilter.includes(severity.value)}
                      onCheckedChange={() => toggleSeverity(severity.value)}
                    />
                    <Label htmlFor={`severity-${severity.value}`} className={`text-sm ${severity.color}`}>
                      {severity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderGenerateTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          {isGenerating ? (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          ) : (
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          )}
        </div>
        <h3 className="text-lg font-medium">
          {isGenerating ? 'กำลังสร้างรายงาน...' : 'สร้างรายงานเสร็จสิ้น!'}
        </h3>
        <p className="text-muted-foreground">
          {isGenerating ? generationStep : 'รายงานของคุณพร้อมใช้งานแล้ว'}
        </p>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>ความคืบหน้า</span>
            <span>{Math.round(generationProgress)}%</span>
          </div>
          <Progress value={generationProgress} className="w-full" />
        </div>
      )}

      {!isGenerating && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h4 className="font-medium text-green-800 mb-2">
              รายงานถูกสร้างเรียบร้อยแล้ว
            </h4>
            <p className="text-sm text-green-600 mb-4">
              รายงาน "{reportConfig.title}" พร้อมดาวน์โหลดแล้ว
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลดรายงาน
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            สร้างรายงานการตรวจสอบ
          </DialogTitle>
          <DialogDescription>
            สร้างรายงานการตรวจสอบและการปฏิบัติตามกฎระเบียบ
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              การตั้งค่า
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              ตัวอย่าง
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              สร้างรายงาน
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            {renderConfigTab()}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {renderPreviewTab()}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {renderGenerateTab()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {reportConfig.title && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {reportConfig.title}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            
            {activeTab === 'config' && (
              <Button onClick={() => setActiveTab('preview')}>
                ถัดไป
                <Eye className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {activeTab === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setActiveTab('config')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  กลับ
                </Button>
                <Button 
                  onClick={generateReport}
                  disabled={!reportConfig.title || !reportConfig.dateRange}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  สร้างรายงาน
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};