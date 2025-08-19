import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { CustomerData, CustomerFilterOptions } from '@/types/customer';
import { formatCurrency } from '@/lib/utils';

interface CustomerListProps {
  customers: CustomerData[];
  loading?: boolean;
  onCustomerSelect?: (customer: CustomerData) => void;
  onCustomerEdit?: (customer: CustomerData) => void;
  onCustomerDelete?: (customerId: string) => void;
  onCustomerCreate?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filterOptions?: CustomerFilterOptions;
  onFilterChange?: (options: CustomerFilterOptions) => void;
}

const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRiskLevelIcon = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return <TrendingUp className="h-3 w-3" />;
    case 'medium':
      return <TrendingDown className="h-3 w-3" />;
    case 'high':
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return null;
  }
};

export function CustomerList({
  customers,
  loading = false,
  onCustomerSelect,
  onCustomerEdit,
  onCustomerDelete,
  onCustomerCreate,
  searchQuery = '',
  onSearchChange,
  filterOptions = {},
  onFilterChange,
}: CustomerListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localFilterOptions, setLocalFilterOptions] = useState<CustomerFilterOptions>(filterOptions);

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.idCard.includes(query)
      );
    }

    // Apply filters
    if (localFilterOptions.riskLevel) {
      filtered = filtered.filter((c) => c.riskLevel === localFilterOptions.riskLevel);
    }

    if (localFilterOptions.hasActiveContracts !== undefined) {
      filtered = filtered.filter((c) =>
        localFilterOptions.hasActiveContracts ? c.activeContracts > 0 : c.activeContracts === 0
      );
    }

    if (localFilterOptions.hasOverdue !== undefined) {
      filtered = filtered.filter((c) =>
        localFilterOptions.hasOverdue ? c.overdueAmount > 0 : c.overdueAmount === 0
      );
    }

    if (localFilterOptions.occupation) {
      filtered = filtered.filter((c) => c.occupation === localFilterOptions.occupation);
    }

    return filtered;
  }, [customers, localSearchQuery, localFilterOptions]);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (newOptions: Partial<CustomerFilterOptions>) => {
    const updatedOptions = { ...localFilterOptions, ...newOptions };
    setLocalFilterOptions(updatedOptions);
    onFilterChange?.(updatedOptions);
  };

  const clearFilters = () => {
    const emptyOptions = {};
    setLocalFilterOptions(emptyOptions);
    onFilterChange?.(emptyOptions);
  };

  const uniqueOccupations = useMemo(() => {
    const occupations = customers.map((c) => c.occupation);
    return Array.from(new Set(occupations)).sort();
  }, [customers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>รายการลูกค้า</CardTitle>
          <CardDescription>กำลังโหลดข้อมูลลูกค้า...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>รายการลูกค้า</CardTitle>
            <CardDescription>
              ทั้งหมด {filteredCustomers.length} คน จาก {customers.length} คน
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ส่งออก
            </Button>
            {onCustomerCreate && (
              <Button onClick={onCustomerCreate} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                เพิ่มลูกค้า
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล, เลขบัตรประชาชน)"
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                กรอง
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>กรองตามเงื่อนไข</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2 space-y-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">ระดับความเสี่ยง</label>
                  <Select
                    value={localFilterOptions.riskLevel || ''}
                    onValueChange={(value) => 
                      handleFilterChange({ riskLevel: value as 'low' | 'medium' | 'high' || undefined })
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="เลือกระดับความเสี่ยง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">ต่ำ</SelectItem>
                      <SelectItem value="medium">กลาง</SelectItem>
                      <SelectItem value="high">สูง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">อาชีพ</label>
                  <Select
                    value={localFilterOptions.occupation || ''}
                    onValueChange={(value) => handleFilterChange({ occupation: value || undefined })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="เลือกอาชีพ" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueOccupations.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>
                          {occupation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">สถานะสัญญา</label>
                  <Select
                    value={
                      localFilterOptions.hasActiveContracts === true
                        ? 'active'
                        : localFilterOptions.hasActiveContracts === false
                        ? 'inactive'
                        : ''
                    }
                    onValueChange={(value) => {
                      const hasActive = value === 'active' ? true : value === 'inactive' ? false : undefined;
                      handleFilterChange({ hasActiveContracts: hasActive });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="เลือกสถานะสัญญา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">มีสัญญาใช้งาน</SelectItem>
                      <SelectItem value="inactive">ไม่มีสัญญาใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">สถานะค้างชำระ</label>
                  <Select
                    value={
                      localFilterOptions.hasOverdue === true
                        ? 'overdue'
                        : localFilterOptions.hasOverdue === false
                        ? 'current'
                        : ''
                    }
                    onValueChange={(value) => {
                      const hasOverdue = value === 'overdue' ? true : value === 'current' ? false : undefined;
                      handleFilterChange({ hasOverdue });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="เลือกสถานะค้างชำระ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overdue">มีค้างชำระ</SelectItem>
                      <SelectItem value="current">ไม่มีค้างชำระ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                ล้างตัวกรอง
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ติดต่อ</TableHead>
                <TableHead>อาชีพ</TableHead>
                <TableHead>คะแนนเครดิต</TableHead>
                <TableHead>สัญญา</TableHead>
                <TableHead>ยอดเงิน</TableHead>
                <TableHead>ความเสี่ยง</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูลลูกค้า
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onCustomerSelect?.(customer)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.idCard}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{customer.phone}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{customer.occupation}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(customer.monthlyIncome)}/เดือน
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{customer.creditScore}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.creditScore >= 750
                            ? 'ดีเยี่ยม'
                            : customer.creditScore >= 650
                            ? 'ดี'
                            : customer.creditScore >= 550
                            ? 'พอใช้'
                            : 'ต้องปรับปรุง'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">
                          {customer.activeContracts}/{customer.totalContracts}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ใช้งาน/ทั้งหมด
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {formatCurrency(customer.totalFinanced)}
                        </div>
                        {customer.overdueAmount > 0 && (
                          <div className="text-xs text-red-600">
                            ค้าง: {formatCurrency(customer.overdueAmount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getRiskLevelColor(customer.riskLevel)} flex items-center gap-1`}
                      >
                        {getRiskLevelIcon(customer.riskLevel)}
                        {customer.riskLevel === 'low'
                          ? 'ต่ำ'
                          : customer.riskLevel === 'medium'
                          ? 'กลาง'
                          : 'สูง'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomerSelect?.(customer);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          {onCustomerEdit && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onCustomerEdit(customer);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              แก้ไข
                            </DropdownMenuItem>
                          )}
                          {onCustomerDelete && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onCustomerDelete(customer.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}