import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  FileText,
  Edit,
  UserPlus,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { CustomerData, CustomerMetrics, Guarantor } from '@/types/customer';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CustomerDetailsProps {
  customer: CustomerData;
  metrics?: CustomerMetrics;
  guarantors?: Guarantor[];
  onEdit?: () => void;
  onAddGuarantor?: () => void;
  loading?: boolean;
}

const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
  }
};

const getRiskLevelIcon = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return <TrendingUp className="h-4 w-4" />;
    case 'medium':
      return <TrendingDown className="h-4 w-4" />;
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getCreditScoreLevel = (score: number) => {
  if (score >= 750) return { label: 'ดีเยี่ยม', color: 'text-green-600' };
  if (score >= 650) return { label: 'ดี', color: 'text-blue-600' };
  if (score >= 550) return { label: 'พอใช้', color: 'text-yellow-600' };
  return { label: 'ต้องปรับปรุง', color: 'text-red-600' };
};

const getPaymentStatusIcon = (status: 'paid' | 'pending' | 'overdue') => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'overdue':
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
};

export function CustomerDetails({
  customer,
  metrics,
  guarantors = [],
  onEdit,
  onAddGuarantor,
  loading = false,
}: CustomerDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const creditScoreLevel = getCreditScoreLevel(customer.creditScore);

  // Mock contract data - in real app, this would come from props or API
  const mockContracts = [
    {
      id: 'contract-001',
      productName: 'โซฟา 3 ที่นั่ง',
      totalAmount: 75000,
      monthlyPayment: 2500,
      remainingPayments: 18,
      status: 'active' as const,
      startDate: new Date('2023-06-15'),
      endDate: new Date('2025-06-15'),
    },
    {
      id: 'contract-002',
      productName: 'ตู้เสื้อผ้า 4 บาน',
      totalAmount: 45000,
      monthlyPayment: 1500,
      remainingPayments: 0,
      status: 'completed' as const,
      startDate: new Date('2022-03-10'),
      endDate: new Date('2024-03-10'),
    },
  ];

  // Mock payment history
  const mockPayments = [
    {
      id: 'payment-001',
      contractId: 'contract-001',
      amount: 2500,
      dueDate: new Date('2024-01-15'),
      paidDate: new Date('2024-01-15'),
      status: 'paid' as const,
    },
    {
      id: 'payment-002',
      contractId: 'contract-001',
      amount: 2500,
      dueDate: new Date('2024-02-15'),
      paidDate: new Date('2024-02-14'),
      status: 'paid' as const,
    },
    {
      id: 'payment-003',
      contractId: 'contract-001',
      amount: 2500,
      dueDate: new Date('2024-03-15'),
      paidDate: null,
      status: 'pending' as const,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                {customer.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {customer.idCard}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  ลูกค้าตั้งแต่ {formatDate(customer.customerSince)}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getRiskLevelColor(customer.riskLevel)} flex items-center gap-1`}
              >
                {getRiskLevelIcon(customer.riskLevel)}
                ความเสี่ยง: {customer.riskLevel === 'low' ? 'ต่ำ' : customer.riskLevel === 'medium' ? 'กลาง' : 'สูง'}
              </Badge>
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="contracts">สัญญา</TabsTrigger>
          <TabsTrigger value="payments">การชำระ</TabsTrigger>
          <TabsTrigger value="guarantors">ผู้ค้ำประกัน</TabsTrigger>
          <TabsTrigger value="analytics">วิเคราะห์</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">สัญญาทั้งหมด</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{customer.totalContracts}</div>
                  <div className="text-xs text-muted-foreground">
                    ใช้งาน: {customer.activeContracts}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">ยอดเงินรวม</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{formatCurrency(customer.totalFinanced)}</div>
                  <div className="text-xs text-muted-foreground">
                    ชำระแล้ว: {formatCurrency(customer.totalPaid)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">คะแนนเครดิต</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{customer.creditScore}</div>
                  <div className={`text-xs ${creditScoreLevel.color}`}>
                    {creditScoreLevel.label}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">ยอดค้างชำระ</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(customer.overdueAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.overdueAmount > 0 ? 'ต้องติดตาม' : 'ปกติ'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลส่วนตัว
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  ข้อมูลทางการเงิน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">อาชีพ:</span>
                  <span className="font-medium">{customer.occupation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">รายได้ต่อเดือน:</span>
                  <span className="font-medium">{formatCurrency(customer.monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">การชำระล่าสุด:</span>
                  <span className="font-medium">
                    {customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'ไม่มีข้อมูล'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  หมายเหตุ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>สัญญาเช่าซื้อ</CardTitle>
              <CardDescription>
                รายการสัญญาเช่าซื้อทั้งหมดของลูกค้า
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>ยอดรวม</TableHead>
                    <TableHead>ผ่อนต่อเดือน</TableHead>
                    <TableHead>งวดคงเหลือ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่เริ่ม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.productName}
                      </TableCell>
                      <TableCell>{formatCurrency(contract.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(contract.monthlyPayment)}</TableCell>
                      <TableCell>{contract.remainingPayments} งวด</TableCell>
                      <TableCell>
                        <Badge
                          variant={contract.status === 'active' ? 'default' : 'secondary'}
                        >
                          {contract.status === 'active' ? 'ใช้งาน' : 'เสร็จสิ้น'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(contract.startDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการชำระเงิน</CardTitle>
              <CardDescription>
                รายการการชำระเงินล่าสุด
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่ครบกำหนด</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>วันที่ชำระ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        {payment.paidDate ? formatDate(payment.paidDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(payment.status)}
                          <span>
                            {payment.status === 'paid'
                              ? 'ชำระแล้ว'
                              : payment.status === 'pending'
                              ? 'รอชำระ'
                              : 'เกินกำหนด'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guarantors Tab */}
        <TabsContent value="guarantors">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ผู้ค้ำประกัน</CardTitle>
                  <CardDescription>
                    รายการผู้ค้ำประกันของลูกค้า
                  </CardDescription>
                </div>
                {onAddGuarantor && (
                  <Button onClick={onAddGuarantor}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ค้ำประกัน
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {guarantors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีข้อมูลผู้ค้ำประกัน
                </div>
              ) : (
                <div className="space-y-4">
                  {guarantors.map((guarantor) => (
                    <Card key={guarantor.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">{guarantor.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ความสัมพันธ์: {guarantor.relationship}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              อาชีพ: {guarantor.occupation}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm">{guarantor.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {guarantor.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              รายได้: {formatCurrency(guarantor.monthlyIncome)}/เดือน
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  สถิติการชำระเงิน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>อัตราการชำระตรงเวลา:</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวนงวดที่ชำระแล้ว:</span>
                    <span className="font-medium">24 งวด</span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวนงวดที่เกินกำหนด:</span>
                    <span className="font-medium text-red-600">2 งวด</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ระยะเวลาเป็นลูกค้า:</span>
                    <span className="font-medium">
                      {Math.floor(
                        (new Date().getTime() - customer.customerSince.getTime()) /
                          (1000 * 60 * 60 * 24 * 30)
                      )} เดือน
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลทางการเงิน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>อัตราการใช้เครดิต:</span>
                      <span className="font-medium">
                        {metrics.creditUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าเฉลี่ยต่อสัญญา:</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.averageContractValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ยอดคงเหลือ:</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.remainingBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ดอกเบี้ยที่ชำระแล้ว:</span>
                      <span className="font-medium">
                        {formatCurrency(metrics.totalInterestPaid)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}