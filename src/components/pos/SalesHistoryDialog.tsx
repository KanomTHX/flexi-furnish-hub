import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  History, 
  Search, 
  Filter,
  Calendar,
  User,
  CreditCard,
  Receipt,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { Sale } from '@/types/pos';

interface SalesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: Sale[];
  onRefresh?: () => void;
}

export const SalesHistoryDialog: React.FC<SalesHistoryDialogProps> = ({
  open,
  onOpenChange,
  sales,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  // Filter sales based on criteria
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.customer?.phone?.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || sale.paymentMethod?.type === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saleDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = saleDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Calculate statistics
  const stats = {
    totalSales: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    averageAmount: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length 
      : 0,
    totalItems: filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: 'default' as const, label: 'สำเร็จ', color: 'bg-green-100 text-green-800' },
      pending: { variant: 'secondary' as const, label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { variant: 'destructive' as const, label: 'ยกเลิก', color: '' },
      refunded: { variant: 'outline' as const, label: 'คืนเงิน', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.completed;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'digital_wallet': return '📱';
      default: return '💰';
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetail(true);
  };

  const handleExportSales = () => {
    // Prepare filtered sales data for export
    const exportData = filteredSales.map(sale => ({
      'เลขที่ขาย': sale.saleNumber,
      'วันที่': formatDateTime(sale.createdAt),
      'ลูกค้า': sale.customer?.name || 'ไม่ระบุ',
      'จำนวนรายการ': sale.items.reduce((sum, item) => sum + item.quantity, 0),
      'ยอดรวม': sale.total,
      'วิธีชำระ': sale.paymentMethod?.name || '',
      'สถานะ': sale.status
    }));

    console.log('Sales history data prepared for export:', exportData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              ประวัติการขาย
            </DialogTitle>
            <DialogDescription>
              ดูประวัติการขายทั้งหมด สถิติ และรายละเอียดการขาย
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
              <TabsTrigger value="history">ประวัติการขาย</TabsTrigger>
              <TabsTrigger value="analytics">การวิเคราะห์</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ยอดขายทั้งหมด</p>
                        <p className="text-2xl font-bold">{stats.totalSales}</p>
                      </div>
                      <Receipt className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">มูลค่ารวม</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(stats.totalAmount)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">ค่าเฉลี่ยต่อบิล</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(stats.averageAmount)}
                        </p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">สินค้าทั้งหมด</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.totalItems}</p>
                      </div>
                      <ShoppingCart className="h-6 w-6 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sales */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">การขายล่าสุด (5 รายการ)</h3>
                  <div className="space-y-3">
                    {filteredSales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{sale.saleNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {sale.customer?.name || 'ไม่ระบุลูกค้า'} • {formatDateTime(sale.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(sale.total)}</p>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(sale.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSale(sale)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาเลขที่ขาย, ลูกค้า..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="สถานะ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกสถานะ</SelectItem>
                        <SelectItem value="completed">สำเร็จ</SelectItem>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="cancelled">ยกเลิก</SelectItem>
                        <SelectItem value="refunded">คืนเงิน</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger className="w-[150px]">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="วิธีชำระ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกวิธี</SelectItem>
                        <SelectItem value="cash">เงินสด</SelectItem>
                        <SelectItem value="card">บัตรเครดิต</SelectItem>
                        <SelectItem value="bank_transfer">โอนเงิน</SelectItem>
                        <SelectItem value="digital_wallet">กระเป๋าเงินดิจิทัล</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="ช่วงเวลา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="today">วันนี้</SelectItem>
                        <SelectItem value="week">สัปดาห์นี้</SelectItem>
                        <SelectItem value="month">เดือนนี้</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleExportSales}>
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออก
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales List */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {getPaymentMethodIcon(sale.paymentMethod?.type || 'cash')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{sale.saleNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {sale.customer?.name || 'ไม่ระบุลูกค้า'} • 
                              {sale.items.reduce((sum, item) => sum + item.quantity, 0)} รายการ
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(sale.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(sale.total)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(sale.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSale(sale)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredSales.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>ไม่พบประวัติการขาย</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">การวิเคราะห์การขาย</h3>
                    <p>กราฟและการวิเคราะห์ข้อมูลการขายจะพัฒนาในเวอร์ชันถัดไป</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>
              ปิด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      {selectedSale && (
        <Dialog open={showSaleDetail} onOpenChange={setShowSaleDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                รายละเอียดการขาย {selectedSale.saleNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Sale Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">เลขที่ขาย</p>
                      <p className="font-medium">{selectedSale.saleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันที่</p>
                      <p className="font-medium">{formatDateTime(selectedSale.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ลูกค้า</p>
                      <p className="font-medium">{selectedSale.customer?.name || 'ไม่ระบุ'}</p>
                      {selectedSale.customer?.phone && (
                        <p className="text-sm text-muted-foreground">{selectedSale.customer.phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วิธีชำระเงิน</p>
                      <p className="font-medium">
                        {getPaymentMethodIcon(selectedSale.paymentMethod?.type || 'cash')} {selectedSale.paymentMethod?.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">รายการสินค้า</h3>
                  <div className="space-y-2">
                    {selectedSale.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>ยอดรวม:</span>
                      <span>{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>ส่วนลด:</span>
                        <span>-{formatCurrency(selectedSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>ภาษี (7%):</span>
                      <span>{formatCurrency(selectedSale.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>รวมทั้งสิ้น:</span>
                      <span className="text-primary">{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowSaleDetail(false)}>
                ปิด
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};