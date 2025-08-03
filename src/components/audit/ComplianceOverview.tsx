import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Users,
  Lock,
  Database,
  Settings,
  Calendar,
  Download,
  BarChart3
} from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';
import { useToast } from '@/hooks/use-toast';

interface ComplianceMetrics {
  accessControl: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
  dataIntegrity: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
  changeManagement: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
  auditTrail: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
  userManagement: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
  systemSecurity: {
    score: number;
    status: 'compliant' | 'warning' | 'critical';
    issues: number;
    lastReview: string;
  };
}

interface ComplianceOverviewProps {
  statistics: any;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ statistics }) => {
  const { generateComplianceReport } = useAudit();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'trends'>('overview');

  // Mock compliance metrics - ในระบบจริงจะดึงจาก API
  const complianceMetrics: ComplianceMetrics = {
    accessControl: {
      score: 92,
      status: 'compliant',
      issues: 2,
      lastReview: '2025-01-01'
    },
    dataIntegrity: {
      score: 88,
      status: 'warning',
      issues: 5,
      lastReview: '2024-12-28'
    },
    changeManagement: {
      score: 95,
      status: 'compliant',
      issues: 1,
      lastReview: '2025-01-02'
    },
    auditTrail: {
      score: 98,
      status: 'compliant',
      issues: 0,
      lastReview: '2025-01-03'
    },
    userManagement: {
      score: 85,
      status: 'warning',
      issues: 7,
      lastReview: '2024-12-30'
    },
    systemSecurity: {
      score: 78,
      status: 'critical',
      issues: 12,
      lastReview: '2024-12-25'
    }
  };

  const overallScore = Math.round(
    Object.values(complianceMetrics).reduce((sum, metric) => sum + metric.score, 0) / 
    Object.keys(complianceMetrics).length
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleGenerateReport = (type: string) => {
    generateComplianceReport(type, '2024-01-01', '2025-01-03');
    toast({
      title: "กำลังสร้างรายงาน 📊",
      description: `รายงาน${type}กำลังถูกสร้าง กรุณารอสักครู่`
    });
  };

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            คะแนนการปฏิบัติตามโดยรวม
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-blue-600">{overallScore}%</div>
              <div className="flex items-center gap-2">
                {overallScore >= 90 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-medium">ดีเยี่ยม</span>
                  </>
                ) : overallScore >= 80 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">ดี</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-medium">ต้องปรับปรุง</span>
                  </>
                )}
              </div>
            </div>
            <Button onClick={() => handleGenerateReport('overall')}>
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลดรายงาน
            </Button>
          </div>
          <Progress value={overallScore} className="h-3" />
          <div className="mt-2 text-sm text-gray-600">
            อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            รายละเอียด
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            แนวโน้ม
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Access Control */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.accessControl.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  การควบคุมการเข้าถึง
                  {getStatusIcon(complianceMetrics.accessControl.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.accessControl.score}%</span>
                    <Badge variant={complianceMetrics.accessControl.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.accessControl.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.accessControl.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.accessControl.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Integrity */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.dataIntegrity.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  ความสมบูรณ์ของข้อมูล
                  {getStatusIcon(complianceMetrics.dataIntegrity.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.dataIntegrity.score}%</span>
                    <Badge variant={complianceMetrics.dataIntegrity.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.dataIntegrity.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.dataIntegrity.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.dataIntegrity.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Management */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.changeManagement.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  การจัดการการเปลี่ยนแปลง
                  {getStatusIcon(complianceMetrics.changeManagement.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.changeManagement.score}%</span>
                    <Badge variant={complianceMetrics.changeManagement.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.changeManagement.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.changeManagement.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.changeManagement.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.auditTrail.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  บันทึกการตรวจสอบ
                  {getStatusIcon(complianceMetrics.auditTrail.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.auditTrail.score}%</span>
                    <Badge variant={complianceMetrics.auditTrail.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.auditTrail.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.auditTrail.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.auditTrail.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.userManagement.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  การจัดการผู้ใช้
                  {getStatusIcon(complianceMetrics.userManagement.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.userManagement.score}%</span>
                    <Badge variant={complianceMetrics.userManagement.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.userManagement.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.userManagement.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.userManagement.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Security */}
            <Card className={`border-2 ${getStatusColor(complianceMetrics.systemSecurity.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ความปลอดภัยระบบ
                  {getStatusIcon(complianceMetrics.systemSecurity.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{complianceMetrics.systemSecurity.score}%</span>
                    <Badge variant={complianceMetrics.systemSecurity.issues === 0 ? 'default' : 'destructive'}>
                      {complianceMetrics.systemSecurity.issues} ปัญหา
                    </Badge>
                  </div>
                  <Progress value={complianceMetrics.systemSecurity.score} className="h-2" />
                  <div className="text-xs text-gray-500">
                    ตรวจสอบล่าสุด: {new Date(complianceMetrics.systemSecurity.lastReview).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="space-y-4">
            {Object.entries(complianceMetrics).map(([key, metric]) => (
              <Card key={key} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(metric.status)}
                      {key === 'accessControl' && 'การควบคุมการเข้าถึง'}
                      {key === 'dataIntegrity' && 'ความสมบูรณ์ของข้อมูล'}
                      {key === 'changeManagement' && 'การจัดการการเปลี่ยนแปลง'}
                      {key === 'auditTrail' && 'บันทึกการตรวจสอบ'}
                      {key === 'userManagement' && 'การจัดการผู้ใช้'}
                      {key === 'systemSecurity' && 'ความปลอดภัยระบบ'}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateReport(key)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      รายงาน
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">คะแนน</div>
                      <div className="text-2xl font-bold">{metric.score}%</div>
                      <Progress value={metric.score} className="h-2 mt-2" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">ปัญหาที่พบ</div>
                      <div className="text-2xl font-bold text-red-600">{metric.issues}</div>
                      <div className="text-sm text-gray-500 mt-2">รายการ</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">ตรวจสอบล่าสุด</div>
                      <div className="text-lg font-medium">
                        {new Date(metric.lastReview).toLocaleDateString('th-TH')}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {Math.floor((new Date().getTime() - new Date(metric.lastReview).getTime()) / (1000 * 60 * 60 * 24))} วันที่แล้ว
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                แนวโน้มการปฏิบัติตาม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>กราฟแนวโน้มจะแสดงที่นี่</p>
                <p className="text-sm mt-2">
                  แสดงการเปลี่ยนแปลงคะแนนการปฏิบัติตามในช่วง 6 เดือนที่ผ่านมา
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};