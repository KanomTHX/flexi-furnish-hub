import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerAnalytics } from '@/components/installments/CustomerAnalytics';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Star,
  CreditCard
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

interface CustomerReportsProps {
  onExportReport?: () => void;
  loading?: boolean;
}

export const CustomerReports: React.FC<CustomerReportsProps> = ({
  onExportReport,
  loading = false
}) => {
  const {
    customers,
    customerStats,
    calculateCustomerAnalytics,
    searchCustomers,
    filterCustomers,
    getOverdueCustomers,
    loading: customersLoading
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [filteredCustomers, setFilteredCustomers] = useState(customers);

  // คำนวณสถิติลูกค้า
  const analytics = calculateCustomerAnalytics();
  const overdueCustomers = getOverdueCustomers();
  const stats = customerStats();

  // กรองข้อมูลลูกค้า
  useEffect(() => {
    let filtered = customers;

    // ค้นหาตามคำค้นหา
    if (searchTerm) {
      filtered = searchCustomers(searchTerm);
    }

    // กรองตามระดับความเสี่ยง
    if (riskFilter !== 'all') {
      filtered = filtered.filter(customer => customer.riskLevel === riskFilter);
    }

    // กรองตามช่วงวันที่
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.customerSince);
        return customerDate >= dateRange.from! && customerDate <= dateRange.to!;
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, riskFilter, dateRange, searchCustomers]);

  // ฟังก์ชันส่งออกรายงาน
  const handleExportCustomerReport = () => {
    const csvContent = [
      ['ชื่อ-นามสกุล', 'เบอร์โทร', 'อีเมล', 'คะแนนเครดิต', 'ระดับความเสี่ยง', 'ยอดให้เครดิต', 'ยอดค้างชำระ', 'วันที่เป็นลูกค้า'],
      ...filteredCustomers.map(customer => [
        customer.name,
        customer.phone,
        customer.email || '',
        customer.creditScore?.toString() || '0',
        customer.riskLevel || 'medium',
        customer.totalFinanced?.toLocaleString() || '0',
        customer.overdueAmount?.toLocaleString() || '0',
        format(new Date(customer.customerSince), 'dd/MM/yyyy', { locale: th })
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customer-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onExportReport) {
      onExportReport();
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    if (score >= 550) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* ตัวกรองและการค้นหา */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรองรายงานลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหาลูกค้า</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ชื่อ, เบอร์โทร, อีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ระดับความเสี่ยง</label>
              <Select value={riskFilter} onValueChange={(value: any) => setRiskFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกระดับความเสี่ยง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="low">ความเสี่ยงต่ำ</SelectItem>
                  <SelectItem value="medium">ความเสี่ยงปานกลาง</SelectItem>
                  <SelectItem value="high">ความเสี่ยงสูง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ช่วงวันที่เป็นลูกค้า</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">การดำเนินการ</label>
              <Button 
                onClick={handleExportCustomerReport}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* สถิติลูกค้าหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ใหม่เดือนนี้: {analytics.newCustomersThisMonth}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าที่ใช้งาน</p>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-green-600 mt-1">
                  {((stats.active / stats.total) * 100).toFixed(1)}% ของทั้งหมด
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลูกค้าค้างชำระ</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-xs text-red-600 mt-1">
                  {((stats.overdue / stats.total) * 100).toFixed(1)}% ของทั้งหมด
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">คะแนนเครดิตเฉลี่ย</p>
                <p className="text-2xl font-bold">{analytics.averageMetrics.creditScore.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  จาก 850 คะแนน
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* การวิเคราะห์ลูกค้า */}
      <CustomerAnalytics customers={filteredCustomers} />

      {/* ตารางลูกค้าที่กรองแล้ว */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              รายชื่อลูกค้า ({filteredCustomers.length} คน)
            </div>
            <Badge variant="outline">
              แสดง {filteredCustomers.length} จาก {customers.length} คน
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">ลูกค้า</th>
                  <th className="text-left p-3 font-medium">ติดต่อ</th>
                  <th className="text-left p-3 font-medium">คะแนนเครดิต</th>
                  <th className="text-left p-3 font-medium">ความเสี่ยง</th>
                  <th className="text-left p-3 font-medium">ยอดให้เครดิต</th>
                  <th className="text-left p-3 font-medium">ยอดค้างชำระ</th>
                  <th className="text-left p-3 font-medium">วันที่เป็นลูกค้า</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, 50).map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {customer.id}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="text-sm">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${getCreditScoreColor(customer.creditScore || 0)}`}>
                        {customer.creditScore || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge className={getRiskBadgeColor(customer.riskLevel || 'medium')}>
                        {customer.riskLevel === 'low' ? 'ต่ำ' : 
                         customer.riskLevel === 'medium' ? 'ปานกลาง' : 'สูง'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">
                        ฿{(customer.totalFinanced || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${
                        (customer.overdueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ฿{(customer.overdueAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {format(new Date(customer.customerSince), 'dd/MM/yyyy', { locale: th })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length > 50 && (
              <div className="text-center p-4 text-muted-foreground">
                แสดง 50 รายการแรก จากทั้งหมด {filteredCustomers.length} รายการ
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ลูกค้าเสี่ยงสูงที่ต้องติดตาม */}
      {overdueCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ลูกค้าค้างชำระที่ต้องติดตาม ({overdueCustomers.length} คน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueCustomers.slice(0, 6).map((customer) => (
                <Card key={customer.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-sm font-medium text-red-600 mt-2">
                          ค้างชำระ: ฿{(customer.overdueAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {customer.riskLevel === 'high' ? 'เสี่ยงสูง' : 'ค้างชำระ'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerReports;