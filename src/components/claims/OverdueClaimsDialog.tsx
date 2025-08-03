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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Search, 
  Calendar,
  User,
  Package,
  Clock,
  Zap,
  Eye,
  MessageSquare,
  Phone
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

interface OverdueClaimsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overdueClaims: Claim[];
  onUpdateStatus: (claimId: string, status: string) => void;
  onAssignClaim: (claimId: string, assignedTo: string) => void;
}

export function OverdueClaimsDialog({ 
  open, 
  onOpenChange, 
  overdueClaims,
  onUpdateStatus,
  onAssignClaim
}: OverdueClaimsDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [escalationNote, setEscalationNote] = useState('');
  const [showEscalationForm, setShowEscalationForm] = useState(false);

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get severity based on days overdue
  const getSeverity = (daysOverdue: number) => {
    if (daysOverdue >= 7) return 'critical';
    if (daysOverdue >= 3) return 'high';
    return 'medium';
  };

  // Filter claims
  const filteredClaims = overdueClaims.filter(claim => {
    const matchesSearch = 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const daysOverdue = getDaysOverdue(claim.dueDate);
    const severity = getSeverity(daysOverdue);
    const matchesSeverity = severityFilter === 'all' || severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  // Sort by days overdue (most overdue first)
  const sortedClaims = filteredClaims.sort((a, b) => {
    const daysA = getDaysOverdue(a.dueDate);
    const daysB = getDaysOverdue(b.dueDate);
    return daysB - daysA;
  });

  const getSeverityBadge = (daysOverdue: number) => {
    const severity = getSeverity(daysOverdue);
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">วิกฤต ({daysOverdue} วัน)</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">สูง ({daysOverdue} วัน)</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">ปานกลาง ({daysOverdue} วัน)</Badge>;
      default:
        return <Badge variant="secondary">{daysOverdue} วัน</Badge>;
    }
  };

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

  const handleEscalate = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowEscalationForm(true);
  };

  const confirmEscalation = () => {
    if (selectedClaim) {
      // In real app, this would escalate to management
      onUpdateStatus(selectedClaim.id, 'in-progress');
      toast({
        title: "ส่งต่อผู้บริหารแล้ว",
        description: `เคลม ${selectedClaim.claimNumber} ถูกส่งต่อผู้บริหารเพื่อดำเนินการด่วน`,
      });
      setShowEscalationForm(false);
      setEscalationNote('');
      setSelectedClaim(null);
    }
  };

  const handleUrgentAction = (claim: Claim) => {
    onUpdateStatus(claim.id, 'in-progress');
    toast({
      title: "เริ่มดำเนินการด่วน",
      description: `เคลม ${claim.claimNumber} ได้รับการดำเนินการด่วนแล้ว`,
    });
  };

  const handleContactCustomer = (claim: Claim) => {
    toast({
      title: "ติดต่อลูกค้า",
      description: `กำลังติดต่อ ${claim.customer.name} (${claim.customer.phone})`,
    });
  };

  // Group by severity
  const criticalClaims = sortedClaims.filter(c => getSeverity(getDaysOverdue(c.dueDate)) === 'critical');
  const highSeverityClaims = sortedClaims.filter(c => getSeverity(getDaysOverdue(c.dueDate)) === 'high');
  const mediumSeverityClaims = sortedClaims.filter(c => getSeverity(getDaysOverdue(c.dueDate)) === 'medium');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            เคลมเกินกำหนด ({overdueClaims.length} รายการ)
          </DialogTitle>
          <DialogDescription>
            จัดการเคลมที่เกินกำหนดและต้องดำเนินการด่วน
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              รายการทั้งหมด ({filteredClaims.length})
            </TabsTrigger>
            <TabsTrigger value="severity" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              จัดกลุ่มตามความรุนแรง
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
                    placeholder="ค้นหาเคลมเกินกำหนด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ความรุนแรง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกระดับ</SelectItem>
                  <SelectItem value="critical">วิกฤต (≥7 วัน)</SelectItem>
                  <SelectItem value="high">สูง (3-6 วัน)</SelectItem>
                  <SelectItem value="medium">ปานกลาง (1-2 วัน)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Claims List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่มีเคลมเกินกำหนด</p>
                </div>
              ) : (
                sortedClaims.map((claim) => {
                  const daysOverdue = getDaysOverdue(claim.dueDate);
                  const severity = getSeverity(daysOverdue);
                  
                  return (
                    <Card key={claim.id} className={`hover:shadow-md transition-shadow ${
                      severity === 'critical' ? 'border-red-300 bg-red-50' :
                      severity === 'high' ? 'border-orange-300 bg-orange-50' :
                      'border-yellow-300 bg-yellow-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                severity === 'critical' ? 'bg-red-200' :
                                severity === 'high' ? 'bg-orange-200' :
                                'bg-yellow-200'
                              }`}>
                                <AlertTriangle className={`w-5 h-5 ${
                                  severity === 'critical' ? 'text-red-600' :
                                  severity === 'high' ? 'text-orange-600' :
                                  'text-yellow-600'
                                }`} />
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
                                <span>ครบกำหนด: {new Date(claim.dueDate).toLocaleDateString('th-TH')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span>เกิน: {daysOverdue} วัน</span>
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
                              {getSeverityBadge(daysOverdue)}
                              {getPriorityBadge(claim.priority)}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedClaim(claim)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContactCustomer(claim)}
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleUrgentAction(claim)}
                              >
                                <Zap className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleEscalate(claim)}
                              >
                                ส่งต่อ
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Severity Tab */}
          <TabsContent value="severity" className="space-y-4">
            <div className="space-y-6">
              {/* Critical Claims */}
              {criticalClaims.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      วิกฤต - เกินกำหนด ≥7 วัน ({criticalClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {criticalClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 bg-red-100 rounded-lg border border-red-200">
                          <div>
                            <div className="font-medium text-red-900">{claim.claimNumber}</div>
                            <div className="text-sm text-red-700">
                              {claim.customer.name} • เกิน {getDaysOverdue(claim.dueDate)} วัน
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleContactCustomer(claim)}>
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleEscalate(claim)}>
                              ส่งต่อด่วน
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* High Severity Claims */}
              {highSeverityClaims.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      สูง - เกินกำหนด 3-6 วัน ({highSeverityClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {highSeverityClaims.slice(0, 5).map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
                          <div>
                            <div className="font-medium">{claim.claimNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {claim.customer.name} • เกิน {getDaysOverdue(claim.dueDate)} วัน
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedClaim(claim)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => handleUrgentAction(claim)}>
                              ดำเนินการด่วน
                            </Button>
                          </div>
                        </div>
                      ))}
                      {highSeverityClaims.length > 5 && (
                        <div className="text-center text-sm text-muted-foreground">
                          และอีก {highSeverityClaims.length - 5} รายการ
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medium Severity Claims */}
              {mediumSeverityClaims.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      ปานกลาง - เกินกำหนด 1-2 วัน ({mediumSeverityClaims.length} รายการ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      มีเคลมเกินกำหนด {mediumSeverityClaims.length} รายการ ควรติดตามและดำเนินการ
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
                        {getSeverityBadge(getDaysOverdue(selectedClaim.dueDate))}
                        {getPriorityBadge(selectedClaim.priority)}
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
                        <label className="text-sm font-medium text-muted-foreground">กำหนดเสร็จ</label>
                        <div className="text-red-600 font-medium">
                          {new Date(selectedClaim.dueDate).toLocaleDateString('th-TH')}
                        </div>
                        <div className="text-sm text-red-600">
                          เกินกำหนด {getDaysOverdue(selectedClaim.dueDate)} วัน
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">ผู้รับผิดชอบ</label>
                        <div>{selectedClaim.assignedTo || 'ยังไม่มอบหมาย'}</div>
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
                        variant="outline"
                        onClick={() => handleContactCustomer(selectedClaim)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        ติดต่อลูกค้า
                      </Button>
                      <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleUrgentAction(selectedClaim)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        ดำเนินการด่วน
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleEscalate(selectedClaim)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        ส่งต่อผู้บริหาร
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

        {/* Escalation Form */}
        {showEscalationForm && selectedClaim && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">ส่งต่อผู้บริหาร - {selectedClaim.claimNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">เหตุผลในการส่งต่อ</label>
                <Textarea
                  value={escalationNote}
                  onChange={(e) => setEscalationNote(e.target.value)}
                  placeholder="ระบุเหตุผลและความเร่งด่วน..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEscalationForm(false)}>
                  ยกเลิก
                </Button>
                <Button variant="destructive" onClick={confirmEscalation}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  ส่งต่อผู้บริหาร
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}