import React, { useState, useEffect } from 'react';
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
  Eye,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SupplierServiceSimple from '@/services/supplierServiceSimple';
import { AddSupplierModal, AddInvoiceModal, AddPaymentModal } from './SupplierModals';

export default function SupplierBillingFixed2() {
  // State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedSupplierForView, setSelectedSupplierForView] = useState<any>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);

  // Summary state
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    totalPaidThisMonth: 0,
    averagePaymentDays: 0
  });

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading supplier billing data...');

      // Load suppliers
      try {
        const suppliersData = await SupplierServiceSimple.getSuppliers();
        console.log('Suppliers loaded:', suppliersData.length);
        setSuppliers(suppliersData);
      } catch (err) {
        console.error('Error loading suppliers:', err);
        toast.error('ไม่สามารถโหลดข้อมูลซัพพลายเออร์ได้');
      }

      // Load invoices
      try {
        const invoicesResult = await SupplierServiceSimple.getSupplierInvoices({ limit: 50 });
        console.log('Invoices loaded:', invoicesResult.data.length);
        setInvoices(invoicesResult.data);
      } catch (err) {
        console.error('Error loading invoices:', err);
        toast.error('ไม่สามารถโหลดข้อมูลใบแจ้งหนี้ได้');
      }

      // Load payments
      try {
        const paymentsResult = await SupplierServiceSimple.getSupplierPayments({ limit: 50 });
        console.log('Payments loaded:', paymentsResult.data.length);
        setPayments(paymentsResult.data);
      } catch (err) {
        console.error('Error loading payments:', err);
        toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
      }

      // Load summary
      try {
        const summaryData = await SupplierServiceSimple.getSupplierSummary();
        console.log('Summary loaded:', summaryData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error loading summary:', err);
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter functions
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || supplier.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = !selectedSupplier || selectedSupplier === 'all' || invoice.supplierId === selectedSupplier;
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || invoice.status === selectedStatus;
    
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSupplier = !selectedSupplier || selectedSupplier === 'all' || payment.supplier_id === selectedSupplier;
    
    return matchesSearch && matchesSupplier;
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">ชำระแล้ว</Badge>;
      case 'pending':
        return <Badge variant="secondary">รอชำระ</Badge>;
      case 'overdue':
        return <Badge variant="destructive">เกินกำหนด</Badge>;
      case 'cancelled':
        return <Badge variant="outline">ยกเลิก</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">ใช้งาน</Badge>;
      case 'inactive':
        return <Badge variant="secondary">ไม่ใช้งาน</Badge>;
      case 'suspended':
        return <Badge variant="destructive">ระงับ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount || 0);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  };

  // Clear filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    setSelectedSupplier('');
    setSelectedStatus('');
  };

  // Handle modal success
  const handleModalSuccess = () => {
    loadData(); // Reload all data
  };

  // Handle view supplier
  const handleViewSupplier = (supplier: any) => {
    setSelectedSupplierForView(supplier);
    toast.info(`ดูข้อมูลซัพพลายเออร์: ${supplier.supplierName}`);
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier: any) => {
    toast.info(`แก้ไขซัพพลายเออร์: ${supplier.supplierName} (ฟีเจอร์นี้จะพัฒนาต่อ)`);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoiceForView(invoice);
    toast.info(`ดูใบแจ้งหนี้: ${invoice.invoiceNumber}`);
  };

  // Handle delete supplier
  const handleDeleteSupplier = async (supplier: any) => {
    if (confirm(`คุณต้องการลบซัพพลายเออร์ "${supplier.supplierName}" หรือไม่?`)) {
      try {
        await SupplierServiceSimple.deleteSupplier(supplier.id);
        toast.success('ลบซัพพลายเออร์สำเร็จ');
        loadData();
      } catch (error: any) {
        toast.error(error.message || 'เกิดข้อผิดพลาดในการลบซัพพลายเออร์');
      }
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="mb-4">{error}</p>
            <Button onClick={loadData}>
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
          <p className="text-muted-foreground">จัดการใบแจ้งหนี้และการชำระเงินซัพพลายเออร์ (Fixed Version 2)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddSupplier(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มซัพพลายเออร์
          </Button>
          <Button onClick={() => setShowAddInvoice(true)}>
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
            {/* Recent Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle>ซัพพลายเออร์ล่าสุด</CardTitle>
                <CardDescription>รายการซัพพลายเออร์ที่เพิ่มล่าสุด</CardDescription>
              </CardHeader>
              <CardContent>
                {suppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีข้อมูลซัพพลายเออร์</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suppliers.slice(0, 5).map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{supplier.supplierName}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplier.supplierCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(supplier.currentBalance)}</p>
                          {getStatusBadge(supplier.status)}
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
                          <p className="font-medium">{payment.supplier?.supplier_name || 'ไม่ระบุ'}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.payment_number} • {formatDate(payment.payment_date)}
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
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
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

          {/* Suppliers List */}
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
                <div className="space-y-4">
                  {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{supplier.supplierName}</p>
                            <p className="text-sm text-muted-foreground">
                              รหัส: {supplier.supplierCode}
                            </p>
                            {supplier.contactPerson && (
                              <p className="text-sm text-muted-foreground">
                                ติดต่อ: {supplier.contactPerson}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          <span className={supplier.currentBalance > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                            {formatCurrency(supplier.currentBalance)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          เครดิต: {formatCurrency(supplier.creditLimit)}
                        </p>
                        {getStatusBadge(supplier.status)}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSupplier(supplier)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditSupplier(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                    <SelectItem value="all">ทุกซัพพลายเออร์</SelectItem>
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
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
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
                      <div className="flex-1">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.supplier?.supplierName || 'ไม่ระบุ'} • {formatDate(invoice.invoiceDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ครบกำหนด: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-sm text-muted-foreground">
                          คงเหลือ: {formatCurrency(invoice.remainingAmount)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedSupplier(invoice.supplierId);
                            setShowAddPayment(true);
                          }}>
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
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
                    <SelectItem value="all">ทุกซัพพลายเออร์</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowAddPayment(true)}>
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
                      <div className="flex-1">
                        <p className="font-medium">{payment.payment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.supplier?.supplier_name || 'ไม่ระบุ'} • {formatDate(payment.payment_date)}
                        </p>
                        {payment.reference_number && (
                          <p className="text-sm text-muted-foreground">
                            อ้างอิง: {payment.reference_number}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(payment.payment_amount)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {payment.payment_method?.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => toast.info(`ดูการชำระเงิน: ${payment.payment_number}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddSupplierModal
        open={showAddSupplier}
        onOpenChange={setShowAddSupplier}
        onSuccess={handleModalSuccess}
      />

      <AddInvoiceModal
        open={showAddInvoice}
        onOpenChange={setShowAddInvoice}
        onSuccess={handleModalSuccess}
        suppliers={suppliers}
      />

      <AddPaymentModal
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        onSuccess={handleModalSuccess}
        suppliers={suppliers}
        invoices={invoices}
      />
    </div>
  );
}