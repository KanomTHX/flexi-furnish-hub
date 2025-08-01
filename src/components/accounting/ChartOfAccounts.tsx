import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Account, AccountFilter, AccountType, AccountCategory } from '@/types/accounting';
import { formatCurrency, accountTypeLabels, accountCategoryLabels } from '@/utils/accountingHelpers';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ChartOfAccountsProps {
  accounts: Account[];
  filter: AccountFilter;
  onFilterChange: (filter: AccountFilter) => void;
  onExport: () => void;
  onCreateAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAccount: (accountId: string, updates: Partial<Account>) => void;
  onDeactivateAccount: (accountId: string) => void;
}

export function ChartOfAccounts({
  accounts,
  filter,
  onFilterChange,
  onExport,
  onCreateAccount,
  onUpdateAccount,
  onDeactivateAccount
}: ChartOfAccountsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case 'asset':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'liability':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'equity':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'revenue':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBalanceColor = (account: Account) => {
    if (account.balance === 0) return 'text-gray-600';
    
    if (account.type === 'asset' || account.type === 'expense') {
      return account.balance > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return account.balance > 0 ? 'text-blue-600' : 'text-gray-600';
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    if (!groups[account.type]) {
      groups[account.type] = [];
    }
    groups[account.type].push(account);
    return groups;
  }, {} as Record<AccountType, Account[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ผังบัญชี</h2>
          <p className="text-muted-foreground">
            จัดการบัญชีและโครงสร้างผังบัญชี
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มบัญชีใหม่
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
              </DialogHeader>
              <CreateAccountForm 
                onSubmit={(accountData) => {
                  onCreateAccount(accountData);
                  setShowCreateDialog(false);
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ตัวกรองและค้นหา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาบัญชี..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.type || ''}
              onValueChange={(value) => onFilterChange({ ...filter, type: value as AccountType || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภทบัญชี" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="asset">สินทรัพย์</SelectItem>
                <SelectItem value="liability">หนี้สิน</SelectItem>
                <SelectItem value="equity">ส่วนของเจ้าของ</SelectItem>
                <SelectItem value="revenue">รายได้</SelectItem>
                <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.category || ''}
              onValueChange={(value) => onFilterChange({ ...filter, category: value as AccountCategory || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="current_asset">สินทรัพย์หมุนเวียน</SelectItem>
                <SelectItem value="fixed_asset">สินทรัพย์ถาวร</SelectItem>
                <SelectItem value="current_liability">หนี้สินหมุนเวียน</SelectItem>
                <SelectItem value="long_term_liability">หนี้สินระยะยาว</SelectItem>
                <SelectItem value="owner_equity">ทุนเจ้าของ</SelectItem>
                <SelectItem value="sales_revenue">รายได้จากการขาย</SelectItem>
                <SelectItem value="operating_expense">ค่าใช้จ่ายดำเนินงาน</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.isActive === undefined ? '' : filter.isActive.toString()}
              onValueChange={(value) => onFilterChange({ 
                ...filter, 
                isActive: value === '' ? undefined : value === 'true' 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                <SelectItem value="true">ใช้งาน</SelectItem>
                <SelectItem value="false">ไม่ใช้งาน</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                onFilterChange({});
                setSearchTerm('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts by Type */}
      <div className="space-y-6">
        {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAccountTypeIcon(type as AccountType)}
                {accountTypeLabels[type as AccountType]} ({typeAccounts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeAccounts.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getAccountTypeIcon(account.type)}
                        <div>
                          <div className="font-medium">{account.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {accountCategoryLabels[account.category]}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">{account.name}</div>
                        {account.description && (
                          <div className="text-sm text-muted-foreground">
                            {account.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-bold ${getBalanceColor(account)}`}>
                          {formatCurrency(account.balance)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAccount(account)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeactivateAccount(account.id)}
                        >
                          {account.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปผังบัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              <div key={type}>
                <div className="text-2xl font-bold text-primary">
                  {typeAccounts.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {accountTypeLabels[type as AccountType]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Account Form Component
function CreateAccountForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '' as AccountType,
    category: '' as AccountCategory,
    balance: 0,
    isActive: true,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">รหัสบัญชี</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="เช่น 1000"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">ชื่อบัญชี</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="เช่น เงินสด"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">ประเภทบัญชี</label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">สินทรัพย์</SelectItem>
              <SelectItem value="liability">หนี้สิน</SelectItem>
              <SelectItem value="equity">ส่วนของเจ้าของ</SelectItem>
              <SelectItem value="revenue">รายได้</SelectItem>
              <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">หมวดหมู่</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as AccountCategory })}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_asset">สินทรัพย์หมุนเวียน</SelectItem>
              <SelectItem value="fixed_asset">สินทรัพย์ถาวร</SelectItem>
              <SelectItem value="current_liability">หนี้สินหมุนเวียน</SelectItem>
              <SelectItem value="long_term_liability">หนี้สินระยะยาว</SelectItem>
              <SelectItem value="owner_equity">ทุนเจ้าของ</SelectItem>
              <SelectItem value="sales_revenue">รายได้จากการขาย</SelectItem>
              <SelectItem value="operating_expense">ค่าใช้จ่ายดำเนินงาน</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">คำอธิบาย</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit">
          สร้างบัญชี
        </Button>
      </div>
    </form>
  );
}