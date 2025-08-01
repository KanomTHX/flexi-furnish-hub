import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Claim, ClaimFilter, Customer, Product } from '@/types/claims';
import { 
  formatCurrency, 
  formatDate, 
  formatDuration,
  claimTypeLabels, 
  claimStatusLabels, 
  claimPriorityLabels,
  getStatusColor,
  getPriorityColor,
  getWarrantyStatusColor,
  isClaimOverdue
} from '@/utils/claimsHelpers';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Clock, 
  Download,
  Shield,
  AlertTriangle,
  User,
  Package,
  Calendar
} from 'lucide-react';

interface ClaimsListProps {
  claims: Claim[];
  customers: Customer[];
  products: Product[];
  filter: ClaimFilter;
  onFilterChange: (filter: ClaimFilter) => void;
  onExport: () => void;
  onCreateClaim: () => void;
  onUpdateStatus: (claimId: string, status: string) => void;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetail = (claim: Claim) => {
    setSelectedClaim(claim);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">รายการเคลม</h2>
          <p className="text-muted-foreground">
            จัดการและติดตามการเคลมทั้งหมด
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </Button>
          <Button onClick={onCreateClaim}>
            <Plus className="w-4 h-4 mr-2" />
            สร้างเคลมใหม่
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาเคลม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.status || ''}
              onValueChange={(value) => onFilterChange({ ...filter, status: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="submitted">ส่งคำขอแล้ว</SelectItem>
                <SelectItem value="under_review">กำลังตรวจสอบ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.type || ''}
              onValueChange={(value) => onFilterChange({ ...filter, type: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="warranty">การรับประกัน</SelectItem>
                <SelectItem value="defect">ข้อบกพร่อง</SelectItem>
                <SelectItem value="damage">ความเสียหาย</SelectItem>
                <SelectItem value="installation">การติดตั้ง</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.priority || ''}
              onValueChange={(value) => onFilterChange({ ...filter, priority: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="urgent">เร่งด่วน</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.warrantyStatus || ''}
              onValueChange={(value) => onFilterChange({ ...filter, warrantyStatus: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะประกัน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="under_warranty">ยังอยู่ในประกัน</SelectItem>
                <SelectItem value="expired">หมดประกันแล้ว</SelectItem>
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

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">ไม่พบเคลมที่ตรงกับเงื่อนไขการค้นหา</p>
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map((claim) => (
            <Card key={claim.id} className={`hover:shadow-md transition-shadow ${
              isClaimOverdue(claim) ? 'border-red-200 bg-red-50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{claim.claimNumber}</h3>
                      <Badge className={getStatusColor(claim.status)}>
                        {claimStatusLabels[claim.status]}
                      </Badge>
                      <Badge className={getPriorityColor(claim.priority)}>
                        {claimPriorityLabels[claim.priority]}
                      </Badge>
                      <Badge className={getWarrantyStatusColor(
                        claim.warrantyInfo.isUnderWarranty, 
                        claim.warrantyInfo.remainingDays
                      )}>
                        {claim.warrantyInfo.isUnderWarranty ? 'ยังอยู่ในประกัน' : 'หมดประกันแล้ว'}
                      </Badge>
                      {isClaimOverdue(claim) && (
                        <Badge variant="destructive">
                          <Clock className="w-3 h-3 mr-1" />
                          เกินกำหนด
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {claim.issueDescription}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{claim.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{claim.product.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(claim.claimDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {claim.warrantyInfo.isUnderWarranty 
                            ? `เหลือ ${formatDuration(claim.warrantyInfo.remainingDays)}`
                            : 'หมดประกันแล้ว'
                          }
                        </span>
                      </div>
                    </div>

                    {claim.assignedTo && (
                      <div className="mt-2 text-sm text-blue-600">
                        ผู้รับผิดชอบ: {claim.assignedTo}
                      </div>
                    )}

                    {(claim.estimatedCost || claim.actualCost) && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">ค่าใช้จ่าย: </span>
                        <span className="font-medium">
                          {formatCurrency(claim.actualCost || claim.estimatedCost || 0)}
                        </span>
                        {claim.actualCost && claim.estimatedCost && claim.actualCost !== claim.estimatedCost && (
                          <span className="text-muted-foreground ml-2">
                            (ประมาณการ: {formatCurrency(claim.estimatedCost)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(claim)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      ดูรายละเอียด
                    </Button>
                    
                    {claim.status !== 'completed' && claim.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        แก้ไข
                      </Button>
                    )}

                    {claim.status === 'submitted' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(claim.id, 'under_review')}
                      >
                        ตรวจสอบ
                      </Button>
                    )}

                    {claim.status === 'under_review' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(claim.id, 'approved')}
                      >
                        อนุมัติ
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>อัปเดตล่าสุด: {formatDate(claim.updatedAt.split('T')[0])}</span>
                    {claim.timeline.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{claim.timeline[claim.timeline.length - 1].description}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปรายการเคลม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {claims.filter(c => c.status === 'submitted').length}
              </div>
              <div className="text-sm text-muted-foreground">ส่งคำขอแล้ว</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {claims.filter(c => ['under_review', 'approved', 'in_progress'].includes(c.status)).length}
              </div>
              <div className="text-sm text-muted-foreground">กำลังดำเนินการ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {claims.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">เสร็จสิ้น</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {claims.filter(c => isClaimOverdue(c)).length}
              </div>
              <div className="text-sm text-muted-foreground">เกินกำหนด</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Detail Dialog */}
      {selectedClaim && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดเคลม {selectedClaim.claimNumber}</DialogTitle>
            </DialogHeader>
            <ClaimDetailView claim={selectedClaim} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Claim Detail View Component
function ClaimDetailView({ claim }: { claim: Claim }) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">เลขที่เคลม</label>
          <div className="text-lg font-semibold">{claim.claimNumber}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">สถานะ</label>
          <div>
            <Badge className={getStatusColor(claim.status)}>
              {claimStatusLabels[claim.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Customer & Product Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">ข้อมูลลูกค้า</h3>
          <div className="space-y-1 text-sm">
            <div><strong>ชื่อ:</strong> {claim.customer.name}</div>
            <div><strong>อีเมล:</strong> {claim.customer.email}</div>
            <div><strong>เบอร์โทร:</strong> {claim.customer.phone}</div>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">ข้อมูลสินค้า</h3>
          <div className="space-y-1 text-sm">
            <div><strong>ชื่อสินค้า:</strong> {claim.product.name}</div>
            <div><strong>รุ่น:</strong> {claim.product.model}</div>
            <div><strong>ยี่ห้อ:</strong> {claim.product.brand}</div>
            <div><strong>วันที่ซื้อ:</strong> {formatDate(claim.purchaseDate)}</div>
          </div>
        </div>
      </div>

      {/* Issue Description */}
      <div>
        <h3 className="font-medium mb-2">รายละเอียดปัญหา</h3>
        <div className="p-3 bg-muted rounded-lg text-sm">
          {claim.issueDescription}
        </div>
      </div>

      {/* Warranty Info */}
      <div>
        <h3 className="font-medium mb-2">ข้อมูลการรับประกัน</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>สถานะ:</strong> 
            <Badge className={getWarrantyStatusColor(
              claim.warrantyInfo.isUnderWarranty, 
              claim.warrantyInfo.remainingDays
            )} size="sm" className="ml-2">
              {claim.warrantyInfo.isUnderWarranty ? 'ยังอยู่ในประกัน' : 'หมดประกันแล้ว'}
            </Badge>
          </div>
          <div>
            <strong>วันหมดประกัน:</strong> {formatDate(claim.warrantyInfo.warrantyEndDate)}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="font-medium mb-2">ประวัติการดำเนินการ</h3>
        <div className="space-y-2">
          {claim.timeline.map((entry) => (
            <div key={entry.id} className="flex gap-3 text-sm">
              <div className="text-muted-foreground min-w-[120px]">
                {formatDate(entry.timestamp.split('T')[0])}
              </div>
              <div className="flex-1">
                <strong>{entry.description}</strong>
                <div className="text-muted-foreground">โดย {entry.performedBy}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution (if completed) */}
      {claim.resolution && (
        <div>
          <h3 className="font-medium mb-2">การแก้ไขปัญหา</h3>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2 text-sm">
            <div><strong>ประเภท:</strong> {claim.resolution.type}</div>
            <div><strong>รายละเอียด:</strong> {claim.resolution.description}</div>
            <div><strong>การดำเนินการ:</strong> {claim.resolution.actionTaken}</div>
            <div><strong>ค่าใช้จ่าย:</strong> {formatCurrency(claim.resolution.totalCost)}</div>
            <div><strong>แก้ไขโดย:</strong> {claim.resolution.resolvedBy}</div>
            <div><strong>วันที่แก้ไข:</strong> {formatDate(claim.resolution.resolvedAt.split('T')[0])}</div>
          </div>
        </div>
      )}

      {/* Customer Satisfaction */}
      {claim.customerSatisfaction && (
        <div>
          <h3 className="font-medium mb-2">ความพึงพอใจของลูกค้า</h3>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <strong>คะแนน:</strong>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= claim.customerSatisfaction!.rating 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <span>({claim.customerSatisfaction.rating}/5)</span>
            </div>
            {claim.customerSatisfaction.feedback && (
              <div><strong>ความคิดเห็น:</strong> {claim.customerSatisfaction.feedback}</div>
            )}
            <div>
              <strong>แนะนำให้ผู้อื่น:</strong> {claim.customerSatisfaction.wouldRecommend ? 'ใช่' : 'ไม่'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}