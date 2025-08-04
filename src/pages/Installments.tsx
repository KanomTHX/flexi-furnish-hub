import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye
} from 'lucide-react';
import { InstallmentManagement } from '@/components/installments/InstallmentManagement';
import { InstallmentDialog } from '@/components/installments/InstallmentDialog';
import { CustomerManagement } from '@/components/installments/CustomerManagement';
import { CustomerDetail } from '@/components/installments/CustomerDetail';
import { CustomerAnalytics } from '@/components/installments/CustomerAnalytics';
import { useInstallments } from '@/hooks/useInstallments';
import { useCustomers } from '@/hooks/useCustomers';
import { useBranchData } from '../hooks/useBranchData';
import { BranchSelector } from '../components/branch/BranchSelector';
import { Customer, InstallmentContract } from '@/types/pos';

export default function Installments() {
  const { contracts, summary, actions } = useInstallments();
  const { customers, loading: customersLoading, actions: customerActions } = useCustomers();
  const { currentBranch, currentBranchCustomers } = useBranchData();
  const { toast } = useToast();
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const handleCreateContract = (contract: InstallmentContract) => {
    actions.addContract(contract);
    toast({
      title: "สัญญาผ่อนชำระถูกสร้างแล้ว!",
      description: `สัญญาเลขที่ ${contract.contractNumber} ถูกสร้างเรียบร้อยแล้ว`,
    });
    setCreateDialogOpen(false);
  };

  const handlePaymentReceived = (contractId: string, paymentId: string, amount: number) => {
    actions.recordPayment(contractId, paymentId, amount);
    // อัปเดตข้อมูลลูกค้าจากสัญญา
    customerActions.updateCustomerFromContracts(contracts);
    toast({
      title: "บันทึกการชำระเงินแล้ว",
      description: `รับชำระเงิน ${amount.toLocaleString()} บาท เรียบร้อยแล้ว`,
    });
  };

  const handleUpdateContract = (contract: InstallmentContract) => {
    actions.updateContract(contract);
    // อัปเดตข้อมูลลูกค้าจากสัญญา
    customerActions.updateCustomerFromContracts(contracts);
    toast({
      title: "อัพเดทสัญญาแล้ว",
      description: `สัญญาเลขที่ ${contract.contractNumber} ถูกอัพเดทแล้ว`,
    });
  };

  const handleViewCustomer = (customerId: string) => {
    const customer = customerActions.getCustomerById(customerId);
    if (customer) {
      setSelectedCustomerForDetail(customer);
      setCustomerDetailOpen(true);
    }
  };

  const handleCreateCustomer = async (customerData: any) => {
    try {
      await customerActions.createCustomer(customerData);
      toast({
        title: "สำเร็จ",
        description: "สร้างลูกค้าใหม่เรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างลูกค้าได้",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCustomer = async (customerId: string, customerData: any) => {
    try {
      await customerActions.updateCustomer(customerId, customerData);
      toast({
        title: "สำเร็จ",
        description: "อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลลูกค้าได้",
        variant: "destructive",
      });
    }
  };

  // Mock function สำหรับสร้างสัญญาใหม่
  const handleQuickCreate = () => {
    const mockCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: 'ลูกค้าตัวอย่าง',
      phone: '081-234-5678',
      email: 'customer@example.com',
      address: '123 ถนนตัวอย่าง กรุงเทพฯ 10100',
      idCard: '1-2345-67890-12-3',
      occupation: 'พนักงานบริษัท',
      monthlyIncome: 30000
    };
    
    setSelectedCustomer(mockCustomer);
    setTotalAmount(50000);
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Branch Info */}
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
          <button
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>เปลี่ยนสาขา</span>
          </button>
          <Button onClick={handleQuickCreate} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            สร้างสัญญาใหม่
          </Button>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              ใช้งาน {summary.activeContracts} สัญญา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดให้เครดิต</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary.totalFinanced.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              เก็บแล้ว ฿{summary.totalCollected.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค้างชำระ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ฿{summary.overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.overdueContracts} สัญญา
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เก็บเงินรายเดือน</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary.monthlyCollection.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              จากสัญญาที่ใช้งาน
            </p>
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
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            รายงาน
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ลูกค้า
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            การวิเคราะห์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-6">
          <InstallmentManagement
            contracts={contracts}
            onUpdateContract={handleUpdateContract}
            onPaymentReceived={handlePaymentReceived}
          />
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

        <TabsContent value="customers" className="space-y-6">
          <CustomerManagement
            customers={customers}
            onCreateCustomer={handleCreateCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onViewCustomer={handleViewCustomer}
            loading={customersLoading}
          />
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

      {/* Dialog รายละเอียดลูกค้า */}
      <CustomerDetail
        open={customerDetailOpen}
        onOpenChange={setCustomerDetailOpen}
        customer={selectedCustomerForDetail}
        contracts={contracts}
      />
    </div>
  );
}