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
  Package, 
  Scan, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  QrCode,
  Barcode,
  History,
  MapPin,
  Truck,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  FileText,
  Eye,
  Filter,
  RefreshCw,
  Calendar,
  Tag
} from 'lucide-react';

// Types for Serial Number Management
interface SerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  status: 'received' | 'in_stock' | 'reserved' | 'sold' | 'rented' | 'returned' | 'damaged' | 'lost';
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  purchasePrice: number;
  sellingPrice?: number;
  rentalPrice?: number;
  warrantyStartDate?: Date;
  warrantyEndDate?: Date;
  receivedDate: Date;
  lastMovementDate: Date;
  currentCustomerId?: string;
  currentCustomerName?: string;
  saleId?: string;
  rentalId?: string;
  transferId?: string;
  notes?: string;
  qrCode?: string;
  barcode?: string;
  images?: string[];
  documents?: SerialNumberDocument[];
  movements: SerialNumberMovement[];
  metadata?: Record<string, any>;
}

interface SerialNumberDocument {
  id: string;
  type: 'invoice' | 'warranty' | 'manual' | 'certificate' | 'photo' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface SerialNumberMovement {
  id: string;
  type: 'received' | 'moved' | 'reserved' | 'sold' | 'rented' | 'returned' | 'transferred' | 'damaged' | 'repaired';
  fromLocation?: string;
  toLocation?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  customerId?: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  notes?: string;
  timestamp: Date;
  referenceId?: string; // Sale ID, Rental ID, Transfer ID, etc.
}

interface SerialNumberBatch {
  id: string;
  batchNumber: string;
  productId: string;
  supplierId: string;
  totalQuantity: number;
  receivedQuantity: number;
  serialNumbers: string[];
  receivedDate: Date;
  status: 'pending' | 'partial' | 'complete';
  notes?: string;
}

interface SerialNumberManagerProps {
  warehouseId?: string;
  onSerialNumberSelect?: (serialNumber: SerialNumber) => void;
}

export function SerialNumberManager({ warehouseId, onSerialNumberSelect }: SerialNumberManagerProps) {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [filteredSerialNumbers, setFilteredSerialNumbers] = useState<SerialNumber[]>([]);
  const [batches, setBatches] = useState<SerialNumberBatch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('individual');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState<SerialNumber | null>(null);
  const [scanMode, setScanMode] = useState(false);

  // Mock data for serial numbers
  const mockSerialNumbers: SerialNumber[] = [
    {
      id: 'sn-001',
      serialNumber: 'SN2024001001',
      productId: 'prod-001',
      productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort Plus',
      productSku: 'SOFA-CP-3S-BRN',
      supplierId: 'sup-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      locationId: 'loc-a1-01',
      locationName: 'โซน A ชั้น 1 ตำแหน่ง 01',
      status: 'in_stock',
      condition: 'new',
      purchasePrice: 15000,
      sellingPrice: 25000,
      rentalPrice: 2500,
      warrantyStartDate: new Date('2024-01-15'),
      warrantyEndDate: new Date('2026-01-15'),
      receivedDate: new Date('2024-01-15'),
      lastMovementDate: new Date('2024-01-15'),
      qrCode: 'QR-SN2024001001',
      barcode: 'BC-SN2024001001',
      notes: 'สินค้าใหม่ ตรวจสอบคุณภาพแล้ว',
      movements: [
        {
          id: 'mov-001',
          type: 'received',
          toLocation: 'โซน A ชั้น 1 ตำแหน่ง 01',
          toWarehouse: 'คลังสินค้าหลัก',
          employeeId: 'emp-001',
          employeeName: 'สมชาย ใจดี',
          reason: 'รับสินค้าจากซัพพลายเออร์',
          timestamp: new Date('2024-01-15T09:00:00'),
          referenceId: 'PO-2024-001'
        }
      ],
      documents: [
        {
          id: 'doc-001',
          type: 'invoice',
          name: 'ใบแจ้งหนี้ PO-2024-001',
          url: '/documents/invoice-po-2024-001.pdf',
          uploadedAt: new Date('2024-01-15'),
          uploadedBy: 'สมชาย ใจดี'
        },
        {
          id: 'doc-002',
          type: 'warranty',
          name: 'ใบรับประกัน 2 ปี',
          url: '/documents/warranty-sn2024001001.pdf',
          uploadedAt: new Date('2024-01-15'),
          uploadedBy: 'สมชาย ใจดี'
        }
      ]
    },
    {
      id: 'sn-002',
      serialNumber: 'SN2024001002',
      productId: 'prod-002',
      productName: 'ตู้เสื้อผ้า 4 บาน รุ่น Classic',
      productSku: 'WARD-CL-4D-WHT',
      supplierId: 'sup-002',
      supplierName: 'บริษัท วู้ดเวิร์ค จำกัด',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      locationId: 'loc-b2-05',
      locationName: 'โซน B ชั้น 2 ตำแหน่ง 05',
      status: 'sold',
      condition: 'new',
      purchasePrice: 8000,
      sellingPrice: 15000,
      receivedDate: new Date('2024-01-10'),
      lastMovementDate: new Date('2024-01-20'),
      currentCustomerId: 'cust-001',
      currentCustomerName: 'นางสาวมาลี สวยงาม',
      saleId: 'sale-001',
      qrCode: 'QR-SN2024001002',
      barcode: 'BC-SN2024001002',
      movements: [
        {
          id: 'mov-002',
          type: 'received',
          toLocation: 'โซน B ชั้น 2 ตำแหน่ง 05',
          toWarehouse: 'คลังสินค้าหลัก',
          employeeId: 'emp-001',
          employeeName: 'สมชาย ใจดี',
          reason: 'รับสินค้าจากซัพพลายเออร์',
          timestamp: new Date('2024-01-10T10:30:00'),
          referenceId: 'PO-2024-002'
        },
        {
          id: 'mov-003',
          type: 'sold',
          fromLocation: 'โซน B ชั้น 2 ตำแหน่ง 05',
          customerId: 'cust-001',
          employeeId: 'emp-002',
          employeeName: 'สมหญิง รักงาน',
          reason: 'ขายให้ลูกค้า',
          timestamp: new Date('2024-01-20T14:15:00'),
          referenceId: 'sale-001'
        }
      ],
      documents: []
    },
    {
      id: 'sn-003',
      serialNumber: 'SN2024001003',
      productId: 'prod-003',
      productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
      productSku: 'BED-LX-6F-BLK',
      supplierId: 'sup-001',
      supplierName: 'บริษัท เฟอร์นิเจอร์ไทย จำกัด',
      warehouseId: 'wh-001',
      warehouseName: 'คลังสินค้าหลัก',
      status: 'rented',
      condition: 'new',
      purchasePrice: 12000,
      rentalPrice: 1500,
      receivedDate: new Date('2024-01-12'),
      lastMovementDate: new Date('2024-01-25'),
      currentCustomerId: 'cust-002',
      currentCustomerName: 'นายสมศักดิ์ มั่งมี',
      rentalId: 'rent-001',
      qrCode: 'QR-SN2024001003',
      barcode: 'BC-SN2024001003',
      movements: [
        {
          id: 'mov-004',
          type: 'received',
          toWarehouse: 'คลังสินค้าหลัก',
          employeeId: 'emp-001',
          employeeName: 'สมชาย ใจดี',
          reason: 'รับสินค้าจากซัพพลายเออร์',
          timestamp: new Date('2024-01-12T11:00:00'),
          referenceId: 'PO-2024-003'
        },
        {
          id: 'mov-005',
          type: 'rented',
          customerId: 'cust-002',
          employeeId: 'emp-003',
          employeeName: 'สมปอง ขยัน',
          reason: 'ให้เช่าลูกค้า',
          timestamp: new Date('2024-01-25T16:30:00'),
          referenceId: 'rent-001'
        }
      ],
      documents: []
    }
  ];

  // Mock data for batches
  const mockBatches: SerialNumberBatch[] = [
    {
      id: 'batch-001',
      batchNumber: 'BATCH-2024-001',
      productId: 'prod-001',
      supplierId: 'sup-001',
      totalQuantity: 10,
      receivedQuantity: 8,
      serialNumbers: ['SN2024001001', 'SN2024001004', 'SN2024001005', 'SN2024001006', 'SN2024001007', 'SN2024001008', 'SN2024001009', 'SN2024001010'],
      receivedDate: new Date('2024-01-15'),
      status: 'partial',
      notes: 'รอสินค้า 2 ชิ้นจากซัพพลายเออร์'
    },
    {
      id: 'batch-002',
      batchNumber: 'BATCH-2024-002',
      productId: 'prod-002',
      supplierId: 'sup-002',
      totalQuantity: 5,
      receivedQuantity: 5,
      serialNumbers: ['SN2024001002', 'SN2024001011', 'SN2024001012', 'SN2024001013', 'SN2024001014'],
      receivedDate: new Date('2024-01-10'),
      status: 'complete',
      notes: 'รับครบทุกชิ้นแล้ว'
    }
  ];

  useEffect(() => {
    setSerialNumbers(mockSerialNumbers);
    setBatches(mockBatches);
  }, []);

  // Filter serial numbers
  useEffect(() => {
    let filtered = serialNumbers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sn => 
        sn.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sn => sn.status === filterStatus);
    }

    // Filter by condition
    if (filterCondition !== 'all') {
      filtered = filtered.filter(sn => sn.condition === filterCondition);
    }

    // Filter by warehouse
    if (filterWarehouse !== 'all') {
      filtered = filtered.filter(sn => sn.warehouseId === filterWarehouse);
    }

    // Filter by warehouse ID if provided
    if (warehouseId) {
      filtered = filtered.filter(sn => sn.warehouseId === warehouseId);
    }

    setFilteredSerialNumbers(filtered);
  }, [serialNumbers, searchTerm, filterStatus, filterCondition, filterWarehouse, warehouseId]);

  const getStatusBadge = (status: SerialNumber['status']) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-blue-500 text-white">รับแล้ว</Badge>;
      case 'in_stock':
        return <Badge className="bg-green-500 text-white">ในสต็อก</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-500 text-white">จอง</Badge>;
      case 'sold':
        return <Badge className="bg-purple-500 text-white">ขายแล้ว</Badge>;
      case 'rented':
        return <Badge className="bg-orange-500 text-white">ให้เช่า</Badge>;
      case 'returned':
        return <Badge className="bg-cyan-500 text-white">คืนแล้ว</Badge>;
      case 'damaged':
        return <Badge className="bg-red-500 text-white">เสียหาย</Badge>;
      case 'lost':
        return <Badge className="bg-gray-500 text-white">สูญหาย</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราบ</Badge>;
    }
  };

  const getConditionBadge = (condition: SerialNumber['condition']) => {
    switch (condition) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 border-green-300">ใหม่</Badge>;
      case 'used':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">มือสอง</Badge>;
      case 'refurbished':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">ปรับปรุงแล้ว</Badge>;
      case 'damaged':
        return <Badge className="bg-red-100 text-red-800 border-red-300">เสียหาย</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบ</Badge>;
    }
  };

  const getBatchStatusBadge = (status: SerialNumberBatch['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">รอดำเนินการ</Badge>;
      case 'partial':
        return <Badge className="bg-orange-500 text-white">บางส่วน</Badge>;
      case 'complete':
        return <Badge className="bg-green-500 text-white">เสร็จสิ้น</Badge>;
      default:
        return <Badge variant="secondary">ไม่ทราب</Badge>;
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

  const handleSerialNumberClick = (serialNumber: SerialNumber) => {
    setSelectedSerialNumber(serialNumber);
    setShowDetailsDialog(true);
    onSerialNumberSelect?.(serialNumber);
  };

  const handleScanSerialNumber = (scannedCode: string) => {
    const foundSN = serialNumbers.find(sn => 
      sn.serialNumber === scannedCode || 
      sn.qrCode === scannedCode || 
      sn.barcode === scannedCode
    );
    
    if (foundSN) {
      handleSerialNumberClick(foundSN);
    } else {
      alert('ไม่พบ Serial Number ที่สแกน');
    }
    setScanMode(false);
  };

  const serialNumberStats = {
    total: serialNumbers.length,
    inStock: serialNumbers.filter(sn => sn.status === 'in_stock').length,
    sold: serialNumbers.filter(sn => sn.status === 'sold').length,
    rented: serialNumbers.filter(sn => sn.status === 'rented').length,
    damaged: serialNumbers.filter(sn => sn.status === 'damaged').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            จัดการ Serial Number
          </h2>
          <p className="text-muted-foreground">
            ติดตามและจัดการ Serial Number ของสินค้าทั้งหมดในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScanMode(!scanMode)}
            className={scanMode ? 'bg-blue-100 border-blue-300' : ''}
          >
            <Scan className="w-4 h-4 mr-2" />
            {scanMode ? 'ปิดสแกน' : 'สแกน'}
          </Button>
          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                นำเข้าแบบกลุ่ม
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>นำเข้า Serial Number แบบกลุ่ม</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>หมายเลขกลุ่ม</Label>
                    <Input placeholder="BATCH-2024-XXX" />
                  </div>
                  <div>
                    <Label>จำนวนทั้งหมด</Label>
                    <Input type="number" placeholder="10" />
                  </div>
                </div>
                <div>
                  <Label>รายการ Serial Number</Label>
                  <Textarea 
                    placeholder="SN2024001001\nSN2024001002\nSN2024001003\n..."
                    rows={8}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setShowBatchDialog(false)}>
                    นำเข้า
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Serial Number
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Serial Number ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Serial Number</Label>
                    <Input placeholder="SN2024001XXX" />
                  </div>
                  <div>
                    <Label>สินค้า</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prod-001">โซฟา 3 ที่นั่ง รุ่น Comfort Plus</SelectItem>
                        <SelectItem value="prod-002">ตู้เสื้อผ้า 4 บาน รุ่น Classic</SelectItem>
                        <SelectItem value="prod-003">เตียงนอน 6 ฟุต รุ่น Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ซัพพลายเออร์</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกซัพพลายเออร์" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sup-001">บริษัท เฟอร์นิเจอร์ไทย จำกัด</SelectItem>
                        <SelectItem value="sup-002">บริษัท วู้ดเวิร์ค จำกัด</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>คลังสินค้า</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคลังสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh-001">คลังสินค้าหลัก</SelectItem>
                        <SelectItem value="wh-002">คลังสินค้าสาขา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>ราคาซื้อ</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label>ราคาขาย</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label>ราคาเช่า</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea placeholder="หมายเหตุเพิ่มเติม..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => setShowAddDialog(false)}>
                    เพิ่ม
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scan Mode */}
      {scanMode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Scan className="w-8 h-8 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">โหมดสแกน Serial Number</h3>
                <p className="text-sm text-blue-700">สแกน QR Code หรือ Barcode เพื่อค้นหา Serial Number</p>
              </div>
              <Input 
                placeholder="สแกนหรือพิมพ์ Serial Number..."
                className="w-64"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScanSerialNumber(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                autoFocus
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{serialNumberStats.total}</div>
                <div className="text-sm text-muted-foreground">ทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{serialNumberStats.inStock}</div>
                <div className="text-sm text-muted-foreground">ในสต็อก</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{serialNumberStats.sold}</div>
                <div className="text-sm text-muted-foreground">ขายแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{serialNumberStats.rented}</div>
                <div className="text-sm text-muted-foreground">ให้เช่า</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{serialNumberStats.damaged}</div>
                <div className="text-sm text-muted-foreground">เสียหาย</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="ค้นหา Serial Number, สินค้า, SKU..."
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
                <SelectItem value="received">รับแล้ว</SelectItem>
                <SelectItem value="in_stock">ในสต็อก</SelectItem>
                <SelectItem value="reserved">จอง</SelectItem>
                <SelectItem value="sold">ขายแล้ว</SelectItem>
                <SelectItem value="rented">ให้เช่า</SelectItem>
                <SelectItem value="returned">คืนแล้ว</SelectItem>
                <SelectItem value="damaged">เสียหาย</SelectItem>
                <SelectItem value="lost">สูญหาย</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="สภาพ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสภาพ</SelectItem>
                <SelectItem value="new">ใหม่</SelectItem>
                <SelectItem value="used">มือสอง</SelectItem>
                <SelectItem value="refurbished">ปรับปรุงแล้ว</SelectItem>
                <SelectItem value="damaged">เสียหาย</SelectItem>
              </SelectContent>
            </Select>
            {!warehouseId && (
              <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="คลังสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคลัง</SelectItem>
                  <SelectItem value="wh-001">คลังสินค้าหลัก</SelectItem>
                  <SelectItem value="wh-002">คลังสินค้าสาขา</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Serial Number รายตัว</TabsTrigger>
          <TabsTrigger value="batches">กลุ่ม/Batch</TabsTrigger>
        </TabsList>

        {/* Individual Serial Numbers */}
        <TabsContent value="individual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Serial Number รายตัว</span>
                <Badge variant="outline">
                  {filteredSerialNumbers.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSerialNumbers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มี Serial Number</p>
                    <p className="text-sm">ไม่พบ Serial Number ที่ตรงกับเงื่อนไขที่เลือก</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSerialNumbers.map((sn) => (
                      <div
                        key={sn.id}
                        className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSerialNumberClick(sn)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">{sn.serialNumber}</h4>
                              {getStatusBadge(sn.status)}
                              {getConditionBadge(sn.condition)}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <QrCode className="w-3 h-3" />
                                <span>{sn.qrCode}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">สินค้า:</span>
                                <p className="font-medium">{sn.productName}</p>
                                <p className="text-xs text-muted-foreground">{sn.productSku}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">ซัพพลายเออร์:</span>
                                <p className="font-medium">{sn.supplierName}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">คลังสินค้า:</span>
                                <p className="font-medium">{sn.warehouseName}</p>
                                {sn.locationName && (
                                  <p className="text-xs text-muted-foreground">{sn.locationName}</p>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">ราคาซื้อ:</span>
                                <p className="font-medium">฿{sn.purchasePrice.toLocaleString()}</p>
                              </div>
                              {sn.sellingPrice && (
                                <div>
                                  <span className="text-muted-foreground">ราคาขาย:</span>
                                  <p className="font-medium">฿{sn.sellingPrice.toLocaleString()}</p>
                                </div>
                              )}
                              {sn.rentalPrice && (
                                <div>
                                  <span className="text-muted-foreground">ราคาเช่า:</span>
                                  <p className="font-medium">฿{sn.rentalPrice.toLocaleString()}/เดือน</p>
                                </div>
                              )}
                            </div>

                            {sn.currentCustomerName && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <span className="text-muted-foreground">ลูกค้าปัจจุบัน:</span>
                                <span className="font-medium ml-1">{sn.currentCustomerName}</span>
                              </div>
                            )}

                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>รับเมื่อ: {formatDate(sn.receivedDate)}</span>
                              <span className="ml-4">อัปเดตล่าสุด: {formatDate(sn.lastMovementDate)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <QrCode className="w-4 h-4" />
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

        {/* Batch Management */}
        <TabsContent value="batches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>กลุ่ม/Batch Serial Number</span>
                <Badge variant="outline">
                  {batches.length} กลุ่ม
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches.map((batch) => (
                  <div key={batch.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-lg">{batch.batchNumber}</h4>
                          {getBatchStatusBadge(batch.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">จำนวน:</span>
                            <p className="font-medium">{batch.receivedQuantity}/{batch.totalQuantity} ชิ้น</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">วันที่รับ:</span>
                            <p className="font-medium">{formatDate(batch.receivedDate)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">ความคืบหน้า:</span>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(batch.receivedQuantity / batch.totalQuantity) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        {batch.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <span className="text-muted-foreground">หมายเหตุ:</span>
                            <span className="ml-1">{batch.notes}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <h5 className="font-medium mb-2">Serial Numbers ในกลุ่ม:</h5>
                      <div className="flex flex-wrap gap-2">
                        {batch.serialNumbers.map((sn, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {sn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Serial Number Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              รายละเอียด Serial Number: {selectedSerialNumber?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedSerialNumber && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">ข้อมูลพื้นฐาน</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial Number:</span>
                        <span className="font-medium">{selectedSerialNumber.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">สถานะ:</span>
                        {getStatusBadge(selectedSerialNumber.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">สภาพ:</span>
                        {getConditionBadge(selectedSerialNumber.condition)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">QR Code:</span>
                        <span className="font-medium">{selectedSerialNumber.qrCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Barcode:</span>
                        <span className="font-medium">{selectedSerialNumber.barcode}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">ข้อมูลสินค้า</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อสินค้า:</span>
                        <span className="font-medium">{selectedSerialNumber.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SKU:</span>
                        <span className="font-medium">{selectedSerialNumber.productSku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ซัพพลายเออร์:</span>
                        <span className="font-medium">{selectedSerialNumber.supplierName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">ข้อมูลราคา</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ราคาซื้อ:</span>
                        <span className="font-medium">฿{selectedSerialNumber.purchasePrice.toLocaleString()}</span>
                      </div>
                      {selectedSerialNumber.sellingPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ราคาขาย:</span>
                          <span className="font-medium">฿{selectedSerialNumber.sellingPrice.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedSerialNumber.rentalPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ราคาเช่า:</span>
                          <span className="font-medium">฿{selectedSerialNumber.rentalPrice.toLocaleString()}/เดือน</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">ข้อมูลตำแหน่ง</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">คลังสินค้า:</span>
                        <span className="font-medium">{selectedSerialNumber.warehouseName}</span>
                      </div>
                      {selectedSerialNumber.locationName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ตำแหน่ง:</span>
                          <span className="font-medium">{selectedSerialNumber.locationName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedSerialNumber.warrantyStartDate && (
                    <div>
                      <h3 className="font-medium mb-2">ข้อมูลการรับประกัน</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">เริ่มรับประกัน:</span>
                          <span className="font-medium">{formatDate(selectedSerialNumber.warrantyStartDate)}</span>
                        </div>
                        {selectedSerialNumber.warrantyEndDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">สิ้นสุดรับประกัน:</span>
                            <span className="font-medium">{formatDate(selectedSerialNumber.warrantyEndDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Customer */}
              {selectedSerialNumber.currentCustomerName && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    ลูกค้าปัจจุบัน
                  </h3>
                  <div className="text-sm">
                    <span className="font-medium">{selectedSerialNumber.currentCustomerName}</span>
                    {selectedSerialNumber.saleId && (
                      <span className="ml-2 text-muted-foreground">(ขาย: {selectedSerialNumber.saleId})</span>
                    )}
                    {selectedSerialNumber.rentalId && (
                      <span className="ml-2 text-muted-foreground">(เช่า: {selectedSerialNumber.rentalId})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Movement History */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  ประวัติการเคลื่อนไหว
                </h3>
                <div className="space-y-3">
                  {selectedSerialNumber.movements.map((movement) => (
                    <div key={movement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{movement.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(movement.timestamp)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{movement.reason}</p>
                        <div className="text-xs text-muted-foreground">
                          <span>โดย: {movement.employeeName}</span>
                          {movement.referenceId && (
                            <span className="ml-2">อ้างอิง: {movement.referenceId}</span>
                          )}
                        </div>
                        {movement.fromLocation && movement.toLocation && (
                          <div className="text-xs text-muted-foreground mt-1">
                            จาก: {movement.fromLocation} → ไป: {movement.toLocation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              {selectedSerialNumber.documents && selectedSerialNumber.documents.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    เอกสารที่เกี่ยวข้อง
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSerialNumber.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            อัปโหลดโดย: {doc.uploadedBy} • {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSerialNumber.notes && (
                <div>
                  <h3 className="font-medium mb-2">หมายเหตุ</h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedSerialNumber.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
                <Button variant="outline">
                  <QrCode className="w-4 h-4 mr-2" />
                  พิมพ์ QR Code
                </Button>
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  เพิ่มการเคลื่อนไหว
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}