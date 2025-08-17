import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Truck, 
  Package, 
  Clock, 
  User, 
  Building2, 
  ArrowRight, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit, 
  Plus, 
  Calendar, 
  Tag, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Navigation, 
  Route, 
  History, 
  Scan, 
  QrCode, 
  BarChart3, 
  TrendingUp, 
  Activity
} from 'lucide-react';

// Types for Serial Number Tracking
interface TrackingEvent {
  id: string;
  serialNumber: string;
  eventType: 'received' | 'moved' | 'reserved' | 'sold' | 'rented' | 'returned' | 'transferred' | 'damaged' | 'repaired' | 'inspected';
  timestamp: Date;
  location: {
    warehouseId: string;
    warehouseName: string;
    zoneId?: string;
    zoneName?: string;
    shelfId?: string;
    shelfName?: string;
    position?: string;
  };
  previousLocation?: {
    warehouseId: string;
    warehouseName: string;
    zoneId?: string;
    zoneName?: string;
    shelfId?: string;
    shelfName?: string;
    position?: string;
  };
  employee: {
    id: string;
    name: string;
    role: string;
  };
  customer?: {
    id: string;
    name: string;
    type: 'individual' | 'business';
  };
  reference?: {
    type: 'purchase_order' | 'sale_order' | 'rental_order' | 'transfer_order' | 'maintenance_order';
    id: string;
    number: string;
  };
  notes?: string;
  images?: string[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  temperature?: number;
  humidity?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  metadata?: Record<string, any>;
}

interface SerialNumberJourney {
  serialNumber: string;
  productName: string;
  productSku: string;
  currentStatus: 'in_transit' | 'in_warehouse' | 'with_customer' | 'in_service' | 'lost' | 'damaged';
  currentLocation: TrackingEvent['location'];
  totalEvents: number;
  firstEvent: Date;
  lastEvent: Date;
  events: TrackingEvent[];
  estimatedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  alerts: TrackingAlert[];
}

interface TrackingAlert {
  id: string;
  type: 'location_mismatch' | 'overdue_movement' | 'temperature_alert' | 'unauthorized_access' | 'damage_detected';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

interface TrackingStats {
  totalSerialNumbers: number;
  inTransit: number;
  inWarehouse: number;
  withCustomers: number;
  alerts: number;
  averageTransitTime: number; // in hours
  onTimeDelivery: number; // percentage
}

interface SerialNumberTrackerProps {
  warehouseId?: string;
  serialNumber?: string;
  onEventSelect?: (event: TrackingEvent) => void;
}

export function SerialNumberTracker({ warehouseId, serialNumber, onEventSelect }: SerialNumberTrackerProps) {
  const [journeys, setJourneys] = useState<SerialNumberJourney[]>([]);
  const [filteredJourneys, setFilteredJourneys] = useState<SerialNumberJourney[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJourney, setSelectedJourney] = useState<SerialNumberJourney | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock data for tracking events
  const mockTrackingEvents: TrackingEvent[] = [
    {
      id: 'event-001',
      serialNumber: 'SN2024001001',
      eventType: 'received',
      timestamp: new Date('2024-01-15T09:00:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-a',
        zoneName: 'โซน A',
        shelfId: 'shelf-a1',
        shelfName: 'ชั้น A1',
        position: 'ตำแหน่ง 01'
      },
      employee: {
        id: 'emp-001',
        name: 'สมชาย ใจดี',
        role: 'พนักงานรับสินค้า'
      },
      reference: {
        type: 'purchase_order',
        id: 'po-001',
        number: 'PO-2024-001'
      },
      notes: 'รับสินค้าจากซัพพลายเออร์ ตรวจสอบคุณภาพแล้ว',
      condition: 'excellent',
      temperature: 25,
      humidity: 60
    },
    {
      id: 'event-002',
      serialNumber: 'SN2024001001',
      eventType: 'moved',
      timestamp: new Date('2024-01-16T14:30:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-b',
        zoneName: 'โซน B',
        shelfId: 'shelf-b2',
        shelfName: 'ชั้น B2',
        position: 'ตำแหน่ง 05'
      },
      previousLocation: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-a',
        zoneName: 'โซน A',
        shelfId: 'shelf-a1',
        shelfName: 'ชั้น A1',
        position: 'ตำแหน่ง 01'
      },
      employee: {
        id: 'emp-002',
        name: 'สมหญิง รักงาน',
        role: 'พนักงานจัดเก็บ'
      },
      notes: 'ย้ายไปโซนจัดแสดงสินค้า',
      condition: 'excellent'
    },
    {
      id: 'event-003',
      serialNumber: 'SN2024001001',
      eventType: 'reserved',
      timestamp: new Date('2024-01-20T10:15:00'),
      location: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-b',
        zoneName: 'โซน B',
        shelfId: 'shelf-b2',
        shelfName: 'ชั้น B2',
        position: 'ตำแหน่ง 05'
      },
      employee: {
        id: 'emp-003',
        name: 'สมปอง ขยัน',
        role: 'พนักงานขาย'
      },
      customer: {
        id: 'cust-001',
        name: 'นางสาวมาลี สวยงาม',
        type: 'individual'
      },
      reference: {
        type: 'sale_order',
        id: 'so-001',
        number: 'SO-2024-001'
      },
      notes: 'จองสำหรับลูกค้า รอการชำระเงิน',
      condition: 'excellent'
    },
    {
      id: 'event-004',
      serialNumber: 'SN2024001002',
      eventType: 'sold',
      timestamp: new Date('2024-01-22T16:45:00'),
      location: {
        warehouseId: 'customer',
        warehouseName: 'ลูกค้า',
        position: 'จัดส่งแล้ว'
      },
      previousLocation: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-c',
        zoneName: 'โซน C',
        shelfId: 'shelf-c1',
        shelfName: 'ชั้น C1',
        position: 'ตำแหน่ง 03'
      },
      employee: {
        id: 'emp-004',
        name: 'สมศักดิ์ มั่งมี',
        role: 'พนักงานจัดส่ง'
      },
      customer: {
        id: 'cust-002',
        name: 'บริษัท ABC จำกัด',
        type: 'business'
      },
      reference: {
        type: 'sale_order',
        id: 'so-002',
        number: 'SO-2024-002'
      },
      notes: 'จัดส่งให้ลูกค้าเรียบร้อย',
      condition: 'good',
      gpsCoordinates: {
        latitude: 13.7563,
        longitude: 100.5018
      }
    }
  ];

  // Mock data for journeys
  const mockJourneys: SerialNumberJourney[] = [
    {
      serialNumber: 'SN2024001001',
      productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort Plus',
      productSku: 'SOFA-CP-3S-BRN',
      currentStatus: 'in_warehouse',
      currentLocation: {
        warehouseId: 'wh-001',
        warehouseName: 'คลังสินค้าหลัก',
        zoneId: 'zone-b',
        zoneName: 'โซน B',
        shelfId: 'shelf-b2',
        shelfName: 'ชั้น B2',
        position: 'ตำแหน่ง 05'
      },
      totalEvents: 3,
      firstEvent: new Date('2024-01-15T09:00:00'),
      lastEvent: new Date('2024-01-20T10:15:00'),
      events: mockTrackingEvents.filter(e => e.serialNumber === 'SN2024001001'),
      estimatedValue: 25000,
      riskLevel: 'low',
      alerts: [
        {
          id: 'alert-001',
          type: 'overdue_movement',
          severity: 'warning',
          message: 'สินค้าอยู่ในสถานะจองเกิน 3 วัน',
          timestamp: new Date('2024-01-23T08:00:00'),
          resolved: false
        }
      ]
    },
    {
      serialNumber: 'SN2024001002',
      productName: 'ตู้เสื้อผ้า 4 บาน รุ่น Classic',
      productSku: 'WARD-CL-4D-WHT',
      currentStatus: 'with_customer',
      currentLocation: {
        warehouseId: 'customer',
        warehouseName: 'ลูกค้า',
        position: 'จัดส่งแล้ว'
      },
      totalEvents: 4,
      firstEvent: new Date('2024-01-10T10:30:00'),
      lastEvent: new Date('2024-01-22T16:45:00'),
      events: mockTrackingEvents.filter(e => e.serialNumber === 'SN2024001002'),
      estimatedValue: 15000,
      riskLevel: 'low',
      alerts: []
    },
    {
      serialNumber: 'SN2024001003',
      productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
      productSku: 'BED-LX-6F-BLK',
      currentStatus: 'in_transit',
      currentLocation: {
        warehouseId: 'transport',
        warehouseName: 'ระหว่างขนส่ง',
        position: 'รถขนส่ง TRK-001'
      },
      totalEvents: 5,
      firstEvent: new Date('2024-01-12T11:00:00'),
      lastEvent: new Date('2024-01-25T14:20:00'),
      events: [],
      estimatedValue: 20000,
      riskLevel: 'medium',
      alerts: [
        {
          id: 'alert-002',
          type: 'location_mismatch',
          severity: 'warning',
          message: 'ตำแหน่ง GPS ไม่ตรงกับเส้นทางที่กำหนด',
          timestamp: new Date('2024-01-25T15:30:00'),
          resolved: false
        }
      ]
    }
  ];

  // Mock stats
  const mockStats: TrackingStats = {
    totalSerialNumbers: 150,
    inTransit: 12,
    inWarehouse: 98,
    withCustomers: 35,
    alerts: 8,
    averageTransitTime: 24,
    onTimeDelivery: 94.5
  };

  useEffect(() => {
    setTrackingEvents(mockTrackingEvents);
    setJourneys(mockJourneys);
    setStats(mockStats);
  }, []);

  // Filter journeys
  useEffect(() => {
    let filtered = journeys;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(journey => 
        journey.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journey.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journey.productSku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(journey => journey.currentStatus === filterStatus);
    }

    // Filter by risk level
    if (filterRisk !== 'all') {
      filtered = filtered.filter(journey => journey.riskLevel === filterRisk);
    }

    // Filter by serial number if provided
    if (serialNumber) {
      filtered = filtered.filter(journey => journey.serialNumber === serialNumber);
    }

    setFilteredJourneys(filtered);
  }, [journeys, searchTerm, filterStatus, filterRisk, serialNumber]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        console.log('Refreshing tracking data...');
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusBadge = (status: SerialNumberJourney['currentStatus']) => {
    switch (status) {
      case 'in_warehouse':
        return <Badge className="bg-green-500 text-white">ในคลัง</Badge>;
      case 'in_transit':
        return <Badge className="bg-blue-500 text-white">ระหว่างขนส่ง</Badge>;
      case 'with_customer':
        return <Badge className="bg-purple-500 text-white">กับลูกค้า</Badge>;
      case 'in_service':
        return <Badge className="bg-orange-500 text-white">ซ่อมบำรุง</Badge>;
      case 'lost':
        return <Badge className="bg-red-500 text-white">สูญหาย</Badge>;
      case 'damaged':
        return <Badge className="bg-gray-500 text-white">เสียหาย</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getRiskBadge = (risk: SerialNumberJourney['riskLevel']) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-300">ต่ำ</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">กลาง</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-300">สูง</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบ</Badge>;
    }
  };

  const getEventIcon = (eventType: TrackingEvent['eventType']) => {
    switch (eventType) {
      case 'received':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'moved':
        return <Navigation className="w-4 h-4 text-green-500" />;
      case 'reserved':
        return <Tag className="w-4 h-4 text-yellow-500" />;
      case 'sold':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'rented':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'returned':
        return <ArrowRight className="w-4 h-4 text-cyan-500" />;
      case 'transferred':
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'damaged':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'repaired':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inspected':
        return <Eye className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: TrackingAlert['type']) => {
    switch (type) {
      case 'location_mismatch':
        return <MapPin className="w-4 h-4 text-orange-500" />;
      case 'overdue_movement':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'temperature_alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'unauthorized_access':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'damage_detected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
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

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} วัน ${hours % 24} ชั่วโมง`;
    }
    return `${hours} ชั่วโมง`;
  };

  const handleJourneyClick = (journey: SerialNumberJourney) => {
    setSelectedJourney(journey);
    setShowEventDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Route className="w-6 h-6" />
            ติดตาม Serial Number
          </h2>
          <p className="text-muted-foreground">
            ติดตามการเคลื่อนไหวและตำแหน่งของ Serial Number แบบ Real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-100 border-green-300' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'หยุดอัปเดต' : 'อัปเดตอัตโนมัติ'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRealTimeMode(!realTimeMode)}
            className={realTimeMode ? 'bg-blue-100 border-blue-300' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            {realTimeMode ? 'ปิด Real-time' : 'Real-time'}
          </Button>
          <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มเหตุการณ์
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มเหตุการณ์การติดตาม</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Serial Number</Label>
                    <Input placeholder="SN2024001XXX" />
                  </div>
                  <div>
                    <Label>ประเภทเหตุการณ์</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">รับสินค้า</SelectItem>
                        <SelectItem value="moved">ย้ายตำแหน่ง</SelectItem>
                        <SelectItem value="reserved">จองสินค้า</SelectItem>
                        <SelectItem value="sold">ขายสินค้า</SelectItem>
                        <SelectItem value="rented">ให้เช่า</SelectItem>
                        <SelectItem value="returned">คืนสินค้า</SelectItem>
                        <SelectItem value="transferred">โอนย้าย</SelectItem>
                        <SelectItem value="damaged">เสียหาย</SelectItem>
                        <SelectItem value="repaired">ซ่อมแซม</SelectItem>
                        <SelectItem value="inspected">ตรวจสอบ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>คลังสินค้า</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคลัง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh-001">คลังสินค้าหลัก</SelectItem>
                        <SelectItem value="wh-002">คลังสินค้าสาขา</SelectItem>
                        <SelectItem value="transport">ระหว่างขนส่ง</SelectItem>
                        <SelectItem value="customer">ลูกค้า</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ตำแหน่งเฉพาะ</Label>
                    <Input placeholder="โซน A ชั้น 1 ตำแหน่ง 01" />
                  </div>
                </div>
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea placeholder="รายละเอียดเพิ่มเติม..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setShowAddEventDialog(false)}>
                    บันทึก
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">โหมด Real-time เปิดใช้งาน</h3>
                <p className="text-sm text-blue-700">ระบบกำลังติดตามการเคลื่อนไหวแบบเรียลไทม์</p>
              </div>
              <div className="text-sm text-blue-700">
                อัปเดตล่าสุด: {formatDate(new Date())}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalSerialNumbers}</div>
                  <div className="text-sm text-muted-foreground">ทั้งหมด</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.inWarehouse}</div>
                  <div className="text-sm text-muted-foreground">ในคลัง</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
                  <div className="text-sm text-muted-foreground">ขนส่ง</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.withCustomers}</div>
                  <div className="text-sm text-muted-foreground">กับลูกค้า</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.alerts}</div>
                  <div className="text-sm text-muted-foreground">แจ้งเตือน</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.averageTransitTime}h</div>
                  <div className="text-sm text-muted-foreground">เวลาเฉลี่ย</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.onTimeDelivery}%</div>
                  <div className="text-sm text-muted-foreground">ตรงเวลา</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="ค้นหา Serial Number, สินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="in_warehouse">ในคลัง</SelectItem>
                <SelectItem value="in_transit">ระหว่างขนส่ง</SelectItem>
                <SelectItem value="with_customer">กับลูกค้า</SelectItem>
                <SelectItem value="in_service">ซ่อมบำรุง</SelectItem>
                <SelectItem value="lost">สูญหาย</SelectItem>
                <SelectItem value="damaged">เสียหาย</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ความเสี่ยง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">กลาง</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="alerts">แจ้งเตือน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>การติดตาม Serial Number</span>
                <Badge variant="outline">
                  {filteredJourneys.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJourneys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลการติดตาม</p>
                    <p className="text-sm">ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่เลือก</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredJourneys.map((journey) => (
                      <div
                        key={journey.serialNumber}
                        className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleJourneyClick(journey)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">{journey.serialNumber}</h4>
                              {getStatusBadge(journey.currentStatus)}
                              {getRiskBadge(journey.riskLevel)}
                              {journey.alerts.length > 0 && (
                                <Badge className="bg-red-100 text-red-800 border-red-300">
                                  {journey.alerts.length} แจ้งเตือน
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">สินค้า:</span>
                                <p className="font-medium">{journey.productName}</p>
                                <p className="text-xs text-muted-foreground">{journey.productSku}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">ตำแหน่งปัจจุบัน:</span>
                                <p className="font-medium">{journey.currentLocation.warehouseName}</p>
                                {journey.currentLocation.position && (
                                  <p className="text-xs text-muted-foreground">{journey.currentLocation.position}</p>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">มูลค่าประเมิน:</span>
                                <p className="font-medium">฿{journey.estimatedValue.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">เหตุการณ์ทั้งหมด:</span>
                                <p className="font-medium">{journey.totalEvents} เหตุการณ์</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">ระยะเวลา:</span>
                                <p className="font-medium">{formatDuration(journey.firstEvent, journey.lastEvent)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">อัปเดตล่าสุด:</span>
                                <p className="font-medium">{formatDate(journey.lastEvent)}</p>
                              </div>
                            </div>

                            {journey.alerts.length > 0 && (
                              <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                                <div className="flex items-center gap-2 text-red-700">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="font-medium">แจ้งเตือนล่าสุด:</span>
                                </div>
                                <p className="text-red-600 mt-1">{journey.alerts[0].message}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MapPin className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <History className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline เหตุการณ์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีเหตุการณ์</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    {trackingEvents.map((event, index) => (
                      <div key={event.id} className="relative flex items-start gap-4 pb-6">
                        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{event.serialNumber}</h4>
                            <Badge variant="outline" className="text-xs">
                              {event.eventType}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location.warehouseName}</span>
                              {event.location.position && (
                                <span>• {event.location.position}</span>
                              )}
                            </div>
                            {event.previousLocation && (
                              <div className="flex items-center gap-2 mt-1">
                                <ArrowRight className="w-3 h-3" />
                                <span>จาก: {event.previousLocation.warehouseName}</span>
                                {event.previousLocation.position && (
                                  <span>• {event.previousLocation.position}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-3 h-3" />
                              <span>{event.employee.name} ({event.employee.role})</span>
                            </div>
                            {event.customer && (
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3" />
                                <span>ลูกค้า: {event.customer.name}</span>
                              </div>
                            )}
                            {event.reference && (
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-3 h-3" />
                                <span>อ้างอิง: {event.reference.number}</span>
                              </div>
                            )}
                          </div>
                          {event.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              {event.notes}
                            </div>
                          )}
                          {(event.temperature || event.humidity || event.condition) && (
                            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                              {event.temperature && (
                                <span>อุณหภูมิ: {event.temperature}°C</span>
                              )}
                              {event.humidity && (
                                <span>ความชื้น: {event.humidity}%</span>
                              )}
                              {event.condition && (
                                <span>สภาพ: {event.condition}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>แจ้งเตือนการติดตาม</span>
                <Badge className="bg-red-500 text-white">
                  {filteredJourneys.reduce((total, journey) => total + journey.alerts.length, 0)} แจ้งเตือน
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJourneys.filter(j => j.alerts.length > 0).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p>ไม่มีแจ้งเตือน</p>
                    <p className="text-sm">ระบบทำงานปกติ ไม่มีปัญหาที่ต้องแก้ไข</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredJourneys.map((journey) => 
                      journey.alerts.map((alert) => (
                        <div key={alert.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
                          <div className="flex items-start gap-3">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-red-900">{journey.serialNumber}</h4>
                                <Badge className={`text-xs ${
                                  alert.severity === 'critical' ? 'bg-red-500 text-white' :
                                  alert.severity === 'error' ? 'bg-red-400 text-white' :
                                  alert.severity === 'warning' ? 'bg-yellow-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {alert.severity}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(alert.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-red-800 mb-2">{alert.message}</p>
                              <div className="text-xs text-muted-foreground">
                                <span>สินค้า: {journey.productName}</span>
                                <span className="ml-4">ตำแหน่ง: {journey.currentLocation.warehouseName}</span>
                              </div>
                              {alert.resolved && (
                                <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  แก้ไขแล้วโดย {alert.resolvedBy} เมื่อ {alert.resolvedAt && formatDate(alert.resolvedAt)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!alert.resolved && (
                                <Button variant="outline" size="sm">
                                  แก้ไข
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Journey Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              รายละเอียดการติดตาม: {selectedJourney?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedJourney && (
            <div className="space-y-6">
              {/* Journey Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">ข้อมูลสินค้า</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial Number:</span>
                        <span className="font-medium">{selectedJourney.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">สินค้า:</span>
                        <span className="font-medium">{selectedJourney.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SKU:</span>
                        <span className="font-medium">{selectedJourney.productSku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">มูลค่า:</span>
                        <span className="font-medium">฿{selectedJourney.estimatedValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">สถานะปัจจุบัน</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">สถานะ:</span>
                        {getStatusBadge(selectedJourney.currentStatus)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ความเสี่ยง:</span>
                        {getRiskBadge(selectedJourney.riskLevel)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ตำแหน่ง:</span>
                        <span className="font-medium">{selectedJourney.currentLocation.warehouseName}</span>
                      </div>
                      {selectedJourney.currentLocation.position && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ตำแหน่งเฉพาะ:</span>
                          <span className="font-medium">{selectedJourney.currentLocation.position}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Journey Timeline */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  ประวัติการเคลื่อนไหว ({selectedJourney.totalEvents} เหตุการณ์)
                </h3>
                <div className="space-y-3">
                  {selectedJourney.events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getEventIcon(event.eventType)}
                          <span className="font-medium">{event.eventType}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(event.timestamp)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location.warehouseName}</span>
                            {event.location.position && (
                              <span>• {event.location.position}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span>โดย: {event.employee.name}</span>
                          {event.customer && (
                            <span className="ml-4">ลูกค้า: {event.customer.name}</span>
                          )}
                        </div>
                        {event.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {event.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {selectedJourney.alerts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    แจ้งเตือน ({selectedJourney.alerts.length} รายการ)
                  </h3>
                  <div className="space-y-3">
                    {selectedJourney.alerts.map((alert) => (
                      <div key={alert.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${
                                alert.severity === 'critical' ? 'bg-red-500 text-white' :
                                alert.severity === 'error' ? 'bg-red-400 text-white' :
                                alert.severity === 'warning' ? 'bg-yellow-500 text-white' :
                                'bg-blue-500 text-white'
                              }`}>
                                {alert.severity}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(alert.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-red-800">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  ดูแผนที่
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  ส่งออกรายงาน
                </Button>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มเหตุการณ์
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}