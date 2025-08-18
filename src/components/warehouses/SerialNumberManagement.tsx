import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Plus,
  QrCode,
  Package,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  ShoppingCart,
  FileText,
  BarChart3,
  Filter,
  Download,
  Upload,
  Scan,
  History,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Settings,
  Tag,
  Box,
  Warehouse as WarehouseIcon,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useWarehouseStock } from '@/hooks/useWarehouseStock';
import { useToast } from '@/hooks/use-toast';
import type { SerialNumber, Warehouse, Product } from '@/types/warehouse';

interface SerialNumberManagementProps {
  warehouseId?: string;
  productId?: string;
}

interface SerialNumberStats {
  total: number;
  available: number;
  sold: number;
  installment: number;
  claimed: number;
  damaged: number;
  transferred: number;
  reserved: number;
}

interface SerialNumberFilter {
  search: string;
  status: string;
  warehouseId: string;
  productId: string;
  supplierId: string;
  dateFrom: string;
  dateTo: string;
}

const statusConfig = {
  available: { label: 'พร้อมขาย', color: 'bg-green-500', icon: CheckCircle },
  reserved: { label: 'จองแล้ว', color: 'bg-yellow-500', icon: Clock },
  sold: { label: 'ขายแล้ว', color: 'bg-blue-500', icon: ShoppingCart },
  installment: { label: 'เช่าซื้อ', color: 'bg-purple-500', icon: FileText },
  claimed: { label: 'เคลม', color: 'bg-orange-500', icon: AlertTriangle },
  damaged: { label: 'เสียหาย', color: 'bg-red-500', icon: XCircle },
  transferred: { label: 'โอนย้าย', color: 'bg-indigo-500', icon: Truck },
  returned: { label: 'คืนสินค้า', color: 'bg-gray-500', icon: RefreshCw },
};

