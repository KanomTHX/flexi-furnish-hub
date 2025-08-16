import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Account, AccountFilter, AccountType, AccountCategory } from '@/types/accounting';
import { formatCurrency, accountTypeLabels, accountCategoryLabels } from '@/utils/accountingHelpers';
import { chartOfAccountsService, AccountHierarchy } from '@/services/chartOfAccountsService';
import { ChartOfAccountsError, AccountingValidationError } from '@/errors/accounting';
import { toast } from 'sonner';
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
  TrendingDown,
  Settings,
  Link,
  AlertTriangle,
  TreePine
} from 'lucide-react';

interface ChartOfAccountsProps {
  // Optional props for backward compatibility
  accounts?: Account[];
  filter?: AccountFilter;
  onFilterChange?: (filter: AccountFilter) => void;
  onExport?: () => void;
  onCreateAccount?: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAccount?: (accountId: string, updates: Partial<Account>) => void;
  onDeactivateAccount?: (accountId: string) => void;
}

export function ChartOfAccounts({
  accounts: propAccounts,
  filter: propFilter,
  onFilterChange: propOnFilterChange,
  onExport: propOnExport,
  onCreateAccount: propOnCreateAccount,
  onUpdateAccount: propOnUpdateAccount,
  onDeactivateAccount: propOnDeactivateAccount
}: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>(propAccounts || []);
  const [filter, setFilter] = useState<AccountFilter>(propFilter || {});
  const [hierarchy, setHierarchy] = useState<AccountHierarchy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');

  // Load accounts on component mount
  useEffect(() => {
    if (!propAccounts) {
      loadAccounts();
    }
  }, [propAccounts]);

  // Load hierarchy when accounts change
  useEffect(() => {
    if (viewMode === 'hierarchy') {
      loadHierarchy();
    }
  }, [accounts, viewMode]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chartOfAccountsService.getAccounts(filter);
      setAccounts(data);
    } catch (err) {
      const errorMessage = err instanceof AccountingIntegrationError 
        ? err.message 
        : 'Failed to load accounts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      const data = await chartOfAccountsService.getAccountHierarchy();
      setHierarchy(data);
    } catch (err) {
      const errorMessage = err instanceof AccountingIntegrationError 
        ? err.message 
        : 'Failed to load account hierarchy';
      toast.error(errorMessage);
    }
  };

  const handleFilterChange = (newFilter: AccountFilter) => {
    setFilter(newFilter);
    if (propOnFilterChange) {
      propOnFilterChange(newFilter);
    } else {
      // Reload accounts with new filter
      loadAccounts();
    }
  };

  const handleCreateAccount = async (accountData: any) => {
    try {
      if (propOnCreateAccount) {
        propOnCreateAccount(accountData);
      } else {
        await chartOfAccountsService.createAccount(accountData);
        toast.success('สร้างบัญชีสำเร็จ');
        loadAccounts();
      }
      setShowCreateDialog(false);
    } catch (err) {
      const errorMessage = err instanceof AccountingIntegrationError 
        ? err.message 
        : 'Failed to create account';
      toast.error(errorMessage);
    }
  };

  const handleUpdateAccount = async (accountId: string, updates: any) => {
    try {
      if (propOnUpdateAccount) {
        propOnUpdateAccount(accountId, updates);
      } else {
        await chartOfAccountsService.updateAccount(accountId, updates);
        toast.success('อัปเดตบัญชีสำเร็จ');
        loadAccounts();
      }
      setShowEditDialog(false);
      setSelectedAccount(null);
    } catch (err) {
      const errorMessage = err instanceof AccountingIntegrationError 
        ? err.message 
        : 'Failed to update account';
      toast.error(errorMessage);
    }
  };

  const handleDeactivateAccount = async (accountId: string) => {
    try {
      if (propOnDeactivateAccount) {
        propOnDeactivateAccount(accountId);
      } else {
        await chartOfAccountsService.deleteAccount(accountId);
        toast.success('ปิดใช้งานบัญชีสำเร็จ');
        loadAccounts();
      }
    } catch (err) {
      const errorMessage = err instanceof AccountingIntegrationError 
        ? err.message 
        : 'Failed to deactivate account';
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    if (propOnExport) {
      propOnExport();
    } else {
      // Default export functionality
      const csvData = accounts.map(account => ({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        balance: account.balance,
        isActive: account.isActive
      }));
      
      const csv = [
        'Code,Name,Type,Category,Balance,Active',
        ...csvData.map(row => 
          `${row.code},"${row.name}",${row.type},${row.category},${row.balance},${row.isActive}`
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart-of-accounts.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('ส่งออกข้อมูลสำเร็จ');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ผังบัญชี</h2>
          <p className="text-muted-foreground">
            จัดการบัญชีและโครงสร้างผังบัญชี
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'hierarchy' : 'list')}>
            <TreePine className="w-4 h-4 mr-2" />
            {viewMode === 'list' ? 'แสดงแบบลำดับชั้น' : 'แสดงแบบรายการ'}
          </Button>
          <Button variant="outline" onClick={() => setShowMappingDialog(true)}>
            <Link className="w-4 h-4 mr-2" />
            การเชื่อมโยง
          </Button>
          <Button variant="outline" onClick={handleExport}>
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
              </DialogHeader>
              <CreateAccountForm 
                accounts={accounts}
                onSubmit={handleCreateAccount}
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
              onValueChange={(value) => handleFilterChange({ ...filter, type: value as AccountType || undefined })}
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
              onValueChange={(value) => handleFilterChange({ ...filter, category: value as AccountCategory || undefined })}
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
              value={filter.isActive === undefined ? 'all' : filter.isActive.toString()}
              onValueChange={(value) => handleFilterChange({ 
                ...filter, 
                isActive: value === 'all' ? undefined : value === 'true' 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="true">ใช้งาน</SelectItem>
                <SelectItem value="false">ไม่ใช้งาน</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                handleFilterChange({});
                setSearchTerm('');
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Display */}
      {viewMode === 'list' ? (
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
                    <AccountRow 
                      key={account.id}
                      account={account}
                      onEdit={(account) => {
                        setSelectedAccount(account);
                        setShowEditDialog(true);
                      }}
                      onToggleActive={() => handleDeactivateAccount(account.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              ผังบัญชีแบบลำดับชั้น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hierarchy.map((account) => (
                <HierarchyAccountRow 
                  key={account.id}
                  account={account}
                  onEdit={(account) => {
                    setSelectedAccount(account);
                    setShowEditDialog(true);
                  }}
                  onToggleActive={() => handleDeactivateAccount(account.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขบัญชี</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <EditAccountForm 
              account={selectedAccount}
              accounts={accounts}
              onSubmit={(updates) => handleUpdateAccount(selectedAccount.id, updates)}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedAccount(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Account Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>การเชื่อมโยงบัญชี</DialogTitle>
          </DialogHeader>
          <AccountMappingInterface 
            accounts={accounts}
            onClose={() => setShowMappingDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Account Row Component
function AccountRow({ 
  account, 
  onEdit, 
  onToggleActive 
}: { 
  account: Account;
  onEdit: (account: Account) => void;
  onToggleActive: () => void;
}) {
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

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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
            onClick={() => onEdit(account)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleActive}
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
  );
}

// Hierarchy Account Row Component
function HierarchyAccountRow({ 
  account, 
  onEdit, 
  onToggleActive 
}: { 
  account: AccountHierarchy;
  onEdit: (account: Account) => void;
  onToggleActive: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div 
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${account.level * 20}px` }}
      >
        <div className="flex items-center gap-2 flex-1">
          {account.children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="font-medium">{account.code}</div>
            <div className="font-medium">{account.name}</div>
            <Badge variant={account.isActive ? 'default' : 'secondary'} className="text-xs">
              {account.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-bold">
            {formatCurrency(account.balance)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(account)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleActive}
          >
            {account.isActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && account.children.map((child) => (
        <HierarchyAccountRow 
          key={child.id}
          account={child}
          onEdit={onEdit}
          onToggleActive={() => onToggleActive()}
        />
      ))}
    </div>
  );
}

// Create Account Form Component
function CreateAccountForm({ 
  accounts,
  onSubmit, 
  onCancel 
}: { 
  accounts: Account[];
  onSubmit: (account: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '' as AccountType,
    category: '' as AccountCategory,
    parentId: '',
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
        <label className="text-sm font-medium">บัญชีหลัก (ไม่บังคับ)</label>
        <Select
          value={formData.parentId}
          onValueChange={(value) => setFormData({ ...formData, parentId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกบัญชีหลัก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ไม่มีบัญชีหลัก</SelectItem>
            {accounts
              .filter(account => account.type === formData.type && account.isActive)
              .map(account => (
                <SelectItem key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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

// Edit Account Form Component
function EditAccountForm({ 
  account,
  accounts,
  onSubmit, 
  onCancel 
}: { 
  account: Account;
  accounts: Account[];
  onSubmit: (updates: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    code: account.code,
    name: account.name,
    type: account.type,
    category: account.category,
    parentId: account.parentId || '',
    balance: account.balance,
    isActive: account.isActive,
    description: account.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    
    if (formData.code !== account.code) updates.code = formData.code;
    if (formData.name !== account.name) updates.name = formData.name;
    if (formData.type !== account.type) updates.type = formData.type;
    if (formData.category !== account.category) updates.category = formData.category;
    if (formData.parentId !== (account.parentId || '')) updates.parentId = formData.parentId || null;
    if (formData.balance !== account.balance) updates.balance = formData.balance;
    if (formData.isActive !== account.isActive) updates.isActive = formData.isActive;
    if (formData.description !== (account.description || '')) updates.description = formData.description;
    
    onSubmit(updates);
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
        <label className="text-sm font-medium">บัญชีหลัก (ไม่บังคับ)</label>
        <Select
          value={formData.parentId}
          onValueChange={(value) => setFormData({ ...formData, parentId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกบัญชีหลัก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ไม่มีบัญชีหลัก</SelectItem>
            {accounts
              .filter(acc => acc.type === formData.type && acc.isActive && acc.id !== account.id)
              .map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">ยอดคงเหลือ</label>
          <Input
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            ใช้งาน
          </label>
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
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
    </form>
  );
}

// Account Mapping Interface Component
function AccountMappingInterface({ 
  accounts, 
  onClose 
}: { 
  accounts: Account[];
  onClose: () => void;
}) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>('quickbooks');
  const [loading, setLoading] = useState(false);

  const accountingSystems = [
    { value: 'quickbooks', label: 'QuickBooks' },
    { value: 'xero', label: 'Xero' },
    { value: 'sage', label: 'Sage' },
    { value: 'sap', label: 'SAP' },
    { value: 'custom', label: 'ระบบกำหนดเอง' }
  ];

  const loadMappings = async () => {
    setLoading(true);
    try {
      // This would load existing mappings from the database
      // For now, we'll create sample mappings
      const sampleMappings = accounts.slice(0, 5).map(account => ({
        id: `mapping-${account.id}`,
        localAccountId: account.id,
        localAccountCode: account.code,
        localAccountName: account.name,
        externalAccountId: `ext-${account.code}`,
        externalAccountCode: account.code,
        externalAccountName: account.name,
        mappingType: 'automatic' as const,
        isActive: true
      }));
      setMappings(sampleMappings);
    } catch (error) {
      toast.error('ไม่สามารถโหลดการเชื่อมโยงได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, [selectedSystem]);

  const handleCreateMapping = () => {
    // This would open a dialog to create new mapping
    toast.info('ฟีเจอร์นี้จะพัฒนาในอนาคต');
  };

  const handleSyncMappings = async () => {
    setLoading(true);
    try {
      // This would sync with external system
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.success('ซิงค์การเชื่อมโยงสำเร็จ');
      loadMappings();
    } catch (error) {
      toast.error('ไม่สามารถซิงค์การเชื่อมโยงได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">การเชื่อมโยงบัญชี</h3>
          <p className="text-sm text-muted-foreground">
            จัดการการเชื่อมโยงบัญชีกับระบบบัญชีภายนอก
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateMapping}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มการเชื่อมโยง
          </Button>
          <Button onClick={handleSyncMappings} disabled={loading}>
            <Settings className="w-4 h-4 mr-2" />
            {loading ? 'กำลังซิงค์...' : 'ซิงค์'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">ระบบบัญชี</label>
          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountingSystems.map(system => (
                <SelectItem key={system.value} value={system.value}>
                  {system.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การเชื่อมโยงที่มีอยู่</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>กำลังโหลด...</p>
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีการเชื่อมโยง</p>
              <Button variant="outline" onClick={handleCreateMapping} className="mt-4">
                สร้างการเชื่อมโยงแรก
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {mappings.map(mapping => (
                <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {mapping.localAccountCode} - {mapping.localAccountName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        เชื่อมโยงกับ: {mapping.externalAccountCode} - {mapping.externalAccountName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mapping.isActive ? 'default' : 'secondary'}>
                      {mapping.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                    <Badge variant="outline">
                      {mapping.mappingType === 'automatic' ? 'อัตโนมัติ' : 'กำหนดเอง'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          ปิด
        </Button>
      </div>
    </div>
  );
}