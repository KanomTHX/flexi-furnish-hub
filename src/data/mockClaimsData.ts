import { 
  Claim, 
  ClaimStatistics, 
  WarrantyPolicy, 
  ClaimTemplate,
  Customer,
  Product,
  ClaimType,
  ClaimStatus,
  ClaimPriority,
  ClaimCategory,
  WarrantyType
} from '@/types/claims';

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'นายสมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    customerType: 'individual'
  },
  {
    id: 'cust-002',
    name: 'นางสาวมาลี สวยงาม',
    email: 'malee@email.com',
    phone: '082-345-6789',
    address: '456 ถนนพหลโยธิน กรุงเทพฯ 10400',
    customerType: 'individual'
  },
  {
    id: 'cust-003',
    name: 'บริษัท เฟอร์นิเจอร์ดี จำกัด',
    email: 'contact@furniture-dee.com',
    phone: '02-123-4567',
    address: '789 ถนนรัชดาภิเษก กรุงเทพฯ 10310',
    customerType: 'business'
  }
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'โซฟา 3 ที่นั่ง รุ่น คอมฟอร์ต',
    model: 'CF-3S-001',
    brand: 'ComfortHome',
    category: 'โซฟา',
    serialNumber: 'CF001234567',
    warrantyPeriod: 24,
    price: 25000
  },
  {
    id: 'prod-002',
    name: 'เตียงนอน ขนาด 6 ฟุต รุ่น ดรีมมี่',
    model: 'DR-6F-002',
    brand: 'DreamBed',
    category: 'เตียง',
    serialNumber: 'DR002345678',
    warrantyPeriod: 36,
    price: 18000
  },
  {
    id: 'prod-003',
    name: 'ตู้เสื้อผ้า 4 บาน รุ่น แกรนด์',
    model: 'GR-4D-003',
    brand: 'GrandWardrobe',
    category: 'ตู้',
    serialNumber: 'GR003456789',
    warrantyPeriod: 12,
    price: 15000
  },
  {
    id: 'prod-004',
    name: 'โต๊ะทำงาน รุ่น เอ็กเซ็ค',
    model: 'EX-DK-004',
    brand: 'ExecDesk',
    category: 'โต๊ะ',
    serialNumber: 'EX004567890',
    warrantyPeriod: 18,
    price: 8500
  }
];

