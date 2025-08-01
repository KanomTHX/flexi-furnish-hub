import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Briefcase,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import { Customer, InstallmentContract } from '@/types/pos';

interface CustomerData extends Customer {
  creditScore: number;
  totalContracts: number;
  activeContracts: number;
  totalFinanced: number;
  totalPaid: number;
  overdueAmount: number;
  lastPaymentDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  customerSince: Date;
  notes: string;
}

interface CustomerDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
  contracts: InstallmentContract[];
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  open,
  onOpenChange,
  customer,
  contracts
}) => {
  if (!customer) return null;

  const customerContracts = contracts.filter(c => c.customerId === customer.id);
  
  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800">ความเสี่ยงต่ำ</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ความเสี่ยงปานกลาง</Badge>;
      case 'high':
        return <Badge variant="destructive">ความเสี่ยงสูง</Badge>;
      default:
        return null;
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'ใช้งาน', color: 'bg-green-100 text-green-800' },
      completed: { variant: 'secondary' as const, label: 'เสร็จสิ้น', color: 'bg-blue-100 text-blue-800' },
      overdue: { variant: 'destructive' as const, label: 'ค้างชำระ', color: '' },
      defaulted: { variant: 'destructive' as const, label: 'ผิดนัด', color: '' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const paymentHistory = customerContracts.flatMap(contract => 
    contract.payments.map(payment => ({
      ...payment,
      contractNumber: contract.contractNumber
    }))
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            รายละเอียดลูกค้า: {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลส่วนตัว</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ลูกค้าตั้งแต่ {customer.customerSince.toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{customer.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.idCard}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.occupation}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      รายได้ ฿{customer.monthlyIncome.toLocaleString()}/เดือน
                    </span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">หมายเหตุ:</p>
                    <p className="text-sm text-muted-foreground">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credit Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  คะแนนเครดิต
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getCreditScoreColor(customer.creditScore)}`}>
                    {customer.creditScore}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customer.creditScore >= 750 ? 'ดีเยี่ยม' :
                     customer.creditScore >= 650 ? 'ดี' : 'ต้องปรับปรุง'}
                  </p>
                  <div className="mt-3">
                    {getRiskBadge(customer.riskLevel)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contracts & Financial Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ยอดให้เครดิต</p>
                      <p className="text-xl font-bold">
                        ฿{customer.totalFinanced.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ชำระแล้ว</p>
                      <p className="text-xl font-bold text-green-600">
                        ฿{customer.totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ค้างชำระ</p>
                      <p className="text-xl font-bold text-red-600">
                        ฿{customer.overdueAmount.toLocaleString()}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  สัญญาทั้งหมด ({customerContracts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerContracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">สัญญา #{contract.contractNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          ยอดรวม ฿{contract.totalAmount.toLocaleString()} • 
                          ผ่อน {contract.installmentPlan.months} เดือน
                        </p>
                        <p className="text-sm text-muted-foreground">
                          เริ่ม {contract.startDate.toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(contract.status)}
                        <p className="text-sm text-muted-foreground mt-1">
                          คงเหลือ ฿{contract.remainingBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {customerContracts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่มีสัญญาผ่อนชำระ</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ประวัติการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {paymentHistory.slice(0, 10).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">สัญญา #{payment.contractNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          งวดที่ {payment.installmentNumber} • 
                          ครบกำหนด {payment.dueDate.toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ฿{payment.amount.toLocaleString()}
                        </p>
                        <Badge 
                          variant={
                            payment.status === 'paid' ? 'default' :
                            payment.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                          className={
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' : ''
                          }
                        >
                          {payment.status === 'paid' ? 'ชำระแล้ว' :
                           payment.status === 'overdue' ? 'เกินกำหนด' : 'รอชำระ'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {paymentHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่มีประวัติการชำระเงิน</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};