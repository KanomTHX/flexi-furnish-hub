import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Transaction, TransactionType, TransactionStatus, TransactionFilter } from '@/types/accounting';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Activity,
  DollarSign,
  Calendar,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown
} from 'lucide-react';

interface TransactionManagementProps {
  transactions: Transaction[];
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  onCreateTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onExport: () => void;
}

export function TransactionManagement({
  transactions,
  filter,
  onFilterChange,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onExport
}: TransactionManagementProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Form state for create/edit
  const [formData, setFormData] = useState({
    type: 'sale' as TransactionType,
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    reference: '',
    sourceModule: 'accounting',
    sourceId: '',
    status: 'pending' as TransactionStatus
  });

  // Transaction type options
  const transactionTypes = [
    { value: 'sale', label: 'การขาย', icon: DollarSign, color: 'text-green-600' },
    { value: 'purchase', label: 'การซื้อ', icon: DollarSign, color: 'text-red-600' },
    { value: 'payment', label: 'การจ่าย', icon: DollarSign, color: 'text-orange-600' },
    { value: 'receipt', label: 'การรับ', icon: DollarSign, color: 'text-blue-600' },
    { value: 'adjustment', label: 'ปรับปรุง', icon: Edit, color: 'text-purple-600' },
    { value: 'transfer', label: 'โอนย้าย', icon: ArrowUpDown, color: 'text-indigo-600' }
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'processed', label: 'ดำเนินการแล้ว', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'ยกเลิก', color: 'bg-red-100 text-red-800' }
  ];

  // Source module options
  const sourceModules = [
    { value: 'pos', label: 'ระบบขาย (POS)' },
    { value: 'inventory', label: 'ระบบคลังสินค้า' },
    { value: 'accounting', label: 'ระบบบัญชี' },
    { value: 'warehouse', label: 'ระบบคลัง' },
    { value: 'claims', label: 'ระบบเคลม' },
    { value: 'installments', label: 'ระบบผ่อนชำระ' }
  ];

  // Sorted and filtered transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }, [transactions, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const pendingCount = transactions.filter(txn => txn.status === 'pending').length;
    const processedCount = transactions.filter(txn => txn.status === 'processed').length;
    const cancelledCount = transactions.filter(txn => txn.status === 'cancelled').length;
    
    return {
      total: transactions.length,
      totalAmount,
      pending: pendingCount,
      processed: processedCount,
      cancelled: cancelledCount
    };
  }, [transactions]);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCreateTransaction = () => {
    if (!formData.amount || !formData.description) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกจำนวนเงินและรายละเอียด",
        variant: "destructive"
      });
      return;
    }

    const newTransaction = {
      ...formData,
      amount: parseFloat(formData.amount),
      sourceId: formData.sourceId || `${formData.sourceModule}-${Date.now()}`
    };

    onCreateTransaction(newTransaction);
    setCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: "สร้างธุรกรรมสำเร็จ",
      description: "ธุรกรรมใหม่ถูกเพิ่มในระบบแล้ว"
    });
  };

  const handleUpdateTransaction = () => {
    if (!selectedTransaction || !formData.amount || !formData.description) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    const updates = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onUpdateTransaction(selectedTransaction.id, updates);
    setEditDialogOpen(false);
    setSelectedTransaction(null);
    resetForm();
    
    toast({
      title: "อัปเดตธุรกรรมสำเร็จ",
      description: "ข้อมูลธุรกรรมถูกอัปเดตแล้ว"
    });
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (transaction.status === 'processed') {
      toast({
        title: "ไม่สามารถลบได้",
        description: "ไม่สามารถลบธุรกรรมที่ดำเนินการแล้ว",
        variant: "destructive"
      });
      return;
    }

    onDeleteTransaction(transaction.id);
    toast({
      title: "ลบธุรกรรมสำเร็จ",
      description: "ธุรกรรมถูกลบออกจากระบบแล้ว"
    });
  };

  const handleStatusChange = (transaction: Transaction, newStatus: TransactionStatus) => {
    onUpdateTransaction(transaction.id, { status: newStatus });
    toast({
      title: "อัปเดตสถานะสำเร็จ",
      description: `สถานะธุรกรรมถูกเปลี่ยนเป็น ${statusOptions.find(s => s.value === newStatus)?.label}`
    });
  };

  const resetForm = () => {
    setFormData({
      type: 'sale',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
      reference: '',
      sourceModule: 'accounting',
      sourceId: '',
      status: 'pending'
    });
  };

  const openEditDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount.toString(),
      description: transaction.description,
      reference: transaction.reference || '',
      sourceModule: transaction.sourceModule,
      sourceId: transaction.sourceId,
      status: transaction.status
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const getTypeInfo = (type: TransactionType) => {
    return transactionTypes.find(t => t.value === type) || transactionTypes[0];
  };

  const getStatusInfo = (status: TransactionStatus) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getSourceModuleLabel = (module: string) => {
    return sourceModules.find(m => m.value === module)?.label || module;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-sm text-blue-600">ธุรกรรมทั้งหมด</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {(stats.totalAmount / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-green-600">มูลค่ารวม (บาท)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-sm text-yellow-600">รอดำเนินการ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">{stats.processed}</div>
                <div className="text-sm text-green-600">ดำเนินการแล้ว</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              จัดการธุรกรรม
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                ส่งออก
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างธุรกรรม
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>สร้างธุรกรรมใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">ประเภทธุรกรรม</Label>
                      <Select value={formData.type} onValueChange={(value: TransactionType) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`h-4 w-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">วันที่</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">เลขที่อ้างอิง</Label>
                      <Input
                        value={formData.reference}
                        onChange={(e) => setFormData({...formData, reference: e.target.value})}
                        placeholder="เช่น INV-2024-001"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">รายละเอียด</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="รายละเอียดธุรกรรม"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sourceModule">โมดูลต้นทาง</Label>
                      <Select value={formData.sourceModule} onValueChange={(value) => setFormData({...formData, sourceModule: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceModules.map(module => (
                            <SelectItem key={module.value} value={module.value}>
                              {module.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">สถานะ</Label>
                      <Select value={formData.status} onValueChange={(value: TransactionStatus) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button onClick={handleCreateTransaction}>
                      สร้างธุรกรรม
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาธุรกรรม..."
                  value={filter.search || ''}
                  onChange={(e) => onFilterChange({...filter, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>ประเภท</Label>
              <Select value={filter.type || 'all'} onValueChange={(value) => onFilterChange({...filter, type: value === 'all' ? undefined : value as TransactionType})}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>สถานะ</Label>
              <Select value={filter.status || 'all'} onValueChange={(value) => onFilterChange({...filter, status: value === 'all' ? undefined : value as TransactionStatus})}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>โมดูลต้นทาง</Label>
              <Select value={filter.sourceModule || 'all'} onValueChange={(value) => onFilterChange({...filter, sourceModule: value === 'all' ? undefined : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกโมดูล" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโมดูล</SelectItem>
                  {sourceModules.map(module => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        วันที่
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        ประเภท
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">รายละเอียด</th>
                    <th className="text-right p-3 font-medium">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 hover:text-primary ml-auto"
                      >
                        จำนวนเงิน
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left p-3 font-medium">สถานะ</th>
                    <th className="text-left p-3 font-medium">โมดูล</th>
                    <th className="text-center p-3 font-medium">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => {
                    const typeInfo = getTypeInfo(transaction.type);
                    const statusInfo = getStatusInfo(transaction.status);
                    
                    return (
                      <tr key={transaction.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(transaction.date).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
                            <span className="text-sm">{typeInfo.label}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{transaction.description}</div>
                            {transaction.reference && (
                              <div className="text-xs text-muted-foreground">
                                อ้างอิง: {transaction.reference}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-medium ${
                            transaction.type === 'sale' || transaction.type === 'receipt' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'sale' || transaction.type === 'receipt' ? '+' : '-'}
                            {transaction.amount.toLocaleString()} ฿
                          </span>
                        </td>
                        <td className="p-3">
                          <Select
                            value={transaction.status}
                            onValueChange={(value: TransactionStatus) => handleStatusChange(transaction, value)}
                          >
                            <SelectTrigger className="w-auto border-0 p-0 h-auto">
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{getSourceModuleLabel(transaction.sourceModule)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(transaction)}
                              disabled={transaction.status === 'processed'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction)}
                              disabled={transaction.status === 'processed'}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {sortedTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบธุรกรรมที่ตรงกับเงื่อนไข</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Transaction Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดธุรกรรม</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ประเภทธุรกรรม</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const typeInfo = getTypeInfo(selectedTransaction.type);
                      return (
                        <>
                          <typeInfo.icon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span>{typeInfo.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">วันที่</Label>
                  <div className="mt-1">{new Date(selectedTransaction.date).toLocaleDateString('th-TH')}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">จำนวนเงิน</Label>
                  <div className={`mt-1 font-medium ${
                    selectedTransaction.type === 'sale' || selectedTransaction.type === 'receipt' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {selectedTransaction.type === 'sale' || selectedTransaction.type === 'receipt' ? '+' : '-'}
                    {selectedTransaction.amount.toLocaleString()} บาท
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">สถานะ</Label>
                  <div className="mt-1">
                    <Badge className={getStatusInfo(selectedTransaction.status).color}>
                      {getStatusInfo(selectedTransaction.status).label}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">รายละเอียด</Label>
                  <div className="mt-1">{selectedTransaction.description}</div>
                </div>
                {selectedTransaction.reference && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">เลขที่อ้างอิง</Label>
                    <div className="mt-1">{selectedTransaction.reference}</div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">โมดูลต้นทาง</Label>
                  <div className="mt-1">{getSourceModuleLabel(selectedTransaction.sourceModule)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">รหัสต้นทาง</Label>
                  <div className="mt-1 font-mono text-sm">{selectedTransaction.sourceId}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">วันที่สร้าง</Label>
                  <div className="mt-1">{new Date(selectedTransaction.createdAt).toLocaleString('th-TH')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขธุรกรรม</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">ประเภทธุรกรรม</Label>
              <Select value={formData.type} onValueChange={(value: TransactionType) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">วันที่</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="reference">เลขที่อ้างอิง</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
                placeholder="เช่น INV-2024-001"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="รายละเอียดธุรกรรม"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="sourceModule">โมดูลต้นทาง</Label>
              <Select value={formData.sourceModule} onValueChange={(value) => setFormData({...formData, sourceModule: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceModules.map(module => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">สถานะ</Label>
              <Select value={formData.status} onValueChange={(value: TransactionStatus) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdateTransaction}>
              บันทึกการแก้ไข
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}