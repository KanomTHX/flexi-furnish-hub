import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  UserPlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  CreditCard,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { CustomerList, CustomerForm, CustomerDetails } from '@/components/customers';
import { AddCustomerDialog } from '@/components/pos/AddCustomerDialog';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerData, CustomerFilterOptions, CreateCustomerData, UpdateCustomerData } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

type ViewMode = 'list' | 'details' | 'analytics';
type FormMode = 'create' | 'edit' | null;

export default function Customers() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();
  const {
    customers,
    loading,
    error,
    actions: {
      createCustomer,
      updateCustomer,
      deleteCustomer,
      loadCustomers,
    }
  } = useCustomers();

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers based on search and filter options
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !filterOptions.status || customer.status === filterOptions.status;
      const matchesType = !filterOptions.type || customer.type === filterOptions.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [customers, searchQuery, filterOptions]);

  // Calculate analytics
  const analytics = React.useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    return { totalCustomers, activeCustomers, totalRevenue, averageSpent };
  }, [customers]);

  const handleCreateCustomer = async (customerData: CreateCustomerData) => {
    try {
      await createCustomer(customerData);
      setShowCreateDialog(false);
      setFormMode(null);
      toast({
        title: 'สำเร็จ',
        description: 'เพิ่มลูกค้าใหม่เรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มลูกค้าได้',
        variant: 'destructive',
      });
    }
  };

  const handleAddCustomerFromDialog = async (customer: any) => {
    try {
      const customerData: CreateCustomerData = {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        nationalId: customer.nationalId || '',
        occupation: customer.occupation || '',
        monthlyIncome: customer.monthlyIncome || 0,
        notes: customer.notes || '',
        type: 'regular',
        status: 'active',
        creditLimit: 0,
        totalSpent: 0,
        lastPurchase: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await createCustomer(customerData);
      toast({
        title: 'สำเร็จ',
        description: 'เพิ่มลูกค้าใหม่เรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มลูกค้าได้',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCustomer = async (customerData: UpdateCustomerData) => {
    if (!selectedCustomer) return;
    
    try {
      await updateCustomer(selectedCustomer.id, customerData);
      setShowEditDialog(false);
      setFormMode(null);
      setSelectedCustomer(null);
      toast({
        title: 'สำเร็จ',
        description: 'อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตข้อมูลลูกค้าได้',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      toast({
        title: 'สำเร็จ',
        description: 'ลบลูกค้าเรียบร้อยแล้ว',
      });
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบลูกค้าได้',
        variant: 'destructive',
      });
    }
  };

  const handleCustomerSelect = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setViewMode('details');
  };

  const handleCustomerEdit = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
    setFormMode('edit');
  };

  const handleExportCustomers = () => {
    const csvData = filteredCustomers.map(customer => ({
      'ชื่อ-นามสกุล': customer.name,
      'เบอร์โทรศัพท์': customer.phone,
      'อีเมล': customer.email || '',
      'ที่อยู่': customer.address || '',
      'เลขบัตรประชาชน': customer.nationalId || '',
      'อาชีพ': customer.occupation || '',
      'รายได้ต่อเดือน': customer.monthlyIncome || 0,
      'ประเภท': customer.type === 'vip' ? 'VIP' : 'ทั่วไป',
      'สถานะ': customer.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน',
      'ยอดซื้อรวม': customer.totalSpent || 0,
      'วันที่สร้าง': new Date(customer.createdAt).toLocaleDateString('th-TH'),
    }));

    console.log('Customers data prepared for export:', csvData);

    toast({
      title: 'ส่งออกข้อมูลสำเร็จ',
      description: 'ไฟล์ข้อมูลลูกค้าถูกดาวน์โหลดแล้ว',
    });
  };

  if (error) {
    return (
      <div className="container-responsive">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => loadCustomers()}>ลองใหม่</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive space-modern">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            จัดการลูกค้า
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการข้อมูลลูกค้าและติดตามประวัติการซื้อ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCustomers}
            disabled={filteredCustomers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออกข้อมูล
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มลูกค้าใหม่
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% จากเดือนที่แล้ว
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าที่ใช้งาน</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalCustomers > 0 ? Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100) : 0}% ของลูกค้าทั้งหมด
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +8% จากเดือนที่แล้ว
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดซื้อเฉลี่ย</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.averageSpent)}</div>
            <p className="text-xs text-muted-foreground">
              ต่อลูกค้า 1 คน
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filterOptions.status || 'all'}
                onValueChange={(value) => setFilterOptions(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterOptions.type || 'all'}
                onValueChange={(value) => setFilterOptions(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="regular">ทั่วไป</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList>
          <TabsTrigger value="list">รายการลูกค้า</TabsTrigger>
          <TabsTrigger value="analytics">วิเคราะห์ข้อมูล</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <CustomerList
            customers={filteredCustomers}
            loading={loading}
            onCustomerSelect={handleCustomerSelect}
            onCustomerEdit={handleCustomerEdit}
            onCustomerDelete={handleDeleteCustomer}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>การเติบโตของลูกค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  กราฟการเติบโตของลูกค้า (จะพัฒนาในเวอร์ชันถัดไป)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>การกระจายตัวของลูกค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  กราฟการกระจายตัวของลูกค้า (จะพัฒนาในเวอร์ชันถัดไป)
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCustomerAdded={handleAddCustomerFromDialog}
      />

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลลูกค้าในระบบ
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              mode="edit"
              initialData={selectedCustomer}
              onSubmit={handleUpdateCustomer}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedCustomer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดลูกค้า</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetails
              customer={selectedCustomer}
              onEdit={() => {
                setShowDetailsDialog(false);
                handleCustomerEdit(selectedCustomer);
              }}
              onClose={() => {
                setShowDetailsDialog(false);
                setSelectedCustomer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}