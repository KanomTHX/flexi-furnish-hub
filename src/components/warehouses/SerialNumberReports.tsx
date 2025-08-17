import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Upload, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  Package, 
  MapPin, 
  User, 
  Building, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Printer, 
  Mail, 
  Share2, 
  Settings, 
  RefreshCw, 
  Database, 
  Activity, 
  Zap, 
  Target, 
  Layers, 
  Grid, 
  List, 
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

// Types for Reports
interface SerialNumberReport {
  id: string;
  name: string;
  description: string;
  type: 'inventory' | 'movement' | 'performance' | 'compliance' | 'analytics';
  category: 'operational' | 'financial' | 'regulatory' | 'strategic';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  status: 'active' | 'scheduled' | 'generating' | 'completed' | 'failed';
  lastGenerated?: Date;
  nextScheduled?: Date;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  parameters: {
    dateRange?: DateRange;
    warehouses?: string[];
    categories?: string[];
    suppliers?: string[];
    statuses?: string[];
    customFilters?: Record<string, any>;
  };
  metrics: {
    totalRecords: number;
    processingTime: number; // seconds
    fileSize: number; // bytes
    accuracy: number; // percentage
  };
  recipients?: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface ReportMetrics {
  totalSerialNumbers: number;
  activeSerialNumbers: number;
  inactiveSerialNumbers: number;
  errorSerialNumbers: number;
  totalMovements: number;
  averageMovementsPerDay: number;
  topPerformingWarehouses: {
    warehouseId: string;
    warehouseName: string;
    totalMovements: number;
    accuracy: number;
  }[];
  serialNumbersByCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
  movementTrends: {
    date: string;
    movements: number;
    errors: number;
  }[];
  complianceMetrics: {
    trackingCompliance: number;
    documentationCompliance: number;
    auditCompliance: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: SerialNumberReport['type'];
  category: SerialNumberReport['category'];
  sections: {
    id: string;
    name: string;
    type: 'chart' | 'table' | 'summary' | 'text';
    config: Record<string, any>;
    required: boolean;
  }[];
  defaultParameters: SerialNumberReport['parameters'];
  isDefault: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SerialNumberReportsProps {
  warehouseId?: string;
  onReportGenerated?: (report: SerialNumberReport) => void;
}

export function SerialNumberReports({ warehouseId, onReportGenerated }: SerialNumberReportsProps) {
  const [reports, setReports] = useState<SerialNumberReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [selectedReport, setSelectedReport] = useState<SerialNumberReport | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // New report form state
  const [newReport, setNewReport] = useState<Partial<SerialNumberReport>>({
    name: '',
    description: '',
    type: 'inventory',
    category: 'operational',
    frequency: 'on-demand',
    format: 'pdf',
    parameters: {}
  });

  // Mock data for reports
  const mockReports: SerialNumberReport[] = [
    {
      id: 'report-001',
      name: 'รายงานสินค้าคงคลัง Serial Number',
      description: 'รายงานสรุปสินค้าคงคลังทั้งหมดที่มี Serial Number',
      type: 'inventory',
      category: 'operational',
      frequency: 'daily',
      format: 'pdf',
      status: 'completed',
      lastGenerated: new Date('2024-01-25T08:00:00'),
      nextScheduled: new Date('2024-01-26T08:00:00'),
      createdBy: {
        id: 'user-001',
        name: 'สมชาย ใจดี',
        role: 'ผู้จัดการคลังสินค้า'
      },
      parameters: {
        warehouses: ['wh-001', 'wh-002'],
        categories: ['เฟอร์นิเจอร์', 'เครื่องใช้ไฟฟ้า']
      },
      metrics: {
        totalRecords: 1250,
        processingTime: 45,
        fileSize: 2048576,
        accuracy: 98.5
      },
      recipients: [
        {
          id: 'user-001',
          name: 'สมชาย ใจดี',
          email: 'somchai@company.com',
          role: 'ผู้จัดการคลังสินค้า'
        }
      ]
    },
    {
      id: 'report-002',
      name: 'รายงานการเคลื่อนไหว Serial Number',
      description: 'รายงานการเคลื่อนไหวของ Serial Number ในช่วงเวลาที่กำหนด',
      type: 'movement',
      category: 'operational',
      frequency: 'weekly',
      format: 'excel',
      status: 'generating',
      lastGenerated: new Date('2024-01-18T10:00:00'),
      nextScheduled: new Date('2024-01-25T10:00:00'),
      createdBy: {
        id: 'user-002',
        name: 'สมหญิง รักงาน',
        role: 'นักวิเคราะห์'
      },
      parameters: {
        dateRange: {
          from: new Date('2024-01-18'),
          to: new Date('2024-01-25')
        },
        warehouses: ['wh-001']
      },
      metrics: {
        totalRecords: 850,
        processingTime: 120,
        fileSize: 5242880,
        accuracy: 96.8
      }
    },
    {
      id: 'report-003',
      name: 'รายงานประสิทธิภาพการติดตาม',
      description: 'รายงานวิเคราะห์ประสิทธิภาพการติดตาม Serial Number',
      type: 'performance',
      category: 'strategic',
      frequency: 'monthly',
      format: 'pdf',
      status: 'scheduled',
      lastGenerated: new Date('2024-01-01T09:00:00'),
      nextScheduled: new Date('2024-02-01T09:00:00'),
      createdBy: {
        id: 'user-003',
        name: 'สมปอง ขยัน',
        role: 'ผู้อำนวยการ'
      },
      parameters: {
        warehouses: ['wh-001', 'wh-002', 'wh-003']
      },
      metrics: {
        totalRecords: 2500,
        processingTime: 300,
        fileSize: 10485760,
        accuracy: 99.2
      }
    }
  ];

  // Mock metrics
  const mockMetrics: ReportMetrics = {
    totalSerialNumbers: 15420,
    activeSerialNumbers: 14850,
    inactiveSerialNumbers: 520,
    errorSerialNumbers: 50,
    totalMovements: 8750,
    averageMovementsPerDay: 125,
    topPerformingWarehouses: [
      {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        totalMovements: 4200,
        accuracy: 98.5
      },
      {
        warehouseId: 'wh-002',
        warehouseName: 'คลังสินค้าสาขา 1',
        totalMovements: 2800,
        accuracy: 97.2
      },
      {
        warehouseId: 'wh-003',
        warehouseName: 'คลังสินค้าสาขา 2',
        totalMovements: 1750,
        accuracy: 96.8
      }
    ],
    serialNumbersByCategory: [
      { category: 'เฟอร์นิเจอร์', count: 8500, percentage: 55.1 },
      { category: 'เครื่องใช้ไฟฟ้า', count: 4200, percentage: 27.2 },
      { category: 'อุปกรณ์ตกแต่ง', count: 2720, percentage: 17.7 }
    ],
    movementTrends: [
      { date: '2024-01-19', movements: 120, errors: 2 },
      { date: '2024-01-20', movements: 135, errors: 1 },
      { date: '2024-01-21', movements: 110, errors: 3 },
      { date: '2024-01-22', movements: 145, errors: 1 },
      { date: '2024-01-23', movements: 125, errors: 2 },
      { date: '2024-01-24', movements: 140, errors: 1 },
      { date: '2024-01-25', movements: 130, errors: 2 }
    ],
    complianceMetrics: {
      trackingCompliance: 98.5,
      documentationCompliance: 96.8,
      auditCompliance: 99.2
    }
  };

  // Mock templates
  const mockTemplates: ReportTemplate[] = [
    {
      id: 'template-001',
      name: 'รายงานสินค้าคงคลังมาตรฐาน',
      description: 'เทมเพลตรายงานสินค้าคงคลังพื้นฐาน',
      type: 'inventory',
      category: 'operational',
      sections: [
        {
          id: 'summary',
          name: 'สรุปภาพรวม',
          type: 'summary',
          config: { showTotals: true, showPercentages: true },
          required: true
        },
        {
          id: 'chart',
          name: 'กราฟแสดงข้อมูล',
          type: 'chart',
          config: { chartType: 'bar', showLegend: true },
          required: false
        },
        {
          id: 'details',
          name: 'รายละเอียด',
          type: 'table',
          config: { showPagination: true, itemsPerPage: 50 },
          required: true
        }
      ],
      defaultParameters: {
        warehouses: [],
        categories: []
      },
      isDefault: true,
      createdBy: {
        id: 'system',
        name: 'ระบบ'
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  useEffect(() => {
    setReports(mockReports);
    setTemplates(mockTemplates);
    setMetrics(mockMetrics);
  }, []);

  const generateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    
    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'completed', lastGenerated: new Date() }
          : report
      ));
      setIsGenerating(null);
      
      if (onReportGenerated) {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          onReportGenerated(report);
        }
      }
    }, 3000);
  };

  const downloadReport = (report: SerialNumberReport) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${report.name}.${report.format}`;
    link.click();
  };

  const getStatusBadge = (status: SerialNumberReport['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">ใช้งาน</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 text-white">กำหนดการ</Badge>;
      case 'generating':
        return <Badge className="bg-yellow-500 text-white">กำลังสร้าง</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">เสร็จสิ้น</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">ล้มเหลว</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getTypeIcon = (type: SerialNumberReport['type']) => {
    switch (type) {
      case 'inventory':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'movement':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'performance':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'compliance':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      case 'analytics':
        return <BarChart3 className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            รายงาน Serial Number
          </h2>
          <p className="text-muted-foreground">
            สร้างและจัดการรายงานเกี่ยวกับ Serial Number
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                เมตริกส์
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>เมตริกส์ Serial Number</DialogTitle>
              </DialogHeader>
              {metrics && (
                <div className="space-y-6">
                  {/* Overview Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        {metrics.totalSerialNumbers.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600">Serial Number ทั้งหมด</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {metrics.activeSerialNumbers.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">ใช้งานอยู่</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-700">
                        {metrics.totalMovements.toLocaleString()}
                      </div>
                      <div className="text-sm text-yellow-600">การเคลื่อนไหวทั้งหมด</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {metrics.averageMovementsPerDay}
                      </div>
                      <div className="text-sm text-purple-600">เฉลี่ยต่อวัน</div>
                    </div>
                  </div>

                  {/* Top Performing Warehouses */}
                  <div>
                    <h4 className="font-medium mb-3">คลังสินค้าที่มีประสิทธิภาพสูงสุด</h4>
                    <div className="space-y-2">
                      {metrics.topPerformingWarehouses.map((warehouse, index) => (
                        <div key={warehouse.warehouseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{warehouse.warehouseName}</div>
                              <div className="text-sm text-muted-foreground">
                                {warehouse.totalMovements.toLocaleString()} การเคลื่อนไหว
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">{warehouse.accuracy}%</div>
                            <div className="text-sm text-muted-foreground">ความแม่นยำ</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Metrics */}
                  <div>
                    <h4 className="font-medium mb-3">เมตริกส์การปฏิบัติตามกฎระเบียบ</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-700">
                          {metrics.complianceMetrics.trackingCompliance}%
                        </div>
                        <div className="text-sm text-green-600">การติดตาม</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-700">
                          {metrics.complianceMetrics.documentationCompliance}%
                        </div>
                        <div className="text-sm text-blue-600">เอกสาร</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-700">
                          {metrics.complianceMetrics.auditCompliance}%
                        </div>
                        <div className="text-sm text-purple-600">การตรวจสอบ</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4 mr-2" />
                เทมเพลต
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เทมเพลตรายงาน</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(template.type)}
                          <h4 className="font-medium">{template.name}</h4>
                          {template.isDefault && (
                            <Badge variant="outline" className="text-xs">ค่าเริ่มต้น</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          สร้างโดย: {template.createdBy.name} • 
                          {template.sections.length} ส่วน
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setNewReport({
                              ...newReport,
                              type: template.type,
                              category: template.category,
                              parameters: template.defaultParameters
                            });
                            setShowTemplateDialog(false);
                            setShowCreateDialog(true);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                สร้างรายงาน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>สร้างรายงานใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ชื่อรายงาน</Label>
                    <Input 
                      value={newReport.name || ''}
                      onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ป้อนชื่อรายงาน"
                    />
                  </div>
                  <div>
                    <Label>ประเภทรายงาน</Label>
                    <Select 
                      value={newReport.type} 
                      onValueChange={(value: SerialNumberReport['type']) => 
                        setNewReport(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">สินค้าคงคลัง</SelectItem>
                        <SelectItem value="movement">การเคลื่อนไหว</SelectItem>
                        <SelectItem value="performance">ประสิทธิภาพ</SelectItem>
                        <SelectItem value="compliance">การปฏิบัติตามกฎ</SelectItem>
                        <SelectItem value="analytics">การวิเคราะห์</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>คำอธิบาย</Label>
                  <Textarea 
                    value={newReport.description || ''}
                    onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="อธิบายรายงาน"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>หมวดหมู่</Label>
                    <Select 
                      value={newReport.category} 
                      onValueChange={(value: SerialNumberReport['category']) => 
                        setNewReport(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">ปฏิบัติการ</SelectItem>
                        <SelectItem value="financial">การเงิน</SelectItem>
                        <SelectItem value="regulatory">กฎระเบียบ</SelectItem>
                        <SelectItem value="strategic">ยุทธศาสตร์</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ความถี่</Label>
                    <Select 
                      value={newReport.frequency} 
                      onValueChange={(value: SerialNumberReport['frequency']) => 
                        setNewReport(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">รายวัน</SelectItem>
                        <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                        <SelectItem value="monthly">รายเดือน</SelectItem>
                        <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                        <SelectItem value="yearly">รายปี</SelectItem>
                        <SelectItem value="on-demand">ตามต้องการ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>รูปแบบไฟล์</Label>
                    <Select 
                      value={newReport.format} 
                      onValueChange={(value: SerialNumberReport['format']) => 
                        setNewReport(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    onClick={() => {
                      const report: SerialNumberReport = {
                        id: `report-${Date.now()}`,
                        name: newReport.name || 'รายงานใหม่',
                        description: newReport.description || '',
                        type: newReport.type || 'inventory',
                        category: newReport.category || 'operational',
                        frequency: newReport.frequency || 'on-demand',
                        format: newReport.format || 'pdf',
                        status: 'scheduled',
                        createdBy: {
                          id: 'current-user',
                          name: 'ผู้ใช้ปัจจุบัน',
                          role: 'ผู้ใช้'
                        },
                        parameters: newReport.parameters || {},
                        metrics: {
                          totalRecords: 0,
                          processingTime: 0,
                          fileSize: 0,
                          accuracy: 0
                        }
                      };
                      setReports(prev => [report, ...prev]);
                      setShowCreateDialog(false);
                      setNewReport({
                        name: '',
                        description: '',
                        type: 'inventory',
                        category: 'operational',
                        frequency: 'on-demand',
                        format: 'pdf',
                        parameters: {}
                      });
                    }}
                    disabled={!newReport.name}
                  >
                    สร้างรายงาน
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="ค้นหารายงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="inventory">สินค้าคงคลัง</SelectItem>
                  <SelectItem value="movement">การเคลื่อนไหว</SelectItem>
                  <SelectItem value="performance">ประสิทธิภาพ</SelectItem>
                  <SelectItem value="compliance">การปฏิบัติตามกฎ</SelectItem>
                  <SelectItem value="analytics">การวิเคราะห์</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="scheduled">กำหนดการ</SelectItem>
                  <SelectItem value="generating">กำลังสร้าง</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="failed">ล้มเหลว</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">ไม่มีรายงาน</h3>
            <p className="text-muted-foreground mb-4">ไม่พบรายงานที่ตรงกับเงื่อนไขการค้นหา</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              สร้างรายงานแรก
            </Button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className={viewMode === 'list' ? 'w-full' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(report.type)}
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Report Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ประเภท:</span>
                      <p className="font-medium capitalize">{report.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ความถี่:</span>
                      <p className="font-medium">{report.frequency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">รูปแบบ:</span>
                      <p className="font-medium uppercase">{report.format}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">สร้างโดย:</span>
                      <p className="font-medium">{report.createdBy.name}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  {report.status === 'completed' && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">ระเบียน:</span>
                          <span className="font-medium ml-1">
                            {report.metrics.totalRecords.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ขนาด:</span>
                          <span className="font-medium ml-1">
                            {formatFileSize(report.metrics.fileSize)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">เวลา:</span>
                          <span className="font-medium ml-1">
                            {report.metrics.processingTime}s
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ความแม่นยำ:</span>
                          <span className="font-medium ml-1">
                            {report.metrics.accuracy}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {report.lastGenerated && (
                      <div>สร้างล่าสุด: {formatDate(report.lastGenerated)}</div>
                    )}
                    {report.nextScheduled && (
                      <div>กำหนดการถัดไป: {formatDate(report.nextScheduled)}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {report.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        ดาวน์โหลด
                      </Button>
                    )}
                    {(report.status === 'scheduled' || report.status === 'failed') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateReport(report.id)}
                        disabled={isGenerating === report.id}
                      >
                        {isGenerating === report.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isGenerating === report.id ? 'กำลังสร้าง...' : 'สร้างรายงาน'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      ดู
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      แชร์
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}