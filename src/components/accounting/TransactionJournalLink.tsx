import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Transaction, JournalEntry, Account } from '@/types/accounting';
import { 
  Link, 
  FileText, 
  Plus, 
  Eye, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap
} from 'lucide-react';

interface TransactionJournalLinkProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  accounts: Account[];
  onCreateJournalEntry: (entry: any) => void;
  onLinkTransaction: (transactionId: string, journalEntryId: string) => void;
}

export function TransactionJournalLink({
  transactions,
  journalEntries,
  accounts,
  onCreateJournalEntry,
  onLinkTransaction
}: TransactionJournalLinkProps) {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [autoJournalDialogOpen, setAutoJournalDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Get unlinked transactions
  const unlinkedTransactions = transactions.filter(txn => !txn.journalEntryId);
  
  // Get linked transactions
  const linkedTransactions = transactions.filter(txn => txn.journalEntryId);

  const handleAutoCreateJournalEntry = (transaction: Transaction) => {
    let debitAccount: Account | undefined;
    let creditAccount: Account | undefined;
    let description = transaction.description;

    // Auto-determine accounts based on transaction type
    switch (transaction.type) {
      case 'sale':
        // Dr. Cash/Accounts Receivable, Cr. Sales Revenue
        debitAccount = accounts.find(acc => acc.code === '1000'); // Cash
        creditAccount = accounts.find(acc => acc.code === '4000'); // Sales Revenue
        break;
      case 'purchase':
        // Dr. Inventory/Expense, Cr. Cash/Accounts Payable
        debitAccount = accounts.find(acc => acc.code === '1200'); // Inventory
        creditAccount = accounts.find(acc => acc.code === '2000'); // Accounts Payable
        break;
      case 'payment':
        // Dr. Expense, Cr. Cash
        debitAccount = accounts.find(acc => acc.code === '6000'); // Rent Expense (default)
        creditAccount = accounts.find(acc => acc.code === '1000'); // Cash
        break;
      case 'receipt':
        // Dr. Cash, Cr. Accounts Receivable
        debitAccount = accounts.find(acc => acc.code === '1000'); // Cash
        creditAccount = accounts.find(acc => acc.code === '1100'); // Accounts Receivable
        break;
      case 'adjustment':
        // Dr./Cr. based on context - default to inventory adjustment
        debitAccount = accounts.find(acc => acc.code === '1200'); // Inventory
        creditAccount = accounts.find(acc => acc.code === '5000'); // Cost of Goods Sold
        break;
      case 'transfer':
        // Dr. Cash (destination), Cr. Cash (source)
        debitAccount = accounts.find(acc => acc.code === '1000'); // Cash
        creditAccount = accounts.find(acc => acc.code === '1000'); // Cash
        break;
    }

    if (!debitAccount || !creditAccount) {
      toast({
        title: "ไม่สามารถสร้างรายการบัญชีอัตโนมัติได้",
        description: "ไม่พบบัญชีที่เหมาะสมสำหรับประเภทธุรกรรมนี้",
        variant: "destructive"
      });
      return;
    }

    const journalEntry = {
      date: transaction.date,
      description: `${description} (สร้างอัตโนมัติ)`,
      reference: transaction.reference,
      totalDebit: transaction.amount,
      totalCredit: transaction.amount,
      status: 'pending' as const,
      createdBy: 'system',
      entries: [
        {
          id: `jel-${Date.now()}-1`,
          accountId: debitAccount.id,
          account: debitAccount,
          description: description,
          debitAmount: transaction.amount,
          creditAmount: 0,
          reference: transaction.reference
        },
        {
          id: `jel-${Date.now()}-2`,
          accountId: creditAccount.id,
          account: creditAccount,
          description: description,
          debitAmount: 0,
          creditAmount: transaction.amount,
          reference: transaction.reference
        }
      ]
    };

    onCreateJournalEntry(journalEntry);
    
    toast({
      title: "สร้างรายการบัญชีอัตโนมัติสำเร็จ",
      description: "รายการบัญชีถูกสร้างและเชื่อมโยงกับธุรกรรมแล้ว"
    });
  };

  const handleLinkToExistingJournal = (transactionId: string, journalEntryId: string) => {
    onLinkTransaction(transactionId, journalEntryId);
    setLinkDialogOpen(false);
    setSelectedTransaction(null);
    
    toast({
      title: "เชื่อมโยงสำเร็จ",
      description: "ธุรกรรมถูกเชื่อมโยงกับรายการบัญชีแล้ว"
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels = {
      sale: 'การขาย',
      purchase: 'การซื้อ',
      payment: 'การจ่าย',
      receipt: 'การรับ',
      adjustment: 'ปรับปรุง',
      transfer: 'โอนย้าย'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getJournalStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">
                  {unlinkedTransactions.length}
                </div>
                <div className="text-sm text-orange-600">ธุรกรรมที่ยังไม่เชื่อมโยง</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {linkedTransactions.length}
                </div>
                <div className="text-sm text-green-600">ธุรกรรมที่เชื่อมโยงแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {journalEntries.length}
                </div>
                <div className="text-sm text-blue-600">รายการบัญชีทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unlinked Transactions */}
      {unlinkedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              ธุรกรรมที่ยังไม่เชื่อมโยงกับรายการบัญชี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unlinkedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status === 'pending' ? 'รอดำเนินการ' : 
                         transaction.status === 'processed' ? 'ดำเนินการแล้ว' : 'ยกเลิก'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      จำนวน: {transaction.amount.toLocaleString()} บาท
                      {transaction.reference && ` | อ้างอิง: ${transaction.reference}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAutoCreateJournalEntry(transaction)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      สร้างอัตโนมัติ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setLinkDialogOpen(true);
                      }}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      เชื่อมโยง
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Transactions */}
      {linkedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ธุรกรรมที่เชื่อมโยงแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {linkedTransactions.map((transaction) => {
                const linkedJournal = journalEntries.find(je => je.id === transaction.journalEntryId);
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status === 'pending' ? 'รอดำเนินการ' : 
                           transaction.status === 'processed' ? 'ดำเนินการแล้ว' : 'ยกเลิก'}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        {linkedJournal && (
                          <Badge className={getJournalStatusColor(linkedJournal.status)}>
                            {linkedJournal.status === 'draft' ? 'ร่าง' :
                             linkedJournal.status === 'pending' ? 'รออนุมัติ' :
                             linkedJournal.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        จำนวน: {transaction.amount.toLocaleString()} บาท
                        {linkedJournal && ` | รายการบัญชี: ${linkedJournal.entryNumber}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">เชื่อมโยงแล้ว</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Existing Journal Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เชื่อมโยงกับรายการบัญชีที่มีอยู่</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">ธุรกรรมที่เลือก:</h4>
                <div className="text-sm">
                  <div><strong>ประเภท:</strong> {getTransactionTypeLabel(selectedTransaction.type)}</div>
                  <div><strong>รายละเอียด:</strong> {selectedTransaction.description}</div>
                  <div><strong>จำนวน:</strong> {selectedTransaction.amount.toLocaleString()} บาท</div>
                  <div><strong>วันที่:</strong> {new Date(selectedTransaction.date).toLocaleDateString('th-TH')}</div>
                </div>
              </div>
              
              <div>
                <Label>เลือกรายการบัญชี</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {journalEntries
                    .filter(je => !transactions.some(txn => txn.journalEntryId === je.id))
                    .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleLinkToExistingJournal(selectedTransaction.id, entry.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{entry.entryNumber}</div>
                          <div className="text-sm text-muted-foreground">{entry.description}</div>
                          <div className="text-sm">
                            จำนวน: {entry.totalDebit.toLocaleString()} บาท | 
                            วันที่: {new Date(entry.date).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                        <Badge className={getJournalStatusColor(entry.status)}>
                          {entry.status === 'draft' ? 'ร่าง' :
                           entry.status === 'pending' ? 'รออนุมัติ' :
                           entry.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}