import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Plus,
  Phone, 
  Mail, 
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerSelector } from './CustomerSelector';

interface CustomerManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerManagementDialog: React.FC<CustomerManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { customers, customerStats } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">ต่ำ</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">ปานกลาง</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">สูง</Badge>;
      default:
        return null;
    }
  };

  // Top customers by total financed
  const topCustomers = customers
    .sort((a, b) => b.totalFinanced - a.totalFinanced)
    .slice(0, 5);

  // High risk customers
  const highRiskCustomers = customers
    .filter(c => c.riskLevel === 'high' || c.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            จัดการลูกค้า
          </DialogTitle>
          <DialogDescription>
            ดูข้อมูลลูกค้า สถิติ และจัดการข้อมูลลูกค้าในระบบ
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="customers">รายชื่อลูกค้า</TabsTrigger>
            <TabsTrigger value="add">เพิ่มลูกค้า</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ลูกค้าทั้งหมด</p>
                      <p className="text-2xl font-bold">{customerStats.total}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">มีสัญญาใช้งาน</p>
                      <p className="text-2xl font-bold text-green-600">{customerStats.active}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ค้างชำระ</p>
                      <p className="text-2xl font-bold text-red-600">{customerStats.overdue}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">คะแนนเฉลี่ย</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(customerStats.averageCreditScore)}
                      </p>
                    </div>
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    ลูกค้าอันดับต้น
                  </h3>
                  <div className="space-y-3">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-xs">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              คะแนน {customer.creditScore}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            ฿{customer.totalFinanced.toLocaleString()}
                          </p>
                          {getRiskBadge(customer.riskLevel)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* High Risk Customers */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    ลูกค้าเสี่ยงสูง
                  </h3>
                  <div className="space-y-3">
                    {highRiskCustomers.length > 0 ? (
                      highRiskCustomers.map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                คะแนน {customer.creditScore}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm text-red-600">
                              ฿{customer.overdueAmount.toLocaleString()}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              ค้างชำระ
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">ไม่มีลูกค้าเสี่ยงสูง</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className={`h-3 w-3 ${getCreditScoreColor(customer.creditScore)}`} />
                            <span className={`text-sm font-medium ${getCreditScoreColor(customer.creditScore)}`}>
                              {customer.creditScore}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {customer.activeContracts} สัญญา
                          </p>
                        </div>
                        {getRiskBadge(customer.riskLevel)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบลูกค้าที่ค้นหา</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">เพิ่มลูกค้าใหม่</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    ใช้ฟอร์มด้านล่างเพื่อเพิ่มลูกค้าใหม่เข้าระบบ
                  </p>
                  <CustomerSelector
                    selectedCustomer={null}
                    onSelectCustomer={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};