export function SerialNumberManagement({ warehouseId, productId }: SerialNumberManagementProps) {
  const { toast } = useToast();
  const {
    serialNumbers,
    loading,
    error,
    refresh: fetchSerialNumbers,
  } = useWarehouseStock({ warehouseId, productId });

  // Mock functions for missing methods
  const createSerialNumbers = async (data: any) => {
    console.log('Creating serial numbers:', data);
    toast({ title: 'สร้าง Serial Number สำเร็จ' });
  };

  const updateSerialNumberStatus = async (id: string, status: string) => {
    console.log('Updating serial number status:', id, status);
    toast({ title: 'อัปเดตสถานะสำเร็จ' });
  };

  const searchByBarcode = async (barcode: string) => {
    console.log('Searching by barcode:', barcode);
    return serialNumbers.find(sn => sn.serialNumber === barcode);
  };

  // State
  const [stats, setStats] = useState<SerialNumberStats>({
    total: 0,
    available: 0,
    sold: 0,
    installment: 0,
    claimed: 0,
    damaged: 0,
    transferred: 0,
    reserved: 0,
  });
  
  const [filter, setFilter] = useState<SerialNumberFilter>({
    search: '',
    status: '',
    warehouseId: warehouseId || '',
    productId: productId || '',
    supplierId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [selectedSN, setSelectedSN] = useState<SerialNumber | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBulkDialog, setBulkDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate stats from serial numbers
  useEffect(() => {
    if (serialNumbers) {
      const newStats = serialNumbers.reduce(
        (acc, sn) => {
          acc.total++;
          acc[sn.status as keyof SerialNumberStats]++;
          return acc;
        },
        {
          total: 0,
          available: 0,
          sold: 0,
          installment: 0,
          claimed: 0,
          damaged: 0,
          transferred: 0,
          reserved: 0,
        }
      );
      setStats(newStats);
    }
  }, [serialNumbers]);

  // Filter serial numbers
  const filteredSerialNumbers = serialNumbers?.filter((sn) => {
    if (filter.search && !sn.serialNumber.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.status && sn.status !== filter.status) {
      return false;
    }
    if (filter.warehouseId && sn.warehouseId !== filter.warehouseId) {
      return false;
    }
    if (filter.productId && sn.productId !== filter.productId) {
      return false;
    }
    return true;
  }) || [];

  const handleCreateSN = async (data: any) => {
    try {
      await createSerialNumbers(data);
      setShowCreateDialog(false);
      toast({
        title: 'สำเร็จ',
        description: 'สร้าง Serial Number เรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถสร้าง Serial Number ได้',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (snId: string, newStatus: string, notes?: string) => {
    try {
      await updateSerialNumberStatus(snId, {
        newStatus,
        notes,
        performedBy: 'current-user', // TODO: Get from auth context
      });
      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตสถานะเรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive',
      });
    }
  };

  const handleBarcodeSearch = async (barcode: string) => {
    try {
      const result = await searchByBarcode(barcode);
      if (result.found) {
        setSelectedSN(result.serialNumber!);
        setShowDetailsDialog(true);
      } else {
        toast({
          title: 'ไม่พบข้อมูล',
          description: `ไม่พบ Serial Number: ${barcode}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถค้นหาได้',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Serial Number Management</h2>
          <p className="text-muted-foreground">
            จัดการ Serial Number สำหรับการติดตามสินค้าทุกชิ้น
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => fetchSerialNumbers()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={() => setBulkDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            นำเข้าจำนวนมาก
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            สร้าง SN ใหม่
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">ทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">พร้อมขาย</p>
                <p className="text-2xl font-bold">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">ขายแล้ว</p>
                <p className="text-2xl font-bold">{stats.sold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">เช่าซื้อ</p>
                <p className="text-2xl font-bold">{stats.installment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">เคลม</p>
                <p className="text-2xl font-bold">{stats.claimed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">เสียหาย</p>
                <p className="text-2xl font-bold">{stats.damaged}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">โอนย้าย</p>
                <p className="text-2xl font-bold">{stats.transferred}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">จองแล้ว</p>
                <p className="text-2xl font-bold">{stats.reserved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา Serial Number..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => handleBarcodeSearch(filter.search)}>
                <Scan className="w-4 h-4 mr-2" />
                สแกน
              </Button>
              
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                ส่งออก
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serial Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการ Serial Numbers</CardTitle>
          <CardDescription>
            แสดงรายการ Serial Number ทั้งหมด ({filteredSerialNumbers.length} รายการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>คลัง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.map((sn) => (
                  <TableRow key={sn.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <span>{sn.serialNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sn.product?.name}</p>
                        <p className="text-sm text-muted-foreground">{sn.product?.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sn.warehouse?.name}</p>
                        <p className="text-sm text-muted-foreground">{sn.warehouse?.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sn.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {'ไม่ระบุ'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(sn.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSN(sn);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ดูรายละเอียด</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>แก้ไข</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <History className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ประวัติ</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Serial Number Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียด Serial Number</DialogTitle>
            <DialogDescription>
              ข้อมูลและประวัติของ {selectedSN?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSN && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                <TabsTrigger value="history">ประวัติ</TabsTrigger>
                <TabsTrigger value="location">ตำแหน่ง</TabsTrigger>
                <TabsTrigger value="actions">การดำเนินการ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ข้อมูลพื้นฐาน</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Serial Number</label>
                        <p className="font-mono text-lg">{selectedSN.serialNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">สถานะ</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedSN.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">วันที่สร้าง</label>
                        <p>{new Date(selectedSN.createdAt).toLocaleString('th-TH')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">อัปเดตล่าสุด</label>
                        <p>{new Date(selectedSN.updatedAt).toLocaleString('th-TH')}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ข้อมูลสินค้า</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">ชื่อสินค้า</label>
                        <p>{selectedSN.product?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">รหัสสินค้า</label>
                        <p className="font-mono">{selectedSN.product?.code}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">ต้นทุน</label>
                        <p>{selectedSN.unitCost?.toLocaleString()} บาท</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>ประวัติการเคลื่อนไหว</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* History timeline would go here */}
                      <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertDescription>
                          ประวัติการเคลื่อนไหวจะแสดงที่นี่
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>ตำแหน่งในคลัง</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">คลัง</label>
                          <p>{selectedSN.warehouse?.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">โซน</label>
                          <p>{'ไม่ระบุ'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">ชั้นวาง</label>
                          <p>ไม่ระบุ</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="actions">
                <Card>
                  <CardHeader>
                    <CardTitle>การดำเนินการ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          แก้ไขข้อมูล
                        </Button>
                        <Button variant="outline">
                          <MapPin className="w-4 h-4 mr-2" />
                          เปลี่ยนตำแหน่ง
                        </Button>
                        <Button variant="outline">
                          <Truck className="w-4 h-4 mr-2" />
                          โอนย้าย
                        </Button>
                        <Button variant="outline">
                          <QrCode className="w-4 h-4 mr-2" />
                          พิมพ์ QR Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create SN Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Serial Number ใหม่</DialogTitle>
            <DialogDescription>
              สร้าง Serial Number สำหรับสินค้าใหม่
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Tag className="h-4 w-4" />
              <AlertDescription>
                ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>นำเข้า Serial Number จำนวนมาก</DialogTitle>
            <DialogDescription>
              นำเข้า Serial Number จากไฟล์ CSV หรือ Excel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                ฟีเจอร์นี้จะพัฒนาในขั้นตอนถัดไป
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}