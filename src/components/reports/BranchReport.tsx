import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBranch } from '@/hooks/useBranch';
import { exportToCSV } from '@/utils/reportHelpers';
import {
  Building2,
  Package,
  Download,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchReportProps {
  className?: string;
}

export function BranchReport({ className }: BranchReportProps) {
  const { toast } = useToast();
  const { branches, loading, error } = useBranch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate branch statistics
  const branchStatistics = useMemo(() => {
    if (!branches) return {
      totalBranches: 0,
      activeBranches: 0,
      totalCapacity: 0,
      totalUtilization: 0,
      averageUtilizationRate: 0,
      branchBreakdown: []
    };

    const totalBranches = branches.length;
    const activeBranches = branches.filter(b => b.status === 'active').length;
    const totalCapacity = branches.reduce((sum, b) => sum + b.capacity.storageCapacity, 0);
    const totalUtilization = branches.reduce((sum, b) => sum + b.capacity.currentUtilization, 0);
    const averageUtilizationRate = totalBranches > 0 ? 
      branches.reduce((sum, b) => sum + b.capacity.utilizationPercentage, 0) / totalBranches : 0;

    return {
      totalBranches,
      activeBranches,
      totalCapacity,
      totalUtilization,
      averageUtilizationRate,
      branchBreakdown: branches.map(b => ({
        branchId: b.id,
        branchName: b.name,
        stockCount: b.capacity.currentUtilization,
        stockValue: 0,
        utilization: b.capacity.utilizationPercentage
      }))
    };
  }, [branches]);

  const handleExportCSV = () => {
    try {
      if (!branches) return;

      const csvData = branches.map(branch => ({
        'รหัสสาขา': branch.code,
        'ชื่อสาขา': branch.name,
        'ประเภท': branch.type,
        'สถานะ': branch.status,
        'จังหวัด': branch.address.province,
        'ผู้จัดการ': branch.contact.manager,
        'พื้นที่รวม': branch.capacity.totalArea,
        'ความจุเก็บของ': branch.capacity.storageCapacity,
        'การใช้งานปัจจุบัน': branch.capacity.currentUtilization,
        'เปอร์เซ็นต์การใช้งาน': branch.capacity.utilizationPercentage
      }));
      
      exportToCSV(csvData, `branch-report-${new Date().toISOString().split('T')[0]}.csv`);
      
      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'รายงานสาขาถูกส่งออกเป็นไฟล์ CSV แล้ว'
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

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    
    return branches.filter(branch => {
      const matchesSearch = !searchTerm || 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.province.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBranch = branchFilter === 'all' || branch.id === branchFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && branch.status === 'active') ||
        (statusFilter === 'inactive' && branch.status === 'inactive') ||
        (statusFilter === 'maintenance' && branch.status === 'maintenance');
      
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [branches, searchTerm, branchFilter, statusFilter]);



  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">กำลังโหลดข้อมูลสาขา...</p>
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
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">รายงานสาขา</h2>
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
          <TabsTrigger value="branches">สาขา</TabsTrigger>
          <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">สาขาทั้งหมด</p>
                    <p className="text-2xl font-bold">{branchStatistics.totalBranches}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ความจุรวม</p>
                    <p className="text-2xl font-bold">{branchStatistics.totalCapacity.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold">{branchStatistics.totalUtilization.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold">{branchStatistics.averageUtilizationRate.toFixed(1)}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch Overview */
          <Card>
            <CardHeader>
              <CardTitle>ภาพรวมสาขา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branchStatistics.branchBreakdown.map((branch) => (
                  <div key={branch.branchId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{branch.branchName}</p>
                        <p className="text-sm text-muted-foreground">
                          การใช้งาน: {branch.stockCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{branch.utilization.toFixed(1)}%</p>
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
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="สาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสาขา</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="สถานะสาขา" />
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
              <CardTitle>รายการสาขา ({filteredBranches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">รหัสสาขา</th>
                      <th className="text-left p-2">ชื่อสาขา</th>
                      <th className="text-left p-2">ประเภท</th>
                      <th className="text-left p-2">จังหวัด</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">การใช้งาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBranches.map((branch) => (
                      <tr key={branch.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{branch.code}</td>
                        <td className="p-2">{branch.name}</td>
                        <td className="p-2">{branch.type}</td>
                        <td className="p-2">{branch.address.province}</td>
                        <td className="p-2">
                          <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                            {branch.status === 'active' ? 'ใช้งาน' : branch.status === 'inactive' ? 'ไม่ใช้งาน' : 'ปรับปรุง'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {branch.capacity.utilizationPercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          {/* Branches List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>{branch.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">รหัสสาขา:</span>
                      <span className="text-sm">{branch.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ประเภท:</span>
                      <span className="text-sm">{branch.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">จังหวัด:</span>
                      <span className="text-sm">{branch.address.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ผู้จัดการ:</span>
                      <span className="text-sm">{branch.contact.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">ความจุเก็บของ:</span>
                      <span className="text-sm font-medium">{branch.capacity.storageCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">การใช้งานปัจจุบัน:</span>
                      <span className="text-sm font-medium">{branch.capacity.currentUtilization.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">เปอร์เซ็นต์การใช้งาน:</span>
                      <span className="text-sm font-medium">{branch.capacity.utilizationPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">สถานะ:</span>
                      <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                        {branch.status === 'active' ? 'ใช้งาน' : branch.status === 'inactive' ? 'ไม่ใช้งาน' : 'ปรับปรุง'}
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
                <CardTitle>อัตราการใช้งานสาขา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">อัตราการใช้งานเฉลี่ย</span>
                  <span className="text-lg font-bold">
                    {branchStatistics.averageUtilizationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(branchStatistics.averageUtilizationRate, 100)}%` }}
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
                      <span className="text-sm">สาขาใช้งาน</span>
                    </div>
                    <span className="font-medium">
                      {branchStatistics.activeBranches}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">สาขาทั้งหมด</span>
                    </div>
                    <span className="font-medium">{branchStatistics.totalBranches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Box className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">ความจุรวม</span>
                    </div>
                    <span className="font-medium">{branchStatistics.totalCapacity.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Branches by Value */}
          <Card>
            <CardHeader>
              <CardTitle>สาขาที่มีมูลค่าสูงสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branchStatistics.branchBreakdown
                  .sort((a, b) => b.stockValue - a.stockValue)
                  .slice(0, 5)
                  .map((branch, index) => (
                    <div key={branch.branchId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{branch.branchName}</p>
                          <p className="text-sm text-muted-foreground">
                            {branch.stockCount.toLocaleString()} รายการ
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">฿{branch.stockValue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          ใช้งาน {branch.utilization.toFixed(1)}%
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

export default BranchReport;