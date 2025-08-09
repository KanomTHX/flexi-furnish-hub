// Printing System Types

export enum PrintDocumentType {
  RECEIVE_DOCUMENT = 'receive_document',
  TRANSFER_DOCUMENT = 'transfer_document',
  SN_STICKER = 'sn_sticker',
  CLAIM_DOCUMENT = 'claim_document',
  STOCK_REPORT = 'stock_report'
}

export enum PrintStatus {
  PENDING = 'pending',
  PRINTING = 'printing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum StickerSize {
  SMALL = '3.2x2.5', // 3.2cm x 2.5cm
  MEDIUM = '5x3',    // 5cm x 3cm
  LARGE = '7x5'      // 7cm x 5cm
}

// Print Job Interface
export interface PrintJob {
  id: string;
  type: PrintDocumentType;
  status: PrintStatus;
  documentData: any;
  templateName: string;
  copies: number;
  printerName?: string;
  createdAt: Date;
  printedAt?: Date;
  error?: string;
  userId: string;
  userName?: string;
}

// Print Template Interface
export interface PrintTemplate {
  id: string;
  name: string;
  type: PrintDocumentType;
  template: string; // HTML template
  styles: string;   // CSS styles
  variables: string[]; // Available template variables
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Receive Document Print Data
export interface ReceiveDocumentPrintData {
  receiveNumber: string;
  receiveDate: Date;
  warehouse: {
    name: string;
    code: string;
    address?: string;
  };
  supplier?: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
  };
  invoiceNumber?: string;
  items: {
    productName: string;
    productCode: string;
    brand?: string;
    model?: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    serialNumbers: string[];
  }[];
  totalItems: number;
  totalCost: number;
  receivedBy: string;
  notes?: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

// Transfer Document Print Data
export interface TransferDocumentPrintData {
  transferNumber: string;
  transferDate: Date;
  sourceWarehouse: {
    name: string;
    code: string;
    address?: string;
  };
  targetWarehouse: {
    name: string;
    code: string;
    address?: string;
  };
  items: {
    productName: string;
    productCode: string;
    brand?: string;
    model?: string;
    serialNumber: string;
    unitCost: number;
  }[];
  totalItems: number;
  totalValue: number;
  initiatedBy: string;
  confirmedBy?: string;
  notes?: string;
  status: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

// SN Sticker Print Data
export interface SNStickerPrintData {
  serialNumber: string;
  productName: string;
  productCode: string;
  brand?: string;
  model?: string;
  unitCost: number;
  receiveDate: Date;
  warehouseName: string;
  qrCode?: string; // QR code data
  barcode?: string; // Barcode data
}

// Claim Document Print Data
export interface ClaimDocumentPrintData {
  claimNumber: string;
  claimDate: Date;
  claimType: string;
  serialNumber: string;
  productName: string;
  productCode: string;
  brand?: string;
  model?: string;
  reason: string;
  customerName?: string;
  originalSaleReference?: string;
  resolution?: string;
  processedBy: string;
  warehouse: {
    name: string;
    code: string;
  };
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

// Stock Report Print Data
export interface StockReportPrintData {
  reportTitle: string;
  reportDate: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
  warehouse?: {
    name: string;
    code: string;
  };
  items: {
    productName: string;
    productCode: string;
    brand?: string;
    model?: string;
    totalQuantity: number;
    availableQuantity: number;
    soldQuantity: number;
    transferredQuantity: number;
    claimedQuantity: number;
    averageCost: number;
    totalValue: number;
  }[];
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    averageValue: number;
  };
  generatedBy: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

// Print Configuration
export interface PrintConfig {
  defaultPrinter?: string;
  stickerSize: StickerSize;
  documentMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  stickerMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: {
    small: number;
    normal: number;
    large: number;
  };
  includeQRCode: boolean;
  includeBarcode: boolean;
  companyLogo?: string;
  watermark?: string;
}

// Print Preview Data
export interface PrintPreviewData {
  html: string;
  css: string;
  type: PrintDocumentType;
  copies: number;
  estimatedPages: number;
}

// Print Error
export interface PrintError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Print Statistics
export interface PrintStatistics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averagePrintTime: number;
  mostPrintedDocument: PrintDocumentType;
  printerUsage: {
    printerName: string;
    jobCount: number;
    successRate: number;
  }[];
  dailyStats: {
    date: Date;
    jobCount: number;
    successCount: number;
    failureCount: number;
  }[];
}