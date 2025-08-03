import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Claim, ClaimFilter, Customer, Product, ClaimStatus, ClaimPriority } from '@/types/claims';
import { formatCurrency, formatDate, claimStatusLabels, claimPriorityLabels, claimTypeLabels } from '@/utils/claimsHelpers';
import { 
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Package,
  Calendar,
  MoreHorizontal,
  FileText,
  Shield
} from 'lucide-react';

interface ClaimsListProps {
  claims: Claim[];
  customers: Customer[];
  products: Product[];
  filter: ClaimFilter;
  onFilterChange: (filter: ClaimFilter) => void;
  onExport: () => void;
  onCreateClaim: () => void;
  onUpdateStatus: (claimId: string, status: ClaimStatus) => void;
  onAssignClaim: (claimId: string, assignedTo: string) => void;
}

export function ClaimsList({
  claims,
  customers,
  products,
  filter,
  onFilterChange,
  onExport,
  onCreateClaim,
  onUpdateStatus,
  onAssignClaim
}: ClaimsListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    type: 'warranty' as const,
    priority: 'medium' as ClaimPriority,
    issueDescription: '',
    purchaseDate: ''
  });

  const getStatusBadge = (status: ClaimStatus) => {
    const variants = {
      submitted: 'secondary',
      under_review: 'outline',
      approved: 'default',
      rejected: 'destructive',
      in_progress: 'default',
      waiting_parts: 'outline',
      completed: 'default',
      cancelled: 'destructive'
    } as const;

    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_parts: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status]}>
        {claimStatusLabels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ClaimPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[priority]}>
        {claimPriorityLabels[priority]}
      </Badge>
    );
  };

  const getWarrantyBadge = (warrantyInfo: any) => {
    if (warrantyInfo.isUnderWarranty) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Shield className="w-3 h-3 mr-1" />
          ในประกัน
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          หมดประกัน
        </Badge>
      );
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (filter.status && claim.status !== filter.status) return false;
    if (filter.type && claim.type !== filter.type) return false;
    if (filter.priority && claim.priority !== filter.priority) return false;
    if (filter.customerId && claim.customerId !== filter.customerId) return false;
    if (filter.assignedTo && claim.assignedTo !== filter.assignedTo) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return claim.claimNumber.toLowerCase().includes(searchLower) ||
             claim.customer.name.toLowerCase().includes(searchLower) ||
             claim.product.name.toLowerCase().includes(searchLower) ||
             claim.issueDescription.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const handleCreateClaim = () => {
    // In a real app, this would create the claim via API
    console.log('Creating claim:', formData);
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      productId: '',
      type: 'warranty',
      priority: 'medium',
      issueDescription: '',
      purchaseDate: ''
    });
  };

  const openDetailDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">รายการเคลม</h2>
          <p className="text-sm text-muted-foreground">
            จัดการและติดตามการเคลมทั้งหมด ({filteredClaims.length} รายการ)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                สร้างเคลมใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>สร้างเคลมใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลการเคลมใหม่
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">ลูกค้า</Label>
                    <Select 
                      value={formData.customerId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกลูกค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product">สินค้า</Label>
                    <Select 
                      value={formData.productId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {product.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">ประเภทเคลม</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warranty">การรับประกัน</SelectItem>
                        <SelectItem value="defect">ของเสีย</SelectItem>
                        <SelectItem value="damage">ความเสียหาย</SelectItem>
                        <SelectItem value="missing_parts">ชิ้นส่วนหาย</SelectItem>
                        <SelectItem value="installation">การติดตั้ง</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">ความสำคัญ</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: ClaimPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">ต่ำ</SelectItem>
                        <SelectItem value="medium">ปานกลาง</SelectItem>
                        <SelectItem value="high">สูง</SelectItem>
                        <SelectItem value="urgent">เร่งด่วน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="purchaseDate">วันที่ซื้อ</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="issueDescription">รายละเอียดปัญหา</Label>
                  <Textarea
                    id="issueDescription"
                    value={formData.issueDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDescription: e.target.value }))}
                    placeholder="อธิบายปัญหาที่พบ..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleCreateClaim}>
                  สร้างเคลม
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเคลม..."
                value={filter.search || ''}
                onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select 
              value={filter.status || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, status: value === 'all' ? undefined : value as ClaimStatus })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="submitted">ส่งแล้ว</SelectItem>
                <SelectItem value="under_review">กำลังตรวจสอบ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filter.priority || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, priority: value === 'all' ? undefined : value as ClaimPriority })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="urgent">เร่งด่วน</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filter.customerId || 'all'} 
              onValueChange={(value) => 
                onFilterChange({ ...filter, customerId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ลูกค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="วันที่เริ่มต้น"
              value={filter.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
            />
            <Button 
              variant="outline" 
              onClick={() => onFilterChange({})}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              ล้างตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่เคลม</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>การรับประกัน</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{claim.claimNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {claim.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {claim.assignedTo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{claim.customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {claim.customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{claim.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {claim.product.model} - {claim.product.brand}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {claimTypeLabels[claim.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(claim.priority)}
                  </TableCell>
                  <TableCell>
                    {getWarrantyBadge(claim.warrantyInfo)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3" />
                      {formatDate(claim.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailDialog(claim)}>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(claim.id, 'in_progress')}>
                          <Edit className="mr-2 h-4 w-4" />
                          เริ่มดำเนินการ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(claim.id, 'completed')}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          ทำเสร็จแล้ว
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredClaims.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบเคลมที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดเคลม</DialogTitle>
            <DialogDescription>
              {selectedClaim?.claimNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">ลูกค้า</Label>
                  <div className="text-lg">{selectedClaim.customer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClaim.customer.phone} | {selectedClaim.customer.email}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">สินค้า</Label>
                  <div className="text-lg">{selectedClaim.product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedClaim.product.model} - {selectedClaim.product.brand}
                  </div>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">สถานะ</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedClaim.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">ความสำคัญ</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedClaim.priority)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">การรับประกัน</Label>
                  <div className="mt-1">
                    {getWarrantyBadge(selectedClaim.warrantyInfo)}
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <Label className="text-sm font-medium">รายละเอียดปัญหา</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedClaim.issueDescription}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">วันที่ซื้อ</Label>
                  <div>{formatDate(selectedClaim.purchaseDate)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">วันที่เคลม</Label>
                  <div>{formatDate(selectedClaim.claimDate)}</div>
                </div>
              </div>

              {/* Cost Information */}
              {(selectedClaim.estimatedCost || selectedClaim.actualCost) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedClaim.estimatedCost && (
                    <div>
                      <Label className="text-sm font-medium">ค่าใช้จ่ายประเมิน</Label>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(selectedClaim.estimatedCost)}
                      </div>
                    </div>
                  )}
                  {selectedClaim.actualCost && (
                    <div>
                      <Label className="text-sm font-medium">ค่าใช้จ่ายจริง</Label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedClaim.actualCost)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution */}
              {selectedClaim.resolution && (
                <div>
                  <Label className="text-sm font-medium">การแก้ไข</Label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="font-medium">{selectedClaim.resolution.type}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedClaim.resolution.description}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      แก้ไขโดย: {selectedClaim.resolution.resolvedBy} 
                      เมื่อ {formatDate(selectedClaim.resolution.resolvedAt)}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Satisfaction */}
              {selectedClaim.customerSatisfaction && (
                <div>
                  <Label className="text-sm font-medium">ความพึงพอใจของลูกค้า</Label>
                  <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= selectedClaim.customerSatisfaction!.rating
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="font-medium">
                        {selectedClaim.customerSatisfaction.rating}/5
                      </span>
                    </div>
                    {selectedClaim.customerSatisfaction.feedback && (
                      <div className="text-sm text-muted-foreground mt-2">
                        "{selectedClaim.customerSatisfaction.feedback}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}