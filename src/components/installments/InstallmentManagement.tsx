import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstallmentContract, InstallmentPayment, InstallmentSummary } from '@/types/pos';
import { 
  calculateContractStatus, 
  getContractStatusText, 
  getPaymentStatusText,
  exportContractsToCSV,
  updatePaymentStatus,
  calculateLateFee
} from '@/utils/installmentHelpers';
import { 
  Search, 
  Download, 
  Eye, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  CreditCard
} from 'lucide-react';

interface InstallmentManagementProps {
  contracts: InstallmentContract[];
  onUpdateContract: (contract: InstallmentContract) => void;
  onPaymentReceived: (contractId: string, paymentId: string, amount: number) => void;
}

export function InstallmentManagement({ 
  contracts, 
  onUpdateContract, 
  onPaymentReceived 
}: InstallmentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<InstallmentContract | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<InstallmentPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // อัพเดทสถานะสัญญาทั้งหมด
  const updatedContracts = useMemo(() => updatePaymentStatus(contracts), [contracts]);

  // กรองข้อมูล
  const filteredContracts = useMemo(() => {
    return updatedContracts.filter(contract => {
      const matchesSearch = contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contract.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contract.customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [updatedContracts, searchTerm, statusFilter]);

  // คำนวณสรุปข้อมูล
  const summary: InstallmentSummary = useMemo(() => {
    const activeContracts = updatedContracts.filter(c => c.status === 'active');
    const overdueContracts = updatedContracts.filter(c => {
      const status = calculateContractStatus(c);
      return status.overduePayments.length > 0;
    });

    return {
      totalContracts: updatedContracts.length,
      activeContracts: activeContracts.length,
      totalFinanced: updatedContracts.reduce((sum, c) => sum + c.financedAmount, 0),
      totalCollected: updatedContracts.reduce((sum, c) => sum + c.totalPaid, 0),
      overdueAmount: overdueContracts.reduce((sum, c) => {
        const status = calculateContractStatus(c);
        return sum + status.overduePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0),
      overdueContracts: overdueContracts.length,
      monthlyCollection: activeContracts.reduce((sum, c) => sum + c.monthlyPayment, 0)
    };
  }, [updatedContracts]);

  const handleExportCSV = () => {
    const csv = exportContractsToCSV(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `installment-contracts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayment = () => {
    if (!selectedPayment || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    onPaymentReceived(selectedPayment.contractId, selectedPayment.id, amount);
    
    setPaymentDialogOpen(false);
    setSelectedPayment(null);
    setPaymentAmount('');
  };

  const getStatusBadgeVariant = (status: InstallmentContract['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'defaulted': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: InstallmentPayment['status']) => {
    switch (status) {
      case 'paid': return 'secondary';
      case 'overdue': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* สรุปข้อมูล */}
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

      {/* ตัวกรองและการค้นหา */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>จัดการสัญญาผ่อนชำระ</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลขที่สัญญา, ชื่อลูกค้า, หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="draft">ร่าง</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                <SelectItem value="defaulted">ผิดนัด</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ตารางสัญญา */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่สัญญา</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>ค่างวด</TableHead>
                  <TableHead>ชำระแล้ว/ทั้งหมด</TableHead>
                  <TableHead>คงเหลือ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const status = calculateContractStatus(contract);
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contract.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contract.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ฿{contract.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ฿{contract.monthlyPayment.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {status.paidInstallments}/{contract.plan.months}
                      </TableCell>
                      <TableCell>
                        ฿{status.remainingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {getContractStatusText(contract.status)}
                        </Badge>
                        {status.overduePayments.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            เกิน {status.overduePayments.length} งวด
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContract(contract)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดู
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog รายละเอียดสัญญา */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดสัญญา {selectedContract?.contractNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">ข้อมูลสัญญา</TabsTrigger>
                <TabsTrigger value="payments">ตารางการชำระ</TabsTrigger>
                <TabsTrigger value="history">ประวัติการชำระ</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        ข้อมูลลูกค้า
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อ:</span>
                        <span>{selectedContract.customer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เบอร์โทร:</span>
                        <span>{selectedContract.customer.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">บัตรประชาชน:</span>
                        <span>{selectedContract.customer.idCard}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">อาชีพ:</span>
                        <span>{selectedContract.customer.occupation}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        ข้อมูลการผ่อน
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">แผนผ่อน:</span>
                        <span>{selectedContract.plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ยอดรวม:</span>
                        <span>฿{selectedContract.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เงินดาวน์:</span>
                        <span>฿{selectedContract.downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ยอดผ่อน:</span>
                        <span>฿{selectedContract.financedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ค่างวด:</span>
                        <span>฿{selectedContract.monthlyPayment.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>งวดที่</TableHead>
                        <TableHead>วันครบกำหนด</TableHead>
                        <TableHead>ยอดชำระ</TableHead>
                        <TableHead>เงินต้น</TableHead>
                        <TableHead>ดอกเบี้ย</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>การดำเนินการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContract.payments.map((payment) => {
                        const lateFee = calculateLateFee(payment);
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.installmentNumber}</TableCell>
                            <TableCell>{payment.dueDate}</TableCell>
                            <TableCell>
                              ฿{payment.amount.toLocaleString()}
                              {lateFee > 0 && (
                                <div className="text-xs text-destructive">
                                  +฿{lateFee.toLocaleString()} ค่าปรับ
                                </div>
                              )}
                            </TableCell>
                            <TableCell>฿{payment.principalAmount.toLocaleString()}</TableCell>
                            <TableCell>฿{payment.interestAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={getPaymentStatusBadgeVariant(payment.status)}>
                                {getPaymentStatusText(payment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {payment.status === 'pending' || payment.status === 'overdue' ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setPaymentAmount((payment.amount + lateFee).toString());
                                    setPaymentDialogOpen(true);
                                  }}
                                >
                                  รับชำระ
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {payment.paidDate}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="text-center py-8 text-muted-foreground">
                  ประวัติการชำระเงินจะแสดงที่นี่
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog รับชำระเงิน */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รับชำระเงิน</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">งวดที่:</span>
                  <span className="ml-2 font-medium">{selectedPayment.installmentNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">วันครบกำหนด:</span>
                  <span className="ml-2 font-medium">{selectedPayment.dueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ยอดชำระ:</span>
                  <span className="ml-2 font-medium">฿{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ค่าปรับล่าช้า:</span>
                  <span className="ml-2 font-medium">฿{calculateLateFee(selectedPayment).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">จำนวนเงินที่รับ</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handlePayment}>
                  ยืนยันการรับชำระ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}