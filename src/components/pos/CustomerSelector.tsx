import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Check,
  Star,
  CreditCard
} from 'lucide-react';
import { Customer } from '@/types/pos';
import { useCustomers } from '@/hooks/useCustomers';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer
}) => {
  const { customers, loading, actions } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelectDialog, setShowSelectDialog] = useState(false);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone || '').includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );



  const handleSelectCustomer = (customer: any) => {
    // Convert to POS Customer format
    const posCustomer: Customer = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      idCard: customer.idCard,
      occupation: customer.occupation,
      monthlyIncome: customer.monthlyIncome
    };

    onSelectCustomer(posCustomer);
    setShowSelectDialog(false);
  };



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

  return (
    <div className="space-y-4">
      {/* Current Customer Display */}
      {selectedCustomer ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {selectedCustomer.name?.charAt(0) || ''}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  เลือกแล้ว
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCustomer(null)}
                >
                  เปลี่ยน
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">ยังไม่ได้เลือกลูกค้า</p>
              <div className="flex gap-2 justify-center">
                <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      เลือกลูกค้า
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>เลือกลูกค้า</DialogTitle>
                      <DialogDescription>
                        ค้นหาและเลือกลูกค้าจากรายชื่อที่มีอยู่
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาลูกค้า..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-medium text-sm">
                                      {customer.name?.charAt(0) || ''}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{customer.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className={`h-3 w-3 ${getCreditScoreColor(customer.creditScore)}`} />
                                    <span className={`text-xs font-medium ${getCreditScoreColor(customer.creditScore)}`}>
                                      {customer.creditScore}
                                    </span>
                                  </div>
                                  {getRiskBadge(customer.riskLevel)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {filteredCustomers.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>ไม่พบลูกค้าที่ค้นหา</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Plus className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-sm text-blue-800 mb-2">ต้องการเพิ่มลูกค้าใหม่?</p>
                  <p className="text-xs text-blue-600">กรุณาไปที่หน้า "จัดการลูกค้า" เพื่อเพิ่มลูกค้าใหม่</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};