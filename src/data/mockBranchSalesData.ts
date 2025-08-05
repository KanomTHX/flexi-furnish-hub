import { 
  BranchSale, 
  BranchInstallment, 
  BranchClaim, 
  BranchSalesSummary,
  BranchInstallmentSummary,
  BranchClaimSummary
} from '../types/branchSales';

// Mock Branch Sales Data
export const mockBranchSales: BranchSale[] = [
  // ไผ่ท่าโพ (PTH)
  {
    id: 'sale-pth-001',
    saleNumber: 'PTH-2024-001',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    customerId: 'cust-001',
    customer: {
      id: 'cust-001',
      name: 'บริษัท ออฟฟิศ ดีไซน์ จำกัด',
      phone: '042-111-222',
      email: 'contact@officedesign.com',
      branchId: 'branch-001'
    },
    items: [
      {
        id: 'item-001',
        productId: 'prod-001',
        product: {
          id: 'prod-001',
          name: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
          sku: 'SF-COM-001',
          category: 'โซฟา'
        },
        quantity: 2,
        unitPrice: 25000,
        originalPrice: 25000,
        discountPercent: 0,
        discountAmount: 0,
        totalPrice: 50000,
        stockReserved: true,
        warranty: {
          period: 2,
          unit: 'years',
          terms: 'รับประกันโครงสร้างและผ้าหุ้ม'
        }
      }
    ],
    subtotal: 50000,
    taxAmount: 3500,
    discountAmount: 0,
    totalAmount: 53500,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    paidAmount: 53500,
    changeAmount: 0,
    status: 'completed',
    salesPersonId: 'emp-001',
    salesPersonName: 'สมชาย ใจดี',
    cashierId: 'emp-001',
    cashierName: 'สมชาย ใจดี',
    saleDate: '2024-02-15T10:30:00Z',
    completedAt: '2024-02-15T10:35:00Z',
    receiptNumber: 'RCP-PTH-001',
    invoiceNumber: 'INV-PTH-001',
    createdAt: '2024-02-15T10:30:00Z',
    createdBy: 'emp-001',
    updatedAt: '2024-02-15T10:35:00Z',
    updatedBy: 'emp-001'
  },
  
  // บางมูลนาก (BMN)
  {
    id: 'sale-bmn-001',
    saleNumber: 'BMN-2024-001',
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    customerId: 'cust-002',
    customer: {
      id: 'cust-002',
      name: 'คุณสมศรี บ้านสวย',
      phone: '043-222-333',
      email: 'somsri@email.com',
      branchId: 'branch-002'
    },
    items: [
      {
        id: 'item-002',
        productId: 'prod-002',
        product: {
          id: 'prod-002',
          name: 'เก้าอี้ทำงาน รุ่น Executive',
          sku: 'CH-EXE-002',
          category: 'เก้าอี้'
        },
        quantity: 1,
        unitPrice: 12000,
        originalPrice: 12000,
        discountPercent: 10,
        discountAmount: 1200,
        totalPrice: 10800,
        stockReserved: true,
        warranty: {
          period: 1,
          unit: 'years',
          terms: 'รับประกันกลไกและโครงสร้าง'
        }
      }
    ],
    subtotal: 10800,
    taxAmount: 756,
    discountAmount: 1200,
    totalAmount: 11556,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    paidAmount: 12000,
    changeAmount: 444,
    status: 'completed',
    salesPersonId: 'emp-003',
    salesPersonName: 'สมศักดิ์ ขยัน',
    saleDate: '2024-02-14T14:20:00Z',
    completedAt: '2024-02-14T14:25:00Z',
    receiptNumber: 'RCP-BMN-001',
    createdAt: '2024-02-14T14:20:00Z',
    createdBy: 'emp-003',
    updatedAt: '2024-02-14T14:25:00Z',
    updatedBy: 'emp-003'
  }
];

