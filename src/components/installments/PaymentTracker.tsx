import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useInstallmentPayments, PaymentTrackingData } from '@/hooks/useInstallmentPayments';
import { InstallmentPayment, Customer } from '@/types/unified';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Receipt,
  Phone,
  User
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface PaymentTrackerProps {
  contractId?: string;
  showOverdueOnly?: boolean;
}

interface PaymentWithCustomer extends InstallmentPayment {
  customer?: Customer;
}

export function PaymentTracker({ contractId, showOverdueOnly = false }: PaymentTrackerProps) {
  const [overduePayments, setOverduePayments] = useState<PaymentWithCustomer[]>([]);
  const [todayDuePayments, setTodayDuePayments] = useState<PaymentWithCustomer[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithCustomer | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentTrackingData>>({
    amount: 0,
    paymentMethod: 'cash',
    receiptNumber: '',
    notes: ''
  });
  const [statistics, setStatistics] = useState<any>(null);

  const { 
    loading, 
    error, 
    recordPayment, 
    getOverduePayments, 
    getTodayDuePayments, 
    calculateLateFee,
    getPaymentStatistics 
  } = useInstallmentPayments();
  
  const { toast } = useToast();
  const { user } = useAuth();

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadPaymentData();
    loadStatistics();
  }, [contractId]);

  const loadPaymentData = async () => {
    try {
      const [overdue, todayDue] = await Promise.all([
        getOverduePayments(),
        getTodayDuePayments()
      ]);
      
      setOverduePayments(overdue);
      setTodayDuePayments(todayDue);
    } catch (err) {
      console.error('Error loading payment data:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getPaymentStatistics(contractId);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPayment || !paymentForm.amount) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    const paymentData: PaymentTrackingData = {
      contractId: selectedPayment.contractId,
      paymentId: selectedPayment.id,
      amount: paymentForm.amount,
      paymentMethod: paymentForm.paymentMethod as any,
      receiptNumber: paymentForm.receiptNumber,
      notes: paymentForm.notes,
      processedBy: user?.id || 'system'
    };

    const result = await recordPayment(paymentData);
    
    if (result) {
      toast({
        title: "บันทึกการชำระเงินสำเร็จ",
        description: `รับชำระเงิน ${formatCurrency(paymentForm.amount)} บาท เรียบร้อยแล้ว`,
      });
      
      setPaymentDialogOpen(false);
      setSelectedPayment(null);
      setPaymentForm({ amount: 0, paymentMethod: 'cash', receiptNumber: '', notes: '' });
      
      // โหลดข้อมูลใหม่
      loadPaymentData();
      loadStatistics();
    } else {
      toast({
        title: "ข้อผิดพลาด",
        description: error || "ไม่สามารถบันทึกการชำระเงินได้",
        variant: "destructive"
      });
    }
  };

  const openPaymentDialog = (payment: PaymentWithCustomer) => {
    setSelectedPayment(payment);
    setPaymentForm({
      amount: payment.amount,
      paymentMethod: 'cash',
      receiptNumber: `R${Date.now().toString().slice(-6)}`,
      notes: ''
    });
    setPaymentDialogOpen(true);
  };

  const getPaymentStatusBadge = (payment: PaymentWithCustomer) => {
    if (payment.status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">ชำระแล้ว</Badge>;
    }
    
    const dueDate = new Date(payment.due_date || payment.dueDate);
    const today = new Date();
    const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysPastDue > 0) {
      return <Badge variant="destructive">เกินกำหนด {daysPastDue} วัน</Badge>;
    } else if (daysPastDue === 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">ครบกำหนดวันนี้</Badge>;
    } else {
      return <Badge variant="outline">รอชำระ</Badge>;
    }
  };

  const renderPaymentCard = (payment: PaymentWithCustomer) => {
    const lateFee = calculateLateFee(payment);
    const totalAmount = payment.amount + lateFee;
    
    return (
      <Card key={payment.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-medium text-lg">
                สัญญาเลขที่: {payment.contractId}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                ลูกค้า: {payment.customer?.name}
                <Phone className="h-4 w-4 ml-2" />
                {payment.customer?.phone}
              </div>
            </div>
            {getPaymentStatusBadge(payment)}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div>
              <Label className="text-xs text-muted-foreground">งวดที่</Label>
              <div className="font-medium">{payment.payment_number || payment.installmentNumber}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">ยอดงวด</Label>
              <div className="font-medium">{formatCurrency(payment.amount)}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">กำหนดชำระ</Label>
              <div className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(payment.due_date || payment.dueDate)}
              </div>
            </div>
            {lateFee > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">ค่าปรับล่าช้า</Label>
                <div className="font-medium text-red-600">{formatCurrency(lateFee)}</div>
              </div>
            )}
          </div>
          
          {lateFee > 0 && (
            <Alert className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ยอดรวมที่ต้องชำระ: <span className="font-bold">{formatCurrency(totalAmount)}</span>
                (รวมค่าปรับล่าช้า {formatCurrency(lateFee)})
              </AlertDescription>
            </Alert>
          )}
          
          {payment.status === 'pending' && (
            <Button 
              onClick={() => openPaymentDialog(payment)}
              className="w-full"
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              รับชำระเงิน
            </Button>
          )}
          
          {payment.status === 'paid' && (payment.payment_date || payment.paidDate) && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              ชำระเมื่อ: {formatDate(payment.payment_date || payment.paidDate)}
              {payment.receipt_number && (
                <span className="ml-2">
                  <Receipt className="h-4 w-4 inline mr-1" />
                  ใบเสร็จ: {payment.receipt_number}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* สถิติการชำระเงิน */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-muted-foreground">ยอดเก็บได้</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(statistics.totalCollected)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-sm text-muted-foreground">รอชำระ</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {formatCurrency(statistics.totalPending)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">งวดที่ชำระแล้ว</div>
                  <div className="text-lg font-bold text-blue-600">
                    {statistics.paidPayments}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm text-muted-foreground">เกินกำหนด</div>
                  <div className="text-lg font-bold text-red-600">
                    {statistics.overduePayments}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* การชำระเงินที่เกินกำหนด */}
      {overduePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              การชำระเงินที่เกินกำหนด ({overduePayments.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overduePayments.map(renderPaymentCard)}
          </CardContent>
        </Card>
      )}

      {/* การชำระเงินที่ครบกำหนดวันนี้ */}
      {!showOverdueOnly && todayDuePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              ครบกำหนดชำระวันนี้ ({todayDuePayments.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayDuePayments.map(renderPaymentCard)}
          </CardContent>
        </Card>
      )}

      {/* Dialog รับชำระเงิน */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รับชำระเงิน</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">สัญญาเลขที่</div>
                <div className="font-medium">{selectedPayment.contractId}</div>
                <div className="text-sm text-muted-foreground mt-1">งวดที่ {selectedPayment.payment_number || selectedPayment.installmentNumber}</div>
                <div className="text-sm text-muted-foreground">กำหนดชำระ: {formatDate(selectedPayment.due_date || selectedPayment.dueDate)}</div>
              </div>
              
              <div>
                <Label htmlFor="amount">ยอดเงินที่รับชำระ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">วิธีชำระเงิน *</Label>
                <Select 
                  value={paymentForm.paymentMethod} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">เงินสด</SelectItem>
                    <SelectItem value="transfer">โอนเงิน</SelectItem>
                    <SelectItem value="check">เช็ค</SelectItem>
                    <SelectItem value="card">บัตรเครดิต/เดบิต</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="receiptNumber">เลขที่ใบเสร็จ</Label>
                <Input
                  id="receiptNumber"
                  value={paymentForm.receiptNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="R000001"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentDialogOpen(false)}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handlePaymentSubmit}
                  disabled={loading || !paymentForm.amount}
                  className="flex-1"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการชำระ'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* แสดง error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}