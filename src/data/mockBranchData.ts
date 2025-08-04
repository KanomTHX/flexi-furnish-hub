import { 
  Branch, 
  BranchDataContext, 
  BranchStock, 
  BranchSales, 
  BranchEmployee, 
  BranchCustomer,
  BranchTransfer,
  BranchAnalytics
} from '../types/branch';

// Mock Branches - 4 สาขาตามที่ระบุ
export const mockBranches: Branch[] = [
  {
    id: 'branch-001',
    code: 'PTH',
    name: 'สาขาไผ่ท่าโพ',
    type: 'main',
    status: 'active',
    address: {
      street: '123 ถนนไผ่ท่าโพ',
      district: 'เมืองไผ่ท่าโพ',
      province: 'ไผ่ท่าโพ',
      postalCode: '12345',
      country: 'ประเทศไทย',
      coordinates: {
        latitude: 14.1234,
        longitude: 101.2345
      }
    },
    contact: {
      phone: '042-123-456',
      email: 'phaithapo@company.com',
      manager: 'นายสมชาย ใจดี',
      managerPhone: '081-234-5678',
      fax: '042-123-457'
    },
    businessInfo: {
      taxId: '1234567890123',
      registrationNumber: 'REG-PTH-001',
      establishedDate: '2020-01-15',
      businessHours: {
        open: '08:00',
        close: '18:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    },
    settings: {
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      language: 'th',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '#,##0.00',
      taxRate: 7,
      allowNegativeStock: false,
      autoApproveTransfers: false,
      requireManagerApproval: true
    },
    permissions: {
      canAccessOtherBranches: true,
      canTransferToBranches: ['branch-002', 'branch-003', 'branch-004'],
      canViewReports: ['all'],
      dataIsolationLevel: 'partial'
    },
    stats: {
      totalEmployees: 25,
      totalCustomers: 1250,
      totalProducts: 450,
      totalSales: 2500000,
      totalOrders: 1850,
      averageOrderValue: 1351.35,
      monthlyRevenue: 2500000,
      yearlyRevenue: 28000000
    },
    createdAt: '2020-01-15T09:00:00Z',
    createdBy: 'system',
    updatedAt: '2024-02-15T10:30:00Z',
    updatedBy: 'admin-001'
  },
  {
    id: 'branch-002',
    code: 'BMN',
    name: 'สาขาบางมูลนาก',
    type: 'branch',
    status: 'active',
    address: {
      street: '456 ถนนบางมูลนาก',
      district: 'เมืองบางมูลนาก',
      province: 'บางมูลนาก',
      postalCode: '23456',
      country: 'ประเทศไทย',
      coordinates: {
        latitude: 13.5678,
        longitude: 100.9876
      }
    },
    contact: {
      phone: '043-234-567',
      email: 'bangmoolnak@company.com',
      manager: 'นางสมหญิง รักงาน',
      managerPhone: '082-345-6789',
      fax: '043-234-568'
    },
    businessInfo: {
      taxId: '2345678901234',
      registrationNumber: 'REG-BMN-002',
      establishedDate: '2020-06-01',
      businessHours: {
        open: '08:30',
        close: '17:30',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    },
    settings: {
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      language: 'th',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '#,##0.00',
      taxRate: 7,
      allowNegativeStock: false,
      autoApproveTransfers: false,
      requireManagerApproval: true
    },
    permissions: {
      canAccessOtherBranches: false,
      canTransferToBranches: ['branch-001'],
      canViewReports: ['own_branch'],
      dataIsolationLevel: 'strict'
    },
    stats: {
      totalEmployees: 18,
      totalCustomers: 850,
      totalProducts: 320,
      totalSales: 1800000,
      totalOrders: 1200,
      averageOrderValue: 1500.00,
      monthlyRevenue: 1800000,
      yearlyRevenue: 20000000
    },
    createdAt: '2020-06-01T09:00:00Z',
    createdBy: 'admin-001',
    updatedAt: '2024-02-15T10:30:00Z',
    updatedBy: 'admin-001'
  },
  {
    id: 'branch-003',
    code: 'TKL',
    name: 'สาขาทับคล้อ',
    type: 'branch',
    status: 'active',
    address: {
      street: '789 ถนนทับคล้อ',
      district: 'เมืองทับคล้อ',
      province: 'ทับคล้อ',
      postalCode: '34567',
      country: 'ประเทศไทย',
      coordinates: {
        latitude: 15.9876,
        longitude: 102.1234
      }
    },
    contact: {
      phone: '044-345-678',
      email: 'thapkhlo@company.com',
      manager: 'นายสมศักดิ์ ขยัน',
      managerPhone: '083-456-7890',
      fax: '044-345-679'
    },
    businessInfo: {
      taxId: '3456789012345',
      registrationNumber: 'REG-TKL-003',
      establishedDate: '2021-03-15',
      businessHours: {
        open: '08:00',
        close: '18:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    },
    settings: {
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      language: 'th',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '#,##0.00',
      taxRate: 7,
      allowNegativeStock: false,
      autoApproveTransfers: false,
      requireManagerApproval: true
    },
    permissions: {
      canAccessOtherBranches: false,
      canTransferToBranches: ['branch-001'],
      canViewReports: ['own_branch'],
      dataIsolationLevel: 'strict'
    },
    stats: {
      totalEmployees: 15,
      totalCustomers: 650,
      totalProducts: 280,
      totalSales: 1400000,
      totalOrders: 950,
      averageOrderValue: 1473.68,
      monthlyRevenue: 1400000,
      yearlyRevenue: 16000000
    },
    createdAt: '2021-03-15T09:00:00Z',
    createdBy: 'admin-001',
    updatedAt: '2024-02-15T10:30:00Z',
    updatedBy: 'admin-001'
  },
  {
    id: 'branch-004',
    code: 'UTD',
    name: 'สาขาอุตรดิตถ์',
    type: 'branch',
    status: 'active',
    address: {
      street: '321 ถนนอุตรดิตถ์',
      district: 'เมืองอุตรดิตถ์',
      province: 'อุตรดิตถ์',
      postalCode: '45678',
      country: 'ประเทศไทย',
      coordinates: {
        latitude: 17.6234,
        longitude: 100.0987
      }
    },
    contact: {
      phone: '055-456-789',
      email: 'uttaradit@company.com',
      manager: 'นางสมใส ยิ้มแย้ม',
      managerPhone: '084-567-8901',
      fax: '055-456-790'
    },
    businessInfo: {
      taxId: '4567890123456',
      registrationNumber: 'REG-UTD-004',
      establishedDate: '2021-09-01',
      businessHours: {
        open: '08:30',
        close: '17:30',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    },
    settings: {
      timezone: 'Asia/Bangkok',
      currency: 'THB',
      language: 'th',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '#,##0.00',
      taxRate: 7,
      allowNegativeStock: false,
      autoApproveTransfers: false,
      requireManagerApproval: true
    },
    permissions: {
      canAccessOtherBranches: false,
      canTransferToBranches: ['branch-001'],
      canViewReports: ['own_branch'],
      dataIsolationLevel: 'strict'
    },
    stats: {
      totalEmployees: 12,
      totalCustomers: 480,
      totalProducts: 220,
      totalSales: 1100000,
      totalOrders: 720,
      averageOrderValue: 1527.78,
      monthlyRevenue: 1100000,
      yearlyRevenue: 12500000
    },
    createdAt: '2021-09-01T09:00:00Z',
    createdBy: 'admin-001',
    updatedAt: '2024-02-15T10:30:00Z',
    updatedBy: 'admin-001'
  }
];

// Mock Branch Data Context
export const mockBranchDataContext: BranchDataContext = {
  currentBranch: mockBranches[0], // Default to main branch
  accessibleBranches: mockBranches,
  userPermissions: {
    canSwitchBranch: true,
    canViewAllBranches: true,
    canManageBranches: true,
    allowedOperations: ['view', 'create', 'update', 'delete', 'transfer', 'report']
  }
};

// Mock Branch Employees
export const mockBranchEmployees: BranchEmployee[] = [
  // ไผ่ท่าโพ
  {
    id: 'emp-001',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    employeeCode: 'PTH-001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    fullName: 'สมชาย ใจดี',
    position: 'ผู้จัดการสาขา',
    department: 'บริหาร',
    email: 'somchai@company.com',
    phone: '081-234-5678',
    hireDate: '2020-01-15',
    salary: 45000,
    status: 'active',
    permissions: {
      modules: ['all'],
      operations: ['all'],
      canAccessOtherBranches: true,
      dataAccessLevel: 'all_branches',
      accessibleBranches: ['branch-001', 'branch-002', 'branch-003', 'branch-004']
    },
    createdAt: '2020-01-15T09:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  {
    id: 'emp-002',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    employeeCode: 'PTH-002',
    firstName: 'สมหญิง',
    lastName: 'รักงาน',
    fullName: 'สมหญิง รักงาน',
    position: 'พนักงานขาย',
    department: 'ขาย',
    email: 'somying@company.com',
    phone: '082-345-6789',
    hireDate: '2020-02-01',
    salary: 25000,
    status: 'active',
    permissions: {
      modules: ['sales', 'customers', 'stock'],
      operations: ['view', 'create', 'update'],
      canAccessOtherBranches: false,
      dataAccessLevel: 'own_branch'
    },
    createdAt: '2020-02-01T09:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // บางมูลนาก
  {
    id: 'emp-003',
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    employeeCode: 'BMN-001',
    firstName: 'สมศักดิ์',
    lastName: 'ขยัน',
    fullName: 'สมศักดิ์ ขยัน',
    position: 'ผู้จัดการสาขา',
    department: 'บริหาร',
    email: 'somsak@company.com',
    phone: '083-456-7890',
    hireDate: '2020-06-01',
    salary: 40000,
    status: 'active',
    permissions: {
      modules: ['sales', 'customers', 'stock', 'employees', 'reports'],
      operations: ['view', 'create', 'update', 'delete'],
      canAccessOtherBranches: false,
      dataAccessLevel: 'own_branch'
    },
    createdAt: '2020-06-01T09:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // ทับคล้อ
  {
    id: 'emp-004',
    branchId: 'branch-003',
    branchCode: 'TKL',
    branchName: 'สาขาทับคล้อ',
    employeeCode: 'TKL-001',
    firstName: 'สมปอง',
    lastName: 'ตั้งใจ',
    fullName: 'สมปอง ตั้งใจ',
    position: 'ผู้จัดการสาขา',
    department: 'บริหาร',
    email: 'sompong@company.com',
    phone: '084-567-8901',
    hireDate: '2021-03-15',
    salary: 38000,
    status: 'active',
    permissions: {
      modules: ['sales', 'customers', 'stock', 'employees', 'reports'],
      operations: ['view', 'create', 'update', 'delete'],
      canAccessOtherBranches: false,
      dataAccessLevel: 'own_branch'
    },
    createdAt: '2021-03-15T09:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // อุตรดิตถ์
  {
    id: 'emp-005',
    branchId: 'branch-004',
    branchCode: 'UTD',
    branchName: 'สาขาอุตรดิตถ์',
    employeeCode: 'UTD-001',
    firstName: 'สมใส',
    lastName: 'ยิ้มแย้ม',
    fullName: 'สมใส ยิ้มแย้ม',
    position: 'ผู้จัดการสาขา',
    department: 'บริหาร',
    email: 'somsai@company.com',
    phone: '085-678-9012',
    hireDate: '2021-09-01',
    salary: 36000,
    status: 'active',
    permissions: {
      modules: ['sales', 'customers', 'stock', 'employees', 'reports'],
      operations: ['view', 'create', 'update', 'delete'],
      canAccessOtherBranches: false,
      dataAccessLevel: 'own_branch'
    },
    createdAt: '2021-09-01T09:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  }
];

// Mock Branch Customers
export const mockBranchCustomers: BranchCustomer[] = [
  // ไผ่ท่าโพ
  {
    id: 'cust-001',
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    customerCode: 'PTH-C001',
    type: 'business',
    name: 'บริษัท ออฟฟิศ ดีไซน์ จำกัด',
    phone: '042-111-222',
    email: 'contact@officedesign.com',
    address: {
      street: '100 ถนนธุรกิจ',
      district: 'เมืองไผ่ท่าโพ',
      province: 'ไผ่ท่าโพ',
      postalCode: '12345'
    },
    taxId: '0123456789012',
    creditLimit: 500000,
    currentBalance: 0,
    totalPurchases: 2500000,
    lastPurchaseDate: '2024-02-14',
    status: 'active',
    notes: 'ลูกค้าใหญ่ ซื้อเฟอร์นิเจอร์สำนักงาน',
    createdAt: '2020-02-01T10:00:00Z',
    createdBy: 'emp-001',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // บางมูลนาก
  {
    id: 'cust-002',
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    customerCode: 'BMN-C001',
    type: 'individual',
    name: 'คุณสมศรี บ้านสวย',
    phone: '043-222-333',
    email: 'somsri@email.com',
    address: {
      street: '200 หมู่บ้านสวยงาม',
      district: 'เมืองบางมูลนาก',
      province: 'บางมูลนาก',
      postalCode: '23456'
    },
    creditLimit: 100000,
    currentBalance: 0,
    totalPurchases: 150000,
    lastPurchaseDate: '2024-02-10',
    status: 'active',
    notes: 'ลูกค้าประจำ ซื้อเฟอร์นิเจอร์บ้าน',
    createdAt: '2020-07-15T10:00:00Z',
    createdBy: 'emp-003',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // ทับคล้อ
  {
    id: 'cust-003',
    branchId: 'branch-003',
    branchCode: 'TKL',
    branchName: 'สาขาทับคล้อ',
    customerCode: 'TKL-C001',
    type: 'business',
    name: 'ร้านกาแฟ คาเฟ่ดี',
    phone: '044-333-444',
    email: 'info@cafegood.com',
    address: {
      street: '300 ถนนกาแฟ',
      district: 'เมืองทับคล้อ',
      province: 'ทับคล้อ',
      postalCode: '34567'
    },
    taxId: '1234567890123',
    creditLimit: 200000,
    currentBalance: 0,
    totalPurchases: 180000,
    lastPurchaseDate: '2024-02-09',
    status: 'active',
    notes: 'ร้านกาแฟ ซื้อโต๊ะเก้าอี้',
    createdAt: '2021-04-01T10:00:00Z',
    createdBy: 'emp-004',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  // อุตรดิตถ์
  {
    id: 'cust-004',
    branchId: 'branch-004',
    branchCode: 'UTD',
    branchName: 'สาขาอุตรดิตถ์',
    customerCode: 'UTD-C001',
    type: 'individual',
    name: 'คุณสมพร โรงแรม',
    phone: '055-444-555',
    email: 'somporn@email.com',
    address: {
      street: '400 ถนนโรงแรม',
      district: 'เมืองอุตรดิตถ์',
      province: 'อุตรดิตถ์',
      postalCode: '45678'
    },
    creditLimit: 150000,
    currentBalance: 0,
    totalPurchases: 120000,
    lastPurchaseDate: '2024-02-08',
    status: 'active',
    notes: 'เจ้าของโรงแรมเล็ก ซื้อเฟอร์นิเจอร์ห้องพัก',
    createdAt: '2021-10-15T10:00:00Z',
    createdBy: 'emp-005',
    updatedAt: '2024-02-15T10:30:00Z'
  }
];

// Mock Branch Analytics
export const mockBranchAnalytics: BranchAnalytics[] = [
  {
    branchId: 'branch-001',
    branchCode: 'PTH',
    branchName: 'สาขาไผ่ท่าโพ',
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    sales: {
      totalSales: 1850,
      totalRevenue: 2500000,
      averageOrderValue: 1351.35,
      totalOrders: 1850,
      growth: 15.5,
      topProducts: [
        {
          productId: 'prod-001',
          productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
          quantity: 45,
          revenue: 1125000
        }
      ],
      topCustomers: [
        {
          customerId: 'cust-001',
          customerName: 'บริษัท ออฟฟิศ ดีไซน์ จำกัด',
          totalOrders: 25,
          totalRevenue: 625000
        }
      ]
    },
    stock: {
      totalProducts: 450,
      totalValue: 6750000,
      lowStockItems: 15,
      outOfStockItems: 5,
      overstockItems: 8,
      turnoverRate: 4.2,
      fastMovingProducts: [
        {
          productId: 'prod-001',
          productName: 'โซฟา 3 ที่นั่ง รุ่น Comfort',
          movementCount: 25,
          turnoverRate: 6.5
        }
      ],
      slowMovingProducts: [
        {
          productId: 'prod-004',
          productName: 'ตู้เสื้อผ้า 4 บาน รุ่น Classic',
          daysWithoutMovement: 30,
          currentStock: 120
        }
      ]
    },
    employees: {
      totalEmployees: 25,
      activeEmployees: 25,
      averageSalesPerEmployee: 100000,
      topPerformers: [
        {
          employeeId: 'emp-002',
          employeeName: 'สมหญิง รักงาน',
          totalSales: 150,
          totalRevenue: 375000
        }
      ]
    },
    customers: {
      totalCustomers: 1250,
      activeCustomers: 850,
      newCustomers: 125,
      customerRetentionRate: 85.5,
      averageCustomerValue: 2000
    },
    financial: {
      totalRevenue: 2500000,
      totalCost: 1750000,
      grossProfit: 750000,
      grossProfitMargin: 30,
      operatingExpenses: 500000,
      netProfit: 250000,
      netProfitMargin: 10
    },
    generatedAt: '2024-02-15T10:30:00Z'
  },
  {
    branchId: 'branch-002',
    branchCode: 'BMN',
    branchName: 'สาขาบางมูลนาก',
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    sales: {
      totalSales: 1200,
      totalRevenue: 1800000,
      averageOrderValue: 1500.00,
      totalOrders: 1200,
      growth: 12.3,
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
          totalOrders: 15,
          totalRevenue: 150000
        }
      ]
    },
    stock: {
      totalProducts: 320,
      totalValue: 4800000,
      lowStockItems: 12,
      outOfStockItems: 3,
      overstockItems: 5,
      turnoverRate: 3.8,
      fastMovingProducts: [
        {
          productId: 'prod-002',
          productName: 'เก้าอี้ทำงาน รุ่น Executive',
          movementCount: 20,
          turnoverRate: 5.2
        }
      ],
      slowMovingProducts: [
        {
          productId: 'prod-005',
          productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
          daysWithoutMovement: 45,
          currentStock: 8
        }
      ]
    },
    employees: {
      totalEmployees: 18,
      activeEmployees: 18,
      averageSalesPerEmployee: 100000,
      topPerformers: [
        {
          employeeId: 'emp-003',
          employeeName: 'สมศักดิ์ ขยัน',
          totalSales: 120,
          totalRevenue: 180000
        }
      ]
    },
    customers: {
      totalCustomers: 850,
      activeCustomers: 600,
      newCustomers: 85,
      customerRetentionRate: 82.3,
      averageCustomerValue: 2118
    },
    financial: {
      totalRevenue: 1800000,
      totalCost: 1260000,
      grossProfit: 540000,
      grossProfitMargin: 30,
      operatingExpenses: 360000,
      netProfit: 180000,
      netProfitMargin: 10
    },
    generatedAt: '2024-02-15T10:30:00Z'
  },
  {
    branchId: 'branch-003',
    branchCode: 'TKL',
    branchName: 'สาขาทับคล้อ',
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    sales: {
      totalSales: 950,
      totalRevenue: 1400000,
      averageOrderValue: 1473.68,
      totalOrders: 950,
      growth: 8.7,
      topProducts: [
        {
          productId: 'prod-007',
          productName: 'โต๊ะกาแฟ รุ่น Vintage',
          quantity: 25,
          revenue: 275000
        }
      ],
      topCustomers: [
        {
          customerId: 'cust-003',
          customerName: 'ร้านกาแฟ คาเฟ่ดี',
          totalOrders: 12,
          totalRevenue: 180000
        }
      ]
    },
    stock: {
      totalProducts: 280,
      totalValue: 3920000,
      lowStockItems: 10,
      outOfStockItems: 2,
      overstockItems: 3,
      turnoverRate: 3.5,
      fastMovingProducts: [
        {
          productId: 'prod-007',
          productName: 'โต๊ะกาแฟ รุ่น Vintage',
          movementCount: 18,
          turnoverRate: 4.8
        }
      ],
      slowMovingProducts: [
        {
          productId: 'prod-006',
          productName: 'ชั้นวางหนังสือ รุ่น Minimal',
          daysWithoutMovement: 35,
          currentStock: 15
        }
      ]
    },
    employees: {
      totalEmployees: 15,
      activeEmployees: 15,
      averageSalesPerEmployee: 93333,
      topPerformers: [
        {
          employeeId: 'emp-004',
          employeeName: 'สมปอง ตั้งใจ',
          totalSales: 95,
          totalRevenue: 140000
        }
      ]
    },
    customers: {
      totalCustomers: 650,
      activeCustomers: 450,
      newCustomers: 65,
      customerRetentionRate: 78.5,
      averageCustomerValue: 2154
    },
    financial: {
      totalRevenue: 1400000,
      totalCost: 980000,
      grossProfit: 420000,
      grossProfitMargin: 30,
      operatingExpenses: 280000,
      netProfit: 140000,
      netProfitMargin: 10
    },
    generatedAt: '2024-02-15T10:30:00Z'
  },
  {
    branchId: 'branch-004',
    branchCode: 'UTD',
    branchName: 'สาขาอุตรดิตถ์',
    period: {
      from: '2024-01-01',
      to: '2024-02-15'
    },
    sales: {
      totalSales: 720,
      totalRevenue: 1100000,
      averageOrderValue: 1527.78,
      totalOrders: 720,
      growth: 6.2,
      topProducts: [
        {
          productId: 'prod-005',
          productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
          quantity: 15,
          revenue: 600000
        }
      ],
      topCustomers: [
        {
          customerId: 'cust-004',
          customerName: 'คุณสมพร โรงแรม',
          totalOrders: 10,
          totalRevenue: 120000
        }
      ]
    },
    stock: {
      totalProducts: 220,
      totalValue: 3080000,
      lowStockItems: 8,
      outOfStockItems: 1,
      overstockItems: 2,
      turnoverRate: 3.2,
      fastMovingProducts: [
        {
          productId: 'prod-005',
          productName: 'เตียงนอน 6 ฟุต รุ่น Luxury',
          movementCount: 12,
          turnoverRate: 4.2
        }
      ],
      slowMovingProducts: [
        {
          productId: 'prod-003',
          productName: 'โต๊ะทำงาน รุ่น Modern',
          daysWithoutMovement: 40,
          currentStock: 5
        }
      ]
    },
    employees: {
      totalEmployees: 12,
      activeEmployees: 12,
      averageSalesPerEmployee: 91667,
      topPerformers: [
        {
          employeeId: 'emp-005',
          employeeName: 'สมใส ยิ้มแย้ม',
          totalSales: 72,
          totalRevenue: 110000
        }
      ]
    },
    customers: {
      totalCustomers: 480,
      activeCustomers: 320,
      newCustomers: 48,
      customerRetentionRate: 75.8,
      averageCustomerValue: 2292
    },
    financial: {
      totalRevenue: 1100000,
      totalCost: 770000,
      grossProfit: 330000,
      grossProfitMargin: 30,
      operatingExpenses: 220000,
      netProfit: 110000,
      netProfitMargin: 10
    },
    generatedAt: '2024-02-15T10:30:00Z'
  }
];