// Mock Branch Installments Data
export const mockBranchInstallments: BranchInstallment[] = [
  {
    id: 'inst-pth-001',
    contractNumber: 'PTH-INST-2024-001',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    customerId: 'cust-inst-001',
    customer: {
      id: 'cust-inst-001',
      name: 'คุณสมพร ครอบครัวดี',
      phone: '081-111-2222',
      email: 'somporn@email.com',
      idCard: '1-1111-11111-11-1',
      address: '123 หมู่บ้านสุขใจ ไผ่ท่าโพ',
      occupation: 'พนักงานบริษัท',
      monthlyIncome: 35000,
      branchId: 'branch-001'
    },
    saleId: 'sale-pth-002',
    saleNumber: 'PTH-2024-002',
    totalAmount: 80000,
    downPayment: 20000,
    financedAmount: 60000,
    interestRate: 12,
    installmentPeriod: 24,
    monthlyPayment: 2826,
    payments: [
      {
        id: 'pay-001',
        installmentId: 'inst-pth-001',
        paymentNumber: 1,
        dueDate: '2024-03-15',
        amount: 2826,
        paidAmount: 2826,
        remainingAmount: 0,
        status: 'paid',
        paidDate: '2024-03-14T10:00:00Z',
        paymentMethod: 'transfer',
        receiptNumber: 'RCP-INST-001',
        lateFee: 0,
        daysOverdue: 0,
        collectedBy: 'emp-001',
        collectorName: 'สมชาย ใจดี',
        createdAt: '2024-02-15T10:00:00Z',
        updatedAt: '2024-03-14T10:00:00Z'
      }
    ],
    status: 'active',
    contractDate: '2024-02-15',
    firstPaymentDate: '2024-03-15',
    lastPaymentDate: '2026-01-15',
    salesPersonId: 'emp-001',
    salesPersonName: 'สมชาย ใจดี',
    approvedBy: 'emp-manager',
    approvedAt: '2024-02-15T11:00:00Z',
    terms: 'ผ่อนชำระ 24 เดือน ดอกเบี้ย 12% ต่อปี',
    createdAt: '2024-02-15T10:00:00Z',
    createdBy: 'emp-001',
    updatedAt: '2024-03-14T10:00:00Z',
    updatedBy: 'emp-001'
  }
];

// Mock Branch Claims Data
export const mockBranchClaims: BranchClaim[] = [
  {
    id: 'claim-pth-001',
    claimNumber: 'PTH-CLAIM-2024-001',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    customerId: 'cust-001',
    customer: {
      id: 'cust-001',
      name: 'บริษัท ออฟฟิศ ดีไซน์ จำกัด',
      phone: '042-111-222',
      email: 'contact@officedesign.com',
      branchId: 'branch-001'
    },
    productId: 'prod-001',
    product: {
      id: 'prod-001',
      name: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
      sku: 'SF-COM-001',
      category: 'โซฟา'
    },
    saleId: 'sale-pth-001',
    saleNumber: 'PTH-2024-001',
    purchaseDate: '2024-02-15',
    type: 'warranty',
    category: 'product_defect',
    priority: 'medium',
    title: 'ผ้าหุ้มโซฟาฉีกขาด',
    description: 'ผ้าหุ้มโซฟาฉีกขาดบริเวณที่นั่งด้านซ้าย หลังจากใช้งานได้ 3 เดือน',
    symptoms: 'ผ้าหุ้มฉีกขาดยาวประมาณ 10 ซม.',
    customerRequest: 'ขอเปลี่ยนผ้าหุ้มใหม่ตามการรับประกัน',
    status: 'under_review',
    assignedTo: 'emp-001',
    assignedToName: 'สมชาย ใจดี',
    assignedAt: '2024-05-16T09:00:00Z',
    submittedDate: '2024-05-15T14:30:00Z',
    estimatedCost: 5000,
    notes: 'ลูกค้าใช้งานตามปกติ อาจเป็นข้อบกพร่องของวัสดุ',
    createdAt: '2024-05-15T14:30:00Z',
    createdBy: 'cust-001',
    updatedAt: '2024-05-16T09:00:00Z',
    updatedBy: 'emp-001'
  },
  
  {
    id: 'claim-bmn-001',
    claimNumber: 'BMN-CLAIM-2024-001',
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    customerId: 'cust-002',
    customer: {
      id: 'cust-002',
      name: 'คุณสมศรี บ้านสวย',
      phone: '043-222-333',
      email: 'somsri@email.com',
      branchId: 'branch-002'
    },
    productId: 'prod-002',
    product: {
      id: 'prod-002',
      name: 'เก้าอี้ทำงาน รุ่น Executive',
      sku: 'CH-EXE-002',
      category: 'เก้าอี้'
    },
    saleId: 'sale-bmn-001',
    saleNumber: 'BMN-2024-001',
    purchaseDate: '2024-02-14',
    type: 'defect',
    category: 'product_defect',
    priority: 'high',
    title: 'กลไกปรับความสูงเสีย',
    description: 'กลไกปรับความสูงของเก้าอี้ไม่สามารถใช้งานได้ เก้าอี้ไม่สามารถปรับขึ้นลงได้',
    symptoms: 'กดปุ่มปรับความสูงแล้วเก้าอี้ไม่เคลื่อนไหว มีเสียงแปลกๆ',
    customerRequest: 'ขอซ่อมหรือเปลี่ยนตัวใหม่',
    status: 'resolved',
    resolution: 'repair',
    resolutionDetails: 'เปลี่ยนกลไกปรับความสูงใหม่ ทดสอบการทำงานเรียบร้อย',
    assignedTo: 'emp-003',
    assignedToName: 'สมศักดิ์ ขยัน',
    assignedAt: '2024-05-10T10:00:00Z',
    submittedDate: '2024-05-10T09:30:00Z',
    reviewedDate: '2024-05-10T10:00:00Z',
    resolvedDate: '2024-05-12T15:00:00Z',
    actualCost: 800,
    customerRating: 5,
    customerFeedback: 'พอใจมากกับการบริการ ซ่อมเสร็จรวดเร็ว',
    createdAt: '2024-05-10T09:30:00Z',
    createdBy: 'cust-002',
    updatedAt: '2024-05-12T15:00:00Z',
    updatedBy: 'emp-003'
  }
];

