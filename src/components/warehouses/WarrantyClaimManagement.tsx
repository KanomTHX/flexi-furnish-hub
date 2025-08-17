import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Camera,
  Upload,
  Download,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Wrench,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  History,
  Bell,
  Settings,
  QrCode,
  Scan,
  Tag,
  Building,
  Truck,
  CheckSquare,
  AlertCircle,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Paperclip,
  Image,
  FileImage,
  FileVideo,
  File,
  ExternalLink,
  Copy,
  Share2,
  PrinterIcon,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

// Type Definitions
interface WarrantyRecord {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  productCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  purchaseDate: Date;
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  warrantyPeriod: number; // months
  warrantyType: WarrantyType;
  status: WarrantyStatus;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  purchasePrice: number;
  registrationDate: Date;
  registeredBy: string;
  notes?: string;
  documents: WarrantyDocument[];
  claims: ClaimRecord[];
  maintenanceRecords: MaintenanceRecord[];
}

interface ClaimRecord {
  id: string;
  claimNumber: string;
  warrantyId: string;
  serialNumber: string;
  customerId: string;
  customerName: string;
  issueDescription: string;
  issueCategory: ClaimCategory;
  severity: ClaimSeverity;
  status: ClaimStatus;
  priority: ClaimPriority;
  reportedDate: Date;
  assignedTo?: string;
  assignedDate?: Date;
  inspectionDate?: Date;
  resolutionDate?: Date;
  estimatedCost: number;
  actualCost: number;
  resolution?: string;
  resolutionType: ResolutionType;
  customerSatisfaction?: number;
  feedback?: string;
  documents: ClaimDocument[];
  communications: ClaimCommunication[];
  timeline: ClaimTimelineEvent[];
  isValidClaim: boolean;
  rejectionReason?: string;
  replacementSerialNumber?: string;
  refundAmount?: number;
}

interface MaintenanceRecord {
  id: string;
  warrantyId: string;
  serialNumber: string;
  maintenanceType: 'preventive' | 'corrective' | 'inspection';
  description: string;
  performedDate: Date;
  performedBy: string;
  cost: number;
  nextMaintenanceDate?: Date;
  notes?: string;
  documents: MaintenanceDocument[];
}

interface WarrantyDocument {
  id: string;
  name: string;
  type: 'invoice' | 'warranty_card' | 'manual' | 'certificate' | 'photo' | 'other';
  url: string;
  uploadedBy: string;
  uploadedDate: Date;
  size: number;
}

interface ClaimDocument {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'report' | 'invoice' | 'receipt' | 'inspection' | 'other';
  url: string;
  uploadedBy: string;
  uploadedDate: Date;
  size: number;
  description?: string;
}

interface MaintenanceDocument {
  id: string;
  name: string;
  type: 'report' | 'invoice' | 'photo' | 'certificate' | 'other';
  url: string;
  uploadedBy: string;
  uploadedDate: Date;
  size: number;
}

interface ClaimCommunication {
  id: string;
  claimId: string;
  type: 'email' | 'phone' | 'sms' | 'note' | 'meeting';
  direction: 'inbound' | 'outbound';
  subject?: string;
  message: string;
  sentBy: string;
  sentTo: string;
  sentDate: Date;
  attachments: string[];
}

interface ClaimTimelineEvent {
  id: string;
  claimId: string;
  eventType: 'created' | 'assigned' | 'inspected' | 'approved' | 'rejected' | 'resolved' | 'closed' | 'reopened';
  description: string;
  performedBy: string;
  performedDate: Date;
  notes?: string;
}

interface WarrantyMetrics {
  totalWarranties: number;
  activeWarranties: number;
  expiredWarranties: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  averageResolutionTime: number;
  customerSatisfactionRate: number;
  claimApprovalRate: number;
  totalClaimCost: number;
  averageClaimCost: number;
}

type WarrantyType = 'manufacturer' | 'extended' | 'service' | 'replacement';
type WarrantyStatus = 'active' | 'expired' | 'voided' | 'transferred';
type ClaimCategory = 'defect' | 'damage' | 'malfunction' | 'missing_parts' | 'installation' | 'other';
type ClaimSeverity = 'low' | 'medium' | 'high' | 'critical';
type ClaimStatus = 'submitted' | 'under_review' | 'investigating' | 'approved' | 'rejected' | 'in_progress' | 'resolved' | 'closed';
type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';
type ResolutionType = 'repair' | 'replace' | 'refund' | 'credit' | 'no_action';

