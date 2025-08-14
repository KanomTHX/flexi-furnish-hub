// Supplier and Billing Types
export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: number; // วันที่ต้องชำระ
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'completed';
  paymentTerms: number;
  notes?: string;
  items?: SupplierInvoiceItem[];
  payments?: SupplierPayment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  description?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: Date;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId: string;
  supplier?: Supplier;
  invoiceId: string;
  invoice?: SupplierInvoice;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId?: string;
  supplier?: Supplier;
  supplierName: string;
  supplierContact?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  totalAmount: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes?: string;
  items?: PurchaseOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  createdAt: Date;
}

// Summary and Statistics Types
export interface SupplierSummary {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOutstanding: number;
  overdueAmount: number;
  totalPaidThisMonth: number;
  averagePaymentDays: number;
}

export interface SupplierBillingSummary {
  supplierId: string;
  supplierName: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  lastPaymentDate?: Date;
  averagePaymentDays: number;
}

// Filter and Search Types
export interface SupplierFilters {
  search?: string;
  status?: string;
  hasOutstanding?: boolean;
  hasOverdue?: boolean;
}

export interface InvoiceFilters {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PaymentFilters {
  supplierId?: string;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Form Data Types
export interface CreateSupplierData {
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  supplierId: string;
  purchaseOrderId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentTerms?: number;
  notes?: string;
  items: {
    productId: string;
    description?: string;
    quantity: number;
    unitCost: number;
  }[];
}

export interface CreatePaymentData {
  paymentNumber: string;
  supplierId: string;
  invoiceId: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  referenceNumber?: string;
  notes?: string;
}

// API Response Types
export interface SuppliersResponse {
  data: Supplier[];
  total: number;
}

export interface InvoicesResponse {
  data: SupplierInvoice[];
  total: number;
}

export interface PaymentsResponse {
  data: SupplierPayment[];
  total: number;
}