// Mock Claims
export const mockClaims: Claim[] = [
  {
    id: 'claim-001',
    claimNumber: 'CLM-2024-001',
    type: 'defect',
    status: 'in_progress',
    priority: 'high',
    customerId: 'cust-001',
    customer: mockCustomers[0],
    productId: 'prod-001',
    product: mockProducts[0],
    purchaseDate: '2023-12-15',
    claimDate: '2024-01-15',
    issueDescription: 'โซฟามีปัญหาเบาะยุบและเสียงดังเมื่อนั่ง อาจเป็นปัญหาจากสปริงภายใน',
    category: 'manufacturing_defect',
    warrantyInfo: {
      isUnderWarranty: true,
      warrantyStartDate: '2023-12-15',
      warrantyEndDate: '2025-12-15',
      warrantyType: 'manufacturer',
      coverageDetails: ['ข้อบกพร่องจากการผลิต', 'ชิ้นส่วนที่ชำรุด', 'การซ่อมแซมฟรี'],
      remainingDays: 700
    },
    assignedTo: 'tech-001',
    assignedBy: 'manager-001',
    assignedAt: '2024-01-16T09:00:00Z',
    attachments: [
      {
        id: 'att-001',
        fileName: 'sofa-damage-photo.jpg',
        fileType: 'image/jpeg',
        fileSize: 2048000,
        uploadedBy: 'cust-001',
        uploadedAt: '2024-01-15T14:30:00Z',
        description: 'รูปถ่ายแสดงปัญหาเบาะยุบ',
        url: '/uploads/sofa-damage-photo.jpg'
      }
    ],
    timeline: [
      {
        id: 'tl-001',
        timestamp: '2024-01-15T10:00:00Z',
        action: 'created',
        description: 'สร้างคำขอเคลมใหม่',
        performedBy: 'cust-001'
      },
      {
        id: 'tl-002',
        timestamp: '2024-01-15T14:30:00Z',
        action: 'attachment_uploaded',
        description: 'อัปโหลดรูปถ่ายปัญหา',
        performedBy: 'cust-001'
      },
      {
        id: 'tl-003',
        timestamp: '2024-01-16T09:00:00Z',
        action: 'assigned',
        description: 'มอบหมายให้ช่างเทคนิค',
        performedBy: 'manager-001'
      },
      {
        id: 'tl-004',
        timestamp: '2024-01-16T11:00:00Z',
        action: 'status_changed',
        description: 'เปลี่ยนสถานะเป็น กำลังดำเนินการ',
        performedBy: 'tech-001'
      }
    ],
    estimatedCost: 2500,
    createdBy: 'cust-001',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z'
  },
  {
    id: 'claim-002',
    claimNumber: 'CLM-2024-002',
    type: 'damage',
    status: 'completed',
    priority: 'medium',
    customerId: 'cust-002',
    customer: mockCustomers[1],
    productId: 'prod-002',
    product: mockProducts[1],
    purchaseDate: '2023-11-20',
    claimDate: '2024-01-10',
    issueDescription: 'เตียงมีรอยขีดข่วนที่หัวเตียงจากการขนส่ง',
    category: 'shipping_damage',
    warrantyInfo: {
      isUnderWarranty: true,
      warrantyStartDate: '2023-11-20',
      warrantyEndDate: '2026-11-20',
      warrantyType: 'manufacturer',
      coverageDetails: ['ความเสียหายจากการขนส่ง', 'การซ่อมแซมฟรี'],
      remainingDays: 1050
    },
    assignedTo: 'tech-002',
    assignedBy: 'manager-001',
    assignedAt: '2024-01-11T08:00:00Z',
    resolution: {
      type: 'repair',
      description: 'ซ่อมแซมรอยขีดข่วนและทาสีใหม่',
      actionTaken: 'ขัดผิวและทาสีหัวเตียงใหม่',
      partsReplaced: [],
      laborHours: 3,
      totalCost: 1200,
      resolvedBy: 'tech-002',
      resolvedAt: '2024-01-18T16:00:00Z',
      customerApproval: true,
      followUpRequired: false
    },
    attachments: [
      {
        id: 'att-002',
        fileName: 'bed-scratch-before.jpg',
        fileType: 'image/jpeg',
        fileSize: 1536000,
        uploadedBy: 'cust-002',
        uploadedAt: '2024-01-10T15:00:00Z',
        description: 'รูปก่อนซ่อม',
        url: '/uploads/bed-scratch-before.jpg'
      },
      {
        id: 'att-003',
        fileName: 'bed-scratch-after.jpg',
        fileType: 'image/jpeg',
        fileSize: 1728000,
        uploadedBy: 'tech-002',
        uploadedAt: '2024-01-18T16:30:00Z',
        description: 'รูปหลังซ่อมเสร็จ',
        url: '/uploads/bed-scratch-after.jpg'
      }
    ],
    timeline: [
      {
        id: 'tl-005',
        timestamp: '2024-01-10T12:00:00Z',
        action: 'created',
        description: 'สร้างคำขอเคลมใหม่',
        performedBy: 'cust-002'
      },
      {
        id: 'tl-006',
        timestamp: '2024-01-11T08:00:00Z',
        action: 'assigned',
        description: 'มอบหมายให้ช่างเทคนิค',
        performedBy: 'manager-001'
      },
      {
        id: 'tl-007',
        timestamp: '2024-01-18T16:00:00Z',
        action: 'completed',
        description: 'ซ่อมแซมเสร็จสิ้น',
        performedBy: 'tech-002'
      }
    ],
    estimatedCost: 1500,
    actualCost: 1200,
    completedAt: '2024-01-18T16:00:00Z',
    customerSatisfaction: {
      rating: 5,
      feedback: 'พอใจมากค่ะ ช่างทำงานดีและรวดเร็ว',
      ratedAt: '2024-01-19T10:00:00Z',
      wouldRecommend: true
    },
    createdBy: 'cust-002',
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-18T16:30:00Z'
  },
  {
    id: 'claim-003',
    claimNumber: 'CLM-2024-003',
    type: 'warranty',
    status: 'under_review',
    priority: 'low',
    customerId: 'cust-003',
    customer: mockCustomers[2],
    productId: 'prod-003',
    product: mockProducts[2],
    purchaseDate: '2023-06-10',
    claimDate: '2024-01-20',
    issueDescription: 'บานตู้ปิดไม่สนิท อาจเป็นปัญหาจากบานพาน',
    category: 'normal_wear',
    warrantyInfo: {
      isUnderWarranty: false,
      warrantyStartDate: '2023-06-10',
      warrantyEndDate: '2024-06-10',
      warrantyType: 'manufacturer',
      coverageDetails: ['ข้อบกพร่องจากการผลิต'],
      remainingDays: -225
    },
    attachments: [],
    timeline: [
      {
        id: 'tl-008',
        timestamp: '2024-01-20T14:00:00Z',
        action: 'created',
        description: 'สร้างคำขอเคลมใหม่',
        performedBy: 'cust-003'
      }
    ],
    createdBy: 'cust-003',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    id: 'claim-004',
    claimNumber: 'CLM-2024-004',
    type: 'installation',
    status: 'approved',
    priority: 'medium',
    customerId: 'cust-001',
    customer: mockCustomers[0],
    productId: 'prod-004',
    product: mockProducts[3],
    purchaseDate: '2024-01-05',
    claimDate: '2024-01-22',
    issueDescription: 'โต๊ะไม่สามารถประกอบได้ เนื่องจากขาดน็อตและสกรู',
    category: 'product_defect',
    warrantyInfo: {
      isUnderWarranty: true,
      warrantyStartDate: '2024-01-05',
      warrantyEndDate: '2025-07-05',
      warrantyType: 'manufacturer',
      coverageDetails: ['ชิ้นส่วนที่ขาดหาย', 'การติดตั้งฟรี'],
      remainingDays: 530
    },
    assignedTo: 'tech-003',
    assignedBy: 'manager-001',
    assignedAt: '2024-01-23T10:00:00Z',
    attachments: [
      {
        id: 'att-004',
        fileName: 'missing-parts-list.pdf',
        fileType: 'application/pdf',
        fileSize: 512000,
        uploadedBy: 'cust-001',
        uploadedAt: '2024-01-22T16:00:00Z',
        description: 'รายการชิ้นส่วนที่ขาดหาย',
        url: '/uploads/missing-parts-list.pdf'
      }
    ],
    timeline: [
      {
        id: 'tl-009',
        timestamp: '2024-01-22T13:00:00Z',
        action: 'created',
        description: 'สร้างคำขอเคลมใหม่',
        performedBy: 'cust-001'
      },
      {
        id: 'tl-010',
        timestamp: '2024-01-23T09:00:00Z',
        action: 'status_changed',
        description: 'อนุมัติคำขอเคลม',
        performedBy: 'manager-001'
      },
      {
        id: 'tl-011',
        timestamp: '2024-01-23T10:00:00Z',
        action: 'assigned',
        description: 'มอบหมายให้ช่างติดตั้ง',
        performedBy: 'manager-001'
      }
    ],
    estimatedCost: 500,
    createdBy: 'cust-001',
    createdAt: '2024-01-22T13:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z'
  }
];

