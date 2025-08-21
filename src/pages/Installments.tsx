import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  FileText, 
  Plus, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  DollarSign,
  Calculator,
  Building2,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { InstallmentManagement } from '@/components/installments/InstallmentManagement';
import { InstallmentDialog } from '@/components/installments/InstallmentDialog';
import { CustomerAnalytics } from '@/components/installments/CustomerAnalytics';
import { InstallmentPlansManagement } from '@/components/installments/InstallmentPlansManagement';
import { createInstallmentContract, updateInstallmentContract, createInstallmentPayment } from '@/services/installment-service';
import { useSupabaseInstallments } from '@/hooks/useSupabaseInstallments';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';
import { Customer, InstallmentContract } from '@/types/pos';

export default function Installments() {
  const { contracts, summary, loading: contractsLoading, actions } = useSupabaseInstallments();
  const { customers, loading: customersLoading, actions: customerActions } = useSupabaseCustomers();
  const { currentBranch, currentBranchCustomers } = useBranchData();
  const { toast } = useToast();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateContract = async (contractData: any) => {
    try {
      const newContract = await createInstallmentContract(contractData);
      await actions.addContract(newContract);
      toast({
        title: "สัญญาผ่อนชำระถูกสร้างแล้ว!",
        description: `สัญญาเลขที่ ${newContract.contractNumber} ถูกสร้างเรียบร้อยแล้ว`,
      });
      setCreateDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างสัญญาได้",
        variant: "destructive",
      });
    }
  };

  const handlePaymentReceived = async (contractId: string, paymentId: string, amount: number) => {
    try {
      await actions.recordPayment(contractId, paymentId, amount);
      // อัปเดตข้อมูลลูกค้าจากสัญญา
      customerActions.updateCustomerFromContracts(contracts);
      toast({
        title: "บันทึกการชำระเงินแล้ว",
        description: `รับชำระเงิน ${amount.toLocaleString()} บาท เรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการชำระเงินได้",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContract = async (contract: InstallmentContract) => {
    try {
      const updatedContract = await updateInstallmentContract(contract.id, contract);
      await actions.updateContract(updatedContract);
      toast({
        title: "อัพเดทสัญญาแล้ว",
        description: `สัญญาเลขที่ ${contract.contractNumber} ถูกอัพเดทแล้ว`,
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทสัญญาได้",
        variant: "destructive",
      });
    }
  };



  // ฟังก์ชันสำหรับสร้างสัญญาใหม่
  const handleQuickCreate = () => {
    // สร้างลูกค้าใหม่เปล่าๆ สำหรับกรอกข้อมูล
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      address: '',
      idCard: '',
      occupation: '',
      monthlyIncome: 0
    };
    
    setSelectedCustomer(newCustomer);
    setTotalAmount(0); // ให้ผู้ใช้กรอกยอดเงิน
    setCreateDialogOpen(true);
  };

  // ฟังก์ชันสำหรับสร้างสัญญาจากลูกค้าที่มีอยู่
  const handleCreateFromExistingCustomer = (customer: Customer, amount: number) => {
    setSelectedCustomer(customer);
    setTotalAmount(amount);
    setCreateDialogOpen(true);
  };

  // ฟังก์ชันรีเฟรชข้อมูล
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await actions.refreshData();
      toast({
        title: "รีเฟรชข้อมูลสำเร็จ",
        description: "ข้อมูลสัญญาผ่อนชำระได้รับการอัปเดตแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถรีเฟรชข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ฟิลเตอร์สัญญาตามสถานะและคำค้นหา
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // แสดง loading state
  if (contractsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">สัญญาผ่อนชำระ</h1>
              <p className="text-muted-foreground">
                จัดการสัญญาผ่อนชำระ ติดตามการชำระเงิน และรายงานสถิติ
              </p>
            </div>
            {currentBranch && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{currentBranch.name}</span>
                <span className="text-xs text-blue-600">({currentBranchCustomers.length} ลูกค้า)</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button onClick={handleQuickCreate} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              สร้างสัญญาใหม่
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาเลขที่สัญญา หรือชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งาน</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="overdue">ค้างชำระ</option>
              <option value="defaulted">ผิดนัด</option>
            </select>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {filteredContracts.length} สัญญา
          </Badge>
        </div>
      </div>

      {/* Branch Selector */}
      {showBranchSelector && (
        <Card>
          <CardContent className="p-4">
            <BranchSelector
              onBranchChange={() => setShowBranchSelector(false)}
              showStats={false}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* สรุปข้อมูลรวม */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาทั้งหมด</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalContracts}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                ใช้งาน {summary.activeContracts}
              </Badge>
              <Badge variant="outline" className="text-xs">
                เสร็จสิ้น {contracts.filter(c => c.status === 'completed').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดให้เครดิต</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ฿{summary.totalFinanced.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">เก็บแล้ว</span>
              <span className="text-sm font-medium text-green-600">
                ฿{summary.totalCollected.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(summary.totalCollected / summary.totalFinanced) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค้างชำระ</CardTitle>
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ฿{summary.overdueAmount.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">สัญญาค้างชำระ</span>
              <Badge variant="destructive" className="text-xs">
                <XCircle className="w-3 h-3 mr-1" />
                {summary.overdueContracts} สัญญา
              </Badge>
            </div>
            {summary.overdueContracts > 0 && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                ⚠️ ต้องติดตามด่วน
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เก็บเงินรายเดือน</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ฿{summary.monthlyCollection.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">เฉลี่ยต่อสัญญา</span>
              <span className="text-sm font-medium text-purple-600">
                ฿{Math.round(summary.monthlyCollection / (summary.activeContracts || 1)).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                จาก {summary.activeContracts} สัญญาที่ใช้งาน
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* เนื้อหาหลัก */}
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            จัดการสัญญา
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            จัดการแผน
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            รายงาน
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            การวิเคราะห์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          {/* Quick Stats for Filtered Results */}
          {searchTerm || filterStatus !== 'all' ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      ผลการค้นหา: {filteredContracts.length} สัญญา
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>ใช้งาน: {filteredContracts.filter(c => c.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>ค้างชำระ: {filteredContracts.filter(c => c.status === 'overdue').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>ผิดนัด: {filteredContracts.filter(c => c.status === 'defaulted').length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          <InstallmentManagement
            contracts={filteredContracts}
            onUpdateContract={handleUpdateContract}
            onPaymentReceived={handlePaymentReceived}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <InstallmentPlansManagement branchId={currentBranch?.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  สถิติการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">อัตราการชำระตรงเวลา</span>
                    <span className="font-medium">
                      {contracts.length > 0 
                        ? Math.round(((summary.totalContracts - summary.overdueContracts) / summary.totalContracts) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ยอดเก็บเฉลี่ยต่อเดือน</span>
                    <span className="font-medium">
                      ฿{Math.round(summary.monthlyCollection / (summary.activeContracts || 1)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">สัญญาที่เสร็จสิ้น</span>
                    <span className="font-medium">
                      {contracts.filter(c => c.status === 'completed').length} สัญญา
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  การวิเคราะห์ความเสี่ยง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">สัญญาเสี่ยงสูง</span>
                    <span className="font-medium text-destructive">
                      {contracts.filter(c => {
                        const overduePayments = c.payments.filter(p => p.status === 'overdue');
                        return overduePayments.length >= 2;
                      }).length} สัญญา
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ยอดเสี่ยงรวม</span>
                    <span className="font-medium text-destructive">
                      ฿{contracts
                        .filter(c => c.payments.some(p => p.status === 'overdue'))
                        .reduce((sum, c) => sum + c.remainingBalance, 0)
                        .toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">อัตราการผิดนัด</span>
                    <span className="font-medium">
                      {contracts.length > 0 
                        ? Math.round((contracts.filter(c => c.status === 'defaulted').length / contracts.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CustomerAnalytics customers={customers} />
        </TabsContent>
      </Tabs>

      {/* Dialog สร้างสัญญาใหม่ */}
      {selectedCustomer && (
        <InstallmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          customer={selectedCustomer}
          totalAmount={totalAmount}
          onConfirm={handleCreateContract}
        />
      )}


    </div>
  );
}