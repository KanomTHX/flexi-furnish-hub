import { 
  Claim, 
  Customer, 
  Product, 
  ClaimType, 
  ClaimStatus, 
  ClaimPriority, 
  ClaimCategory,
  WarrantyType 
} from '@/types/claims';

// Label mappings
export const claimTypeLabels: Record<ClaimType, string> = {
  warranty: 'การรับประกัน',
  defect: 'ข้อบกพร่อง',
  damage: 'ความเสียหาย',
  missing_parts: 'ชิ้นส่วนขาดหาย',
  installation: 'การติดตั้ง',
  other: 'อื่นๆ'
};

export const claimStatusLabels: Record<ClaimStatus, string> = {
  submitted: 'ส่งคำขอแล้ว',
  under_review: 'กำลังตรวจสอบ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  in_progress: 'กำลังดำเนินการ',
  waiting_parts: 'รอชิ้นส่วน',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก'
};

export const claimPriorityLabels: Record<ClaimPriority, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
  urgent: 'เร่งด่วน'
};

export const claimCategoryLabels: Record<ClaimCategory, string> = {
  product_defect: 'ข้อบกพร่องของสินค้า',
  shipping_damage: 'ความเสียหายจากการขนส่ง',
  installation_issue: 'ปัญหาการติดตั้ง',
  user_error: 'ความผิดพลาดจากผู้ใช้',
  normal_wear: 'การสึกหรอตามปกติ',
  manufacturing_defect: 'ข้อบกพร่องจากการผลิต'
};

export const warrantyTypeLabels: Record<WarrantyType, string> = {
  manufacturer: 'ผู้ผลิต',
  extended: 'ขยายเพิ่มเติม',
  store: 'ร้านค้า',
  none: 'ไม่มี'
};

export const resolutionTypeLabels = {
  repair: 'ซ่อมแซม',
  replace: 'เปลี่ยนใหม่',
  refund: 'คืนเงิน',
  store_credit: 'เครดิตร้าน',
  no_action: 'ไม่ดำเนินการ',
  refer_manufacturer: 'ส่งต่อผู้ผลิต'
};

// Formatting functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(days: number): string {
  if (days < 0) return 'หมดอายุแล้ว';
  if (days === 0) return 'วันนี้';
  if (days === 1) return '1 วัน';
  if (days < 30) return `${days} วัน`;
  if (days < 365) return `${Math.floor(days / 30)} เดือน`;
  return `${Math.floor(days / 365)} ปี`;
}

// Status and priority helpers
export function getStatusColor(status: ClaimStatus): string {
  const colors = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    in_progress: 'bg-purple-100 text-purple-800',
    waiting_parts: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: ClaimPriority): string {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  return colors[priority];
}

export function getWarrantyStatusColor(isUnderWarranty: boolean, remainingDays: number): string {
  if (!isUnderWarranty) return 'bg-red-100 text-red-800';
  if (remainingDays <= 30) return 'bg-orange-100 text-orange-800';
  return 'bg-green-100 text-green-800';
}

// Validation functions
export function validateClaimForm(formData: any): string[] {
  const errors: string[] = [];

  if (!formData.customerId) {
    errors.push('กรุณาเลือกลูกค้า');
  }

  if (!formData.productId) {
    errors.push('กรุณาเลือกสินค้า');
  }

  if (!formData.type) {
    errors.push('กรุณาเลือกประเภทการเคลม');
  }

  if (!formData.category) {
    errors.push('กรุณาเลือกหมวดหมู่ปัญหา');
  }

  if (!formData.priority) {
    errors.push('กรุณาเลือกระดับความสำคัญ');
  }

  if (!formData.issueDescription?.trim()) {
    errors.push('กรุณาระบุรายละเอียดปัญหา');
  }

  if (!formData.purchaseDate) {
    errors.push('กรุณาระบุวันที่ซื้อ');
  } else {
    const purchaseDate = new Date(formData.purchaseDate);
    const today = new Date();
    if (purchaseDate > today) {
      errors.push('วันที่ซื้อไม่สามารถเป็นวันในอนาคตได้');
    }
  }

  return errors;
}

export function validateResolutionForm(formData: any): string[] {
  const errors: string[] = [];

  if (!formData.type) {
    errors.push('กรุณาเลือกประเภทการแก้ไข');
  }

  if (!formData.description?.trim()) {
    errors.push('กรุณาระบุรายละเอียดการแก้ไข');
  }

  if (!formData.actionTaken?.trim()) {
    errors.push('กรุณาระบุการดำเนินการ');
  }

  if (formData.totalCost !== undefined && formData.totalCost < 0) {
    errors.push('ค่าใช้จ่ายต้องไม่ติดลบ');
  }

  if (formData.laborHours !== undefined && formData.laborHours < 0) {
    errors.push('ชั่วโมงการทำงานต้องไม่ติดลบ');
  }

  return errors;
}

