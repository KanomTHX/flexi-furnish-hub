import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWarehouse } from '@/hooks/useWarehouse';
import { exportToCSV } from '@/utils/reportHelpers';
import {
  Building2,
  Package,
  Warehouse,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarehouseReportProps {
  className?: string;
}

export function WarehouseReport({ className }: WarehouseReportProps) {
  const { toast } = useToast();
  const { warehouses, loading, error } = useWarehouse();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate warehouse statistics
  const warehouseStatistics = useMemo(() => {
    if (!warehouses) return {
      totalWarehouses: 0,
      activeWarehouses: 0,
      totalCapacity: 0,
      totalUtilization: 0,
      averageUtilizationRate: 0,
      warehouseBreakdown: []
    };

    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter(w => w.status === 'active').length;
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity.storageCapacity, 0);
    const totalUtilization = warehouses.reduce((sum, w) => sum + w.capacity.currentUtilization, 0);
    const averageUtilizationRate = totalWarehouses > 0 ? 
      warehouses.reduce((sum, w) => sum + w.capacity.utilizationPercentage, 0) / totalWarehouses : 0;

    return {
      totalWarehouses,
      activeWarehouses,
      totalCapacity,
      totalUtilization,
      averageUtilizationRate,
      warehouseBreakdown: warehouses.map(w => ({
        warehouseId: w.id,
        warehouseName: w.name,
        stockCount: w.capacity.currentUtilization,
        stockValue: 0,
        utilization: w.capacity.utilizationPercentage
      }))
    };
  }, [warehouses]);

  const handleExportCSV = () => {
    try {
      if (!warehouses) return;

      const csvData = warehouses.map(warehouse => ({
        'รหัสคลัง': warehouse.code,
        'ชื่อคลัง': warehouse.name,
        'ประเภท': warehouse.type,
        'สถานะ': warehouse.status,
        'จังหวัด': warehouse.address.province,
        'ผู้จัดการ': warehouse.contact.manager,
        'พื้นที่รวม': warehouse.capacity.totalArea,
        'ความจุเก็บของ': warehouse.capacity.storageCapacity,
        'การใช้งานปัจจุบัน': warehouse.capacity.currentUtilization,
        'เปอร์เซ็นต์การใช้งาน': warehouse.capacity.utilizationPercentage
      }));
      
      exportToCSV(csvData, `warehouse-report-${new Date().toISOString().split('T')[0]}.csv`);
      
      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'รายงานคลังสินค้าถูกส่งออกเป็นไฟล์ CSV แล้ว'
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกรายงานได้',
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    
    return warehouses.filter(warehouse => {
      const matchesSearch = !searchTerm || 
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.address.province.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWarehouse = warehouseFilter === 'all' || warehouse.id === warehouseFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && warehouse.status === 'active') ||
        (statusFilter === 'inactive' && warehouse.status === 'inactive') ||
        (statusFilter === 'maintenance' && warehouse.status === 'maintenance');
      
      return matchesSearch && matchesWarehouse && matchesStatus;
    });
  }, [warehouses, searchTerm, warehouseFilter, statusFilter]);



  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูลคลังสินค้า...</p>
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Warehouse className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">รายงานคลังสินค้า</h2>
        </div>
        <div className="flex items-center space-x-2">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="stock">สต็อกสินค้า</TabsTrigger>
          <TabsTrigger value="warehouses">คลังสินค้า</TabsTrigger>
          <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">คลังสินค้าทั้งหมด</p>
                    <p className="text-2xl font-bold">{warehouseStatistics.totalWarehouses}</p>
                  </div>
                  <Warehouse className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ความจุรวม</p>
                    <p className="text-2xl font-bold">{warehouseStatistics.totalCapacity.toLocaleString()}</p>
                  </div>
                  <Box className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">การใช้งานปัจจุบัน</p>
                    <p className="text-2xl font-bold">{warehouseStatistics.totalUtilization.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เปอร์เซ็นต์การใช้งานเฉลี่ย</p>
                    <p className="text-2xl font-bold">{warehouseStatistics.averageUtilizationRate.toFixed(1)}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warehouse Overview */}
          <Card>
            <CardHeader>
              <CardTitle>ภาพรวมคลังสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warehouseStatistics.warehouseBreakdown.map((warehouse) => (
                  <div key={warehouse.warehouseId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Warehouse className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{warehouse.warehouseName}</p>
                        <p className="text-sm text-muted-foreground">
                          การใช้งาน: {warehouse.stockCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{warehouse.utilization.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">
                        อัตราการใช้งาน
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาสินค้า..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="คลังสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกคลัง</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="สถานะคลัง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                    <SelectItem value="maintenance">ปรับปรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stock Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายการคลังสินค้า ({filteredWarehouses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">รหัสคลัง</th>
                      <th className="text-left p-2">ชื่อคลัง</th>
                      <th className="text-left p-2">ประเภท</th>
                      <th className="text-left p-2">จังหวัด</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">การใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWarehouses.map((warehouse) => (
                      <tr key={warehouse.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{warehouse.code}</td>
                        <td className="p-2">{warehouse.name}</td>
                        <td className="p-2">{warehouse.type}</td>
                        <td className="p-2">{warehouse.address.province}</td>
                        <td className="p-2">
                          <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                            {warehouse.status === 'active' ? 'ใช้งาน' : warehouse.status === 'inactive' ? 'ไม่ใช้งาน' : 'ปรับปรุง'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {warehouse.capacity.utilizationPercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          {/* Warehouses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Warehouse className="h-5 w-5" />
                    <span>{warehouse.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">รหัสคลัง:</span>
                      <span className="text-sm">{warehouse.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ประเภท:</span>
                      <span className="text-sm">{warehouse.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">จังหวัด:</span>
                      <span className="text-sm">{warehouse.address.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ผู้จัดการ:</span>
                      <span className="text-sm">{warehouse.contact.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ความจุเก็บของ:</span>
                      <span className="text-sm font-medium">{warehouse.capacity.storageCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">การใช้งานปัจจุบัน:</span>
                      <span className="text-sm font-medium">{warehouse.capacity.currentUtilization.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">เปอร์เซ็นต์การใช้งาน:</span>
                      <span className="text-sm font-medium">{warehouse.capacity.utilizationPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">สถานะ:</span>
                      <Badge variant={warehouse.status === 'active' ? 'default' : 'secondary'}>
                        {warehouse.status === 'active' ? 'ใช้งาน' : warehouse.status === 'inactive' ? 'ไม่ใช้งาน' : 'ปรับปรุง'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>อัตราการใช้งานคลังสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">อัตราการใช้งานเฉลี่ย</span>
                  <span className="text-lg font-bold">
                    {warehouseStatistics.averageUtilizationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(warehouseStatistics.averageUtilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถิติสต็อก</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">คลังใช้งาน</span>
                    </div>
                    <span className="font-medium">
                      {warehouseStatistics.activeWarehouses}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">คลังทั้งหมด</span>
                    </div>
                    <span className="font-medium">{warehouseStatistics.totalWarehouses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Box className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">ความจุรวม</span>
                    </div>
                    <span className="font-medium">{warehouseStatistics.totalCapacity.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Warehouses by Value */}
          <Card>
            <CardHeader>
              <CardTitle>คลังสินค้าที่มีมูลค่าสูงสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {warehouseStatistics.warehouseBreakdown
                  .sort((a, b) => b.stockValue - a.stockValue)
                  .slice(0, 5)
                  .map((warehouse, index) => (
                    <div key={warehouse.warehouseId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{warehouse.warehouseName}</p>
                          <p className="text-sm text-muted-foreground">
                            {warehouse.stockCount.toLocaleString()} รายการ
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">฿{warehouse.stockValue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          ใช้งาน {warehouse.utilization.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WarehouseReport;