// Mock Data
const mockWarranties: WarrantyRecord[] = [
  {
    id: '1',
    serialNumber: 'SF001-2024-001',
    productId: 'P001',
    productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort Plus',
    productCode: 'SF-001',
    customerId: 'C001',
    customerName: 'สมชาย ใจดี',
    customerEmail: 'somchai@email.com',
    customerPhone: '081-234-5678',
    purchaseDate: new Date('2024-01-15'),
    warrantyStartDate: new Date('2024-01-15'),
    warrantyEndDate: new Date('2026-01-15'),
    warrantyPeriod: 24,
    warrantyType: 'manufacturer',
    status: 'active',
    supplierId: 'S001',
    supplierName: 'Furniture Pro Co., Ltd.',
    invoiceNumber: 'INV-2024-001',
    purchasePrice: 25000,
    registrationDate: new Date('2024-01-16'),
    registeredBy: 'พนักงานขาย',
    notes: 'ลูกค้า VIP - ให้บริการพิเศษ',
    documents: [
      {
        id: '1',
        name: 'ใบเสร็จรับเงิน',
        type: 'invoice',
        url: '/documents/invoice-001.pdf',
        uploadedBy: 'พนักงานขาย',
        uploadedDate: new Date('2024-01-16'),
        size: 245760
      },
      {
        id: '2',
        name: 'บัตรรับประกัน',
        type: 'warranty_card',
        url: '/documents/warranty-card-001.pdf',
        uploadedBy: 'พนักงานขาย',
        uploadedDate: new Date('2024-01-16'),
        size: 156432
      }
    ],
    claims: [],
    maintenanceRecords: []
  },
  {
    id: '2',
    serialNumber: 'TB001-2024-002',
    productId: 'P002',
    productName: 'โต๊ะกาแฟ รุ่น Modern Style',
    productCode: 'TB-001',
    customerId: 'C002',
    customerName: 'สุดา ขยัน',
    customerEmail: 'suda@email.com',
    customerPhone: '082-345-6789',
    purchaseDate: new Date('2024-01-10'),
    warrantyStartDate: new Date('2024-01-10'),
    warrantyEndDate: new Date('2025-01-10'),
    warrantyPeriod: 12,
    warrantyType: 'manufacturer',
    status: 'active',
    supplierId: 'S002',
    supplierName: 'Wood Craft Ltd.',
    invoiceNumber: 'INV-2024-002',
    purchasePrice: 8000,
    registrationDate: new Date('2024-01-11'),
    registeredBy: 'พนักงานขาย',
    documents: [],
    claims: [],
    maintenanceRecords: []
  }
];

