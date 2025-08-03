import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Search, 
  Filter,
  User,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  ArrowRight
} from 'lucide-react';

interface Claim {
  id: string;
  claimNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    model: string;
    serialNumber: string;
  };
  issueDescription: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  dueDate: string;
  assignedTo?: string;
  category: string;
}

interface PendingClaimsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingClaims: Claim[];
  onUpdateStatus: (claimId: string, status: string) => void;
  onAssignClaim: (claimId: string, assignedTo: string) => void;
}

export function PendingClaimsDialog({ 
  open, 
  onOpenChange, 
  pendingClaims,
  onUpdateStatus,
  onAssignClaim
}: PendingClaimsDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Filter claims
  const filteredClaims = pendingClaims.filter(claim => {
    const matchesSearch = 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.issueDescription.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || claim.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || claim.category === categoryFilter;
    
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">สูง</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">ปานกลาง</Badge>;
      case 'low':
        return <Badge variant="secondary">ต่ำ</Badge>;
      default:
        return <Badge variant="outline">ไม่ระบุ</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">รอดำเนินการ</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">กำลังดำเนินการ</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">แก้ไขแล้ว</Badge>;
      case 'closed':
        return <Badge variant="secondary">ปิดแล้ว</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบ</Badge>;
    }
  };

  const handleStartProcessing = (claim: Claim) => {
    onUpdateStatus(claim.id, 'in-progress');
    toast({
      title: "เริ่มดำเนินการ",
      description: `เคลม ${claim.claimNumber} เริ่มดำเนินการแล้ว`,
    });
  };

  const handleAssign = (claim: Claim, assignedTo: string) => {
    onAssignClaim(claim.id, assignedTo);
    toast({
      title: "มอบหมายงานสำเร็จ",
      description: `เคลม ${claim.claimNumber} ถูกมอบหมายแล้ว`,
    });
  };

  const viewClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  // Group claims by priority
  const highPriorityClaims = filteredClaims.filter(c => c.priority === 'high');
  const mediumPriorityClaims = filteredClaims.filter(c => c.priority === 'medium');
  const lowPriorityClaims = filteredClaims.filter(c => c.priority === 'low');

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            เคลมรอดำเนินการ ({pendingClaims.length} รายการ)
          </DialogTitle>
          <DialogDescription>
            จัดการเคลมที่รอการดำเนินการและมอบหมายงาน
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              รายการทั้งหมด ({filteredClaims.length})
            </TabsTrigger>
            <TabsTrigger value="priority" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              จัดกลุ่มตามความสำคัญ
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedClaim}>
              <Eye className="w-4 h-4" />
              รายละเอียด
            </TabsTrigger>
          </TabsList>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาเคลม..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ความสำคัญ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกระดับ</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="low">ต่ำ</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="หมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  <SelectItem value="defect">ของเสีย</SelectItem>
                  <SelectItem value="damage">ชำรุด</SelectItem>
                  <SelectItem value="warranty">การรับประกัน</SelectItem>
                  <SelectItem value="service">บริการ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Claims List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีเคลมรอดำเนินการ</p>
                </div>
              ) : (
                filteredClaims.map((claim) => (
                  <Card key={claim.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-medium text-lg">{claim.claimNumber}</div>
                              <div className="text-sm text-muted-foreground">
                                {claim.customer.name} • {claim.product.name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>สร้าง: {new Date(claim.createdAt).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                              <span>ครบกำหนด: {new Date(claim.dueDate).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3 text-muted-foreground" />
                              <span>{claim.category}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span>{claim.assignedTo || 'ยังไม่มอบหมาย'}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>ปัญหา:</strong> {claim.issueDescription.substring(0, 100)}...
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            {getPriorityBadge(claim.priority)}
                            {getStatusBadge(claim.status)}
                          </div>
                          
                          {getDaysOverdue(claim.dueDate) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              เกินกำหนด {getDaysOverdue(claim.dueDate)} วัน
                            </Badge>
                          )}
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewClaimDetails(claim)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStartProcessing(claim)}
                            >
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Priority Tab */}
          <TabsContent value="priority" className="space-y-4">
            <div className="space-y-6">
              {/* High Priority */}
              {highPriorityClaims.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      ความสำคัญสูง ({highPriorityClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {highPriorityClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <div className="font-medium">{claim.claimNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {claim.customer.name} • {claim.product.name}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewClaimDetails(claim)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleStartProcessing(claim)}>
                              เริ่มดำเนินการ
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medium Priority */}
              {mediumPriorityClaims.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader className="bg-yellow-50">
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      ความสำคัญปานกลาง ({mediumPriorityClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {mediumPriorityClaims.slice(0, 5).map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <div className="font-medium">{claim.claimNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {claim.customer.name} • {claim.product.name}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewClaimDetails(claim)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700" onClick={() => handleStartProcessing(claim)}>
                              เริ่มดำเนินการ
                            </Button>
                          </div>
                        </div>
                      ))}
                      {mediumPriorityClaims.length > 5 && (
                        <div className="text-center text-sm text-muted-foreground">
                          และอีก {mediumPriorityClaims.length - 5} รายการ
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Low Priority */}
              {lowPriorityClaims.length > 0 && (
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-gray-800 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      ความสำคัญต่ำ ({lowPriorityClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      มีเคลมความสำคัญต่ำ {lowPriorityClaims.length} รายการ รอการดำเนินการ
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {selectedClaim ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>รายละเอียดเคลม {selectedClaim.claimNumber}</span>
                      <div className="flex gap-2">
                        {getPriorityBadge(selectedClaim.priority)}
                        {getStatusBadge(selectedClaim.status)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ลูกค้า</label>
                        <div>{selectedClaim.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedClaim.customer.phone}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">สินค้า</label>
                        <div>{selectedClaim.product.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedClaim.product.model}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">วันที่สร้าง</label>
                        <div>{new Date(selectedClaim.createdAt).toLocaleDateString('th-TH')}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">กำหนดเสร็จ</label>
                        <div>{new Date(selectedClaim.dueDate).toLocaleDateString('th-TH')}</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">รายละเอียดปัญหา</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          {selectedClaim.issueDescription}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStartProcessing(selectedClaim)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        เริ่มดำเนินการ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>เลือกเคลมเพื่อดูรายละเอียด</p>
              </div>
            )}
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
}