// Mock Branch Sales Summary
export const mockBranchSalesSummary: BranchSalesSummary[] = [
  {
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    totalSales: 1850,
    totalRevenue: 2500000,
    averageOrderValue: 1351.35,
    totalTransactions: 1850,
    revenueGrowth: 15.5,
    transactionGrowth: 12.3,
    customerGrowth: 8.7,
    topProducts: [
      {
        productId: 'prod-001',
        productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
        quantity: 45,
        revenue: 1125000
      },
      {
        productId: 'prod-002',
        productName: 'เก้าอี้ทำงาน รุ่น Executive',
        quantity: 38,
        revenue: 456000
      }
    ],
    topCustomers: [
      {
        customerId: 'cust-001',
        customerName: 'บริษัท ออฟฟิศ ดีไซน์ จำกัด',
        totalSpent: 625000,
        transactionCount: 25
      }
    ],
    paymentMethods: {
      cash: 850000,
      card: 1200000,
      transfer: 350000,
      installment: 100000
    },
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  },
  
  {
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    totalSales: 1200,
    totalRevenue: 1800000,
    averageOrderValue: 1500.00,
    totalTransactions: 1200,
    revenueGrowth: 12.3,
    transactionGrowth: 10.1,
    customerGrowth: 6.5,
    topProducts: [
      {
        productId: 'prod-002',
        productName: 'เก้าอี้ทำงาน รุ่น Executive',
        quantity: 30,
        revenue: 360000
      }
    ],
    topCustomers: [
      {
        customerId: 'cust-002',
        customerName: 'คุณสมศรี บ้านสวย',
        totalSpent: 150000,
        transactionCount: 15
      }
    ],
    paymentMethods: {
      cash: 720000,
      card: 900000,
      transfer: 180000,
      installment: 0
    },
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  }
];

// Mock Branch Installment Summary
export const mockBranchInstallmentSummary: BranchInstallmentSummary[] = [
  {
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    totalContracts: 45,
    activeContracts: 38,
    completedContracts: 5,
    defaultedContracts: 2,
    totalFinanced: 2250000,
    totalCollected: 1800000,
    outstandingBalance: 450000,
    overdueAmount: 85000,
    collectionRate: 80.0,
    defaultRate: 4.4,
    averageContractValue: 50000,
    averageMonthlyPayment: 2500,
    aging: {
      current: 365000,
      days30: 50000,
      days60: 25000,
      days90: 10000,
      days90Plus: 0
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  },
  
  {
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    totalContracts: 28,
    activeContracts: 25,
    completedContracts: 3,
    defaultedContracts: 0,
    totalFinanced: 1400000,
    totalCollected: 1120000,
    outstandingBalance: 280000,
    overdueAmount: 15000,
    collectionRate: 80.0,
    defaultRate: 0.0,
    averageContractValue: 50000,
    averageMonthlyPayment: 2500,
    aging: {
      current: 265000,
      days30: 15000,
      days60: 0,
      days90: 0,
      days90Plus: 0
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  }
];

// Mock Branch Claim Summary
export const mockBranchClaimSummary: BranchClaimSummary[] = [
  {
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    totalClaims: 25,
    openClaims: 8,
    resolvedClaims: 15,
    rejectedClaims: 2,
    averageResolutionTime: 3.5,
    resolutionRate: 60.0,
    customerSatisfactionRate: 4.2,
    totalClaimCost: 125000,
    averageClaimCost: 5000,
    refundAmount: 25000,
    claimTypes: {
      warranty: 15,
      defect: 6,
      damage: 2,
      return: 1,
      exchange: 1,
      refund: 0
    },
    priority: {
      low: 8,
      medium: 12,
      high: 4,
      urgent: 1
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  },
  
  {
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    totalClaims: 18,
    openClaims: 5,
    resolvedClaims: 12,
    rejectedClaims: 1,
    averageResolutionTime: 2.8,
    resolutionRate: 66.7,
    customerSatisfactionRate: 4.5,
    totalClaimCost: 72000,
    averageClaimCost: 4000,
    refundAmount: 12000,
    claimTypes: {
      warranty: 10,
      defect: 4,
      damage: 2,
      return: 1,
      exchange: 1,
      refund: 0
    },
    priority: {
      low: 6,
      medium: 8,
      high: 3,
      urgent: 1
    },
    lastUpdated: '2024-02-15T10:30:00Z'
  }
];