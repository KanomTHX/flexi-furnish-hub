// Transfer Request Types
export interface TransferRequest {
  id: string;
  request_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  requested_by: string;
  requested_by_user?: User;
  status: TransferRequestStatus;
  priority: TransferRequestPriority;
  request_date: string;
  required_date?: string;
  approved_by?: string;
  approved_by_user?: User;
  approved_at?: string;
  rejected_by?: string;
  rejected_by_user?: User;
  rejected_at?: string;
  rejection_reason?: string;
  total_items: number;
  total_amount?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: TransferRequestItem[];
}

export interface TransferRequestItem {
  id: string;
  transfer_request_id: string;
  product_id: string;
  product?: Product;
  requested_quantity: number;
  approved_quantity?: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransferShipment {
  id: string;
  transfer_request_id: string;
  transfer_request?: TransferRequest;
  shipment_number: string;
  status: TransferShipmentStatus;
  shipped_by: string;
  shipped_by_user?: User;
  shipped_at: string;
  received_by?: string;
  received_by_user?: User;
  received_at?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: TransferShipmentItem[];
}

export interface TransferShipmentItem {
  id: string;
  transfer_shipment_id: string;
  transfer_request_item_id: string;
  transfer_request_item?: TransferRequestItem;
  shipped_quantity: number;
  received_quantity?: number;
  damaged_quantity?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransferDocument {
  id: string;
  transfer_request_id?: string;
  transfer_shipment_id?: string;
  document_type: TransferDocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_user?: User;
  created_at: string;
}

export interface TransferAuditLog {
  id: string;
  transfer_request_id?: string;
  transfer_shipment_id?: string;
  action: TransferAuditAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by: string;
  performed_by_user?: User;
  notes?: string;
  created_at: string;
}

// Enums
export type TransferRequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export type TransferRequestPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type TransferShipmentStatus = 
  | 'preparing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'received'
  | 'cancelled';

export type TransferDocumentType = 
  | 'request_form'
  | 'approval_document'
  | 'shipping_label'
  | 'packing_list'
  | 'delivery_receipt'
  | 'invoice'
  | 'other';

export type TransferAuditAction = 
  | 'created'
  | 'updated'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'received'
  | 'cancelled'
  | 'document_uploaded'
  | 'document_deleted';

// Form Data Types
export interface CreateTransferRequestData {
  from_warehouse_id: string;
  to_warehouse_id: string;
  priority: TransferRequestPriority;
  required_date?: string;
  notes?: string;
  items: CreateTransferRequestItemData[];
}

export interface CreateTransferRequestItemData {
  product_id: string;
  requested_quantity: number;
  unit_cost: number;
  notes?: string;
}

export interface UpdateTransferRequestData {
  priority?: TransferRequestPriority;
  required_date?: string;
  notes?: string;
  items?: UpdateTransferRequestItemData[];
}

export interface UpdateTransferRequestItemData {
  id?: string;
  product_id: string;
  requested_quantity: number;
  unit_cost: number;
  notes?: string;
}

export interface ApproveTransferRequestData {
  notes?: string;
  items: ApproveTransferRequestItemData[];
}

export interface ApproveTransferRequestItemData {
  transfer_request_item_id: string;
  approved_quantity: number;
}

export interface RejectTransferRequestData {
  rejection_reason: string;
  notes?: string;
}

export interface CreateTransferShipmentData {
  transfer_request_id: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  notes?: string;
  items: CreateTransferShipmentItemData[];
}

export interface CreateTransferShipmentItemData {
  transfer_request_item_id: string;
  shipped_quantity: number;
  notes?: string;
}

export interface ReceiveTransferShipmentData {
  received_at?: string;
  notes?: string;
  items: ReceiveTransferShipmentItemData[];
}

export interface ReceiveTransferShipmentItemData {
  transfer_shipment_item_id: string;
  received_quantity: number;
  damaged_quantity?: number;
  notes?: string;
}

// Filter and Search Types
export interface TransferRequestFilters {
  search?: string;
  status?: TransferRequestStatus;
  priority?: TransferRequestPriority;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  requested_by?: string;
  date_from?: string;
  date_to?: string;
  required_date_from?: string;
  required_date_to?: string;
}

export interface TransferShipmentFilters {
  search?: string;
  status?: TransferShipmentStatus;
  transfer_request_id?: string;
  shipped_by?: string;
  received_by?: string;
  date_from?: string;
  date_to?: string;
}

// Statistics Types
export interface TransferStatistics {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  in_transit_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  total_value: number;
  average_processing_time: number; // in hours
  top_routes: TransferRoute[];
  monthly_trends: TransferMonthlyTrend[];
}

export interface TransferRoute {
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  request_count: number;
  total_value: number;
}

export interface TransferMonthlyTrend {
  month: string;
  year: number;
  request_count: number;
  total_value: number;
  average_processing_time: number;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// Related Types (should be imported from other modules)
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  unit_cost: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface TransferRequestResponse {
  data: TransferRequest[];
  pagination: PaginationInfo;
}

export interface TransferShipmentResponse {
  data: TransferShipment[];
  pagination: PaginationInfo;
}

export interface TransferDocumentResponse {
  data: TransferDocument[];
  pagination: PaginationInfo;
}

export interface TransferAuditLogResponse {
  data: TransferAuditLog[];
  pagination: PaginationInfo;
}

// Error Types
export interface TransferError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Validation Types
export interface TransferValidationError {
  field: string;
  message: string;
  code: string;
}

export interface TransferValidationResult {
  isValid: boolean;
  errors: TransferValidationError[];
}

// Export legacy types for backward compatibility
export type TransferStatus = TransferRequestStatus;