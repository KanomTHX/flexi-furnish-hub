// Fixed Supplier Billing Component - No flickering issues
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import SupplierServiceSimple from '@/services/supplierServiceSimple';
import type { Supplier, SupplierInvoice, SupplierPayment } from '@/types/supplier';

export default function SupplierBillingFixed() {
  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    totalPaidThisMonth: 0,
    averagePaymentDays: 0
  });
  const [billingSummary, setBillingSummary] = useState<any[]>([]);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Clear filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    setSelectedSupplier('');
    setSelectedStatus('');
  };

  // Memoized fetch functions to prevent re-creation
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching suppliers...');
      const data = await SupplierServiceSimple.getSuppliers();
      console.log('Suppliers fetched:', data);
      setSuppliers(data);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      const errorMessage = err.message || 'ไม่สามารถดึงข้อมูลซัพพลายเออร์ได้';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Remove loading dependency

  const fetchInvoices = useCallback(async () => {
    try {
      console.log('Fetching invoices...');
      const result = await SupplierServiceSimple.getSupplierInvoices({ limit: 50 });
      console.log('Invoices fetched:', result);
      setInvoices(result.data);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      toast.error('ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้');
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      console.log('Fetching payments...');
      const result = await SupplierServiceSimple.getSupplierPayments({ limit: 50 });
      console.log('Payments fetched:', result);
      setPayments(result.data);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      toast.error('ไม่สามารถดึงข้อมูลการชำระเงินได้');
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const summaryData = await SupplierServiceSimple.getSupplierSummary();
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  const fetchBillingSummary = useCallback(async () => {
    try {
      const billingSummaryData = await SupplierServiceSimple.getSupplierBillingSummary();
      setBillingSummary(billingSummaryData);
    } catch (err: any) {
      console.error('Error fetching billing summary:', err);
    }
  }, []);

  // Load data only once on mount
  useEffect(() => {
    if (!initialized) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchSuppliers(),
            fetchInvoices(),
            fetchPayments(),
            fetchSummary(),
            fetchBillingSummary()
          ]);
        } finally {
          setInitialized(true);
        }
      };
      loadInitialData();
    }
  }, [initialized, fetchSuppliers, fetchInvoices, fetchPayments, fetchSummary, fetchBillingSummary]);

  // Filter functions
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || supplier.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier?.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = !selectedSupplier || invoice.supplierId === selectedSupplier;
    const matchesStatus = !selectedStatus || invoice.status === selectedStatus;
    
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = !selectedSupplier || payment.supplier_id === selectedSupplier;
    
    return matchesSearch && matchesSupplier;
  });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">ชำระแล้ว</Badge>;
      case 'pending':
        return <Badge variant="secondary">รอชำระ</Badge>;
      case 'overdue':
        return <Badge variant="destructive">เกินกำหนด</Badge>;
      case 'cancelled':
        return <Badge variant="outline">ยกเลิก</Badge>;
      case 'active':
        return <Badge variant="default">ใช้งาน</Badge>;
      case 'inactive':
        return <Badge variant="secondary">ไม่ใช้งาน</Badge>;
      case 'suspended':
        return <Badge variant="destructive">ระงับ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Show loading state during initialization
  if (!initialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>กำลังโหลดข้อมูล Supplier Billing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading component for tabs
  const LoadingContent = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              ลองใหม่
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">การเรียกเก็บเงินซัพพลายเออร์</h2>
          <p className="text-muted-foreground">จัดการใบแจ้งหนี้และการชำระเงินซัพพลายเออร์ (Fixed Version)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มซัพพลายเออร์
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            สร้างใบแจ้งหนี้
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ซัพพลายเออร์ทั้งหมด</p>
                <p className="text-2xl font-bold">{summary.totalSuppliers}</p>
                <p className="text-xs text-green-600">ใช้งาน: {summary.activeSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดค้างชำระ</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalOutstanding)}</p>
                <p className="text-xs text-red-600">เกินกำหนด: {formatCurrency(summary.overdueAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ชำระเดือนนี้</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalPaidThisMonth)}</p>
                <p className="text-xs text-muted-foreground">เฉลี่ย {summary.averagePaymentDays} วัน</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ใบแจ้งหนี้</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-xs text-yellow-600">รอชำระ: {invoices.filter(i => i.status === 'pending').length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="suppliers">ซัพพลายเออร์</TabsTrigger>
          <TabsTrigger value="invoices">ใบแจ้งหนี้</TabsTrigger>
          <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>สรุปการเรียกเก็บเงิน</CardTitle>
                <CardDescription>ยอดค้างชำระตามซัพพลายเออร์</CardDescription>
              </CardHeader>
              <CardContent>
                {billingSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลการเรียกเก็บเงิน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingSummary.slice(0, 5).map((billing) => (
                      <div key={billing.supplierId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{billing.supplierName}</p>
                          <p className="text-sm text-muted-foreground">
                            {billing.totalInvoices} ใบแจ้งหนี้
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(billing.outstandingAmount)}</p>
                          <p className="text-sm text-muted-foreground">
                            ค้างชำระ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>การชำระเงินล่าสุด</CardTitle>
                <CardDescription>รายการชำระเงินที่ผ่านมา</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลการชำระเงิน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.supplier?.supplier_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_number} • {formatDate(new Date(payment.payment_date))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(payment.payment_amount)}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {payment.payment_method?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="ค้นหาซัพพลายเออร์..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                    <SelectItem value="suspended">ระงับ</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  กรอง
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายการซัพพลายเออร์ ({filteredSuppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบซัพพลายเออร์ที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>ชื่อซัพพลายเออร์</TableHead>
                        <TableHead>ติดต่อ</TableHead>
                        <TableHead className="text-right">ยอดค้างชำระ</TableHead>
                        <TableHead className="text-right">เครดิตลิมิต</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.supplierCode}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{supplier.supplierName}</p>
                              {supplier.contactPerson && (
                                <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {supplier.phone && <p>{supplier.phone}</p>}
                              {supplier.email && <p className="text-muted-foreground">{supplier.email}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={supplier.currentBalance > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                              {formatCurrency(supplier.currentBalance)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(supplier.creditLimit)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(supplier.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="ค้นหาใบแจ้งหนี้..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="เลือกซัพพลายเออร์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทุกซัพพลายเออร์</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอชำระ</SelectItem>
                    <SelectItem value="paid">ชำระแล้ว</SelectItem>
                    <SelectItem value="overdue">เกินกำหนด</SelectItem>
                    <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายการใบแจ้งหนี้ ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบใบแจ้งหนี้ในระบบ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.slice(0, 10).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.supplier?.supplierName} • {formatDate(invoice.invoiceDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="ค้นหาการชำระเงิน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="เลือกซัพพลายเออร์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ทุกซัพพลายเออร์</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  บันทึกการชำระเงิน
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายการการชำระเงิน ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบการชำระเงินในระบบ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{payment.payment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.supplier?.supplier_name} • {formatDate(new Date(payment.payment_date))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(payment.payment_amount)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {payment.payment_method?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}