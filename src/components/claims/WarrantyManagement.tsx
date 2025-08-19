import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Calendar as CalendarIcon,
  User,
  Phone,
  Package,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  Bell,
  QrCode,
  Building,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useWarranty, type WarrantyRecord, type WarrantyStatus } from '@/hooks/useWarranty';

export function WarrantyManagement() {
  const {
    warranties,
    metrics,
    loading,
    error,
    loadWarranties,
    isWarrantyExpired,
    isWarrantyExpiringSoon,
    getDaysUntilExpiry
  } = useWarranty();
  
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | 'all'>('all');
  const [showWarrantyDialog, setShowWarrantyDialog] = useState(false);

  // Helper functions
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: th });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getWarrantyStatusColor = (status: WarrantyStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'voided':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'transferred':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWarrantyStatusText = (status: WarrantyStatus): string => {
    switch (status) {
      case 'active':
        return 'ใช้งานได้';
      case 'expired':
        return 'หมดอายุ';
      case 'voided':
        return 'ยกเลิก';
      case 'transferred':
        return 'โอนย้าย';
      default:
        return 'ไม่ทราบ';
    }
  };



  // Filter warranties
  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = warranty.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || warranty.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle filter changes
  useEffect(() => {
    loadWarranties({
      status: statusFilter,
      search: searchTerm
    });
  }, [statusFilter, searchTerm, loadWarranties]);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">การรับประกันทั้งหมด</p>
                <p className="text-2xl font-bold">{metrics?.totalWarranties || 0}</p>
                <p className="text-xs text-green-600">ใช้งานได้ {metrics?.activeWarranties || 0} รายการ</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">หมดอายุแล้ว</p>
                <p className="text-2xl font-bold">{metrics?.expiredWarranties || 0}</p>
                <p className="text-xs text-red-600">จาก {metrics?.totalWarranties || 0} รายการ</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ใกล้หมดอายุ</p>
                <p className="text-2xl font-bold">{metrics?.expiringThisMonth || 0}</p>
                <p className="text-xs text-orange-600">ภายใน 30 วัน</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">มูลค่ารวม</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalWarrantyValue || 0)}</p>
                <p className="text-xs text-blue-600">เฉลี่ย {metrics?.averageWarrantyPeriod || 0} เดือน</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            การจัดการรับประกัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาด้วยหมายเลขซีเรียล, ชื่อสินค้า, หรือชื่อลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: WarrantyStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งานได้</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
                <SelectItem value="voided">ยกเลิก</SelectItem>
                <SelectItem value="transferred">โอนย้าย</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadWarranties} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>

          {/* Warranties List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                การรับประกัน ({filteredWarranties.length} รายการ)
              </h3>
            </div>

            {filteredWarranties.map((warranty) => {
              const daysLeft = getDaysUntilExpiry(warranty.warranty_end_date);
              const isExpired = isWarrantyExpired(warranty.warranty_end_date);
              const isExpiringSoon = isWarrantyExpiringSoon(warranty.warranty_end_date);

              return (
                <div key={warranty.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getWarrantyStatusColor(warranty.status)}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{warranty.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          SN: {warranty.serial_number} • {warranty.product_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getWarrantyStatusColor(warranty.status)}>
                        {getWarrantyStatusText(warranty.status)}
                      </Badge>
                      {isExpiringSoon && !isExpired && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          เหลือ {daysLeft} วัน
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">ลูกค้า</p>
                      <p>{warranty.customer_name}</p>
                      <p className="text-muted-foreground">{warranty.customer_phone}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">วันที่ซื้อ</p>
                      <p>{formatDate(warranty.purchase_date)}</p>
                      <p className="text-muted-foreground">{formatCurrency(warranty.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">ระยะประกัน</p>
                      <p>{warranty.warranty_period} เดือน</p>
                      <p className="text-muted-foreground">
                        {formatDate(warranty.warranty_start_date)} - {formatDate(warranty.warranty_end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">ผู้จำหน่าย</p>
                      <p className="text-muted-foreground">{warranty.supplier_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">อัปเดตล่าสุด:</span> {formatDate(warranty.updated_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWarranty(warranty);
                          setShowWarrantyDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>

                  {warranty.notes && (
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm">{warranty.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredWarranties.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบข้อมูลการรับประกัน</p>
                <p className="text-sm mt-2">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warranty Detail Dialog */}
      <Dialog open={showWarrantyDialog} onOpenChange={setShowWarrantyDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              รายละเอียดการรับประกัน
              {selectedWarranty && (
                <p className="font-medium">{selectedWarranty.serial_number}</p>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWarranty && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className={getWarrantyStatusColor(selectedWarranty.status)}>
                  {getWarrantyStatusText(selectedWarranty.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">สินค้า</Label>
                    <p>{selectedWarranty.product_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedWarranty.product_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ลูกค้า</Label>
                    <p>{selectedWarranty.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedWarranty.customer_email}</p>
                    <p className="text-sm text-muted-foreground">{selectedWarranty.customer_phone}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">วันที่ซื้อ</Label>
                    <p>{formatDate(selectedWarranty.purchase_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">วันเริ่มประกัน</Label>
                    <p>{formatDate(selectedWarranty.warranty_start_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">วันหมดประกัน</Label>
                    <p>{formatDate(selectedWarranty.warranty_end_date)}</p>
                  </div>
                </div>
              </div>

              {selectedWarranty.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">หมายเหตุ</Label>
                  <p className="mt-1 p-3 bg-muted rounded">{selectedWarranty.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowWarrantyDialog(false)}>
                  ปิด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}