// Export functions
export function exportClaimsToCSV(claims: Claim[]): string {
  const headers = [
    'เลขที่เคลม',
    'ประเภท',
    'สถานะ',
    'ความสำคัญ',
    'ลูกค้า',
    'สินค้า',
    'วันที่ซื้อ',
    'วันที่เคลม',
    'รายละเอียดปัญหา',
    'ผู้รับผิดชอบ',
    'ค่าใช้จ่าย',
    'สถานะการรับประกัน'
  ];
  
  const rows = claims.map(claim => [
    claim.claimNumber,
    claimTypeLabels[claim.type],
    claimStatusLabels[claim.status],
    claimPriorityLabels[claim.priority],
    claim.customer.name,
    claim.product.name,
    formatDate(claim.purchaseDate),
    formatDate(claim.claimDate),
    claim.issueDescription,
    claim.assignedTo || 'ยังไม่มอบหมาย',
    formatCurrency(claim.actualCost || claim.estimatedCost || 0),
    claim.warrantyInfo.isUnderWarranty ? 'ยังอยู่ในประกัน' : 'หมดประกันแล้ว'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportCustomersToCSV(customers: Customer[]): string {
  const headers = ['ชื่อลูกค้า', 'อีเมล', 'เบอร์โทร', 'ที่อยู่', 'ประเภท'];
  
  const rows = customers.map(customer => [
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    customer.customerType === 'individual' ? 'บุคคล' : 'นิติบุคคล'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function exportProductsToCSV(products: Product[]): string {
  const headers = ['ชื่อสินค้า', 'รุ่น', 'ยี่ห้อ', 'หมวดหมู่', 'ระยะประกัน (เดือน)', 'ราคา'];
  
  const rows = products.map(product => [
    product.name,
    product.model,
    product.brand,
    product.category,
    product.warrantyPeriod.toString(),
    formatCurrency(product.price)
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Calculation helpers
export function calculateResolutionTime(claim: Claim): number {
  if (!claim.completedAt) return 0;
  
  const created = new Date(claim.createdAt);
  const completed = new Date(claim.completedAt);
  const diffTime = Math.abs(completed.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateWarrantyRemaining(purchaseDate: string, warrantyPeriod: number): {
  isUnderWarranty: boolean;
  remainingDays: number;
  warrantyEndDate: string;
} {
  const purchase = new Date(purchaseDate);
  const warrantyEnd = new Date(purchase);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyPeriod);
  
  const now = new Date();
  const isUnderWarranty = now <= warrantyEnd;
  const remainingDays = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isUnderWarranty,
    remainingDays: Math.max(0, remainingDays),
    warrantyEndDate: warrantyEnd.toISOString().split('T')[0]
  };
}

export function isClaimOverdue(claim: Claim): boolean {
  if (claim.status === 'completed' || claim.status === 'cancelled') return false;
  
  const now = new Date();
  const claimDate = new Date(claim.claimDate);
  const daysSinceCreated = Math.ceil((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Overdue thresholds based on priority
  const overdueThreshold = {
    urgent: 1,
    high: 3,
    medium: 7,
    low: 14
  };
  
  return daysSinceCreated > overdueThreshold[claim.priority];
}

// Search and filter helpers
export function searchClaims(claims: Claim[], searchTerm: string): Claim[] {
  if (!searchTerm.trim()) return claims;
  
  const term = searchTerm.toLowerCase();
  return claims.filter(claim =>
    claim.claimNumber.toLowerCase().includes(term) ||
    claim.issueDescription.toLowerCase().includes(term) ||
    claim.customer.name.toLowerCase().includes(term) ||
    claim.product.name.toLowerCase().includes(term) ||
    claim.product.model.toLowerCase().includes(term) ||
    claim.product.brand.toLowerCase().includes(term)
  );
}

export function sortClaims(claims: Claim[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Claim[] {
  return [...claims].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'claimDate':
        aValue = new Date(a.claimDate);
        bValue = new Date(b.claimDate);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'customer':
        aValue = a.customer.name;
        bValue = b.customer.name;
        break;
      case 'cost':
        aValue = a.actualCost || a.estimatedCost || 0;
        bValue = b.actualCost || b.estimatedCost || 0;
        break;
      default:
        aValue = a.claimDate;
        bValue = b.claimDate;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// Report helpers
export function generateClaimsSummaryReport(claims: Claim[]) {
  const totalClaims = claims.length;
  const completedClaims = claims.filter(c => c.status === 'completed').length;
  const pendingClaims = claims.filter(c => 
    ['submitted', 'under_review', 'approved', 'in_progress', 'waiting_parts'].includes(c.status)
  ).length;

  const totalCost = claims.reduce((sum, claim) => 
    sum + (claim.actualCost || claim.estimatedCost || 0), 0
  );

  const averageResolutionTime = claims
    .filter(c => c.completedAt)
    .reduce((sum, claim) => sum + calculateResolutionTime(claim), 0) / completedClaims || 0;

  const satisfactionRatings = claims
    .filter(c => c.customerSatisfaction)
    .map(c => c.customerSatisfaction!.rating);
  
  const averageSatisfaction = satisfactionRatings.length > 0
    ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
    : 0;

  return {
    totalClaims,
    completedClaims,
    pendingClaims,
    completionRate: totalClaims > 0 ? (completedClaims / totalClaims) * 100 : 0,
    totalCost,
    averageCost: totalClaims > 0 ? totalCost / totalClaims : 0,
    averageResolutionTime,
    averageSatisfaction
  };
}