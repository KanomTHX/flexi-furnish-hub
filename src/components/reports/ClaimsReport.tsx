import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useClaims } from '@/hooks/useClaims';
import { exportToExcel, exportToPDF } from '@/utils/reportHelpers';
import {
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClaimsReportProps {
  className?: string;
}

export function ClaimsReport({ className }: ClaimsReportProps) {
  const { toast } = useToast();
  const { claims } = useClaims();
  
  // Calculate statistics from claims data
  const claimStatistics = useMemo(() => {
    const totalClaims = claims.length;
    const pendingClaims = claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
    const approvedClaims = claims.filter(c => c.status === 'approved' || c.status === 'completed').length;
    const totalAmount = claims.reduce((sum, c) => sum + (c.actualCost || c.estimatedCost || 0), 0);
    
    return {
      totalClaims,
      pendingClaims,
      approvedClaims,
      totalAmount,
      statusBreakdown: [],
      typeBreakdown: [],
      monthlyTrends: []
    };
  }, [claims]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportCSV = () => {
    try {
      const csvData = filteredClaims.map(claim => ({
        'รหัสเคลม': claim.id,
        'ลูกค้า': claim.customer.name,
        'ประเภท': getClaimTypeLabel(claim.type),
        'สถานะ': getClaimStatusLabel(claim.status),
        'จำนวนเงิน': claim.actualCost || claim.estimatedCost || 0,
        'วันที่สร้าง': new Date(claim.createdAt).toLocaleDateString('th-TH'),
        'วันที่อัปเดต': new Date(claim.updatedAt).toLocaleDateString('th-TH'),
        'รายละเอียด': claim.issueDescription
      }));
      
      exportToExcel(csvData, `claims-report-${new Date().toISOString().split('T')[0]}`);
      
      toast({
        title: 'ส่งออกสำเร็จ',
        description: 'รายงานเคลมถูกส่งออกเป็นไฟล์ Excel แล้ว'
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

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesSearch = !searchTerm || 
        claim.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
      const matchesType = typeFilter === 'all' || claim.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [claims, searchTerm, statusFilter, typeFilter]);

  const getClaimStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'pending': 'รอดำเนินการ',
      'investigating': 'กำลังตรวจสอบ',
      'approved': 'อนุมัติ',
      'rejected': 'ปฏิเสธ',
      'resolved': 'แก้ไขแล้ว'
    };
    return statusLabels[status] || status;
  };

  const getClaimTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'warranty': 'การรับประกัน',
      'damage': 'สินค้าเสียหาย',
      'defect': 'สินค้าบกพร่อง',
      'return': 'การคืนสินค้า',
      'refund': 'การคืนเงิน'
    };
    return typeLabels[type] || type;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'resolved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'investigating':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'investigating':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">รายงานเคลม</h2>
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
          <TabsTrigger value="claims">รายการเคลม</TabsTrigger>
          <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">เคลมทั้งหมด</p>
                    <p className="text-2xl font-bold">{claimStatistics.totalClaims}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">รอดำเนินการ</p>
                    <p className="text-2xl font-bold">{claimStatistics.pendingClaims}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">อนุมัติแล้ว</p>
                    <p className="text-2xl font-bold">{claimStatistics.approvedClaims}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">มูลค่ารวม</p>
                    <p className="text-2xl font-bold">฿{claimStatistics.totalAmount?.toLocaleString() || '0'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Claims */}
          <Card>
            <CardHeader>
              <CardTitle>เคลมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.slice(0, 5).map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(claim.status)}
                      <div>
                        <p className="font-medium">{claim.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{claim.issueDescription}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(claim.status)}>
                        {getClaimStatusLabel(claim.status)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        ฿{(claim.actualCost || claim.estimatedCost || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาเคลม..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="investigating">กำลังตรวจสอบ</SelectItem>
                    <SelectItem value="approved">อนุมัติ</SelectItem>
                    <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                    <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="ประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    <SelectItem value="warranty">การรับประกัน</SelectItem>
                    <SelectItem value="damage">สินค้าเสียหาย</SelectItem>
                    <SelectItem value="defect">สินค้าบกพร่อง</SelectItem>
                    <SelectItem value="return">การคืนสินค้า</SelectItem>
                    <SelectItem value="refund">การคืนเงิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Claims Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายการเคลม ({filteredClaims.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">รหัสเคลม</th>
                      <th className="text-left p-2">ลูกค้า</th>
                      <th className="text-left p-2">ประเภท</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">จำนวนเงิน</th>
                      <th className="text-left p-2">วันที่สร้าง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{claim.id}</td>
                        <td className="p-2">{claim.customer.name}</td>
                        <td className="p-2">{getClaimTypeLabel(claim.type)}</td>
                        <td className="p-2">
                          <Badge variant={getStatusBadgeVariant(claim.status)}>
                            {getClaimStatusLabel(claim.status)}
                          </Badge>
                        </td>
                        <td className="p-2">฿{(claim.actualCost || claim.estimatedCost || 0).toLocaleString()}</td>
                        <td className="p-2">
                          {new Date(claim.claimDate).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>สถิติตามสถานะ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claimStatistics.statusBreakdown?.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span>{getClaimStatusLabel(item.status)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">ไม่มีข้อมูล</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถิติตามประเภท</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claimStatistics.typeBreakdown?.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>{getClaimTypeLabel(item.type)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">ไม่มีข้อมูล</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends */}
          <Card>
            <CardHeader>
              <CardTitle>แนวโน้มเคลมรายเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claimStatistics.monthlyTrends?.map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{trend.month}</p>
                      <p className="text-sm text-muted-foreground">
                        {trend.totalClaims} เคลม
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">฿{trend.totalAmount.toLocaleString()}</p>
                      <div className="flex items-center text-sm">
                        {trend.changePercentage > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                        )}
                        <span className={trend.changePercentage > 0 ? 'text-red-500' : 'text-green-500'}>
                          {Math.abs(trend.changePercentage).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">ไม่มีข้อมูลแนวโน้ม</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClaimsReport;