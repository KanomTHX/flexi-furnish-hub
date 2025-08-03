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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  Calendar,
  Settings,
  Shield,
  Database,
  Users,
  Lock,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Play
} from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportConfig {
  type: string;
  format: string;
  dateRange: {
    start: string;
    end: string;
  };
  sections: string[];
  includeCharts: boolean;
  includeRecommendations: boolean;
  confidentialityLevel: string;
}

export const ComplianceReportDialog: React.FC<ComplianceReportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { generateComplianceReport } = useAudit();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'comprehensive',
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    sections: ['accessControl', 'dataIntegrity', 'auditTrail'],
    includeCharts: true,
    includeRecommendations: true,
    confidentialityLevel: 'internal'
  });

  const reportTypes = [
    {
      id: 'comprehensive',
      name: 'รายงานครอบคลุม',
      description: 'รายงานการปฏิบัติตามทุกด้านอย่างละเอียด',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'executive',
      name: 'รายงานผู้บริหาร',
      description: 'สรุปสำหรับผู้บริหารระดับสูง',
      icon: <Eye className="h-5 w-5" />
    },
    {
      id: 'technical',
      name: 'รายงานเทคนิค',
      description: 'รายละเอียดเทคนิคสำหรับทีม IT',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'regulatory',
      name: 'รายงานกำกับดูแล',
      description: 'รายงานสำหรับหน่วยงานกำกับดูแล',
      icon: <Shield className="h-5 w-5" />
    }
  ];

  const complianceSections = [
    {
      id: 'accessControl',
      name: 'การควบคุมการเข้าถึง',
      description: 'การจัดการสิทธิ์และการเข้าถึงระบบ',
      icon: <Lock className="h-4 w-4" />
    },
    {
      id: 'dataIntegrity',
      name: 'ความสมบูรณ์ของข้อมูล',
      description: 'การตรวจสอบความถูกต้องและครบถ้วนของข้อมูล',
      icon: <Database className="h-4 w-4" />
    },
    {
      id: 'auditTrail',
      name: 'บันทึกการตรวจสอบ',
      description: 'การติดตามและบันทึกกิจกรรมทั้งหมด',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'userManagement',
      name: 'การจัดการผู้ใช้',
      description: 'การจัดการบัญชีผู้ใช้และสิทธิ์',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'systemSecurity',
      name: 'ความปลอดภัยระบบ',
      description: 'การรักษาความปลอดภัยของระบบ',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'changeManagement',
      name: 'การจัดการการเปลี่ยนแปลง',
      description: 'การควบคุมและติดตามการเปลี่ยนแปลง',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setReportConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate report generation progress
    const progressSteps = [
      { step: 'กำลังรวบรวมข้อมูล...', progress: 20 },
      { step: 'กำลังวิเคราะห์การปฏิบัติตาม...', progress: 40 },
      { step: 'กำลังสร้างกราฟและแผนภูมิ...', progress: 60 },
      { step: 'กำลังจัดรูปแบบรายงาน...', progress: 80 },
      { step: 'กำลังสร้างไฟล์รายงาน...', progress: 100 }
    ];

    for (const { step, progress } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress(progress);
      
      toast({
        title: step,
        description: `ความคืบหน้า ${progress}%`
      });
    }

    // Generate actual report
    generateComplianceReport(
      reportConfig.type,
      reportConfig.dateRange.start,
      reportConfig.dateRange.end
    );

    toast({
      title: "สร้างรายงานสำเร็จ! 🎉",
      description: `รายงานการปฏิบัติตาม${reportConfig.type}ถูกสร้างเรียบร้อยแล้ว`
    });

    setIsGenerating(false);
    setCurrentStep(1);
    onOpenChange(false);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            สร้างรายงานการปฏิบัติตาม
          </DialogTitle>
          <DialogDescription>
            สร้างรายงานการปฏิบัติตามมาตรฐานและข้อกำหนดต่างๆ
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              <div className={`ml-2 text-sm ${
                currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {step === 1 && 'เลือกประเภท'}
                {step === 2 && 'กำหนดค่า'}
                {step === 3 && 'สร้างรายงาน'}
              </div>
              {step < 3 && (
                <div className={`w-16 h-0.5 ml-4 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Report Type Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">เลือกประเภทรายงาน</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      reportConfig.type === type.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setReportConfig(prev => ({ ...prev, type: type.id }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          reportConfig.type === type.id 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{type.name}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                        {reportConfig.type === type.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">รูปแบบไฟล์</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'pdf', name: 'PDF', icon: '📄' },
                  { id: 'excel', name: 'Excel', icon: '📊' },
                  { id: 'word', name: 'Word', icon: '📝' },
                  { id: 'html', name: 'HTML', icon: '🌐' }
                ].map((format) => (
                  <Button
                    key={format.id}
                    variant={reportConfig.format === format.id ? 'default' : 'outline'}
                    className="h-16 flex-col gap-2"
                    onClick={() => setReportConfig(prev => ({ ...prev, format: format.id }))}
                  >
                    <span className="text-2xl">{format.icon}</span>
                    <span className="text-sm">{format.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">ช่วงเวลา</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportConfig.dateRange.start}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportConfig.dateRange.end}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">หัวข้อที่ต้องการรวม</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {complianceSections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={reportConfig.sections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {section.icon}
                      <div>
                        <label htmlFor={section.id} className="text-sm font-medium cursor-pointer">
                          {section.name}
                        </label>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">ตัวเลือกเพิ่มเติม</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeCharts"
                    checked={reportConfig.includeCharts}
                    onCheckedChange={(checked) => setReportConfig(prev => ({
                      ...prev,
                      includeCharts: checked as boolean
                    }))}
                  />
                  <label htmlFor="includeCharts" className="text-sm font-medium cursor-pointer">
                    รวมกราฟและแผนภูมิ
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeRecommendations"
                    checked={reportConfig.includeRecommendations}
                    onCheckedChange={(checked) => setReportConfig(prev => ({
                      ...prev,
                      includeRecommendations: checked as boolean
                    }))}
                  />
                  <label htmlFor="includeRecommendations" className="text-sm font-medium cursor-pointer">
                    รวมข้อเสนอแนะ
                  </label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidentiality">ระดับความลับ</Label>
                  <Select
                    value={reportConfig.confidentialityLevel}
                    onValueChange={(value) => setReportConfig(prev => ({
                      ...prev,
                      confidentialityLevel: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">สาธารณะ</SelectItem>
                      <SelectItem value="internal">ภายในองค์กร</SelectItem>
                      <SelectItem value="confidential">ลับ</SelectItem>
                      <SelectItem value="restricted">จำกัด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate Report */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">ตรวจสอบการตั้งค่า</h3>
              
              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="text-base">สรุปการตั้งค่ารายงาน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ประเภทรายงาน:</span>
                    <span className="font-medium">
                      {reportTypes.find(t => t.id === reportConfig.type)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">รูปแบบไฟล์:</span>
                    <span className="font-medium">{reportConfig.format.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ช่วงเวลา:</span>
                    <span className="font-medium">
                      {new Date(reportConfig.dateRange.start).toLocaleDateString('th-TH')} - {' '}
                      {new Date(reportConfig.dateRange.end).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">หัวข้อที่รวม:</span>
                    <span className="font-medium">{reportConfig.sections.length} หัวข้อ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ระดับความลับ:</span>
                    <Badge variant="outline">{reportConfig.confidentialityLevel}</Badge>
                  </div>
                </CardContent>
              </Card>

              {isGenerating && (
                <div className="mt-6">
                  <div className="text-center mb-4">
                    <div className="text-lg font-medium">กำลังสร้างรายงาน...</div>
                    <div className="text-sm text-gray-600 mt-1">
                      กรุณารอสักครู่ ระบบกำลังประมวลผลข้อมูล
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-3" />
                  <div className="text-sm text-gray-600 mt-2">
                    {generationProgress}% เสร็จสิ้น
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              ขั้นตอน {currentStep} จาก 3
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
            
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep}>
                ย้อนกลับ
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button onClick={nextStep}>
                ถัดไป
              </Button>
            ) : (
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {isGenerating ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};