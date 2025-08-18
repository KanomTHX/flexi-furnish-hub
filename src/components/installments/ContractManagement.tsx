import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstallments } from '@/hooks/useInstallments';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { InstallmentContract, InstallmentPayment } from '@/types/unified';
import { useToast } from '@/hooks/use-toast';
import { PaymentTracker } from './PaymentTracker';
import { 
  FileText, 
  Eye, 
  Ban, 
  Package, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  MapPin, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface ContractManagementProps {
  contractId?: string;
}

export function ContractManagement({ contractId }: ContractManagementProps) {
  const [selectedContract, setSelectedContract] = useState<InstallmentContract | null>(null);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [closeContractDialogOpen, setCloseContractDialogOpen] = useState(false);
  const [repossessDialogOpen, setRepossessDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [repossessReason, setRepossessReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { 
    contracts, 
    actions: { 
      searchContracts, 
      filterContractsByStatus, 
      cancelContract, 
      approveContract 
    } 
  } = useInstallments();
  
  const { } = useSerialNumbers();
  const { toast } = useToast();

  // กรองสัญญาตามเงื่อนไข
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = !searchTerm || 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openContractDetails = (contract: InstallmentContract) => {
    setSelectedContract(contract);
    setContractDialogOpen(true);
  };

  const handleCloseContract = async () => {
    if (!selectedContract || !closeReason.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุเหตุผลในการปิดสัญญา",
        variant: "destructive"
      });
      return;
    }

    try {
      await cancelContract(selectedContract.id, closeReason);
      
      // TODO: อัปเดตสถานะ Serial Numbers เป็น available
      // Note: serialNumbers จะต้องเพิ่มใน InstallmentContract type ในอนาคต
      // และ updateSerialNumber function ยังไม่มีใน useSerialNumbers hook
      // if (selectedContract.serialNumbers) {
      //   for (const sn of selectedContract.serialNumbers) {
      //     await updateSerialNumber(sn.id, { status: 'available' });
      //   }
      // }
      
      toast({
        title: "ปิดสัญญาสำเร็จ",
        description: `สัญญาเลขที่ ${selectedContract.contractNumber} ถูกปิดเรียบร้อยแล้ว`,
      });
      
      setCloseContractDialogOpen(false);
      setContractDialogOpen(false);
      setCloseReason('');
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถปิดสัญญาได้",
        variant: "destructive"
      });
    }
  };

  const handleRepossess = async () => {
    if (!selectedContract || !repossessReason.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุเหตุผลในการยึดสินค้า",
        variant: "destructive"
      });
      return;
    }

    try {
      await cancelContract(selectedContract.id, `ยึดสินค้า: ${repossessReason}`);
      
      // TODO: อัปเดตสถานะ Serial Numbers เป็น repossessed
      // Note: serialNumbers จะต้องเพิ่มใน InstallmentContract type ในอนาคต
      // และ updateSerialNumber function ยังไม่มีใน useSerialNumbers hook
      // if (selectedContract.serialNumbers) {
      //   for (const sn of selectedContract.serialNumbers) {
      //     await updateSerialNumber(sn.id, { status: 'repossessed' });
      //   }
      // }
      
      toast({
        title: "ยึดสินค้าสำเร็จ",
        description: `ยึดสินค้าจากสัญญาเลขที่ ${selectedContract.contractNumber} เรียบร้อยแล้ว`,
      });
      
      setRepossessDialogOpen(false);
      setContractDialogOpen(false);
      setRepossessReason('');
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถยึดสินค้าได้",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">ใช้งาน</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ยกเลิก</Badge>;
      case 'defaulted':
        return <Badge className="bg-red-100 text-red-800">ผิดนัด</Badge>;
      case 'draft':
        return <Badge variant="outline">ร่าง</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentProgress = (contract: InstallmentContract) => {
    const totalPayments = contract.total_months || contract.plan?.months || 0;
    const paidPayments = contract.paidInstallments || 0;
    const percentage = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
    
    return {
      percentage: Math.round(percentage),
      paid: paidPayments,
      total: totalPayments
    };
  };

  return (
    <div className="space-y-6">
      {/* ส่วนค้นหาและกรอง */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            จัดการสัญญาเช่าซื้อ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="ค้นหาด้วยเลขสัญญา, ชื่อลูกค้า, หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <select 
                className="w-full p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
                <option value="defaulted">ผิดนัด</option>
                <option value="draft">ร่าง</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* รายการสัญญา */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => {
          const progress = getPaymentProgress(contract);
          
          return (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-lg">
                      สัญญาเลขที่: {contract.contractNumber}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {contract.customer.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {contract.customer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(contract.contractDate || contract.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(contract.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openContractDetails(contract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      ดูรายละเอียด
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">ยอดสัญญา</Label>
                    <div className="font-medium">{formatCurrency(contract.totalAmount)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ยอดผ่อนต่องวด</Label>
                    <div className="font-medium">{formatCurrency(contract.monthlyPayment || contract.monthly_payment)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ชำระแล้ว</Label>
                    <div className="font-medium text-green-600">{formatCurrency(contract.totalPaid || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">คงเหลือ</Label>
                    <div className="font-medium text-orange-600">{formatCurrency(contract.remainingBalance || 0)}</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>ความคืบหน้าการชำระ</span>
                    <span>{progress.paid}/{progress.total} งวด ({progress.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">ไม่พบสัญญาเช่าซื้อ</div>
            <div className="text-muted-foreground">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง</div>
          </CardContent>
        </Card>
      )}

      {/* Dialog รายละเอียดสัญญา */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดสัญญาเช่าซื้อ</DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                <TabsTrigger value="payments">การชำระเงิน</TabsTrigger>
                <TabsTrigger value="products">สินค้า</TabsTrigger>
                <TabsTrigger value="actions">การดำเนินการ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                {/* ข้อมูลสัญญา */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลสัญญา</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">เลขที่สัญญา</Label>
                        <div className="text-lg font-semibold">{selectedContract.contractNumber}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">สถานะ</Label>
                        <div>{getStatusBadge(selectedContract.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">วันที่ทำสัญญา</Label>
                        <div>{formatDate(selectedContract.contractDate || selectedContract.created_at)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">แผนผ่อนชำระ</Label>
                        <div>{selectedContract.plan?.name} ({selectedContract.plan?.months} งวด)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* ข้อมูลลูกค้า */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลลูกค้า</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">ชื่อ-นามสกุล</Label>
                        <div>{selectedContract.customer.name}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">เบอร์โทร</Label>
                        <div>{selectedContract.customer.phone}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">อีเมล</Label>
                        <div>{selectedContract.customer.email || '-'}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">เลขบัตรประชาชน</Label>
                        <div>{selectedContract.customer.idCard || '-'}</div>
                      </div>
                    </div>
                    {selectedContract.customer.address && (
                      <div>
                        <Label className="text-sm font-medium">ที่อยู่</Label>
                        <div>{selectedContract.customer.address}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* ข้อมูลการเงิน */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลการเงิน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">ยอดสัญญา</Label>
                        <div className="text-lg font-semibold">{formatCurrency(selectedContract.totalAmount)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">เงินดาวน์</Label>
                        <div className="text-lg font-semibold">{formatCurrency(selectedContract.downPayment || selectedContract.down_payment)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">ยอดผ่อน</Label>
                        <div className="text-lg font-semibold">{formatCurrency(selectedContract.financedAmount || selectedContract.remaining_amount)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">ดอกเบี้ยรวม</Label>
                        <div className="text-lg font-semibold">{formatCurrency(selectedContract.totalInterest || 0)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">ยอดผ่อนต่องวด</Label>
                        <div className="text-lg font-semibold">{formatCurrency(selectedContract.monthlyPayment || selectedContract.monthly_payment)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">ยอดคงเหลือ</Label>
                        <div className="text-lg font-semibold text-orange-600">{formatCurrency(selectedContract.remainingBalance || 0)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payments">
                <PaymentTracker contractId={selectedContract.id} />
              </TabsContent>
              
              <TabsContent value="products" className="space-y-4">
                {/* Note: serialNumbers จะต้องเพิ่มใน InstallmentContract type ในอนาคต */}
                {false ? (
                  <div className="space-y-3">
                    {/* {selectedContract.serialNumbers.map((sn, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Serial Number</Label>
                              <div className="font-mono">{sn.serialNumber}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">สินค้า</Label>
                              <div>{sn.productName}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">ราคา</Label>
                              <div>{formatCurrency(sn.price)}</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">สถานะ</Label>
                              <Badge variant={sn.status === 'sold' ? 'default' : 'secondary'}>
                                {sn.status === 'sold' ? 'ขายแล้ว' : sn.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))} */}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <div className="text-lg font-medium mb-2">ไม่มีข้อมูลสินค้า</div>
                      <div className="text-muted-foreground">ไม่พบข้อมูล Serial Number ที่เชื่อมโยงกับสัญญานี้</div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="grid gap-4">
                  {selectedContract.status === 'active' && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            ปิดสัญญา
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            การปิดสัญญาจะทำให้สัญญานี้ถูกยกเลิก และสินค้าจะกลับสู่สถานะพร้อมขาย
                          </p>
                          <Button 
                            variant="destructive" 
                            onClick={() => setCloseContractDialogOpen(true)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            ปิดสัญญา
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            ยึดสินค้า
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            การยึดสินค้าจะทำให้สัญญาถูกยกเลิก และสินค้าจะถูกยึดคืน
                          </p>
                          <Button 
                            variant="destructive" 
                            onClick={() => setRepossessDialogOpen(true)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            ยึดสินค้า
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  
                  {selectedContract.status === 'draft' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          อนุมัติสัญญา
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          การอนุมัติสัญญาจะทำให้สัญญาเริ่มมีผลใช้งาน
                        </p>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              await approveContract(selectedContract.id);
                              toast({
                                title: "อนุมัติสัญญาสำเร็จ",
                                description: `สัญญาเลขที่ ${selectedContract.contractNumber} ได้รับการอนุมัติแล้ว`,
                              });
                            } catch (error) {
                              toast({
                                title: "ข้อผิดพลาด",
                                description: "ไม่สามารถอนุมัติสัญญาได้",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          อนุมัติสัญญา
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog ปิดสัญญา */}
      <Dialog open={closeContractDialogOpen} onOpenChange={setCloseContractDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปิดสัญญาเช่าซื้อ</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                การปิดสัญญาจะไม่สามารถยกเลิกได้ กรุณาตรวจสอบข้อมูลให้ถูกต้อง
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="closeReason">เหตุผลในการปิดสัญญา *</Label>
              <Textarea
                id="closeReason"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="ระบุเหตุผลในการปิดสัญญา..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCloseContractDialogOpen(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCloseContract}
                disabled={!closeReason.trim()}
                className="flex-1"
              >
                ปิดสัญญา
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog ยึดสินค้า */}
      <Dialog open={repossessDialogOpen} onOpenChange={setRepossessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยึดสินค้า</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                การยึดสินค้าจะทำให้สัญญาถูกยกเลิกและไม่สามารถยกเลิกได้
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="repossessReason">เหตุผลในการยึดสินค้า *</Label>
              <Textarea
                id="repossessReason"
                value={repossessReason}
                onChange={(e) => setRepossessReason(e.target.value)}
                placeholder="ระบุเหตุผลในการยึดสินค้า..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setRepossessDialogOpen(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRepossess}
                disabled={!repossessReason.trim()}
                className="flex-1"
              >
                ยึดสินค้า
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note: error handling จะถูกจัดการใน individual functions */}
    </div>
  );
}