const mockClaims: ClaimRecord[] = [
  {
    id: '1',
    claimNumber: 'CLM-2024-001',
    warrantyId: '1',
    serialNumber: 'SF001-2024-001',
    customerId: 'C001',
    customerName: 'สมชาย ใจดี',
    issueDescription: 'เบาะโซฟาเริ่มยุบและมีเสียงดังเมื่อนั่ง อาจเป็นปัญหาที่สปริงภายใน',
    issueCategory: 'defect',
    severity: 'medium',
    status: 'under_review',
    priority: 'medium',
    reportedDate: new Date('2024-01-20'),
    assignedTo: 'ช่างเทคนิค A',
    assignedDate: new Date('2024-01-21'),
    estimatedCost: 2000,
    actualCost: 0,
    resolutionType: 'repair',
    isValidClaim: true,
    documents: [
      {
        id: '1',
        name: 'รูปถ่ายปัญหา 1',
        type: 'photo',
        url: '/images/claim-001-1.jpg',
        uploadedBy: 'สมชาย ใจดี',
        uploadedDate: new Date('2024-01-20'),
        size: 1024000,
        description: 'รูปแสดงตำแหน่งที่เบาะยุบ'
      },
      {
        id: '2',
        name: 'รูปถ่ายปัญหา 2',
        type: 'photo',
        url: '/images/claim-001-2.jpg',
        uploadedBy: 'สมชาย ใจดี',
        uploadedDate: new Date('2024-01-20'),
        size: 856000,
        description: 'รูปแสดงมุมมองด้านข้าง'
      }
    ],
    communications: [
      {
        id: '1',
        claimId: '1',
        type: 'email',
        direction: 'inbound',
        subject: 'แจ้งปัญหาโซฟา',
        message: 'เรียนเจ้าหน้าที่ ขอแจ้งปัญหาโซฟาที่ซื้อไป เบาะเริ่มยุบและมีเสียงดัง',
        sentBy: 'สมชาย ใจดี',
        sentTo: 'ฝ่ายบริการลูกค้า',
        sentDate: new Date('2024-01-20T09:30:00'),
        attachments: []
      },
      {
        id: '2',
        claimId: '1',
        type: 'email',
        direction: 'outbound',
        subject: 'Re: แจ้งปัญหาโซฟา',
        message: 'ขอบคุณสำหรับการแจ้ง เราได้รับเรื่องแล้วและจะมีเจ้าหน้าที่ติดต่อกลับภายใน 24 ชั่วโมง',
        sentBy: 'ฝ่ายบริการลูกค้า',
        sentTo: 'สมชาย ใจดี',
        sentDate: new Date('2024-01-20T10:15:00'),
        attachments: []
      }
    ],
    timeline: [
      {
        id: '1',
        claimId: '1',
        eventType: 'created',
        description: 'สร้างคำขอเคลม',
        performedBy: 'สมชาย ใจดี',
        performedDate: new Date('2024-01-20T09:30:00')
      },
      {
        id: '2',
        claimId: '1',
        eventType: 'assigned',
        description: 'มอบหมายให้ช่างเทคนิค A',
        performedBy: 'ฝ่ายบริการลูกค้า',
        performedDate: new Date('2024-01-21T08:00:00')
      }
    ]
  }
];

const mockMetrics: WarrantyMetrics = {
  totalWarranties: 1250,
  activeWarranties: 980,
  expiredWarranties: 270,
  totalClaims: 45,
  pendingClaims: 8,
  approvedClaims: 32,
  rejectedClaims: 5,
  averageResolutionTime: 3.2,
  customerSatisfactionRate: 4.3,
  claimApprovalRate: 86.4,
  totalClaimCost: 125000,
  averageClaimCost: 2777
};

