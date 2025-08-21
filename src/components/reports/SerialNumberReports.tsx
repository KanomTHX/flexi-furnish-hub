import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/hooks/useBranch';

import {
  Hash,
  Package,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Box,
  Truck,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SNStatus } from '@/types/branch';

interface SerialNumberReportsProps {
  className?: string;
}

export function SerialNumberReports({ className }: SerialNumberReportsProps) {
  const { toast } = useToast();
  const { serialNumbers, loading, error } = useBranch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  // Calculate serial number statistics
  const serialNumberStatistics = useMemo(() => {
    if (!serialNumbers) return {
      totalSerialNumbers: 0,
      availableCount: 0,
      soldCount: 0,
      transferredCount: 0,
      claimedCount: 0,
      damagedCount: 0,
      reservedCount: 0,
      statusBreakdown: [],
      branchBreakdown: []
    };

    const totalSerialNumbers = serialNumbers.length;
    const availableCount = serialNumbers.filter(sn => sn.status === SNStatus.AVAILABLE).length;
    const soldCount = serialNumbers.filter(sn => sn.status === SNStatus.SOLD).length;
    const transferredCount = serialNumbers.filter(sn => sn.status === SNStatus.TRANSFERRED).length;
    const claimedCount = serialNumbers.filter(sn => sn.status === SNStatus.CLAIMED).length;
    const damagedCount = serialNumbers.filter(sn => sn.status === SNStatus.DAMAGED).length;
    const reservedCount = serialNumbers.filter(sn => sn.status === SNStatus.RESERVED).length;

    const statusBreakdown = [
      { status: 'available', count: availableCount, label: 'พร้อมใช้งาน' },
      { status: 'sold', count: soldCount, label: 'ขายแล้ว' },
      { status: 'transferred', count: transferredCount, label: 'โอนย้าย' },
      { status: 'claimed', count: claimedCount, label: 'เคลม' },
      { status: 'damaged', count: damagedCount, label: 'เสียหาย' },
      { status: 'reserved', count: reservedCount, label: 'จอง' }
    ];

    // Group by branch
    const branchGroups = serialNumbers.reduce((acc, sn) => {
      const branchId = sn.branchId;
      const branchName = sn.branch?.name || branchId;
      
      if (!acc[branchId]) {
        acc[branchId] = {
          branchId,
          branchName,
          total: 0,
          available: 0,
          sold: 0,
          other: 0
        };
      }
      
      acc[branchId].total++;
      if (sn.status === SNStatus.AVAILABLE) acc[branchId].available++;
      else if (sn.status === SNStatus.SOLD) acc[branchId].sold++;
      else acc[branchId].other++;
      
      return acc;
    }, {} as Record<string, any>);

    const branchBreakdown = Object.values(branchGroups);

    return {
      totalSerialNumbers,
      availableCount,
      soldCount,
      transferredCount,
      claimedCount,
      damagedCount,
      reservedCount,
      statusBreakdown,
      branchBreakdown
    };
  }, [serialNumbers]);

  const handleExportCSV = () => {
    try {
      if (!serialNumbers) return;

      const exportData = serialNumbers.map(sn => ({
        'หมายเลขซีเรียล': sn.serialNumber,
        'รหัสสินค้า': sn.product?.code || sn.productId,
        'ชื่อสินค้า': sn.product?.name || '',
        'แบรนด์': sn.product?.brand || '',
        'โมเดล': sn.product?.model || '',
        'สาขา': sn.branch?.name || sn.branchId,
        'สถานะ': getStatusLabel(sn.status),
        'ต้นทุน': sn.unitCost,
        'ผู้จำหน่าย': sn.supplier?.name || '',
        'เลขที่ใบแจ้งหนี้': sn.invoiceNumber || '',
        'วันที่ขาย': sn.soldAt ? new Date(sn.soldAt).toLocaleDateString('th-TH') : '',
        'ขายให้': sn.soldTo || '',
        'เลขที่อ้างอิง': sn.referenceNumber || '',
        'หมายเหตุ': sn.notes || '',
        'วันที่สร้าง': new Date(sn.createdAt).toLocaleDateString('th-TH')
      }));

      console.log('Serial number report data prepared for export:', exportData);

      toast({
        title: "เตรียมข้อมูลสำเร็จ",
        description: "ข้อมูลรายงานหมายเลขซีเรียลพร้อมส่งออกแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเตรียมข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const filteredSerialNumbers = useMemo(() => {
    if (!serialNumbers) return [];
    
    return serialNumbers.filter(sn => {
      const matchesSearch = !searchTerm || 
        sn.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sn.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sn.product?.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sn.branch?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || sn.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || sn.branchId === branchFilter;
      const matchesProduct = productFilter === 'all' || sn.productId === productFilter;
      
      return matchesSearch && matchesStatus && matchesBranch && matchesProduct;
    });
  }, [serialNumbers, searchTerm, statusFilter, branchFilter, productFilter]);

  const getStatusLabel = (status: SNStatus) => {
    switch (status) {
      case SNStatus.AVAILABLE: return 'พร้อมใช้งาน';
      case SNStatus.SOLD: return 'ขายแล้ว';
      case SNStatus.TRANSFERRED: return 'โอนย้าย';
      case SNStatus.CLAIMED: return 'เคลม';
      case SNStatus.DAMAGED: return 'เสียหาย';
      case SNStatus.RESERVED: return 'จอง';
      default: return status;
    }
  };

  const getStatusBadge = (status: SNStatus) => {
    switch (status) {
      case SNStatus.AVAILABLE:
        return <Badge variant="default" className="bg-green-100 text-green-800">พร้อมใช้งาน</Badge>;
      case SNStatus.SOLD:
        return <Badge variant="default" className="bg-blue-100 text-blue-800">ขายแล้ว</Badge>;
      case SNStatus.TRANSFERRED:
        return <Badge variant="default" className="bg-purple-100 text-purple-800">โอนย้าย</Badge>;
      case SNStatus.CLAIMED:
        return <Badge variant="destructive">เคลม</Badge>;
      case SNStatus.DAMAGED:
        return <Badge variant="destructive">เสียหาย</Badge>;
      case SNStatus.RESERVED:
        return <Badge variant="secondary">จอง</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: SNStatus) => {
    switch (status) {
      case SNStatus.AVAILABLE:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case SNStatus.SOLD:
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case SNStatus.TRANSFERRED:
        return <Truck className="h-4 w-4 text-purple-500" />;
      case SNStatus.CLAIMED:
      case SNStatus.DAMAGED:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case SNStatus.RESERVED:
        return <Package className="h-4 w-4 text-yellow-500" />;
      default:
        return <Box className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูลหมายเลขซีเรียล...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          </div>
        </div>
      </div>
    );
  }

  if (!serialNumberStatistics) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">ไม่พบข้อมูลหมายเลขซีเรียล</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">รายงานหมายเลขซีเรียล</h2>
          <p className="text-muted-foreground">ติดตามและจัดการหมายเลขซีเรียลของสินค้า</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="serial-numbers">รายการหมายเลขซีเรียล</TabsTrigger>
          <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">หมายเลขซีเรียลทั้งหมด</p>
                    <p className="text-2xl font-bold">{serialNumberStatistics.totalSerialNumbers.toLocaleString()}</p>
                  </div>
                  <Hash className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">พร้อมใช้งาน</p>
                    <p className="text-2xl font-bold">{serialNumberStatistics.availableCount.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ขายแล้ว</p>
                    <p className="text-2xl font-bold">{serialNumberStatistics.soldCount.toLocaleString()}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เสียหาย/เคลม</p>
                    <p className="text-2xl font-bold">{(serialNumberStatistics.damagedCount + serialNumberStatistics.claimedCount).toLocaleString()}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>การแจกแจงตามสถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serialNumberStatistics.statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status as SNStatus)}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.count.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {((item.count / serialNumberStatistics.totalSerialNumbers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Branch Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>การแจกแจงตามสาขา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serialNumberStatistics.branchBreakdown.map((branch) => (
                  <div key={branch.branchId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{branch.branchName}</p>
                        <p className="text-sm text-muted-foreground">
                          พร้อมใช้งาน: {branch.available} | ขายแล้ว: {branch.sold} | อื่นๆ: {branch.other}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{branch.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {((branch.total / serialNumberStatistics.totalSerialNumbers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="serial-numbers" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาหมายเลขซีเรียล, สินค้า, คลัง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value={SNStatus.AVAILABLE}>พร้อมใช้งาน</SelectItem>
                    <SelectItem value={SNStatus.SOLD}>ขายแล้ว</SelectItem>
                    <SelectItem value={SNStatus.TRANSFERRED}>โอนย้าย</SelectItem>
                    <SelectItem value={SNStatus.CLAIMED}>เคลม</SelectItem>
                    <SelectItem value={SNStatus.DAMAGED}>เสียหาย</SelectItem>
                    <SelectItem value={SNStatus.RESERVED}>จอง</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="สาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสาขา</SelectItem>
                    {/* Add branch options dynamically */}
                  </SelectContent>
                </Select>

                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="สินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสินค้า</SelectItem>
                    {/* Add product options dynamically */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Serial Numbers List */}
          <Card>
            <CardHeader>
              <CardTitle>รายการหมายเลขซีเรียล ({filteredSerialNumbers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">หมายเลขซีเรียล</th>
                      <th className="text-left p-2">สินค้า</th>
                      <th className="text-left p-2">สาขา</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">ต้นทุน</th>
                      <th className="text-left p-2">วันที่สร้าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSerialNumbers.map((sn) => (
                      <tr key={sn.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{sn.serialNumber}</td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{sn.product?.name || 'ไม่ระบุ'}</p>
                            <p className="text-sm text-muted-foreground">{sn.product?.code || sn.productId}</p>
                          </div>
                        </td>
                        <td className="p-2">{sn.branch?.name || sn.branchId}</td>
                        <td className="p-2">
                          {getStatusBadge(sn.status)}
                        </td>
                        <td className="p-2">฿{sn.unitCost.toLocaleString()}</td>
                        <td className="p-2">{new Date(sn.createdAt).toLocaleDateString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สถิติการใช้งาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">อัตราการขาย</span>
                    <span className="text-lg font-bold">
                      {((serialNumberStatistics.soldCount / serialNumberStatistics.totalSerialNumbers) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(serialNumberStatistics.soldCount / serialNumberStatistics.totalSerialNumbers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถิติปัญหา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">เสียหาย</span>
                    </div>
                    <span className="font-medium">{serialNumberStatistics.damagedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">เคลม</span>
                    </div>
                    <span className="font-medium">{serialNumberStatistics.claimedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">โอนย้าย</span>
                    </div>
                    <span className="font-medium">{serialNumberStatistics.transferredCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}