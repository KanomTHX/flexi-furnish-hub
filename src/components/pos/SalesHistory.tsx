import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Search, Receipt, User, CreditCard, Clock, ArrowLeft } from 'lucide-react';
import { useSupabasePOS } from '@/hooks/useSupabasePOS';
import { useBranchData } from '@/hooks/useBranchData';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface SalesTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  customer?: {
    name: string;
    phone?: string;
  };
  employee?: {
    name: string;
  };
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];
}

interface SalesHistoryProps {
  onBack: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<SalesTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { supabase } = useSupabasePOS();
  const { currentBranch } = useBranchData();

  useEffect(() => {
    fetchSalesHistory();
  }, [currentBranch]);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions]);

  const fetchSalesHistory = async () => {
    if (!currentBranch?.id || !supabase) return;

    try {
      setLoading(true);
      setError(null);

      // ดึงข้อมูลธุรกรรมการขาย
      const { data: salesData, error: salesError } = await supabase
        .from('sales_transactions')
        .select(`
          id,
          transaction_number,
          transaction_date,
          total_amount,
          discount_amount,
          tax_amount,
          net_amount,
          payment_method,
          status,
          notes,
          customers(name, phone),
          employees(name)
        `)
        .eq('branch_id', currentBranch.id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (salesError) throw salesError;

      // ดึงรายการสินค้าในแต่ละธุรกรรม
      const transactionsWithItems = await Promise.all(
        (salesData || []).map(async (transaction) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('sales_transaction_items')
            .select(`
              id,
              quantity,
              unit_price,
              total_amount,
              products(name)
            `)
            .eq('transaction_id', transaction.id);

          if (itemsError) {
            console.error('Error fetching transaction items:', itemsError);
            return {
              ...transaction,
              customer: transaction.customers,
              employee: transaction.employees,
              items: []
            };
          }

          return {
            ...transaction,
            customer: transaction.customers,
            employee: transaction.employees,
            items: (itemsData || []).map(item => ({
              id: item.id,
              product_name: item.products?.name || 'ไม่ระบุ',
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.total_amount
            }))
          };
        })
      );

      setTransactions(transactionsWithItems);
    } catch (err) {
      console.error('Error fetching sales history:', err);
      setError('ไม่สามารถโหลดประวัติการขายได้');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => 
      transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer?.phone?.includes(searchTerm)
    );

    setFilteredTransactions(filtered);
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: 'เงินสด',
      card: 'บัตรเครดิต',
      transfer: 'โอนเงิน',
      credit: 'เครดิต'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'สำเร็จ', variant: 'default' as const },
      pending: { label: 'รอดำเนินการ', variant: 'secondary' as const },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'secondary' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (selectedTransaction) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedTransaction(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <h2 className="text-lg font-semibold">รายละเอียดการขาย</h2>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {selectedTransaction.transaction_number}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(selectedTransaction.transaction_date), 'dd MMMM yyyy HH:mm', { locale: th })}
                </p>
              </div>
              {getStatusBadge(selectedTransaction.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ข้อมูลลูกค้า */}
            {selectedTransaction.customer && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{selectedTransaction.customer.name}</span>
                {selectedTransaction.customer.phone && (
                  <span className="text-muted-foreground">({selectedTransaction.customer.phone})</span>
                )}
              </div>
            )}

            {/* วิธีการชำระเงิน */}
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              <span>{getPaymentMethodText(selectedTransaction.payment_method)}</span>
            </div>

            <Separator />

            {/* รายการสินค้า */}
            <div>
              <h4 className="font-medium mb-3">รายการสินค้า</h4>
              <div className="space-y-2">
                {selectedTransaction.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ฿{item.unit_price.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-medium">฿{item.total_amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* สรุปยอดเงิน */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ยอดรวม:</span>
                <span>฿{selectedTransaction.total_amount.toLocaleString()}</span>
              </div>
              {selectedTransaction.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>ส่วนลด:</span>
                  <span>-฿{selectedTransaction.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>ภาษี:</span>
                <span>฿{selectedTransaction.tax_amount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>ยอดสุทธิ:</span>
                <span>฿{selectedTransaction.net_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* หมายเหตุ */}
            {selectedTransaction.notes && (
              <div>
                <h4 className="font-medium mb-2">หมายเหตุ</h4>
                <p className="text-sm text-muted-foreground">{selectedTransaction.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <h2 className="text-lg font-semibold">ประวัติการขาย</h2>
        </div>
        <Button onClick={fetchSalesHistory} disabled={loading}>
          รีเฟรช
        </Button>
      </div>

      {/* ช่องค้นหา */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาด้วยหมายเลขธุรกรรม, ชื่อลูกค้า, หรือเบอร์โทร..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* รายการธุรกรรม */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">กำลังโหลดประวัติการขาย...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchSalesHistory} className="mt-2">
                ลองใหม่
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchTerm ? 'ไม่พบธุรกรรมที่ค้นหา' : 'ยังไม่มีประวัติการขาย'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{transaction.transaction_number}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(transaction.transaction_date), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">฿{transaction.net_amount.toLocaleString()}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        {transaction.customer && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{transaction.customer.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{getPaymentMethodText(transaction.payment_method)}</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground">
                        {transaction.items.length} รายการ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;