export function WarrantyClaimManagement() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>(mockWarranties);
  const [claims, setClaims] = useState<ClaimRecord[]>(mockClaims);
  const [metrics, setMetrics] = useState<WarrantyMetrics>(mockMetrics);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [showWarrantyDialog, setShowWarrantyDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [showCreateClaimDialog, setShowCreateClaimDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | ClaimStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [claimSearchTerm, setClaimSearchTerm] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState<ClaimStatus | 'all'>('all');

  // Helper Functions
  const getWarrantyStatusColor = (status: WarrantyStatus): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'voided': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClaimStatusColor = (status: ClaimStatus): string => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-teal-100 text-teal-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: ClaimSeverity): string => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatusText = (status: WarrantyStatus): string => {
    switch (status) {
      case 'active': return 'ใช้งานได้';
      case 'expired': return 'หมดอายุ';
      case 'voided': return 'ยกเลิก';
      case 'transferred': return 'โอนย้าย';
      default: return status;
    }
  };

  const getClaimStatusText = (status: ClaimStatus): string => {
    switch (status) {
      case 'submitted': return 'ส่งคำขอแล้ว';
      case 'under_review': return 'กำลังตรวจสอบ';
      case 'investigating': return 'กำลังสอบสวน';
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ปฏิเสธ';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'resolved': return 'แก้ไขแล้ว';
      case 'closed': return 'ปิดเรื่อง';
      default: return status;
    }
  };

  const getSeverityText = (severity: ClaimSeverity): string => {
    switch (severity) {
      case 'low': return 'ต่ำ';
      case 'medium': return 'ปานกลาง';
      case 'high': return 'สูง';
      case 'critical': return 'วิกฤต';
      default: return severity;
    }
  };

  const getCategoryText = (category: ClaimCategory): string => {
    switch (category) {
      case 'defect': return 'ของเสีย';
      case 'damage': return 'ความเสียหาย';
      case 'malfunction': return 'ทำงานผิดปกติ';
      case 'missing_parts': return 'ชิ้นส่วนหาย';
      case 'installation': return 'การติดตั้ง';
      case 'other': return 'อื่นๆ';
      default: return category;
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, 'dd MMM yyyy', { locale: th });
  };

  const formatDateTime = (date: Date): string => {
    return format(date, 'dd MMM yyyy HH:mm', { locale: th });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const isWarrantyExpired = (endDate: Date): boolean => {
    return new Date() > endDate;
  };

  const getDaysUntilExpiry = (endDate: Date): number => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = warranty.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || warranty.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                         claim.serialNumber.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                         claim.customerName.toLowerCase().includes(claimSearchTerm.toLowerCase());
    const matchesStatus = claimStatusFilter === 'all' || claim.status === claimStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateClaim = (warrantyId: string) => {
    const warranty = warranties.find(w => w.id === warrantyId);
    if (warranty) {
      setSelectedWarranty(warranty);
      setShowCreateClaimDialog(true);
    }
  };

  const handleUpdateClaimStatus = (claimId: string, newStatus: ClaimStatus) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updatedTimeline = [...claim.timeline, {
          id: Date.now().toString(),
          claimId,
          eventType: newStatus as any,
          description: `อัปเดตสถานะเป็น ${getClaimStatusText(newStatus)}`,
          performedBy: 'ผู้ใช้ปัจจุบัน',
          performedDate: new Date()
        }];
        
        return {
          ...claim,
          status: newStatus,
          timeline: updatedTimeline,
          ...(newStatus === 'resolved' && { resolutionDate: new Date() })
        };
      }
      return claim;
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ระบบจัดการการรับประกันและเคลม</h1>
          <p className="text-muted-foreground">จัดการการรับประกัน ติดตามเคลม และบริการหลังการขาย</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            สแกน SN
          </Button>
          <Button onClick={() => setShowCreateClaimDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างเคลมใหม่
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="warranties">การรับประกัน</TabsTrigger>
          <TabsTrigger value="claims">เคลม</TabsTrigger>
          <TabsTrigger value="maintenance">การบำรุงรักษา</TabsTrigger>
          <TabsTrigger value="analytics">รายงาน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">การรับประกันทั้งหมด</p>
                    <p className="text-2xl font-bold">{metrics.totalWarranties}</p>
                    <p className="text-xs text-green-600">ใช้งานได้ {metrics.activeWarranties} รายการ</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เคลมทั้งหมด</p>
                    <p className="text-2xl font-bold">{metrics.totalClaims}</p>
                    <p className="text-xs text-yellow-600">รอดำเนินการ {metrics.pendingClaims} รายการ</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">อัตราการอนุมัติ</p>
                    <p className="text-2xl font-bold">{metrics.claimApprovalRate}%</p>
                    <p className="text-xs text-green-600">เพิ่มขึ้น 2.3%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ค่าใช้จ่ายเคลม</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalClaimCost)}</p>
                    <p className="text-xs text-muted-foreground">เฉลี่ย {formatCurrency(metrics.averageClaimCost)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  ประสิทธิภาพการดำเนินงาน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">เวลาแก้ไขเฉลี่ย</span>
                  <span className="text-sm font-bold">{metrics.averageResolutionTime} วัน</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ความพึงพอใจลูกค้า</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold">{metrics.customerSatisfactionRate}/5.0</span>
                  </div>
                </div>
                <Progress value={(metrics.customerSatisfactionRate / 5) * 100} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  แนวโน้มเคลม
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mr-2" />
                  กราฟแสดงแนวโน้มเคลมรายเดือน
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  การรับประกันที่ใกล้หมดอายุ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {warranties
                    .filter(w => w.status === 'active')
                    .sort((a, b) => a.warrantyEndDate.getTime() - b.warrantyEndDate.getTime())
                    .slice(0, 5)
                    .map((warranty) => {
                      const daysLeft = getDaysUntilExpiry(warranty.warrantyEndDate);
                      return (
                        <div key={warranty.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{warranty.productName}</p>
                            <p className="text-sm text-muted-foreground">SN: {warranty.serialNumber}</p>
                            <p className="text-sm text-muted-foreground">{warranty.customerName}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={daysLeft <= 30 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                              {daysLeft > 0 ? `${daysLeft} วัน` : 'หมดอายุแล้ว'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(warranty.warrantyEndDate)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  เคลมที่ต้องดำเนินการ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {claims
                    .filter(c => ['submitted', 'under_review', 'investigating'].includes(c.status))
                    .sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime())
                    .slice(0, 5)
                    .map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{claim.claimNumber}</p>
                          <p className="text-sm text-muted-foreground">SN: {claim.serialNumber}</p>
                          <p className="text-sm text-muted-foreground">{claim.customerName}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getClaimStatusColor(claim.status)}>
                            {getClaimStatusText(claim.status)}
                          </Badge>
                          <Badge className={getSeverityColor(claim.severity)} size="sm">
                            {getSeverityText(claim.severity)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Warranties Tab */}
        <TabsContent value="warranties" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                ตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>ค้นหา</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหา SN, สินค้า, ลูกค้า..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <Select value={statusFilter} onValueChange={(value: WarrantyStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="active">ใช้งานได้</SelectItem>
                      <SelectItem value="expired">หมดอายุ</SelectItem>
                      <SelectItem value="voided">ยกเลิก</SelectItem>
                      <SelectItem value="transferred">โอนย้าย</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเซ็ต
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    ส่งออก
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warranties List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  การรับประกัน ({filteredWarranties.length} รายการ)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredWarranties.map((warranty) => {
                  const daysLeft = getDaysUntilExpiry(warranty.warrantyEndDate);
                  const isExpired = isWarrantyExpired(warranty.warrantyEndDate);
                  
                  return (
                    <div key={warranty.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getWarrantyStatusColor(warranty.status)}`}>
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{warranty.productName}</h3>
                            <p className="text-sm text-muted-foreground">
                              SN: {warranty.serialNumber} • {warranty.productCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getWarrantyStatusColor(warranty.status)}>
                            {getWarrantyStatusText(warranty.status)}
                          </Badge>
                          {!isExpired && daysLeft <= 30 && (
                            <Badge className="bg-orange-100 text-orange-800">
                              ใกล้หมดอายุ
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">ลูกค้า</p>
                          <p>{warranty.customerName}</p>
                          <p className="text-muted-foreground">{warranty.customerPhone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">วันที่ซื้อ</p>
                          <p>{formatDate(warranty.purchaseDate)}</p>
                          <p className="text-muted-foreground">{formatCurrency(warranty.purchasePrice)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">ระยะเวลารับประกัน</p>
                          <p>{warranty.warrantyPeriod} เดือน</p>
                          <p className="text-muted-foreground">
                            {formatDate(warranty.warrantyStartDate)} - {formatDate(warranty.warrantyEndDate)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">สถานะ</p>
                          <p className={isExpired ? 'text-red-600' : daysLeft <= 30 ? 'text-orange-600' : 'text-green-600'}>
                            {isExpired ? 'หมดอายุแล้ว' : `เหลือ ${daysLeft} วัน`}
                          </p>
                          <p className="text-muted-foreground">{warranty.supplierName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{warranty.claims.length} เคลม</span>
                          <span className="text-muted-foreground"> • {warranty.documents.length} เอกสาร</span>
                          <span className="text-muted-foreground"> • {warranty.maintenanceRecords.length} การบำรุงรักษา</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWarranty(warranty);
                              setShowWarrantyDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {warranty.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateClaim(warranty.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {warranty.notes && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm">{warranty.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredWarranties.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">ไม่พบข้อมูลการรับประกัน</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                ตัวกรอง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>ค้นหา</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาเลขที่เคลม, SN, ลูกค้า..."
                      value={claimSearchTerm}
                      onChange={(e) => setClaimSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <Select value={claimStatusFilter} onValueChange={(value: ClaimStatus | 'all') => setClaimStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="submitted">ส่งคำขอแล้ว</SelectItem>
                      <SelectItem value="under_review">กำลังตรวจสอบ</SelectItem>
                      <SelectItem value="investigating">กำลังสอบสวน</SelectItem>
                      <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                      <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                      <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                      <SelectItem value="closed">ปิดเรื่อง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setClaimSearchTerm('');
                      setClaimStatusFilter('all');
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    รีเซ็ต
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    ส่งออก
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claims List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  เคลม ({filteredClaims.length} รายการ)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredClaims.map((claim) => (
                  <div key={claim.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getClaimStatusColor(claim.status)}`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{claim.claimNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            SN: {claim.serialNumber} • {formatDateTime(claim.reportedDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(claim.severity)}>
                          {getSeverityText(claim.severity)}
                        </Badge>
                        <Badge className={getClaimStatusColor(claim.status)}>
                          {getClaimStatusText(claim.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">ลูกค้า</p>
                        <p>{claim.customerName}</p>
                        <p className="text-muted-foreground">{getCategoryText(claim.issueCategory)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">ผู้รับผิดชอบ</p>
                        <p>{claim.assignedTo || 'ยังไม่ได้มอบหมาย'}</p>
                        <p className="text-muted-foreground">
                          {claim.assignedDate ? formatDate(claim.assignedDate) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">ค่าใช้จ่าย</p>
                        <p>ประเมิน: {formatCurrency(claim.estimatedCost)}</p>
                        <p className="text-muted-foreground">
                          จริง: {claim.actualCost > 0 ? formatCurrency(claim.actualCost) : '-'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">รายละเอียดปัญหา:</p>
                      <p className="text-sm">{claim.issueDescription}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{claim.documents.length} เอกสาร</span>
                        <span className="text-muted-foreground"> • {claim.communications.length} การติดต่อ</span>
                        <span className="text-muted-foreground"> • {claim.timeline.length} กิจกรรม</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowClaimDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {['submitted', 'under_review'].includes(claim.status) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredClaims.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">ไม่พบข้อมูลเคลม</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                การบำรุงรักษา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">ระบบการบำรุงรักษา - กำลังพัฒนา</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สถิติเคลมรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mr-2" />
                  กราฟแสดงสถิติเคลมรายเดือน
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>การแจกแจงประเภทปัญหา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <PieChart className="w-8 h-8 mr-2" />
                  กราฟแสดงการแจกแจงประเภทปัญหา
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Warranty Detail Dialog */}
      <Dialog open={showWarrantyDialog} onOpenChange={setShowWarrantyDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการรับประกัน</DialogTitle>
          </DialogHeader>
          {selectedWarranty && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Serial Number</Label>
                  <p className="font-medium">{selectedWarranty.serialNumber}</p>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <Badge className={getWarrantyStatusColor(selectedWarranty.status)}>
                    {getWarrantyStatusText(selectedWarranty.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>สินค้า</Label>
                  <p>{selectedWarranty.productName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWarranty.productCode}</p>
                </div>
                <div>
                  <Label>ลูกค้า</Label>
                  <p>{selectedWarranty.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWarranty.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{selectedWarranty.customerPhone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>วันที่ซื้อ</Label>
                  <p>{formatDate(selectedWarranty.purchaseDate)}</p>
                </div>
                <div>
                  <Label>เริ่มรับประกัน</Label>
                  <p>{formatDate(selectedWarranty.warrantyStartDate)}</p>
                </div>
                <div>
                  <Label>สิ้นสุดรับประกัน</Label>
                  <p>{formatDate(selectedWarranty.warrantyEndDate)}</p>
                </div>
              </div>
              
              <div>
                <Label>เอกสารประกอบ</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedWarranty.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedWarranty.notes && (
                <div>
                  <Label>หมายเหตุ</Label>
                  <p className="mt-1 p-3 bg-muted rounded">{selectedWarranty.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowWarrantyDialog(false)}>
                  ปิด
                </Button>
                {selectedWarranty.status === 'active' && (
                  <Button onClick={() => {
                    setShowWarrantyDialog(false);
                    handleCreateClaim(selectedWarranty.id);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างเคลม
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim Detail Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดเคลม</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>เลขที่เคลม</Label>
                  <p className="font-medium">{selectedClaim.claimNumber}</p>
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <p className="font-medium">{selectedClaim.serialNumber}</p>
                </div>
                <div>
                  <Label>สถานะ</Label>
                  <Badge className={getClaimStatusColor(selectedClaim.status)}>
                    {getClaimStatusText(selectedClaim.status)}
                  </Badge>
                </div>
              </div>
              
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                  <TabsTrigger value="timeline">ไทม์ไลน์</TabsTrigger>
                  <TabsTrigger value="documents">เอกสาร</TabsTrigger>
                  <TabsTrigger value="communications">การติดต่อ</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ลูกค้า</Label>
                      <p>{selectedClaim.customerName}</p>
                    </div>
                    <div>
                      <Label>ประเภทปัญหา</Label>
                      <p>{getCategoryText(selectedClaim.issueCategory)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>รายละเอียดปัญหา</Label>
                    <p className="mt-1 p-3 bg-muted rounded">{selectedClaim.issueDescription}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>ความรุนแรง</Label>
                      <Badge className={getSeverityColor(selectedClaim.severity)}>
                        {getSeverityText(selectedClaim.severity)}
                      </Badge>
                    </div>
                    <div>
                      <Label>ค่าใช้จ่ายประเมิน</Label>
                      <p>{formatCurrency(selectedClaim.estimatedCost)}</p>
                    </div>
                    <div>
                      <Label>ค่าใช้จ่ายจริง</Label>
                      <p>{selectedClaim.actualCost > 0 ? formatCurrency(selectedClaim.actualCost) : '-'}</p>
                    </div>
                  </div>
                  
                  {selectedClaim.resolution && (
                    <div>
                      <Label>การแก้ไข</Label>
                      <p className="mt-1 p-3 bg-muted rounded">{selectedClaim.resolution}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-3">
                    {selectedClaim.timeline.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.performedBy} • {formatDateTime(event.performedDate)}
                          </p>
                          {event.notes && (
                            <p className="text-sm mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedClaim.documents.map((doc) => (
                      <div key={doc.id} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {doc.type === 'photo' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          <p className="font-medium">{doc.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {doc.description || 'ไม่มีคำอธิบาย'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{doc.uploadedBy}</span>
                          <span>{formatDateTime(doc.uploadedDate)}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          <Download className="w-4 h-4 mr-2" />
                          ดาวน์โหลด
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="communications" className="space-y-4">
                  <div className="space-y-3">
                    {selectedClaim.communications.map((comm) => (
                      <div key={comm.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {comm.type === 'email' ? <Mail className="w-4 h-4" /> : 
                             comm.type === 'phone' ? <Phone className="w-4 h-4" /> : 
                             <MessageSquare className="w-4 h-4" />}
                            <span className="font-medium">{comm.subject || comm.type}</span>
                          </div>
                          <Badge variant={comm.direction === 'inbound' ? 'default' : 'secondary'}>
                            {comm.direction === 'inbound' ? 'เข้า' : 'ออก'}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{comm.message}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{comm.sentBy} → {comm.sentTo}</span>
                          <span>{formatDateTime(comm.sentDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
                  ปิด
                </Button>
                {['submitted', 'under_review'].includes(selectedClaim.status) && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        handleUpdateClaimStatus(selectedClaim.id, 'rejected');
                        setShowClaimDialog(false);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      ปฏิเสธ
                    </Button>
                    <Button 
                      onClick={() => {
                        handleUpdateClaimStatus(selectedClaim.id, 'approved');
                        setShowClaimDialog(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      อนุมัติ
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Claim Dialog */}
      <Dialog open={showCreateClaimDialog} onOpenChange={setShowCreateClaimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างเคลมใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input placeholder="ค้นหา Serial Number" />
              </div>
              <div className="space-y-2">
                <Label>ประเภทปัญหา</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทปัญหา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defect">ของเสีย</SelectItem>
                    <SelectItem value="damage">ความเสียหาย</SelectItem>
                    <SelectItem value="malfunction">ทำงานผิดปกติ</SelectItem>
                    <SelectItem value="missing_parts">ชิ้นส่วนหาย</SelectItem>
                    <SelectItem value="installation">การติดตั้ง</SelectItem>
                    <SelectItem value="other">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ความรุนแรง</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกความรุนแรง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">ต่ำ</SelectItem>
                    <SelectItem value="medium">ปานกลาง</SelectItem>
                    <SelectItem value="high">สูง</SelectItem>
                    <SelectItem value="critical">วิกฤต</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ลำดับความสำคัญ</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกลำดับความสำคัญ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">ต่ำ</SelectItem>
                    <SelectItem value="medium">ปานกลาง</SelectItem>
                    <SelectItem value="high">สูง</SelectItem>
                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>รายละเอียดปัญหา</Label>
              <Textarea 
                placeholder="อธิบายปัญหาที่พบ..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>แนบไฟล์</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-xs text-muted-foreground mt-1">รองรับ: JPG, PNG, PDF (สูงสุด 10MB)</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateClaimDialog(false)}>
                ยกเลิก
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                สร้างเคลม
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}