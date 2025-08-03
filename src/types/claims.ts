// Claims & Warranty Types
export interface Claim {
  id: string;
  claimNumber: string;
  type: ClaimType;
  status: ClaimStatus;
  priority: ClaimPriority;
  customerId: string;
  customer: Customer;
  productId: string;
  product: Product;
  purchaseDate: string;
  claimDate: string;
  issueDescription: string;
  category: ClaimCategory;
  warrantyInfo: WarrantyInfo;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  resolution?: ClaimResolution;
  attachments: ClaimAttachment[];
  timeline: ClaimTimelineEntry[];
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: string;
  customerSatisfaction?: CustomerSatisfactionRating;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string; // Add dueDate for backward compatibility
}

export type ClaimType = 'warranty' | 'defect' | 'damage' | 'missing_parts' | 'installation' | 'other';

export type ClaimStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'in_progress' 
  | 'waiting_parts' 
  | 'completed' 
  | 'cancelled';

export type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ClaimCategory = 
  | 'product_defect' 
  | 'shipping_damage' 
  | 'installation_issue' 
  | 'user_error' 
  | 'normal_wear' 
  | 'manufacturing_defect';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'individual' | 'business';
}

export interface Product {
  id: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  serialNumber?: string;
  warrantyPeriod: number; // in months
  price: number;
}

export interface WarrantyInfo {
  isUnderWarranty: boolean;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyType: WarrantyType;
  coverageDetails: string[];
  remainingDays: number;
}

export type WarrantyType = 'manufacturer' | 'extended' | 'store' | 'none';

export interface ClaimResolution {
  type: ResolutionType;
  description: string;
  actionTaken: string;
  partsReplaced?: string[];
  laborHours?: number;
  totalCost: number;
  resolvedBy: string;
  resolvedAt: string;
  customerApproval: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
}

export type ResolutionType = 
  | 'repair' 
  | 'replace' 
  | 'refund' 
  | 'store_credit' 
  | 'no_action' 
  | 'refer_manufacturer';

export interface ClaimAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  url: string;
}

export interface ClaimTimelineEntry {
  id: string;
  timestamp: string;
  action: TimelineAction;
  description: string;
  performedBy: string;
  details?: Record<string, any>;
}

export type TimelineAction = 
  | 'created' 
  | 'status_changed' 
  | 'assigned' 
  | 'comment_added' 
  | 'attachment_uploaded' 
  | 'resolution_proposed' 
  | 'completed' 
  | 'customer_contacted';

export interface CustomerSatisfactionRating {
  rating: number; // 1-5 stars
  feedback?: string;
  ratedAt: string;
  wouldRecommend: boolean;
}

export interface ClaimStatistics {
  totalClaims: number;
  pendingClaims: number;
  completedClaims: number;
  averageResolutionTime: number; // in days
  customerSatisfactionAverage: number;
  totalClaimsCost: number;
  claimsByType: Record<ClaimType, number>;
  claimsByStatus: Record<ClaimStatus, number>;
  claimsByPriority: Record<ClaimPriority, number>;
  monthlyTrends: MonthlyClaimTrend[];
}

export interface MonthlyClaimTrend {
  month: string;
  totalClaims: number;
  completedClaims: number;
  averageCost: number;
  satisfactionRating: number;
}

export interface WarrantyPolicy {
  id: string;
  name: string;
  description: string;
  duration: number; // in months
  coverageType: WarrantyType;
  coverageDetails: string[];
  exclusions: string[];
  terms: string[];
  isActive: boolean;
  applicableCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimTemplate {
  id: string;
  name: string;
  type: ClaimType;
  category: ClaimCategory;
  description: string;
  standardResolution: string;
  estimatedTime: number; // in hours
  estimatedCost: number;
  requiredDocuments: string[];
  isActive: boolean;
}

// Filter interfaces
export interface ClaimFilter {
  status?: ClaimStatus;
  type?: ClaimType;
  priority?: ClaimPriority;
  category?: ClaimCategory;
  assignedTo?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  warrantyStatus?: 'under_warranty' | 'expired' | 'all';
  search?: string;
}

export interface WarrantyFilter {
  type?: WarrantyType;
  status?: 'active' | 'expired' | 'expiring_soon';
  productCategory?: string;
  search?: string;
}

// Form interfaces
export interface CreateClaimForm {
  customerId: string;
  productId: string;
  type: ClaimType;
  category: ClaimCategory;
  priority: ClaimPriority;
  issueDescription: string;
  purchaseDate: string;
  attachments?: File[];
}

export interface UpdateClaimForm {
  status?: ClaimStatus;
  priority?: ClaimPriority;
  assignedTo?: string;
  issueDescription?: string;
  estimatedCost?: number;
  resolution?: Partial<ClaimResolution>;
}

// API Response interfaces
export interface ClaimResponse {
  claim: Claim;
  message: string;
  success: boolean;
}

export interface ClaimsListResponse {
  claims: Claim[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ClaimStatisticsResponse {
  statistics: ClaimStatistics;
  success: boolean;
}