// Mock Warranty Policies
export const mockWarrantyPolicies: WarrantyPolicy[] = [
  {
    id: 'policy-001',
    name: 'การรับประกันมาตรฐาน',
    description: 'การรับประกันสำหรับสินค้าทั่วไป',
    duration: 12,
    coverageType: 'manufacturer',
    coverageDetails: [
      'ข้อบกพร่องจากการผลิต',
      'ชิ้นส่วนที่ชำรุดจากการใช้งานปกติ',
      'การซ่อมแซมฟรี'
    ],
    exclusions: [
      'ความเสียหายจากการใช้งานผิดวิธี',
      'การสึกหรอตามธรรมชาติ',
      'ความเสียหายจากอุบัติเหตุ'
    ],
    terms: [
      'ต้องมีใบเสร็จรับเงิน',
      'แจ้งปัญหาภายใน 7 วันหลังพบ',
      'ไม่รวมค่าขนส่ง'
    ],
    isActive: true,
    applicableCategories: ['โซฟา', 'เก้าอี้', 'โต๊ะ'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'policy-002',
    name: 'การรับประกันพิเศษ',
    description: 'การรับประกันสำหรับสินค้าพรีเมียม',
    duration: 24,
    coverageType: 'extended',
    coverageDetails: [
      'ข้อบกพร่องจากการผลิต',
      'ชิ้นส่วนที่ชำรุด',
      'การซ่อมแซมฟรี',
      'บริการถึงที่'
    ],
    exclusions: [
      'ความเสียหายจากการใช้งานผิดวิธี',
      'ความเสียหายจากอุบัติเหตุ'
    ],
    terms: [
      'ต้องมีใบเสร็จรับเงิน',
      'แจ้งปัญหาภายใน 14 วันหลังพบ',
      'รวมค่าขนส่งในเขตกรุงเทพฯ'
    ],
    isActive: true,
    applicableCategories: ['เตียง', 'ตู้', 'ชุดห้องนอน'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Claim Templates
export const mockClaimTemplates: ClaimTemplate[] = [
  {
    id: 'template-001',
    name: 'ข้อบกพร่องจากการผลิต',
    type: 'defect',
    category: 'manufacturing_defect',
    description: 'สินค้ามีข้อบกพร่องจากกระบวนการผลิต',
    standardResolution: 'ซ่อมแซมหรือเปลี่ยนชิ้นส่วนที่บกพร่อง',
    estimatedTime: 4,
    estimatedCost: 2000,
    requiredDocuments: ['ใบเสร็จ', 'รูปถ่ายปัญหา', 'หมายเลขซีเรียล'],
    isActive: true
  },
  {
    id: 'template-002',
    name: 'ความเสียหายจากการขนส่ง',
    type: 'damage',
    category: 'shipping_damage',
    description: 'สินค้าเสียหายระหว่างการขนส่ง',
    standardResolution: 'ซ่อมแซมหรือเปลี่ยนสินค้าใหม่',
    estimatedTime: 2,
    estimatedCost: 1500,
    requiredDocuments: ['ใบเสร็จ', 'รูปถ่ายความเสียหาย', 'รายงานการขนส่ง'],
    isActive: true
  },
  {
    id: 'template-003',
    name: 'ชิ้นส่วนขาดหาย',
    type: 'installation',
    category: 'product_defect',
    description: 'สินค้าขาดชิ้นส่วนสำหรับการประกอบ',
    standardResolution: 'จัดส่งชิ้นส่วนที่ขาดหายและติดตั้งให้',
    estimatedTime: 1,
    estimatedCost: 500,
    requiredDocuments: ['ใบเสร็จ', 'รายการชิ้นส่วนที่ขาดหาย'],
    isActive: true
  }
];

// Calculate claims statistics
export function calculateClaimsStatistics(): ClaimStatistics {
  const totalClaims = mockClaims.length;
  const pendingClaims = mockClaims.filter(c => 
    ['submitted', 'under_review', 'approved', 'in_progress', 'waiting_parts'].includes(c.status)
  ).length;
  const completedClaims = mockClaims.filter(c => c.status === 'completed').length;

  // Calculate average resolution time
  const completedClaimsWithTime = mockClaims.filter(c => c.completedAt);
  const totalResolutionTime = completedClaimsWithTime.reduce((sum, claim) => {
    const created = new Date(claim.createdAt);
    const completed = new Date(claim.completedAt!);
    const diffTime = Math.abs(completed.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  const averageResolutionTime = completedClaimsWithTime.length > 0 
    ? totalResolutionTime / completedClaimsWithTime.length 
    : 0;

  // Calculate customer satisfaction average
  const ratingsCount = mockClaims.filter(c => c.customerSatisfaction).length;
  const totalRating = mockClaims.reduce((sum, claim) => 
    sum + (claim.customerSatisfaction?.rating || 0), 0
  );
  const customerSatisfactionAverage = ratingsCount > 0 ? totalRating / ratingsCount : 0;

  // Calculate total claims cost
  const totalClaimsCost = mockClaims.reduce((sum, claim) => 
    sum + (claim.actualCost || claim.estimatedCost || 0), 0
  );

  // Group by type
  const claimsByType = mockClaims.reduce((acc, claim) => {
    acc[claim.type] = (acc[claim.type] || 0) + 1;
    return acc;
  }, {} as Record<ClaimType, number>);

  // Group by status
  const claimsByStatus = mockClaims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<ClaimStatus, number>);

  // Group by priority
  const claimsByPriority = mockClaims.reduce((acc, claim) => {
    acc[claim.priority] = (acc[claim.priority] || 0) + 1;
    return acc;
  }, {} as Record<ClaimPriority, number>);

  // Monthly trends (mock data)
  const monthlyTrends = [
    {
      month: '2024-01',
      totalClaims: 4,
      completedClaims: 1,
      averageCost: 1425,
      satisfactionRating: 5.0
    }
  ];

  return {
    totalClaims,
    pendingClaims,
    completedClaims,
    averageResolutionTime,
    customerSatisfactionAverage,
    totalClaimsCost,
    claimsByType,
    claimsByStatus,
    claimsByPriority,
    monthlyTrends
  };
}